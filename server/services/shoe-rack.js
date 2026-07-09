/**
 * shoe-rack.js  — Parametric shoe / entryway cabinet (tall unit + bench)
 * -----------------------------------------------------------------------
 * Built from the reference photo: LEFT = tall cabinet (upper double-door
 * cupboard + 3 open shoe shelves, floating on an LED-lit plinth); RIGHT =
 * low bench (drawer + open shoe shelf).
 *
 * Everything is parametric against INDIAN RESIDENTIAL STANDARD dimensions:
 *   - tall unit height 2000 (opt 1800–2400)
 *   - bench/console height 450 (opt 380–600)
 *   - depth 400 (opt 300–600)
 *   - carcase 18mm MR ply, shutters 18mm (lacquer / laminate)
 *   - plinth recess 100 with 3000K LED strip (toggle)
 *
 * Returns AutoCAD-valid DXF (elevation + plan + section on one sheet) and a
 * detailed multi-view PDF. Reuses the validated DXF writer primitives.
 */
import PDFDocument from 'pdfkit';
import dxfWriter from './dxf-writer.js';
const { DXF } = dxfWriter;

const clamp = (v, lo, hi, d) => {
  v = Number(v);
  if (!Number.isFinite(v)) return d;
  return Math.max(lo, Math.min(hi, v));
};

export const SHOE_RACK_DEFAULTS = {
  tallWidth: 1200,
  benchWidth: 900,
  totalHeight: 2000,
  benchHeight: 450,
  depth: 400,
  carcassThk: 18,
  topCabH: 700,        // upper double-door cupboard height
  shoeShelves: 3,      // open shelves in tall unit below the cupboard
  drawerH: 200,        // bench drawer height
  plinthH: 100,        // recessed floating gap
  led: true,
  handleStyle: 'bar',  // 'bar' | 'knob' | 'none'
  carcassFinish: 'MR PLYWOOD (18mm)',
  shutterFinish: 'LACQUER / LAMINATE (18mm)',
  sheet: 'SHOE RACK — ENTRY',
  projectId: 'RESIDENTIAL',
  client: 'Residential',
};

const FINISH_CALLOUT = (s) => `Carcass: MR Plywood 18mm\nShutters: ${s}`;

/**
 * Build a model usable by buildElevationDXF (for reuse / combined sheets).
 */
