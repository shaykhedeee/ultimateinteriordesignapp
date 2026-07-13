import http from 'http';
const B = 'http://127.0.0.1:5055';
function req(m, p, body, ms = 20000) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ code: 0, body: 'TIMEOUT' }), ms);
    const r = http.request(B + p, { method: m, headers: { 'content-type': 'application/json' } }, (x) => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => { clearTimeout(t); res({ code: x.statusCode, body: d }); });
    });
    r.on('error', e => { clearTimeout(t); res({ code: 0, body: e.message }); });
    if (body) r.write(body); r.end();
  });
}
const out = [];
function log(name, code, note) { out.push(`${code >= 200 && code < 400 ? 'PASS' : 'FAIL'}  ${name}  [${code}] ${note || ''}`); }
const projects = JSON.parse((await req('GET', '/api/projects')).body);
const pid = projects.find(x => x.lead_id)?.id || projects[0].id;
const traced = projects.find(x => x.id.startsWith('fp_en')) || projects[0];
const fp = traced.id;

// Quotation
let r = await req('GET', `/api/projects/${pid}/quotation`); log('quotation GET', r.code, r.code < 400 ? '' : r.body.slice(0, 60));
// Budget
r = await req('GET', `/api/projects/${pid}/budget`); log('budget GET', r.code, r.code < 400 ? '' : r.body.slice(0, 60));
// Cutlist DXF export
r = await req('GET', `/api/projects/${pid}/cutlist/dxf`); log('cutlist DXF', r.code, r.body.length > 50 ? `${r.body.length} bytes` : r.body.slice(0, 60));
// Cutlist CSV
r = await req('GET', `/api/projects/${pid}/cutlist/csv`); log('cutlist CSV', r.code, r.code < 400 ? `${r.body.length} bytes` : r.body.slice(0, 60));
// Materials
r = await req('GET', `/api/projects/${pid}/materials`); log('materials GET', r.code, r.code < 400 ? '' : r.body.slice(0, 60));
// Measurements
r = await req('GET', `/api/projects/${pid}/measurements`); log('measurements GET', r.code, r.code < 400 ? '' : r.body.slice(0, 60));
// Elevations list
r = await req('GET', `/api/projects/${pid}/elevations`); log('elevations GET', r.code, r.code < 400 ? '' : r.body.slice(0, 60));
// Variations
r = await req('GET', `/api/projects/${pid}/variations`); log('variations GET', r.code, r.code < 400 ? '' : r.body.slice(0, 60));
// Timeline
r = await req('GET', `/api/projects/${pid}/timeline`); log('timeline GET', r.code, r.code < 400 ? '' : r.body.slice(0, 60));
// Project status advance
r = await req('POST', `/api/projects/${pid}/status`, JSON.stringify({ status: 'cad_approved', currentStep: 'materials' })); log('status advance', r.code, r.code < 400 ? '' : r.body.slice(0, 60));
// Render-3d from floorplan (the deeper generator)
r = await req('POST', `/api/projects/${fp}/scenes/level_0/render-3d`, JSON.stringify({})); log('render-3d scene', r.code, r.code < 400 ? r.body.slice(0, 80) : r.body.slice(0, 80));
// Floor plan auto-trace (need a dxf) - try existing
r = await req('GET', '/api/projects'); // noop

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
console.log(`\n=== ${out.length - fails.length}/${out.length} PASS, ${fails.length} FAIL ===`);
if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
