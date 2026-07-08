import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const PROJECT_ID = 'proj-nambia-25bhk';

const ROOMS = [
  { name: "Children's Bedroom", type: 'bedroom', x: 0, y: 0, w: 2900, h: 3350 },
  { name: 'Toilet Top', type: 'toilet', x: 2900, y: 0, w: 1116, h: 2133 },
  { name: 'Home Office', type: 'office', x: 4016, y: 0, w: 2643, h: 2096 },
  { name: 'Balcony', type: 'balcony', x: 0, y: 3350, w: 600, h: 187 },
  { name: 'Living Dining', type: 'living', x: 600, y: 3350, w: 2549, h: 2842 },
  { name: 'Master Bedroom', type: 'bedroom', x: 0, y: 3537, w: 3005, h: 3350 },
  { name: 'Toilet Bottom', type: 'toilet', x: 3005, y: 3537, w: 2246, h: 1081 },
  { name: 'Kitchen', type: 'kitchen', x: 3005, y: 4618, w: 2692, h: 2022 },
];

const OPENINGS = [
  { room: "Living Dining", offsetMm: 1400, widthMm: 900, type: 'door', sillMm: 0, headMm: 2100 },
  { room: "Living Dining", offsetMm: 3200, widthMm: 1800, type: 'window', sillMm: 900, headMm: 2100 },
  { room: "Master Bedroom", offsetMm: 600, widthMm: 1200, type: 'window', sillMm: 900, headMm: 2100 },
  { room: "Kitchen", offsetMm: 0, widthMm: 900, type: 'door', sillMm: 0, headMm: 2100 },
  { room: "Children's Bedroom", offsetMm: 500, widthMm: 1200, type: 'window', sillMm: 900, headMm: 2100 },
];

const CABINETS = [
  { room: 'Living Dining', id:'cab_living', name:'LIVING CABINET', widthMm: 2400, heightMm: 2400, xOffsetMm: 1200, zOffsetMm: 0 },
  { room: 'Kitchen', id:'cab_kitchen_base', name:'KITCHEN BASE', widthMm: 2000, heightMm: 720, xOffsetMm: 0, zOffsetMm: 0 },
  { room: 'Master Bedroom', id:'cab_master', name:'WARDROBE', widthMm: 1800, heightMm: 2400, xOffsetMm: 300, zOffsetMm: 0 },
];

function normalize(p) { return p.replace(/[^a-zA-Z0-9]+/g, '_'); }

function makeRooms() {
  const map = {};
  for (const r of ROOMS) {
    map[r.name] = { ...r, openings: [], cabinets: [] };
  }
  for (const o of OPENINGS) {
    const target = map[o.room];
    if (!target) continue;
    target.openings = target.openings || [];
    target.openings.push({ offsetMm: o.offsetMm, widthMm: o.widthMm, sillMm: o.sillMm, headMm: o.headMm, type: o.type });
  }
  for (const c of CABINETS) {
    const target = map[c.room];
    if (!target) continue;
    target.cabinets = target.cabinets || [];
    target.cabinets.push({ ...c });
  }
  return Object.values(map);
}

async function main() {
  const pipeline = await import(pathToFileURL(path.join(projectRoot, 'server/services/pipeline-orchestrator.js')).href);
  const rooms = makeRooms();
  const projectName = 'Nambia';
  const result = await pipeline.runPipeline({ projectId: PROJECT_ID, rooms, projectName });
  console.log(JSON.stringify({
    ok: true,
    images: result.images.length,
    dxfs: result.dxfs.length,
    pdfs: result.pdfs.length,
    skp: result.skpFiles.length,
    outDir: result.outDir
  }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
