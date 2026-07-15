import { spawn } from 'node:child_process';
import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const B = 'http://127.0.0.1:8787';
function req(m, p, body, ms = 30000) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ code: 0, body: 'TIMEOUT' }), ms);
    const r = http.request(B + p, { method: m, headers: { 'content-type': 'application/json' } }, (x) => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => { clearTimeout(t); res({ code: x.statusCode, body: d }); });
    });
    r.on('error', e => { clearTimeout(t); res({ code: 0, body: e.message }); });
    if (body) r.write(body); r.end();
  });
}

const child = spawn('node', ['server/index.js'], { cwd: process.cwd(), env: { ...process.env, PORT: '8787' }, stdio: 'ignore' });
await sleep(5000);

try {
  const projects = JSON.parse((await req('GET', '/api/projects')).body);
  const pid = projects.find(x => x.lead_id)?.id || projects[0].id;
  // renders/edit on a placeholder render (no image) should now be 404, not 500
  const renders = JSON.parse((await req('GET', `/api/projects/${pid}/renders`)).body);
  const target = renders.find(r => !r.image_url) || renders[0];
  const r = await req('POST', `/api/projects/${pid}/renders/edit`, JSON.stringify({ assetId: target?.id, revisionRequest: 'change sofa' }), 15000);
  console.log('renders/edit (missing asset) [' + r.code + '] ' + r.body.slice(0, 80));
  console.log(r.code === 404 ? 'PASS renders/edit hardens to 404' : (r.code === 500 ? 'FAIL still 500' : 'INFO code=' + r.code));
} finally {
  child.kill('SIGKILL');
}
