// Regression tests for the cutlist nesting optimizer (nest-optimizer.js).
// Locks the properties a real shop drawing depends on:
//  - no two placed parts overlap (collision-free)
//  - every placed part stays within the sheet bounds
//  - grain constraints are honoured (horizontal grain -> grain along X;
//    vertical grain -> grain along Y)
//  - oversize parts are reported as unplaced, never crashed/overlapping
//  - total placed area equals the sum of placed part areas (nothing lost)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nestPanels } from '../server/services/nest-optimizer.js';

const SHEET_W = 2440, SHEET_H = 1220;

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function checkSheetIntegrity(result, label) {
  for (const sheet of result.nestedSheets) {
    const parts = sheet.placedParts;
    // within bounds (margin applied by optimizer; just ensure <= sheet dims)
    for (const p of parts) {
      assert.ok(p.x >= 0 && p.y >= 0, `${label}: part ${p.partId} negative coord`);
      assert.ok(p.x + p.w <= SHEET_W + 0.5, `${label}: part ${p.partId} exceeds sheet width`);
      assert.ok(p.y + p.h <= SHEET_H + 0.5, `${label}: part ${p.partId} exceeds sheet height`);
    }
    // no overlaps
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        assert.ok(!rectsOverlap(parts[i], parts[j]),
          `${label}: parts ${parts[i].partId} & ${parts[j].partId} OVERLAP on ${sheet.sheetId}`);
      }
    }
    // area conservation
    const used = parts.reduce((s, p) => s + p.w * p.h, 0);
    const expected = parts.reduce((s, p) => s + p.rawWidth * p.rawHeight, 0);
    assert.ok(Math.abs(used - expected) < 1, `${label}: placed area mismatch on ${sheet.sheetId}`);
  }
}

const mixed = [
  { partId: 'P1', name: 'Bot',  material: 'BWP', rawWidth: 560, rawHeight: 720, qty: 4, grain: 'none' },
  { partId: 'P2', name: 'Shut', material: 'BWP', rawWidth: 600, rawHeight: 720, qty: 6, grain: 'none' },
  { partId: 'P3', name: 'Shelf',material: 'BWP', rawWidth: 564, rawHeight: 300, qty: 8, grain: 'none' }
];

test('cnc mode: no overlaps, in-bounds, area conserved', () => {
  const r = nestPanels(mixed, { mode: 'cnc' });
  checkSheetIntegrity(r, 'cnc');
});

test('guillotine mode: no overlaps, in-bounds, area conserved', () => {
  const r = nestPanels(mixed, { mode: 'guillotine' });
  checkSheetIntegrity(r, 'guillotine');
});

test('grain horizontal -> grain runs along sheet X (w === rawWidth)', () => {
  const parts = [{ partId: 'G', name: 'Grain', material: 'BWP', rawWidth: 600, rawHeight: 720, qty: 1, grain: 'horizontal' }];
  const r = nestPanels(parts, { mode: 'cnc' });
  assert.equal(r.unplacedParts.length, 0, 'horizontal grain part should place');
  const p = r.nestedSheets[0].placedParts[0];
  // horizontal grain: the grain direction (rawWidth) must lie along X => w === rawWidth
  assert.equal(p.w, p.rawWidth, 'horizontal grain part placed with grain NOT along X');
});

test('grain vertical -> grain runs along sheet Y (h === rawHeight)', () => {
  const parts = [{ partId: 'G', name: 'Grain', material: 'BWP', rawWidth: 600, rawHeight: 720, qty: 1, grain: 'vertical' }];
  const r = nestPanels(parts, { mode: 'cnc' });
  assert.equal(r.unplacedParts.length, 0, 'vertical grain part should place');
  const p = r.nestedSheets[0].placedParts[0];
  // vertical grain: the grain direction (rawHeight) must lie along Y => h === rawHeight
  assert.equal(p.h, p.rawHeight, 'vertical grain part placed with grain NOT along Y');
});

test('oversize part (larger than sheet) -> unplaced, no crash', () => {
  const parts = [{ partId: 'BIG', name: 'Big', material: 'BWP', rawWidth: 3000, rawHeight: 2000, qty: 1, grain: 'none' }];
  const r = nestPanels(parts, { mode: 'cnc' });
  assert.equal(r.unplacedParts.length, 1);
  assert.equal(r.nestedSheets.length, 0);
});

test('multi-material: parts grouped per sheet by material', () => {
  const parts = [
    { partId: 'A', material: 'BWP',  rawWidth: 600, rawHeight: 720, qty: 2, grain: 'none' },
    { partId: 'B', material: 'MDF',  rawWidth: 600, rawHeight: 720, qty: 2, grain: 'none' }
  ];
  const r = nestPanels(parts, { mode: 'cnc' });
  checkSheetIntegrity(r, 'multi');
  const materials = new Set(r.nestedSheets.map(s => s.material));
  assert.ok(materials.has('BWP') && materials.has('MDF'));
});

test('efficiency is a sane positive number per sheet', () => {
  const r = nestPanels(mixed, { mode: 'cnc' });
  for (const s of r.nestedSheets) {
    assert.ok(s.efficiency > 0 && s.efficiency <= 100, `sheet efficiency out of range: ${s.efficiency}`);
  }
});
