/**
 * tests/project-settings-modal.test.js
 * Proves the in-app project-settings edit flow works end-to-end against the
 * PATCH /api/projects/:id endpoint (the same endpoint ProjectSettingsModal uses).
 *  - create project -> PATCH name/client_name/budget/status -> fields updated
 *  - budget '' is stored as null (cleared), not 0
 *  - empty/invalid id -> 404 JSON (never HTML)
 * (Server must be running on 127.0.0.1:5055.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.APP_URL || 'http://127.0.0.1:5055';

function isHtml(t) { return typeof t === 'string' && t.includes('<!DOCTYPE'); }

test('project settings edit: PATCH updates name, client, budget, status', async () => {
  const created = await fetch(`${BASE}/api/projects`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Edit Me', client_name: 'Old Client', budget: 1000000, status: 'onboarding' })
  }).then(r => r.json());
  const id = created.id || created.project?.id;
  assert.ok(id, 'project created');

  // Mirrors ProjectSettingsModal.handleSave payload
  const res = await fetch(`${BASE}/api/projects/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Renamed Project', client_name: 'New Client', budget: 2500000, status: 'cad' })
  });
  assert.equal(res.status, 200, `expected 200, got ${res.status}`);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.project.name, 'Renamed Project');
  assert.equal(body.project.client_name, 'New Client');
  assert.equal(Number(body.project.budget), 2500000);
  assert.equal(body.project.status, 'cad');
});

test('project settings edit: empty budget stored as null', async () => {
  const created = await fetch(`${BASE}/api/projects`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Budget Clear', budget: 500000 })
  }).then(r => r.json());
  const id = created.id || created.project?.id;
  assert.ok(id, 'project created');

  const res = await fetch(`${BASE}/api/projects/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget: '' })
  });
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.project.budget, null, 'empty budget should become null, not 0');
});

test('project settings edit: invalid id returns JSON 404 (no HTML)', async () => {
  const res = await fetch(`${BASE}/api/projects/does_not_exist_123`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'x' })
  });
  const text = await res.text();
  assert.equal(res.status, 404);
  assert.ok(!isHtml(text), 'error response must be JSON, not HTML');
  const body = JSON.parse(text);
  assert.equal(body.success, false);
});
