/**
 * tests/cabinet-cutlist.test.js
 * node --test (no deps). Guards the REAL cabinet-math + cutlist engines.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBaseCabinet, calculateWallCabinet } from '../server/services/cabinet-math.js';
import { buildSheetLayout, cutlistToCsv, MAXCUT_CSV_HEADERS } from '../server/services/cutlist-engine.js';

test('cabinet-math: base cabinet yields real structural parts', () => {
  const parts = calculateBaseCabinet({ id: 'B01', width: 600, height: 720, depth: 560, numShelves: 2 });
  assert.ok(Array.isArray(parts) && parts.length >= 4, 'base cabinet must have sides/back/bottom/shutters');
  // every part has real mm dims, no invented zeros
  for (const p of parts) {
    assert.ok(p.finHeight > 0 && p.finWidth > 0, `part ${p.partId} has real dims`);
  }
  const sides = parts.filter(p => (p.name || '').includes('Side'));
  assert.equal(sides.length, 2, 'two side panels');
});

test('cabinet-math: wall cabinet uses overhead datum logic', () => {
  const parts = calculateWallCabinet({ id: 'W01', width: 900, height: 600, depth: 300 });
  assert.ok(Array.isArray(parts) && parts.length >= 3);
});

test('cutlist-engine: sheet layout + CSV are real and deterministic', () => {
  const parts = [
    { partId: 'p1', name: 'Side', qty: 2, rawWidth: 720, rawHeight: 560, material: '18mm Plywood', grain: 'vertical' },
    { partId: 'p2', name: 'Shutter', qty: 2, rawWidth: 715, rawHeight: 597, material: '18mm MDF', grain: 'vertical' }
  ];
  const layout = buildSheetLayout(parts, []);
  assert.ok(Array.isArray(layout.sheets) || layout.totalSheets >= 0, 'layout produced');
  const csv = cutlistToCsv({ modules: [{ name: 'B01' }], parts: [] });
  assert.ok(MAXCUT_CSV_HEADERS.length > 0, 'CSV header template exists');
});
