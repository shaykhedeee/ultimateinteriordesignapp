/**
 * generate-render-elevations.mjs
 * Generates accurate 2D elevation DXF+PDF for the decoded 3D renders
 * using the shared service (server/services/render-elevation-decode.js).
 * Output: storage/elevations/render-<unit>-elevation.dxf | .pdf
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildElevationDXF } from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';
import { DECODED_UNITS } from '../server/services/render-elevation-decode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'storage', 'elevations');
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const keys = Object.keys(DECODED_UNITS);
  for (const key of keys) {
    const model = DECODED_UNITS[key]();
    const dxf = buildElevationDXF(model, { scale: '1:25', rev: '1.0' });
    const dxfPath = path.join(OUT, `render-${key}-elevation.dxf`);
    fs.writeFileSync(dxfPath, dxf, 'utf8');
    const pdf = await renderElevationPDF(model, { scale: '1:25', rev: '1.0' });
    const pdfPath = path.join(OUT, `render-${key}-elevation.pdf`);
    fs.writeFileSync(pdfPath, pdf);
    console.log(`✓ ${key.padEnd(9)} DXF ${(fs.statSync(dxfPath).size/1024).toFixed(1)}KB  PDF ${(fs.statSync(pdfPath).size/1024).toFixed(1)}KB (${model.lengthMm}×${model.heightMm}mm, ${model.cabinets.length} components)`);
  }
  console.log(`\nGenerated ${keys.length} elevation sets → ${path.resolve(OUT)}`);
}
main().catch(e => { console.error('GENERATE FAILED:', e); process.exit(1); });
