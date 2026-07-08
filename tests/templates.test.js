/**
 * tests/templates.test.js
 * Guards kitchen U/L template + TV-unit library apply logic.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { applyKitchenTemplate } from '../server/services/kitchen-templates.js';
import { getTvUnitLibrary, applyTvUnit } from '../server/services/tv-unit-library.js';

function seed(pid, { furniture = [], rooms = [] } = {}) {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(pid);
  db.prepare('DELETE FROM projects WHERE id = ?').run(pid);
  db.prepare("INSERT INTO projects (id, name, client_name, status) VALUES (?, 'T', 'C', 'active')").run(pid);
  db.prepare('INSERT INTO cad_drawings (project_id, walls_json, openings_json, furniture_json, rooms_json, pixels_per_meter) VALUES (?, ?, ?, ?, ?, 40)')
    .run(pid, '[]', '[]', JSON.stringify(furniture), JSON.stringify(rooms));
}

test('kitchen-templates: U-shape adds 6 kitchen modules', () => {
  const pid = 'kt_u_1';
  seed(pid, { rooms: [{ id: 'r_k', name: 'Kitchen', points: [{ x: 600, y: 100 }] }] });
  const r = applyKitchenTemplate(pid, 'U');
  assert.equal(r.ok, true);
  assert.equal(r.shape, 'U');
  assert.equal(r.applied, 6);
  const f = JSON.parse(db.prepare('SELECT furniture_json FROM cad_drawings WHERE project_id = ?').get(pid).furniture_json);
  assert.ok(f.filter(x => /kitchen/.test(x.type)).length >= 6);
});

test('kitchen-templates: L-shape adds 4 modules and replaces prior shape', () => {
  const pid = 'kt_l_1';
  seed(pid, { rooms: [{ id: 'r_k', name: 'Kitchen', points: [{ x: 600, y: 100 }] }] });
  applyKitchenTemplate(pid, 'U');
  const r = applyKitchenTemplate(pid, 'L');
  assert.equal(r.shape, 'L');
  assert.equal(r.applied, 4);
});

test('tv-unit-library: library has 12+ styles and apply inserts one tv-unit', () => {
  const pid = 'tv_1';
  seed(pid, { rooms: [{ id: 'r_l', name: 'Living Room', points: [{ x: 200, y: 100 }] }] });
  assert.ok(getTvUnitLibrary().length >= 12, 'vast library');
  const r = applyTvUnit(pid, 'tv_louvered_walnut');
  assert.equal(r.ok, true);
  const f = JSON.parse(db.prepare('SELECT furniture_json FROM cad_drawings WHERE project_id = ?').get(pid).furniture_json);
  assert.ok(f.find(x => x.type === 'tv-unit'), 'tv-unit present');
  // re-apply a different style swaps (no duplicate)
  applyTvUnit(pid, 'tv_japandi');
  const f2 = JSON.parse(db.prepare('SELECT furniture_json FROM cad_drawings WHERE project_id = ?').get(pid).furniture_json);
  assert.equal(f2.filter(x => x.type === 'tv-unit').length, 1, 'swaps cleanly');
});
