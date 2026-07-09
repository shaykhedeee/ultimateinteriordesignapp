/**
 * tests/aura-llm.test.js
 * Proves AURA is now LLM-wired and degrades safely:
 *  - chatWithAura returns null gracefully when no usable key is present
 *    (so the deterministic rule engine is the safe default, never a crash)
 *  - handleChatMessage ALWAYS returns a well-formed reply (success + text),
 *    with llmPowered/model reflecting whether a real LLM answered.
 * The real LLM path (OpenRouter llama-3.3-70b -> Gemini fallback) is exercised
 * live whenever valid BYOK keys are configured; without them it must fall back
 * without throwing, which is what these tests guard.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleChatMessage } from '../server/services/aura-orchestrator.js';
import { chatWithAura } from '../server/services/gemini-service.js';

test('chatWithAura degrades to null without a usable key (never throws)', async () => {
  const saved = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = '';
  try {
    const r = await chatWithAura({ message: 'hi', history: [], tools: [] });
    assert.equal(r, null);
  } finally {
    if (saved === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = saved;
  }
});

test('handleChatMessage always returns a formed reply (rule-engine fallback)', async () => {
  const saved = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = '';
  try {
    const out = await handleChatMessage('generate a 3d render of kitchen', 'aura_test_fb');
    assert.equal(out.success, true);
    assert.equal(typeof out.reply.text, 'string');
    assert.ok(out.reply.text.length > 0);
    // With no usable LLM key the envelope must honestly report offline mode.
    assert.equal(out.reply.llmPowered, false);
    assert.equal(out.reply.model, 'offline-rule-engine');
  } finally {
    if (saved === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = saved;
  }
});

test('conversational message still yields a reply in fallback mode', async () => {
  const saved = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = '';
  try {
    const out = await handleChatMessage('what is vastu?', 'aura_test_conv');
    assert.equal(out.success, true);
    assert.ok(out.reply.text.length > 0);
  } finally {
    if (saved === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = saved;
  }
});
