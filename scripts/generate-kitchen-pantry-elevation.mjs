/**
 * scripts/generate-kitchen-pantry-elevation.mjs
 * ---------------------------------------------------------------------------
 * CNC-ready 2D WALL ELEVATION (DXF + PDF) of the 3-bay kitchen / crockery /
 * pooja unit from the user's render (composer_2026-07-09_17-18-36...png).
 *
 * Bays (traced from render, 2400mm ceiling):
 *   LEFT  (1000w): floor-to-ceiling double-door JALI/lattice tall cabinet.
 *                  Detailed CNC lotus + circular-lattice cut pattern, 2 chrome bars.
 *   CENTER(1400w): cream upper shutters / OPEN NICHE (diamond-tile backsplash
 *                  + dark-wood shelf, warm under-shelf LED) / 20mm stone counter
 *                  / wide dark-wood DRAWER / cream lower shutters.
 *   RIGHT  (600w): tall ALUMINIUM-PROFILE GLASS shutter display cabinet,
 *                  3 glass shelves, warm LED strip, dark-wood frame.
 *
 * Uses the project's own server/services/dxf-writer.js (DXF class + drawElevation)
 * and pdf-elevation.js. Custom detail (jali, aluminium mullions, niche) is appended
 * as real, CNC-cuttable closed polylines / lines on the same DXF instance.
 * Run: node scripts/generate-kitchen-pantry-elevation.mjs
 */
import svc from '../server/services/dxf-writer.js';
import { renderElevationPDF } from '../server/services/pdf-elevation.js';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const { DXF } = svc;

const OUT = path.resolve('storage', 'elevations');
mkdirSync(OUT, { recursive: true });

const cab = (o) => ({
  type: o.type || 'door',
  widthMm: o.w, heightMm: o.h, depthMm: o.d || 600,
  xOffsetMm: o.x, zOffsetMm: o.z,
  tag: o.tag, name: o.name,
  handleType: o.handle || 'bar',
  material: o.material || {},
  lighting: o.lighting || null,
});

function kitchenPantryModel() {
  const L = 3000, H = 2400, T = 75;
  const baseTop = 900, wallH = 720, nicheH = 540;
  const c = [
    cab({ type: 'door', w: 1000, h: H, x: 0, z: 0, tag: 'JALI', name: 'Jali tall', handle: 'bar',
          material: { callout: 'MEDIUM WALNUT + CNC LOTUS/JALI LATTICE', cane: true } }),
    cab({ type: 'base', w: 1400, h: baseTop, x: 1000, z: 0, tag: 'BASE', name: 'Crockery base', handle: 'bar',
          material: { callout: 'MATTE CREAM LAMINATE' } }),
    cab({ type: 'drawer', w: 600, h: 200, x: 1200, z: 0, tag: 'DRAWER', name: 'Wood drawer', handle: 'bar',
          material: { callout: 'DARK WOOD DRAWER FRONT' } }),
    cab({ type: 'open', w: 1400, h: nicheH, x: 1000, z: baseTop, tag: 'OPEN UNIT', name: 'Open niche', handle: 'bar',
          material: { callout: 'DIAMOND PATTERN TILE BACKSPLASH + DARK WOOD SHELF' }, lighting: 'WARM UNDER-SHELF LED' }),
    cab({ type: 'wall', w: 700, h: wallH, x: 1000, z: H - wallH, tag: 'WALL', name: 'Upper L', handle: 'bar',
          material: { callout: 'MATTE CREAM LAMINATE' } }),
    cab({ type: 'wall', w: 700, h: wallH, x: 1700, z: H - wallH, tag: 'WALL', name: 'Upper R', handle: 'bar',
          material: { callout: 'MATTE CREAM LAMINATE' } }),
    cab({ type: 'door', w: 600, h: H, x: 2400, z: 0, tag: 'GLASS', name: 'Glass display', handle: 'bar',
          material: { callout: 'ALUMINIUM PROFILE GLASS SHUTTER (3 GLASS SHELVES)', glass: true }, lighting: 'WARM LED STRIP (LHS)' }),
  ];
  return {
    unitType: 'KITCHEN-PANTRY', projectId: 'RENDER-DECODE',
    wallName: 'KITCHEN / CROCKERY / POOJA ELEVATION',
    lengthMm: L, heightMm: H, depthMm: 600, thicknessMm: T, ceilingHeightMm: H,
    coverage: { utilisationPct: 100, usedMm: L, freeMm: 0 },
    cabinets: c, openings: [],
  };
}

// ── Detailed overlays (appended to the same DXF instance) ──

// CNC lotus motif as a closed polyline ring (cut-out)
function lotusRing(dxf, cx, cy, r, petals = 8, layer = 'CANE') {
  const pts = [];
  for (let i = 0; i < petals; i++) {
    const a0 = (i / petals) * Math.PI * 2;
    const a1 = ((i + 0.5) / petals) * Math.PI * 2;
    const a2 = ((i + 1) / petals) * Math.PI * 2;
    pts.push([cx + Math.cos(a0) * r, cy + Math.sin(a0) * r]);
    pts.push([cx + Math.cos(a1) * r * 0.55, cy + Math.sin(a1) * r * 0.55]);
    pts.push([cx + Math.cos(a2) * r, cy + Math.sin(a2) * r]);
  }
  dxf.poly(pts, layer, true);
}

