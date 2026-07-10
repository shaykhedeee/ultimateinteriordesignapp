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
  doc.font('Helvetica-Oblique').fontSize(7).fillColor(GREY).text('PLINTH LEVEL (100mm)', toX(0) - 110, baseY + 2);

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

  // Coverage note
  const cov = model.coverage;
  if (cov) doc.font('Helvetica-Oblique').fontSize(7).fillColor(GREY).text(`UTILIZATION: ${cov.utilizationPct}%  |  USED: ${cov.usedMm}mm  |  FREE: ${cov.freeMm}mm`, toX(0), toY(H) + 30);

  // ---- NOTES / LEGEND / MATERIAL SCHEDULE (right column) ----
  const nx = doc.page.width - 250, ny = 90, nw = 200;
  doc.lineWidth(1).strokeColor(BLK).rect(nx, ny, nw, 250).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(nx + 3, ny + 3, nw - 6, 244).stroke();
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text('NOTES & LEGEND', nx + 12, ny + 10);
  
  const noteLines = [
    'All dimensions are in millimetres.',
    'Drawing scale is 1:25.',
    'JALI = CNC Laser-cut MDF panel.',
    'GLASS = 4mm tinted / fluted safety glass.',
    'HANDLES = Solid anodized black pulls.',
    'LED = Warm 3000K vertical profile strip.',
    'Carcass structures = 18mm MR ply.',
  ];
  doc.font('Helvetica').fontSize(7).fillColor(BLK);
  noteLines.forEach((t, i) => doc.text('• ' + t, nx + 12, ny + 32 + i * 16));

  // Material schedule table (bottom-right)
  const mx = doc.page.width - 250, my = ny + 270, mw = 200;
  doc.lineWidth(1).strokeColor(BLK).rect(mx, my, mw, 120).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(mx + 3, my + 3, mw - 6, 114).stroke();
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text('MATERIAL SCHEDULE', mx + 12, my + 10);
  doc.font('Helvetica').fontSize(7).fillColor(BLK);
  
  const mats = [];
  for (const c of model.cabinets) if (c.material?.callout && !mats.includes(c.material.callout)) mats.push(c.material.callout);
  mats.slice(0, 5).forEach((m, i) => doc.text(`${i + 1}. ${m}`, mx + 12, my + 30 + i * 16));

  // Premium Title block (bottom-left)
  const tbX = 40, tbY = doc.page.height - 110;
  doc.lineWidth(1.2).strokeColor(BLK).rect(tbX, tbY, 540, 75).stroke();
  doc.lineWidth(0.5).strokeColor(BLUE).rect(tbX + 3, tbY + 3, 534, 69).stroke();
  doc.lineWidth(0.6).strokeColor(BLUE).moveTo(tbX + 360, tbY + 3).lineTo(tbX + 360, tbY + 72).stroke();
  
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BLUE).text('GRID OS', tbX + 372, tbY + 12);
  doc.font('Helvetica').fontSize(6.5).fillColor(GREY).text('PROFESSIONAL ARCHITECTURAL SHEET', tbX + 372, tbY + 28);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(BLK).text('AUTHENTIC CARCASS SYSTEM', tbX + 372, tbY + 48);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(BLK)
    .text(`PROJECT: ${model.projectId || 'N/A'}`, tbX + 12, tbY + 12)
    .text(`CLIENT: ${opts.client || 'Residential client'}`, tbX + 12, tbY + 26)
    .text(`SHEET: ${model.wallName}`, tbX + 12, tbY + 40)
    .text(`SCALE: ${opts.scale || '1:25'}   |   REV: ${opts.rev || '1.2'}   |   DATE: ${new Date().toISOString().slice(0, 10)}`, tbX + 12, tbY + 54);
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
 */
export function renderCombinedElevationsPDF(models, opts = {}) {
  const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 40 });
  const chunks = [];
  doc.on('data', c => chunks.push(c));
  (models || []).forEach((m, i) => {
    if (i > 0) doc.addPage();
    drawElevation(doc, m, opts);
  });
  if (!models || !models.length) {
    doc.font('Helvetica').fontSize(14).fillColor(BLK).text('No wall elevations to combine.', 60, 60);
  }
  doc.end();
  return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
}
