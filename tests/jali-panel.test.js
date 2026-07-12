// Regression tests for jali-panel.js — CNC lotus + circular lattice DXF/PDF.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildJaliPanelDXF, buildJaliPanelPDF } from '../server/services/jali-panel.js';

test('buildJaliPanelDXF: returns a non-empty DXF string with panel name + cane layer', async () => {
  const dxf = buildJaliPanelDXF({ widthMm: 600, heightMm: 2000, name: 'POOJA JALI' });
  assert.equal(typeof dxf, 'string');
  assert.ok(dxf.length > 200, 'DXF should have substantial content');
  assert.ok(dxf.toUpperCase().includes('POOJA JALI'), 'panel name should be in output');
  assert.ok(dxf.includes('CANE'), 'jali cuts should be on CANE layer');
});

test('buildJaliPanelDXF: defaults when dims missing (no crash, valid)', () => {
  const dxf = buildJaliPanelDXF();
  assert.equal(typeof dxf, 'string');
  assert.ok(dxf.length > 100);
});

test('buildJaliPanelPDF: returns a PDF document (promise resolves to buffer)', async () => {
  const pdf = await buildJaliPanelPDF({ widthMm: 600, heightMm: 2000, name: 'JALI' });
  assert.ok(Buffer.isBuffer(pdf) || typeof pdf === 'object', 'PDF should resolve');
  const buf = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
  // PDF magic header
  assert.ok(buf.slice(0, 5).toString().startsWith('%PDF'), 'should be a PDF');
});
