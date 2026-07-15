/**
 * export-c009-dxf.js
 * ──────────────────────────────────────────────────────────────────
 * Generates the professional 2D floor plan DXF file for `UNIT PLAN C 009`
 * using the seeded database data.
 */
import Database from 'better-sqlite3';
import { generateFloorPlanDXF } from './floorplan-dxf-generator.js';
import fs from 'fs';
import path from 'path';

const db = new Database('storage/ultimate_interior.db');
const projectId = 'proj_xJfh56S2iB';

const cad = db.prepare("SELECT * FROM cad_drawings WHERE project_id = ? ORDER BY created_at DESC LIMIT 1").get(projectId);
if (!cad) {
  console.error('No CAD drawing found for project.');
  process.exit(1);
}

const ppm = parseFloat(cad.pixels_per_meter) || 40;
const toMm = (px) => (px / ppm) * 1000;
const rawWalls = JSON.parse(cad.walls_json || '[]');
const rawOpenings = JSON.parse(cad.openings_json || '[]');
const rawRooms = JSON.parse(cad.rooms_json || '[]');

// Convert walls from px to mm
const walls = rawWalls.map(w => ({
  x1: toMm(w.x1), y1: toMm(w.y1),
  x2: toMm(w.x2), y2: toMm(w.y2),
  thickness: w.thicknessMm || 150
}));

// Convert rooms
const rooms = rawRooms.map((r, i) => {
  const pts = (r.points || []).map(p => ({ x: toMm(p.x), y: toMm(p.y) }));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const wMm = maxX - minX, hMm = maxY - minY;
  const areaM2 = (wMm * hMm) / 1e6;
  return {
    label: r.name || r.type || `Room ${i + 1}`,
    polygon: pts.length >= 3 ? pts : undefined,
    cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
    x: minX, y: minY, w: wMm, h: hMm,
    areaText: `${Math.round(wMm)} x ${Math.round(hMm)} mm  (${areaM2.toFixed(1)} sq.m)`
  };
});

// Convert openings
const doors = [], windows = [];
for (const op of rawOpenings) {
  const type = (op.type || op.openingType || 'door').toLowerCase();
  if (type === 'window') {
    windows.push({
      x1: toMm(op.x1 || op.x || 0), y1: toMm(op.y1 || op.y || 0),
      x2: toMm(op.x2 || (op.x || 0) + (op.widthMm || 900) * ppm / 1000), y2: toMm(op.y2 || op.y || 0)
    });
  } else {
    doors.push({
      hx: toMm(op.x || op.x1 || 0), hy: toMm(op.y || op.y1 || 0),
      width: op.widthMm || 900, direction: op.direction || 'right'
    });
  }
}

// Build dimension chains
const dimensions = [];
if (walls.length) {
  const allX = walls.flatMap(w => [w.x1, w.x2]);
  const allY = walls.flatMap(w => [w.y1, w.y2]);
  const bMinX = Math.min(...allX), bMaxX = Math.max(...allX);
  const bMinY = Math.min(...allY), bMaxY = Math.max(...allY);
  
  // Dual-tier bottom dimensions
  // Tier 1: individual wall divisions
  dimensions.push({ x1: bMinX, y1: bMinY, x2: bMinX + 3003, y2: bMinY, label: '3003', dir: 'h', offset: -400 });
  dimensions.push({ x1: bMinX + 3003, y1: bMinY, x2: bMinX + 3003 + 1524, y2: bMinY, label: '1524', dir: 'h', offset: -400 });
  dimensions.push({ x1: bMinX + 3003 + 1524, y1: bMinY, x2: bMinX + 3003 + 1524 + 2173, y2: bMinY, label: '2173', dir: 'h', offset: -400 });
  dimensions.push({ x1: bMinX + 3003 + 1524 + 2173, y1: bMinY, x2: bMaxX, y2: bMinY, label: '3210', dir: 'h', offset: -400 });

  // Tier 2: overall width
  dimensions.push({ x1: bMinX, y1: bMinY, x2: bMaxX, y2: bMinY, label: '9955', dir: 'h', offset: -800 });

  // Right vertical dimensions
  dimensions.push({ x1: bMaxX, y1: bMinY, x2: bMaxX, y2: bMinY + 3005, label: '3005', dir: 'v', offset: 400 });
  dimensions.push({ x1: bMaxX, y1: bMinY + 3005, x2: bMaxX, y2: bMinY + 3005 + 3740, label: '3740', dir: 'v', offset: 400 });
  dimensions.push({ x1: bMaxX, y1: bMinY + 3005 + 3740, x2: bMaxX, y2: bMaxY, label: '3000', dir: 'v', offset: 400 });
  dimensions.push({ x1: bMaxX, y1: bMinY, x2: bMaxX, y2: bMaxY, label: '9745', dir: 'v', offset: 800 });
}

const plan = { wallThickness: 150, walls, rooms, doors, windows, stairs: [], dimensions, titleBlock: { x: 0, y: -1600 } };
const dxf = generateFloorPlanDXF(plan, { scale: '1:100', projectName: 'UNIT PLAN C 009', sheetName: 'A-001' });

const outputRoot = path.join(process.cwd(), 'UNIT_PLAN_C009.dxf');
fs.writeFileSync(outputRoot, dxf, 'utf8');
console.log(`✅ Professional DXF generated successfully at: ${outputRoot}`);
