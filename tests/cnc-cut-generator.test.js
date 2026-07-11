// Unit tests for the CNC cut-plan generator + DXF layer registration.
// Verifies the feature is actually functional (it was previously a broken,
// un-wired stub that called a non-existent dxf.build() and drew holes at
// stale coordinates onto 3 unregistered layers).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCNCCutPlan } from '../server/services/cnc-cut-generator.js';
import { DXF } from '../server/services/dxf-writer.js';

// Parse a DXF string into entities with their group-8 layer and key coords.
function parseDXF(dxfStr) {
  const lines = dxfStr.split('\n').map(l => l.trim());
  const entities = [];
  const layersRegistered = [];
  let cur = null;
  let mode = 'table'; // 'table' | 'entity'
  for (let i = 0; i < lines.length; i++) {
    const code = lines[i];
    const val = lines[i + 1];
    if (code === '0') {
      if (val === 'SECTION') {
        const secName = lines[i + 3]; // 0 SECTION / 2 <name>
        if (secName === 'ENTITIES') mode = 'entity';
        else if (secName === 'TABLES') mode = 'table';
      } else if (val === 'ENDSEC') {
        mode = 'table';
      } else if (val === 'LAYER') {
        cur = { type: 'LAYER' }; entities.push(cur);
      } else if (['LINE', 'LWPOLYLINE', 'CIRCLE', 'ARC', 'TEXT'].includes(val)) {
        if (mode === 'entity') { cur = { type: val }; entities.push(cur); }
      }
      continue;
    }
    if (!cur) continue;
    if (cur.type === 'LAYER') {
      if (code === '2') { cur.name = val; layersRegistered.push(val); }
      continue;
    }
    if (mode === 'entity') {
      if (code === '8') cur.layer = val;
      if (code === '10') cur.x = parseFloat(val);
      if (code === '20') cur.y = parseFloat(val);
      if (code === '40') cur.r40 = parseFloat(val); // height for TEXT, radius for CIRCLE
    }
  }
  return { entities, layersRegistered };
}

test('generated DXF references only registered layers (no dropped entities)', () => {
  const { dxf } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100 });
  const { entities, layersRegistered } = parseDXF(dxf);
  for (const need of ['CNC_OUTLINE', 'CNC_DRILL', 'CNC_POCKET', 'CNC_ENGRAVE']) {
    assert.ok(layersRegistered.includes(need), `layer ${need} must be registered in the LAYER table`);
  }
  const used = entities.filter(e => e.type !== 'LAYER' && e.layer).map(e => e.layer);
  const uniq = [...new Set(used)];
  for (const u of uniq) assert.ok(layersRegistered.includes(u), `layer "${u}" used but not registered`);
});

test('emits a complete part set (sides, top, bottom, back, shelves, doors)', () => {
  const { parts, partCount } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100, numShelves: 2 });
  const needed = ['L_SIDE', 'R_SIDE', 'TOP', 'BOTTOM', 'BACK', 'SHELF_1', 'SHELF_2', 'DOOR_L', 'DOOR_R'];
  for (const n of needed) assert.ok(parts.includes(n), `missing part ${n}`);
  assert.equal(partCount, needed.length);
});

test('all parts stay within the chosen sheet bounds', () => {
  const { dxf, sheet } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100 });
  const SHEET_W = sheet.w, SHEET_H = sheet.h;
  const { entities } = parseDXF(dxf);
  for (const e of entities) {
    if (e.type === 'LWPOLYLINE' || e.type === 'LINE' || e.type === 'CIRCLE') {
      if (e.x !== undefined) assert.ok(e.x <= SHEET_W + 1, `x ${e.x} exceeds sheet width ${SHEET_W}`);
      if (e.y !== undefined) assert.ok(e.y <= SHEET_H + 1, `y ${e.y} exceeds sheet height ${SHEET_H}`);
    }
  }
});

test('drill holes use correct diameter and land inside sheet', () => {
  const { dxf } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100 });
  const { entities } = parseDXF(dxf);
  const circles = entities.filter(e => e.type === 'CIRCLE');
  assert.ok(circles.length > 0, 'expected at least one drill circle (shelf-pin bores)');
  for (const c of circles) {
    assert.equal(c.r40, 2.5, `drill radius should be 2.5mm, got ${c.r40}`);
    assert.ok(c.layer === 'CNC_DRILL', 'drill must be on CNC_DRILL layer');
  }
});

test('throws (does not emit an overflowing file) when module cannot fit any board', () => {
  // side panel = depth(2000) x height(2400); rotated 2400x2000 still exceeds
  // the jumbo 2745x1830 sheet in the 2000mm axis -> genuinely impossible.
  assert.throws(
    () => generateCNCCutPlan({ widthMm: 900, depthMm: 2000, heightMm: 2400, numShelves: 0 }),
    /exceed the/
  );
});

test('single-shutter module emits one DOOR (not DOOR_L/DOOR_R)', () => {
  const { parts } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100, shutterType: 'single', numShelves: 0 });
  assert.ok(parts.includes('DOOR') && !parts.includes('DOOR_L'), 'single shutter should yield a single DOOR part');
});
