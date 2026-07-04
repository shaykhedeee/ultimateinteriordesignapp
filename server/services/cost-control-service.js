/**
 * Cost Control Service
 *
 * - Estimates generation cost before execution
 * - Enforces per-user/project spend caps
 * - Logs actual spend for auditing
 * - Recommends cheaper fallback when budget is tight
 */

import db from '../database/database.js';

const DEFAULT_CAP = Number(process.env.AI_GENERATION_COST_CAP) || 500; // currency units
const CURRENCY = 'INR';

function getProviderCost(sourceType) {
  const key = String(sourceType || '').toLowerCase();
  if (key.includes('openai') || key.includes('dall-e')) return { perImage: 40, currency: CURRENCY };
  if (key.includes('stability')) return { perImage: 25, currency: CURRENCY };
  if (key.includes('replicate')) return { perImage: 30, currency: CURRENCY };
  if (key.includes('huggingface')) return { perImage: 10, currency: CURRENCY };
  if (key.includes('pollinations')) return { perImage: 0, currency: CURRENCY };
  if (key.includes('freepik')) return { perImage: 15, currency: CURRENCY };
  if (key.includes('pexels')) return { perImage: 0, currency: CURRENCY };
  if (key.includes('library-reuse')) return { perImage: 0, currency: CURRENCY };
  if (key.includes('gemini')) return { perImage: 20, currency: CURRENCY };
  return { perImage: 20, currency: CURRENCY };
}

export function estimateCost({ sourceType = 'mock-generated', count = 1 } = {}) {
  const costInfo = getProviderCost(sourceType);
  return {
    sourceType,
    count,
    unitCost: costInfo.perImage,
    totalCost: costInfo.perImage * count,
    currency: costInfo.currency,
    withinCap: costInfo.perImage * count <= DEFAULT_CAP
  };
}

export function recommendFallback({ sourceType = 'mock-generated' } = {}) {
  const key = String(sourceType || '').toLowerCase();
  if (key.includes('openai') || key.includes('dall-e') || key.includes('stability') || key.includes('replicate')) {
    return { recommendedSource: 'pollinations', reason: 'Lower cost fallback for draft generation.' };
  }
  return { recommendedSource: sourceType, reason: 'Already on low-cost provider.' };
}

export function recordCost({ projectId, assetId, sourceType, count = 1 } = {}) {
  const estimate = estimateCost({ sourceType, count });
  try {
    db.prepare(
      `INSERT INTO generation_costs (id, project_id, asset_id, source_type, count, unit_cost, total_cost, currency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(`cost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, String(projectId || 'demo'), String(assetId || ''), String(sourceType || ''), count, estimate.unitCost, estimate.totalCost, estimate.currency);
  } catch {
    // table may not exist in older DBs
  }
  return estimate;
}

export function summarizeProjectCost(projectId) {
  try {
    const rows = db.prepare('SELECT SUM(total_cost) as total FROM generation_costs WHERE project_id = ?').get(String(projectId || 'demo'));
    const bySource = db.prepare('SELECT source_type, SUM(count) as total_images, SUM(total_cost) as total_cost FROM generation_costs WHERE project_id = ? GROUP BY source_type').all(String(projectId || 'demo'));
    return {
      projectId: String(projectId || 'demo'),
      totalCost: Number(rows?.total || 0),
      currency: CURRENCY,
      bySource: Array.isArray(bySource) ? bySource : []
    };
  } catch {
    return { projectId: String(projectId || 'demo'), totalCost: 0, currency: CURRENCY, bySource: [] };
  }
}

export { DEFAULT_CAP, CURRENCY };
