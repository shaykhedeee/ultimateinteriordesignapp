import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSceneWithBlender } from '../server/services/blender-renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../storage');

test('renderSceneWithBlender writes temp JSON and handles command configuration', async () => {
  const dummyScene = {
    room_shell: { widthMm: 3000, depthMm: 4000, heightMm: 2800, walls: [] },
    placed_modules: [],
    lighting: []
  };

  // We test the service execution. If Blender is not installed, it should reject with a clear spawn error
  // rather than crashing the process, which we catch.
  let errorCaught = false;
  let tempJsonCreated = false;
  
  try {
    // We pass a non-existent or mocked Blender binary path via environment to trigger the subprocess spawn check
    process.env.BLENDER_PATH = 'non_existent_blender_binary_mock';
    
    // We spawn it and capture the promise
    const renderPromise = renderSceneWithBlender('mock_proj_id', dummyScene, 'perspective_main', { quality: 'draft' });
    
    // Check if the temporary json was created before subprocess resolution/rejection
    const tempJsonPath = path.join(storageDir, 'projects', 'mock_proj_id', 'scene_temp.json');
    if (fs.existsSync(tempJsonPath)) {
      tempJsonCreated = true;
    }
    
    await renderPromise;
  } catch (err) {
    errorCaught = true;
    assert.ok(err.message.includes('non_existent_blender_binary_mock') || err.message.includes('spawn'), `Unexpected error message: ${err.message}`);
  } finally {
    // Clean up if any
    const tempJsonPath = path.join(storageDir, 'projects', 'mock_proj_id', 'scene_temp.json');
    if (fs.existsSync(tempJsonPath)) {
      fs.rmSync(tempJsonPath, { force: true });
    }
    delete process.env.BLENDER_PATH;
  }
  
  assert.ok(errorCaught, 'Should fail to run Blender since path is mocked');
  assert.ok(tempJsonCreated, 'Temporary scene JSON should have been written to project storage');
});
