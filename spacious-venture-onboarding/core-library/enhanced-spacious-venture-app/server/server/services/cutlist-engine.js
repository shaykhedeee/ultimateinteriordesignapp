import { nanoid } from 'nanoid';
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

function hydrateCutlist(cutlist) {
  const db = getDb();
  const moduleRows = db.prepare('SELECT payload FROM cutlist_modules WHERE cutlist_project_id = ? ORDER BY created_at, name').all(cutlist.id);
  const partRows = db.prepare('SELECT payload FROM cutlist_parts WHERE cutlist_project_id = ? ORDER BY part_code').all(cutlist.id);
  return {
    ...cutlist,
    modules: moduleRows.map(rowToJson),
    parts: partRows.map(rowToJson)
  };
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

function calculateTotals(parts) {
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
    estimatedEdgeBandM: Number(edgeBandM.toFixed(1))
  };
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
