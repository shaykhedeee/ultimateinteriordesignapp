export function summarizeDesignPlan(planJson: any) {
  return {
    styleName: planJson?.styleName ?? null,
    styleKeywords: planJson?.styleKeywords ?? [],
    materialPalette: planJson?.materialPalette ?? [],
    mustKeep: planJson?.mustKeep ?? [],
    mustAvoid: planJson?.mustAvoid ?? [],
  };
}

export function buildBasePreviewWarnings(input: {
  selectionMode: string;
  riskLevel?: 'low' | 'medium' | 'high';
  notes?: string;
}) {
  const warnings: string[] = [];
  if (input.selectionMode === 'auto_detect') {
    warnings.push('Auto-detect mode should be manually confirmed before charging credits.');
  }
  if (input.riskLevel === 'high') {
    warnings.push('This change has high visual risk and may need a manual retry path.');
  }
  if (input.notes?.toLowerCase().includes('preserve')) {
    warnings.push('Additional preserve notes detected. Validate output carefully before approval.');
  }
  return warnings;
}
