/**
 * tests/shoe-rack.test.js
 * Parametric shoe-rack / entry cabinet: photo-accurate, standard dims,
 * AutoCAD-valid DXF + detailed PDF + live route.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const ELEV = path.join(ROOT, 'storage', 'elevations');

function hasEzdxf() {
  try { execFileSync('python3', ['-c', "import ezdxf"], { stdio: 'ignore' }); return true; }
  catch { return false; }
}
function ezdxfValidate(f) {
  return execFileSync('python3', [
    '-c',
    `import ezdxf,sys; d=ezdxf.readfile(sys.argv[1]); n=sum(1 for _ in d.modelspace()); d.saveas(sys.argv[1]+'.rt'); ezdxf.readfile(sys.argv[1]+'.rt'); print('OK',n)`,
    f,
  ], { encoding: 'utf8' }).trim();
}

test('buildShoeRackDXF produces a valid, AutoCAD-openable DXF', { skip: !hasEzdxf() }, async () => {
  const { buildShoeRackDXF } = await import('../server/services/shoe-rack.js');
  const dxf = buildShoeRackDXF({ tallWidth: 1200, benchWidth: 900, totalHeight: 2000, benchHeight: 450, depth: 400 });
  const f = path.join(ELEV, 'shoe-rack-validity.dxf');
  fs.writeFileSync(f, dxf);
  const res = ezdxfValidate(f);
  assert.ok(res.startsWith('OK'), 'AutoCAD-valid: ' + res);
});

test('shoe-rack is fully parametric (defaults + custom dims)', async () => {
  const { SHOE_RACK_DEFAULTS, shoeRackModel } = await import('../server/services/shoe-rack.js');
  const m = shoeRackModel({ tallWidth: 1000, benchWidth: 800, totalHeight: 2200, benchHeight: 500, depth: 350, shoeShelves: 4 });
  assert.equal(m.lengthMm, 1800);
  assert.equal(m.heightMm, 2200);
  assert.ok(m.cabinets.some(c => c.tag === 'SHUTTER'), 'has upper cupboard doors');
  assert.ok(m.cabinets.filter(c => c.tag === 'OPEN').length >= 5, 'has open shoe shelves');
  assert.ok(m.cabinets.some(c => c.tag === 'DRAWER'), 'has bench drawer');
  // defaults present
  assert.equal(SHOE_RACK_DEFAULTS.handleStyle, 'bar');
  assert.equal(SHOE_RACK_DEFAULTS.led, true);
});

test('live POST /api/projects/:id/elevations/shoe-rack returns valid DXF+PDF', async () => {
  const base = 'http://127.0.0.1:5055';
  const create = await fetch(`${base}/api/projects`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Shoe Rack Test' }),
  });
  const pid = (await create.json()).id;
  const res = await fetch(`${base}/api/projects/${pid}/elevations/shoe-rack`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tallWidth: 1200, benchWidth: 900, totalHeight: 2000, benchHeight: 450, depth: 400, shoeShelves: 3 }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.success);
  const dxfPath = path.join(ROOT, body.dxf);
  const pdfPath = path.join(ROOT, body.pdf);
  assert.ok(fs.existsSync(dxfPath), 'dxf written');
  assert.ok(fs.existsSync(pdfPath), 'pdf written');
  if (hasEzdxf()) {
    const r = ezdxfValidate(dxfPath);
    assert.ok(r.startsWith('OK'), 'dxf AutoCAD-valid: ' + r);
  }
  await fetch(`${base}/api/projects/${pid}`, { method: 'DELETE' });
});
