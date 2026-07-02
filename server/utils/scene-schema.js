import { nanoid } from 'nanoid';

export const CANONICAL_SCENE_SCHEMA_VERSION = '1.0';

export function createBaseScene({
  projectId,
  roomsList = [],
  wallsList = [],
  openingsList = [],
  modulesList = [],
  furnitureList = [],
}) {
  const rooms = roomsList.map((r) => ({
    roomId: r.id || r.roomId || 'room_' + nanoid(6),
    roomType: r.type || r.roomType || 'living_room',
    name: r.name || r.label || 'Room',
    polygon2d: Array.isArray(r.points) ? r.points.map((p) => ({ x: p.x, y: p.y })) : r.polygon2d || [],
    heightMm: r.heightMm || 2900,
    floorFinishId: r.floorFinishId || null,
    ceilingStyleId: r.ceilingStyleId || null,
    walls: Array.isArray(r.walls) ? r.walls : [],
    modules: Array.isArray(r.modules) ? r.modules : [],
    furniture: Array.isArray(r.furniture) ? r.furniture : [],
    photos: Array.isArray(r.photos) ? r.photos : [],
  }));

  const walls = wallsList.map((w) => ({
    wallId: w.id || w.wallId || 'wall_' + nanoid(6),
    roomIdPrimary: w.roomIdPrimary || (roomsList[0]?.id || roomsList[0]?.roomId || 'room_1'),
    start: { x: w.x1 ?? w.start?.x ?? 0, y: w.y1 ?? w.start?.y ?? 0 },
    end: { x: w.x2 ?? w.end?.x ?? 0, y: w.y2 ?? w.end?.y ?? 0 },
    thicknessMm: w.thickness ?? w.thicknessMm ?? 150,
    heightMm: w.heightMm ?? 2900,
    openings: Array.isArray(w.openings) ? w.openings : [],
    finishInnerId: w.finishInnerId || null,
    finishOuterId: w.finishOuterId || null,
    photos: Array.isArray(w.photos) ? w.photos : [],
  }));

  const openings = openingsList.map((op) => ({
    openingId: op.id || op.openingId || 'op_' + nanoid(6),
    wallId: op.wallId || '',
    openingType: op.type || op.openingType || 'door',
    offsetFromStartMm: op.offsetFromStartMm ?? op.x ?? 1000,
    widthMm: op.width ?? 900,
    sillHeightMm: op.sillHeightMm ?? (op.type === 'window' ? 800 : 0),
    headHeightMm: op.headHeightMm ?? 2100,
  }));

  const modules = modulesList.map((m) => ({
    moduleId: m.id || m.moduleId || 'mod_' + nanoid(6),
    moduleType: m.type || m.moduleType || 'furniture_item',
    roomRef: m.roomRef || m.roomId || roomsList[0]?.id || roomsList[0]?.roomId || 'room_1',
    name: m.name || m.label || (m.type ? String(m.type).toUpperCase() : 'Item'),
    geometry: {
      anchor: {
        roomId: m.roomRef || m.roomId || roomsList[0]?.id || roomsList[0]?.roomId || 'room_1',
        x: m.x ?? m.geometry?.anchor?.x ?? 0,
        y: m.y ?? m.geometry?.anchor?.y ?? 0,
        z: m.z ?? m.geometry?.anchor?.z ?? 0,
      },
      size: {
        widthMm: m.width ?? m.geometry?.size?.widthMm ?? 600,
        heightMm: m.height ?? m.geometry?.size?.heightMm ?? 720,
        depthMm: m.depth ?? m.geometry?.size?.depthMm ?? 600,
      },
      rotationDeg: m.rotation ?? m.geometry?.rotationDeg ?? 0,
    },
    params: m.params || {},
    materialAssignments: m.materialAssignments || {},
    productionMapping: m.productionMapping || {},
  }));

  const baseScene = {
    schemaVersion: CANONICAL_SCENE_SCHEMA_VERSION,
    projectId,
    units: 'mm',
    levels: [
      {
        levelId: 'level_1',
        name: 'Ground Floor',
        elevationMm: 0,
        rooms,
        walls,
        openings,
        modules: [...modules, ...mapFurnitureToModules(furnitureList, roomsList)],
        furniture: [],
        photos: [],
        lights: [
          {
            lightId: 'ambient_1',
            type: 'ambient',
            intensity: 0.7,
            position: { x: 0, y: 0, z: 3000 },
            color: '#ffffff',
          },
        ],
        cameras: [
          {
            cameraId: 'cam_iso',
            name: 'Isometric View',
            type: 'perspective',
            position: { x: 5000, y: 4000, z: 5000 },
            target: { x: 0, y: 0, z: 0 },
          },
          {
            cameraId: 'cam_top',
            name: 'Top View',
            type: 'orthographic',
            position: { x: 0, y: 8000, z: 0 },
            target: { x: 0, y: 0, z: 0 },
          },
        ],
      },
    ],
    materials: [],
    lights: [],
    cameras: [],
    settings: {
      budgetBand: 'standard',
    },
    ruleResults: {
      passCount: 0,
      warnCount: 0,
      failCount: 0,
      results: [],
    },
  };

  return baseScene;
}

