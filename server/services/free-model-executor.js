/**
 * Free/Public Provider Candidate Layer
 * Chooses validated free/public execution paths for image/plan tools without
 * paid APIs.
 */
import { TASK_TYPES, PROVIDER_CAPABILITIES, canHandleTask, taskSupported as registryTaskSupported, providersForTask } from './provider-registry.js';
import { getProfile, listProfiles } from './openrouter-profiles.js';

const TOOL_SLUG_TO_TASK_TYPE = Object.freeze({
  'floorplan-analyzer': 'topview_enhance',
  'plan-enhancer': 'topview_enhance',
  'zone-planner': 'quick_render',
  'quick-render': 'quick_render',
  'detailed-render': 'detailed_render',
  'inpaint': 'inpaint',
  'upscale': 'upscale',
  'render-edit': 'inpaint',
  'style-transfer': 'style_image',
  'render-critic': 'critic_text',
  'material-match': 'style_image',
  'laminate-swapper': 'style_image',
  'laminate-changer': 'style_image',
  'zone-design-plan': 'quick_render',
  'style-recommend': 'critic_text',
  'room-semantics': 'critic_text'
});

const AUDIT_TAG = 'free-model-executor';
const REDACTED = '[REDACTED]';

const ALLOW_FREE_PROVIDERS =
  String(process.env.FREE_MODEL_EXECUTOR_ALLOW_FREE_PROVIDERS || 'true').toLowerCase() === 'true';
const STRICT_REGISTRY =
  String(process.env.FREE_MODEL_EXECUTOR_STRICT_REGISTRY || 'false').toLowerCase() === 'true';

function envConfigured(name) {
  const value = String(process.env[name] || '').trim();
  return value.length > 0;
}

function envUnsetOrDisabled(name) {
  const value = String(process.env[name] || '').trim().toLowerCase();
  return !value || value === 'false';
}

function baseUrlForProvider(provider) {
  switch (provider) {
    case 'huggingface':
      return String(process.env.HUGGINGFACE_IMAGE_ENDPOINT_BASE || 'https://router.huggingface.co/hf-inference/models')
        .replace(/\/+$/, '');
    case 'openrouter':
      return 'https://openrouter.ai/api/v1';
    case 'pollinations':
      return String(process.env.POLLINATIONS_IMAGE_BASE || 'https://image.pollinations.ai/prompt')
        .replace(/\/+$/, '');
    default:
      return '';
  }
}

function buildPollinationsUrl(prompt, model, taskType) {
  const base = baseUrlForProvider('pollinations');
  const url = new URL(`${base}/${encodeURIComponent(prompt)}`);
  url.searchParams.set('width', String(Number(process.env.POLLINATIONS_IMAGE_WIDTH || 1280)));
  url.searchParams.set('height', String(Number(process.env.POLLINATIONS_IMAGE_HEIGHT || 720)));
  url.searchParams.set('model', String(model || process.env.POLLINATIONS_IMAGE_MODEL || 'flux'));
  url.searchParams.set('nologo', 'true');
  url.searchParams.set('private', 'true');
  url.searchParams.set('enhance', 'true');
  url.searchParams.set('safe', 'true');

  const seedInput = `${taskType}-${String(prompt || '')}`;
  const seed = Math.abs(hashString(seedInput));
  url.searchParams.set('seed', String(seed));

  return url.toString();
}

function hashString(value = '') {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function sanitizeEnvMeta(obj = {}) {
  const sensitive = [
    'apiKey', 'api_key', 'apikey', 'key', 'token', 'secret',
    'authorization', 'bearer', 'password', 'credential'
  ];
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (sensitive.some((s) => String(key).toLowerCase().includes(s))) {
      out[key] = REDACTED;
    }
  }
  return out;
}

