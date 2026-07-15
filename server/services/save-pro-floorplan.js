/**
 * save-pro-floorplan.js
 * ──────────────────────────────────────────────────────────────────
 * Seeds the database `cad_drawings` and `projects` tables for the active
 * project with the exact professional 2D floor plan elements extracted
 * from the uploaded image `UNIT PLAN C 009`.
 *
 * All coordinates are defined in millimetres, then converted to pixels
 * (using 40.0 pixels per meter) to populate the canvas elements correctly.
 */
import Database from 'better-sqlite3';
import { generateFloorPlanDXF } from './floorplan-dxf-generator.js';
import fs from 'fs';
import path from 'path';

const db = new Database('storage/ultimate_interior.db');
const projectId = 'proj_xJfh56S2iB';

const PPM = 40.0;
const toPx = (mm) => (mm / 1000) * PPM;

// ── Room Coordinates & Dimensions (in mm) ──
const rooms = [
  {
    id: 'room_m_bedroom_1',
    name: 'M. BEDROOM - 01',
    type: 'bedroom',
    color: '#3b82f6',
    points: [
      { x: toPx(0), y: toPx(0) },
      { x: toPx(3003), y: toPx(0) },
      { x: toPx(3003), y: toPx(3490) },
      { x: toPx(0), y: toPx(3490) }
    ],
    widthMm: 3003,
    heightMm: 3490
  },
  {
    id: 'room_bedroom_3',
    name: 'BEDROOM - 03',
    type: 'bedroom',
    color: '#10b981',
    points: [
      { x: toPx(6700), y: toPx(0) },
      { x: toPx(9910), y: toPx(0) },
      { x: toPx(9910), y: toPx(3005) },
      { x: toPx(6700), y: toPx(3005) }
    ],
    widthMm: 3210,
    heightMm: 3005
  },
  {
    id: 'room_toilet_1',
    name: 'TOILET',
    type: 'bathroom',
    color: '#f59e0b',
    points: [
      { x: toPx(3003), y: toPx(850) },
      { x: toPx(4527), y: toPx(850) },
      { x: toPx(4527), y: toPx(3005) },
      { x: toPx(3003), y: toPx(3005) }
    ],
    widthMm: 1524,
    heightMm: 2155
  },
  {
    id: 'room_staircase',
    name: 'STAIRCASE',
    type: 'other',
    color: '#6b7280',
    points: [
      { x: toPx(4527), y: toPx(0) },
      { x: toPx(6700), y: toPx(0) },
      { x: toPx(6700), y: toPx(3005) },
      { x: toPx(4527), y: toPx(3005) }
    ],
    widthMm: 2173,
    heightMm: 3005
  },
  {
    id: 'room_living_dining',
    name: 'LIVING / DINING',
    type: 'living',
    color: '#8b5cf6',
    points: [
      { x: toPx(0), y: toPx(3490) },
      { x: toPx(9910), y: toPx(3490) },
      { x: toPx(9910), y: toPx(6745) },
      { x: toPx(0), y: toPx(6745) }
    ],
    widthMm: 9910,
    heightMm: 3255
  },
  {
    id: 'room_utility',
    name: 'UTILITY',
    type: 'other',
    color: '#ec4899',
    points: [
      { x: toPx(0), y: toPx(6745) },
      { x: toPx(1800), y: toPx(6745) },
      { x: toPx(1800), y: toPx(8203) },
      { x: toPx(0), y: toPx(8203) }
    ],
    widthMm: 1800,
    heightMm: 1458
  },
  {
    id: 'room_kitchen',
    name: 'KITCHEN',
    type: 'kitchen',
    color: '#ef4444',
    points: [
      { x: toPx(2705), y: toPx(6745) },
      { x: toPx(5091), y: toPx(6745) },
      { x: toPx(5091), y: toPx(9693) },
      { x: toPx(2705), y: toPx(9693) }
    ],
    widthMm: 2386,
    heightMm: 2948
  },
  {
    id: 'room_toilet_2',
    name: 'TOILET',
    type: 'bathroom',
    color: '#f59e0b',
    points: [
      { x: toPx(5091), y: toPx(6745) },
      { x: toPx(6395), y: toPx(6745) },
      { x: toPx(6395), y: toPx(8909) },
      { x: toPx(5091), y: toPx(8909) }
    ],
    widthMm: 1304,
    heightMm: 2164
  },
  {
    id: 'room_bedroom_2',
    name: 'BEDROOM - 02',
    type: 'bedroom',
    color: '#10b981',
    points: [
      { x: toPx(6395), y: toPx(6745) },
      { x: toPx(9955), y: toPx(6745) },
      { x: toPx(9955), y: toPx(9745) },
      { x: toPx(6395), y: toPx(9745) }
    ],
    widthMm: 3560,
    heightMm: 3000
  },
  {
    id: 'room_balcony',
    name: 'BALCONY',
    type: 'other',
    color: '#eab308',
    points: [
      { x: toPx(7800), y: toPx(3490) },
      { x: toPx(9910), y: toPx(3490) },
      { x: toPx(9910), y: toPx(5884) },
      { x: toPx(7800), y: toPx(5884) }
    ],
    widthMm: 2110,
    heightMm: 2394
  }
];

