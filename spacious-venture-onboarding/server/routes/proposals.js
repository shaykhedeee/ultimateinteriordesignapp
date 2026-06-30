import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { getProject } from '../services/design-engine.js';
import { rootDir, storageDir } from '../services/database.js';
import { getApprovedRenderAssets } from '../services/visualizer-engine.js';
import { getLatestFloorPlanAnalysis } from '../services/floor-plan-analysis-service.js';
import { getTechnicalDrawings } from '../services/technical-drawing-service.js';
import { roomLabels } from '../data/seed-data.js';

export const proposalsRouter = express.Router();

const defaultStudioSettings = {
  brandName: 'Spacious Venture',
  brandLine: 'Studio OS',
  leadDesigner: 'Ananya S.',
  leadRole: 'Lead Designer',
  proposalFooter: 'This PDF brief records client requirements, floor-plan constraints, material assumptions, and approval scope before production handoff.',
  handoverNote: 'Final working drawings and production cutlists require client approval, site measurement, and designer verification.'
};

proposalsRouter.post('/:projectId/pdf', async (req, res, next) => {
  try {
    const project = getProject(req.params.projectId);
    if (!project?.designPackage) return res.status(404).json({ error: 'Generate a PDF brief package before exporting PDF.' });
    const studioSettings = { ...defaultStudioSettings, ...(req.body?.studioSettings || {}) };
    const fileName = `${project.id}-brief.pdf`;
    const outPath = path.join(storageDir, 'proposals', fileName);
    await writeProposalPdf(project, outPath, studioSettings);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(outPath).pipe(res);
  } catch (err) {
    next(err);
  }
});

function writeProposalPdf(project, outPath, studioSettings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
    const stream = fs.createWriteStream(outPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    addCover(doc, project, studioSettings);
    addIntakeSummary(doc, project);
    addClientVision(doc, project);
    addFloorPlan(doc, project);
    addTechnicalDrawings(doc, project);
    addApprovedRenders(doc, project);
    addMoodboards(doc, project);
    addMaterials(doc, project);
    addChecks(doc, project);
    addSignoff(doc, project, studioSettings);

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#7a7d74').text(`${studioSettings.brandName} ${studioSettings.brandLine} - PDF Brief - Page ${i + 1}`, 42, 815, { align: 'center' });
    }
    doc.end();
  });
}

