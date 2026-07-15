// Live functional probe of the ULTIDA API. Exercises headline endpoints against
// the running server and reports real status codes + payloads. No mocks.
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8787';

async function j(method, path, body, isForm) {
  const opts = { method, headers: {} };
  if (body) {
    if (isForm) { opts.body = body; }
    else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  }
  const res = await fetch(BASE + path, opts);
  let data = null;
  try { data = await res.json(); } catch { const t = await res.text(); data = t.slice(0, 200); }
  return { status: res.status, data };
}

const results = [];
const log = (name, r) => { results.push({ name, ...r }); console.log(`\n### ${name} -> ${r.status}`); console.log(JSON.stringify(r.data).slice(0, 400)); };

const p = await j('POST', '/api/projects', { name: 'PROBE', client_name: 'Probe', budget: 900000 });
log('create project', p);
const pid = p.data?.id;
if (!pid) { console.log('NO PID — abort'); process.exit(1); }

log('validate', await j('GET', `/api/projects/${pid}/validate`));
log('readiness', await j('GET', `/api/projects/${pid}/readiness`));
log('get project', await j('GET', `/api/projects/${pid}`));
log('cutlist refresh (no cad)', await j('POST', `/api/projects/${pid}/cutlist/refresh`));
log('cutlist get', await j('GET', `/api/projects/${pid}/cutlist`));
log('elevations auto dxf (no cad)', await j('GET', `/api/projects/${pid}/drawings/elevations/auto/dxf`));
log('elevations from-renders', await j('POST', `/api/projects/${pid}/elevations/from-renders`, { units: ['wardrobe-fluted'] }));
log('leads list', await j('GET', '/api/leads'));
log('render providers', await j('GET', '/api/render/providers'));
log('diagnostics api-health', await j('GET', '/api/diagnostics/api-health'));

// cleanup
await fetch(BASE + `/api/projects/${pid}`, { method: 'DELETE' });
console.log(`\n\n==== SUMMARY (${results.length} probes) ====`);
const bad = results.filter(r => r.status >= 500);
const notfound = results.filter(r => r.status === 404);
console.log('5xx:', bad.map(b => b.name).join(', ') || 'NONE');
console.log('404:', notfound.map(b => b.name).join(', ') || 'NONE');
console.log('clean:', results.filter(r => r.status < 400).map(b => b.name).join(', '));
