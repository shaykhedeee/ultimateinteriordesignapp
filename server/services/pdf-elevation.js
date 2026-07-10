/**
 * pdf-elevation.js  (v3 — Professional high-precision clean drawing layout)
 * --------------------------------------------------------------------------
 * Renders a clean, industry-standard A3 landscape PDF elevation sheet using pdfkit:
 *   - mm-precise geometry from the ElevationModel
 *   - red dimension lines + witness lines + oblique tick marks (AutoCAD style)
 *   - door-swing arcs, handle glyphs, component tags
 *   - BEAM + plinth hatch, material callouts + leader lines
 *   - Notes / Legend / Material Schedule tables using clean blue accents
 *   - Rich Title Block (Project, Client, Sheet, Scale, Drawn-By, Rev, Date)
 */
import PDFDocument from 'pdfkit';

// Clean Industry Colors
const RED = '#e03a3a';
const BLK = '#1a1a1a';
const GREY = '#666666';
const BLUE = '#2563eb';
const WHITE = '#ffffff';

// Oblique 45-degree architectural tick drawing helper
function drawObliqueTick(doc, x, y, size = 4) {
  doc.lineWidth(0.8).strokeColor(RED)
    .moveTo(x - size, y + size)
    .lineTo(x + size, y - size)
    .stroke();
}

