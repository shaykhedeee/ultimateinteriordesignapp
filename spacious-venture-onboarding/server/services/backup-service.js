import fs from 'node:fs';
import path from 'node:path';
import { inspirationSeed, laminateSeed } from '../data/seed-data.js';
import { createProject, generatePackage, upsertFloorPlan } from './design-engine.js';
import { createOrRefreshCutlist } from './cutlist-engine.js';
import { getDb, rootDir, rowsToJson, storageDir } from './database.js';

const dynamicTables = [
  'generation_costs',
  'technical_drawings',
  'brief_approvals',
  'render_generation_jobs',
  'floor_plan_analyses',
  'component_color_changes',
  'render_variants',
  'render_generations',
  'user_color_preferences',
  'production_project_imports',
  'cutlist_parts',
  'cutlist_modules',
  'cutlist_projects',
  'moodboards',
  'design_packages',
  'floor_plans',
  'space_profiles',
  'render_asset_reviews',
  'render_corrections',
  'generated_assets',
  'client_projects'
];

const storageBackupRoots = ['assets', 'uploads', 'floor-plans', 'proposals', 'cutlists'];

export function exportBackupPayload({ includeFiles = true } = {}) {
  const db = getDb();
  const backup = {
    exportedAt: new Date().toISOString(),
    version: 2,
    app: 'spacious-venture-studio-os',
    includesFiles: includeFiles,
    counts: backupCounts(),
    projects: payloadRows('client_projects'),
    spaceProfiles: spaceProfileRows(),
    designPackages: payloadRows('design_packages'),
    moodboards: payloadRows('moodboards'),
    floorPlans: floorPlanRows(),
    cutlistProjects: payloadRows('cutlist_projects'),
    cutlistModules: payloadRows('cutlist_modules'),
    cutlistParts: payloadRows('cutlist_parts'),
    productionProjectImports: payloadRows('production_project_imports'),
    laminateProducts: payloadRows('laminate_products'),
    inspirationReferences: payloadRows('inspiration_references'),
    generatedAssets: generatedAssetRows(),
    renderAssetReviews: renderAssetReviewRows(),
    renderCorrections: renderCorrectionRows(),
    storageFiles: includeFiles ? collectStorageFiles() : []
  };

  return backup;

  function payloadRows(table) {
    return rowsToJson(db.prepare(`SELECT payload FROM ${table}`).all());
  }
}

