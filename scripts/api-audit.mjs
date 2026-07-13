import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const fe = path.join(root, 'frontend', 'src');
const sv = path.join(root, 'server', 'index.js');

const norm = p => p.replace(/\/\{[^}]+\}/g, '/:X');

const fePaths = new Set();
function walk(dir){
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) walk(fp);
    else if (/\.(jsx?|js)$/.test(f.name)) {
      const t = fs.readFileSync(fp, 'utf8');
      // backtick template literals: `.../api/...` possibly with ${} segments
      const re = /`([^`]*\/api\/[^`]*)`/g;
      let m;
      while ((m = re.exec(t))) {
        let seg = m[1];
        // collapse ${...} to :X placeholder so we keep the static /api/ skeleton
        seg = seg.replace(/\$\{[^}]*\}/g, ':X');
        const api = seg.match(/\/api\/[A-Za-z0-9_/:.\-{}]+/);
        if (api) fePaths.add(norm(api[0]));
      }
      // plain string literals containing /api/
      const re2 = /['"](\/api\/[A-Za-z0-9_/:.\-{}]+)['"]/g;
      while ((m = re2.exec(t))) fePaths.add(norm(m[1]));
    }
  }
}
walk(fe);

const stxt = fs.readFileSync(sv, 'utf8');
const server = new Set();
const re3 = /app\.(get|post|patch|put|delete)\(\s*['"`](\/api\/[^'"`]+)/gi;
let m; while ((m = re3.exec(stxt))) server.add(norm(m[2]));
// also catch router.METHOD
const re4 = /\.(get|post|patch|put|delete)\(\s*['"`](\/api\/[^'"`]+)/gi;
while ((m = re4.exec(stxt))) server.add(norm(m[2]));

const missing = [];
for (const p of [...fePaths].sort()) {
  if (server.has(p)) continue;
  if ([...server].some(s => p.startsWith(s) || s.startsWith(p))) continue;
  missing.push(p);
}

console.log('Frontend API templates:', fePaths.size);
console.log('Server routes:', server.size);
console.log('\n=== MISSING (frontend calls, no matching server route) ===');
for (const m of missing) console.log('  ', m);
console.log('\n=== count missing:', missing.length);
