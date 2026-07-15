import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import db from '../database/database.js';
import { buildStandardModel } from './standards.js';
import { drawElevation } from './pdf-elevation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../storage');

/**
 * Generates a unified Delivery Pack PDF combining brief, floor plan, elevations, quote, and cutlist summary.
 * @param {string} projectId 
 * @returns {Promise<string>} File path to the generated PDF
 */
export function generateDeliveryPackPdf(projectId) {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
  if (!project) throw new Error("Project not found");

  const drawing = db.prepare("SELECT * FROM cad_drawings WHERE project_id = ?").get(projectId);
  const invoice = db.prepare("SELECT * FROM invoices WHERE project_id = ? ORDER BY issue_date DESC LIMIT 1").get(projectId);
  const sceneRow = db.prepare("SELECT scene_json FROM scene_versions WHERE project_id = ? AND is_current = 1 ORDER BY version_number DESC LIMIT 1").get(projectId);
  const renders = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND source_type IN ('blender-renderer', 'blender-cycles-ai-polish')").all(projectId);

  // Read cutlist project
  const cutlistProject = db.prepare("SELECT * FROM cutlist_projects WHERE project_id = ? ORDER BY created_at DESC LIMIT 1").get(projectId);
  let cutlistModules = [];
  let cutlistParts = [];
  if (cutlistProject) {
    cutlistModules = db.prepare("SELECT * FROM cutlist_modules WHERE cutlist_project_id = ?").all(cutlistProject.id);
    cutlistParts = db.prepare("SELECT * FROM cutlist_parts WHERE cutlist_project_id = ?").all(cutlistProject.id);
  }

  const brief = JSON.parse(project.client_brief_json || '{}');
  const walls = JSON.parse(drawing?.walls_json || '[]');
  const openings = JSON.parse(drawing?.openings_json || '[]');
  const furniture = JSON.parse(drawing?.furniture_json || '[]');
  const rooms = JSON.parse(drawing?.rooms_json || '[]');

  const exportsDir = path.join(storageDir, 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  const destPath = path.join(exportsDir, `delivery-pack-${projectId}-${Date.now()}.pdf`);

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
    const stream = fs.createWriteStream(destPath);
    stream.on('finish', () => resolve(destPath));
    stream.on('error', reject);
    doc.pipe(stream);

    // Page 1: Branded Cover Page
    doc.rect(0, 0, 595, 160).fill('#0A0A0B'); // Base Dark
    doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(14).text('ULTIDA STUDIO OS', 42, 34); // Gold Accent
    doc.fillColor('#8A8899').font('Helvetica').fontSize(9).text('MODEL-FIRST INTERIOR DESIGN PIPELINE · SINGLE SOURCE OF TRUTH', 42, 52); // Neutral Text
    doc.fillColor('#F0EEE8').font('Helvetica-Bold').fontSize(26).text('CLIENT DELIVERY PACK', 42, 82); // Primary Light Text
    doc.fillColor('#8A8899').font('Helvetica').fontSize(11).text('COMPREHENSIVE DESIGN BRIEF, DRAWINGS, QUOTATION & MANUFACTURING SPECIFICATIONS', 42, 122);

    doc.fillColor('#0A0A0B').font('Helvetica-Bold').fontSize(14).text('PROJECT SPECIFICATIONS', 42, 200);
    doc.moveTo(42, 218).lineTo(553, 218).lineWidth(1.5).strokeColor('#C9A84C').stroke();

    const metaRows = [
      ['Project Name', project.name || '—'],
      ['Client / Owner', project.client_name || '—'],
      ['Property Location', brief.location || 'Bangalore, KA'],
      ['Budget Tier', String(brief.budgetTier || 'Standard').toUpperCase()],
      ['Project Value', `INR ${project.total_cost?.toLocaleString() || '—'}`],
      ['Advance Deposited', `INR ${project.advance_paid_amount?.toLocaleString() || '0'}`],
      ['Pack Compiled', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
    ];

    let y = 235;
    for (const [k, v] of metaRows) {
      doc.fillColor('#8A8899').font('Helvetica-Bold').fontSize(9).text(k.toUpperCase(), 42, y);
      doc.fillColor('#0A0A0B').font('Helvetica').fontSize(10).text(String(v), 180, y, { width: 360 });
      y += 24;
    }

    // Add brief notes if present
    doc.rect(42, y + 10, 511, 1).fill('#E2E8F0');
    y += 25;
    doc.fillColor('#0A0A0B').font('Helvetica-Bold').fontSize(11).text('Cooking Style & Space Preferences', 42, y);
    y += 18;
    doc.fillColor('#334155').font('Helvetica').fontSize(9).text(
      `Cooking habits: ${brief.cookingHabits || 'Standard'}. Vastu preference: ${brief.vastuPreferences || 'Neutral'}. ` +
      `Disliked colors/finishes: ${Array.isArray(brief.dislikedColors) ? brief.dislikedColors.join(', ') : 'None'}.`,
      42, y, { width: 511, lineGap: 4 }
    );

    // Footer banner
    doc.rect(0, 780, 595, 17).fill('#0A0A0B');
    doc.fillColor('#8A8899').font('Helvetica').fontSize(8).text('ULTIDA CONFIDENTIAL DELIVERABLE. ALL DESIGN & GEOMETRY VERIFIED VIA MODEL SCENE GRAPH.', 42, 784);

    // Page 2: 2D Floor Plan Drawing
    doc.addPage();
    doc.fillColor('#0A0A0B').rect(0, 0, 595, 80).fill();
    doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(16).text('2D BLUEPRINT LAYOUT', 42, 22);
    doc.fillColor('#8A8899').font('Helvetica').fontSize(9).text('CALIBRATED ARCHITECTURAL FLOORPLAN ZONING', 42, 48);

    doc.fillColor('#0A0A0B').font('Helvetica-Bold').fontSize(11).text('1. Calibrated Room Layout Plan', 42, 110);
    doc.strokeColor('#CBD5E0').lineWidth(0.5).rect(42, 130, 511, 350).stroke();

    const planX = 62, planY = 150, planW = 470, planH = 300;
    if (walls.length > 0) {
      let maxWX = 1, maxWY = 1;
      walls.forEach(w => {
        maxWX = Math.max(maxWX, w.x1, w.x2);
        maxWY = Math.max(maxWY, w.y1, w.y2);
      });
      const sx = v => planX + (v / maxWX) * planW;
      const sy = v => planY + (v / maxWY) * planH;

      // Draw rooms
      rooms.forEach(r => {
        const b = r.bounds || r.rect;
        if (!b || !b.w || !b.h) return;
        const bx = planX + b.x * planW;
        const by = planY + b.y * planH;
        const bw = b.w * planW;
        const bh = b.h * planH;
        doc.fillColor('#F8FAFC').rect(bx, by, bw, bh).fill();
        doc.strokeColor('#C9A84C').lineWidth(1).rect(bx, by, bw, bh).stroke();
        doc.fillColor('#0A0A0B').font('Helvetica-Bold').fontSize(8).text(r.name, bx, by + bh/2 - 4, { width: bw, align: 'center' });
      });

      // Draw walls
      doc.lineWidth(4).strokeColor('#1E1E24');
      walls.forEach(w => {
        doc.moveTo(sx(w.x1), sy(w.y1)).lineTo(sx(w.x2), sy(w.y2)).stroke();
      });

      // Draw openings
      openings.forEach(op => {
        if (op.x == null || op.y == null) return;
        doc.lineWidth(1.5).strokeColor('#fbbf24').circle(sx(op.x), sy(op.y), 4).fillAndStroke('#ffffff', '#fbbf24');
      });
    } else {
      doc.fillColor('#8A8899').font('Helvetica-Oblique').fontSize(10).text('Floor plan layout coordinates empty or not traced yet.', 120, 280);
    }

    // Page 3: 2D Wall Elevations
    if (furniture.length > 0 || sceneRow) {
      doc.addPage();
      doc.fillColor('#0A0A0B').rect(0, 0, 595, 80).fill();
      doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(16).text('2D MILLWORK ELEVATIONS', 42, 22);
      doc.fillColor('#8A8899').font('Helvetica').fontSize(9).text('SHUTTER ELEVATION & DETAILED CARCASS DIMENSION SHEETS', 42, 48);

      let currentY = 110;
      
      // We can generate mock elevations for the units placed in the scene
      let sceneModules = [];
      if (sceneRow) {
        try {
          sceneModules = JSON.parse(sceneRow.scene_json).placed_modules || [];
        } catch (_) {}
      }

      const displayModules = sceneModules.length > 0 ? sceneModules : furniture;
      
      displayModules.slice(0, 2).forEach((f, idx) => {
        const widthMm = f.widthMm || f.width_mm || 900;
        const heightMm = f.heightMm || f.height_mm || 720;
        const typeLabel = (f.type || 'base').toUpperCase();

        doc.fillColor('#0A0A0B').font('Helvetica-Bold').fontSize(10).text(`ELEVATION SHEET ${idx + 1}: ${typeLabel} CABINET (W: ${widthMm}mm × H: ${heightMm}mm)`, 42, currentY);
        
        const frameX = 42, frameY = currentY + 15, frameW = 511, frameH = 260;
        doc.strokeColor('#E2E8F0').lineWidth(0.5).rect(frameX, frameY, frameW, frameH).stroke();

        const escale = Math.min((frameW - 60) / widthMm, (frameH - 60) / heightMm);
        const eox = frameX + (frameW - widthMm * escale) / 2;
        const eoy = frameY + frameH - 30;

        const model = buildStandardModel(f.type || 'base', { widthMm, heightMm, depthMm: f.depthMm || 560 });
        model.projectId = projectId;
        model.wallName = `Module ID: ${f.id}`;

        drawElevation(doc, model, { embed: true, offsetX: eox, offsetY: eoy, embedScale: escale, noDimensions: false });

        currentY += 300;
      });
    }

    // Page 4: Quotation & Pricing Summary
    doc.addPage();
    doc.fillColor('#0A0A0B').rect(0, 0, 595, 80).fill();
    doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(16).text('ESTIMATE & COMMERCIAL QUOTATION', 42, 22);
    doc.fillColor('#8A8899').font('Helvetica').fontSize(9).text('GST TAX INVOICE PROPOSAL & PAYMENT MILESTONES', 42, 48);

    doc.fillColor('#0A0A0B').font('Helvetica-Bold').fontSize(11).text('Quotation Line Items', 42, 100);
    
    let quoteItems = [];
    if (invoice && invoice.items_json) {
      try { quoteItems = JSON.parse(invoice.items_json); } catch (_) {}
    } else {
      quoteItems = [
        { name: 'Modular Cabinet Package', quantity: 1, rate: project.total_cost || 85000, amount: project.total_cost || 85000, description: 'Carcass and shutter assemblies' }
      ];
    }

    let qY = 120;
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8.5).text('Description', 42, qY);
    doc.text('Qty', 350, qY);
    doc.text('Rate', 400, qY);
    doc.text('Amount (INR)', 470, qY, { align: 'right', width: 80 });
    qY += 14;
    doc.rect(42, qY - 2, 511, 1).fill('#CBD5E0');
    qY += 8;

    doc.font('Helvetica').fontSize(8);
    quoteItems.forEach(item => {
      doc.fillColor('#0A0A0B').font('Helvetica-Bold').text(item.name || item.description, 42, qY, { width: 280 });
      doc.fillColor('#475569').font('Helvetica').text(String(item.quantity ?? 1), 350, qY);
      doc.text(`Rs. ${(item.rate || 0).toLocaleString()}`, 400, qY);
      doc.fillColor('#0A0A0B').font('Helvetica-Bold').text(`Rs. ${(item.amount || 0).toLocaleString()}`, 470, qY, { align: 'right', width: 80 });
      qY += 20;

      if (qY > 600) {
        doc.addPage();
        qY = 50;
      }
    });

    // Subtotal and GST
    qY += 10;
    doc.rect(42, qY, 511, 1).fill('#CBD5E0');
    qY += 15;

    const subTotalVal = invoice?.subtotal || project.total_cost || 0;
    const cgstVal = invoice?.cgst || 0;
    const sgstVal = invoice?.sgst || 0;
    const grandTotalVal = invoice?.grand_total || subTotalVal + cgstVal + sgstVal;

    const addTotalRow = (label, val, isBold = false) => {
      doc.fillColor(isBold ? '#0A0A0B' : '#475569').font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).text(label, 320, qY);
      doc.fillColor(isBold ? '#C9A84C' : '#0A0A0B').font('Helvetica-Bold').text(val, 450, qY, { align: 'right', width: 100 });
      qY += 18;
    };

    addTotalRow('Subtotal:', `Rs. ${subTotalVal.toLocaleString()}`);
    if (cgstVal > 0) addTotalRow('CGST (9%):', `Rs. ${cgstVal.toLocaleString()}`);
    if (sgstVal > 0) addTotalRow('SGST (9%):', `Rs. ${sgstVal.toLocaleString()}`);
    doc.rect(320, qY - 2, 233, 1).fill('#CBD5E0');
    qY += 6;
    addTotalRow('Grand Total:', `Rs. ${grandTotalVal.toLocaleString()}`, true);

    // Page 5: Factory Cutlist Summary
    doc.addPage();
    doc.fillColor('#0A0A0B').rect(0, 0, 595, 80).fill();
    doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(16).text('FACTORY BILL OF MATERIALS', 42, 22);
    doc.fillColor('#8A8899').font('Helvetica').fontSize(9).text('CARCASS/SHUTTER COMPONENT PARTS LIST & ACCESSORIES', 42, 48);

    doc.fillColor('#0A0A0B').font('Helvetica-Bold').fontSize(11).text('Manufacturing Parts List', 42, 100);

    let cutY = 120;
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8.5).text('Cabinet Module', 42, cutY);
    doc.text('Component Name', 160, cutY);
    doc.text('Dimensions', 320, cutY);
    doc.text('Material', 420, cutY);
    doc.text('Qty', 500, cutY, { align: 'right', width: 30 });
    cutY += 14;
    doc.rect(42, cutY - 2, 511, 1).fill('#CBD5E0');
    cutY += 8;

    doc.font('Helvetica').fontSize(8);
    
    if (cutlistParts.length > 0) {
      cutlistParts.slice(0, 18).forEach(part => {
        const modName = cutlistModules.find(m => m.id === part.cutlist_module_id)?.name || 'Carcass';
        const dims = `${Math.round(part.length_mm)} × ${Math.round(part.width_mm)} × ${Math.round(part.thickness_mm)} mm`;
        
        doc.fillColor('#0A0A0B').font('Helvetica-Bold').text(modName, 42, cutY, { width: 110 });
        doc.fillColor('#475569').font('Helvetica').text(part.name || 'Panel', 160, cutY, { width: 150 });
        doc.text(dims, 320, cutY);
        doc.text(part.material_type || 'Plywood', 420, cutY);
        doc.fillColor('#0A0A0B').font('Helvetica-Bold').text(String(part.quantity ?? 1), 500, cutY, { align: 'right', width: 30 });
        cutY += 20;

        if (cutY > 700) {
          doc.addPage();
          cutY = 50;
        }
      });
    } else {
      doc.fillColor('#8A8899').font('Helvetica-Oblique').fontSize(9).text('No cutlist parts generated yet. Run cutlist calculation to populate factory panels.', 120, 200);
    }

    // Embed Renders directly (Page 6+)
    renders.forEach((r, idx) => {
      const fp = path.join(storageDir, r.file_path.replace('/storage/', ''));
      if (fs.existsSync(fp)) {
        try {
          doc.addPage();
          doc.fillColor('#0A0A0B').rect(0, 0, 595, 80).fill();
          doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(16).text('3D AI VISUALIZATION RENDER', 42, 22);
          doc.fillColor('#8A8899').font('Helvetica').fontSize(9).text(`ROOM VIEW: ${r.room.toUpperCase()} - STYLE: ${r.style.toUpperCase()}`, 42, 48);

          doc.image(fp, 42, 120, { width: 511, height: 320, fit: [511, 320] });
          
          doc.fillColor('#0A0A0B').font('Helvetica-Bold').fontSize(11).text('Render Metadata', 42, 460);
          doc.moveTo(42, 475).lineTo(553, 475).lineWidth(1).strokeColor('#CBD5E0').stroke();
          
          let my = 490;
          const addMetaLine = (label, val) => {
            doc.fillColor('#8A8899').font('Helvetica-Bold').fontSize(9).text(label.toUpperCase(), 42, my);
            doc.fillColor('#0A0A0B').font('Helvetica').fontSize(9).text(String(val), 180, my, { width: 360 });
            my += 20;
          };
          addMetaLine('Visual Title', r.title);
          addMetaLine('AI Polish Prompt', r.prompt || 'Pure Blender Cycles deterministic render');
          addMetaLine('Asset ID', r.id);
          addMetaLine('Source Engine', r.source_type);
        } catch (e) {
          console.error(`[delivery-pack] Skipping render image ${r.file_path}:`, e.message);
        }
      }
    });

    // Pagination numbering
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#8A8899').text(`Page ${i + 1} of ${range.count} - Stamped Technical Pack`, 42, 790, { align: 'center' });
    }

    doc.end();
  });
}

