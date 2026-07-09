/**
 * tests/byok-resolve.test.js
 * Guards the BYOK resolution path: a key stored via the UI (api_keys table)
 * must be retrievable by the render engine's resolveKey(), so live photoreal
 * renders fire from a user-entered key — not only from process.env.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { resolveKey } from '../server/services/image-provider.js';

test('resolveKey reads a BYOK key from the api_keys table', () => {
  const provider = 'byoktest_' + Math.random().toString(36).slice(2, 8);
  const secret = 'AKIA-BYOK-PROOF-' + Math.random().toString(36).slice(2, 10);
  db.prepare('INSERT OR REPLACE INTO api_keys (id, provider, key_enc, key_value, label, created_at) VALUES (?,?,?,?,?,?)')
    .run('key_' + provider, provider, secret, secret, provider, new Date().toISOString());
  try {
    assert.equal(resolveKey(provider), secret, 'BYOK key should be resolved from DB');
  } finally {
    db.prepare('DELETE FROM api_keys WHERE provider = ?').run(provider);
  }
});

test('resolveKey falls back to process.env when no DB key', () => {
  const provider = 'byokenv_' + Math.random().toString(36).slice(2, 8);
  const prev = process.env[provider.toUpperCase() + '_API_KEY'];
  process.env[provider.toUpperCase() + '_API_KEY'] = 'ENV-PROOF-VALUE';
  try {
    assert.equal(resolveKey(provider), 'ENV-PROOF-VALUE');
  } finally {
    if (prev === undefined) delete process.env[provider.toUpperCase() + '_API_KEY'];
    else process.env[provider.toUpperCase() + '_API_KEY'] = prev;
  }
});
