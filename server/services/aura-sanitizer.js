/**
 * AURA — Sanitization Policy
 *
 * Applies policy constraints to AURA task inputs/outputs before storage.
 */

const ALLOWED_OUTPUT_FIELDS = new Set([
  'taskType',
  'parsed',
  'parseValid',
  'raw',
  'confidence',
  'providerMeta',
  'usedMemory',
  'feedbackId'
]);

export function cleanAuraStructuredResult(result) {
  if (!result || typeof result !== 'object') {
    return { taskType: 'unknown', parsed: null, parseValid: false, raw: null, confidence: undefined, providerMeta: undefined, usedMemory: undefined, feedbackId: undefined };
  }

  const sanitized = { ...result };
  for (const key of Object.keys(sanitized)) {
    if (!ALLOWED_OUTPUT_FIELDS.has(key)) delete sanitized[key];
  }

  if (sanitized.providerMeta && typeof sanitized.providerMeta === 'object') {
    const allowedMeta = ['provider', 'model'];
    sanitized.providerMeta = Object.fromEntries(Object.entries(sanitized.providerMeta).filter(([k]) => allowedMeta.includes(k)));
  }

  if (sanitized.usedMemory && typeof sanitized.usedMemory === 'object') {
    const allowedMemory = ['projectId', 'organizationId', 'zoneId', 'recentAcceptedPlans', 'recentPromptVersions', 'orgPrefs'];
    sanitized.usedMemory = Object.fromEntries(Object.entries(sanitized.usedMemory).filter(([k]) => allowedMemory.includes(k)));
  }

  sanitized.taskType = String(sanitized.taskType || 'unknown').replace(/[^a-z0-9_]+/g, '_').toLowerCase();
  sanitized.parseValid = Boolean(sanitized.parseValid);
  sanitized.raw = typeof sanitized.raw === 'string' ? sanitized.raw.slice(0, 2000) : null;

  if (sanitized.feedbackId !== undefined && sanitized.feedbackId !== null) {
    sanitized.feedbackId = String(sanitized.feedbackId);
  }

  return sanitized;
}

export function cleanAuraInput(input) {
  if (!input || typeof input !== 'object') return {};
  const copy = { ...input };

  const blocklist = ['systemInstructionRaw', 'developerKey', 'byokApiKey', 'apiKey', 'api_secret', 'password', 'token'];
  for (const key of Object.keys(copy)) {
    if (blocklist.some((b) => key.toLowerCase().includes(b))) delete copy[key];
  }
  return copy;
}

export function enforceMaximumRawSize(raw, maxBytes = 2000) {
  if (typeof raw !== 'string') return null;
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) return raw.slice(0, maxBytes);
  return raw;
}

export function redactSecretsFromString(text) {
  return String(text || '').replace(/(sk-[a-zA-Z0-9]{20,})/g, '[REDACTED]').replace(/(Bearer\s+[a-zA-Z0-9\-_.]+)/g, 'Bearer [REDACTED]');
}
