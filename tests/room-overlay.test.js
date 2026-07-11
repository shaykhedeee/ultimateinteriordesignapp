// Unit tests for the persisted Room Overlay math (lib/roomOverlay.js).
// Covers centroid resolution + drag-shift for both x/y rooms and points-polygon rooms.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomCentroid, shiftRoom } from '../frontend/src/lib/roomOverlay.js';

test('roomCentroid uses explicit x/y when present', () => {
  const c = roomCentroid({ id: 'r1', x: 300, y: 450 });
  assert.deepEqual(c, { x: 300, y: 450 });
});

test('roomCentroid averages points polygon', () => {
  const c = roomCentroid({ id: 'r2', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 200 }, { x: 0, y: 200 }] });
  assert.deepEqual(c, { x: 50, y: 100 });
});

test('roomCentroid falls back to a deterministic slot', () => {
  const c = roomCentroid({ id: 'r3' }, 2);
  assert.equal(c.x, 200 + 2 * 220);
  assert.equal(c.y, 200);
});

test('shiftRoom moves explicit x/y by delta', () => {
  const moved = shiftRoom({ id: 'r1', x: 100, y: 100 }, 30, -20);
  assert.deepEqual({ x: moved.x, y: moved.y }, { x: 130, y: 80 });
});

test('shiftRoom translates every point of a polygon room', () => {
  const room = { id: 'r2', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 200 }] };
  const moved = shiftRoom(room, 50, 25);
  assert.deepEqual(moved.points, [
    { x: 50, y: 25 },
    { x: 150, y: 25 },
    { x: 150, y: 225 },
  ]);
  // original must not be mutated
  assert.deepEqual(room.points[0], { x: 0, y: 0 });
});

test('shiftRoom preserves non-geometry fields immutably', () => {
  const room = { id: 'r1', x: 10, y: 10, name: 'Kitchen', vastu: 'SE' };
  const moved = shiftRoom(room, 5, 5);
  assert.equal(moved.name, 'Kitchen');
  assert.equal(moved.vastu, 'SE');
  assert.equal(room.x, 10); // original untouched
});
