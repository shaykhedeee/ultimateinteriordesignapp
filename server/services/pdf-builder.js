import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import db from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.join(__dirname, '../../storage');

class PDFBuilder {
  /**
   * Generates a comprehensive Client Design Brief PDF
   * @param {string} projectId 
   * @param {string} destPath 
   */
  async generateBriefPDF(projectId, destPath) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
    if (!project) throw new Error("Project not found");

    const brief = JSON.parse(project.client_brief_json || '{}');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      doc.pipe(stream);

      // Header Banner
      doc.fillColor('#020617').rect(0, 0, 595, 110).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(22).text('CLIENT DESIGN BRIEF', 42, 35);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(10).text('SPACETRACE OS - ONBOARDING REQUIREMENT RECORD', 42, 65);

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
        doc.fontSize(8).fillColor('#94A3B8').text(`Page ${i + 1} of ${range.count} - Stamped on ${new Date().toLocaleDateString()}`, 42, 815, { align: 'center' });
      }

      doc.end();
    });
  }

  /**
   * Generates the Comprehensive Final Production Sign-off Document
   * @param {string} projectId 
   * @param {string} destPath 
   */
  async generateSignoffPDF(projectId, destPath) {
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

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      doc.pipe(stream);

      // Page 1: Cover Contract Block
      doc.fillColor('#020617').rect(0, 0, 595, 140).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(24).text('PRODUCTION SIGN-OFF CONTRACT', 42, 45);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(10).text('COMPREHENSIVE FINAL TECHNICAL SPECIFICATIONS & DRAWINGS', 42, 80);

      doc.moveDown(5);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(16).text(' Sharma HSR Flat Project Scope Summary', 42, 170);
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
        doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text('High Gloss Laminate / Custom partitions', 180, y, { width: 250 });
        // Calculate mock area
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text('14.2 sq m', 450, y, { align: 'right', width: 100 });
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

      if (walls.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        walls.forEach(w => {
          minX = Math.min(minX, w.x1, w.x2);
          maxX = Math.max(maxX, w.x1, w.x2);
          minY = Math.min(minY, w.y1, w.y2);
          maxY = Math.max(maxY, w.y1, w.y2);
        });

        const wWidth = maxX - minX;
        const wHeight = maxY - minY;
        const targetWidth = 470;
        const targetHeight = 310;
        const scale = Math.min(targetWidth / (wWidth || 1), targetHeight / (wHeight || 1));

        const transformX = (x) => 62 + (x - minX) * scale;
        const transformY = (y) => 170 + (y - minY) * scale;

        // Draw rooms centroids / text labels first
        rooms.forEach(r => {
          doc.fillColor('#F1F5F9').rect(transformX(r.x) - 45, transformY(r.y) - 12, 90, 24).fill();
          doc.strokeColor('#D4AF37').lineWidth(1).rect(transformX(r.x) - 45, transformY(r.y) - 12, 90, 24).stroke();
          doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5).text(`${r.name} (${r.vastu || 'NE'})`, transformX(r.x) - 45, transformY(r.y) - 4, { width: 90, align: 'center' });
        });

        // Draw walls
        doc.lineWidth(4.5).strokeColor('#1e293b');
        walls.forEach(w => {
          doc.moveTo(transformX(w.x1), transformY(w.y1))
             .lineTo(transformX(w.x2), transformY(w.y2))
             .stroke();
        });

        // Draw openings
        doc.lineWidth(1.5).strokeColor('#fbbf24');
        openings.forEach(op => {
          doc.circle(transformX(op.x), transformY(op.y), 4.5).fillAndStroke('#ffffff', '#fbbf24');
        });

        // Draw placed cabinet modules footprints
        doc.lineWidth(1).strokeColor('#475569');
        furniture.forEach(f => {
          const w = (f.width || 60) * scale;
          const h = (f.height || 60) * scale;
          doc.rect(transformX(f.x) - w/2, transformY(f.y) - h/2, w, h).stroke();
          doc.fillColor('#475569').font('Helvetica-Bold').fontSize(6).text(f.name.substring(0, 10), transformX(f.x) - w/2, transformY(f.y) - 3, { width: w, align: 'center' });
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

          // Draw elevation frame
          doc.strokeColor('#CBD5E0').lineWidth(0.5).rect(42, currentY, 511, 150).stroke();
          doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9.5).text(`ELEVATION VIEW ${idx + 1}: ${f.name.toUpperCase()} FRONT FACE`, 55, currentY + 12);
          
          const widthMm = (f.width * 25.0) || 1800; // convert pixel width back to mm
          const scaleElev = 105.0 / 2700.0; // scale 2.7m ceiling height to 105 points
          const wPoints = widthMm * scaleElev;
          const hPoints = 2700 * scaleElev;
          
          const startX = 260 - wPoints / 2;
          const startY = currentY + 130 - hPoints;

          // Draw ground baseline
          doc.strokeColor('#94A3B8').lineWidth(1.5).moveTo(50, currentY + 130).lineTo(540, currentY + 130).stroke();

          // Draw cabinet box
          doc.strokeColor('#1E293B').lineWidth(1.2).rect(startX, startY, wPoints, hPoints).stroke();

          // Draw plinths/shutters detail
          const plinthH = 100 * scaleElev;
          const loftH = 600 * scaleElev;

          // Draw plinth base
          doc.rect(startX, currentY + 130 - plinthH, wPoints, plinthH).fill('#F1F5F9');
          doc.strokeColor('#1E293B').lineWidth(1).rect(startX, currentY + 130 - plinthH, wPoints, plinthH).stroke();

          if (f.type === 'wardrobe') {
            // Draw Loft panels
            doc.strokeColor('#1E293B').rect(startX, startY, wPoints, loftH).stroke();
            doc.fillColor('#475569').font('Helvetica').fontSize(6).text('LOFT', startX, startY + 4, { width: wPoints, align: 'center' });
            // Vertical shutters line
            doc.moveTo(startX + wPoints/2, startY + loftH).lineTo(startX + wPoints/2, currentY + 130 - plinthH).stroke();
            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(6.5).text('SWING DOOR WARDROBE', startX, startY + 35, { width: wPoints, align: 'center' });
          } else if (f.type === 'counter') {
            // Draw Countertop Slab line
            const counterH = 750 * scaleElev;
            const counterTopY = currentY + 130 - plinthH - counterH;
            doc.rect(startX, counterTopY - 4, wPoints, 4).fill('#334155');
            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(6.5).text('MODULAR BASE COUNTER', startX, counterTopY + 18, { width: wPoints, align: 'center' });
          } else {
            doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(6.5).text('PARAMETRIC UNIT', startX, startY + 30, { width: wPoints, align: 'center' });
          }

          // Elevation guidelines
          doc.strokeColor('#D4AF37').lineWidth(0.5);
          const heights = [
            { val: 100, label: '100 PLINTH' },
            { val: 850, label: '850 COUNTER' },
            { val: 2100, label: '2100 LINTEL' },
            { val: 2700, label: '2700 CEILING' }
          ];
          heights.forEach(h => {
            const gy = currentY + 130 - h.val * scaleElev;
            doc.moveTo(startX - 15, gy).lineTo(startX - 4, gy).stroke();
            doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(5.5).text(h.label, startX - 80, gy - 2);
          });

          // Width guide
          doc.fillColor('#475569').font('Helvetica').fontSize(7).text(`Width: ${widthMm} mm`, startX, currentY + 134, { width: wPoints, align: 'center' });

          currentY += 170;
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

      // Signature Blocks
      doc.moveTo(42, 600).lineTo(240, 600).stroke('#475569');
      doc.moveTo(330, 600).lineTo(540, 600).stroke('#475569');
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text('Authorized Design Lead Signature', 42, 612);
      doc.text('Client Signature (I Approve the Brief)', 330, 612);

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94A3B8').text(`Page ${i + 1} of ${range.count} - Stamped Sign-off`, 42, 815, { align: 'center' });
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
  async generateQuotationPDF(projectId, destPath, quotation) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
    if (!project) throw new Error("Project not found");

    const items = quotation.items || [];
    const discount = quotation.discount || 0;
    const isGstEnabled = quotation.isGstEnabled !== false;
    const gstPercentage = quotation.gstPercentage || 18;
    const milestones = quotation.milestones || [];
    const subTotal = quotation.subTotal || 0;
    const gstValue = quotation.gstValue || 0;
    const grandTotal = quotation.grandTotal || 0;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
      const stream = fs.createWriteStream(destPath);
      stream.on('finish', () => resolve(destPath));
      stream.on('error', reject);
      doc.pipe(stream);

      // Header Banner
      doc.fillColor('#020617').rect(0, 0, 595, 120).fill();
      doc.fillColor('#D4AF37').font('Helvetica-Bold').fontSize(22).text('QUOTATION PROPOSAL', 42, 35);
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(10).text('SPACETRACE OS - ITEMIZED BILLING ENGINE', 42, 65);

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
      doc.text('Dimensions', 250, y);
      doc.text('Rate', 350, y);
      doc.text('Qty / Sqft', 430, y);
      doc.text('Amount (INR)', 500, y, { align: 'right', width: 53 });
      y += 18;
      doc.rect(42, y - 4, 511, 1).fill('#CBD5E0');

      // Table Rows
      doc.font('Helvetica').fontSize(8.5);
      items.forEach((item) => {
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(`[${item.room || 'General'}] ${item.name}`, 42, y, { width: 200 });
        doc.fillColor('#475569').font('Helvetica').text(item.dimensions || 'Lump Sum', 250, y);
        doc.text(`₹${item.rate?.toLocaleString()}`, 350, y);
        doc.text(item.isLumpSum ? '1' : `${item.sqft?.toFixed(1)} sqft`, 430, y);
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(`₹${item.amount?.toLocaleString()}`, 500, y, { align: 'right', width: 53 });
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

      addTotalRow('Subtotal:', `₹${subTotal.toLocaleString()}`);
      if (discount > 0) {
        addTotalRow('Discount:', `-₹${discount.toLocaleString()}`);
      }
      if (isGstEnabled) {
        addTotalRow(`GST (${gstPercentage}%):`, `₹${gstValue.toLocaleString()}`);
      }
      doc.rect(rightLabelX, y - 4, 203, 1).fill('#CBD5E0');
      y += 5;
      addTotalRow('Grand Total:', `₹${grandTotal.toLocaleString()}`, true);

      // Payment Milestones
      y += 15;
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('Payment Milestones Schedule', 42, y);
      y += 20;

      milestones.forEach((m) => {
        doc.fillColor('#475569').font('Helvetica').fontSize(9).text(m.stage, 42, y);
        doc.fillColor('#0F172A').font('Helvetica-Bold').text(`₹${m.amount?.toLocaleString()}`, 500, y, { align: 'right', width: 53 });
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
      
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text('Prepared By (SpaceTrace OS)', 42, y + 48);
      doc.text('Client Acceptance Signature', 330, y + 48);

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94A3B8').text(`Page ${i + 1} of ${range.count} - SpaceTrace Invoice Proposal`, 42, 815, { align: 'center' });
      }

      doc.end();
    });
  }
}

export default new PDFBuilder();
