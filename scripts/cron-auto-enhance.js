#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const REPORT = path.join(ROOT, 'docs', 'CRON_AUTO_ENHANCE_REPORT.md');

function run(label, cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    return { label, ok: true, out: out.slice(-4000) };
  } catch (e) {
    return { label, ok: false, out: (e.stdout?.toString() || '').slice(-2000) + '\n' + (e.stderr?.toString() || '').slice(-2000) };
  }
}

const results = [
  run('git-status', 'git status --short'),
  run('backend-syntax', 'for f in server/index.js server/services/*.js; do node --check "$f" 2>&1 | grep -E "SyntaxError|Error" || true; done'),
  run('frontend-build', 'npm run build 2>&1 | tail -n 25'),
  run('hardcoded-urls', "rg -n '127\\.0\\.0\\.1:5055|http://127\\.0\\.0\\.1' frontend/src -S | sed -n '1,120p' || true"),
  run('todos-fixmes', "rg -n 'TODO|FIXME|HACK|placeholder|coming soon|not implemented|wip|WIP' frontend/src server -S | sed -n '1,200p' || true"),
  run('ai-routes', "rg -n 'app\\.(get|post|put)\\(.*ai/|/providers/|/tools/run|/tools/execute' server/index.js -S | sed -n '1,120p' || true"),
];

const lines = [`# Cron Auto Enhance Report — ${new Date().toISOString()}\n`];
results.forEach((r) => {
  lines.push(`## ${r.label}\n`);
  lines.push('```');
  lines.push((r.out || '').trim());
  lines.push('```\n');
});

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');
console.log('Wrote', REPORT);
