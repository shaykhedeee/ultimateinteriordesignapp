/**
 * cnc-cut-generator.js
 * --------------------------------------------------------------------------
 * Generates machine-ready CNC router cut plans (DXF + G-code) for a cabinet
 * module. Layered for Biesse / Homag / WoodWOP style controllers:
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
 * The plan also returns a `toolpaths[]` array (geometry + layer + type) which
 * is consumed by cnc-gcode-generator.js to emit actual machine G-code — so the
 * DXF and the G-code are guaranteed to describe the SAME geometry.
 *
 * Pure + dependency-free (only the DXF class) => unit-testable.
 */

import { DXF } from './dxf-writer.js';

const EDGE_MARGIN = 20;   // keep parts away from the sheet edge
const CLEARANCE = 30;     // router-bit clearance between parts
const SHEET_GAP = 60;     // vertical gap between stacked boards in the DXF

// Standard European 35mm hinge cup inset (cup center sits this far from the
// door edge). Real cabinet hardware.
const HINGE_CUP_DIA = 35;
const HINGE_INSET = 22;        // cup center from the door's hinge edge
const HINGE_TOP = 120;         // first cup from top
const HINGE_BOTTOM = 120;      // last cup from bottom
const HINGE_SPACING = 700;     // max gap between consecutive cups

// Tool dictionary used by the G-code generator (kept here so a single source
// of truth describes which bit cuts which layer).
export const CNC_TOOLS = {
  outline: { id: 1, dia: 6, name: '6mm upcut spiral (through-cut)' },
  pocket:  { id: 2, dia: 6, name: '6mm upcut spiral (pocket/dado)' },
  drill:   { id: 3, dia: 5, name: '5mm brad-point (shelf pins)' },
  hinge:   { id: 4, dia: 35, name: '35mm hinge boring bit' },
  engrave: { id: 5, dia: 3, name: '3mm V-bit (label)' }
};

