/**
 * pdf-elevation.js
 * --------------------------------------------------------------------------
 * Render a professional, print-ready PDF elevation sheet using pdfkit
 * (already a dependency). Mirrors the DXF/SVG conventions:
 *   - mm-precise geometry from the ElevationModel
 *   - red dimension lines + tick marks + mm text
 *   - door/window cut-outs, cabinetry detail, component tags
 *   - BEAM + floor hatch, material callouts, title block
 * Pure + testable (returns a Buffer when no res is passed).
 */
import PDFDocument from 'pdfkit';

const RED = '#e03a3a';
const BLK = '#1a1a1a';
const GREY = '#666666';

export function renderElevationPDF(model, opts = {}) {
  const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 40 });
  const chunks = [];
  doc.on('data', c => chunks.push(c));

  const L = model.lengthMm;
  const H = model.heightMm;
  const startX = 120;
  const baseY = 560;               // floor line (mm 0)
  const scale = 0.16;              // px per mm on the sheet
  const toX = mm => startX + mm * scale;
  const toY = mm => baseY - mm * scale;

  // Sheet border
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke(BLK);

  // Wall outline
  doc.lineWidth(2.5).strokeColor(BLK)
    .rect(toX(0), toY(H), L * scale, H * scale).stroke();

  // BEAM hatch
  doc.lineWidth(0.4).strokeColor(GREY);
  for (let x = toX(0); x < toX(L); x += 6) { doc.moveTo(x, toY(H) - 14).lineTo(x + 10, toY(H)).stroke(); }
  doc.fontSize(8).fillColor(BLK).text('BEAM', toX(L) - 30, toY(H) - 26);

  // Floor datum
  doc.lineWidth(1.2).strokeColor(GREY).dash(4, 4).moveTo(toX(0) - 20, baseY).lineTo(toX(L) + 20, baseY).stroke();
  doc.undash();
  doc.fontSize(7).fillColor(GREY).text('PLINTH LVL (100)', toX(0) - 90, baseY + 2);

  // Openings
  for (const op of model.openings) {
    const x = toX(op.offsetMm), y = toY(op.headMm), w = op.widthMm * scale, h = (op.headMm - op.sillMm) * scale;
    doc.lineWidth(1.5).strokeColor(BLK).rect(x, y, w, h).stroke();
    doc.lineWidth(0.4).moveTo(x, y).lineTo(x + w, y + h).moveTo(x + w, y).lineTo(x, y + h).stroke();
    if (op.type === 'window') { for (let i = 0; i < w; i += 12) doc.moveTo(x + i, y).lineTo(x + i + h, y + h).stroke(); }
    doc.fontSize(9).fillColor(BLK).text(op.type.toUpperCase(), x + w / 2 - 12, y + h / 2 - 4);
    // dimension (red, ticks)
    doc.lineWidth(0.6).strokeColor(RED)
      .moveTo(x, y - 8).lineTo(x, y - 14).moveTo(x + w, y - 8).lineTo(x + w, y - 14)
      .moveTo(x, y - 11).lineTo(x + w, y - 11).stroke();
    doc.fontSize(7).fillColor(RED).text(String(Math.round(op.widthMm)), x + w / 2 - 14, y - 22);
  }

  // Cabinets
  for (const c of model.cabinets) {
    const x = toX(c.xOffsetMm), y = toY(c.zOffsetMm + c.heightMm), w = c.widthMm * scale, h = c.heightMm * scale;
    doc.lineWidth(1.5).strokeColor(BLK).rect(x, y, w, h).stroke();
    if (c.tag === 'DRAWER' || /drawer/i.test(c.name)) {
      const n = Math.max(2, Math.round(c.heightMm / 250));
      for (let i = 1; i < n; i++) doc.lineWidth(0.7).moveTo(x, y + (h * i) / n).lineTo(x + w, y + (h * i) / n).stroke();
    } else if (c.widthMm > 500) {
      doc.lineWidth(0.7).moveTo(x + w / 2, y).lineTo(x + w / 2, y + h).stroke();
      doc.lineWidth(0.4).dash(2, 2);
      const r2 = w / 2, cx2 = x + w / 2, cy2 = y + h / 2;
      for (let a = 0; a <= Math.PI / 2; a += Math.PI / 24) doc.moveTo(cx2 - r2 * Math.cos(a), cy2 - r2 * Math.sin(a)).lineTo(cx2 - r2 * Math.cos(a + 0.01), cy2 - r2 * Math.sin(a + 0.01));
      doc.stroke(); doc.undash();
    } else {
      doc.lineWidth(0.4).dash(2, 2);
      const r3 = w, cx3 = x + w, cy3 = y + h / 2;
      for (let a = 0; a <= Math.PI / 2; a += Math.PI / 24) doc.moveTo(cx3 - r3 * Math.cos(a), cy3 - r3 * Math.sin(a)).lineTo(cx3 - r3 * Math.cos(a + 0.01), cy3 - r3 * Math.sin(a + 0.01));
      doc.stroke(); doc.undash();
    }
    doc.fontSize(8).fillColor(BLK).text(c.tag, x + w / 2 - 14, y + h / 2 - 4);
    doc.fontSize(6).fillColor(GREY).text(`${Math.round(c.widthMm)}x${Math.round(c.heightMm)}`, x + w / 2 - 18, y + h - 12);
    if (c.material?.callout) {
      doc.lineWidth(0.5).strokeColor(RED).moveTo(x + w / 2, y + 8).lineTo(x + w + 24, y - 6).stroke();
      doc.fontSize(6).fillColor(RED).text(c.material.callout, x + w + 28, y - 8);
    }
  }

  // Overall dimension (red)
  doc.lineWidth(0.8).strokeColor(RED)
    .moveTo(toX(0), toY(H) - 16).lineTo(toX(0), toY(H) - 26)
    .moveTo(toX(L), toY(H) - 16).lineTo(toX(L), toY(H) - 26)
    .moveTo(toX(0), toY(H) - 21).lineTo(toX(L), toY(H) - 21).stroke();
  doc.fontSize(9).fillColor(RED).text(`${L} MM`, toX(L) / 2 - 18, toY(H) - 34);
  doc.lineWidth(0.8).moveTo(toX(L) + 16, toY(0)).lineTo(toX(L) + 26, toY(0)).moveTo(toX(L) + 16, toY(H)).lineTo(toX(L) + 26, toY(H)).moveTo(toX(L) + 21, toY(0)).lineTo(toX(L) + 21, toY(H)).stroke();
  doc.fontSize(9).fillColor(RED).text(`${H} MM`, toX(L) + 32, toY(H) / 2);

  // Title block
  const tbX = 40, tbY = doc.page.height - 90;
  doc.lineWidth(1).strokeColor('#2563eb').rect(tbX, tbY, 360, 55).stroke();
  doc.fontSize(8).fillColor(BLK)
    .text(`PROJECT: ${model.projectId}`, tbX + 8, tbY + 6)
    .text(`SHEET: ${model.wallName}   SCALE: ${opts.scale || '1:25'}`, tbX + 8, tbY + 20)
    .text(`DRAWN: AURABRAIN  REV ${opts.rev || '1.0'}  ${new Date().toISOString().slice(0, 10)}`, tbX + 8, tbY + 34);

  doc.end();
  return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
}

export default { renderElevationPDF };
