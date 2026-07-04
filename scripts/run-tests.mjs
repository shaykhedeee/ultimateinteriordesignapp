import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

function checkBuild() {
  try {
    const out = execSync('npm run build', { encoding: 'utf8', cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
    return { passed: true, evidence: 'build passed', detail: out.split('\n').slice(-6).join('\n') };
  } catch (e) {
    const detail = (e.stdout && e.stdout.toString().slice(-300)) || (e.message || '').slice(-300);
    return { passed: false, evidence: 'build failed', detail };
  }
}

function checkSyntax() {
  const files = [
    'server/index.js',
    'server/services/ai-orchestrator.js',
    'server/services/aura-executor-service.js',
    'server/services/firm-templates-service.js',
    'server/services/firm-catalog-service.js',
    'frontend/src/stores/appStore.js'
  ];
  const failed = [];
  for (const f of files) {
    try { execSync(`node --check ${f}`, { cwd: ROOT, stdio: ['pipe','pipe','pipe'] }); }
    catch (e) { failed.push({ file: f, detail: ((e.stderr && e.stderr.toString()) || e.message || '').slice(0, 180) }); }
  }
  return { passed: failed.length === 0, evidence: failed.length === 0 ? 'All syntax checks passed' : `${failed.length} syntax failures`, detail: failed };
}

function read(filePath) {
  try { return fs.readFileSync(path.join(ROOT, filePath), 'utf8'); } catch { return ''; }
}

function checkFrontendRoutes() {
  const file = read('frontend/src/components/shell/AppRoutes.jsx');
  const required = [
    'CommandCenterScreen',
    'ProjectManagementScreen',
    'FloorPlanAnalyzerScreen',
    'Render3DStudio',
    'OrchestratorStudio',
    'DrawingsElevationsStudio',
    'CutlistNestingScreen',
    'MaterialCatalogScreen',
    'SettingsPanel',
    'AuraBrainChat',
    'DesignStudioScreen',
    'RenderEditWorkspace',
    'JobsScreen'
  ];
  const missing = required.filter(name => !file.includes(name));
  const routeCount = (file.match(/case '[^']+':/g) || []).length;
  return { passed: missing.length === 0, evidence: missing.length === 0 ? `${routeCount} routes present` : 'missing routes', detail: missing.length ? missing : `route_count=${routeCount}` };
}

function checkHardcodedBackendUrls() {
  let hits = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (['node_modules', 'dist', 'storage'].includes(entry.name)) continue;
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(js|jsx|ts|tsx|json|md)$/.test(entry.name)) continue;
      let text;
      try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
      const matches = text.match(/127\.0\.0\.1:5055|http:\/\/127\.0\.0\.1:5055/g);
      if (matches?.length) hits.push({ file: full.replace(ROOT + path.sep, ''), count: matches.length });
    }
  }
  walk(path.join(ROOT, 'frontend/src'));
  walk(path.join(ROOT, 'server'));
  return { passed: hits.length === 0, evidence: hits.length === 0 ? 'No hardcoded backend URLs found' : `${hits.reduce((a,b)=>a+b.count,0)} hardcoded URL(s) found`, detail: hits.slice(0, 20) };
}

function checkPlaceholders() {
  let hits = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (['node_modules', 'dist'].includes(entry.name)) continue;
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(js|jsx)$/.test(entry.name)) continue;
      let text;
      try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
      const matches = text.match(/\/\/\s*TODO[^\n]*|\/\/\s*FIXME[^\n]*/gi);
      if (matches?.length) hits.push({ file: full.replace(ROOT + path.sep, ''), matches: matches.slice(0, 8) });
    }
  }
  walk(path.join(ROOT, 'frontend/src'));
  walk(path.join(ROOT, 'server'));
  return { passed: hits.length === 0, evidence: hits.length === 0 ? 'No TODO/FIXME placeholders found' : `${hits.reduce((a,b)=>a+b.matches.length,0)} placeholder match(es)`, detail: hits.slice(0, 20) };
}

function checkCompetitorParity() {
  const docs = read('docs/AI_INTERIOR_DESIGN_MARKET_SCAN_2026.md').toLowerCase();
  const checks = [
    { key: 'indian expertise', expect: ['vastu','pooja','laminate','hardware'] },
    { key: 'production outputs', expect: ['dxf','cutlist','cnc'] },
    { key: 'agentic ai', expect: ['aura','memory','self-learning'] },
    { key: 'offline-first', expect: ['offline-first','offline'] },
    { key: 'end-to-end pipeline', expect: ['brief','floor plan','3d','render','production'] }
  ];
  const detail = {};
  for (const c of checks) {
    const matched = c.expect.filter(t => docs.includes(t)).length;
    detail[c.key] = matched === c.expect.length ? 'covered' : `partial(${matched}/${c.expect.length})`;
  }
  return { passed: Object.values(detail).every(v => v === 'covered'), evidence: 'Competitor parity scan', detail };
}

function checkRouteDefinitions() {
  const server = read('server/index.js');
  const expected = [
    '/api/health',
    '/api/ready',
    '/api/live',
    '/api/providers/status',
    '/api/tools',
    '/api/ai/chat',
    '/api/ai/actions/execute',
    '/api/firm/templates',
    '/api/firm/catalog/links',
    '/api/system/route-tests',
    '/api/ai/interiors/orchestrate',
    '/api/whitelabel',
    '/api/diagnostics/api-keys'
  ];
  const missing = expected.filter(r => !server.includes(`app.${r}`) && !server.includes(r));
  const present = expected.length - missing.length;
  return { passed: missing.length === 0, evidence: `${present}/${expected.length} expected route tokens present in server/index.js`, detail: missing.length ? missing : present };
}

function checkDocs()
{   const docs = ['docs/AI_INTERIOR_DESIGN_MARKET_SCAN_2026.md']
    .map(p=>read(p));
  const filt = docs.filter(Boolean).length;
  return {passed: filt>0, evidence:`docs present=${filt}`, detail:filt? 'docs_found':'docs_missing'}
}

async function main() {
  const tests = [
    ['build', checkBuild],
    ['syntax', checkSyntax],
    ['frontend-routes', checkFrontendRoutes],
    ['hardcoded-urls', checkHardcodedBackendUrls],
    ['placeholders', checkPlaceholders],
    ['competitor-parity', checkCompetitorParity],
    ['route-definitions', checkRouteDefinitions],
    ['docs', checkDocs]
  ];
  const results = [];
  for (const [name, fn] of tests) results.push({ name, ...fn() });

  const summary = {
    total: results.length,
    passed: results.filter(x => x.passed).length,
    failed: results.filter(x => !x.passed).length,
    results
  };
  fs.writeFileSync(path.join(ROOT, 'test-results.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();
