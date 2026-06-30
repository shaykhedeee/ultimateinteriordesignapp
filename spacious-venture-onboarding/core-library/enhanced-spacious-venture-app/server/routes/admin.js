import express from 'express';
import { getProviderStatus } from '../services/image-provider.js';
import { getDb, rowToJson } from '../services/database.js';
import { resetDemoWorkspace } from '../services/backup-service.js';
import { listStoredDocuments } from '../services/document-vault.js';

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
    const floorPlanCount = db.prepare('SELECT COUNT(*) AS count FROM floor_plans').get().count;
    const cutlistCount = db.prepare('SELECT COUNT(*) AS count FROM cutlist_projects').get().count;
    const reusableAssets = db.prepare('SELECT COUNT(*) AS count FROM generated_assets WHERE reusable_score >= 85').get().count;
    const documentSummary = listStoredDocuments();
    const proposalCount = documentSummary.counts.proposalBriefs;
    const cutlistPdfCount = documentSummary.counts.cutlistPdfs;
    const rooms = db.prepare('SELECT room, COUNT(*) AS count FROM generated_assets GROUP BY room ORDER BY count DESC').all();
    const styles = db.prepare('SELECT style, COUNT(*) AS count FROM generated_assets GROUP BY style ORDER BY count DESC LIMIT 8').all();
    const sources = db.prepare('SELECT source_type AS source, COUNT(*) AS count FROM generated_assets GROUP BY source_type ORDER BY count DESC').all();

    res.json({
      generatedAt: new Date().toISOString(),
      kpis: {
        projects: projectCount,
        packages: packageCount,
        moodboards: moodboardCount,
        assets: assetCount,
        floorPlans: floorPlanCount,
        cutlists: cutlistCount,
        reusableAssets,
        proposals: proposalCount,
        cutlistPdfs: cutlistPdfCount,
        documents: documentSummary.counts.total,
        packagedProjects: packagedProjectCount,
        conversionRate: projectCount ? Math.round((packagedProjectCount / projectCount) * 100) : 0,
        floorPlanCoverage: projectCount ? Math.round((floorPlanCount / projectCount) * 100) : 0
      },
      pipeline: [
        { stage: 'Lead / Walk-in', count: Math.max(projectCount - packagedProjectCount, 0), tone: 'lead' },
        { stage: 'Onboarding', count: projectCount, tone: 'intake' },
        { stage: 'Brief Ready', count: packagedProjectCount, tone: 'design' },
        { stage: 'PDF Exported', count: proposalCount, tone: 'proposal' },
        { stage: 'Cutlist Queue', count: cutlistCount, tone: 'closed' }
      ],
      roomMix: rooms,
      styleMix: styles,
      sourceMix: sources,
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
