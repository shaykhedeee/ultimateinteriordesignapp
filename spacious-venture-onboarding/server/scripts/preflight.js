import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { ensureDatabase, getDb, rootDir, storageDir } from '../services/database.js';
import { getProviderStatus } from '../services/image-provider.js';
import { getMultimodalSystemStatus } from '../services/multimodal-system.js';
import { getFeatureIntelligence } from '../services/feature-intelligence.js';

const checks = [];

function check(name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

ensureDatabase();
const db = getDb();

const requiredDirs = [
  'assets',
  'uploads',
  'floor-plans',
  'proposals',
  'cutlists',
  'cutlists/raw-sources',
  'reference',
  'production-imports'
];

requiredDirs.forEach((dir) => {
  const absolute = path.join(storageDir, dir);
  check(`storage/${dir}`, fs.existsSync(absolute), absolute);
});

const frontendIndex = path.join(rootDir, 'frontend', 'dist', 'index.html');
const publicWebsiteIndex = path.join(rootDir, 'public-website', 'index.html');
check('frontend build', fs.existsSync(frontendIndex), frontendIndex);
check('public website separated', fs.existsSync(publicWebsiteIndex), 'public-website/index.html exists and is not served by the studio app');

const laminateCount = db.prepare('SELECT COUNT(*) AS count FROM laminate_products').get().count;
const referenceCount = db.prepare('SELECT COUNT(*) AS count FROM reference_library WHERE deleted_at IS NULL').get().count;
const projectCount = db.prepare('SELECT COUNT(*) AS count FROM client_projects').get().count;

check('laminate knowledge base', laminateCount >= 40, `${laminateCount} laminate records`);
check('reference image library', referenceCount >= 20, `${referenceCount} reference records`);
check('project database', projectCount >= 0, `${projectCount} projects`);

const providers = getProviderStatus();
const multimodal = getMultimodalSystemStatus();
const featureIntelligence = getFeatureIntelligence();
check('provider status endpoint data', Boolean(providers?.providers), providers.activeLabel || 'unknown');
check(
  'multimodal system contract',
  multimodal.isMultimodalSystem && multimodal.productBoundary?.publicWebsite?.servedByStudioApp === false,
  `${multimodal.maturity}; website=${multimodal.productBoundary?.publicWebsite?.path}; software=${multimodal.productBoundary?.studioSoftware?.paths?.join(',')}`
);
check(
  'feature intelligence',
  featureIntelligence.features?.length >= 8 && featureIntelligence.overallScore > 0,
  `${featureIntelligence.overallScore}% overall; ${featureIntelligence.priorityActions?.length || 0} priority actions`
);
check(
  'live image generation',
  providers.liveImageGenRequested ? providers.liveImageGenReady : true,
  providers.liveImageGenRequested
    ? `requested; active path ${providers.activeLabel}`
    : 'not requested; curated/mock fallback enabled'
);

check(
  'Gemini image configuration',
  providers.geminiImagen?.configured || providers.providers?.huggingface || providers.providers?.freepik || providers.providers?.pollinations,
  providers.geminiImagen?.configured
    ? `Gemini configured; model ${providers.geminiImagen.model}`
    : 'Gemini missing; relying on non-Gemini fallback'
);

const failed = checks.filter((item) => !item.pass);
for (const item of checks) {
  const icon = item.pass ? 'OK' : 'FAIL';
  console.log(`${icon} ${item.name}${item.detail ? ` - ${item.detail}` : ''}`);
}

if (failed.length) {
  console.error(`Preflight failed: ${failed.length} check(s) need attention.`);
  process.exit(1);
}

console.log('Preflight passed. Spacious Venture is ready for a production smoke deploy.');