function mapFurnitureToModules(furnitureList, roomsList) {
  if (!Array.isArray(furnitureList) || furnitureList.length === 0) return [];
  return furnitureList.map((f) => ({
    moduleId: f.id || 'mod_' + nanoid(6),
    moduleType: f.type || 'furniture_item',
    roomRef: f.roomId || roomsList[0]?.id || roomsList[0]?.roomId || 'room_1',
    name: f.name || f.type?.toUpperCase() || 'Item',
    geometry: {
      anchor: {
        roomId: f.roomId || roomsList[0]?.id || roomsList[0]?.roomId || 'room_1',
        x: f.x ?? 0,
        y: f.y ?? 0,
        z: f.z ?? 0,
      },
      size: {
        widthMm: (f.width || 60) * 10,
        heightMm: f.height || 720,
        depthMm: (f.depth || 60) * 10,
      },
      rotationDeg: f.rotation || 0,
    },
    params: f.params || {},
    materialAssignments: f.materialAssignments || {},
    productionMapping: f.productionMapping || {},
  }));
}

export function normalizeSceneToCanonical(scene) {
  if (!scene || typeof scene !== 'object') {
    return createBaseScene({ projectId: 'unknown' });
  }

  const levels = Array.isArray(scene.levels) ? scene.levels : [];
  const level = levels[0] || {};

  return createBaseScene({
    projectId: scene.projectId || 'unknown',
    roomsList: Array.isArray(level.rooms) ? level.rooms : [],
    wallsList: Array.isArray(level.walls) ? level.walls : [],
    openingsList: Array.isArray(level.openings) ? level.openings : [],
    modulesList: Array.isArray(level.modules) ? level.modules : [],
    furnitureList: Array.isArray(level.furniture) ? level.furniture : [],
  });
}

export function validateSceneSchema(scene) {
  const errors = [];

  if (!scene || typeof scene !== 'object') {
    errors.push('Scene document is null or not an object');
    return { valid: false, errors };
  }

  if (scene.schemaVersion !== CANONICAL_SCENE_SCHEMA_VERSION) {
    errors.push(`Invalid schemaVersion: expected "${CANONICAL_SCENE_SCHEMA_VERSION}", got "${scene.schemaVersion}"`);
  }

  if (!scene.projectId || typeof scene.projectId !== 'string') {
    errors.push('Missing or invalid projectId');
  }

  if (!Array.isArray(scene.levels)) {
    errors.push('Missing levels array');
    return { valid: false, errors };
  }

  const level = scene.levels[0];
  if (!level) {
    errors.push('levels array is empty');
    return { valid: false, errors };
  }

  if (!Array.isArray(level.rooms)) errors.push('Missing rooms array in level');
  if (!Array.isArray(level.walls)) errors.push('Missing walls array in level');
  if (!Array.isArray(level.openings)) errors.push('Missing openings array in level');
  if (!Array.isArray(level.modules)) errors.push('Missing modules array in level');
  if (!Array.isArray(level.cameras)) errors.push('Missing cameras array in level');
  if (!Array.isArray(level.lights)) errors.push('Missing lights array in level');

  if (!scene.settings || typeof scene.settings !== 'object') errors.push('Missing settings object');
  if (!scene.ruleResults || typeof scene.ruleResults !== 'object') errors.push('Missing ruleResults object');

  return { valid: errors.length === 0, errors };
}
