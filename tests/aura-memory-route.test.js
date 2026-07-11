/**
 * tests/aura-memory-route.test.js
 * Guards the real bug we fixed: GET /api/aura/memory previously crashed with
 * "require is not defined" because the ESM module was loaded via require().
 * We assert the route resolves via the imported orchestrator and returns 200
 * with success:true and a (possibly empty) memory object.
 * (The server must be running on 127.0.0.1:8787.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://127.0.0.1:8787';
export { BASE };


test('GET /api/aura/memory returns 200 (no require-is-not-defined crash)', async () => {
  const res = await fetch(`${BASE}/api/aura/memory?projectId=proj_1`);
  assert.equal(res.status, 200, `expected 200, got ${res.status}`);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(typeof body.memory === 'object' && body.memory !== null, 'memory should be an object');
});
