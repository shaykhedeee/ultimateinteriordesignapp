import { spawn } from 'node:child_process';
const cwd = process.cwd();
const sub = spawn('node', ['server/index.js'], { cwd, stdio: ['pipe','pipe','pipe'] });
sub.stdout.on('data', (c) => process.stdout.write(c));
sub.stderr.on('data', (c) => process.stderr.write(c));
sub.on('error', (e) => console.error('spawn error', e));
sub.on('close', (code, sig) => { console.error('closed', {code, sig}); process.exit(code||0); });
setTimeout(() => { console.error('waited 12s, still alive'); }, 12000);
