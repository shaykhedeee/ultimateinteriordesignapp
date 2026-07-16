import { spawn } from 'child_process';
import path from 'path';

const cwd = path.resolve('X:/OFFLINEGANG/ULTIMATE INTERIOR DESIGN APP/ultimateinteriordesignapp');

function awaitSpawn(relativePath) {
  return new Promise((resolve) => {
    const normalized = path.join(cwd, relativePath).replace(/\\/g, '/');
    spawn('node', ['--check', normalized], { cwd, stdio: 'inherit', encoding: 'utf8' }).on('close', resolve);
  });
}

await awaitSpawn('server/index.js');
await awaitSpawn('server/database/database.js');
await awaitSpawn('server/services/canonical-topview-renderer.js');
