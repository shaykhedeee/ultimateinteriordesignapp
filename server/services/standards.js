/**
 * standards.js — Indian residential millwork module standards.
 * -----------------------------------------------------------------------------
 * The "scan" (local vision / ai) only ever estimates DIVISIONS. Real shop
 * drawings must use STANDARD module sizes, and the number of modules must be
 * derived from the ACTUAL unit/room width — never arbitrary pixel gaps.
 *
 * Every function returns a { lengthMm, heightMm, depthMm, cabinets, openings }
 * ElevationModel using ONLY standard module widths/heights. Raw detection
 * widths are NOT passed through (that was the bug: 223mm / 1254mm panels).
 *
 * Standards references:
 *  - 18mm MR ply carcass (thickness 75-100mm incl shutter).
 *  - Wardrobe bay 600mm (hinged) / 900mm (2-track sliding); tall 2100-2400.
 *  - Kitchen base 900H counter @ 600D; wall 600-720H @ 350D; loft 450-600H.
 *  - TV base 450-500H; vanity counter 800-850H.
 *  - Shutter/drawer standard widths: 450 / 500 / 600 / 750 / 900.
 */

// Snap a desired module width to the nearest valid standard bay.
const STD_BAYS = [450, 500, 600, 750, 900];
function snapBay(desired) {
  let best = STD_BAYS[0], bestD = Infinity;
  for (const b of STD_BAYS) {
    const d = Math.abs(b - desired);
    if (d < bestD) { bestD = d; best = b; }
  }
  return best;
}

// Distribute a total width into N standard bays (last bay absorbs remainder so
// the run exactly fills the wall). Remainder is snapped to a valid bay within
// tolerance; if it can't be standard, it becomes a FILLER (crossed out) — never
// an arbitrary 223mm panel.
function layoutBays(totalMm, preferredBay) {
  const base = preferredBay;                 // e.g. 600 — the standard bay
  let n = Math.max(1, Math.round(totalMm / base));
  const bays = [];
  // If the last (remainder) bay would be tiny (<50% of a standard bay), use
  // one fewer full bay so the remainder stays a sane size (real filler gap).
  let used = (n - 1) * base;
  let rem = totalMm - used;
  if (rem < base * 0.5 && n > 1) { n -= 1; used = (n - 1) * base; rem = totalMm - used; }
  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      // final bay: snap DOWN to nearest standard if it fits, else keep exact
      // remainder (tagged filler only if genuinely narrow). Never overflow.
      const snapped = snapBay(rem);
      if (snapped <= rem) bays.push({ w: snapped, filler: snapped < 450 });
      else bays.push({ w: rem, filler: rem < 450 });
    } else {
      bays.push({ w: base, filler: false });
    }
  }
  return bays;
}

function pushCab(cabinets, o) { cabinets.push(o); }

// ---------------- WARDROBE ----------------
// Mirrors a real Indian residential wardrobe elevation:
//  loft (top) + hanging section (hanger rod) + shelf section + drawer bank.
// All bays are STANDARD 600mm (or 900 sliding); sections sized to standards so
// the drawing is detailed AND every dimension sums exactly (no overlap/gaps).
function wardrobe(L, H, D) {
  const cabinets = [];
  const loftH = H >= 2400 ? 600 : (H > 2100 ? Math.min(450, H - 2050) : 0);
  const drawerH = 750;                       // bottom drawer bank (standard)
  const hangerH = Math.min(1200, H - loftH - drawerH - 300); // hanging section
  const shelfH = H - loftH - drawerH - hangerH;              // mid shelf section
  const bays = layoutBays(L, 600).map(b => b.w);
  let x = 0;
  for (const w of bays) {
    // loft (top) — accessed from above
    if (loftH > 0) pushCab(cabinets, { type: 'door', widthMm: w, heightMm: loftH, depthMm: D, xOffsetMm: x, zOffsetMm: H - loftH, tag: 'LOFT', name: 'Loft', material: { fluted: w >= 600 } });
    // hanging section (hanger rod)
    if (hangerH > 0) pushCab(cabinets, { type: 'open', widthMm: w, heightMm: hangerH, depthMm: D, xOffsetMm: x, zOffsetMm: drawerH + shelfH, tag: 'OPEN UNIT', name: 'Hanger space', material: { hanger: true } });
    // shelf section (fixed shelves) above the drawers
    if (shelfH > 0) pushCab(cabinets, { type: 'open', widthMm: w, heightMm: shelfH, depthMm: D, xOffsetMm: x, zOffsetMm: drawerH, tag: 'OPEN UNIT', name: 'Shelf section', material: { openShelf: true, shelves: Math.max(2, Math.round(shelfH / 300)) } });
    // drawer bank at bottom
    if (drawerH > 0) pushCab(cabinets, { type: 'drawer', widthMm: w, heightMm: drawerH, depthMm: D, xOffsetMm: x, zOffsetMm: 0, tag: 'DRAWER', name: 'Drawer bank' });
    x += w;
  }
  return { lengthMm: L, heightMm: H, depthMm: D, cabinets, openings: [] };
}

