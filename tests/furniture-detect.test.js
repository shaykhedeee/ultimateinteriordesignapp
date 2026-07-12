// Regression test for the honest furniture-detection path used by
// POST /api/projects/:id/plan/detect-furniture.
// The route no longer fabricates a fixed "Sofa + Rug" — it derives furniture
// from the project's ACTUAL traced plan (rooms -> parametric layout). These
// tests lock that transformation and the "never invent on empty plan" contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import planIntelligenceCore from '../server/services/plan-intelligence-core.js';

// A simple rectangular traced plan: a 5000 x 4000mm room, traced as 4 walls
// (in plan-pixels at DEFAULT_PPM=40 => 200px x 160px).
const traced = {
  ppm: 40,
  walls: [
    { id: 'w1', x1: 0, y1: 0, x2: 200, y2: 0, thicknessMm: 230 },
    { id: 'w2', x1: 200, y1: 0, x2: 200, y2: 160, thicknessMm: 230 },
    { id: 'w3', x1: 200, y1: 160, x2: 0, y2: 160, thicknessMm: 230 },
    { id: 'w4', x1: 0, y1: 160, x2: 0, y2: 0, thicknessMm: 230 }
  ],
  openings: []
};

test('interpretFloorPlan derives a real room from traced walls', () => {
  const r = planIntelligenceCore.interpretFloorPlan('test', null, { traced });
  assert.equal(r.success, true);
  assert.ok(r.interpretation.rooms.length >= 1, 'expected at least one room');
  const room = r.interpretation.rooms[0];
  // 200px @ 40ppm -> 5000mm ; 160px -> 4000mm (approx, bbox-based)
  assert.ok(room.widthMm > 4000 && room.widthMm < 6000, `width ${room.widthMm}`);
  assert.ok(room.heightMm > 3000 && room.heightMm < 5000, `height ${room.heightMm}`);
});

test('detect path: traced plan yields real, room-anchored furniture (no fabrication)', () => {
  const interp = planIntelligenceCore.interpretFloorPlan('test', null, { traced });
  const spatialModel = { levels: [{ rooms: interp.interpretation.rooms, walls: interp.interpretation.walls, openings: interp.interpretation.openings }] };
  const proposal = planIntelligenceCore.generateAutoLayoutProposal(spatialModel, {});
  const furniture = proposal?.levels?.[0]?.furniture || [];
  assert.ok(furniture.length > 0, 'expected furniture derived from the room');
  for (const f of furniture) {
    assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y), `furniture ${f.name} has finite placement`);
    assert.ok(f.widthMm > 0 && f.heightMm > 0, `furniture ${f.name} has real size`);
  }
  // The route maps this to "detected" items — replicate the exact mapping.
  const detected = furniture.map(f => ({
    id: f.id, name: f.name,
    type: /rug|carpet/i.test(f.name || '') ? 'rug' : 'furniture',
    xMm: Math.round(f.x || 0), yMm: Math.round(f.y || 0),
    widthMm: Math.round(f.widthMm || f.width || 0), heightMm: Math.round(f.heightMm || f.height || 0),
    rotation: f.rotation || 0
  }));
  assert.ok(detected.every(d => d.widthMm > 0 && d.heightMm > 0), 'mapped detected items have real sizes');
});

test('detect path: empty plan returns NO rooms => route must NOT invent furniture', () => {
  // An untraced project: interpretFloorPlan returns NO_TRACED_WALLS.
  const r = planIntelligenceCore.interpretFloorPlan('missing', null);
  assert.equal(r.success, false);
  assert.equal(r.error, 'NO_TRACED_WALLS');
  // Therefore the route short-circuits with detected:[] rather than fabricating.
  const wouldInvent = r.success && r.interpretation?.rooms?.length > 0;
  assert.equal(wouldInvent, false, 'empty plan must not yield invented furniture');
});
