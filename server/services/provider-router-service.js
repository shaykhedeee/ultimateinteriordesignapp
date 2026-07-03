/**
 * Provider Router Service
 *
 * Selects providers based on task type, organization config, and feature mode.
 * Supports capability-based routing, fallback chains, and metadata persistence.
 *
 * SUPPORTED MODES
 * 1. platform-managed provider keys
 * 2. customer BYOK provider keys
 * 3. local/private inference endpoints
 */

import { nanoid } from 'nanoid';
import db from '../database/database.js';
import {
  TASK_TYPES,
  PROVIDER_MODES,
  CAPABILITY_TAGS,
  PROVIDER_CAPABILITIES,
  TASK_CAPABILITY_REQUIREMENTS,
  canHandleTask,
  providersForTask,
  taskSupported,
  normalizeProviderKey,
  providerLabel,
  normalizeProviderMode
} from './provider-registry.js';

export { TASK_TYPES, PROVIDER_MODES, CAPABILITY_TAGS, PROVIDER_CAPABILITIES, TASK_CAPABILITY_REQUIREMENTS, canHandleTask, providersForTask, taskSupported, normalizeProviderKey, providerLabel, normalizeProviderMode } from './provider-registry.js';

export function resolveProviderForTask({ taskType, organizationId, provider, providerMode, fallbackOrder = [] }) {
  if (!taskSupported(taskType)) {
    return { provider: 'unsupported', providerMode: 'platform', capabilityMatch: [], fallbackUsed: false, unsupported: true };
  }

  const requested = normalizeProviderKey(provider);
  const requestedMode = normalizeProviderMode(providerMode);

  if (requested !== 'unknown' && requested !== 'auto' && canHandleTask(requested, taskType)) {
    return { provider: requested, providerMode: requestedMode || 'platform', capabilityMatch: PROVIDER_CAPABILITIES[requested] || [], fallbackUsed: false, unsupported: false };
  }

  const orgCandidates = getOrgCapableProviders(organizationId, taskType);
  const candidates = orgCandidates.length ? orgCandidates : providersForTask(taskType);

  for (const candidate of candidates) {
    const mode = getProviderMode(organizationId, candidate) || 'platform';
    if (matchMode(requestedMode, mode)) {
      logRouting({ organizationId, taskType, provider: candidate, providerMode: mode, fallbackUsed: false, capabilityMatch: PROVIDER_CAPABILITIES[candidate] || [] });
      return { provider: candidate, providerMode: mode, capabilityMatch: PROVIDER_CAPABILITIES[candidate] || [], fallbackUsed: false, unsupported: false };
    }
  }

  const fallback = fallbackOrder.find((entry) => canHandleTask(normalizeProviderKey(entry), taskType));
  if (fallback) {
    const normalized = normalizeProviderKey(fallback);
    const mode = getProviderMode(organizationId, normalized) || 'platform';
    logRouting({ organizationId, taskType, provider: normalized, providerMode: mode, fallbackUsed: true, capabilityMatch: PROVIDER_CAPABILITIES[normalized] || [] });
    return { provider: normalized, providerMode: mode, capabilityMatch: PROVIDER_CAPABILITIES[normalized] || [], fallbackUsed: true, unsupported: false };
  }

  const finalFallback = 'mock';
  logRouting({ organizationId, taskType, provider: finalFallback, providerMode: 'platform', fallbackUsed: true, capabilityMatch: PROVIDER_CAPABILITIES[finalFallback] || [] });
  return { provider: finalFallback, providerMode: 'platform', capabilityMatch: PROVIDER_CAPABILITIES[finalFallback] || [], fallbackUsed: true, unsupported: false };
}

export function recordProviderMetadata({ jobId, organizationId, projectId, taskType, provider, providerMode, capabilityMatch = [], fallbackUsed = false, error = null }) {
  const id = jobId || `prlog_${nanoid(16)}`;
  db.prepare(`INSERT OR REPLACE INTO provider_routing_log (id, organization_id, project_id, job_id, task_type, selected_provider, provider_mode, capability_match, fallback_used, error_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    organizationId || null,
    projectId || null,
    jobId || null,
    String(taskType || 'unknown'),
    String(provider || 'unknown'),
    String(providerMode || 'platform'),
    JSON.stringify(capabilityMatch || []),
    fallbackUsed ? 1 : 0,
    error ? JSON.stringify(error) : null,
    new Date().toISOString()
  );
  return { id, provider, providerMode };
}

function getOrgCapableProviders(organizationId, taskType) {
  if (!organizationId) return [];
  try {
    const rows = db.prepare("SELECT provider, capabilities, fallback_order FROM provider_configs WHERE organization_id = ? AND is_active = 1").all(organizationId);
    const matches = [];
    for (const row of rows) {
      const capabilities = safeJson(row.capabilities, []);
      if ((TASK_CAPABILITY_REQUIREMENTS[taskType] || []).every((cap) => capabilities.includes(cap))) {
        matches.push(normalizeProviderKey(row.provider));
      }
    }
    for (const row of rows) {
      const fallbacks = safeJson(row.fallback_order, []);
      for (const fallback of fallbacks) {
        const normalized = normalizeProviderKey(fallback);
        if (!matches.includes(normalized) && canHandleTask(normalized, taskType)) {
          matches.push(normalized);
        }
      }
    }
    return matches;
  } catch {
    return [];
  }
}

function getProviderMode(organizationId, provider) {
  if (!organizationId) return 'platform';
  try {
    const row = db.prepare("SELECT provider_mode FROM provider_configs WHERE organization_id = ? AND provider = ? AND is_active = 1 LIMIT 1").get(organizationId, provider);
    return row ? normalizeProviderMode(row.provider_mode) : 'platform';
  } catch {
    return 'platform';
  }
}

function matchMode(requestedMode, providerMode) {
  if (!requestedMode || requestedMode === 'auto') return true;
  if (requestedMode === 'platform') return providerMode === 'platform';
  return providerMode === requestedMode;
}

function logRouting({ organizationId, taskType, provider, providerMode, fallbackUsed, capabilityMatch, error }) {
  recordProviderMetadata({ organizationId, taskType, provider, providerMode, capabilityMatch, fallbackUsed, error });
}

function safeJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}
