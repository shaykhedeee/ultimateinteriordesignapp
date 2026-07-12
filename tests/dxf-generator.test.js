// Regression tests for dxf-generator.js (legacy elevation DXF builder).
// Verifies structural validity + that sparse/undefined cabinet geometry no
// longer emits the invalid DXF token "undefined".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateElevationDXF } from '../server/services/dxf-generator.js';

function assertValidDxf(dxf) {
  assert.ok(typeof dxf === 'string');
  assert.ok(/^  0\r?\nSECTION/m.test(dxf) || dxf.includes('SECTION'), 'has SECTION');
  assert.ok(dxf.includes('ENTITIES'), 'has ENTITIES section');
  assert.ok(dxf.includes('EOF'), 'terminates with EOF');
  // No numeric DXF field may carry the literal "undefined" / "NaN"
  assert.ok(!/undefined/.test(dxf), 'no "undefined" token in DXF output');
  assert.ok(!/NaN/.test(dxf), 'no "NaN" token in DXF output');
}

test('generateElevationDXF: valid DXF for a standard elevation', () => {
  const dxf = generateElevationDXF({
    lengthMm: 3600, heightMm: 2700, thicknessMm: 75,
    openings: [{ type: 'window', offsetMm: 400, widthMm: 1200, sillMm: 900, headMm: 2100 }],
    cabinets: [{ type: 'base', tag: 'BASE', xOffsetMm: 0, zOffsetMm: 0, widthMm: 600, heightMm: 720 }]
  });
  assertValidDxf(dxf);
  assert.ok(dxf.includes('WALL_OUTLINE') && dxf.includes('CABINETRY'), 'layer names present');
  assert.ok(dxf.includes('WINDOW'), 'opening label present');
});

test('generateElevationDXF: sparse cabinet geometry does NOT emit "undefined"', () => {
  // A cabinet missing xOffsetMm/widthMm/heightMm would previously produce "undefined" tokens.
  const dxf = generateElevationDXF({
    lengthMm: 3000, heightMm: 2700,
    cabinets: [{ type: 'base', tag: 'BASE' }] // no numeric geometry at all
  });
  assertValidDxf(dxf);
});

test('generateElevationDXF: door opening cut + dimension label', () => {
  const dxf = generateElevationDXF({
    lengthMm: 4000, heightMm: 2700,
    openings: [{ type: 'door', offsetMm: 200, widthMm: 900, sillMm: 0, headMm: 2100 }]
  });
  assertValidDxf(dxf);
  assert.ok(dxf.includes('DOOR'), 'door label present');
});
