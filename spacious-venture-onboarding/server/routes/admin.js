import express from 'express';
import { getProviderStatus } from '../services/image-provider.js';
import { getDb, rowToJson } from '../services/database.js';
import { resetDemoWorkspace } from '../services/backup-service.js';
import { listStoredDocuments } from '../services/document-vault.js';
import { getFeatureIntelligence } from '../services/feature-intelligence.js';

export const adminRouter = express.Router();

adminRouter.get('/summary', (req, res, next) => {
  try {
    const db = getDb();
    const projects = db.prepare('SELECT payload FROM client_projects ORDER BY created_at DESC').all().map(rowToJson);
    const projectCount = projects.length;
    const packageCount = db.prepare('SELECT COUNT(*) AS count FROM design_packages').get().count;
    const packagedProjectCount = db.prepare('SELECT COUNT(DISTINCT project_id) AS count FROM design_packages').get().count;
    const moodboardCount = db.prepare('SELECT COUNT(*) AS count FROM moodboards').get().count;
    const assetCount = db.prepare('SELECT COUNT(*) AS count FROM generated_assets').get().count;
    const reviewedRenderCount = db.prepare('SELECT COUNT(*) AS count FROM render_asset_reviews').get().count;
    const approvedRenderCount = db.prepare("SELECT COUNT(*) AS count FROM render_asset_reviews WHERE status = 'approved'").get().count;
    const floorPlanCount = db.prepare('SELECT COUNT(*) AS count FROM floor_plans').get().count;
    const cutlistCount = db.prepare('SELECT COUNT(*) AS count FROM cutlist_projects').get().count;
    const productionImportCount = db.prepare('SELECT COUNT(*) AS count FROM production_project_imports').get().count;
    const reusableAssets = db.prepare('SELECT COUNT(*) AS count FROM generated_assets WHERE reusable_score >= 85').get().count;
    const documentSummary = listStoredDocuments();
    const proposalCount = documentSummary.counts.proposalBriefs;
    const cutlistPdfCount = documentSummary.counts.cutlistPdfs;
    const rooms = db.prepare('SELECT room, COUNT(*) AS count FROM generated_assets GROUP BY room ORDER BY count DESC').all();
    const styles = db.prepare('SELECT style, COUNT(*) AS count FROM generated_assets GROUP BY style ORDER BY count DESC LIMIT 8').all();
    const sources = db.prepare('SELECT source_type AS source, COUNT(*) AS count FROM generated_assets GROUP BY source_type ORDER BY count DESC').all();
    const featureIntelligence = getFeatureIntelligence();

    res.json({
      generatedAt: new Date().toISOString(),
      kpis: {
        projects: projectCount,
        packages: packageCount,
        moodboards: moodboardCount,
        assets: assetCount,
        reviewedRenders: reviewedRenderCount,
        approvedRenders: approvedRenderCount,
        floorPlans: floorPlanCount,
        cutlists: cutlistCount,
        productionImports: productionImportCount,
        reusableAssets,
        proposals: proposalCount,
        cutlistPdfs: cutlistPdfCount,
        documents: documentSummary.counts.total,
        packagedProjects: packagedProjectCount,
        conversionRate: projectCount ? Math.round((packagedProjectCount / projectCount) * 100) : 0,
        floorPlanCoverage: projectCount ? Math.round((floorPlanCount / projectCount) * 100) : 0
      },
      pipeline: [
        { stage: 'Lead / Walk-in', count: Math.max(projectCount - floorPlanCount, 0), tone: 'lead' },
        { stage: 'Floor Plan', count: floorPlanCount, tone: 'intake' },
        { stage: 'AI Render Review', count: Math.max(assetCount - approvedRenderCount, 0), tone: 'design' },
        { stage: 'Approved Renders', count: approvedRenderCount, tone: 'design' },
        { stage: 'PDF Exported', count: proposalCount, tone: 'proposal' },
        { stage: 'Cutlist Queue', count: cutlistCount, tone: 'closed' },
        { stage: 'Production Learning', count: productionImportCount, tone: 'closed' }
      ],
      workflow: {
        intake: { total: projectCount, ready: floorPlanCount },
        renderStudio: { generated: assetCount, reviewed: reviewedRenderCount, approved: approvedRenderCount },
        proposalDesk: { packages: packageCount, exported: proposalCount },
        production: { cutlists: cutlistCount, importedStandards: productionImportCount, cutlistPdfs: cutlistPdfCount },
        deliverables: { totalDocuments: documentSummary.counts.total, proposalBriefs: proposalCount, cutlistPdfs: cutlistPdfCount }
      },
      roomMix: rooms,
      styleMix: styles,
      sourceMix: sources,
      featureIntelligence,
      recentProjects: projects.slice(0, 6).map((project) => ({
        id: project.id,
        clientName: project.clientName,
        city: project.city,
        homeType: project.homeType,
        budgetTier: project.budgetTier,
        primaryStyle: project.primaryStyle,
        selectedSpaces: project.selectedSpaces || [],
        createdAt: project.createdAt
      })),
      providers: getProviderStatus()
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/feature-intelligence', (_req, res, next) => {
  try {
    res.json(getFeatureIntelligence());
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/documents', (_req, res, next) => {
  try {
    res.json(listStoredDocuments());
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/demo-reset', async (req, res, next) => {
  try {
    if (req.body?.confirm !== 'RESET DEMO') {
      return res.status(400).json({ error: 'Type RESET DEMO to rebuild the sample workspace.' });
    }
    const result = await resetDemoWorkspace();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

adminRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Admin API error' });
});
