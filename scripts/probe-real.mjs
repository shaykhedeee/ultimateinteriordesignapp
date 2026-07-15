/**
 * probe-real.mjs — honest endpoint probe for ULTIDA.
 * Walks the canonical journey with CORRECT request params (the old journey-test
 * passed {m,p} to a fn that reads {method,path} — so it hit GET /undefined and
 * greenwashed everything). This version actually hits real routes and reports
 * real status codes + body snippets so we can find genuinely broken features.
 *
 * Usage: APP_URL=http://127.0.0.1:8787 PORT=8787 node scripts/probe-real.mjs
 */
import http from 'node:http';

const BASE = process.env.APP_URL || ('http://127.0.0.1:' + (process.env.PORT || 8787));
const PID = process.env.PID || 'proj_1';
const auth = { 'Content-Type': 'application/json', 'x-demo-auth': 'true' };

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE);
    const payload = body != null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = { ...auth };
    if (payload) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(payload); }
    const r = http.request({ hostname: u.hostname, port: u.port, path, method, headers }, (res) => {
      const chunks = []; res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', body: Buffer.concat(chunks).toString('utf8') }));
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function isJson(r) { return (r.ct || '').includes('application/json'); }
function summ(r) {
  const b = r.body || '';
  if (isJson(r)) { try { const j = JSON.parse(b); if (j.error) return 'err=' + j.error; if (j.message) return ('' + j.message).slice(0, 80); return b.slice(0, 80); } catch { return b.slice(0, 80); } }
  return (r.ct.includes('text/html') ? '<html 404/500 page>' : r.ct) + ' ' + b.slice(0, 60);
}

const STEPS = [
  ['create-project', 'POST', '/api/projects', { name: 'probe', client_name: 'probe', status: 'active' }],
  ['list-projects', 'GET', '/api/projects'],
  ['get-project', 'GET', `/api/projects/${PID}`],
  ['get-cad', 'GET', `/api/projects/${PID}/cad`],
  ['ai-detect', 'POST', `/api/projects/${PID}/cad/ai-detect`, {}],
  ['detect-walls-vision-nofile', 'POST', `/api/projects/${PID}/cad/detect-walls-vision`, {}],
  ['measure-rooms', 'POST', `/api/projects/${PID}/plan/measure`, { projectName: 'J', rooms: [{ name: 'Living', wMm: 5600, hMm: 4200 }] }],
  ['vastu-preview', 'GET', `/api/projects/${PID}/vastu/preview`],
  ['vastu-analyze', 'GET', `/api/projects/${PID}/vastu/analyze`],
  ['vastu-auto-apply', 'POST', `/api/projects/${PID}/vastu/auto-apply`, { addPooja: true }],
  ['kitchen-template', 'POST', `/api/projects/${PID}/kitchen/template`, { shape: 'U' }],
  ['tv-library', 'GET', '/api/tv-units'],
  ['tv-apply', 'POST', `/api/projects/${PID}/tv-unit/apply`, { unitId: 'tv_louvered_walnut' }],
  ['analyze-elevation', 'GET', `/api/projects/${PID}/analyze-elevation`],
  ['combined-pdf', 'GET', `/api/projects/${PID}/elevations/combined-pdf`],
  ['pipeline-run', 'POST', `/api/projects/${PID}/pipeline/run`, {}],
  ['delivery-package', 'POST', `/api/projects/${PID}/delivery-package`, {}],
  ['cutlist', 'GET', `/api/projects/${PID}/cutlist`],
  ['cutlist-calc', 'POST', `/api/projects/${PID}/cutlist/calculate`, { cabinets: [{ id: 'c1', type: 'base', widthMm: 2400, heightMm: 720, depthMm: 560, material: 'Plywood' }] }],
  ['finance-quote', 'GET', `/api/projects/${PID}/estimate-sets`],
  ['materials', 'GET', `/api/material-catalog`],
  ['project-materials', 'GET', `/api/projects/${PID}/materials`],
  ['room-templates', 'GET', `/api/room-templates`],
  ['aura-status', 'GET', `/api/aura/agents`],
  ['system-preflight', 'GET', `/api/system/preflight`],
  ['health', 'GET', `/api/health`],
];

let pass = 0, fail = 0, warn = 0;
for (const [label, method, path, body] of STEPS) {
  try {
    const r = await req(method, path, body);
    const json = isJson(r) ? (() => { try { return JSON.parse(r.body); } catch { return null; } })() : null;
    // A 200 that returns an HTML error page is a fail; a 404/500 is a fail.
    const htmlErr = r.ct.includes('text/html') && (r.status >= 400 || r.body.includes('Cannot') || r.body.includes('<!DOCTYPE'));
    const ok = r.status < 400 && !htmlErr;
    const note = r.status >= 400 ? `HTTP ${r.status}` : (htmlErr ? 'HTML-err' : '');
    if (ok) { pass++; console.log(`[PASS] ${label}: ${r.status} (${r.body.length}b) ${json && json.success === false ? 'NOTE:success=false' : ''}`); if (json && json.success === false) warn++; }
    else { fail++; console.log(`[FAIL] ${label}: ${note} ${summ(r)}`); }
    if (r.status === 200 && json && json.success === false) console.log('      -> ' + summ(r));
  } catch (e) {
    fail++; console.log(`[FAIL] ${label}: ${e.message}`);
  }
}
console.log(`\nREAL PROBE: ${pass} passed, ${fail} failed, ${warn} success=false`);
process.exit(fail ? 1 : 0);
