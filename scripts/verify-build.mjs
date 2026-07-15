import { spawn } from 'node:child_process';
import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const child = spawn('node', ['server/index.js'], { cwd: process.cwd(), env: { ...process.env, PORT: '8787' }, stdio: 'ignore' });
await sleep(5000);

function get(p) {
  return new Promise((res) => {
    const r = http.get('http://127.0.0.1:8787' + p, (x) => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => res({ code: x.statusCode, body: d, type: x.headers['content-type'] }));
    });
    r.on('error', e => res({ code: 0, body: e.message }));
  });
}

const root = await get('/');
console.log('GET / ->', root.code, 'content-type:', root.type, 'has-app-root:', root.body.includes('id="root"') || root.body.toLowerCase().includes('<div id="root"'));
const api = await get('/api/projects');
console.log('GET /api/projects ->', api.code, '(serves API alongside SPA)');

child.kill('SIGKILL');
