import { nanoid } from 'nanoid';
import db from '../database/database.js';
import { generateCanonicalSvg, writeCanonicalAssets } from './canonical-topview-renderer.js';
import { enhanceTopView } from './provider-router.js';
import { validateEnhancedTopView, summarizeValidation } from './geometry-guard.js';

function recordTopViewAsset({ projectId, kind, preset, mode, svgUrl, pngUrl, enhancedImageUrl, prompt, styleReferenceUrl, fallbackReason, provider, model, tags }) {
  const id = 'tva_' + nanoid(10);
  db.prepare(`INSERT INTO topview_render_assets (id, project_id, kind, preset, mode, svg_url, png_url, enhanced_image_url, prompt, style_reference_url, validation, fallback_reason, provider, model, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    String(projectId || 'unknown'),
    kind || 'canonical_topview',
    preset || 'technical_clean',
    mode || null,
    svgUrl,
    pngUrl,
    enhancedImageUrl,
    prompt,
    styleReferenceUrl,
    JSON.stringify({
      status: 'pending',
      wallDrift: 0,
      openingDrift: 0,
      topologyMismatch: false,
      geometryMismatch: false,
      accepted: false,
      issues: []
    }),
    fallbackReason || null,
    provider || null,
    model || null,
    JSON.stringify(tags || [])
  );
  return id;
}

function updateTopViewAsset(id, updates = {}) {
  if (!id) return;
  const map = {
    svgUrl: 'svg_url',
    pngUrl: 'png_url',
    enhancedImageUrl: 'enhanced_image_url',
    prompt: 'prompt',
    styleReferenceUrl: 'style_reference_url',
    fallbackReason: 'fallback_reason',
    provider: 'provider',
    model: 'model'
  };
  const sets = [];
  const values = [];
  for (const key of Object.keys(updates)) {
    const dbKey = map[key] || key;
    sets.push(`${dbKey} = ?`);
    values.push(updates[key]);
  }
  if (!sets.length) return;
  values.push(id);
  db.prepare(`UPDATE topview_render_assets SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

function updateTopViewValidation(id, result) {
  if (!id) return;
  db.prepare(`UPDATE topview_render_assets SET validation = ?, fallback_reason = ? WHERE id = ?`)
    .run(JSON.stringify(result), result.fallbackReason || null, id);
}

function recordJob({ projectId, assetId, kind, status, provider, model }) {
  try {
    const jobId = 'job_topview_' + nanoid(10);
    db.prepare(`INSERT INTO jobs (id, project_id, job_type, status, progress, source_entity_type, source_entity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      jobId,
      String(projectId || 'unknown'),
      kind,
      status,
      status === 'succeeded' ? 100 : 0,
      'topview_render_asset',
      assetId
    );
  } catch (err) {
    console.warn('[topview-worker] job record failed:', err.message);
  }
}

export async function renderCanonicalTopView({ projectId, manifest, preset = 'technical_clean', mode = null, floorPlanVersionId = null, spatialModelVersionId = null, title }) {
  const safeProjectId = String(projectId || 'unknown');
  const { svg, bounds } = generateCanonicalSvg({
    manifest: manifest || {},
    preset,
    title: title || `Canonical top-view • ${safeProjectId}`,
    includeDimensions: true,
    includeFurniturePlaceholders: false
  });

  const assetRecordId = recordTopViewAsset({
    projectId: safeProjectId,
    kind: 'canonical_topview',
    preset,
    mode: mode || null,
    provider: 'deterministic',
    model: 'canonical-topview-renderer',
    tags: ['canonical', 'topview', preset, 'deterministic']
  });

  const written = await writeCanonicalAssets({
    projectId: safeProjectId,
    manifest: manifest || {},
    preset,
    title: title || `Canonical top-view • ${safeProjectId}`,
    includeDimensions: true,
    includeFurniturePlaceholders: false
  });

  updateTopViewAsset(assetRecordId, {
    svgUrl: written.svgUrl,
    pngUrl: written.pngUrl || ''
  });

  recordJob({ projectId: safeProjectId, assetId: assetRecordId, kind: 'canonical_topview', status: 'succeeded', provider: 'deterministic', model: 'canonical-topview-renderer' });

  return {
    assetRecordId,
    svg,
    svgUrl: written.svgUrl,
    pngUrl: written.pngUrl,
    preset: written.preset,
    bounds,
    source: 'canonical'
  };
}

export async function enhanceCanonicalTopView({
  projectId,
  manifest,
  canonical,
  mode = 'faithful_clean',
  preset = 'technical_clean',
  floorPlanVersionId = null,
  spatialModelVersionId = null,
  stylePrompt = '',
  styleReferenceUrl = ''
}) {
  const safeProjectId = String(projectId || 'unknown');

  if (!canonical) {
    return {
      enhanced: false,
      reason: 'missing_canonical_base',
      assetRecordId: null,
      validation: null,
      fallback: null,
      summary: 'Missing canonical base image. Render canonical top view first.'
    };
  }

  const assetRecordId = recordTopViewAsset({
    projectId: safeProjectId,
    kind: 'enhanced_topview',
    preset,
    mode,
    svgUrl: canonical.svgUrl || null,
    pngUrl: canonical.pngUrl || null,
    prompt: null,
    styleReferenceUrl,
    fallbackReason: null,
    provider: null,
    model: null,
    tags: ['enhanced', 'topview', preset, mode]
  });

  const result = await enhanceTopView({
    projectId: safeProjectId,
    manifest: manifest || {},
    canonicalSvg: canonical.svg || '',
    canonicalPngUrl: canonical.pngUrl || '',
    mode,
    preset,
    stylePrompt,
    styleReferenceUrl
  });

  const previewGeometry = result.enhanced ? {
    walls: (manifest.walls || []).slice(0, 12),
    openings: (manifest.openings || []).slice(0, 12),
    rooms: (manifest.rooms || []).slice(0, 12)
  } : null;

  const validation = validateEnhancedTopView({
    manifest: manifest || {},
    enhancedPreview: previewGeometry
  });

  const fallbackReason = validation.accepted ? null : summarizeValidation(validation);

  if (result.enhanced && validation.accepted) {
    updateTopViewAsset(assetRecordId, {
      enhancedImageUrl: result.asset?.url || result.asset?.filePath || null,
      prompt: result.plan?.prompt || null,
      fallbackReason: null,
      provider: result.asset?.provider || result.asset?.sourceType || null,
      model: result.asset?.model || null
    });
    updateTopViewValidation(assetRecordId, {
      status: 'accepted',
      wallDrift: validation.wallDrift,
      openingDrift: validation.openingDrift,
      topologyMismatch: validation.topologyMismatch,
      geometryMismatch: validation.geometryMismatch,
      accepted: true,
      issues: validation.issues || [],
      fallbackReason: null
    });

    recordJob({ projectId: safeProjectId, assetId: assetRecordId, kind: 'enhanced_topview', status: 'succeeded', provider: result.asset?.provider || null, model: result.asset?.model || null });

    return {
      enhanced: true,
      reason: 'accepted',
      assetRecordId,
      validation,
      fallback: result.fallback,
      summary: summarizeValidation(validation),
      asset: result.asset,
      plan: result.plan
    };
  }

  const rejectedReason = fallbackReason || result.reason || 'validation_rejected';
  updateTopViewAsset(assetRecordId, {
    enhancedImageUrl: null,
    prompt: result.plan?.prompt || null,
    fallbackReason: rejectedReason,
    provider: result.asset?.provider || 'none',
    model: result.asset?.model || null
  });
  updateTopViewValidation(assetRecordId, {
    status: 'rejected',
    wallDrift: validation.wallDrift,
    openingDrift: validation.openingDrift,
    topologyMismatch: validation.topologyMismatch,
    geometryMismatch: validation.geometryMismatch,
    accepted: false,
    issues: validation.issues || [],
    fallbackReason: rejectedReason
  });

  recordJob({ projectId: safeProjectId, assetId: assetRecordId, kind: result.enhanced ? 'enhanced_topview_rejected' : 'enhanced_topview_failed', status: 'failed', provider: result.asset?.provider || 'none', model: result.asset?.model || null });

  return {
    enhanced: false,
    reason: rejectedReason,
    assetRecordId,
    validation,
    fallback: result.fallback || canonical,
    summary: summarizeValidation(validation),
    asset: result.asset || null,
    plan: result.plan || null,
    acceptedImageUrl: canonical.svgUrl || canonical.pngUrl || null
  };
}

export async function getProjectTopViewAssets(projectId) {
  return db.prepare("SELECT * FROM topview_render_assets WHERE project_id = ? ORDER BY created_at DESC").all(String(projectId || 'unknown'));
}
