/**
 * tests/provider-models.test.js
 * Guards the DB-backed model allow-list used by the BYOK UI picker:
 *  - POST /api/settings/provider-models persists {gemini:[...], openai:[...]}
 *  - backend geminiImageModels() returns ONLY the saved gemini list (UI drives gen)
 *  - restoring an empty list falls back to built-in defaults
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { geminiImageModels } from '../server/services/image-provider.js';

function setModels(obj) {
  db.prepare('INSERT OR REPLACE INTO provider_models (id, models_json, updated_at) VALUES (?, ?, ?)')
    .run('default', JSON.stringify(obj), new Date().toISOString());
}
function clearModels() { db.prepare("DELETE FROM provider_models WHERE id = 'default'").run(); }

test('provider-models allow-list drives geminiImageModels', () => {
  try {
    setModels({ gemini: ['gemini-2.0-flash-image', 'imagen-4.0-generate-001'], openai: ['dall-e-3'] });
    const models = geminiImageModels();
    assert.deepEqual(models, ['gemini-2.0-flash-image', 'imagen-4.0-generate-001']);
  } finally {
    clearModels();
  }
});

test('empty allow-list falls back to built-in gemini defaults', () => {
  try {
    setModels({});
    const models = geminiImageModels();
    assert.ok(models.length >= 2, 'should have built-in defaults when none saved');
    assert.ok(models.includes('gemini-2.5-flash-image') || models.includes('imagen-4.0-generate-001'));
  } finally {
    clearModels();
  }
});
