/**
 * AI Harness Engineering Layer
 *
 * Provides:
 * - normalizeTaskType / validateCapability
 * - runTool(taskKey, projectId, params) -> stable result envelope
 * - runBatch(runs) -> array of results with tool/provider/model/routing metadata
 * - availableTools() -> registry-derived capability contract for frontend discovery
 */
import db from '../database/database.js';
import { planFreeExecution } from './free-model-executor.js';
import { resolveProviderForTask } from './provider-router-service.js';
import { getProviderStatus } from './image-provider.js';
import { getEnabledTools, listToolSlugs } from './tool-registry.js';
import { TASK_TYPES, providersForTask } from './provider-registry.js';

const STRATEGY_ORDER = {
  quick_render: ['pollinations', 'openrouter', 'curated'],
  detailed_render: ['huggingface', 'openrouter', 'pollinations', 'curated'],
  inpaint: ['huggingface', 'openrouter', 'mock'],
  upscale: ['huggingface', 'pollinations', 'mock'],
  style_image: ['pollinations', 'huggingface', 'mock'],
  critic_text: ['openrouter', 'local_inference'],
  topview_enhance: ['huggingface', 'openrouter', 'mock']
};

export function normalizeTaskType(raw = '') {
  const key = String(raw).trim().toLowerCase().replace(/-/g, '_');
  const known = new Set(Object.values(TASK_TYPES));
  const aliases = {
    quick_render: 'quick_render',
    detailed_render: 'detailed_render',
    style_image: 'style_image',
    critic_text: 'critic_text',
    topview_enhance: 'topview_enhance',
    inpaint: 'inpaint',
    upscale: 'upscale',
    render_edit: 'inpaint',
    style_transfer: 'style_image',
    material_match: 'style_image',
    laminate_swapper: 'style_image',
    laminate_changer: 'style_image',
    render_critic: 'critic_text',
    room_semantics: 'critic_text',
    plan_enhancer: 'topview_enhance',
    floorplan_analyzer: 'topview_enhance'
  };
  if (known.has(key)) return key;
  return aliases[key] || 'critic_text';
}

export function validateCapability(taskType) {
  const supported = providersForTask(taskType).length > 0;
  const providers = providersForTask(taskType);
  return { supported, providers, count: providers.length };
}

export function availableTools() {
  const tools = getEnabledTools();
  const schema = {};
  for (const tool of tools) {
    const taskType = normalizeTaskType(tool.slug || tool.key || '');
    const capability = validateCapability(taskType);
    schema[tool.slug] = {
      name: tool.name,
      category: tool.category,
      slug: tool.slug,
      taskType,
      capability,
      route: tool.route || null,
      apiNamespace: tool.apiNamespace || null
    };
  }
  return schema;
}

export async function runTool({ toolSlug, projectId, params = {}, provider = null, model = null }) {
  const taskType = normalizeTaskType(toolSlug);
  const resolution = resolveProviderForTask({
    taskType,
    organizationId: null,
    provider,
    providerMode: 'platform',
    fallbackOrder: STRATEGY_ORDER[taskType] ? [...STRATEGY_ORDER[taskType]] : []
  });

  const payload = {
    toolSlug,
    projectId,
    params,
    provider: resolution.provider,
    model,
    taskType
  };

  const startedAt = new Date().toISOString();
  const result = await planFreeExecution(taskType, payload);
  const finishedAt = new Date().toISOString();

  const jobId = result && result.jobId ? result.jobId : `job_${Date.now().toString(36)}`;
  const envelope = {
    jobId,
    ok: Boolean(result && result.ok),
    provider: result && result.provider ? result.provider : resolution.provider,
    model: result && result.model ? result.model : model || null,
    taskType,
    toolSlug,
    projectId,
    fallbackUsed: Boolean(resolution.fallbackUsed),
    startedAt,
    finishedAt,
    output: result && result.output ? result.output : (result && result.urlOrStatus ? result.urlOrStatus : null),
    error: result && result.error ? result.error : (result && result.reason ? result.reason : null),
    meta: result && result.meta ? result.meta : null
  };

  try {
    db.prepare(`INSERT OR REPLACE INTO tool_results (tool_key, project_id, result_json, created_at) VALUES (?, ?, ?, ?)`)
      .run(toolSlug, projectId, JSON.stringify(envelope), finishedAt);
  } catch {
    // non-fatal persistence issue
  }
  return envelope;
}

export async function runBatch(runs = []) {
  const safeRuns = Array.isArray(runs) ? runs : [];
  const results = [];
  for (const run of safeRuns) {
    const result = await runTool({
      toolSlug: String(run.toolSlug || run.toolKey || '').trim(),
      projectId: String(run.projectId || 'demo').trim(),
      params: (run.params && typeof run.params === 'object') ? run.params : {},
      provider: run.provider || null,
      model: run.model || null
    });
    results.push(result);
  }
  return results;
}

export function getHarnessStatus() {
  const providerStatus = getProviderStatus();
  const supported = Object.values(TASK_TYPES);
  return {
    supportedTaskTypes: supported,
    enabledTools: listToolSlugs(),
    providerSummary: {
      activeLabel: providerStatus.activeLabel || null,
      liveImageGenReady: Boolean(providerStatus.liveImageGenReady),
      clientSafeLiveReady: Boolean(providerStatus.clientSafeLiveReady),
      providers: providerStatus.providers || {}
    }
  };
}
