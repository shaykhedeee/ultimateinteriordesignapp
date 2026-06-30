import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import path from 'node:path';
import {
  addCutlistModule,
  createOrRefreshCutlist,
  cutlistToCsv,
  cutlistToExcel,
  cutlistToMaxCutCsv,
  deleteCutlistModule,
  getCutlist,
  regenerateCutlistParts,
  updateCutlistModule,
  writeCutlistPdf,
  writeJobLayoutPdf,
  writeJobSummaryPdf,
  writePanelLabelsPdf
} from '../services/cutlist-engine.js';
import { getDb, storageDir } from '../services/database.js';
import { getProductionImport, importProductionWorkbook, listProductionImports } from '../services/production-import-service.js';

export const cutlistsRouter = express.Router();

const productionUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(storageDir, 'production-imports'),
    filename: (_req, file, cb) => {
      const safeExt = path.extname(file.originalname || '.xlsx') || '.xlsx';
      const safeBase = path.basename(file.originalname || 'production-workbook', safeExt).replace(/[^a-z0-9._-]+/gi, '-');
      cb(null, `${Date.now()}-${safeBase}${safeExt}`);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = ['.xlsx', '.xlsm', '.xls', '.csv'].includes(path.extname(file.originalname || '').toLowerCase());
    cb(null, ok);
  }
});

const rawCutlistExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.dxf',
  '.dwg',
  '.svg',
  '.csv',
  '.xlsx',
  '.xlsm',
  '.xls',
  '.txt',
  '.json'
]);

const rawCutlistUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const cutlistId = String(req.params.cutlistId || '').replace(/[^a-z0-9_-]+/gi, '-');
      const dir = path.join(storageDir, 'cutlists', 'raw-sources', cutlistId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = rawCutlistExtensions.has(ext) ? ext : '.dat';
      const safeBase = path.basename(file.originalname || 'raw-source', ext).replace(/[^a-z0-9._-]+/gi, '-');
      cb(null, `${Date.now()}-${safeBase}${safeExt}`);
    }
  }),
  limits: { fileSize: 40 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    const ok = rawCutlistExtensions.has(path.extname(file.originalname || '').toLowerCase());
    cb(ok ? null : new Error('Unsupported raw cutlist source file type.'), ok);
  }
});

cutlistsRouter.get('/imports', (_req, res, next) => {
  try {
    res.json({ items: listProductionImports() });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.post('/imports', productionUpload.single('workbook'), async (req, res, next) => {
  try {
    const imported = await importProductionWorkbook(req.file, req.body || {});
    res.status(201).json({ import: imported, items: listProductionImports() });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.get('/imports/:importId', (req, res, next) => {
  try {
    const imported = getProductionImport(req.params.importId);
    if (!imported) return res.status(404).json({ error: 'Production import not found' });
    res.json({ import: imported });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.post('/:cutlistId/raw-files', rawCutlistUpload.array('rawFiles', 12), (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    const uploaded = (req.files || []).map((file) => ({
      fileName: file.filename,
      originalName: file.originalname,
      extension: path.extname(file.filename).toLowerCase(),
      sizeBytes: file.size,
      url: `/storage/cutlists/raw-sources/${req.params.cutlistId}/${encodeURIComponent(file.filename)}`
    }));
    res.status(201).json({ cutlist, uploaded });
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.post('/:projectId/from-approved-brief', (req, res, next) => {
  try {
    const approval = getDb().prepare('SELECT payload FROM brief_approvals WHERE project_id = ?').get(req.params.projectId);
    if (!approval) {
      return res.status(409).json({ error: 'Approve the PDF brief before creating a production cutlist.' });
    }
    const payload = JSON.parse(approval.payload);
    if (payload.status !== 'approved') {
      return res.status(409).json({ error: 'Brief approval status is not approved.' });
    }
    const cutlist = createOrRefreshCutlist(req.params.projectId);
    res.status(201).json({ cutlist, approval: payload });
  } catch (err) {
    next(err);
  }
});

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

cutlistsRouter.get('/:cutlistId/maxcut-csv', (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    const csv = cutlistToMaxCutCsv(cutlist);
    const fileName = `${cutlist.clientName || 'spacious-venture'}-maxcut-r${cutlist.revision || 1}.csv`
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

cutlistsRouter.get('/:cutlistId/xlsx', async (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    const workbook = cutlistToExcel(cutlist);
    const fileName = `${cutlist.clientName || 'spacious-venture'}-cutlist-r${cutlist.revision || 1}.xlsx`
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await workbook.xlsx.write(res);
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.get('/:cutlistId/pdf/summary', async (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    const fileName = `${cutlist.clientName || 'spacious-venture'}-job-summary-r${cutlist.revision || 1}.pdf`
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-');
    const outPath = path.join(storageDir, 'cutlists', `${cutlist.id}-summary-r${cutlist.revision || 1}.pdf`);
    await writeJobSummaryPdf(cutlist, outPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(outPath).pipe(res);
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.get('/:cutlistId/pdf/job-layout', async (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    const fileName = `${cutlist.clientName || 'spacious-venture'}-job-layout-r${cutlist.revision || 1}.pdf`
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-');
    const outPath = path.join(storageDir, 'cutlists', `${cutlist.id}-job-layout-r${cutlist.revision || 1}.pdf`);
    await writeJobLayoutPdf(cutlist, outPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(outPath).pipe(res);
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.get('/:cutlistId/pdf/labels', async (req, res, next) => {
  try {
    const cutlist = getCutlist(req.params.cutlistId);
    if (!cutlist) return res.status(404).json({ error: 'Cutlist not found' });
    const fileName = `${cutlist.clientName || 'spacious-venture'}-panel-labels-r${cutlist.revision || 1}.pdf`
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/-+/g, '-');
    const outPath = path.join(storageDir, 'cutlists', `${cutlist.id}-labels-r${cutlist.revision || 1}.pdf`);
    await writePanelLabelsPdf(cutlist, outPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    fs.createReadStream(outPath).pipe(res);
  } catch (err) {
    next(err);
  }
});

cutlistsRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Cutlist API error' });
});
