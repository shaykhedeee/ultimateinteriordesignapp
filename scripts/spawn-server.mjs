// Detached server spawner: launches server/index.js as a fully detached child
// so it survives the launcher shell exiting (the background-runner reaps direct children).
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const env = { ...process.env, PORT: process.env.PORT || '8787' };

const child = spawn('node', ['server/index.js'], {
  cwd: root,
  env,
  detached: true,
  stdio: ['ignore', 'ignore', 'ignore']
});
child.unref();
console.log('SPAWNED server pid=' + child.pid);
// Exit the spawner immediately; the detached child keeps running.
process.exit(0);
