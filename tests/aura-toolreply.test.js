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

test('vastu_check -> vastu/analyze route', async (t) => {
  const { calls } = withFetch(t, { ok: true, counts: { compliant: 4, violation: 2, unknown: 0, total: 6 }, items: [{ status: 'violation', label: 'Bed', zone: 'NE', suggestion: { zone: 'SW', place: 'SW' } }], missingKeyItems: [] });
  const intent = resolveIntent('check vastu compliance');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'check vastu compliance');
  const c = calls.find(x => x.url.includes('/vastu/analyze'));
  assert.ok(c, 'called vastu/analyze endpoint');
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

test('kitchen_template -> kitchen/template POST (infers U shape from message)', async (t) => {
  const { calls } = withFetch(t, { ok: true, applied: 6, shape: 'U' });
  const intent = resolveIntent('apply a u-shape modular kitchen');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'apply a u-shape modular kitchen');
  const c = calls.find(x => x.url.includes('/kitchen/template'));
  assert.ok(c, 'called kitchen/template endpoint');
  assert.equal(c.method, 'POST');
  assert.ok(/"shape"\s*:\s*"U"/.test(c.body), 'passed U shape');
  assert.ok(/U-shape/.test(r.text));
});

test('apply_vastu -> vastu/auto-apply-full POST', async (t) => {
  const { calls } = withFetch(t, { ok: true, applied: [{ kind: 'add_pooja' }, { kind: 'move_bed' }] });
  const intent = resolveIntent('apply vastu fixes to my plan');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'apply vastu fixes to my plan');
  const c = calls.find(x => x.url.includes('/vastu/auto-apply-full'));
  assert.ok(c, 'called vastu/auto-apply-full endpoint');
  assert.ok(/Full Vastu applied/.test(r.text));
});

test('preview_vastu -> vastu/analyze GET, reports violation + missing counts', async (t) => {
  const { calls } = withFetch(t, { ok: true, items: [{ status: 'violation', label: 'Bed', zone: 'NE', suggestion: { zone: 'SW' } }, { status: 'compliant', label: 'Sofa' }], missingKeyItems: [{ key: 'pooja', summary: 'add NE pooja' }] });
  const intent = resolveIntent('preview the vastu changes first');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'preview the vastu changes first');
  const c = calls.find(x => x.url.includes('/vastu/analyze'));
  assert.ok(c, 'called vastu/analyze endpoint');
  assert.equal(c.method, 'GET');
  assert.ok(/1 item\(s\) in the wrong zone and 1 missing/.test(r.text));
  assert.equal(r.actions[0].actionId, 'applyVastuFixes');
});

test('tv_unit_apply -> tv-unit/apply POST when style named', async (t) => {
  const calls = [];
  const TV_UNITS = [
    { id: 'tv_high_gloss_black', name: 'High-Gloss Black Statement' },
    { id: 'tv_louvered_walnut', name: 'Louvered Walnut TV Wall' }
  ];
  t.mock.method(globalThis, 'fetch', (url, opts) => {
    const u = String(url);
    calls.push({ url: u, method: (opts && opts.method) || 'GET', body: opts && opts.body });
    if (u.includes('/api/tv-units')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(TV_UNITS) });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, applied: 'tv_high_gloss_black' }) });
  });
  const intent = resolveIntent('add a high-gloss black tv unit');
  const r = await toolReply(intent.tool, { projectId: PID }, PID, 'add a high-gloss black tv unit');
  const apply = calls.find(x => x.url.includes('/tv-unit/apply'));
  assert.ok(apply, 'called tv-unit/apply endpoint');
  assert.ok(/"unitId"\s*:\s*"tv_high_gloss_black"/.test(apply.body), 'passed resolved unit id');
  assert.ok(/High-Gloss Black/.test(r.text));
});
