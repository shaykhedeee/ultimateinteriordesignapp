import { Router } from 'express';
import { UuidSchema } from '@studio/contracts';
import { inboxService } from './inbox.service';

export const inboxRouter = Router();

inboxRouter.get('/projects/:projectId/inbox', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const data = await inboxService.list(projectId);
  return res.json({ success: true, data, meta: {}, error: null });
});

inboxRouter.post('/projects/:projectId/inbox', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const data = await inboxService.create(projectId, {
    observationType: String(req.body.observationType ?? 'general'),
    title: String(req.body.title ?? 'Untitled inbox item'),
    detail: req.body.detail ? String(req.body.detail) : undefined,
    disposition: req.body.disposition ?? 'human_review',
  });
  return res.status(201).json({ success: true, data, meta: {}, error: null });
});

inboxRouter.post('/inbox/:inboxId/status', async (req, res) => {
  const inboxId = UuidSchema.parse(req.params.inboxId);
  const status = String(req.body.status ?? 'triaged') as 'new' | 'triaged' | 'in_progress' | 'done';
  const data = await inboxService.updateStatus(inboxId, status);
  return res.json({ success: true, data, meta: {}, error: null });
});
