import { nanoid } from 'nanoid';
import fs from 'node:fs';
import PDFDocument from 'pdfkit';
import { getDb, rowToJson } from './database.js';
import { getProject, matchLaminates } from './design-engine.js';
import { roomLabels } from '../data/seed-data.js';

const DEFAULT_SETTINGS = {
  sheet: { lengthMm: 2440, widthMm: 1220, label: '8x4 ft sheet' },
  kerfMm: 3,
  trimMm: 10,
  boardThicknessMm: 18,
  backPanelThicknessMm: 6,
  wetZoneBoard: 'BWP plywood',
  dryZoneBoard: 'BWR/HDMR plywood',
  visibleEdgeBand: '2mm PVC edge band',
  internalEdgeBand: '0.8mm PVC edge band'
};

export function createOrRefreshCutlist(projectId) {
  const db = getDb();
  const project = getProject(projectId);
  if (!project) throw new Error('Project not found');

  const now = new Date().toISOString();
  const existing = getCutlistByProject(projectId);
  const cutlistId = existing?.id || nanoid(12);
  const laminates = matchLaminates(project);
  const modules = buildModules(project, laminates).map((module) => ({ ...module, cutlistProjectId: cutlistId }));
  const parts = modules
    .flatMap((module, moduleIndex) => generatePartsForModule(module, moduleIndex))
    .map((part) => ({ ...part, cutlistProjectId: cutlistId }));
  const totals = calculateTotals(parts);
  const payload = {
    id: cutlistId,
    projectId,
    clientName: project.clientName,
    sourceBriefId: project.designPackage?.id || null,
    status: project.designPackage ? 'cutlist-draft' : 'brief-pending',
    revision: existing?.revision ? existing.revision + 1 : 1,
    settings: DEFAULT_SETTINGS,
    moduleCount: modules.length,
    partCount: parts.length,
    totals,
    notes: buildCutlistNotes(project),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  const insertCutlist = db.prepare(`
    INSERT OR REPLACE INTO cutlist_projects (id, project_id, status, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertModule = db.prepare(`
    INSERT INTO cutlist_modules
    (id, cutlist_project_id, room, module_type, name, width_mm, height_mm, depth_mm, material, finish, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPart = db.prepare(`
    INSERT INTO cutlist_parts
    (id, cutlist_project_id, module_id, part_code, name, material, length_mm, width_mm, thickness_mm, quantity, edge_band, grain, notes, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM cutlist_parts WHERE cutlist_project_id = ?').run(cutlistId);
    db.prepare('DELETE FROM cutlist_modules WHERE cutlist_project_id = ?').run(cutlistId);
    insertCutlist.run(cutlistId, projectId, payload.status, JSON.stringify(payload), payload.createdAt, now);
    modules.forEach((module) => {
      insertModule.run(
        module.id,
        cutlistId,
        module.room,
        module.moduleType,
        module.name,
        module.widthMm,
        module.heightMm,
        module.depthMm,
        module.material,
        module.finish,
        JSON.stringify(module),
        now
      );
    });
    parts.forEach((part) => {
      insertPart.run(
        part.id,
        cutlistId,
        part.moduleId,
        part.partCode,
        part.name,
        part.material,
        part.lengthMm,
        part.widthMm,
        part.thicknessMm,
        part.quantity,
        part.edgeBand,
        part.grain,
        part.notes,
        JSON.stringify(part),
        now
      );
    });
  });
  tx();

  return getCutlist(cutlistId);
}

export function getCutlistByProject(projectId) {
  const db = getDb();
  const row = db.prepare('SELECT payload FROM cutlist_projects WHERE project_id = ? ORDER BY updated_at DESC LIMIT 1').get(projectId);
  if (!row) return null;
  return hydrateCutlist(rowToJson(row));
}

export function getCutlist(cutlistId) {
  const db = getDb();
  const row = db.prepare('SELECT payload FROM cutlist_projects WHERE id = ?').get(cutlistId);
  if (!row) return null;
  return hydrateCutlist(rowToJson(row));
}

export function updateCutlistModule(cutlistId, moduleId, input = {}) {
  const db = getDb();
  const cutlist = getCutlist(cutlistId);
  if (!cutlist) throw new Error('Cutlist not found');
  const current = cutlist.modules.find((module) => module.id === moduleId);
  if (!current) throw new Error('Cutlist module not found');

  const next = applyModulePatch(current, input);
  db.prepare(`
    UPDATE cutlist_modules
    SET room = ?, module_type = ?, name = ?, width_mm = ?, height_mm = ?, depth_mm = ?, material = ?, finish = ?, payload = ?
    WHERE id = ? AND cutlist_project_id = ?
  `).run(
    next.room,
    next.moduleType,
    next.name,
    next.widthMm,
    next.heightMm,
    next.depthMm,
    next.material,
    next.finish,
    JSON.stringify(next),
    moduleId,
    cutlistId
  );
  return regenerateCutlistParts(cutlistId);
}

export function addCutlistModule(cutlistId, input = {}) {
  const db = getDb();
  const cutlist = getCutlist(cutlistId);
  if (!cutlist) throw new Error('Cutlist not found');
  const now = new Date().toISOString();
  const module = createManualModule(cutlistId, input);
  db.prepare(`
    INSERT INTO cutlist_modules
    (id, cutlist_project_id, room, module_type, name, width_mm, height_mm, depth_mm, material, finish, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    module.id,
    cutlistId,
    module.room,
    module.moduleType,
    module.name,
    module.widthMm,
    module.heightMm,
    module.depthMm,
    module.material,
    module.finish,
    JSON.stringify(module),
    now
  );
  return regenerateCutlistParts(cutlistId);
}

export function deleteCutlistModule(cutlistId, moduleId) {
  const db = getDb();
  const cutlist = getCutlist(cutlistId);
  if (!cutlist) throw new Error('Cutlist not found');
  if (cutlist.modules.length <= 1) throw new Error('A cutlist must keep at least one module.');
  const found = cutlist.modules.some((module) => module.id === moduleId);
  if (!found) throw new Error('Cutlist module not found');
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM cutlist_parts WHERE cutlist_project_id = ? AND module_id = ?').run(cutlistId, moduleId);
    db.prepare('DELETE FROM cutlist_modules WHERE cutlist_project_id = ? AND id = ?').run(cutlistId, moduleId);
  });
  tx();
  return regenerateCutlistParts(cutlistId);
}

export function regenerateCutlistParts(cutlistId) {
  const db = getDb();
  const row = db.prepare('SELECT payload FROM cutlist_projects WHERE id = ?').get(cutlistId);
  if (!row) throw new Error('Cutlist not found');
  const cutlist = rowToJson(row);
  const now = new Date().toISOString();
  const modules = db
    .prepare('SELECT payload FROM cutlist_modules WHERE cutlist_project_id = ? ORDER BY created_at, name')
    .all(cutlistId)
    .map(rowToJson)
    .map((module) => ({ ...module, cutlistProjectId: cutlistId }));
  if (!modules.length) throw new Error('No modules available for part generation.');

  const parts = modules
    .flatMap((module, moduleIndex) => generatePartsForModule(module, moduleIndex))
    .map((part) => ({ ...part, cutlistProjectId: cutlistId }));
  const sheetLayout = buildSheetLayout(parts, modules);
  const totals = calculateTotals(parts, sheetLayout);
  const payload = {
    ...cutlist,
    moduleCount: modules.length,
    partCount: parts.length,
    totals,
    revision: (cutlist.revision || 1) + 1,
    updatedAt: now
  };

  const insertPart = db.prepare(`
    INSERT INTO cutlist_parts
    (id, cutlist_project_id, module_id, part_code, name, material, length_mm, width_mm, thickness_mm, quantity, edge_band, grain, notes, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM cutlist_parts WHERE cutlist_project_id = ?').run(cutlistId);
    db.prepare('UPDATE cutlist_projects SET payload = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(payload), now, cutlistId);
    parts.forEach((part) => {
      insertPart.run(
        part.id,
        cutlistId,
        part.moduleId,
        part.partCode,
        part.name,
        part.material,
        part.lengthMm,
        part.widthMm,
        part.thicknessMm,
        part.quantity,
        part.edgeBand,
        part.grain,
        part.notes,
        JSON.stringify(part),
        now
      );
    });
  });
  tx();
  return getCutlist(cutlistId);
}

export function buildSheetLayout(cutlistOrParts, moduleInput = []) {
  const parts = Array.isArray(cutlistOrParts) ? cutlistOrParts : cutlistOrParts?.parts || [];
  const modules = Array.isArray(cutlistOrParts) ? moduleInput : cutlistOrParts?.modules || [];
  const moduleMap = new Map(modules.map((module) => [module.id, module]));
  const sheet = DEFAULT_SETTINGS.sheet;
  const usableLength = sheet.lengthMm - DEFAULT_SETTINGS.trimMm * 2;
  const usableWidth = sheet.widthMm - DEFAULT_SETTINGS.trimMm * 2;
  const sheetAreaSqM = (sheet.lengthMm * sheet.widthMm) / 1_000_000;
  const pieces = [];

  parts.forEach((partItem) => {
    for (let index = 0; index < partItem.quantity; index += 1) {
      pieces.push({
        id: `${partItem.id}-${index + 1}`,
        partId: partItem.id,
        partCode: partItem.partCode,
        name: partItem.name,
        moduleId: partItem.moduleId,
        moduleName: moduleMap.get(partItem.moduleId)?.name || '',
        material: partItem.material,
        lengthMm: partItem.lengthMm,
        widthMm: partItem.widthMm,
        grain: partItem.grain
      });
    }
  });

  pieces.sort((a, b) => Math.max(b.lengthMm, b.widthMm) - Math.max(a.lengthMm, a.widthMm));
  const sheets = [];
  const unplaced = [];
  let current = createSheet(1);
  let x = DEFAULT_SETTINGS.trimMm;
  let y = DEFAULT_SETTINGS.trimMm;
  let rowHeight = 0;

  for (const piece of pieces) {
    const fit = fitPieceToSheet(piece, usableLength, usableWidth);
    if (!fit) {
      unplaced.push({ ...piece, reason: 'Oversize for 8x4 ft sheet; split panel or special sheet required.' });
      continue;
    }

    if (x + fit.packW > sheet.lengthMm - DEFAULT_SETTINGS.trimMm) {
      x = DEFAULT_SETTINGS.trimMm;
      y += rowHeight + DEFAULT_SETTINGS.kerfMm;
      rowHeight = 0;
    }
    if (y + fit.packH > sheet.widthMm - DEFAULT_SETTINGS.trimMm) {
      finalizeSheet(current, sheetAreaSqM);
      sheets.push(current);
      current = createSheet(sheets.length + 1);
      x = DEFAULT_SETTINGS.trimMm;
      y = DEFAULT_SETTINGS.trimMm;
      rowHeight = 0;
    }

    current.pieces.push({
      ...piece,
      x,
      y,
      w: fit.w,
      h: fit.h,
      rotated: fit.rotated
    });
    current.usedAreaSqM += (piece.lengthMm * piece.widthMm) / 1_000_000;
    x += fit.packW + DEFAULT_SETTINGS.kerfMm;
    rowHeight = Math.max(rowHeight, fit.packH);
  }

  if (current.pieces.length || sheets.length === 0) {
    finalizeSheet(current, sheetAreaSqM);
    sheets.push(current);
  }

  return {
    settings: DEFAULT_SETTINGS,
    sheets,
    unplaced,
    note: 'Sheet layout is a workshop planning preview. Final nesting, grain alignment, and CNC files require production verification.'
  };
}

export function cutlistToCsv(cutlist) {
  const header = [
    'Project',
    'Cutlist ID',
    'Module',
    'Room',
    'Part Code',
    'Part Name',
    'Material',
    'Length MM',
    'Width MM',
    'Thickness MM',
    'Qty',
    'Edge Band',
    'Grain',
    'Notes'
  ];
  const rows = cutlist.parts.map((part) => {
    const module = cutlist.modules.find((item) => item.id === part.moduleId);
    return [
      cutlist.clientName,
      cutlist.id,
      module?.name || '',
      roomLabels[module?.room] || module?.room || '',
      part.partCode,
      part.name,
      part.material,
      part.lengthMm,
      part.widthMm,
      part.thicknessMm,
      part.quantity,
      part.edgeBand,
      part.grain,
      part.notes
    ];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export function writeCutlistPdf(cutlist, outPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outPath.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
    const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
    const stream = fs.createWriteStream(outPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    addCutlistCover(doc, cutlist);
    addModuleSchedule(doc, cutlist);
    addPartSchedule(doc, cutlist);
    addSheetPlanning(doc, cutlist);
    addCutlistSignoff(doc, cutlist);

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#7a7d74').text(`Spacious Venture - Cutlist Project ${cutlist.id} - Page ${i + 1}`, 42, 815, { align: 'center' });
    }
    doc.end();
  });
}

function hydrateCutlist(cutlist) {
  const db = getDb();
  const moduleRows = db.prepare('SELECT payload FROM cutlist_modules WHERE cutlist_project_id = ? ORDER BY created_at, name').all(cutlist.id);
  const partRows = db.prepare('SELECT payload FROM cutlist_parts WHERE cutlist_project_id = ? ORDER BY part_code').all(cutlist.id);
  const modules = moduleRows.map(rowToJson);
  const parts = partRows.map(rowToJson);
  const sheetLayout = buildSheetLayout(parts, modules);
  return {
    ...cutlist,
    modules,
    parts,
    totals: {
      ...(cutlist.totals || {}),
      sheetCount: sheetLayout.sheets.length,
      sheetWastePercent: sheetLayout.sheets.length
        ? Number((sheetLayout.sheets.reduce((sum, item) => sum + item.wastePercent, 0) / sheetLayout.sheets.length).toFixed(1))
        : 0,
      unplacedPieces: sheetLayout.unplaced.length
    },
    sheetLayout
  };
}

function applyModulePatch(module, input) {
  const textFields = ['name', 'room', 'moduleType', 'material', 'finish', 'hardware', 'placementNote', 'furnitureRequirement', 'sizeNote'];
  const next = { ...module };
  textFields.forEach((field) => {
    if (typeof input[field] === 'string') next[field] = input[field].trim();
  });
  ['widthMm', 'heightMm', 'depthMm'].forEach((field) => {
    if (input[field] !== undefined) next[field] = boundedDimension(input[field], module[field]);
  });
  next.moduleType = slug(next.moduleType || next.name || 'custom-storage');
  next.room = next.room || module.room || 'custom';
  next.roomLabel = roomLabels[next.room] || next.room;
  next.name = next.name || module.name || 'Custom Module';
  next.material = next.material || module.material || `${DEFAULT_SETTINGS.dryZoneBoard} ${DEFAULT_SETTINGS.boardThicknessMm}mm`;
  next.finish = next.finish || module.finish || 'Durable matte laminate';
  next.updatedAt = new Date().toISOString();
  return next;
}

function createManualModule(cutlistProjectId, input) {
  const room = input.room || 'custom';
  const moduleType = slug(input.moduleType || input.name || 'custom-storage');
  const material = input.material || `${DEFAULT_SETTINGS.dryZoneBoard} ${DEFAULT_SETTINGS.boardThicknessMm}mm`;
  return applyModulePatch({
    id: nanoid(12),
    cutlistProjectId,
    room,
    roomLabel: roomLabels[room] || room,
    moduleType,
    name: input.name || 'Custom Storage Module',
    widthMm: 1200,
    heightMm: 1800,
    depthMm: 450,
    material,
    finish: input.finish || 'Durable matte laminate',
    hardware: input.hardware || 'Standard soft-close hinges/channels.',
    placementNote: input.placementNote || 'Manual module added during cutlist review.',
    furnitureRequirement: input.furnitureRequirement || '',
    sizeNote: input.sizeNote || '',
    createdFrom: 'manual-cutlist-module-v1',
    createdAt: new Date().toISOString()
  }, input);
}

function buildModules(project, laminates) {
  const selectedSpaces = Array.isArray(project.selectedSpaces) ? project.selectedSpaces : [];
  const markers = project.floorPlan?.annotations?.markers || [];
  const modules = [];
  selectedSpaces.forEach((space) => {
    modules.push(...modulesForSpace(space, project, laminates, markers));
  });
  for (const marker of markers) {
    if (!marker.type || marker.type === 'Door' || marker.type === 'Window') continue;
    const exists = modules.some((module) => module.sourceMarkerId === marker.id || module.moduleType === slug(marker.type));
    if (!exists && marker.type !== 'Custom') {
      modules.push(createModule({
        room: marker.room || 'custom',
        moduleType: slug(marker.type),
        name: marker.type,
        dimensions: dimensionsForType(marker.type),
        project,
        laminates,
        marker
      }));
    }
  }
  return modules;
}

function modulesForSpace(space, project, laminates, markers) {
  const roomMarkers = markers.filter((marker) => marker.room === space);
  const getMarker = (type) => roomMarkers.find((marker) => marker.type === type);
  if (space === 'living') {
    return [createModule({ room: space, moduleType: 'tv-unit', name: 'Living TV Unit', dimensions: { widthMm: 2400, heightMm: 2100, depthMm: 450 }, project, laminates, marker: getMarker('TV Unit') })];
  }
  if (space === 'kitchen') {
    return [
      createModule({ room: space, moduleType: 'kitchen-base', name: 'Kitchen Base Units', dimensions: { widthMm: 3000, heightMm: 710, depthMm: 560 }, project, laminates, marker: getMarker('Kitchen Run') }),
      createModule({ room: space, moduleType: 'kitchen-wall', name: 'Kitchen Wall Units', dimensions: { widthMm: 2200, heightMm: 720, depthMm: 350 }, project, laminates, marker: getMarker('Kitchen Run') })
    ];
  }
  if (['master', 'kids', 'guest'].includes(space)) {
    const widthMm = space === 'kids' ? 1500 : 1800;
    return [createModule({ room: space, moduleType: 'wardrobe', name: `${roomLabels[space] || space} Wardrobe`, dimensions: { widthMm, heightMm: 2100, depthMm: 600 }, project, laminates, marker: getMarker('Wardrobe') })];
  }
  if (space === 'pooja') {
    return [createModule({ room: space, moduleType: 'mandir', name: 'Mandir / Pooja Unit', dimensions: { widthMm: 900, heightMm: 1800, depthMm: 420 }, project, laminates, marker: getMarker('Mandir') })];
  }
  if (space === 'foyer') {
    return [createModule({ room: space, moduleType: 'foyer-storage', name: 'Foyer Shoe Storage', dimensions: { widthMm: 1200, heightMm: 1050, depthMm: 380 }, project, laminates, marker: getMarker('Shoe Rack') })];
  }
  if (space === 'study') {
    return [createModule({ room: space, moduleType: 'study-desk', name: 'Study Desk + Overhead', dimensions: { widthMm: 1600, heightMm: 1800, depthMm: 550 }, project, laminates, marker: getMarker('Study Desk') })];
  }
  if (space === 'dining') {
    return [createModule({ room: space, moduleType: 'crockery', name: 'Dining Crockery Unit', dimensions: { widthMm: 1500, heightMm: 2100, depthMm: 420 }, project, laminates, marker: getMarker('Dining') })];
  }
  if (space === 'utility') {
    return [createModule({ room: space, moduleType: 'utility-storage', name: 'Utility Storage', dimensions: { widthMm: 1200, heightMm: 1800, depthMm: 450 }, project, laminates, marker: getMarker('Custom') })];
  }
  return [createModule({ room: space, moduleType: 'custom-storage', name: `${roomLabels[space] || space} Storage`, dimensions: { widthMm: 1200, heightMm: 1800, depthMm: 450 }, project, laminates, marker: roomMarkers[0] })];
}

function createModule({ room, moduleType, name, dimensions, project, laminates, marker }) {
  const parsed = parseDimensions(marker?.sizeNote) || {};
  const selectedLaminate = laminateForModule(moduleType, laminates);
  const isWet = moduleType.includes('kitchen') || room === 'utility';
  return {
    id: nanoid(12),
    room,
    roomLabel: roomLabels[room] || room,
    moduleType,
    name,
    widthMm: parsed.widthMm || dimensions.widthMm,
    heightMm: parsed.heightMm || dimensions.heightMm,
    depthMm: parsed.depthMm || dimensions.depthMm,
    material: isWet ? `${DEFAULT_SETTINGS.wetZoneBoard} ${DEFAULT_SETTINGS.boardThicknessMm}mm` : `${DEFAULT_SETTINGS.dryZoneBoard} ${DEFAULT_SETTINGS.boardThicknessMm}mm`,
    finish: selectedLaminate ? `${selectedLaminate.brand} ${selectedLaminate.collection} - ${selectedLaminate.finish}` : finishFallback(project),
    hardware: hardwareForBudget(project.budgetTier),
    sourceMarkerId: marker?.id || '',
    placementNote: marker?.placementNote || project.floorPlanNotes || '',
    furnitureRequirement: marker?.furnitureRequirement || '',
    sizeNote: marker?.sizeNote || '',
    createdFrom: 'approved-brief-v1'
  };
}

function generatePartsForModule(module, moduleIndex) {
  const prefix = `${String(moduleIndex + 1).padStart(2, '0')}-${module.moduleType.toUpperCase().slice(0, 4)}`;
  const w = module.widthMm;
  const h = module.heightMm;
  const d = module.depthMm;
  const t = DEFAULT_SETTINGS.boardThicknessMm;
  const backT = DEFAULT_SETTINGS.backPanelThicknessMm;
  const shelfCount = module.moduleType.includes('wardrobe') ? 3 : module.moduleType.includes('kitchen') ? 1 : 2;
  const shutterCount = module.moduleType.includes('kitchen-base') ? 4 : module.moduleType.includes('tv-unit') ? 3 : 2;
  const parts = [
    part(module, prefix, '01', 'Left side panel', h, d, t, 1, 'front long edge', 'vertical'),
    part(module, prefix, '02', 'Right side panel', h, d, t, 1, 'front long edge', 'vertical'),
    part(module, prefix, '03', 'Top panel', w, d, t, 1, 'front long edge', 'horizontal'),
    part(module, prefix, '04', 'Bottom panel', w, d, t, 1, 'front long edge', 'horizontal'),
    part(module, prefix, '05', 'Back panel', w, h, backT, 1, 'none', 'vertical')
  ];
  for (let i = 0; i < shelfCount; i += 1) {
    parts.push(part(module, prefix, String(6 + i).padStart(2, '0'), `Adjustable shelf ${i + 1}`, Math.max(w - 36, 300), Math.max(d - 30, 250), t, 1, 'front edge', 'horizontal'));
  }
  parts.push(part(module, prefix, '20', 'Shutter / drawer fascia', Math.round(w / shutterCount), h > 1200 ? Math.min(h - 120, 2100) : Math.max(h - 80, 450), t, shutterCount, 'all visible edges', 'vertical', module.finish));
  if (module.moduleType.includes('kitchen')) {
    parts.push(part(module, prefix, '30', 'Plinth / skirting strip', w, 100, t, 1, 'top edge', 'horizontal'));
  }
  if (module.moduleType === 'tv-unit') {
    parts.push(part(module, prefix, '31', 'Cable service panel', Math.min(w, 1800), 220, t, 1, 'all visible edges', 'horizontal'));
  }
  return parts;
}

function createSheet(sheetNo) {
  return {
    sheetNo,
    label: `${DEFAULT_SETTINGS.sheet.label} - Sheet ${sheetNo}`,
    lengthMm: DEFAULT_SETTINGS.sheet.lengthMm,
    widthMm: DEFAULT_SETTINGS.sheet.widthMm,
    usedAreaSqM: 0,
    wastePercent: 100,
    pieces: []
  };
}

function finalizeSheet(sheet, sheetAreaSqM) {
  sheet.usedAreaSqM = Number(sheet.usedAreaSqM.toFixed(2));
  sheet.wastePercent = Number(Math.max(0, 100 - (sheet.usedAreaSqM / sheetAreaSqM) * 100).toFixed(1));
}

function fitPieceToSheet(piece, usableLength, usableWidth) {
  const kerf = DEFAULT_SETTINGS.kerfMm;
  const direct = {
    w: piece.lengthMm,
    h: piece.widthMm,
    packW: piece.lengthMm + kerf,
    packH: piece.widthMm + kerf,
    rotated: false
  };
  if (direct.packW <= usableLength && direct.packH <= usableWidth) return direct;
  const rotated = {
    w: piece.widthMm,
    h: piece.lengthMm,
    packW: piece.widthMm + kerf,
    packH: piece.lengthMm + kerf,
    rotated: true
  };
  if (rotated.packW <= usableLength && rotated.packH <= usableWidth) return rotated;
  return null;
}

function part(module, prefix, suffix, name, lengthMm, widthMm, thicknessMm, quantity, edgeBand, grain, materialOverride) {
  return {
    id: nanoid(12),
    moduleId: module.id,
    partCode: `${prefix}-${suffix}`,
    name,
    material: materialOverride || module.material,
    lengthMm,
    widthMm,
    thicknessMm,
    quantity,
    edgeBand,
    grain,
    notes: module.placementNote || module.furnitureRequirement || 'Generated from PDF brief V1 defaults.'
  };
}

function calculateTotals(parts, sheetLayout) {
  const boardAreaSqM = parts.reduce((sum, item) => sum + ((item.lengthMm * item.widthMm * item.quantity) / 1_000_000), 0);
  const sheetAreaSqM = (DEFAULT_SETTINGS.sheet.lengthMm * DEFAULT_SETTINGS.sheet.widthMm) / 1_000_000;
  const edgeBandM = parts.reduce((sum, item) => {
    if (item.edgeBand === 'none') return sum;
    return sum + (((item.lengthMm + item.widthMm) * 2 * item.quantity) / 1000);
  }, 0);
  return {
    partRows: parts.length,
    partQuantity: parts.reduce((sum, item) => sum + item.quantity, 0),
    boardAreaSqM: Number(boardAreaSqM.toFixed(2)),
    estimatedSheets: Math.max(1, Math.ceil(boardAreaSqM / sheetAreaSqM)),
    estimatedEdgeBandM: Number(edgeBandM.toFixed(1)),
    sheetCount: sheetLayout?.sheets?.length || Math.max(1, Math.ceil(boardAreaSqM / sheetAreaSqM)),
    sheetWastePercent: sheetLayout?.sheets?.length
      ? Number((sheetLayout.sheets.reduce((sum, item) => sum + item.wastePercent, 0) / sheetLayout.sheets.length).toFixed(1))
      : 0,
    unplacedPieces: sheetLayout?.unplaced?.length || 0
  };
}

function boundedDimension(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(6000, Math.max(100, Math.round(parsed)));
}

function addCutlistCover(doc, cutlist) {
  doc.rect(0, 0, 595, 842).fill('#f7f2e8');
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(26).text('Spacious Venture', 42, 58);
  doc.fillColor('#b88a2f').fontSize(12).text('CUTLIST PROJECT / WORKSHOP HANDOFF', 42, 94);
  doc.fillColor('#1d211d').fontSize(28).text(`${cutlist.clientName || 'Client'} Cutlist`, 42, 158, { width: 500 });
  doc.font('Helvetica').fontSize(11).fillColor('#55594f').text('Production planning draft generated from the approved onboarding PDF brief. Final measurements, working drawings, grain direction, and factory nesting must be checked before cutting.', 42, 228, { width: 490, lineGap: 4 });

  const totals = cutlist.totals || {};
  const stats = [
    ['Revision', cutlist.revision || 1],
    ['Modules', cutlist.modules?.length || 0],
    ['Part rows', cutlist.parts?.length || 0],
    ['Total parts', totals.partQuantity || 0],
    ['Board area', `${totals.boardAreaSqM || 0} sqm`],
    ['Sheet plan', `${totals.sheetCount || totals.estimatedSheets || 0} sheets`],
    ['Edge band', `${totals.estimatedEdgeBandM || 0} m`],
    ['Unplaced pieces', totals.unplacedPieces || 0]
  ];
  let y = 330;
  stats.forEach(([label, value], index) => {
    const x = 42 + (index % 4) * 128;
    if (index % 4 === 0 && index > 0) y += 82;
    doc.roundedRect(x, y, 110, 58, 8).fill('#ffffff');
    doc.fillColor('#7a7d74').font('Helvetica').fontSize(8).text(label, x + 12, y + 12);
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(16).text(String(value), x + 12, y + 28, { width: 86 });
  });

  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(12).text('Production notes', 42, 560);
  doc.fillColor('#55594f').font('Helvetica').fontSize(9).text((cutlist.notes || []).join('\n'), 42, 584, { width: 490, lineGap: 4 });
}

function addModuleSchedule(doc, cutlist) {
  doc.addPage();
  cutlistSectionTitle(doc, 'Module Schedule', 'Editable modules, dimensions, material assumptions, and placement notes.');
  let y = 136;
  (cutlist.modules || []).forEach((module, index) => {
    if (y > 730) {
      doc.addPage();
      cutlistSectionTitle(doc, 'Module Schedule Continued', 'Remaining modules in this cutlist project.');
      y = 136;
    }
    doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f7f2e8').roundedRect(42, y, 510, 72, 7).fill();
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(10).text(module.name, 56, y + 10, { width: 170 });
    doc.fillColor('#7a7d74').font('Helvetica').fontSize(8).text(`${module.roomLabel || roomLabels[module.room] || module.room} - ${module.moduleType}`, 56, y + 26, { width: 170 });
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(9).text(`${module.widthMm} x ${module.heightMm} x ${module.depthMm} mm`, 244, y + 10, { width: 120 });
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(module.material, 244, y + 27, { width: 130 });
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(9).text(module.finish, 382, y + 10, { width: 130 });
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(module.placementNote || module.furnitureRequirement || 'Confirm at site.', 382, y + 27, { width: 130, lineGap: 2 });
    y += 84;
  });
}

function addPartSchedule(doc, cutlist) {
  doc.addPage();
  cutlistSectionTitle(doc, 'Part List', 'First rows for review. Export CSV for the full workshop table.');
  let y = 132;
  drawPartHeader(doc, y);
  y += 24;
  (cutlist.parts || []).slice(0, 42).forEach((partItem, index) => {
    if (y > 760) {
      doc.addPage();
      cutlistSectionTitle(doc, 'Part List Continued', 'Additional generated parts.');
      y = 132;
      drawPartHeader(doc, y);
      y += 24;
    }
    doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f7f2e8').rect(42, y - 4, 510, 27).fill();
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(8).text(partItem.partCode, 48, y, { width: 78 });
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(partItem.name, 128, y, { width: 122 });
    doc.text(`${partItem.lengthMm} x ${partItem.widthMm} x ${partItem.thicknessMm}`, 252, y, { width: 98 });
    doc.text(String(partItem.quantity), 356, y, { width: 26 });
    doc.text(partItem.edgeBand, 390, y, { width: 72 });
    doc.text(partItem.grain, 470, y, { width: 68 });
    y += 27;
  });
}

function drawPartHeader(doc, y) {
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(8);
  doc.text('Code', 48, y, { width: 78 });
  doc.text('Part', 128, y, { width: 122 });
  doc.text('L x W x T', 252, y, { width: 98 });
  doc.text('Qty', 356, y, { width: 26 });
  doc.text('Edge', 390, y, { width: 72 });
  doc.text('Grain', 470, y, { width: 68 });
}

function addSheetPlanning(doc, cutlist) {
  doc.addPage();
  cutlistSectionTitle(doc, 'Sheet Layout Preview', cutlist.sheetLayout?.note || 'Workshop planning preview for 8x4 ft sheets.');
  const layout = cutlist.sheetLayout || buildSheetLayout(cutlist);
  let rowY = 134;
  let column = 0;
  layout.sheets.slice(0, 6).forEach((sheet) => {
    if (rowY > 620) {
      doc.addPage();
      cutlistSectionTitle(doc, 'Sheet Layout Preview Continued', 'Additional 8x4 ft sheets.');
      rowY = 134;
      column = 0;
    }
    const x = column === 0 ? 42 : 310;
    drawSheetPreview(doc, sheet, x, rowY, 232, 116);
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(9).text(`Sheet ${sheet.sheetNo}`, x, rowY + 124);
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(`${sheet.usedAreaSqM} sqm used - ${sheet.wastePercent}% waste - ${sheet.pieces.length} pieces`, x, rowY + 138, { width: 230 });
    if (column === 1) {
      rowY += 224;
      column = 0;
    } else {
      column = 1;
    }
  });
  if (layout.unplaced?.length) {
    const noteY = Math.min(700, rowY + 12);
    doc.fillColor('#9d5c20').font('Helvetica-Bold').fontSize(10).text('Oversize / manual review pieces', 42, noteY);
    doc.fillColor('#55594f').font('Helvetica').fontSize(8).text(layout.unplaced.slice(0, 8).map((piece) => `${piece.partCode}: ${piece.lengthMm} x ${piece.widthMm} mm`).join('\n'), 42, noteY + 18, { width: 500, lineGap: 2 });
  }
}

function drawSheetPreview(doc, sheet, x, y, width, height) {
  doc.roundedRect(x, y, width, height, 6).stroke('#b88a2f');
  const scaleX = width / sheet.lengthMm;
  const scaleY = height / sheet.widthMm;
  const colors = ['#c49a52', '#8d6f4d', '#6d7755', '#b9a58a', '#d8c7a7', '#9b6b43'];
  sheet.pieces.slice(0, 48).forEach((piece, index) => {
    const px = x + piece.x * scaleX;
    const py = y + piece.y * scaleY;
    const pw = Math.max(3, piece.w * scaleX);
    const ph = Math.max(3, piece.h * scaleY);
    doc.rect(px, py, pw, ph).fillAndStroke(colors[index % colors.length], '#f7f2e8');
  });
}

function addCutlistSignoff(doc, cutlist) {
  doc.addPage();
  cutlistSectionTitle(doc, 'Workshop Verification', 'Sign off only after site measurement, material codes, and production drawings are confirmed.');
  doc.fillColor('#55594f').font('Helvetica').fontSize(11).text('This cutlist project is intended to align the client brief, designer notes, and workshop assumptions. It should not replace detailed shop drawings or final factory nesting.', 42, 150, { width: 500, lineGap: 4 });
  doc.moveTo(42, 650).lineTo(240, 650).stroke('#1d211d');
  doc.moveTo(330, 650).lineTo(540, 650).stroke('#1d211d');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1d211d').text('Designer / Project Owner', 42, 662);
  doc.text('Workshop / Production Lead', 330, 662);
  doc.font('Helvetica').fontSize(9).fillColor('#55594f').text(`Cutlist ID: ${cutlist.id} - Revision ${cutlist.revision || 1}`, 42, 706);
}

function cutlistSectionTitle(doc, title, subtitle) {
  doc.fillColor('#f7f2e8').rect(0, 0, 595, 112).fill();
  doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(20).text(title, 42, 48);
  doc.fillColor('#55594f').font('Helvetica').fontSize(10).text(subtitle || '', 42, 78, { width: 500 });
}

function parseDimensions(value = '') {
  const match = String(value).match(/(\d{3,4})\s*(?:x|\*)\s*(\d{3,4})(?:\s*(?:x|\*)\s*(\d{2,4}))?/i);
  if (!match) return null;
  return {
    widthMm: Number(match[1]),
    heightMm: Number(match[2]),
    depthMm: match[3] ? Number(match[3]) : undefined
  };
}

function laminateForModule(moduleType, laminates) {
  if (!laminates.length) return null;
  if (moduleType.includes('kitchen')) return laminates.find((item) => item.bestFor?.includes('kitchen')) || laminates[0];
  if (moduleType.includes('wardrobe')) return laminates.find((item) => item.bestFor?.includes('wardrobe')) || laminates[0];
  if (moduleType.includes('tv')) return laminates.find((item) => item.bestFor?.includes('tv-unit')) || laminates[0];
  return laminates[0];
}

function buildCutlistNotes(project) {
  return [
    project.floorPlanNotes ? `Floor plan: ${project.floorPlanNotes}` : 'Floor plan: confirm dimensions before production.',
    project.storageHabits ? `Storage: ${project.storageHabits}` : '',
    project.cookingStyle === 'heavy-indian' ? 'Kitchen: use wet-zone board, high-cleanability finishes, and chimney/service clearances.' : '',
    project.familyProfile?.includes('Kids') ? 'Family: prefer rounded exposed edges and durable/washable high-touch finishes.' : '',
    'V1 cutlist is a production handoff draft. Final site measurements and working drawings must be checked before cutting.'
  ].filter(Boolean);
}

function dimensionsForType(type) {
  const map = {
    'TV Unit': { widthMm: 2400, heightMm: 2100, depthMm: 450 },
    Sofa: { widthMm: 2100, heightMm: 900, depthMm: 900 },
    Bed: { widthMm: 1900, heightMm: 1050, depthMm: 2100 },
    Wardrobe: { widthMm: 1800, heightMm: 2100, depthMm: 600 },
    'Kitchen Run': { widthMm: 3000, heightMm: 710, depthMm: 560 },
    Island: { widthMm: 1800, heightMm: 900, depthMm: 900 },
    Dining: { widthMm: 1500, heightMm: 2100, depthMm: 420 },
    Mandir: { widthMm: 900, heightMm: 1800, depthMm: 420 },
    'Study Desk': { widthMm: 1600, heightMm: 1800, depthMm: 550 },
    'Shoe Rack': { widthMm: 1200, heightMm: 1050, depthMm: 380 }
  };
  return map[type] || { widthMm: 1200, heightMm: 1800, depthMm: 450 };
}

function hardwareForBudget(budgetTier) {
  if (budgetTier === 'luxury') return 'Premium soft-close hinges/channels, profile handles, sensor lighting where applicable.';
  if (budgetTier === 'premium') return 'Soft-close hinges/channels, profile or edge pulls for visible modules.';
  return 'Standard soft-close hinges, heavy-use runners, practical handle selection.';
}

function finishFallback(project) {
  if (project.budgetTier === 'luxury') return 'Veneer/acrylic accent with premium laminate carcass finish.';
  if (project.budgetTier === 'premium') return 'Matte laminate with selective acrylic/fluted accent.';
  return 'Durable matte laminate.';
}

function slug(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
