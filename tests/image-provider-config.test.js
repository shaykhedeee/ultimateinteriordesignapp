/**
 * tests/image-provider-config.test.js
 * Guards BYOK-aware provider/model selection:
 *  - GEMINI_IMAGE_MODELS lets a user pin exactly the models their key may call
 *  - generationProviderPriority includes OpenAI when a UI (DB) key exists,
 *    not only when process.env.OPENAI_API_KEY is set.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geminiImageModels, generationProviderPriority } from '../server/services/image-provider.js';
import db from '../server/database/database.js';

test('geminiImageModels honours explicit GEMINI_IMAGE_MODELS list', () => {
  const prev = process.env.GEMINI_IMAGE_MODELS;
  process.env.GEMINI_IMAGE_MODELS = 'gemini-2.0-flash-image,imagen-3.0-generate-001';
  try {
    const models = geminiImageModels();
    assert.deepEqual(models, ['gemini-2.0-flash-image', 'imagen-3.0-generate-001']);
  } finally {
    if (prev === undefined) delete process.env.GEMINI_IMAGE_MODELS;
    else process.env.GEMINI_IMAGE_MODELS = prev;
  }
});

test('generationProviderPriority includes OpenAI when only a UI (DB) key exists', () => {
  const provider = 'openai';
  const secret = 'UI-OPENAI-KEY-' + Math.random().toString(36).slice(2, 8);
  const prevEnv = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY; // simulate: no env key, only UI key
  db.prepare('INSERT OR REPLACE INTO api_keys (id, provider, key_enc, key_value, label, created_at) VALUES (?,?,?,?,?,?)')
    .run('key_' + provider, provider, secret, secret, provider, new Date().toISOString());
  try {
    const priority = generationProviderPriority({ reuseFirst: false });
    assert.ok(priority.includes('openai') || priority.includes('openai-gpt-image-1'), 'UI OpenAI key must enable OpenAI provider');
  } finally {
    db.prepare('DELETE FROM api_keys WHERE provider = ?').run(provider);
    if (prevEnv === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevEnv;
  }
});
