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
  let verts = null; // accumulates vertices while reading a LWPOLYLINE
  for (let i = 0; i < lines.length; i++) {
    const code = lines[i];
    const val = lines[i + 1];
    if (code === '0') {
      // flush any in-progress polyline first
      if (cur && cur.type === 'LWPOLYLINE' && verts) {
        const xs = verts.map(v => v[0]), ys = verts.map(v => v[1]);
        cur.x = Math.min(...xs); cur.y = Math.min(...ys);
        cur.w = Math.max(...xs) - cur.x; cur.h = Math.max(...ys) - cur.y;
      }
      verts = null;
      if (val === 'SECTION') {
        const secName = lines[i + 3]; // 0 SECTION / 2 <name>
        if (secName === 'ENTITIES') mode = 'entity';
        else if (secName === 'TABLES') mode = 'table';
      } else if (val === 'ENDSEC') {
        mode = 'table';
      } else if (val === 'LAYER') {
        cur = { type: 'LAYER' }; entities.push(cur);
      } else if (val === 'SEQEND') {
        continue;
      } else if (['LINE', 'LWPOLYLINE', 'CIRCLE', 'ARC', 'TEXT'].includes(val)) {
        if (mode === 'entity') { cur = { type: val }; entities.push(cur); if (val === 'LWPOLYLINE') verts = []; }
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
      if (code === '10') {
        if (cur.type === 'LWPOLYLINE' && verts) verts.push([parseFloat(val), NaN]);
        else cur.x = parseFloat(val);
      }
      if (code === '20') {
        if (cur.type === 'LWPOLYLINE' && verts && verts.length) verts[verts.length - 1][1] = parseFloat(val);
        else cur.y = parseFloat(val);
      }
      if (code === '40' && cur.type !== 'LWPOLYLINE') cur.r40 = parseFloat(val); // height for TEXT, radius for CIRCLE
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

test('all parts stay within a board band (multi-sheet aware)', () => {
  const { dxf, sheet, sheetCount } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100, numShelves: 4 });
  const SHEET_W = sheet.w, SHEET_H = sheet.h;
  const { entities } = parseDXF(dxf);
  const rects = entities
    .filter(e => e.type === 'LWPOLYLINE' || e.type === 'LINE')
    .map(e => ({ x: e.x, y: e.y, w: e.w || 0, h: e.h || 0 }))
    .filter(r => r.w > 0 && r.h > 0);
  const parts = rects.filter(r => !(r.x === 0 && r.y % (SHEET_H + 60) === 0 && r.w === SHEET_W && r.h === SHEET_H));
  for (const p of parts) {
    // each part must fall inside exactly one board band [k*step, k*step+SHEET_H]
    const step = SHEET_H + 60;
    const band = Math.floor((p.y + 1) / step);
    const baseY = band * step;
    assert.ok(p.x >= 0 && p.x + p.w <= SHEET_W + 1, `x ${p.x}+${p.w} off board width ${SHEET_W}`);
    assert.ok(p.y >= baseY - 1 && p.y + p.h <= baseY + SHEET_H + 1, `part y ${p.y}+${p.h} off board band ${baseY}+${SHEET_H}`);
  }
  assert.ok(sheetCount >= 2, 'a 2100mm wardrobe must span multiple boards');
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

test('throws (does not emit an impossible file) when a single part exceeds any stock board', () => {
  // side panel = depth(3000) x height(2900); neither orientation fits the
  // jumbo 2745x1830 board -> genuinely impossible for one board.
  assert.throws(
    () => generateCNCCutPlan({ widthMm: 900, depthMm: 3000, heightMm: 2900, numShelves: 0 }),
    /cannot fit on any/
  );
});

test('single-shutter module emits one DOOR (not DOOR_L/DOOR_R)', () => {
  const { parts } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100, shutterType: 'single', numShelves: 0 });
  assert.ok(parts.includes('DOOR') && !parts.includes('DOOR_L'), 'single shutter should yield a single DOOR part');
});

// Axes-aligned rectangle overlap test (core nesting invariant).
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function bandOf(y, step) { return Math.floor((y + 1) / step); }

test('FFDH nesting: no two parts overlap within the same board (critical invariant)', () => {
  const { dxf, sheet } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100, numShelves: 4 });
  const { entities } = parseDXF(dxf);
  const SHEET_H = sheet.h, step = SHEET_H + 60;
  const rects = entities
    .filter(e => e.type === 'LWPOLYLINE' || e.type === 'LINE')
    .map(e => ({ x: e.x, y: e.y, w: e.w || 0, h: e.h || 0, band: bandOf(e.y, step) }))
    .filter(r => r.w > 0 && r.h > 0);
  const parts = rects.filter(r => !(r.x === 0 && r.w === sheet.w && r.h === SHEET_H && r.band === 0 || (r.y % step === 0 && r.w === sheet.w)));
  // group by board band and check pairwise overlap only within a band
  const byBand = {};
  for (const p of parts) (byBand[p.band] ||= []).push(p);
  for (const band of Object.keys(byBand)) {
    const ps = byBand[band];
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        assert.ok(!overlaps(ps[i], ps[j]),
          `parts overlap on board ${band}: ${JSON.stringify(ps[i])} vs ${JSON.stringify(ps[j])}`);
      }
    }
  }
});

test('cutlist summarises qty per part/material', () => {
  const { cutlist } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100, numShelves: 2 });
  const sides = cutlist.find(c => c.name === 'L_SIDE');
  assert.ok(sides, 'cutlist should contain L_SIDE');
  assert.equal(sides.qty, 1);
  assert.equal(sides.material, 'carcass');
  const shelves = cutlist.filter(c => c.name.startsWith('SHELF_'));
  assert.equal(shelves.reduce((s, c) => s + c.qty, 0), 2, 'two shelves expected');
});

test('parts span multiple boards for a tall wardrobe', () => {
  const { sheetCount, parts } = generateCNCCutPlan({ widthMm: 900, depthMm: 560, heightMm: 2100, numShelves: 5 });
  assert.ok(sheetCount >= 2, `expected >=2 boards, got ${sheetCount}`);
  assert.ok(parts.length >= 9, 'expected full part set across boards');
});

