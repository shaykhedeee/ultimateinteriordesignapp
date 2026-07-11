import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_BASE = 'http://127.0.0.1:8787';
const SERVER_CANDIDATE = path.join(ROOT, 'server', 'index.js');

let running = false;
let startPromise = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ping(base) {
  const res = await fetch(`${base}/api/projects`, { signal: AbortSignal.timeout(2500) });
  return res.ok;
}

async function startOnce() {
  if (running) return DEFAULT_BASE;
  if (startPromise) return startPromise;
  startPromise = (async () => {
    let base = DEFAULT_BASE;
    try {
      if (await ping(base)) {
        running = true;
        return base;
      }
    } catch {}

    if (!fs.existsSync(SERVER_CANDIDATE)) {
      throw new Error(`Missing server entry at ${SERVER_CANDIDATE}`);
    }

    const proc = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
      cwd: ROOT,
      stdio: 'ignore',
      detached: true,
      env: { ...process.env, PORT: '8787', NODE_ENV: 'test' },
    });
    proc.unref();

    let lastErr;
    for (let i = 0; i < 40; i++) {
      await delay(500);
      try {
        if (await ping(base)) {
          running = true;
          return base;
        }
      } catch (e) {
        lastErr = e;
      }
    }
    throw new Error(`ULTIDA server did not become ready on ${base}: ${lastErr?.message || 'timeout'}`);
  })();
  return startPromise;
}

const BASE = DEFAULT_BASE;
try {
  await startOnce();
} catch {}

export { BASE, startOnce };
