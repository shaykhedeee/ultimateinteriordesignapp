import http from 'http';
const B = 'http://127.0.0.1:5055';
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

let r = await req('GET', `/api/projects/${fp}/drawings/elevations/auto/dxf`); log('elev auto/dxf', r.code, r.body.length > 50 ? r.body.length + 'B' : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${fp}/elevations/combined-pdf`); log('combined-pdf', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${fp}/cutlist/export?format=csv`); log('cutlist export csv', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${fp}/cutlist/export?format=dxf`); log('cutlist export dxf', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 60));
r = await req('POST', `/api/projects/${pid}/variation-orders`, JSON.stringify({ title: 'VO', costDelta: 1500 })); log('variation-orders POST', r.code, r.code < 400 ? 'ok' : r.body.slice(0, 60));
r = await req('POST', `/api/projects/${pid}/budget-profiles`, JSON.stringify({ budgetBand: 'luxury' })); log('budget-profiles POST', r.code, r.code < 400 ? 'ok' : r.body.slice(0, 60));
r = await req('POST', `/api/projects/${pid}/pipeline/run`, JSON.stringify({ rooms: ['Living'] })); log('pipeline/run str-rooms', r.code, r.code < 400 ? r.body.slice(0, 40) : r.body.slice(0, 60));
r = await req('POST', `/api/projects/${pid}/pipeline/run`, JSON.stringify({ rooms: [] })); log('pipeline/run empty', r.code, r.code === 400 ? '400 ok' : r.body.slice(0, 60));
r = await req('POST', `/api/projects/${pid}/delivery-package`, JSON.stringify({ items: [{ name: 'W', qty: 1 }] })); log('delivery-package POST', r.code, r.code < 400 ? 'ok' : r.body.slice(0, 60));
r = await req('GET', `/api/pipeline/providers`); log('pipeline/providers', r.code, r.code < 400 ? 'ok' : r.body.slice(0, 60));
r = await req('POST', `/api/projects/${pid}/renders/walkthrough`, JSON.stringify({ room: 'Living' }), 40000); log('walkthrough POST', r.code, r.code < 400 ? 'ok' : r.body.slice(0, 60));
r = await req('POST', `/api/projects/${fp}/elevations/jali-panel`, JSON.stringify({ widthMm: 900, heightMm: 2100 })); log('jali-panel POST', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 60));
r = await req('GET', `/api/projects/${fp}/drawings/rcp`); log('rcp GET', r.code, r.code < 400 ? r.body.length + 'B' : r.body.slice(0, 60));

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
console.log(`\n=== ${out.length - fails.length}/${out.length} PASS, ${fails.length} FAIL ===`);
if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
