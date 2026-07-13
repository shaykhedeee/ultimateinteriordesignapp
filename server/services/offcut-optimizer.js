/**
 * Offcut / scrap-bin reuse optimizer.
 *
 * Why this exists: dedicated cutlist optimizers (MaxCut, CutList Plus) reuse the
 * leftover strips from one sheet to fill small parts on later sheets, instead of
 * opening a brand-new board for every leftover. ULTIDA's primary nest-optimizer
 * (nest-optimizer.js) packs each sheet from empty, so its scrap is discarded.
 * This post-pass harvests each sheet's unused free rectangles into a single
 * scrap-bin and re-fits the unplaced pieces into them — grain-aware — so a 300mm
 * drawer bottom rides on a leftover strip rather than a fresh 8x4 sheet.
 *
 * It is additive: it never changes primary nesting; it only rescues pieces that
 * the primary pass could not place, and credits that reuse in the global waste %.
 */

// Try to place a piece into a free rect. Grain-locked parts may not rotate.
function tryPlaceInRect(piece, rect, kerf, grainLocked) {
  const candidates = [];
  const w = piece.lengthMm, h = piece.widthMm;
  candidates.push({ w, h, rotated: false });
  if (!grainLocked) candidates.push({ w: h, h: w, rotated: true });
  let best = null;
  for (const c of candidates) {
    const packW = c.w + kerf;
    const packH = c.h + kerf;
    if (packW <= rect.w && packH <= rect.h) {
      const waste = rect.w * rect.h - packW * packH;
      const shortSide = Math.min(rect.w - packW, rect.h - packH);
      if (!best || waste < best.waste || (waste === best.waste && shortSide < best.shortSide)) {
        best = { c, packW, packH, waste, shortSide };
      }
    }
  }
  return best;
}

// Subtract a used rect from a free rect, returning up to 2 leftover free rects
// (guillotine split along the longer residual dimension).
function splitFreeRect(rect, used) {
  const out = [];
  const rightW = rect.x + rect.w - (used.x + used.w);
  const bottomH = rect.y + rect.h - (used.y + used.h);
  const leftW = used.x - rect.x;
  const topH = used.y - rect.y;
  if (rightW > 0) out.push({ x: used.x + used.w, y: rect.y, w: rightW, h: rect.h });
  if (bottomH > 0) out.push({ x: rect.x, y: used.y + used.h, w: rect.w, h: bottomH });
  if (leftW > 0) out.push({ x: rect.x, y: rect.y, w: leftW, h: rect.h });
  if (topH > 0) out.push({ x: rect.x, y: rect.y, w: rect.w, h: topH });
  return out;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * @param {Array} sheets  sheet objects (with .freeRects still present, .pieces, .usedAreaSqM, .lengthMm/.widthMm)
 * @param {Array} unplaced pieces the primary pass could not place
 * @param {Object} settings DEFAULT_SETTINGS (kerfMm, trimMm)
 * @returns {{ sheets, unplaced, reused: Array, scrapAreaSqM }}
 */
export function runOffcutPass(sheets, unplaced, settings) {
  const kerf = settings.kerfMm || 3;
  // Build one global scrap-bin from every sheet's current free rectangles.
  const scrap = [];
  for (const sheet of sheets) {
    for (const r of sheet.freeRects || []) {
      scrap.push({ ...r, sheetNo: sheet.sheetNo });
    }
  }
  const reused = [];
  const stillUnplaced = [];
  const bySheet = new Map(sheets.map((s) => [s.sheetNo, s]));

  for (const piece of unplaced) {
    const grainLocked = piece.grain && piece.grain !== 'none';
    let placed = null;
    for (let i = 0; i < scrap.length; i += 1) {
      const rect = scrap[i];
      const fit = tryPlaceInRect(piece, rect, kerf, grainLocked);
      if (fit) {
        placed = { rect, fit, idx: i };
        break;
      }
    }
    if (!placed) { stillUnplaced.push(piece); continue; }

    const { rect, fit, idx } = placed;
    const used = { x: rect.x, y: rect.y, w: fit.packW, h: fit.packH };
    const sheet = bySheet.get(rect.sheetNo);
    const placedPiece = {
      ...piece,
      x: rect.x,
      y: rect.y,
      w: fit.c.w,
      h: fit.c.h,
      rotated: fit.c.rotated,
      fromOffcut: true
    };
    sheet.pieces.push(placedPiece);
    sheet.usedAreaSqM = Number((sheet.usedAreaSqM + (piece.lengthMm * piece.widthMm) / 1_000_000).toFixed(2));
    reused.push(placedPiece);
    // Replace the consumed scrap rect with its guillotine leftovers.
    scrap.splice(idx, 1, ...splitFreeRect(rect, used).filter((r) => r.w > 1 && r.h > 1));
  }

  const scrapAreaSqM = Number((scrap.reduce((s, r) => s + (r.w * r.h), 0) / 1_000_000).toFixed(2));
  return { sheets, unplaced: stillUnplaced, reused, scrapAreaSqM };
}

export default { runOffcutPass };
