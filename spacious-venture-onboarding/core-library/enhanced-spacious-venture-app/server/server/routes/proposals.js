import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { getProject } from '../services/design-engine.js';
import { rootDir, storageDir } from '../services/database.js';

export const proposalsRouter = express.Router();

proposalsRouter.post('/:projectId/pdf', async (req, res, next) => {
  try {
    const project = getProject(req.params.projectId);
    if (!project?.designPackage) return res.status(404).json({ error: 'Generate a PDF brief package before exporting PDF.' });
    const fileName = `${project.id}-brief.pdf`;
    const outPath = path.join(storageDir, 'proposals', fileName);
    await writeProposalPdf(project, outPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(outPath).pipe(res);
  } catch (err) {
    next(err);
  }
});

function writeProposalPdf(project, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
    const stream = fs.createWriteStream(outPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    addCover(doc, project);
    addFloorPlan(doc, project);
    addMoodboards(doc, project);
    addMaterials(doc, project);
    addChecks(doc, project);
    addSignoff(doc, project);

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#7a7d74').text(`Spacious Venture Studio OS - PDF Brief - Page ${i + 1}`, 42, 815, { align: 'center' });
    }
    doc.end();
  });
}

function addCover(doc, project) {
  const pkg = project.designPackage;
  doc.rect(0, 0, 595, 842).fill('#f7f2e8');
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(26).text('Spacious Venture', 42, 60);
  doc.fillColor('#b88a2f').fontSize(12).text('CLIENT ONBOARDING PDF BRIEF', 42, 94);
  doc.moveDown(4);
  doc.fillColor('#1d211d').fontSize(28).text(pkg.title, 42, 160, { width: 500 });
  doc.font('Helvetica').fontSize(12).fillColor('#55594f').text(pkg.summary, 42, 250, { width: 490, lineGap: 4 });
  doc.moveDown(2);
  doc.font('Helvetica-Bold').fillColor('#1d211d').text('Client profile');
  doc.font('Helvetica').fillColor('#55594f').text(`Client: ${project.clientName}`);
  doc.text(`City: ${project.city}`);
  doc.text(`Home: ${project.homeType.toUpperCase()} - Budget: ${project.budgetTier}`);
  doc.text(`Style: ${project.primaryStyle}`);
  doc.text(`Spaces: ${project.selectedSpaces.join(', ')}`);
}

