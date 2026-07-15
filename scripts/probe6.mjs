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

let r = await req('GET', `/api/projects/${fp}/drawings/elevations/auto/dxf`); log('elev auto/dxf', r.code, r.body.length > 50 ? r.body.length + 'B' : r.body.slice(0, 80));
r = await req('GET', `/api/projects/${fp}/drawings/rcp`); log('rcp GET', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 80));
r = await req('POST', `/api/projects/${fp}/elevations/jali-panel`, JSON.stringify({ widthMm: 900, heightMm: 2100, pattern: 'floral', material: 'MDF' })); log('jali-panel POST', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 80));
r = await req('POST', `/api/projects/${pid}/renders`, JSON.stringify({ room: 'Living', style: 'indian-contemporary' }), 30000); log('renders POST', r.code, r.code < 400 ? r.body.slice(0, 60) : r.body.slice(0, 100));
r = await req('GET', `/api/projects/${pid}/renders/mistakes`); log('renders/mistakes GET', r.code, r.body.slice(0, 50));
r = await req('GET', `/api/projects/${pid}/scenes/current`); log('scenes/current GET', r.code, r.code < 400 ? r.body.slice(0, 60) : r.body.slice(0, 80));
r = await req('GET', `/api/projects/${pid}/scenes`); log('scenes GET', r.code, r.body.slice(0, 50));
r = await req('POST', `/api/projects/${pid}/renders/walkthrough`, JSON.stringify({ renderIds: [] }), 30000); log('walkthrough POST', r.code, r.code < 400 ? r.body.slice(0, 60) : r.body.slice(0, 80));
r = await req('POST', `/api/projects/${pid}/renders/upscale`, JSON.stringify({ renderId: 'x', scale: 2 })); log('upscale POST', r.code, r.code < 400 ? r.body.slice(0, 60) : r.body.slice(0, 80));
r = await req('GET', `/api/projects/${fp}/drawings/elevations/combined-pdf`); log('combined-pdf GET', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 80));
r = await req('GET', `/api/projects/${fp}/analyze-elevation`); log('analyze-elevation GET', r.code, r.code < 400 ? r.body.slice(0, 60) : r.body.slice(0, 80));

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
console.log(`\n=== ${out.length - fails.length}/${out.length} PASS, ${fails.length} FAIL ===`);
if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
