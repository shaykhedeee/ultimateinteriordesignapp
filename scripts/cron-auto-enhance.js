import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

function walkTargetDir(filter, collect) {
  const files = [];
  const stack = [path.join(ROOT, filter)];
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const p = path.join(dir, entry);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) stack.push(p);
      else if (collect.test(entry)) files.push(p);
    }
  }
  return files;
}

function runHardcodedScan() {
  const files = [
    ...walkTargetDir('frontend/src', /\.(jsx|tsx|js|ts)$/),
    ...walkTargetDir('server', /\.(jsx|tsx|js|ts)$/)
  ];
  const matches = [];
  for (const p of files) {
    const text = fs.readFileSync(p, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('127.0.0.1:5055') || line.includes('http://127.0.0.1') || line.includes('localhost:5055')) {
        matches.push(p + ':' + (idx + 1) + ': ' + line.trim());
      }
    });
  }
  return matches.join('\n');
}

function runTodosScan() {
  const files = [
    ...walkTargetDir('frontend/src', /\.(jsx|tsx|js|ts|md)$/),
    ...walkTargetDir('server', /\.(jsx|tsx|js|ts|md)$/)
  ];
  const matches = [];
  for (const p of files) {
    const text = fs.readFileSync(p, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      if (/(TODO|FIXME|HACK|WIP|coming soon|not implemented)/i.test(line)) {
        matches.push(p + ':' + (idx + 1) + ': ' + line.trim());
      }
    });
  }
  return matches.join('\n');
}

function runAiRoutesScan() {
  const p = path.join(ROOT, 'server/index.js');
  const text = fs.readFileSync(p, 'utf8');
  const lines = text.split('\n');
  const matches = [];
  lines.forEach((line, idx) => {
    if (/app\.(get|post|put)\(/i.test(line) && (/\/ai\//.test(line) || /\/providers\//.test(line) || /\/tools\/run/.test(line) || /\/tools\/execute/.test(line) || /\/tools\/result/.test(line))) {
      matches.push((idx + 1) + ': ' + line.trim());
    }
  });
  return matches.join('\n');
}

const results = [
  run('git-status', 'git status --short'),
  run('backend-syntax', "node --check server/index.js 2>&1 | tail -n 50 || true"),
  run('frontend-build', 'npm run build 2>&1 | tail -n 25'),
  { label: 'hardcoded-urls', ok: true, out: runHardcodedScan() },
  { label: 'todos-fixmes', ok: true, out: runTodosScan() },
  { label: 'ai-routes', ok: true, out: runAiRoutesScan() },
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
