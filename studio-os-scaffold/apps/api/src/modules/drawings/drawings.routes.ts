import { Router } from 'express';
import { CreateDrawingSetRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { drawingsService } from './drawings.service';

export const drawingsRouter = Router();

drawingsRouter.get('/projects/:projectId/drawing-sets', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await drawingsService.list(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

drawingsRouter.get('/projects/:projectId/drawing-quality', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await drawingsService.qualityPass(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

drawingsRouter.get('/scenes/:sceneVersionId/elevation-pack', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const result = await drawingsService.getElevationPack(sceneVersionId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

drawingsRouter.get('/scenes/:sceneVersionId/bom-preview', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const result = await drawingsService.getBomPreview(sceneVersionId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

drawingsRouter.post('/scenes/:sceneVersionId/drawing-sets', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const input = validateBody(CreateDrawingSetRequestSchema, req.body);
  const result = await drawingsService.create(sceneVersionId, input);
  return res.status(202).json({ success: true, data: result, meta: {}, error: null });
});
