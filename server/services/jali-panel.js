/**
 * jali-panel.js
 * ---------------------------------------------------------------------------
 * Builds a CNC-ready JALI / lattice panel DXF (+ PDF) — the carved front that
 * goes on the left tall cabinet of the kitchen/crockery/pooja unit (and any
 * other shutter that needs a traditional Indian lattice). Geometry is a single
 * CLOSED-POLYLINE-cuttable panel: a lotus motif near top + bottom, a circular
 * lattice band in the middle. Reused by:
 *   - scripts/generate-jali-panel.mjs (standalone CLI)
 *   - POST /api/projects/:id/elevations/jali-panel (in-app generator)
 *
 * All cuts are closed polylines / arcs so a router can pocket them.
 */
import svc from './dxf-writer.js';
import { renderElevationPDF } from './pdf-elevation.js';

const { DXF } = svc;

// lotus motif as a closed polyline ring (cut-out)
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

// circular lattice band: concentric rings + radial spokes + ring of small cut circles
function circularLattice(dxf, x, y, w, h, layer = 'CANE') {
  const cx = x + w / 2, cy = y + h / 2;
  const R = Math.min(w, h) * 0.46;
  dxf.arc(cx, cy, R, 0, Math.PI * 2, layer);
  dxf.arc(cx, cy, R * 0.6, 0, Math.PI * 2, layer);
  const spokes = 12;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    dxf.line(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6,
             cx + Math.cos(a) * R, cy + Math.sin(a) * R, layer);
  }
  const n = 8, rr = R * 0.8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    dxf.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * 0.14, 0, Math.PI * 2, layer);
  }
}

/**
 * buildJaliPanelDXF(opts)
 * opts: { widthMm, heightMm, name }
 * returns DXF string (red object outline + cane jali + dims + title block)
 */
export function buildJaliPanelDXF(opts = {}) {
  const W = Number(opts.widthMm) || 600;
  const H = Number(opts.heightMm) || 2000;
  const name = (opts.name || 'JALI PANEL').toUpperCase();
  const margin = 1200;
  const dxf = new DXF();

  // Panel outline (red object line) + inner border
  dxf.rect(margin, margin, W, H, 'WALL_OUTLINE');
  dxf.rect(margin + 40, margin + 40, W - 80, H - 80, 'WALL_OUTLINE');

  const x = margin, y = margin;
  // lotus top + bottom
  lotusRing(dxf, x + W / 2, y + H - W * 0.34, W * 0.30);
  lotusRing(dxf, x + W / 2, y + W * 0.34, W * 0.30);
  // circular lattice middle band
  const bandTop = y + W * 0.62;
  const bandH = H - 2 * W * 0.62;
  if (bandH > W * 0.3) circularLattice(dxf, x + W * 0.12, bandTop, W * 0.76, bandH);

  // center-line reference (dashed yellow)
  dxf.line(x, y + H / 2, x + W, y + H / 2, 'REF_LINES');

  // dimensions + callout
  dxf.dimH(x, x + W, y + H + 360, y + H, `${W} mm`, false);
  dxf.dimV(x + W + 360, y, y + H, x + W, `${H} mm`, false);
  dxf.text(x + W / 2, y - 320, name, 200, 'ANNOTATIONS');
  dxf.callout(x + W / 2, y + H * 0.5, x - 500, y + H * 0.5, 'CNC LOTUS + CIRCULAR LATTICE (CUT-THROUGH)');

  dxf.drawTitleBlock(margin, margin - 1600, 5200, 1300, {
    projectId: opts.projectId || 'JALI', sheet: name, scale: '1:10', rev: '1.0'
  });
  return dxf.toString();
}

export function buildJaliPanelPDF(opts = {}) {
  const W = Number(opts.widthMm) || 600;
  const H = Number(opts.heightMm) || 2000;
  return renderElevationPDF({
    unitType: 'JALI', projectId: opts.projectId || 'JALI',
    wallName: (opts.name || 'JALI PANEL').toUpperCase(),
    lengthMm: W, heightMm: H, depthMm: 18, thicknessMm: 18, ceilingHeightMm: H,
    coverage: { utilisationPct: 100, usedMm: W, freeMm: 0 },
    cabinets: [{ type: 'door', widthMm: W, heightMm: H, xOffsetMm: 0, zOffsetMm: 0,
      tag: 'JALI', name: 'Jali panel', handle: 'bar',
      material: { callout: 'CNC LOTUS + CIRCULAR LATTICE', cane: true } }],
    openings: [],
  }, { scale: '1:10', rev: '1.0' });
}

export default { buildJaliPanelDXF, buildJaliPanelPDF };
