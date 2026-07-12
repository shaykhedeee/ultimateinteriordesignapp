import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import planIntelligenceCore from '../server/services/plan-intelligence-core.js';
import { findReusableAssets, matchLaminates } from '../server/services/design-engine.js';

function seedProject(prefix) {
  const id = prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
  db.prepare("INSERT INTO projects (id, name, client_name, status, budget) VALUES (?, ?, ?, ?, ?)")
    .run(id, prefix, 'Audit', 'active', 1000000);
  return id;
}

// A simple two-room plan: an L-shaped-ish wall set forming a Kitchen (top-left)
// and a Bedroom (bottom-right), traced as closed rectangles.
function seedTracedWalls(projectId) {
  const walls = [
    // Kitchen room rectangle (top-left)
    { id: 'w1', x1: 0, y1: 0, x2: 4000, y2: 0 },
    { id: 'w2', x1: 4000, y1: 0, x2: 4000, y2: 3000 },
    { id: 'w3', x1: 4000, y1: 3000, x2: 0, y2: 3000 },
    { id: 'w4', x1: 0, y1: 3000, x2: 0, y2: 0 },
    // Bedroom room rectangle (bottom-right)
    { id: 'w5', x1: 4000, y1: 3000, x2: 8000, y2: 3000 },
    { id: 'w6', x1: 8000, y1: 3000, x2: 8000, y2: 6000 },
    { id: 'w7', x1: 8000, y1: 6000, x2: 4000, y2: 6000 },
    { id: 'w8', x1: 4000, y1: 6000, x2: 4000, y2: 3000 }
  ];
  db.prepare(`INSERT INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json, pixels_per_meter, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('cad_' + projectId, projectId, JSON.stringify(walls), JSON.stringify([]), JSON.stringify([]), JSON.stringify([]), 4, new Date().toISOString());
}

test('floor-plan analyzer detects rooms from traced walls', () => {
  const pid = seedProject('fp_an');
  seedTracedWalls(pid);
  const interp = planIntelligenceCore.interpretFloorPlan(pid, null);
  assert.equal(interp.success, true);
  assert.ok(interp.interpretation.rooms.length >= 2, 'should detect >=2 rooms, got ' + interp.interpretation.rooms.length);
  // every detected room has area + type
  for (const r of interp.interpretation.rooms) {
    assert.ok(r.areaMm2 > 0, 'room area must be positive');
    assert.ok(typeof r.type === 'string');
  }
});

test('auto-layout proposal places furniture per room', () => {
  const pid = seedProject('fp_lo');
  seedTracedWalls(pid);
  const interp = planIntelligenceCore.interpretFloorPlan(pid, null);
  const spatialModel = {
    levels: [{ levelId: 'level_0', name: 'Ground Floor', elevationMm: 0,
      rooms: interp.interpretation.rooms.map(r => ({ id: r.id, type: r.type, name: r.name, points: r.points })),
      walls: interp.interpretation.walls, openings: interp.interpretation.openings }]
  };
  const layout = planIntelligenceCore.generateAutoLayoutProposal(spatialModel, {});
  const furn = layout.levels[0].furniture;
  assert.ok(furn.length > 0, 'should place furniture');
  // at least one downlight per room
  assert.ok(layout.levels[0].lights.length > 0);
});

test('enhancer flags a missing Pooja room as high priority', () => {
  const pid = seedProject('fp_en');
  seedTracedWalls(pid);
  const interp = planIntelligenceCore.interpretFloorPlan(pid, null);
  const spatialModel = {
    levels: [{ levelId: 'level_0', name: 'Ground Floor', elevationMm: 0,
      rooms: interp.interpretation.rooms.map(r => ({ id: r.id, type: r.type, name: r.name, points: r.points })),
      walls: interp.interpretation.walls, openings: interp.interpretation.openings }]
  };
  const layout = planIntelligenceCore.generateAutoLayoutProposal(spatialModel, {});
  const enh = planIntelligenceCore.enhanceFloorPlan({ interpretation: interp.interpretation, layout, northAngle: 0 });
  assert.equal(enh.success, true);
  assert.ok(enh.suggestions.length > 0, 'should produce suggestions');
  const pooja = enh.suggestions.find(s => s.id === 'enh_pooja');
  assert.ok(pooja, 'missing Pooja room should be flagged');
  assert.equal(pooja.severity, 'high');
  assert.equal(pooja.target.kind, 'add_room');
  assert.equal(pooja.target.preferredZone, 'NE');
  // score is a 0-100 number
  assert.ok(enh.score >= 0 && enh.score <= 100);
});

test('design-engine matchLaminates returns a palette', () => {
  const pid = seedProject('fp_lam');
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(pid);
  const lams = matchLaminates(project, {});
  assert.ok(Array.isArray(lams) && lams.length > 0);
  assert.ok(lams[0].name && lams[0].finish);
});

test('design-engine findReusableAssets is safe (returns array)', () => {
  const assets = findReusableAssets({ room: 'kitchen' });
  assert.ok(Array.isArray(assets));
});
