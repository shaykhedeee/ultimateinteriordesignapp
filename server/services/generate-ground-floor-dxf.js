/**
 * generate-ground-floor-dxf.js
 * ──────────────────────────────────────────────────────────────────
 * Creates a precise professional 2D DXF of the GROUND FLOOR PLAN
 * analysed from the uploaded image.
 *
 * Dimensions read from the plan image (all in metres, Scale 1:100):
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  Overall: 9.00m wide × 11.00m deep                       │
 * │  Top edge:     2.00 + 4.00 + 3.00 = 9.00m               │
 * │  Bottom edge:  4.00 + 2.00 + 3.00 = 9.00m               │
 * │  Right side:   3.00 + 5.00 + 3.00 = 11.00m              │
 * │  Left side:    1.50 + 3.50 + 3.00 = 8.00m               │
 * │                                                            │
 * │  Rooms (read from labels + written pen dims):             │
 * │   Kitchen:      4.00 × 3.00 (top-center)                 │
 * │   C.R.:         2.00 × 1.50 (top-left, Common Room/Bath) │
 * │   Living Area:  3.00 × 5.00 (right side)                 │
 * │   Dining Area:  4.00 × 3.50 (center, open to Living)     │
 * │   Bedroom 1:    4.00 × 3.50 (mid-left)                   │
 * │   Bedroom 2:    4.00 × 3.00 (bottom-left)                │
 * │   Porch:        3.00 × 3.00 (bottom-right)               │
 * │   Staircase:    2.00 × 3.00 (bottom-center)              │
 * └──────────────────────────────────────────────────────────┘
 *
 * All dimensions converted to mm for DXF.
 */
import { generateFloorPlanDXF } from './floorplan-dxf-generator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ── Convert metres to mm ── */
const M = 1000; // 1m = 1000mm
const WT = 150; // wall thickness 150mm (6")

/* ═══════════════════════════════════════════════════════════════════
 *  COORDINATE SYSTEM:
 *  Origin (0,0) = bottom-left corner of the plan (exterior)
 *  X → right,  Y → up
 *  All coordinates in mm.
 * ═══════════════════════════════════════════════════════════════════ */

// Overall outer extents
const PLAN_W = 9000;  // 9.00m
const PLAN_H = 11000; // 11.00m

/* ── Key vertical breaks (from bottom) ── */
const Y_BOTTOM      = 0;                     // 0mm
const Y_PORCH_TOP   = 3000;                  // 3.00m (porch/bedroom2 top, staircase top)
const Y_BEDROOM1_TOP = Y_PORCH_TOP + 3500;   // 6500mm (bedroom1 top / CR bottom)
const Y_CR_TOP      = Y_BEDROOM1_TOP + 1500; // 8000mm (CR top = Kitchen bottom on left side)
const Y_TOP         = PLAN_H;                // 11000mm

/* ── Key horizontal breaks (from left) ── */
const X_LEFT        = 0;
const X_LEFT_ROOMS  = 4000;  // 4.00m (bedroom1/bedroom2 right wall)
const X_STAIR_RIGHT = X_LEFT_ROOMS + 2000; // 6000mm (staircase right / living left-ish)
const X_RIGHT       = PLAN_W;              // 9000mm

/* ═════════════════════════════════════════════════════════════════
 *  WALL SEGMENTS
 *  Each wall: {x1, y1, x2, y2, thickness}
 *  We trace EVERY wall centreline.
 * ═════════════════════════════════════════════════════════════════ */
