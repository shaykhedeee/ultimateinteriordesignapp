// Regression tests for cutlist-standards-service.js — the BOM part generator.
// Locks: formula evaluation (W/H/D/t/bt/g tokens + min()), edge-band parsing,
// and concrete part dimensions for real cabinet types.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFormula, precisionPartsForModule } from '../server/services/cutlist-standards-service.js';

const cfg = { boardThicknessMm: 18, backPanelThicknessMm: 6, grooveDepthMm: 8, shelfClearanceMm: 2, hingeClearanceMm: 20, shutterGapMm: 3, railWidthMm: 100 };

test('evaluateFormula: arithmetic tokens', () => {
  const v = { H: 2100, W: 900, D: 560, t: 18, bt: 6, g: 3 };
  assert.equal(evaluateFormula('W - 2*t', v), 900 - 36);
  assert.equal(evaluateFormula('H - 80', v), 2100 - 80);
  assert.equal(evaluateFormula('2*t', v), 36);
});

test('evaluateFormula: shutters formula (W - (n+1)*g)/n', () => {
  const v = { H: 2100, W: 900, D: 560, t: 18, bt: 6, g: 3 };
  // 2 shutters for a 900mm width
  assert.equal(evaluateFormula('(W - 3*g) / 2', v), Math.round((900 - 9) / 2));
});

test('evaluateFormula: min() works (no token collision with H/W/D)', () => {
  const v = { H: 2100, W: 900, D: 560, t: 18, bt: 6, g: 3 };
  // min(W, D) must resolve to 560, NOT be corrupted by the H/W/D substitution
  assert.equal(evaluateFormula('min(W, D)', v), Math.min(900, 560));
  assert.equal(evaluateFormula('min(W, 2400)', v), 900);
});

test('base cabinet: side panels are H x D; bottom is (W-2t) x D', () => {
  const mod = { moduleType: 'kitchen-base', id: 'm1', widthMm: 900, heightMm: 2100, depthMm: 560, material: 'BWP' };
  const parts = precisionPartsForModule(mod, 0, cfg);
  const left = parts.find(p => p.partCode.endsWith('01'));
  const bottom = parts.find(p => p.partCode.endsWith('03'));
  assert.equal(left.lengthMm, 2100);
  assert.equal(left.widthMm, 560);
  assert.equal(bottom.lengthMm, 900 - 2 * 18);
  assert.equal(bottom.widthMm, 560);
});

test('base cabinet: 2 shutters when width <= 750, else more', () => {
  const narrow = precisionPartsForModule({ moduleType: 'kitchen-base', id: 'a', widthMm: 700, heightMm: 2100, depthMm: 560 }, 0, cfg);
  const wide = precisionPartsForModule({ moduleType: 'kitchen-base', id: 'b', widthMm: 900, heightMm: 2100, depthMm: 560 }, 0, cfg);
  const shutterCount = (parts) => parts.filter(p => p.name === 'Shutter').reduce((s, p) => s + p.quantity, 0);
  assert.equal(shutterCount(narrow), 1);
  assert.equal(shutterCount(wide), 2);
});

test('edge band: "4E 2mm visible" sets all four edges to 2mm PVC', () => {
  const parts = precisionPartsForModule({ moduleType: 'kitchen-base', id: 'm', widthMm: 900, heightMm: 2100, depthMm: 560 }, 0, cfg);
  const shutter = parts.find(p => p.name === 'Shutter');
  assert.equal(shutter.edge_l1, '2mm PVC');
  assert.equal(shutter.edge_l2, '2mm PVC');
  assert.equal(shutter.edge_w1, '2mm PVC');
  assert.equal(shutter.edge_w2, '2mm PVC');
});

test('edge band: back panel strips all edges (no banding on recessed back)', () => {
  const parts = precisionPartsForModule({ moduleType: 'kitchen-base', id: 'm', widthMm: 900, heightMm: 2100, depthMm: 560 }, 0, cfg);
  const back = parts.find(p => p.name === 'Recessed back panel');
  assert.equal(back.edge_l1, null);
  assert.equal(back.edge_w2, null);
});

test('drawer cabinet: drawer fronts/bottoms/backs scaled by runner clearances', () => {
  const mod = { moduleType: 'drawer-base', id: 'd', widthMm: 900, heightMm: 2100, depthMm: 560, drawerCount: 3, hardwareRuleId: 'hettich-innotech-drawer' };
  const parts = precisionPartsForModule(mod, 0, cfg);
  const fronts = parts.filter(p => p.name.startsWith('Drawer front'));
  assert.equal(fronts.length, 3);
  // Hettich side clearance 26 -> drawer bottom width = W - 2*t - 26
  const bottoms = parts.filter(p => p.name.startsWith('Drawer bottom'));
  assert.equal(bottoms[0].lengthMm, 900 - 2 * 18 - 26);
});

test('wardrobe: 3 shutters when width > 1050, partition qty = shutters-1', () => {
  const mod = { moduleType: 'wardrobe', id: 'w', widthMm: 1200, heightMm: 2400, depthMm: 600 };
  const parts = precisionPartsForModule(mod, 0, cfg);
  const shutterQty = parts.filter(p => p.name === 'Wardrobe shutter').reduce((s, p) => s + p.quantity, 0);
  assert.equal(shutterQty, 3);
  const partitions = parts.filter(p => p.name === 'Vertical partition');
  // one consolidated partition part with quantity = shutters - 1
  assert.equal(partitions.length, 1);
  assert.equal(partitions[0].quantity, 3 - 1);
});
