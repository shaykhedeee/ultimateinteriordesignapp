#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const name = process.argv[2] || 'all';
const APP_DIR = String.raw`X:\OFFLINEGANG\ULTIMATE INTERIOR DESIGN APP\ultimateinteriordesignapp`;
const LOG = path.join(APP_DIR, 'enhancement-log.txt');
const ts = new Date().toISOString();

const actions = {
  audit:   () => fs.existsSync(path.join(APP_DIR, '.git')) ? 'git status --porcelain' : 'no-git',
  router:  () => fs.existsSync(path.join(APP_DIR, 'frontend', 'src', 'App.jsx')) ? 'App.jsx found' : 'App.jsx MISSING',
  routes:  () => {
    const screens = fs.readdirSync(path.join(APP_DIR, 'frontend', 'src', 'screens')).filter(f => f.endsWith('.jsx'));
    return `${screens.length} screens`;
  },
  services:() => fs.existsSync(path.join(APP_DIR, 'server', 'index.js')) ? 'server/index.js present' : 'server/index.js MISSING',
  ui:      () => fs.existsSync(path.join(APP_DIR, 'frontend', 'package.json')) ? 'frontend package.json present' : 'frontend package.json MISSING',
  commits: () => {
    try {
      const { execSync } = await import('child_process');
      return execSync('git log -1 --oneline', { cwd: APP_DIR, encoding: 'utf8' }).toString().trim();
    } catch { return 'no commits'; }
  }
};

const result = actions[name]?.() || 'unknown stage';
fs.appendFileSync(LOG, `[${ts}] [${name}] ${result}\n`);
console.log(`[${name}] ${result}`);
