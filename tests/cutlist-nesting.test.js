// Regression tests for the production cutlist nesting engines.
// Two independent nesting paths exist in the app:
//   1. optimizeNesting(generateCabinetParts(cab))  -> nest-optimizer.js (MaxRects/Guillotine), used by /cutlist/calculate
//   2. buildSheetLayout(parts, modules)            -> cutlist-engine.js, used by /cutlist/refresh (createOrRefreshCutlist)
// Both MUST actually place panels (not silently drop them) and MUST NOT overlap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optimizeNesting, generateCabinetParts, buildSheetLayout, splitOversizePart } from '../server/services/cutlist-engine.js';
import { nestPanels } from '../server/services/nest-optimizer.js';

const rectsOverlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

test('optimizeNesting places panels for a real base cabinet (not all unplaced)', () => {
  const parts = generateCabinetParts({ type: 'base_cabinet', width: 600, height: 720, depth: 560 });
  assert.ok(parts.length > 0, 'base cabinet should yield parts');
  const result = optimizeNesting(parts, { mode: 'cnc' });
  const allSheets = Object.values(result).flatMap(g => g.sheets);
  const placed = allSheets.flatMap(s => s.panelsPlaced);
  assert.ok(placed.length > 0, `expected placed panels, got 0 (all unplaced). parts=${parts.length}`);
  // No two placed panels may overlap on the same sheet.
  for (const sheet of allSheets) {
    const ps = sheet.panelsPlaced;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++)
        assert.ok(!rectsOverlap(ps[i], ps[j]), `panels overlap on sheet: ${JSON.stringify(ps[i])} vs ${JSON.stringify(ps[j])}`);
  }
});

test('nestPanels: panels actually placed and non-overlapping (contract check)', () => {
  const parts = [
    { partId: 'A', name: 'Panel A', material: '18mm Plywood', grain: 'none', qty: 2, rawWidth: 600, rawHeight: 560 },
    { partId: 'B', name: 'Panel B', material: '18mm Plywood', grain: 'none', qty: 4, rawWidth: 400, rawHeight: 300 }
  ];
  const { nestedSheets, unplacedParts } = nestPanels(parts, { mode: 'cnc' });
  const placed = nestedSheets.flatMap(s => s.placedParts);
  assert.equal(placed.length, 6, `expected 6 placed (2+4), got ${placed.length} placed, ${unplacedParts.length} unplaced`);
  for (const sheet of nestedSheets) {
    const ps = sheet.placedParts;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++)
        assert.ok(!rectsOverlap(ps[i], ps[j]), `overlap on a sheet`);
  }
});

test('buildSheetLayout places pieces and never overlaps within a sheet', () => {
  const modules = [{ id: 'm1', name: 'Base', room: 'kitchen' }];
  const parts = [
    { id: 'p1', partCode: 'p1', name: 'Side', moduleId: 'm1', material: '18mm Plywood', lengthMm: 560, widthMm: 600, grain: 'vertical', quantity: 2 },
    { id: 'p2', partCode: 'p2', name: 'Bottom', moduleId: 'm1', material: '18mm Plywood', lengthMm: 540, widthMm: 520, grain: 'none', quantity: 1 },
    { id: 'p3', partCode: 'p3', name: 'Door', moduleId: 'm1', material: '18mm MDF', lengthMm: 700, widthMm: 300, grain: 'vertical', quantity: 2 }
  ];
  const layout = buildSheetLayout(parts, modules);
  const totalPieces = layout.sheets.reduce((n, s) => n + s.pieces.length, 0);
  assert.equal(totalPieces, 5, `expected 5 pieces placed (2+1+2), got ${totalPieces}`);
  for (const sheet of layout.sheets) {
    const ps = sheet.pieces;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        // buildSheetLayout stores the placed (post-rotation) footprint in w/h,
        // and the original dims in lengthMm/widthMm. Use the placed footprint.
        const aw = a.w || a.lengthMm, ah = a.h || a.widthMm;
        const bw = b.w || b.lengthMm, bh = b.h || b.widthMm;
        assert.ok(!(a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y),
          `pieces overlap on layout sheet: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
      }
  }
});

test('splitOversizePart never infinite-loops on a grain-locked oversize panel', () => {
  // A 3000mm-wide, grain="vertical" panel cannot rotate and exceeds the 8x4
  // sheet width -> previously caused unbounded recursion (stack overflow).
  const impossible = { id: 'x1', partCode: 'X1', name: 'Wide Shutter', moduleId: 'm1', material: '18mm MDF', lengthMm: 2400, widthMm: 3000, quantity: 1, grain: 'vertical' };
  const out = splitOversizePart(impossible);
  assert.ok(Array.isArray(out), 'must return an array, not throw');
  assert.ok(out.length >= 1, 'should resolve to at least one flagged part');
  assert.ok(/Oversize|manual/.test(out[0].notes || ''), 'impossible part should be flagged for manual review');
});

test('splitOversizePart splits a length-oversize panel into placeable segments', () => {
  // 3000mm long, grain "none" -> splits along length into <= usable segments.
  const long = { id: 'y1', partCode: 'Y1', name: 'Long Panel', moduleId: 'm1', material: '18mm Plywood', lengthMm: 3000, widthMm: 500, quantity: 1, grain: 'none' };
  const out = splitOversizePart(long);
  assert.ok(out.length >= 2, `expected the panel to be split into segments, got ${out.length}`);
  for (const seg of out) {
    assert.ok(seg.lengthMm <= 2420, `segment ${seg.partCode} length ${seg.lengthMm} still exceeds sheet`);
  }
});