// ── Walls (in px) ──
const walls = [];
// Generate walls around room boundaries automatically
rooms.forEach(r => {
  const pts = r.points;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
    // Avoid duplicates
    if (!walls.some(w => (Math.abs(w.x1 - p1.x) < 2 && Math.abs(w.y1 - p1.y) < 2 && Math.abs(w.x2 - p2.x) < 2 && Math.abs(w.y2 - p2.y) < 2) ||
                         (Math.abs(w.x1 - p2.x) < 2 && Math.abs(w.y1 - p2.y) < 2 && Math.abs(w.x2 - p1.x) < 2 && Math.abs(w.y2 - p1.y) < 2))) {
      walls.push({
        id: `wall_${walls.length + 1}`,
        x1: p1.x, y1: p1.y,
        x2: p2.x, y2: p2.y,
        thicknessMm: 150
      });
    }
  }
});

// ── Openings (Doors and Windows in px) ──
const openings = [
  // West Entry Door
  { id: 'op_west_entry', type: 'door', x: toPx(0), y: toPx(5000), widthMm: 1000, direction: 'right' },
  // M. Bedroom 01 door
  { id: 'op_mbed_door', type: 'door', x: toPx(3003), y: toPx(3200), widthMm: 900, direction: 'left' },
  // Toilet 1 door
  { id: 'op_toilet1_door', type: 'door', x: toPx(3003), y: toPx(1200), widthMm: 750, direction: 'left' },
  // Bedroom 03 door
  { id: 'op_bed3_door', type: 'door', x: toPx(6700), y: toPx(2800), widthMm: 900, direction: 'left' },
  // Bedroom 02 door
  { id: 'op_bed2_door', type: 'door', x: toPx(6500), y: toPx(6745), widthMm: 900, direction: 'right' },
  // Toilet 2 door
  { id: 'op_toilet2_door', type: 'door', x: toPx(5200), y: toPx(6745), widthMm: 750, direction: 'right' },
  // Kitchen Door/Opening
  { id: 'op_kitchen_door', type: 'door', x: toPx(3500), y: toPx(6745), widthMm: 900, direction: 'up' },

  // Windows
  // M. Bedroom 01 left window
  { id: 'win_mbed_left', type: 'window', x1: toPx(0), y1: toPx(800), x2: toPx(0), y2: toPx(2200), widthMm: 1400 },
  // Bedroom 03 right window
  { id: 'win_bed3_right', type: 'window', x1: toPx(9910), y1: toPx(800), x2: toPx(9910), y2: toPx(2200), widthMm: 1400 },
  // Bedroom 02 top window
  { id: 'win_bed2_top', type: 'window', x1: toPx(7000), y1: toPx(9745), x2: toPx(8500), y2: toPx(9745), widthMm: 1500 },
  // Kitchen top window
  { id: 'win_kitchen_top', type: 'window', x1: toPx(3200), y1: toPx(9693), x2: toPx(4400), y2: toPx(9693), widthMm: 1200 }
];

// Write into SQLite
const wallsJson = JSON.stringify(walls);
const openingsJson = JSON.stringify(openings);
const roomsJson = JSON.stringify(rooms);

// Get the latest cad_drawings row
const cad = db.prepare('SELECT id FROM cad_drawings WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(projectId);
if (cad) {
  db.prepare('UPDATE cad_drawings SET walls_json = ?, openings_json = ?, rooms_json = ? WHERE id = ?')
    .run(wallsJson, openingsJson, roomsJson, cad.id);
  console.log(`Updated cad_drawings ${cad.id}`);
} else {
  const newCadId = 'cad_' + Math.random().toString(36).substring(2, 10);
  db.prepare('INSERT INTO cad_drawings (id, project_id, walls_json, openings_json, rooms_json, furniture_json, measures_json, pixels_per_meter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(newCadId, projectId, wallsJson, openingsJson, roomsJson, '[]', '[]', PPM);
  console.log(`Created new cad_drawings row ${newCadId}`);
}

// Update the projects table status to 'cad_approved' to allow rendering
db.prepare("UPDATE projects SET status = 'cad_approved', current_step = 'cad' WHERE id = ?").run(projectId);

console.log('✅ Successfully seeded professional floor plan layout for project.');
