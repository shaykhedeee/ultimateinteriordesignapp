// Regression tests for pipeline-orchestrator.js — the "Pipeline Studio" that
// turns rooms into render + DXF + PDF + SKP. Verifies the full generate path
// works with no API key (AI render falls back to a valid placeholder image).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'node:path';
import { runPipeline } from '../server/services/pipeline-orchestrator.js';

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DELIV = path.join(PROJECT_ROOT, '_deliverables');

function cleanup() { if (fs.existsSync(DELIV)) fs.rmSync(DELIV, { recursive: true, force: true }); }

test('runPipeline: generates render + DXF + PDF + SKP for each room (no API key)', async () => {
  cleanup();
  const rooms = [
    { name: 'TestRoom', w: 3600, h: 3000,
      openings: [{ wallId: 'north', offsetMm: 200, widthMm: 900, sillMm: 900, headMm: 2100, type: 'window' }],
      cabinets: [{ wallId: 'north', widthMm: 600, name: 'Base' }] }
  ];
  const res = await runPipeline({ projectId: 'pipe-test-' + Date.now(), rooms, projectName: 'PipeTest' });
  try {
    assert.ok(res.images.length >= 1, 'render produced');
    assert.ok(res.dxfs.length >= 1, 'elevation DXF produced');
    assert.ok(res.pdfs.length >= 1, 'elevation PDF produced');
    assert.ok(res.skpFiles.length >= 1, 'SKP produced');

    const img = res.images[0];
    assert.ok(fs.existsSync(img), 'image file exists on disk');
    const buf = fs.readFileSync(img);
    const hex = buf.slice(0, 8).toString('hex');
    // The placeholder is a valid PNG (written as .png) or a valid JPEG (written
    // as .jpg) depending on which provider fallback fires — both are real images.
    const isPng = hex === '89504e470d0a1a0a';
    const isJpg = buf.slice(0, 3).toString('hex') === 'ffd8ff';
    assert.ok(isPng || isJpg, `image is a valid raster (got ${hex})`);

    const dxf = fs.readFileSync(res.dxfs[0], 'utf8');
    assert.ok(/SECTION/.test(dxf) && /ENTITIES/.test(dxf), 'DXF is structurally valid');

    const skp = fs.readFileSync(res.skpFiles[0]);
    assert.ok(skp.slice(0, 3).toString('ascii') === 'SKP', 'SKP header magic present');
  } finally {
    cleanup();
  }
});

test('runPipeline: handles multiple rooms independently', async () => {
  cleanup();
  const rooms = [
    { name: 'Living', w: 5600, h: 4200, openings: [], cabinets: [] },
    { name: 'Kitchen', w: 3600, h: 3000, openings: [], cabinets: [] }
  ];
  const res = await runPipeline({ projectId: 'pipe-multi-' + Date.now(), rooms, projectName: 'Multi' });
  try {
    assert.equal(res.images.length, 2, 'one image per room');
    assert.ok(res.dxfs.length >= 2, 'elevation per room');
  } finally {
    cleanup();
  }
});

test('runPipeline: empty rooms -> still produces an INDEX summary without crashing', async () => {
  cleanup();
  const res = await runPipeline({ projectId: 'pipe-empty-' + Date.now(), rooms: [], projectName: 'Empty' });
  try {
    assert.ok(fs.existsSync(path.join(res.outDir, 'INDEX.md')), 'INDEX.md written');
  } finally {
    cleanup();
  }
});
