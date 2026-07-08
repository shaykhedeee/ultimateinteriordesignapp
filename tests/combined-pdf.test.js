/**
 * tests/combined-pdf.test.js
 * renderCombinedElevationsPDF emits a valid multi-page PDF for a list of models.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCombinedElevationsPDF, renderElevationPDF } from '../server/services/pdf-elevation.js';

const mk = (wallName) => ({
  projectId: 't1', wallName, lengthMm: 2184, heightMm: 2700,
  openings: [{ offsetMm: 200, widthMm: 900, sillMm: 900, headMm: 2100, type: 'door' }],
  cabinets: [{ xOffsetMm: 0, zOffsetMm: 0, widthMm: 1800, heightMm: 2400, tag: 'WARDROBE', name: 'Wardrobe' }],
});

test('renderElevationPDF returns a single valid PDF buffer with %PDF header', async () => {
  const buf = await renderElevationPDF(mk('W1'));
  assert.ok(Buffer.isBuffer(buf));
  assert.equal(buf.slice(0, 5).toString(), '%PDF-');
});

test('renderCombinedElevationsPDF emits one PDF containing all walls', async () => {
  const buf = await renderCombinedElevationsPDF([mk('W1'), mk('W2'), mk('W3')]);
  assert.ok(Buffer.isBuffer(buf));
  assert.equal(buf.slice(0, 5).toString(), '%PDF-');
  // multi-page PDF uses /Type /Page — expect at least 3 page objects
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  assert.ok(pages >= 3, `expected >=3 pages, got ${pages}`);
});
