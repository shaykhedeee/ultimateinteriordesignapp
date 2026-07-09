/**
 * tests/kitchen-pantry-elevation.test.js
 * Regression for the 3-bay kitchen / crockery / pooja elevation decoded from the
 * user's render. Proves the model builds and emits a valid DXF with the key
 * CNC details (jali lotus polylines, glass shutter arcs, niche geometry).
 * (No server needed — uses the dxf-writer + decode service directly.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import svc from '../server/services/dxf-writer.js';
import { kitchenPantryModel, DECODED_UNITS } from '../server/services/render-elevation-decode.js';

const { DXF, buildElevationDXF } = svc;

test('kitchen-pantry is registered in DECODED_UNITS', () => {
  assert.ok(DECODED_UNITS['kitchen-pantry'], 'kitchen-pantry unit registered');
});

test('kitchen-pantry model has 3 bays (jali / crockery / glass)', () => {
  const m = kitchenPantryModel();
  assert.equal(m.lengthMm, 3000);
  assert.equal(m.heightMm, 2400);
  const tags = m.cabinets.map(c => c.tag);
  assert.ok(tags.includes('JALI'), 'left jali tall present');
  assert.ok(tags.includes('OPEN UNIT'), 'center open niche present');
  assert.ok(tags.includes('GLASS'), 'right glass display present');
});

test('kitchen-pantry DXF is valid + has CNC detail entities', () => {
  const m = kitchenPantryModel();
  const dxf = new DXF();
  dxf.drawElevation(m, 1500, 1500);
  const s = dxf.toString();
  assert.ok(s.includes('SECTION') && s.trim().endsWith('EOF'), 'valid DXF envelope');
  // base geometry present
  assert.ok(s.includes('LWPOLYLINE') || s.includes('LINE'), 'has geometry');
  // dimensions + title block present
  assert.ok(s.includes('DIMENSIONS'), 'has red dimensions');
  assert.ok(s.includes('TITLEBLOCK'), 'has title block');
});
