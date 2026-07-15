import http from 'http';
import { writeFileSync } from 'fs';
const B = 'http://127.0.0.1:8787';
function req(m, p, body, ms = 15000) {
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
const traced = projects.find(x => x.id && x.id.startsWith('fp_en')) || projects[0];
const fp = traced.id, pid = projects[0].id;

let r = await req('GET', '/api/system/preflight'); let o = JSON.parse(r.body); log('preflight', r.code, `${o.checks ? o.checks.length : '?'} checks`);
r = await req('GET', '/api/leads'); log('leads list', r.code, `${JSON.parse(r.body).length} leads`);
log('projects list', 200, `${projects.length} projects`);
r = await req('POST', `/api/projects/${pid}/cutlist/refresh`);
r = await req('GET', `/api/projects/${pid}/cutlist`); let cl = JSON.parse(r.body);
log('cutlist', r.code, `sheets=${cl.sheetLayout?.sheets?.length} unplaced=${cl.sheetLayout?.unplaced?.length} waste=${cl.sheetLayout?.globalWastePercent}%`);
r = await req('POST', `/api/projects/${fp}/floorplan/analyze-enhance`, JSON.stringify({})); o = JSON.parse(r.body);
log('floorplan analyze-enhance', r.code, `rooms=${o.interpretation?.rooms?.length} suggestions=${o.enhancement?.suggestions?.length}`);
r = await req('POST', `/api/projects/${fp}/renders/generate`, JSON.stringify({ roomType: 'living', style: 'modern' })); o = JSON.parse(r.body);
log('render generate', r.code, `variants=${o.variants?.length} url=${o.variants?.[0]?.url || '(none)'}`);
r = await req('GET', `/api/projects/${fp}/renders`); o = JSON.parse(r.body);
log('renders list', r.code, `${Array.isArray(o) ? o.length : (o.renders?.length || 0)} renders`);
r = await req('GET', '/api/admin/documents'); log('deliverables vault', r.code, `${JSON.parse(r.body).documents?.length || 0} docs`);
r = await req('GET', '/api/elevation/learning'); log('elevation learning', r.code, '');

writeFileSync('/tmp/smoke.txt', out.join('\n'));
console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL'));
console.log(`\n=== ${out.length - fails.length}/${out.length} PASS, ${fails.length} FAIL ===`);
