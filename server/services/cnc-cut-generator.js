/**
 * cnc-cut-generator.js
 * --------------------------------------------------------------------------
 * Generates machine-ready CNC router cut plans (DXF) for a cabinet module.
 * Layered for Biesse / Homag / WoodWOP style controllers:
 *   - CNC_OUTLINE : through-cut (part perimeter)
 *   - CNC_DRILL   : through-bores (shelf pin rows, hinge cups)
 *   - CNC_POCKET  : dados / back-panel grooves (blind pockets)
 *   - CNC_ENGRAVE : part label + number (engraved, not cut)
 *
 * NESTING: uses Shelf First-Fit-Decreasing-Height packing. A real wardrobe
 * (e.g. 2100mm tall) cannot physically fit on a single 8x4 / 9x6 board — the
 * side panels alone span >2 board widths. So parts are nested across as many
 * boards as needed; each board is drawn as its own frame in the same DXF
 * (stacked vertically, standard CAM multi-board convention) and reported in
 * `sheets[]`. A hard error is thrown ONLY when a single part cannot fit any
 * stock board (genuinely impossible module).
 *
 * Pure + dependency-free (only the DXF class) => unit-testable.
 */

import { DXF } from './dxf-writer.js';

const EDGE_MARGIN = 20;   // keep parts away from the sheet edge
const CLEARANCE = 30;     // router-bit clearance between parts
const SHEET_GAP = 60;     // vertical gap between stacked boards in the DXF

