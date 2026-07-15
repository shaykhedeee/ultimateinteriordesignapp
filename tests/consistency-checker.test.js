import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { checkSceneToElevationConsistency } from '../server/services/consistency-checker.js';

const PID = 'const_test_' + Date.now();

function seed({ sceneModules = [], elevationCabinets = [] }) {
  db.prepare('INSERT OR REPLACE INTO projects (id, name, client_name) VALUES (?, ?, ?)').run(PID, 'Consistency Test', 'Const Client');
  
  const sceneJson = {
    room_shell: { widthMm: 3000, heightMm: 2800, walls: [] },
    placed_modules: sceneModules
  };
  
  db.prepare(`
    INSERT OR REPLACE INTO scene_versions (id, project_id, version_number, branch_name, is_current, scene_json, scene_hash)
    VALUES (?, ?, 1, 'main', 1, ?, 'hash_123')
  `).run('sv_' + PID, PID, JSON.stringify(sceneJson));
  
  if (elevationCabinets.length > 0) {
    const elevModel = {
      lengthMm: 3000,
      heightMm: 2800,
      cabinets: elevationCabinets
    };
    db.prepare(`
      INSERT OR REPLACE INTO photo_elevations (id, project_id, wall_id, wall_name, model_json, confidence)
      VALUES (?, ?, 'w1', 'Wall 1', ?, 100)
    `).run('pe_' + PID, PID, JSON.stringify(elevModel));
  }
}

function cleanup() {
  db.prepare('DELETE FROM photo_elevations WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM scene_versions WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
}

test('consistency checker returns true when 3D and 2D layouts match perfectly', () => {
  seed({
    sceneModules: [
      { id: 'cab1', type: 'base', widthMm: 600, heightMm: 720, depthMm: 560 }
    ],
    elevationCabinets: [
      { id: 'cab1', type: 'base', widthMm: 600, heightMm: 720, depthMm: 560 }
    ]
  });
  
  const report = checkSceneToElevationConsistency(PID);
  assert.equal(report.consistent, true, 'should be consistent');
  assert.equal(report.mismatches.length, 0);
  
  cleanup();
});

test('consistency checker flags missing modules and size mismatches', () => {
  seed({
    sceneModules: [
      { id: 'cab1', type: 'base', widthMm: 600, heightMm: 720, depthMm: 560 },
      { id: 'cab2', type: 'wall', widthMm: 900, heightMm: 600, depthMm: 350 }
    ],
    elevationCabinets: [
      { id: 'cab1', type: 'base', widthMm: 800, heightMm: 720, depthMm: 560 } // width mismatch (600 vs 800)
      // cab2 is missing in elevation
    ]
  });
  
  const report = checkSceneToElevationConsistency(PID);
  assert.equal(report.consistent, false, 'should be inconsistent');
  
  const widthMismatch = report.mismatches.find(m => m.type === 'dimension_mismatch' && m.field === 'width');
  assert.ok(widthMismatch, 'should flag width mismatch');
  assert.equal(widthMismatch.moduleId, 'cab1');
  
  const missingInElev = report.mismatches.find(m => m.type === 'missing_in_elevation');
  assert.ok(missingInElev, 'should flag missing in elevation');
  assert.equal(missingInElev.moduleId, 'cab2');
  
  cleanup();
});
