/**
 * tests/render-elevation-decode.test.js
 * Proves the decoded-3D-render elevation pipeline works end-to-end:
 *   - the service exposes 14 decoded unit builders (incl. kitchen-pantry + 6 photo-traced styled units)
 *   - the API route produces real DXF (SECTION/EOF) + real PDF (%PDF-)
 *     files for each unit on demand.
 * (Server must be running on 127.0.0.1:5055.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.APP_URL || 'http://127.0.0.1:5055';
const OUT = path.join(__dirname, '..', 'storage', 'elevations');

test('decode service exposes >=6 decoded unit builders (incl. kitchen-pantry)', async () => {
  const mod = await import('../server/services/render-elevation-decode.js');
  assert.equal(Object.keys(mod.DECODED_UNITS).length, 14);
  assert.ok(mod.DECODED_UNITS['kitchen-pantry'], 'kitchen-pantry registered');
  for (const [k, fn] of Object.entries(mod.DECODED_UNITS)) {
    const m = fn();
    assert.ok(m.lengthMm > 0 && m.heightMm > 0, `${k} has dims`);
    assert.ok(Array.isArray(m.cabinets) && m.cabinets.length > 0, `${k} has cabinets`);
  }
});

test('POST /elevations/from-renders emits real DXF+PDF per unit', async () => {
  const res = await fetch(`${BASE}/api/projects/proj_1/elevations/from-renders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  assert.equal(res.status, 200, `expected 200, got ${res.status}`);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.count, 14);
  for (const f of body.files) {
    const dxfPath = path.join(__dirname, '..', f.dxf);
    const pdfPath = path.join(__dirname, '..', f.pdf);
    assert.ok(fs.existsSync(dxfPath), `DXF exists for ${f.unit}`);
    assert.ok(fs.existsSync(pdfPath), `PDF exists for ${f.unit}`);
    const dxf = fs.readFileSync(dxfPath, 'utf8');
    assert.ok(dxf.includes('SECTION') && dxf.includes('EOF'), `${f.unit} DXF is valid`);
    const pdf = fs.readFileSync(pdfPath);
    assert.equal(pdf[0], 0x25); // '%'
    assert.equal(pdf[1], 0x50); // 'P'
    assert.equal(pdf[2], 0x44); // 'D'
    assert.equal(pdf[3], 0x46); // 'F'
    assert.equal(pdf[4], 0x2d); // '-'
  }
});
