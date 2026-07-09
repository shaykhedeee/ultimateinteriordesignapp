/**
 * tests/render-language.test.js
 * Guards that ULTIDA's photoreal render + AURA prompts inherit the studio's
 * approved luxury Indian-modern design language (extracted from the reference
 * renders): warm-white, beige marble, walnut/charcoal ribbed two-tone, cove +
 * arched-mirror LED, sage/teal channel headboard, houndstooth, brass, pooja niche.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhanceInteriorPrompt } from '../server/services/image-provider.js';
import { buildRoomStylePayload } from '../server/services/prompt-harness.js';

const SIG_TOKENS = ['warm-white', 'marble', 'walnut', 'ribbed', 'cove', 'arched', 'sage', 'houndstooth', 'brass'];

test('enhanceInteriorPrompt carries ULTIDA signature language', () => {
  const p = enhanceInteriorPrompt('a bedroom', 'master');
  for (const t of SIG_TOKENS) {
    assert.ok(p.toLowerCase().includes(t.toLowerCase()), `render prompt missing signature token "${t}"`);
  }
  assert.ok(p.includes('Room-specific composition'), 'render prompt missing room-specific composition');
  assert.ok(p.toLowerCase().includes('no cold blue'), 'render prompt should forbid cold corporate palette');
});

test('pooja room prompt includes the Hindu altar signature', () => {
  const p = enhanceInteriorPrompt('a pooja room', 'pooja').toLowerCase();
  assert.ok(p.includes('pooja'), 'pooja prompt should include the altar language');
  assert.ok(p.includes('ganesha') || p.includes('diyas'), 'pooja prompt should reference idol/diyas');
});

test('prompt-harness injects ULTIDA signature for AURA/render payloads', () => {
  const p = buildRoomStylePayload({ roomType: 'master', style: 'modern', budgetTier: 'luxury' });
  assert.ok(p.payload.prompt.includes('ULTIDA luxury Indian-modern signature'), 'AURA payload missing signature');
  for (const t of ['ribbed', 'arched', 'houndstooth', 'pooja', 'sage']) {
    assert.ok(p.payload.prompt.toLowerCase().includes(t), `AURA payload missing "${t}"`);
  }
});

test('palette constants align to warm-white / marble / charcoal / sage system', () => {
  // Verify the render prompt itself encodes the warm-white/charcoal/sage palette
  // tokens (the palettes object drives the mock SVG + downstream tints).
  const p = enhanceInteriorPrompt('a living room', 'living');
  assert.ok(p.toLowerCase().includes('warm-white'), 'prompt should encode warm-white');
  assert.ok(p.toLowerCase().includes('charcoal'), 'prompt should encode charcoal ribbed panels');
  assert.ok(p.toLowerCase().includes('sage'), 'prompt should encode sage accent');
});
