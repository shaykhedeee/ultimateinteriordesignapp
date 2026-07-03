import { nanoid } from 'nanoid';
import db from '../database/database.js';

const DEFAULT_VALIDATION = JSON.stringify({
  status: 'pending',
  wallDrift: 0,
  openingDrift: 0,
  topologyMismatch: false,
  geometryMismatch: false,
  accepted: false,
  issues: []
});

export function createTopViewAssetRecord({
  projectId,
  floorPlanVersionId = null,
  spatialModelVersionId = null,
  kind = 'canonical_topview',
  preset = 'technical_clean',
  mode = null,
  svgUrl = null,
  pngUrl = null,
  enhancedImageUrl = null,
  prompt = null,
  styleReferenceUrl = null,
  fallbackReason = null,
  provider = null,
  model = null,
  tags = []
}) {
  const id = 'tva_' + nanoid(10);
  db.prepare(`INSERT INTO topview_render_assets (id, project_id, floor_plan_version_id, spatial_model_version_id, kind, preset, mode, svg_url, png_url, enhanced_image_url, prompt, style_reference_url, validation, fallback_reason, provider, model, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    projectId,
    floorPlanVersionId,
    spatialModelVersionId,
    kind,
    preset,
    mode,
    svgUrl,
    pngUrl,
    enhancedImageUrl,
    prompt,
    styleReferenceUrl,
    DEFAULT_VALIDATION,
    fallbackReason,
    provider,
    model,
    JSON.stringify(tags || [])
  );
  return id;
}

export function updateTopViewAsset(id, updates = {}) {
  const sets = [];
  const values = [];
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
  for (const key of Object.keys(updates)) {
    const dbKey = map[key] || key;
    sets.push(`${dbKey} = ?`);
    values.push(updates[key]);
  }
  if (!sets.length) return;
  values.push(id);
  db.prepare(`UPDATE topview_render_assets SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

export function updateTopViewValidation(id, result) {
  db.prepare(`UPDATE topview_render_assets SET validation = ?, fallback_reason = ? WHERE id = ?`)
    .run(JSON.stringify(result), result.fallbackReason || null, id);
}

export function getTopViewAssets(projectId) {
  return db.prepare("SELECT * FROM topview_render_assets WHERE project_id = ? ORDER BY created_at DESC").all(projectId);
}
