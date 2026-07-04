/**
 * Inference Gateway
 *
 * Single entry point for all AI, image, vision, and provider calls.
 * Implements capability-based routing, retries, fallback chains,
 * org-specific provider selection, and graceful degradation.
 *
 * Rule: no other module should call an external AI provider directly.
 */

import {
  TASK_TYPES,
  PROVIDER_MODES,
  canHandleTask,
  providersForTask,
  providerLabel,
  normalizeProviderKey
} from './provider-registry.js';
import { resolveProviderForTask, recordProviderMetadata } from './provider-router-service.js';

let gatewayConfigured = false;
let defaultTimeoutMs = 30_000;
let maxRetries = 2;
let retryBaseDelayMs = 500;

const DEFAULT_FREE_PROVIDERS = ['huggingface','openrouter','pollinations','local_comfyui'];
const FALLBACK_CHAINS = Object.freeze({
  [TASK_TYPES.TOPVIEW_ENHANCE]: [...DEFAULT_FREE_PROVIDERS, 'mock'],
  [TASK_TYPES.QUICK_RENDER]: [...DEFAULT_FREE_PROVIDERS, 'mock'],
  [TASK_TYPES.DETAILED_RENDER]: [...DEFAULT_FREE_PROVIDERS, 'openai', 'gemini', 'mock'],
  [TASK_TYPES.INPAINT]: [...DEFAULT_FREE_PROVIDERS, 'mock'],
  [TASK_TYPES.UPSCALE]: [...DEFAULT_FREE_PROVIDERS, 'mock'],
  [TASK_TYPES.STYLE_IMAGE]: [...DEFAULT_FREE_PROVIDERS, 'mock'],
  [TASK_TYPES.CRITIC_TEXT]: ['openrouter', 'gemini', ...DEFAULT_FREE_PROVIDERS.filter((p)=>p!=='local_comfyui'), 'mock']
});

export function configureGateway({ timeoutMs, maxAttempts, retryDelayMs }) {
  if (typeof timeoutMs === 'number') defaultTimeoutMs = timeoutMs;
  if (typeof maxAttempts === 'number') maxRetries = Math.max(0, maxAttempts - 1);
  if (typeof retryDelayMs === 'number') retryBaseDelayMs = retryDelayMs;
  gatewayConfigured = true;
}

export function resolveProvider({ taskType, organizationId, provider, providerMode, fallbackOrder }) {
  const resolution = resolveProviderForTask({
    taskType,
    organizationId,
    provider,
    providerMode,
    fallbackOrder
  });

  if (!resolution.unsupported && resolution.provider !== 'mock') {
    return resolution;
  }

  const chain = fallbackOrder && fallbackOrder.length
    ? fallbackOrder
    : FALLBACK_CHAINS[taskType] || ['mock'];

  for (const candidate of chain) {
    const normalized = normalizeProviderKey(candidate);
    if (!canHandleTask(normalized, taskType)) continue;

    const mode = resolution.providerMode || 'platform';
    recordProviderMetadata({
      organizationId,
      taskType,
      provider: normalized,
      providerMode: mode,
      fallbackUsed: true,
      capabilityMatch: []
    });

    return {
      provider: normalized,
      providerMode: mode,
      capabilityMatch: [],
      fallbackUsed: true,
      unsupported: false
    };
  }

  return {
    provider: 'mock',
    providerMode: 'platform',
    capabilityMatch: [],
    fallbackUsed: true,
    unsupported: false
  };
}

