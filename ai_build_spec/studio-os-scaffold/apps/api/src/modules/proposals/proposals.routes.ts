import { Router } from 'express';
import { CreateProposalSetRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { proposalsService } from './proposals.service';

export const proposalsRouter = Router();

proposalsRouter.get('/projects/:projectId/proposal-sets', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await proposalsService.list(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

proposalsRouter.post('/projects/:projectId/proposal-sets', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(CreateProposalSetRequestSchema, req.body);
  const result = await proposalsService.create(projectId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});
