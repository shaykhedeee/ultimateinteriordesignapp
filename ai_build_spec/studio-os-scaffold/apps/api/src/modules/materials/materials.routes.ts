import { Router } from 'express';
import { UuidSchema } from '@studio/contracts';
import { materialsService } from './materials.service';

export const materialsRouter = Router();

materialsRouter.get('/material-catalog', async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const budgetBand = typeof req.query.budgetBand === 'string' ? req.query.budgetBand : undefined;
  const roomType = typeof req.query.roomType === 'string' ? req.query.roomType : undefined;
  const data = await materialsService.list({ category, budgetBand, roomType });
  return res.json({ success: true, data, meta: {}, error: null });
});

materialsRouter.get('/projects/:projectId/material-recommendations', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const roomType = typeof req.query.roomType === 'string' ? req.query.roomType : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const data = await materialsService.recommend(projectId, { roomType, category });
  return res.json({ success: true, data, meta: {}, error: null });
});

materialsRouter.post('/material-catalog', async (req, res) => {
  const projectId = req.body.projectId ? UuidSchema.parse(req.body.projectId) : undefined;
  const data = await materialsService.create(projectId, {
    category: String(req.body.category),
    subcategory: req.body.subcategory ? String(req.body.subcategory) : undefined,
    code: req.body.code ? String(req.body.code) : undefined,
    name: String(req.body.name),
    brand: req.body.brand ? String(req.body.brand) : undefined,
    metadata: req.body.metadata ?? {},
    pricing: req.body.pricing ?? {},
    isActive: req.body.isActive ?? true,
  });
  return res.status(201).json({ success: true, data, meta: {}, error: null });
});

materialsRouter.patch('/material-catalog/:materialId', async (req, res) => {
  const materialId = UuidSchema.parse(req.params.materialId);
  const projectId = req.body.projectId ? UuidSchema.parse(req.body.projectId) : undefined;
  const data = await materialsService.update(projectId, materialId, req.body);
  return res.json({ success: true, data, meta: {}, error: null });
});
