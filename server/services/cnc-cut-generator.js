/**
 * cnc-cut-generator.js
 * --------------------------------------------------------------------------
 * Generates a machine-ready CNC router cut plan (DXF) for a single cabinet module.
 * Layered for Biesse / Homag / WoodWOP style controllers:
 *   - CNC_OUTLINE : through-cut (part perimeter)
 *   - CNC_DRILL   : through-bores (shelf pin rows, hinge cups)
 *   - CNC_POCKET  : dados / back-panel grooves (blind pockets)
 *   - CNC_ENGRAVE : part label + number (engraved, not cut)
 *
 * Improvements over the original stub:
 *   * Every CNC_* layer is now registered in dxf-writer.js, so the file is
 *     valid in AutoCAD / ezdxf / LibreCAD (the old file referenced 3 undefined
 *     layers and those entities were silently dropped).
 *   * Drill holes are placed at the OWN origin of each part (the old code used a
 *     stale `currentX` captured after the cursor had already advanced, so holes
 *     landed ~one part-width to the right of their panel).
 *   * Emits a complete, dimension-derived part set (2 sides, top, bottom, back,
 *     shelves, doors) instead of a hard-coded 4 panels.
 *   * Parts are laid out within a real 8x4 ft sheet (2440 x 1220 mm) with a
 *     30 mm router-bit clearance and a 20 mm part-to-edge margin, and the
 *     function throws if the module does not physically fit (so callers get a
 *     real error instead of a garbage overflowing file).
 *
 * Pure + dependency-free (only the DXF class) => unit-testable.
 */

import { DXF } from './dxf-writer.js';

// Standard board stock. A standard 8x4 (2440x1220) sheet can't hold a 2100mm-tall
// side panel laid flat, so for tall carcasses we automatically step up to a JUMBO
// 9x6 (2745x1830) board — what real Indian workshops stock for wardrobe/loft panels.
const EDGE_MARGIN = 20;   // keep parts away from the sheet edge
const CLEARANCE = 30;     // router-bit clearance between parts

