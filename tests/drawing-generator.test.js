/**
 * tests/drawing-generator.test.js
 * node --test (no deps). Guards the per-wall elevation projection + RCP + schedule.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDrawings } from '../server/services/drawing-generator.js';

const cad = {
  pixels_per_meter: 40,
  walls_json: JSON.stringify([
    { id: 'w1', x1: 0, y1: 0, x2: 240, y2: 0, thicknessMm: 75 },
    { id: 'w2', x1: 240, y1: 0, x2: 240, y2: 200, thicknessMm: 75 }
  ]),
  openings_json: JSON.stringify([
    { openingType: 'door', offsetFromStartMm: 600, widthMm: 900, headHeightMm: 2100, sillHeightMm: 0, wallId: 'w1' },
    { openingType: 'window', offsetFromStartMm: 1800, widthMm: 1200, headHeightMm: 2100, sillHeightMm: 900, wallId: 'w1' }
  ]),
  furniture_json: JSON.stringify([
    { id: 'c1', type: 'base', width: 600, height: 720, xOffsetWall: 0, wallId: 'w1', name: 'Base', libraryId: 'kitchen-base', customization: { shutterFinish: 'Fluted Glass' } },
    { id: 'c2', type: 'wall', width: 900, height: 600, xOffsetWall: 700, wallId: 'w1', name: 'Wall Upper', libraryId: 'kitchen-wall' }
  ]),
  lights_json: JSON.stringify([{ id: 'l1', type: 'downlight', x: 100, y: 50, room: 'Kitchen' }])
};

test('emits one elevation per wall using real analyzer', () => {
  const out = generateDrawings(cad, { projectId: 'P' });
  assert.equal(out.elevations.length, 2);
  const e1 = out.elevations[0];
  assert.equal(e1.lengthMm, 6000); // 240px @40ppm
  assert.equal(e1.openings.length, 2);
  assert.equal(e1.cabinets.length, 2);
});

test('elevation consumes real opening schema (openingType/sill/head)', () => {
  const out = generateDrawings(cad, { projectId: 'P' });
  const e1 = out.elevations[0];
  const win = e1.openings.find(o => o.type === 'window');
  assert.equal(win.sillMm, 900);
  assert.equal(win.headMm, 2100);
  assert.equal(win.widthMm, 1200);
});

test('cabinetry placement driven by zOffset (base on floor, wall overhead)', () => {
  const out = generateDrawings(cad, { projectId: 'P' });
  const e1 = out.elevations[0];
  const base = e1.cabinets.find(c => c.type === 'base');
  const wall = e1.cabinets.find(c => c.type === 'wall');
  assert.equal(base.zOffsetMm, 100);   // floor
  assert.equal(wall.zOffsetMm, 1400);  // overhead
});

test('RCP derived from lights + ceiling fixtures', () => {
  const out = generateDrawings(cad, { projectId: 'P' });
  assert.ok(out.rcp);
  assert.equal(out.rcp.title, 'Reflected Ceiling Plan (RCP)');
  assert.equal(out.rcp.fixtureCount, 1);
  assert.equal(out.rcp.fixtures[0].type, 'downlight');
});

test('schedule (BOM) uses real libraryId/type + dimensions', () => {
  const out = generateDrawings(cad, { projectId: 'P' });
  assert.equal(out.schedule.length, 2);
  const s = out.schedule[0];
  assert.equal(s.category, 'KITCHEN-BASE');
  assert.equal(s.widthMm, 600);
  assert.equal(s.heightMm, 720);
  assert.equal(s.depthMm, 560);
});

test('floor plan annotated with real wall lengths', () => {
  const out = generateDrawings(cad, { projectId: 'P' });
  assert.ok(out.floorPlan);
  assert.equal(out.floorPlan.walls[0].lengthMm, 6000);
  assert.ok(out.floorPlan.walls[0].lengthText.includes('m'));
});
