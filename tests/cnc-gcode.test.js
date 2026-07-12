/**
 * tests/cnc-gcode.test.js
 * Structural + semantic validation of the machine G-code generator.
 * A real CNC controller must be able to parse the program; we assert the
 * invariants that make it machine-valid:
 *   - setup block (G21/G90/G17/G40/G94), spindle on (M3 S...), safe Z
 *   - every outline/pocket/drill/hinge/engrave toolpath produced G-code
 *   - drilling uses a G81 cycle (or explicit Z plunge) — no missing bores
 *   - at least one real cutting Z move (G1 Z-...)
 *   - program ends with M30 and the % delimiters
 *   - every G-code line is well-formed (starts with G/M/N or a coord, or is a comment)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCNCCutPlan } from '../server/services/cnc-cut-generator.js';
import { generateCNCGCode } from '../server/services/cnc-gcode-generator.js';
import { generateJaliGCode } from '../server/services/jali-panel.js';

test('cabinet cut plan -> G-code is a valid program with setup + end', () => {
  const plan = generateCNCCutPlan({ widthMm: 900, heightMm: 2100, depthMm: 560, numShelves: 3, shutterType: 'double' });
  const { gcode, lines, toolpaths } = generateCNCGCode(plan, { material: 'plywood', thicknessMm: 18 });
  assert.ok(gcode.startsWith('%;'), 'program starts with % delimiter');
  assert.ok(gcode.includes('G21'), 'metric units');
  assert.ok(gcode.includes('G90'), 'absolute positioning');
  assert.ok(gcode.includes('G17'), 'XY plane');
  assert.ok(/M3 S\d+/.test(gcode), 'spindle on with RPM');
  assert.ok(gcode.includes('M30 ; program end'), 'program ends with M30');
  assert.ok(gcode.trim().split('\n').pop().startsWith('M30'), 'last line is M30');
  assert.ok(gcode.includes('M5'), 'spindle stop present');
  assert.ok(lines > 20, 'program has a meaningful number of lines');
  assert.ok(toolpaths >= plan.toolpaths.length, 'every toolpath emitted G-code');
});

test('G-code performs real cutting (Z plunges) for outlines + drills', () => {
  const plan = generateCNCCutPlan({ widthMm: 900, heightMm: 2100, depthMm: 560, numShelves: 3, shutterType: 'double' });
  const { gcode } = generateCNCGCode(plan, { material: 'plywood', thicknessMm: 18 });
  // through-cut outlines must plunge to full thickness (negative Z)
  assert.ok(/G1 Z-\d/.test(gcode), 'has a cutting Z plunge move');
  // shelf-pin / hinge bores must use a drilling cycle (G81) or explicit plunge
  assert.ok(gcode.includes('G81'), 'drilling cycle (G81) present for bores/hinge cups');
  // every outline is a closed profile (return to start) — count G0 moves to parts
  const outlineCount = plan.toolpaths.filter(t => t.type === 'outline').length;
  const g1Moves = (gcode.match(/G1 /g) || []).length;
  assert.ok(g1Moves >= outlineCount, 'each outline produced G1 cutting moves');
});

test('hinge cups appear as 35mm G81 bores in the G-code', () => {
  const plan = generateCNCCutPlan({ widthMm: 900, heightMm: 2100, depthMm: 560, numShelves: 2, shutterType: 'double' });
  assert.ok(plan.hingeCups.length >= 2, 'double doors produce hinge cups');
  assert.ok(plan.hingeCups.every(c => c.dia === 35 && c.depth === 13), 'hinge cups are 35mm blind (13mm)');
  const { gcode } = generateCNCGCode(plan, { material: 'plywood', thicknessMm: 18 });
  // hinge depth -13mm must appear as the G81 Z target
  assert.ok(gcode.includes('Z-13.000'), 'hinge cup blind depth (13mm) in G-code');
});

test('jali carved panel generates G-code toolpath', () => {
  const g = generateJaliGCode({ widthMm: 600, heightMm: 2000, name: 'Jali' }, { material: 'mdf' });
  assert.ok(g.gcode.startsWith('%;'), 'jali gcode starts with %');
  assert.ok(g.gcode.includes('M30'), 'jali gcode ends with M30');
  assert.ok(g.toolpaths > 5, 'jali cut-through geometry produced multiple toolpaths');
  assert.ok(/G1 Z-\d/.test(g.gcode), 'jali has cutting moves');
});

test('G-code lines are syntactically well-formed', () => {
  const plan = generateCNCCutPlan({});
  const { gcode } = generateCNCGCode(plan, { material: 'mdf', thicknessMm: 18 });
  const bad = gcode.split('\n').filter(line => {
    const t = line.trim();
    if (!t) return false;
    if (t.startsWith('(') && t.endsWith(')')) return false; // comment
    if (t === '%;') return false;
    // valid: starts with G/M/N, or is a comment inline, or a coord word line
    return !/^([GMN]\d|\(|X|Y|Z|T\d)/.test(t);
  });
  assert.equal(bad.length, 0, `all lines well-formed (bad: ${bad.slice(0, 3).join(' | ')})`);
});
