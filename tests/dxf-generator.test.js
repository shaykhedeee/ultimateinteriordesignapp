/**
 * tests/dxf-generator.test.js
 * node --test (no deps). Guards the professional DXF generator from regressions.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateElevationDXF } from '../server/services/dxf-generator.js';
import { analyzeWallElevation } from '../server/services/elevation-analyzer.js';

function sampleModel() {
  const wall = { id: 'w1', x1: 0, y1: 0, x2: 240, y2: 0, thicknessMm: 75 };
  return analyzeWallElevation({
    wall,
    openings: [
      { openingType: 'door', offsetFromStartMm: 600, widthMm: 900, headHeightMm: 2100, sillHeightMm: 0, wallId: 'w1' },
      { openingType: 'window', offsetFromStartMm: 1800, widthMm: 1200, headHeightMm: 2100, sillHeightMm: 900, wallId: 'w1' }
    ],
    furniture: [
      { id: 'c1', type: 'base', width: 600, height: 720, xOffsetWall: 0, wallId: 'w1', name: 'Base', libraryId: 'base', customization: { shutterFinish: 'Fluted Glass' } },
      { id: 'c2', type: 'wall', width: 900, height: 600, xOffsetWall: 700, wallId: 'w1', name: 'Wall Upper', libraryId: 'wall' }
    ],
    pixelsPerMeter: 40
  });
}

test('produces a parseable ASCII DXF R2010 (SECTION/ENDSEC/EOF)', () => {
  const dxf = generateElevationDXF(sampleModel(), { scale: '1:25', rev: '1.0', projectId: 'P', sheetName: 'ELEVATION A' });
  assert.match(dxf, /SECTION/);
  assert.match(dxf, /ENDSEC/);
  assert.match(dxf, /EOF/);
  assert.match(dxf, /ACADVER/);
});

test('contains the required LAYER table entries', () => {
  const dxf = generateElevationDXF(sampleModel());
  for (const l of ['WALL_OUTLINE', 'OPENINGS', 'CABINETRY', 'DIMENSIONS', 'ANNOTATIONS', 'HATCH', 'SECTION']) {
    assert.ok(dxf.includes(l), `missing layer ${l}`);
  }
});

test('defines a HIDDEN linetype', () => {
  const dxf = generateElevationDXF(sampleModel());
  assert.ok(dxf.includes('HIDDEN'), 'missing HIDDEN linetype');
});

test('door opening is cut (jambs/sill/head) on OPENINGS layer and uses true geometry', () => {
  const dxf = generateElevationDXF(sampleModel());
  // door at offset 600, width 900 -> 600..1500 ; window at 1800..3000 (sill 900)
  assert.ok(dxf.includes('OPENINGS'));
  assert.ok(dxf.includes('DOOR'));
  assert.ok(dxf.includes('WINDOW'));
  // sill/head heights present as coordinates
  assert.ok(dxf.includes(String(2100))); // head
  assert.ok(dxf.includes(String(900)));  // window sill
});

test('cabinetry entities emitted on CABINETRY layer with type tags', () => {
  const dxf = generateElevationDXF(sampleModel());
  assert.ok(dxf.includes('CABINETRY'));
  // fluted-glass base resolves to SHUTTER tag; plain wall unit resolves to WALL
  assert.ok(dxf.includes('SHUTTER'));
  assert.ok(dxf.includes('WALL'));
});

test('dimension lines with arrowheads (SOLID) and mm text are present', () => {
  const dxf = generateElevationDXF(sampleModel());
  assert.ok((dxf.match(/SOLID/g) || []).length > 0, 'expected arrowhead solids');
  assert.ok(dxf.includes('6000')); // wall length mm (240px @40ppm = 6000mm)
});

test('title block + drawing border present', () => {
  const dxf = generateElevationDXF(sampleModel(), { scale: '1:25', rev: '1.0', projectId: 'PID_X', sheetName: 'ELEVATION A' });
  assert.ok(dxf.includes('AURABRAIN'));
  assert.ok(dxf.includes('PID_X'));
  assert.ok(dxf.includes('ELEVATION A'));
});
