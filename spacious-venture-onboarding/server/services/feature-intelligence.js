import fs from 'node:fs';
import path from 'node:path';
import { getDb, rootDir } from './database.js';
import { listStoredDocuments } from './document-vault.js';
import { getProviderStatus } from './image-provider.js';
import { getMultimodalSystemStatus } from './multimodal-system.js';

function score(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function toneForScore(value) {
  if (value >= 80) return 'ready';
  if (value >= 50) return 'watch';
  return 'missing';
}

function count(db, sql) {
  return Number(db.prepare(sql).get()?.count || 0);
}

export function getFeatureIntelligence() {
  const db = getDb();
  const projectCount = count(db, 'SELECT COUNT(*) AS count FROM client_projects');
  const floorPlanCount = count(db, 'SELECT COUNT(*) AS count FROM floor_plans');
  const packageCount = count(db, 'SELECT COUNT(*) AS count FROM design_packages');
  const packagedProjectCount = count(db, 'SELECT COUNT(DISTINCT project_id) AS count FROM design_packages');
  const assetCount = count(db, 'SELECT COUNT(*) AS count FROM generated_assets');
  const reviewedRenderCount = count(db, 'SELECT COUNT(*) AS count FROM render_asset_reviews');
  const approvedRenderCount = count(db, "SELECT COUNT(*) AS count FROM render_asset_reviews WHERE status = 'approved'");
  const cutlistCount = count(db, 'SELECT COUNT(*) AS count FROM cutlist_projects');
  const laminateCount = count(db, 'SELECT COUNT(*) AS count FROM laminate_products');
  const referenceCount = count(db, 'SELECT COUNT(*) AS count FROM reference_library WHERE deleted_at IS NULL');
  const reusableAssetCount = count(db, 'SELECT COUNT(*) AS count FROM generated_assets WHERE reusable_score >= 85');
  const productionImportCount = count(db, 'SELECT COUNT(*) AS count FROM production_project_imports');
  const documents = listStoredDocuments();
  const providers = getProviderStatus();
  const multimodal = getMultimodalSystemStatus();
  const publicWebsiteReady = fs.existsSync(path.join(rootDir, 'public-website', 'index.html'));
  const studioReady = fs.existsSync(path.join(rootDir, 'frontend', 'dist', 'index.html'));

  const floorPlanCoverage = score(floorPlanCount, projectCount);
  const briefCoverage = score(packagedProjectCount, projectCount);
  const renderReviewCoverage = score(reviewedRenderCount, Math.max(assetCount, 1));
  const approvedRenderCoverage = score(approvedRenderCount, Math.max(reviewedRenderCount, 1));
  const cutlistCoverage = score(cutlistCount, Math.max(packagedProjectCount, 1));

  const features = [
    {
      id: 'onboarding',
      label: 'Onboarding',
      score: Math.min(100, projectCount ? 70 + Math.min(projectCount, 6) * 5 : 35),
      metric: `${projectCount} projects`,
      status: projectCount ? 'Capturing clients' : 'Needs first client',
      nextAction: projectCount ? 'Keep pushing each new client through floor-plan mapping.' : 'Add one complete client with rooms, budget, style, and site notes.'
    },
    {
      id: 'floor-plan',
      label: 'Floor-plan intelligence',
      score: floorPlanCoverage,
      metric: `${floorPlanCoverage}% mapped`,
      status: floorPlanCount ? `${floorPlanCount} plans stored` : 'No plans mapped',
      nextAction: floorPlanCoverage >= 80 ? 'Use annotations as the render source of truth.' : 'Upload and annotate plans for every active project before rendering.'
    },
    {
      id: 'renders',
      label: 'AI render review',
      score: Math.round((renderReviewCoverage + approvedRenderCoverage) / 2),
      metric: `${approvedRenderCount}/${assetCount} approved`,
      status: providers.clientSafeLiveReady ? 'Client-safe providers ready' : 'Provider fallback only',
      nextAction: providers.clientSafeLiveReady ? 'Approve the best render per room and save corrections.' : 'Fix at least one client-safe image provider before final client renders.'
    },
    {
      id: 'briefs',
      label: 'PDF brief desk',
      score: Math.max(briefCoverage, documents.counts.proposalBriefs ? 70 : 0),
      metric: `${documents.counts.proposalBriefs} exported`,
      status: packageCount ? `${packageCount} packages generated` : 'No packages yet',
      nextAction: briefCoverage >= 80 ? 'Export proposal PDFs for approved projects.' : 'Generate briefs after floor-plan and render review.'
    },
    {
      id: 'cutlists',
      label: 'Cutlist handoff',
      score: cutlistCoverage,
      metric: `${cutlistCount} cutlists`,
      status: productionImportCount ? `${productionImportCount} production imports learned` : 'Production import optional',
      nextAction: cutlistCoverage >= 70 ? 'Export CSV/PDF/XLSX for production handoff.' : 'Create cutlists from approved briefs only after dimensions are checked.'
    },
    {
      id: 'library',
      label: 'Reference and material library',
      score: Math.min(100, Math.round((Math.min(referenceCount, 60) / 60) * 55 + (Math.min(laminateCount, 44) / 44) * 35 + (reusableAssetCount ? 10 : 0))),
      metric: `${referenceCount} refs / ${laminateCount} laminates`,
      status: reusableAssetCount ? `${reusableAssetCount} reusable generated assets` : 'Curated assets only',
      nextAction: 'Tag uploaded references by room, style, budget, and source before reuse.'
    },
    {
      id: 'multimodal',
      label: 'Multimodal AI layer',
      score: multimodal.maturity === 'operational-v1' ? 88 : 55,
      metric: multimodal.maturity,
      status: providers.clientSafeLiveReady ? 'Text, image, PDF, structured data active' : 'Needs live image reliability',
      nextAction: 'Keep provider keys server-side and route future AI calls through the multimodal contract.'
    },
    {
      id: 'website-boundary',
      label: 'Website/software boundary',
      score: publicWebsiteReady && studioReady ? 100 : publicWebsiteReady || studioReady ? 65 : 30,
      metric: publicWebsiteReady ? 'website separated' : 'website missing',
      status: publicWebsiteReady ? 'Public website kept static' : 'Public website package missing',
      nextAction: 'Deploy only public-website/ to the public host; keep Studio OS private.'
    },
    {
      id: 'deliverables',
      label: 'Deliverables vault',
      score: documents.counts.total ? Math.min(100, 55 + documents.counts.total * 8) : 35,
      metric: `${documents.counts.total} files`,
      status: documents.counts.total ? 'Stored documents available' : 'No exported files yet',
      nextAction: 'Use the vault as the project handoff record after every PDF or cutlist export.'
    }
  ].map((feature) => ({ ...feature, tone: toneForScore(feature.score) }));

  const overallScore = Math.round(features.reduce((sum, feature) => sum + feature.score, 0) / features.length);
  const priorityActions = features
    .filter((feature) => feature.score < 80)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((feature) => ({
      id: feature.id,
      label: feature.label,
      score: feature.score,
      action: feature.nextAction
    }));

  return {
    generatedAt: new Date().toISOString(),
    overallScore,
    overallTone: toneForScore(overallScore),
    features,
    priorityActions,
    summary: overallScore >= 80
      ? 'Studio OS is operational; focus on project completion discipline.'
      : 'Core system is in place; finish the lowest-scoring workflow gaps first.',
    boundary: multimodal.productBoundary
  };
}
