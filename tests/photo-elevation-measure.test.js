/**
 * tests/photo-elevation-measure.test.js
 * Guards MEASUREMENT CORRECTNESS for the photo -> elevation feature.
 * A sellable interior tool must never mis-convert inches to mm.
 *   BUG fixed: an inch mark (") was multiplied by MM_PER_FOOT (x12 error),
 *   so 86" became 26,213mm instead of 2,184mm.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDims } from '../server/services/photo-to-elevation.js';

test('inch dimension converts correctly (86" -> ~2184mm, not 26m)', () => {
  const d = parseDims('86" x 72" wardrobe');
  assert.ok(d.widthMm != null, 'width parsed');
  assert.ok(d.heightMm != null, 'height parsed');
  // 86in * 25.4 = 2184.4 ; allow rounding
  assert.ok(Math.abs(d.widthMm - 2184) <= 2, `width should be ~2184mm, got ${d.widthMm}`);
  assert.ok(Math.abs(d.heightMm - 1829) <= 2, `height should be ~1829mm (72in), got ${d.heightMm}`);
});

test('cm dimension converts correctly (160cm -> 1600mm)', () => {
  const d = parseDims('width 160cm height 240cm');
  assert.equal(d.widthMm, 1600);
  assert.equal(d.heightMm, 2400);
});

test('depth label parse (21 depth -> 21in -> 533mm)', () => {
  const d = parseDims('21" depth');
  assert.ok(d.depthMm != null, 'depth parsed');
  assert.ok(Math.abs(d.depthMm - 533) <= 2, `depth ~533mm, got ${d.depthMm}`);
});
