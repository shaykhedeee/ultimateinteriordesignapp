import express from 'express';
import { findReusableAssets } from '../services/design-engine.js';
import { exportBackupPayload, importBackupPayload } from '../services/backup-service.js';

export const libraryRouter = express.Router();

libraryRouter.get('/assets', (req, res, next) => {
  try {
    const rooms = req.query.room ? [req.query.room] : undefined;
    const items = findReusableAssets({
      room: req.query.room,
      rooms,
      style: req.query.style,
      budgetTier: req.query.budget
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

libraryRouter.get('/export', (req, res, next) => {
  try {
    const includeFiles = req.query.files !== 'metadata';
    const backup = exportBackupPayload({ includeFiles });
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="spacious-venture-backup-${date}.json"`);
    res.json(backup);
  } catch (err) {
    next(err);
  }
});

libraryRouter.post('/import', (req, res, next) => {
  try {
    const result = importBackupPayload(req.body?.backup || req.body, { replace: Boolean(req.body?.replace) });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

libraryRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Library API error' });
});
