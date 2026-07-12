import { nanoid } from 'nanoid';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import db from '../database/database.js';
import { getProject, matchLaminates } from './design-engine.js';
import { getProductionLearningSummary } from './production-import-service.js';
import { precisionPartsForModule } from './cutlist-standards-service.js';
import { 
  calculateBaseCabinet, 
  calculateWallCabinet, 
  calculateDrawerCabinet, 
  calculateWardrobe, 
  calculateBlindCornerBase, 
  calculateLCornerBase 
} from './cabinet-math.js';
import { nestPanels } from './nest-optimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getDb = () => db;
const storageDir = path.resolve(__dirname, '../../storage');

const rowToJson = (row) => {
  if (!row) return null;
  const copy = { ...row };
  if (copy.payload && typeof copy.payload === 'string') {
    try {
      return { ...JSON.parse(copy.payload), ...copy, payload: undefined };
    } catch (e) {}
  }
  return copy;
};

const roomLabels = (room) => {
  const labels = {
    living: 'Living Room',
    kitchen: 'Kitchen Space',
    masterBed: 'Master Bedroom',
    kidsBed: 'Kids Room',
    pooja: 'Pooja Mandir',
    foyer: 'Foyer Area'
  };
  return labels[room] || room;
};

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
  const elevationModules = getElevationCabinets(project.id);
  const modules = buildModules(project, laminates, elevationModules).map((module) => ({ ...module, cutlistProjectId: cutlistId }));
  const parts = modules
    .flatMap((module, moduleIndex) => generatePartsForModule(module, moduleIndex))
    .flatMap(splitOversizePart)
    .map((part) => ({ ...part, cutlistProjectId: cutlistId }));
  const productionLearning = getProductionLearningSummary({
    rooms: project.selectedSpaces || [],
    moduleTypes: modules.map((module) => module.moduleType)
  });
  const sheetLayout = buildSheetLayout(parts, modules);
  const rawSources = rawSourcesForCutlist(cutlistId);
  const accuracyAudit = buildCutlistAccuracyAudit({ cutlist: { id: cutlistId, projectId }, project, modules, parts, sheetLayout, rawSources });
  const totals = calculateTotals(parts, sheetLayout);
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
    productionGrade: accuracyAudit.productionGrade,
    accuracyAudit,
    productionLearning,
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
    (id, cutlist_project_id, module_id, part_code, name, material, length_mm, width_mm, thickness_mm, quantity, edge_band, edge_l1, edge_l2, edge_w1, edge_w2, grain, formula_length, formula_width, notes, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  runInTransaction(() => {
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
        part.edge_l1 || null,
        part.edge_l2 || null,
        part.edge_w1 || null,
        part.edge_w2 || null,
        part.grain,
        part.formula_length || null,
        part.formula_width || null,
        part.notes,
        JSON.stringify(part),
        now
      );
    });
  });

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
  runInTransaction(() => {
    db.prepare('DELETE FROM cutlist_parts WHERE cutlist_project_id = ? AND module_id = ?').run(cutlistId, moduleId);
    db.prepare('DELETE FROM cutlist_modules WHERE cutlist_project_id = ? AND id = ?').run(cutlistId, moduleId);
  });
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
    .flatMap(splitOversizePart)
    .map((part) => ({ ...part, cutlistProjectId: cutlistId }));
  const sheetLayout = buildSheetLayout(parts, modules);
  const rawSources = rawSourcesForCutlist(cutlistId);
  const project = cutlist.projectId ? getProject(cutlist.projectId) : null;
  const accuracyAudit = buildCutlistAccuracyAudit({ cutlist, project, modules, parts, sheetLayout, rawSources });
  const totals = calculateTotals(parts, sheetLayout);
  const payload = {
    ...cutlist,
    moduleCount: modules.length,
    partCount: parts.length,
    totals,
    productionGrade: accuracyAudit.productionGrade,
    accuracyAudit,
    revision: (cutlist.revision || 1) + 1,
    updatedAt: now
  };

  const insertPart = db.prepare(`
    INSERT INTO cutlist_parts
    (id, cutlist_project_id, module_id, part_code, name, material, length_mm, width_mm, thickness_mm, quantity, edge_band, edge_l1, edge_l2, edge_w1, edge_w2, grain, formula_length, formula_width, notes, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  runInTransaction(() => {
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
        part.edge_l1 || null,
        part.edge_l2 || null,
        part.edge_w1 || null,
        part.edge_w2 || null,
        part.grain,
        part.formula_length || null,
        part.formula_width || null,
        part.notes,
        JSON.stringify(part),
        now
      );
    });
  });
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

  pieces.sort((a, b) => (b.lengthMm * b.widthMm) - (a.lengthMm * a.widthMm));
  const sheets = [];
  const unplaced = [];

  for (const piece of pieces) {
    const fit = fitPieceToSheet(piece, usableLength, usableWidth);
    if (!fit) {
      unplaced.push({ ...piece, reason: 'Oversize for 8x4 ft sheet; split panel or special sheet required.' });
      continue;
    }
    let placed = false;
    for (const openSheet of sheets) {
      if (placePieceMaxRects(openSheet, piece)) {
        placed = true;
        break;
      }
    }
    if (!placed) {
      const next = createSheet(sheets.length + 1);
      if (placePieceMaxRects(next, piece)) {
        sheets.push(next);
      } else {
        unplaced.push({ ...piece, reason: 'Could not place after kerf/trim constraints.' });
      }
    }
  }

  if (!sheets.length) sheets.push(createSheet(1));
  sheets.forEach((item) => finalizeSheet(item, sheetAreaSqM));

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

export const MAXCUT_CSV_HEADERS = [
  'Type',
  'Name',
  'Length',
  'Width',
  'Quantity',
  'Notes',
  'Can Rotate (https://feature-panel-rotation.maxcutsoftware.com)',
  'Material',
  'Edging Length 1',
  'Edging Length 2',
  'Edging Width 1',
  'Edging Width 2',
  'Include Edging Thickness',
  'Note 1',
  'Note 2',
  'Note 3',
  'Note 4',
  'Group',
  'Report Tags',
  'Import ID',
  'Parent ID',
  'Library Item Name',
  'Holes Length 1',
  'Holes Length 2',
  'Holes Width 1',
  'Holes Width 2',
  'Grooving Length 1',
  'Grooving Length 2',
  'Grooving Width 1',
  'Grooving Width 2',
  'Material Tag',
  'Edging Length 1 Tag',
  'Edging Length 2 Tag',
  'Edging Width 1 Tag',
  'Edging Width 2 Tag',
  'Apply Machining Charge',
  'Long Expansion',
  'Short Expansion',
  'Include in Optimization'
];

export function cutlistToMaxCutRows(cutlist) {
  return cutlist.parts.map((part, index) => {
    const module = cutlist.modules.find((item) => item.id === part.moduleId) || {};
    const edge = normalizeEdgeBand(part.edgeBand);
    const visibleEdge = edge.visible || part.edge_l1 || part.edge_l2 || '';
    const internalEdge = edge.internal || part.edge_w1 || part.edge_w2 || visibleEdge;
    const group = [roomLabels[module.room] || module.room, module.moduleType].filter(Boolean).join(' / ');
    const materialTag = materialTagFor(part.material, part.thicknessMm);
    const row = {
      'Apply Machining Charge': '',
      'Can Rotate (https://feature-panel-rotation.maxcutsoftware.com)': canRotateFor(part),
      'Edging Length 1': part.edge_l1 || visibleEdge,
      'Edging Length 1 Tag': edgeTag(part.edge_l1 || visibleEdge),
      'Edging Length 2': part.edge_l2 || visibleEdge,
      'Edging Length 2 Tag': edgeTag(part.edge_l2 || visibleEdge),
      'Edging Width 1': part.edge_w1 || internalEdge,
      'Edging Width 1 Tag': edgeTag(part.edge_w1 || internalEdge),
      'Edging Width 2': part.edge_w2 || internalEdge,
      'Edging Width 2 Tag': edgeTag(part.edge_w2 || internalEdge),
      'Grooving Length 1': '',
      'Grooving Length 2': '',
      'Grooving Width 1': '',
      'Grooving Width 2': '',
      Group: group,
      'Holes Length 1': '',
      'Holes Length 2': '',
      'Holes Width 1': '',
      'Holes Width 2': '',
      'Import ID': `${cutlist.id}-${index + 1}`,
      'Include Edging Thickness': 'TRUE',
      'Include in Optimization': 'TRUE',
      Length: part.lengthMm,
      'Library Item Name': module.name || '',
      'Long Expansion': 0,
      Material: part.material,
      'Material Tag': materialTag,
      Name: maxCutPartName(module, part),
      'Note 1': roomLabels[module.room] || module.room || '',
      'Note 2': module.name || '',
      'Note 3': part.partCode || '',
      'Note 4': part.grain || '',
      Notes: [part.notes, module.placementNote, module.furnitureRequirement].filter(Boolean).join(' | '),
      'Parent ID': module.id || '',
      Quantity: part.quantity,
      'Report Tags': [cutlist.clientName, module.moduleType, part.partCode].filter(Boolean).join(';'),
      'Short Expansion': 0,
      Type: module.moduleType || 'panel',
      Width: part.widthMm
    };
    return MAXCUT_CSV_HEADERS.map((header) => row[header] ?? '');
  });
}

export function cutlistToMaxCutCsv(cutlist) {
  return [MAXCUT_CSV_HEADERS, ...cutlistToMaxCutRows(cutlist)]
    .map((row) => row.map(csvCell).join(','))
    .join('\n');
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

export function writeJobLayoutPdf(cutlist, outPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outPath.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
    const doc = new PDFDocument({ size: 'A4', margin: 28, bufferPages: true });
    const stream = fs.createWriteStream(outPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    const materialLayouts = buildMaterialSheetLayouts(cutlist);
    const flatSheets = materialLayouts.flatMap((group) => group.sheets.map((sheet) => ({ ...sheet, material: group.material, materialSheets: group.sheets.length })));
    const jobStats = summarizeJobLayout(flatSheets, cutlist);
    flatSheets.forEach((sheet, index) => addJobLayoutPage(doc, cutlist, sheet, index + 1, flatSheets.length, jobStats));
    if (!flatSheets.length) addJobLayoutPage(doc, cutlist, createSheet(1), 1, 1, jobStats);

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
  const rawSources = rawSourcesForCutlist(cutlist.id);
  const project = cutlist.projectId ? getProject(cutlist.projectId) : null;
  const accuracyAudit = buildCutlistAccuracyAudit({ cutlist, project, modules, parts, sheetLayout, rawSources });
  return {
    ...cutlist,
    modules,
    parts,
    rawSources,
    productionGrade: accuracyAudit.productionGrade,
    accuracyAudit,
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

export function rawSourcesForCutlist(cutlistId) {
  const dir = path.join(storageDir, 'cutlists', 'raw-sources', cutlistId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const absolute = path.join(dir, entry.name);
      const stat = fs.statSync(absolute);
      return {
        id: `${cutlistId}-${entry.name}`,
        fileName: entry.name,
        originalName: entry.name.replace(/^\d+-/, ''),
        extension: path.extname(entry.name).toLowerCase(),
        sizeBytes: stat.size,
        uploadedAt: stat.mtime.toISOString(),
        url: `/storage/cutlists/raw-sources/${cutlistId}/${encodeURIComponent(entry.name)}`
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function buildCutlistAccuracyAudit({ cutlist = {}, project = null, modules = [], parts = [], sheetLayout = {}, rawSources = [] }) {
  const blockingIssues = [];
  const warnings = [];
  const strengths = [];
  let score = 100;

  const hasApprovedBrief = hasApprovedBriefForProject(cutlist.projectId || project?.id);
  if (hasApprovedBrief) strengths.push('PDF brief approval is recorded.');
  else {
    blockingIssues.push('Approve the PDF brief before factory cutting.');
    score -= 18;
  }

  if (!modules.length) {
    blockingIssues.push('No modules are available for cutlist generation.');
    score -= 24;
  } else {
    strengths.push(`${modules.length} modules are available.`);
  }

  const invalidModules = modules.filter((module) => !isValidDimension(module.widthMm) || !isValidDimension(module.heightMm) || !isValidDimension(module.depthMm));
  if (invalidModules.length) {
    blockingIssues.push(`${invalidModules.length} modules need verified width, height, and depth in mm.`);
    score -= Math.min(24, invalidModules.length * 6);
  } else if (modules.length) {
    strengths.push('All modules have positive width, height, and depth values.');
  }

  const defaultSizedModules = modules.filter((module) => module.createdFrom === 'approved-brief-v1' && !module.sourceMarkerId && !String(module.sizeNote || '').match(/\d/));
  if (defaultSizedModules.length) {
    warnings.push(`${defaultSizedModules.length} modules appear to use template dimensions; attach raw plan/site source files or edit dimensions after measurement.`);
    score -= Math.min(14, defaultSizedModules.length * 2);
  }

  if (!parts.length) {
    blockingIssues.push('No generated part rows are present.');
    score -= 22;
  } else {
    strengths.push(`${parts.length} part rows were generated.`);
  }

  const invalidParts = parts.filter((part) => !isValidDimension(part.lengthMm) || !isValidDimension(part.widthMm) || !isValidDimension(part.thicknessMm) || Number(part.quantity) <= 0);
  if (invalidParts.length) {
    blockingIssues.push(`${invalidParts.length} part rows have invalid size or quantity.`);
    score -= Math.min(28, invalidParts.length * 4);
  }

  const missingEdgeOrGrain = parts.filter((part) => !part.edgeBand || !part.grain);
  if (missingEdgeOrGrain.length) {
    warnings.push(`${missingEdgeOrGrain.length} part rows need edge-band or grain metadata.`);
    score -= Math.min(12, missingEdgeOrGrain.length * 2);
  } else if (parts.length) {
    strengths.push('Every part row carries edge-band and grain metadata.');
  }

  const unplacedCount = sheetLayout?.unplaced?.length || 0;
  if (unplacedCount) {
    blockingIssues.push(`${unplacedCount} pieces could not be placed on the sheet preview.`);
    score -= Math.min(26, unplacedCount * 5);
  } else if (parts.length) {
    strengths.push('All generated pieces fit in the sheet-layout preview.');
  }

  const rawSourceCount = rawSources.length;
  if (rawSourceCount) {
    strengths.push(`${rawSourceCount} raw source files are attached.`);
  } else {
    warnings.push('Attach site photos, JPEG/PNG plans, PDFs, DXF/DWG/SVG drawings, or measurement files for stronger production confidence.');
    score -= 10;
  }

  const elevationDerivedCount = modules.filter((module) => module.elevationDerived).length;
  if (elevationDerivedCount) {
    strengths.push(`${elevationDerivedCount} module(s) use dimensions measured directly from 2D wall elevations — higher cutlist fidelity.`);
    // Elevation measurements are a stronger source of truth than generic attachments,
    // so they offset the missing raw-source-file penalty.
    if (!rawSourceCount) score = Math.min(100, score + 10);
  }

  const hasFloorPlan = Boolean(project?.floorPlan?.filePath || project?.floorPlan?.previewPath);
  if (!hasFloorPlan) {
    warnings.push('No project floor plan file is attached.');
    score -= 8;
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const productionGrade = boundedScore >= 92 && blockingIssues.length === 0 && rawSourceCount > 0 && hasApprovedBrief;
  return {
    score: productionGrade ? boundedScore : Math.min(boundedScore, 91),
    productionGrade,
    status: productionGrade ? 'factory-ready-after-human-check' : blockingIssues.length ? 'blocked' : 'review-required',
    blockingIssues,
    warnings,
    strengths,
    rawSourceCount,
    checkedAt: new Date().toISOString(),
    note: 'Cutlists are computed from available measurements. Final cutting still requires human verification against site dimensions and approved drawings.'
  };
}

function hasApprovedBriefForProject(projectId) {
  if (!projectId) return false;
  try {
    const row = getDb().prepare('SELECT payload FROM brief_approvals WHERE project_id = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1').get(projectId);
    if (!row) return false;
    const payload = rowToJson(row);
    return payload?.status === 'approved';
  } catch {
    return false;
  }
}

function isValidDimension(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
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
  }, input);
}

// ---- PRECISION: derive cutlist module dimensions from measured 2D wall elevations ----
// The cutlist must be generated from REAL measured elevations, not room templates.
// Elevations live in cad_data.walls_json (per-wall 'cabinets') and photo_elevations.model_json.

export function getElevationCabinets(projectId) {
  const db = getDb();
  const out = [];
  try {
    const cad = db.prepare('SELECT walls_json, furniture_json FROM cad_drawings WHERE project_id = ?').get(projectId);
    if (cad) {
      const walls = safeParse(cad.walls_json) || [];
      const furniture = safeParse(cad.furniture_json) || [];
      for (const wall of walls) {
        const cabs = Array.isArray(wall.cabinets) ? wall.cabinets : [];
        const wallRoom = wall.roomIdPrimary || wall.room || '';
        const wallLen = roundDim(Number(wall.lengthMm || wall.w || 0)) || null;
        const wallH = roundDim(Number(wall.heightMm || wall.h || 0)) || null;
        for (const cab of cabs) {
          out.push(normalizeElevationCabinet(cab, { type: 'wall', wallId: wall.id || wall.wallId || 'wall', room: wallRoom, wallLengthMm: wallLen, wallHeightMm: wallH }));
        }
      }
      for (const cab of furniture) {
        if (Array.isArray(cab.cabinets)) {
          for (const c of cab.cabinets) out.push(normalizeElevationCabinet(c, { type: 'wall', wallId: cab.id || 'furn', room: cab.room || '', wallLengthMm: null, wallHeightMm: null }));
        }
      }
    }
  } catch (e) { /* no cad data */ }
  try {
    const rows = db.prepare('SELECT id, wall_id, wall_name, model_json, confidence FROM photo_elevations WHERE project_id = ?').all(projectId);
    for (const row of rows) {
      const model = safeParse(row.model_json) || {};
      const cabs = Array.isArray(model.cabinets) ? model.cabinets : [];
      const wallRoom = roomFromWallName(row.wall_name);
      for (const cab of cabs) {
        out.push(normalizeElevationCabinet(cab, { type: 'photo', wallId: row.wall_id || row.id, photoId: row.id, room: wallRoom, wallLengthMm: roundDim(Number(model.lengthMm)) || null, wallHeightMm: roundDim(Number(model.heightMm)) || null, confidence: row.confidence }));
      }
    }
  } catch (e) { /* no photo elevations */ }
  return out.filter(Boolean);
}

function safeParse(value) {
  if (!value) return null;
  try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return null; }
}

function roomFromWallName(name = '') {
  const n = String(name).toLowerCase();
  if (n.includes('kitchen')) return 'kitchen';
  if (n.includes('master') || n.includes('bed')) return 'masterBed';
  if (n.includes('kids')) return 'kids';
  if (n.includes('living') || n.includes('hall')) return 'living';
  if (n.includes('pooja') || n.includes('mandir')) return 'pooja';
  if (n.includes('foyer') || n.includes('entry')) return 'foyer';
  if (n.includes('study')) return 'study';
  if (n.includes('dining')) return 'dining';
  if (n.includes('utility')) return 'utility';
  return 'custom';
}

function roundDim(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function normalizeElevationCabinet(cab, ctx) {
  if (!cab) return null;
  const w = roundDim(Number(cab.widthMm || cab.width || 0));
  const h = roundDim(Number(cab.heightMm || cab.height || 0));
  if (!w || !h) return null;
  const d = roundDim(Number(cab.depthMm || cab.depth || 0)) || null;
  const moduleType = classifyCabinetToModuleType(cab, h, d);
  return {
    ctx,
    cab,
    widthMm: w,
    heightMm: h,
    depthMm: d,
    moduleType,
    room: ctx.room || 'custom',
    name: cab.name || cab.type || moduleType
  };
}

function depthForType(type) {
  const map = {
    'kitchen-base': 560, 'kitchen-drawer': 560, 'kitchen-wall': 350, 'kitchen-tall-pantry': 600,
    'wardrobe': 600, 'tv-unit': 450, 'display-storage': 380, 'low-storage': 420, 'mandir': 420,
    'foyer-storage': 380, 'study-desk': 550, 'crockery': 420, 'utility-base': 560, 'utility-wall': 350,
    'bed-back-panel': 100, 'side-table-pair': 400, 'bookshelf': 350, 'balcony-storage': 380, 'custom-storage': 450
  };
  return map[type] || 450;
}

function classifyCabinetToModuleType(cab, h, d) {
  const t = String(cab.type || cab.style || '').toLowerCase();
  if (t.includes('wardrobe')) return 'wardrobe';
  if (t.includes('pantry') || t.includes('tall') || t.includes('appliance')) return 'kitchen-tall-pantry';
  if (t.includes('wall')) return 'kitchen-wall';
  if (t.includes('drawer')) return 'kitchen-drawer';
  if (t.includes('base') || t.includes('counter') || t.includes('kitchen') || t.includes('sink')) return 'kitchen-base';
  if (t.includes('tv') || t.includes('entertainment')) return 'tv-unit';
  if (t.includes('mandir') || t.includes('pooja')) return 'mandir';
  if (t.includes('study') || t.includes('desk')) return 'study-desk';
  if (t.includes('crockery') || t.includes('dining')) return 'crockery';
  if (t.includes('foyer') || t.includes('shoe') || t.includes('console')) return 'foyer-storage';
  if (t.includes('bookshelf') || t.includes('book')) return 'bookshelf';
  if (t.includes('balcony')) return 'balcony-storage';
  if (t.includes('bed') || t.includes('headboard')) return 'bed-back-panel';
  // height/depth heuristics for typed-but-unknown cabinets
  if (h >= 1900) return 'wardrobe';
  if (h <= 900 && d >= 480) return 'kitchen-base';
  if (h <= 600) return 'low-storage';
  if (h >= 1400) return 'tv-unit';
  return 'custom-storage';
}

// Convert normalized elevation cabinets into full cutlist modules whose dimensions are
// the REAL measured elevations, so the standards service yields production-accurate parts.
export function buildElevationModules(elevationModules, project, laminates) {
  return elevationModules.map((entry) => {
    const moduleType = entry.moduleType;
    const depthMm = entry.depthMm || depthForType(moduleType);
    const selectedLaminate = laminateForModule(moduleType, laminates);
    const sourceId = entry.ctx.photoId || entry.ctx.wallId || 'elevation';
    return {
      id: `elev_${nanoid(10)}`,
      room: entry.room,
      roomLabel: roomLabels[entry.room] || entry.room,
      moduleType,
      name: `${entry.name} (from ${entry.ctx.type} elevation)`,
      widthMm: entry.widthMm,
      heightMm: entry.heightMm,
      depthMm,
      material: (moduleType.includes('kitchen') || entry.room === 'utility')
        ? `${DEFAULT_SETTINGS.wetZoneBoard} ${DEFAULT_SETTINGS.boardThicknessMm}mm`
        : `${DEFAULT_SETTINGS.dryZoneBoard} ${DEFAULT_SETTINGS.boardThicknessMm}mm`,
      finish: selectedLaminate ? `${selectedLaminate.brand} ${selectedLaminate.collection} - ${selectedLaminate.finish}` : finishFallback(project),
      hardware: hardwareForBudget(project.budgetTier),
      sourceMarkerId: sourceId,
      placementNote: `Dimensions measured from 2D wall elevation (${entry.ctx.type}${entry.ctx.wallId ? ', wall ' + entry.ctx.wallId : ''}). Verify against site before cutting.`,
      furnitureRequirement: '',
      sizeNote: `${entry.widthMm}x${entry.heightMm}x${depthMm}`,
      createdFrom: 'elevation-v1',
      elevationDerived: true,
      elevationSource: {
        type: entry.ctx.type,
        wallId: entry.ctx.wallId || null,
        photoId: entry.ctx.photoId || null,
        cabinetId: entry.cab?.id || null,
        xOffsetMm: entry.cab?.xOffsetMm ?? null,
        zOffsetMm: entry.cab?.zOffsetMm ?? null,
        wallLengthMm: entry.ctx.wallLengthMm ?? null,
        wallHeightMm: entry.ctx.wallHeightMm ?? null,
        confidence: entry.ctx.confidence ?? null,
        widthMm: entry.widthMm,
        heightMm: entry.heightMm,
        depthMm
      }
    };
  });
}

// Precision merge: measured-elevation modules take precedence (same room+type) over
// template defaults; template modules remain only where no elevation data exists.
export function mergeElevationModules(templateModules, elevModules) {
  if (!elevModules.length) return templateModules;
  const superseded = new Set();
  for (const em of elevModules) {
    const match = templateModules.find((m) => m.room === em.room && m.moduleType === em.moduleType);
    if (match) superseded.add(match.id);
  }
  const kept = templateModules.filter((m) => !superseded.has(m.id));
  return [...elevModules, ...kept];
}

export function buildModules(project, laminates, elevationModules = []) {
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
  // PRECISION: measured 2D wall elevations are the source of truth for dimensions.
  const elevModules = elevationModules && elevationModules.length ? buildElevationModules(elevationModules, project, laminates) : [];
  return mergeElevationModules(modules, elevModules);
}

function modulesForSpace(space, project, laminates, markers) {
  const roomMarkers = markers.filter((marker) => marker.room === space);
  const getMarker = (type) => roomMarkers.find((marker) => marker.type === type);
  const make = (moduleType, name, dimensions, markerType) => createModule({
    room: space,
    moduleType,
    name,
    dimensions,
    project,
    laminates,
    marker: markerType ? getMarker(markerType) : roomMarkers.find((marker) => slug(marker.type) === moduleType)
  });
  if (space === 'living') {
    return [
      make('tv-unit', 'Living TV Wall / Base Unit', { widthMm: 2400, heightMm: 2100, depthMm: 450 }, 'TV Unit'),
      make('display-storage', 'Living Display / Accent Storage', { widthMm: 900, heightMm: 2100, depthMm: 380 }, 'Custom'),
      make('low-storage', 'Living Low Storage Console', { widthMm: 1800, heightMm: 450, depthMm: 420 }, 'Sofa')
    ];
  }
  if (space === 'kitchen') {
    return [
      make('kitchen-base', 'Kitchen Base Units', { widthMm: 3000, heightMm: 710, depthMm: 560 }, 'Kitchen Run'),
      make('kitchen-wall', 'Kitchen Wall Units', { widthMm: 2200, heightMm: 720, depthMm: 350 }, 'Kitchen Run'),
      make('kitchen-tall-pantry', 'Kitchen Tall Pantry / Appliance Unit', { widthMm: 900, heightMm: 2100, depthMm: 600 }, 'Custom'),
      make('kitchen-drawer', 'Kitchen Drawer Bank', { widthMm: 900, heightMm: 710, depthMm: 560 }, 'Kitchen Run'),
      ...(getMarker('Island') ? [make('kitchen-island', 'Kitchen Island Storage', { widthMm: 1800, heightMm: 900, depthMm: 900 }, 'Island')] : [])
    ];
  }
  if (['master', 'kids', 'guest'].includes(space)) {
    const widthMm = space === 'kids' ? 1500 : 1800;
    return [
      make('wardrobe', `${roomLabels[space] || space} Wardrobe`, { widthMm, heightMm: 2100, depthMm: 600 }, 'Wardrobe'),
      make('bed-back-panel', `${roomLabels[space] || space} Bed Back Panel`, { widthMm: 2200, heightMm: 1200, depthMm: 100 }, 'Bed'),
      make('side-table-pair', `${roomLabels[space] || space} Bedside Units`, { widthMm: 900, heightMm: 450, depthMm: 400 }, 'Bed'),
      ...(getMarker('Study Desk') || space === 'kids' ? [make('study-desk', `${roomLabels[space] || space} Study Desk`, { widthMm: 1400, heightMm: 1600, depthMm: 550 }, 'Study Desk')] : [])
    ];
  }
  if (space === 'pooja') {
    return [
      make('mandir', 'Mandir / Pooja Unit', { widthMm: 900, heightMm: 1800, depthMm: 420 }, 'Mandir'),
      make('mandir-back-panel', 'Mandir Back Panel / Jali', { widthMm: 900, heightMm: 1800, depthMm: 80 }, 'Mandir')
    ];
  }
  if (space === 'foyer') {
    return [
      make('foyer-storage', 'Foyer Shoe Storage', { widthMm: 1200, heightMm: 1050, depthMm: 380 }, 'Shoe Rack'),
      make('foyer-console', 'Foyer Console / Mirror Backing', { widthMm: 900, heightMm: 1800, depthMm: 250 }, 'Custom')
    ];
  }
  if (space === 'study') {
    return [
      make('study-desk', 'Study Desk + Overhead', { widthMm: 1600, heightMm: 1800, depthMm: 550 }, 'Study Desk'),
      make('bookshelf', 'Bookshelf / File Storage', { widthMm: 900, heightMm: 2100, depthMm: 350 }, 'Custom')
    ];
  }
  if (space === 'dining') {
    return [
      make('crockery', 'Dining Crockery Unit', { widthMm: 1500, heightMm: 2100, depthMm: 420 }, 'Dining'),
      make('dining-console', 'Dining Console Storage', { widthMm: 1200, heightMm: 900, depthMm: 380 }, 'Dining')
    ];
  }
  if (space === 'utility') {
    return [
      make('utility-base', 'Utility Base Storage', { widthMm: 1200, heightMm: 710, depthMm: 560 }, 'Custom'),
      make('utility-wall', 'Utility Wall Storage', { widthMm: 1200, heightMm: 720, depthMm: 350 }, 'Custom'),
      make('utility-tall-storage', 'Utility Tall Storage', { widthMm: 700, heightMm: 2100, depthMm: 500 }, 'Custom')
    ];
  }
  if (space === 'balcony') {
    return [
      make('balcony-storage', 'Balcony Weather-Protected Storage', { widthMm: 1000, heightMm: 1050, depthMm: 380 }, 'Custom'),
      make('balcony-bench-storage', 'Balcony Bench Storage', { widthMm: 1400, heightMm: 450, depthMm: 450 }, 'Custom')
    ];
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

export function generatePartsForModule(module, moduleIndex) {
  return precisionPartsForModule(module, moduleIndex, DEFAULT_SETTINGS);
}

function createSheet(sheetNo) {
  return {
    sheetNo,
    label: `${DEFAULT_SETTINGS.sheet.label} - Sheet ${sheetNo}`,
    lengthMm: DEFAULT_SETTINGS.sheet.lengthMm,
    widthMm: DEFAULT_SETTINGS.sheet.widthMm,
    usedAreaSqM: 0,
    wastePercent: 100,
    pieces: [],
    freeRects: [{
      x: DEFAULT_SETTINGS.trimMm,
      y: DEFAULT_SETTINGS.trimMm,
      w: DEFAULT_SETTINGS.sheet.lengthMm - DEFAULT_SETTINGS.trimMm * 2,
      h: DEFAULT_SETTINGS.sheet.widthMm - DEFAULT_SETTINGS.trimMm * 2
    }]
  };
}

function finalizeSheet(sheet, sheetAreaSqM) {
  sheet.usedAreaSqM = Number(sheet.usedAreaSqM.toFixed(2));
  sheet.wastePercent = Number(Math.max(0, 100 - (sheet.usedAreaSqM / sheetAreaSqM) * 100).toFixed(1));
  delete sheet.freeRects;
}

function placePieceMaxRects(sheet, piece) {
  const kerf = DEFAULT_SETTINGS.kerfMm;
  const candidates = placementCandidates(piece);
  let best = null;
  for (let rectIndex = 0; rectIndex < sheet.freeRects.length; rectIndex += 1) {
    const rect = sheet.freeRects[rectIndex];
    for (const candidate of candidates) {
      const packW = candidate.w + kerf;
      const packH = candidate.h + kerf;
      if (packW <= rect.w && packH <= rect.h) {
        const waste = rect.w * rect.h - packW * packH;
        const shortSide = Math.min(rect.w - packW, rect.h - packH);
        if (!best || waste < best.waste || (waste === best.waste && shortSide < best.shortSide)) {
          best = { rectIndex, rect, candidate, packW, packH, waste, shortSide };
        }
      }
    }
  }
  if (!best) return false;
  const placed = {
    ...piece,
    x: best.rect.x,
    y: best.rect.y,
    w: best.candidate.w,
    h: best.candidate.h,
    rotated: best.candidate.rotated
  };
  sheet.pieces.push(placed);
  sheet.usedAreaSqM += (piece.lengthMm * piece.widthMm) / 1_000_000;
  const used = { x: best.rect.x, y: best.rect.y, w: best.packW, h: best.packH };
  const nextFree = [];
  for (const rect of sheet.freeRects) {
    if (!rectsOverlap(rect, used)) {
      nextFree.push(rect);
      continue;
    }
    if (used.x > rect.x) nextFree.push({ x: rect.x, y: rect.y, w: used.x - rect.x, h: rect.h });
    if (used.x + used.w < rect.x + rect.w) nextFree.push({ x: used.x + used.w, y: rect.y, w: rect.x + rect.w - (used.x + used.w), h: rect.h });
    if (used.y > rect.y) nextFree.push({ x: rect.x, y: rect.y, w: rect.w, h: used.y - rect.y });
    if (used.y + used.h < rect.y + rect.h) nextFree.push({ x: rect.x, y: used.y + used.h, w: rect.w, h: rect.y + rect.h - (used.y + used.h) });
  }
  sheet.freeRects = pruneFreeRects(nextFree);
  return true;
}

function placementCandidates(piece) {
  const direct = { w: piece.lengthMm, h: piece.widthMm, rotated: false };
  const canRotate = piece.grain === 'none' || piece.grain === 'horizontal' || !piece.grain;
  const rotated = { w: piece.widthMm, h: piece.lengthMm, rotated: true };
  return canRotate && piece.lengthMm !== piece.widthMm ? [direct, rotated] : [direct];
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function pruneFreeRects(rects) {
  const cleaned = rects
    .filter((rect) => rect.w > 20 && rect.h > 20)
    .sort((a, b) => (b.w * b.h) - (a.w * a.h));
  return cleaned.filter((rect, index) => !cleaned.some((other, otherIndex) => (
    otherIndex !== index &&
    rect.x >= other.x &&
    rect.y >= other.y &&
    rect.x + rect.w <= other.x + other.w &&
    rect.y + rect.h <= other.y + other.h
  ))).slice(0, 80);
}

function fitPieceToSheet(piece, usableLength, usableWidth) {
  const kerf = DEFAULT_SETTINGS.kerfMm;
  for (const candidate of placementCandidates(piece)) {
    const packW = candidate.w + kerf;
    const packH = candidate.h + kerf;
    if (packW <= usableLength && packH <= usableWidth) {
      return { ...candidate, packW, packH };
    }
  }
  return null;
}

export function splitOversizePart(partItem, _depth = 0) {
  const usableLength = DEFAULT_SETTINGS.sheet.lengthMm - DEFAULT_SETTINGS.trimMm * 2;
  const usableWidth = DEFAULT_SETTINGS.sheet.widthMm - DEFAULT_SETTINGS.trimMm * 2;
  const maxCutLength = usableLength - DEFAULT_SETTINGS.kerfMm;
  const maxCutWidth = usableWidth - DEFAULT_SETTINGS.kerfMm;
  if (fitPieceToSheet(partItem, usableLength, usableWidth)) return [partItem];

  const canRotate = partItem.grain === 'none' || partItem.grain === 'horizontal' || !partItem.grain;

  // Guard against infinite recursion. A part is genuinely impossible only when
  // it cannot fit the sheet in ANY orientation AND cannot be fixed by splitting a
  // single axis (i.e. both dimensions exceed the board and it can't rotate).
  // Otherwise splitting the long axis produces placeable segments and terminates.
  if (_depth > 12) {
    return [{ ...partItem, notes: `${partItem.notes || ''} Oversize beyond 8x4 split capacity; manual board required.`.trim() }];
  }
  const lengthSplitViable = partItem.lengthMm <= maxCutLength || (canRotate && partItem.widthMm <= maxCutLength);
  const widthSplitViable = partItem.widthMm <= maxCutWidth || (canRotate && partItem.lengthMm <= maxCutWidth);
  if (!lengthSplitViable && !widthSplitViable) {
    return [{ ...partItem, notes: `${partItem.notes || ''} Oversize for 8x4 sheet (grain-locked or dimension exceeds board); manual/special sheet required.`.trim() }];
  }

  const directLengthOver = partItem.lengthMm > maxCutLength;
  const directWidthOver = partItem.widthMm > maxCutWidth;
  const rotatedWouldFitLength = canRotate && partItem.widthMm <= maxCutLength;
  const splitByLength = directLengthOver || (!directWidthOver && !rotatedWouldFitLength);
  const segmentCount = splitByLength
    ? Math.ceil(partItem.lengthMm / maxCutLength)
    : Math.ceil(partItem.widthMm / maxCutWidth);
  const segments = Array.from({ length: segmentCount }, (_, index) => {
    const remaining = splitByLength
      ? partItem.lengthMm - index * maxCutLength
      : partItem.widthMm - index * maxCutWidth;
    const segmentSize = Math.min(splitByLength ? maxCutLength : maxCutWidth, remaining);
    return {
      ...partItem,
      id: nanoid(12),
      partCode: `${partItem.partCode}-S${index + 1}`,
      name: `${partItem.name} split ${index + 1}/${segmentCount}`,
      lengthMm: splitByLength ? segmentSize : partItem.lengthMm,
      widthMm: splitByLength ? partItem.widthMm : segmentSize,
      quantity: partItem.quantity,
      notes: `${partItem.notes || ''} Oversized proposal panel split for 8x4 sheet planning; confirm joint/veneer matching in working drawings.`.trim()
    };
  });
  return segments.flatMap((seg) => splitOversizePart(seg, _depth + 1));
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

// Atomic transaction wrapper. The db client wrapper exposes .prepare() (delegating to
// better-sqlite3) but not .transaction(), so we use the raw better-sqlite3 handle when
// available and fall back to manual BEGIN/COMMIT/ROLLBACK otherwise.
function runInTransaction(fn) {
  const db = getDb();
  const raw = db && db.sqlite;
  if (raw && typeof raw.transaction === 'function') {
    return raw.transaction(fn)();
  }
  db.prepare('BEGIN').run();
  try {
    const result = fn();
    db.prepare('COMMIT').run();
    return result;
  } catch (err) {
    try { db.prepare('ROLLBACK').run(); } catch { /* ignore */ }
    throw err;
  }
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

function buildMaterialSheetLayouts(cutlist) {
  const materialMap = new Map();
  (cutlist.parts || []).forEach((part) => {
    const key = part.material || 'Unspecified Material';
    if (!materialMap.has(key)) materialMap.set(key, []);
    materialMap.get(key).push(part);
  });
  return [...materialMap.entries()].map(([material, parts]) => {
    const layout = buildSheetLayout(parts, cutlist.modules || []);
    return { material, sheets: layout.sheets, unplaced: layout.unplaced };
  });
}

function summarizeJobLayout(sheets, cutlist) {
  const totalPanels = (cutlist.parts || []).reduce((sum, part) => sum + (part.quantity || 0), 0);
  const totalCutLength = sheets.reduce((sum, sheet) => sum + sheet.pieces.reduce((pieceSum, piece) => pieceSum + 2 * (piece.w + piece.h), 0), 0);
  const weightedWaste = sheets.length
    ? sheets.reduce((sum, sheet) => sum + sheet.wastePercent, 0) / sheets.length
    : 100;
  return {
    jobSheets: sheets.length,
    jobPanels: totalPanels,
    jobWastage: Number(weightedWaste.toFixed(2)),
    jobCutLength: Math.round(totalCutLength)
  };
}

function addJobLayoutPage(doc, cutlist, sheet, pageNo, totalPages, jobStats) {
  if (pageNo > 1) doc.addPage();
  const material = sheet.material || sheet.pieces?.[0]?.material || 'Material';
  const materialSheets = sheet.materialSheets || 1;
  const sheetLength = DEFAULT_SETTINGS.sheet.lengthMm;
  const sheetWidth = DEFAULT_SETTINGS.sheet.widthMm;
  const titleY = 28;
  doc.fillColor('#111').font('Helvetica-Bold').fontSize(12).text(material, 30, titleY, { width: 190 });
  doc.fillColor('#111').font('Helvetica-Bold').fontSize(13).text('Job Layout', 250, titleY, { width: 120, align: 'center' });
  doc.font('Helvetica').fontSize(8).fillColor('#333');
  doc.text(`Sheet Size : ${sheetLength} mm x ${sheetWidth} mm x ${DEFAULT_SETTINGS.boardThicknessMm} mm`, 30, 48, { width: 210 });
  doc.text(`Layout ${pageNo} of ${totalPages} (x1) - ${material} (${sheetLength} mm x ${sheetWidth} mm)`, 250, 48, { width: 300 });
  doc.text(`Client Name : ${cutlist.clientName || 'Client'}    Job Reference : ${cutlist.id}`, 250, 66, { width: 300 });
  doc.text(`Date Required : ${new Date().toLocaleDateString('en-IN')}    Sheets of this Material : ${materialSheets}    Job Sheets : ${jobStats.jobSheets}`, 250, 84, { width: 300 });
  doc.text(`Sheet Panels : ${sheet.pieces?.length || 0}    Job Panels : ${jobStats.jobPanels}`, 250, 102, { width: 300 });
  doc.text(`Layout Wastage : ${sheet.wastePercent || 0}%    Job Wastage : ${jobStats.jobWastage}%`, 250, 120, { width: 300 });
  const sheetCutLength = Math.round((sheet.pieces || []).reduce((sum, piece) => sum + 2 * (piece.w + piece.h), 0));
  doc.text(`Sheet Cut Length : ${sheetCutLength} mm    Job Cut Length : ${jobStats.jobCutLength} mm`, 250, 138, { width: 300 });

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#111').text('Cutting List', 30, 84);
  doc.font('Helvetica-Bold').fontSize(8).text('Symbol', 30, 104).text('Length', 78, 104).text('Width', 128, 104).text('Qty', 176, 104);
  const grouped = groupSheetPieces(sheet.pieces || []);
  doc.font('Helvetica').fontSize(8).fillColor('#111');
  grouped.slice(0, 22).forEach((item, index) => {
    const y = 120 + index * 14;
    doc.text(String(index + 1), 34, y);
    doc.text(`${item.lengthMm} mm`, 76, y);
    doc.text(`${item.widthMm} mm`, 128, y);
    doc.text(String(item.qty), 182, y);
  });

  const sx = 72;
  const sy = 430;
  const sw = 452;
  const sh = 226;
  doc.font('Helvetica').fontSize(8).fillColor('#111').text(`${sheetWidth} mm`, sx - 48, sy + sh / 2, { width: 44, align: 'right' });
  doc.text(`${sheetLength} mm`, sx + sw / 2 - 40, sy + sh + 10, { width: 80, align: 'center' });
  doc.rect(sx, sy, sw, sh).stroke('#111');
  const scaleX = sw / sheetLength;
  const scaleY = sh / sheetWidth;
  const symbolByPart = new Map(grouped.map((item, index) => [item.key, index + 1]));
  (sheet.pieces || []).forEach((piece) => {
    const key = `${piece.partId}|${piece.lengthMm}|${piece.widthMm}|${piece.rotated ? 'r' : 'd'}`;
    const px = sx + piece.x * scaleX;
    const py = sy + piece.y * scaleY;
    const pw = Math.max(5, piece.w * scaleX);
    const ph = Math.max(5, piece.h * scaleY);
    doc.rect(px, py, pw, ph).fillAndStroke('#f4efe3', '#111');
    if (pw > 22 && ph > 14) {
      doc.fillColor('#111').font('Helvetica-Bold').fontSize(7).text(String(symbolByPart.get(key) || ''), px + 3, py + 3, { width: pw - 6, align: 'center' });
      doc.font('Helvetica').fontSize(5.5).text(shortPieceLabel(piece), px + 2, py + Math.min(16, ph / 2), { width: pw - 4, align: 'center', height: ph - 4 });
    }
  });

  doc.font('Helvetica').fontSize(8).fillColor('#111').text('Occurrences', 30, 696).font('Helvetica-Bold').text('x1', 30, 710);
  doc.font('Helvetica').fontSize(8).text('Grain Direction', 30, 742);
  doc.moveTo(116, 746).lineTo(206, 746).stroke('#111');
  doc.polygon([206, 746], [196, 741], [196, 751]).fill('#111');
  doc.font('Helvetica').fontSize(8).fillColor('#111').text('Spacious Venture', 30, 800);
  doc.text(`${new Date().toLocaleDateString('en-IN')} Page ${pageNo} of ${totalPages}`, 460, 800, { width: 100, align: 'right' });
}

function groupSheetPieces(pieces) {
  const map = new Map();
  pieces.forEach((piece) => {
    const key = `${piece.partId}|${piece.lengthMm}|${piece.widthMm}|${piece.rotated ? 'r' : 'd'}`;
    const row = map.get(key) || { key, lengthMm: piece.lengthMm, widthMm: piece.widthMm, qty: 0, label: piece.name || piece.partCode || '' };
    row.qty += 1;
    map.set(key, row);
  });
  return [...map.values()];
}

function shortPieceLabel(piece = {}) {
  return String(piece.name || piece.partCode || '').replace(/\s+/g, ' ').trim().slice(0, 30);
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
    'Shoe Rack': { widthMm: 1200, heightMm: 1050, depthMm: 380 },
    'Crockery Unit': { widthMm: 1500, heightMm: 2100, depthMm: 420 },
    'Display Unit': { widthMm: 900, heightMm: 2100, depthMm: 380 },
    Bookshelf: { widthMm: 900, heightMm: 2100, depthMm: 350 },
    Console: { widthMm: 1200, heightMm: 900, depthMm: 380 },
    Pantry: { widthMm: 900, heightMm: 2100, depthMm: 600 },
    'Tall Unit': { widthMm: 700, heightMm: 2100, depthMm: 500 },
    'Bed Back Panel': { widthMm: 2200, heightMm: 1200, depthMm: 100 },
    'Side Table': { widthMm: 900, heightMm: 450, depthMm: 400 },
    'Balcony Storage': { widthMm: 1000, heightMm: 1050, depthMm: 380 }
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

function normalizeEdgeBand(edgeBand = '') {
  const text = String(edgeBand || '');
  if (!text) return { visible: '', internal: '' };
  const visible = /2\s*mm/i.test(text) ? '2MM MATCHING' : text;
  const internal = /0\.?8\s*mm/i.test(text) ? '0.8MM MATCHING' : (/2\s*mm/i.test(text) ? '0.8MM MATCHING' : text);
  return { visible, internal };
}

function edgeTag(edge = '') {
  const text = String(edge || '').toUpperCase();
  if (!text) return '';
  if (text.includes('2MM')) return 'VISIBLE';
  if (text.includes('0.8')) return 'INTERNAL';
  return 'MATCHING';
}

function materialTagFor(material = '', thickness = '') {
  const clean = String(material || 'BOARD').toUpperCase().replace(/[^A-Z0-9+ -]+/g, '').trim();
  const thick = thickness ? `${thickness}MM` : '';
  return [thick, clean].filter(Boolean).join(' ');
}

function canRotateFor(part = {}) {
  const grain = String(part.grain || '').toLowerCase();
  if (grain.includes('vertical') || grain.includes('locked') || grain.includes('one-way')) return 'FALSE';
  return 'TRUE';
}

function maxCutPartName(module = {}, part = {}) {
  const moduleCode = module.productionCode || module.code || module.name || module.moduleType || 'MODULE';
  const role = roleCodeForPart(part);
  return `${String(moduleCode).toUpperCase().replace(/\s+/g, ' ').trim()} ${role}`.trim();
}

function roleCodeForPart(part = {}) {
  const name = String(part.name || part.partCode || '').toLowerCase();
  if (name.includes('top')) return 'TOP-G';
  if (name.includes('bottom') || name.includes('bot')) return 'BOT-G';
  if (name.includes('fixed shelf') || name.includes('shelf')) return 'FS';
  if (name.includes('left') || name.includes('side l')) return 'LS';
  if (name.includes('right') || name.includes('side r')) return 'RS';
  if (name.includes('back')) return 'BACK';
  if (name.includes('door') || name.includes('shutter')) return 'DOOR';
  if (name.includes('drawer')) return 'DRAWER';
  if (name.includes('skirting') || name.includes('plinth')) return 'PLINTH';
  return String(part.partCode || 'SP-G').toUpperCase();
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function cutlistToExcel(cutlist) {
  const Workbook = new ExcelJS.Workbook();
  const sheet = Workbook.addWorksheet('Master Cutlist');

  // Set column widths
  sheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Part / Module Name', key: 'name', width: 35 },
    { header: 'Length (mm)', key: 'length', width: 15 },
    { header: 'Width (mm)', key: 'width', width: 15 },
    { header: 'Qty', key: 'qty', width: 8 },
    { header: 'Thickness (mm)', key: 'thickness', width: 15 },
    { header: 'Grain', key: 'grain', width: 12 },
    { header: 'Material', key: 'material', width: 25 },
    { header: 'Edge L1', key: 'edge_l1', width: 15 },
    { header: 'Edge L2', key: 'edge_l2', width: 15 },
    { header: 'Edge W1', key: 'edge_w1', width: 15 },
    { header: 'Edge W2', key: 'edge_w2', width: 15 },
    { header: 'Notes', key: 'notes', width: 45 }
  ];

  // Header styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'BD934A' } // Spacious Venture Gold
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  let currentExcelRow = 2;

  cutlist.modules.forEach((module, moduleIdx) => {
    // Write Module Header Row
    const moduleRow = sheet.getRow(currentExcelRow);
    
    // Set cell values
    moduleRow.getCell(1).value = `M${moduleIdx + 1}`;
    moduleRow.getCell(2).value = `${module.name.toUpperCase()} (${module.room.toUpperCase()} - ${module.moduleType.toUpperCase()})`;
    moduleRow.getCell(3).value = module.heightMm;
    moduleRow.getCell(4).value = module.widthMm;
    moduleRow.getCell(5).value = 1; // Qty of module
    moduleRow.getCell(6).value = module.depthMm;
    moduleRow.getCell(8).value = '(MODULE DIMENSIONS: H x W x D)';
    
    // Store row index of the module header to reference it in formulas
    const moduleRowIndex = currentExcelRow;

    // Format module row
    moduleRow.font = { name: 'Arial', bold: true, color: { argb: '2B1D0B' } };
    moduleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FAF8F2' } // Light paper background
    };
    moduleRow.border = {
      top: { style: 'thin' },
      bottom: { style: 'medium' }
    };
    
    currentExcelRow += 1;

    // Filter parts belonging to this module
    const moduleParts = cutlist.parts.filter((part) => part.moduleId === module.id);
    
    moduleParts.forEach((part, partIdx) => {
      const partRow = sheet.getRow(currentExcelRow);
      partRow.getCell(1).value = partIdx + 1;
      partRow.getCell(2).value = part.name;

      // Formula mapping:
      // In the module row (moduleRowIndex):
      // Height H is in column 3 (C)
      // Width W is in column 4 (D)
      // Depth D is in column 6 (F)
      const replaceVarsWithExcelRefs = (formula) => {
        if (!formula) return null;
        let str = String(formula)
          .replace(/\bH\b/g, `C${moduleRowIndex}`)
          .replace(/\bW\b/g, `D${moduleRowIndex}`)
          .replace(/\bD\b/g, `F${moduleRowIndex}`)
          .replace(/\bt\b/g, '18')
          .replace(/\bbt\b/g, '6')
          .replace(/\bg\b/g, '3');
        return str;
      };

      const lengthFormula = replaceVarsWithExcelRefs(part.formula_length);
      const widthFormula = replaceVarsWithExcelRefs(part.formula_width);

      if (lengthFormula && isNaN(Number(lengthFormula))) {
        partRow.getCell(3).value = { formula: lengthFormula, result: part.lengthMm };
      } else {
        partRow.getCell(3).value = part.lengthMm;
      }

      if (widthFormula && isNaN(Number(widthFormula))) {
        partRow.getCell(4).value = { formula: widthFormula, result: part.widthMm };
      } else {
        partRow.getCell(4).value = part.widthMm;
      }

      partRow.getCell(5).value = part.quantity;
      partRow.getCell(6).value = part.thicknessMm;
      partRow.getCell(7).value = part.grain;
      partRow.getCell(8).value = part.material;
      partRow.getCell(9).value = part.edge_l1 || '';
      partRow.getCell(10).value = part.edge_l2 || '';
      partRow.getCell(11).value = part.edge_w1 || '';
      partRow.getCell(12).value = part.edge_w2 || '';
      partRow.getCell(13).value = part.notes || '';

      // Set font and minor border
      partRow.font = { name: 'Arial', size: 10 };
      partRow.border = {
        bottom: { style: 'hair' }
      };

      currentExcelRow += 1;
    });

    currentExcelRow += 1; // Empty line between modules
  });

  const maxCutSheet = Workbook.addWorksheet('MaxCut Import');
  maxCutSheet.columns = MAXCUT_CSV_HEADERS.map((header) => ({
    header,
    key: header,
    width: Math.min(Math.max(header.length + 2, 14), 36)
  }));
  maxCutSheet.getRow(1).font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
  maxCutSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1D211D' }
  };
  for (const row of cutlistToMaxCutRows(cutlist)) {
    const objectRow = {};
    MAXCUT_CSV_HEADERS.forEach((header, index) => { objectRow[header] = row[index]; });
    maxCutSheet.addRow(objectRow);
  }

  const audit = cutlist.accuracyAudit || {};
  const auditSheet = Workbook.addWorksheet('Accuracy Audit');
  auditSheet.columns = [
    { header: 'Check', key: 'check', width: 28 },
    { header: 'Result', key: 'result', width: 18 },
    { header: 'Detail', key: 'detail', width: 80 }
  ];
  auditSheet.getRow(1).font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
  auditSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: audit.productionGrade ? '3F7F55' : 'BD934A' } };
  auditSheet.addRow({ check: 'Production confidence', result: `${audit.score || 0}%`, detail: audit.note || 'Verify final site measurements before cutting.' });
  auditSheet.addRow({ check: 'Production grade', result: audit.productionGrade ? 'YES' : 'NO', detail: audit.status || 'review-required' });
  auditSheet.addRow({ check: 'Raw source files', result: String(audit.rawSourceCount || 0), detail: (cutlist.rawSources || []).map((source) => source.originalName || source.fileName).join(', ') || 'No source files attached.' });
  (audit.blockingIssues || []).forEach((detail) => auditSheet.addRow({ check: 'Blocking issue', result: 'BLOCKED', detail }));
  (audit.warnings || []).forEach((detail) => auditSheet.addRow({ check: 'Warning', result: 'REVIEW', detail }));
  (audit.strengths || []).forEach((detail) => auditSheet.addRow({ check: 'Strength', result: 'OK', detail }));

  return Workbook;
}

export function writeJobSummaryPdf(cutlist, outPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outPath.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
    const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
    const stream = fs.createWriteStream(outPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    // Title / Header
    doc.fillColor('#f7f2e8').rect(0, 0, 595, 120).fill();
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(22).text('JOB MATERIAL SUMMARY', 42, 38);
    doc.fillColor('#b88a2f').fontSize(10).text('SPACIOUS VENTURE PRODUCTION READY HANDOFF', 42, 68);
    doc.fillColor('#55594f').font('Helvetica').fontSize(9).text(`Project: ${cutlist.clientName}   |   Cutlist ID: ${cutlist.id}   |   Revision: ${cutlist.revision || 1}`, 42, 88);

    // Info section
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(12).text('Project Metadata', 42, 145);
    doc.font('Helvetica').fontSize(9).fillColor('#55594f');
    doc.text(`Client: ${cutlist.clientName}`, 42, 165);
    doc.text(`Created At: ${new Date(cutlist.createdAt).toLocaleDateString()}`, 42, 180);
    doc.text(`Modules: ${cutlist.modules?.length || 0}`, 240, 165);
    doc.text(`Total Panel Rows: ${cutlist.parts?.length || 0}`, 240, 180);

    // Group parts by material
    const materialsSummary = {};
    cutlist.parts.forEach((part) => {
      if (!materialsSummary[part.material]) {
        materialsSummary[part.material] = {
          material: part.material,
          thickness: part.thicknessMm,
          sqm: 0,
          quantity: 0
        };
      }
      materialsSummary[part.material].sqm += (part.lengthMm * part.widthMm * part.quantity) / 1_000_000;
      materialsSummary[part.material].quantity += part.quantity;
    });

    const sheetAreaSqM = (2440 * 1220) / 1_000_000; // 8x4 sheet

    // Materials table
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(12).text('Core Board Material Requirements', 42, 220);
    let y = 240;
    
    // Draw table header
    doc.fillColor('#bd934a').rect(42, y, 510, 20).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('Material / Description', 50, y + 6, { width: 180 });
    doc.text('Thickness', 240, y + 6, { width: 60 });
    doc.text('Panel Qty', 310, y + 6, { width: 60 });
    doc.text('Net Area (sqm)', 380, y + 6, { width: 80 });
    doc.text('Est. 8x4 Sheets', 470, y + 6, { width: 80 });
    y += 20;

    doc.font('Helvetica').fontSize(9);
    Object.values(materialsSummary).forEach((item, index) => {
      doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f7f2e8').rect(42, y, 510, 24).fill();
      doc.fillColor('#1d211d');
      doc.text(item.material, 50, y + 8, { width: 180 });
      doc.text(`${item.thickness} mm`, 240, y + 8, { width: 60 });
      doc.text(String(item.quantity), 310, y + 8, { width: 60 });
      doc.text(item.sqm.toFixed(2), 380, y + 8, { width: 80 });
      const estSheets = Math.ceil(item.sqm / sheetAreaSqM);
      doc.text(String(estSheets), 470, y + 8, { width: 80 });
      y += 24;
    });

    // Group edge bands
    const edgesSummary = {};
    cutlist.parts.forEach((part) => {
      const edges = [part.edge_l1, part.edge_l2, part.edge_w1, part.edge_w2].filter(Boolean);
      edges.forEach((edge) => {
        if (!edgesSummary[edge]) {
          edgesSummary[edge] = { edge, meters: 0 };
        }
        let m = 0;
        if (edge === part.edge_l1) m += (part.lengthMm * part.quantity) / 1000;
        if (edge === part.edge_l2) m += (part.lengthMm * part.quantity) / 1000;
        if (edge === part.edge_w1) m += (part.widthMm * part.quantity) / 1000;
        if (edge === part.edge_w2) m += (part.widthMm * part.quantity) / 1000;
        edgesSummary[edge].meters += m;
      });
    });

    y += 30;
    doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(12).text('Edge Banding Requirements', 42, y);
    y += 20;

    // Draw edge band header
    doc.fillColor('#bd934a').rect(42, y, 510, 20).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('Edge Banding Description', 50, y + 6, { width: 300 });
    doc.text('Est. Meters Required', 380, y + 6, { width: 150 });
    y += 20;

    doc.font('Helvetica').fontSize(9);
    Object.values(edgesSummary).forEach((item, index) => {
      doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f7f2e8').rect(42, y, 510, 24).fill();
      doc.fillColor('#1d211d');
      doc.text(item.edge, 50, y + 8, { width: 300 });
      doc.text(`${item.meters.toFixed(1)} m`, 380, y + 8, { width: 150 });
      y += 24;
    });

    // Signature sign off
    y += 50;
    doc.moveTo(42, y + 40).lineTo(220, y + 40).stroke('#1d211d');
    doc.moveTo(330, y + 40).lineTo(510, y + 40).stroke('#1d211d');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1d211d').text('Designer Approval', 42, y + 52);
    doc.text('Factory Lead Sign-off', 330, y + 52);

    // Footer page number
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#7a7d74').text(`Spacious Venture - Material Job Summary ${cutlist.id} - Page ${i + 1}`, 42, 815, { align: 'center' });
    }

    doc.end();
  });
}

export function writePanelLabelsPdf(cutlist, outPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outPath.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
    const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true });
    const stream = fs.createWriteStream(outPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    const labelW = 255;
    const labelH = 175;
    const startX = 35;
    const startY = 45;
    const gapX = 15;
    const gapY = 20;

    let col = 0;
    let row = 0;

    const panels = [];
    cutlist.parts.forEach((part) => {
      const module = cutlist.modules.find((item) => item.id === part.moduleId);
      for (let i = 0; i < part.quantity; i += 1) {
        panels.push({
          projectCode: cutlist.id.slice(0, 6).toUpperCase(),
          moduleName: module?.name || 'Carcass',
          partCode: part.partCode,
          partIndex: `${i + 1}/${part.quantity}`,
          name: part.name,
          lengthMm: part.lengthMm,
          widthMm: part.widthMm,
          thicknessMm: part.thicknessMm,
          material: part.material,
          edge_l1: part.edge_l1,
          edge_l2: part.edge_l2,
          edge_w1: part.edge_w1,
          edge_w2: part.edge_w2,
          grain: part.grain
        });
      }
    });

    panels.forEach((panel, index) => {
      if (index > 0 && col === 0 && row === 0) {
        doc.addPage();
      }

      const x = startX + col * (labelW + gapX);
      const y = startY + row * (labelH + gapY);

      // Draw label border
      doc.roundedRect(x, y, labelW, labelH, 6).lineWidth(1).stroke('#d2ad67');

      // Draw content inside label
      doc.fillColor('#1d211d').font('Helvetica-Bold').fontSize(8).text(`SV-${panel.projectCode}`, x + 12, y + 12);
      doc.fontSize(8).fillColor('#7a7d74').text(`Piece: ${panel.partIndex}`, x + 180, y + 12, { align: 'right', width: 60 });
      
      doc.fillColor('#bd934a').font('Helvetica-Bold').fontSize(10).text(panel.moduleName, x + 12, y + 26, { width: 230, ellipsis: true });
      doc.fillColor('#1d211d').font('Helvetica').fontSize(9).text(`${panel.name} (${panel.partCode})`, x + 12, y + 42, { width: 230, ellipsis: true });

      doc.fontSize(8).fillColor('#55594f');
      doc.text(`Material: ${panel.material}`, x + 12, y + 58, { width: 230, ellipsis: true });
      doc.text(`Cut size: ${panel.lengthMm} x ${panel.widthMm} x ${panel.thicknessMm} mm`, x + 12, y + 72);
      doc.text(`Grain: ${panel.grain || 'none'}`, x + 12, y + 86);

      // Draw Visual Edge Diagram
      const dx = x + 175;
      const dy = y + 105;
      const dw = 60;
      const dh = 40;

      // Draw panel background
      doc.rect(dx, dy, dw, dh).fillColor('#fcfaf6').fillAndStroke('#e1ded6');

      // Highlight banded edges with thick gold line
      doc.lineWidth(2).strokeStyle('#bd934a');
      if (panel.edge_l1) doc.moveTo(dx, dy).lineTo(dx, dy + dh).stroke();
      if (panel.edge_l2) doc.moveTo(dx + dw, dy).lineTo(dx + dw, dy + dh).stroke();
      if (panel.edge_w1) doc.moveTo(dx, dy).lineTo(dx + dw, dy).stroke();
      if (panel.edge_w2) doc.moveTo(dx, dy + dh).lineTo(dx + dw, dy + dh).stroke();

      // Label L1, L2, W1, W2 values
      doc.fillColor('#7a7d74').font('Helvetica').fontSize(6);
      if (panel.edge_l1) doc.text('L1', dx - 10, dy + dh/2 - 2);
      if (panel.edge_l2) doc.text('L2', dx + dw + 3, dy + dh/2 - 2);
      if (panel.edge_w1) doc.text('W1', dx + dw/2 - 4, dy - 8);
      if (panel.edge_w2) doc.text('W2', dx + dw/2 - 4, dy + dh + 2);

      // Draw minor summary of edge bands text inside label
      doc.fillColor('#55594f').fontSize(7);
      doc.text(`L1: ${panel.edge_l1 ? '2mm' : '-'}   L2: ${panel.edge_l2 ? '2mm' : '-'}`, x + 12, y + 115);
      doc.text(`W1: ${panel.edge_w1 ? '2mm' : '-'}   W2: ${panel.edge_w2 ? '2mm' : '-'}`, x + 12, y + 130);

      // Advance layout grid
      col += 1;
      if (col === 2) {
        col = 0;
        row += 1;
      }
      if (row === 4) {
        row = 0;
      }
    });

    doc.end();
  });
}

export function generateCabinetParts(cab) {
  const width = parseInt(cab.w || cab.width || 600);
  const height = parseInt(cab.h || cab.height || 720);
  const depth = parseInt(cab.d || cab.depth || 560);
  const plinthHeight = parseInt(cab.plinthH || cab.plinthHeight || 100);
  const carcassThickness = parseInt(cab.carcassPly || cab.carcassThickness || 18);
  const backingThickness = parseInt(cab.backPly || cab.backingThickness || 6);
  
  let carcassEdgeband = 0.8;
  let shutterEdgeband = 2.0;
  if (cab.edgebandType) {
    const val = parseFloat(cab.edgebandType);
    if (!isNaN(val)) {
      carcassEdgeband = val;
      shutterEdgeband = val;
    }
  }

  const mappedCab = {
    id: cab.id || 'CAB_' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    name: cab.name || cab.type || 'Cabinet',
    width,
    height,
    depth,
    carcassThickness,
    backingThickness,
    backingRecessOffset: 12,
    backingGrooveDepth: 6,
    carcassEdgeband,
    shutterEdgeband,
    carcassMaterial: cab.carcassMaterial || `${carcassThickness}mm Carcass Plywood`,
    backingMaterial: cab.backingMaterial || `${backingThickness}mm Back Plywood`,
    shutterMaterial: cab.shutterMaterial || '18mm Shutter Material',
    shutterType: cab.shutterType || 'double',
    numShelves: cab.numShelves !== undefined ? cab.numShelves : 1,
    plinthHeight,
    hasVerticalDivider: cab.hasVerticalDivider || false
  };

  const type = cab.type || 'base_cabinet';
  
  let parts = [];
  if (type === 'base_cabinet' || type === 'base') {
    parts = calculateBaseCabinet(mappedCab);
  } else if (type === 'wall_loft' || type === 'wall') {
    parts = calculateWallCabinet(mappedCab);
  } else if (type === 'wardrobe_box' || type === 'wardrobe') {
    parts = calculateWardrobe(mappedCab);
  } else if (type === 'drawer') {
    parts = calculateDrawerCabinet(mappedCab);
  } else if (type === 'blind_corner') {
    parts = calculateBlindCornerBase(mappedCab);
  } else if (type === 'l_corner') {
    parts = calculateLCornerBase(mappedCab);
  } else {
    parts = calculateBaseCabinet(mappedCab);
  }

  return parts.map(p => ({
    ...p,
    length: p.rawHeight || p.lengthMm || p.finHeight,
    width: p.rawWidth || p.widthMm || p.finWidth,
    lengthMm: p.rawHeight || p.lengthMm || p.finHeight,
    widthMm: p.rawWidth || p.widthMm || p.finWidth,
  }));
}

export function optimizeNesting(parts, options = {}) {
  const bladeKerf = options.bladeKerf !== undefined ? parseInt(options.bladeKerf) : 3;
  const trimMargin = options.trimMargin !== undefined ? parseInt(options.trimMargin) : 10;
  const mode = options.mode || "cnc";

  const result = nestPanels(parts, { bladeKerf, trimMargin, mode });
  
  const grouped = {};
  result.nestedSheets.forEach((ns, idx) => {
    const mat = ns.material;
    if (!grouped[mat]) {
      grouped[mat] = { sheets: [] };
    }
    
    const usedArea = ns.placedParts.reduce((acc, p) => acc + (p.w * p.h), 0);
    
    grouped[mat].sheets.push({
      id: ns.sheetId || `sheet_${idx + 1}`,
      usedArea,
      efficiency: ns.efficiency,
      panelsPlaced: ns.placedParts.map((p, pIdx) => ({
        id: p.uniqueId || `${p.partId}_p${pIdx}`,
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h,
        name: p.name || 'Panel',
        rotated: p.rotated
      }))
    });
  });
  
  return grouped;
}

export default {
  createOrRefreshCutlist,
  getCutlistByProject,
  getCutlist,
  updateCutlistModule,
  addCutlistModule,
  deleteCutlistModule,
  regenerateCutlistParts,
  buildModules,
  generatePartsForModule,
  buildSheetLayout,
  cutlistToCsv,
  MAXCUT_CSV_HEADERS,
  cutlistToMaxCutRows,
  cutlistToMaxCutCsv,
  writeCutlistPdf,
  writeJobLayoutPdf,
  rawSourcesForCutlist,
  buildCutlistAccuracyAudit,
  cutlistToExcel,
  writeJobSummaryPdf,
  writePanelLabelsPdf,
  generateCabinetParts,
  optimizeNesting,
  splitOversizePart
};
