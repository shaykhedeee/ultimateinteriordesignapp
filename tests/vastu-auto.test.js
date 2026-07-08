/**
 * tests/vastu-auto.test.js
 * Guards the auto-Vastu mutation: add Pooja if absent, move beds out of forbidden zones.
 * node --test (no deps beyond the app db singleton).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { previewVastu, applyVastu } from '../server/services/vastu-auto.js';

function seedCad(projectId, { furniture = [], rooms = [] } = {}) {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  db.prepare("INSERT INTO projects (id, name, client_name, status) VALUES (?, 'Vastu Test', 'Test Client', 'active')").run(projectId);
  db.prepare(`
    INSERT INTO cad_drawings (project_id, walls_json, openings_json, furniture_json, rooms_json, pixels_per_meter)
    VALUES (?, '[]', '[]', ?, ?, 40)
  `).run(projectId, JSON.stringify(furniture), JSON.stringify(rooms));
}

test('previewVastu: flags missing Pooja + forbidden bed zone', () => {
  const pid = 'vastu_preview_1';
  seedCad(pid, {
    furniture: [
      { id: 'f_bed1', type: 'bed', name: 'Master Bed', vastuZone: 'NE', x: 100, y: 100 },
    ],
    rooms: [{ id: 'r1', name: 'Bedroom', points: [{ x: 80, y: 80 }], vastuZone: 'NE' }],
  });
  const p = previewVastu(pid);
  assert.equal(p.ok, true);
  assert.equal(p.poojaPresent, false, 'no pooja detected');
  const add = p.changes.find(c => c.kind === 'add_pooja');
  assert.ok(add, 'pooja addition proposed');
  assert.equal(add.zone, 'NE');
  const mv = p.changes.find(c => c.kind === 'move_bed');
  assert.ok(mv, 'bed move proposed');
  assert.equal(mv.fromZone, 'NE');
  assert.equal(mv.toZone, 'SW');
});

test('applyVastu: writes Pooja into furniture + moves bed to SW', () => {
  const pid = 'vastu_apply_1';
  seedCad(pid, {
    furniture: [
      { id: 'f_bed1', type: 'bed', name: 'Master Bed', vastuZone: 'NE', x: 100, y: 100 },
    ],
    rooms: [{ id: 'r1', name: 'Bedroom', points: [{ x: 80, y: 80 }], vastuZone: 'NE' }],
  });
  const res = applyVastu(pid);
  assert.equal(res.ok, true);
  assert.ok(res.applied.length >= 2, 'applied pooja + bed move');

  const after = JSON.parse(db.prepare('SELECT furniture_json FROM cad_drawings WHERE project_id = ?').get(pid).furniture_json);
  const pooja = after.find(f => f.type === 'pooja');
  assert.ok(pooja, 'pooja present after apply');
  const bed = after.find(f => f.id === 'f_bed1');
  assert.equal(bed.vastuZone, 'SW', 'bed relocated to SW');
});

test('applyVastu: idempotent — no changes on a compliant plan', () => {
  const pid = 'vastu_idem_1';
  seedCad(pid, {
    furniture: [
      { id: 'f_pooja', type: 'pooja', name: 'Mandir', x: 150, y: 250 },
      { id: 'f_bed1', type: 'bed', name: 'Master Bed', vastuZone: 'SW', x: 400, y: 800 },
    ],
  });
  const res = applyVastu(pid);
  assert.equal(res.ok, true);
  assert.equal(res.applied.length, 0, 'nothing to change on a Vastu-compliant plan');
});
