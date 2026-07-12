// Regression tests for cutlist PRECISION: the cutlist must be generated from
// REAL measured 2D wall elevations, not room templates. These tests lock the
// elevation -> module -> part dimension pipeline and the precision clamp.
//
// node --test tests/cutlist-elevation.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildElevationModules,
  mergeElevationModules,
  buildModules
} from '../server/services/cutlist-engine.js';
import { precisionPartsForModule } from '../server/services/cutlist-standards-service.js';

const laminates = [{ brand: 'Greenlam', collection: 'Mika', finish: 'Matt', bestFor: ['kitchen', 'wardrobe'] }];
const projectStub = { budgetTier: 'premium', selectedSpaces: ['kitchen', 'masterBed'] };

// Build a normalized elevation entry (same shape getElevationCabinets produces).
function elevEntry({ type, widthMm, heightMm, depthMm, room = 'kitchen', ctx = {} }) {
  return {
    ctx: { type: 'photo', wallId: 'w1', room, ...ctx },
    cab: { id: 'c1', type, widthMm, heightMm, depthMm, xOffsetMm: 100, zOffsetMm: 0 },
    widthMm, heightMm, depthMm,
    moduleType: classifyFromType(type, heightMm, depthMm),
    room,
    name: type
  };
}

// Mirror classifyCabinetToModuleType logic for test fixtures (kept in sync with engine).
function classifyFromType(type, h, d) {
  const t = String(type || '').toLowerCase();
  if (t.includes('wardrobe')) return 'wardrobe';
  if (t.includes('pantry') || t.includes('tall')) return 'kitchen-tall-pantry';
  if (t.includes('wall')) return 'kitchen-wall';
  if (t.includes('drawer')) return 'kitchen-drawer';
  if (t.includes('base') || t.includes('kitchen')) return 'kitchen-base';
  if (t.includes('tv')) return 'tv-unit';
  if (h >= 1900) return 'wardrobe';
  if (h <= 900 && d >= 480) return 'kitchen-base';
  if (h >= 1400) return 'tv-unit';
  return 'custom-storage';
}

test('elevation module carries the EXACT measured dimensions (no template rounding)', () => {
  const entry = elevEntry({ type: 'base', widthMm: 847, heightMm: 718, depthMm: 563 });
  const [mod] = buildElevationModules([entry], projectStub, laminates);
  assert.equal(mod.widthMm, 847, 'width must equal the measured elevation width');
  assert.equal(mod.heightMm, 718, 'height must equal the measured elevation height');
  assert.equal(mod.depthMm, 563, 'depth must equal the measured elevation depth');
  assert.equal(mod.elevationDerived, true);
  assert.ok(mod.elevationSource && mod.elevationSource.widthMm === 847);
  assert.equal(mod.createdFrom, 'elevation-v1');
});

test('elevation base module generates parts sized to measured W/H/D', () => {
  const entry = elevEntry({ type: 'base', widthMm: 847, heightMm: 718, depthMm: 563 });
  const [mod] = buildElevationModules([entry], projectStub, laminates);
  const cfg = { boardThicknessMm: 18, backPanelThicknessMm: 6, grooveDepthMm: 8, shelfClearanceMm: 2, hingeClearanceMm: 20, shutterGapMm: 3, railWidthMm: 100 };
  const parts = precisionPartsForModule(mod, 0, cfg);
  const left = parts.find(p => p.partCode.endsWith('01'));
  // side panel must be H x D = 718 x 563 (measured), not a 2100 template
  assert.equal(left.lengthMm, 718);
  assert.equal(left.widthMm, 563);
  const bottom = parts.find(p => p.partCode.endsWith('03'));
  assert.equal(bottom.lengthMm, 847 - 2 * 18);
  // every part carries the elevation trace
  assert.ok(parts.every(p => p.elevationSource && p.elevationSource.widthMm === 847));
});

test('elevation dimensions OVERRIDE template defaults for same room+type', () => {
  const entry = elevEntry({ type: 'base', widthMm: 1234, heightMm: 720, depthMm: 560, room: 'kitchen' });
  // buildModules builds kitchen templates (3000mm base) then merges the raw elevation
  // entry (1234mm) on top — elevation must take precedence.
  const merged = buildModules(projectStub, laminates, [entry]);
  const kitchenBases = merged.filter(m => m.room === 'kitchen' && m.moduleType === 'kitchen-base');
  // template 3000mm base is superseded by the elevation 1234mm base
  assert.ok(kitchenBases.some(m => m.widthMm === 1234), 'elevation width present');
  assert.ok(!kitchenBases.some(m => m.widthMm === 3000), 'template default width removed');
  const elevMod = kitchenBases.find(m => m.elevationDerived);
  assert.equal(elevMod.widthMm, 1234);
});

test('mergeElevationModules keeps template-only modules where no elevation exists', () => {
  const template = [
    { id: 't1', room: 'kitchen', moduleType: 'kitchen-base', widthMm: 3000, heightMm: 710, depthMm: 560 },
    { id: 't2', room: 'masterBed', moduleType: 'wardrobe', widthMm: 1800, heightMm: 2100, depthMm: 600 }
  ];
  const elev = buildElevationModules([elevEntry({ type: 'base', widthMm: 900, heightMm: 720, depthMm: 560, room: 'kitchen' })], projectStub, laminates);
  const merged = mergeElevationModules(template, elev);
  // kitchen base superseded by elevation, but masterBed wardrobe (no elevation) survives
  assert.ok(merged.some(m => m.room === 'masterBed' && m.moduleType === 'wardrobe'));
  assert.ok(merged.some(m => m.elevationDerived && m.widthMm === 900));
  assert.ok(!merged.some(m => m.id === 't1')); // superseded template removed
});

test('precision clamp: standard part formulas never go below 10mm or non-integer', () => {
  const cfg = { boardThicknessMm: 18, backPanelThicknessMm: 6, grooveDepthMm: 8, shelfClearanceMm: 2, hingeClearanceMm: 20, shutterGapMm: 3, railWidthMm: 100 };
  // tiny carcass would otherwise yield negative/garbage derived dims
  const mod = { moduleType: 'kitchen-base', id: 'm', widthMm: 120, heightMm: 200, depthMm: 300 };
  const parts = precisionPartsForModule(mod, 0, cfg);
  for (const p of parts) {
    assert.ok(p.lengthMm >= 10, `${p.name} length >= 10mm (got ${p.lengthMm})`);
    assert.ok(p.widthMm >= 10, `${p.name} width >= 10mm (got ${p.widthMm})`);
    assert.ok(Number.isInteger(p.lengthMm) && Number.isInteger(p.widthMm), `${p.name} integer dims`);
  }
});

test('elevation cabinet type classification is precise (tall/appliance -> pantry, wall -> wall unit)', () => {
  assert.equal(classifyFromType('tall-pantry', 2100, 600), 'kitchen-tall-pantry');
  assert.equal(classifyFromType('wall', 720, 350), 'kitchen-wall');
  assert.equal(classifyFromType('wardrobe', 2100, 600), 'wardrobe');
  assert.equal(classifyFromType('tv-unit', 2000, 450), 'tv-unit');
  // height heuristic: a 2100mm tall unlabeled cabinet is a wardrobe
  assert.equal(classifyFromType('unknown', 2100, 600), 'wardrobe');
});
