/**
 * tests/pdf-elevation.test.js
 * node --test  (no deps; pdfkit is a project dependency)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';
import { analyzeWallElevation } from '../server/services/elevation-analyzer.js';

const wall = { id: 'w1', x1: 0, y1: 0, x2: 240, y2: 0, thicknessMm: 75 };

test('renders a valid PDF buffer (header %PDF, end %%EOF)', async () => {
  const model = analyzeWallElevation({
    wall,
    openings: [{ openingType: 'door', offsetFromStartMm: 600, widthMm: 900, wallId: 'w1' }],
    furniture: [{ id: 'c1', type: 'base', width: 600, height: 720, xOffsetWall: 0, wallId: 'w1', name: 'Base', customization: { shutterFinish: 'Fluted Glass' } }],
    pixelsPerMeter: 40
  });
  const buf = await renderElevationPDF(model, { scale: '1:25' });
  assert.ok(Buffer.isBuffer(buf));
  assert.ok(buf.length > 1000);
  assert.equal(buf.slice(0, 5).toString('latin1'), '%PDF-');
  assert.ok(buf.slice(-8).toString('latin1').includes('%%EOF'));
});
