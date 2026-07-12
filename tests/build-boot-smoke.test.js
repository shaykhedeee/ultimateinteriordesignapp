import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');
const indexHtml = path.join(distDir, 'index.html');

// This suite guards against the catastrophic "blank screen / every button dead"
// regression: a Vite manualChunks mis-split once put React in vendor-react but
// use-sync-external-store (zustand / react-router) in the generic vendor chunk.
// The vendor chunk evaluated `React.useState` at module top-level BEFORE React
// initialized -> "Cannot read properties of undefined (reading 'useState')" ->
// React never mounted -> the entire UI failed and no button worked.
//
// If dist/ hasn't been built, these tests are skipped (unit CI without a build).
const hasBuild = fs.existsSync(indexHtml);

test('build: entry bundle boots without React-init crash (guards blank-screen regression)', { skip: !hasBuild }, async () => {
  const html = fs.readFileSync(indexHtml, 'utf8');
  const m = html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
  assert.ok(m, 'dist/index.html must reference an /assets/index-*.js entry chunk');
  const entryFile = path.join(distDir, 'assets', m[1]);
  assert.ok(fs.existsSync(entryFile), `entry chunk ${m[1]} must exist on disk`);

  // Minimal browser globals so the ESM entry can evaluate far enough to prove
  // React (and its runtime peers) initialize in the correct order. We only care
  // that it does NOT throw the "useState of undefined" cross-chunk ordering bug.
  const el = () => ({
    innerHTML: '', appendChild(){}, insertBefore(){}, setAttribute(){}, removeAttribute(){},
    addEventListener(){}, removeEventListener(){}, style: { setProperty(){} },
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    getContext: () => ({}), querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top:0, left:0, width:0, height:0 }),
  });
  const g = globalThis;
  g.window = g;
  g.document = {
    getElementById: el, createElement: el, createElementNS: el,
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener(){}, removeEventListener(){},
    body: el(), head: el(), documentElement: el(),
  };
  if (!('navigator' in g) || !g.navigator?.userAgent) {
    try { Object.defineProperty(g, 'navigator', { value: { userAgent: 'node-test' }, configurable: true }); } catch {}
  }
  g.location = { href: 'http://127.0.0.1:8787/', pathname: '/', search: '', hash: '', origin: 'http://127.0.0.1:8787' };
  g.history = { pushState(){}, replaceState(){}, back(){}, forward(){} };
  g.addEventListener = () => {};
  g.removeEventListener = () => {};
  g.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
  g.localStorage = { getItem: () => null, setItem(){}, removeItem(){}, clear(){} };
  g.sessionStorage = g.localStorage;
  g.MutationObserver = class { observe(){} disconnect(){} takeRecords(){ return []; } };
  g.ResizeObserver = class { observe(){} disconnect(){} unobserve(){} };
  g.IntersectionObserver = class { observe(){} disconnect(){} unobserve(){} };
  g.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  g.cancelAnimationFrame = () => {};
  g.scrollTo = () => {};
  g.fetch = async () => ({ ok: true, json: async () => ({}), text: async () => '' });

  let threw = null;
  try {
    await import(path.toNamespacedPath ? 'file://' + entryFile.replace(/\\/g, '/') : entryFile);
  } catch (e) {
    threw = e;
  }

  if (threw) {
    // The specific cross-chunk ordering bug we must never regress on:
    const msg = String(threw.message || '');
    assert.ok(
      !/reading 'useState'|reading "useState"|React\).*useState|undefined.*useState/i.test(msg),
      `React failed to initialize before dependent vendor code ran (blank-screen regression): ${msg}`,
    );
    // Any other throw here is almost certainly just a missing DOM global in this
    // headless stub (e.g. a canvas/WebGL API), which happens AFTER React mounted
    // — that is acceptable for this guard. We only fail on the useState crash.
  } else {
    assert.ok(true, 'entry bundle evaluated without throwing');
  }
});

test('vite.config keeps React runtime peers in one chunk', () => {
  const cfg = fs.readFileSync(path.join(repoRoot, 'vite.config.js'), 'utf8');
  // Guard the config itself so the fix isn't accidentally reverted.
  assert.match(cfg, /use-sync-external-store/, 'use-sync-external-store must be pinned to the React chunk');
  assert.match(cfg, /vendor-react/, 'vendor-react chunk grouping must exist');
});
