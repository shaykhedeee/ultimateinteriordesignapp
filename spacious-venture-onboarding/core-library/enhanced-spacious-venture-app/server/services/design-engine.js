import { nanoid } from 'nanoid';
import { getDb, rowToJson, rowsToJson } from './database.js';
import { evaluateVastu, ergonomicChecks } from './standards.js';
import { generateInteriorAsset } from './image-provider.js';
import { roomLabels } from '../data/seed-data.js';

export function normalizeProject(input) {
  return {
    clientName: input.clientName?.trim() || 'Walk-in Client',
    clientEmail: input.clientEmail || '',
    clientPhone: input.clientPhone || '',
    city: input.city || 'India',
    homeType: input.homeType || '3bhk',
    budgetTier: input.budgetTier || 'premium',
    timeline: input.timeline || '48-hour first design presentation',
    primaryStyle: input.primaryStyle || 'indian-contemporary',
    luxuryLevel: input.luxuryLevel || 'warm-luxury',
    selectedSpaces: Array.isArray(input.selectedSpaces) && input.selectedSpaces.length ? input.selectedSpaces : ['living', 'kitchen', 'master'],
    floorPlanNotes: input.floorPlanNotes || '',
    familyProfile: input.familyProfile || [],
    cookingStyle: input.cookingStyle || 'heavy-indian',
    poojaNeed: input.poojaNeed || 'dedicated-pooja',
    storageHabits: input.storageHabits || '',
    finishTolerance: input.finishTolerance || [],
    dislikedMaterials: input.dislikedMaterials || '',
    notes: input.notes || '',
    referenceLinks: input.referenceLinks || ''
  };
}

