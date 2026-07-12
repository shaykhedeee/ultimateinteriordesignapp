// Regression tests for component-color-service.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import colorService from '../server/services/component-color-service.js';

test('getColorFamily resolves a hex string correctly', () => {
  // Beige-ish neutral
  assert.equal(colorService.getColorFamily('#d4c5b2'), 'neutral');
});

test('getColorFamily resolves a color NAME to its family (not always neutral)', () => {
  // 'Navy Blue' is a jewel tone; before the fix this returned 'neutral' (NaN parse)
  const fam = colorService.getColorFamily('Navy Blue');
  // Navy Blue hex #1e4d6e -> r<100,g<100,b>100 => jewel
  assert.equal(fam, 'jewel');
});

test('getAvailableColors returns the sofa palette for unknown components (safe default)', () => {
  const p = colorService.getAvailableColors('random-thing');
  assert.ok(p && p.materials && p.materials.fabric, 'should fall back to sofa palette');
});

test('getAvailableColors maps tv-unit variants to the TV palette', () => {
  const p = colorService.getAvailableColors('TV_Unit');
  assert.equal(p.category, 'TV Units & Entertainment');
});

test('applyColorChange rejects a color not in the palette', async () => {
  const res = await colorService.applyColorChange(
    { projectId: 'p1', currentColors: {} },
    { componentType: 'sofa', newColor: 'Neon Green' }
  );
  assert.equal(res.success, false);
  assert.match(res.error, /not available/i);
});

test('applyColorChange accepts a valid palette color and returns its hex', async () => {
  const res = await colorService.applyColorChange(
    { projectId: 'p1', currentColors: {} },
    { componentType: 'sofa', newColor: 'Beige' }
  );
  assert.equal(res.success, true);
  assert.equal(res.colorHex, '#d4c5b2');
});

test('suggestPalette uses the real color family (jewel -> neutral walls, not neutral-only)', () => {
  // 'Navy Blue' is jewel; suggestions should reflect jewel pairing (Off White walls etc.)
  const sugg = colorService.suggestPalette('living', 'Navy Blue');
  assert.ok(Array.isArray(sugg) && sugg.length > 0);
  assert.ok(sugg.some(s => /off white|wall/i.test(s.role + s.name)), 'jewel base should suggest neutral walls');
});
