// Regression tests for the authoritative 2D drawing pipeline:
//  - drawing-generator.js  (elevations + RCP + BOM + floor plan)
//  - section-analyzer.js   (vertical wall section)
//  - rcp-analyzer.js       (reflected ceiling plan)
// All pure + deterministic; assert structure, geometry, and NO NaN/undefined leaks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDrawings } from '../server/services/drawing-generator.js';
import { analyzeSection } from '../server/services/section-analyzer.js';
import { analyzeRCP } from '../server/services/rcp-analyzer.js';

function assertNoBadNumbers(obj, path = '') {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'number') {
    assert.ok(Number.isFinite(obj), `non-finite number at ${path}: ${obj}`);
    return;
  }
  if (typeof obj === 'string') {
    assert.ok(!/NaN|undefined/.test(obj), `bad token in string at ${path}: "${obj}"`);
    return;
  }
  if (Array.isArray(obj)) { obj.forEach((v, i) => assertNoBadNumbers(v, `${path}[${i}]`)); return; }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) assertNoBadNumbers(v, `${path}.${k}`);
  }
}

const SAMPLE_CAD = {
  walls_json: JSON.stringify([
    { id: 'w1', x1: 0, y1: 0, x2: 400, y2: 0, thicknessMm: 230, heightMm: 2700 },
    { id: 'w2', x1: 400, y1: 0, x2: 400, y2: 300, thicknessMm: 230, heightMm: 2700 }
  ]),
  openings_json: JSON.stringify([
    { id: 'o1', wallId: 'w1', openingType: 'door', offsetFromStartMm: 200, widthMm: 900, sillHeightMm: 0, headHeightMm: 2100 },
    { id: 'o2', wallId: 'w2', openingType: 'window', offsetFromStartMm: 100, widthMm: 1200, sillHeightMm: 900, headHeightMm: 2100 }
  ]),
  furniture_json: JSON.stringify([
    { id: 'f1', name: 'Base Unit', libraryId: 'kitchen_base_run', type: 'base', widthMm: 600, heightMm: 720, depthMm: 560, xOffsetWall: 50, zOffset: 0, finish: 'Laminate' },
    { id: 'f2', name: 'Tall Loft', type: 'loft_tall', widthMm: 400, heightMm: 2200, depthMm: 350, xOffsetWall: 300, zOffset: 0, lighting: true }
  ]),
  lights_json: JSON.stringify([
    { id: 'lt1', type: 'downlight', x: 100, y: 100, circuit: 'A', intensity: 900 },
    { id: 'lt2', type: 'downlight', x: 300, y: 250, circuit: 'B' }
  ])
};

test('generateDrawings: produces all 4 drawing families with valid geometry', () => {
  const d = generateDrawings(SAMPLE_CAD, { projectId: 'P1' });
  assert.equal(d.success, true);
  assert.equal(d.projectId, 'P1');
  assert.ok(Array.isArray(d.elevations) && d.elevations.length === 2, '2 wall elevations');
  assert.ok(Array.isArray(d.schedule) && d.schedule.length === 2, 'BOM has 2 items');
  assert.ok(d.rcp && typeof d.rcp.fixtureCount === 'number', 'RCP present');
  assert.ok(d.floorPlan && d.floorPlan.walls.length === 2, 'floor plan has 2 walls');
  // length of a 400px wall at 40ppm = 10000mm
  const w0 = d.floorPlan.walls[0];
  assert.equal(w0.lengthMm, 10000, 'wall length = 400px * 25 = 10000mm');
  assert.equal(w0.lengthText, '10.00m');
  assertNoBadNumbers(d); // no NaN/undefined anywhere in the output tree
});

test('generateDrawings: RCP picks up ceiling loft light + downlights', () => {
  const d = generateDrawings(SAMPLE_CAD, {});
  // 2 downlights + 1 cove-light from loft_tall w/ lighting => 3 fixtures
  assert.equal(d.rcp.fixtureCount, 3);
  assert.ok(d.rcp.fixtures.some(f => f.type === 'cove-light'), 'loft lighting becomes cove-light');
});

