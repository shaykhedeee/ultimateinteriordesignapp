/**
 * tests/room-detect.test.js
 * Guards planar room detection: a single closed rectangle must yield exactly
 * ONE room (not two — the inner/outer half-edge traversal pair bug).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import core from '../server/services/plan-intelligence-core.js';

// A single 4200 x 3600 mm rectangle as 4 wall segments (coords already in mm).
const rectWalls = [
  { x1: 0, y1: 0, x2: 4200, y2: 0, thicknessMm: 230 },
  { x1: 4200, y1: 0, x2: 4200, y2: 3600, thicknessMm: 230 },
  { x1: 4200, y1: 3600, x2: 0, y2: 3600, thicknessMm: 230 },
  { x1: 0, y1: 3600, x2: 0, y2: 0, thicknessMm: 230 },
];

test('single rectangle -> exactly one room (no inner/outer duplicate)', () => {
  // ppm 1000 so mm coords are identity through toMm
  const r = core.interpretFloorPlan('unit-test', {}, { traced: { walls: rectWalls, openings: [], ppm: 1000 } });
  assert.equal(r.success, true);
  assert.equal(r.interpretation.rooms.length, 1, `expected 1 room, got ${r.interpretation.rooms.length}`);
  const room = r.interpretation.rooms[0];
  assert.ok(Math.abs(room.widthMm - 4200) <= 20, `width ~4200mm, got ${room.widthMm}`);
  assert.ok(Math.abs(room.heightMm - 3600) <= 20, `height ~3600mm, got ${room.heightMm}`);
});

test('two separate rectangles -> two rooms (dedup does not over-merge)', () => {
  const walls = [
    ...rectWalls,
    // second room offset far to the right
    { x1: 6000, y1: 0, x2: 9000, y2: 0, thicknessMm: 230 },
    { x1: 9000, y1: 0, x2: 9000, y2: 3000, thicknessMm: 230 },
    { x1: 9000, y1: 3000, x2: 6000, y2: 3000, thicknessMm: 230 },
    { x1: 6000, y1: 3000, x2: 6000, y2: 0, thicknessMm: 230 },
  ];
  const r = core.interpretFloorPlan('unit-test-2', {}, { traced: { walls, openings: [], ppm: 1000 } });
  assert.equal(r.interpretation.rooms.length, 2, `expected 2 rooms, got ${r.interpretation.rooms.length}`);
});
