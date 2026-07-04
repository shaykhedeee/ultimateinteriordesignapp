import fs from 'fs';
import path from 'path';

export function validateLaunchers() {
  const files = ['launch.bat', 'START.bat', 'start.bat'];
  const checks = files.map((file) => {
    if (!fs.existsSync(file)) return { file, ok: false, reason: 'missing' };
    const text = fs.readFileSync(file, 'utf-8');
    const hasBackendPort = String(text).includes('5055');
    const hasFrontendPort = String(text).includes('5175');
    const hasNode = String(text).includes('node server');
    const hasNpmClient = String(text).includes('npm run client');
    const ok = hasBackendPort && hasFrontendPort && hasNode && hasNpmClient;
    return { file, ok, reasons: { hasBackendPort, hasFrontendPort, hasNode, hasNpmClient } };
  });
  const report = { ok: checks.every(c => c.ok), checks };
  const target = path.join(process.cwd(), 'scripts', 'launcher-validation-report.json');
  fs.writeFileSync(target, JSON.stringify(report, null, 2));
  return { ok: report.ok, report, path: target };
}

if (process.argv.includes('--validate')) {
  console.log(JSON.stringify(validateLaunchers(), null, 2));
}
