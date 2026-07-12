// Regression tests for tv-unit-library.js and design-engine.js pure surfaces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TV_UNIT_LIBRARY, getTvUnit, getTvUnitLibrary, applyTvUnit } from '../server/services/tv-unit-library.js';
import { matchLaminates, findReusableAssets } from '../server/services/design-engine.js';

test('TV_UNIT_LIBRARY: every entry has unique id + positive dims + valid materials', () => {
  const ids = new Set();
  assert.ok(TV_UNIT_LIBRARY.length >= 10, 'has a broad catalog');
  for (const u of TV_UNIT_LIBRARY) {
    assert.ok(!ids.has(u.id), `duplicate tv unit id ${u.id}`);
    ids.add(u.id);
    assert.ok(u.widthMm > 0 && u.heightMm > 0 && u.depthMm > 0, `${u.id} has positive dims`);
    assert.ok((u.materials || []).length >= 1, `${u.id} lists materials`);
    assert.ok(/^#/.test(u.color), `${u.id} has a hex color`);
  }
});

test('getTvUnit / getTvUnitLibrary accessors', () => {
  assert.equal(getTvUnit('tv_louvered_walnut').name, 'Louvered Walnut TV Wall');
  assert.equal(getTvUnit('nope'), null);
  assert.equal(getTvUnitLibrary().length, TV_UNIT_LIBRARY.length);
});

test('applyTvUnit: unknown id -> rejected; valid id with no CAD -> rejected (no crash)', () => {
  assert.deepEqual(applyTvUnit('PROJ-X', 'ghost'), { ok: false, reason: 'UNKNOWN_TV_UNIT' });
  // No cad_drawings row for PROJ-X -> safe rejection (no throw)
  const r = applyTvUnit('PROJ-X', 'tv_louvered_walnut');
  assert.equal(r.ok, false);
});

test('matchLaminates: no project selection -> returns default Indian palette', () => {
  const lams = matchLaminates({ id: 'none-' + Date.now() });
  assert.equal(lams.length, 4);
  assert.ok(lams.every(l => l.id && l.name && l.brand && l.bestFor.length >= 1));
});

test('findReusableAssets: handles empty/missing DB gracefully (no throw)', () => {
  const r = findReusableAssets({ room: 'Living', style: 'indian-contemporary', budgetTier: 'premium', componentTags: ['tv-unit'] });
  assert.ok(Array.isArray(r), 'returns an array even if table missing');
});
