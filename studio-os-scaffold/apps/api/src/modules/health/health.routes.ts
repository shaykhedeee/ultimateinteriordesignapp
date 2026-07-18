import { Router } from 'express';
import { dbHealthcheck } from '../../lib/db';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const db = await dbHealthcheck();
  return res.json({
    success: true,
    data: { ok: true, db },
    meta: {},
    error: null,
  });
});
