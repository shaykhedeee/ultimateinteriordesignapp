// Regression tests for room-templates.js — kitchen templates + furniture catalog.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KITCHEN_TEMPLATES, FURNITURE_CATALOG, getTemplate, listTemplates, getCatalog } from '../server/services/room-templates.js';

test('KITCHEN_TEMPLATES: 3 templates with coherent cabinets/appliances', () => {
  assert.equal(Object.keys(KITCHEN_TEMPLATES).length, 3);
  for (const t of Object.values(KITCHEN_TEMPLATES)) {
    assert.ok(t.cabinets.length > 0, `${t.id} should have cabinets`);
    assert.ok(t.appliances.length > 0, `${t.id} should have appliances`);
    assert.ok(t.defaultRoom && t.defaultRoom.w > 0, `${t.id} has a room`);
  }
});

test('getTemplate / listTemplates / getCatalog accessors work', () => {
  assert.equal(getTemplate('luxe-parallel-island').id, 'luxe-parallel-island');
  assert.equal(getTemplate('nope'), undefined);
  assert.equal(listTemplates().length, 3);
  const cat = getCatalog();
  assert.ok(cat.tv_units.length >= 1);
  assert.ok(cat.wardrobes.length >= 1);
});

test('FURNITURE_CATALOG: every item has id/type/dims', () => {
  const all = Object.values(FURNITURE_CATALOG).flat();
  assert.ok(all.length > 10);
  for (const item of all) {
    assert.ok(item.id && item.type, 'item has id+type');
    assert.ok(item.wMm > 0 && item.hMm > 0 && item.dMm > 0, `${item.id} has dims`);
  }
});

test('parallel-island template: tall pantries sit at z=0 (floor) and wall units elevated', () => {
  const t = KITCHEN_TEMPLATES['luxe-parallel-island'];
  const tall = t.cabinets.filter(c => c.type === 'tall');
  assert.ok(tall.every(c => c.zOffsetMm === 0), 'tall units on floor');
  const wall = t.cabinets.find(c => c.type === 'wall');
  assert.ok(wall.zOffsetMm > 0, 'wall units elevated');
});
