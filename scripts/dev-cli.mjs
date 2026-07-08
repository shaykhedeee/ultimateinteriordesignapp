import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DELIVERABLE_DIR = path.join(projectRoot, '_deliverables', 'nambia-pipeline');
const PROJECT_ID = 'proj-nambia-25bhk';

const ROOMS = [
  { id: 'r1', name: "Children's Bedroom", type: 'bedroom', xMm: 0, yMm: 0, wMm: 2900, hMm: 3350 },
  { id: 'r2', name: 'Toilet Top', type: 'toilet', xMm: 2900, yMm: 0, wMm: 1116, hMm: 2133 },
  { id: 'r3', name: 'Home Office', type: 'office', xMm: 4016, yMm: 0, wMm: 2643, hMm: 2096 },
  { id: 'r4', name: 'Balcony', type: 'balcony', xMm: 0, yMm: 3350, wMm: 600, hMm: 187 },
  { id: 'r5', name: 'Living Dining', type: 'living', xMm: 600, yMm: 3350, wMm: 2549, hMm: 2842 },
  { id: 'r6', name: 'Master Bedroom', type: 'bedroom', xMm: 0, yMm: 3537, wMm: 3005, hMm: 3350 },
  { id: 'r7', name: 'Toilet Bottom', type: 'toilet', xMm: 3005, yMm: 3537, wMm: 2246, hMm: 1081 },
  { id: 'r8', name: 'Kitchen', type: 'kitchen', xMm: 3005, yMm: 4618, wMm: 2692, hMm: 2022 },
];

const WALLS = [
  { id: 'w_north', dir: 'north', x1Mm: 0, y1Mm: 0, x2Mm: 6659, y2Mm: 0, thicknessMm: 200 },
  { id: 'w_east', dir: 'east', x1Mm: 6659, y1Mm: 0, x2Mm: 6659, y2Mm: 7000, thicknessMm: 200 },
  { id: 'w_south', dir: 'south', x1Mm: 6659, y1Mm: 7000, x2Mm: 0, y2Mm: 7000, thicknessMm: 200 },
  { id: 'w_west', dir: 'west', x1Mm: 0, y1Mm: 7000, x2Mm: 0, y2Mm: 0, thicknessMm: 200 },
  { id: 'w1', dir: 'internal', x1Mm: 2900, y1Mm: 0, x2Mm: 2900, y2Mm: 2133 },
  { id: 'w2', dir: 'internal', x1Mm: 2900, y1Mm: 2133, x2Mm: 0, y2Mm: 2133 },
  { id: 'w3', dir: 'internal', x1Mm: 0, y1Mm: 3350, x2Mm: 600, y2Mm: 3350 },
  { id: 'w4', dir: 'internal', x1Mm: 600, y1Mm: 3350, x2Mm: 600, y2Mm: 7000 },
  { id: 'w5', dir: 'internal', x1Mm: 600, y1Mm: 6192, x2Mm: 6659, y2Mm: 6192 },
  { id: 'w6', dir: 'internal', x1Mm: 3005, y1Mm: 3537, x2Mm: 3005, y2Mm: 4618 },
  { id: 'w7', dir: 'internal', x1Mm: 3005, y1Mm: 4618, x2Mm: 3005, y2Mm: 6640 },
  { id: 'w8', dir: 'internal', x1Mm: 4016, y1Mm: 2096, x2Mm: 6659, y2Mm: 2096 },
];

const OPENINGS = [
  { id: 'd1', wallId: 'w_north', type: 'door', xMm: 1400, widthMm: 900, sillMm: 0, headMm: 2100 },
  { id: 'd2', wallId: 'w1', type: 'door', xMm: 400, widthMm: 900, sillMm: 0, headMm: 2100 },
  { id: 'd3', wallId: 'w3', type: 'door', xMm: 280, widthMm: 900, sillMm: 0, headMm: 2100 },
  { id: 'w1o', wallId: 'w_north', type: 'window', xMm: 3200, widthMm: 1800, sillMm: 900, headMm: 2100 },
  { id: 'w2o', wallId: 'w2', type: 'window', xMm: 1600, widthMm: 1200, sillMm: 900, headMm: 2100 },
];

async function loadWriters() {
  let writer = null;
  let pdfElevation = null;
  try {
    const wm = await import(pathToFileURL(path.join(projectRoot, 'server', 'services', 'dxf-writer.js')).href);
    writer = wm;
  } catch (e) {
    console.warn('dxf-writer import failed:', e.message);
  }
  try {
    const pm = await import(pathToFileURL(path.join(projectRoot, 'server', 'services', 'pdf-elevation.js')).href);
    pdfElevation = pm;
  } catch (e) {
    console.warn('pdf-elevation import failed:', e.message);
  }
  console.log('Loaded writers:', !!writer?.buildElevationDXF, !!pdfElevation?.renderElevationPDF);
  return { writer, pdfElevation };
}

