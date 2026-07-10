import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildElevationDXF } from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. EXTERNAL MODEL (Doors Closed)
const modelExternal = {
  projectId: 'PROJ-NAMBIAR-CROK-EXT',
  wallName: 'COMBINED CROCKERY & POOJA UNIT (EXTERNAL DRAWING)',
  lengthMm: 1187,
  heightMm: 2100,
  thicknessMm: 75,
  openings: [],
  cabinets: [
    {
      xOffsetMm: 0,
      zOffsetMm: 100,
      widthMm: 500,
      heightMm: 2000,
      tag: 'POOJA UNIT',
      handleType: 'pull',
      material: { cane: true, callout: 'CNC LOTUS JALI SHUTTERS (WALNUT)' }
    },
    {
      xOffsetMm: 500,
      zOffsetMm: 1400,
      widthMm: 500,
      heightMm: 700,
      tag: 'CROCKERY TOP',
      handleType: 'pull',
      material: { twoTone: true, callout: 'CREAM SHUTTERS (CLOSED)' }
    },
    {
      xOffsetMm: 500,
      zOffsetMm: 1100,
      widthMm: 500,
      heightMm: 300,
      tag: 'OPEN NICHE',
      material: { openShelf: true, callout: 'WALNUT VENEER NICHE' }
    },
    {
      xOffsetMm: 500,
      zOffsetMm: 750,
      widthMm: 500,
      heightMm: 350,
      tag: 'MIRROR SPLASH',
      material: { glassGrid: true, glassCols: 2, glassRows: 2, callout: 'DIAMOND MIRROR PANELS' }
    },
    {
      xOffsetMm: 500,
      zOffsetMm: 550,
      widthMm: 500,
      heightMm: 200,
      tag: 'DRAWER',
      handleType: 'bar',
      material: { callout: 'CREAM SHUTTER DRAWER' }
    },
    {
      xOffsetMm: 500,
      zOffsetMm: 100,
      widthMm: 500,
      heightMm: 450,
      tag: 'BASE UNIT',
      handleType: 'pull',
      material: { callout: 'CREAM SHUTTERS (CLOSED)' }
    },
    {
      xOffsetMm: 1000,
      zOffsetMm: 100,
      widthMm: 187,
      heightMm: 2000,
      tag: 'DISPLAY UNIT',
      handleType: 'vbar',
      material: { glass: true, callout: 'TINTED GLASS PROFILE SHUTTER (CLOSED)' }
    }
  ],
  coverage: { utilizationPct: 100, usedMm: 1187, freeMm: 0 }
};

// 2. INTERNAL MODEL (Doors Open/Removed)
const modelInternal = {
  projectId: 'PROJ-NAMBIAR-CROK-INT',
  wallName: 'COMBINED CROCKERY & POOJA UNIT (INTERNAL SECTION)',
  lengthMm: 1187,
  heightMm: 2100,
  thicknessMm: 75,
  openings: [],
  cabinets: [
    // Pooja Niche interior: Stepped pedestal + deity platform
    {
      xOffsetMm: 0,
      zOffsetMm: 100,
      widthMm: 500,
      heightMm: 150,
      tag: 'PEDESTAL STEP 1',
      material: { openShelf: true, callout: 'MARBLE PEDESTAL BASE (H=150)' }
    },
    {
      xOffsetMm: 50,
      zOffsetMm: 250,
      widthMm: 400,
      heightMm: 150,
      tag: 'PEDESTAL STEP 2',
      material: { openShelf: true, callout: 'MARBLE PEDESTAL MID-STEP' }
    },
    {
      xOffsetMm: 100,
      zOffsetMm: 400,
      widthMm: 300,
      heightMm: 150,
      tag: 'DEITY PLATFORM',
      material: { openShelf: true, callout: 'DEITY STAND (GANESHA STATUE ZONE)' }
    },
    // Upper niche open box (above pedestal)
    {
      xOffsetMm: 0,
      zOffsetMm: 550,
      widthMm: 500,
      heightMm: 1550,
      tag: 'POOJA CHAMBER',
      material: { openShelf: true, callout: 'BACK WALL PAINTED / SPOTLIGHT AT TOP' }
    },
    // Crockery Overhead (Shelves inside)
    {
      xOffsetMm: 500,
      zOffsetMm: 1400,
      widthMm: 500,
      heightMm: 700,
      tag: 'INTERNAL SHELVES',
      material: { openShelf: true, shelves: 3, callout: 'ADJUSTABLE WOOD SHELVES' }
    },
    // Crockery Open Niche remains identical
    {
      xOffsetMm: 500,
      zOffsetMm: 1100,
      widthMm: 500,
      heightMm: 300,
      tag: 'OPEN NICHE',
      material: { openShelf: true }
    },
    // Crockery Splash remains identical
    {
      xOffsetMm: 500,
      zOffsetMm: 750,
      widthMm: 500,
      heightMm: 350,
      tag: 'MIRROR SPLASH',
      material: { glassGrid: true, glassCols: 2, glassRows: 2 }
    },
    // Crockery Drawer partition / runner interior
    {
      xOffsetMm: 500,
      zOffsetMm: 550,
      widthMm: 500,
      heightMm: 200,
      tag: 'DRAWER INT',
      material: { openShelf: true, callout: 'TANDEM DRAWER RUNNER (H=200)' }
    },
    // Crockery Base unit interior
    {
      xOffsetMm: 500,
      zOffsetMm: 100,
      widthMm: 500,
      heightMm: 450,
      tag: 'INTERNAL SHELVES',
      material: { openShelf: true, shelves: 2, callout: 'BASE UNIT SHELVING' }
    },
    // Display Cabinet interior (Glass shelves + LED)
    {
      xOffsetMm: 1000,
      zOffsetMm: 100,
      widthMm: 187,
      heightMm: 2000,
      tag: 'GLASS SHELVES',
      material: { openShelf: true, shelves: 5, callout: '4mm GLASS SHELVES with LED CHANNELS' }
    }
  ],
  coverage: { utilizationPct: 100, usedMm: 1187, freeMm: 0 }
};

const outputDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\746b33d2-8d55-4a5c-9194-4a4fbd1a45f0';

// 1. Generate External DXF & PDF
fs.writeFileSync(path.join(outputDir, 'crockery_external.dxf'), buildElevationDXF(modelExternal, { scale: '1:25', rev: '1.0' }));
fs.writeFileSync(path.join(outputDir, 'crockery_external.pdf'), await renderElevationPDF(modelExternal, { scale: '1:25', rev: '1.0' }));
console.log('External files generated.');

// 2. Generate Internal DXF & PDF
fs.writeFileSync(path.join(outputDir, 'crockery_internal.dxf'), buildElevationDXF(modelInternal, { scale: '1:25', rev: '1.0' }));
fs.writeFileSync(path.join(outputDir, 'crockery_internal.pdf'), await renderElevationPDF(modelInternal, { scale: '1:25', rev: '1.0' }));
console.log('Internal sectional files generated.');