export function generateCNCCutPlan(moduleData = {}) {
  const width = Number(moduleData.widthMm) || 900;
  const depth = Number(moduleData.depthMm) || 560;
  const height = Number(moduleData.heightMm) || 2100;
  const ply = Number(moduleData.plyMm) || 18;
  const backPly = Number(moduleData.backPlyMm) || 6;
  const numShelves = Number(moduleData.numShelves) || 2;
  const shutterType = moduleData.shutterType || 'double'; // 'single' | 'double' | 'none'
  const drillDia = 5; // shelf-pin / hinge bore diameter (mm)

  // Board stock. A standard 8x4 (2440x1220) sheet can't hold a 2100mm-tall
  // side panel laid flat, so for tall carcasses we step up to a JUMBO 9x6
  // (2745x1830) board — what real Indian workshops stock for wardrobe panels.
  const maxDim = Math.max(width, height, depth);
  const SHEET_W = maxDim > 1220 ? 2745 : 2440;
  const SHEET_H = maxDim > 1220 ? 1830 : 1220;
  const stock = maxDim > 1220 ? 'jumbo-9x6' : 'std-8x4';

  // ---- Part list (each with a material type for the cutlist) ----
  const parts = [];
  parts.push({ name: 'L_SIDE', w: depth, h: height, mat: 'carcass' });
  parts.push({ name: 'R_SIDE', w: depth, h: height, mat: 'carcass' });
  parts.push({ name: 'TOP', w: width - ply * 2, h: depth, mat: 'carcass' });
  parts.push({ name: 'BOTTOM', w: width - ply * 2, h: depth, mat: 'carcass' });
  parts.push({ name: 'BACK', w: width - ply * 2, h: height - ply * 2, mat: 'back' });
  for (let i = 1; i <= numShelves; i++) {
    parts.push({ name: `SHELF_${i}`, w: width - ply * 2, h: depth - 40, mat: 'carcass' });
  }
  const doorH = height - (moduleData.plinthH || 100);
  if (shutterType === 'double') {
    const dw = (width - 6) / 2;
    parts.push({ name: 'DOOR_L', w: dw, h: doorH, mat: 'shutter' });
    parts.push({ name: 'DOOR_R', w: dw, h: doorH, mat: 'shutter' });
  } else if (shutterType === 'single') {
    parts.push({ name: 'DOOR', w: width - 6, h: doorH, mat: 'shutter' });
  }

  const fitsSheet = (ww, hh) => ww <= SHEET_W - EDGE_MARGIN - 0.5 && hh <= SHEET_H - EDGE_MARGIN - 0.5;
  // Validate each part can fit a single board at all (rotate-friendly).
  for (const part of parts) {
    const canFit = fitsSheet(part.w, part.h) || fitsSheet(part.h, part.w);
    if (!canFit) {
      throw new Error(
        `Part "${part.name}" (${Math.round(part.w)}x${Math.round(part.h)}mm) cannot fit on any ${stock} board. ` +
        `Reduce module dimensions or split the part.`
      );
    }
  }

  const dxf = new DXF();
  const placed = [];
  const sheets = []; // [{ index, baseY, parts: [] }]

  // Packing cursor (absolute model-space coordinates).
  let sheetIndex = 0;
  let baseY = 0;                 // top of the current board in model space
  let cursorX = EDGE_MARGIN;
  let rowY = EDGE_MARGIN;        // relative to baseY
  let rowMaxH = 0;

  const newSheet = () => {
    // board frame (engraved legend lives on the first board only)
    dxf.rect(0, baseY, SHEET_W, SHEET_H, 'CNC_OUTLINE');
    if (sheetIndex === 0) {
      dxf.text(SHEET_W / 2, baseY + SHEET_H - 40, `CNC CUT PLAN  ${Math.round(width)}x${Math.round(height)}x${Math.round(depth)}mm`, 36, 'CNC_ENGRAVE');
      dxf.text(40, baseY + 40, 'LAYERS: OUTLINE=cut  DRILL=bore  POCKET=dado  ENGRAVE=label', 24, 'CNC_ENGRAVE');
    } else {
      dxf.text(40, baseY + 40, `BOARD ${sheetIndex + 1}  (${stock})`, 24, 'CNC_ENGRAVE');
    }
    sheets.push({ index: sheetIndex, baseY, parts: [] });
  };

  newSheet();

  // FFDH: sort by height desc so tallest panels define each row.
  const order = parts.slice().sort((a, b) => b.h - a.h);
  for (const part of order) {
    let pw = part.w, ph = part.h;
    if (!fitsSheet(pw, ph) && fitsSheet(ph, pw)) { [pw, ph] = [ph, pw]; }

    // Wrap to next row if it doesn't fit horizontally on the current board.
    if (cursorX + pw > SHEET_W - EDGE_MARGIN) {
      cursorX = EDGE_MARGIN;
      rowY += rowMaxH + CLEARANCE;
      rowMaxH = 0;
    }
    // If the current row would run off the bottom of this board, open a new board.
    if (rowY + ph > SHEET_H - EDGE_MARGIN) {
      baseY += SHEET_H + SHEET_GAP;
      sheetIndex += 1;
      cursorX = EDGE_MARGIN;
      rowY = EDGE_MARGIN;
      rowMaxH = 0;
      newSheet();
    }

    const px = cursorX;
    const py = baseY + rowY;

    dxf.poly([
      [px, py],
      [px + pw, py],
      [px + pw, py + ph],
      [px, py + ph]
    ], 'CNC_OUTLINE', true);
    dxf.text(px + pw / 2, py + ph / 2, `${part.name}`, 30, 'CNC_ENGRAVE');

    const rec = { name: part.name, x: px, y: py, w: pw, h: ph, mat: part.mat, sheet: sheetIndex };
    placed.push(rec);
    sheets[sheetIndex].parts.push(part.name);

    cursorX += pw + CLEARANCE;
    rowMaxH = Math.max(rowMaxH, ph);
  }

  // Shelf-pin bores + back dado on the side panels.
  const drillSidePanel = (origin) => {
    const { x: px, y: py, w, h } = origin;
    for (let z = py + 150; z < py + h - 150; z += 128) {
      dxf.circle(px + 50, z, drillDia / 2, 'CNC_DRILL');
      dxf.circle(px + w - 50, z, drillDia / 2, 'CNC_DRILL');
    }
  };
  for (const p of placed.filter(p => p.name === 'L_SIDE' || p.name === 'R_SIDE')) {
    drillSidePanel(p);
    dxf.rect(p.x + 12, p.y, Math.min(8, p.w), p.h, 'CNC_POCKET');
  }

  // Cutlist summary (qty per part type + material) for downstream export.
  const cutlist = [];
  const byName = {};
  for (const p of placed) {
    const key = `${p.name}|${p.mat}`;
    if (!byName[key]) byName[key] = { name: p.name, material: p.mat, qty: 0, w: Math.round(p.w), h: Math.round(p.h) };
    byName[key].qty += 1;
  }
  for (const k of Object.keys(byName)) cutlist.push(byName[k]);

  const content = dxf.toString();
  return {
    dxf: content,
    sheet: { w: SHEET_W, h: SHEET_H, stock },
    sheetCount: sheets.length,
    sheets: sheets.map(s => ({ index: s.index, parts: s.parts })),
    placed,
    parts: placed.map(p => p.name),
    partCount: placed.length,
    cutlist
  };
}
