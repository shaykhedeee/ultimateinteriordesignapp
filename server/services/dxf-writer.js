/**
 * dxf-writer.js  (v2 — professional millwork shop-drawing output)
 * --------------------------------------------------------------------------
 * AutoCAD R2010 ASCII DXF, model space in millimetres.
 * Conventions reverse-engineered from real Indian millwork shop drawings
 * (ROSH INTERIORS style): thick black object lines, THIN RED dimensions with
 * red extension lines + red numeric text, red leader lines to callouts,
 * hatch for concrete (ANSI31) / glazing (dense diagonal), component tags
 * (DRAWER / SHUTTER / OPEN UNIT / SKIRTING / FS/EQ/AS), material callouts
 * (FLUTED GLASS / GRANITE / 4MM GROOVING), and a title block.
 *
 * Pure + dependency-free => unit-testable.
 */

// Layer table: name -> [color]
//  1 red = object/dimensions (we keep dims red per benchmark)
//  2 yellow = reference/alignment
//  7 white/black = default
//  8 grey = hatch
const LAYERS = [
  ['0', 7, 'CONTINUOUS'],
  ['WALL_OUTLINE', 1, 'CONTINUOUS'],   // red object lines
  ['OPENINGS', 1, 'CONTINUOUS'],
  ['CABINETRY', 1, 'CONTINUOUS'],
  ['DIMENSIONS', 1, 'CONTINUOUS'],     // RED dimensions
  ['HATCH', 8, 'CONTINUOUS'],
  ['ANNOTATIONS', 1, 'CONTINUOUS'],    // red leader lines + callouts
  ['REF_LINES', 2, 'DASHED'],          // yellow dashed
  ['TITLEBLOCK', 4, 'CONTINUOUS'],     // cyan
  ['GLASS', 9, 'CONTINUOUS'],          // light blue glass
  ['CANE', 3, 'CONTINUOUS'],           // green cane
  ['HANDLE', 5, 'CONTINUOUS'],         // blue handle
  ['FRAME', 6, 'CONTINUOUS'],          // magenta frame
  ['RUG', 7, 'CONTINUOUS'],            // white/rug boundary
  ['AREA', 7, 'CONTINUOUS'],           // area annotations
  ['FURNITURE', 7, 'CONTINUOUS']       // furniture block
];

class DXF {
  constructor() { this.lines = []; }
  push(code, val) {
    this.lines.push(String(code).padStart(3, ' '));
    this.lines.push(typeof val === 'number' ? val.toFixed(3) : String(val));
  }
  raw(...p) { for (let i = 0; i < p.length; i += 2) this.push(p[i], p[i + 1]); }

  line(x1, y1, x2, y2, layer = '0') {
    this.raw('  0', 'LINE', '  8', layer);
    this.raw(' 10', x1, ' 20', y1, ' 30', 0);
    this.raw(' 11', x2, ' 21', y2, ' 31', 0);
  }
  rect(x, y, w, h, layer = '0') { this.line(x,y,x+w,y,layer); this.line(x+w,y,x+w,y+h,layer); this.line(x+w,y+h,x,y+h,layer); this.line(x,y+h,x,y,layer); }
  poly(points, layer = '0', closed = true) {
    this.raw('  0', 'LWPOLYLINE', '  8', layer, ' 90', points.length, ' 70', closed ? 1 : 0);
    for (const [x, y] of points) this.raw(' 10', x, ' 20', y);
  }
  arc(cx, cy, r, a0, a1, layer = '0') { this.raw('  0', 'ARC', '  8', layer, ' 10', cx, ' 20', cy, ' 30', 0, ' 40', r, ' 50', a0, ' 51', a1); }
  // small filled arrowhead approximated by a solid triangle (2 short lines)
  _arrow(x, y, dir, size = 120) {
    const a = dir === 'in' ? 0 : Math.PI; // not heavily used; ticks preferred
    this.line(x, y, x + size * Math.cos(a + 0.4), y + size * Math.sin(a + 0.4), 'DIMENSIONS');
    this.line(x, y, x + size * Math.cos(a - 0.4), y + size * Math.sin(a - 0.4), 'DIMENSIONS');
  }
  text(x, y, str, h = 180, layer = 'ANNOTATIONS', align = 'MIDDLE') {
    this.raw('  0', 'TEXT', '  8', layer, ' 10', x, ' 20', y, ' 30', 0, ' 40', h, '  1', String(str).toUpperCase(), ' 72', 1, ' 11', x, ' 21', y);
  }
  // oblique tick mark at (x,y) perpendicular to a (angle of dimension line)
  _tick(x, y, ang) {
    const t = ang + Math.PI / 2;
    const s = 90;
    this.line(x - s * Math.cos(t), y - s * Math.sin(t), x + s * Math.cos(t), y + s * Math.sin(t), 'DIMENSIONS');
  }

