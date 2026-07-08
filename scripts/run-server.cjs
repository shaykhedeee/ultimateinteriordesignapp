const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

console.log('Launching ULTIDA server via Windows detached shell...');

const child = spawn('cmd.exe', ['/c', 'start', '""', 'cmd.exe', '/c', `node server\\index.js`], {
  cwd: root,
  shell: false,
  detached: true,
  windowsHide: true,
});

child.on('error', (err) => {
  console.error('Launch error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Launcher exiting. Check', root, 'storage/server.log');
  process.exit(0);
}, 1000);