/**
 * buildDeliveryPackage — assembles a downloadable ZIP of the full delivery pack
 * for a project: the unified Delivery Pack PDF, the factory cutlist (CSV), the
 * latest estimate/invoice, and the combined elevation PDF (when available).
 * Returns the absolute path to the generated .zip.
 *
 * Used by the /api/projects/:id/delivery-package route (Phase 6 delivery pack).
 */
export async function buildDeliveryPackage({ projectId, pipelineResult, outDir, rooms } = {}) {
  const archiver = (await import('archiver')).default;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) throw new Error('Project not found');

  const destDir = path.resolve(outDir || path.join(storageDir, 'proposals', String(projectId)));
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const zipPath = path.join(destDir, `ULTIDA_${projectId}_package_${Date.now()}.zip`);

  // 1) unified PDF (already implemented)
  const pdfPath = await generateDeliveryPackPdf(projectId);

  // 2) cutlist CSV from cutlist_parts (best-effort)
  let cutlistCsv = 'Module,Component,Dimensions(mm),Material,Qty\n';
  try {
    const cutlistProject = db.prepare('SELECT * FROM cutlist_projects WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(projectId);
    if (cutlistProject) {
      const modules = db.prepare('SELECT * FROM cutlist_modules WHERE cutlist_project_id = ?').all(cutlistProject.id);
      const parts = db.prepare('SELECT * FROM cutlist_parts WHERE cutlist_project_id = ?').all(cutlistProject.id);
      for (const p of parts) {
        const mod = modules.find(m => m.id === p.cutlist_module_id);
        const dims = `${Math.round(p.length_mm || 0)} x ${Math.round(p.width_mm || 0)} x ${Math.round(p.thickness_mm || 0)}`;
        cutlistCsv += `"${mod?.name || 'Carcass'}","${p.name || 'Panel'}","${dims}","${p.material_type || 'Plywood'}",${p.quantity ?? 1}\n`;
      }
    }
  } catch (e) {
    console.warn('[delivery-package] cutlist CSV skipped:', e.message);
  }

  // 3) latest estimate / invoice (best-effort JSON)
  let commercialJson = '{}';
  try {
    const est = db.prepare('SELECT * FROM estimate_sets WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(projectId);
    const inv = db.prepare('SELECT * FROM invoices WHERE project_id = ? ORDER BY issue_date DESC LIMIT 1').get(projectId);
    commercialJson = JSON.stringify({ estimate: est || null, invoice: inv || null }, null, 2);
  } catch (e) {
    console.warn('[delivery-package] commercial JSON skipped:', e.message);
  }

  // 4) combined elevation PDF (best-effort)
  let elevationPath = null;
  try {
    const elevRes = await fetch(`http://127.0.0.1:${process.env.PORT || 8787}/api/projects/${projectId}/elevations/combined-pdf`);
    if (elevRes.ok) {
      const buf = Buffer.from(await elevRes.arrayBuffer());
      elevationPath = path.join(destDir, `elevations_${projectId}.pdf`);
      fs.writeFileSync(elevationPath, buf);
    }
  } catch (e) {
    console.warn('[delivery-package] elevation PDF skipped:', e.message);
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);
    archive.pipe(output);

    archive.file(pdfPath, { name: `ULTIDA_${projectId}_DeliveryPack.pdf` });
    archive.append(cutlistCsv, { name: `ULTIDA_${projectId}_Cutlist.csv` });
    archive.append(commercialJson, { name: `ULTIDA_${projectId}_Commercial.json` });
    if (elevationPath && fs.existsSync(elevationPath)) {
      archive.file(elevationPath, { name: `ULTIDA_${projectId}_Elevations.pdf` });
    }
    archive.finalize();
  });
}
