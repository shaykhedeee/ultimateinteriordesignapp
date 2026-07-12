// Regression tests for AURA toolReply dispatch — verifies each AURA tool calls
// the correct backend route and returns the right action envelope.
// Uses node:test's mock.method on globalThis.fetch (no server / API key needed,
// and never touches the local-LLM path that would try to download a model).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { toolReply, resolveIntent } = await import('../server/services/aura-orchestrator.js');

const PID = 'PROJ-1';

function withFetch(t, nextJson, fn) {
  const calls = [];
  const mk = t.mock.method(globalThis, 'fetch', (url, opts) => {
    calls.push({ url: String(url), method: (opts && opts.method) || 'GET', body: opts && opts.body });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(nextJson) });
  });
  return { calls, mk };
}

test('jali_generate -> POST jali-panel route (and reads size hint)', async (t) => {
  const { calls } = withFetch(t, { success: true, dxf: '/x.dxf', pdf: '/x.pdf' });
  const intent = resolveIntent('make a jaali panel 600x2000');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'make a jaali panel 600x2000');
  const c = calls.find(x => x.url.includes('/elevations/jali-panel'));
  assert.ok(c, 'called jali-panel endpoint');
  assert.equal(c.method, 'POST');
  assert.ok(/600/.test(c.body) && /2000/.test(c.body), 'passed extracted dims');
  assert.equal(r.actions.length, 0, 'success -> no nav action');
  assert.ok(/600×2000/.test(r.text));
});

test('shoe_rack -> POST shoe-rack route', async (t) => {
  const { calls } = withFetch(t, { success: true });
  const intent = resolveIntent('design a shoe rack');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'design a shoe rack');
  const c = calls.find(x => x.url.includes('/elevations/shoe-rack'));
  assert.ok(c, 'called shoe-rack endpoint');
  assert.ok(/shoe rack/i.test(r.text));
});

test('cutlist_refresh -> cutlist/refresh route, reports counts', async (t) => {
  const { calls } = withFetch(t, { success: true, moduleCount: 3, partCount: 42 });
  const intent = resolveIntent('refresh the cutlist from CAD');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'refresh the cutlist from CAD');
  const c = calls.find(x => x.url.includes('/cutlist/refresh'));
  assert.ok(c, 'called cutlist/refresh endpoint');
  assert.ok(/42 parts/.test(r.text));
});

test('delivery_pack -> delivery-package route', async (t) => {
  const { calls } = withFetch(t, { success: true });
  const intent = resolveIntent('build the client delivery package');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'build the client delivery package');
  const c = calls.find(x => x.url.includes('/delivery-package'));
  assert.ok(c, 'called delivery-package endpoint');
});

test('generate_quotation -> quotation/pdf route', async (t) => {
  const { calls } = withFetch(t, { success: true });
  const intent = resolveIntent('create the quotation PDF proposal');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'create the quotation PDF proposal');
  const c = calls.find(x => x.url.includes('/quotation/pdf'));
  assert.ok(c, 'called quotation/pdf endpoint');
});

test('vastu_check -> vastu/preview route', async (t) => {
  const { calls } = withFetch(t, { success: true, needsApply: false, changes: [] });
  const intent = resolveIntent('check vastu compliance');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'check vastu compliance');
  const c = calls.find(x => x.url.includes('/vastu/preview'));
  assert.ok(c, 'called vastu/preview endpoint');
});

test('graceful fallback: backend no success -> navigation action', async (t) => {
  const { calls } = withFetch(t, { success: false });
  const intent = resolveIntent('generate a jali panel');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'generate a jali panel');
  const act = r.actions[0];
  assert.ok(act && act.actionId === 'openJali', 'falls back to opening the designer');
});

test('unknown tool id -> noAnswer (never crashes)', async (t) => {
  withFetch(t, { success: true });
  const r = await toolReply({ id: 'ghost', label: 'x', action: 'ghost' }, { projectId: PID }, PID, '');
  assert.equal(r.actions.length, 0);
});
