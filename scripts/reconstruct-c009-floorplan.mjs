import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFloorPlanDXF } from '../server/services/floorplan-dxf-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

const MM = (ft, inch = 0) => Math.round((ft * 12 + inch) * 25.4);
const rooms = [
  {
    id: 'master',
    label: 'M. BEDROOM - 01',
    size: { w: MM(10), h: MM(14, 8) },
    polygon: [[0, 0], [3048, 0], [3048, 4470], [0, 4470]]
  },
  {
    id: 'toilet-1',
    label: 'TOILET',
    size: { w: MM(5), h: MM(7, 6) },
    polygon: [[3048, 0], [4572, 0], [4572, 2286], [3048, 2286]]
  },
  {
    id: 'bedroom-03',
    label: 'BEDROOM - 03',
    size: { w: MM(11), h: MM(10) },
    polygon: [[4572, 0], [7925, 0], [7925, 3048], [4572, 3048]]
  },
  {
    id: 'living-dining',
    label: 'LIVING/DINING',
    size: { w: MM(26), h: MM(11) },
    polygon: [[0, 4470], [7874, 4470], [7874, 7823], [0, 7823]]
  },
  {
    id: 'balcony',
    label: 'BALCONY',
    size: { w: MM(5, 2), h: MM(10, 8) },
    polygon: [[7874, 4470], [9450, 4470], [9450, 7721], [7874, 7721]]
  },
  {
    id: 'utility',
    label: 'UTILITY',
    size: { w: MM(5, 11), h: MM(4, 11) },
    polygon: [[0, 7823], [1803, 7823], [1803, 9322], [0, 9322]]
  },
  {
    id: 'kitchen',
    label: 'KITCHEN',
    size: { w: MM(8), h: MM(10) },
    polygon: [[1803, 7823], [4241, 7823], [4241, 10861], [1803, 10861]]
  },
  {
    id: 'toilet-2',
    label: 'TOILET',
    size: { w: MM(4, 6), h: MM(7, 6) },
    polygon: [[4241, 7823], [5765, 7823], [5765, 10109], [4241, 10109]]
  },
  {
    id: 'bedroom-02',
    label: 'BEDROOM - 02',
    size: { w: MM(11, 10), h: MM(10) },
    polygon: [[5765, 7823], [9372, 7823], [9372, 10861], [5765, 10861]]
  }
];

const walls = [];
const wallSet = new Set();
function addWall(x1, y1, x2, y2, thickness = 230) {
  const key = [x1, y1, x2, y2].map(v => Math.round(v)).join(':');
  const rev = [x2, y2, x1, y1].map(v => Math.round(v)).join(':');
  if (wallSet.has(key) || wallSet.has(rev)) return;
  wallSet.add(key);
  walls.push({ x1, y1, x2, y2, thicknessMm: thickness });
}

for (const room of rooms) {
  const pts = room.polygon;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    addWall(a[0], a[1], b[0], b[1], 230);
  }
}

const openings = [
  { type: 'door', x: 0, y: 5200, widthMm: 900, direction: 'right' },
  { type: 'door', x: 1450, y: 4470, widthMm: 900, direction: 'up' },
  { type: 'door', x: 6100, y: 3048, widthMm: 900, direction: 'down' },
  { type: 'door', x: 2550, y: 7823, widthMm: 900, direction: 'up' },
  { type: 'door', x: 6410, y: 7823, widthMm: 900, direction: 'up' },
  { type: 'door', x: 4241, y: 9000, widthMm: 750, direction: 'left' },
  { type: 'door', x: 3048, y: 1700, widthMm: 750, direction: 'right' },
  { type: 'window', x1: 2650, y1: 10861, x2: 4200, y2: 10861 },
  { type: 'window', x1: 5900, y1: 10861, x2: 8450, y2: 10861 },
  { type: 'window', x1: 0, y1: 900, x2: 0, y2: 2450 },
  { type: 'window', x1: 0, y1: 8580, x2: 0, y2: 9200 },
  { type: 'window', x1: 9450, y1: 5200, x2: 9450, y2: 7000 },
];

