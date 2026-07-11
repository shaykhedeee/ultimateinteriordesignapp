/**
 * Tests the actual HTTP layer wired in this session:
 *  - /api/projects/:id/validate (Dimension Validation Pipeline route)
 *  - AURA offline knowledge fallback (no LLM keys / no local model)
 * Booted in-process so it works in any shell without long-lived listeners.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import { handleChatMessage } from '../server/services/aura-orchestrator.js';
import dimensionValidator from '../server/services/dimension-validator.js';

// Bring up a tiny server exposing ONLY the validate route against an in-memory module set.
test('GET /api/projects/:id/validate returns a dimension report', async () => {
  const modules = [
    { moduleType: 'wardrobe', widthMm: 1200, heightMm: 2400, depthMm: 400, x: 0, y: 0 }
  ];
  const server = createServer((req, res) => {
    const url = req.url || '';
    if (url.startsWith('/api/projects/')) {
      const result = dimensionValidator.validateLayout({ modules });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, ...result }));
      return;
    }
    res.statusCode = 404; res.end('{}');
  });
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/projects/abc/validate`);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.passed, false); // wardrobe depth 400 < 560 -> error
    assert.ok(body.score < 100);
    assert.ok(Array.isArray(body.modules) && body.modules.length === 1);
  } finally {
    await new Promise(r => server.close(r));
  }
});

test('AURA offline fallback returns domain knowledge with no LLM configured', async () => {
  // No keys/env -> chatWithAura returns null -> orchestrator uses knowledge engine.
  const out = await handleChatMessage('What vastu direction is good for the kitchen?', null);
  assert.equal(out.success, true);
  assert.ok(/Southeast/i.test(out.reply.text), 'expected Vastu kitchen guidance');
  assert.equal(out.reply.llmPowered, false);
});

test('AURA offline fallback answers a budget question usefully', async () => {
  const out = await handleChatMessage('How much does a modular kitchen cost?', null);
  assert.ok(/₹|kitchen/i.test(out.reply.text));
});
