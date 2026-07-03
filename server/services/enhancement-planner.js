/**
 * Enhancement Planner
 * Converts manifest + style intent into provider-ready enhancement instructions.
 */

const MODE_PROMPTS = {
  faithful_clean: `You are enhancing a technical top-view floorplan image.
Keep all layout geometry faithful to the source manifest.
Do not add or remove rooms, walls, or openings.
Only add very subtle lightweight fills.

Preserve exact wall alignments, wall lengths, and opening styles where possible.
Output a clean top-down architectural plan image.`,

  styled_topview: `You are enhancing a top-view floorplan into a clean styled plan image.
Preserve all wall positions, opening types, and room labels/areas.
Apply a cohesive modern design palette and clear line hierarchy.
It must remain a top-down plan, not a perspective or 3D view.`,

  presentation: `You are producing a presentation-ready top-view plan from a floorplan manifest.
Preserve wall topology and room labeling. Emphasize zoning with colorfills and labels.
If exact material textures are unclear, use generic architectural materials.

Output a polished top-view plan, suitable for client review.`
};

export function buildEnhancementPrompt({ manifest, mode = 'faithful_clean', stylePrompt = '', styleReferenceUrl = '' }) {
  const rooms = (manifest.rooms || []).map((r, i) => `  - ${r.name || r.type}: ${(r.points || []).length} vertices, confidence ${((r.confidence || 0) * 100).toFixed(0)}%`).join('\\n') || '  - No explicit room polygons provided';
  const openings = (manifest.openings || []).map((o) => `${o.type}: ${o.style || 'standard'} ${o.width ? `(${(o.width / 1000).toFixed(2)}m)` : ''}`).join(', ') || 'none';
  const walls = (manifest.walls || []).length;

  const statements = [
    MODE_PROMPTS[mode] || MODE_PROMPTS.faithful_clean,
    '',
    'SOURCE MANIFEST CONSTRAINTS:',
    `  - Preserve ${walls} wall segments`,
    `  - Preserve openings: ${openings}`,
    `  - Preserve room count: ${(manifest.rooms || []).length}`,
    rooms,
    '',
    `Additional style prompt: ${stylePrompt || '(none)'}`,
    styleReferenceUrl ? `Style reference: ${styleReferenceUrl}` : '',
    '',
    'Geometry contract: preserve exact positioning and counts. Do not hallucinate new windows, walls, or furniture if uncertain.'
  ].filter(Boolean).join('\\n');

  return { prompt: statements, mode, manifest, stylePrompt, styleReferenceUrl };
}

export const buildEnhancementPlan = buildEnhancementPrompt;
export const ENHANCEMENT_MODES = Object.keys(MODE_PROMPTS);
