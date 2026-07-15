import { spawn } from 'node:child_process';
import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 8787;
const BASE = `http://127.0.0.1:${PORT}`;
const child = spawn('node', ['server/index.js'], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ code: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

let buf = '';
child.stdout.on('data', d => { buf += d.toString(); });
child.stderr.on('data', d => { buf += d.toString(); });

(async () => {
  for (let i = 0; i < 40; i++) { await sleep(500); if (buf.includes('running at')) break; }
  // create a project
  const mk = await req('POST', '/api/projects', { name: 'AURA Test', client_name: 'T' });
  const projectId = JSON.parse(mk.body)?.id || JSON.parse(mk.body)?.project?.id;
  console.log('PROJECT create:', mk.code, 'id=', projectId);

  if (projectId) {
    const chat = await req('POST', '/api/aura/chat', { message: 'Generate a 3D render of the living room and check vastu', projectId });
    const cj = JSON.parse(chat.body);
    console.log('AURA chat:', chat.code, 'llmPowered=', cj?.reply?.llmPowered, 'model=', cj?.reply?.model);
    console.log('AURA reply text:', (cj?.reply?.text || '').slice(0, 200));
    console.log('AURA actions:', JSON.stringify(cj?.reply?.actions || []));
  }

  const keys = await req('GET', '/api/settings/api-keys');
  console.log('API KEYS status:', keys.code, keys.body.slice(0, 300));

  child.kill('SIGTERM');
  process.exit(0);
})().catch(e => { console.error('ERR', e); child.kill('SIGTERM'); process.exit(1); });
