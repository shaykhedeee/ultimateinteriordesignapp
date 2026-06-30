import { Router } from 'express';
import { CreateRenderSetRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { rendersService } from './renders.service';

export const rendersRouter: Router = Router();

rendersRouter.get('/projects/:projectId/render-sets', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await rendersService.list(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.get('/projects/:projectId/render-feedback', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await rendersService.listFeedback(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.get('/projects/:projectId/render-memory', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await rendersService.getRenderMemory(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.get('/projects/:projectId/render-suggestions', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const roomRef = typeof req.query.roomRef === 'string' ? req.query.roomRef : undefined;
  const variantCount = typeof req.query.variantCount === 'string' ? Number(req.query.variantCount) : 3;
  const result = await rendersService.getSuggestedVariants(projectId, roomRef, variantCount);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.get('/projects/:projectId/walkthrough-cameras', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await rendersService.listWalkthroughCameras(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.post('/scenes/:sceneVersionId/render-sets', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const input = validateBody(CreateRenderSetRequestSchema, req.body);
  const result = await rendersService.create(sceneVersionId, input);
  return res.status(202).json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.post('/render-variants/:variantId/approve', async (req, res) => {
  const variantId = UuidSchema.parse(req.params.variantId);
  const result = await rendersService.approveVariant(variantId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.post('/render-variants/:variantId/reject', async (req, res) => {
  const variantId = UuidSchema.parse(req.params.variantId);
  const result = await rendersService.rejectVariant(variantId, req.body.note);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.post('/render-variants/:variantId/shortlist', async (req, res) => {
  const variantId = UuidSchema.parse(req.params.variantId);
  const result = await rendersService.shortlistVariant(variantId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

rendersRouter.post('/scenes/:sceneVersionId/walkthrough-cameras/generate', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const result = await rendersService.generateWalkthroughCameras(sceneVersionId);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});
