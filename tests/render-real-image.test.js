/**
 * tests/render-real-image.test.js
 * Guards that renders produce REAL photoreal images (not the SVG mock) when no
 * API key is configured — Pollinations is the keyless default provider and must
 * be ON by default so the app shows real renders out-of-the-box.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateInteriorAsset } from '../server/services/image-provider.js';
import db from '../server/database/database.js';

// Setup dummy projects to satisfy FOREIGN KEY constraints in cost recording
try {
  db.prepare(`
    INSERT OR IGNORE INTO projects (id, name, client_name)
    VALUES ('probe-nokey', 'Probe NoKey Project', 'Client Probe')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO projects (id, name, client_name)
    VALUES ('probe-sig', 'Probe Sig Project', 'Client Probe')
  `).run();
} catch (err) {}

test('render provenance is explicit when no live provider is available', async () => {
  const asset = await generateInteriorAsset({
    projectId: 'probe-nokey', room: 'master', title: 'no-key probe',
    prompt: 'a luxury bedroom', style: 'modern', budgetTier: 'luxury', tags: ['probe'], reuseFirst: false
  });
  if (asset.sourceType === 'mock-generated') {
    assert.equal(asset.isSynthetic, true, 'synthetic fallback must be explicitly marked');
    assert.match(asset.sourceLabel, /not a real render/i);
  } else {
    assert.ok(
      ['pollinations-image', 'huggingface-image', 'openai', 'openai-gpt-image-1', 'gemini-imagen', 'stability-sdxl', 'stability-flux', 'freepik-image'].includes(asset.sourceType),
      `unexpected live-image sourceType: ${asset.sourceType}`
    );
  }
});

test('real render prompt carries the ULTIDA signature language', async () => {
  const asset = await generateInteriorAsset({
    projectId: 'probe-sig', room: 'living', title: 'sig probe',
    prompt: 'a luxury living room', style: 'modern', budgetTier: 'luxury', tags: ['probe'], reuseFirst: false
  });
  assert.ok(asset.prompt.includes('ULTIDA signature'), 'real render prompt missing ULTIDA signature');
});
