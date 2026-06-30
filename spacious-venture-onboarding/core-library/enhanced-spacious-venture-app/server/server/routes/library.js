import express from 'express';
import { getDb, rowsToJson } from '../services/database.js';
import { findReusableAssets } from '../services/design-engine.js';

export const libraryRouter = express.Router();

libraryRouter.get('/assets', (req, res, next) => {
  try {
    const rooms = req.query.room ? [req.query.room] : undefined;
    const items = findReusableAssets({
      room: req.query.room,
      rooms,
      style: req.query.style,
      budgetTier: req.query.budget
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

libraryRouter.get('/export', (req, res, next) => {
  try {
    const db = getDb();
    const backup = {
      exportedAt: new Date().toISOString(),
      version: 1,
      projects: rowsToJson(db.prepare('SELECT payload FROM client_projects').all()),
      designPackages: rowsToJson(db.prepare('SELECT payload FROM design_packages').all()),
      moodboards: rowsToJson(db.prepare('SELECT payload FROM moodboards').all()),
      cutlistProjects: rowsToJson(db.prepare('SELECT payload FROM cutlist_projects').all()),
      cutlistModules: rowsToJson(db.prepare('SELECT payload FROM cutlist_modules').all()),
      cutlistParts: rowsToJson(db.prepare('SELECT payload FROM cutlist_parts').all()),
      laminateProducts: rowsToJson(db.prepare('SELECT payload FROM laminate_products').all()),
      inspirationReferences: rowsToJson(db.prepare('SELECT payload FROM inspiration_references').all()),
      generatedAssets: db.prepare('SELECT * FROM generated_assets ORDER BY created_at DESC').all().map((row) => ({
        id: row.id,
        projectId: row.project_id,
        room: row.room,
        style: row.style,
        budgetTier: row.budget_tier,
        title: row.title,
        prompt: row.prompt,
        filePath: row.file_path,
        tags: JSON.parse(row.tags || '[]'),
        sourceType: row.source_type,
        reusableScore: row.reusable_score,
        createdAt: row.created_at
      }))
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="spacious-venture-backup.json"');
    res.json(backup);
  } catch (err) {
    next(err);
  }
});

libraryRouter.post('/import', (req, res, next) => {
  try {
    const db = getDb();
    const backup = req.body || {};
    if (!backup.version) return res.status(400).json({ error: 'Invalid backup payload.' });

    const insertAsset = db.prepare(`
      INSERT OR REPLACE INTO generated_assets
      (id, project_id, room, style, budget_tier, title, prompt, negative_prompt, file_path, tags, source_type, reusable_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertProject = db.prepare('INSERT OR REPLACE INTO client_projects (id, client_name, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
    const insertPackage = db.prepare('INSERT OR REPLACE INTO design_packages (id, project_id, payload, created_at) VALUES (?, ?, ?, ?)');
    const insertMoodboard = db.prepare('INSERT OR REPLACE INTO moodboards (id, package_id, project_id, room, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)');
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

    const tx = db.transaction(() => {
      for (const project of backup.projects || []) {
        insertProject.run(project.id, project.clientName || 'Imported Client', JSON.stringify(project), project.createdAt || new Date().toISOString(), project.updatedAt || new Date().toISOString());
      }
      for (const pkg of backup.designPackages || []) {
        insertPackage.run(pkg.id, pkg.projectId, JSON.stringify(pkg), pkg.createdAt || new Date().toISOString());
      }
      for (const board of backup.moodboards || []) {
        insertMoodboard.run(board.id, board.packageId, board.projectId, board.room, JSON.stringify(board), board.createdAt || new Date().toISOString());
      }
      for (const cutlist of backup.cutlistProjects || []) {
        insertCutlist.run(cutlist.id, cutlist.projectId, cutlist.status || 'cutlist-draft', JSON.stringify(cutlist), cutlist.createdAt || new Date().toISOString(), cutlist.updatedAt || new Date().toISOString());
      }
      for (const module of backup.cutlistModules || []) {
        insertCutlistModule.run(
          module.id,
          module.cutlistProjectId || module.cutlist_project_id || module.cutlistId,
          module.room,
          module.moduleType || module.module_type,
          module.name,
          module.widthMm || module.width_mm,
          module.heightMm || module.height_mm,
          module.depthMm || module.depth_mm,
          module.material,
          module.finish,
          JSON.stringify(module),
          module.createdAt || new Date().toISOString()
        );
      }
      for (const part of backup.cutlistParts || []) {
        insertCutlistPart.run(
          part.id,
          part.cutlistProjectId || part.cutlist_project_id || part.cutlistId,
          part.moduleId || part.module_id,
          part.partCode || part.part_code,
          part.name,
          part.material,
          part.lengthMm || part.length_mm,
          part.widthMm || part.width_mm,
          part.thicknessMm || part.thickness_mm,
          part.quantity,
          part.edgeBand || part.edge_band,
          part.grain,
          part.notes || '',
          JSON.stringify(part),
          part.createdAt || new Date().toISOString()
        );
      }
      for (const asset of backup.generatedAssets || []) {
        insertAsset.run(
          asset.id,
          asset.projectId || null,
          asset.room || 'reference',
          asset.style || 'indian-contemporary',
          asset.budgetTier || 'premium',
          asset.title || 'Imported asset',
          asset.prompt || '',
          asset.negativePrompt || '',
          asset.filePath || '',
          JSON.stringify(asset.tags || []),
          asset.sourceType || 'imported',
          asset.reusableScore || 75,
          asset.createdAt || new Date().toISOString()
        );
      }
    });
    tx();
    res.json({ imported: true, assets: (backup.generatedAssets || []).length, projects: (backup.projects || []).length });
  } catch (err) {
    next(err);
  }
});

libraryRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Library API error' });
});
