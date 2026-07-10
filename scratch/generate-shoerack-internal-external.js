import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildElevationDXF } from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. SHOERACK EXTERNAL MODEL (Closed Doors)
const shoerackExternal = {
  projectId: 'PROJ-NAMBIAR-SHOE-EXT',
  wallName: 'SHOE RACK CONSOLE & BENCH (EXTERNAL DRAWING)',
  lengthMm: 1200,
  heightMm: 900,
  thicknessMm: 75,
  openings: [],
  cabinets: [
    {
      xOffsetMm: 0,
      zOffsetMm: 250,
      widthMm: 750,
      heightMm: 650,
      tag: 'CONSOLE',
      handleType: 'pull',
      material: { callout: 'CREAM DOUBLE SHUTTER (CLOSED)' }
    },
    {
      xOffsetMm: 750,
      zOffsetMm: 250,
      widthMm: 450,
      heightMm: 350,
      tag: 'DRAWER',
      handleType: 'bar',
      material: { callout: 'CREAM DRAWER (CLOSED) + SEAT CUSHION' }
    },
    {
      xOffsetMm: 0,
      zOffsetMm: 100,
      widthMm: 1200,
      heightMm: 150,
      tag: 'SHOE BAY',
      material: { openShelf: true, shelves: 1, callout: 'OPEN LED-LIT SHOE SHELF' }
    }
  ],
  coverage: { utilizationPct: 100, usedMm: 1200, freeMm: 0 }
};

// 2. SHOERACK INTERNAL MODEL (Open Section)
const shoerackInternal = {
  projectId: 'PROJ-NAMBIAR-SHOE-INT',
  wallName: 'SHOE RACK CONSOLE & BENCH (INTERNAL SECTION)',
  lengthMm: 1200,
  heightMm: 900,
  thicknessMm: 75,
  openings: [],
  cabinets: [
    {
      xOffsetMm: 0,
      zOffsetMm: 250,
      widthMm: 750,
      heightMm: 650,
      tag: 'INTERNAL SHELVES',
      material: { openShelf: true, shelves: 3, callout: 'INTERNAL SHOE SHELVING' }
    },
    {
      xOffsetMm: 750,
      zOffsetMm: 250,
      widthMm: 450,
      heightMm: 350,
      tag: 'DRAWER PARTITION',
      material: { openShelf: true, callout: 'DRAWER BOX INTERIOR (H=350)' }
    },
    {
      xOffsetMm: 0,
      zOffsetMm: 100,
      widthMm: 1200,
      heightMm: 150,
      tag: 'SHOE BAY',
      material: { openShelf: true, shelves: 1 }
    }
  ],
  coverage: { utilizationPct: 100, usedMm: 1200, freeMm: 0 }
};

const outputDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\746b33d2-8d55-4a5c-9194-4a4fbd1a45f0';

// 1. Generate External DXF & PDF
fs.writeFileSync(path.join(outputDir, 'shoerack_external.dxf'), buildElevationDXF(shoerackExternal, { scale: '1:25', rev: '1.0' }));
fs.writeFileSync(path.join(outputDir, 'shoerack_external.pdf'), await renderElevationPDF(shoerackExternal, { scale: '1:25', rev: '1.0' }));
console.log('Shoe rack external files generated.');

// 2. Generate Internal DXF & PDF
fs.writeFileSync(path.join(outputDir, 'shoerack_internal.dxf'), buildElevationDXF(shoerackInternal, { scale: '1:25', rev: '1.0' }));
fs.writeFileSync(path.join(outputDir, 'shoerack_internal.pdf'), await renderElevationPDF(shoerackInternal, { scale: '1:25', rev: '1.0' }));
console.log('Shoe rack internal sectional files generated.');
