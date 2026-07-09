// Generate DXF + 2D PDF elevations for the 3 July reference-photo units.
// Run: node scripts/generate-july-units.mjs
import { buildElevationDXF } from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';
import * as decode from '../server/services/render-elevation-decode.js';
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('storage/elevations');
fs.mkdirSync(OUT, { recursive: true });

const units = [
  ['wardrobe-vanity', 'WARDROBE + ARCHED VANITY'],
  ['wardrobe-study-nook', 'WARDROBE + STUDY NOOK'],
  ['wardrobe-stepped', 'TWO-TONE WARDROBE (STEPPED CENTER)'],
];

for (const [key, label] of units) {
  const fn = decode.DECODED_UNITS[key];
  if (!fn) { console.error('MISSING', key); process.exit(1); }
  const model = fn();
  const opts = { scale: '1:25', rev: '1.0', projectId: 'JULY-PHOTO', sheet: 'S' };
  const dxf = buildElevationDXF(model, opts);
  const pdf = await renderElevationPDF(model, opts);
  const dxfPath = path.join(OUT, `${key}.dxf`);
  const pdfPath = path.join(OUT, `${key}.pdf`);
  fs.writeFileSync(dxfPath, dxf);
  fs.writeFileSync(pdfPath, pdf);
  console.log(`OK  ${label.padEnd(38)} DXF=${dxf.length}B  PDF=${pdf.length}B`);
}
console.log('DONE');