function addApprovedRenders(doc, project) {
  const approved = getApprovedRenderAssets(project.id);
  if (!approved.length) return;

  for (let start = 0; start < approved.length; start += 4) {
    doc.addPage();
    pageBackdrop(doc);
    sectionTitle(
      doc,
      start === 0 ? 'Approved Client Render Selections' : 'Approved Render Selections',
      'Only designer-approved images are included here. These visuals guide the brief and remain subject to final measurements, working drawings, and material-code confirmation.'
    );
    const pageItems = approved.slice(start, start + 4);
    pageItems.forEach((asset, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 42 + column * 266;
      const y = 138 + row * 310;
      const local = path.join(rootDir, asset.url.replace(/^\//, ''));
      addProposalImage(doc, local, {
        x,
        y,
        width: 240,
        height: 190,
        fallbackTitle: asset.title
      });
      doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(10).text(`${asset.room} - ${asset.title}`, x, y + 202, { width: 240 });
      doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(asset.reviewNote || 'Approved for client brief.', x, y + 218, { width: 240, lineGap: 2 });
    });
  }
}

function addCover(doc, project, studioSettings) {
  const pkg = project.designPackage;
  pageBackdrop(doc, '#f7f2e8');
  doc.roundedRect(42, 48, 500, 32, 16).fill('#1d211d');
  doc.fillColor('#f3d58b').font('Helvetica-Bold').fontSize(9).text('SPACIOUS VENTURE FIRST MEETING PACKAGE', 62, 59, { characterSpacing: 0.8 });
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(26).text(studioSettings.brandName, 42, 104);
  doc.fillColor('#b88a2f').fontSize(12).text('FIRST DESIGN BRIEF / CLIENT VISION PACKAGE', 42, 138);
  doc.moveDown(4);
  doc.fillColor('#1d211d').fontSize(28).text(pkg.title, 42, 184, { width: 500 });
  doc.font('Helvetica').fontSize(12).fillColor('#55594f').text(pkg.summary, 42, 272, { width: 490, lineGap: 4 });
  doc.roundedRect(42, 338, 500, 82, 10).fill('#efe3cf');
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(12).text('Purpose of this brief', 60, 358);
  doc.font('Helvetica').fontSize(9).fillColor('#55594f').text(
    'This first-meeting package helps the client envision the home before production drawings begin. It translates their answers, floor-plan constraints, references, and budget into room-wise visual direction, material logic, and next approval steps.',
    60,
    378,
    { width: 460, lineGap: 3 }
  );
  doc.moveDown(2);
  doc.font('Helvetica-Bold').fillColor('#1d211d').text('Client profile', 42, 455);
  doc.font('Helvetica').fillColor('#55594f').text(`Client: ${project.clientName}`);
  doc.text(`City: ${project.city}`);
  doc.text(`Home: ${project.homeType.toUpperCase()} - Budget: ${project.budgetTier}`);
  doc.text(`Style: ${project.primaryStyle}`);
  doc.text(`Spaces: ${project.selectedSpaces.join(', ')}`);
  doc.moveDown(1.5);
  doc.font('Helvetica-Bold').fillColor('#1d211d').text('Studio owner');
  doc.font('Helvetica').fillColor('#55594f').text(`${studioSettings.leadDesigner} / ${studioSettings.leadRole}`);
  doc.moveDown(1.5);
  doc.font('Helvetica').fontSize(9).fillColor('#7a7d74').text(studioSettings.proposalFooter, { width: 490, lineGap: 3 });
}

function addIntakeSummary(doc, project) {
  doc.addPage();
  pageBackdrop(doc);
  sectionTitle(doc, 'Client Intake Summary', 'The answers we used to shape the design direction, renders, materials, and approval package.');
  const brief = project.designPackage;
  const left = 42;
  const right = 310;
  const top = 140;
  const rows = [
    ['Client', project.clientName],
    ['Project code', `SV-${project.id.slice(0, 8).toUpperCase()}`],
    ['City', project.city || 'Not set'],
    ['Home type', String(project.homeType || '').toUpperCase()],
    ['Budget', project.budgetTier],
    ['Style', project.primaryStyle],
    ['Timeline', project.timeline || 'Not set'],
    ['Spaces', (project.selectedSpaces || []).join(', ') || 'Not set'],
    ['Pooja need', project.poojaNeed || 'none'],
    ['Cooking style', project.cookingStyle || 'Not set']
  ];

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Project overview', left, top);
  let y = top + 22;
  rows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#7a4c2a').text(label, left, y, { width: 90 });
    doc.font('Helvetica').fontSize(9).fillColor('#55594f').text(value || '-', left + 98, y, { width: 210, lineGap: 2 });
    y += 22;
  });

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Layout and material direction', right, top);
  doc.font('Helvetica').fontSize(9).fillColor('#55594f').text(project.floorPlanNotes || 'No extra layout note entered.', right, top + 22, { width: 220, lineGap: 3 });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1d211d').text('Finish tolerance');
  doc.font('Helvetica').fontSize(8).fillColor('#55594f').text((project.finishTolerance || []).join(', ') || 'Not set', { width: 220, lineGap: 2 });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1d211d').text('Disliked materials');
  doc.font('Helvetica').fontSize(8).fillColor('#55594f').text(project.dislikedMaterials || 'None specified', { width: 220, lineGap: 2 });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1d211d').text('Family / lifestyle');
  doc.font('Helvetica').fontSize(8).fillColor('#55594f').text((project.familyProfile || []).join(', ') || 'Not set', { width: 220, lineGap: 2 });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1d211d').text('Designer rationale');
  doc.font('Helvetica').fontSize(8).fillColor('#55594f').text(buildClosingRationale(project, brief), { width: 220, lineGap: 2 });

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Brief deliverables', left, 330);
  const deliverables = [
    'Room-by-room moodboards',
    'Approved render selections',
    'Floor-plan legend and notes',
    'Material and laminate shortlist',
    'Basic technical drawings',
    'Working drawing handoff note',
    'Cutlist readiness checkpoint'
  ];
  let dy = 352;
  deliverables.forEach((item) => {
    doc.circle(left + 3, dy + 4, 2).fill('#b88a2f');
    doc.fillColor('#55594f').font('Helvetica').fontSize(8.5).text(item, left + 10, dy, { width: 220 });
    dy += 18;
  });

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Approval guardrails', right, 330);
  const guardrails = [
    'Measured dimensions remain advisory until calibration or site measurement.',
    'Rendered visuals are concept-level and not CAD substitutes.',
    'Production cutlists require approved brief, verified dimensions, and final module review.'
  ];
  let gy = 352;
  guardrails.forEach((item) => {
    doc.rect(right, gy + 2, 4, 4).fill('#b88a2f');
    doc.fillColor('#55594f').font('Helvetica').fontSize(8.2).text(item, right + 10, gy, { width: 220, lineGap: 2 });
    gy += 26;
  });
}

