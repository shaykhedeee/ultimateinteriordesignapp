import http from 'http';
const B = 'http://127.0.0.1:8787';
function req(m, p, body, ms = 60000) {
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
const log = (n, c, note) => out.push(`${c >= 200 && c < 400 ? 'PASS' : (c === 404 ? '404 ' : 'FAIL')}  ${n}  [${c}] ${note || ''}`);
const projects = JSON.parse((await req('GET', '/api/projects')).body);
const pid = projects.find(x => x.lead_id)?.id || projects[0].id;
const fp = projects.find(x => x.id.startsWith('fp_en'))?.id || projects[0].id;

// gather ids
const cad = JSON.parse((await req('GET', `/api/projects/${fp}/cad`)).body);
const walls = cad.walls_json ? JSON.parse(cad.walls_json) : [];
const wallId = walls[0]?.id || 'w1';
const renders = JSON.parse((await req('GET', `/api/projects/${pid}/renders`)).body);
const renderId = renders[0]?.id;

let r;
// vastu
r = await req('GET', `/api/projects/${fp}/vastu/analyze`); log('vastu/analyze', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${fp}/vastu/suggest`); log('vastu/suggest', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${fp}/vastu/auto-apply-full`, '{}'); log('vastu/auto-apply-full', r.code, r.body.slice(0, 40));
// cad
r = await req('GET', `/api/projects/${fp}/cad`); log('cad GET', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${fp}/cad/ai-detect`, '{}'); log('cad/ai-detect', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${fp}/kitchen/template`, '{"shape":"L"}'); log('kitchen/template', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${fp}/tv-unit/apply`, '{"style":"floating"}'); log('tv-unit/apply', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${fp}/floorplan/auto-trace`, '{}'); log('floorplan/auto-trace', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${fp}/drawings/floorplan/dxf`); log('drawings/floorplan/dxf', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 40));
r = await req('POST', `/api/projects/${fp}/cad/render-to-dxf`, '{}'); log('cad/render-to-dxf', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${fp}/drawings/elevations/${wallId}/dxf`); log('drawings/elevations/:id/dxf', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 50));
r = await req('GET', `/api/projects/${fp}/drawings/elevations/${wallId}/pdf`); log('drawings/elevations/:id/pdf', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 50));
// renders
r = await req('GET', `/api/projects/${pid}/renders/mistakes`); log('renders/mistakes', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${pid}/renders/generate`, JSON.stringify({ room: 'Living', style: 'indian-contemporary' }), 30000); log('renders/generate', r.code, r.body.slice(0, 50));
r = await req('POST', `/api/projects/${pid}/renders/change-color`, JSON.stringify({ variantKey: 'a', componentType: 'cabinet', newColor: '#fff' })); log('renders/change-color', r.code, r.body.slice(0, 40));
if (renderId) {
  r = await req('POST', `/api/projects/${pid}/renders/${renderId}/review`, JSON.stringify({ reviewStatus: 'approved' })); log('renders/:id/review', r.code, r.body.slice(0, 40));
  r = await req('GET', `/api/projects/${pid}/renders/${renderId}/download`); log('renders/:id/download', r.code, r.body.slice(0, 40));
  r = await req('POST', `/api/projects/${pid}/renders/edit`, JSON.stringify({ renderId, prompt: 'change sofa' })); log('renders/edit', r.code, r.body.slice(0, 40));
  r = await req('POST', `/api/projects/${pid}/renders/mistake`, JSON.stringify({ renderId, mistake: 'wrong color', correction: 'fix' })); log('renders/mistake', r.code, r.body.slice(0, 40));
}
r = await req('POST', `/api/projects/${pid}/renders/analyse-components`, JSON.stringify({ room: 'Living' })); log('renders/analyse-components', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${pid}/renders/laminate-swap`, JSON.stringify({ fromLaminate: 'A', toLaminate: 'B' })); log('renders/laminate-swap', r.code, r.body.slice(0, 40));
// materials / quotation / finance
r = await req('GET', `/api/projects/${fp}/materials`); log('materials GET', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${fp}/quotation`); log('quotation GET', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${fp}/quotation`, JSON.stringify({ rooms: [{ name: 'Living', areaSqft: 200, grade: 'premium' }] })); log('quotation POST', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${fp}/estimate-sets`); log('estimate-sets GET', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${fp}/quotation/pdf`); log('quotation/pdf GET', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 40));
r = await req('GET', `/api/projects/${pid}/invoices`); log('invoices GET', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${pid}/payments`); log('payments GET', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${pid}/timeline`); log('timeline GET', r.code, r.body.slice(0, 40));
r = await req('GET', `/api/projects/${fp}/photo-elevations`); log('photo-elevations GET', r.code, r.body.slice(0, 40));

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
const notfound = out.filter(l => l.startsWith('404'));
console.log(`\n=== ${out.length - fails.length}/${out.length} OK, ${fails.length} FAIL, ${notfound.length} 404 ===`);
if (fails.length) console.log('FAILS:\n' + fails.join('\n'));
if (notfound.length) console.log('404s:\n' + notfound.join('\n'));
