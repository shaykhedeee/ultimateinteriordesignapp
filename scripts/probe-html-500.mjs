/**
 * probe-html-500.mjs — crash-safety gate for THE ULTIMATE INTERIOR DESIGN APPLICATION.
 *
 * Hits EVERY backend route against a RUNNING server and exits non-zero if ANY route
 * returns an HTML error document (the white-screen class: an unhandled route exception
 * returns an HTML 500, the frontend's res.json() then throws `Unexpected token <`, and
 * the whole panel/app blanks with no visible error).
 *
 * Usage:  start a fresh server on $PORT (default 8787), then `node scripts/probe-html-500.mjs`
 *
 * The probe:
 *   1. parses every `app.METHOD(path)` in server/index.js (METHOD + path literal),
 *   2. auto-discovers a real :id from GET /api/projects (falls back to sample ids),
 *   3. substitutes :id / :versionId / :renderId / :token with safe values,
 *   4. fires GET (and POST with empty JSON where safe) concurrently,
 *   5. flags any response whose status >= 400 AND body looks like HTML.
 *
 * 0 HTML-500s = PASS.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8787;
const BASE = process.env.APP_URL || `http://127.0.0.1:${PORT}`;
const SERVER_FILE = path.join(ROOT, 'server', 'index.js');

const req = (method, p, body) => new Promise((resolve) => {
  const u = new URL(BASE);
  const payload = body ? JSON.stringify(body) : null;
  const headers = { 'Content-Type': 'application/json' };
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
  const r = http.request(
    { hostname: u.hostname, port: u.port, path: p, method, headers, timeout: 8000 },
    (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, raw: Buffer.concat(chunks).toString('utf-8') }));
    }
  );
  r.on('timeout', () => { r.destroy(); resolve({ status: 0, raw: '' }); });
  r.on('error', () => resolve({ status: 0, raw: '' }));
  if (payload) r.write(payload);
  r.end();
});

function parseRoutes() {
  const src = fs.readFileSync(SERVER_FILE, 'utf-8');
  const out = [];
  const re = /app\.(get|post|put|delete|patch)\(\s*(['"`])([^'"`]+)\2/g;
  let m;
  while ((m = re.exec(src))) {
    const method = m[1].toUpperCase();
    const p = m[3];
    if (p.includes('*') || p.startsWith('/api/diagnostics/api-keys') === false) out.push({ method, p });
  }
  return out;
}

// Substitute :params with safe sample values.
async function discoverIds() {
  const ids = { id: 'proj_1', versionId: 'fpv_1', renderId: 'r_1', token: 'tok_1', elevationId: 'e_1' };
  try {
    const res = await req('GET', '/api/projects');
    const arr = safeJson(res.raw);
    if (Array.isArray(arr) && arr.length) {
      ids.id = arr[0].id || ids.id;
    } else if (arr && Array.isArray(arr.projects) && arr.projects.length) {
      ids.id = arr.projects[0].id || ids.id;
    }
  } catch { /* keep defaults */ }
  return ids;
}

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }

function fill(p, ids) {
  return p
    .replace(/:id\b/g, ids.id)
    .replace(/:versionId\b/g, ids.versionId)
    .replace(/:renderId\b/g, ids.renderId)
    .replace(/:elevationId\b/g, ids.elevationId)
    .replace(/:token\b/g, ids.token);
}

function looksLikeHtml(raw) {
  const t = raw.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html') || (t.includes('<') && t.includes('</') && (t.includes('error') || t.includes('exception') || t.includes('cannot')));
}

async function main() {
  console.log(`[probe] targeting ${BASE}`);
  const routes = parseRoutes();
  const ids = await discoverIds();
  console.log(`[probe] ${routes.length} routes parsed; sample :id=${ids.id}`);

  const results = [];
  // Fire GET for all; POST (empty body) for POST/PUT/PATCH that are not upload/multipart.
  await Promise.all(routes.map(async (rt) => {
    const p = fill(rt.p, ids);
    // Skip binary-upload / multipart routes (need files) — they are exercised elsewhere.
    if (/\/(floorplan|auto-trace|from-photo|detect-walls-vision|video|skp|share|delivery-package|cv-trace|measure)\b/.test(p) && rt.method !== 'GET') return;
    const body = rt.method === 'GET' ? undefined : {};
    const res = await req(rt.method, p, body);
    const html = res.status >= 400 && looksLikeHtml(res.raw);
    results.push({ method: rt.method, p, status: res.status, html });
  }));

  const bad = results.filter((r) => r.html);
  console.log(`[probe] ${results.length} routes exercised`);
  if (bad.length) {
    console.error(`\n[probe] FAIL — ${bad.length} route(s) returned HTML error pages (white-screen class):`);
    for (const b of bad) console.error(`   ${b.method} ${b.p} -> HTTP ${b.status} (HTML body)`);
    process.exit(1);
  }
  console.log('[probe] PASS — 0 HTML-500 white-screen routes');
  process.exit(0);
}

main().catch((e) => { console.error('[probe] crashed:', e.message); process.exit(2); });