function addClientVision(doc, project) {
  const pkg = project.designPackage;
  doc.addPage();
  pageBackdrop(doc);
  sectionTitle(doc, 'Client Vision & Design Logic', 'What the client asked for, what Spacious Venture understood, and why this direction was chosen.');

  const columns = [
    {
      title: 'What the client wanted',
      items: clientWanted(project)
    },
    {
      title: 'Design response',
      items: designResponse(project)
    },
    {
      title: 'Why this should close well',
      items: closingReasons(project, pkg)
    }
  ];

  columns.forEach((column, index) => {
    const x = 42 + index * 174;
    doc.roundedRect(x, 145, 154, 255, 10).fill(index === 1 ? '#efe3cf' : '#f7f2e8').stroke('#d4c5a9');
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(10).text(column.title, x + 12, 162, { width: 130 });
    let y = 194;
    column.items.slice(0, 6).forEach((item) => {
      doc.circle(x + 15, y + 4, 2).fill('#b88a2f');
      doc.fillColor('#55594f').font('Helvetica').fontSize(7.4).text(item, x + 24, y, { width: 116, lineGap: 2 });
      y += 34;
    });
  });

  doc.roundedRect(42, 430, 500, 130, 10).fill('#1d211d');
  doc.fillColor('#f7f2e8').font('Helvetica-Bold').fontSize(13).text('Whole-home story', 62, 452);
  doc.font('Helvetica').fontSize(9).fillColor('#ded2bc').text(
    pkg?.wholeHomeConcept || pkg?.summary || buildClosingRationale(project, pkg),
    62,
    475,
    { width: 460, lineGap: 3 }
  );

  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(11).text('Room promise', 42, 600);
  let y = 624;
  (project.selectedSpaces || []).slice(0, 7).forEach((space) => {
    const markers = (project.floorPlan?.annotations?.markers || []).filter((marker) => marker.room === space);
    const requirement = markers.map((marker) => [marker.type, marker.furnitureRequirement || marker.placementNote].filter(Boolean).join(': ')).filter(Boolean).slice(0, 2).join('; ');
    doc.fillColor('#7a4c2a').font('Helvetica-Bold').fontSize(8).text(roomLabels[space] || space, 42, y, { width: 120 });
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(
      requirement || roomPromise(space, project),
      165,
      y,
      { width: 370, lineGap: 2 }
    );
    y += 26;
  });
}

