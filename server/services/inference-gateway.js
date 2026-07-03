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

const FALLBACK_CHAINS = Object.freeze({
  [TASK_TYPES.TOPVIEW_ENHANCE]: ['local_comfyui', 'pollinations', 'mock'],
  [TASK_TYPES.QUICK_RENDER]: ['local_comfyui', 'pollinations', 'mock'],
  [TASK_TYPES.DETAILED_RENDER]: ['local_comfyui', 'openai', 'gemini', 'pollinations', 'mock'],
  [TASK_TYPES.INPAINT]: ['local_comfyui', 'pollinations', 'mock'],
  [TASK_TYPES.UPSCALE]: ['local_comfyui', 'pollinations', 'mock'],
  [TASK_TYPES.STYLE_IMAGE]: ['local_comfyui', 'pollinations', 'mock'],
  [TASK_TYPES.CRITIC_TEXT]: ['openrouter', 'gemini', 'mock']
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
  const map = {
    mock: ({ taskType, payload }) => mockResult(taskType, payload),
    pollinations: ({ taskType, payload }) => mockPlaceholder('pollinations', taskType, payload),
    pexels: ({ taskType, payload }) => mockPlaceholder('pexels', taskType, payload),
    openrouter: ({ taskType, payload }) => mockPlaceholder('openrouter', taskType, payload),
    gemini: ({ taskType, payload }) => mockPlaceholder('gemini', taskType, payload),
    openai: ({ taskType, payload }) => mockPlaceholder('openai', taskType, payload),
    stability: ({ taskType, payload }) => mockPlaceholder('stability', taskType, payload),
    huggingface: ({ taskType, payload }) => mockPlaceholder('huggingface', taskType, payload),
    local_comfyui: ({ taskType, payload }) => mockPlaceholder('local_comfyui', taskType, payload),
    local_inference: ({ taskType, payload }) => mockPlaceholder('local_inference', taskType, payload)
  };

  const controller = map[normalizeProviderKey(provider)];
  if (!controller) throw new Error(`No inference controller registered for provider: ${provider}`);
  return controller;
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
    error: `${provider} adapter not yet wired. Connect the adapter in inference-gateway.js providerController map.`
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
