// Integration-style regression test for the production cutlist pipeline:
//   buildModules(project) -> generatePartsForModule -> buildSheetLayout / optimizeNesting
// This mirrors exactly what POST /cutlist/refresh (createOrRefreshCutlist) runs.
// It must not throw and must produce real, nestable parts for every known room.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildModules,
  generatePartsForModule,
  buildSheetLayout,
  generateCabinetParts,
  optimizeNesting
} from '../server/services/cutlist-engine.js';

const LAMINATES = [];

function fakeProject(selectedSpaces) {
  return {
    selectedSpaces,
    floorPlan: { annotations: { markers: [] } },
    budgetTier: 'premium'
  };
}

const ALL_SPACES = ['living', 'kitchen', 'master', 'kids', 'guest', 'pooja', 'foyer', 'study', 'dining', 'utility', 'balcony'];

test('buildModules yields a module for every known room and none are undefined', () => {
  for (const space of ALL_SPACES) {
    const modules = buildModules(fakeProject([space]), LAMINATES);
    assert.ok(Array.isArray(modules) && modules.length > 0, `${space}: expected modules, got ${JSON.stringify(modules)}`);
    for (const m of modules) {
      assert.ok(m.id && m.moduleType && m.widthMm && m.heightMm && m.depthMm, `${space}: module missing core dims ${JSON.stringify(m)}`);
    }
  }
});

test('every module generates nestable parts with valid lengthMm/widthMm', () => {
  const modules = buildModules(fakeProject(ALL_SPACES), LAMINATES);
  let totalParts = 0;
  for (const module of modules) {
    const parts = generatePartsForModule(module, 0);
    assert.ok(Array.isArray(parts) && parts.length > 0, `module ${module.moduleType}: no parts generated`);
    for (const p of parts) {
      assert.ok(Number.isFinite(p.lengthMm) && p.lengthMm > 0, `part ${p.partCode} bad lengthMm=${p.lengthMm}`);
      assert.ok(Number.isFinite(p.widthMm) && p.widthMm > 0, `part ${p.partCode} bad widthMm=${p.widthMm}`);
      assert.ok(Number.isFinite(p.quantity) && p.quantity > 0, `part ${p.partCode} bad quantity=${p.quantity}`);
    }
    totalParts += parts.length;
  }
  assert.ok(totalParts > 50, `expected a full house to yield many parts, got ${totalParts}`);
});

test('full-pipeline nesting: buildSheetLayout places pieces for a whole-house cutlist', () => {
  const modules = buildModules(fakeProject(ALL_SPACES), LAMINATES);
  const allParts = modules.flatMap((m) => generatePartsForModule(m, 0));
  const layout = buildSheetLayout(allParts, modules);
  const placed = layout.sheets.reduce((n, s) => n + s.pieces.length, 0);
  // The vast majority of panels must nest; only genuinely-oversize panels (if any)
  // should remain unplaced. Zero placed would mean the pipeline silently broke.
  assert.ok(placed > allParts.length * 0.8, `expected >=80% of ${allParts.length} parts nested, got ${placed} placed, ${layout.unplaced?.length || 0} unplaced`);
  // No two pieces overlap within a sheet.
  const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  for (const sheet of layout.sheets) {
    const ps = sheet.pieces;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        const aw = a.w || a.lengthMm, ah = a.h || a.widthMm;
        const bw = b.w || b.lengthMm, bh = b.h || b.widthMm;
        assert.ok(!rectsOverlap({ x: a.x, y: a.y, w: aw, h: ah }, { x: b.x, y: b.y, w: bw, h: bh }), `overlap on sheet ${sheet.sheetNo}`);
      }
  }
});

test('full-pipeline nesting: optimizeNesting places panels for a whole-house cutlist', () => {
  const modules = buildModules(fakeProject(ALL_SPACES), LAMINATES);
  const allParts = modules.flatMap((m) => generateCabinetParts({
    type: m.moduleType, width: m.widthMm, height: m.heightMm, depth: m.depthMm
  }));
  assert.ok(allParts.length > 0, 'generateCabinetParts should yield parts');
  const result = optimizeNesting(allParts, { mode: 'cnc' });
  const sheets = Object.values(result).flatMap((g) => g.sheets);
  const placed = sheets.reduce((n, s) => n + (s.panelsPlaced?.length || 0), 0);
  assert.ok(placed > 0, 'optimizeNesting should place panels for a whole house');
});
