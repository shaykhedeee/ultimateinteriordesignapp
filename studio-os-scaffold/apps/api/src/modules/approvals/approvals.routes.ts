import { Router } from 'express';
import { ApprovalDecisionRequestSchema, CreateApprovalPackageRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { approvalsService } from './approvals.service';

export const approvalsRouter = Router();

approvalsRouter.get('/projects/:projectId/approval-packages', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const result = await approvalsService.list(projectId);
  return res.json({ success: true, data: result, meta: {}, error: null });
});

approvalsRouter.post('/projects/:projectId/approval-packages', async (req, res) => {
  const projectId = UuidSchema.parse(req.params.projectId);
  const input = validateBody(CreateApprovalPackageRequestSchema, req.body);
  const result = await approvalsService.create(projectId, input);
  return res.status(201).json({ success: true, data: result, meta: {}, error: null });
});

approvalsRouter.post('/approval-packages/:approvalPackageId/submit-client-decision', async (req, res) => {
  const approvalPackageId = UuidSchema.parse(req.params.approvalPackageId);
  const input = validateBody(ApprovalDecisionRequestSchema, req.body);
  const result = await approvalsService.decide(approvalPackageId, input);
  return res.json({ success: true, data: result, meta: {}, error: null });
});
