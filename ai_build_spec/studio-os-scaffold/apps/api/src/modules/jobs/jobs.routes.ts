import { Router } from 'express';
import { UuidSchema } from '@studio/contracts';
import { jobsService } from './jobs.service';

export const jobsRouter = Router();

jobsRouter.get('/projects/:projectId/jobs', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await jobsService.list(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

jobsRouter.get('/jobs/:jobId', async (req, res) => {
  const jobId = UuidSchema.parse(req.params.jobId);
  const result = await jobsService.getJob(jobId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});
