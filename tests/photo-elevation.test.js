// End-to-end regression test for the photo -> elevation -> DXF pipeline.
// Uses the deterministic path (no API key / no vision) which is the
// guaranteed-correct geometry source, and asserts the final DXF is openable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePhotoToElevation, parseDims } from '../server/services/photo-to-elevation.js';
import { buildElevationDXF } from '../server/services/dxf-writer.js';

// 1x1 PNG base64 that photo-to-elevation treats as a no-vision sentinel, so the
// pipeline uses the deterministic standards model (fast, key-free, repeatable).
const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

function dxfIsValid(dxf) {
  assert.ok(typeof dxf === 'string' && dxf.length > 500, 'dxf too small / not a string');
  assert.ok(dxf.includes('EOF'), 'dxf missing EOF terminator');
  assert.ok(dxf.includes('AcDbEntity'), 'dxf missing AcDbEntity subclass (AutoCAD would reject)');
  assert.ok(!dxf.includes('NaN'), 'dxf contains NaN coordinate (invalid geometry)');
  assert.ok(dxf.includes('SECTION'), 'dxf missing SECTION');
  return true;
}

test('photo->elevation (wardrobe) yields a standards model and a valid DXF', async () => {
  const res = await analyzePhotoToElevation({
    imageB64: TINY_PNG,
    dimsText: 'width 2400 height 2100 depth 600',
    unitTypeHint: 'wardrobe'
  });
  assert.ok(res.success, `pipeline failed: ${JSON.stringify(res.error || res)}`);
  assert.ok(res.model && Array.isArray(res.model.cabinets) && res.model.cabinets.length > 0, 'no cabinets in model');
  assert.equal(res.model.lengthMm, 2400);
  assert.equal(res.model.heightMm, 2100);
  const dxf = buildElevationDXF(res.model, { scale: '1:25', rev: '1.0', projectId: 'TEST', sheet: res.model.wallName });
  dxfIsValid(dxf);
});

test('photo->elevation (kitchen) -> valid DXF', async () => {
  const res = await analyzePhotoToElevation({
    imageB64: TINY_PNG,
    dimsText: '3000 x 2400 x 600 kitchen',
    unitTypeHint: 'kitchen'
  });
  assert.ok(res.success);
  const dxf = buildElevationDXF(res.model, { scale: '1:25', rev: '1.0' });
  dxfIsValid(dxf);
});

test('photo->elevation: tiny/odd dimensions still produce a drawable DXF (no crash)', async () => {
  const res = await analyzePhotoToElevation({
    imageB64: TINY_PNG,
    dimsText: '1800 x 2100',
    unitTypeHint: 'tv-unit'
  });
  assert.ok(res.success);
  // previously could emit negative-height cabinets; now must be clean
  for (const c of res.model.cabinets) assert.ok(c.heightMm > 0, `bad height ${c.tag}=${c.heightMm}`);
  const dxf = buildElevationDXF(res.model, { scale: '1:25', rev: '1.0' });
  dxfIsValid(dxf);
});

test('dimension parser: inches / cm / bare-number heuristics', () => {
  assert.equal(parseDims('86" x 72"').widthMm, 86 * 25.4);
  assert.equal(parseDims('width 2000 height 2400').widthMm, 2000);
  assert.equal(parseDims('160cm tall').heightMm, 1600);
  assert.equal(parseDims('21 depth').depthMm, Math.trunc(21 * 25.4));
  // bare number >= 400 treated as mm
  assert.equal(parseDims('width 3000').widthMm, 3000);
});
