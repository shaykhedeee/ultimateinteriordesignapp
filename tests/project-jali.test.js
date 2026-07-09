/**
 * tests/project-jali.test.js
 * Regression for:
 *  - DELETE /api/projects/:id (cascade + 404 on missing)
 *  - POST /api/projects/:id/elevations/jali-panel (CNC jali DXF + PDF)
 *  - server/services/jali-panel.js produces valid DXF (closed-polylines + EOF)
 * (Server must be running on 127.0.0.1:8787.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildJaliPanelDXF } from '../server/services/jali-panel.js';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8787';
const isHtml = (t) => typeof t === 'string' && t.includes('<!DOCTYPE');

test('jali-panel service: valid DXF with lotus + lattice (closed polylines)', () => {
  const dxf = buildJaliPanelDXF({ widthMm: 600, heightMm: 2000, name: 'Test Jali' });
  assert.ok(dxf.includes('SECTION') && dxf.trim().endsWith('EOF'), 'valid DXF envelope');
  assert.ok((dxf.match(/LWPOLYLINE/g) || []).length >= 2, 'has lotus closed polylines');
  assert.ok((dxf.match(/ARC/g) || []).length >= 2, 'has lattice arcs');
});

test('DELETE project cascades + 404 on missing', async () => {
  const created = await fetch(`${BASE}/api/projects`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Delete Me ' + Date.now() })
  }).then(r => r.json());
  const id = created.id || created.project?.id;
  assert.ok(id, 'project created');

  const del = await fetch(`${BASE}/api/projects/${id}`, { method: 'DELETE' });
  const delBody = await del.json();
  assert.equal(delBody.success, true, 'delete succeeded');

  const after = await fetch(`${BASE}/api/projects/${id}`);
  assert.equal(after.status, 404, 'project gone after delete');

  const missing = await fetch(`${BASE}/api/projects/does_not_exist`, { method: 'DELETE' });
  const mb = await missing.text();
  assert.equal(missing.status, 404);
  assert.ok(!isHtml(mb), '404 must be JSON not HTML');
});

test('jali-panel route: returns DXF + PDF urls', async () => {
  const created = await fetch(`${BASE}/api/projects`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Jali Test ' + Date.now() })
  }).then(r => r.json());
  const id = created.id || created.project?.id;
  assert.ok(id, 'project created');

  const res = await fetch(`${BASE}/api/projects/${id}/elevations/jali-panel`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widthMm: 600, heightMm: 2000, name: 'Wardrobe Jali' })
  });
  const body = await res.json();
  assert.equal(body.success, true, 'jali generated');
  assert.ok(body.dxf.endsWith('.dxf'), 'dxf url');
  assert.ok(body.pdf.endsWith('.pdf'), 'pdf url');
  assert.equal(body.widthMm, 600);

  // cleanup
  await fetch(`${BASE}/api/projects/${id}`, { method: 'DELETE' });
});

test('jali-panel route: rejects out-of-range dims (400 JSON)', async () => {
  const created = await fetch(`${BASE}/api/projects`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Jali Range ' + Date.now() })
  }).then(r => r.json());
  const id = created.id || created.project?.id;
  const res = await fetch(`${BASE}/api/projects/${id}/elevations/jali-panel`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widthMm: 10, heightMm: 10 })
  });
  assert.equal(res.status, 400);
  await fetch(`${BASE}/api/projects/${id}`, { method: 'DELETE' });
});
