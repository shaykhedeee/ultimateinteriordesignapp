// Daemon-free per-screen render smoke test.
// Uses Vite's ssrLoadModule to load each screen with real JSX resolution,
// then renderToString with mocked browser globals + a mock API client.
// A screen that throws on render is reported as FAIL. Browser-only libs
// (three.js) are tolerated via global stubs; if a screen needs a provider
// we don't supply, that specific throw is surfaced (not silently hidden).

import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// ---- Mock browser globals BEFORE loading any module ----
const noop = () => {};
const elStub = () => ({
  innerHTML: '', textContent: '', appendChild: noop, insertBefore: noop,
  setAttribute: noop, removeAttribute: noop, addEventListener: noop,
  removeEventListener: noop, style: { setProperty: noop },
  classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  getContext: () => null, querySelector: () => null, querySelectorAll: () => [],
  getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
  append: noop, prepend: noop, focus: noop, click: noop,
});
globalThis.window = globalThis;
globalThis.document = {
  getElementById: elStub, createElement: elStub, createElementNS: elStub,
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener: noop, removeEventListener: noop,
  body: elStub(), head: elStub(), documentElement: elStub(),
};
try { Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node-ssr' }, configurable: true }); } catch {}
globalThis.location = { href: 'http://127.0.0.1:8787/', pathname: '/', search: '', hash: '', origin: 'http://127.0.0.1:8787' };
globalThis.history = { pushState: noop, replaceState: noop, back: noop, forward: noop };
globalThis.addEventListener = noop;
globalThis.removeEventListener = noop;
globalThis.matchMedia = () => ({ matches: false, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop });
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop, clear: noop };
globalThis.sessionStorage = globalThis.localStorage;
globalThis.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
globalThis.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
globalThis.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = noop;
globalThis.scrollTo = noop;
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });

// Some third-party deps (transitively pulled by a screen) reference the global
// `React` at runtime. In the browser the bundle provides it; in this Node SSR
// harness we must supply it so the render test reflects real browser behavior.
globalThis.React = React;

// Mock fetch/axios to return canned success so screens that fetch on mount
// don't crash (we only care that the component tree renders).
const okJson = (data) => ({ ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) });
globalThis.fetch = async () => okJson({ projects: [], items: [], success: true });
globalThis.XMLHttpRequest = class { open() {} send() {} addEventListener() {} };

const vite = await createServer({
  root: path.join(repoRoot, 'frontend'),
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true },
  build: { ssr: true },
});

const screensDir = path.join(repoRoot, 'frontend/src/screens');
const files = fs.readdirSync(screensDir).filter((f) => f.endsWith('.jsx'));

let pass = 0, fail = 0;
const failures = [];
for (const f of files) {
  const modPath = '/src/screens/' + f;
  try {
    const mod = await vite.ssrLoadModule(modPath);
    const Comp = mod.default || mod[Object.keys(mod).find((k) => typeof mod[k] === 'function')];
    if (!Comp) { throw new Error('no default React component export'); }
    // Render with props commonly expected by screens.
    const html = renderToString(React.createElement(Comp, { pid: 'seed-1', projectId: 'seed-1', project: { id: 'seed-1', name: 'SSR Test' } }));
    if (typeof html !== 'string' || html.length === 0 && f.includes('Dashboard') === false) {
      // Some screens legitimately render empty without data; only fail on throw.
    }
    pass++;
    console.log(`PASS  ${f}  (${html.length} chars rendered)`);
  } catch (e) {
    fail++;
    failures.push({ f, msg: String(e && e.message || e).split('\n')[0] });
    console.log(`FAIL  ${f}  :: ${String(e && e.message || e).split('\n')[0]}`);
    if (process.env.TRACE) console.log((e && e.stack || String(e)).split('\n').slice(0,12).join('\n'));
  }
}

await vite.close();

console.log(`\n=== SCREEN RENDER SMOKE: ${pass} pass / ${fail} fail / ${files.length} total ===`);
if (failures.length) {
  console.log('FAILURES:');
  for (const x of failures) console.log(`  - ${x.f}: ${x.msg}`);
  process.exit(1);
}
