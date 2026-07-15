import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../server/database/database.js';
import { generateDeliveryPackPdf } from '../server/services/delivery-package.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../storage');

const PID = 'deliv_test_' + Date.now();

function seed() {
  db.prepare('INSERT OR REPLACE INTO projects (id, name, client_name) VALUES (?, ?, ?)').run(PID, 'Delivery Pack Test', 'Delivery Client');
  db.prepare(`INSERT OR REPLACE INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json)
    VALUES (?, ?, ?, ?, ?, ?)`).run('cd_' + PID, PID, JSON.stringify([]), JSON.stringify([]), JSON.stringify([]), JSON.stringify([]));
}

function cleanup(pdfPath) {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
  if (pdfPath && fs.existsSync(pdfPath)) {
    fs.rmSync(pdfPath, { force: true });
  }
}

test('generateDeliveryPackPdf successfully creates a technical PDF document', async () => {
  seed();
  
  const pdfPath = await generateDeliveryPackPdf(PID);
  
  assert.ok(pdfPath, 'should return a file path');
  assert.ok(fs.existsSync(pdfPath), 'PDF file should exist on disk');
  
  const stats = fs.statSync(pdfPath);
  assert.ok(stats.size > 100, 'PDF should have a non-trivial file size');
  
  cleanup(pdfPath);
});