export function generateCNCCutPlan(moduleData = {}) {
  const width = Number(moduleData.widthMm) || 900;
  const depth = Number(moduleData.depthMm) || 560;
  const height = Number(moduleData.heightMm) || 2100;
  const ply = Number(moduleData.plyMm) || 18;
  const backPly = Number(moduleData.backPlyMm) || 6;
  const numShelves = Number(moduleData.numShelves) || 2;
  const shutterType = moduleData.shutterType || 'double'; // 'single' | 'double' | 'none'
  const plinthH = Number(moduleData.plinthH) || 100;
  const edgeBand = moduleData.edgeBanding !== false; // default: band exposed edges
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
  parts.push({ name: 'L_SIDE', w: depth, h: height, mat: 'carcass', band: ['front', 'back'] });
  parts.push({ name: 'R_SIDE', w: depth, h: height, mat: 'carcass', band: ['front', 'back'] });
  parts.push({ name: 'TOP', w: width - ply * 2, h: depth, mat: 'carcass', band: ['front', 'back'] });
  parts.push({ name: 'BOTTOM', w: width - ply * 2, h: depth, mat: 'carcass', band: ['front', 'back'] });
  parts.push({ name: 'BACK', w: width - ply * 2, h: height - ply * 2, mat: 'back', band: [] });
  for (let i = 1; i <= numShelves; i++) {
    parts.push({ name: `SHELF_${i}`, w: width - ply * 2, h: depth - 40, mat: 'carcass', band: ['front', 'back'] });
  }
  const doorH = height - plinthH;
  const doors = [];
  if (shutterType === 'double') {
    const dw = (width - 6) / 2;
    doors.push({ name: 'DOOR_L', w: dw, h: doorH, mat: 'shutter', band: ['vertical'] });
    doors.push({ name: 'DOOR_R', w: dw, h: doorH, mat: 'shutter', band: ['vertical'] });
  } else if (shutterType === 'single') {
    doors.push({ name: 'DOOR', w: width - 6, h: doorH, mat: 'shutter', band: ['vertical'] });
  }
  for (const d of doors) parts.push(d);

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
  const toolpaths = []; // geometry consumed by the G-code generator

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
    const corners = [
      [px, py],
      [px + pw, py],
      [px + pw, py + ph],
      [px, py + ph]
    ];
    dxf.poly(corners, 'CNC_OUTLINE', true);
    dxf.text(px + pw / 2, py + ph / 2, `${part.name}`, 30, 'CNC_ENGRAVE');

    // G-code geometry for the through-cut outline.
    toolpaths.push({
      type: 'outline',
      layer: 'CNC_OUTLINE',
      part: part.name,
      points: corners,
      tool: 'outline'
    });
    // Engraved part label for the G-code (shallow V-bit center mark).
    toolpaths.push({
      type: 'engrave',
      layer: 'CNC_ENGRAVE',
      part: part.name,
      x: px + pw / 2, y: py + ph / 2,
      text: part.name,
      tool: 'engrave'
    });

    const rec = {
      name: part.name, x: px, y: py, w: pw, h: ph, mat: part.mat,
      sheet: sheetIndex,
      banded: part.band && part.band.length > 0 ? part.band : (edgeBand ? ['none'] : [])
    };
    placed.push(rec);
    sheets[sheetIndex].parts.push(part.name);

    cursorX += pw + CLEARANCE;
    rowMaxH = Math.max(rowMaxH, ph);
  }

  // Shelf-pin bores on the side panels + back dado (groove).
  const sidePanels = placed.filter(p => p.name === 'L_SIDE' || p.name === 'R_SIDE');
  for (const side of sidePanels) {
    const { x: px, y: py, w, h } = side;
    const bores = [];
    for (let z = py + 150; z < py + h - 150; z += 128) {
      dxf.circle(px + 50, z, drillDia / 2, 'CNC_DRILL');
      dxf.circle(px + w - 50, z, drillDia / 2, 'CNC_DRILL');
      bores.push([px + 50, z], [px + w - 50, z]);
    }
    for (const [bx, by] of bores) {
      toolpaths.push({ type: 'drill', layer: 'CNC_DRILL', part: side.name, x: bx, y: by, dia: drillDia, tool: 'drill' });
    }
    // Back-panel dado (blind pocket near the rear of the side).
    const dadoX = px + w - 12;
    const dadoRect = [[dadoX, py + 40], [dadoX, py + h - 40], [dadoX + 8, py + h - 40], [dadoX + 8, py + 40]];
    dxf.rect(dadoX, py + 40, Math.min(8, w), h - 80, 'CNC_POCKET');
    toolpaths.push({ type: 'pocket', layer: 'CNC_POCKET', part: side.name, points: dadoRect, depth: backPly, tool: 'pocket' });
  }

  // Hinge cups (35mm) on the door(s) — real concealed-hinge boring.
  const hingeCups = [];
  for (const d of placed.filter(p => p.name.startsWith('DOOR'))) {
    const { x: px, y: py, w, h } = d;
    // Hinge line runs down the LEFT edge of the door (the hinged edge).
    const edgeX = px + HINGE_INSET;
    const positions = [];
    let z = py + HINGE_TOP;
    while (z <= py + h - HINGE_BOTTOM) {
      positions.push(z);
      z += HINGE_SPACING;
    }
    // guarantee top + bottom cups regardless of spacing math
    if (!positions.includes(py + HINGE_TOP)) positions.unshift(py + HINGE_TOP);
    if (!positions.includes(py + h - HINGE_BOTTOM)) positions.push(py + h - HINGE_BOTTOM);
    for (const cz of positions) {
      dxf.circle(edgeX, cz, HINGE_CUP_DIA / 2, 'CNC_DRILL');
      toolpaths.push({ type: 'hinge', layer: 'CNC_DRILL', part: d.name, x: edgeX, y: cz, dia: HINGE_CUP_DIA, depth: 13, tool: 'hinge' });
      hingeCups.push({ part: d.name, x: Math.round(edgeX), y: Math.round(cz), dia: HINGE_CUP_DIA, depth: 13 });
    }
  }

  // Cutlist summary (qty per part type + material) for downstream export.
  const cutlist = [];
  const byName = {};
  for (const p of placed) {
    const key = `${p.name}|${p.mat}`;
    if (!byName[key]) byName[key] = { name: p.name, material: p.mat, qty: 0, w: Math.round(p.w), h: Math.round(p.h), banded: p.banded };
    byName[key].qty += 1;
  }
  for (const k of Object.keys(byName)) cutlist.push(byName[k]);

  // Edge-banding schedule: parts + which edges get 0.45mm PVC/ABS.
  const edgeBandSchedule = edgeBand
    ? placed.map(p => ({ part: p.name, material: p.mat, edges: p.banded }))
    : [];

  const content = dxf.toString();
  return {
    dxf: content,
    sheet: { w: SHEET_W, h: SHEET_H, stock },
    sheetCount: sheets.length,
    sheets: sheets.map(s => ({ index: s.index, parts: s.parts })),
    placed,
    parts: placed.map(p => p.name),
    partCount: placed.length,
    cutlist,
    toolpaths,
    hingeCups,
    edgeBandSchedule,
    stock
  };
}