async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, data: await res.json() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const FREE_EXECUTORS = [
  {
    name: 'huggingface',
    canHandle(taskType) {
      return String(process.env.HUGGINGFACE_ENABLED || 'true').toLowerCase() !== 'false';
    },
    registryGetsInTheWay(taskType) {
      const direct = canHandleTask(this.name, taskType);
      if (direct) return false;
      if (STRICT_REGISTRY) return true;
      return false;
    },
    isAvailable(taskType) {
      if (!envConfigured('HUGGINGFACE_API_KEY')) return 'unavailable-missing-config';
      const directReady = canHandleTask(this.name, taskType);
      if (directReady) return 'available';
      return 'unsupported-by-capabilities';
    },
    select(taskType, payload) {
      const models =
        String(process.env.HUGGINGFACE_IMAGE_MODELS || process.env.HUGGINGFACE_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      const model = models[0] || null;
      const endpoint = model ? `${baseUrlForProvider('huggingface')}/${model}` : '';
      const meta = {
        provider: 'huggingface',
        taskType,
        model,
        endpoint,
        keyConfigured: true,
        candidateModelCount: models.length,
        selectedReason: 'configured_free_router'
      };

      return { model, urlOrStatus: endpoint || 'no_model_available', meta };
    },
    async validate(selection) {
      if (!envConfigured('HUGGINGFACE_API_KEY')) {
        return { ok: false, reason: 'unavailable-missing-config', reasonDetail: 'HUGGINGFACE_API_KEY is missing.' };
      }
      if (!selection.meta?.model) {
        return { ok: false, reason: 'unavailable-missing-config', reasonDetail: 'No HuggingFace model is configured.' };
      }
      return { ok: true, reason: 'available', reasonDetail: 'HuggingFace is configured and reachable via router.' };
    },
    async execute(selection, payload) {
      const endpointBase = String(process.env.HUGGINGFACE_TEXT_ENDPOINT_BASE || 'https://router.huggingface.co/hf-inference/models');
      const model = selection?.meta?.model || 'black-forest-labs/FLUX.1-schnell';
      const endpoint = `${endpointBase}/${encodeURIComponent(model)}`;
      const prompt = payload?.prompt || payload?.customInstruction || 'interior design render';
      const body = { inputs: prompt };
      const result = await safeFetchJson(endpoint, { method: 'POST', body: JSON.stringify(body) });
      if (result.ok) {
        return { ok: true, provider: 'huggingface', model, output: result.data, endpoint };
      }
      return { ok: false, provider: 'huggingface', model, error: result.error };
    },
    estimatedCost() {
      return 0;
    }
  },
  {
    name: 'openrouter',
    canHandle(taskType) {
      return canHandleTask('openrouter', taskType);
    },
    registryGetsInTheWay(taskType) {
      return !canHandleTask('openrouter', taskType);
    },
    isAvailable(taskType) {
      if (!envConfigured('OPENROUTER_API_KEY')) return 'unavailable-missing-config';
      const directReady = canHandleTask(this.name, taskType);
      if (directReady) return 'available';
      if (ALLOW_FREE_PROVIDERS && !STRICT_REGISTRY) return 'available-but-not-ready';
      return 'unsupported-by-capabilities';
    },
    select(taskType, payload) {
      const profile = getProfile('openrouter_free');
      const models = [...(profile.models || []), ...(listProfiles().find((p) => p.name === 'openrouter_free')?.models || [])];
      const uniqueModels = [...new Set(models)];
      const model = uniqueModels[0] || null;
      const urlOrStatus = model ? `${baseUrlForProvider('openrouter')}/chat/completions` : 'model_unavailable';
      const meta = {
        profile: 'openrouter_free',
        provider: 'openrouter',
        taskType,
        model,
        urlOrStatus,
        temperature: profile.temperature || 0.4,
        maxTokens: profile.maxTokens || 1200,
        candidateModels: uniqueModels,
        keyConfigured: true,
        selectedReason: 'public_free_tier'
      };

      return { model, urlOrStatus, meta };
    },
    async validate(selection) {
      if (!envConfigured('OPENROUTER_API_KEY')) {
        return { ok: false, reason: 'unavailable-missing-config', reasonDetail: 'OPENROUTER_API_KEY is missing.' };
      }
      if (!selection.model || selection.urlOrStatus === 'model_unavailable') {
        return { ok: false, reason: 'unavailable-missing-config', reasonDetail: 'No free model list is available.' };
      }
      if (!canHandleTask('openrouter', selection.meta?.taskType || '')) {
        return { ok: false, reason: 'unsupported-by-capabilities', reasonDetail: 'OpenRouter is not registered for this task type.' };
      }

      return { ok: true, reason: 'available', reasonDetail: 'OpenRouter free profile is configured for a compatible task.' };
    },
    async execute(selection, payload) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return { ok: false, provider: 'openrouter', model: selection.model, error: 'OPENROUTER_API_KEY is missing' };
      }
      const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      const prompt = payload?.prompt || payload?.customInstruction || JSON.stringify(payload);
      const body = {
        model: selection.model,
        messages: [{ role: 'user', content: prompt }]
      };
      const result = await safeFetchJson(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
      if (result.ok) {
        return { ok: true, provider: 'openrouter', model: selection.model, output: result.data, endpoint };
      }
      return { ok: false, provider: 'openrouter', model: selection.model, error: result.error };
    },
    estimatedCost() {
      return 0;
    }
  },
  {
    name: 'pollinations',
    canHandle(taskType) {
      return !envUnsetOrDisabled('POLLINATIONS_ENABLED');
    },
    registryGetsInTheWay(taskType) {
      const direct = canHandleTask(this.name, taskType);
      if (direct) return false;
      if (STRICT_REGISTRY) return true;
      return false;
    },
    isAvailable(taskType) {
      if (envUnsetOrDisabled('POLLINATIONS_ENABLED')) return 'unavailable-missing-config';
      const directReady = canHandleTask(this.name, taskType);
      if (directReady) return 'available';
      if (ALLOW_FREE_PROVIDERS && !STRICT_REGISTRY) return 'available-but-not-ready';
      return 'unsupported-by-capabilities';
    },
    select(taskType, payload) {
      const prompt = payload?.prompt || '';
      const model = String(process.env.POLLINATIONS_IMAGE_MODEL || 'flux');
      const url = buildPollinationsUrl(prompt || 'interior design render', model, taskType);
      const meta = {
        provider: 'pollinations',
        taskType,
        model,
        endpoint: url,
        keyConfigured: false,
        selectedReason: 'public_no_auth'
      };

      return { model, urlOrStatus: url, meta };
    },
    async validate(selection) {
      if (envUnsetOrDisabled('POLLINATIONS_ENABLED')) {
        return { ok: false, reason: 'unavailable-missing-config', reasonDetail: 'POLLINATIONS_ENABLED is disabled or missing.' };
      }
      try {
        const url = new URL(selection.meta?.endpoint || selection.urlOrStatus || '');
        if (url.protocol !== 'https:') {
          return { ok: false, reason: 'unavailable-missing-config', reasonDetail: 'Pollinations endpoint is not HTTPS.' };
        }
      } catch {
        return { ok: false, reason: 'unavailable-missing-config', reasonDetail: 'Failed to parse Pollinations endpoint URL.' };
      }
      return { ok: true, reason: 'available', reasonDetail: 'Pollinations endpoint is configured and reachable without auth.' };
    },
    async execute(selection, payload) {
      const prompt = payload?.prompt || payload?.customInstruction || 'interior design render';
      const model = String(process.env.POLLINATIONS_IMAGE_MODEL || 'flux');
      const url = buildPollinationsUrl(prompt, model, selection.meta?.taskType || 'quick_render');
      const result = await safeFetchJson(url);
      if (result.ok) {
        return { ok: true, provider: 'pollinations', model, output: result.data, endpoint: url };
      }
      return { ok: false, provider: 'pollinations', model, error: result.error };
    },
    estimatedCost() {
      return 0;
    }
  },
  {
    name: 'curated',
    canHandle() {
      return true;
    },
    registryGetsInTheWay() {
      return false;
    },
    isAvailable() {
      return 'available';
    },
    select(taskType, payload) {
      const room = String(payload?.room || payload?.projectId || taskType || 'whole-home').trim().toLowerCase();
      const style = String(payload?.style || '').trim().toLowerCase();
      const title = String(payload?.title || '').trim().toLowerCase();
      const mode = guessCuratedMode({ title, room, style });
      const urlOrStatus = mode === 'mock' ? 'mock_svg_generated_on_demand' : `images:curated/${mode}`;
      const meta = {
        provider: 'curated',
        taskType,
        mode,
        selectedReason: 'local_fallback',
        keyConfigured: false
      };

      return { model: mode, urlOrStatus, meta };
    },
    async validate(selection) {
      return { ok: true, reason: 'available', reasonDetail: 'Local curated fallback is always available.' };
    },
    async execute(selection, payload) {
      return {
        ok: true,
        provider: 'curated',
        model: selection.model,
        output: { mode: selection.model, note: 'Local curated fallback render plan generated.' },
        endpoint: selection.urlOrStatus
      };
    },
    estimatedCost() {
      return 0;
    }
  }
];

