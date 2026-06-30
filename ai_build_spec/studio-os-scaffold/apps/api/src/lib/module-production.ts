import { ruleSeeds } from '@studio/rules';

type ModuleParams = Record<string, unknown>;

type ProductionMapping = {
  presetKey: string;
  boardDefaults: Record<string, unknown>;
  edgeBandDefaults: Record<string, unknown>;
  namingConvention: Record<string, unknown>;
  costEstimate: {
    baseCost: number;
    hardwareCost: number;
    finishCost: number;
    totalCost: number;
  };
  notes: string[];
};

const BASE_COSTS: Record<string, number> = {
  kitchen_base_run: 180000,
  wardrobe_swing: 120000,
  wardrobe_sliding: 145000,
  tv_unit: 95000,
  mandir_floor_unit: 45000,
  study_desk: 28000,
};

const HARDWARE_MULTIPLIERS: Record<string, number> = {
  standard: 1,
  mid_premium: 1.18,
  premium: 1.4,
  luxury: 1.8,
};

const FINISH_MULTIPLIERS: Record<string, number> = {
  laminate_standard: 1,
  laminate_budget: 0.92,
  acrylic_standard: 1.2,
  veneer_premium: 1.45,
  pu_premium: 1.55,
  glass_premium: 1.65,
};

export function estimateModuleCost(moduleType: string, params: ModuleParams) {
  const baseCost = BASE_COSTS[moduleType] ?? 50000;
  const hardwareTier = String(params.hardwareTier ?? 'standard');
  const finishTier = String(params.finishTier ?? 'laminate_standard');

  const shutterCount = Number(params.shutterCount ?? params.doorCount ?? 0);
  const drawerCount = Number(params.drawerCount ?? 0);
  const shelfCount = Number(params.shelfCount ?? 0);
  const panelType = String(params.panelType ?? 'plain');
  const backPanelType = String(params.backPanelType ?? 'wood');

  let hardwareCost = 12000 * (HARDWARE_MULTIPLIERS[hardwareTier] ?? 1);
  hardwareCost += drawerCount * 2800;
  hardwareCost += shutterCount * 900;

  let finishCost = baseCost * ((FINISH_MULTIPLIERS[finishTier] ?? 1) - 1);
  finishCost += shelfCount * 650;
  if (panelType === 'fluted') finishCost += 15000;
  if (panelType === 'backlit_marble') finishCost += 28000;
  if (backPanelType === 'jali') finishCost += 8000;
  if (backPanelType === 'backlit_stone') finishCost += 18000;

  const totalCost = Math.round(baseCost + hardwareCost + finishCost);
  return { baseCost, hardwareCost: Math.round(hardwareCost), finishCost: Math.round(finishCost), totalCost };
}

export function buildProductionMapping(moduleType: string, params: ModuleParams): ProductionMapping {
  const preset = (ruleSeeds as any).productionPreset;
  const costEstimate = estimateModuleCost(moduleType, params);
  const notes: string[] = [];

  if (moduleType === 'kitchen_base_run') notes.push('Use moisture-resistant carcass board in kitchen zones.');
  if (moduleType.startsWith('wardrobe')) notes.push('Verify clearance and wardrobe depth before production release.');
  if (moduleType === 'tv_unit') notes.push('Confirm wall service points and TV size before finalizing console alignment.');
  if (moduleType.includes('mandir')) notes.push('Check platform height, back panel type, and sacred-space adjacency rules.');

  return {
    presetKey: preset.presetKey,
    boardDefaults: preset.boardDefaults,
    edgeBandDefaults: preset.edgeBandDefaults,
    namingConvention: preset.namingConvention,
    costEstimate,
    notes,
  };
}
