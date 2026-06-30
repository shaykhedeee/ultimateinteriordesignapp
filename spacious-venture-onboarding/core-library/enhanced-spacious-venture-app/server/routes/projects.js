import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { createProject, generatePackage, getProject, regenerateRoom, findReusableAssets, getFloorPlan, upsertFloorPlan } from '../services/design-engine.js';
import { createOrRefreshCutlist, getCutlistByProject } from '../services/cutlist-engine.js';
import { getDb, storageDir } from '../services/database.js';
import { generateAiSpatialLayout } from '../services/ai-spatial-engine.js';
import { editStudioRender, generateFastRenderVariants, getVisualizerCorrections, logVisualizerMistake } from '../services/visualizer-engine.js';

export const projectsRouter = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(storageDir, 'uploads'),
    filename: (_req, file, cb) => {
      const safeExt = path.extname(file.originalname || '.png') || '.png';
      cb(null, `${Date.now()}-${nanoid(8)}${safeExt}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 }
});

const floorPlanUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(storageDir, 'floor-plans'),
    filename: (_req, file, cb) => {
      const safeExt = path.extname(file.originalname || '.png') || '.png';
      cb(null, `${Date.now()}-${nanoid(8)}${safeExt}`);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

projectsRouter.post('/analyze-spatial-layout', async (req, res, next) => {
  try {
    const layout = await generateAiSpatialLayout(req.body || {}, req.body.floorPlanImageBase64);
    res.json(layout);
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        p.id,
        p.payload,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT dp.id) AS package_count,
        COUNT(DISTINCT mb.id) AS moodboard_count,
        COUNT(DISTINCT ga.id) AS asset_count,
        COUNT(DISTINCT cl.id) AS cutlist_count,
        MAX(dp.created_at) AS latest_package_at,
        CASE WHEN fp.project_id IS NULL THEN 0 ELSE 1 END AS has_floor_plan
      FROM client_projects p
      LEFT JOIN design_packages dp ON dp.project_id = p.id
      LEFT JOIN moodboards mb ON mb.project_id = p.id
      LEFT JOIN generated_assets ga ON ga.project_id = p.id
      LEFT JOIN floor_plans fp ON fp.project_id = p.id
      LEFT JOIN cutlist_projects cl ON cl.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();

    const items = rows.map((row) => projectSummary(row));
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/', (req, res, next) => {
  try {
    const project = createProject(req.body || {});
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:id', (req, res, next) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/:id/generate-package', async (req, res, next) => {
  try {
    const result = await generatePackage(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/:id/generate-room/:spaceId', async (req, res, next) => {
  try {
    const result = await regenerateRoom(req.params.id, req.params.spaceId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:id/floor-plan', (req, res, next) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ floorPlan: getFloorPlan(req.params.id) });
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:id/cutlists', (req, res, next) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ cutlist: getCutlistByProject(req.params.id) });
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/:id/cutlists', (req, res, next) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const cutlist = createOrRefreshCutlist(req.params.id);
    res.status(201).json({ cutlist });
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/:id/floor-plan', floorPlanUpload.single('file'), (req, res, next) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const annotations = parseJsonField(req.body.annotations, { zones: [], markers: [] });
    const analysis = parseJsonField(req.body.analysis, null);
    const filePath = req.file ? `/storage/floor-plans/${req.file.filename}` : undefined;
    const floorPlan = upsertFloorPlan(req.params.id, {
      filePath,
      previewPath: filePath,
      annotations,
      analysis
    });
    res.json({ floorPlan });
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/:id/assets', upload.array('assets'), (req, res, next) => {
  try {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO generated_assets
      (id, project_id, room, style, budget_tier, title, prompt, negative_prompt, file_path, tags, source_type, reusable_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const room = req.body.room || 'reference';
    const style = req.body.style || project.primaryStyle;
    const budgetTier = req.body.budgetTier || project.budgetTier;
    for (const file of req.files || []) {
      const id = nanoid(12);
      insert.run(
        id,
        req.params.id,
        room,
        style,
        budgetTier,
        file.originalname,
        `Client/team uploaded reference image for ${room}. Use as attributed inspiration only.`,
        '',
        `/storage/uploads/${file.filename}`,
        JSON.stringify(['uploaded-reference', room, style, budgetTier]),
        'uploaded-reference',
        92,
        new Date().toISOString()
      );
    }
    res.json({ items: findReusableAssets({ style, budgetTier, rooms: project.selectedSpaces }) });
  } catch (err) {
    next(err);
  }
});

function parseJsonField(value, fallback) {
  if (!value) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

function projectSummary(row) {
  const project = JSON.parse(row.payload);
  const hasProposal = proposalExists(row.id);
  const hasCutlist = Boolean(row.cutlist_count);
  const stage = hasCutlist ? 'Cutlist Project' : hasProposal ? 'PDF Brief' : row.package_count ? 'Brief Ready' : 'Intake';
  const selectedSpaces = Array.isArray(project.selectedSpaces) ? project.selectedSpaces : [];
  const readinessScore = Math.min(100, Math.round(
    25 +
    Math.min(selectedSpaces.length, 8) * 4 +
    (project.clientPhone || project.clientEmail ? 8 : 0) +
    (project.notes ? 8 : 0) +
    (row.has_floor_plan ? 18 : 0) +
    (row.package_count ? 24 : 0) +
    (hasProposal ? 13 : 0) +
    (hasCutlist ? 10 : 0)
  ));

  return {
    id: row.id,
    clientName: project.clientName,
    city: project.city,
    homeType: project.homeType,
    budgetTier: project.budgetTier,
    primaryStyle: project.primaryStyle,
    timeline: project.timeline,
    selectedSpaces,
    createdAt: project.createdAt || row.created_at,
    updatedAt: project.updatedAt || row.updated_at,
    latestPackageAt: row.latest_package_at,
    packageCount: row.package_count,
    moodboardCount: row.moodboard_count,
    assetCount: row.asset_count,
    cutlistCount: row.cutlist_count,
    hasFloorPlan: Boolean(row.has_floor_plan),
    hasProposal,
    hasCutlist,
    stage,
    readinessScore,
    nextAction: nextProjectAction({ hasProposal, hasFloorPlan: Boolean(row.has_floor_plan), packageCount: row.package_count, hasCutlist })
  };
}

function nextProjectAction({ hasProposal, hasFloorPlan, packageCount, hasCutlist }) {
  if (hasCutlist) return 'Export cutlist CSV';
  if (!hasFloorPlan) return 'Map floor plan';
  if (!packageCount) return 'Generate PDF brief';
  if (!hasProposal) return 'Export PDF brief';
  return 'Create cutlist project';
}

function proposalExists(projectId) {
  return (
    fs.existsSync(path.join(storageDir, 'proposals', `${projectId}-brief.pdf`)) ||
    fs.existsSync(path.join(storageDir, 'proposals', `${projectId}-proposal.pdf`))
  );
}

// 3D Render Studio visualizer routes
projectsRouter.get('/:id/renders', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM generated_assets WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
    const items = rows.map((row) => ({
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
      sourceType: row.source_type,
      createdAt: row.created_at
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:id/renders/mistakes', (req, res, next) => {
  try {
    res.json({ items: getVisualizerCorrections(req.params.id, req.query.room || '') });
  } catch (err) {
    next(err);
  }
});

const visualizerFields = upload.fields([
  { name: 'sitePhoto', maxCount: 1 },
  { name: 'stylePhoto', maxCount: 1 },
  { name: 'zoomedFloorPlan', maxCount: 1 },
  { name: 'fullFloorPlan', maxCount: 1 }
]);

projectsRouter.post('/:id/renders/generate', visualizerFields, async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const sitePhotoFile = req.files?.['sitePhoto']?.[0];
    const stylePhotoFile = req.files?.['stylePhoto']?.[0];
    const zoomedFloorPlanFile = req.files?.['zoomedFloorPlan']?.[0];
    const fullFloorPlanFile = req.files?.['fullFloorPlan']?.[0];

    const params = {
      room: req.body.room,
      style: req.body.style,
      budgetTier: req.body.budgetTier,
      cameraAngle: req.body.cameraAngle,
      removePeople: req.body.removePeople === 'true',
      hobSinkSwapped: req.body.hobSinkSwapped === 'true',
      chimneyOverHob: req.body.chimneyOverHob === 'true',
      loftAligned: req.body.loftAligned === 'true',
      uniformLoftHeight: req.body.uniformLoftHeight === 'true',
      concealedRafterDoors: req.body.concealedRafterDoors === 'true',
      raftersEndFirstDoor: req.body.raftersEndFirstDoor === 'true',
      backPanelMaterial: req.body.backPanelMaterial,
      sofaShape: req.body.sofaShape,
      modelTier: req.body.modelTier,
      variantCount: req.body.variantCount,
      furnitureRequirement: req.body.furnitureRequirement,
      floorPlanNotes: req.body.floorPlanNotes,
      layoutAnnotations: parseJsonField(req.body.layoutAnnotations, null),
      customInstruction: req.body.customInstruction,
      sitePhoto: sitePhotoFile ? `/storage/uploads/${sitePhotoFile.filename}` : req.body.sitePhotoBase64,
      stylePhoto: stylePhotoFile ? `/storage/uploads/${stylePhotoFile.filename}` : req.body.stylePhotoBase64,
      zoomedFloorPlan: zoomedFloorPlanFile ? `/storage/uploads/${zoomedFloorPlanFile.filename}` : req.body.zoomedFloorPlanBase64,
      fullFloorPlan: fullFloorPlanFile ? `/storage/uploads/${fullFloorPlanFile.filename}` : req.body.fullFloorPlanBase64
    };

    const result = await generateFastRenderVariants(projectId, params);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/:id/renders/edit', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { assetId, revisionRequest } = req.body;
    const asset = await editStudioRender(projectId, assetId, { revisionRequest });
    res.status(200).json({ asset });
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/:id/renders/mistake', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { assetId, mistakeDescription, correction } = req.body;
    const result = logVisualizerMistake(projectId, assetId, mistakeDescription, correction);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

projectsRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Project API error' });
});
