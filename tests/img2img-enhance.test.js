import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../server/database/database.js';
import { generateStudioRender } from '../server/services/visualizer-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../storage');

const PID = 'img2img_test_' + Date.now();

function seed() {
  db.prepare('INSERT OR REPLACE INTO projects (id, name, client_name) VALUES (?, ?, ?)').run(PID, 'Img2Img Test', 'Img2Img Client');
  db.prepare(`INSERT OR REPLACE INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json)
    VALUES (?, ?, ?, ?, ?, ?)`).run('cd_' + PID, PID, JSON.stringify([]), JSON.stringify([]), JSON.stringify([]), JSON.stringify([]));
}

function cleanup() {
  // Clean up generated assets first (respect foreign key constraints)
  try {
    const assets = db.prepare('SELECT file_path FROM generated_assets WHERE project_id = ?').all(PID);
    for (const a of assets) {
      if (a.file_path.startsWith('/storage/')) {
        const fp = path.join(storageDir, a.file_path.replace('/storage/', ''));
        fs.rmSync(fp, { force: true });
      }
    }
  } catch (_) {}
  try { db.prepare('DELETE FROM generated_assets WHERE project_id = ?').run(PID); } catch (_) {}
  try { db.prepare('DELETE FROM scene_versions WHERE project_id = ?').run(PID); } catch (_) {}
  try { db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID); } catch (_) {}
  try { db.prepare('DELETE FROM projects WHERE id = ?').run(PID); } catch (_) {}
}

test('generateStudioRender falls back cleanly and registers visualizer assets', async () => {
  seed();
  
  // Force LIVE_IMAGE_GEN to false so it uses local mock fallback or base render
  process.env.LIVE_IMAGE_GEN = 'false';
  
  const result = await generateStudioRender(PID, { room: 'kitchen', style: 'scandinavian' });
  
  assert.ok(result, 'should return render result');
  assert.ok(result.id, 'should contain asset ID');
  assert.equal(result.room, 'kitchen');
  assert.equal(result.style, 'scandinavian');
  assert.ok(result.filePath, 'should contain image path');
  
  // Verify it exists in database
  const row = db.prepare('SELECT * FROM generated_assets WHERE id = ?').get(result.id);
  assert.ok(row, 'generated asset should be stored in DB');
  assert.equal(row.project_id, PID);
  
  // Verify a scene version was registered in database
  const sceneRow = db.prepare('SELECT * FROM scene_versions WHERE project_id = ? ORDER BY version_number DESC LIMIT 1').get(PID);
  assert.ok(sceneRow, 'scene version should be recorded');
  
  cleanup();
});
