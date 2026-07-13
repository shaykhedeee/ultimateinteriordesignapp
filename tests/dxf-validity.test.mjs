// DXF generation validity + round-trip tests (ESM).
// Proves: (1) elevation DXF is structurally valid R2010, (2) floor-plan DXF is
// structurally valid R2010, (3) a sample architect DXF auto-traces to walls,
// (4) the validator rejects malformed DXF.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const load = (p) => import(pathToFileURL(path.join(REPO, p)).href);
const { buildElevationDXF, buildFloorPlanDXF } = await load('server/services/dxf-writer.js');
const { traceDxf } = await load('server/services/dxf-trace.js');
const { validateDxf } = await load('server/services/dxf-validate.js');

function elevationModel() {
  return {
    projectId: 'test', wallName: 'WALL A', lengthMm: 3000, heightMm: 2400, thicknessMm: 75,
    openings: [
      { type: 'door', offsetMm: 300, widthMm: 900, sillMm: 0, headMm: 2100 },
      { type: 'window', offsetMm: 1500, widthMm: 1200, sillMm: 900, headMm: 1800 },
    ],
    cabinets: [
      { type: 'base', tag: 'SHUTTER', widthMm: 600, heightMm: 720, depthMm: 560, xOffsetMm: 0, zOffsetMm: 110, material: { twoTone: true }, handleType: 'pull' },
      { type: 'tall', tag: 'SHUTTER', widthMm: 450, heightMm: 2290, depthMm: 560, xOffsetMm: 700, zOffsetMm: 0, material: { fluted: true }, handleType: 'pull' },
      { type: 'open', tag: 'OPEN UNIT', widthMm: 900, heightMm: 400, xOffsetMm: 1300, zOffsetMm: 1500, material: { openShelf: true }, handleType: 'none' },
    ],
    coverage: { utilizationPct: 82, usedMm: 2460, freeMm: 540 },
  };
}

test('elevation DXF is structurally valid R2010', () => {
  const dxf = buildElevationDXF(elevationModel(), { scale: '1:25', rev: '1.0', projectId: 'test', sheet: 'WALL A' });
  assert.ok(dxf && dxf.includes('SECTION'), 'produced non-empty DXF');
  const v = validateDxf(dxf);
  assert.ok(v.valid, 'elevation DXF invalid: ' + JSON.stringify(v.errors));
  assert.ok(v.stats.sections.includes('ENTITIES'), 'has ENTITIES section');
  assert.ok((v.stats.entityCounts.LINE || 0) > 10, 'contains line entities');
  console.log('  elevation DXF OK — entities:', JSON.stringify(v.stats.entityCounts));
});

test('floor-plan DXF is structurally valid R2010 (true-mm)', () => {
  const walls = [
    { id: 'w1', x1: 0, y1: 0, x2: 4000, y2: 0, thicknessMm: 230 },
    { id: 'w2', x1: 4000, y1: 0, x2: 4000, y2: 3000, thicknessMm: 230 },
    { id: 'w3', x1: 4000, y1: 3000, x2: 0, y2: 3000, thicknessMm: 230 },
    { id: 'w4', x1: 0, y1: 3000, x2: 0, y2: 0, thicknessMm: 230 },
  ];
  const openings = [{ wallId: 'w1', offsetFromStartMm: 1500, widthMm: 900, type: 'door' }];
  const rooms = [{ name: 'Living', bounds: [0, 0, 4000, 3000] }];
  const dxf = buildFloorPlanDXF({ walls, openings, rooms, furniture: [], pixelsPerMeter: 1000, projectId: 'test', scale: '1:50', rev: '1.0', sheet: 'FLOOR PLAN' });
  const v = validateDxf(dxf);
  assert.ok(v.valid, 'floorplan DXF invalid: ' + JSON.stringify(v.errors));
  assert.ok((v.stats.entityCounts.LWPOLYLINE || 0) >= 4, 'walls emitted as polylines');
  console.log('  floorplan DXF OK — entities:', JSON.stringify(v.stats.entityCounts));
});

test('auto-trace parses LINE + LWPOLYLINE + classic POLYLINE/VERTEX into true-mm walls', () => {
  const sample = [
    '0', 'SECTION', '2', 'HEADER',
    '9', '$INSUNITS', '70', '2',
    '9', '$MEASUREMENT', '70', '1',
    '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', '0', 'ENDTAB', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES',
    '0', 'LINE', '8', 'WALL', '10', '0.0', '20', '0.0', '11', '4000.0', '21', '0.0',
    '0', 'LWPOLYLINE', '8', 'WALL', '90', '4', '70', '1', '10', '0.0', '20', '0.0', '10', '4000.0', '20', '3000.0', '10', '4000.0', '20', '3000.0', '10', '0.0', '20', '0.0',
    '0', 'POLYLINE', '8', 'WALL', '70', '1',
    '0', 'VERTEX', '8', 'WALL', '10', '0.0', '20', '3000.0',
    '0', 'VERTEX', '8', 'WALL', '10', '0.0', '20', '0.0',
    '0', 'VERTEX', '8', 'WALL', '10', '2000.0', '20', '1500.0',
    '0', 'SEQEND',
    '0', 'ENDSEC',
    '0', 'SECTION', '2', 'OBJECTS', '0', 'ENDSEC',
    '0', 'EOF',
  ].join('\n');
  const traced = traceDxf({ text: sample });
  assert.ok(traced.success, 'trace reported failure');
  assert.ok(traced.walls.length >= 5, 'expected >=5 wall segments, got ' + traced.walls.length);
  const longWall = traced.walls.find(w => Math.abs(w.x2 - w.x1) > 3900);
  assert.ok(longWall, 'expected a ~4000mm wall segment');
  console.log(`  trace OK — ${traced.walls.length} walls, unit=${traced.unit}, mmPerUnit=${traced.mmPerUnit}`);
});

test('validator rejects malformed DXF', () => {
  const bad = '0\nLINE\n8\n0\n10\n0.0\n';
  const v = validateDxf(bad);
  assert.ok(!v.valid, 'validator should flag malformed DXF');
  assert.ok(v.errors.length > 0, 'errors should be reported');
});
