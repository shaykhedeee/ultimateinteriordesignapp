import { Router } from 'express';
import { UuidSchema } from '@studio/contracts';
import { timelineService } from './timeline.service';

export const timelineRouter = Router();

timelineRouter.get('/projects/:projectId/timeline', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const data = await timelineService.list(projectId);
  return res.json({ success: true, data: { projectId, events: data }, meta: {}, error: null });
});
