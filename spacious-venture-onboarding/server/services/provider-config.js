export function normalizedSecret(value = '') {
  return String(value || '').trim();
}

export function isOpenRouterKey(value = '') {
  return normalizedSecret(value).startsWith('sk-or-v1-');
}

export function isNativeOpenAiKey(value = '') {
  const key = normalizedSecret(value);
  return key.startsWith('sk-') && !isOpenRouterKey(key);
}

export function openAiKeyType(value = process.env.OPENAI_API_KEY) {
  const key = normalizedSecret(value);
  if (!key) return 'missing';
  if (isOpenRouterKey(key)) return 'openrouter-text-only';
  if (isNativeOpenAiKey(key)) return 'openai-platform';
  return 'unsupported-format';
}

export function openRouterKey() {
  const key = normalizedSecret(process.env.OPENROUTER_API_KEY);
  return isOpenRouterKey(key) ? key : '';
}
