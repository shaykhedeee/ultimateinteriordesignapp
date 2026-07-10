import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildElevationDXF } from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. WARDROBE EXTERNAL MODEL (Closed Doors)
const wardrobeExternal = {
  projectId: 'PROJ-NAMBIAR-WARD-EXT',
  wallName: 'WARDROBE & STUDY STATION (EXTERNAL DRAWING)',
  lengthMm: 3000,
  heightMm: 2700,
  thicknessMm: 75,
  openings: [],
  cabinets: [
    {
      xOffsetMm: 0,
      zOffsetMm: 100,
      widthMm: 1600,
      heightMm: 2000,
      tag: 'SLIDING WARDROBE',
      handleType: 'pull',
      material: { twoTone: true, splitRatio: 0.8, callout: 'CREAM SLIDING SHUTTERS (CLOSED)' }
    },
    {
      xOffsetMm: 1600,
      zOffsetMm: 100,
      widthMm: 400,
      heightMm: 2000,
      tag: 'DISPLAY UNIT',
      handleType: 'vbar',
      material: { glass: true, callout: 'FLUTED GLASS PROFILE DOOR (CLOSED)' }
    },
    {
      xOffsetMm: 2000,
      zOffsetMm: 100,
      widthMm: 1000,
      heightMm: 750,
      tag: 'STUDY DESK',
      material: { openShelf: true, callout: 'STUDY COUNTER WITH DRAWERS' }
    },
    {
      xOffsetMm: 2000,
      zOffsetMm: 1400,
      widthMm: 1000,
      heightMm: 700,
      tag: 'OVERHEAD UNIT',
      handleType: 'pull',
      material: { glassGrid: true, glassCols: 2, glassRows: 1, callout: 'GLASS DISPLAY DOORS' }
    },
    {
      xOffsetMm: 0,
      zOffsetMm: 2100,
      widthMm: 3000,
      heightMm: 600,
      tag: 'LOFTS',
      material: { twoTone: true, callout: 'STORAGE LOFTS (CLOSED)' }
    }
  ],
  coverage: { utilizationPct: 100, usedMm: 3000, freeMm: 0 }
};

// 2. WARDROBE INTERNAL MODEL (Open Section)
const wardrobeInternal = {
  projectId: 'PROJ-NAMBIAR-WARD-INT',
  wallName: 'WARDROBE & STUDY STATION (INTERNAL SECTION)',
  lengthMm: 3000,
  heightMm: 2700,
  thicknessMm: 75,
  openings: [],
  cabinets: [
    {
      xOffsetMm: 0,
      zOffsetMm: 500,
      widthMm: 800,
      heightMm: 1600,
      tag: 'HANGER SPACE',
      material: { openShelf: true, callout: 'WARDROBE HANGING ROD SECTION' }
    },
    {
      xOffsetMm: 0,
      zOffsetMm: 100,
      widthMm: 800,
      heightMm: 400,
      tag: 'DRAWERS',
      material: { openShelf: true, shelves: 2, callout: 'INTERNAL DRAWERS (H=400)' }
    },
    {
      xOffsetMm: 800,
      zOffsetMm: 100,
      widthMm: 800,
      heightMm: 2000,
      tag: 'INTERNAL SHELVES',
      material: { openShelf: true, shelves: 5, callout: 'MULTI-TIER SHELVING' }
    },
    {
      xOffsetMm: 1600,
      zOffsetMm: 100,
      widthMm: 400,
      heightMm: 2000,
      tag: 'DISPLAY SHELVES',
      material: { openShelf: true, shelves: 5, callout: 'GLASS SHELVES WITH LED STRIPS' }
    },
    {
      xOffsetMm: 2000,
      zOffsetMm: 1400,
      widthMm: 1000,
      heightMm: 700,
      tag: 'OVERHEAD SHELVES',
      material: { openShelf: true, shelves: 2, callout: 'ADJUSTABLE WOOD SHELVES' }
    },
    {
      xOffsetMm: 0,
      zOffsetMm: 2100,
      widthMm: 3000,
      heightMm: 600,
      tag: 'LOFT STORAGE',
      material: { openShelf: true, shelves: 1, callout: 'OPEN LOFT COMPARTMENTS' }
    }
  ],
  coverage: { utilizationPct: 100, usedMm: 3000, freeMm: 0 }
};

const outputDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\746b33d2-8d55-4a5c-9194-4a4fbd1a45f0';

// 1. Generate External DXF & PDF
fs.writeFileSync(path.join(outputDir, 'wardrobe_external.dxf'), buildElevationDXF(wardrobeExternal, { scale: '1:25', rev: '1.0' }));
fs.writeFileSync(path.join(outputDir, 'wardrobe_external.pdf'), await renderElevationPDF(wardrobeExternal, { scale: '1:25', rev: '1.0' }));
console.log('Wardrobe external files generated.');

// 2. Generate Internal DXF & PDF
fs.writeFileSync(path.join(outputDir, 'wardrobe_internal.dxf'), buildElevationDXF(wardrobeInternal, { scale: '1:25', rev: '1.0' }));
fs.writeFileSync(path.join(outputDir, 'wardrobe_internal.pdf'), await renderElevationPDF(wardrobeInternal, { scale: '1:25', rev: '1.0' }));
console.log('Wardrobe internal sectional files generated.');