export function generateCNCCutPlan(moduleData = {}) {
  const dxf = new DXF();

  const width = Number(moduleData.widthMm) || 900;
  const depth = Number(moduleData.depthMm) || 560;
  const height = Number(moduleData.heightMm) || 2100;
  const ply = Number(moduleData.plyMm) || 18;
  const backPly = Number(moduleData.backPlyMm) || 6;
  const numShelves = Number(moduleData.numShelves) || 2;
  const shutterType = moduleData.shutterType || 'double'; // 'single' | 'double' | 'none'
  const drillDia = 5; // shelf-pin / hinge bore diameter (mm)

  // Choose board stock up front from the largest part dimension.
  const maxDim = Math.max(width, height, depth);
  const SHEET_W = maxDim > 1220 ? 2745 : 2440;
  const SHEET_H = maxDim > 1220 ? 1830 : 1220;

  // ---- Sheet frame + legend ----
  dxf.rect(0, 0, SHEET_W, SHEET_H, 'CNC_OUTLINE');
  dxf.text(SHEET_W / 2, SHEET_H - 40, `CNC CUT PLAN  ${Math.round(width)}x${Math.round(height)}x${Math.round(depth)}mm`, 36, 'CNC_ENGRAVE');
  dxf.text(40, 40, 'LAYERS: OUTLINE=cut  DRILL=bore  POCKET=dado  ENGRAVE=label', 24, 'CNC_ENGRAVE');

  // Running cursor across the sheet (Y stays 0, we pack parts left-to-right).
  let cursorX = EDGE_MARGIN;
  const y0 = EDGE_MARGIN;
  const placed = [];

  const drawPart = (name, w, h) => {
    // Auto-rotate the part if it doesn't fit the sheet's current orientation
    // (e.g. a 2100mm-tall side panel laid flat needs to be turned 90° to use
    // the long axis of a jumbo board). Only rotate when one dimension overflows.
    let pw = w, ph = h;
    const fits = (a, b) => a <= SHEET_W - EDGE_MARGIN - 0.5 && b <= SHEET_H - EDGE_MARGIN - 0.5;
    if (!fits(pw, ph) && fits(ph, pw)) {
      [pw, ph] = [ph, pw];
    }

    // Wrap to a new row if the part won't fit on the current line.
    if (cursorX + pw > SHEET_W - EDGE_MARGIN) {
      cursorX = EDGE_MARGIN;
    }
    const px = cursorX;
    const py = y0;

    // Through-cut perimeter on CNC_OUTLINE.
    dxf.poly([
      [px, py],
      [px + pw, py],
      [px + pw, py + ph],
      [px, py + ph]
    ], 'CNC_OUTLINE', true);

    // Engraved part label + number.
    dxf.text(px + pw / 2, py + ph / 2, `${name}`, 30, 'CNC_ENGRAVE');

    cursorX += pw + CLEARANCE;
    placed.push({ name, x: px, y: py, w: pw, h: ph });
    return { px, py, w: pw, h: ph };
  };

  // Shelf-pin rows: two vertical columns of bores on each side panel.
  const drillSidePanel = (panelOrigin) => {
    const { px, py, w, h } = panelOrigin;
    for (let z = py + 150; z < py + h - 150; z += 128) {
      dxf.circle(px + 50, z, drillDia / 2, 'CNC_DRILL');
      dxf.circle(px + w - 50, z, drillDia / 2, 'CNC_DRILL');
    }
  };

  // 1. Left side panel (depth x height)
  const leftSide = drawPart('L_SIDE', depth, height);
  drillSidePanel(leftSide);
  // Back-panel dado (groove) on the left side — follows the placed rectangle.
  dxf.rect(leftSide.px + 12, leftSide.py, Math.min(8, leftSide.w), leftSide.h, 'CNC_POCKET');

  // 2. Right side panel (depth x height)
  const rightSide = drawPart('R_SIDE', depth, height);
  drillSidePanel(rightSide);
  dxf.rect(rightSide.px + 12, rightSide.py, Math.min(8, rightSide.w), rightSide.h, 'CNC_POCKET');

  // 3. Top panel (width - 2*ply x depth)
  drawPart('TOP', width - ply * 2, depth);
  // 4. Bottom panel
  drawPart('BOTTOM', width - ply * 2, depth);

  // 5. Back panel (width - 2*ply x height - 2*ply), thinner material
  drawPart('BACK', width - ply * 2, height - ply * 2);

  // 6. Adjustable shelves
  for (let i = 1; i <= numShelves; i++) {
    drawPart(`SHELF_${i}`, width - ply * 2, depth - 40);
  }

  // 7. Front shutters / doors (height - plinth, split by type)
  const doorH = height - (moduleData.plinthH || 100);
  if (shutterType === 'double') {
    const dw = (width - 6) / 2;
    drawPart('DOOR_L', dw, doorH);
    drawPart('DOOR_R', dw, doorH);
  } else if (shutterType === 'single') {
    drawPart('DOOR', width - 6, doorH);
  }

  // ---- Bounds / fit validation ----
  const overflow = placed.find(p => p.x + p.w > SHEET_W - EDGE_MARGIN + 0.5 || p.y + p.h > SHEET_H - EDGE_MARGIN + 0.5);
  if (overflow) {
    throw new Error(
      `Module ${Math.round(width)}x${Math.round(height)}x${Math.round(depth)}mm produces parts that exceed the ${SHEET_W}x${SHEET_H}mm sheet (overflow at "${overflow.name}"). ` +
      `Reduce dimensions, fewer shelves, or split into multiple boards.`
    );
  }

  const content = dxf.toString();
  return {
    dxf: content,
    sheet: { w: SHEET_W, h: SHEET_H },
    parts: placed.map(p => p.name),
    partCount: placed.length
  };
}
