import fs from 'fs';
import path from 'path';
const root = process.cwd();
const targets = [
  path.join(root, 'storage', 'backups'),
  path.join(root, 'node_modules', '.vite'),
  path.join(root, 'node_modules', '.cache')
];
let freed = 0;
function rm(p) {
  try {
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      const stack = [p];
      while (stack.length) {
        const d = stack.pop();
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const c = path.join(d, e.name);
          if (e.isDirectory()) stack.push(c);
          else { freed += fs.statSync(c).size; fs.unlinkSync(c); }
        }
      }
      fs.rmdirSync(p, { recursive: true });
    } else { freed += st.size; fs.unlinkSync(p); }
  } catch (_) {}
}
for (const t of targets) { console.log('cleaning', t); rm(t); }
// also remove any stray *.zip in storage root / backups
for (const f of fs.readdirSync(path.join(root, 'storage'))) {
  if (f.endsWith('.zip') || f.startsWith('ultida-backup')) {
    const fp = path.join(root, 'storage', f);
    try { freed += fs.statSync(fp).size; fs.unlinkSync(fp); } catch (_) {}
  }
}
console.log('freed MB', (freed / 1048576).toFixed(1));
