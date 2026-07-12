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

test('kitchen_template intent: routes U/L shape', () => {
  assert.equal(resolveIntent('apply a u-shape modular kitchen').tool.id, 'kitchen_template');
  assert.equal(resolveIntent('set an L-shape kitchen layout').tool.id, 'kitchen_template');
});

test('apply_vastu intent: routes auto-apply', () => {
  assert.equal(resolveIntent('apply vastu fixes to my plan').tool.id, 'apply_vastu');
});

test('preview_vastu intent: routes preview (not apply)', () => {
  const r = resolveIntent('preview the vastu changes first');
  assert.equal(r.tool.id, 'preview_vastu');
});

test('tv_unit_apply intent: routes tv unit', () => {
  assert.equal(resolveIntent('add a high-gloss black tv unit').tool.id, 'tv_unit_apply');
});

test('no keyword hit -> null tool (no phantom routing)', () => {
  const r = resolveIntent('hello how are you today');
  assert.equal(r.tool, null);
  assert.equal(r.confidence, 0);
});

// ── New feature tools wired into AURA (per "add aura pipelines to all features") ──

test('jali keyword routes to jali_generate', () => {
  const r = resolveIntent('generate a jali lattice partition screen');
  assert.equal(r.tool.id, 'jali_generate');
});

test('jali with size hint still routes to jali_generate', () => {
  const r = resolveIntent('make a jaali panel 600x2000');
  assert.equal(r.tool.id, 'jali_generate');
});

test('shoe rack keyword routes to shoe_rack_generate', () => {
  const r = resolveIntent('design a shoe rack for the entryway');
  assert.equal(r.tool.id, 'shoe_rack_generate');
});

test('cutlist refresh phrasing routes to cutlist_refresh (not cutlist_calculate)', () => {
  const r = resolveIntent('refresh the cutlist from the current CAD');
  assert.equal(r.tool.id, 'cutlist_refresh');
});

test('delivery package phrasing routes to delivery_pack', () => {
  const r = resolveIntent('build the client delivery package zip');
  assert.equal(r.tool.id, 'delivery_pack');
});

test('quotation keyword routes to generate_quotation', () => {
  const r = resolveIntent('create the quotation PDF proposal for the client');
  assert.equal(r.tool.id, 'generate_quotation');
});

test('generate_quotation no longer dead-ends: it is a real tool id', () => {
  const r = resolveIntent('estimate proposal invoice');
  assert.ok(['generate_quotation', 'generate_signoff', 'budget_optimize'].includes(r.tool.id), `got ${r.tool?.id}`);
});
