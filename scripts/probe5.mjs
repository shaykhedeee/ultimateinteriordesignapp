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
const log = (n, c, note) => out.push(`${c >= 200 && c < 400 ? 'PASS' : 'FAIL'}  ${n}  [${c}] ${note || ''}`);
const projects = JSON.parse((await req('GET', '/api/projects')).body);
const pid = projects.find(x => x.lead_id)?.id || projects[0].id;
const fp = projects.find(x => x.id.startsWith('fp_en'))?.id || projects[0].id;

let r = await req('POST', `/api/projects/${fp}/drawings/elevations/auto/dxf`); log('elev auto/dxf', r.code, r.body.length > 50 ? r.body.length + 'B' : r.body.slice(0, 60));
r = await req('POST', `/api/projects/${fp}/drawings/elevations/auto/pdf`); log('elev auto/pdf', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${fp}/drawings/jali/2320x900`); log('jali dxf', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${pid}/rcp`); log('rcp GET', r.code, r.body.slice(0, 50));
r = await req('POST', `/api/projects/${pid}/quotation`, JSON.stringify({ rooms: [{ name: 'Living', areaSqft: 200, grade: 'premium' }] })); log('quotation POST', r.code, r.code < 400 ? r.body.slice(0, 60) : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${pid}/renders`); log('renders GET', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${pid}/render`, JSON.stringify({ room: 'Living', style: 'indian-contemporary' }), 30000); log('render POST', r.code, r.code < 400 ? r.body.slice(0, 60) : r.body.slice(0, 80));
r = await req('GET', `/api/projects/${fp}/scene/3d`); log('scene 3d GET', r.code, r.code < 400 ? r.body.slice(0, 50) : r.body.slice(0, 50));
r = await req('POST', `/api/projects/${fp}/scene/3d`, JSON.stringify({ style: 'modern' })); log('scene 3d POST', r.code, r.code < 400 ? r.body.slice(0, 50) : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${fp}/panorama`); log('panorama GET', r.code, r.code < 400 ? r.body.slice(0, 50) : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${pid}/corrections`); log('corrections GET', r.code, r.body.slice(0, 40));
r = await req('POST', `/api/projects/${pid}/exports/dae`, JSON.stringify({}), 30000); log('exports dae POST', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 60));

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
console.log(`\n=== ${out.length - fails.length}/${out.length} PASS, ${fails.length} FAIL ===`);
if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