export function shoeRackModel(opts = {}) {
  const o = { ...SHOE_RACK_DEFAULTS, ...opts };
  for (const k of Object.keys(SHOE_RACK_DEFAULTS)) {
    if (o[k] === undefined || o[k] === null || (typeof o[k] === 'number' && Number.isNaN(o[k]))) o[k] = SHOE_RACK_DEFAULTS[k];
  }
  if (typeof o.led !== 'boolean') o.led = SHOE_RACK_DEFAULTS.led;
  if (!['bar', 'knob', 'none'].includes(o.handleStyle)) o.handleStyle = 'bar';
  for (const k of Object.keys(SHOE_RACK_DEFAULTS)) {
    if (o[k] === undefined || o[k] === null || (typeof o[k] === 'number' && Number.isNaN(o[k]))) o[k] = SHOE_RACK_DEFAULTS[k];
  }
  if (typeof o.led !== 'boolean') o.led = SHOE_RACK_DEFAULTS.led;
  if (!['bar', 'knob', 'none'].includes(o.handleStyle)) o.handleStyle = 'bar';
  const T = o.carcassThk;
  const totalW = o.tallWidth + o.benchWidth;
  const shoeBayH = o.totalHeight - o.topCabH - o.plinthH;
  const cabinets = [
    // tall carcase
    { xOffsetMm: 0, zOffsetMm: o.plinthH, widthMm: o.tallWidth, heightMm: o.totalHeight - o.plinthH, tag: 'CARCASS', name: 'Tall Carcass', material: { callout: FINISH_CALLOUT(o.shutterFinish) } },
    // upper cupboard doors
    { xOffsetMm: 0, zOffsetMm: o.totalHeight - o.topCabH, widthMm: o.tallWidth / 2, heightMm: o.topCabH, tag: 'SHUTTER', name: 'Cupboard L', material: { callout: o.shutterFinish } },
    { xOffsetMm: o.tallWidth / 2, zOffsetMm: o.totalHeight - o.topCabH, widthMm: o.tallWidth / 2, heightMm: o.topCabH, tag: 'SHUTTER', name: 'Cupboard R', material: { callout: o.shutterFinish } },
    // bench carcase
    { xOffsetMm: o.tallWidth, zOffsetMm: 0, widthMm: o.benchWidth, heightMm: o.benchHeight, tag: 'CARCASS', name: 'Bench Carcass', material: { callout: FINISH_CALLOUT(o.shutterFinish) } },
    // bench drawer
    { xOffsetMm: o.tallWidth, zOffsetMm: o.benchHeight - o.drawerH, widthMm: o.benchWidth, heightMm: o.drawerH, tag: 'DRAWER', name: 'Bench Drawer', material: { callout: o.shutterFinish } },
  ];
  // open shoe shelves as pockets
  const sh = shoeBayH / Math.max(1, o.shoeShelves);
  for (let i = 0; i < o.shoeShelves; i++) {
    cabinets.push({ xOffsetMm: T, zOffsetMm: o.plinthH + i * sh + 8, widthMm: o.tallWidth - 2 * T, heightMm: sh - 16, tag: 'OPEN', name: `Shoe Shelf ${i + 1}`, material: { callout: 'Open Shelf' } });
  }
  // bench open shelf
  cabinets.push({ xOffsetMm: o.tallWidth + T, zOffsetMm: 8, widthMm: o.benchWidth - 2 * T, heightMm: o.benchHeight - o.drawerH - 16, tag: 'OPEN', name: 'Bench Shoe Shelf', material: { callout: 'Open Shelf' } });
  return {
    projectId: o.projectId, wallName: o.sheet, lengthMm: totalW, heightMm: o.totalHeight,
    thicknessMm: T, coverage: { utilizationPct: 0, usedMm: 0, freeMm: 0 }, cabinets, openings: [],
  };
}

function drawHandle(dxf, style, x, y, w, h) {
  if (style === 'none') return;
  if (style === 'knob') {
    dxf.circle(x, y, 25, 'HARDWARE');
    return;
  }
  // bar handle (vertical if w<h else horizontal)
  if (h >= w) dxf.rect(x - 18, y, 36, h, 'HARDWARE');
  else dxf.rect(x, y - 18, w, 36, 'HARDWARE');
}

/**
 * Build AutoCAD-valid DXF (elevation + plan + section on one A-size sheet).
 */
