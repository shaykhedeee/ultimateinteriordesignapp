// Regression tests for skp-reader.js — local SketchUp parse / generate / DXF pipeline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'node:path';
import { generateSkpFromData, readSkpFile, importSkpToDxf, analyzeSkpSearch } from '../server/services/skp-reader.js';

test('generateSkpFromData: returns a buffer with valid SKP header', async () => {
  const r = await generateSkpFromData({ edges: [{ x1: 0, y1: 0, z1: 0, x2: 1000, y2: 0, z2: 0 }] }, { fileName: 't.skp' });
  assert.ok(Buffer.isBuffer(r.buffer));
  assert.ok(r.buffer.slice(0, 3).toString('ascii') === 'SKP', 'header magic present');
  assert.ok(r.success && r.bytes > 64);
});

test('readSkpFile: round-trips a generated skp (entities + bbox)', async () => {
  const r = await generateSkpFromData({ edges: [{ x1: 10, y1: 20, z1: 30, x2: 4010, y2: 20, z2: 30 }] }, {});
  const a = await readSkpFile(r.buffer);
  assert.ok(a.summary.edges >= 1, 'edges parsed');
  assert.ok(a.parsed.bbox, 'bounding box computed');
  assert.ok(a.parsed.bbox.width >= 4000, `bbox width ${a.parsed.bbox?.width}`);
  assert.equal(a.summary.units, 'millimeters');
});

test('importSkpToDxf: writes a real DXF file from a skp buffer', async () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ultida-skp-'));
  try {
    const r = await generateSkpFromData({ edges: [{ x1: 0, y1: 0, z1: 0, x2: 2000, y2: 0, z2: 0 }] }, {});
    const res = await importSkpToDxf(r.buffer, 'unit-proj', { outDir, fileName: 'skp-import' });
    assert.equal(res.success, true);
    assert.ok(fs.existsSync(res.dxfPath), 'dxf written');
    const txt = fs.readFileSync(res.dxfPath, 'utf8');
    assert.ok(txt.includes('SECTION') && txt.includes('ENTITIES'), 'valid DXF structure');
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('analyzeSkpSearch: finds materials by query', async () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ultida-skp-'));
  try {
    const r = await generateSkpFromData({}, {});
    // build a buffer that includes a material line
    const custom = Buffer.concat([
      r.buffer.slice(0, 64),
      Buffer.from(['SKP SKETCHUP LOCAL FALLBACK', 'Version 700', 'Units 4', 'Materials Teak Wood', 'Entities', 'Edge 0 0 0 1000 0 0'].join('\r\n'), 'utf8')
    ]);
    const res = await analyzeSkpSearch(custom, 'wood');
    assert.ok(res.total >= 1, 'material search should hit Teak Wood');
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('readSkpFile: empty/garbage buffer does not crash', async () => {
  const a = await readSkpFile(Buffer.from('not a skp file at all', 'utf8'));
  assert.ok(a && a.summary, 'returns an analysis object');
  assert.equal(a.summary.edges, 0);
});
