import path from 'node:path';
import fs from 'node:fs';
import { nanoid } from 'nanoid';
import ExcelJS from 'exceljs';
import db from '../database/database.js';

const getDb = () => db;
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

const sheetNames = {
  master: 'Sheet1',
  ply: 'PLY',
  laminate: 'LAMINATE'
};

export async function importProductionWorkbook(file, input = {}) {
  if (!file?.path) throw new Error('Upload a Spacious Venture production workbook.');
  const ext = path.extname(file.originalname || file.path || '').toLowerCase();
  const parsed = ext === '.csv' ? parseProductionCsv(file.path) : await parseProductionExcel(file.path);
  const now = new Date().toISOString();
  const projectCode = (input.projectCode || parsed.projectCode || projectCodeFromFile(file.originalname)).trim();
  const db = getDb();
  const existing = db.prepare('SELECT payload FROM production_project_imports WHERE project_code = ? ORDER BY created_at DESC').all(projectCode)
    .map(rowToJson)
    .find((item) => item.originalFileName === file.originalname);
  const payload = {
    id: existing?.id || nanoid(12),
    projectCode,
    sourceFile: file.filename,
    originalFileName: file.originalname,
    importedAt: now,
    parserVersion: parsed.parserVersion || 'spacious-production-import-v2',
    ...parsed
  };
  db.prepare(`
    INSERT OR REPLACE INTO production_project_imports (id, project_code, source_file, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(payload.id, projectCode, file.filename, JSON.stringify(payload), existing?.createdAt || existing?.importedAt || now, now);
  return payload;
}

async function parseProductionExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return parseProductionWorkbook(workbook);
}

export function listProductionImports() {
  const db = getDb();
  return db.prepare('SELECT payload FROM production_project_imports ORDER BY created_at DESC').all().map(rowToJson);
}

export function getProductionImport(id) {
  const db = getDb();
  const row = db.prepare('SELECT payload FROM production_project_imports WHERE id = ?').get(id);
  return rowToJson(row);
}

export function getProductionLearningSummary({ rooms = [], moduleTypes = [] } = {}) {
  const imports = listProductionImports();
  const wanted = new Set([...rooms, ...moduleTypes].map((item) => String(item || '').toLowerCase()).filter(Boolean));
  const allPatterns = imports.flatMap((item) => item.productionPatterns || []);
  const matched = allPatterns
    .map((pattern) => ({
      ...pattern,
      score: pattern.tokens.filter((token) => wanted.has(token)).length * 12 + Math.min(pattern.partCount, 20)
    }))
    .filter((pattern) => !wanted.size || pattern.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
  return {
    importCount: imports.length,
    sourceProjects: imports.map((item) => item.projectCode),
    matchedPatterns: matched,
    globalStandards: summarizeAcrossImports(imports)
  };
}

export function parseProductionWorkbook(workbook) {
  const master = workbook.getWorksheet(sheetNames.master) || workbook.worksheets[0];
  if (!master) throw new Error('Workbook does not contain a production cutlist sheet.');
  const modules = [];
  const parts = [];
  let activeModule = null;

  for (let excelRow = 2; excelRow <= master.rowCount; excelRow += 1) {
    const row = master.getRow(excelRow);
    const name = clean(cellDisplay(row.getCell(2)));
    const length = number(cellDisplay(row.getCell(3)));
    const width = number(cellDisplay(row.getCell(4)));
    const qty = number(cellDisplay(row.getCell(5))) || 1;
    const material = clean(cellDisplay(row.getCell(8)));
    const edgeBand = [9, 10, 11, 12].map((col) => clean(cellDisplay(row.getCell(col))));

    if (name && !material && !length && !width) {
      activeModule = createImportedModule(name, excelRow);
      modules.push(activeModule);
      continue;
    }

    if (!name || !material || !length || !width) continue;
    if (!activeModule) {
      activeModule = createImportedModule('Unassigned Production Section', excelRow);
      modules.push(activeModule);
    }
    const part = {
      id: `row-${excelRow}`,
      sourceRow: excelRow,
      moduleId: activeModule.id,
      moduleName: activeModule.name,
      room: activeModule.room,
      moduleType: activeModule.moduleType,
      name,
      partRole: partRoleFromName(name),
      lengthMm: length,
      widthMm: width,
      quantity: qty,
      material,
      board: boardFromMaterial(material),
      thicknessMm: thicknessFromMaterial(material),
      faceFinish: faceFinishFromMaterial(material),
      canRotate: rotationMode(row[6]),
      edgeBand,
      visibleEdgeCount: edgeBand.filter(Boolean).length,
      formulaLength: formulaCell(master, excelRow, 3),
      formulaWidth: formulaCell(master, excelRow, 4),
      notes: clean(cellDisplay(row.getCell(6)))
    };
    parts.push(part);
    activeModule.partIds.push(part.id);
  }

  const moduleSummaries = modules
    .map((module) => summarizeModule(module, parts.filter((part) => part.moduleId === module.id)))
    .filter((module) => module.partCount > 0);

  const materials = summarizeMaterials(parts);
  const edgeBands = summarizeEdgeBands(parts);
  const plyRequirement = parseSimpleRequirementSheet(workbook.getWorksheet(sheetNames.ply));
  const laminateRequirement = parseSimpleRequirementSheet(workbook.getWorksheet(sheetNames.laminate));
  const productionPatterns = moduleSummaries.map((module) => ({
    moduleName: module.name,
    room: module.room,
    moduleType: module.moduleType,
    partCount: module.partCount,
    pieceQuantity: module.pieceQuantity,
    commonRoles: module.commonRoles,
    materialMix: module.materialMix,
    dimensions: module.dimensions,
    tokens: keywordTokens(`${module.name} ${module.room} ${module.moduleType} ${module.commonRoles.join(' ')}`)
  }));

  return {
    projectCode: projectCodeFromRequirement(laminateRequirement) || '',
    workbookShape: {
      sheetNames: workbook.worksheets.map((sheet) => sheet.name),
      masterRows: master.rowCount,
      masterColumns: master.columnCount
    },
    summary: {
      moduleCount: moduleSummaries.length,
      partRowCount: parts.length,
      totalPanelQuantity: parts.reduce((sum, part) => sum + part.quantity, 0),
      materialCount: materials.length,
      edgeBandCount: edgeBands.length,
      sheetBasis: '2440 x 1220 mm production boards'
    },
    modules: moduleSummaries,
    parts,
    materials,
    edgeBands,
    plyRequirement,
    laminateRequirement,
    productionPatterns,
    qualityFindings: buildQualityFindings({ parts, modules: moduleSummaries, plyRequirement, laminateRequirement })
  };
}

export function parseProductionCsv(filePath) {
  const rows = parseCsvRows(fsRead(filePath));
  if (!rows.length) throw new Error('CSV file is empty.');
  const headers = rows[0].map(clean);
  const index = Object.fromEntries(headers.map((header, idx) => [header, idx]));
  const parts = rows.slice(1)
    .filter((row) => row.some((cell) => clean(cell)))
    .map((row, rowIndex) => {
      const name = clean(row[index.Name]);
      return {
        id: `csv-row-${rowIndex + 2}`,
        sourceRow: rowIndex + 2,
        moduleId: inferCsvModuleName(name),
        moduleName: inferCsvModuleName(name),
        room: inferRoom(name),
        moduleType: inferModuleType(name),
        name,
        partRole: partRoleFromName(name),
        lengthMm: number(row[index.Length]),
        widthMm: number(row[index.Width]),
        quantity: number(row[index.Quantity]) || 1,
        material: clean(row[index.Material]),
        board: boardFromMaterial(row[index.Material]),
        thicknessMm: thicknessFromMaterial(row[index.Material]),
        faceFinish: faceFinishFromMaterial(row[index.Material]),
        canRotate: clean(row[index['Can Rotate (https://feature-panel-rotation.maxcutsoftware.com)']]) || 'unspecified',
        edgeBand: [row[index['Edging Length 1']], row[index['Edging Length 2']], row[index['Edging Width 1']], row[index['Edging Width 2']]].map(clean),
        visibleEdgeCount: [row[index['Edging Length 1']], row[index['Edging Length 2']], row[index['Edging Width 1']], row[index['Edging Width 2']]].map(clean).filter(Boolean).length,
        notes: clean(row[index.Notes])
      };
    })
    .filter((part) => part.name && part.lengthMm && part.widthMm && part.material);
  const moduleMap = new Map();
  parts.forEach((part) => {
    if (!moduleMap.has(part.moduleId)) {
      moduleMap.set(part.moduleId, createImportedModule(part.moduleName, part.sourceRow));
    }
    moduleMap.get(part.moduleId).partIds.push(part.id);
  });
  const modules = [...moduleMap.values()];
  const moduleSummaries = modules
    .map((module) => summarizeModule(module, parts.filter((part) => part.moduleId === module.id || part.moduleName === module.name)))
    .filter((module) => module.partCount > 0);
  const materials = summarizeMaterials(parts);
  const edgeBands = summarizeEdgeBands(parts);
  const productionPatterns = moduleSummaries.map((module) => ({
    moduleName: module.name,
    room: module.room,
    moduleType: module.moduleType,
    partCount: module.partCount,
    pieceQuantity: module.pieceQuantity,
    commonRoles: module.commonRoles,
    materialMix: module.materialMix,
    dimensions: module.dimensions,
    tokens: keywordTokens(`${module.name} ${module.room} ${module.moduleType} ${module.commonRoles.join(' ')}`)
  }));
  return {
    projectCode: '',
    parserVersion: 'spacious-production-maxcut-csv-v1',
    workbookShape: {
      sheetNames: ['CSV'],
      masterRows: rows.length,
      masterColumns: headers.length,
      headers
    },
    summary: {
      moduleCount: moduleSummaries.length,
      partRowCount: parts.length,
      totalPanelQuantity: parts.reduce((sum, part) => sum + part.quantity, 0),
      materialCount: materials.length,
      edgeBandCount: edgeBands.length,
      sheetBasis: '2440 x 1220 mm production boards'
    },
    modules: moduleSummaries,
    parts,
    materials,
    edgeBands,
    plyRequirement: [],
    laminateRequirement: [],
    productionPatterns,
    qualityFindings: buildQualityFindings({ parts, modules: moduleSummaries, plyRequirement: [], laminateRequirement: [] })
  };
}

function createImportedModule(name, sourceRow) {
  return {
    id: slug(`${name}-${sourceRow}`),
    name,
    sourceRow,
    room: inferRoom(name),
    moduleType: inferModuleType(name),
    partIds: []
  };
}

function summarizeModule(module, moduleParts) {
  const qty = moduleParts.reduce((sum, part) => sum + part.quantity, 0);
  return {
    ...module,
    partIds: undefined,
    partCount: moduleParts.length,
    pieceQuantity: qty,
    dimensions: {
      maxLengthMm: Math.max(...moduleParts.map((part) => part.lengthMm), 0),
      maxWidthMm: Math.max(...moduleParts.map((part) => part.widthMm), 0),
      typicalDepthMm: mostCommon(moduleParts.map((part) => part.widthMm).filter((value) => value >= 250 && value <= 700))
    },
    commonRoles: topCounts(moduleParts.map((part) => part.partRole), 8).map((item) => item.name),
    materialMix: topCounts(moduleParts.map((part) => part.material), 6),
    edgeBandMix: topCounts(moduleParts.flatMap((part) => part.edgeBand).filter(Boolean), 6)
  };
}

function summarizeMaterials(parts) {
  const map = new Map();
  parts.forEach((part) => {
    const row = map.get(part.material) || {
      material: part.material,
      board: part.board,
      thicknessMm: part.thicknessMm,
      panelRows: 0,
      panelQuantity: 0,
      areaSqM: 0,
      hasGrain: materialHasGrain(part.material)
    };
    row.panelRows += 1;
    row.panelQuantity += part.quantity;
    row.areaSqM += (part.lengthMm * part.widthMm * part.quantity) / 1_000_000;
    map.set(part.material, row);
  });
  return [...map.values()]
    .map((item) => ({ ...item, areaSqM: Number(item.areaSqM.toFixed(3)) }))
    .sort((a, b) => b.panelQuantity - a.panelQuantity);
}

function summarizeEdgeBands(parts) {
  const map = new Map();
  parts.forEach((part) => {
    part.edgeBand.filter(Boolean).forEach((edge) => {
      const row = map.get(edge) || { edgeBand: edge, uses: 0, approximateMeters: 0 };
      row.uses += part.quantity;
      row.approximateMeters += ((part.lengthMm + part.widthMm) * part.quantity) / 1000;
      map.set(edge, row);
    });
  });
  return [...map.values()]
    .map((item) => ({ ...item, approximateMeters: Number(item.approximateMeters.toFixed(1)) }))
    .sort((a, b) => b.uses - a.uses);
}

function parseSimpleRequirementSheet(sheet) {
  if (!sheet) return [];
  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    const values = [];
    for (let col = 1; col <= sheet.columnCount; col += 1) {
      values.push(clean(cellDisplay(row.getCell(col))));
    }
    rows.push({ row: rowNumber, values });
  });
  return rows
    .filter((row) => row.values.some(Boolean));
}

function summarizeAcrossImports(imports) {
  const materials = new Map();
  const roles = new Map();
  imports.forEach((item) => {
    (item.materials || []).forEach((mat) => addCount(materials, mat.material, mat.panelQuantity || 0));
    (item.modules || []).forEach((module) => (module.commonRoles || []).forEach((role) => addCount(roles, role, 1)));
  });
  return {
    topMaterials: [...materials.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12),
    topPartRoles: [...roles.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12)
  };
}

function buildQualityFindings({ parts, modules, plyRequirement, laminateRequirement }) {
  const oversize = parts.filter((part) => Math.max(part.lengthMm, part.widthMm) > 2440 || Math.min(part.lengthMm, part.widthMm) > 1220);
  const noEdges = parts.filter((part) => part.visibleEdgeCount === 0 && !part.name.toLowerCase().includes('back'));
  return [
    `${modules.length} production modules/sections detected from workbook headings.`,
    `${parts.length} cutlist rows and ${parts.reduce((sum, part) => sum + part.quantity, 0)} total panel pieces detected.`,
    `${oversize.length} oversized pieces need split/special-sheet review.`,
    `${noEdges.length} non-back panels have no edge-band assignment and should be reviewed.`,
    `${plyRequirement.length ? 'PLY requirement sheet found' : 'No PLY requirement sheet found'}.`,
    `${laminateRequirement.length ? 'Laminate requirement sheet found' : 'No laminate requirement sheet found'}.`
  ];
}

function formulaCell(sheet, row, col) {
  const cell = sheet.getRow(row).getCell(col);
  const value = cell.value;
  if (value && typeof value === 'object' && 'formula' in value) return `=${value.formula}`;
  return cellDisplay(cell);
}

function cellDisplay(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('result' in value) return value.result;
    if ('text' in value) return value.text;
    if ('richText' in value) return value.richText.map((item) => item.text).join('');
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return '';
  }
  return value;
}

function partRoleFromName(value) {
  const text = String(value || '').toUpperCase();
  if (text.includes('S/P')) return 'side-panel';
  if (text.includes('TOP')) return 'top-panel';
  if (text.includes('BTM') || text.includes('T/B')) return 'bottom-panel';
  if (text.includes('BACK')) return 'back-panel';
  if (text.includes('V/P')) return 'vertical-partition';
  if (text.includes('F/S')) return 'fixed-shelf';
  if (text.includes('DR-S/P')) return 'drawer-side';
  if (text.includes('DR-BK')) return 'drawer-back';
  if (text.includes('DR-F') || text.includes('DR-FT') || text.includes('DR-F/T')) return 'drawer-front';
  if (text.includes('FACIA') || text.includes('FASCIA')) return 'fascia';
  if (text.includes('SK')) return 'skirting';
  if (text.includes('DOOR')) return 'door-shutter';
  if (text.includes('FILLER')) return 'filler';
  if (text.includes('DUMMY')) return 'dummy-panel';
  return 'panel';
}

function inferRoom(value) {
  const text = String(value || '').toUpperCase();
  if (text.includes('KITCHEN') || text.includes('KTC')) return 'kitchen';
  if (text.includes('POOJA')) return 'pooja';
  if (text.includes('TV')) return 'living';
  if (text.includes('MBR')) return 'master';
  if (text.includes('GBR') || text.includes('CBR')) return 'bedroom';
  if (text.includes('DINING')) return 'dining';
  if (text.includes('SHOE')) return 'foyer';
  if (text.includes('UTILITY')) return 'utility';
  if (text.includes('STUDY')) return 'study';
  return 'custom';
}

function inferModuleType(value) {
  const text = String(value || '').toUpperCase();
  if (text.includes('LOFT')) return 'loft';
  if (text.includes('WALL')) return 'wall-unit';
  if (text.includes('BESH') || text.includes('BASE')) return 'base-unit';
  if (text.includes('TV')) return 'tv-unit';
  if (text.includes('VANITY')) return 'vanity';
  if (text.includes('STUDY')) return 'study-unit';
  if (text.includes('SHOE')) return 'shoe-rack';
  if (text.includes('POOJA')) return 'pooja-unit';
  if (text.includes('DINING')) return 'dining-storage';
  return 'storage-module';
}

function boardFromMaterial(value) {
  const text = String(value || '').toUpperCase();
  if (text.includes('HDHMR')) return 'HDHMR';
  if (text.includes('MR')) return 'MR plywood';
  if (text.includes('BWP')) return 'BWP plywood';
  return 'Board';
}

function thicknessFromMaterial(value) {
  const match = String(value || '').match(/(\d+)\s*(?:MM|MR|HDHMR)/i);
  return match ? Number(match[1]) : 18;
}

function faceFinishFromMaterial(value) {
  const parts = String(value || '').split(/\s+/);
  return parts.slice(1).join(' ') || 'F+F';
}

function materialHasGrain(value) {
  return /\b(EH|GFP|SF|WOOD|WALNUT|VENEER)\b/i.test(String(value || ''));
}

function rotationMode(value) {
  if (String(value) === '0') return 'no';
  if (String(value) === '1') return 'yes';
  if (String(value) === '2') return 'same-as-material';
  return 'unspecified';
}

function topCounts(values, limit = 10) {
  const map = new Map();
  values.filter(Boolean).forEach((value) => addCount(map, value, 1));
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

function addCount(map, key, amount) {
  map.set(key, (map.get(key) || 0) + amount);
}

function mostCommon(values) {
  return topCounts(values, 1)[0]?.name || 0;
}

function projectCodeFromFile(fileName = '') {
  return path.basename(fileName, path.extname(fileName)).replace(/[^a-z0-9-]+/gi, ' ').trim() || 'Imported Project';
}

function fsRead(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted && ch === '"' && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (!quoted && ch === ',') {
      row.push(cell);
      cell = '';
    } else if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function inferCsvModuleName(name = '') {
  const text = clean(name).toUpperCase();
  const suffixPattern = /\s+(SP-G|SP-|TOP-G|TOP|BOT-G|BOT|BOTTOM|FS|RS|LS|BACK|DOOR|DUMMY|FILLER|SIDE-G|FRONT-G|FRONT|FACIA|FACIYA|FASCIA|VP|V\/P|SK|SKIRTING|SHELF|SHUTTER|DRAWER|PANEL)$/;
  let next = text;
  let previous = '';
  while (next !== previous) {
    previous = next;
    next = next.replace(suffixPattern, '').trim();
  }
  return clean(next) || 'Imported CSV Module';
}

function projectCodeFromRequirement(rows) {
  const flat = rows.flatMap((row) => row.values || []).filter(Boolean).join(' ');
  const match = flat.match(/\bC\d{3,}\b/i);
  return match?.[0] || '';
}

function clean(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function number(value) {
  const cleaned = clean(value).replace(/,/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function slug(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || nanoid(8);
}

function keywordTokens(value) {
  return [...new Set(clean(value).toLowerCase().split(/[^a-z0-9]+/).filter((item) => item.length > 2))].slice(0, 20);
}
