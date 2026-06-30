import { Router } from 'express';
import { PlaceModuleRequestSchema, ScenePatchRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { scenesService } from './scenes.service';

export const scenesRouter = Router();

scenesRouter.get('/projects/:projectId/scenes', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const scenes = await scenesService.listScenes(projectId);
  return res.json({ success: true, data: scenes, meta: {}, error: null });
});

scenesRouter.get('/projects/:projectId/scenes/compare', async (req, res) => {
  const left = UuidSchema.parse(String(req.query.left));
  const right = UuidSchema.parse(String(req.query.right));
  const result = await scenesService.compareScenes(left, right);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

scenesRouter.post('/scenes/:sceneVersionId/branch', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const branchName = String(req.body.branchName ?? `option_${Date.now()}`);
  const reason = req.body.reason ? String(req.body.reason) : undefined;
  const result = await scenesService.branchScene(sceneVersionId, branchName, reason);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

scenesRouter.post('/scenes/:sceneVersionId/lock', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const reason = req.body.reason ? String(req.body.reason) : undefined;
  const result = await scenesService.lockScene(sceneVersionId, reason);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

scenesRouter.post('/scenes/:sceneVersionId/unlock', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const note = req.body.note ? String(req.body.note) : undefined;
  const result = await scenesService.unlockScene(sceneVersionId, note);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

scenesRouter.get('/scenes/:sceneVersionId', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const scene = await scenesService.getScene(sceneVersionId);
  return res.json({ success: true, data: scene, meta: {}, error: null });
});

scenesRouter.post('/scenes/:sceneVersionId/patch', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const input = validateBody(ScenePatchRequestSchema, req.body);
  const result = await scenesService.patchScene(sceneVersionId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

scenesRouter.post('/scenes/:sceneVersionId/modules', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const input = validateBody(PlaceModuleRequestSchema, req.body);
  const module = await scenesService.placeModule(sceneVersionId, input);
  return res.status(201).json({ success: true, data: module, meta: {}, error: null });
});

scenesRouter.post('/scenes/:sceneVersionId/modules/:moduleId/duplicate', async (req, res) => {
  const sceneVersionId = UuidSchema.parse(req.params.sceneVersionId);
  const moduleId = UuidSchema.parse(req.params.moduleId);
  const result = await scenesService.duplicateModule(sceneVersionId, moduleId);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});
