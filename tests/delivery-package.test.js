// Regression tests for delivery-package.js — the client handoff zip builder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDeliveryPackage } from '../server/services/delivery-package.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('buildDeliveryPackage: creates a real .zip and cleans up after', async () => {
  const id = 'unit-test-' + Date.now();
  let zipPath;
  try {
    zipPath = await buildDeliveryPackage({ projectId: id, projectName: 'Unit Test', label: 'latest' });
    assert.ok(typeof zipPath === 'string' && zipPath.endsWith('.zip'), 'returns a zip path');
    assert.ok(fs.existsSync(zipPath), 'zip file should exist on disk');
    assert.ok(fs.statSync(zipPath).size > 0, 'zip should not be empty (PACKAGE.md included)');
  } finally {
    const dir = path.join(root, '_deliverables', id);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('buildDeliveryPackage: projectId is sanitized (no path traversal)', async () => {
  const id = '../evil/../../pwn';
  let zipPath;
  try {
    zipPath = await buildDeliveryPackage({ projectId: id, label: 'x' });
    // sanitized id should still land under _deliverables, not escape root
    assert.ok(zipPath.includes('_deliverables'), 'output stays inside project root');
  } finally {
    const safeId = String(id).replace(/[^a-z0-9-]+/gi, '_').toLowerCase();
    const dir = path.join(root, '_deliverables', safeId);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }
});
