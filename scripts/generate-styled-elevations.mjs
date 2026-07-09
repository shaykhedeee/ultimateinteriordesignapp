// Generate DXF + PDF for the 6 photo-traced styled units (wardrobe-fluted,
// wardrobe-study, pooja-ganesha, vanity-arch, kitchen-wall-a, kitchen-wall-b).
// Run: node scripts/generate-styled-elevations.mjs
import { DECODED_UNITS } from '../server/services/render-elevation-decode.js';
import { buildElevationDXF } from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'storage', 'elevations');
fs.mkdirSync(OUT, { recursive: true });

const units = ['wardrobe-fluted', 'wardrobe-study', 'pooja-ganesha', 'vanity-arch', 'kitchen-wall-a', 'kitchen-wall-b'];
const opts = { scale: '1:25', rev: '1.0', projectId: 'STYLED', sheet: 'STYLED ELEVATION' };

for (const key of units) {
  const model = DECODED_UNITS[key]();
  const rid = key;
  const dxfPath = path.join(OUT, `${rid}.dxf`);
  const pdfPath = path.join(OUT, `${rid}.pdf`);
  fs.writeFileSync(dxfPath, buildElevationDXF(model, opts));
  const pdfBuf = await renderElevationPDF(model, opts);
  fs.writeFileSync(pdfPath, pdfBuf);
  const ents = fs.readFileSync(dxfPath, 'utf8').split('\n').filter(l => l.trim() === '0' && true).length;
  console.log(`OK ${key.padEnd(16)} dxf=${(fs.statSync(dxfPath).size/1024).toFixed(1)}kB pdf=${(fs.statSync(pdfPath).size/1024).toFixed(1)}kB`);
}
console.log('Generated all styled elevations.');