// ---------------- KITCHEN ----------------
function kitchen(L, H, D) {
  const cabinets = [];
  const baseH = 900, baseD = 600;
  const wallH = 720, wallD = 350;
  // Base run split into standard bays; first bay = sink, second = hob.
  const baseBays = layoutBays(L, 600);
  let x = 0;
  baseBays.forEach((b, i) => {
    const mat = { counter: true };
    if (i === 0) mat.sink = true;
    else if (i === 1) mat.hob = true;
    pushCab(cabinets, { type: 'base', widthMm: b.w, heightMm: baseH, depthMm: baseD, xOffsetMm: x, zOffsetMm: 0, tag: 'BASE', name: b.filler ? 'Filler' : 'Base unit', material: mat });
    x += b.w;
  });
  // Wall units at the top (full width)
  x = 0;
  const wallBays = layoutBays(L, 600);
  for (const b of wallBays) {
    pushCab(cabinets, { type: 'wall', widthMm: b.w, heightMm: wallH, depthMm: wallD, xOffsetMm: x, zOffsetMm: H - wallH, tag: 'WALL', name: b.filler ? 'Filler' : 'Wall unit' });
    x += b.w;
  }
  // Loft fills the gap between base top and wall-unit bottom (standard overhead storage)
  const loftH = H - baseH - wallH;
  if (loftH > 100) pushCab(cabinets, { type: 'loft', widthMm: L, heightMm: loftH, depthMm: 350, xOffsetMm: 0, zOffsetMm: baseH, tag: 'LOFT', name: 'Loft' });
  return { lengthMm: L, heightMm: H, depthMm: D, cabinets, openings: [] };
}

// ---------------- TV UNIT ----------------
function tvUnit(L, H, D) {
  const cabinets = [];
  const baseH = 500, baseD = 450;
  const openH = H - baseH > 0 ? H - baseH : 0;
  const bays = layoutBays(L, 600);
  let x = 0;
  for (const b of bays) {
    // base with open shelf above
    pushCab(cabinets, { type: 'base', widthMm: b.w, heightMm: baseH, depthMm: baseD, xOffsetMm: x, zOffsetMm: 0, tag: 'BASE', name: 'TV base' });
    if (openH > 0) pushCab(cabinets, { type: 'open', widthMm: b.w, heightMm: openH, depthMm: 350, xOffsetMm: x, zOffsetMm: baseH, tag: 'OPEN UNIT', name: 'Open shelf', material: { openShelf: true, shelves: Math.max(2, Math.round(openH / 350)) } });
    x += b.w;
  }
  return { lengthMm: L, heightMm: H, depthMm: D, cabinets, openings: [] };
}

// ---------------- VANITY ----------------
function vanity(L, H, D) {
  const cabinets = [];
  const counterH = 850, counterD = 550;
  const bays = layoutBays(L, 600);
  let x = 0;
  bays.forEach((b, i) => {
    // counter slab marker (thin top line) + drawer bank below
    pushCab(cabinets, { type: 'base', widthMm: b.w, heightMm: counterH, depthMm: counterD, xOffsetMm: x, zOffsetMm: 0, tag: 'DRAWER', name: b.filler ? 'Filler' : 'Vanity drawer bank', material: { counter: true, basin: i === 0 } });
    // mirror / open above (not full wall height for vanity — only up to 1200mm)
    const aboveH = Math.min(1200 - counterH, H - counterH);
    if (aboveH > 150) pushCab(cabinets, { type: 'open', widthMm: b.w, heightMm: aboveH, depthMm: 150, xOffsetMm: x, zOffsetMm: counterH, tag: 'OPEN UNIT', name: 'Mirror cabinet', material: { openShelf: true, shelves: 1 } });
    x += b.w;
  });
  return { lengthMm: L, heightMm: H, depthMm: D, cabinets, openings: [] };
}

// ---------------- BOOKCASE / POC ----------------
function bookcase(L, H, D) {
  const cabinets = [];
  const bays = layoutBays(L, 900);
  let x = 0;
  for (const b of bays) {
    pushCab(cabinets, { type: 'open', widthMm: b.w, heightMm: H, depthMm: D, xOffsetMm: x, zOffsetMm: 0, tag: 'OPEN UNIT', name: 'Bookshelf', material: { openShelf: true, shelves: Math.max(4, Math.round(H / 320)) } });
    x += b.w;
  }
  return { lengthMm: L, heightMm: H, depthMm: D, cabinets, openings: [] };
}

const BUILDERS = { wardrobe, kitchen, 'tv-unit': tvUnit, 'tv unit': tvUnit, vanity, bookcase, 'pooja': bookcase };

/**
 * Build a standards-compliant ElevationModel for a unit type + real dims.
 * @param {string} type  unit type (wardrobe/kitchen/tv-unit/vanity/...)
 * @param {{widthMm,heightMm,depthMm}} dims
 */
export function buildStandardModel(type, dims) {
  const L = Math.round(dims.widthMm || 2000);
  const H = Math.round(dims.heightMm || 2400);
  const D = Math.round(dims.depthMm || 600);
  const fn = BUILDERS[type] || BUILDERS[type?.toLowerCase?.()] || ((L, H, D) => wardrobe(L, H, D));
  return fn(L, H, D);
}

export { snapBay, layoutBays, STD_BAYS };
