import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

const child = spawn('node', ['server/index.js'], { cwd: process.cwd(), env: { ...process.env, PORT: '5055' }, stdio: 'ignore' });
await sleep(5000);
try {
  const { stdout, stderr } = await execFileP('node', ['--test', 'tests/flow-spine.test.js'], { cwd: process.cwd(), maxBuffer: 50 * 1024 * 1024 });
  process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
} catch (e) {
  process.stdout.write(e.stdout || '');
  process.stderr.write(e.stderr || '');
  process.exitCode = 1;
} finally {
  child.kill('SIGKILL');
}