test('generateDrawings: BOM reports real dimensions + finish', () => {
  const d = generateDrawings(SAMPLE_CAD, {});
  const base = d.schedule.find(s => s.id === 'f1');
  assert.equal(base.widthMm, 600);
  assert.equal(base.heightMm, 720);
  assert.equal(base.depthMm, 560);
  assert.equal(base.finish, 'Laminate');
  assert.equal(base.category, 'KITCHEN_BASE_RUN');
});

test('generateDrawings: tolerates empty CAD (no crash)', () => {
  const d = generateDrawings({ walls_json: '[]', openings_json: '[]', furniture_json: '[]' }, {});
  assert.equal(d.success, true);
  assert.equal(d.elevations.length, 0);
  assert.equal(d.schedule.length, 0);
  assertNoBadNumbers(d);
});

test('analyzeSection: computes length, height, and clamps oversized opening offset within wall', () => {
  const s = analyzeSection({
    wall: { id: 'w1', x1: 0, y1: 0, x2: 400, y2: 0, heightMm: 2700, thicknessMm: 230 },
    // offset 20000mm far exceeds wall length (10000) - width (900) = 9100 => clamped to 9100
    openings: [{ id: 'o1', wallId: 'w1', openingType: 'door', offsetFromStartMm: 20000, widthMm: 900 }],
    pixelsPerMeter: 40
  });
  assert.equal(s.lengthMm, 10000);
  assert.equal(s.heightMm, 2700);
  assert.equal(s.thicknessMm, 230);
  assert.equal(s.openings[0].offsetMm, 9100, 'oversized offset clamped to length-width');
  assert.equal(s.openings[0].sillMm, 0);
  assert.equal(s.openings[0].headMm, 2100);
  assert.equal(s.confidence, 1);
  assertNoBadNumbers(s);
});

test('analyzeSection: in-bounds opening offset is preserved (no over-clamp)', () => {
  const s = analyzeSection({
    wall: { id: 'w1', x1: 0, y1: 0, x2: 400, y2: 0 },
    openings: [{ id: 'o1', wallId: 'w1', openingType: 'door', offsetFromStartMm: 3000, widthMm: 900 }],
    pixelsPerMeter: 40
  });
  // 3000 < (10000-900)=9100 so offset stays 3000
  assert.equal(s.openings[0].offsetMm, 3000, 'in-bounds offset preserved');
});

test('analyzeSection: window gets default 900mm sill', () => {
  const s = analyzeSection({
    wall: { id: 'w2', x1: 400, y1: 0, x2: 400, y2: 300 },
    openings: [{ id: 'o2', wallId: 'w2', openingType: 'window', offsetFromStartMm: 100, widthMm: 1200 }],
    pixelsPerMeter: 40
  });
  assert.equal(s.openings[0].sillMm, 900, 'window default sill 900');
  assert.equal(s.lengthMm, 7500); // 300px * 25
});

test('analyzeRCP: maps lights to circuits + coverage count', () => {
  const r = analyzeRCP({
    lights: [
      { id: 'a', x: 100, y: 100, circuit: 'A', intensity: 900 },
      { id: 'b', x: 300, y: 250, circuit: 'B' },
      { id: 'c', x: 50, y: 50 } // no circuit -> defaults A (i=2 even)
    ],
    pixelsPerMeter: 40,
    ceilingHeightMm: 2700,
    rooms: [{ id: 'r1' }]
  });
  assert.equal(r.fixtures.length, 3);
  assert.equal(r.coverage, 3);
  assert.equal(r.ceilingHeightMm, 2700);
  assert.equal(r.roomCount, 1);
  const a = r.circuits.find(c => c.circuit === 'A');
  assert.equal(a.fixtures, 2, 'circuit A has 2 fixtures');
  assert.equal(r.confidence, 1);
  assertNoBadNumbers(r);
});

test('analyzeRCP: empty lights -> confidence 0, no crash', () => {
  const r = analyzeRCP({ lights: [] });
  assert.equal(r.confidence, 0);
  assert.equal(r.fixtures.length, 0);
  assertNoBadNumbers(r);
});