function buildManifest(name, extra = {}) {
  const files = fs.readdirSync(DELIVERABLE_DIR)
    .filter(f => fs.statSync(path.join(DELIVERABLE_DIR, f)).isFile())
    .map(f => ({ file: f, bytes: fs.statSync(path.join(DELIVERABLE_DIR, f)).size }));
  return { name, generatedAt: new Date().toISOString(), projectId: PROJECT_ID, files, ...extra };
}

async function writeRoomModels({ writer }) {
  for (const r of ROOMS) {
    const roomModel = {
      room: { id: r.id, name: r.name, type: r.type, widthMm: r.wMm, heightMm: r.hMm, xMm: r.xMm, yMm: r.yMm },
      builtIn: [
        { type: 'wardrobe', widthMm: 800, heightMm: 2400, depthMm: 600, xOffsetMm: 0, yOffsetMm: 0 },
        { type: 'bed', widthMm: Math.min(r.wMm, 2000), heightMm: 1800, depthMm: 2000, xOffsetMm: 100, yOffsetMm: 100 },
      ],
    };
    fs.writeFileSync(path.join(DELIVERABLE_DIR, `${r.name.replace(/\s+/g, '_')}_3D.json`), JSON.stringify(roomModel, null, 2));
    if (!writer?.buildElevationDXF) continue;

    const model = { lengthMm: r.wMm, heightMm: r.hMm, thicknessMm: 75, openings: [], cabinets: [], coverage: { utilPercent: 60, usedMm: Math.floor(r.wMm * 0.6), freeMm: Math.floor(r.wMm * 0.4) } };
    const out = path.join(DELIVERABLE_DIR, `${r.name.replace(/\s+/g, '_')}_3D.dxf`);
    fs.writeFileSync(out, writer.buildElevationDXF(model, { componentLayers: { useGlassLayers: true, useCaneLayers: true, useHandleLayers: true, useFrameLayers: true }, scale: '1:50', rev: '1.0', projectId: PROJECT_ID, sheet: r.name }));
  }
}

async function writeElevations({ writer, pdfElevation }) {
  for (const dir of ['north', 'south', 'east', 'west']) {
    const wall = WALLS.find(w => w.dir === dir) || WALLS[0];
    const openings = OPENINGS.filter(o => o.wallId === wall.id).map(o => ({ offsetMm: o.xMm, widthMm: o.widthMm, sillMm: o.sillMm, headMm: o.headMm, type: o.type }));
    const length = Math.round(Math.hypot(wall.x2Mm - wall.x1Mm, wall.y2Mm - wall.y1Mm));
    const model = { lengthMm: length, heightMm: 2700, thicknessMm: 200, openings, cabinets: [], coverage: { utilPercent: 50, usedMm: 1200, freeMm: length - 1200 } };
    fs.writeFileSync(path.join(DELIVERABLE_DIR, `Nambia_${dir.toUpperCase()}_Elevation.json`), JSON.stringify(model, null, 2));

    if (writer?.buildElevationDXF) {
      fs.writeFileSync(path.join(DELIVERABLE_DIR, `Nambia_${dir.toUpperCase()}_Elevation.dxf`),
        writer.buildElevationDXF(model, { componentLayers: { useGlassLayers: true, useCaneLayers: true, useHandleLayers: true, useFrameLayers: true }, scale: '1:25', rev: '1.0', projectId: PROJECT_ID, sheet: 'Nambia ' + dir.toUpperCase() + ' Elevation' })
      );
    }
    if (pdfElevation?.renderElevationPDF) {
      const maybePdf = pdfElevation.renderElevationPDF(model, { scale: '1:25', rev: '1.0', projectId: PROJECT_ID, sheetName: 'Nambia ' + dir.toUpperCase() + ' Elevation', lengthMm: model.lengthMm, heightMm: model.heightMm });
      const pdfBuffer = typeof maybePdf?.then === 'function' ? await maybePdf : maybePdf;
      fs.writeFileSync(path.join(DELIVERABLE_DIR, `Nambia_${dir.toUpperCase()}_Elevation.pdf`), pdfBuffer);
    }
  }
}

async function main() {
  fs.mkdirSync(DELIVERABLE_DIR, { recursive: true });
  const { writer, pdfElevation } = await loadWriters();
  await writeRoomModels({ writer, pdfElevation });
  await writeElevations({ writer, pdfElevation });

  fs.writeFileSync(path.join(DELIVERABLE_DIR, 'wall-model.json'), JSON.stringify({ rooms: ROOMS, walls: WALLS, openings: OPENINGS }, null, 2));
  fs.writeFileSync(path.join(DELIVERABLE_DIR, 'manifest.json'), JSON.stringify(buildManifest('nambia'), null, 2));
  console.log('Done:', DELIVERABLE_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
