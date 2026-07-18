import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { getProviderStatus } from '../services/image-provider.js';
import { getDb, rowToJson, storageDir } from '../services/database.js';

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
    const proposalCount = countProposalFiles();
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

function countProposalFiles() {
  const proposalsDir = path.join(storageDir, 'proposals');
  if (!fs.existsSync(proposalsDir)) return 0;
  return fs.readdirSync(proposalsDir).filter((file) => file.toLowerCase().endsWith('.pdf')).length;
}

adminRouter.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Admin API error' });
});
