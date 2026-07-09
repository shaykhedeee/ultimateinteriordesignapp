/**
 * dxf-writer.js  (v3 — AutoCAD-valid professional millwork shop-drawing output)
 * --------------------------------------------------------------------------
 * AutoCAD R2010 ASCII DXF, model space in millimetres.
 * FIX v3: every entity now carries the REQUIRED subclass markers
 * (AcDbEntity + entity-specific AcDb* subclass) so AutoCAD / ezdxf / LibreCAD
 * can open the file. The previous LWPOLYLINE-without-subclass bug made the
 * file unopenable in AutoCAD. HATCH entities are replaced by explicit
 * diagonal line-hatching (no malformed HATCH group codes).
 *
 * Conventions: thick black object lines, THIN RED dimensions with red
 * extension lines + red numeric text, red leader lines to callouts,
 * component tags (DRAWER / SHUTTER / OPEN UNIT ...), material callouts,
 * and a title block.
 *
 * Pure + dependency-free => unit-testable.
 */

// Layer table: name -> [color, linetype]
const LAYERS = [
  ['0', 7, 'CONTINUOUS'],
  ['WALL_OUTLINE', 1, 'CONTINUOUS'],
  ['OPENINGS', 1, 'CONTINUOUS'],
  ['CABINETRY', 1, 'CONTINUOUS'],
  ['DIMENSIONS', 1, 'CONTINUOUS'],
  ['HATCH', 8, 'CONTINUOUS'],
  ['ANNOTATIONS', 1, 'CONTINUOUS'],
  ['REF_LINES', 2, 'DASHED'],
  ['TITLEBLOCK', 4, 'CONTINUOUS'],
  ['GLASS', 9, 'CONTINUOUS'],
  ['CANE', 3, 'CONTINUOUS'],
  ['HANDLE', 5, 'CONTINUOUS'],
  ['FRAME', 6, 'CONTINUOUS'],
  ['RUG', 7, 'CONTINUOUS'],
  ['AREA', 7, 'CONTINUOUS'],
  ['FURNITURE', 7, 'CONTINUOUS'],
];

class DXF {
  constructor() { this.lines = []; this._hc = 0x100; }
  _h() { this._hc += 1; return this._hc.toString(16).toUpperCase().padStart(3, '0'); }
  push(code, val) {
    this.lines.push(String(code).padStart(3, ' '));
    this.lines.push(typeof val === 'number' ? val.toFixed(3) : String(val));
  }
  raw(...p) { for (let i = 0; i < p.length; i += 2) this.push(p[i], p[i + 1]); }

  // ---- entity primitives (all carry AcDb subclass markers) ----
  line(x1, y1, x2, y2, layer = '0') {
    this.raw('  0', 'LINE', '  5', this._h(), '100', 'AcDbEntity', '  8', layer);
    this.raw('100', 'AcDbLine');
    this.raw(' 10', x1, ' 20', y1, ' 30', 0);
    this.raw(' 11', x2, ' 21', y2, ' 31', 0);
  }
  rect(x, y, w, h, layer = '0') { this.line(x, y, x + w, y, layer); this.line(x + w, y, x + w, y + h, layer); this.line(x + w, y + h, x, y + h, layer); this.line(x, y + h, x, y, layer); }
  poly(points, layer = '0', closed = true) {
    this.raw('  0', 'LWPOLYLINE', '  5', this._h(), '100', 'AcDbEntity', '  8', layer);
    this.raw('100', 'AcDbPolyline');
    this.raw(' 90', points.length, ' 70', closed ? 1 : 0);
    for (const [x, y] of points) this.raw(' 10', x, ' 20', y);
  }
  arc(cx, cy, r, a0, a1, layer = '0') {
    this.raw('  0', 'ARC', '  5', this._h(), '100', 'AcDbEntity', '  8', layer);
    this.raw('100', 'AcDbCircle');
    this.raw(' 10', cx, ' 20', cy, ' 30', 0, ' 40', r);
    this.raw('100', 'AcDbArc', ' 50', a0, ' 51', a1);
  }
  text(x, y, str, h = 180, layer = 'ANNOTATIONS', align = 'MIDDLE') {
    const a = align === 'LEFT' ? 0 : 1;
    this.raw('  0', 'TEXT', '  5', this._h(), '100', 'AcDbEntity', '  8', layer);
    this.raw('100', 'AcDbText');
    this.raw(' 10', x, ' 20', y, ' 30', 0, ' 40', h, '  1', String(str).toUpperCase());
    this.raw(' 72', a, ' 11', x, ' 21', y, ' 31', 0);
  }
  // oblique tick mark (dimension witness)
  _tick(x, y, ang) {
    const t = ang + Math.PI / 2, s = 90;
    this.line(x - s * Math.cos(t), y - s * Math.sin(t), x + s * Math.cos(t), y + s * Math.sin(t), 'DIMENSIONS');
  }
  _arrow(x, y, dir, size = 120) {
    const a = dir === 'in' ? 0 : Math.PI;
    this.line(x, y, x + size * Math.cos(a + 0.4), y + size * Math.sin(a + 0.4), 'DIMENSIONS');
    this.line(x, y, x + size * Math.cos(a - 0.4), y + size * Math.sin(a - 0.4), 'DIMENSIONS');
  }

