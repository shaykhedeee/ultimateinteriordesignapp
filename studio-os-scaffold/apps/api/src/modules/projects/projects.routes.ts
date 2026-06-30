import { Router } from 'express';
import { CreateProjectRequestSchema, TransitionProjectRequestSchema, UpdateProjectRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { projectsService } from './projects.service';

export const projectsRouter: Router = Router();

projectsRouter.get('/projects', async (_req, res) => {
  const projects = await projectsService.listProjects();
  return res.json({ success: true, data: projects, meta: {}, error: null });
});

projectsRouter.post('/projects', async (req, res) => {
  const input = validateBody(CreateProjectRequestSchema, req.body);
  const project = await projectsService.createProject(input);
  return res.status(201).json({ success: true, data: project, meta: {}, error: null });
});

projectsRouter.get('/projects/:projectId', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const project = await projectsService.getProject(projectId);
  return res.json({ success: true, data: project, meta: {}, error: null });
});

projectsRouter.patch('/projects/:projectId', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(UpdateProjectRequestSchema, req.body);
  const project = await projectsService.updateProject(projectId, input);
  return res.json({ success: true, data: project, meta: {}, error: null });
});

projectsRouter.post('/projects/:projectId/transition', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(TransitionProjectRequestSchema, req.body);
  const project = await projectsService.transitionProject(projectId, input.nextStage);
  return res.json({ success: true, data: project, meta: {}, error: null });
});
