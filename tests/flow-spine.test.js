import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';

const B = 'http://127.0.0.1:5055';
function req(m, p, body, ms = 30000) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ code: 0, body: 'TIMEOUT' }), ms);
    const r = http.request(B + p, { method: m, headers: { 'content-type': 'application/json' } }, (x) => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => { clearTimeout(t); res({ code: x.statusCode, body: d }); });
    });
    r.on('error', e => { clearTimeout(t); res({ code: 0, body: e.message }); });
    if (body) r.write(body); r.end();
  });
}

test('advance-step follows the canonical workflow spine and syncs status', async () => {
  const projects = JSON.parse((await req('GET', '/api/projects')).body);
  const pid = (projects.find(p => p.lead_id) || projects[0]).id;

  const order = ['brief', 'cad', 'studio', 'drawings', 'renders', 'materials', 'cutlist', 'finance', 'presentation'];
  const expectedStatus = {
    brief: 'brief', cad: 'cad_approved', studio: 'scene_ready', drawings: 'scene_ready',
    renders: 'renders_approved', materials: 'materials_selected', cutlist: 'production',
    finance: 'billing', presentation: 'billing'
  };
  for (const step of order) {
    const r = await req('POST', `/api/projects/${pid}/advance-step`, JSON.stringify({ step }));
    assert.equal(r.code, 200, `advance-step ${step} should be 200`);
    const j = JSON.parse(r.body);
    assert.equal(j.current_step, step);
    assert.equal(j.status, expectedStatus[step]);
  }

  // Unknown step is rejected, not a 500.
  const bad = await req('POST', `/api/projects/${pid}/advance-step`, JSON.stringify({ step: 'nope' }));
  assert.equal(bad.code, 400);
});

test('AURA action routes resolve (no stale 404 endpoints)', async () => {
  const projects = JSON.parse((await req('GET', '/api/projects')).body);
  const fp = (projects.find(p => p.id.startsWith('fp_en')) || projects[0]).id;

  const checks = [
    ['POST', `/api/projects/${fp}/cutlist/refresh`, undefined],
    // cutlist/calculate requires a cabinets payload; 400 (validation) is fine — we only
    // assert the endpoint exists (not 404) and doesn't crash (not 500).
    ['POST', `/api/projects/${fp}/cutlist/calculate`, JSON.stringify({ cabinets: [] })],
    ['GET', `/api/projects/${fp}/drawings/elevations/auto/dxf`, undefined],
    ['POST', `/api/projects/${fp}/cad/ai-detect`, undefined],
    ['POST', `/api/projects/${fp}/client-share?pack=quotation`, undefined]
  ];
  for (const [m, p, b] of checks) {
    const r = await req(m, p, b);
    assert.ok(r.code >= 200 && r.code < 500 && r.code !== 404, `${m} ${p} should resolve (got ${r.code})`);
  }
});

test('GET /quotation/pdf works without a body (screen downloads via GET)', async () => {
  const projects = JSON.parse((await req('GET', '/api/projects')).body);
  const fp = (projects.find(p => p.id.startsWith('fp_en')) || projects[0]).id;
  const r = await req('GET', `/api/projects/${fp}/quotation/pdf`);
  assert.equal(r.code, 200, 'GET quotation/pdf should be 200 (was 404 before GET route existed)');
});

test('POST /renders/generate is bounded (no infinite hang when no provider)', async () => {
  const projects = JSON.parse((await req('GET', '/api/projects')).body);
  const pid = (projects.find(p => p.lead_id) || projects[0]).id;
  // 25s cap — if the route were unguarded it would hang far longer.
  const r = await req('POST', `/api/projects/${pid}/renders/generate`, JSON.stringify({ room: 'Living', style: 'indian-contemporary' }), 25000);
  assert.ok(r.code >= 200 && r.code < 400, `renders/generate should resolve (got ${r.code})`);
});

test('cutlist GET reflects /cutlist/calculate output (production_cutlists is canonical)', async () => {
  const projects = JSON.parse((await req('GET', '/api/projects')).body);
  const pid = (projects.find(p => p.lead_id) || projects[0]).id;
  const calc = await req('POST', `/api/projects/${pid}/cutlist/calculate`,
    JSON.stringify({ cabinets: [{ name: 'Base', width: 900, height: 720, depth: 560, carcassPly: 18 }] }));
  assert.equal(calc.code, 200, 'cutlist/calculate should accept a cabinet');
  // The live GET must now return the computed cutlist (id + projectId), proving
  // the GET reads the same store the UI's "Run Nesting Slices" writes.
  const r = await req('GET', `/api/projects/${pid}/cutlist`);
  assert.equal(r.code, 200, 'cutlist GET should be 200 after calculate (was 404 before coherence fix)');
  const data = JSON.parse(r.body);
  assert.ok(data.id && data.projectId, 'cutlist GET should carry id + projectId');
});

test('POST /api/projects honors lead_id (client-board send-designs depends on it)', async () => {
  const lead = JSON.parse((await req('POST', '/api/leads/import',
    JSON.stringify({ leadList: [{ name: 'Link Tester', phone: '+91 90000 11111', email: 'link@x.com', budget: 500000 }] }))).body);
  const leadId = lead.leads[0].id;
  const proj = JSON.parse((await req('POST', '/api/projects',
    JSON.stringify({ name: 'Link Test', lead_id: leadId }))).body);
  assert.equal(proj.lead_id, leadId, 'POST /api/projects should persist lead_id');
  await req('DELETE', `/api/projects/${proj.id}`);
  await req('DELETE', `/api/leads/${leadId}`);
});
