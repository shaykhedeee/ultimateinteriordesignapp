import { buildEnhancementPlan, ENHANCEMENT_MODES } from './enhancement-planner.js';
import { generateInteriorAsset } from './image-provider.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../storage');

export async function enhanceTopView({
  projectId,
  manifest,
  canonicalSvg,
  canonicalPngUrl,
  mode = 'faithful_clean',
  preset = 'technical_clean',
  stylePrompt = '',
  styleReferenceUrl = '',
  reuseFirst = false
}) {
  const plan = buildEnhancementPlan({ manifest, mode, preset, stylePrompt, styleReferenceUrl });
  const roomName = (manifest.rooms || [])[0]?.name || (manifest.rooms || [])[0]?.type || 'plan';
  const safeRoom = String(roomName).replace(/[^a-zA-Z0-9_-]/g, '_');

  const compositePrompt = [
    'Top-view architectural floorplan enhancement.',
    `Mode: ${mode}.`,
    'Keep the plan diagram clean and aligned. No dramatic perspective change.',
    plan.prompt,
    stylePrompt ? `Additional style intent: ${stylePrompt}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  const title = `Enhanced Top View • ${mode} • ${preset}`;
  const asset = await generateInteriorAsset({
    projectId,
    room: safeRoom,
    title,
    prompt: compositePrompt,
    style: preset,
    budgetTier: 'standard',
    model: 'auto',
    reuseFirst
  });

  if (!asset) {
    return {
      enhanced: false,
      reason: 'provider_exhausted',
      plan,
      asset: null,
      fallback: {
        svg: canonicalSvg || null,
        pngUrl: canonicalPngUrl || null,
        preset
      }
    };
  }

  return {
    enhanced: true,
    reason: 'asset_generated',
    plan,
    asset: {
      id: asset.id,
      provider: asset.sourceType || asset.provider || 'unknown',
      model: asset.model || null,
      filePath: asset.filePath,
      url: asset.filePath,
      reusableScore: asset.reusableScore || null,
      tags: asset.tags || [],
      sourceType: asset.sourceType
    },
    fallback: {
      svg: canonicalSvg || null,
      pngUrl: canonicalPngUrl || null,
      preset
    }
  };
}

export { ENHANCEMENT_MODES };
