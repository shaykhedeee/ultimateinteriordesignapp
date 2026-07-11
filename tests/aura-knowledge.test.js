/**
 * tests/aura-knowledge.test.js
 * Locks in the zero-config AURA knowledge engine: the chat ALWAYS returns a
 * useful, domain-accurate answer even with no LLM key configured.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerFromKnowledge, KNOWLEDGE } from '../server/services/aura-knowledge.js';

test('vastu question returns Vastu guidance', () => {
  const r = answerFromKnowledge('Where should I place the pooja room as per vastu?');
  assert.equal(r.topic, 'vastu');
  assert.ok(/Northeast/i.test(r.text));
});

test('kitchen question returns modular kitchen rules', () => {
  const r = answerFromKnowledge('What is the standard modular kitchen counter height?');
  assert.equal(r.topic, 'kitchen');
  assert.ok(/900/.test(r.text));
});

test('wardrobe question returns depth guidance', () => {
  const r = answerFromKnowledge('What depth should my wardrobe be?');
  assert.equal(r.topic, 'wardrobe');
  assert.ok(/600/.test(r.text));
});

test('generic greeting returns default helpful message', () => {
  const r = answerFromKnowledge('hello there');
  assert.equal(r.topic, 'default');
  assert.ok(/AURA/.test(r.text));
});

test('knowledge engine never returns empty text', () => {
  for (const q of ['', 'xyzzy nonsense', 'vastu', 'budget for full home']) {
    const r = answerFromKnowledge(q);
    assert.ok(typeof r.text === 'string' && r.text.length > 20, `empty for: ${q}`);
  }
});

test('every knowledge topic has keywords + an answer', () => {
  for (const [k, v] of Object.entries(KNOWLEDGE)) {
    assert.ok(Array.isArray(v.keywords), `${k} missing keywords`);
    assert.ok(typeof v.answer === 'string' && v.answer.length > 20, `${k} missing answer`);
  }
});
