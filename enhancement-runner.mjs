#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const APP_DIR = String.raw`X:\OFFLINEGANG\ULTIMATE INTERIOR DESIGN APP\ultimateinteriordesignapp`;
const LOG = path.join(APP_DIR, 'enhancement-log.txt');
const STAGES = ['audit', 'router', 'routes', 'services', 'ui', 'commits'];

const run = (name, cmd) => {
  const ts = new Date().toISOString();
  let out = '';
  try {
    out = execSync(cmd, { cwd: APP_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    fs.appendFileSync(LOG, `[${ts}] [${name}] OK\n${out.trim()}\n`);
    console.log(`[${name}] OK`);
  } catch (e) {
    const msg = e.stderr?.toString() || e.message || 'error';
    fs.appendFileSync(LOG, `[${ts}] [${name}] FAIL: ${msg.trim()}\n`);
    console.log(`[${name}] FAIL: ${msg.trim()}`);
  }
};

console.log('=== ULTIDA ENHANCER ===');
fs.mkdirSync(APP_DIR, { recursive: true });
STAGES.forEach(s => run(s, `node .\\enhancement-enhancer.js ${s}`));