export function createProject(input) {
  const db = getDb();
  const project = normalizeProject(input);
  const id = nanoid(12);
  const now = new Date().toISOString();
  const record = { id, ...project, createdAt: now, updatedAt: now };
  db.prepare('INSERT INTO client_projects (id, client_name, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, record.clientName, JSON.stringify(record), now, now);

  const insertSpace = db.prepare('INSERT INTO space_profiles (id, project_id, room, payload) VALUES (?, ?, ?, ?)');
  project.selectedSpaces.forEach((room) => {
    const space = createSpaceProfile(room, project);
    insertSpace.run(space.id, id, room, JSON.stringify(space));
  });

  return record;
}

export function getProject(projectId) {
  const db = getDb();
  const project = rowToJson(db.prepare('SELECT payload FROM client_projects WHERE id = ?').get(projectId));
  if (!project) return null;
  const spaces = rowsToJson(db.prepare('SELECT payload FROM space_profiles WHERE project_id = ?').all(projectId));
  const floorPlan = getFloorPlan(projectId);
  const designPackage = getLatestPackage(projectId);
  return { ...project, spaces, floorPlan, designPackage };
}

export function getFloorPlan(projectId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM floor_plans WHERE project_id = ?').get(projectId);
  if (!row) return null;
  return {
    projectId: row.project_id,
    filePath: row.file_path,
    previewPath: row.preview_path,
    annotations: JSON.parse(row.annotations || '{"zones":[],"markers":[]}'),
    analysis: JSON.parse(row.analysis || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function upsertFloorPlan(projectId, payload) {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = getFloorPlan(projectId);
  const annotations = normalizeFloorPlanAnnotations(payload.annotations);
  const analysis = payload.analysis || buildFloorPlanAnalysis(annotations);
  const record = {
    projectId,
    filePath: payload.filePath || existing?.filePath || '',
    previewPath: payload.previewPath || payload.filePath || existing?.previewPath || '',
    annotations,
    analysis,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  db.prepare(`
    INSERT INTO floor_plans (project_id, file_path, preview_path, annotations, analysis, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
      file_path = excluded.file_path,
      preview_path = excluded.preview_path,
      annotations = excluded.annotations,
      analysis = excluded.analysis,
      updated_at = excluded.updated_at
  `).run(
    projectId,
    record.filePath,
    record.previewPath,
    JSON.stringify(record.annotations),
    JSON.stringify(record.analysis),
    record.createdAt,
    record.updatedAt
  );
  return record;
}

export async function generatePackage(projectId) {
  const db = getDb();
  const project = getProject(projectId);
  if (!project) throw new Error('Project not found');

  const packageId = nanoid(12);
  const rooms = ['whole-home', ...project.selectedSpaces];
  const moodboards = [];
  const allAssets = [];
  const laminateMatches = matchLaminates(project);
  const reuseCandidates = findReusableAssets({
    style: project.primaryStyle,
    budgetTier: project.budgetTier,
    rooms: project.selectedSpaces,
    componentTags: floorPlanTags(project, 'whole-home')
  });

  for (const room of rooms) {
    const moodboard = await buildMoodboard({ project, packageId, room, laminateMatches });
    moodboards.push(moodboard);
    allAssets.push(...moodboard.assets);
  }

  const vastu = evaluateVastu(project.selectedSpaces);
  const checks = ergonomicChecks(project);
  const designPackage = {
    id: packageId,
    projectId,
    title: `${project.clientName}'s ${styleLabel(project.primaryStyle)} Home Direction`,
    summary: buildSummary(project, laminateMatches),
    palette: buildPalette(project),
    materialStrategy: buildMaterialStrategy(project, laminateMatches),
    stylingNotes: buildStylingNotes(project),
    laminateMatches,
    reuseCandidates,
    vastu,
    checks,
    moodboards,
    createdAt: new Date().toISOString()
  };

  const insertAsset = db.prepare(`
    INSERT INTO generated_assets
    (id, project_id, room, style, budget_tier, title, prompt, negative_prompt, file_path, tags, source_type, reusable_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMoodboard = db.prepare('INSERT INTO moodboards (id, package_id, project_id, room, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)');

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO design_packages (id, project_id, payload, created_at) VALUES (?, ?, ?, ?)')
      .run(packageId, projectId, JSON.stringify(designPackage), designPackage.createdAt);
    moodboards.forEach((moodboard) => {
      insertMoodboard.run(moodboard.id, packageId, projectId, moodboard.room, JSON.stringify(moodboard), moodboard.createdAt);
    });
    allAssets.forEach((asset) => {
      insertAsset.run(
        asset.id,
        projectId,
        asset.room,
        asset.style,
        asset.budgetTier,
        asset.title,
        asset.prompt,
        asset.negativePrompt,
        asset.filePath,
        JSON.stringify(asset.tags),
        asset.sourceType,
        asset.reusableScore,
        new Date().toISOString()
      );
    });
  });
  tx();

  return { designPackage, reuseCandidates };
}

export async function regenerateRoom(projectId, room) {
  const existing = getLatestPackage(projectId);
  if (!existing) {
    return generatePackage(projectId);
  }
  const project = getProject(projectId);
  const laminateMatches = matchLaminates(project);
  const moodboard = await buildMoodboard({ project, packageId: existing.id, room, laminateMatches, variation: true });
  const moodboards = existing.moodboards.filter((item) => item.room !== room).concat(moodboard);
  const updated = { ...existing, moodboards, updatedAt: new Date().toISOString() };
  const db = getDb();
  db.prepare('UPDATE design_packages SET payload = ? WHERE id = ?').run(JSON.stringify(updated), existing.id);
  db.prepare('INSERT INTO moodboards (id, package_id, project_id, room, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(moodboard.id, existing.id, projectId, room, JSON.stringify(moodboard), moodboard.createdAt);
  const insertAsset = db.prepare(`
    INSERT INTO generated_assets
    (id, project_id, room, style, budget_tier, title, prompt, negative_prompt, file_path, tags, source_type, reusable_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  moodboard.assets.forEach((asset) => {
    insertAsset.run(asset.id, projectId, room, asset.style, asset.budgetTier, asset.title, asset.prompt, asset.negativePrompt, asset.filePath, JSON.stringify(asset.tags), asset.sourceType, asset.reusableScore, new Date().toISOString());
  });
  return { designPackage: updated };
}

export function getLatestPackage(projectId) {
  const db = getDb();
  return rowToJson(db.prepare('SELECT payload FROM design_packages WHERE project_id = ? ORDER BY created_at DESC LIMIT 1').get(projectId));
}

export function findReusableAssets({ room, style, budgetTier, rooms = [], componentTags = [] } = {}) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM generated_assets ORDER BY created_at DESC LIMIT 120').all();
  const normalizedTags = componentTags.map((tag) => String(tag).toLowerCase());
  return rows
    .filter((asset) => !room || asset.room === room || rooms.includes(asset.room))
    .filter((asset) => !style || asset.style === style)
    .filter((asset) => !budgetTier || asset.budget_tier === budgetTier)
    .map((asset) => ({ asset, matchScore: reusableAssetScore(asset, normalizedTags) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 24)
    .map((item) => assetRowToClient(item.asset));
}

export function matchLaminates(project, filters = {}) {
  const db = getDb();
  const all = rowsToJson(db.prepare('SELECT payload FROM laminate_products').all());
  const terms = [
    project.cookingStyle,
    project.primaryStyle,
    project.budgetTier,
    ...(project.finishTolerance || []),
    project.notes,
    project.storageHabits,
    filters.useCase,
    filters.finish
  ].join(' ').toLowerCase();

  return all
    .map((item) => ({ ...item, score: laminateScore(item, terms, project) }))
    .filter((item) => {
      if (filters.brand && item.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
      if (filters.finish && !item.finish.toLowerCase().includes(filters.finish.toLowerCase()) && !item.texture.toLowerCase().includes(filters.finish.toLowerCase())) return false;
      if (filters.useCase && !item.bestFor.includes(filters.useCase)) return false;
      if (filters.budget && item.budgetTier !== filters.budget && item.budgetTier !== 'premium') return false;
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

function laminateScore(item, terms, project) {
  let score = 50;
  if (item.budgetTier === project.budgetTier) score += 12;
  if (project.budgetTier === 'luxury' && item.budgetTier === 'premium') score += 6;
  if (terms.includes('anti-fingerprint') && `${item.finish} ${item.texture}`.toLowerCase().includes('fingerprint')) score += 22;
  if (terms.includes('gloss') && item.finish.toLowerCase().includes('gloss')) score += 16;
  if (terms.includes('matte') && item.finish.toLowerCase().includes('matte')) score += 16;
  if (terms.includes('fluted') && item.texture.toLowerCase().includes('fluted')) score += 18;
  if (terms.includes('kitchen') && item.bestFor.includes('kitchen')) score += 10;
  if (project.cookingStyle === 'heavy-indian' && item.bestFor.includes('kitchen')) score += 8;
  if (project.familyProfile?.includes('Kids') && item.maintenance.toLowerCase().includes('wipe')) score += 8;
  return score;
}

function createSpaceProfile(room, project) {
  return {
    id: nanoid(10),
    room,
    roomLabel: roomLabels[room] || room,
    styleDirection: project.primaryStyle,
    constraints: [
      project.cookingStyle === 'heavy-indian' && room === 'kitchen' ? 'high-suction chimney and easy-clean surfaces' : null,
      project.familyProfile?.includes('Kids') ? 'rounded edges and washable finishes' : null,
      project.poojaNeed !== 'none' && room === 'pooja' ? 'Vastu-sensitive pooja placement' : null
    ].filter(Boolean),
    budgetTier: project.budgetTier
  };
}

async function buildMoodboard({ project, packageId, room, laminateMatches, variation = false }) {
  const roomLabel = roomLabels[room] || room;
  const prompt = buildPrompt(project, room, laminateMatches, variation);
  const titles = room === 'whole-home'
    ? ['Whole-home visual language', 'Palette and material story', 'Experience centre concept board']
    : [`${roomLabel} hero render`, `${roomLabel} material close-up`, `${roomLabel} styling angle`];
  const assets = [];
  for (const title of titles) {
    const asset = await generateInteriorAsset({
      projectId: project.id,
      room,
      title,
      prompt,
      style: project.primaryStyle,
      budgetTier: project.budgetTier,
      tags: [
        project.primaryStyle,
        project.budgetTier,
        room,
        ...project.finishTolerance.slice(0, 3),
        ...floorPlanTags(project, room)
      ]
    });
    assets.push({ ...asset, url: asset.filePath });
  }
  return {
    id: nanoid(12),
    packageId,
    projectId: project.id,
    room,
    roomLabel,
    title: `${roomLabel} Moodboard`,
    rationale: buildRationale(project, room, laminateMatches),
    prompt,
    assets,
    swatches: laminateMatches.slice(0, 5).map((item) => ({
      id: item.id,
      label: `${item.brand} ${item.collection}`,
      finish: item.finish,
      hex: item.hex
    })),
    createdAt: new Date().toISOString()
  };
}

function buildPrompt(project, room, laminateMatches, variation) {
  const materialWords = laminateMatches.slice(0, 4).map((item) => `${item.brand} ${item.finish}`).join(', ');
  const layoutPrompt = floorPlanPrompt(project, room);
  return [
    `Photorealistic premium Indian ${roomLabels[room] || room} interior for ${project.clientName}, a ${project.homeType} in ${project.city}.`,
    `Style: ${styleLabel(project.primaryStyle)}, budget tier: ${project.budgetTier}, luxury level: ${project.luxuryLevel}.`,
    `Client wants: ${project.notes}`,
    `Functional details: ${project.storageHabits}; cooking: ${project.cookingStyle}; pooja: ${project.poojaNeed}; family: ${project.familyProfile.join(', ')}.`,
    layoutPrompt,
    `Materials: ${materialWords}; include warm Indian contemporary textures, selective laminates, practical hardware, and clean styling.`,
    variation ? 'Generate a fresh variation while preserving the approved palette and intent.' : 'Make it presentation-ready for a first client design reveal.'
  ].filter(Boolean).join(' ');
}

function buildRationale(project, room, laminateMatches) {
  const topLam = laminateMatches[0];
  if (room === 'whole-home') {
    return `A coordinated ${project.budgetTier} whole-home direction using ${styleLabel(project.primaryStyle)}, selective ${topLam?.finish || 'premium laminate'} finishes, Indian family practicality, and curated references instead of a generic showroom board.`;
  }
  if (room === 'kitchen') {
    return `Designed around Indian cooking, external ventilation, wipeable shutters, and ${topLam?.brand || 'premium'} finishes that hold up to oil, steam, and daily touch.`;
  }
  if (room === 'pooja') {
    return 'Balances Vastu-sensitive placement, warm light, jali detailing, brass, and a premium devotional focal point without overloading the room.';
  }
  return `Matches the client's style and budget while keeping surfaces selective, maintainable, and reusable as a future library reference.`;
}

function buildSummary(project, laminates) {
  return `A ${project.budgetTier} ${project.homeType.toUpperCase()} package for ${project.city}, shaped around ${styleLabel(project.primaryStyle)}, ${project.cookingStyle.replace('-', ' ')} cooking, ${project.familyProfile.join(', ') || 'standard family'} needs, and a curated laminate shortlist led by ${laminates[0]?.brand || 'premium Indian brands'}.`;
}

function buildMaterialStrategy(project, laminates) {
  return {
    core: project.budgetTier === 'value' ? 'BWP in wet kitchen bases; BWR/HDMR in dry carcasses.' : 'IS 710 BWP plywood for wet kitchen bases; calibrated BWR/HDMR for dry wardrobes, TV units, and lofts.',
    shutters: laminates.slice(0, 4).map((item) => `${item.brand} ${item.collection} (${item.finish})`),
    hardware: project.budgetTier === 'luxury' ? 'Hafele/Hettich premium soft-close channels, profile shutters, sensor lights.' : 'Ebco/Hettich soft-close hinges, tandem drawers, hydraulic loft stays.'
  };
}

function buildStylingNotes(project) {
  return [
    'Use brass, teak, stone, and fluted details as selective accents, not everywhere.',
    'Keep wall bases warm white or muted sage/terracotta so Indian daylight and warm LEDs do not become harsh.',
    project.familyProfile?.includes('Kids') ? 'Use rounded edges, washable paint, and anti-fingerprint shutters in kids-accessible zones.' : 'Keep high-touch zones practical and easy to clean.',
    project.dislikedMaterials ? `Avoid: ${project.dislikedMaterials}` : 'Avoid generic all-grey imported moodboards.'
  ];
}

function buildPalette(project) {
  if (project.primaryStyle === 'modern-luxury') return ['charcoal', 'champagne brass', 'smoked glass', 'warm marble'];
  if (project.primaryStyle === 'minimalist') return ['warm white', 'oak', 'stone grey', 'linen'];
  if (project.primaryStyle === 'warm-minimal') return ['ivory', 'light oak', 'greige', 'brushed brass'];
  if (project.primaryStyle === 'rustic') return ['weathered wood', 'terracotta', 'stone', 'warm cream'];
  if (project.primaryStyle === 'japandi') return ['ash wood', 'rice white', 'charcoal', 'sage'];
  if (project.primaryStyle === 'industrial') return ['black metal', 'cement grey', 'walnut', 'cognac leather'];
  if (project.primaryStyle === 'scandinavian-minimal') return ['oak', 'warm white', 'sage', 'linen'];
  if (project.primaryStyle === 'bohemian-chic') return ['terracotta', 'cane', 'olive', 'lime plaster'];
  if (project.primaryStyle === 'contemporary-classic') return ['ivory', 'walnut', 'champagne', 'soft taupe'];
  if (project.primaryStyle === 'art-deco') return ['emerald', 'brass', 'walnut', 'cream marble'];
  if (project.primaryStyle === 'indian-heritage') return ['teak', 'antique brass', 'ivory', 'deep maroon'];
  if (project.primaryStyle === 'tropical-modern') return ['rattan', 'olive', 'limewash', 'warm teak'];
  if (project.primaryStyle === 'mid-century-modern') return ['walnut', 'mustard', 'warm white', 'smoked bronze'];
  if (project.primaryStyle === 'maximalist-indian') return ['peacock green', 'terracotta', 'brass', 'patterned textile'];
  if (project.primaryStyle === 'wabi-sabi') return ['lime plaster', 'ash wood', 'clay', 'charcoal'];
  return ['teak', 'brass', 'sage', 'terracotta', 'warm ivory'];
}

function styleLabel(style) {
  return String(style || '').split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

function normalizeFloorPlanAnnotations(annotations = {}) {
  return {
    zones: Array.isArray(annotations.zones) ? annotations.zones : [],
    markers: Array.isArray(annotations.markers) ? annotations.markers : []
  };
}

function buildFloorPlanAnalysis(annotations) {
  const zones = annotations.zones || [];
  const markers = annotations.markers || [];
  return {
    zoneCount: zones.length,
    markerCount: markers.length,
    rooms: [...new Set([...zones.map((zone) => zone.room), ...markers.map((marker) => marker.room)])],
    components: [...new Set(markers.map((marker) => marker.type))],
    furnitureRequirements: markers.map((marker) => marker.furnitureRequirement).filter(Boolean)
  };
}

function floorPlanPrompt(project, room) {
  const floorPlan = project.floorPlan;
  if (!floorPlan && !project.floorPlanNotes) return '';
  const annotations = floorPlan?.annotations || { zones: [], markers: [] };
  const zones = (annotations.zones || []).filter((zone) => room === 'whole-home' || zone.room === room);
  const markers = (annotations.markers || []).filter((marker) => room === 'whole-home' || marker.room === room);
  const zoneText = zones.map((zone) => `${roomLabels[zone.room] || zone.room} zone at x${Math.round(zone.x)} y${Math.round(zone.y)} w${Math.round(zone.w)} h${Math.round(zone.h)}`).join('; ');
  const markerText = markers.map((marker) => {
    const notes = [marker.placementNote, marker.sizeNote, marker.furnitureRequirement].filter(Boolean).join(', ');
    return `${marker.type} in ${roomLabels[marker.room] || marker.room} at x${Math.round(marker.x)} y${Math.round(marker.y)}${notes ? ` (${notes})` : ''}`;
  }).join('; ');
  return [
    'Floor-plan constraints: use manual floor plan annotations as spatial guidance, not exact CAD geometry.',
    project.floorPlanNotes ? `Designer layout notes: ${project.floorPlanNotes}.` : '',
    zoneText ? `Room zones: ${zoneText}.` : '',
    markerText ? `Component placements and furniture requirements: ${markerText}.` : ''
  ].filter(Boolean).join(' ');
}

function floorPlanTags(project, room) {
  const markers = project.floorPlan?.annotations?.markers || [];
  return markers
    .filter((marker) => room === 'whole-home' || marker.room === room)
    .flatMap((marker) => [
      'floor-plan-aware',
      marker.type,
      ...(marker.furnitureRequirement || '').split(/\s+/).filter((word) => word.length > 4).slice(0, 4)
    ])
    .map((tag) => String(tag).toLowerCase().replace(/\s+/g, '-'));
}

function reusableAssetScore(asset, componentTags) {
  if (!componentTags.length) return asset.reusable_score || 80;
  const tags = JSON.parse(asset.tags || '[]').map((tag) => String(tag).toLowerCase());
  const matches = componentTags.filter((tag) => tags.includes(tag)).length;
  return (asset.reusable_score || 80) + matches * 8;
}

function assetRowToClient(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    room: row.room,
    style: row.style,
    budgetTier: row.budget_tier,
    title: row.title,
    prompt: row.prompt,
    tags: JSON.parse(row.tags || '[]'),
    url: row.file_path,
    reusableScore: row.reusable_score,
    sourceType: row.source_type
  };
}