const dimensions = [
  { x1: 0, y1: 0, x2: 3048, y2: 0, label: '3048', dir: 'h', offset: -400 },
  { x1: 3048, y1: 0, x2: 4572, y2: 0, label: '1524', dir: 'h', offset: -400 },
  { x1: 4572, y1: 0, x2: 7925, y2: 0, label: '3353', dir: 'h', offset: -400 },
  { x1: 7925, y1: 0, x2: 9450, y2: 0, label: '1525', dir: 'h', offset: -400 },
  { x1: 0, y1: 0, x2: 9450, y2: 0, label: '9450', dir: 'h', offset: -900 },

  { x1: 0, y1: 4470, x2: 7874, y2: 4470, label: '7874', dir: 'h', offset: 400 },
  { x1: 0, y1: 7823, x2: 9450, y2: 7823, label: '9450', dir: 'h', offset: 400 },
  { x1: 1803, y1: 7823, x2: 4241, y2: 7823, label: '2438', dir: 'h', offset: 800 },
  { x1: 4241, y1: 7823, x2: 5765, y2: 7823, label: '1524', dir: 'h', offset: 800 },
  { x1: 5765, y1: 7823, x2: 9372, y2: 7823, label: '3607', dir: 'h', offset: 800 },

  { x1: 0, y1: 0, x2: 0, y2: 4470, label: '4470', dir: 'v', offset: -400 },
  { x1: 0, y1: 4470, x2: 0, y2: 7823, label: '3353', dir: 'v', offset: -400 },
  { x1: 0, y1: 7823, x2: 0, y2: 9322, label: '1499', dir: 'v', offset: -400 },
  { x1: 0, y1: 0, x2: 0, y2: 10861, label: '10861', dir: 'v', offset: -900 },

  { x1: 9450, y1: 4470, x2: 9450, y2: 7721, label: '3251', dir: 'v', offset: 400 },
  { x1: 9450, y1: 7823, x2: 9450, y2: 10861, label: '3038', dir: 'v', offset: 800 },
];

const plan = {
  wallThickness: 230,
  walls,
  rooms: rooms.map(room => ({
    label: room.label,
    polygon: room.polygon.map(([x, y]) => ({ x, y })),
    cx: room.polygon.reduce((sum, p) => sum + p[0], 0) / room.polygon.length,
    cy: room.polygon.reduce((sum, p) => sum + p[1], 0) / room.polygon.length,
    x: Math.min(...room.polygon.map(p => p[0])),
    y: Math.min(...room.polygon.map(p => p[1])),
    w: room.size.w,
    h: room.size.h,
    areaText: `${room.size.w} x ${room.size.h} mm`
  })),
  doors: openings.filter(o => o.type === 'door').map(o => ({
    hx: o.x,
    hy: o.y,
    width: o.widthMm,
    direction: o.direction
  })),
  windows: openings.filter(o => o.type === 'window').map(o => ({
    x1: o.x1,
    y1: o.y1,
    x2: o.x2,
    y2: o.y2
  })),
  stairs: [],
  dimensions,
  titleBlock: { x: 0, y: -1800 },
  northArrow: { x: 5200, y: -1200 }
};

const dxf = generateFloorPlanDXF(plan, {
  scale: '1:100',
  projectName: 'RECONSTRUCTED FLOOR PLAN C009',
  sheetName: 'A-001'
});

const outputs = [
  path.join(root, 'ground-floor-plan-reconstructed.dxf'),
  path.join(root, 'storage', 'uploads', 'reconstructed-c009-floorplan.dxf')
];

for (const output of outputs) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, dxf, 'utf8');
}

const notes = `# C009 Floor Plan Reconstruction

Source: hand-marked unit plan image uploaded by the user.

Measured labels used:
- Living/Dining: 26'0" x 11'0" = 7874 x 3353 mm
- Master Bedroom 01: 10'0" x 14'8" = 3048 x 4470 mm
- Bedroom 02: 11'10" x 10'0" = 3607 x 3048 mm
- Bedroom 03: 11'0" x 10'0" = 3353 x 3048 mm
- Kitchen: 8'0" x 10'0" = 2438 x 3048 mm
- Utility: 5'11" x 4'11" = 1803 x 1499 mm
- Toilet 1: 5'0" x 7'6" = 1524 x 2286 mm
- Toilet 2: 4'6" x 7'6" = 1372 x 2286 mm
- Balcony: 5'2" x 10'8" = 1575 x 3251 mm

Assumptions:
- The handwritten perimeter offsets on the photograph are partially obscured.
- Openings are reconstructed from room adjacency and the visible door/window marks.
- This is a clean geometry-led reconstruction, not a survey-certified as-built drawing.
`;

fs.writeFileSync(path.join(root, 'docs', 'C009_FLOORPLAN_RECONSTRUCTION.md'), notes, 'utf8');

console.log(`Generated:\n- ${outputs[0]}\n- ${outputs[1]}\n- ${path.join(root, 'docs', 'C009_FLOORPLAN_RECONSTRUCTION.md')}`);
