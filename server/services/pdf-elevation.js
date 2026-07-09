/**
 * pdf-elevation.js  (v2 — detailed, print-ready elevation sheet)
 * --------------------------------------------------------------------------
 * Renders a professional A3 landscape PDF elevation using pdfkit:
 *   - mm-precise geometry from the ElevationModel
 *   - red dimension lines + witness lines + arrowheads + mm text
 *   - door-swing arcs, handle glyphs, component tags
 *   - BEAM + plinth hatch, material callouts + leader lines
 *   - a NOTES / LEGEND / MATERIAL SCHEDULE block
 *   - richer title block (project, client, sheet, scale, drawn-by, rev, date)
 * Pure + testable (returns a Buffer when no res is passed).
 */
import PDFDocument from 'pdfkit';

const RED = '#e03a3a';
const BLK = '#1a1a1a';
const GREY = '#666666';
const BLUE = '#2563eb';

function arrowHead(doc, x, y, ang, size) {
  doc.moveTo(x, y)
    .lineTo(x + size * Math.cos(ang + 0.4), y + size * Math.sin(ang + 0.4))
    .moveTo(x, y)
    .lineTo(x + size * Math.cos(ang - 0.4), y + size * Math.sin(ang - 0.4))
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

  // Sheet border (double)
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke(BLK);
  doc.lineWidth(0.5).strokeColor(GREY).rect(38, 38, doc.page.width - 76, doc.page.height - 76).stroke();

  // Wall outline (thick)
  doc.lineWidth(2.5).strokeColor(BLK).rect(toX(0), toY(H), L * scale, H * scale).stroke();

  // Beam hatch + label
  doc.lineWidth(0.4).strokeColor(GREY);
  for (let x = toX(0); x < toX(L); x += 6) doc.moveTo(x, toY(H) - 14).lineTo(x + 10, toY(H)).stroke();
  doc.fontSize(8).fillColor(BLK).text('BEAM', toX(L) - 30, toY(H) - 26);

  // Plinth datum + label
  doc.lineWidth(1.2).strokeColor(GREY).dash(4, 4).moveTo(toX(0) - 20, baseY).lineTo(toX(L) + 20, baseY).stroke();
  doc.undash();
  doc.fontSize(7).fillColor(GREY).text('PLINTH LVL (100)', toX(0) - 90, baseY + 2);

  // Openings (with swing arcs + dims)
  for (const op of model.openings) {
    const x = toX(op.offsetMm), y = toY(op.headMm), w = op.widthMm * scale, h = (op.headMm - op.sillMm) * scale;
    doc.lineWidth(1.5).strokeColor(BLK).rect(x, y, w, h).stroke();
    doc.lineWidth(0.4).moveTo(x, y).lineTo(x + w, y + h).moveTo(x + w, y).lineTo(x, y + h).stroke();
    if (op.type === 'window') {
      for (let i = 0; i < w; i += 12) doc.moveTo(x + i, y).lineTo(x + i + h, y + h).stroke();
      doc.fontSize(9).fillColor(BLK).text('WINDOW', x + w / 2 - 14, y + h / 2 - 4);
    } else {
      // door swing arc (quarter circle, dashed)
      const sx = x, sy = y + h, r = w, steps = 24;
      doc.lineWidth(0.6).dash(2, 2).strokeColor(GREY);
      doc.moveTo(sx, sy);
      for (let i = 1; i <= steps; i++) {
        const a = (-Math.PI / 2) + (Math.PI / 2) * (i / steps);
        doc.lineTo(sx + r * Math.cos(a), sy + r * Math.sin(a));
      }
      doc.stroke();
      doc.undash();
      doc.fontSize(9).fillColor(BLK).text('DOOR', x + w / 2 - 12, y + h / 2 - 4);
    }
    // dimension (red, witness + arrowheads)
    doc.lineWidth(0.6).strokeColor(RED);
    doc.moveTo(x, y - 8).lineTo(x, y - 14).moveTo(x + w, y - 8).lineTo(x + w, y - 14).moveTo(x, y - 11).lineTo(x + w, y - 11).stroke();
    arrowHead(doc, x, y - 11, Math.PI, 6);
    arrowHead(doc, x + w, y - 11, 0, 6);
    doc.fontSize(7).fillColor(RED).text(String(Math.round(op.widthMm)), x + w / 2 - 14, y - 22);
  }

  // Cabinets (detail + handle + material callouts)
  for (const c of model.cabinets) {
    const x = toX(c.xOffsetMm), y = toY(c.zOffsetMm + c.heightMm), w = c.widthMm * scale, h = c.heightMm * scale;
    const m = c.material || {};
    const isOpen = m.openShelf || c.tag === 'OPEN' || c.tag === 'OPEN UNIT';
    doc.lineWidth(1.5).strokeColor(BLK).rect(x, y, w, h).stroke();
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
      doc.fontSize(7).fillColor(BLK).text('FRIDGE', x + w / 2 - 14, y + h / 2);
    } else if (m.appliance === 'hood') {
      doc.lineWidth(0.7).strokeColor(BLK).moveTo(x, y + h).lineTo(x + w * 0.28, y).lineTo(x + w * 0.72, y).lineTo(x + w, y + h).stroke();
      doc.fontSize(7).fillColor(BLK).text('HOOD', x + w / 2 - 10, y + h / 2);
    } else if (m.appliance === 'cooktop') {
      doc.lineWidth(0.7).strokeColor(BLK);
      for (const fx of [0.3, 0.7]) doc.circle(x + w * fx, y + h * 0.5, Math.min(w, h) * 0.16).stroke();
      doc.fontSize(7).fillColor(BLK).text('HOB', x + w / 2 - 8, y + h * 0.1);
    } else if (m.appliance === 'sink') {
      doc.lineWidth(0.7).strokeColor(BLK).rect(x + w * 0.12, y + h * 0.25, w * 0.76, h * 0.55).stroke();
      doc.circle(x + w / 2, y + h * 0.52, 3).stroke();
      doc.moveTo(x + w * 0.5, y + h * 0.25).lineTo(x + w * 0.5, y).stroke();
      doc.fontSize(7).fillColor(BLK).text('SINK', x + w / 2 - 9, y + h * 0.85);
    }
    // arched top
    if (m.arch) {
      doc.lineWidth(1).strokeColor(BLK).dash(1, 0);
      const r = w / 2, cx = x + w / 2;
      doc.moveTo(x, y);
      for (let a = Math.PI; a >= 0; a -= Math.PI / 24) doc.lineTo(cx + r * Math.cos(a), y - r * Math.sin(a) * 0.35);
      doc.stroke(); doc.undash();
    }
    if (isOpen) {
      const shelves = m.shelves || Math.max(1, Math.round(c.heightMm / 350));
      doc.lineWidth(0.7).strokeColor(GREY);
      for (let i = 1; i < shelves; i++) doc.moveTo(x + 3, y + (h * i) / shelves).lineTo(x + w - 3, y + (h * i) / shelves).stroke();
    } else if (c.tag === 'DRAWER' || /drawer/i.test(c.name)) {
      const n = Math.max(2, Math.round(c.heightMm / 250));
      for (let i = 1; i < n; i++) doc.lineWidth(0.7).moveTo(x, y + (h * i) / n).lineTo(x + w, y + (h * i) / n).stroke();
    } else if (!m.appliance && c.widthMm > 500) {
      doc.lineWidth(0.7).moveTo(x + w / 2, y).lineTo(x + w / 2, y + h).stroke();
    }
    // glass grid muntins
    if ((m.glass || m.glassGrid) && w > 24 && h > 24) {
      const cols = m.glassCols || 1, rows = m.glassRows || 3;
      doc.lineWidth(0.4).strokeColor(BLUE);
      for (let i = 1; i < cols; i++) doc.moveTo(x + (w * i) / cols, y + 4).lineTo(x + (w * i) / cols, y + h - 4).stroke();
      for (let j = 1; j < rows; j++) doc.moveTo(x + 4, y + (h * j) / rows).lineTo(x + w - 4, y + (h * j) / rows).stroke();
    }
    // handle glyph
    if (c.handleType === 'none' || m.appliance || isOpen) {
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
    doc.fontSize(8).fillColor(BLK).text(c.tag, x + w / 2 - 14, y + h / 2 - 4);
    doc.fontSize(6).fillColor(GREY).text(`${Math.round(c.widthMm)}x${Math.round(c.heightMm)}`, x + w / 2 - 18, y + h - 12);
    if (m.callout) {
      doc.lineWidth(0.5).strokeColor(RED).moveTo(x + w / 2, y + 8).lineTo(x + w + 24, y - 6).stroke();
      doc.fontSize(6).fillColor(RED).text(m.callout, x + w + 28, y - 8);
    }
  }

  // Overall dimensions (red, arrowheads)
  doc.lineWidth(0.8).strokeColor(RED)
    .moveTo(toX(0), toY(H) - 16).lineTo(toX(0), toY(H) - 26)
    .moveTo(toX(L), toY(H) - 16).lineTo(toX(L), toY(H) - 26)
    .moveTo(toX(0), toY(H) - 21).lineTo(toX(L), toY(H) - 21).stroke();
  arrowHead(doc, toX(0), toY(H) - 21, Math.PI, 6);
  arrowHead(doc, toX(L), toY(H) - 21, 0, 6);
  doc.fontSize(9).fillColor(RED).text(`${L} MM`, toX(L) / 2 - 18, toY(H) - 34);
  doc.lineWidth(0.8).moveTo(toX(L) + 16, toY(0)).lineTo(toX(L) + 26, toY(0)).moveTo(toX(L) + 16, toY(H)).lineTo(toX(L) + 26, toY(H)).moveTo(toX(L) + 21, toY(0)).lineTo(toX(L) + 21, toY(H)).stroke();
  arrowHead(doc, toX(L) + 21, toY(0), -Math.PI / 2, 6);
  arrowHead(doc, toX(L) + 21, toY(H), Math.PI / 2, 6);
  doc.fontSize(9).fillColor(RED).text(`${H} MM`, toX(L) + 32, toY(H) / 2);

  // Coverage note
  const cov = model.coverage;
  if (cov) doc.fontSize(7).fillColor(GREY).text(`UTIL ${cov.utilizationPct}%  USED ${cov.usedMm}mm  FREE ${cov.freeMm}mm`, toX(0), toY(H) + 30);

  // ---- NOTES / LEGEND / MATERIAL SCHEDULE (right column) ----
  const nx = doc.page.width - 250, ny = 90, nw = 200;
  doc.lineWidth(1).strokeColor(BLUE).rect(nx, ny, nw, 250).stroke();
  doc.fontSize(9).fillColor(BLUE).text('NOTES / LEGEND', nx + 8, ny + 6);
  const noteLines = [
    'All dims in mm.',
    'Scale 1:25 unless noted.',
    'JALI = CNC laser-cut MDF.',
    'GLASS = 4mm fluted / clear.',
    'HANDLES = SS brushed.',
    'LED = warm 3000K profile.',
    'Granite 20mm on counters.',
  ];
  doc.fontSize(7).fillColor(BLK);
  noteLines.forEach((t, i) => doc.text('• ' + t, nx + 8, ny + 22 + i * 14));

  // Material schedule (bottom-right)
  const mx = doc.page.width - 250, my = ny + 270, mw = 200;
  doc.lineWidth(1).strokeColor(BLUE).rect(mx, my, mw, 120).stroke();
  doc.fontSize(9).fillColor(BLUE).text('MATERIAL SCHEDULE', mx + 8, my + 6);
  doc.fontSize(7).fillColor(BLK);
  const mats = [];
  for (const c of model.cabinets) if (c.material?.callout && !mats.includes(c.material.callout)) mats.push(c.material.callout);
  mats.slice(0, 5).forEach((m, i) => doc.text(`${i + 1}. ${m}`, mx + 8, my + 22 + i * 15));

  // Title block (bottom-left, richer)
  const tbX = 40, tbY = doc.page.height - 110;
  doc.lineWidth(1).strokeColor(BLUE).rect(tbX, tbY, 540, 75).stroke();
  doc.lineWidth(0.4).strokeColor(BLUE).moveTo(tbX + 360, tbY).lineTo(tbX + 360, tbY + 75).stroke();
  doc.fontSize(8).fillColor(BLK)
    .text(`PROJECT: ${model.projectId || 'N/A'}`, tbX + 8, tbY + 6)
    .text(`CLIENT: ${opts.client || 'Residential'}`, tbX + 8, tbY + 20)
    .text(`SHEET: ${model.wallName}   SCALE: ${opts.scale || '1:25'}`, tbX + 8, tbY + 34)
    .text(`DRAWN: AURABRAIN  REV ${opts.rev || '1.0'}  ${new Date().toISOString().slice(0, 10)}`, tbX + 8, tbY + 48)
    .text(`GENERAL NOTES: see legend ↗`, tbX + 368, tbY + 20);
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
    doc.fontSize(14).fillColor(BLK).text('No wall elevations to combine.', 60, 60);
  }
  doc.end();
  return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
}

export default { renderElevationPDF, renderCombinedElevationsPDF };
