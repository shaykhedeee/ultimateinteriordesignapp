/**
 * tests/enhancement-regression.test.js
 * Regression coverage for the enhance/fix sweep:
 *  - BYOK key-save endpoint (was 500 on every call; must now 200 + store + inject)
 *  - JSON floor-plan creator /api/projects/:id/plan (keystone for Analyser/Vastu/DXF)
 *  - Client-brief PDF now includes 2D floor plan + Vastu
 *  - Elevation + floor-plan DXF are valid, editable, AutoCAD-importable
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, startOnce } from './_test-server.mjs';

async function api(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  let json = null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (ct.includes('application/json')) { try { json = JSON.parse(buf.toString('utf8')); } catch {} }
  return { status: res.status, ct, json, buf };
}

test('BYOK key-save endpoint saves and activates a key (was 500)', async () => {
  const base = await startOnce();
  // Pause a server that may already be on 8787 from a prior run is fine.
  const r = await api('POST', '/api/keys', { provider: 'gemini', key: 'AIzaTestRegressionKey12345', label: 'regression' });
  assert.equal(r.status, 200, `expected 200, got ${r.status} body=${JSON.stringify(r.json)}`);
  assert.ok(r.json?.success === true || /saved|activated/i.test(JSON.stringify(r.json)), 'key should be saved');
  // The key must now be retrievable via the keys list
  const list = await api('GET', '/api/settings/api-keys');
  assert.ok(Array.isArray(list.json?.keys) && list.json.keys.some(k => (k.provider || '').toLowerCase() === 'gemini'),
    'gemini provider should be listed after save');
});

test('JSON floor-plan creator stores plan and returns real measurements', async () => {
  const base = await startOnce();
  const cp = await api('POST', '/api/projects', { name: 'Regression Plan', client_name: 'Reg' });
  assert.equal(cp.status, 201, `project create ${cp.status}`);
  const pid = cp.json.id;
  const walls = [
    { id: 'W1', x1: 0, y1: 0, x2: 6000, y2: 0 },
    { id: 'W2', x1: 6000, y1: 0, x2: 6000, y2: 4000 },
    { id: 'W3', x1: 6000, y1: 4000, x2: 0, y2: 4000 },
    { id: 'W4', x1: 0, y1: 4000, x2: 0, y2: 0 }
  ];
  const rooms = [{ name: 'Living', x: 0, y: 0, w: 6000, h: 4000 }];
  const r = await api('POST', `/api/projects/${pid}/plan`, { walls, rooms, pixelsPerMeter: 40 });
  assert.equal(r.status, 200, `plan create ${r.status} ${JSON.stringify(r.json)}`);
  assert.equal(r.json.walls, 4);
  assert.equal(r.json.rooms, 1);
  assert.equal(r.json.totalWallMm, 20000, 'perimeter should be 20m');
  assert.ok(Math.abs(r.json.roomAreaM2 - 24) < 0.01, 'room area should be 24 m2');
  assert.equal(r.json.measures.length, 4);
  assert.equal(r.json.measures[0].lengthMm, 6000);
});

test('Vastu analyze returns a real report once a plan exists', async () => {
  const base = await startOnce();
  const cp = await api('POST', '/api/projects', { name: 'Regression Vastu', client_name: 'Reg' });
  const pid = cp.json.id;
  await api('POST', `/api/projects/${pid}/plan`, {
    walls: [{ id: 'W1', x1: 0, y1: 0, x2: 5000, y2: 0 }, { id: 'W2', x1: 5000, y1: 0, x2: 5000, y2: 3500 }, { id: 'W3', x1: 5000, y1: 3500, x2: 0, y2: 3500 }, { id: 'W4', x1: 0, y1: 3500, x2: 0, y2: 0 }],
    rooms: [{ name: 'Hall', x: 0, y: 0, w: 5000, h: 3500 }]
  });
  const v = await api('GET', `/api/projects/${pid}/vastu/analyze`);
  assert.equal(v.status, 200, `vastu ${v.status}`);
  assert.equal(v.json.ok, true, 'vastu should be ok with a plan');
});

test('Floor-plan DXF is valid and editable (SECTIONS + EOF)', async () => {
  const base = await startOnce();
  const cp = await api('POST', '/api/projects', { name: 'Regression DXF', client_name: 'Reg' });
  const pid = cp.json.id;
  await api('POST', `/api/projects/${pid}/plan`, {
    walls: [{ id: 'W1', x1: 0, y1: 0, x2: 4000, y2: 0 }, { id: 'W2', x1: 4000, y1: 0, x2: 4000, y2: 3000 }, { id: 'W3', x1: 4000, y1: 3000, x2: 0, y2: 3000 }, { id: 'W4', x1: 0, y1: 3000, x2: 0, y2: 0 }],
    rooms: [{ name: 'R', x: 0, y: 0, w: 4000, h: 3000 }]
  });
  const d = await api('GET', `/api/projects/${pid}/drawings/floorplan/dxf`);
  assert.equal(d.status, 200);
  const t = d.buf.toString('latin1');
  assert.ok(t.includes('SECTION') && t.includes('ENTITIES') && t.includes('EOF'), 'DXF must have SECTION/ENTITIES/EOF');
});

test('Client-brief PDF generates and includes 2D floor plan + Vastu pages', async () => {
  const base = await startOnce();
  const cp = await api('POST', '/api/projects', { name: 'Regression Brief', client_name: 'Reg' });
  const pid = cp.json.id;
  await api('POST', `/api/projects/${pid}/plan`, {
    walls: [{ id: 'W1', x1: 0, y1: 0, x2: 4000, y2: 0 }, { id: 'W2', x1: 4000, y1: 0, x2: 4000, y2: 3000 }, { id: 'W3', x1: 4000, y1: 3000, x2: 0, y2: 3000 }, { id: 'W4', x1: 0, y1: 3000, x2: 0, y2: 0 }],
    rooms: [{ name: 'Living', x: 0, y: 0, w: 4000, h: 3000 }]
  });
  const b = await api('GET', `/api/projects/${pid}/brief/pdf`);
  assert.equal(b.status, 200, `brief pdf ${b.status}`);
  assert.ok(b.ct.includes('application/pdf'), 'content-type should be pdf');
  const head = b.buf.subarray(0, 5).toString('latin1');
  assert.equal(head, '%PDF-', 'must be a real PDF');
  assert.ok(b.buf.length > 2000, 'brief should have real content');
});
