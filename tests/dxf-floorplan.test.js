/**
 * tests/dxf-floorplan.test.js
 * Floor-plan DXF must open in AutoCAD (validated with ezdxf) and carry real
 * true-mm geometry from the scene graph.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { buildFloorPlanDXF } from '../server/services/dxf-writer.js';

const ELEV = path.join(process.cwd(), 'storage', 'elevations');
function hasEzdxf() { try { execFileSync('python3', ['-c', "import ezdxf"]); return true; } catch { return false; } }
function ezdxfValidate(file) {
  const script = `
import ezdxf, sys
try:
    doc = ezdxf.readfile(${JSON.stringify(file)})
    n = sum(1 for _ in doc.modelspace())
    doc.saveas(${JSON.stringify(file + '.rt')})
    ezdxf.readfile(${JSON.stringify(file + '.rt')})
    print("OK", n)
except Exception as e:
    print("FAIL", repr(e)[:200])
    sys.exit(1)
`;
  return execFileSync('python3', ['-c', script], { encoding: 'utf8' }).trim();
}

const sample = {
  walls: [
    { id: 'w1', x1: 0, y1: 0, x2: 4000, y2: 0, thicknessMm: 75, heightMm: 2700 },
    { id: 'w2', x1: 4000, y1: 0, x2: 4000, y2: 3000, thicknessMm: 75, heightMm: 2700 },
    { id: 'w3', x1: 4000, y1: 3000, x2: 0, y2: 3000, thicknessMm: 75, heightMm: 2700 },
    { id: 'w4', x1: 0, y1: 3000, x2: 0, y2: 0, thicknessMm: 75, heightMm: 2700 }
  ],
  openings: [
    { openingId: 'd1', wallId: 'w1', openingType: 'door', offsetFromStartMm: 500, widthMm: 900, sillHeightMm: 0, headHeightMm: 2100 },
    { openingId: 'win1', wallId: 'w2', openingType: 'window', offsetFromStartMm: 800, widthMm: 1500, sillHeightMm: 900, headHeightMm: 2100 }
  ],
  rooms: [
    { name: 'Living Room', bounds: [0, 0, 1, 1] }
  ],
  furniture: [],
  pixelsPerMeter: 40
};

test('buildFloorPlanDXF: valid R2010 DXF with real geometry (ezdxf)', { skip: !hasEzdxf() }, () => {
  const dxf = buildFloorPlanDXF(sample);
  assert.ok(dxf.includes('SECTION') && dxf.includes('EOF'), 'DXF envelope present');
  assert.ok(dxf.includes('AC1024'), 'R2010 header');
  assert.ok(dxf.includes('WALL_OUTLINE'), 'wall layer present');
  const f = path.join(ELEV, 'floorplan-test.dxf');
  fs.writeFileSync(f, dxf);
  const res = ezdxfValidate(f);
  assert.ok(res.startsWith('OK'), 'AutoCAD-valid: ' + res);
  const n = parseInt(res.split(' ')[1], 10);
  assert.ok(n > 10, 'has real geometry: ' + n + ' entities');
});

test('buildFloorPlanDXF: empty input still yields a valid (openable) sheet', { skip: !hasEzdxf() }, () => {
  const dxf = buildFloorPlanDXF({ walls: [], pixelsPerMeter: 40 });
  const f = path.join(ELEV, 'floorplan-empty.dxf');
  fs.writeFileSync(f, dxf);
  const res = ezdxfValidate(f);
  assert.ok(res.startsWith('OK'), 'empty-but-valid: ' + res);
});
