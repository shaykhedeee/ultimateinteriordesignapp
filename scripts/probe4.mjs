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
const log = (n, c, note) => out.push(`${c >= 200 && c < 400 ? 'PASS' : 'FAIL'}  ${n}  [${c}] ${note || (c >= 400 ? '' : '')}`);
const projects = JSON.parse((await req('GET', '/api/projects')).body);
const pid = projects.find(x => x.lead_id)?.id || projects[0].id;
const fp = projects.find(x => x.id.startsWith('fp_en'))?.id || projects[0].id;

let r = await req('POST', `/api/projects/${pid}/delivery-package`, JSON.stringify({ items: [{ name: 'Wardrobe', qty: 1 }] }));
log('delivery-package POST', r.code, r.code < 400 ? 'created' : r.body.slice(0, 80));
r = await req('GET', `/api/pipeline/providers`); log('pipeline/providers GET', r.code, r.body.slice(0, 50));
r = await req('POST', `/api/projects/${pid}/pipeline/run`, JSON.stringify({ rooms: ['Living'], projectName: 'Test' }), 90000);
log('pipeline/run POST', r.code, r.code < 400 ? r.body.slice(0, 60) : r.body.slice(0, 80));
r = await req('GET', `/api/projects/${pid}/cutlist/calculate`);
log('cutlist/calculate POST-check', r.code, r.body.slice(0, 50));
r = await req('GET', `/api/projects/${fp}/measurements`);
log('measurements GET', r.code, r.body.slice(0, 50));
r = await req('GET', `/api/projects/${pid}/estimate-sets`);
log('estimate-sets GET', r.code, r.body.slice(0, 50));
r = await req('GET', `/api/projects/${pid}/purchase-orders`);
log('purchase-orders GET', r.code, r.body.slice(0, 50));
r = await req('GET', `/api/projects/${pid}/jobs`);
log('jobs GET', r.code, r.body.slice(0, 50));
r = await req('GET', `/api/projects/${pid}/drawings/elevations/auto/dxf`);
log('elev auto/dxf (regression)', r.code, r.body.length > 50 ? r.body.length + ' bytes' : r.body.slice(0, 50));

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
console.log(`\n=== ${out.length - fails.length}/${out.length} PASS, ${fails.length} FAIL ===`);
if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