function drawElevation(doc, model, opts = {}) {
  const L = model.lengthMm;
  const H = model.heightMm;
  const startX = 120;
  const baseY = 560;               // floor line (mm 0)
  const scale = 0.16;              // px per mm
  const toX = mm => startX + mm * scale;
  const toY = mm => baseY - mm * scale;

  // Double sheet border (clean style)
  doc.lineWidth(2).strokeColor(BLK).rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(36, 36, doc.page.width - 72, doc.page.height - 72).stroke();

  // Wall outline (thick dark line)
  doc.lineWidth(2.5).strokeColor(BLK).rect(toX(0), toY(H), L * scale, H * scale).stroke();

  // Beam hatch + label
  doc.lineWidth(0.4).strokeColor(GREY);
  for (let x = toX(0); x < toX(L); x += 6) doc.moveTo(x, toY(H) - 14).lineTo(x + 10, toY(H)).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(BLK).text('BEAM', toX(L) - 30, toY(H) - 26);

  // Plinth datum + label
  doc.lineWidth(1.2).strokeColor(GREY).dash(4, 4).moveTo(toX(0) - 20, baseY).lineTo(toX(L) + 20, baseY).stroke();
  doc.undash();
  doc.font('Helvetica-Oblique').fontSize(7).fillColor(GREY).text('PLINTH LEVEL (100mm)', toX(0) + 30, baseY + 2);

  // Openings (with swing arcs + dims)
  const openings = model.openings || [];
  for (const op of openings) {
    const x = toX(op.offsetMm), y = toY(op.headMm), w = op.widthMm * scale, h = (op.headMm - op.sillMm) * scale;
    doc.lineWidth(1.5).strokeColor(BLK).rect(x, y, w, h).stroke();
    doc.lineWidth(0.4).moveTo(x, y).lineTo(x + w, y + h).moveTo(x + w, y).lineTo(x, y + h).stroke();
    if (op.type === 'window') {
      for (let i = 0; i < w; i += 12) doc.moveTo(x + i, y).lineTo(x + i + h, y + h).stroke();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLK).text('WINDOW', x, y + h / 2 - 4, { width: w, align: 'center' });
    } else {
      // door swing arc
      const sx = x, sy = y + h, r = w, steps = 24;
      doc.lineWidth(0.6).dash(2, 2).strokeColor(GREY);
      doc.moveTo(sx, sy);
      for (let i = 1; i <= steps; i++) {
        const a = (-Math.PI / 2) + (Math.PI / 2) * (i / steps);
        doc.lineTo(sx + r * Math.cos(a), sy + r * Math.sin(a));
      }
      doc.stroke();
      doc.undash();
      doc.font('Helvetica-Bold').fontSize(8).fillColor(BLK).text('DOOR', x, y + h / 2 - 4, { width: w, align: 'center' });
    }
    // dimension (Red, witness + oblique ticks)
    if (!opts.noDimensions) {
      doc.lineWidth(0.6).strokeColor(RED);
      doc.moveTo(x, y - 8).lineTo(x, y - 16).moveTo(x + w, y - 8).lineTo(x + w, y - 16).moveTo(x, y - 12).lineTo(x + w, y - 12).stroke();
      drawObliqueTick(doc, x, y - 12);
      drawObliqueTick(doc, x + w, y - 12);
      doc.font('Helvetica-Bold').fontSize(7).fillColor(RED).text(String(Math.round(op.widthMm)), x, y - 22, { width: w, align: 'center' });
    }
  }

  // Cabinets (detail + handle + material callouts)
  const cabinets = model.cabinets || [];
  for (const c of cabinets) {
    const x = toX(c.xOffsetMm), y = toY(c.zOffsetMm + c.heightMm), w = c.widthMm * scale, h = c.heightMm * scale;
    const m = c.material || {};
    const tag = c.tag || c.type || 'SHUTTER';
    const isOpen = m.openShelf || tag === 'OPEN' || tag === 'OPEN UNIT' || tag === 'OPEN SHELF' || tag.includes('SHELVES') || tag.includes('NICHE');

    // Fill background with white for clean rendering
    doc.fillColor(WHITE).rect(x, y, w, h).fill();

    doc.lineWidth(1.5).strokeColor(BLK).rect(x, y, w, h).stroke();
    
    // Draw diagonal cross inside fillers/voids (RED)
    if (c.widthMm < 300 || tag === 'FILLER' || tag === 'VOID') {
      doc.lineWidth(0.4).strokeColor(RED);
      doc.moveTo(x, y).lineTo(x + w, y + h).moveTo(x + w, y).lineTo(x, y + h).stroke();
    }

    // two-tone split
    if (m.twoTone) {
      const sy = y + h * (1 - (m.splitRatio || 0.5));
      doc.lineWidth(0.9).strokeColor(BLK).moveTo(x, sy).lineTo(x + w, sy).stroke();
    }
    // vertical fluting
    if (m.fluted) {
      doc.lineWidth(0.4).strokeColor(GREY);
      const pitch = Math.max(3, (m.flutePitch || 45) * scale);
      for (let fx = x + pitch; fx < x + w - 1; fx += pitch) doc.moveTo(fx, y + 3).lineTo(fx, y + h - 3).stroke();
    }
    // appliance glyphs
    if (m.appliance === 'fridge') {
      doc.lineWidth(0.7).strokeColor(BLK).moveTo(x, y + h * 0.38).lineTo(x + w, y + h * 0.38).stroke();
      doc.moveTo(x + w / 2, y).lineTo(x + w / 2, y + h * 0.38).stroke();
      doc.rect(x + w * 0.08, y + h * 0.14, w * 0.28, h * 0.16).stroke();
      doc.font('Helvetica-Bold').fontSize(7).fillColor(BLK).text('FRIDGE', x, y + h / 2, { width: w, align: 'center' });
    } else if (m.appliance === 'hood') {
      doc.lineWidth(0.7).strokeColor(BLK).moveTo(x, y + h).lineTo(x + w * 0.28, y).lineTo(x + w * 0.72, y).lineTo(x + w, y + h).stroke();
      doc.font('Helvetica-Bold').fontSize(7).fillColor(BLK).text('HOOD', x, y + h / 2, { width: w, align: 'center' });
    } else if (m.appliance === 'cooktop') {
      doc.lineWidth(0.7).strokeColor(BLK);
      for (const fx of [0.3, 0.7]) doc.circle(x + w * fx, y + h * 0.5, Math.min(w, h) * 0.16).stroke();
      doc.font('Helvetica-Bold').fontSize(7).fillColor(BLK).text('HOB', x, y + h * 0.1, { width: w, align: 'center' });
    } else if (m.appliance === 'sink') {
      doc.lineWidth(0.7).strokeColor(BLK).rect(x + w * 0.12, y + h * 0.25, w * 0.76, h * 0.55).stroke();
      doc.circle(x + w / 2, y + h * 0.52, 3).stroke();
      doc.moveTo(x + w * 0.5, y + h * 0.25).lineTo(x + w * 0.5, y).stroke();
      doc.font('Helvetica-Bold').fontSize(7).fillColor(BLK).text('SINK', x, y + h * 0.85, { width: w, align: 'center' });
    }
    
    // arched top mirror / feature panels
    if (m.arch) {
      doc.lineWidth(1).strokeColor(BLK);
      const r = w / 2, cx = x + w / 2;
      doc.moveTo(x, y + h);
      doc.lineTo(x, y + r);
      for (let a = Math.PI; a >= 0; a -= Math.PI / 24) doc.lineTo(cx + r * Math.cos(a), y + r - r * Math.sin(a));
      doc.lineTo(x + w, y + h);
      doc.stroke();
    }
    
    // shelves or door swing representations
    if (isOpen) {
      const shelves = m.shelves || Math.max(1, Math.round(c.heightMm / 350));
      doc.lineWidth(0.7).strokeColor(GREY);
      for (let i = 1; i < shelves; i++) doc.moveTo(x + 3, y + (h * i) / shelves).lineTo(x + w - 3, y + (h * i) / shelves).stroke();
    }
    // hanger space: hanging rod near the TOP of the section + brackets
    if (m.hanger || c.hanger) {
      const rodY = y + Math.min(h * 0.16, 18);
      doc.lineWidth(1.4).strokeColor('#222222').moveTo(x + 4, rodY).lineTo(x + w - 4, rodY).stroke();
      doc.lineWidth(0.8).strokeColor('#222222').moveTo(x + 4, rodY - 4).lineTo(x + 4, rodY + 4).moveTo(x + w - 4, rodY - 4).lineTo(x + w - 4, rodY + 4).stroke();
      // small hook glyphs
      doc.lineWidth(0.6).strokeColor('#222222');
      for (let hx = x + 12; hx < x + w - 8; hx += 28) doc.moveTo(hx, rodY).lineTo(hx, rodY + 6).stroke();
    } else if (tag === 'DRAWER' || /drawer/i.test(c.name)) {
      const n = Math.max(2, Math.round(c.heightMm / 250));
      for (let i = 1; i < n; i++) doc.lineWidth(0.7).moveTo(x, y + (h * i) / n).lineTo(x + w, y + (h * i) / n).stroke();
    } else if (!m.appliance && tag !== 'FILLER' && tag !== 'VOID') {
      // V-swing dash overlays
      doc.lineWidth(0.5).dash(2, 2).strokeColor(GREY);
      if (c.widthMm > 500) {
        // Double shutter swings
        doc.moveTo(x, y).lineTo(x + w / 4, y + h / 2).lineTo(x, y + h).stroke();
        doc.moveTo(x + w, y).lineTo(x + w * 0.75, y + h / 2).lineTo(x + w, y + h).stroke();
      } else {
        // Single shutter swing
        doc.moveTo(x + w, y).lineTo(x, y + h / 2).lineTo(x + w, y + h).stroke();
      }
      doc.undash();
    }
    // glass grid muntins
    if ((m.glass || m.glassGrid) && w > 24 && h > 24) {
      const cols = m.glassCols || 1, rows = m.glassRows || 3;
      doc.lineWidth(0.4).strokeColor(BLUE);
      for (let i = 1; i < cols; i++) doc.moveTo(x + (w * i) / cols, y + 4).lineTo(x + (w * i) / cols, y + h - 4).stroke();
      for (let j = 1; j < rows; j++) doc.moveTo(x + 4, y + (h * j) / rows).lineTo(x + w - 4, y + (h * j) / rows).stroke();
    }
    // handle glyph
    if (c.handleType === 'none' || m.appliance || isOpen || tag === 'FILLER' || tag === 'VOID') {
      // none
    } else if (c.handleType === 'vbar') {
      const vw = Math.max(3, w * 0.06);
      doc.rect(x + w - vw - 4, y + h * 0.18, vw, h * 0.64).fill(BLK);
    } else if (c.handleType === 'knob') {
      doc.lineWidth(1).strokeColor(BLK).circle(x + w - 12, y + h / 2, 2.4).stroke();
    } else if (c.handleType === 'bar') {
      doc.lineWidth(1.2).strokeColor(BLK).moveTo(x + w * 0.3, y + h / 2).lineTo(x + w * 0.7, y + h / 2).stroke();
    } else {
      doc.lineWidth(1).strokeColor(BLK).moveTo(x + w * 0.5, y + h * 0.25).lineTo(x + w * 0.5, y + h * 0.75).stroke();
    }
    
    // Counter slab (thin top line) + basin cutout for vanities
    if (m.counter) {
      doc.lineWidth(1.6).strokeColor('#0F172A').moveTo(x, y + h - 3).lineTo(x + w, y + h - 3).stroke();
      doc.lineWidth(0.6).strokeColor('#0F172A').moveTo(x, y + h - 7).lineTo(x + w, y + h - 7).stroke();
    }
    if (m.basin) {
      const cx = x + w / 2, cy = y + h - 40, rx = Math.min(w * 0.32, 26), ry = Math.min(h * 0.16, 18);
      doc.lineWidth(1).strokeColor('#0F172A').ellipse(cx, cy, rx, ry).stroke();
      doc.lineWidth(0.6).strokeColor(GREY).ellipse(cx, cy, rx * 0.6, ry * 0.6).stroke();
      doc.font('Helvetica').fontSize(5).fillColor(GREY).text('BASIN', cx - 12, cy + ry + 1, { width: 24, align: 'center' });
    }

    // Label texts (centered natively via PDFKit)
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(BLK).text(tag, x, y + h / 2 - 5, { width: w, align: 'center' });
    doc.font('Helvetica').fontSize(5.5).fillColor(GREY).text(`${Math.round(c.widthMm)}x${Math.round(c.heightMm)}`, x, y + h - 10, { width: w, align: 'center' });
  }

  // Overall dimensions (Red, arrowheads)
  if (!opts.noDimensions) {
    doc.lineWidth(0.8).strokeColor(RED)
      .moveTo(toX(0), toY(H) - 16).lineTo(toX(0), toY(H) - 26)
      .moveTo(toX(L), toY(H) - 16).lineTo(toX(L), toY(H) - 26)
      .moveTo(toX(0), toY(H) - 21).lineTo(toX(L), toY(H) - 21).stroke();
    drawObliqueTick(doc, toX(0), toY(H) - 21);
    drawObliqueTick(doc, toX(L), toY(H) - 21);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(RED).text(`${L} MM`, (toX(0) + toX(L)) / 2 - 18, toY(H) - 34);
    
    doc.lineWidth(0.8)
      .moveTo(toX(L) + 16, toY(0)).lineTo(toX(L) + 26, toY(0))
      .moveTo(toX(L) + 16, toY(H)).lineTo(toX(L) + 26, toY(H))
      .moveTo(toX(L) + 21, toY(0)).lineTo(toX(L) + 21, toY(H)).stroke();
    drawObliqueTick(doc, toX(L) + 21, toY(0));
    drawObliqueTick(doc, toX(L) + 21, toY(H));
    doc.font('Helvetica-Bold').fontSize(9).fillColor(RED).text(`${H} MM`, toX(L) + 32, (toY(0) + toY(H)) / 2 - 4);
  }

  // Per-bay dimension chains (each module width) — AutoCAD-style, below elevation
  if (!opts.noDimensions) {
    const dimY = toY(0) + 26;            // below floor line
    doc.lineWidth(0.6).strokeColor(RED);
    doc.moveTo(toX(0), dimY - 6).lineTo(toX(0), dimY + 6);
    doc.moveTo(toX(L), dimY - 6).lineTo(toX(L), dimY + 6);
    doc.moveTo(toX(0), dimY).lineTo(toX(L), dimY).stroke();
    drawObliqueTick(doc, toX(0), dimY);
    drawObliqueTick(doc, toX(L), dimY);
    // segment ticks + labels per bay (collapse tiny fillers)
    let cx = 0;
    const bayWidths = [];
    for (const c of cabinets) {
      if (c.zOffsetMm !== 0) continue;
      const isBayTag = c.tag === 'DRAWER' || c.tag === 'BASE' || c.tag === 'OPEN UNIT' || c.tag === 'SHUTTER' || c.tag === 'LOFT';
      if (!isBayTag || c.widthMm < 300) continue;
      const end = c.xOffsetMm + c.widthMm;
      const prev = bayWidths.length ? bayWidths[bayWidths.length - 1] : null;
      if (prev && Math.abs(c.xOffsetMm - prev.end) < 1) {
        prev.end = end;
        prev.w = prev.end - prev.start;
      } else {
        bayWidths.push({ start: c.xOffsetMm, end, w: c.widthMm });
      }
    }
    for (const b of bayWidths) {
      const bx = toX(b.start), bx2 = toX(b.end);
      doc.moveTo(bx, dimY - 4).lineTo(bx, dimY + 4);
      doc.moveTo(bx2, dimY - 4).lineTo(bx2, dimY + 4);
      doc.moveTo(bx, dimY).lineTo(bx2, dimY).stroke();
      drawObliqueTick(doc, bx, dimY);
      drawObliqueTick(doc, bx2, dimY);
      doc.font('Helvetica').fontSize(6).fillColor(RED).text(String(Math.round(b.w)), (bx + bx2) / 2 - 16, dimY + 8, { width: 32, align: 'center' });
    }
  }

  // Graphical SCALE BAR (1:25) — essential for a real drawing sheet
  {
    const sbX = toX(0), sbY = toY(0) + 64, segMm = 500, segPx = segMm * scale, segs = 4;
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(BLK).text('SCALE 1:25', sbX, sbY - 12);
    for (let i = 0; i < segs; i++) {
      const x0 = sbX + i * segPx;
      doc.lineWidth(1).strokeColor(BLK).rect(x0, sbY, segPx, 5);
      doc.fillColor(i % 2 === 0 ? BLK : WHITE).rect(x0, sbY, segPx, 5).fill();
      doc.strokeColor(BLK).rect(x0, sbY, segPx, 5).stroke();
      doc.font('Helvetica').fontSize(5.5).fillColor(BLK).text(`${i * segMm / 1000}`, x0 - 4, sbY + 7);
    }
    doc.font('Helvetica').fontSize(5.5).fillColor(BLK).text(`${segs * segMm / 1000}m`, sbX + segs * segPx - 10, sbY + 7);
  }

  // Coverage note
  const cov = model.coverage;
  if (cov) doc.font('Helvetica-Oblique').fontSize(7).fillColor(GREY).text(`UTILIZATION: ${cov.utilizationPct}%  |  USED: ${cov.usedMm}mm  |  FREE: ${cov.freeMm}mm`, toX(0), toY(H) + 30);

  // ---- NOTES / LEGEND / COMPONENT SCHEDULE (right column) ----
  const nx = doc.page.width - 270, ny = 78, nw = 230;
  // Component schedule: group identical modules (tag + WxH)
  const groups = {};
  for (const c of model.cabinets) {
    if (c.tag === 'FILLER' || c.tag === 'VOID') continue;
    const key = `${c.tag}|${Math.round(c.widthMm)}x${Math.round(c.heightMm)}`;
    if (!groups[key]) groups[key] = { tag: c.tag, w: c.widthMm, h: c.heightMm, qty: 0 };
    groups[key].qty++;
  }
  const scheduleRows = Object.values(groups);

  const notesH = 150;
  const schedTop = ny + notesH + 14;
  const rowH = 14, maxRows = Math.min(scheduleRows.length, 10);
  const schedH = 26 + maxRows * rowH;

  // NOTES & LEGEND box
  doc.lineWidth(1).strokeColor(BLK).rect(nx, ny, nw, notesH).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(nx + 3, ny + 3, nw - 6, notesH - 6).stroke();
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text('GENERAL NOTES', nx + 12, ny + 10);
  const noteLines = [
    '1. All dimensions are in millimetres (mm).',
    '2. Drawing scale 1:25 unless noted.',
    '3. Carcass = 18mm BWR MR plywood.',
    '4. Shutters = 18mm MDF / acrylic / laminate.',
    '5. GLASS = 4mm tinted / fluted safety glass.',
    '6. HANDLES = anodized aluminium pulls.',
    '7. LED = 3000K aluminium profile strip.',
    '8. Verify site dimensions before execution.',
  ];
  doc.font('Helvetica').fontSize(6.5).fillColor(BLK);
  noteLines.forEach((t, i) => doc.text(t, nx + 12, ny + 30 + i * 14));

  // COMPONENT SCHEDULE box
  doc.lineWidth(1).strokeColor(BLK).rect(nx, schedTop, nw, schedH).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(nx + 3, schedTop + 3, nw - 6, schedH - 6).stroke();
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text('COMPONENT SCHEDULE', nx + 12, schedTop + 8);
  // header row
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(BLK);
  doc.text('MODULE', nx + 12, schedTop + 24);
  doc.text('QTY', nx + 120, schedTop + 24);
  doc.text('SIZE (WxH)', nx + 152, schedTop + 24);
  doc.lineWidth(0.4).strokeColor(GREY).moveTo(nx + 8, schedTop + 32).lineTo(nx + nw - 8, schedTop + 32).stroke();
  doc.font('Helvetica').fontSize(6.5).fillColor(BLK);
  scheduleRows.slice(0, maxRows).forEach((g, i) => {
    const ry = schedTop + 37 + i * rowH;
    doc.text(g.tag, nx + 12, ry, { width: 104 });
    doc.text(String(g.qty), nx + 120, ry);
    doc.text(`${Math.round(g.w)}x${Math.round(g.h)}`, nx + 152, ry);
  });
  if (scheduleRows.length > maxRows) doc.font('Helvetica-Oblique').fontSize(6).fillColor(GREY).text(`+${scheduleRows.length - maxRows} more…`, nx + 12, schedTop + 37 + maxRows * rowH);

  // ---- SYMBOLS / LINE-TYPE LEGEND (bottom-right, above title) ----
  const lx = nx, ly = schedTop + schedH + 12, lw = nw, lh = 70;
  doc.lineWidth(1).strokeColor(BLK).rect(lx, ly, lw, lh).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(lx + 3, ly + 3, lw - 6, lh - 6).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(BLUE).text('SYMBOLS', lx + 12, ly + 8);
  doc.font('Helvetica').fontSize(6).fillColor(BLK);
  // solid line = wall/carcass
  doc.lineWidth(1.4).strokeColor(BLK).moveTo(lx + 12, ly + 28).lineTo(lx + 50, ly + 28).stroke();
  doc.text('Carcass / wall', lx + 56, ly + 25);
  // red dashed = dimension
  doc.lineWidth(0.8).strokeColor(RED).dash(2, 2).moveTo(lx + 12, ly + 42).lineTo(lx + 50, ly + 42).stroke(); doc.undash();
  doc.text('Dimension line', lx + 56, ly + 39);
  // hanger rod
  doc.lineWidth(1).strokeColor('#444444').moveTo(lx + 12, ly + 56).lineTo(lx + 50, ly + 56).stroke();
  doc.text('Hanger rod', lx + 56, ly + 53);

  // Premium Title block (bottom-left)
  const tbX = 40, tbY = doc.page.height - 118;
  const tbW = 540, tbH = 84;
  doc.lineWidth(1.2).strokeColor(BLK).rect(tbX, tbY, tbW, tbH).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(tbX + 3, tbY + 3, tbW - 6, tbH - 6).stroke();
  // vertical divider
  doc.lineWidth(0.6).strokeColor(BLUE).moveTo(tbX + 360, tbY + 3).lineTo(tbX + 360, tbY + tbH - 3).stroke();
  // horizontal divider for drawn/checked row
  doc.lineWidth(0.5).strokeColor(GREY).moveTo(tbX + 3, tbY + tbH - 26).lineTo(tbX + 360, tbY + tbH - 26).stroke();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text('GRID OS', tbX + 372, tbY + 12);
  doc.font('Helvetica').fontSize(6.5).fillColor(GREY).text('PROFESSIONAL ARCHITECTURAL SHEET', tbX + 372, tbY + 30);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(BLK).text('AUTHENTIC CARCASS SYSTEM', tbX + 372, tbY + 50);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(BLK)
    .text(`PROJECT: ${model.projectId || 'N/A'}`, tbX + 12, tbY + 10)
    .text(`CLIENT: ${opts.client || 'Residential client'}`, tbX + 12, tbY + 26)
    .text(`SHEET: ${model.wallName || 'ELEVATION'}`, tbX + 12, tbY + 42)
    .text(`SCALE: ${opts.scale || '1:25'}   REV: ${opts.rev || '1.2'}   DATE: ${new Date().toISOString().slice(0, 10)}`, tbX + 12, tbY + 58);
  doc.font('Helvetica').fontSize(6).fillColor(GREY)
    .text('DRAWN BY: AURA', tbX + 12, tbY + tbH - 18)
    .text('CHECKED BY: __________', tbX + 150, tbY + tbH - 18);
}