function guessCuratedMode({ title, room, style }) {
  const normalized = `${room} ${style} ${title}`;
  if (normalized.includes('living') || normalized.includes('foyer') || normalized.includes('hall')) return 'living';
  if (normalized.includes('kitchen')) return 'kitchen';
  if (normalized.includes('master') || normalized.includes('bedroom')) return 'master';
  if (normalized.includes('kids') || normalized.includes('child')) return 'kids';
  if (normalized.includes('pooja') || normalized.includes('mandir') || normalized.includes('temple')) return 'pooja';
  return 'mock';
}

export async function planFreeExecution(taskType, payload = {}) {
  const normalizedTask = String(taskType || '').trim().toLowerCase();
  const knownTask = Object.values(TASK_TYPES).includes(normalizedTask);

  const metaBase = {
    requestedTaskType: normalizedTask,
    knownTaskType: knownTask,
    auditTag: AUDIT_TAG,
    redactedSecrets: true,
    allowFreeProviders: ALLOW_FREE_PROVIDERS,
    strictRegistry: STRICT_REGISTRY
  };

  if (!knownTask) {
    return {
      provider: 'mock',
      model: null,
      urlOrStatus: 'unsupported_task_type',
      meta: sanitizeEnvMeta({
        ...metaBase,
        reason: 'unsupported-by-capabilities',
        reasonDetail: 'Unknown task type; defaulting to mock fallback.'
      }),
      estimatedCost: 0
    };
  }

  const candidates = ALLOW_FREE_PROVIDERS ? FREE_EXECUTORS : FREE_EXECUTORS.slice(-1);
  const seen = new Set();

  for (const executor of candidates) {
    if (seen.has(executor.name)) continue;
    seen.add(executor.name);

    const readiness = executor.isAvailable(normalizedTask);
    if (!readiness.startsWith('available')) {
      continue;
    }

    if (!ALLOW_FREE_PROVIDERS && executor.name !== 'curated') {
      continue;
    }

    const selection = executor.select(normalizedTask, payload);
    const validation = await executor.validate(selection);
    const validationReadiness = validation?.reason || 'unavailable-missing-config';
    const ok = Boolean(validation?.ok);

    const meta = sanitizeEnvMeta({
      ...metaBase,
      provider: executor.name,
      selectedProvider: executor.name,
      taskType: normalizedTask,
      model: selection.model || null,
      endpoint: selection.meta?.endpoint || null,
      readiness: validationReadiness,
      reasonDetail: validation?.reasonDetail || null,
      selectedReason: selection.meta?.selectedReason || null,
      estimatedCost: 0,
      registryGetsInTheWay: Boolean(executor.registryGetsInTheWay?.(normalizedTask)),
      keyConfigured: Boolean(selection.meta?.keyConfigured)
    });

    if (!ok) {
      const statusLabel = validationReadiness === 'unsupported-by-capabilities' ? validationReadiness : 'available-but-not-ready';
      const selectedProvider = selection.meta?.provider || executor.name;
      return {
        provider: selectedProvider,
        model: selection.model || null,
        urlOrStatus: statusLabel,
        meta,
        estimatedCost: 0
      };
    }

    let executionResult = selection;
    try {
      if (typeof executor.execute === 'function') {
        executionResult = await executor.execute(selection, payload || {});
      }
    } catch (err) {
      return {
        provider: executor.name,
        model: selection.model || null,
        urlOrStatus: 'execution_failed',
        meta: sanitizeEnvMeta({ ...meta, reason: 'execution_failed', reasonDetail: err.message }),
        estimatedCost: 0
      };
    }

    return {
      provider: executor.name,
      model: selection.model || null,
      urlOrStatus: executionResult?.endpoint || executionResult?.urlOrStatus || 'executed',
      output: executionResult,
      meta,
      estimatedCost: 0
    };
  }

  return {
    provider: 'mock',
    model: null,
    urlOrStatus: 'no_free_path_available',
    meta: sanitizeEnvMeta({
      ...metaBase,
      readiness: 'unavailable-missing-config',
      reason: 'All free/public providers were unavailable or failed validation.'
    }),
    estimatedCost: 0
  };
}
