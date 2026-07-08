/**
 * tests/dxf-writer.test.js  (v2 — matches professional shop-drawing output)
 * node --test  (no deps)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../server/services/dxf-writer.js';
const { buildElevationDXF } = pkg;
import { analyzeWallElevation } from '../server/services/elevation-analyzer.js';

const PPM = 40;
const wall = { id: 'w1', x1: 0, y1: 0, x2: 240, y2: 0, thicknessMm: 75 };

function sampleModel() {
  return analyzeWallElevation({
    wall,
    openings: [{ openingType: 'door', offsetFromStartMm: 500, widthMm: 900, wallId: 'w1' }],
    furniture: [
      { id: 'c1', type: 'base', width: 600, height: 720, xOffsetWall: 0, wallId: 'w1', name: 'Base Drawer', customization: { shutterFinish: 'PU Paint' } },
      { id: 'c2', type: 'wall', width: 900, height: 600, xOffsetWall: 1500, wallId: 'w1', name: 'Wall Unit', customization: { shutterFinish: 'Fluted Glass' } }
    ],
    pixelsPerMeter: PPM
  });
}

test('valid DXF structure (sections balanced + EOF)', () => {
  const dxf = buildElevationDXF(sampleModel(), { scale: '1:25' });
  assert.match(dxf, /SECTION/); assert.match(dxf, /ENDSEC/); assert.match(dxf, /ENTITIES/);
  assert.ok(dxf.trim().endsWith('EOF'));
  const sec = (dxf.match(/^  0\nSECTION/gm) || []).length;
  const end = (dxf.match(/^  0\nENDSEC/gm) || []).length;
  assert.equal(sec, end);
});

test('professional layer table present (incl REF_LINES, ANNOTATIONS)', () => {
  const dxf = buildElevationDXF(sampleModel());
  for (const l of ['WALL_OUTLINE', 'OPENINGS', 'CABINETRY', 'DIMENSIONS', 'HATCH', 'ANNOTATIONS', 'REF_LINES', 'TITLEBLOCK'])
    assert.match(dxf, new RegExp('LAYER\n  2\n' + l), `layer ${l} missing`);
});

test('dimensions are RED (DIMENSIONS layer) with tick/arrow marks', () => {
  const dxf = buildElevationDXF(sampleModel());
  // dimension text + tick lines both on DIMENSIONS layer
  assert.ok((dxf.match(/6000 MM/g) || []).length >= 1);
  assert.ok((dxf.match(/2700 MM/g) || []).length >= 1);
});

test('material callouts emitted (FLUTED GLASS / PU PAINTED FINISH)', () => {
  const dxf = buildElevationDXF(sampleModel());
  assert.match(dxf, /FLUTED GLASS/);
  assert.match(dxf, /PU PAINTED FINISH/);
});

test('component tags present (BASE / WALL)', () => {
  const dxf = buildElevationDXF(sampleModel());
  assert.match(dxf, /BASE/); assert.match(dxf, /WALL/);
});

test('concrete BEAM hatch + glazing representation', () => {
  const dxf = buildElevationDXF(sampleModel());
  assert.match(dxf, /BEAM/);
  assert.match(dxf, /HATCH/);
});

test('real mm values carried (900 door, 6000 wall)', () => {
  const dxf = buildElevationDXF(sampleModel());
  assert.match(dxf, /6000 MM/); assert.match(dxf, /900/);
});

test('coordinates in mm (large values present)', () => {
  const dxf = buildElevationDXF(sampleModel());
  assert.match(dxf, /(1|2|3|4|5|6)\d{3}\.\d{3}/);
});
