export type ModuleConfiguratorPreset = {
  key: string;
  label: string;
  appliesTo: string[];
  fields: Array<{
    key: string;
    label: string;
    type: 'number' | 'select';
    options?: string[];
    defaultValue: number | string;
  }>;
};

export const moduleConfiguratorPresets: ModuleConfiguratorPreset[] = [
  {
    key: 'kitchen_base_run_v1',
    label: 'Kitchen Base Run',
    appliesTo: ['kitchen_base_run'],
    fields: [
      { key: 'shutterCount', label: 'Shutter Count', type: 'number', defaultValue: 4 },
      { key: 'drawerCount', label: 'Drawer Count', type: 'number', defaultValue: 3 },
      { key: 'hardwareTier', label: 'Hardware Tier', type: 'select', options: ['standard', 'mid_premium', 'premium'], defaultValue: 'mid_premium' },
      { key: 'finishTier', label: 'Finish Tier', type: 'select', options: ['laminate_standard', 'acrylic_standard', 'veneer_premium'], defaultValue: 'laminate_standard' },
    ],
  },
  {
    key: 'wardrobe_swing_v1',
    label: 'Wardrobe Swing',
    appliesTo: ['wardrobe_swing', 'wardrobe_sliding'],
    fields: [
      { key: 'doorCount', label: 'Door Count', type: 'number', defaultValue: 4 },
      { key: 'shelfCount', label: 'Shelf Count', type: 'number', defaultValue: 5 },
      { key: 'drawerCount', label: 'Drawer Count', type: 'number', defaultValue: 2 },
      { key: 'finishTier', label: 'Finish Tier', type: 'select', options: ['laminate_standard', 'acrylic_standard', 'veneer_premium'], defaultValue: 'acrylic_standard' },
    ],
  },
  {
    key: 'tv_unit_v1',
    label: 'TV Unit',
    appliesTo: ['tv_unit'],
    fields: [
      { key: 'panelType', label: 'Panel Type', type: 'select', options: ['plain', 'fluted', 'backlit_marble'], defaultValue: 'plain' },
      { key: 'consoleType', label: 'Console Type', type: 'select', options: ['floating', 'grounded'], defaultValue: 'floating' },
      { key: 'finishTier', label: 'Finish Tier', type: 'select', options: ['laminate_standard', 'veneer_premium', 'pu_premium'], defaultValue: 'veneer_premium' },
    ],
  },
  {
    key: 'mandir_floor_unit_v1',
    label: 'Mandir',
    appliesTo: ['mandir_floor_unit'],
    fields: [
      { key: 'storageBase', label: 'Storage Base', type: 'select', options: ['yes', 'no'], defaultValue: 'yes' },
      { key: 'backPanelType', label: 'Back Panel Type', type: 'select', options: ['wood', 'jali', 'backlit_stone'], defaultValue: 'jali' },
      { key: 'platformHeightMm', label: 'Platform Height (mm)', type: 'number', defaultValue: 360 },
    ],
  },
];

export function getConfiguratorPreset(moduleType?: string) {
  return moduleConfiguratorPresets.find((preset) => moduleType && preset.appliesTo.includes(moduleType));
}
