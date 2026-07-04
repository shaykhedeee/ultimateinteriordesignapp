import http from 'http';
import { spawn } from 'node:child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, '..');
const serverEntry = path.join(projectDir, 'server/index.js');

function call(path, method = 'POST', body = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 5055, path, method, headers: { 'Content-Type': 'application/json' } }, res => {
      let out = '';
      res.on('data', chunk => { out += chunk; });
      res.on('end', () => resolve(out));
    });
    req.on('error', reject);
    if (method === 'POST') req.write(data);
    req.end();
  });
}

async function run() {
  const server = spawn('node', [serverEntry], { cwd: projectDir, shell: false });
  await new Promise((resolve) => setTimeout(resolve, 1400));
  const out = await call('/api/ai/interiors/orchestrate', 'POST', { projectId: 'demo', userStyle: 'modern', rooms: ['living'], maxRooms: 1 });
  console.log(out);
  server.kill('SIGTERM');
}

run();
