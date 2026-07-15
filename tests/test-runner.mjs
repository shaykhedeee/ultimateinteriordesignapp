import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, execFileSync } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(ROOT, 'server', 'index.js');
const BASE_URL = process.env.APP_URL || 'http://127.0.0.1:8787';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/projects`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {}
    await wait(500);
  }
  return false;
}

async function main() {
  const child = spawn(process.execPath, [SERVER_PATH], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '8787', NODE_ENV: 'test', LIVE_IMAGE_GEN: 'false' },
  });

  const serverReady = waitForServer();
  if (!(await serverReady)) {
    console.error('ULTIDA server did not start in time');
    process.exitCode = 1;
    child.kill('SIGTERM');
    process.exit(1);
  }

  let exitCode = 0;
  try {
    const testFiles = fs.readdirSync(path.join(ROOT, 'tests'))
      .filter(f => f.endsWith('.test.js'))
      .map(f => path.join('tests', f));

    execFileSync(process.execPath, ['--test', '--test-concurrency=1', ...testFiles], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, APP_URL: BASE_URL },
    });
  } catch (err) {
    exitCode = err.status || 1;
  }

  try { child.kill('SIGTERM'); } catch {}
  process.exitCode = Number.parseInt(String(exitCode), 10);
}

main().catch((err) => {
  console.error('test-runner failed:', err);
  process.exit(1);
});