function addFloorPlan(doc, project) {
  const floorPlan = project.floorPlan;
  if (!floorPlan && !project.floorPlanNotes) return;
  doc.addPage();
  sectionTitle(doc, 'Floor Plan & Layout Constraints', 'Manual floor-plan annotations used as the source of truth for room scope, placement notes, and cutlist handoff.');
  const local = floorPlan?.previewPath ? path.join(rootDir, floorPlan.previewPath.replace(/^\//, '')) : '';
  if (local && fs.existsSync(local) && !local.toLowerCase().endsWith('.pdf')) {
    doc.image(local, 42, 140, { width: 250, height: 180, fit: [250, 180] });
  } else {
    doc.roundedRect(42, 140, 250, 180, 10).fill('#e7e0d2');
    doc.fillColor('#7a4c2a').font('Helvetica-Bold').fontSize(13).text(floorPlan?.previewPath ? 'PDF floor plan attached' : 'No floor plan image', 72, 210, { width: 190, align: 'center' });
  }
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(11).text('Designer layout notes', 320, 142);
  doc.fillColor('#55594f').font('Helvetica').fontSize(9).text(project.floorPlanNotes || 'No additional layout notes.', 320, 162, { width: 220, lineGap: 3 });
  doc.font('Helvetica-Bold').fillColor('#1d211d').fontSize(11).text('Annotation legend', 42, 350);
  let y = 374;
  for (const zone of floorPlan?.annotations?.zones || []) {
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(9).text(`Zone: ${zone.label || zone.room}`, 42, y);
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(`Room ${zone.room}; x${Math.round(zone.x)} y${Math.round(zone.y)} w${Math.round(zone.w)} h${Math.round(zone.h)}`, 180, y, { width: 340 });
    y += 22;
  }
  for (const marker of floorPlan?.annotations?.markers || []) {
    const note = [marker.placementNote, marker.sizeNote, marker.furnitureRequirement].filter(Boolean).join('; ');
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(9).text(`${marker.type}: ${marker.room}`, 42, y);
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(note || `x${Math.round(marker.x)} y${Math.round(marker.y)}`, 180, y, { width: 340 });
    y += 28;
    if (y > 760) {
      doc.addPage();
      y = 120;
    }
  }
}

function addMoodboards(doc, project) {
  for (const board of project.designPackage.moodboards) {
    doc.addPage();
    sectionTitle(doc, `${board.roomLabel} Reference Direction`, board.rationale);
    const imageAssets = board.assets.slice(0, 2);
    let x = 42;
    for (const asset of imageAssets) {
      const local = path.join(rootDir, asset.url.replace(/^\//, ''));
      if (fs.existsSync(local) && !local.toLowerCase().endsWith('.svg')) {
        doc.image(local, x, 148, { width: 240, height: 170 });
      } else {
        doc.roundedRect(x, 148, 240, 170, 10).fill('#e7e0d2');
        doc.fillColor('#7a4c2a').font('Helvetica-Bold').fontSize(13).text(asset.title || 'Generated concept render', x + 18, 205, { width: 204, align: 'center' });
        doc.fillColor('#55594f').font('Helvetica').fontSize(8).text('Stored visual asset indexed in the reusable library', x + 24, 252, { width: 192, align: 'center' });
      }
      x += 266;
    }
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Brief rationale / visual prompt', 42, 350);
    doc.font('Helvetica').fontSize(9).fillColor('#55594f').text(board.prompt, 42, 370, { width: 500, lineGap: 3 });
    const roomMarkers = layoutMarkersForRoom(project, board.room);
    if (roomMarkers.length) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Placement notes', 42, 490);
      doc.font('Helvetica').fontSize(8).fillColor('#55594f').text(roomMarkers.join('\n'), 42, 510, { width: 500, lineGap: 2 });
    }
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Swatches', 42, roomMarkers.length ? 600 : 510);
    board.swatches.forEach((swatch, index) => {
      const y = (roomMarkers.length ? 625 : 535) + index * 36;
      doc.rect(42, y, 24, 24).fill(swatch.hex || '#c6b7a0');
      doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(9).text(swatch.label, 76, y + 2);
      doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(swatch.finish, 76, y + 15);
    });
  }
}

function addMaterials(doc, project) {
  doc.addPage();
  sectionTitle(doc, 'Laminate & Material Shortlist', project.designPackage.materialStrategy.core);
  project.designPackage.laminateMatches.slice(0, 10).forEach((item, index) => {
    const y = 150 + index * 58;
    doc.rect(42, y, 34, 34).fill(item.hex || '#c6b7a0');
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(10).text(`${item.brand} ${item.collection}`, 88, y);
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(`${item.finish} - ${item.bestFor.join(', ')}`, 88, y + 14, { width: 430 });
    doc.text(item.maintenance, 88, y + 27, { width: 430 });
  });
}

function layoutMarkersForRoom(project, room) {
  const markers = project.floorPlan?.annotations?.markers || [];
  return markers
    .filter((marker) => room === 'whole-home' || marker.room === room)
    .map((marker) => {
      const note = [marker.placementNote, marker.sizeNote, marker.furnitureRequirement].filter(Boolean).join('; ');
      return `${marker.type}: ${note || 'Marked on floor plan'}`;
    })
    .slice(0, 6);
}

function addChecks(doc, project) {
  doc.addPage();
  sectionTitle(doc, 'Vastu & Practical Checks', `Vastu score: ${project.designPackage.vastu.score}%`);
  let y = 150;
  [...project.designPackage.vastu.reports, ...project.designPackage.checks].forEach((item) => {
    doc.fillColor(item.status === 'warning' || item.status === 'review' ? '#9d5c20' : '#2f6f61').font('Helvetica-Bold').fontSize(10).text(item.title || item.room, 42, y);
    doc.fillColor('#55594f').font('Helvetica').fontSize(9).text(item.message, 42, y + 15, { width: 500 });
    y += 56;
  });
}

function addSignoff(doc, project) {
  doc.addPage();
  sectionTitle(doc, 'Brief Approval & Cutlist Handoff', 'This brief records the approved scope, material assumptions, floor-plan constraints, and practical design checks.');
  doc.fillColor('#55594f').font('Helvetica').fontSize(11).text('Next steps: site measurement, working drawings, final catalogue/code selection, and cutlist preparation can proceed from this approved brief.', 42, 150, { width: 500, lineGap: 4 });
  doc.moveTo(42, 650).lineTo(240, 650).stroke('#1d211d');
  doc.moveTo(330, 650).lineTo(540, 650).stroke('#1d211d');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1d211d').text('Spacious Venture Representative', 42, 662);
  doc.text(`${project.clientName} / Client`, 330, 662);
}

function sectionTitle(doc, title, subtitle) {
  doc.fillColor('#f7f2e8').rect(0, 0, 595, 112).fill();
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(20).text(title, 42, 48);
  doc.fillColor('#55594f').font('Helvetica').fontSize(10).text(subtitle || '', 42, 78, { width: 500 });
}

proposalsRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'PDF brief API error' });
});