export function importBackupPayload(input, { replace = false } = {}) {
  const backup = input?.backup || input;
  if (!backup || !backup.version) {
    const error = new Error('Invalid backup payload.');
    error.statusCode = 400;
    throw error;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const insertProject = db.prepare('INSERT OR REPLACE INTO client_projects (id, client_name, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
  const insertSpace = db.prepare('INSERT OR REPLACE INTO space_profiles (id, project_id, room, payload) VALUES (?, ?, ?, ?)');
  const insertPackage = db.prepare('INSERT OR REPLACE INTO design_packages (id, project_id, payload, created_at) VALUES (?, ?, ?, ?)');
  const insertMoodboard = db.prepare('INSERT OR REPLACE INTO moodboards (id, package_id, project_id, room, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insertFloorPlan = db.prepare(`
    INSERT OR REPLACE INTO floor_plans
    (project_id, file_path, preview_path, annotations, analysis, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCutlist = db.prepare('INSERT OR REPLACE INTO cutlist_projects (id, project_id, status, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const insertCutlistModule = db.prepare(`
    INSERT OR REPLACE INTO cutlist_modules
    (id, cutlist_project_id, room, module_type, name, width_mm, height_mm, depth_mm, material, finish, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCutlistPart = db.prepare(`
    INSERT OR REPLACE INTO cutlist_parts
    (id, cutlist_project_id, module_id, part_code, name, material, length_mm, width_mm, thickness_mm, quantity, edge_band, grain, notes, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertProductionImport = db.prepare(`
    INSERT OR REPLACE INTO production_project_imports
    (id, project_code, source_file, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertLaminate = db.prepare('INSERT OR REPLACE INTO laminate_products (id, payload) VALUES (?, ?)');
  const insertInspiration = db.prepare('INSERT OR REPLACE INTO inspiration_references (id, payload) VALUES (?, ?)');
  const insertAsset = db.prepare(`
    INSERT OR REPLACE INTO generated_assets
    (id, project_id, room, style, budget_tier, title, prompt, negative_prompt, file_path, tags, source_type, reusable_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRenderCorrection = db.prepare(`
    INSERT OR REPLACE INTO render_corrections
    (id, project_id, asset_id, room, mistake, correction, prompt_patch, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRenderAssetReview = db.prepare(`
    INSERT OR REPLACE INTO render_asset_reviews
    (asset_id, project_id, room, status, note, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    if (replace) {
      clearStudioRows({ clearStatic: true });
    }

    for (const project of backup.projects || []) {
      insertProject.run(project.id, project.clientName || project.client_name || 'Imported Client', JSON.stringify(project), project.createdAt || project.created_at || now, project.updatedAt || project.updated_at || now);
    }

    for (const space of backup.spaceProfiles || []) {
      insertSpace.run(space.id, space.projectId || space.project_id, space.room, JSON.stringify(space));
    }

    for (const pkg of backup.designPackages || []) {
      insertPackage.run(pkg.id, pkg.projectId || pkg.project_id, JSON.stringify(pkg), pkg.createdAt || pkg.created_at || now);
    }

    for (const board of backup.moodboards || []) {
      insertMoodboard.run(board.id, board.packageId || board.package_id, board.projectId || board.project_id, board.room, JSON.stringify(board), board.createdAt || board.created_at || now);
    }

    for (const floorPlan of backup.floorPlans || []) {
      insertFloorPlan.run(
        floorPlan.projectId || floorPlan.project_id,
        floorPlan.filePath || floorPlan.file_path || '',
        floorPlan.previewPath || floorPlan.preview_path || floorPlan.filePath || floorPlan.file_path || '',
        JSON.stringify(floorPlan.annotations || { zones: [], markers: [] }),
        JSON.stringify(floorPlan.analysis || {}),
        floorPlan.createdAt || floorPlan.created_at || now,
        floorPlan.updatedAt || floorPlan.updated_at || now
      );
    }

    for (const cutlist of backup.cutlistProjects || []) {
      insertCutlist.run(cutlist.id, cutlist.projectId || cutlist.project_id, cutlist.status || 'cutlist-draft', JSON.stringify(cutlist), cutlist.createdAt || cutlist.created_at || now, cutlist.updatedAt || cutlist.updated_at || now);
    }

    for (const module of backup.cutlistModules || []) {
      insertCutlistModule.run(
        module.id,
        module.cutlistProjectId || module.cutlist_project_id || module.cutlistId,
        module.room || 'living',
        module.moduleType || module.module_type || 'custom-storage',
        module.name || 'Imported module',
        module.widthMm || module.width_mm || 1200,
        module.heightMm || module.height_mm || 2100,
        module.depthMm || module.depth_mm || 450,
        module.material || 'BWP plywood',
        module.finish || 'Laminate',
        JSON.stringify(module),
        module.createdAt || module.created_at || now
      );
    }

    for (const part of backup.cutlistParts || []) {
      insertCutlistPart.run(
        part.id,
        part.cutlistProjectId || part.cutlist_project_id || part.cutlistId,
        part.moduleId || part.module_id,
        part.partCode || part.part_code || 'IMP-PART',
        part.name || 'Imported part',
        part.material || 'BWP plywood',
        part.lengthMm || part.length_mm || 1,
        part.widthMm || part.width_mm || 1,
        part.thicknessMm || part.thickness_mm || 18,
        part.quantity || 1,
        part.edgeBand || part.edge_band || 'All visible edges',
        part.grain || 'lengthwise',
        part.notes || '',
        JSON.stringify(part),
        part.createdAt || part.created_at || now
      );
    }

    for (const item of backup.productionProjectImports || []) {
      insertProductionImport.run(
        item.id,
        item.projectCode || item.project_code || 'Imported Project',
        item.sourceFile || item.source_file || item.originalFileName || '',
        JSON.stringify(item),
        item.createdAt || item.created_at || item.importedAt || now,
        item.updatedAt || item.updated_at || item.importedAt || now
      );
    }

    for (const laminate of backup.laminateProducts || []) {
      insertLaminate.run(laminate.id, JSON.stringify(laminate));
    }

    for (const reference of backup.inspirationReferences || []) {
      insertInspiration.run(reference.id, JSON.stringify(reference));
    }

    for (const asset of backup.generatedAssets || []) {
      insertAsset.run(
        asset.id,
        asset.projectId || asset.project_id || null,
        asset.room || 'reference',
        asset.style || 'indian-contemporary',
        asset.budgetTier || asset.budget_tier || 'premium',
        asset.title || 'Imported asset',
        asset.prompt || '',
        asset.negativePrompt || asset.negative_prompt || '',
        asset.filePath || asset.file_path || '',
        JSON.stringify(asset.tags || []),
        asset.sourceType || asset.source_type || 'imported',
        asset.reusableScore || asset.reusable_score || 75,
        asset.createdAt || asset.created_at || now
      );
    }

    for (const correction of backup.renderCorrections || []) {
      insertRenderCorrection.run(
        correction.id,
        correction.projectId || correction.project_id,
        correction.assetId || correction.asset_id || null,
        correction.room || 'general',
        correction.mistake || correction.mistakeDescription || '',
        correction.correction || correction.promptPatch || '',
        correction.promptPatch || correction.prompt_patch || correction.correction || '',
        JSON.stringify(correction),
        correction.createdAt || correction.created_at || now
      );
    }

    for (const review of backup.renderAssetReviews || []) {
      insertRenderAssetReview.run(
        review.assetId || review.asset_id,
        review.projectId || review.project_id,
        review.room || 'general',
        review.status || 'unreviewed',
        review.note || '',
        JSON.stringify(review),
        review.createdAt || review.created_at || now,
        review.updatedAt || review.updated_at || now
      );
    }
  });

  tx();
  if (replace && (!(backup.laminateProducts || []).length || !(backup.inspirationReferences || []).length)) {
    seedStaticLibraries();
  }
  restoreStorageFiles(backup.storageFiles || []);

  return {
    imported: true,
    replaced: Boolean(replace),
    counts: backupCounts(),
    importedCounts: {
      projects: (backup.projects || []).length,
      floorPlans: (backup.floorPlans || []).length,
      cutlists: (backup.cutlistProjects || []).length,
      assets: (backup.generatedAssets || []).length,
      renderAssetReviews: (backup.renderAssetReviews || []).length,
      renderCorrections: (backup.renderCorrections || []).length,
      files: (backup.storageFiles || []).length
    }
  };
}

export async function resetDemoWorkspace() {
  clearStudioRows({ clearStatic: true });
  clearStorageFolders();
  seedStaticLibraries();

  const project = createProject(demoProject());
  const floorPlanPath = writeDemoFloorPlanSvg();
  const annotations = demoFloorPlanAnnotations();
  const floorPlan = upsertFloorPlan(project.id, {
    filePath: floorPlanPath,
    previewPath: floorPlanPath,
    annotations
  });
  const generated = await generatePackage(project.id);
  const cutlist = createOrRefreshCutlist(project.id);

  return {
    reset: true,
    project,
    floorPlan,
    designPackageId: generated.designPackage.id,
    cutlistId: cutlist.id,
    counts: backupCounts()
  };
}

function generatedAssetRows() {
  const db = getDb();
  return db.prepare('SELECT * FROM generated_assets ORDER BY created_at DESC').all().map((row) => ({
    id: row.id,
    projectId: row.project_id,
    room: row.room,
    style: row.style,
    budgetTier: row.budget_tier,
    title: row.title,
    prompt: row.prompt,
    negativePrompt: row.negative_prompt || '',
    filePath: row.file_path,
    tags: JSON.parse(row.tags || '[]'),
    sourceType: row.source_type,
    reusableScore: row.reusable_score,
    createdAt: row.created_at
  }));
}

function renderCorrectionRows() {
  const db = getDb();
  return db.prepare('SELECT * FROM render_corrections ORDER BY created_at DESC').all().map((row) => ({
    id: row.id,
    projectId: row.project_id,
    assetId: row.asset_id,
    room: row.room,
    mistake: row.mistake,
    correction: row.correction,
    promptPatch: row.prompt_patch,
    payload: JSON.parse(row.payload || '{}'),
    createdAt: row.created_at
  }));
}

function renderAssetReviewRows() {
  const db = getDb();
  return db.prepare('SELECT * FROM render_asset_reviews ORDER BY updated_at DESC').all().map((row) => ({
    assetId: row.asset_id,
    projectId: row.project_id,
    room: row.room,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

function floorPlanRows() {
  const db = getDb();
  return db.prepare('SELECT * FROM floor_plans ORDER BY updated_at DESC').all().map((row) => ({
    projectId: row.project_id,
    filePath: row.file_path,
    previewPath: row.preview_path,
    annotations: JSON.parse(row.annotations || '{"zones":[],"markers":[]}'),
    analysis: JSON.parse(row.analysis || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

function spaceProfileRows() {
  const db = getDb();
  return db.prepare('SELECT id, project_id, room, payload FROM space_profiles ORDER BY project_id, room').all().map((row) => ({
    id: row.id,
    projectId: row.project_id,
    room: row.room,
    ...JSON.parse(row.payload || '{}')
  }));
}

function collectStorageFiles() {
  const files = [];
  for (const folder of storageBackupRoots) {
    const absoluteFolder = path.join(storageDir, folder);
    if (!fs.existsSync(absoluteFolder)) continue;
    walkStorageFolder(absoluteFolder, files);
  }
  return files;
}

function walkStorageFolder(folder, files) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const absolute = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      walkStorageFolder(absolute, files);
      continue;
    }
    if (entry.name.endsWith('.sqlite') || entry.name.endsWith('.sqlite-wal') || entry.name.endsWith('.sqlite-shm')) continue;
    const relativePath = path.relative(rootDir, absolute).replace(/\\/g, '/');
    const stat = fs.statSync(absolute);
    files.push({
      path: relativePath,
      size: stat.size,
      mimeType: mimeTypeFor(absolute),
      contentBase64: fs.readFileSync(absolute).toString('base64')
    });
  }
}

function restoreStorageFiles(files) {
  for (const file of files) {
    if (!file?.path || !file.contentBase64) continue;
    const absolute = safeStoragePath(file.path);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, Buffer.from(file.contentBase64, 'base64'));
  }
}

function safeStoragePath(filePath) {
  let relativePath = String(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
  if (relativePath.startsWith('storage/')) {
    relativePath = relativePath.slice('storage/'.length);
  }
  const absolute = path.resolve(storageDir, relativePath);
  if (absolute !== storageDir && !absolute.startsWith(`${storageDir}${path.sep}`)) {
    throw new Error('Backup file path is outside storage.');
  }
  return absolute;
}

function clearStudioRows({ clearStatic = false } = {}) {
  const db = getDb();
  db.prepare('PRAGMA foreign_keys = OFF').run();
  try {
    for (const table of dynamicTables) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
    if (clearStatic) {
      db.prepare('DELETE FROM laminate_products').run();
      db.prepare('DELETE FROM inspiration_references').run();
    }
  } finally {
    db.prepare('PRAGMA foreign_keys = ON').run();
  }
}

function clearStorageFolders() {
  for (const folder of storageBackupRoots) {
    const absoluteFolder = path.join(storageDir, folder);
    fs.rmSync(absoluteFolder, { recursive: true, force: true });
    fs.mkdirSync(absoluteFolder, { recursive: true });
  }
}

function seedStaticLibraries() {
  const db = getDb();
  const insertLaminate = db.prepare('INSERT OR REPLACE INTO laminate_products (id, payload) VALUES (?, ?)');
  laminateSeed.forEach((item, index) => {
    insertLaminate.run(`lam-${index + 1}`, JSON.stringify({ id: `lam-${index + 1}`, ...item }));
  });

  const insertInspiration = db.prepare('INSERT OR REPLACE INTO inspiration_references (id, payload) VALUES (?, ?)');
  inspirationSeed.forEach((item, index) => {
    insertInspiration.run(`insp-${index + 1}`, JSON.stringify({ id: `insp-${index + 1}`, consent: 'curated-link-only', ...item }));
  });
}

function backupCounts() {
  const db = getDb();
  return {
    projects: countRows('client_projects'),
    floorPlans: countRows('floor_plans'),
    designPackages: countRows('design_packages'),
    moodboards: countRows('moodboards'),
    generatedAssets: countRows('generated_assets'),
    renderAssetReviews: countRows('render_asset_reviews'),
    renderCorrections: countRows('render_corrections'),
    cutlistProjects: countRows('cutlist_projects'),
    cutlistModules: countRows('cutlist_modules'),
    cutlistParts: countRows('cutlist_parts'),
    laminateProducts: countRows('laminate_products'),
    inspirationReferences: countRows('inspiration_references')
  };

  function countRows(table) {
    return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  }
}

function demoProject() {
  return {
    clientName: 'Mr. & Mrs. Iyer Residence',
    clientEmail: 'iyer.family@example.com',
    clientPhone: '+91 98765 43210',
    city: 'Bengaluru',
    homeType: '3bhk',
    budgetTier: 'premium',
    timeline: '48-hour first design presentation, 6-week production handoff',
    primaryStyle: 'indian-contemporary',
    luxuryLevel: 'warm-luxury',
    selectedSpaces: ['living', 'kitchen', 'master', 'kids', 'pooja', 'foyer', 'study'],
    floorPlanNotes: 'Living opens into dining. TV wall preferred on the long west wall. Kitchen must support heavy Indian cooking and concealed utility storage.',
    familyProfile: ['family-of-four', 'parents-visiting', 'child-friendly'],
    cookingStyle: 'heavy-indian',
    poojaNeed: 'dedicated-pooja',
    storageHabits: 'Daily-use storage should be closed, easy-clean, and mapped to wardrobes, foyer, study, and utility.',
    finishTolerance: ['matte', 'anti-fingerprint', 'easy-clean', 'child-safe'],
    dislikedMaterials: 'Avoid blue-grey glossy shutters and overly ornate gold panels.',
    notes: 'Premium warm contemporary home with teak, sage, brass accents, fluted TV wall, practical modular kitchen, and production-ready cutlist assumptions.',
    referenceLinks: 'Curated Indian contemporary TV wall, sage kitchen, compact pooja niche, and warm master wardrobe references.'
  };
}

function demoFloorPlanAnnotations() {
  const zones = [
    { id: 'zone-living', label: 'Living Room', room: 'living', x: 8, y: 13, width: 38, height: 31, note: 'Main client presentation space with TV wall and seating.' },
    { id: 'zone-kitchen', label: 'Kitchen', room: 'kitchen', x: 56, y: 12, width: 30, height: 24, note: 'L-shaped modular kitchen with tall pantry and utility link.' },
    { id: 'zone-master', label: 'Master Bedroom', room: 'master', x: 8, y: 55, width: 30, height: 30, note: 'Wardrobe and calm warm-luxury palette.' },
    { id: 'zone-kids', label: 'Kids Bedroom', room: 'kids', x: 44, y: 56, width: 24, height: 28, note: 'Study desk, toy storage, and child-safe finishes.' },
    { id: 'zone-pooja', label: 'Pooja', room: 'pooja', x: 72, y: 52, width: 16, height: 18, note: 'Compact mandir visible from living/dining axis.' }
  ];

  const markers = [
    { id: 'm-tv', room: 'living', type: 'TV Unit', x: 12, y: 18, placementNote: 'Long west wall, opposite sofa.', sizeNote: 'Approx 9 ft floating unit', furnitureRequirement: 'floating walnut TV unit with fluted backing, beige marble slab, concealed wiring, brass profile accents' },
    { id: 'm-sofa', room: 'living', type: 'Sofa', x: 33, y: 37, placementNote: 'Face the TV wall with circulation behind.', sizeNote: '3+2 seater', furnitureRequirement: 'sage green sectional sofa with washable textured fabric and nested round tables' },
    { id: 'm-kitchen-run', room: 'kitchen', type: 'Kitchen Run', x: 59, y: 18, placementNote: 'Main cooking wall with chimney and spice pullout.', sizeNote: '10 ft + 7 ft L run', furnitureRequirement: 'sage anti-fingerprint shutters, quartz counter, tall pantry, appliance garage, oil/spice pullouts' },
    { id: 'm-wardrobe', room: 'master', type: 'Wardrobe', x: 14, y: 60, placementNote: 'Full-height wardrobe along entry wall.', sizeNote: '8 ft width', furnitureRequirement: 'matte cashmere wardrobe with walnut open niche, loft, internal drawers, and soft-close hardware' },
    { id: 'm-mandir', room: 'pooja', type: 'Mandir', x: 79, y: 60, placementNote: 'Niche near living/dining, keep ventilated and easy to clean.', sizeNote: '4 ft compact mandir', furnitureRequirement: 'ivory mandir cabinet with CNC jali shutters, brass bell rail, warm LED, and stone back panel' }
  ];

  return { zones, markers };
}

function writeDemoFloorPlanSvg() {
  const folder = path.join(storageDir, 'floor-plans');
  fs.mkdirSync(folder, { recursive: true });
  const fileName = 'demo-iyer-floor-plan.svg';
  const absolute = path.join(folder, fileName);
  fs.writeFileSync(absolute, demoFloorPlanSvg(), 'utf8');
  return `/storage/floor-plans/${fileName}`;
}

function demoFloorPlanSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 780">
  <rect width="1200" height="780" fill="#f6f1e8"/>
  <rect x="55" y="55" width="1090" height="670" fill="#fffaf1" stroke="#3b3021" stroke-width="10"/>
  <g fill="none" stroke="#5a4a35" stroke-width="6">
    <rect x="95" y="100" width="450" height="270"/>
    <rect x="645" y="100" width="360" height="210"/>
    <rect x="95" y="450" width="360" height="235"/>
    <rect x="505" y="450" width="290" height="235"/>
    <rect x="850" y="410" width="195" height="185"/>
    <path d="M545 250h100M455 565h50M795 520h55"/>
  </g>
  <g font-family="Segoe UI, Arial, sans-serif" fill="#392d1f">
    <text x="120" y="135" font-size="28" font-weight="700">Living Room</text>
    <text x="668" y="135" font-size="28" font-weight="700">Kitchen</text>
    <text x="120" y="485" font-size="28" font-weight="700">Master Bedroom</text>
    <text x="530" y="485" font-size="28" font-weight="700">Kids Bedroom</text>
    <text x="875" y="448" font-size="28" font-weight="700">Pooja</text>
    <text x="270" y="235" font-size="18">TV Wall</text>
    <text x="780" y="210" font-size="18">L Kitchen Run</text>
    <text x="220" y="590" font-size="18">Wardrobe</text>
  </g>
  <g fill="#bd934a">
    <circle cx="160" cy="170" r="12"/>
    <circle cx="395" cy="315" r="12"/>
    <circle cx="705" cy="180" r="12"/>
    <circle cx="165" cy="510" r="12"/>
    <circle cx="945" cy="500" r="12"/>
  </g>
</svg>`;
}

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.json') return 'application/json';
  return 'application/octet-stream';
}
