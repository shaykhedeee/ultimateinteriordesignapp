// Regression tests for production-import-service.js — the cutlist import pipeline.
// Exercises the CSV parser end-to-end via a temp file (no Excel dependency).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'node:path';
import { parseProductionCsv } from '../server/services/production-import-service.js';

const CSV = `Name,Length,Width,Quantity,Material,Can Rotate (https://feature-panel-rotation.maxcutsoftware.com),Edging Length 1,Edging Length 2,Edging Width 1,Edging Width 2,Notes
Kitchen Base S/P,2100,560,2,BWP 18MM,1,2mm PVC,2mm PVC,2mm PVC,2mm PVC,left side panel
Kitchen Base BOT,864,560,1,BWP 18MM,0,2mm PVC,,,,bottom panel
Wardrobe L/S,2400,600,2,HDHMR 18MM,2,,,,,,,left side
Shoe Rack FRONT,400,300,1,MR 12MM,,,,, ,front shutter
`;

function writeTempCsv() {
  const f = path.join(os.tmpdir(), `ultida-import-${Date.now()}.csv`);
  fs.writeFileSync(f, CSV, 'utf8');
  return f;
}

test('parseProductionCsv: parses rows into parts with inferred modules', () => {
  const f = writeTempCsv();
  try {
    const result = parseProductionCsv(f);
    assert.ok(result.parts.length >= 4, `expected >=4 parts, got ${result.parts.length}`);
    assert.ok(result.modules.length >= 1, 'should infer at least one module');
    // summary math
    assert.equal(result.summary.partRowCount, result.parts.length);
    assert.ok(result.summary.totalPanelQuantity >= 6, 'total quantity should sum parts');
  } finally {
    fs.unlinkSync(f);
  }
});

test('parseProductionCsv: dimensions, board, thickness derived from material string', () => {
  const f = writeTempCsv();
  try {
    const result = parseProductionCsv(f);
    const side = result.parts.find(p => p.name.includes('S/P'));
    assert.equal(side.lengthMm, 2100);
    assert.equal(side.widthMm, 560);
    assert.equal(side.quantity, 2);
    assert.equal(side.board, 'BWP plywood');
    assert.equal(side.thicknessMm, 18);
    const hdhmr = result.parts.find(p => p.material.includes('HDHMR'));
    assert.equal(hdhmr.board, 'HDHMR');
  } finally {
    fs.unlinkSync(f);
  }
});

test('parseProductionCsv: material area rollup is correct (length*width*qty / 1e6 m^2)', () => {
  const f = writeTempCsv();
  try {
    const result = parseProductionCsv(f);
    const mat = result.materials.find(m => m.material.includes('BWP'));
    // two BWP parts: 2100*560*2 + 864*560*1 = 2,352,000 + 483,840 = 2,835,840 mm^2 = 2.836 m^2
    assert.ok(Math.abs(mat.areaSqM - 2.836) < 0.01, `area ${mat.areaSqM} expected ~2.836`);
  } finally {
    fs.unlinkSync(f);
  }
});

test('parseProductionCsv: edge-band meters summed from part perimeters', () => {
  const f = writeTempCsv();
  try {
    const result = parseProductionCsv(f);
    const band = result.edgeBands.find(e => e.edgeBand && e.edgeBand.includes('2mm PVC'));
    assert.ok(band && band.uses >= 2, '2mm PVC edge should be counted');
    assert.ok(band.approximateMeters > 0, 'edge meters should be positive');
  } finally {
    fs.unlinkSync(f);
  }
});

test('parseProductionCsv: oversize / missing-edge quality findings are produced', () => {
  const f = writeTempCsv();
  try {
    const result = parseProductionCsv(f);
    assert.ok(Array.isArray(result.qualityFindings) && result.qualityFindings.length > 0);
  } finally {
    fs.unlinkSync(f);
  }
});
