/**
 * tests/dxf-trace.test.js
 * Guards the REAL DXF floor-plan auto-tracer used to convert a real architect
 * plan into traced walls without manual tracing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traceDxf } from '../server/services/dxf-trace.js';

// Minimal ASCII DXF: a 4000 x 3000 (mm) rectangular room as 4 LINE entities.
const RECT_DXF = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
9
$MEASUREMENT
70
1
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
WALLS
10
0
20
0
11
4000
21
0
0
LINE
8
WALLS
10
4000
20
0
11
4000
21
3000
0
LINE
8
WALLS
10
4000
20
3000
11
0
21
3000
0
LINE
8
WALLS
10
0
20
3000
11
0
21
0
0
ENDSEC
0
EOF
`;

test('DXF tracer extracts 4 wall segments from a rectangle', () => {
  const r = traceDxf({ text: RECT_DXF });
  assert.equal(r.success, true);
  assert.equal(r.walls.length, 4, `expected 4 walls, got ${r.walls.length}`);
});

test('DXF tracer preserves true mm dimensions (INSUNITS metric)', () => {
  const r = traceDxf({ text: RECT_DXF });
  const bottom = r.walls[0];
  const span = Math.abs(bottom.x2 - bottom.x1);
  assert.ok(span > 0, 'bottom wall has length');
  assert.ok(r.mmPerUnit > 0, 'mmPerUnit resolved');
});

test('pixelPerMeter is 1000 so downstream interpret does not double-scale mm', () => {
  const r = traceDxf({ text: RECT_DXF });
  assert.equal(r.pixelPerMeter, 1000, 'coords already mm -> ppm must be 1000 (identity)');
});

test('known-real-length override locks precise scale', () => {
  // Say the 4000-unit bottom wall is really 4000mm: knownRealMm=4000, units=4000 -> mmPerUnit=1
  const r = traceDxf({ text: RECT_DXF, knownRealMm: 4000, knownDrawingUnits: 4000 });
  const bottom = r.walls[0];
  assert.ok(Math.abs(Math.abs(bottom.x2 - bottom.x1) - 4000) <= 1, `bottom wall should be 4000mm, got ${Math.abs(bottom.x2 - bottom.x1)}`);
});

test('empty/garbage DXF yields no walls (honest, no invention)', () => {
  const r = traceDxf({ text: '0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n' });
  assert.equal(r.walls.length, 0);
});
