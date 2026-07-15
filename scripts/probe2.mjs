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
function log(name, code, note) { out.push(`${code >= 200 && code < 400 ? 'PASS' : 'FAIL'}  ${name}  [${code}] ${note || ''}`); }
const projects = JSON.parse((await req('GET', '/api/projects')).body);
const pid = projects.find(x => x.lead_id)?.id || projects[0].id;
const traced = projects.find(x => x.id.startsWith('fp_en')) || projects[0];
const fp = traced.id;

let r = await req('GET', `/api/projects/${pid}/budget-profiles`); log('budget-profiles GET', r.code, r.code < 400 ? `${JSON.parse(r.body).length || 0} profiles` : r.body.slice(0,50));
r = await req('GET', `/api/projects/${pid}/variation-orders`); log('variation-orders GET', r.code, r.code < 400 ? '' : r.body.slice(0,50));
r = await req('GET', `/api/projects/${fp}/elevations/combined-pdf`); log('elevations combined-pdf', r.code, r.code === 200 ? 'PDF served' : r.body.slice(0,50));
r = await req('GET', `/api/projects/${fp}/drawings/elevations/auto/dxf`); log('drawings/elevations/auto/dxf', r.code, r.code === 200 ? 'DXF served' : r.body.slice(0,50));
r = await req('GET', `/api/projects/${pid}/scenes`); log('scenes GET', r.code, r.code < 400 ? `${JSON.parse(r.body).length || 0} scenes` : r.body.slice(0,50));
r = await req('GET', `/api/projects/${pid}/scenes/current`); log('scenes current', r.code, r.code < 400 ? '' : r.body.slice(0,50));
r = await req('GET', `/api/projects/${pid}/cutlist`); let cl = JSON.parse(r.body); log('cutlist GET', r.code, `sheets=${cl.sheetLayout?.sheets?.length}`);
r = await req('GET', `/api/projects/${pid}/quotation`); log('quotation GET', r.code, r.code < 400 ? '' : r.body.slice(0,50));

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
console.log(`\n=== ${out.length - fails.length}/${out.length} PASS, ${fails.length} FAIL ===`);
if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
