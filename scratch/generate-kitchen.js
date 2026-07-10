import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildElevationDXF } from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wall A containing Refrigerator + Cooktop (Hob) + Chimney (2690 mm)
const modelWallA = {
  projectId: 'PROJ-NAMBIAR-SUDIPTO',
  wallName: 'KITCHEN MAIN ELEVATION (WALL A)',
  lengthMm: 2690,
  heightMm: 2100,
  thicknessMm: 75,
  openings: [],
  cabinets: [
    {
      xOffsetMm: 0,
      zOffsetMm: 100,
      widthMm: 700,
      heightMm: 1900,
      tag: 'FRIDGE',
      material: { appliance: 'fridge', callout: 'STAINLESS STEEL FRIDGE' }
    },
    {
      xOffsetMm: 700,
      zOffsetMm: 100,
      widthMm: 900,
      heightMm: 820,
      tag: 'TANDEM DRAWERS',
      handleType: 'bar',
      material: { appliance: 'cooktop', callout: 'PLUM GLOSS HOB DRAWER UNIT' }
    },
    {
      xOffsetMm: 700,
      zOffsetMm: 1400,
      widthMm: 900,
      heightMm: 700,
      tag: 'CHIMNEY HOOD',
      material: { appliance: 'hood', callout: 'CREAM CHIMNEY SHUTTER' }
    },
    {
      xOffsetMm: 1600,
      zOffsetMm: 100,
      widthMm: 1090,
      heightMm: 820,
      tag: 'BASE UNIT',
      handleType: 'pull',
      material: { callout: 'PLUM BASE SHUTTER' }
    },
    {
      xOffsetMm: 1600,
      zOffsetMm: 1400,
      widthMm: 1090,
      heightMm: 700,
      tag: 'GLASS SHUTTER',
      handleType: 'pull',
      material: { glassGrid: true, glassCols: 3, glassRows: 2, callout: 'CREAM GLASS MUNTIN CABINET' }
    }
  ],
  coverage: {
    utilizationPct: 100,
    usedMm: 2690,
    freeMm: 0
  }
};

const outputDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\746b33d2-8d55-4a5c-9194-4a4fbd1a45f0';

// 1. Generate DXF for Wall A
const dxf = buildElevationDXF(modelWallA, { scale: '1:25', rev: '1.0' });
fs.writeFileSync(path.join(outputDir, 'kitchen_elevation.dxf'), dxf);
console.log('Kitchen DXF written successfully.');

// 2. Generate PDF for Wall A
const pdfBuffer = await renderElevationPDF(modelWallA, { scale: '1:25', rev: '1.0' });
fs.writeFileSync(path.join(outputDir, 'kitchen_elevation.pdf'), pdfBuffer);
console.log('Kitchen PDF written successfully.');