export function buildShoeRackDXF(opts = {}) {
  const o = { ...SHOE_RACK_DEFAULTS, ...opts };
  for (const k of Object.keys(SHOE_RACK_DEFAULTS)) {
    if (o[k] === undefined || o[k] === null || (typeof o[k] === 'number' && Number.isNaN(o[k]))) o[k] = SHOE_RACK_DEFAULTS[k];
  }
  if (typeof o.led !== 'boolean') o.led = SHOE_RACK_DEFAULTS.led;
  if (!['bar', 'knob', 'none'].includes(o.handleStyle)) o.handleStyle = 'bar';
  const T = o.carcassThk;
  const totalW = o.tallWidth + o.benchWidth;
  const shoeBayH = o.totalHeight - o.topCabH - o.plinthH;
  const dxf = new DXF();
  const M = 1500;

  // ---- ELEVATION ----
  const x0 = M, y0 = M;
  const xTallEnd = x0 + o.tallWidth;
  const xBenchEnd = xTallEnd + o.benchWidth;

  // outer carcase outline (tall + bench)
  dxf.rect(x0, y0, o.tallWidth, o.totalHeight, 'WALL_OUTLINE');
  dxf.rect(xTallEnd, y0, o.benchWidth, o.benchHeight, 'WALL_OUTLINE');
  // recessed plinth (floating gap) — draw gap + LED
  dxf.rect(x0 + T, y0, o.tallWidth - 2 * T, o.plinthH, 'CABINETRY');
  dxf.rect(xTallEnd + T, y0, o.benchWidth - 2 * T, o.benchHeight - 8, 'CABINETRY');
  // upper cupboard doors
  const cupY = y0 + o.totalHeight - o.topCabH;
  dxf.rect(x0, cupY, o.tallWidth / 2, o.topCabH, 'SHUTTER');
  dxf.rect(x0 + o.tallWidth / 2, cupY, o.tallWidth / 2, o.topCabH, 'SHUTTER');
  dxf.line(x0 + o.tallWidth / 2, cupY, x0 + o.tallWidth / 2, cupY + o.topCabH, 'SHUTTER'); // centre stile
  drawHandle(dxf, o.handleStyle, x0 + o.tallWidth / 4, cupY + o.topCabH / 2 - 150, 0, 300);
  drawHandle(dxf, o.handleStyle, x0 + 3 * o.tallWidth / 4, cupY + o.topCabH / 2 - 150, 0, 300);
  // open shoe shelves (horizontal planks)
  const sh = shoeBayH / Math.max(1, o.shoeShelves);
  for (let i = 0; i < o.shoeShelves; i++) {
    const sy = y0 + o.plinthH + i * sh;
    dxf.line(x0 + T, sy, xTallEnd - T, sy, 'CABINETRY');
    dxf.text(x0 + T + 40, sy + 30, `SHOE SHELF ${i + 1}`, 120, 'ANNOTATIONS');
  }
  dxf.text(x0 + 10, cupY + 20, 'UPPER CUPBOARD (DOORS)', 120, 'ANNOTATIONS');
  // bench drawer
  const drY = y0 + o.benchHeight - o.drawerH;
  dxf.rect(xTallEnd, drY, o.benchWidth, o.drawerH, 'DRAWER');
  drawHandle(dxf, o.handleStyle, xTallEnd + o.benchWidth / 2 - 150, drY + o.drawerH / 2, 300, 0);
  dxf.text(xTallEnd + 10, drY + 20, 'DRAWER', 120, 'ANNOTATIONS');
  // bench open shelf
  dxf.line(xTallEnd + T, y0 + 8, xBenchEnd - T, y0 + 8, 'CABINETRY');
  dxf.text(xTallEnd + 10, y0 + 30, 'OPEN SHOE SHELF', 120, 'ANNOTATIONS');
  // LED strip under plinth
  if (o.led) {
    dxf.line(x0 + T, y0 + o.plinthH, xTallEnd - T, y0 + o.plinthH, 'HARDWARE');
    dxf.line(xTallEnd + T, y0 + o.benchHeight - 8, xBenchEnd - T, y0 + o.benchHeight - 8, 'HARDWARE');
    dxf.text(x0 + T, y0 + o.plinthH + 30, 'LED 3000K STRIP', 120, 'HARDWARE');
  }
  // dimensions
  dxf.dimH(x0, xBenchEnd, y0 - 600, y0, `W ${totalW}`, true);
  dxf.dimV(xBenchEnd + 600, y0, y0 + o.totalHeight, xBenchEnd, `H ${o.totalHeight}`, true);
  dxf.dimV(x0 - 600, y0, y0 + o.benchHeight, x0, `BENCH ${o.benchHeight}`, false);
  dxf.text(x0, y0 - 1100, `FINISH — CARCASS: ${o.carcassFinish} | SHUTTER: ${o.shutterFinish}`, 110, 'ANNOTATIONS');

  // ---- PLAN VIEW (top, below elevation) ----
  const py = y0 + o.totalHeight + 2500;
  dxf.rect(x0, py, totalW, o.depth, 'WALL_OUTLINE');
  dxf.line(x0 + o.tallWidth, py, x0 + o.tallWidth, py + o.depth, 'CABINETRY'); // tall/bench divider
  dxf.line(x0 + o.tallWidth / 2, py, x0 + o.tallWidth / 2, py + o.depth, 'SHUTTER'); // door split
  dxf.line(xTallEnd, py + o.depth - o.drawerH, xBenchEnd, py + o.depth - o.drawerH, 'DRAWER'); // drawer front
  dxf.text(x0, py + o.depth + 120, `PLAN — DEPTH ${o.depth}`, 120, 'ANNOTATIONS');

  // ---- SECTION (right of elevation, vertical cut) ----
  const sx = xBenchEnd + 2500;
  dxf.rect(sx, y0, o.depth, o.totalHeight, 'WALL_OUTLINE');
  dxf.line(sx + T, y0, sx + T, y0 + o.totalHeight, 'CABINETRY');
  dxf.line(sx + o.depth - T, y0, sx + o.depth - T, y0 + o.totalHeight, 'CABINETRY');
  dxf.line(sx, y0 + o.plinthH + o.topCabH, sx + o.depth, y0 + o.plinthH + o.topCabH, 'CABINETRY'); // cupboard floor
  if (o.led) dxf.line(sx, y0 + o.plinthH, sx + o.depth, y0 + o.plinthH, 'HARDWARE');
  dxf.dimH(sx, sx + o.depth, y0 - 600, y0, `D ${o.depth}`, true);
  dxf.text(sx, y0 - 1100, 'SECTION A-A', 120, 'ANNOTATIONS');

  dxf.drawTitleBlock(M, y0 - 1700, 6200, 1500, { projectId: o.projectId, sheet: o.sheet, scale: '1:20', rev: '1.0' });
  return dxf.toString();
}