export async function executeInference({
  taskType,
  payload,
  organizationId,
  projectId,
  provider,
  providerMode,
  fallbackOrder = [],
  attempts = maxRetries,
  timeoutMs = defaultTimeoutMs
}) {
  const resolution = resolveProvider({
    taskType,
    organizationId,
    provider,
    providerMode,
    fallbackOrder
  });

  let lastError = null;
  let attempted = 0;
  const candidateProviders = [resolution.provider, ...(fallbackOrder || [])].filter(Boolean);
  const seen = new Set();

  for (const candidate of candidateProviders) {
    const normalized = normalizeProviderKey(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (!canHandleTask(normalized, taskType)) continue;

    for (let attempt = 0; attempt <= attempts; attempt++) {
      attempted++;
      try {
        recordProviderMetadata({
          organizationId,
          projectId,
          taskType,
          provider: normalized,
          providerMode: resolution.providerMode,
          fallbackUsed: resolution.fallbackUsed
        });

        const controller = providerController(normalized);
        const result = await withTimeout(controller({ taskType, payload, organizationId, projectId }), timeoutMs);

        return {
          ...result,
          provider: normalized,
          providerMode: resolution.providerMode,
          fallbackUsed: resolution.fallbackUsed,
          attempts
        };
      } catch (err) {
        lastError = err;
        const delay = retryBaseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  const safeError = lastError ? { message: lastError.message } : { message: 'No provider succeeded' };
  return {
    provider: resolution.provider,
    providerMode: resolution.providerMode,
    fallbackUsed: true,
    attempts,
    ...safeError
  };
}

export function providerLabelSafe(raw) {
  return providerLabel(raw);
}

export function listSupportedTaskTypes() {
  return Object.values(TASK_TYPES);
}

export function listProvidersForTask(taskType) {
  return providersForTask(taskType);
}

function providerController(provider) {
  const normalized = normalizeProviderKey(provider);
  const map = {
    mock: ({ taskType, payload }) => mockResult(taskType, payload),
    pollinations: ({ taskType, payload }) => pollinationsController(taskType, payload),
    pexels: ({ taskType, payload }) => pexelsController(taskType, payload),
    openrouter: ({ taskType, payload }) => openRouterTextController(taskType, payload),
    gemini: ({ taskType, payload }) => geminiTextController(taskType, payload),
    openai: ({ taskType, payload }) => openAiImageController(taskType, payload),
    stability: ({ taskType, payload }) => stabilityImageController(taskType, payload),
    huggingface: ({ taskType, payload }) => huggingFaceController(taskType, payload),
    local_comfyui: ({ taskType, payload }) => localComfyController(taskType, payload),
    local_inference: ({ taskType, payload }) => localInferenceTextController(taskType, payload)
  };

  const controller = map[normalized];
  if (!controller) throw new Error(`No inference controller registered for provider: ${provider}`);
  return controller;
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

function huggingFaceController(taskType, payload) {
  const endpointBase = String(process.env.HUGGINGFACE_TEXT_ENDPOINT_BASE || 'https://router.huggingface.co/hf-inference/models');
  const model = payload && payload.model ? payload.model : (taskType === 'room_semantics' ? 'mistralai/Mistral-7B-Instruct-v0.2' : 'stabilityai/stable-diffusion-xl-base-1.0');
  const endpoint = `${endpointBase}/${encodeURIComponent(model)}`;
  const body = { inputs: payload && payload.prompt ? payload.prompt : JSON.stringify(payload) };
  return safeFetchJson(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

function openRouterTextController(taskType, payload) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Promise.resolve({ ok: false, error: 'OPENROUTER_API_KEY is missing' });
  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const body = {
    model: payload && payload.model ? payload.model : 'mistralai/mistral-7b-instruct',
    messages: [{ role: 'user', content: payload && payload.prompt ? payload.prompt : JSON.stringify(payload) }]
  };
  return safeFetchJson(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
}

function pollinationsImageController(taskType, payload) {
  const prompt = payload && payload.prompt ? payload.prompt : 'interior design concept';
  const endpoint = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
  return safeFetchJson(endpoint);
}

function localComfyController(taskType, payload) {
  const base = process.env.COMFYUI_BASE || 'http://127.0.0.1:8188';
  const endpoint = `${base}/prompt`;
  const body = { prompt: { ...(payload || {}) } };
  return safeFetchJson(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

function localInferenceTextController(taskType, payload) {
  const base = process.env.LOCAL_INFERENCE_BASE || 'http://127.0.0.1:11434';
  const endpoint = `${base}/api/generate`;
  const body = { model: payload && payload.model ? payload.model : 'llama3', prompt: payload && payload.prompt ? payload.prompt : JSON.stringify(payload) };
  return safeFetchJson(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

function geminiTextController(taskType, payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Promise.resolve({ ok: false, error: 'GEMINI_API_KEY is missing' });
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  const body = { contents: [{ parts: [{ text: payload && payload.prompt ? payload.prompt : JSON.stringify(payload) }] }] };
  return safeFetchJson(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

function openAiImageController(taskType, payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Promise.resolve({ ok: false, error: 'OPENAI_API_KEY is missing' });
  const endpoint = 'https://api.openai.com/v1/images/generations';
  const body = { model: payload && payload.model ? payload.model : 'dall-e-3', prompt: payload && payload.prompt ? payload.prompt : JSON.stringify(payload), n: 1, size: '1024x1024' };
  return safeFetchJson(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
}

function stabilityImageController(taskType, payload) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return Promise.resolve({ ok: false, error: 'STABILITY_API_KEY is missing' });
  const endpoint = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-base-1.0/text-to-image';
  const body = { text_prompts: [{ text: payload && payload.prompt ? payload.prompt : JSON.stringify(payload) }], cfg_scale: 7, height: 1024, width: 1024, samples: 1 };
  return safeFetchJson(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }, body: JSON.stringify(body) });
}

function pexelsController(taskType, payload) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return Promise.resolve({ ok: false, error: 'PEXELS_API_KEY is missing' });
  const endpoint = 'https://api.pexels.com/v1/search?query=' + encodeURIComponent(payload && payload.prompt ? payload.prompt : 'interior') + '&per_page=5';
  return safeFetchJson(endpoint, { method: 'GET', headers: { Authorization: apiKey } });
}

function mockResult(taskType, payload) {
  return {
    ok: true,
    provider: 'mock',
    taskType,
    output: {
      text: 'Mock inference output. Connect a real provider to replace this.',
      meta: { mode: 'mock', payloadKeys: payload ? Object.keys(payload) : [] }
    }
  };
}

function mockPlaceholder(provider, taskType, payload) {
  return {
    ok: false,
    provider,
    taskType,
    error: `${provider} adapter disabled or unavailable.`
  };
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Inference timeout')), ms))
  ]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
