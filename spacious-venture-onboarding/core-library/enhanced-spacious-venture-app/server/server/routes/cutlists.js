import express from 'express';
import { cutlistToCsv, getCutlist } from '../services/cutlist-engine.js';

export const cutlistsRouter = express.Router();

cutlistsRouter.get('/:cutlistId', (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    res.json({ cutlist });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.get('/:cutlistId/csv', (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    const csv = cutlistToCsv(cutlist);
    const fileName = `${cutlist.clientName || 'spacious-venture'}-cutlist-r${cutlist.revision || 1}.csv`
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Cutlist API error' });
});
