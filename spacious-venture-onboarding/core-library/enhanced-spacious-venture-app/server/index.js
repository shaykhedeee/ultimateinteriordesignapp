import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDatabase } from './services/database.js';
import { projectsRouter } from './routes/projects.js';
import { materialsRouter } from './routes/materials.js';
import { libraryRouter } from './routes/library.js';
import { proposalsRouter } from './routes/proposals.js';
import { adminRouter } from './routes/admin.js';
import { cutlistsRouter } from './routes/cutlists.js';
import { getProviderStatus } from './services/image-provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const app = express();
const port = Number(process.env.PORT || 8787);

ensureDatabase();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use('/storage', express.static(path.join(rootDir, 'storage')));
app.use('/images', express.static(path.join(rootDir, 'images')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'spacious-venture-experience-centre', imageProviders: getProviderStatus() });
});

app.get('/api/providers/status', (_req, res) => {
  res.json(getProviderStatus());
});

app.use('/api/projects', projectsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/library', libraryRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/cutlists', cutlistsRouter);
app.use('/api/admin', adminRouter);

app.listen(port, '127.0.0.1', () => {
  console.log(`Spacious Venture API listening on http://127.0.0.1:${port}`);
});
