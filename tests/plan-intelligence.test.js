/**
 * tests/plan-intelligence.test.js
 * node --test (no deps). Guards the REAL room-detection — must never invent geometry.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import planIntelligenceCore from '../server/services/plan-intelligence-core.js';

// A simple closed rectangle (4 walls meeting end-to-end) + an inner partition.
// Coordinates are plan-pixels; scale = 40px == 1000mm => 400px == 10m.
const traced = {
  ppm: 40,
  walls: [
    { id: 'w_ext_n', x1: 100, y1: 100, x2: 900, y2: 100, thicknessMm: 230 },
    { id: 'w_ext_e', x1: 900, y1: 100, x2: 900, y2: 500, thicknessMm: 230 },
    { id: 'w_ext_s', x1: 900, y1: 500, x2: 100, y2: 500, thicknessMm: 230 },
    { id: 'w_ext_w', x1: 100, y1: 500, x2: 100, y2: 100, thicknessMm: 230 },
    { id: 'w_part', x1: 500, y1: 100, x2: 500, y2: 500, thicknessMm: 115 }
  ],
  openings: [
    { id: 'op1', openingType: 'door', wallId: 'w_ext_w', offsetFromStartMm: 300, widthMm: 900 }
  ]
};

test('interpretFloorPlan detects rooms (real geometry, partition splits interior)', () => {
  const r = planIntelligenceCore.interpretFloorPlan('proj_x', {}, { traced });
  assert.equal(r.success, true);
  // Outer rectangle is 800x400 px; the vertical partition at x=500 splits it
  // into TWO real rooms, each 400x400 px. Scale = 40px == 1000mm.
  assert.ok(r.interpretation.rooms.length >= 2, 'partition produces 2 rooms');
  const widths = r.interpretation.rooms.map(rm => rm.widthMm).sort((a, b) => a - b);
  // Each split room is ~400px -> ~10000mm wide.
  assert.ok(widths[0] >= 9000 && widths[0] <= 11000, 'split room width ~10000mm');
  assert.ok(widths[widths.length - 1] >= 9000 && widths[widths.length - 1] <= 11000, 'split room width ~10000mm');
  // Combined span still reflects the full 800px -> ~20000mm envelope.
  const totalW = Math.max(...r.interpretation.rooms.map(rm => Math.max(...rm.points.map(p => p.x)))) -
    Math.min(...r.interpretation.rooms.map(rm => Math.min(...rm.points.map(p => p.x))));
  assert.ok(totalW * (1000 / 40) >= 19000 && totalW * (1000 / 40) <= 21000, 'envelope width ~20000mm');
  assert.equal(r.interpretation.rooms[0].confidence, 1.0);
});

test('NO invented hardcoded rooms — output derives only from traced walls', () => {
  const r = planIntelligenceCore.interpretFloorPlan('proj_x', {}, { traced });
  const json = JSON.stringify(r.interpretation);
  // The old fake emitted these literal ids; assert they are GONE.
  assert.ok(!json.includes('op_main_door'));
  assert.ok(!json.includes('op_kitchen_win'));
  assert.ok(!json.includes('sp_sink_inlet')); // invented service points removed
});

test('Openings are read from traced data, not invented', () => {
  const r = planIntelligenceCore.interpretFloorPlan('proj_x', {}, { traced });
  assert.equal(r.interpretation.openings.length, 1);
  assert.equal(r.interpretation.openings[0].widthMm, 900);
});

test('Honest failure when nothing traced (no fake plan)', () => {
  const r = planIntelligenceCore.interpretFloorPlan('proj_x', {}, { traced: { walls: [], openings: [], ppm: 40 } });
  assert.equal(r.success, false);
  assert.equal(r.error, 'NO_TRACED_WALLS');
  assert.equal(r.interpretation, null);
});

test('normalizeIntake is real (budget bands)', () => {
  const n = planIntelligenceCore.normalizeIntake({ budgetBand: 'luxury', rooms: [{ name: 'Kitchen' }] });
  assert.equal(n.budget.band, 'luxury');
  assert.equal(n.budget.targetBudget, 2000000);
  assert.equal(n.rooms[0].name, 'Kitchen');
});

test('generateAutoLayoutProposal uses detected room polygons', () => {
  const r = planIntelligenceCore.interpretFloorPlan('proj_x', {}, { traced });
  const scene = planIntelligenceCore.generateAutoLayoutProposal({ levels: [{ rooms: r.interpretation.rooms, walls: r.interpretation.walls, openings: r.interpretation.openings }] }, { budget: { band: 'standard' } });
  assert.ok(scene.levels[0].furniture.length >= 1);
});
