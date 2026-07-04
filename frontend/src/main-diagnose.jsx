import React from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
const el = document.createElement('div');
el.id = 'app-fallback';
el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#020617;color:#F0EEE8;padding:18px;font:12px ui-monospace,Menlo,monospace;overflow:auto;';
root.appendChild(el);

const fb = document.getElementById('app-fallback');
function showFallback(text) {
  if (!fb) return;
  fb.innerHTML = '<b>IMPORT DIAGNOSTIC</b><pre style="white-space:pre-wrap;margin-top:8px;">' + (text || 'Unknown failure') + '</pre>';
}

import('./App.jsx')
  .then((mod) => {
    const App = mod.default || mod.App;
    if (!App) throw new Error('App.jsx loaded but no default export found. Keys: ' + Object.keys(mod).join(', '));
    createRoot(root).render(<App />);
  })
  .catch((err) => {
    showFallback((err && (err.message || String(err))) || 'Unknown import failure');
    console.error('[diagnose] App import failed', err);
  });
