/**
 * tests/dxf-autocad-validity.test.js
 * ---------------------------------------------------------------------------
 * THE critical regression: DXF files produced by the app MUST open in AutoCAD.
 * We validate with ezdxf (a strict, real-world DXF parser) — readfile must
 * succeed AND a roundtrip save/re-read must succeed. The previous writer
 * omitted the AcDbEntity / AcDbPolyline subclass markers, which made the file
 * unopenable in AutoCAD; this test locks that out forever.
 *
 * Requires python ezdxf:  pip install ezdxf
 * Runs the generator scripts and validates their output files.
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

function ezdxfValidate(file) {
  const script = `
import ezdxf, sys
try:
    doc = ezdxf.readfile(${JSON.stringify(file)})
    n = sum(1 for _ in doc.modelspace())
    rt = ${JSON.stringify(file + '.rt')}
    doc.saveas(rt)
    ezdxf.readfile(rt)
    print("OK", n)
except Exception as e:
    print("FAIL", repr(e)[:200])
    sys.exit(1)
`;
  const out = execFileSync('python3', ['-c', script], { encoding: 'utf8' });
  return out.trim();
}

test('kitchen-pantry DXF opens + roundtrips in AutoCAD (ezdxf)', { skip: !hasEzdxf() }, () => {
  execFileSync('node', ['scripts/generate-kitchen-pantry-elevation.mjs'], { cwd: ROOT });
  const f = path.join(ELEV, 'kitchen-pantry-elevation.dxf');
  assert.ok(fs.existsSync(f), 'dxf generated');
  const res = ezdxfValidate(f);
  assert.ok(res.startsWith('OK'), 'AutoCAD-valid: ' + res);
  const n = parseInt(res.split(' ')[1], 10);
  assert.ok(n > 100, 'has real geometry: ' + n + ' entities');
});

test('jali-panel DXF opens + roundtrips in AutoCAD (ezdxf)', { skip: !hasEzdxf() }, async () => {
  const mod = await import('../server/services/jali-panel.js');
  const dxf = mod.buildJaliPanelDXF({ widthMm: 600, heightMm: 2000, name: 'Wardrobe Jali' });
  const f = path.join(ELEV, 'jali-validity.dxf');
  fs.writeFileSync(f, dxf);
  const res = ezdxfValidate(f);
  assert.ok(res.startsWith('OK'), 'AutoCAD-valid: ' + res);
});

test('every unit from-renders emits a valid DXF (ezdxf roundtrip)', { skip: !hasEzdxf() }, async () => {
  const decode = await import('../server/services/render-elevation-decode.js');
  const writer = await import('../server/services/dxf-writer.js');
  const { getAllDecodedModels } = decode;
  const { buildElevationDXF } = writer;
  for (const [name, model] of Object.entries(getAllDecodedModels())) {
    const dxf = buildElevationDXF(model, { scale: '1:25' });
    const f = path.join(ELEV, `validity-${name}.dxf`);
    fs.writeFileSync(f, dxf);
    const res = ezdxfValidate(f);
    assert.ok(res.startsWith('OK'), `${name} must be AutoCAD-valid: ${res}`);
  }
});

function hasEzdxf() {
  try {
    execFileSync('python3', ['-c', 'import ezdxf'], { encoding: 'utf8', stdio: 'ignore' });
    return true;
  } catch { return false; }
}