  // ---- New component helpers (DXF-ENRICH-1) ----
  glassRect(x, y, w, h, paneGap = 120) {
    // outer frame on FRAME, inner pane dividers on GLASS
    this.rect(x, y, w, h, 'FRAME');
    this.line(x + w / 2, y, x + w / 2, y + h, 'GLASS');
    this.line(x, y + h / 2, x + w, y + h / 2, 'GLASS');
    // dense diagonal glazing hatch feel via diagonal lines
    for (let i = -h; i < w + h; i += paneGap) {
      this.line(x + i, y, x + i + h, y + h, 'GLASS');
    }
  }
  canePanel(x, y, w, h) {
    // outer frame
    this.rect(x, y, w, h, 'FRAME');
    // horizontal cane slats
    const slat = 18;
    const gap = 10;
    for (let gy = y + gap; gy < y + h - slat; gy += slat + gap) {
      this.line(x + gap, gy, x + w - gap, gy, 'CANE');
    }
    this.text(x + w / 2, y + h / 2, 'CANE PANEL', 140, 'CANE', 'MIDDLE');
  }
  handleGlyph(x, y, w, h, type = 'pull') {
    // simple top-down handle symbol on HANDLE layer
    this.rect(x, y, w, h, 'FRAME');
    if (type === 'pull') {
      this.arc(x + w / 2, y + h + 120, Math.max(1, w / 2), Math.PI, 0, 'HANDLE');
      this.line(x + w / 2, y, x + w / 2, y + h, 'HANDLE');
    } else if (type === 'bar') {
      this.line(x + w * 0.2, y + h / 2, x + w * 0.8, y + h / 2, 'HANDLE');
      this.line(x + w * 0.2, y + h / 2 - 40, x + w * 0.2, y + h / 2 + 40, 'HANDLE');
      this.line(x + w * 0.8, y + h / 2 - 40, x + w * 0.8, y + h / 2 + 40, 'HANDLE');
    } else {
      this.arc(x + w / 2, y + h / 2, Math.max(1, Math.min(w, h) / 2), 0, Math.PI * 2, 'HANDLE');
    }
  }
  // === injected frameBracket ===
  frameBracket(x, y, w, h) {
    // simplified 4-corner bracket with horizontal flange
    const flange = 90;
    for (const [fx,fy] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]) {
      this.line(fx, fy, fx + (fx < x+w/2 ? flange : -flange), fy, 'FRAME');
      this.line(fx, fy, fx, fy + (fy < y+h/2 ? flange : -flange), 'FRAME');
    }
    this.rect(x, y, w, h, 'FRAME');
    this.text(x + w / 2, y + h / 2, 'FRAME BRACKET', 130, 'FRAME');
  }

  rugArea(x, y, w, h, label = 'RUG ZONE') {
    this.rect(x, y, w, h, 'RUG');
    // dashed-ish rug boundary via cross marks
    const step = 180;
    for (let rx = x + step; rx < x + w; rx += step) this.line(rx, y, rx, y + h, 'RUG');
    for (let ry = y + step; ry < y + h; ry += step) this.line(x, ry, x + w, ry, 'RUG');
    this.text(x + w / 2, y + h / 2, label, 160, 'RUG', 'MIDDLE');
  }
  areaCircle(x, y, r, label = 'SEATING') {
    this.arc(x, y, Math.max(1, r), 0, Math.PI * 2, 'AREA');
    this.text(x, y, label, 160, 'AREA', 'MIDDLE');
  }
  furnitureBlock(x, y, w, h, label = 'UNIT') {
    this.rect(x, y, w, h, 'FURNITURE');
    this.text(x + w / 2, y + h / 2, label, 160, 'FURNITURE', 'MIDDLE');
  }
  hatch(boundary, layer = 'HATCH', pattern = 'ANSI31', scale = 60) {
    this.raw('  0', 'HATCH', '  8', layer, '  2', pattern, ' 70', 1, ' 71', 1);
    this.raw(' 91', boundary.length, ' 92', 1, ' 72', 3, ' 73', 1, ' 93', boundary.length);
    for (const [x, y] of boundary) this.raw(' 10', x, ' 20', y);
    this.raw(' 75', 0, ' 76', 1, ' 77', 0, ' 78', 1, ' 53', 0, ' 43', scale, ' 44', 0, ' 45', 0, ' 46', 0, ' 79', 0, ' 47', 0, ' 98', 1, ' 10', boundary[0][0], ' 20', boundary[0][1]);
  }

  // ---- RED DIMENSION (benchmark: red ext line + red dim line + red text, ticks) ----
  dimH(x1, x2, y, yBase, label, useArrows = false) {
    const extDrop = yBase < y ? 220 : 220; // extension overshoot
    this.line(x1, y, x1, y - extDrop, 'DIMENSIONS');
    this.line(x2, y, x2, y - extDrop, 'DIMENSIONS');
    this.line(x1, y, x2, y, 'DIMENSIONS');
    if (useArrows) { this._arrow(x1, y, 'in'); this._arrow(x2, y, 'in'); }
    else { this._tick(x1, y, 0); this._tick(x2, y, 0); }
    this.text((x1 + x2) / 2, y + 160, label, 150, 'DIMENSIONS');
  }
  dimV(x, y1, y2, xLine, label, useArrows = false) {
    const ext = 220;
    this.line(x, y1, x - ext, y1, 'DIMENSIONS');
    this.line(x, y2, x - ext, y2, 'DIMENSIONS');
    this.line(x, y1, x, y2, 'DIMENSIONS');
    if (useArrows) { this._arrow(x, y1, 'in'); this._arrow(x, y2, 'in'); }
    else { this._tick(x, y1, Math.PI / 2); this._tick(x, y2, Math.PI / 2); }
    this.text(x - 320, (y1 + y2) / 2, label, 150, 'DIMENSIONS', 'MIDDLE');
  }

  // ---- red leader line + callout (benchmark) ----
  callout(x, y, tx, ty, label, layer = 'ANNOTATIONS') {
    this.line(x, y, tx, ty, 'ANNOTATIONS'); // leader
    this.line(tx - 30, ty + 30, tx + 30, ty + 30, 'ANNOTATIONS'); // witness tick (optional)
    this.text(tx, ty, label, 150, 'ANNOTATIONS');
  }

  // ===== ELEVATION SHEET =====
  drawElevation(model, originX = 0, originY = 0) {
    const x0 = originX, y0 = originY;
    const L = model.lengthMm, H = model.heightMm, T = model.thicknessMm || 75;

    // Wall outline (thick red object line)
    this.rect(x0, y0, L, H, 'WALL_OUTLINE');
    if (T > 0) this.rect(x0 + T, y0, L - 2 * T, H, 'WALL_OUTLINE');
    // concrete beam hatch at top (benchmark: aggregate hatch)
    this.hatch([[x0, y0 + H], [x0 + L, y0 + H], [x0 + L, y0 + H + 280], [x0, y0 + H + 280]], 'HATCH', 'ANSI31', 50);
    this.text(x0 + L - 600, y0 + H + 340, 'BEAM', 170, 'ANNOTATIONS');
    // floor band hatch
    this.hatch([[x0, y0], [x0 + L, y0], [x0 + L, y0 - 240], [x0, y0 - 240]], 'HATCH', 'ANSI31', 80);

    // Openings
    for (const op of model.openings) {
      const ox = x0 + op.offsetMm, oy = y0 + op.sillMm, ow = op.widthMm, oh = op.headMm - op.sillMm;
      this.rect(ox, oy, ow, oh, 'OPENINGS');
      this.line(ox, oy, ox + ow, oy + oh, 'OPENINGS');
      this.line(ox + ow, oy, ox, oy + oh, 'OPENINGS');
      if (op.type === 'window') {
        // glazing diagonal hatch (light blue approximated by thin line)
        for (let i = 0; i < ow; i += 120) this.line(ox + i, oy, ox + i + oh, oy + oh, 'OPENINGS');
        this.callout(ox + ow / 2, oy + oh / 2, ox + ow + 700, oy + oh / 2, op.type === 'window' ? 'BLACK PROFILE SHUTTER WITH GREY TINTED GLASS' : 'SHUTTER');
      } else {
        this.callout(ox + ow / 2, oy + oh / 2, ox + ow + 700, oy + oh / 2, 'DOOR');
      }
      this.dimH(ox, ox + ow, oy - 380, oy, `${Math.round(ow)}`, false);
    }

    // Cabinets
    for (const c of model.cabinets) {
      const cx = x0 + c.xOffsetMm, cy = y0 + c.zOffsetMm, cw = c.widthMm, ch = c.heightMm;
      this.rect(cx, cy, cw, ch, 'CABINETRY');
      // drawer subdivisions
      if (c.tag === 'DRAWER' || /drawer/i.test(c.name)) {
        const n = Math.max(2, Math.round(ch / 250));
        for (let i = 1; i < n; i++) this.line(cx, cy + (ch * i) / n, cx + cw, cy + (ch * i) / n, 'CABINETRY');
      } else if (cw > 500) {
        this.line(cx + cw / 2, cy, cx + cw / 2, cy + ch, 'CABINETRY'); // double door split
        this.arc(cx, cy + ch / 2, cw / 2, 0, 90, 'CABINETRY');        // hinge swing
      } else {
        this.arc(cx, cy + ch / 2, cw, 0, 90, 'CABINETRY');
      }
      // glazing hatch if glass
      if (c.material?.glass) for (let i = 0; i < cw; i += 90) this.line(cx + i, cy, cx + i + ch, cy + ch, 'CABINETRY');
      // component tag (benchmark style)
      this.text(cx + cw / 2, cy + ch / 2, c.tag, 170, 'CABINETRY');
      this.text(cx + cw / 2, cy + 90, `${Math.round(cw)}x${Math.round(ch)}`, 130, 'CABINETRY');
      // material callout (red leader)
      if (c.material?.callout) this.callout(cx + cw / 2, cy + ch - 60, cx + cw + 700, cy + ch - 60, c.material.callout);
      if (c.lighting) this.callout(cx + cw / 2, cy + 60, cx - 700, cy + 60, c.lighting);
      // Richer component symbols (glass inset / cane panel / handle glyph)
      if (c.material?.glass && cw > 140 && ch > 140) this.glassRect(cx + 40, cy + 40, Math.max(1, cw - 80), Math.max(1, ch - 80), 100);
      if (c.material?.cane && cw > 140 && ch > 140) this.canePanel(cx + 40, cy + 40, Math.max(1, cw - 80), Math.max(1, ch - 80));
      this.handleGlyph(cx + cw - 110, cy + ch / 2 - 60, 80, 120, c.handleType || 'pull');
      if (ch > 220) this.handleGlyph(cx + 50, cy + ch / 2 - 60, 80, 120, 'bar');
    }

    // Overall dimension (ARROWS on outer, ticks on inner)
    this.dimH(x0, x0 + L, y0 + H + 600, y0 + H, `${L} mm`, true);
    this.dimV(x0 + L + 600, y0, y0 + H, x0 + L, `${H} mm`, true);

    // coverage annotation
    const cov = model.coverage;
    this.text(x0, y0 - 500, `UTIL ${cov.utilizationPct}%  USED ${cov.usedMm}mm  FREE ${cov.freeMm}mm`, 150, 'ANNOTATIONS');
    return this;
  }

  drawTopView(topView, originX, originY) {
    this.text(originX, originY + 400, 'TOP VIEW', 300, 'ANNOTATIONS');
    for (const w of topView.walls) this.line(originX + w.x1, originY - w.y1, originX + w.x2, originY - w.y2, 'WALL_OUTLINE');
    for (const f of topView.furniture) this.rect(originX + f.xOffsetMm, originY - 200, f.widthMm, 200, 'CABINETRY');
    return this;
  }

  drawTitleBlock(x, y, w, h, meta = {}) {
    this.rect(x, y, w, h, 'TITLEBLOCK');
    this.line(x, y + h - 300, x + w, y + h - 300, 'TITLEBLOCK');
    const rows = [
      `PROJECT: ${meta.projectId || 'N/A'}`,
      `SHEET: ${meta.sheet || 'WALL ELEVATION'}`,
      `SCALE: ${meta.scale || '1:25'}`,
      `DRAWN: AURABRAIN  REV ${meta.rev || '1.0'}`,
      `DATE: ${meta.date || new Date().toISOString().slice(0, 10)}`
    ];
    rows.forEach((r, i) => this.text(x + 200, y + h - 420 - i * 240, r, 140, 'TITLEBLOCK', 'LEFT'));
    return this;
  }

  toString() {
    const out = [];
    out.push('  0', 'SECTION', '  2', 'HEADER', '  9', '$INSUNITS', ' 70', 4, '  0', 'ENDSEC'); // 4=mm
    out.push('  0', 'SECTION', '  2', 'TABLES', '  0', 'TABLE', '  2', 'LAYER', ' 70', String(LAYERS.length));
    for (const [name, color, ltype] of LAYERS) out.push('  0', 'LAYER', '  2', name, ' 70', 0, ' 62', color, '  6', ltype);
    out.push('  0', 'ENDTAB', '  0', 'ENDSEC');
    out.push('  0', 'SECTION', '  2', 'ENTITIES');
    out.push(...this.lines);
    out.push('  0', 'ENDSEC', '  0', 'EOF');
    return out.join('\n');
  }
}

export function buildElevationDXF(model, opts = {}) {
  const dxf = new DXF();
  const margin = 1500;
  dxf.drawElevation(model, margin, margin);
  if (opts.topView) dxf.drawTopView(opts.topView, margin, margin + model.heightMm + 4000);
  dxf.drawTitleBlock(margin, margin - 2200, 6200, 1700, {
    projectId: model.projectId, sheet: model.wallName, scale: opts.scale || '1:25', rev: opts.rev || '1.0'
  });
  return dxf.toString();
}

export default { DXF, buildElevationDXF };
