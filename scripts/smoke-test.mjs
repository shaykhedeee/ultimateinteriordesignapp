import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:5055';
const projectId = 'proj_smoke_001';

function req(opt, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE);
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = { ...(opt.headers || {}) };
    if (payload) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const r = http.request({ hostname: u.hostname, port: u.port, path: opt.path, method: opt.method, headers }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw.slice(0, 200); }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

const checks = [
  // System
  { name: 'health', m: 'GET', p: '/api/health' },
  { name: 'list-projects', m: 'GET', p: '/api/projects' },

  // Settings + BYOK
  { name: 'list-api-keys', m: 'GET', p: '/api/settings/api-keys' },
  { name: 'get-app-settings', m: 'GET', p: '/api/settings/app-settings' },
  { name: 'post-api-keys', m: 'POST', p: '/api/settings/api-keys', b: { provider:'openai', key_value:'test-key' } },
  { name: 'post-api-keys-test', m: 'POST', p: '/api/settings/api-keys/test', b: { provider:'openai', key_value:'test-key' } },
  { name: 'delete-api-key', m: 'DELETE', p: '/api/settings/api-keys/test', auth: true },

  // AURA
  { name: 'aura-chat-empty', m: 'POST', p: '/api/aura/chat', b: { message: '', projectId } },
  { name: 'aura-chat-ok', m: 'POST', p: '/api/aura/chat', b: { message: 'Generate elevation', projectId } },

  // Photo→elevation alias handled below separately

  // Cutlist aliases
  { name: 'cutlist-recalc', m: 'POST', p: `/api/projects/${projectId}/cutlist/recalc`, auth: true },
  { name: 'cv-trace-alias', m: 'POST', p: `/api/projects/${projectId}/cad/cv-trace`, auth: true },
  { name: 'auto-elevation-dxf', m: 'GET', p: `/api/projects/${projectId}/drawings/elevations/auto/dxf` },
  { name: 'analyze-elevation-seed', m: 'GET', p: '/api/projects/proj_1/analyze-elevation' },
  { name: 'combined-elevations-pdf', m: 'GET', p: '/api/projects/proj_1/elevations/combined-pdf' },
  { name: 'vastu-preview', m: 'GET', p: '/api/projects/proj_1/vastu/preview' },
  { name: 'tv-units-list', m: 'GET', p: '/api/tv-units' },

  // Core design routes
  { name: 'list-drawings', m: 'GET', p: `/api/projects/${projectId}/drawings`, auth: true },
  { name: 'list-elevations', m: 'GET', p: `/api/projects/${projectId}/elevations`, auth: true },
  { name: 'list-renders', m: 'GET', p: `/api/projects/${projectId}/renders`, auth: true },
  { name: 'list-materials', m: 'GET', p: `/api/projects/${projectId}/materials`, auth: true },

  // Sharing
  { name: 'list-client-share', m: 'GET', p: `/api/projects/${projectId}/client-share`, auth: true },
  { name: 'create-client-share', m: 'POST', p: `/api/projects/${projectId}/client-share`, b: { pack:'brief' } },

  // Elevation learning
  { name: 'elevation-learning', m: 'GET', p: '/api/elevation/learning' },

  // Budget / cutlist
  { name: 'cutlist', m: 'GET', p: `/api/projects/${projectId}/cutlist`, auth: true },
];

async function createProject() {
  const r = await req({ m:'POST', p:'/api/projects', headers:{'Content-Type':'application/json'} }, { name:'smoke', client_name:'smoke', status:'active' });
  if (r.status === 201 || r.status === 200) {
    const id = r.body && (r.body.id || r.body.project?.id);
    if (id) {
      return id;
    }
  }
  return projectId;
}

async function run() {
  const project = await createProject();
  const pid = project;
  const results = [];
  for (const c of checks) {
    let effectivePath = c.p;
    effectivePath = effectivePath.replace('proj_smoke_001', pid);
    try {
      const r = await req({ m: c.m, p: effectivePath, headers: c.auth ? { 'Content-Type':'application/json', 'x-demo-auth':'true' } : { 'Content-Type':'application/json' } }, c.b);
      const ok = r.status < 400;
      results.push({ name: c.name, status: r.status, ok, sample: typeof r.body === 'string' ? r.body.slice(0,80) : JSON.stringify(r.body).slice(0,120) });
    } catch (e) {
      results.push({ name: c.name, status: 'ERR', ok: false, sample: String(e).slice(0,120) });
    }
  }
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  console.log(`SMOKE ${passed}/${results.length} passed`);
  for (const r of results) {
    const mark = r.ok ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${r.name}: ${r.status}`);
    if (!r.ok) console.log(`  ${r.sample}`);
  }
  if (failed.length) process.exitCode = 1;
}

run();