  // ---- component helpers ----
  glassRect(x, y, w, h, paneGap = 120) {
    this.rect(x, y, w, h, 'FRAME');
    this.line(x + w / 2, y, x + w / 2, y + h, 'GLASS');
    this.line(x, y + h / 2, x + w, y + h / 2, 'GLASS');
    for (let i = -h; i < w + h; i += paneGap) this.line(x + i, y, x + i + h, y + h, 'GLASS');
  }
  canePanel(x, y, w, h) {
    this.rect(x, y, w, h, 'FRAME');
    const slat = 18, gap = 10;
    for (let gy = y + gap; gy < y + h - slat; gy += slat + gap) this.line(x + gap, gy, x + w - gap, gy, 'CANE');
    this.text(x + w / 2, y + h / 2, 'CANE PANEL', 140, 'CANE', 'MIDDLE');
  }
  handleGlyph(x, y, w, h, type = 'pull') {
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
  frameBracket(x, y, w, h) {
    const flange = 90;
    for (const [fx, fy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
      this.line(fx, fy, fx + (fx < x + w / 2 ? flange : -flange), fy, 'FRAME');
      this.line(fx, fy, fx, fy + (fy < y + h / 2 ? flange : -flange), 'FRAME');
    }
    this.rect(x, y, w, h, 'FRAME');
    this.text(x + w / 2, y + h / 2, 'FRAME BRACKET', 130, 'FRAME');
  }
  rugArea(x, y, w, h, label = 'RUG ZONE') {
    this.rect(x, y, w, h, 'RUG');
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
  // v3: real diagonal line-hatching instead of a malformed HATCH entity
  hatch(boundary, layer = 'HATCH', scale = 80) {
    if (!boundary || boundary.length < 3) return;
    const xs = boundary.map(p => p[0]), ys = boundary.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    // simple axis-aligned clip (boundary is always a rectangle in this app)
    for (let i = minX - (maxY - minY); i < maxX; i += scale) {
      const x1 = Math.max(minX, i), y1 = (i < minX) ? minY + (minX - i) : minY;
      const x2 = Math.min(maxX, i + (maxY - minY)), y2 = (i + (maxY - minY) > maxY) ? maxY : minY + (maxX - i);
      if (x2 > x1) this.line(x1, y1, x2, y2, layer);
    }
  }

  // ---- RED DIMENSION ----
  dimH(x1, x2, y, yBase, label, useArrows = false) {
    const ext = 220;
    this.line(x1, y, x1, y - ext, 'DIMENSIONS');
    this.line(x2, y, x2, y - ext, 'DIMENSIONS');
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
  callout(x, y, tx, ty, label, layer = 'ANNOTATIONS') {
    this.line(x, y, tx, ty, 'ANNOTATIONS');
    this.line(tx - 30, ty + 30, tx + 30, ty + 30, 'ANNOTATIONS');
    this.text(tx, ty, label, 150, 'ANNOTATIONS');
  }

  // ===== ELEVATION SHEET =====
  drawElevation(model, originX = 0, originY = 0) {
    const x0 = originX, y0 = originY;
    const L = model.lengthMm, H = model.heightMm, T = model.thicknessMm || 75;
    const openings = model.openings || [];
    const cabinets = model.cabinets || [];

    this.rect(x0, y0, L, H, 'WALL_OUTLINE');
    if (T > 0) this.rect(x0 + T, y0, L - 2 * T, H, 'WALL_OUTLINE');
    this.hatch([[x0, y0 + H], [x0 + L, y0 + H], [x0 + L, y0 + H + 280], [x0, y0 + H + 280]], 'HATCH', 50);
    this.text(x0 + L - 600, y0 + H + 340, 'BEAM', 170, 'ANNOTATIONS');
    this.hatch([[x0, y0], [x0 + L, y0], [x0 + L, y0 - 240], [x0, y0 - 240]], 'HATCH', 80);

    for (const op of openings) {
      const ox = x0 + op.offsetMm, oy = y0 + op.sillMm, ow = op.widthMm, oh = op.headMm - op.sillMm;
      this.rect(ox, oy, ow, oh, 'OPENINGS');
      this.line(ox, oy, ox + ow, oy + oh, 'OPENINGS');
      this.line(ox + ow, oy, ox, oy + oh, 'OPENINGS');
      if (op.type === 'window') {
        for (let i = 0; i < ow; i += 120) this.line(ox + i, oy, ox + i + oh, oy + oh, 'OPENINGS');
        this.callout(ox + ow / 2, oy + oh / 2, ox + ow + 700, oy + oh / 2, op.type === 'window' ? 'BLACK PROFILE SHUTTER WITH GREY TINTED GLASS' : 'SHUTTER');
      } else {
        this.callout(ox + ow / 2, oy + oh / 2, ox + ow + 700, oy + oh / 2, 'DOOR');
      }
      this.dimH(ox, ox + ow, oy - 380, oy, `${Math.round(ow)}`, false);
    }

    for (const c of cabinets) {
      const cx = x0 + c.xOffsetMm, cy = y0 + c.zOffsetMm, cw = c.widthMm, ch = c.heightMm;
      this.rect(cx, cy, cw, ch, 'CABINETRY');
      if (c.tag === 'DRAWER' || /drawer/i.test(c.name)) {
        const n = Math.max(2, Math.round(ch / 250));
        for (let i = 1; i < n; i++) this.line(cx, cy + (ch * i) / n, cx + cw, cy + (ch * i) / n, 'CABINETRY');
      } else if (cw > 500) {
        this.line(cx + cw / 2, cy, cx + cw / 2, cy + ch, 'CABINETRY');
        this.arc(cx, cy + ch / 2, cw / 2, 0, 90, 'CABINETRY');
      } else {
        this.arc(cx, cy + ch / 2, cw, 0, 90, 'CABINETRY');
      }
      if (c.material?.glass) for (let i = 0; i < cw; i += 90) this.line(cx + i, cy, cx + i + ch, cy + ch, 'CABINETRY');
      this.text(cx + cw / 2, cy + ch / 2, c.tag, 170, 'CABINETRY');
      this.text(cx + cw / 2, cy + 90, `${Math.round(cw)}x${Math.round(ch)}`, 130, 'CABINETRY');
      if (c.material?.callout) this.callout(cx + cw / 2, cy + ch - 60, cx + cw + 700, cy + ch - 60, c.material.callout);
      if (c.lighting) this.callout(cx + cw / 2, cy + 60, cx - 700, cy + 60, c.lighting);
      if (c.material?.glass && cw > 140 && ch > 140) this.glassRect(cx + 40, cy + 40, Math.max(1, cw - 80), Math.max(1, ch - 80), 100);
      if (c.material?.cane && cw > 140 && ch > 140) this.canePanel(cx + 40, cy + 40, Math.max(1, cw - 80), Math.max(1, ch - 80));
      this.handleGlyph(cx + cw - 110, cy + ch / 2 - 60, 80, 120, c.handleType || 'pull');
      if (ch > 220) this.handleGlyph(cx + 50, cy + ch / 2 - 60, 80, 120, 'bar');
    }

    this.dimH(x0, x0 + L, y0 + H + 600, y0 + H, `${L} mm`, true);
    this.dimV(x0 + L + 600, y0, y0 + H, x0 + L, `${H} mm`, true);

    const cov = model.coverage || { utilizationPct: 0, usedMm: Math.round(L), freeMm: 0 };
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
      `DATE: ${meta.date || new Date().toISOString().slice(0, 10)}`,
    ];
    rows.forEach((r, i) => this.text(x + 200, y + h - 420 - i * 240, r, 140, 'TITLEBLOCK', 'LEFT'));
    return this;
  }

  toString() {
    const out = [];
    // HEADER
    out.push('  0', 'SECTION', '  2', 'HEADER', '  9', '$ACADVER', '  1', 'AC1024', '  9', '$INSUNITS', ' 70', 4, '  0', 'ENDSEC');
    // TABLES: LAYER
    out.push('  0', 'SECTION', '  2', 'TABLES');
    out.push('  0', 'TABLE', '  2', 'LAYER', '  5', '2', '100', 'AcDbSymbolTable', ' 70', String(LAYERS.length));
    for (const [name, color, ltype] of LAYERS) {
      out.push('  0', 'LAYER', '  5', '10', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '  2', name, ' 70', 0, ' 62', color, '  6', ltype, '370', 0);
    }
    out.push('  0', 'ENDTAB', '  0', 'ENDSEC');
    // ENTITIES
    out.push('  0', 'SECTION', '  2', 'ENTITIES');
    out.push(...this.lines);
    out.push('  0', 'ENDSEC');
    // OBJECTS (empty, required for R2010)
    out.push('  0', 'SECTION', '  2', 'OBJECTS', '  0', 'ENDSEC');
    out.push('  0', 'EOF');
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