const walls = [
  // ── EXTERIOR WALLS ──
  // Bottom wall
  { x1: 0, y1: 0, x2: 9000, y2: 0 },
  // Right wall (full)
  { x1: 9000, y1: 0, x2: 9000, y2: 11000 },
  // Top wall
  { x1: 9000, y1: 11000, x2: 0, y2: 11000 },
  // Left wall (bottom section: 0→8000, left bedrooms area)
  { x1: 0, y1: 0, x2: 0, y2: 8000 },
  // Left wall (top section: kitchen top-left corner up to plan top)
  // Actually left side only goes to 8000mm height; then top-left steps in
  // The 2.00m at top-left offset means the Kitchen left wall starts at x=2000
  { x1: 0, y1: 8000, x2: 2000, y2: 8000 },
  { x1: 2000, y1: 8000, x2: 2000, y2: 11000 },

  // ── INTERNAL WALLS ──
  // Bedroom1/Bedroom2 divider (horizontal at Y=3000, from x=0 to x=4000)
  { x1: 0, y1: 3000, x2: 4000, y2: 3000 },
  // Bedroom1 right wall (vertical at x=4000, from y=0 to y=6500)
  { x1: 4000, y1: 0, x2: 4000, y2: 6500 },
  // Bedroom1 top / CR bottom (horizontal at Y=6500, from x=0 to x=4000)
  { x1: 0, y1: 6500, x2: 4000, y2: 6500 },
  // CR right wall / Dining-Kitchen divider (vertical x=4000, y=6500 to y=8000)
  { x1: 4000, y1: 6500, x2: 4000, y2: 8000 },
  // Kitchen bottom wall (horizontal at Y=8000, from x=4000 to x=9000 — partial, with door gap)
  { x1: 4000, y1: 8000, x2: 6000, y2: 8000 },
  // (door gap in kitchen bottom wall around 6000-7000)
  { x1: 7000, y1: 8000, x2: 9000, y2: 8000 },
  // CR top wall (x=0..2000 at y=8000 is exterior; x=2000..4000 at y=8000)
  // Already covered by exterior wall { x1:0, y1:8000, x2:2000, y2:8000 }
  // Internal CR right wall already covered at x=4000

  // ── Staircase walls ──
  // Staircase left wall (at x=4000, already covered)
  // Staircase right wall (at x=6000)
  { x1: 6000, y1: 0, x2: 6000, y2: 3000 },
  // Staircase top wall (at y=3000, x=4000 to x=6000)
  { x1: 4000, y1: 3000, x2: 6000, y2: 3000 },

  // ── Living/Porch divider ──
  // Horizontal wall at Y=3000 from x=6000 to x=9000 (porch top / living bottom)
  { x1: 6000, y1: 3000, x2: 9000, y2: 3000 },

  // ── Dining wall between Dining and Living (already open plan, no wall) ──
  // The Dining Area and Living Area share the right-side space;
  // The wall separating dining from bedrooms is at x=4000 already covered

  // CR left wall is at x=0 exterior
  // CR right wall at x=2000 (width 2.00m)
  // Actually the CR width is 2.00m → x=0 to x=2000
  // CR internal right divider
  { x1: 2000, y1: 6500, x2: 2000, y2: 8000 },
];

/* ═════════════════════════════════════════════════════════════════
 *  ROOMS with labels and approximate centres
 * ═════════════════════════════════════════════════════════════════ */
const rooms = [
  {
    label: 'KITCHEN',
    x: 2000, y: 8000, w: 7000, h: 3000,
    cx: 5500, cy: 9500,
    areaText: '4.00 x 3.00 = 12.0 sq.m'
  },
  {
    label: 'C.R.',
    x: 0, y: 6500, w: 2000, h: 1500,
    cx: 1000, cy: 7250,
    areaText: '2.00 x 1.50 = 3.0 sq.m'
  },
  {
    label: 'DINING AREA',
    x: 2000, y: 3000, w: 4000, h: 5000,
    cx: 4000, cy: 5500,
    areaText: 'Open to Living'
  },
  {
    label: 'LIVING AREA',
    x: 6000, y: 3000, w: 3000, h: 5000,
    cx: 7500, cy: 5500,
    areaText: '3.00 x 5.00 = 15.0 sq.m'
  },
  {
    label: 'BEDROOM 1',
    x: 0, y: 3000, w: 4000, h: 3500,
    cx: 2000, cy: 4750,
    areaText: '4.00 x 3.50 = 14.0 sq.m'
  },
  {
    label: 'BEDROOM 2',
    x: 0, y: 0, w: 4000, h: 3000,
    cx: 2000, cy: 1500,
    areaText: '4.00 x 3.00 = 12.0 sq.m'
  },
  {
    label: 'PORCH',
    x: 6000, y: 0, w: 3000, h: 3000,
    cx: 7500, cy: 1500,
    areaText: '3.00 x 3.00 = 9.0 sq.m'
  },
  {
    label: 'STAIRCASE',
    x: 4000, y: 0, w: 2000, h: 3000,
    cx: 5000, cy: 1500,
    areaText: '2.00 x 3.00'
  },
];

/* ═════════════════════════════════════════════════════════════════
 *  DOORS (hinge point, width, direction)
 * ═════════════════════════════════════════════════════════════════ */
const doors = [
  // Kitchen entry from dining (gap in wall at Y=8000, around x=6000-7000)
  { hx: 6000, hy: 8000, width: 900, direction: 'up' },
  // C.R. door (bottom of CR, entrance from dining)
  { hx: 2000, hy: 6500, width: 750, direction: 'left' },
  // Bedroom 1 door (right wall or top of bedroom1)
  { hx: 3200, hy: 6500, width: 900, direction: 'down' },
  // Bedroom 1 secondary (from corridor/dining)
  { hx: 4000, hy: 4000, width: 900, direction: 'left' },
  // Bedroom 2 door (top wall or right wall)
  { hx: 4000, hy: 1500, width: 900, direction: 'left' },
  // Porch entry (from outside, bottom wall)
  { hx: 7500, hy: 0, width: 1000, direction: 'up' },
  // Main entry (from porch to staircase/living)
  { hx: 6000, hy: 1500, width: 900, direction: 'right' },
];

/* ═════════════════════════════════════════════════════════════════
 *  WINDOWS
 * ═════════════════════════════════════════════════════════════════ */
