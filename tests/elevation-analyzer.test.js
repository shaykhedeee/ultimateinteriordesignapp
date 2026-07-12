// Regression tests for elevation-analyzer.js — the real measurement engine
// behind every wall elevation DXF (/elevations/auto/dxf, /combined-pdf, AURA).
// Locks: true mm dimensions from plan coords, and CONSISTENT clamping of
// out-of-bounds openings/cabinets (offsetMm/endMm/centerMm must all agree and
// stay within the wall — the drawing must match the coverage report).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWallElevation, analyzeProjectElevations } from '../server/services/elevation-analyzer.js';
import { buildElevationDXF } from '../server/services/dxf-writer.js';

const WALL_4M = { id: 'w1', x1: 0, y1: 0, x2: 160, y2: 0 }; // 160px @ 40ppm = 4000mm

test('wall length derived correctly from plan coords (40ppm)', () => {
  const m = analyzeWallElevation({ wall: WALL_4M, pixelsPerMeter: 40, wallHeightMm: 2700 });
  assert.equal(m.lengthMm, 4000);
  assert.equal(m.heightMm, 2700);
});

test('opening offset/center consistent when IN bounds', () => {
  const m = analyzeWallElevation({
    wall: WALL_4M, pixelsPerMeter: 40, wallHeightMm: 2700,
    openings: [{ id: 'd1', wallId: 'w1', openingType: 'door', offsetFromStartMm: 1000, widthMm: 900 }]
  });
  const o = m.openings[0];
  assert.equal(o.offsetMm, 1000);
  assert.equal(o.centerMm, 1000 + 900 / 2);
  assert.ok(o.centerMm <= m.lengthMm);
});

test('out-of-bounds opening is clamped CONSISTENTLY (no drawing/report mismatch)', () => {
  // offset 3800 + width 900 = 4700 would exceed 4000mm wall.
  const m = analyzeWallElevation({
    wall: WALL_4M, pixelsPerMeter: 40, wallHeightMm: 2700,
    openings: [{ id: 'd1', wallId: 'w1', openingType: 'door', offsetFromStartMm: 3800, widthMm: 900 }]
  });
  const o = m.openings[0];
  // clamped to (wallLength - width)
  assert.equal(o.offsetMm, 4000 - 900);
  // center derived from the CLAMPED offset, not the raw one
  assert.equal(o.centerMm, o.offsetMm + 900 / 2);
  assert.ok(o.offsetMm + o.widthMm <= m.lengthMm + 1, 'opening must not exceed wall');
  assert.ok(o.centerMm <= m.lengthMm);
});

test('out-of-bounds cabinet endMm/centerMm use clamped xOffset', () => {
  const m = analyzeWallElevation({
    wall: WALL_4M, pixelsPerMeter: 40, wallHeightMm: 2700,
    furniture: [{ id: 'c1', wallId: 'w1', type: 'base', widthMm: 600, xOffsetWall: 3700 }]
  });
  const c = m.cabinets[0];
  assert.equal(c.xOffsetMm, 4000 - 600);
  assert.equal(c.endMm, c.xOffsetMm + 600);
  assert.equal(c.centerMm, c.xOffsetMm + 600 / 2);
  assert.ok(c.endMm <= m.lengthMm + 1, 'cabinet end must not exceed wall');
  // overflow flag should NOT fire for a clamped (fitted) cabinet
  assert.equal(m.coverage.overflow, false);
});

test('coverage/overflow flags a genuinely oversized cabinet', () => {
  const m = analyzeWallElevation({
    wall: WALL_4M, pixelsPerMeter: 40, wallHeightMm: 2700,
    furniture: [{ id: 'c1', wallId: 'w1', type: 'base', widthMm: 5000, xOffsetWall: 0 }]
  });
  // width 5000 > 4000 wall => cannot be clamped to fit => overflow
  assert.equal(m.coverage.overflow, true);
});

test('analyzeProjectElevations -> valid DXF end-to-end', () => {
  const cad = {
    walls_json: JSON.stringify([{ id: 'w1', x1: 0, y1: 0, x2: 160, y2: 0 }]),
    openings_json: JSON.stringify([{ id: 'd1', wallId: 'w1', openingType: 'door', offsetFromStartMm: 1000, widthMm: 900 }]),
    furniture_json: JSON.stringify([{ id: 'c1', wallId: 'w1', type: 'base', widthMm: 600, xOffsetWall: 200 }]),
    pixels_per_meter: 40
  };
  const r = analyzeProjectElevations(cad, { projectId: 'P1', wallHeightMm: 2700 });
  assert.equal(r.success, true);
  assert.ok(r.walls.length === 1);
  const model = r.walls[0];
  const dxf = buildElevationDXF(model, { scale: '1:25', rev: '1.0', projectId: 'P1', sheet: model.wallName });
  assert.ok(dxf.includes('SECTION') && dxf.endsWith('EOF'), 'valid DXF envelope');
  assert.ok(!dxf.includes('NaN'), 'no NaN coordinates in DXF');
});
