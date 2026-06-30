export type RoomTemplate = {
  key: string;
  label: string;
  roomType: string;
  modules: Array<{
    key: string;
    wallOffsetX: number;
    wallOffsetY: number;
    params: Record<string, unknown>;
  }>;
};

export const roomTemplates: RoomTemplate[] = [
  {
    key: 'living_premium_tv_feature',
    label: 'Living Premium TV Feature',
    roomType: 'living_room',
    modules: [
      {
        key: 'tv_unit',
        wallOffsetX: 2200,
        wallOffsetY: 300,
        params: { widthMm: 2400, heightMm: 500, depthMm: 420, panelType: 'fluted', consoleType: 'floating' },
      },
      {
        key: 'mandir_floor_unit',
        wallOffsetX: 500,
        wallOffsetY: 700,
        params: { widthMm: 900, heightMm: 1800, depthMm: 450, backPanelType: 'jali', storageBase: 'yes' },
      },
    ],
  },
  {
    key: 'bedroom_storage_plus_study',
    label: 'Bedroom Storage + Study',
    roomType: 'master_bedroom',
    modules: [
      {
        key: 'wardrobe_swing',
        wallOffsetX: 3800,
        wallOffsetY: 1800,
        params: { widthMm: 2400, heightMm: 2700, depthMm: 650, doorCount: 4, shelfCount: 5, drawerCount: 2 },
      },
      {
        key: 'study_desk',
        wallOffsetX: 1200,
        wallOffsetY: 3300,
        params: { widthMm: 1400, heightMm: 760, depthMm: 550 },
      },
    ],
  },
  {
    key: 'kitchen_modular_core',
    label: 'Kitchen Modular Core',
    roomType: 'kitchen',
    modules: [
      {
        key: 'kitchen_base_run',
        wallOffsetX: 2000,
        wallOffsetY: 3600,
        params: { widthMm: 3000, heightMm: 850, depthMm: 600, shutterCount: 4, drawerCount: 3 },
      },
    ],
  },
];

export function getRoomTemplates(roomType?: string) {
  return roomTemplates.filter((template) => !roomType || template.roomType === roomType);
}
