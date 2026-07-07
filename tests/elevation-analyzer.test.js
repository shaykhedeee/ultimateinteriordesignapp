/**
 * tests/elevation-analyzer.test.js
 * node --test  (no deps)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWallElevation, analyzeProjectElevations } from '../server/services/elevation-analyzer.js';

const PPM = 40; // 40px == 1000mm

// A 3000mm wall at 40px/m -> 120px plan length
const wall = { id: 'w1', x1: 0, y1: 0, x2: 120, y2: 0, thicknessMm: 75 };

test('wall length computed correctly from plan px (120px @40ppm => 3000mm)', () => {
  const m = analyzeWallElevation({ wall, openings: [], furniture: [], pixelsPerMeter: PPM });
  assert.equal(m.lengthMm, 3000);
  assert.equal(m.heightMm, 2700);
  assert.equal(m.thicknessMm, 75);
});

test('door opening normalised with real sill/head and clamped offset', () => {
  const openings = [{ openingId: 'd1', openingType: 'door', offsetFromStartMm: 500, widthMm: 900, wallId: 'w1' }];
  const m = analyzeWallElevation({ wall, openings, furniture: [], pixelsPerMeter: PPM });
  assert.equal(m.openings.length, 1);
  assert.equal(m.openings[0].type, 'door');
  assert.equal(m.openings[0].offsetMm, 500);
  assert.equal(m.openings[0].widthMm, 900);
  assert.equal(m.openings[0].sillMm, 0);
  assert.equal(m.openings[0].headMm, 2100);
  assert.equal(m.openings[0].centerMm, 950);
});

test('window uses standard 900 sill when not provided', () => {
  const openings = [{ openingId: 'w1', openingType: 'window', offsetFromStartMm: 1000, widthMm: 1200, wallId: 'w1' }];
  const m = analyzeWallElevation({ wall, openings, furniture: [], pixelsPerMeter: PPM });
  assert.equal(m.openings[0].type, 'window');
  assert.equal(m.openings[0].sillMm, 900);
  assert.equal(m.openings[0].headMm, 2100);
});

test('offset clamped so opening cannot exceed wall length', () => {
  const openings = [{ openingType: 'door', offsetFromStartMm: 2900, widthMm: 900, wallId: 'w1' }];
  const m = analyzeWallElevation({ wall, openings, furniture: [], pixelsPerMeter: PPM });
  assert.equal(m.openings[0].offsetMm, 2100); // 3000-900
});

test('cabinet coverage + overflow detection', () => {
  const furniture = [
    { id: 'c1', type: 'base', width: 600, height: 720, xOffsetWall: 0, wallId: 'w1' },
    { id: 'c2', type: 'base', width: 600, height: 720, xOffsetWall: 600, wallId: 'w1' },
    { id: 'c3', type: 'base', width: 600, height: 720, xOffsetWall: 2500, wallId: 'w1' } // overflow (2500+600=3100>3000)
  ];
  const m = analyzeWallElevation({ wall, openings: [], furniture, pixelsPerMeter: PPM });
  assert.equal(m.coverage.usedMm, 1800);
  assert.equal(m.coverage.utilizationPct, 60);
  assert.equal(m.coverage.overflow, true);
  assert.equal(m.cabinets.length, 3);
});

test('gaps between cabinets reported', () => {
  const furniture = [
    { id: 'c1', type: 'base', width: 600, xOffsetWall: 0, wallId: 'w1' },
    { id: 'c2', type: 'base', width: 600, xOffsetWall: 1500, wallId: 'w1' }
  ];
  const m = analyzeWallElevation({ wall, openings: [], furniture, pixelsPerMeter: PPM });
  // gap between 600 and 1500 = 900mm, plus 2100..3000 = 900mm
  assert.equal(m.coverage.gaps.length, 2);
  assert.equal(m.coverage.gaps[0].sizeMm, 900);
});

test('legacy field names tolerated (type instead of openingType)', () => {
  const openings = [{ id: 'd1', type: 'door', offsetFromStartMm: 0, width: 900, wallId: 'w1' }];
  const m = analyzeWallElevation({ wall, openings, furniture: [], pixelsPerMeter: PPM });
  assert.equal(m.openings.length, 1);
  assert.equal(m.openings[0].widthMm, 900);
});

test('confidence is data-derived (0 when empty, 1 when fully specified)', () => {
  const empty = analyzeWallElevation({ wall, openings: [], furniture: [], pixelsPerMeter: PPM });
  assert.equal(empty.confidence, 0);
  const full = analyzeWallElevation({
    wall,
    openings: [{ openingType: 'door', offsetFromStartMm: 0, widthMm: 900, wallId: 'w1' }],
    furniture: [{ id: 'c', type: 'base', width: 600, height: 720, xOffsetWall: 0, wallId: 'w1' }],
    pixelsPerMeter: PPM
  });
  assert.equal(full.confidence, 1);
});

test('analyzeProjectElevations returns walls + topView + schedule + report', () => {
  const cad = {
    walls_json: JSON.stringify([wall]),
    openings_json: JSON.stringify([{ openingType: 'door', offsetFromStartMm: 500, widthMm: 900, wallId: 'w1' }]),
    furniture_json: JSON.stringify([{ id: 'c', type: 'base', width: 600, height: 720, xOffsetWall: 0, wallId: 'w1' }]),
    pixels_per_meter: PPM
  };
  const r = analyzeProjectElevations(cad, { projectId: 'P1' });
  assert.equal(r.success, true);
  assert.equal(r.walls.length, 1);
  assert.equal(r.walls[0].lengthMm, 3000);
  assert.ok(r.topView.walls.length === 1);
  assert.equal(r.schedule.length, 1);
  assert.equal(r.report.wallCount, 1);
  assert.equal(r.report.overallUtilizationPct, 20); // 600/3000
});
