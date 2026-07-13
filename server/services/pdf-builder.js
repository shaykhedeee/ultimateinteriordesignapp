import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import db from '../database/database.js';
import { buildStandardModel } from './standards.js';
import { drawElevation } from './pdf-elevation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.join(__dirname, '../../storage');

// Render a QR code (PNG data URL) for a given URL — used for share-link QR on covers.
async function qrDataUrl(url) {
  try {
    return await QRCode.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: 'M' });
  } catch {
    return null;
  }
}

// Branded cover sheet — GRID OS identity, project meta, and a QR to the client-share link.
async function addCoverSheet(doc, project, opts = {}) {
  const title = (opts.title || 'PROJECT DOCUMENT').toUpperCase();
  const sub = opts.subtitle || 'PROFESSIONAL INTERIOR DESIGN DELIVERABLE';
  const shareUrl = opts.shareUrl || '';

  // Full-bleed dark banner top
  doc.rect(0, 0, 595, 150).fill('#020617');
  doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(13).text('GRID OS', 42, 34);
  doc.fillColor('#94A3B8').font('Helvetica').fontSize(9).text('PROFESSIONAL INTERIOR DESIGN OS  ·  AUTHENTIC CARCASS SYSTEM', 42, 52);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(26).text(title, 42, 78);
  doc.fillColor('#CBD5E1').font('Helvetica').fontSize(11).text(sub, 42, 116);

  // Left meta block
  doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13).text('PROJECT DETAILS', 42, 190);
  doc.moveTo(42, 206).lineTo(553, 206).lineWidth(1).strokeColor('#CBD5E1').stroke();
  const rows = [
    ['Project', project.name || '—'],
    ['Client', project.client_name || '—'],
    ['Document', sub],
    ['Date', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
    ['Revision', opts.revision || '1.0'],
    ['Prepared by', 'GRID OS (AURA)'],
  ];
  let y = 218;
  for (const [k, v] of rows) {
    doc.fillColor('#64748B').font('Helvetica').fontSize(9).text(k.toUpperCase(), 42, y);
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(String(v), 170, y, { width: 360 });
    y += 22;
  }

  // Right QR block
  if (shareUrl) {
    const q = await qrDataUrl(shareUrl);
    if (q) {
      const qx = 470, qy = 360, qsize = 120;
      doc.rect(qx - 10, qy - 10, qsize + 20, qsize + 44).strokeColor('#CBD5E1').lineWidth(1).stroke();
      doc.image(q, qx, qy, { fit: [qsize, qsize] });
      doc.fillColor('#334155').font('Helvetica').fontSize(7).text('SCAN TO OPEN LIVE CLIENT SHARE', qx - 10, qy + qsize + 4, { width: qsize + 20, align: 'center' });
    }
  }

  // Footer strip
  doc.rect(0, 780, 595, 17).fill('#020617');
  doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text('GRID OS — CONFIDENTIAL CLIENT DOCUMENT. ALL DIMENSIONS IN MILLIMETRES.', 42, 784);

  doc.addPage();
}

class PDFBuilder {
  /**
   * Generates a comprehensive Client Design Brief PDF
   * @param {string} projectId 
   * @param {string} destPath 
   */
  async generateBriefPDF(projectId, destPath, _ignored, opts = {}) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
    if (!project) throw new Error("Project not found");

    const brief = JSON.parse(project.client_brief_json || '{}');

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      doc.pipe(stream);

      await addCoverSheet(doc, project, { title: 'Client Design Brief', subtitle: 'ONBOARDING REQUIREMENT RECORD', revision: '1.0', shareUrl: opts?.shareUrl || '' });

      // Header Banner
      doc.fillColor('#020617').rect(0, 0, 595, 110).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(22).text('CLIENT DESIGN BRIEF', 42, 35);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(10).text('GRID OS - ONBOARDING REQUIREMENT RECORD', 42, 65);

      // Project Cover Section
      doc.moveDown(4);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(18).text(project.name, 42, 140);
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(12).text(`Client: ${project.client_name}`, 42, 165);
      doc.fillColor('#475569').font('Helvetica').fontSize(10).text(`Phone: ${project.phone} | Email: ${project.email}`, 42, 182);

      // Profile details
      doc.rect(42, 210, 511, 1).fill('#E2E8F0');
      doc.moveDown(2);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Design Profile & Lifestyle Constraints', 42, 230);
      
      let y = 255;
      const addField = (label, val) => {
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text(label, 42, y);
        doc.fillColor('#0F172A').font('Helvetica').fontSize(9).text(val || 'N/A', 180, y);
        y += 20;
      };

      addField('Lifestyle Segment', brief.lifestyle);
      addField('Cooking Habits', brief.cookingHabits);
      addField('Vastu Preference', brief.vastuPreferences);
      addField('Disliked Colors / Finishes', Array.isArray(brief.dislikedColors) ? brief.dislikedColors.join(', ') : 'None');
      addField('Unit System', project.unit_system.toUpperCase());
      addField('Estimated Budget Limit', `INR ${project.budget?.toLocaleString()}`);

      // Space schedule list
      doc.rect(42, y + 10, 511, 1).fill('#E2E8F0');
      y += 30;
      
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Space & Room Requirements Checklist', 42, y);
      y += 25;

      const rooms = brief.rooms || [];
      rooms.forEach((room, idx) => {
        doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(10).text(`${idx + 1}. ${room.name}`, 42, y);
        
        const details = [
          room.finishes ? `Finishes: ${room.finishes.join(', ')}` : '',
          room.appliances ? `Appliances: ${room.appliances.join(', ')}` : '',
          room.furniture ? `Furniture: ${room.furniture.join(', ')}` : ''
        ].filter(Boolean).join(' | ');

        doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text(details || 'Standard layout requirements.', 42, y + 14, { width: 511 });
        y += 35;
        
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
      });

