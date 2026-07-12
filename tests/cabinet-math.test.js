// Regression tests for cabinet-math.js — the precise part-size generator
// used by the cutlist engine. Locks grain direction, edge-banding, and the
// raw/finished dimension math for base / wall / drawer cabinets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBaseCabinet, calculateWallCabinet, calculateDrawerCabinet } from '../server/services/cabinet-math.js';

test('base cabinet: side panels are height x depth, vertical grain', () => {
  const parts = calculateBaseCabinet({ width: 900, height: 2100, depth: 560 });
  const side = parts.find(p => p.partId.endsWith('L-SIDE'));
  assert.equal(side.rawHeight, 2100);
  assert.ok(Math.abs(side.rawWidth - (560 - 0.8)) < 0.001, `side rawWidth ${side.rawWidth}`);
  assert.equal(side.grain, 'vertical');
  assert.equal(side.edgeband, '1L (0.8mm)');
});

test('base cabinet: backing panel is grain:none and slightly wider than internal width (groove fit)', () => {
  const parts = calculateBaseCabinet({ width: 900, height: 2100, depth: 560, carcassThickness: 18, backingGrooveDepth: 8 });
  const back = parts.find(p => p.partId.endsWith('BACK'));
  assert.equal(back.grain, 'none');
  // internal width = 900 - 2*18 = 864; backing = 864 + 2*8 = 880
  assert.equal(back.rawWidth, 880);
  assert.equal(back.edgeband, 'None');
});

test('base cabinet: double shutters locked vertical with 4E edgeband, sized to half width', () => {
  const parts = calculateBaseCabinet({ width: 900, height: 2100, depth: 560, shutterEdgeband: 2 });
  const l = parts.find(p => p.partId.endsWith('SHUTTER-L'));
  const r = parts.find(p => p.partId.endsWith('SHUTTER-R'));
  assert.ok(l && r, 'two shutters for double type');
  assert.equal(l.grain, 'vertical');
  assert.equal(l.edgeband, '4E (2mm)');
  // fin width each = (900-6)/2 = 447; raw = 447 - 4 = 443
  assert.equal(l.rawWidth, 443);
});

test('base cabinet: single shutter spans full width', () => {
  const parts = calculateBaseCabinet({ width: 900, height: 2100, depth: 560, shutterType: 'single', shutterEdgeband: 2 });
  const s = parts.find(p => p.partId.endsWith('SHUTTER'));
  assert.equal(s.rawWidth, 900 - 3 - 4); // fin 897, raw minus 2*2 band
});

test('internal (bottom/shelf/rail) parts are grain:none for rotation yield', () => {
  const parts = calculateBaseCabinet({ width: 900, height: 2100, depth: 560 });
  const bottom = parts.find(p => p.partId.endsWith('BOTTOM'));
  const rail = parts.find(p => p.partId.endsWith('T-RAIL-F'));
  const shelf = parts.find(p => p.partId.endsWith('SHELF'));
  assert.equal(bottom.grain, 'none');
  assert.equal(rail.grain, 'none');
  assert.equal(shelf.grain, 'none');
});

test('wall cabinet: top/bottom panels grain:none, backing fits grooves', () => {
  const parts = calculateWallCabinet({ width: 900, height: 720, depth: 350, carcassThickness: 18, backingGrooveDepth: 6 });
  const top = parts.find(p => p.partId.endsWith('TOP'));
  const back = parts.find(p => p.partId.endsWith('BACK'));
  assert.equal(top.grain, 'none');
  // backing width = 900 - 36 + 12 = 876
  assert.equal(back.rawWidth, 876);
  assert.equal(back.rawHeight, 720 - 36 + 12);
});

test('drawer cabinet: builds on base carcass + drawer fronts/boxes', () => {
  const parts = calculateDrawerCabinet({ width: 900, height: 2100, depth: 560, drawerSystemId: 'hettich_innotech' });
  const fronts = parts.filter(p => p.name.startsWith('Drawer Front'));
  const bottoms = parts.filter(p => p.name.includes('Bottom Plate'));
  assert.ok(fronts.length >= 1, 'drawer fronts generated');
  assert.ok(bottoms.length >= 1, 'drawer bottoms generated');
  fronts.forEach(f => assert.equal(f.grain, 'vertical'));
});

test('drawer cabinet: unknown drawer system id falls back to first system (no crash)', () => {
  const parts = calculateDrawerCabinet({ width: 900, height: 2100, depth: 560, drawerSystemId: 'does-not-exist' });
  assert.ok(Array.isArray(parts) && parts.length > 0, 'should not crash on unknown drawer system');
});
