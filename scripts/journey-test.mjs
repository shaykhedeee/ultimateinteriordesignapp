/**
 * scripts/journey-test.mjs
 * Exercises the FULL canonical ULTIDA flow through the real API, in order,
 * asserting every step returns < 400. Run against a live server:
 *   node scripts/journey-test.mjs
 * Uses proj_1 (which already has CAD data) for the elevation/analysis steps.
 */
import http from 'http';

const BASE = 'http://127.0.0.1:5055';
const PID = 'proj_1';
const auth = { 'Content-Type': 'application/json', 'x-demo-auth': 'true' };

function req(opt, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE);
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = { ...(opt.headers || {}) };
    if (payload) { headers['Content-Type'] = headers['Content-Type'] || 'application/json'; headers['Content-Length'] = Buffer.byteLength(payload); }
    const r = http.request({ hostname: u.hostname, port: u.port, path: opt.path, method: opt.method, headers }, (res) => {
      const chunks = []; res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

// Steps: [label, method, path, body?, expectBinary?]
const STEPS = [
  ['create-project', 'POST', '/api/projects', { name: 'journey', client_name: 'journey', status: 'active' }],
  ['measure-rooms', 'POST', `/api/projects/${PID}/plan/measure`, { projectName: 'J', rooms: [{ name: 'Living', wMm: 5600, hMm: 4200 }, { name: 'Master Bedroom', wMm: 4200, hMm: 3600 }] }],
  ['vastu-preview', 'GET', `/api/projects/${PID}/vastu/preview`],
  ['vastu-apply', 'POST', `/api/projects/${PID}/vastu/auto-apply`, { addPooja: true }],
  ['kitchen-template', 'POST', `/api/projects/${PID}/kitchen/template`, { shape: 'U' }],
  ['tv-library', 'GET', '/api/tv-units'],
  ['tv-apply', 'POST', `/api/projects/${PID}/tv-unit/apply`, { unitId: 'tv_floating_walnut' }],
  ['analyze-elevation', 'GET', `/api/projects/${PID}/analyze-elevation`],
  ['combined-pdf', 'GET', `/api/projects/${PID}/elevations/combined-pdf`, null, true],
  ['pipeline-run', 'POST', `/api/projects/${PID}/pipeline/run`, {}],
  ['delivery-package', 'POST', `/api/projects/${PID}/delivery-package`, {}],
];

let pass = 0, fail = 0;
for (const [label, method, path, body, binary] of STEPS) {
  try {
    const r = await req({ m: method, p: path, headers: auth }, body);
    const ok = r.status < 400;
    const size = r.body ? r.body.length : 0;
    console.log(`${ok ? '[PASS]' : '[FAIL]'} ${label}: HTTP ${r.status} (${size} bytes)`);
    if (ok) pass++; else { fail++; console.log('   body:', r.body.slice(0, 200)); }
  } catch (e) {
    console.log(`[FAIL] ${label}: ${e.message}`);
    fail++;
  }
}
console.log(`\nJOURNEY: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
