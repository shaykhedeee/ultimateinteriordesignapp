// Regression tests for shoe-rack.js — parametric entryway shoe rack DXF/PDF/model.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shoeRackModel, buildShoeRackDXF } from '../server/services/shoe-rack.js';

test('shoeRackModel: derives cabinets from defaults (tall carcass + cupboard + bench + shelves)', () => {
  const m = shoeRackModel();
  assert.equal(m.lengthMm, 1200 + 900); // tall + bench width
  assert.equal(m.heightMm, 2000);
  const names = m.cabinets.map(c => c.name);
  assert.ok(names.includes('Tall Carcass'));
  assert.ok(names.includes('Cupboard L'));
  assert.ok(names.includes('Bench Drawer'));
  assert.ok(names.filter(n => n.startsWith('Shoe Shelf')).length === 3, '3 open shoe shelves');
});

test('shoeRackModel: invalid/NaN dims fall back to defaults (no crash)', () => {
  const m = shoeRackModel({ totalHeight: NaN, benchHeight: null, tallWidth: undefined });
  assert.equal(m.heightMm, 2000);
  assert.equal(m.lengthMm, 1200 + 900);
});

test('buildShoeRackDXF: invalid handle style falls back to bar (no crash)', () => {
  const dxf = buildShoeRackDXF({ handleStyle: 'laser' });
  assert.equal(typeof dxf, 'string');
  assert.ok(dxf.length > 200);
});

test('buildShoeRackDXF: produces valid DXF string with dimensions', () => {
  const dxf = buildShoeRackDXF({ tallWidth: 1200, benchWidth: 900, totalHeight: 2000 });
  assert.equal(typeof dxf, 'string');
  assert.ok(dxf.length > 500);
  assert.ok(dxf.includes('WALL_OUTLINE'), 'elevation outline layer present');
});

test('buildShoeRackDXF: clamps + survives extreme inputs', () => {
  const dxf = buildShoeRackDXF({ totalHeight: 99999, tallWidth: -50 });
  assert.equal(typeof dxf, 'string');
  assert.ok(dxf.length > 100);
});
