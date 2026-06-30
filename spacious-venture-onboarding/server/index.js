import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8787;

// ---- Middleware ----
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS origin not allowed'));
  }
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---- Static file serving ----
app.use('/storage', express.static(path.join(__dirname, '..', 'storage')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/reference-library', express.static(path.join(__dirname, '..', 'reference-library')));
app.use('/newinfo', express.static(path.join(__dirname, '..', 'newinfo')));

// ---- Ensure required directories exist ----
['storage/uploads', 'storage/assets', 'storage/floor-plans', 
 'storage/proposals', 'storage/cutlists', 'storage/cutlists/raw-sources', 'storage/reference'
].forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// ---- Initialize Database ----
import { ensureDatabase, getDb } from './services/database.js';
ensureDatabase();

// API Routes
const authMiddleware = (req, res, next) => {
  const expected = process.env.STUDIO_ACCESS_TOKEN;
  if (!expected) return next();

  const bearer = req.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const studioKey = req.get('x-studio-key')?.trim();
  if (bearer === expected || studioKey === expected) return next();

  res.status(401).json({
    error: 'Studio access token required',
    message: 'Set Authorization: Bearer <token> or X-Studio-Key for API access.'
  });
};

import { projectsRouter } from './routes/projects.js';
import { proposalsRouter } from './routes/proposals.js';
import { materialsRouter } from './routes/materials.js';
import { libraryRouter } from './routes/library.js';
import { adminRouter } from './routes/admin.js';
import { cutlistsRouter } from './routes/cutlists.js';
import rendersEnhancedRouter from './routes/renders-enhanced.js';

app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/proposals', authMiddleware, proposalsRouter);
app.use('/api/materials', authMiddleware, materialsRouter);
app.use('/api/library', authMiddleware, libraryRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/cutlists', authMiddleware, cutlistsRouter);
app.use('/api/renders', authMiddleware, rendersEnhancedRouter);

// New Enhanced Services
import colorService from './services/component-color-service.js';
import dbEnhanced from './services/database-enhanced.js';
import { getMultimodalSystemStatus } from './services/multimodal-system.js';

// ---- Color Palette API (NEW) ----
import { getProviderStatus } from './services/image-provider.js';
app.get('/api/providers/status', authMiddleware, (req, res) => {
  res.json(getProviderStatus());
});

app.get('/api/system/multimodal', authMiddleware, (req, res) => {
  res.json(getMultimodalSystemStatus());
});

app.get('/api/color-palettes/:componentType', authMiddleware, (req, res) => {
  const palette = colorService.getAvailableColors(req.params.componentType);
  res.json({ success: true, palette });
});

// ---- Reference Library API (NEW) ----
app.get('/api/reference-library', authMiddleware, (req, res) => {
  const { category, style, search, limit } = req.query;
  
  if (search) {
    return dbEnhanced.searchReferenceImages(search).then(images => res.json({ success: true, images }));
  }
  
  dbEnhanced.getReferenceImages(category, style, parseInt(limit) || 20)
    .then(images => res.json({ success: true, images, total: images.length }));
});

// ---- Newinfo Reference Library API - Scans the newinfo/reference-library folder ----
app.get('/api/newinfo-library', authMiddleware, (req, res) => {
  try {
    const { category: catFilter } = req.query;
    const images = listManagedReferenceImages({ category: catFilter });
    const filtered = catFilter ? images.filter(img => img.category === catFilter) : images;
    res.json({ success: true, images: filtered, total: filtered.length });
  } catch (error) {
    console.error('Newinfo library scan error:', error);
    res.json({ success: true, images: [], total: 0 });
  }
});

// ---- Upload Reference Image API ----
app.post('/api/reference-library/upload', authMiddleware, async (req, res) => {
  try {
    const multer = (await import('multer')).default;
    const uploadDir = path.join(__dirname, '..', 'storage', 'reference');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
    const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'ref-' + uniqueSuffix + path.extname(file.originalname));
      }
    });
    const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }).single('referenceImage');
    
    upload(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      
      const imagePath = '/storage/reference/' + req.file.filename;
      const title = req.body.title || req.file.originalname.replace(/\.[^.]+$/, '');
      const category = req.body.category || 'uploaded';
      const style = req.body.style || 'reference';
      const source = req.body.source || 'upload';
      upsertReferenceMetadata({
        id: referenceIdFor(imagePath),
        filename: req.file.filename,
        title,
        category,
        style,
        budgetTier: req.body.budgetTier || 'premium',
        imagePath,
        source,
        tags: parseTags(req.body.tags || category)
      });
      res.json({
        success: true,
        id: referenceIdFor(imagePath),
        url: imagePath,
        title,
        category,
        style,
        source,
        tags: parseTags(req.body.tags || category)
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/reference-library/:id', authMiddleware, (req, res) => {
  try {
    const row = getReferenceRow(req.params.id);
    if (!row) return res.status(404).json({ error: 'Reference image not found' });
    const meta = safeJson(row.metadata_json, {});
    const nextMeta = {
      ...meta,
      title: req.body.title ?? meta.title ?? row.filename,
      tags: Array.isArray(req.body.tags) ? req.body.tags : parseTags(req.body.tags ?? meta.tags ?? row.category),
      updatedBy: 'studio-admin'
    };
    const next = {
      category: req.body.category || row.category,
      style: req.body.style || row.style || 'reference',
      budgetTier: req.body.budgetTier || row.budget_tier || 'premium',
      source: req.body.source || row.source || 'upload',
      metadata: nextMeta
    };
    getDb().prepare(`
      UPDATE reference_library
      SET category = ?, style = ?, budget_tier = ?, source = ?, metadata_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(next.category, next.style, next.budgetTier, next.source, JSON.stringify(next.metadata), req.params.id);
    res.json({ success: true, image: referenceRowToClient({ ...row, category: next.category, style: next.style, budget_tier: next.budgetTier, source: next.source, metadata_json: JSON.stringify(next.metadata) }) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reference-library/:id', authMiddleware, (req, res) => {
  try {
    const row = getReferenceRow(req.params.id);
    if (!row) return res.status(404).json({ error: 'Reference image not found' });
    getDb().prepare('UPDATE reference_library SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    if (row.image_path?.startsWith('/storage/reference/')) {
      const absolute = path.join(__dirname, '..', row.image_path.replace(/^\//, ''));
      if (absolute.startsWith(path.join(__dirname, '..', 'storage', 'reference')) && fs.existsSync(absolute)) {
        fs.unlinkSync(absolute);
      }
    }
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function listManagedReferenceImages({ category } = {}) {
  indexReferenceFolders();
  const rows = getDb().prepare(`
    SELECT * FROM reference_library
    WHERE deleted_at IS NULL
    ${category ? 'AND category = ?' : ''}
    ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC
    LIMIT 500
  `).all(...(category ? [category] : []));
  const seen = new Set();
  return rows
    .map(referenceRowToClient)
    .filter((item) => {
      const key = `${String(item.category || '').toLowerCase()}::${String(item.title || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function indexReferenceFolders() {
  const roots = [
    path.join(__dirname, '..', 'newinfo', 'reference-library', 'indian-interiors'),
    path.join(__dirname, '..', 'reference-library', 'indian-interiors'),
    path.join(__dirname, '..', 'storage', 'reference', 'indian-interiors')
  ];
  roots.forEach((baseDir) => {
    if (!fs.existsSync(baseDir)) return;
    scanReferenceDir(baseDir, baseDir);
  });
}

function scanReferenceDir(baseDir, dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanReferenceDir(baseDir, fullPath);
      continue;
    }
    if (!/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) continue;
    const relativePath = path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/');
    const url = '/' + relativePath;
    const category = path.basename(path.dirname(fullPath));
    const title = titleFromFile(entry.name);
    upsertReferenceMetadata({
      id: referenceIdFor(url),
      filename: entry.name,
      title,
      category,
      style: category.includes('3d') || relativePath.includes('/renders-3d/') ? '3d-render' : 'reference',
      budgetTier: 'premium',
      imagePath: url,
      source: category.includes('3d') || relativePath.includes('/renders-3d/') ? 'ai-generated' : 'curated-reference',
      tags: [category, relativePath.includes('/renders-3d/') ? '3d-render' : 'reference']
    });
  }
}

function upsertReferenceMetadata({ id, filename, title, category, style, budgetTier, imagePath, source, tags = [] }) {
  const existing = getReferenceRow(id);
  if (existing) return;
  const metadata = {
    title,
    tags: parseTags(tags),
    attribution: source === 'upload' ? 'Studio upload' : 'Spacious Venture curated reference',
    sourceUrl: imagePath,
    consent: source === 'upload' ? 'studio-upload' : 'curated-local-reference'
  };
  getDb().prepare(`
    INSERT OR IGNORE INTO reference_library
    (id, filename, category, style, budget_tier, image_path, thumbnail_path, metadata_json, ai_training_ready, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(id, filename, category, style, budgetTier, imagePath, imagePath, JSON.stringify(metadata), source);
}

function getReferenceRow(id) {
  return getDb().prepare('SELECT * FROM reference_library WHERE id = ? AND deleted_at IS NULL').get(id);
}

function referenceRowToClient(row) {
  const meta = safeJson(row.metadata_json, {});
  return {
    id: row.id,
    url: row.image_path,
    title: meta.title || titleFromFile(row.filename),
    category: row.category,
    style: row.style || 'reference',
    budgetTier: row.budget_tier || 'premium',
    source: row.source || 'upload',
    tags: Array.isArray(meta.tags) ? meta.tags : parseTags(row.category),
    attribution: meta.attribution || '',
    sourceUrl: meta.sourceUrl || row.image_path,
    editable: true
  };
}

function referenceIdFor(value) {
  return `ref-${Buffer.from(String(value)).toString('base64url').slice(0, 48)}`;
}

function titleFromFile(fileName) {
  return String(fileName || 'Reference image')
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseTags(input) {
  if (Array.isArray(input)) return input.map((item) => String(item).trim()).filter(Boolean);
  return String(input || '')
    .split(/[,\n/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  const multimodal = getMultimodalSystemStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    productBoundary: multimodal.productBoundary,
    features: {
      floorPlanAnalysis: true,
      aiRenderPipeline: true,
      multimodalSystem: multimodal.isMultimodalSystem,
      multimodalMaturity: multimodal.maturity,
      componentColorChange: true,
      referenceLibrary: true,
      cutlistAutomation: true,
      enhancedUI: true
    }
  });
});

// ---- Production Frontend Serving ----
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ---- Error Handling ----
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║     SPACIOUS VENTURE STUDIO OS — Server v2.0        ║
╠══════════════════════════════════════════════════════╣
║  Port:      ${String(PORT).padEnd(37)}║
║  API:       http://127.0.0.1:${PORT}/api             ║
║  Storage:   ./storage/                               ║
║  Features:                                            ║
║  • Floor Plan AI (7-phase analysis)   ✓              ║
║  • AI Render Pipeline (layout→render) ✓              ║
║  • Component Color Change (SAM-based) ✓              ║
║  • Indian Interior Reference Library  ✓              ║
║  • Enhanced Render Studio UI          ✓              ║
╚══════════════════════════════════════════════════════╝
  `);
});

export default app;
