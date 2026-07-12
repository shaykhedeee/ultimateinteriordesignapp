// One-off latent-bug sweep: verify every named import that index.js pulls from
// ./services/X.js is actually exported by that module. A missing export means
// the route handler calls `undefined(...)` at request time -> 500.
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const repo = process.cwd();
const idxPath = resolve(repo, 'server/index.js');
const idx = readFileSync(idxPath, 'utf8');

const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]\.\/services\/([^'"]+)['"]/g;
let m;
const problems = [];
let count = 0;

while ((m = importRe.exec(idx))) {
  const namesStr = m[1];
  const mod = m[2];
  const names = namesStr.split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
  const modPath = resolve(repo, 'server/services', mod);
  if (!existsSync(modPath)) {
    problems.push(`MISSING MODULE: ${mod} (imported by index.js)`);
    continue;
  }
  const src = readFileSync(modPath, 'utf8');
  for (const name of names) {
    count++;
    const re = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${name}\\b|` +
      `export\\s+(?:const|let|var|class)\\s+${name}\\b|` +
      `export\\s*\\{[^}]*\\b${name}\\b`
    );
    if (!re.test(src)) {
      problems.push(`${mod}: '${name}' not a named export`);
    }
  }
}

console.log(`Checked ${count} named imports from index.js -> ./services/*`);
console.log(`Problems: ${problems.length}`);
for (const p of problems) console.log(' - ' + p);
