/**
 * tests/dimension-validator.test.js
 * Locks in the Dimension Validation Pipeline (Horizon-2 competitor feature).
 * Pure logic — no server / DB / network required.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import dv from '../server/services/dimension-validator.js';

test('kitchen_base at 900mm passes', () => {
  const r = dv.validateModule({ moduleType: 'kitchen_base', heightMm: 900, depthMm: 600 });
  assert.equal(r.passed, true);
  assert.equal(r.errors.length, 0);
});

test('wardrobe depth 500mm is below 560 min -> error', () => {
  const r = dv.validateModule({ moduleType: 'wardrobe', heightMm: 2400, depthMm: 500 });
  assert.equal(r.passed, false);
  assert.ok(r.errors.some(e => /560/.test(e)));
});

test('counter height 820mm is below 850 min -> error', () => {
  const r = dv.validateModule({ moduleType: 'counter', heightMm: 820, depthMm: 600 });
  assert.equal(r.passed, false);
});

test('tv_unit 700mm tall exceeds 550 max -> error', () => {
  const r = dv.validateModule({ moduleType: 'tv_unit', heightMm: 700, depthMm: 400 });
  assert.equal(r.passed, false);
});

test('detectClashes flags interpenetrating modules', () => {
  const clashes = dv.detectClashes([
    { moduleType: 'kitchen_base', widthMm: 1000, depthMm: 600, x: 0, y: 0, name: 'A' },
    { moduleType: 'wardrobe', widthMm: 1000, depthMm: 600, x: 500, y: 0, name: 'B' } // overlaps A
  ]);
  assert.ok(clashes.some(c => c.type === 'overlap' && c.severity === 'error'));
});

test('out-of-bounds module is an error', () => {
  const clashes = dv.detectClashes(
    [{ moduleType: 'wardrobe', widthMm: 2000, depthMm: 600, x: 0, y: 0, name: 'W' }],
    { widthMm: 1500, heightMm: 1500 }
  );
  assert.ok(clashes.some(c => c.type === 'bounds'));
});

test('validateLayout scores 100 for a clean kitchen+wardrobe plan', () => {
  const out = dv.validateLayout({
    room: { widthMm: 4000, heightMm: 3500 },
    modules: [
      { moduleType: 'kitchen_base', widthMm: 1800, heightMm: 900, depthMm: 600, x: 0, y: 0 },
      { moduleType: 'wardrobe', widthMm: 1200, heightMm: 2400, depthMm: 600, x: 2000, y: 0 }
    ]
  });
  assert.equal(out.passed, true);
  assert.equal(out.score, 100);
  assert.equal(out.modules.length, 2);
});

test('validateLayout reports a failing score when a module is wrong', () => {
  const out = dv.validateLayout({
    modules: [{ moduleType: 'wardrobe', widthMm: 1200, heightMm: 2400, depthMm: 400, x: 0, y: 0 }]
  });
  assert.equal(out.passed, false);
  assert.ok(out.score < 100);
});

test('unknown module type does not crash, only warns', () => {
  const r = dv.validateModule({ moduleType: 'mystery_box', heightMm: 100 });
  assert.equal(r.passed, true);
  assert.ok(r.warnings.length >= 1);
});
