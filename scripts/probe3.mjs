import http from 'http';
const B = 'http://127.0.0.1:8787';
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
const log = (n, c, note) => out.push(`${c >= 200 && c < 400 ? 'PASS' : 'FAIL'}  ${n}  [${c}] ${note || (c >= 400 ? '' : '')}`);
const projects = JSON.parse((await req('GET', '/api/projects')).body);
const pid = projects.find(x => x.lead_id)?.id || projects[0].id;
const fp = projects.find(x => x.id.startsWith('fp_en'))?.id || projects[0].id;

// delivery packages
let r = await req('GET', `/api/projects/${pid}/delivery-packages`); log('delivery-packages GET', r.code);
// pipeline runs
r = await req('GET', `/api/projects/${pid}/pipeline`); log('pipeline GET', r.code, r.body.slice(0,40));
// photo elevations
r = await req('GET', `/api/projects/${fp}/photo-elevations`); log('photo-elevations GET', r.code);
// renders
r = await req('GET', `/api/projects/${pid}/renders`); log('renders GET', r.code);
// cutlist full (already known 200) but check export endpoints
r = await req('GET', `/api/projects/${pid}/cutlist/dxf`); log('cutlist/dxf GET', r.code, r.body.slice(0,40));
r = await req('GET', `/api/projects/${pid}/cutlist/export?format=dxf`); log('cutlist/export dxf', r.code, r.body.slice(0,40));
r = await req('GET', `/api/projects/${pid}/cutlist/export?format=csv`); log('cutlist/export csv', r.code, r.body.slice(0,40));
// a scene version render-3d (need a versionId)
r = await req('GET', `/api/projects/${pid}/scenes`);
let scenes = JSON.parse(r.body); let vid = scenes[0]?.versionId || scenes[0]?.id;
if (vid) { r = await req('GET', `/api/projects/${pid}/scenes/${vid}/render-3d`); log('scene render-3d', r.code, r.body.slice(0,50)); }
else log('scene render-3d', 0, 'no scene version');
// variation-orders POST
r = await req('POST', `/api/projects/${pid}/variation-orders`, JSON.stringify({ title: 'Test VO', items: [{ desc: 'Change handle', cost: 500 }] }));
log('variation-orders POST', r.code, r.code < 400 ? 'created' : r.body.slice(0,50));
// budget-profiles POST
r = await req('POST', `/api/projects/${pid}/budget-profiles`, JSON.stringify({ name: 'Luxury', totalBudget: 500000 }));
log('budget-profiles POST', r.code, r.code < 400 ? 'created' : r.body.slice(0,50));

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
console.log(`\n=== ${out.length - fails.length}/${out.length} PASS, ${fails.length} FAIL ===`);
if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
