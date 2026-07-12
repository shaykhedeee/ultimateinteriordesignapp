// Regression tests for standards.js — the geometric source of truth for every
// elevation DXF (photo->elevation, render->elevation, from-renders).
// MUST produce shop-drawing-valid geometry: bays fill the wall width exactly,
// no negative/NaN heights, every cabinet stays within the unit envelope.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStandardModel, layoutBays } from '../server/services/standards.js';

function modelIsValid(model, L, H, D) {
  // bays fill the width exactly
  let maxX = 0, minX = Infinity, maxY = 0;
  for (const c of model.cabinets) {
    assert.ok(Number.isFinite(c.widthMm) && c.widthMm > 0, `cabinet ${c.tag} bad width ${c.widthMm}`);
    assert.ok(Number.isFinite(c.heightMm) && c.heightMm > 0, `cabinet ${c.tag} bad height ${c.heightMm} (was negative/NaN)`);
    assert.ok(Number.isFinite(c.xOffsetMm) && c.xOffsetMm >= 0, `cabinet ${c.tag} bad x ${c.xOffsetMm}`);
    assert.ok(Number.isFinite(c.zOffsetMm) && c.zOffsetMm >= 0, `cabinet ${c.tag} bad z ${c.zOffsetMm}`);
    assert.ok(c.xOffsetMm + c.widthMm <= L + 1, `cabinet ${c.tag} overflows width (${c.xOffsetMm}+${c.widthMm} > ${L})`);
    assert.ok(c.zOffsetMm + c.heightMm <= H + 1, `cabinet ${c.tag} overflows height (${c.zOffsetMm}+${c.heightMm} > ${H})`);
    maxX = Math.max(maxX, c.xOffsetMm + c.widthMm);
    minX = Math.min(minX, c.xOffsetMm);
    maxY = Math.max(maxY, c.zOffsetMm + c.heightMm);
  }
  // The run must span the full width (no 50mm gap bug).
  assert.ok(Math.abs(maxX - L) <= 2, `run does not fill width: maxX=${maxX} L=${L}`);
  return true;
}

const SIZES = [
  [2400, 2100, 600], [1800, 2100, 600], [2000, 2100, 600], [1200, 2100, 600],
  [900, 2100, 600], [3000, 2400, 600], [1500, 2100, 560], [2700, 2300, 600]
];

test('layoutBays fills the total width exactly for many sizes', () => {
  for (const L of [600, 900, 1200, 1800, 2000, 2100, 2400, 2700, 3000, 1950, 2050]) {
    const bays = layoutBays(L, 600);
    const sum = bays.reduce((s, b) => s + b.w, 0);
    assert.equal(sum, L, `layoutBays(${L}) sums to ${sum}, expected ${L}`);
  }
});

test('wardrobe: no negative/NaN heights, fills width, stays in bounds', () => {
  for (const [L, H, D] of SIZES) {
    const m = buildStandardModel('wardrobe', { widthMm: L, heightMm: H, depthMm: D });
    assert.equal(m.lengthMm, L);
    modelIsValid(m, L, H, D);
  }
});

test('wardrobe: short unit (900mm tall) does not emit negative-height sections', () => {
  const m = buildStandardModel('wardrobe', { widthMm: 900, heightMm: 900, depthMm: 600 });
  // previously hangerH computed to -150; now must be clamped to >=0
  for (const c of m.cabinets) assert.ok(c.heightMm > 0, `negative/zero height ${c.tag}=${c.heightMm}`);
  modelIsValid(m, 900, 900, 600);
});

test('kitchen: no overflow, fills width', () => {
  const m = buildStandardModel('kitchen', { widthMm: 3000, heightMm: 2400, depthMm: 600 });
  modelIsValid(m, 3000, 2400, 600);
});

test('tv-unit: short-but-plausible height (520mm) clamps open section to >=0', () => {
  const m = buildStandardModel('tv-unit', { widthMm: 1800, heightMm: 520, depthMm: 450 });
  for (const c of m.cabinets) assert.ok(c.heightMm > 0, `tv-unit negative height ${c.tag}=${c.heightMm}`);
  modelIsValid(m, 1800, 520, 450);
});

test('vanity: short-but-plausible height (900mm) clamps mirror section to >=0', () => {
  const m = buildStandardModel('vanity', { widthMm: 1200, heightMm: 900, depthMm: 550 });
  for (const c of m.cabinets) assert.ok(c.heightMm > 0, `vanity negative height ${c.tag}=${c.heightMm}`);
  modelIsValid(m, 1200, 900, 550);
});

test('all unit types produce a valid, in-bounds model', () => {
  const types = ['wardrobe', 'kitchen', 'tv-unit', 'vanity', 'bookcase', 'pooja'];
  for (const t of types) {
    const m = buildStandardModel(t, { widthMm: 1800, heightMm: 2100, depthMm: 600 });
    assert.ok(m.cabinets.length > 0, `${t}: no cabinets`);
    modelIsValid(m, 1800, 2100, 600);
  }
});
