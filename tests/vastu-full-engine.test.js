/**
 * tests/vastu-full-engine.test.js
 * Guards the FULL Vastu engine: geometric floor-plan scan, classification of
 * EVERY furniture type, per-item compliance, ideal blueprint, and full apply.
 *
 * Geometry convention: North = up (min-y). The 9 zones are derived from the
 * plan bounding-box quadrants, so:
 *   NE = top-right,  NW = top-left,  SE = bottom-right,  SW = bottom-left.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { analyzeVastuPlan, suggestVastuLayout, applyVastuFull, previewVastu, applyVastu, VASTU_FURNITURE_RULES } from '../server/services/vastu-auto.js';

const PID = 'vastu_full_' + Date.now();

function seed({ furniture = [], rooms = [] } = {}) {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
  db.prepare("INSERT INTO projects (id, name, client_name, status) VALUES (?, 'Vastu Full', 'Test', 'active')").run(PID);
  db.prepare(`INSERT INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json, pixels_per_meter)
    VALUES (?, ?, '[]', '[]', ?, ?, 40)`).run('cd_' + PID, PID, JSON.stringify(furniture), JSON.stringify(rooms));
}
function cleanup() {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
}
function getFurniture() {
  const row = db.prepare('SELECT furniture_json FROM cad_drawings WHERE project_id = ?').get(PID);
  return JSON.parse(row.furniture_json || '[]');
}

// Quadrant-correct rooms (plan bounding box x:[0,1000], y:[0,1000]).
const ROOMS = [
  { id: 'r_ne', name: 'Pooja Room',    points: [{ x: 600, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 400 }, { x: 600, y: 400 }] }, // NE
  { id: 'r_nw', name: 'Study',         points: [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 400 }, { x: 0, y: 400 }] },         // NW
  { id: 'r_sw', name: 'Master Bedroom',points: [{ x: 0, y: 600 }, { x: 400, y: 600 }, { x: 400, y: 1000 }, { x: 0, y: 1000 }] },     // SW
  { id: 'r_se', name: 'Kitchen',       points: [{ x: 600, y: 600 }, { x: 1000, y: 600 }, { x: 1000, y: 1000 }, { x: 600, y: 1000 }] }, // SE
  { id: 'r_s',  name: 'Living',        points: [{ x: 400, y: 600 }, { x: 600, y: 600 }, { x: 600, y: 1000 }, { x: 400, y: 1000 }] },  // S
];

test('analyzeVastuPlan: scans geometry and classifies every furniture item', () => {
  seed({
    rooms: ROOMS,
    furniture: [
      { id: 'bed1', type: 'bed', name: 'Master Bed', x: 200, y: 800 },        // SW -> compliant
      { id: 'stove1', type: 'stove', name: 'Burner', x: 800, y: 800 },        // SE -> compliant
      { id: 'sofa1', type: 'sofa', name: 'Sofa', x: 500, y: 800 },             // S -> compliant
      { id: 'tv1', type: 'tv_unit', name: 'TV', x: 500, y: 620 },              // S -> compliant
      { id: 'bad', type: 'bed', name: 'Kids Bed', x: 800, y: 200 },            // NE -> violation
      { id: 'mirr', type: 'mirror', name: 'Mirror', x: 200, y: 950 },          // SW -> violation (mirror banned SW)
    ],
  });
  const a = analyzeVastuPlan(PID);
  assert.equal(a.ok, true);
  assert.ok(a.bounds, 'plan bounds computed from geometry');
  assert.equal(a.items.length, 6, 'all furniture items classified');

  const bad = a.items.find(i => i.id === 'bad');
  assert.equal(bad.status, 'violation', 'NE bed flagged');
  assert.equal(bad.suggestion.zone, 'SW', 'bed suggests SW');
  assert.ok(bad.suggestion.target, 'bed has a target coordinate');

  const mirr = a.items.find(i => i.id === 'mirr');
  assert.equal(mirr.status, 'violation', 'SW mirror flagged');
  assert.equal(mirr.suggestion.zone, 'N', 'mirror suggests North');

  const good = a.items.find(i => i.id === 'bed1');
  assert.equal(good.status, 'compliant', 'SW bed compliant');

  cleanup();
});

test('analyzeVastuPlan: proposes missing Pooja in NE', () => {
  seed({ rooms: ROOMS, furniture: [{ id: 'bed1', type: 'bed', name: 'Bed', x: 200, y: 800 }] });
  const a = analyzeVastuPlan(PID);
  assert.ok(a.missingKeyItems.some(m => m.key === 'pooja' && m.zone === 'NE'), 'recommends NE pooja');
  cleanup();
});

test('applyVastuFull: repositions violating items + adds pooja, persists to DB', () => {
  seed({
    rooms: ROOMS,
    furniture: [
      { id: 'bad', type: 'bed', name: 'Kids Bed', x: 800, y: 200 },  // NE
      { id: 'good', type: 'bed', name: 'Master Bed', x: 200, y: 800 }, // SW
    ],
  });
  const r = applyVastuFull(PID);
  assert.equal(r.ok, true);
  const f = getFurniture();
  const bad = f.find(x => x.id === 'bad');
  const pooja = f.find(x => x.type === 'pooja');
  assert.equal(bad.zone, 'SW', 'NE bed moved to SW');
  assert.ok(pooja, 'pooja mandir added');
  assert.equal(pooja.vastuZone, 'NE');
  const good = f.find(x => x.id === 'good');
  assert.equal(good.x, 200, 'compliant bed left in place');
  assert.equal(good.y, 800, 'compliant bed not moved');
  cleanup();
});

test('applyVastuFull: idempotent on an already-compliant plan', () => {
  seed({
    rooms: ROOMS,
    furniture: [
      { id: 'p1', type: 'pooja', name: 'Mandir', x: 800, y: 100 },   // NE
      { id: 'b1', type: 'bed', name: 'Bed', x: 200, y: 800 },        // SW
    ],
  });
  const r = applyVastuFull(PID);
  assert.equal(r.ok, true);
  assert.equal(r.applied.length, 0, 'nothing to change');
  cleanup();
});

test('suggestVastuLayout: returns ideal items per room zone', () => {
  seed({ rooms: ROOMS });
  const s = suggestVastuLayout(PID);
  assert.equal(s.ok, true);
  const ne = s.perRoom.find(p => p.room === 'Pooja Room');
  assert.ok(ne.suggestions.some(x => x.category === 'pooja'), 'NE room suggests pooja');
  const se = s.perRoom.find(p => p.room === 'Kitchen');
  assert.ok(se.suggestions.some(x => x.category === 'stove' || x.category === 'kitchen'), 'SE room suggests kitchen/stove');
  const sw = s.perRoom.find(p => p.room === 'Master Bedroom');
  assert.ok(sw.suggestions.some(x => x.category === 'bed_master' || x.category === 'bed'), 'SW room suggests bed');
  cleanup();
});

test('legacy previewVastu/applyVastu still pass (back-compat)', () => {
  seed({ rooms: [{ id: 'r1', name: 'Bedroom', points: [{ x: 80, y: 80 }], vastuZone: 'NE' }],
        furniture: [{ id: 'f_bed1', type: 'bed', name: 'Master Bed', vastuZone: 'NE', x: 100, y: 100 }] });
  const p = previewVastu(PID);
  assert.equal(p.poojaPresent, false);
  assert.ok(p.changes.find(c => c.kind === 'add_pooja'));
  assert.ok(p.changes.find(c => c.kind === 'move_bed'));
  const r = applyVastu(PID);
  assert.ok(r.applied.length >= 2);
  cleanup();
});

test('VASTU_FURNITURE_RULES covers the full furniture matrix', () => {
  const expected = ['pooja','bed_master','bed_kids','bed_guest','bed','stove','kitchen','dining','sofa','tv_unit','study_desk','wardrobe','safe','mirror','aquarium','plant','toilet','stairs','washing','fridge','computer','heavy_storage'];
  for (const k of expected) {
    assert.ok(VASTU_FURNITURE_RULES[k], `rule present for ${k}`);
    assert.ok(Array.isArray(VASTU_FURNITURE_RULES[k].ideal) && VASTU_FURNITURE_RULES[k].ideal.length > 0, `${k} has ideal zones`);
  }
});

test('analyzeVastuPlan: no CAD -> safe rejection (no crash)', () => {
  const r = analyzeVastuPlan('ghost_vastu_xyz');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'NO_CAD');
});
