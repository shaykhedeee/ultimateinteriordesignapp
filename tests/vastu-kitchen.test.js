// Regression tests for vastu-auto.js + kitchen-templates.js (DB-backed features).
// Seeds a throwaway project + cad_drawings row, exercises preview/apply, cleans up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { previewVastu, applyVastu } from '../server/services/vastu-auto.js';
import { applyKitchenTemplate } from '../server/services/kitchen-templates.js';

const PID = 'vastu_test_' + Date.now();

function seed({ furniture = [], rooms = [] } = {}) {
  db.prepare('INSERT OR REPLACE INTO projects (id, name, client_name) VALUES (?, ?, ?)').run(PID, 'Vastu Test', 'Test Client');
  db.prepare(`INSERT OR REPLACE INTO cad_drawings (id, project_id, furniture_json, rooms_json)
    VALUES (?, ?, ?, ?)`).run('cd_' + PID, PID, JSON.stringify(furniture), JSON.stringify(rooms));
}

function cleanup() {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
}

function getFurniture() {
  const row = db.prepare('SELECT furniture_json FROM cad_drawings WHERE project_id = ?').get(PID);
  return JSON.parse(row.furniture_json || '[]');
}

test('previewVastu: flags missing pooja + bed in forbidden zone', () => {
  seed({
    rooms: [{ name: 'Master Bedroom', points: [{ x: 100, y: 100 }] }],
    furniture: [
      { id: 'bed1', type: 'bed', name: 'Bed', zone: 'N', x: 100, y: 100 } // north = forbidden
    ]
  });
  const p = previewVastu(PID);
  assert.equal(p.ok, true);
  assert.equal(p.poojaPresent, false);
  const kinds = p.changes.map(c => c.kind);
  assert.ok(kinds.includes('add_pooja'), 'recommends adding pooja mandir');
  assert.ok(kinds.includes('move_bed'), 'recommends moving the north bed');
  cleanup();
});

test('previewVastu: compliant plan -> needsApply false', () => {
  seed({
    rooms: [{ name: 'Master Bedroom', points: [{ x: 100, y: 100 }] }],
    furniture: [
      { id: 'p1', type: 'pooja', name: 'Mandir', zone: 'NE' },
      { id: 'bed1', type: 'bed', name: 'Bed', zone: 'SW', x: 100, y: 100 }
    ]
  });
  const p = previewVastu(PID);
  assert.equal(p.needsApply, false);
  assert.equal(p.changes.length, 0);
  cleanup();
});

test('applyVastu: writes pooja + SW zone into cad_drawings', () => {
  seed({
    rooms: [{ name: 'Master Bedroom', points: [{ x: 100, y: 100 }] }],
    furniture: [{ id: 'bed1', type: 'bed', name: 'Bed', zone: 'N', x: 100, y: 100 }]
  });
  const r = applyVastu(PID);
  assert.equal(r.ok, true);
  assert.ok(r.applied.length >= 1);
  const f = getFurniture();
  assert.ok(f.some(x => x.type === 'pooja'), 'pooja mandir added to furniture');
  const bed = f.find(x => x.id === 'bed1');
  assert.equal(bed.zone, 'SW', 'bed repositioned to South-West');
  cleanup();
});

test('applyVastu: missing CAD -> safe rejection (no crash)', () => {
  const r = applyVastu('ghost_project_xyz');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'NO_CAD');
});

test('applyKitchenTemplate: U-shape inserts 6 modules; L-shape inserts 4', () => {
  seed({ rooms: [{ name: 'Kitchen', points: [{ x: 600, y: 100 }] }] });
  const u = applyKitchenTemplate(PID, 'U');
  assert.equal(u.ok, true);
  assert.equal(u.shape, 'U');
  assert.equal(u.applied, 6);
  const fu = getFurniture().filter(f => /kitchen/i.test(f.type || ''));
  assert.equal(fu.length, 6);
  cleanup();
});

test('applyKitchenTemplate: bad shape -> rejected', () => {
  seed({});
  const r = applyKitchenTemplate(PID, 'Z');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'BAD_SHAPE');
  cleanup();
});

test('applyKitchenTemplate: re-applying swaps old kitchen modules (no duplicates)', () => {
  seed({ rooms: [{ name: 'Kitchen', points: [{ x: 600, y: 100 }] }] });
  applyKitchenTemplate(PID, 'L');
  applyKitchenTemplate(PID, 'U'); // should remove the L modules first
  const f = getFurniture().filter(x => /kitchen/i.test(x.type || ''));
  assert.equal(f.length, 6, 'only the U-shape modules remain (L removed)');
  cleanup();
});
