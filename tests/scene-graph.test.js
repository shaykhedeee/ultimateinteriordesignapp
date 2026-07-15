import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../server/database/database.js';
import { buildSceneGraphFromProject } from '../server/services/visualizer-engine.js';

const PID = 'sg_test_' + Date.now();

function seed() {
  db.prepare('INSERT OR REPLACE INTO projects (id, name, client_name) VALUES (?, ?, ?)').run(PID, 'Scene Graph Test', 'SG Client');
  
  const walls = [
    { id: 'w1', roomIdPrimary: 'kitchen', x1: 0, y1: 0, x2: 3000, y2: 0, lengthMm: 3000, heightMm: 2800, thicknessMm: 150, cabinets: [
      { id: 'cab1', type: 'base', widthMm: 600, heightMm: 720, depthMm: 560, xOffsetMm: 200, zOffsetMm: 0, rotationDeg: 0, shutterMaterial: 'shutter_cream' }
    ] }
  ];
  
  const furniture = [
    { id: 'furn1', room: 'kitchen', type: 'free', cabinets: [
      { id: 'cab2', type: 'wall', widthMm: 600, heightMm: 600, depthMm: 350, xOffsetMm: 1000, zOffsetMm: 1400, rotationDeg: 0, shutterMaterial: 'shutter_wood' }
    ] }
  ];
  
  const rooms = [
    { room: 'kitchen', name: 'Kitchen', widthMm: 3000, depthMm: 4000, ceilingHeightMm: 2800 }
  ];

  db.prepare(`INSERT OR REPLACE INTO cad_drawings (id, project_id, walls_json, openings_json, furniture_json, rooms_json)
    VALUES (?, ?, ?, ?, ?, ?)`).run('cd_' + PID, PID, JSON.stringify(walls), JSON.stringify([]), JSON.stringify(furniture), JSON.stringify(rooms));
}

function cleanup() {
  db.prepare('DELETE FROM cad_drawings WHERE project_id = ?').run(PID);
  db.prepare('DELETE FROM projects WHERE id = ?').run(PID);
}

test('buildSceneGraphFromProject correctly parses room walls and modules', () => {
  seed();
  
  const scene = buildSceneGraphFromProject(PID, 'kitchen');
  
  assert.ok(scene, 'scene graph should be generated');
  assert.ok(scene.room_shell, 'should contain room shell');
  assert.equal(scene.room_shell.widthMm, 3000);
  assert.equal(scene.room_shell.heightMm, 2800);
  assert.equal(scene.room_shell.walls.length, 1);
  assert.equal(scene.room_shell.walls[0].thicknessMm, 150);
  
  assert.ok(Array.isArray(scene.placed_modules), 'should contain placed modules');
  assert.equal(scene.placed_modules.length, 2);
  
  const cab1 = scene.placed_modules.find(m => m.id === 'cab1');
  assert.ok(cab1, 'cab1 should be present');
  assert.equal(cab1.type, 'base');
  assert.equal(cab1.widthMm, 600);
  assert.equal(cab1.shutterMaterial, 'shutter_cream');

  const cab2 = scene.placed_modules.find(m => m.id === 'cab2');
  assert.ok(cab2, 'cab2 should be present');
  assert.equal(cab2.type, 'wall');
  assert.equal(cab2.zOffsetMm, 1400);
  assert.equal(cab2.shutterMaterial, 'shutter_wood');
  
  cleanup();
});
