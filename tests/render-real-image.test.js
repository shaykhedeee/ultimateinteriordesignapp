/**
 * tests/render-real-image.test.js
 * Guards that renders produce REAL photoreal images (not the SVG mock) when no
 * API key is configured — Pollinations is the keyless default provider and must
 * be ON by default so the app shows real renders out-of-the-box.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateInteriorAsset } from '../server/services/image-provider.js';

test('no-key render yields a real image source, not the mock', async () => {
  const asset = await generateInteriorAsset({
    projectId: 'probe-nokey', room: 'master', title: 'no-key probe',
    prompt: 'a luxury bedroom', style: 'modern', budgetTier: 'luxury', tags: ['probe'], reuseFirst: false
  });
  assert.notEqual(asset.sourceType, 'mock-generated', 'without a key renders must still be real, not the SVG mock');
  assert.ok(
    ['pollinations-image', 'huggingface-image', 'openai', 'openai-gpt-image-1', 'gemini-imagen', 'stability-sdxl', 'stability-flux', 'freepik-image'].includes(asset.sourceType),
    `expected a real-image sourceType, got ${asset.sourceType}`
  );
});

test('real render prompt carries the ULTIDA signature language', async () => {
  const asset = await generateInteriorAsset({
    projectId: 'probe-sig', room: 'living', title: 'sig probe',
    prompt: 'a luxury living room', style: 'modern', budgetTier: 'luxury', tags: ['probe'], reuseFirst: false
  });
  assert.ok(asset.prompt.includes('ULTIDA signature'), 'real render prompt missing ULTIDA signature');
});
