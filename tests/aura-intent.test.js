// Regression tests for AURA intent routing (the deterministic brain of the
// AURA orchestrator). resolveIntent is pure (no DB, no network) so it is the
// part we can lock without a running server or API key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveIntent } from '../server/services/aura-orchestrator.js';

test('empty / null message -> no intent, zero confidence', () => {
  assert.deepEqual(resolveIntent(''), { tool: null, confidence: 0 });
  assert.deepEqual(resolveIntent(null), { tool: null, confidence: 0 });
  assert.deepEqual(resolveIntent(undefined), { tool: null, confidence: 0 });
});

test('elevation keyword routes to generate_elevation', () => {
  const r = resolveIntent('generate the cabinet elevation drawing and DXF');
  assert.equal(r.tool.id, 'generate_elevation');
  assert.ok(r.confidence > 0);
});

test('render keyword routes to generate_render', () => {
  const r = resolveIntent('create a 3D render photo of the living room');
  assert.equal(r.tool.id, 'generate_render');
});

test('floorplan detect routes to plan_ai_detect', () => {
  const r = resolveIntent('detect rooms and layout from the floorplan');
  assert.equal(r.tool.id, 'plan_ai_detect');
});

test('CV trace routes to cv_auto_trace', () => {
  const r = resolveIntent('auto-trace the walls from the blueprint sketch');
  assert.equal(r.tool.id, 'cv_auto_trace');
});

test('cutlist keyword routes to cutlist_calculate', () => {
  const r = resolveIntent('calculate the cutlist and nest the panels');
  assert.equal(r.tool.id, 'cutlist_calculate');
});

test('signoff / pdf routes to generate_signoff', () => {
  const r = resolveIntent('generate the client signoff PDF pack');
  assert.equal(r.tool.id, 'generate_signoff');
});

test('budget keyword routes to budget_optimize', () => {
  const r = resolveIntent('optimize the budget to make it cheaper');
  assert.equal(r.tool.id, 'budget_optimize');
});

test('job keyword routes to assign_task', () => {
  const r = resolveIntent('start a background job and check running status');
  assert.equal(r.tool.id, 'assign_task');
});

test('regenerate room routes to regen_room', () => {
  const r = resolveIntent('regenerate the kitchen render');
  assert.equal(r.tool.id, 'regen_room');
});

test('vastu keyword routes to vastu_check', () => {
  const r = resolveIntent('check Vastu compliance and pooja placement');
  assert.equal(r.tool.id, 'vastu_check');
});

test('ambiguous text with no tool keyword -> no intent', () => {
  const r = resolveIntent('hello how are you today');
  assert.equal(r.tool, null);
});

test('a single message can only match ONE best tool (no duplicate dispatch)', () => {
  // "render" appears once -> generate_render, confidence 1
  const r = resolveIntent('render the bedroom');
  assert.equal(r.tool.id, 'generate_render');
  assert.equal(r.confidence, 1);
});

test('rag_search /list/ must NOT hijack "cutlist" (word-boundary guard)', () => {
  const r = resolveIntent('calculate the cutlist and nest the panels');
  assert.equal(r.tool.id, 'cutlist_calculate');
});

test('multi-keyword message routes to the dominant tool, not a single-word tie', () => {
  const r = resolveIntent('auto-trace the walls from the blueprint sketch');
  assert.equal(r.tool.id, 'cv_auto_trace');
});

test('"regenerate the kitchen render" prefers regen_room over generate_render', () => {
  const r = resolveIntent('regenerate the kitchen render');
  assert.equal(r.tool.id, 'regen_room');
});

test('no keyword hit -> null tool (no phantom routing)', () => {
  const r = resolveIntent('hello how are you today');
  assert.equal(r.tool, null);
  assert.equal(r.confidence, 0);
});
