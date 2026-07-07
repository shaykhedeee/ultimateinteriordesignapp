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

test('interpretFloorPlan detects the enclosed outer room (real geometry)', () => {
  const r = planIntelligenceCore.interpretFloorPlan('proj_x', {}, { traced });
  assert.equal(r.success, true);
  // outer 800x400 px -> 20m x 10m room
  assert.ok(r.interpretation.rooms.length >= 1);
  const room = r.interpretation.rooms[0];
  assert.ok(room.widthMm >= 19000 && room.widthMm <= 21000, 'width ~20000mm');
  assert.ok(room.heightMm >= 9000 && room.heightMm <= 11000, 'height ~10000mm');
  assert.equal(room.confidence, 1.0);
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
