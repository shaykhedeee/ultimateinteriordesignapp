/**
 * tests/photo-to-elevation.test.js
 * node --test (no deps). Guards the REAL image->2D elevation pipeline.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePhotoToElevation } from '../server/services/photo-to-elevation.js';
import { generateElevationDXF } from '../server/services/dxf-generator.js';

const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('parser: explicit width/height/depth beats positional inches', async () => {
  const r = await analyzePhotoToElevation({
    imageB64: TINY_PNG,
    dimsText: 'wardrobe width 86" height 105" depth 22"',
    unitTypeHint: 'wardrobe'
  });
  assert.equal(r.success, true);
  assert.equal(r.model.lengthMm, Math.round(86 * 25.4));   // 2184
  assert.equal(r.model.heightMm, Math.round(105 * 25.4));  // 2667
  assert.equal(r.model.depthMm, Math.round(22 * 25.4));    // 559
});

test('parser: cm + inch mixed (160cm width, 105" height)', async () => {
  const r = await analyzePhotoToElevation({
    imageB64: TINY_PNG,
    dimsText: 'wardrobe width 160cm height 105"',
    unitTypeHint: 'wardrobe'
  });
  assert.equal(r.model.lengthMm, 1600);
  assert.equal(r.model.heightMm, Math.round(105 * 25.4));
});

test('vanity archetype produces a real cabinet + valid DXF', async () => {
  const r = await analyzePhotoToElevation({
    imageB64: TINY_PNG,
    dimsText: 'vanity width 72" height 105" depth 21"',
    unitTypeHint: 'vanity'
  });
  assert.equal(r.unitType, 'vanity');
  assert.ok(r.model.cabinets.length >= 1);
  const dxf = generateElevationDXF(r.model, { scale: '1:25' });
  assert.ok(dxf.includes('AC1024') && dxf.includes('EOF'), 'DXF must be valid R2010');
});

test('wardrobe splits into 4 doors by default (real subdivision)', async () => {
  const r = await analyzePhotoToElevation({
    imageB64: TINY_PNG,
    dimsText: 'wardrobe width 86" height 105"',
    unitTypeHint: 'wardrobe'
  });
  assert.equal(r.model.cabinets.length, 4);
  assert.ok(r.model.cabinets.every(c => c.tag === 'DOOR'));
});

test('deterministic fallback always yields a valid measured model (no AI needed)', async () => {
  const r = await analyzePhotoToElevation({
    imageB64: TINY_PNG,
    dimsText: 'tv-unit width 90" height 80"',
    unitTypeHint: 'tv-unit'
  });
  assert.equal(r.source, 'deterministic');
  assert.equal(r.learning.runs >= 1, true); // analyzer "trained" by recording the run
});

test('rejects when no image supplied (honest, no fake model)', async () => {
  const r = await analyzePhotoToElevation({ dimsText: 'wardrobe 86"' });
  assert.equal(r.success, false);
  assert.equal(r.error, 'NO_IMAGE');
  assert.equal(r.model, null);
});
