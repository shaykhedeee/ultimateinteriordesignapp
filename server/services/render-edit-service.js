import { nanoid } from 'nanoid';
import db from '../database/database.js';
import { resolveProviderForTask, recordProviderMetadata } from './provider-router-service.js';
import { enqueueJob } from './job-orchestrator.js';
import { buildEditPlan, resolveEditProvider, shouldRetryEdit, nextEditRetryState } from './render-edit-planner.js';

export function createRenderHistoryRow({ projectId, zoneId, parentRenderId, kind, imageUrl, prompt, negativePrompt, provider, model, seed, style, room, metadata }) {
  const id = `render_${nanoid(16)}`;
  db.prepare(`INSERT INTO render_history
    (id, project_id, zone_id, parent_render_id, kind, image_url, prompt, negative_prompt, provider, model, seed, style, room, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    String(projectId),
    zoneId || null,
    parentRenderId || null,
    String(kind || 'render'),
    imageUrl || null,
    prompt || null,
    negativePrompt || null,
    provider || null,
    model || null,
    seed ?? null,
    style || null,
    room || null,
    metadata ? JSON.stringify(metadata) : '{}',
    new Date().toISOString()
  );

  return { id, projectId, zoneId, parentRenderId, kind, imageUrl, prompt, negativePrompt, provider, model, seed, style, room, metadata, createdAt: new Date().toISOString() };
}

export function createEditRequest({ projectId, renderId, parentRenderId, editType, title, instruction, maskAssetId, maskBboxJson, referenceAssetId, roomStyleContext, geometryContext, preserveCamera, preserveGeometry, preserveLightingDirection, providerRouting, maxRetries = 2 }) {
  const id = `edit_${nanoid(16)}`;
  const plan = buildEditPlan({ editType, instruction, roomStyleContext, geometryContext, referenceAssetId });
  const providerResult = resolveEditProvider(plan, providerRouting);

  db.prepare(`INSERT INTO render_edits
    (id, project_id, render_id, parent_render_id, edit_type, title, instruction, mask_asset_id, mask_bbox_json, reference_asset_id, room_style_context, geometry_context, preserve_camera, preserve_geometry, preserve_lighting_direction, provider, status, retry_count, max_retries, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, ?, ?, ?)`).run(
    id,
    String(projectId),
    String(renderId),
    parentRenderId || null,
    String(editType),
    title ? String(title) : `${editType} on render ${renderId}`,
    String(instruction || ''),
    maskAssetId || null,
    maskBboxJson ? JSON.stringify(maskBboxJson) : null,
    referenceAssetId || null,
    plan.roomStyleContext,
    plan.geometryContext,
    preserveCamera ? 1 : 0,
    preserveGeometry ? 1 : 0,
    preserveLightingDirection ? 1 : 0,
    String(providerResult.provider),
    maxRetries,
    new Date().toISOString(),
    new Date().toISOString()
  );

  recordProviderMetadata({
    organizationId: null,
    projectId,
    taskType: plan.preferredTaskType,
    provider: providerResult.provider,
    providerMode: providerResult.providerMode,
    capabilityMatch: [],
    fallbackUsed: providerResult.fallbackUsed,
    error: providerResult.reason ? { message: providerResult.reason } : null
  });

  const job = enqueueJob({
    organizationId: null,
    projectId,
    zoneId: null,
    jobType: 'inpaint_render',
    provider: providerResult.provider,
    inputJson: {
      editId: id,
      renderId,
      parentRenderId,
      editType,
      title,
      instruction,
      maskAssetId,
      maskBboxJson,
      referenceAssetId,
      roomStyleContext,
      geometryContext,
      preserveCamera,
      preserveGeometry,
      preserveLightingDirection,
      prompt: plan.promptHint,
      negativePrompt: plan.negativeHint,
      providerRouting: providerResult
    }
  });

  return { id, jobId: job.jobId, providerResult, plan };
}

export function updateEditStatus(editId, updates = {}) {
  const sets = ['updated_at = ?'];
  const values = [new Date().toISOString()];
  const allowed = ['status', 'stage', 'progress', 'provider', 'model', 'error_json', 'result_render_id', 'retry_count', 'max_retries'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(updates[key] === null ? null : JSON.stringify(updates[key]) ?? updates[key]);
    }
  }
  values.push(editId);
  db.prepare(`UPDATE render_edits SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

export function retryEdit(editId) {
  const row = db.prepare('SELECT * FROM render_edits WHERE id = ?').get(editId);
  if (!row) return null;
  const next = nextEditRetryState(row);
  updateEditStatus(editId, next);
  const input = JSON.parse(row.input_json || '{}');
  const job = enqueueJob({
    organizationId: null,
    projectId: row.project_id,
    zoneId: null,
    jobType: 'inpaint_render',
    provider: row.provider || 'mock',
    inputJson: { ...input, editId, retrying: true }
  });
  return { editId, jobId: job.jobId, status: next.status };
}

export function cancelEdit(editId) {
  const row = db.prepare('SELECT * FROM render_edits WHERE id = ?').get(editId);
  if (!row) return null;
  updateEditStatus(editId, { status: 'cancelled', stage: 'cancelled' });
  return { id: editId, status: 'cancelled' };
}

export function listEditsForRender(renderId) {
  return db.prepare('SELECT * FROM render_edits WHERE render_id = ? ORDER BY created_at DESC').all(renderId).map(mapEditRow);
}

export function getEdit(editId) {
  const row = db.prepare('SELECT * FROM render_edits WHERE id = ?').get(editId);
  return row ? mapEditRow(row) : null;
}

export function listRenderHistory(projectId, zoneId) {
  const clauses = ['project_id = ?'];
  const args = [String(projectId)];
  if (zoneId) { clauses.push('zone_id = ?'); args.push(String(zoneId)); }
  const where = `WHERE ${clauses.join(' AND ')}`;
  return db.prepare(`SELECT * FROM render_history ${where} ORDER BY created_at DESC`).all(...args).map(mapHistoryRow);
}

function mapHistoryRow(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    zoneId: row.zone_id || null,
    parentRenderId: row.parent_render_id || null,
    kind: row.kind || 'render',
    imageUrl: row.image_url || null,
    prompt: row.prompt || null,
    negativePrompt: row.negative_prompt || null,
    provider: row.provider || null,
    model: row.model || null,
    seed: row.seed ?? null,
    style: row.style || null,
    room: row.room || null,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
    createdAt: row.created_at
  };
}

function mapEditRow(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    renderId: row.render_id,
    parentRenderId: row.parent_render_id || null,
    editType: row.edit_type,
    title: row.title || null,
    instruction: row.instruction,
    maskAssetId: row.mask_asset_id || null,
    maskBboxJson: row.mask_bbox_json ? JSON.parse(row.mask_bbox_json) : null,
    referenceAssetId: row.reference_asset_id || null,
    roomStyleContext: row.room_style_context || null,
    geometryContext: row.geometry_context ? JSON.parse(row.geometry_context) : null,
    preserveCamera: Boolean(row.preserve_camera),
    preserveGeometry: Boolean(row.preserve_geometry),
    preserveLightingDirection: Boolean(row.preserve_lighting_direction),
    resultRenderId: row.result_render_id || null,
    provider: row.provider || null,
    model: row.model || null,
    status: row.status || 'queued',
    errorJson: row.error_json ? JSON.parse(row.error_json) : null,
    retryCount: Number(row.retry_count || 0),
    maxRetries: Number(row.max_retries || 2),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
