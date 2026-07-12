/**
 * tests/vastu-text-orientation.test.js
 * Guards the TEXT-UNDERSTANDING layer: parsePlanText reads directional cues
 * written on/about the plan ("west entrance", room labels, free-text pairs),
 * and interpretVastuText derives a valid orientation + entrance direction.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { parsePlanText, interpretVastuText, analyzeVastuPlan, VastuCompassData } from '../server/services/vastu-auto.js';

const PID = 'vastu_text_' + Date.now();

function seed({ furniture = [], rooms = [], openings = [], planText = '', northAngle = 0 } = {}) {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
  db.prepare("INSERT INTO projects (id, name, client_name, status) VALUES (?, 'Vastu Text', 'Test', 'active')").run(PID);
  db.prepare(`INSERT INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json, pixels_per_meter, plan_text, north_angle)
    VALUES (?, ?, '[]', ?, ?, ?, 40, ?, ?)`).run('cd_' + PID, PID, JSON.stringify(openings), JSON.stringify(furniture), JSON.stringify(rooms), planText, northAngle);
}
function cleanup() {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
}

test('parsePlanText: extracts entrance direction from "west entrance"', () => {
  const r = parsePlanText({ rooms: [], openings: [], planText: 'west entrance, north kitchen' });
  assert.equal(r.entrance, 'W', 'entrance = West');
});

test('parsePlanText: handles "main door north" and "entry east" variants', () => {
  assert.equal(parsePlanText({ planText: 'main door north' }).entrance, 'N');
  assert.equal(parsePlanText({ planText: 'entry is in the east' }).entrance, 'E');
});

test('parsePlanText: reads room-name embedded directions (north kitchen)', () => {
  const r = parsePlanText({ rooms: [{ id: 'k1', name: 'North Kitchen', type: 'kitchen' }], planText: '' });
  assert.equal(r.roomHints['k1'], 'N', 'room label "North Kitchen" -> N');
});

test('parsePlanText: reads free-text "zone room" pairs (SE toilet)', () => {
  const r = parsePlanText({ rooms: [{ id: 't1', name: 'Toilet', type: 'toilet' }], planText: 'se toilet and sw master bedroom' });
  assert.equal(r.roomHints['t1'], 'SE', 'SE toilet parsed');
});

test('parsePlanText: reads door labels from openings metadata', () => {
  const r = parsePlanText({ openings: [{ id: 'd1', label: 'Main Entrance', direction: 'south' }], planText: '' });
  assert.equal(r.entrance, 'S');
});

test('parsePlanText: "north is at the bottom" flips plotNorthTop', () => {
  const r = parsePlanText({ planText: 'north is at the bottom' });
  assert.equal(r.plotNorthTop, false);
});

test('interpretVastuText: returns ok with a finite northAngle and no crash on text', () => {
  seed({ rooms: [{ id: 'k1', name: 'Kitchen', type: 'kitchen', points: [{ x: 600, y: 600 }, { x: 1000, y: 600 }, { x: 1000, y: 1000 }, { x: 600, y: 1000 }] }],
         openings: [{ id: 'd1', label: 'Main Entrance', x: 500, y: 1000 }], planText: 'west entrance' });
  const r = interpretVastuText(PID);
  assert.equal(r.ok, true);
  assert.equal(r.entranceZone, 'W', 'entrance derived');
  assert.ok(Number.isFinite(r.northAngle), 'northAngle finite');
  cleanup();
});

test('analyzeVastuPlan: uses text orientation to re-derive room zones', () => {
  // A kitchen named "North Kitchen" should be read as N (text beats bbox).
  seed({ rooms: [{ id: 'k1', name: 'North Kitchen', type: 'kitchen', points: [{ x: 0, y: 600 }, { x: 400, y: 600 }, { x: 400, y: 1000 }, { x: 0, y: 1000 }] }],
         furniture: [{ id: 'st1', type: 'stove', name: 'Burner', x: 100, y: 800 }], planText: 'north kitchen' });
  const a = analyzeVastuPlan(PID);
  const k = a.roomReports.find(r => r.id === 'k1');
  assert.equal(k.textZone, 'N', 'kitchen text-zone = N');
  assert.equal(k.zone, 'N', 'effective zone uses text');
  cleanup();
});

test('VastuCompassData: exports 9 zones for illustration', () => {
  assert.equal(VastuCompassData.length, 9, '9 zones for compass rendering');
});
