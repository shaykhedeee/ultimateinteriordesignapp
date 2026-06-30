'use client';

const templates = [
  { key: 'tv_unit', label: 'TV Unit', params: { widthMm: 2200, heightMm: 500, depthMm: 400, panelType: 'fluted', consoleType: 'floating' }, roomRef: 'room_living_1', wallRef: 'wall_l1', anchor: { x: 2200, y: 300, z: 0 } },
  { key: 'wardrobe_swing', label: 'Wardrobe Swing', params: { widthMm: 2400, heightMm: 2700, depthMm: 650, doorCount: 4, shelfCount: 5, drawerCount: 2 }, roomRef: 'room_living_1', wallRef: 'wall_l2', anchor: { x: 4200, y: 1800, z: 0 } },
  { key: 'wardrobe_sliding', label: 'Wardrobe Sliding', params: { widthMm: 2400, heightMm: 2700, depthMm: 650, doorCount: 3, shelfCount: 5, drawerCount: 2 }, roomRef: 'room_living_1', wallRef: 'wall_l2', anchor: { x: 4200, y: 2400, z: 0 } },
  { key: 'mandir_floor_unit', label: 'Mandir', params: { widthMm: 900, heightMm: 1800, depthMm: 450, backPanelType: 'jali', storageBase: 'yes' }, roomRef: 'room_living_1', wallRef: 'wall_l4', anchor: { x: 400, y: 800, z: 0 } },
  { key: 'kitchen_base_run', label: 'Kitchen Base Run', params: { widthMm: 3000, heightMm: 850, depthMm: 600, shutterCount: 4, drawerCount: 3 }, roomRef: 'room_living_1', wallRef: 'wall_l3', anchor: { x: 2500, y: 3600, z: 0 } },
];

export function TemplatePalette({ onPlace, readonly }: { onPlace: (template: (typeof templates)[number]) => Promise<void>; readonly?: boolean }) {
  return (
    <div className="panel">
      <h3>Template Palette</h3>
      <div className="listMock">
        {templates.map((template) => (
          <div key={template.key} className="rowMock">
            <strong>{template.label}</strong>
            <div className="muted">{template.key}</div>
            <button disabled={readonly} style={{ marginTop: 8 }} onClick={() => onPlace(template)}>Place</button>
          </div>
        ))}
      </div>
    </div>
  );
}
