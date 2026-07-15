import { spawn } from 'node:child_process';
import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 8787;
const BASE = `http://127.0.0.1:${PORT}`;
const child = spawn('node', ['server/index.js'], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) } }, res => {
      const c = []; res.on('data', x => c.push(x)); res.on('end', () => resolve({ code: res.statusCode, body: Buffer.concat(c).toString() }));
    });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}
let buf = '';
child.stdout.on('data', d => buf += d);
child.stderr.on('data', d => buf += d);
(async () => {
  for (let i = 0; i < 40; i++) { await sleep(500); if (buf.includes('running at')) break; }
  // 1) paste a key via the BYOK endpoint (simulates Settings UI)
  const save = await req('POST', '/api/keys', { provider: 'gemini', key: 'AIzaTestConnectMechanism1234567890abcdef' });
  console.log('POST /api/keys (gemini):', save.code, JSON.parse(save.body).message || '');
  // 2) it should now appear in the keys list
  const list = await req('GET', '/api/settings/api-keys');
  console.log('GET /api/settings/api-keys:', list.code, (JSON.parse(list.body).keys||[]).map(k=>k.provider).join(','));
  // 3) hit an endpoint that resolves the key to prove injection
  const status = await req('GET', '/api/settings/ai-status');
  console.log('GET /api/settings/ai-status:', status.code, status.body.slice(0,200));
  child.kill('SIGTERM'); process.exit(0);
})().catch(e => { console.error('ERR', e); child.kill('SIGTERM'); process.exit(1); });