/**
 * Build a detailed multi-view PDF (elevation + plan + section).
 */
export function buildShoeRackPDF(opts = {}) {
  const o = { ...SHOE_RACK_DEFAULTS, ...opts };
  for (const k of Object.keys(SHOE_RACK_DEFAULTS)) {
    if (o[k] === undefined || o[k] === null || (typeof o[k] === 'number' && Number.isNaN(o[k]))) o[k] = SHOE_RACK_DEFAULTS[k];
  }
  if (typeof o.led !== 'boolean') o.led = SHOE_RACK_DEFAULTS.led;
  if (!['bar', 'knob', 'none'].includes(o.handleStyle)) o.handleStyle = 'bar';
  const T = o.carcassThk;
  const totalW = o.tallWidth + o.benchWidth;
  const shoeBayH = o.totalHeight - o.topCabH - o.plinthH;
  const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 40 });
  const chunks = [];
  doc.on('data', c => chunks.push(c));
  const BLK = '#111111', BLUE = '#1F3A5F', GREY = '#888888', GOLD = '#C9A227';

  const X = 90, Y = 120, sc = 0.30; // mm -> pt
  const px = mm => X + mm * sc, py = mm => Y + (o.totalHeight - mm) * sc;

  // elevation
  doc.lineWidth(1.4).strokeColor(BLK);
  doc.rect(px(0), py(o.totalHeight), o.tallWidth * sc, o.totalHeight * sc).stroke();
  doc.rect(px(o.tallWidth), py(o.benchHeight), o.benchWidth * sc, o.benchHeight * sc).stroke();
  doc.lineWidth(0.6).strokeColor(GREY);
  doc.rect(px(T), py(o.plinthH), (o.tallWidth - 2 * T) * sc, (o.plinthH) * sc).stroke();
  // cupboard doors
  doc.lineWidth(1).strokeColor(BLK);
  doc.rect(px(0), py(o.totalHeight), (o.tallWidth / 2) * sc, o.topCabH * sc).stroke();
  doc.rect(px(o.tallWidth / 2), py(o.totalHeight), (o.tallWidth / 2) * sc, o.topCabH * sc).stroke();
  // shoe shelves
  const sh = shoeBayH / o.shoeShelves;
  doc.lineWidth(2).strokeColor(BLUE);
  for (let i = 0; i < o.shoeShelves; i++) {
    const sy = o.plinthH + i * sh;
    doc.moveTo(px(T), py(sy)).lineTo(px(o.tallWidth - T), py(sy)).stroke();
  }
  // bench drawer
  doc.lineWidth(1).strokeColor(BLK);
  const drY = o.benchHeight - o.drawerH;
  doc.rect(px(o.tallWidth), py(o.benchHeight), o.benchWidth * sc, o.drawerH * sc).stroke();
  // LED
  if (o.led) {
    doc.lineWidth(2).strokeColor(GOLD).dash(3, 2);
    doc.moveTo(px(T), py(o.plinthH)).lineTo(px(o.tallWidth - T), py(o.plinthH)).stroke();
    doc.undash();
  }
  // section (right)
  const SX = X + (totalW + 700) * sc;
  doc.lineWidth(1.2).strokeColor(BLK);
  doc.rect(SX, py(o.totalHeight), o.depth * sc, o.totalHeight * sc).stroke();
  doc.lineWidth(0.6).strokeColor(GREY);
  doc.moveTo(SX + T * sc, py(0)).lineTo(SX + T * sc, py(o.totalHeight)).stroke();
  doc.moveTo(SX + (o.depth - T) * sc, py(0)).lineTo(SX + (o.depth - T) * sc, py(o.totalHeight)).stroke();
  if (o.led) { doc.lineWidth(2).strokeColor(GOLD).dash(3, 2).moveTo(SX, py(o.plinthH)).lineTo(SX + o.depth * sc, py(o.plinthH)).stroke(); doc.undash(); }

  // dimension lines (elevation overall)
  doc.lineWidth(0.6).strokeColor(BLUE);
  doc.moveTo(px(0), py(o.totalHeight) - 26).lineTo(px(totalW), py(o.totalHeight) - 26).stroke();
  doc.fontSize(9).fillColor(BLUE).text(`O/A W ${totalW}  H ${o.totalHeight}  D ${o.depth}`, px(0), py(o.totalHeight) - 40);
  doc.fontSize(8).fillColor(BLK).text(`BENCH H ${o.benchHeight}   PLINTH ${o.plinthH}   SHELVES ${o.shoeShelves}`, px(0), py(o.totalHeight) - 56);

  // LEGEND / NOTES (right column)
  const lx = doc.page.width - 260, ly = 120;
  doc.lineWidth(1).strokeColor(BLUE).rect(lx, ly, 220, 250).stroke();
  doc.fontSize(10).fillColor(BLUE).text('NOTES / FINISH', lx + 8, ly + 6);
  doc.fontSize(8).fillColor(BLK);
  const notes = [
    '1. Carcass: MR Plywood 18mm',
    `2. Shutters: ${o.shutterFinish}`,
    `3. Handles: ${o.handleStyle.toUpperCase()}`,
    `4. LED: ${o.led ? '3000K strip under plinth' : 'NONE'}`,
    `5. Bench drawer: ${o.drawerH}mm`,
    '6. Standard Indian residential dims',
  ];
  notes.forEach((n, i) => doc.text(n, lx + 8, ly + 24 + i * 16));

  // title block
  const tbY = doc.page.height - 90;
  doc.lineWidth(1).strokeColor(BLUE).rect(40, tbY, 540, 70).stroke();
  doc.fontSize(8).fillColor(BLK)
    .text(`PROJECT: ${o.projectId}`, 48, tbY + 6)
    .text(`CLIENT: ${o.client}`, 48, tbY + 20)
    .text(`SHEET: ${o.sheet}   SCALE: 1:20   REV 1.0   ${new Date().toISOString().slice(0, 10)}`, 48, tbY + 36)
    .text('DRAWN: AURABRAIN', 48, tbY + 50);

  doc.end();
  return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
}