      // Footer numbering
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94A3B8').text(`Page ${i + 1} of ${range.count} - Stamped on ${new Date().toLocaleDateString()}`, 42, 790, { align: 'center' });
      }

      doc.end();
    });
  }

  /**
   * Generates the Comprehensive Final Production Sign-off Document
   * @param {string} projectId 
   * @param {string} destPath 
   */
  async generateSignoffPDF(projectId, destPath, opts = {}) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
    const drawing = db.prepare("SELECT * FROM cad_drawings WHERE project_id = ?").get(projectId);
    const selection = db.prepare("SELECT * FROM material_selections WHERE project_id = ?").get(projectId);

    if (!project) throw new Error("Project not found");

    const brief = JSON.parse(project.client_brief_json || '{}');
    const walls = JSON.parse(drawing?.walls_json || '[]');
    const openings = JSON.parse(drawing?.openings_json || '[]');
    const furniture = JSON.parse(drawing?.furniture_json || '[]');
    const rooms = JSON.parse(drawing?.rooms_json || '[]');
    const laminates = JSON.parse(selection?.laminates_json || '[]');
    const hardware = JSON.parse(selection?.hardware_json || '[]');

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      doc.pipe(stream);

      await addCoverSheet(doc, project, { title: 'Production Sign-Off Contract', subtitle: 'COMPREHENSIVE FINAL TECHNICAL SPECIFICATIONS & DRAWINGS', revision: '1.0', shareUrl: opts?.shareUrl || '' });

      // Page 1: Cover Contract Block
      doc.fillColor('#020617').rect(0, 0, 595, 140).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(24).text('PRODUCTION SIGN-OFF CONTRACT', 42, 45);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(10).text('COMPREHENSIVE FINAL TECHNICAL SPECIFICATIONS & DRAWINGS', 42, 80);

      doc.moveDown(5);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(16).text(`${project.client_name || 'Client'} — ${project.name || 'Project'} Scope Summary`, 42, 170);
      doc.fillColor('#475569').font('Helvetica').fontSize(10).text(`Designed For: ${project.client_name} | Contact: ${project.phone}`, 42, 195);
      doc.text(`Agreement Date: ${new Date().toLocaleDateString()} | Total Estimated Budget: INR ${project.total_cost?.toLocaleString()}`, 42, 210);

      // Section: Approved Room Areas and Dimensions
      doc.rect(42, 235, 511, 1).fill('#E2E8F0');
      doc.moveDown(3);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('1. Signed Technical Room Schedules', 42, 255);
      
      let y = 280;
      // Header Table
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text('Room Name', 42, y);
      doc.text('Finishes / Notes', 180, y);
      doc.text('Calculated Areas', 450, y, { align: 'right', width: 100 });
      y += 18;
      doc.rect(42, y - 4, 511, 1).fill('#CBD5E0');

      rooms.forEach(room => {
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(room.name, 42, y);
        const finishNote = (room.finishes && room.finishes.length)
          ? room.finishes.join(', ')
          : (room.notes || 'As per approved material schedule');
        doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text(finishNote, 180, y, { width: 250 });
        // Compute real area from room bounds (metres) when available
        let area = '—';
        const b = room.bounds || room.rect;
        if (b && b.w && b.h) {
          const sqm = (b.w * b.h);
          area = `${sqm >= 100 ? (sqm / 10000).toFixed(1) : sqm.toFixed(1)} sq m`;
        }
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(area, 450, y, { align: 'right', width: 100 });
        y += 24;
      });

      // Section: Finalized Materials, Laminates & Fittings
      doc.rect(42, y + 10, 511, 1).fill('#E2E8F0');
      y += 25;
      
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('2. Approved Laminates & Hardware Fittings Shortlist', 42, y);
      y += 25;

      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(10).text('Laminates & Finishes:', 42, y);
      y += 15;
      if (laminates.length === 0) {
        doc.fillColor('#475569').font('Helvetica').fontSize(9).text('Frosty White SF 9120, Bourbone Walnut 4211-EH (Default Selections)', 42, y);
        y += 20;
      } else {
        laminates.forEach(lam => {
          doc.fillColor('#475569').font('Helvetica').fontSize(9).text(`- ${lam.brand || 'CenturyPly'} [${lam.code || 'SF-9120'}]: ${lam.name || 'Frosty White'}`, 42, y);
          y += 18;
        });
      }

      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(10).text('Hardware Fittings & Fixtures:', 42, y);
      y += 15;
      if (hardware.length === 0) {
        doc.fillColor('#475569').font('Helvetica').fontSize(9).text('Hettich Soft-Close Drawer runners, Blum Clip-top hinges, Ebco modular baskets', 42, y);
        y += 20;
      } else {
        hardware.forEach(hw => {
          doc.fillColor('#475569').font('Helvetica').fontSize(9).text(`- ${hw.brand || 'Hettich'}: ${hw.name || 'Telescopic Runners'} (${hw.code || 'H-01'})`, 42, y);
          y += 18;
        });
      }

      // Page 2: Approved Technical 2D Floor Plan layout
      doc.addPage();
      doc.fillColor('#020617').rect(0, 0, 595, 80).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(16).text('APPROVED TECHNICAL DRAWINGS DOCUMENT', 42, 22);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(9).text('2D BLUEPRINT LAYOUT CALIBRATION SCALE REPRESENTATION', 42, 48);

      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('1. 2D Architectural Layout Plan', 42, 110);
      doc.fillColor('#475569').font('Helvetica').fontSize(9.5).text('The vector drawing below is projected based on calibrated spatial coordinates.', 42, 128);

      // Draw border box for floor plan canvas
      doc.strokeColor('#CBD5E0').lineWidth(0.5).rect(42, 150, 511, 350).stroke();

      const planX = 62, planY = 175, planW = 470, planH = 300;
      const norm = (v, max) => v / (max || 1);

      if (walls.length > 0) {
        let maxWX = 1, maxWY = 1;
        walls.forEach(w => {
          maxWX = Math.max(maxWX, w.x1, w.x2);
          maxWY = Math.max(maxWY, w.y1, w.y2);
        });
        const sx = v => planX + norm(v, maxWX) * planW;
        const sy = v => planY + norm(v, maxWY) * planH;

        // Draw rooms as zoned rectangles (bounds normalized 0..1 of plan).
        // When several rooms share the same bounds (AI stacked them), subdivide
        // the rectangle into stacked cells so every room is visible.
        const groups = {};
        rooms.forEach(r => {
          const b = r.bounds || r.rect;
          if (!b || !b.w || !b.h) return;
          const key = `${b.x}_${b.y}_${b.w}_${b.h}`;
          (groups[key] = groups[key] || []).push({ r, b });
        });
        Object.values(groups).forEach(list => {
          list.forEach((item, idx) => {
            const { r, b } = item;
            const cellH = (b.h * planH) / list.length;
            const bx = planX + b.x * planW;
            const by = planY + b.y * planH + idx * cellH;
            const bw = b.w * planW;
            const bh = cellH;
            doc.fillColor('#F8FAFC').rect(bx, by, bw, bh).fill();
            doc.strokeColor('#D4AF37').lineWidth(1).rect(bx, by, bw, bh).stroke();
            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(list.length > 1 ? 6.5 : 7.5).text(r.name, bx, by + bh / 2 - 5, { width: bw, align: 'center' });
            doc.fillColor('#64748B').font('Helvetica').fontSize(5).text((r.vastu || 'NE'), bx, by + bh / 2 + 4, { width: bw, align: 'center' });
          });
        });

        // Draw walls on top (outline)
        doc.lineWidth(4).strokeColor('#1e293b');
        walls.forEach(w => {
          doc.moveTo(sx(w.x1), sy(w.y1)).lineTo(sx(w.x2), sy(w.y2)).stroke();
        });

        // Draw openings
        openings.forEach(op => {
          if (op.x == null || op.y == null) return;
          doc.lineWidth(1.5).strokeColor('#fbbf24').circle(sx(op.x), sy(op.y), 4.5).fillAndStroke('#ffffff', '#fbbf24');
        });

        // Draw furniture footprints (centroid in 0..1000 grid)
        furniture.forEach(f => {
          const cx = planX + (f.x / 1000) * planW;
          const cy = planY + (f.y / 1000) * planH;
          const w = ((f.width || 60) / 1000) * planW;
          const h = ((f.height || 60) / 1000) * planH;
          doc.lineWidth(0.8).strokeColor('#475569').rect(cx - w / 2, cy - h / 2, w, h).stroke();
          doc.fillColor('#475569').font('Helvetica-Bold').fontSize(5).text((f.name || '').substring(0, 12), cx - w / 2, cy - 3, { width: w, align: 'center' });
        });
      } else {
        doc.fillColor('#94A3B8').font('Helvetica-Oblique').fontSize(10).text('No walls or rooms defined in layout database.', 120, 300);
      }

      // Page 3+: Approved Technical 2D Wall Elevations
      if (furniture.length > 0) {
        doc.addPage();
        doc.fillColor('#020617').rect(0, 0, 595, 80).fill();
        doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(16).text('APPROVED TECHNICAL DRAWINGS DOCUMENT', 42, 22);
        doc.fillColor('#94A3B8').font('Helvetica').fontSize(9).text('2D SHUTTER ELEVATION VIEWS & PLINTH OUTLINES', 42, 48);

        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('2. 2D Wall Elevation Details', 42, 110);
        
        let currentY = 140;
        furniture.forEach((f, idx) => {
          if (currentY > 600) {
            doc.addPage();
            currentY = 50;
          }

          const widthMm = Math.max(600, (f.width * 25.0) || 1800); // convert pixel width back to mm
          const typeMap = {
            wardrobe: 'wardrobe', bed: 'wardrobe', pooja: 'wardrobe',
            counter: 'kitchen', 'kitchen-base': 'kitchen', 'kitchen-island': 'kitchen',
            'kitchen-wall': 'kitchen', 'kitchen-tall': 'kitchen',
            table: 'tv-unit', 'tv-unit': 'tv-unit',
            sink: 'vanity', vanity: 'vanity',
            bookshelf: 'bookcase', bookcase: 'bookcase'
          };
          const unitType = typeMap[f.type] || 'wardrobe';
          const heightMm = (unitType === 'wardrobe' || unitType === 'kitchen' || unitType === 'bookcase') ? 2400 : 2100;
          const elevModel = buildStandardModel(unitType, { widthMm, heightMm, depthMm: 600 });
          elevModel.projectId = project.client_name || 'Client';
          elevModel.wallName = (f.name || 'Unit').toUpperCase();

          // Elevation title — show resolved carcass type, not loose detected object name
          const typeLabel = unitType.toUpperCase();
          doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(`ELEVATION VIEW ${idx + 1}: ${typeLabel} — ${Math.round(widthMm)} × ${heightMm} mm`, 55, currentY + 12);

          // Embed a real, detailed elevation drawing inside a taller frame
          const frameX = 42, frameY = currentY, frameW = 511, frameH = 300;
          doc.strokeColor('#CBD5E0').lineWidth(0.5).rect(frameX, frameY, frameW, frameH).stroke();
          const pad = 24;
          const escale = Math.min((frameW - pad * 2) / widthMm, (frameH - pad * 2) / heightMm);
          const eox = frameX + (frameW - widthMm * escale) / 2;
          const eoy = frameY + frameH - pad;
          drawElevation(doc, elevModel, { embed: true, offsetX: eox, offsetY: eoy, embedScale: escale, noDimensions: false });

          currentY += 320;
        });
      }

      // Page Final: Sign-Off Signature Box
      doc.addPage();
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(14).text('Agreement & Execution Terms', 42, 50);
      doc.fillColor('#475569').font('Helvetica').fontSize(9.5).text(
        '1. The client approves the 2D CAD dimensions and room zoning attached in this contract.\n' +
        '2. The production cutlist will be strictly prepared based on the raw dimensions and ply thickness (18mm carcass, 19mm shutter, 6mm backing) configured.\n' +
        '3. Laminates and fittings finalized above cannot be changed once board slicing has commenced at the workshop.\n' +
        '4. Payment terms: 50% advance for material sourcing is due before production handoff.',
        42, 80, { lineGap: 6 }
      );

      // Revision History table
      const revY = 210;
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text('Revision History', 42, revY);
      doc.rect(42, revY + 16, 513, 1).fill('#CBD5E1');
      const revRows = [
        ['1.0', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 'AURA', 'Initial issue — technical specification & drawings'],
        ['1.1', '—', '—', 'Pending client review'],
      ];
      let ry = revY + 26;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748B');
      doc.text('REV', 42, ry); doc.text('DATE', 110, ry); doc.text('BY', 200, ry); doc.text('DESCRIPTION', 280, ry);
      ry += 14;
      doc.font('Helvetica').fontSize(8).fillColor('#0F172A');
      for (const r of revRows) {
        doc.text(r[0], 42, ry, { width: 60 });
        doc.text(r[1], 110, ry, { width: 80 });
        doc.text(r[2], 200, ry, { width: 70 });
        doc.text(r[3], 280, ry, { width: 270 });
        ry += 16;
      }

      // Signature Blocks
      doc.moveTo(42, 600).lineTo(240, 600).stroke('#475569');
      doc.moveTo(330, 600).lineTo(540, 600).stroke('#475569');
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text('Authorized Design Lead Signature', 42, 612);
      doc.text('Client Signature (I Approve the Brief)', 330, 612);

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94A3B8').text(`Page ${i + 1} of ${range.count} - Stamped Sign-off`, 42, 790, { align: 'center' });
      }

      doc.end();
    });
  }

  /**
   * Generates a branded itemized Quotation Proposal PDF
   * @param {string} projectId 
   * @param {string} destPath 
   * @param {object} quotation 
   */
  async generateQuotationPDF(projectId, destPath, quotation, opts = {}) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
    if (!project) throw new Error("Project not found");

    quotation = quotation || {};
    const items = quotation.items || [];
    const discount = quotation.discount || 0;
    const isGstEnabled = quotation.isGstEnabled !== false;
    const gstPercentage = quotation.gstPercentage || 18;
    const milestones = quotation.milestones || [];
    const subTotal = quotation.subTotal || 0;
    const gstValue = quotation.gstValue || 0;
    const grandTotal = quotation.grandTotal || 0;

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      doc.pipe(stream);

      await addCoverSheet(doc, project, { title: 'Quotation Proposal', subtitle: 'ITEMIZED BILLING ENGINE', revision: '1.0', shareUrl: (quotation && quotation.shareUrl) || '' });

      // Header Banner
      doc.fillColor('#020617').rect(0, 0, 595, 120).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(22).text('QUOTATION PROPOSAL', 42, 35);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(10).text('GRID OS - ITEMIZED BILLING ENGINE', 42, 65);

      // Project & Client Details
      doc.moveDown(4);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(16).text(project.name, 42, 150);
      doc.fillColor('#475569').font('Helvetica').fontSize(10).text(`Prepared For: ${project.client_name} | Contact: ${project.phone || 'N/A'}`, 42, 175);
      doc.text(`Proposal Date: ${new Date().toLocaleDateString()} | Project Status: ${project.status?.toUpperCase()}`, 42, 190);

      doc.rect(42, 210, 511, 1).fill('#E2E8F0');
      doc.moveDown(2);

      // Table Header
      let y = 230;
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text('Room / Item Description', 42, y);
      doc.text('HSN', 240, y);
      doc.text('Dimensions', 290, y);
      doc.text('Rate', 370, y);
      doc.text('Qty', 440, y);
      doc.text('Amount (INR)', 500, y, { align: 'right', width: 53 });
      y += 18;
      doc.rect(42, y - 4, 511, 1).fill('#CBD5E0');

      // Table Rows
      doc.font('Helvetica').fontSize(8.5);
      items.forEach((item) => {
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(`[${item.room || 'General'}] ${item.name}`, 42, y, { width: 195 });
        doc.fillColor('#475569').font('Helvetica').text(item.hsn || '9403', 240, y);
        doc.text(item.dimensions || 'Lump Sum', 290, y);
        doc.text(`Rs. ${item.rate?.toLocaleString()}`, 370, y);
        doc.text(item.isLumpSum ? '1' : `${item.sqft?.toFixed(1)}`, 440, y);
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(`Rs. ${item.amount?.toLocaleString()}`, 500, y, { align: 'right', width: 53 });
        y += 24;

        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      // Totals Box
      if (y > 600) {
        doc.addPage();
        y = 50;
      }

      y += 10;
      doc.rect(42, y, 511, 1).fill('#E2E8F0');
      y += 15;

      const rightLabelX = 350;
      const rightValX = 470;
      const addTotalRow = (label, val, isBold = false) => {
        doc.fillColor(isBold ? '#0F172A' : '#475569').font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(isBold ? 9.5 : 9.5).text(label, rightLabelX, y);
        doc.fillColor(isBold ? '#D4AF37' : '#0F172A').font('Helvetica-Bold').text(val, rightValX, y, { align: 'right', width: 83 });
        y += 20;
      };

      addTotalRow('Subtotal:', `Rs. ${subTotal.toLocaleString()}`);
      if (discount > 0) {
        addTotalRow('Discount:', `-Rs. ${discount.toLocaleString()}`);
      }
      if (isGstEnabled) {
        addTotalRow(`GST (${gstPercentage}%):`, `Rs. ${gstValue.toLocaleString()}`);
      }
      doc.rect(rightLabelX, y - 4, 203, 1).fill('#CBD5E0');
      y += 5;
      addTotalRow('Grand Total:', `Rs. ${grandTotal.toLocaleString()}`, true);

      // Payment Milestones
      y += 15;
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Payment Milestones Schedule', 42, y);
      y += 20;

      milestones.forEach((m) => {
        doc.fillColor('#475569').font('Helvetica').fontSize(9).text(m.stage, 42, y);
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(`Rs. ${m.amount?.toLocaleString()}`, 500, y, { align: 'right', width: 53 });
        y += 18;
      });

      // Signature Area
      y += 35;
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      doc.moveTo(42, y + 40).lineTo(240, y + 40).stroke('#475569');
      doc.moveTo(330, y + 40).lineTo(540, y + 40).stroke('#475569');
      
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text('Prepared By (GRID OS)', 42, y + 48);
      doc.text('Client Acceptance Signature', 330, y + 48);

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94A3B8').text(`Page ${i + 1} of ${range.count} - GRID OS Invoice Proposal`, 42, 790, { align: 'center' });
      }

      doc.end();
    });
  }

  /**
   * Generates a GST-compliant itemized TAX INVOICE PDF from a stored invoice.
   * Carries supplier (your studio) + bill-to client, line items, CGST/SGST or
   * IGST split, round-off, total-in-words, bank remittance and signature.
   *
   * @param {string} invoiceId
   * @param {string} destPath
   * @param {object} [opts]
   * @param {object} [opts.supplier]  company profile (name, address, gstNo, bankDetails, logo)
   * @param {object} [opts.invoice]   optional already-built invoice object (skips DB lookup)
   */
  async generateInvoicePDF(invoiceId, destPath, opts = {}) {
    const inv = opts.invoice || db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId);
    if (!inv) throw new Error("Invoice not found");
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(inv.project_id) || {};

    const supplier = opts.supplier || {
      name: 'GRID OS Interior Studio',
      address: 'Sarjapur Road, Bengaluru, Karnataka 560099',
      gstNo: '',
      bankDetails: {}
    };
    let items = [];
    try { items = inv.items_json ? JSON.parse(inv.items_json) : []; } catch { items = []; }
    const isInter = !!inv.is_inter_state;
    const cgst = Number(inv.cgst) || 0, sgst = Number(inv.sgst) || 0, igst = Number(inv.igst) || 0;
    const grand = Number(inv.grand_total != null ? inv.grand_total : inv.amount) || 0;
    const paid = Number(inv.paid_amount) || 0;
    const balance = Math.max(0, grand - paid);
    const { amountToWords } = await import('./invoice-math.js');

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      doc.pipe(stream);

      const M = 36;
      // Header
      doc.rect(0, 0, 595, 96).fill('#020617');
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(20).text(supplier.name || 'GRID OS', M, 22);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text(supplier.address || '', M, 50, { width: 360 });
      doc.fillColor('#CBD5E1').font('Helvetica').fontSize(8).text(`GSTIN: ${supplier.gstNo || '—'}`, M, 74);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('TAX INVOICE', 400, 30);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(9).text(`No: ${inv.invoice_number}`, 400, 52);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(9).text(`Date: ${inv.issue_date || new Date().toISOString().slice(0, 10)}`, 400, 66);
      if (inv.due_date) doc.fillColor('#94A3B8').font('Helvetica').fontSize(9).text(`Due: ${inv.due_date}`, 400, 80);

      // Bill To
      let y = 116;
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9).text('BILL TO:', M, y);
      doc.font('Helvetica').fontSize(9).fillColor('#334155')
        .text(inv.client_name || project.client_name || 'Client', M, y + 14, { width: 280 })
        .text(inv.client_address || '', M, y + 28, { width: 280 });
      if (inv.client_gstin) doc.font('Helvetica').fontSize(8).fillColor('#64748B').text(`Client GSTIN: ${inv.client_gstin}`, M, y + 56);
      // Place of supply badge
      doc.font('Helvetica-Bold').fontSize(8).fillColor(isInter ? '#B45309' : '#047857')
        .text(isInter ? 'INTER-STATE SUPPLY (IGST)' : 'INTRA-STATE SUPPLY (CGST+SGST)', 380, y + 14);

      y = 196;
      doc.rect(M, y, 523, 1).fill('#CBD5E1');
      y += 12;

      // Items table header
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8.5)
        .text('#', M, y).text('Description', M + 24, y).text('HSN', M + 300, y)
        .text('Qty', M + 350, y).text('Rate', M + 400, y).text('Amount', M + 460, y, { align: 'right', width: 67 });
      y += 6;
      doc.rect(M, y, 523, 1).fill('#CBD5E1');
      y += 12;

      doc.font('Helvetica').fontSize(8.5);
      items.forEach((it, i) => {
        const h = 16;
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(String(i + 1), M, y);
        doc.font('Helvetica').fillColor('#334155').text(it.description || 'Item', M + 24, y, { width: 272 });
        doc.fillColor('#475569').text(it.hsn || '9403', M + 300, y);
        doc.text(String(it.qty != null ? it.qty : 1), M + 350, y);
        doc.text(`Rs. ${Number(it.rate || 0).toLocaleString()}`, M + 400, y);
        doc.font('Helvetica-Bold').fillColor('#0F172A').text(`Rs. ${Number(it.amount || 0).toLocaleString()}`, M + 460, y, { align: 'right', width: 67 });
        y += h;
        if (y > 680) { doc.addPage(); y = 50; }
      });

      y += 8;
      doc.rect(M, y, 523, 1).fill('#E2E8F0');
      y += 14;

      // Totals
      const rx = 360, vx = 420;
      const row = (label, val, bold = false, color = '#0F172A') => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(bold ? color : '#475569').text(label, rx, y);
        doc.font('Helvetica-Bold').fillColor(bold ? color : '#0F172A').text(val, vx, y, { align: 'right', width: 139 });
        y += 18;
      };
      row('Subtotal', `Rs. ${(Number(inv.subtotal) || 0).toLocaleString()}`);
      if (Number(inv.discount) > 0) row('Discount', `-Rs. ${(Number(inv.discount) || 0).toLocaleString()}`);
      row('Taxable Value', `Rs. ${(Number(inv.taxable) || 0).toLocaleString()}`);
      if (cgst > 0) row(`CGST @ ${(Number(inv.gst_rate) / 2)}%`, `Rs. ${cgst.toLocaleString()}`);
      if (sgst > 0) row(`SGST @ ${(Number(inv.gst_rate) / 2)}%`, `Rs. ${sgst.toLocaleString()}`);
      if (igst > 0) row(`IGST @ ${Number(inv.gst_rate)}%`, `Rs. ${igst.toLocaleString()}`);
      if (Number(inv.round_off) !== 0) row('Round Off', `${Number(inv.round_off) > 0 ? '+' : '-'}Rs. ${Math.abs(Number(inv.round_off)).toFixed(2)}`);
      doc.rect(rx, y - 4, 199, 1).fill('#94A3B8');
      row('GRAND TOTAL', `Rs. ${grand.toLocaleString()}`, true, '#D4AF37');
      if (paid > 0) row('Amount Paid', `Rs. ${paid.toLocaleString()}`);
      if (balance > 0) row('BALANCE DUE', `Rs. ${balance.toLocaleString()}`, true, '#B91C1C');

      // Total in words
      y += 8;
      doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#334155')
        .text(`Amount in words: ${amountToWords(grand)}`, M, y, { width: 523 });

      // Bank details + signature
      y = Math.max(y + 28, 720);
      const bank = supplier.bankDetails || {};
      if (bank.accountName || bank.bankName) {
        doc.rect(M, y, 523, 1).fill('#E2E8F0');
        y += 10;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A').text('REMITTANCE / BANK DETAILS', M, y);
        y += 14;
        doc.font('Helvetica').fontSize(8).fillColor('#475569').text(
          `${bank.accountName || ''}\n${bank.bankName || ''}  ·  A/c: ${bank.accountNumber || '—'}  ·  IFSC: ${bank.ifscCode || '—'}` + (bank.upiId ? `\nUPI: ${bank.upiId}` : ''),
          M, y, { width: 320 }
        );
      }
      // signature
      const sigY = Math.min(y + 40, 770);
      doc.moveTo(M + 0, sigY).lineTo(M + 180, sigY).stroke('#475569');
      doc.moveTo(M + 360, sigY).lineTo(M + 540, sigY).stroke('#475569');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0F172A')
        .text('Authorized Signatory', M, sigY + 6)
        .text('Client Acceptance', M + 360, sigY + 6);

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7.5).fillColor('#94A3B8').text(`Page ${i + 1} of ${range.count} — ${supplier.name || 'GRID OS'} Tax Invoice ${inv.invoice_number}`, M, 800, { align: 'center' });
      }

      doc.end();
    });
  }

  /**
   * Generates a UNIFIED CLIENT PRESENTATION PACK — the single sellable sheet set
   * that closes a deal: branded cover, Vastu compliance highlights, a room-by-room
   * Bill of Quantities (BOQ), and a client acceptance page. Reuses the real
   * project + Vastu + quotation data already in the DB; never fabricates numbers.
   *
   * @param {string} projectId
   * @param {string} destPath
   * @param {object} [opts]
   * @param {object} [opts.quotation]  optional BOQ items/totals to embed
   * @param {string} [opts.shareUrl]   client-share link for the cover QR
   */
  async generateClientPresentationPDF(projectId, destPath, opts = {}) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
    if (!project) throw new Error("Project not found");

    // ---- Source real data (no invented figures) ----
    const brief = JSON.parse(project.client_brief_json || '{}');
    const quotation = opts.quotation || {};
    const boqItems = Array.isArray(quotation.items) ? quotation.items : [];
    const grandTotal = quotation.grandTotal || 0;
    const gstValue = quotation.gstValue || 0;

    let vastu = null;
    try {
      const { previewVastu } = await import('./vastu-auto.js');
      vastu = previewVastu(projectId);
    } catch { vastu = null; }

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      doc.pipe(stream);

      // ===== 1. COVER =====
      await addCoverSheet(doc, project, {
        title: 'Client Presentation',
        subtitle: 'DESIGN PROPOSAL · VASTU · BOQ',
        revision: '1.0',
        shareUrl: opts.shareUrl || ''
      });

      // ===== 2. EXECUTIVE SUMMARY =====
      doc.fillColor('#020617').rect(0, 0, 595, 110).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(22).text('CLIENT PRESENTATION', 42, 35);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(10).text('GRID OS — DESIGN PROPOSAL, VASTU COMPLIANCE & BILL OF QUANTITIES', 42, 65);

      doc.moveDown(4);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(16).text(project.name, 42, 140);
      doc.fillColor('#475569').font('Helvetica').fontSize(10)
        .text(`Prepared For: ${project.client_name || '—'}  |  Contact: ${project.phone || 'N/A'}`, 42, 165);

      const summary = [
        `Total estimated value: Rs. ${(grandTotal || 0).toLocaleString('en-IN')}${gstValue ? ` (incl. GST Rs. ${gstValue.toLocaleString('en-IN')})` : ''}`,
        `BOQ line items: ${boqItems.length || (brief.rooms ? brief.rooms.length : 0)}`,
        `Vastu compliance: ${vastu && vastu.ok ? (vastu.needsApply ? 'Actions recommended (see Vastu section)' : 'Plan already aligns with Vastu') : 'Not assessed (no CAD plan yet)'}`,
        `Brand: GRID OS — authentic carcass system with CNC-ready shop drawings`,
      ];
      let y = 195;
      doc.rect(42, y - 6, 511, 1).fill('#E2E8F0');
      y += 10;
      doc.font('Helvetica').fontSize(10).fillColor('#334155');
      summary.forEach(line => { doc.text(`•  ${line}`, 42, y, { width: 511 }); y += 20; });

      // ===== 3. VASTU COMPLIANCE HIGHLIGHTS =====
      doc.addPage();
      doc.fillColor('#020617').rect(0, 0, 595, 90).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(18).text('VASTU COMPLIANCE HIGHLIGHTS', 42, 32);
      doc.moveDown(3);

      if (vastu && vastu.ok) {
        let vy = 130;
        const poojaLine = vastu.poojaPresent
          ? '✓ Pooja (Mandir) placed in North-East (NE) — Vastu-aligned.'
          : '⚠ No Pooja mandir detected in North-East (NE) — recommended addition.';
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text(poojaLine, 42, vy, { width: 511 });
        vy += 24;
        if (vastu.changes && vastu.changes.length) {
          vastu.changes.forEach(c => {
            doc.font('Helvetica').fontSize(9.5).fillColor('#475569').text(`•  ${c.summary}`, 42, vy, { width: 511 });
            vy += 20;
          });
        } else {
          doc.font('Helvetica').fontSize(9.5).fillColor('#475569').text('•  No Vastu conflicts detected in the current plan.', 42, vy, { width: 511 });
          vy += 20;
        }
        vy += 8;
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#94A3B8')
          .text('Vastu rules applied: Pooja in NE; beds in S/W/SW; avoid N/E/NE/NW/SE for beds.', 42, vy, { width: 511 });
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#94A3B8')
          .text('Vastu assessment requires a CAD floor plan. Generate the plan first to populate this section.', 42, 130, { width: 511 });
      }

      // ===== 4. BILL OF QUANTITIES (BOQ) =====
      doc.addPage();
      doc.fillColor('#020617').rect(0, 0, 595, 90).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(18).text('BILL OF QUANTITIES (BOQ)', 42, 32);
      doc.moveDown(3);

      let by = 130;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569');
      doc.text('Room / Item', 42, by);
      doc.text('Dimensions', 300, by);
      doc.text('Rate', 400, by);
      doc.text('Qty', 460, by);
      doc.text('Amount (INR)', 500, by, { align: 'right', width: 53 });
      by += 16;
      doc.rect(42, by - 4, 511, 1).fill('#CBD5E0');
      by += 8;

      const emitRow = (room, name, dim, rate, qty, amount) => {
        doc.font('Helvetica').fontSize(8.5).fillColor('#0F172A');
        doc.text(`[${room}] ${name}`, 42, by, { width: 255 });
        doc.fillColor('#475569').text(dim || '—', 300, by);
        doc.text(rate ? `Rs. ${rate.toLocaleString('en-IN')}` : '—', 400, by);
        doc.text(`${qty ?? 1}`, 460, by);
        doc.fillColor('#0F172A').font('Helvetica-Bold')
          .text(amount ? `Rs. ${amount.toLocaleString('en-IN')}` : '—', 500, by, { align: 'right', width: 53 });
        by += 22;
        if (by > 700) { doc.addPage(); by = 60; }
      };

      if (boqItems.length) {
        boqItems.forEach(it => emitRow(it.room || 'General', it.name, it.dimensions, it.rate, it.isLumpSum ? 1 : it.sqft, it.amount));
      } else if (brief.rooms && brief.rooms.length) {
        // Fall back to brief rooms when no structured quotation exists.
        brief.rooms.forEach(r => emitRow(r.name || r.roomType || 'Room', r.name || r.roomType || 'Space', r.dimensions || `${r.widthMm || '?'} x ${r.heightMm || '?'} mm`, r.rate || null, 1, r.amount || null));
      } else {
        doc.font('Helvetica').fontSize(9).fillColor('#94A3B8').text('No BOQ line items yet. Generate a quotation to populate this section.', 42, by, { width: 511 });
      }

      // Grand total
      if (by > 660) { doc.addPage(); by = 60; }
      by += 10;
      doc.rect(42, by, 511, 1).fill('#E2E8F0');
      by += 12;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#D4AF37')
        .text(`Grand Total: Rs. ${(grandTotal || 0).toLocaleString('en-IN')}`, 500, by, { align: 'right', width: 53 });

      // ===== 5. ACCEPTANCE PAGE =====
      doc.addPage();
      doc.fillColor('#020617').rect(0, 0, 595, 90).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(18).text('PROPOSAL ACCEPTANCE', 42, 32);
      doc.moveDown(3);
      let ay = 130;
      doc.font('Helvetica').fontSize(10).fillColor('#334155')
        .text('By signing below, the client accepts this design proposal, Vastu recommendations, and the Bill of Quantities as the basis for production handoff.', 42, ay, { width: 511 });
      ay += 60;
      doc.moveTo(42, ay).lineTo(260, ay).stroke('#475569');
      doc.moveTo(330, ay).lineTo(540, ay).stroke('#475569');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A')
        .text('Prepared By (GRID OS)', 42, ay + 8);
      doc.text('Client Acceptance Signature', 330, ay + 8);
      ay += 70;
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94A3B8')
        .text('This document is confidential and prepared exclusively for the named client. Dimensions in millimetres.', 42, ay, { width: 511 });

      // Page footers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94A3B8')
          .text(`Page ${i + 1} of ${range.count} — GRID OS Client Presentation`, 42, 790, { align: 'center' });
      }

      doc.end();
    });
  }

  /**
   * Build a real "Send Designs" pack: branded cover + every generated render
   * for the client's project, embedded full-bleed on A4 landscape pages.
   * @returns {Promise<{path:string, url:string, count:number, renders:Array}>}
   */
  async generateDesignPackPDF(leadId, destPath, opts = {}) {
    // Resolve the client's project via the lead link.
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead) throw new Error('CLIENT_NOT_FOUND');
    const project = db.prepare('SELECT * FROM projects WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1').get(leadId);
    if (!project) throw new Error('NO_PROJECT_FOR_CLIENT');

    // Gather this client's renders (image_url like /storage/assets/x.jpg).
    const renders = db.prepare(
      "SELECT * FROM design_renders WHERE project_id = ? ORDER BY created_at DESC"
    ).all(project.id);

    const absRenders = renders
      .map(r => {
        const rel = (r.image_url || '').replace(/^\/storage\//, '');
        if (!rel) return null;
        const abs = path.join(storageDir, rel);
        return fs.existsSync(abs) ? { abs, room: r.room || '', prompt: r.prompt || '' } : null;
      })
      .filter(Boolean);

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve({
        path: destPath,
        url: `/storage/uploads/${path.basename(destPath)}`,
        count: absRenders.length,
        renders: absRenders.map(r => r.abs)
      }));
      stream.on('error', reject);
      doc.pipe(stream);

      // ── Cover ──
      doc.rect(0, 0, 842, 160).fill('#020617');
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(30)
        .text('YOUR INTERIOR DESIGN CONCEPTS', 42, 55);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(12)
        .text('Prepared exclusively for you by GRID OS Studio', 42, 98);
      doc.moveDown(3);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(20)
        .text(`${lead.name || project.client_name}`, 42, 200);
      doc.fillColor('#475569').font('Helvetica').fontSize(11)
        .text(`Project: ${project.name || 'Interior Design'}`, 42, 230);
      if (lead.location) doc.text(`Location: ${lead.location}`, 42, 248);
      doc.text(`Prepared on: ${new Date().toLocaleDateString('en-IN')}`, 42, 266);
      doc.moveDown(2);
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(13)
        .text(absRenders.length ? `${absRenders.length} concept render(s) enclosed →` : 'Concept renders will be added as they are finalised.', 42, 320);

      if (opts?.shareUrl) {
        try {
          const qr = await qrDataUrl(opts.shareUrl);
          if (qr) { doc.image(qr, 700, 180, { width: 110 }); doc.fillColor('#94A3B8').fontSize(8).text('Live link', 700, 300); }
        } catch (_) {}
      }

      // ── Render pages (full-bleed landscape) ──
      absRenders.forEach((r, i) => {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 24 });
        try {
          const dim = doc.openImage(r.abs);
          const pageW = 842 - 48, pageH = 595 - 48;
          const scale = Math.min(pageW / dim.width, pageH / dim.height);
          const w = dim.width * scale, h = dim.height * scale;
          doc.image(r.abs, 24 + (pageW - w) / 2, 24 + (pageH - h) / 2, { width: w, height: h });
        } catch (e) {
          doc.fillColor('#94A3B8').fontSize(10).text('[render image unavailable]', 300, 280);
        }
        doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(11)
          .text(`Concept ${i + 1}${r.room ? ' — ' + r.room : ''}`, 24, 24);
      });

      // Footer page numbers
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94A3B8')
          .text(`Page ${i + 1} of ${range.count} — GRID OS Design Pack`, 24, 575, { align: 'center' });
      }
      doc.end();
    });
  }
}

export default new PDFBuilder();