export function renderElevationPDF(model, opts = {}) {
  const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 40 });
  const chunks = [];
  doc.on('data', c => chunks.push(c));
  drawElevation(doc, model, opts);
  doc.end();
  return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
}

/**
 * Combine every wall elevation into ONE multi-page A3 PDF. Returns a Buffer.
 * Page 1 = Cover / Contents, then one sheet per wall elevation.
 */
export function renderCombinedElevationsPDF(models, opts = {}) {
  const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 40 });
  const chunks = [];
  doc.on('data', c => chunks.push(c));
  const list = models || [];
  if (!list.length) {
    doc.font('Helvetica').fontSize(14).fillColor(BLK).text('No wall elevations to combine.', 60, 60);
    doc.end();
    return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
  }
  // Cover sheet
  doc.lineWidth(2).strokeColor(BLK).rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(36, 36, doc.page.width - 72, doc.page.height - 72).stroke();
  doc.font('Helvetica-Bold').fontSize(30).fillColor(BLK).text('ELEVATION DRAWING SET', 80, 160);
  doc.font('Helvetica').fontSize(13).fillColor(BLUE).text((opts.projectId || 'Project') + '  —  Interior Millwork Elevations', 80, 205);
  doc.font('Helvetica').fontSize(10).fillColor(GREY).text(`Generated: ${new Date().toISOString().slice(0, 10)}    Scale: ${opts.scale || '1:25'}    Sheets: ${list.length}`, 80, 235);
  // contents list
  doc.font('Helvetica-Bold').fontSize(12).fillColor(BLK).text('CONTENTS', 80, 300);
  doc.font('Helvetica').fontSize(10).fillColor(BLK);
  list.forEach((m, i) => doc.text(`Sheet ${String(i + 1).padStart(2, '0')}  —  ${(m.wallName || ('Wall ' + (i + 1)))}  (${Math.round(m.lengthMm)} x ${Math.round(m.heightMm)} mm)`, 90, 325 + i * 20));

  list.forEach((m, i) => {
    doc.addPage();
    drawElevation(doc, m, opts);
  });
  doc.end();
  return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
}
