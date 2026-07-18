// ============================================================
// SPACIOUS VENTURE STUDIO OS — Server Entry Point
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8787;

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---- Static file serving ----
app.use('/storage', express.static(path.join(__dirname, '..', 'storage')));
app.use('/reference-library', express.static(path.join(__dirname, '..', 'reference-library')));

// ---- Ensure required directories exist ----
['storage/uploads', 'storage/assets', 'storage/floor-plans', 
 'storage/proposals', 'storage/cutlists', 'storage/reference'
].forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// ---- Initialize Database ----
const database = require('./services/database');
database.initialize();

// ---- Run migrations for new features ----
try {
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'migrations', '003_render_enhancements.sql'), 'utf8'
  );
  // Execute migration statements
  const statements = migrationSQL.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
  for (const stmt of statements) {
    try {
      database.run(stmt.trim());
    } catch (e) {
      // Ignore "already exists" errors
      if (!e.message.includes('already exists')) {
        console.warn('Migration warning:', e.message);
      }
    }
  }
  console.log('✓ Migration 003 (render enhancements) applied');
} catch (e) {
  console.warn('Migration 003 skipped:', e.message);
}

// ---- API Routes ----
const authMiddleware = (req, res, next) => {
  // V1: No auth required for local/single-user
  next();
};

// Existing routes
const projectsRouter = require('./routes/projects');
const proposalsRouter = require('./routes/proposals');
const materialsRouter = require('./routes/materials');
const libraryRouter = require('./routes/library');
const adminRouter = require('./routes/admin');
const cutlistsRouter = require('./routes/cutlists');

// NEW: Enhanced render routes
const rendersEnhancedRouter = require('./routes/renders-enhanced');

app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/proposals', authMiddleware, proposalsRouter);
app.use('/api/materials', authMiddleware, materialsRouter);
app.use('/api/library', authMiddleware, libraryRouter);
app.use('/api/admin', authMiddleware, adminRouter);
app.use('/api/cutlists', authMiddleware, cutlistsRouter);

// NEW: Mount enhanced render routes
app.use('/api/renders', authMiddleware, rendersEnhancedRouter);

// ---- Color Palette API (NEW) ----
app.get('/api/color-palettes/:componentType', authMiddleware, (req, res) => {
  const colorService = require('./services/component-color-service');
  const palette = colorService.getAvailableColors(req.params.componentType);
  res.json({ success: true, palette });
});

// ---- Reference Library API (NEW) ----
app.get('/api/reference-library', authMiddleware, (req, res) => {
  const db = require('./services/database-enhanced');
  const { category, style, search, limit } = req.query;
  
  if (search) {
    return db.searchReferenceImages(search).then(images => res.json({ success: true, images }));
  }
  
  db.getReferenceImages(category, style, parseInt(limit) || 20)
    .then(images => res.json({ success: true, images, total: images.length }));
});

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      floorPlanAnalysis: true,
      aiRenderPipeline: true,
      componentColorChange: true,
      referenceLibrary: true,
      cutlistAutomation: true,
      enhancedUI: true
    }
  });
});

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

module.exports = app;