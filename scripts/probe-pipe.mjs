import http from 'http';
const B = 'http://127.0.0.1:5055';
function req(m, p, body, ms = 90000) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ code: 0, body: 'TIMEOUT' }), ms);
    const r = http.request(B + p, { method: m, headers: { 'content-type': 'application/json' } }, (x) => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => { clearTimeout(t); res({ code: x.statusCode, body: d }); });
    });
    r.on('error', e => { clearTimeout(t); res({ code: 0, body: e.message }); });
    if (body) r.write(body); r.end();
  });
}
const projects = JSON.parse((await req('GET', '/api/projects')).body);
const pid = projects.find(x => x.lead_id)?.id || projects[0].id;
const r = await req('POST', `/api/projects/${pid}/pipeline/run`, JSON.stringify({ rooms: [{ name: 'Living', w: 5600, h: 4200, openings: [], cabinets: [] }], projectName: 'TestRun' }), 90000);
console.log('code', r.code);
try { console.log(JSON.stringify(JSON.parse(r.body), null, 2)); } catch { console.log(r.body.slice(0, 400)); }