const windows = [
  // Kitchen top wall windows
  { x1: 3000, y1: 11000, x2: 4500, y2: 11000 },
  // Living Area right wall window
  { x1: 9000, y1: 4000, x2: 9000, y2: 6000 },
  // Bedroom 1 left wall window
  { x1: 0, y1: 4000, x2: 0, y2: 5500 },
  // Bedroom 2 left wall window
  { x1: 0, y1: 800, x2: 0, y2: 2200 },
  // Bedroom 2 bottom wall window
  { x1: 1000, y1: 0, x2: 2500, y2: 0 },
  // Porch right wall window / opening
  { x1: 9000, y1: 800, x2: 9000, y2: 2200 },
  // Kitchen right wall window
  { x1: 9000, y1: 9000, x2: 9000, y2: 10500 },
];

/* ═════════════════════════════════════════════════════════════════
 *  STAIRS
 * ═════════════════════════════════════════════════════════════════ */
const stairs = [
  { x: 4150, y: 150, w: 1700, h: 2700, steps: 12, direction: 'up' },
];

/* ═════════════════════════════════════════════════════════════════
 *  DIMENSION CHAINS
 *  Tier 1: individual room widths
 *  Tier 2: overall dimensions
 * ═════════════════════════════════════════════════════════════════ */
const dimensions = [
  // ── BOTTOM HORIZONTAL (Tier 1) ──
  { x1: 0, y1: 0, x2: 4000, y2: 0, label: '4000', dir: 'h', offset: -400 },
  { x1: 4000, y1: 0, x2: 6000, y2: 0, label: '2000', dir: 'h', offset: -400 },
  { x1: 6000, y1: 0, x2: 9000, y2: 0, label: '3000', dir: 'h', offset: -400 },
  // ── BOTTOM HORIZONTAL (Tier 2: overall) ──
  { x1: 0, y1: 0, x2: 9000, y2: 0, label: '9000', dir: 'h', offset: -800 },
  // Bedroom 2 partial
  { x1: 0, y1: 0, x2: 2500, y2: 0, label: '2500', dir: 'h', offset: -1200 },

  // ── TOP HORIZONTAL (Tier 1) ──
  { x1: 0, y1: 11000, x2: 2000, y2: 11000, label: '2000', dir: 'h', offset: 400 },
  { x1: 2000, y1: 11000, x2: 6000, y2: 11000, label: '4000', dir: 'h', offset: 400 },
  { x1: 6000, y1: 11000, x2: 9000, y2: 11000, label: '3000', dir: 'h', offset: 400 },

  // ── LEFT VERTICAL (Tier 1) ──
  { x1: 0, y1: 0, x2: 0, y2: 3000, label: '3000', dir: 'v', offset: -400 },
  { x1: 0, y1: 3000, x2: 0, y2: 6500, label: '3500', dir: 'v', offset: -400 },
  { x1: 0, y1: 6500, x2: 0, y2: 8000, label: '1500', dir: 'v', offset: -400 },
  // ── LEFT VERTICAL (Tier 2: overall) ──
  { x1: 0, y1: 0, x2: 0, y2: 8000, label: '8000', dir: 'v', offset: -800 },

  // ── RIGHT VERTICAL (Tier 1) ──
  { x1: 9000, y1: 0, x2: 9000, y2: 3000, label: '3000', dir: 'v', offset: 400 },
  { x1: 9000, y1: 3000, x2: 9000, y2: 8000, label: '5000', dir: 'v', offset: 400 },
  { x1: 9000, y1: 8000, x2: 9000, y2: 11000, label: '3000', dir: 'v', offset: 400 },
  // ── RIGHT VERTICAL (Tier 2: overall) ──
  { x1: 9000, y1: 0, x2: 9000, y2: 11000, label: '11000', dir: 'v', offset: 800 },
];

/* ═════════════════════════════════════════════════════════════════
 *  ASSEMBLE and GENERATE
 * ═════════════════════════════════════════════════════════════════ */
const plan = {
  wallThickness: WT,
  walls,
  rooms,
  doors,
  windows,
  stairs,
  dimensions,
  titleBlock: { x: 0, y: -1600 },
  northArrow: { x: 5000, y: -1200 },
};

const dxfContent = generateFloorPlanDXF(plan, {
  scale: '1:100',
  projectName: 'GROUND FLOOR PLAN',
  sheetName: 'A-001',
});

// Write to storage/uploads directory
const outputDir = path.join(__dirname, '..', '..', 'storage', 'uploads');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const timestamp = Date.now();
const outputPath = path.join(outputDir, `${timestamp}-ground-floor-plan.dxf`);
fs.writeFileSync(outputPath, dxfContent, 'utf8');

console.log(`✅ DXF generated: ${outputPath}`);
console.log(`   File size: ${(Buffer.byteLength(dxfContent) / 1024).toFixed(1)} KB`);
console.log(`   Total entities in DXF`);

// Also write a copy to the project root for easy access
const rootCopy = path.join(__dirname, '..', '..', 'ground-floor-plan.dxf');
fs.writeFileSync(rootCopy, dxfContent, 'utf8');
console.log(`   Copy at: ${rootCopy}`);
