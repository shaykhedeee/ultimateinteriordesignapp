import { Router } from 'express';
import { CreateLeadRequestSchema, UuidSchema } from '@studio/contracts';
import { validateBody } from '../../lib/validate';
import { leadsService } from './leads.service';

export const leadsRouter = Router();

leadsRouter.get('/leads', async (_req, res) => {
  const leads = await leadsService.listLeads();
  return res.json({ success: true, data: leads, meta: {}, error: null });
});

leadsRouter.post('/leads', async (req, res) => {
  const input = validateBody(CreateLeadRequestSchema, req.body);
  const lead = await leadsService.createLead(input);

  return res.status(201).json({
    success: true,
    data: lead,
    meta: {},
    error: null,
  });
});

leadsRouter.post('/leads/:leadId/qualify', async (req, res) => {
  const leadId = UuidSchema.parse(req.params.leadId);
  const lead = await leadsService.qualifyLead(leadId);
  return res.json({ success: true, data: lead, meta: {}, error: null });
});
