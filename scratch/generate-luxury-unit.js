import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildElevationDXF } from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const model = {
  projectId: 'PROJ-LUXE-VANITY-02',
  wallName: 'LUXURY BACKLIT VANITY & WARDROBE',
  lengthMm: 600,
  heightMm: 2100,
  thicknessMm: 75,
  openings: [],
  cabinets: [
    {
      xOffsetMm: 0,
      zOffsetMm: 100,
      widthMm: 300,
      heightMm: 500,
      tag: 'SHUTTER',
      handleType: 'pull',
      material: { callout: 'CREAM BASE CABINET SHUTTER' }
    },
    {
      xOffsetMm: 0,
      zOffsetMm: 600,
      widthMm: 300,
      heightMm: 250,
      tag: 'DRAWER',
      handleType: 'knob',
      material: { callout: 'CHARCOAL DRAWER UNIT' }
    },
    {
      xOffsetMm: 0,
      zOffsetMm: 850,
      widthMm: 300,
      heightMm: 1250,
      tag: 'SHUTTER',
      handleType: 'pull',
      material: { callout: 'CREAM WARDROBE UPPER SHUTTER' }
    },
    {
      xOffsetMm: 300,
      zOffsetMm: 600,
      widthMm: 300,
      heightMm: 250,
      tag: 'DRAWER',
      handleType: 'knob',
      material: { callout: 'FLOATING VANITY DRAWER (CHARCOAL)' }
    },
    {
      xOffsetMm: 300,
      zOffsetMm: 850,
      widthMm: 300,
      heightMm: 1250,
      tag: 'MIRROR',
      material: { arch: true, callout: 'BACKLIT ARCHED DRESSING MIRROR' }
    }
  ],
  coverage: {
    utilizationPct: 100,
    usedMm: 600,
    freeMm: 0
  }
};

const outputDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\746b33d2-8d55-4a5c-9194-4a4fbd1a45f0';

// 1. Generate DXF (no dimensions)
const dxf = buildElevationDXF(model, { scale: '1:25', rev: '1.2', noDimensions: true });
fs.writeFileSync(path.join(outputDir, 'vanity_wardrobe_unit_v2.dxf'), dxf);
console.log('DXF written successfully.');

// 2. Generate PDF (no dimensions)
const pdfBuffer = await renderElevationPDF(model, { scale: '1:25', rev: '1.2', noDimensions: true });
fs.writeFileSync(path.join(outputDir, 'vanity_wardrobe_unit_v2.pdf'), pdfBuffer);
console.log('PDF written successfully.');
