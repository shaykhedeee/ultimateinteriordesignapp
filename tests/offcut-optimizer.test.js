import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runOffcutPass } from '../server/services/offcut-optimizer.js';

const SETTINGS = { kerfMm: 3, trimMm: 10 };

// Build a sheet with a known leftover free rect after one big placement.
function makeSheetWithScrap() {
  return {
    sheetNo: 1,
    lengthMm: 2440,
    widthMm: 1220,
    usedAreaSqM: 0,
    pieces: [],
    // full usable sheet minus a 2000x1000 block placed at top-left -> leftover strip
    freeRects: [
      { x: 10, y: 10, w: 2420, h: 200 },        // top sliver (after a 1000mm tall block)
      { x: 10, y: 1020, w: 2420, h: 190 }       // bottom sliver
    ]
  };
}

test('offcut pass rescues a small piece into scrap instead of leaving it unplaced', () => {
  const sheets = [makeSheetWithScrap()];
  const unplaced = [
    { partId: 'p1', partCode: 'SH1', name: 'Shutter 300', lengthMm: 300, widthMm: 180, grain: 'none' }
  ];
  const out = runOffcutPass(sheets, unplaced, SETTINGS);
  assert.equal(out.reused.length, 1, 'piece should be reused from offcut');
  assert.equal(out.unplaced.length, 0, 'no piece left unplaced');
  assert.equal(out.reused[0].fromOffcut, true);
  // sheet should now carry the reused piece
  assert.ok(sheets[0].pieces.some((p) => p.partCode === 'SH1'));
});

test('grain-locked piece does not rotate to fit', () => {
  const sheets = [makeSheetWithScrap()];
  // a 300x180 grain-locked piece; scrap rect is 2420x190 (w>>h) so only non-rotated fits
  const unplaced = [
    { partId: 'p2', partCode: 'GL1', name: 'Grain panel', lengthMm: 180, widthMm: 300, grain: 'length' }
  ];
  const out = runOffcutPass(sheets, unplaced, SETTINGS);
  // 180x300 rotated would be 300x180; grain-locked so only 180x300 tried -> won't fit 2420x190 width? 180<=2420,300<=190 no -> unplaced
  assert.equal(out.reused.length, 0, 'grain-locked oversize should not be forced to rotate');
});

test('offcut reuse reduces global waste vs opening a new sheet', () => {
  // Construct a primary nesting result: 1 sheet nearly full + 1 tiny leftover unplaced.
  const fullSheet = {
    sheetNo: 1, lengthMm: 2440, widthMm: 1220, usedAreaSqM: 2.6, pieces: [],
    freeRects: [{ x: 10, y: 10, w: 2420, h: 400 }] // ~0.96 m2 scrap, tall enough for a 400x300 part
  };
  const unplaced = [
    { partId: 'q1', partCode: 'S', name: 'Small', lengthMm: 400, widthMm: 300, grain: 'none' }
  ];
  const beforeArea = 2.6; // used on 1 sheet
  const out = runOffcutPass([fullSheet], unplaced, SETTINGS);
  assert.equal(out.reused.length, 1, 'small part rides the scrap');
  // used area should grow by ~0.12 m2 (0.4*0.3) without adding a sheet
  assert.ok(fullSheet.usedAreaSqM > beforeArea, 'used area credited from offcut');
  assert.ok(out.scrapAreaSqM >= 0);
});

test('offcut pass is additive — does not alter primary nesting when nothing unplaced', () => {
  const sheets = [makeSheetWithScrap()];
  const out = runOffcutPass(sheets, [], SETTINGS);
  assert.equal(out.unplaced.length, 0);
  assert.equal(out.reused.length, 0);
  assert.equal(sheets[0].pieces.length, 0);
});
