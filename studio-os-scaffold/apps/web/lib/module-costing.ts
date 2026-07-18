export function estimateModuleConfiguratorCost(moduleType: string, params: Record<string, unknown>) {
  const baseCosts: Record<string, number> = {
    kitchen_base_run: 180000,
    wardrobe_swing: 120000,
    wardrobe_sliding: 145000,
    tv_unit: 95000,
    mandir_floor_unit: 45000,
    study_desk: 28000,
  };

  const finishMultipliers: Record<string, number> = {
    laminate_standard: 1,
    acrylic_standard: 1.2,
    veneer_premium: 1.45,
    pu_premium: 1.55,
    glass_premium: 1.65,
  };

  const hardwareMultipliers: Record<string, number> = {
    standard: 1,
    mid_premium: 1.18,
    premium: 1.4,
    luxury: 1.8,
  };

  const baseCost = baseCosts[moduleType] ?? 50000;
  const finishTier = String(params.finishTier ?? 'laminate_standard');
  const hardwareTier = String(params.hardwareTier ?? 'standard');
  const drawerCount = Number(params.drawerCount ?? 0);
  const shelfCount = Number(params.shelfCount ?? 0);
  const shutterCount = Number(params.shutterCount ?? params.doorCount ?? 0);
  const panelType = String(params.panelType ?? 'plain');
  const backPanelType = String(params.backPanelType ?? 'wood');

  let hardwareCost = 12000 * (hardwareMultipliers[hardwareTier] ?? 1);
  hardwareCost += drawerCount * 2800;
  hardwareCost += shutterCount * 900;

  let finishCost = baseCost * ((finishMultipliers[finishTier] ?? 1) - 1);
  finishCost += shelfCount * 650;
  if (panelType === 'fluted') finishCost += 15000;
  if (panelType === 'backlit_marble') finishCost += 28000;
  if (backPanelType === 'jali') finishCost += 8000;
  if (backPanelType === 'backlit_stone') finishCost += 18000;

  const total = Math.round(baseCost + hardwareCost + finishCost);
  return {
    baseCost,
    hardwareCost: Math.round(hardwareCost),
    finishCost: Math.round(finishCost),
    total,
  };
}
