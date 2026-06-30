import { Router } from 'express';
import { InterpretFloorPlanRequestSchema, ReviewFloorPlanRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { floorPlansService } from './floorplans.service';

export const floorPlansRouter = Router();

floorPlansRouter.post('/projects/:projectId/floor-plan/interpret', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(InterpretFloorPlanRequestSchema, req.body);
  const result = await floorPlansService.interpret(projectId, input);
  return res.status(202).json({ success: true, data: result, meta: {}, error: null });
});

floorPlansRouter.get('/projects/:projectId/floor-plan/versions', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await floorPlansService.listVersions(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

floorPlansRouter.post('/floor-plan-versions/:versionId/review', async (req, res) => {
  const versionId = UuidSchema.parse(req.params.versionId);
  const input = validateBody(ReviewFloorPlanRequestSchema, req.body);
  const result = await floorPlansService.review(versionId, input);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

floorPlansRouter.post('/floor-plan-versions/:versionId/source', async (req, res) => {
  const versionId = UuidSchema.parse(req.params.versionId);
  const result = await floorPlansService.attachSource(versionId, {
    assetName: String(req.body.assetName ?? 'uploaded-floorplan.png'),
    imageDataUrl: String(req.body.imageDataUrl ?? ''),
    widthPx: Number(req.body.widthPx ?? 1000),
    heightPx: Number(req.body.heightPx ?? 700),
  });
  return res.json({ success: true, data: result, meta: {}, error: null });
});

floorPlansRouter.post('/floor-plan-versions/:versionId/overlay', async (req, res) => {
  const versionId = UuidSchema.parse(req.params.versionId);
  const result = await floorPlansService.saveOverlay(versionId, {
    calibrationPoints: Array.isArray(req.body.calibrationPoints) ? req.body.calibrationPoints : [],
    markers: Array.isArray(req.body.markers) ? req.body.markers : [],
  });
  return res.json({ success: true, data: result, meta: {}, error: null });
});

floorPlansRouter.post('/floor-plan-versions/:versionId/calibrate', async (req, res) => {
  const versionId = UuidSchema.parse(req.params.versionId);
  const result = await floorPlansService.calibrate(versionId, {
    referenceName: String(req.body.referenceName ?? 'Known wall'),
    knownDistanceMm: Number(req.body.knownDistanceMm ?? 3000),
    pixelDistance: Number(req.body.pixelDistance ?? 1000),
  });
  return res.json({ success: true, data: result, meta: {}, error: null });
});

floorPlansRouter.post('/floor-plan-versions/:versionId/annotate', async (req, res) => {
  const versionId = UuidSchema.parse(req.params.versionId);
  const result = await floorPlansService.annotate(versionId, {
    rooms: req.body.rooms ?? [],
    modules: req.body.modules ?? [],
    references: req.body.references ?? [],
  });
  return res.json({ success: true, data: result, meta: {}, error: null });
});

floorPlansRouter.post('/floor-plan-versions/:versionId/finalize', async (req, res) => {
  const versionId = UuidSchema.parse(req.params.versionId);
  const result = await floorPlansService.finalize(versionId);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});
