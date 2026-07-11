// Unit tests for the shared 3D material engine (lib/threeMaterials.js).
// Pure helpers (resolveFinish / colorToHex / pickTexture) are dependency-free and
// verify the "3D material selector -> live textures" mapping is correct.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveFinish, colorToHex, pickTexture, LAMINATE_COLORS } from '../frontend/src/lib/threeMaterials.js';

test('resolveFinish maps gloss/acrylic to low roughness + some metalness', () => {
  const g = resolveFinish('Acrylic Gloss');
  assert.equal(g.roughness, 0.1);
  assert.equal(g.metalness, 0.25);
  const a = resolveFinish('GLOSS');
  assert.equal(a.roughness, 0.1);
});

test('resolveFinish maps matte/suede to high roughness + low metalness', () => {
  const m = resolveFinish('Suede Matte');
  assert.equal(m.roughness, 0.85);
  assert.equal(m.metalness, 0.05);
});

test('resolveFinish defaults sensibly for unknown finish', () => {
  const d = resolveFinish('');
  assert.equal(d.roughness, 0.5);
  assert.equal(d.metalness, 0.15);
});

test('colorToHex parses #rrggbb to int and guards bad input', () => {
  assert.equal(colorToHex('#c29a6b'), 0xc29a6b);
  assert.equal(colorToHex('c29a6b'), 0xc29a6b);
  assert.equal(colorToHex('#1e293b'), 0x1e293b);
  // bad/empty -> fallback
  assert.equal(colorToHex('not-a-color', 0x123456), 0x123456);
  assert.equal(colorToHex(null), 0xf3f4f6);
  assert.equal(colorToHex(0xabcdef), 0xabcdef); // numbers pass through
});

test('pickTexture returns woodgrain for wood/laminate/oak names', () => {
  assert.equal(pickTexture({ name: 'Classic Warm Oak Woodgrain' }), 'woodgrain');
  assert.equal(pickTexture({ name: 'Premium Frosty White SF', finish: 'Textured Wood' }), 'woodgrain');
  assert.equal(pickTexture({ name: 'Charcoal Matte Acrylic' }), null); // no wood cue
});

test('pickTexture returns marble for stone/marble/quartz names', () => {
  assert.equal(pickTexture({ name: 'Italian Marble' }), 'marble');
  assert.equal(pickTexture({ name: 'Granite Black' }), 'marble');
  assert.equal(pickTexture({ name: 'Quartz White' }), 'marble');
});

test('LAMINATE_COLORS fallback palette covers the 4 default ids', () => {
  for (const id of ['lam_1', 'lam_2', 'lam_3', 'lam_4']) {
    assert.ok(typeof LAMINATE_COLORS[id] === 'number');
  }
});