// Circular lattice band: concentric ring + radial spokes + ring of small cut circles
function circularLattice(dxf, x, y, w, h, layer = 'CANE') {
  const cx = x + w / 2, cy = y + h / 2;
  const R = Math.min(w, h) * 0.46;
  dxf.arc(cx, cy, R, 0, Math.PI * 2, layer);          // outer ring
  dxf.arc(cx, cy, R * 0.6, 0, Math.PI * 2, layer);      // inner ring
  const spokes = 12;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    dxf.line(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6,
             cx + Math.cos(a) * R, cy + Math.sin(a) * R, layer);
  }
  // ring of small cut circles (CNC pockets)
  const n = 8, rr = R * 0.8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    dxf.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * 0.14, 0, Math.PI * 2, layer);
  }
}

// Jali on the two left doors: lotus top+bottom, lattice middle band
function drawJali(dxf, x, y, w, h) {
  const doorW = w / 2;
  for (const dx of [0, doorW]) {
    const dX = x + dx;
    lotusRing(dxf, dX + doorW / 2, y + h - doorW * 0.55, doorW * 0.34);   // top lotus
    lotusRing(dxf, dX + doorW / 2, y + doorW * 0.55, doorW * 0.34);       // bottom lotus
    const bandH = h - 2 * doorW * 1.1;
    circularLattice(dxf, dX + doorW * 0.12, y + doorW * 1.1, doorW * 0.76, Math.max(1, bandH));
  }
}

// Aluminium-profile glass shutter: frame + vertical mullions + 3 glass shelves + LED strip
function drawAluminiumGlass(dxf, x, y, w, h) {
  const fr = 30; // frame thickness
  dxf.rect(x, y, w, h, 'FRAME');                       // outer aluminium frame
  dxf.rect(x + fr, y + fr, w - 2 * fr, h - 2 * fr, 'FRAME'); // inner frame
  // 3 glass shelves (horizontal)
  for (const f of [0.22, 0.5, 0.78]) {
    const sy = y + h * f;
    dxf.line(x + fr, sy, x + w - fr, sy, 'GLASS');
  }
  // vertical aluminium mullion
  dxf.line(x + w / 2, y + fr, x + w / 2, y + h - fr, 'FRAME');
  // warm LED strip (LHS inner)
  dxf.line(x + fr + 12, y + fr + 12, x + fr + 12, y + h - fr - 12, 'ANNOTATIONS');
  dxf.text(x + w / 2, y + h + 60, 'ALUMINIUM PROFILE + GLASS', 120, 'ANNOTATIONS');
}

// Open niche: diamond-tile backsplash (cross hatch) + dark-wood shelf
function drawNiche(dxf, x, y, w, h) {
  const step = 120;
  for (let i = -h; i < w + h; i += step) dxf.line(x + i, y, x + i + h, y + h, 'RUG');
  for (let i = 0; i < w + h; i += step) dxf.line(x + i, y + h, x + i - h, y, 'RUG');
  const shelfY = y + h * 0.45;
  dxf.line(x, shelfY, x + w, shelfY, 'FRAME');          // dark wood shelf
  dxf.text(x + w / 2, y + h * 0.2, 'OPEN SHELF', 130, 'ANNOTATIONS');
}

const model = kitchenPantryModel();
const margin = 1500;
const dxf = new DXF();
dxf.drawElevation(model, margin, margin);   // base: frames, handles, dims, title block, glass/cane hints

// Append detailed CNC geometry on top
const x0 = margin, y0 = margin;
drawJali(dxf, x0 + 0, y0 + 0, 1000, 2400);                                  // LEFT jali doors
drawAluminiumGlass(dxf, x0 + 2400, y0 + 0, 600, 2400);                      // RIGHT glass shutter
drawNiche(dxf, x0 + 1000, y0 + 900, 1400, 540);                            // CENTER open niche

const outDxf = path.join(OUT, 'kitchen-pantry-elevation.dxf');
writeFileSync(outDxf, dxf.toString());

let pdfMsg = '(skipped)';
try {
  const pdf = await renderElevationPDF(model);
  const outPdf = path.join(OUT, 'kitchen-pantry-elevation.pdf');
  writeFileSync(outPdf, pdf);
  pdfMsg = outPdf;
} catch (e) { pdfMsg = 'PDF error: ' + e.message; }

console.log('DXF  ->', outDxf, `(${dxf.toString().length} bytes)`);
console.log('PDF  ->', pdfMsg);
console.log('UNIT :', model.wallName, `${model.lengthMm}x${model.heightMm}mm`);
console.log('Detail: jali lotus+lattice | aluminium glass shutter w/ 3 shelves + LED | open niche diamond backsplash + shelf');
