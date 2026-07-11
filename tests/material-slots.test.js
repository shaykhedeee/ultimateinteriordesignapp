// Unit tests for the material slot model that powers the 3D material selector.
// Pure logic — no DOM/Three.js needed, so this proves the feature works without a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSlotsForModuleType,
  defaultMaterialAssignments,
  resolveMaterial,
  describeAssignment,
  SLOT_LABELS,
  MODULE_SLOTS
} from '../frontend/src/lib/materialSlots.js';

const CATALOG = [
  { id: 'lam_1', code: 'SF-9120', name: 'Premium Frosty White SF', brand: 'CenturyPly', finish: 'Suede Matte', color: '#f3f4f6' },
  { id: 'lam_2', code: 'SF-9210', name: 'Classic Warm Oak Woodgrain', brand: 'Greenlam', finish: 'Textured Wood', color: '#c29a6b' },
  { id: 'lam_3', code: 'SF-9300', name: 'Charcoal Matte Acrylic', brand: 'Merino', finish: 'Acrylic Gloss', color: '#1e293b' }
];

test('kitchen_base exposes carcass, shutter, countertop, hardware slots', () => {
  const slots = getSlotsForModuleType('kitchen_base');
  assert.deepEqual(slots, ['carcass', 'shutter', 'countertop', 'hardware']);
});

test('tv_unit exposes a backPanel slot (previously missing from UI)', () => {
  const slots = getSlotsForModuleType('tv_unit');
  assert.ok(slots.includes('backPanel'));
  assert.ok(slots.includes('carcass'));
  assert.ok(slots.includes('shutter'));
});

test('prefix match resolves unknown variant to its family slots', () => {
  // 'kitchen_l_shape' is not a literal key; should fall back to kitchen_* family.
  const slots = getSlotsForModuleType('kitchen_l_shape');
  assert.deepEqual(slots, MODULE_SLOTS.kitchen_base);
});

test('unknown module type defaults to carcass+shutter+hardware', () => {
  const slots = getSlotsForModuleType('totally_unknown_thing');
  assert.deepEqual(slots, ['carcass', 'shutter', 'hardware']);
});

test('empty module type does not throw', () => {
  assert.deepEqual(getSlotsForModuleType(''), ['carcass', 'shutter', 'hardware']);
  assert.deepEqual(getSlotsForModuleType(null), ['carcass', 'shutter', 'hardware']);
});

test('defaultMaterialAssignments seeds every slot', () => {
  const assign = defaultMaterialAssignments('kitchen_base');
  assert.equal(assign.carcass, 'lam_1');
  assert.equal(assign.shutter, 'lam_1');
  assert.equal(assign.countertop, 'lam_1');
  assert.equal(assign.hardware, 'hw_1');
});

test('resolveMaterial finds by id then by code', () => {
  assert.equal(resolveMaterial('lam_2', CATALOG).name, 'Classic Warm Oak Woodgrain');
  assert.equal(resolveMaterial('SF-9300', CATALOG).brand, 'Merino');
  assert.equal(resolveMaterial('does_not_exist', CATALOG), null);
});

test('resolveMaterial falls back to built-in palette when catalog empty', () => {
  const mat = resolveMaterial('lam_3', []);
  assert.equal(mat.name, 'Charcoal Matte Acrylic');
});

test('describeAssignment returns brand · name for known id', () => {
  assert.equal(describeAssignment('lam_1', CATALOG), 'CenturyPly · Premium Frosty White SF');
});

test('describeAssignment returns Default for null', () => {
  assert.equal(describeAssignment(null, CATALOG), 'Default');
});

test('every slot key has a human label', () => {
  for (const slotList of Object.values(MODULE_SLOTS)) {
    for (const s of slotList) {
      assert.ok(SLOT_LABELS[s], `missing label for slot ${s}`);
    }
  }
});
