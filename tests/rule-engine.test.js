// Regression tests for rule-engine.js — design-rule evaluation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ruleEngine from '../server/services/rule-engine.js';

const baseScene = (over = {}) => ({
  projectId: 'p1',
  levels: [{ rooms: [], walls: [], openings: [], furniture: [], ...over }]
});

test('zero-length wall fails the GEOM_WALL_LEN hard rule', () => {
  const r = ruleEngine.evaluateScene(baseScene({
    walls: [{ id: 'w1', x1: 0, y1: 0, x2: 0, y2: 0 }]
  }));
  const wall = r.results.find(x => x.ruleCode === 'GEOM_WALL_LEN');
  assert.ok(wall && wall.status === 'fail', 'zero-length wall must hard-fail');
});

test('opening wider than its wall fails GEOM_OPENING_BOUNDS', () => {
  const r = ruleEngine.evaluateScene(baseScene({
    walls: [{ id: 'w1', x1: 0, y1: 0, x2: 100, y2: 0 }], // 100 units *25 = 2500mm
    openings: [{ id: 'o1', wallId: 'w1', width: 3000 }]
  }));
  const op = r.results.find(x => x.ruleCode === 'GEOM_OPENING_BOUNDS');
  assert.ok(op && op.status === 'fail', 'oversized opening must fail');
});

test('kitchen in SE zone passes; kitchen elsewhere warns (VASTU_KITCHEN_ZONE)', () => {
  const se = ruleEngine.evaluateScene(baseScene({
    rooms: [{ type: 'kitchen', points: [{ x: 600, y: 600 }, { x: 800, y: 600 }, { x: 800, y: 800 }, { x: 600, y: 800 }] }]
  }));
  const seRule = se.results.find(x => x.ruleCode === 'VASTU_KITCHEN_ZONE');
  assert.equal(seRule, undefined, 'kitchen in SE should not warn');

  const nw = ruleEngine.evaluateScene(baseScene({
    rooms: [{ type: 'kitchen', points: [{ x: 200, y: 200 }, { x: 400, y: 200 }, { x: 400, y: 400 }, { x: 200, y: 400 }] }]
  }));
  const nwRule = nw.results.find(x => x.ruleCode === 'VASTU_KITCHEN_ZONE');
  assert.ok(nwRule && nwRule.status === 'warn', 'kitchen outside SE should warn');
});

test('pooja in NE zone passes; elsewhere warns (VASTU_MANDIR_ZONE)', () => {
  const ne = ruleEngine.evaluateScene(baseScene({
    rooms: [{ type: 'pooja', points: [{ x: 600, y: 200 }, { x: 800, y: 200 }, { x: 800, y: 400 }, { x: 600, y: 400 }] }]
  }));
  assert.equal(ne.results.find(x => x.ruleCode === 'VASTU_MANDIR_ZONE'), undefined, 'pooja in NE should not warn');

  const sw = ruleEngine.evaluateScene(baseScene({
    rooms: [{ type: 'pooja', points: [{ x: 200, y: 600 }, { x: 400, y: 600 }, { x: 400, y: 800 }, { x: 200, y: 800 }] }]
  }));
  assert.ok(sw.results.find(x => x.ruleCode === 'VASTU_MANDIR_ZONE')?.status === 'warn');
});

test('hob and sink closer than 900mm fails CLEARANCE_HOB_SINK', () => {
  const r = ruleEngine.evaluateScene(baseScene({
    furniture: [
      { libraryId: 'kitchen_sink_unit', x: 100, y: 100 },
      { libraryId: 'kitchen_hob_unit', x: 110, y: 100 } // ~250mm apart
    ]
  }));
  const c = r.results.find(x => x.ruleCode === 'CLEARANCE_HOB_SINK');
  assert.ok(c && c.status === 'fail', 'hob/sink too close must fail');
});

test('room with NO points does not crash the whole evaluation', () => {
  const r = ruleEngine.evaluateScene(baseScene({
    rooms: [{ type: 'bedroom', name: 'M1' }] // no points
  }));
  assert.ok(Array.isArray(r.results), 'evaluation must complete');
  const flagged = r.results.find(x => x.ruleCode === 'GEOM_ROOM_POINTS');
  assert.ok(flagged && flagged.status === 'warn', 'malformed room should be flagged, not crash');
});

test('wardrobe clearance is an honest advisory (not a fabricated pass)', () => {
  const r = ruleEngine.evaluateScene(baseScene({
    furniture: [{ libraryId: 'wardrobe_double', name: 'W1' }]
  }));
  const w = r.results.find(x => x.ruleCode === 'CLEARANCE_WARDROBE_FRONT');
  assert.ok(w, 'wardrobe rule should emit');
  assert.equal(w.status, 'warn', 'must not claim a measured pass');
  assert.equal(w.measured.clearanceMm, null, 'clearance is not measured from plan');
});

test('score is a sane 0..100 number', () => {
  const r = ruleEngine.evaluateScene(baseScene({
    walls: [{ id: 'w1', x1: 0, y1: 0, x2: 100, y2: 0 }],
    rooms: [{ type: 'kitchen', points: [{ x: 600, y: 600 }, { x: 800, y: 600 }, { x: 800, y: 800 }, { x: 600, y: 800 }] }]
  }));
  assert.ok(r.summary.score >= 0 && r.summary.score <= 100);
});
