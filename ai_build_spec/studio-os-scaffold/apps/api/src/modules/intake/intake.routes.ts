import { Router } from 'express';
import { SaveIntakeRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { intakeService } from './intake.service';

export const intakeRouter = Router();

intakeRouter.get('/projects/:projectId/intake/current', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const current = await intakeService.getCurrent(projectId);
  return res.json({ success: true, data: current, meta: {}, error: null });
});

intakeRouter.post('/projects/:projectId/intake', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(SaveIntakeRequestSchema, req.body);
  const saved = await intakeService.save(projectId, input.payload);
  return res.status(201).json({ success: true, data: saved, meta: {}, error: null });
});

intakeRouter.post('/projects/:projectId/intake/complete', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await intakeService.complete(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});
