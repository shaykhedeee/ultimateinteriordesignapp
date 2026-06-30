import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  addCutlistModule,
  cutlistToCsv,
  deleteCutlistModule,
  getCutlist,
  regenerateCutlistParts,
  updateCutlistModule,
  writeCutlistPdf
} from '../services/cutlist-engine.js';
import { storageDir } from '../services/database.js';

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

cutlistsRouter.get('/:cutlistId/sheets', (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    res.json({ sheetLayout: cutlist.sheetLayout, totals: cutlist.totals });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.post('/:cutlistId/generate-parts', (req, res, next) => {
  try {
    const cutlist = regenerateCutlistParts(req.params.cutlistId);
    res.json({ cutlist });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.post('/:cutlistId/modules', (req, res, next) => {
  try {
    const cutlist = addCutlistModule(req.params.cutlistId, req.body || {});
    res.status(201).json({ cutlist });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.patch('/:cutlistId/modules/:moduleId', (req, res, next) => {
  try {
    const cutlist = updateCutlistModule(req.params.cutlistId, req.params.moduleId, req.body || {});
    res.json({ cutlist });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.delete('/:cutlistId/modules/:moduleId', (req, res, next) => {
  try {
    const cutlist = deleteCutlistModule(req.params.cutlistId, req.params.moduleId);
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

cutlistsRouter.get('/:cutlistId/pdf', sendCutlistPdf);
cutlistsRouter.post('/:cutlistId/pdf', sendCutlistPdf);

async function sendCutlistPdf(req, res, next) {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    const fileName = `${cutlist.clientName || 'spacious-venture'}-cutlist-r${cutlist.revision || 1}.pdf`
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-');
    const outPath = path.join(storageDir, 'cutlists', `${cutlist.id}-r${cutlist.revision || 1}.pdf`);
    await writeCutlistPdf(cutlist, outPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(outPath).pipe(res);
  } catch (err) {
    next(err);
  }
}

cutlistsRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Cutlist API error' });
});
