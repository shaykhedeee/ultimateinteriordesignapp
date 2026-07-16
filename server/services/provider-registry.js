/**
 * Provider Registry
 *
 * Defines provider capabilities, modes, and org-scoped selection rules.
 *
 * SUPPORTED MODES
 * 1. platform-managed provider keys
 * 2. customer BYOK provider keys
 * 3. local/private inference endpoints
 */

export const TASK_TYPES = Object.freeze({
  TOPVIEW_ENHANCE: 'topview_enhance',
  QUICK_RENDER: 'quick_render',
  DETAILED_RENDER: 'detailed_render',
  INPAINT: 'inpaint',
  UPSCALE: 'upscale',
  STYLE_IMAGE: 'style_image',
  CRITIC_TEXT: 'critic_text'
});

export const PROVIDER_MODES = Object.freeze({
  PLATFORM: 'platform',
  BYOK: 'byok',
  LOCAL: 'local'
});

export const CAPABILITY_TAGS = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  ENHANCE: 'enhance',
  RENDER: 'render',
  EDIT: 'edit',
  UPSCALE: 'upscale'
});

export const PROVIDER_CAPABILITIES = Object.freeze({
  openrouter: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.CRITIC_TEXT],
  openai: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.ENHANCE, CAPABILITY_TAGS.UPSCALE, CAPABILITY_TAGS.RENDER, CAPABILITY_TAGS.EDIT],
  gemini: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.ENHANCE, CAPABILITY_TAGS.UPSCALE, CAPABILITY_TAGS.RENDER, CAPABILITY_TAGS.EDIT],
  stability: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.ENHANCE, CAPABILITY_TAGS.RENDER, CAPABILITY_TAGS.EDIT, CAPABILITY_TAGS.UPSCALE],
  pollinations: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.STYLE_IMAGE],
  huggingface: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.ENHANCE, CAPABILITY_TAGS.UPSCALE, CAPABILITY_TAGS.RENDER, CAPABILITY_TAGS.EDIT],
  pexels: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.STYLE_IMAGE],
  mock: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.ENHANCE, CAPABILITY_TAGS.RENDER, CAPABILITY_TAGS.EDIT, CAPABILITY_TAGS.UPSCALE, CAPABILITY_TAGS.STYLE_IMAGE, CAPABILITY_TAGS.CRITIC_TEXT],
  local_comfyui: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.ENHANCE, CAPABILITY_TAGS.RENDER, CAPABILITY_TAGS.EDIT, CAPABILITY_TAGS.UPSCALE],
  local_inference: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.CRITIC_TEXT]
});

export const TASK_CAPABILITY_REQUIREMENTS = Object.freeze({
  [TASK_TYPES.TOPVIEW_ENHANCE]: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.ENHANCE],
  [TASK_TYPES.QUICK_RENDER]: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.RENDER],
  [TASK_TYPES.DETAILED_RENDER]: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.RENDER],
  [TASK_TYPES.INPAINT]: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.EDIT],
  [TASK_TYPES.UPSCALE]: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.UPSCALE],
  [TASK_TYPES.STYLE_IMAGE]: [CAPABILITY_TAGS.IMAGE, CAPABILITY_TAGS.STYLE_IMAGE],
  [TASK_TYPES.CRITIC_TEXT]: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.CRITIC_TEXT]
});

export function canHandleTask(providerKey, taskType) {
  const caps = PROVIDER_CAPABILITIES[providerKey] || [];
  return (TASK_CAPABILITY_REQUIREMENTS[taskType] || []).every((cap) => caps.includes(cap));
}

export function providersForTask(taskType) {
  const requirement = TASK_CAPABILITY_REQUIREMENTS[taskType] || [];
  return Object.keys(PROVIDER_CAPABILITIES).filter((provider) => canHandleTask(provider, taskType));
}

export function taskSupported(taskType) {
  return Boolean(TASK_CAPABILITY_REQUIREMENTS[taskType]);
}

export function normalizeProviderKey(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_') || 'unknown';
}

export function providerLabel(raw) {
  const provider = normalizeProviderKey(raw);
  const map = {
    openai: 'OpenAI',
    gemini: 'Gemini',
    stability: 'Stability AI',
    pollinations: 'Pollinations',
    huggingface: 'HuggingFace',
    pexels: 'Pexels',
    mock: 'Internal Mock',
    local_comfyui: 'Local ComfyUI',
    local_inference: 'Local Inference Gateway'
  };
  return map[provider] || provider;
}

export function normalizeProviderMode(raw) {
  const mode = String(raw || '').toLowerCase();
  if (mode === 'byok' || mode === 'customer' || mode === 'customer_byok') return 'byok';
  if (mode === 'local' || mode === 'private' || mode === 'self_hosted') return 'local';
  return 'platform';
}

/**
 * @typedef {typeof TASK_TYPES[keyof typeof TASK_TYPES]} ProviderTaskType
 */
