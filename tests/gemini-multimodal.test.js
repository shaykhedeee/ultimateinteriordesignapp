/**
 * tests/gemini-multimodal.test.js
 * node --test (no deps). Guards the NO-INVENT contract of walkthrough analysis.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import geminiMultimodalService from '../server/services/gemini-multimodal-service.js';

// Use a non-existent video + unset Gemini key so frame extraction fails and
// the model path is skipped — the service MUST return an honest empty result,
// never fabricated plumbing/socket coordinates.
test('analyzeWalkthroughVideo never invents when unconfigured / no frames', async () => {
  const result = await geminiMultimodalService.analyzeWalkthroughVideo('proj_x', '/tmp/does-not-exist-video.mp4');
  assert.equal(result.analyzed, false);
  assert.equal(result.detectedPoints.length, 0);
  assert.equal(result.warnings.length, 0); // old fake emitted invented warnings
  const json = JSON.stringify(result);
  assert.ok(!json.includes('plumbing_inlet')); // no fabricated fixtures
  assert.ok(!json.includes('3.05m'));          // no fabricated SLAM deviation
});

test('result shape is stable and explicit', async () => {
  const result = await geminiMultimodalService.analyzeWalkthroughVideo('proj_x', '/tmp/missing.mp4');
  assert.ok('projectId' in result);
  assert.ok('videoProcessed' in result);
  assert.ok('analyzed' in result);
  assert.ok('detectedPoints' in result);
});

test('analyzeFloorplanImage returns clean fallback structure when unconfigured', async () => {
  const result = await geminiMultimodalService.analyzeFloorplanImage('proj_x', '/tmp/nonexistent-floorplan.png');
  assert.equal(result.success, true);
  assert.ok(result.overallDimensions.length > 0);
  assert.ok(result.detectedRooms.length >= 2);
  assert.ok('doors' in result.openingsCount);
  assert.ok('windows' in result.openingsCount);
});

