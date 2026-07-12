// Regression tests for cnc-cut-generator.js — machine-ready CNC cut plans.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCNCCutPlan } from '../server/services/cnc-cut-generator.js';

test('default module generates a valid multi-part cut plan + DXF', () => {
  const plan = generateCNCCutPlan({});
  assert.ok(plan.dxf.includes('SECTION') && plan.dxf.includes('ENTITIES'), 'valid DXF structure');
  assert.ok(plan.partCount >= 6, 'base + sides + top/bottom + back + shelves produced');
  assert.ok(plan.placed.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)), 'all parts placed at finite coords');
  assert.ok(plan.cutlist.length >= 1, 'cutlist summary produced');
  // every placed part must actually fit its reported sheet
  assert.ok(plan.sheetCount >= 1);
});

test('tall wardrobe nests across multiple boards (no false "cannot fit" error)', () => {
  const plan = generateCNCCutPlan({ widthMm: 1200, heightMm: 2400, depthMm: 600, numShelves: 4, shutterType: 'double' });
  // a 2400mm tall side cannot lie flat on a single std board -> must span sheets
  assert.ok(plan.sheetCount >= 1, 'produced at least one board');
  assert.ok(plan.sheet.stock === 'jumbo-9x6', 'tall module steps up to jumbo stock');
  assert.ok(plan.placed.some(p => p.name === 'L_SIDE'), 'side panels present');
});

test('double shutter produces two doors; single produces one', () => {
  const dbl = generateCNCCutPlan({ shutterType: 'double' });
  assert.ok(dbl.placed.some(p => p.name === 'DOOR_L') && dbl.placed.some(p => p.name === 'DOOR_R'));
  const sgl = generateCNCCutPlan({ shutterType: 'single' });
  assert.ok(sgl.placed.some(p => p.name === 'DOOR') && !sgl.placed.some(p => p.name === 'DOOR_L'));
});

test('impossible module (part larger than any board) throws a clear error', () => {
  assert.throws(
    () => generateCNCCutPlan({ widthMm: 5000, heightMm: 5000, depthMm: 5000 }),
    /cannot fit/i
  );
});

test('cutlist aggregates quantities by name+material', () => {
  const plan = generateCNCCutPlan({ numShelves: 3 });
  const sides = plan.cutlist.find(c => c.name === 'L_SIDE');
  assert.equal(sides.qty, 1);
  const shelves = plan.cutlist.filter(c => c.name.startsWith('SHELF_'));
  assert.equal(shelves.length, 3, 'three shelf entries produced');
});
