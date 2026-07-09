/**
 * scripts/generate-jali-panel.mjs
 * ---------------------------------------------------------------------------
 * Standalone CNC JALI / lattice panel generator (DXF + PDF).
 * Reuses server/services/jali-panel.js (same engine as the in-app generator).
 * Usage: node scripts/generate-jali-panel.mjs [widthMm] [heightMm] [name]
 *   e.g. node scripts/generate-jali-panel.mjs 600 2000 "Wardrobe Jali"
 */
import { buildJaliPanelDXF, buildJaliPanelPDF } from '../server/services/jali-panel.js';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const widthMm = Number(process.argv[2]) || 600;
const heightMm = Number(process.argv[3]) || 2000;
const name = process.argv[4] || 'Jali Panel';

const OUT = path.resolve('storage', 'elevations');
mkdirSync(OUT, { recursive: true });

const dxf = buildJaliPanelDXF({ widthMm, heightMm, name, projectId: 'JALI' });
const outDxf = path.join(OUT, `jali-panel-${Date.now().toString(36)}.dxf`);
writeFileSync(outDxf, dxf, 'utf8');

const pdf = await buildJaliPanelPDF({ widthMm, heightMm, name, projectId: 'JALI' });
const outPdf = path.join(OUT, `jali-panel-${Date.now().toString(36)}.pdf`);
writeFileSync(outPdf, pdf);

console.log('JALI PANEL:', `${widthMm}x${heightMm}mm`, name);
console.log('DXF ->', outDxf, `(${dxf.length} bytes)`);
console.log('PDF ->', outPdf);
