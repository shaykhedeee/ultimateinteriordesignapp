import { nanoid } from 'nanoid';
import { getDb, rowToJson } from './database.js';
import { getLatestFloorPlanAnalysis } from './floor-plan-analysis-service.js';
import { getProject } from './design-engine.js';

const roomLabels = {
  living: 'Living / TV Wall',
  kitchen: 'Modular Kitchen',
  master: 'Master Suite',
  kids: 'Kids Bedroom',
  pooja: 'Pooja / Mandir',
  wardrobe: 'Wardrobe',
  foyer: 'Foyer',
  dining: 'Dining',
  study: 'Study'
};

export function generateTechnicalDrawings(projectId) {
  const project = getProject(projectId);
  if (!project) throw new Error('Project not found');
  const analysis = getLatestFloorPlanAnalysis(projectId);
  const annotations = project.floorPlan?.annotations || { zones: [], markers: [] };
  const drawings = [
    floorPlanBlockDrawing(project, annotations, analysis),
    ...componentElevationDrawings(project, annotations, analysis)
  ];
  const now = new Date().toISOString();
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO technical_drawings (id, project_id, drawing_type, payload, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  drawings.forEach((drawing) => {
    insert.run(drawing.id, projectId, drawing.type, JSON.stringify({ ...drawing, projectId, createdAt: now }), now);
  });
  return drawings.map((drawing) => ({ ...drawing, projectId, createdAt: now }));
}

export function getTechnicalDrawings(projectId) {
  return getDb()
    .prepare('SELECT payload FROM technical_drawings WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId)
    .map(rowToJson);
}

function floorPlanBlockDrawing(project, annotations, analysis) {
  return {
    id: nanoid(12),
    type: 'room-block-plan',
    title: 'Room Block Plan',
    disclaimer: 'Conceptual block drawing from annotations. Verify dimensions on site before working drawings.',
    scaleMode: analysis?.accuracyMode || 'annotated-no-scale',
    blocks: (annotations.zones || []).map((zone) => ({
      label: zone.label || roomLabels[zone.room] || zone.room,
      room: zone.room,
      x: pct(zone.x),
      y: pct(zone.y),
      w: pct(zone.w ?? zone.width),
      h: pct(zone.h ?? zone.height),
      estimatedArea: analysis?.estimatedAreas?.find((item) => item.room === zone.room) || null
    })),
    markers: (annotations.markers || []).map((marker) => ({
      label: marker.type,
      room: marker.room,
      x: pct(marker.x),
      y: pct(marker.y),
      note: [marker.placementNote, marker.sizeNote, marker.furnitureRequirement].filter(Boolean).join('; ')
    })),
    notes: project.floorPlanNotes || ''
  };
}

function componentElevationDrawings(project, annotations, analysis) {
  const markers = annotations.markers || [];
  return markers
    .filter((marker) => ['TV Unit', 'Wardrobe', 'Kitchen Run', 'Mandir', 'Study Desk', 'Shoe Rack'].includes(marker.type))
    .slice(0, 8)
    .map((marker) => {
      const dims = parseDimensions(marker.sizeNote) || defaultDimensions(marker.type);
      return {
        id: nanoid(12),
        type: 'component-elevation',
        title: `${marker.type} Concept Elevation`,
        room: marker.room,
        roomLabel: roomLabels[marker.room] || marker.room,
        disclaimer: 'Basic concept elevation for proposal discussion. Final working drawing starts after brief approval and site measurement.',
        widthMm: dims.widthMm,
        heightMm: dims.heightMm,
        depthMm: dims.depthMm,
        scaleMode: dims.fromNote ? 'designer-entered-dimension' : analysis?.accuracyMode || 'standard-default',
        modules: moduleBlocks(marker.type, dims),
        notes: [marker.placementNote, marker.furnitureRequirement].filter(Boolean).join(' ')
      };
    });
}

function moduleBlocks(type, dims) {
  if (type === 'Kitchen Run') {
    return [
      { label: 'Base carcass', x: 0, y: 40, w: 100, h: 42 },
      { label: 'Countertop', x: 0, y: 36, w: 100, h: 4 },
      { label: 'Wall storage', x: 0, y: 0, w: 100, h: 30 }
    ];
  }
  if (type === 'Wardrobe') {
    return [
      { label: 'Left shutter', x: 0, y: 0, w: 50, h: 100 },
      { label: 'Right shutter', x: 50, y: 0, w: 50, h: 100 },
      { label: 'Loft zone', x: 0, y: 0, w: 100, h: 18 }
    ];
  }
  if (type === 'TV Unit') {
    return [
      { label: 'Back panel', x: 18, y: 0, w: 64, h: 70 },
      { label: 'TV zone', x: 32, y: 18, w: 36, h: 28 },
      { label: 'Low console', x: 0, y: 70, w: 100, h: 20 }
    ];
  }
  return [{ label: type, x: 0, y: 0, w: 100, h: 100 }];
}

function parseDimensions(text = '') {
  const numbers = String(text).match(/\d{3,5}/g)?.map(Number) || [];
  if (numbers.length < 2) return null;
  return {
    widthMm: numbers[0],
    heightMm: numbers[1],
    depthMm: numbers[2] || 450,
    fromNote: true
  };
}

function defaultDimensions(type) {
  const map = {
    'TV Unit': { widthMm: 2400, heightMm: 2100, depthMm: 450 },
    Wardrobe: { widthMm: 1800, heightMm: 2100, depthMm: 600 },
    'Kitchen Run': { widthMm: 3000, heightMm: 2100, depthMm: 560 },
    Mandir: { widthMm: 900, heightMm: 1800, depthMm: 420 },
    'Study Desk': { widthMm: 1600, heightMm: 1800, depthMm: 550 },
    'Shoe Rack': { widthMm: 1200, heightMm: 1050, depthMm: 380 }
  };
  return map[type] || { widthMm: 1200, heightMm: 1800, depthMm: 450 };
}

function pct(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(Math.max(0, Math.min(100, number)));
}