function addFloorPlan(doc, project) {
  const floorPlan = project.floorPlan;
  if (!floorPlan && !project.floorPlanNotes) return;
  doc.addPage();
  pageBackdrop(doc);
  sectionTitle(doc, 'Floor Plan & Layout Constraints', 'The annotated floor plan is used to control room scope, placement notes, render prompts, and future production handoff.');
  const local = floorPlan?.previewPath ? path.join(rootDir, floorPlan.previewPath.replace(/^\//, '')) : '';
  addProposalImage(doc, local, {
    x: 42,
    y: 140,
    width: 250,
    height: 180,
    fallbackTitle: floorPlan?.previewPath ? 'Floor plan attached' : 'No floor plan image'
  });
  doc.fillColor('#7a7d74').font('Helvetica').fontSize(7.5).text(
    floorPlan?.analysis?.calibration?.knownLengthMm
      ? `Scale note: approximate measurements use a ${floorPlan.analysis.calibration.knownLengthMm}mm calibration and must be verified on site.`
      : 'Scale note: no known wall length was calibrated, so dimensions are descriptive only.',
    42,
    328,
    { width: 250, lineGap: 2 }
  );
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(11).text('Designer layout notes', 320, 142);
  doc.fillColor('#55594f').font('Helvetica').fontSize(9).text(project.floorPlanNotes || 'No additional layout notes.', 320, 162, { width: 220, lineGap: 3 });
  const analysis = getLatestFloorPlanAnalysis(project.id);
  if (analysis) {
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(11).text('AI floor-plan understanding', 320, 250);
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(`${analysis.confidence}% confidence. ${analysis.whatAiUnderstood}`, 320, 270, { width: 220, lineGap: 2 });
    if (analysis.advisoryVision?.summary) {
      doc.fillColor('#7a7d74').font('Helvetica').fontSize(7).text(`Vision advisory: ${analysis.advisoryVision.summary}`, 320, 344, { width: 220, lineGap: 2 });
    }
    if (analysis.nextDesignerActions?.length) {
      doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(9).text('Next designer checks', 320, 392);
      doc.fillColor('#55594f').font('Helvetica').fontSize(7.4).text(analysis.nextDesignerActions.slice(0, 4).join('\n'), 320, 410, { width: 220, lineGap: 2 });
    }
  }
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

function addTechnicalDrawings(doc, project) {
  const drawings = getTechnicalDrawings(project.id).slice(0, 8);
  if (!drawings.length) return;
  doc.addPage();
  pageBackdrop(doc);
  sectionTitle(doc, 'Basic Technical Drawing Preview', 'Conceptual block drawings from marked floor-plan components. Final working drawings start only after approval and site verification.');
  let y = 140;
  drawings.forEach((drawing) => {
    if (y > 710) {
      doc.addPage();
      sectionTitle(doc, 'Basic Technical Drawing Preview Continued', 'Additional proposal-level diagrams.');
      y = 140;
    }
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(11).text(drawing.title, 42, y);
    doc.fillColor('#7a7d74').font('Helvetica').fontSize(8).text(drawing.disclaimer || 'Concept only.', 42, y + 16, { width: 500 });
    if (drawing.type === 'room-block-plan') {
      drawRoomBlocks(doc, drawing, 42, y + 42, 220, 130);
      doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(`Scale mode: ${drawing.scaleMode}. ${drawing.notes || ''}`, 286, y + 44, { width: 250, lineGap: 2 });
    } else {
      drawElevationBlocks(doc, drawing, 42, y + 42, 220, 130);
      doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(`${drawing.roomLabel || drawing.room}. ${drawing.widthMm || '-'} x ${drawing.heightMm || '-'} x ${drawing.depthMm || '-'} mm. ${drawing.notes || ''}`, 286, y + 44, { width: 250, lineGap: 2 });
    }
    y += 182;
  });
}

function drawRoomBlocks(doc, drawing, x, y, width, height) {
  doc.rect(x, y, width, height).stroke('#d4c5a9');
  (drawing.blocks || []).forEach((block, index) => {
    const bx = x + (block.x / 100) * width;
    const by = y + (block.y / 100) * height;
    const bw = Math.max(18, (block.w / 100) * width);
    const bh = Math.max(18, (block.h / 100) * height);
    doc.rect(bx, by, bw, bh).fillAndStroke(index % 2 ? '#efe3cf' : '#d7c09a', '#b88a2f');
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(6).text(block.label, bx + 3, by + 4, { width: bw - 6 });
  });
  (drawing.markers || []).slice(0, 12).forEach((marker) => {
    doc.circle(x + (marker.x / 100) * width, y + (marker.y / 100) * height, 3).fill('#1d211d');
  });
}

function drawElevationBlocks(doc, drawing, x, y, width, height) {
  doc.rect(x, y, width, height).stroke('#d4c5a9');
  (drawing.modules || []).forEach((module, index) => {
    const bx = x + (module.x / 100) * width;
    const by = y + (module.y / 100) * height;
    const bw = Math.max(14, (module.w / 100) * width);
    const bh = Math.max(14, (module.h / 100) * height);
    doc.rect(bx, by, bw, bh).fillAndStroke(index % 2 ? '#f7f2e8' : '#d7c09a', '#b88a2f');
    doc.fillColor('#1d211d').font('Helvetica').fontSize(6).text(module.label, bx + 3, by + 4, { width: bw - 6 });
  });
}

function addMoodboards(doc, project) {
  for (const board of project.designPackage.moodboards) {
    doc.addPage();
    pageBackdrop(doc);
    sectionTitle(doc, `${board.roomLabel} Concept Direction`, 'Reference image plus fresh render logic: what the client wanted, what we chose, and why it suits the space.');
    const imageAssets = board.assets.slice(0, 2);
    let x = 42;
    for (const [index, asset] of imageAssets.entries()) {
      const local = path.join(rootDir, asset.url.replace(/^\//, ''));
      addProposalImage(doc, local, {
        x,
        y: 148,
        width: 240,
        height: 170,
        fallbackTitle: asset.title || 'Generated concept render',
        fallbackDetail: 'Stored visual asset indexed in the reusable library'
      });
      doc.roundedRect(x + 10, 158, index === 0 ? 82 : 92, 20, 10).fill(index === 0 ? '#1d211d' : '#b88a2f');
      doc.fillColor(index === 0 ? '#f7f2e8' : '#1d211d').font('Helvetica-Bold').fontSize(7.5).text(
        index === 0 ? 'REFERENCE' : 'FRESH AI RENDER',
        x + 20,
        164,
        { width: index === 0 ? 65 : 74, align: 'center' }
      );
      x += 266;
    }
    doc.roundedRect(42, 340, 500, 118, 10).fill('#fffaf0').stroke('#d4c5a9');
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#7a4c2a').text('Client wanted', 60, 360);
    doc.font('Helvetica').fontSize(8).fillColor('#55594f').text(roomClientWant(project, board.room), 60, 378, { width: 135, lineGap: 2 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#7a4c2a').text('We chose', 220, 360);
    doc.font('Helvetica').fontSize(8).fillColor('#55594f').text(board.rationale || roomPromise(board.room, project), 220, 378, { width: 135, lineGap: 2 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#7a4c2a').text('Why it works', 380, 360);
    doc.font('Helvetica').fontSize(8).fillColor('#55594f').text(roomWhyItWorks(project, board.room), 380, 378, { width: 130, lineGap: 2 });

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Visual prompt used for AI/reference matching', 42, 480);
    doc.font('Helvetica').fontSize(8).fillColor('#55594f').text(board.prompt, 42, 500, { width: 500, lineGap: 2 });
    const roomMarkers = layoutMarkersForRoom(project, board.room);
    if (roomMarkers.length) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Placement notes from floor plan', 42, 610);
      doc.font('Helvetica').fontSize(8).fillColor('#55594f').text(roomMarkers.join('\n'), 42, 630, { width: 500, lineGap: 2 });
    }
    const swatchTop = roomMarkers.length ? 705 : 610;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1d211d').text('Selected tactile swatches', 42, swatchTop);
    board.swatches.slice(0, 4).forEach((swatch, index) => {
      const sx = 42 + index * 124;
      drawMaterialSwatch(doc, sx, swatchTop + 22, 106, 46, {
        ...swatch,
        texture: swatch.finish,
        colorFamily: swatch.label
      });
    });
  }
}

function addMaterials(doc, project) {
  doc.addPage();
  pageBackdrop(doc);
  sectionTitle(doc, 'Laminate & Material Shortlist', 'A selective palette that helps the client understand the look, feel, maintenance logic, and budget fit.');
  doc.roundedRect(42, 132, 500, 76, 10).fill('#1d211d');
  doc.fillColor('#f7f2e8').font('Helvetica-Bold').fontSize(11).text('Material strategy', 60, 152);
  doc.font('Helvetica').fontSize(8.5).fillColor('#ded2bc').text(project.designPackage.materialStrategy.core, 60, 172, { width: 460, lineGap: 3 });

  project.designPackage.laminateMatches.slice(0, 12).forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 42 + column * 258;
    const y = 236 + row * 86;
    doc.roundedRect(x, y, 240, 70, 8).fill('#fffaf0').stroke('#d4c5a9');
    drawMaterialSwatch(doc, x + 10, y + 12, 36, 38, item, { compact: true });
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(8.8).text(`${item.brand} ${item.collection}`, x + 52, y + 12, { width: 170 });
    doc.fillColor('#7a4c2a').font('Helvetica-Bold').fontSize(7).text(`${item.finish} / ${item.budgetTier}`, x + 52, y + 26, { width: 170 });
    doc.fillColor('#55594f').font('Helvetica').fontSize(6.9).text(`Use: ${item.bestFor.join(', ')}`, x + 52, y + 39, { width: 170 });
    doc.fillColor('#55594f').font('Helvetica').fontSize(6.6).text(item.maintenance, x + 12, y + 51, { width: 210, lineGap: 1 });
  });

  doc.fillColor('#7a7d74').font('Helvetica').fontSize(7.5).text(
    'Exact brand shade/code must be finalized after physical laminate catalogue review, lighting check, and client approval.',
    42,
    760,
    { width: 500, align: 'center' }
  );
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

function clientWanted(project) {
  const spaces = (project.selectedSpaces || []).map((space) => roomLabels[space] || space).slice(0, 5).join(', ');
  return [
    `${project.budgetTier || 'premium'} budget direction with a strong first visual impression.`,
    `${project.primaryStyle || 'Indian contemporary'} styling that feels personal, not like a generic showroom.`,
    spaces ? `Clear room scope: ${spaces}.` : 'Room scope to be finalized during design review.',
    project.floorPlanNotes ? `Layout note: ${project.floorPlanNotes}` : 'Floor-plan-driven placement once zones and markers are confirmed.',
    project.cookingStyle ? `Kitchen behavior: ${String(project.cookingStyle).replace(/-/g, ' ')}.` : 'Kitchen habits to be confirmed.',
    project.dislikedMaterials ? `Avoid: ${project.dislikedMaterials}.` : 'Avoid over-styled, cluttered, or hard-to-maintain finishes.'
  ];
}

function designResponse(project) {
  const finishes = (project.finishTolerance || []).join(', ') || 'balanced matte, wood, and easy-clean finishes';
  return [
    `Use ${styleLabel(project.primaryStyle)} as the whole-home base language.`,
    `Shortlist laminates around ${finishes}.`,
    'Give each important room one reference direction and one fresh AI render path.',
    'Use manual floor-plan markers as the source of truth for furniture and module placement.',
    'Keep luxury selective: focal wall, lighting, trims, and tactile surfaces rather than every surface being expensive.',
    'Hold production cutlist until approval and verified dimensions.'
  ];
}

function closingReasons(project, pkg) {
  return [
    'The client can visualize the home room by room before detailed drawings begin.',
    'Budget, maintenance, and style choices are explained in plain language.',
    'Floor-plan understanding reduces fear that renders are random inspiration images.',
    'Material options feel curated and selective, which supports faster decision-making.',
    pkg?.summary || 'The whole-home story ties lifestyle, room function, and visual direction together.',
    'The next step is clear: approve the brief, verify site dimensions, then move to working drawings and cutlist.'
  ];
}

function roomClientWant(project, room) {
  const markers = (project.floorPlan?.annotations?.markers || []).filter((marker) => room === 'whole-home' || marker.room === room);
  const markerNotes = markers
    .map((marker) => [marker.type, marker.furnitureRequirement || marker.placementNote || marker.sizeNote].filter(Boolean).join(': '))
    .filter(Boolean);
  if (markerNotes.length) return markerNotes.slice(0, 3).join('; ');
  if (room === 'kitchen') return `${String(project.cookingStyle || 'Indian cooking').replace(/-/g, ' ')} workflow, storage, easy-clean shutters, and practical counter planning.`;
  if (room === 'pooja') return `${project.poojaNeed || 'Pooja'} requirement with warmth, lighting, and storage.`;
  if (room === 'living') return 'A strong TV wall, seating comfort, clutter control, and an impressive first reveal.';
  return roomPromise(room, project);
}

function roomWhyItWorks(project, room) {
  const budget = project.budgetTier || 'premium';
  const style = styleLabel(project.primaryStyle);
  if (room === 'kitchen') return `Matches ${budget} budget while prioritizing maintenance, Indian cooking durability, and controlled premium accents.`;
  if (room === 'living') return `Creates the strongest client-facing reveal while keeping storage, TV viewing, and circulation readable.`;
  if (room === 'master') return `Balances calm private-room styling with wardrobe practicality and a premium material moment.`;
  if (room === 'kids') return `Uses durable, wipeable, softer finishes so the room can age better with family use.`;
  if (room === 'pooja') return `Creates emotional value through light, brass/wood warmth, and a clear sacred focal point.`;
  return `Keeps the ${style} language consistent while solving the room's practical use case.`;
}

function roomPromise(room, project) {
  const style = styleLabel(project.primaryStyle);
  const map = {
    living: `A ${style} living room with a clear TV focal wall, comfortable seating, and warm premium lighting.`,
    kitchen: 'A practical modular kitchen with easy-clean laminates, organized storage, and Indian cooking readiness.',
    master: 'A calm master suite with wardrobe clarity, warm textures, and a comfortable premium mood.',
    kids: 'A durable kids room with storage, study function, and softer color choices.',
    pooja: 'A warm mandir moment with jali/brass/light details and practical storage below.',
    foyer: 'A useful entry zone with shoe storage, mirror, console surface, and a tidy arrival experience.',
    dining: 'A dining and crockery zone that supports display, storage, and warm hosting.',
    study: 'A focused work nook with desk ergonomics, overhead storage, and calmer surfaces.'
  };
  return map[room] || `A functional ${style} space with client-specific storage, lighting, and material logic.`;
}

function buildClosingRationale(project, brief) {
  return [
    brief?.summary,
    `The proposal connects ${project.clientName || 'the client'}'s lifestyle, budget, selected rooms, floor-plan notes, and material tolerance into one visual direction.`,
    'The aim is to help the client imagine the home clearly enough to approve the design direction before production drawings and cutlists begin.'
  ].filter(Boolean).join(' ');
}

function styleLabel(value = '') {
  return String(value || 'Indian contemporary').replace(/-/g, ' ');
}

function addChecks(doc, project) {
  doc.addPage();
  pageBackdrop(doc);
  sectionTitle(doc, 'Vastu & Practical Checks', `Vastu score: ${project.designPackage.vastu.score}%`);
  let y = 150;
  [...project.designPackage.vastu.reports, ...project.designPackage.checks].forEach((item) => {
    doc.fillColor(item.status === 'warning' || item.status === 'review' ? '#9d5c20' : '#2f6f61').font('Helvetica-Bold').fontSize(10).text(item.title || item.room, 42, y);
    doc.fillColor('#55594f').font('Helvetica').fontSize(9).text(item.message, 42, y + 15, { width: 500 });
    y += 56;
  });
}

function addSignoff(doc, project, studioSettings) {
  doc.addPage();
  pageBackdrop(doc);
  sectionTitle(doc, 'Brief Approval & Cutlist Handoff', 'This brief records the approved scope, material assumptions, floor-plan constraints, and practical design checks.');
  doc.fillColor('#55594f').font('Helvetica').fontSize(11).text(studioSettings.handoverNote || 'Final working drawings and production cutlists require client approval, site measurement, and designer verification.', 42, 150, { width: 500, lineGap: 4 });
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fillColor('#1d211d').fontSize(10).text('Production disclaimer', 42, 205);
  doc.font('Helvetica').fillColor('#55594f').fontSize(9).text('Final working drawings and production cutlists require client approval, site measurement, and designer verification. AI renders and block drawings are proposal aids, not CAD-grade manufacturing documents.', 42, 222, { width: 500, lineGap: 3 });
  doc.moveTo(42, 650).lineTo(240, 650).stroke('#1d211d');
  doc.moveTo(330, 650).lineTo(540, 650).stroke('#1d211d');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1d211d').text(`${studioSettings.brandName} Representative`, 42, 662);
  doc.text(`${project.clientName} / Client`, 330, 662);
}

function sectionTitle(doc, title, subtitle) {
  doc.fillColor('#f7f2e8').rect(0, 0, 595, 112).fill();
  doc.rect(0, 108, 595, 4).fill('#b88a2f');
  doc.fillColor('#b88a2f').font('Helvetica-Bold').fontSize(7.5).text('SPACIOUS VENTURE / CLIENT CLOSING BRIEF', 42, 28, { characterSpacing: 1.1 });
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(20).text(title, 42, 48);
  doc.fillColor('#55594f').font('Helvetica').fontSize(10).text(subtitle || '', 42, 78, { width: 500 });
}

function pageBackdrop(doc, color = '#fffaf0') {
  doc.rect(0, 0, 595, 842).fill(color);
  doc.rect(18, 18, 559, 806).stroke('#eadcc5');
}

function drawMaterialSwatch(doc, x, y, width, height, item = {}, options = {}) {
  const hex = item.hex || '#c6b7a0';
  const texture = String(item.texture || item.finish || item.collection || item.label || '').toLowerCase();
  doc.roundedRect(x, y, width, height, 6).fill(hex).stroke('#d4c5a9');
  doc.save();
  doc.roundedRect(x, y, width, height, 6).clip();
  if (/wood|teak|walnut|oak|veneer|grain/.test(texture)) {
    for (let i = 0; i < width; i += 7) {
      doc.moveTo(x + i, y).bezierCurveTo(x + i + 8, y + height * 0.28, x + i - 5, y + height * 0.62, x + i + 6, y + height).lineWidth(0.8).strokeColor('#6f4b2d').strokeOpacity(0.45).stroke().strokeOpacity(1);
    }
  } else if (/marble|stone|quartz|granite/.test(texture)) {
    for (let i = -20; i < width; i += 18) {
      doc.moveTo(x + i, y + height).bezierCurveTo(x + i + 14, y + height * 0.62, x + i + 20, y + height * 0.35, x + i + 42, y).lineWidth(0.7).strokeColor('#776b5a').strokeOpacity(0.35).stroke().strokeOpacity(1);
    }
  } else if (/fluted|ribbed|linear|groove/.test(texture)) {
    for (let i = 0; i < width; i += 6) {
      doc.fillOpacity(0.18).rect(x + i, y, 2, height).fill('#281f16').fillOpacity(1);
    }
  } else if (/metal|brass|gold|champagne/.test(texture)) {
    for (let i = -height; i < width; i += 12) {
      doc.moveTo(x + i, y + height).lineTo(x + i + height, y).lineWidth(1).strokeColor('#fff4be').strokeOpacity(0.35).stroke().strokeOpacity(1);
    }
  } else {
    doc.fillOpacity(0.16).circle(x + width * 0.75, y + height * 0.25, Math.max(9, width * 0.18)).fill('#ffffff').fillOpacity(1);
  }
  doc.restore();
  if (!options.compact) {
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(7.5).text(item.label || item.collection || item.colorFamily || 'Material', x + 6, y + height + 4, { width: width - 12 });
    doc.fillColor('#55594f').font('Helvetica').fontSize(6.6).text(item.finish || item.texture || 'selected finish', x + 6, y + height + 15, { width: width - 12 });
  }
}

function addProposalImage(doc, localPath, options) {
  const {
    x,
    y,
    width,
    height,
    fallbackTitle = 'Visual preview unavailable',
    fallbackDetail = 'The source file remains attached to the project.'
  } = options;

  if (isPdfKitImage(localPath)) {
    try {
      doc.image(localPath, x, y, { width, height, fit: [width, height], align: 'center', valign: 'center' });
      return true;
    } catch (err) {
      console.warn(`Proposal image skipped (${path.basename(localPath)}): ${err.message}`);
    }
  }

  doc.roundedRect(x, y, width, height, 8).fill('#e7e0d2');
  doc.fillColor('#7a4c2a').font('Helvetica-Bold').fontSize(11).text(fallbackTitle, x + 16, y + height / 2 - 20, {
    width: width - 32,
    align: 'center'
  });
  doc.fillColor('#55594f').font('Helvetica').fontSize(7).text(fallbackDetail, x + 18, y + height / 2 + 14, {
    width: width - 36,
    align: 'center'
  });
  return false;
}

function isPdfKitImage(localPath) {
  if (!localPath || !fs.existsSync(localPath)) return false;
  try {
    const header = Buffer.alloc(8);
    const fd = fs.openSync(localPath, 'r');
    const bytesRead = fs.readSync(fd, header, 0, header.length, 0);
    fs.closeSync(fd);
    if (bytesRead < 4) return false;
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isPng = header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    return isJpeg || isPng;
  } catch {
    return false;
  }
}

proposalsRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'PDF brief API error' });
});
