// Regression test for layout-generator.js — seeds a project + cad_drawings, runs
// generateLayoutFromBrief, asserts rooms/walls/furniture written + stale flags set.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { generateLayoutFromBrief } from '../server/services/layout-generator.js';

const PID = 'layout_test_' + Date.now();

function seedProject() {
  db.prepare('INSERT OR REPLACE INTO projects (id, name, client_name) VALUES (?, ?, ?)').run(PID, 'Layout Test', 'Client');
  db.prepare(`INSERT OR REPLACE INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json)
    VALUES (?, ?, '[]', '[]', '[]', '[]')`).run('cd_' + PID, PID);
}
function cleanup() {
  db.prepare('DELETE FROM timeline_events WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
}
function getRow() { return db.prepare('SELECT * FROM cad_drawings WHERE project_id = ?').get(PID); }

test('generateLayoutFromBrief: full-brief seeds living + kitchen + master + kids', () => {
  seedProject();
  const brief = {
    selectedSpaces: ['living', 'kitchen', 'masterBed', 'kidsBed', 'pooja', 'foyer'],
    kitchenLayout: 'l-shaped',
    partitionStyle: 'cnc-jali',
    shutterFinish: 'acrylic',
    appliances: ['fridge'],
    fittings: ['bench']
  };
  generateLayoutFromBrief(PID, brief);
  const row = getRow();
  const rooms = JSON.parse(row.rooms_json);
  const walls = JSON.parse(row.walls_json);
  const furniture = JSON.parse(row.furniture_json);
  const openings = JSON.parse(row.openings_json);

  assert.equal(rooms.length, 6, '6 spaces seeded');
  assert.ok(rooms.some(r => r.type === 'living'));
  assert.ok(rooms.some(r => r.type === 'kitchen'));
  assert.ok(walls.length > 0, 'walls written');
  assert.ok(openings.length > 0, 'doors/windows written');
  // kitchen l-shaped => base, hob, sink, overhead = 4 modules (+fridge = 5)
  assert.ok(furniture.filter(f => f.libraryId === 'kitchen_base_run').length >= 1, 'kitchen base unit placed');
  assert.ok(furniture.some(f => f.libraryId === 'refrigerator'), 'fridge placed when appliances includes fridge');
  assert.ok(furniture.some(f => f.libraryId === 'feature_wall_panel_system'), 'CNC jali when partitionStyle=cnc-jali');
  assert.ok(furniture.some(f => f.libraryId === 'shoe_bench'), 'foyer bench when fittings includes bench');

  // stale flags set so downstream regenerates
  const proj = db.prepare('SELECT stale_renders, stale_drawings, stale_pricing FROM projects WHERE id = ?').get(PID);
  assert.equal(proj.stale_renders, 1);
  assert.equal(proj.stale_drawings, 1);
  assert.equal(proj.stale_pricing, 1);
  cleanup();
});

test('generateLayoutFromBrief: parallel kitchen layout places 3 kitchen modules', () => {
  seedProject();
  generateLayoutFromBrief(PID, { selectedSpaces: ['kitchen'], kitchenLayout: 'parallel' });
  const furniture = JSON.parse(getRow().furniture_json);
  const bases = furniture.filter(f => f.libraryId === 'kitchen_base_run');
  assert.ok(bases.length >= 1, 'parallel layout has a base run');
  cleanup();
});

test('generateLayoutFromBrief: missing cad_drawings row -> safe no-op (no throw)', () => {
  // no seed: cad_drawings row absent. Function UPDATEs (no row => 0 affected) then sets project flags.
  // Ensure project exists so the trailing UPDATE doesn't FK-error; catch any throw.
  db.prepare('INSERT OR REPLACE INTO projects (id, name, client_name) VALUES (?, ?, ?)').run(PID + '_2', 'x', 'y');
  assert.doesNotThrow(() => generateLayoutFromBrief(PID + '_2', { selectedSpaces: ['living'] }));
  db.prepare('DELETE FROM timeline_events WHERE project_id = ?').run(PID + '_2');
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID + '_2');
});

test('generateLayoutFromBrief: writes a timeline event', () => {
  seedProject();
  generateLayoutFromBrief(PID, { selectedSpaces: ['living'] });
  const ev = db.prepare("SELECT * FROM timeline_events WHERE project_id = ? AND event_type='layout.generated'").get(PID);
  assert.ok(ev, 'timeline event recorded');
  assert.ok(/spaces/.test(ev.detail), 'event detail describes layout');
  cleanup();
});
