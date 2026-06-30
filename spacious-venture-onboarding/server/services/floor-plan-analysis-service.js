import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { getDb, rootDir, rowToJson } from './database.js';
import { getProject } from './design-engine.js';
import { evaluateVastu } from './standards.js';
import fpEngine from './fp-understanding-engine.js';
import { isNativeOpenAiKey } from './provider-config.js';

const roomLabels = {
  living: 'Living / TV Wall',
  kitchen: 'Modular Kitchen',
  master: 'Master Suite',
  kids: 'Kids Bedroom',
  pooja: 'Pooja / Mandir',
  foyer: 'Foyer Storage',
  dining: 'Dining / Crockery',
  guest: 'Guest Bedroom',
  study: 'Study / WFH',
  utility: 'Utility / Laundry',
  balcony: 'Balcony Sit-out'
};

export async function analyzeProjectFloorPlan(projectId, input = {}) {
  const project = getProject(projectId);
  if (!project) throw new Error('Project not found');

  const annotations = normalizeAnnotations(input.annotations || project.floorPlan?.annotations || {});
  const calibration = normalizeCalibration(input.calibration || project.floorPlan?.analysis?.calibration || {});
  const advisoryVision = await advisoryVisionAnalysis(project, input);
  const analysis = buildAnnotatedAnalysis(project, annotations, calibration, advisoryVision);
  const imagePath = project.floorPlan?.filePath || '';
  const originalName = project.floorPlan?.filePath?.split('/').pop() || '';

  return persistFloorPlanAnalysis(projectId, analysis, { imagePath, originalName });
}

export async function analyzeUploadedFloorPlan(file, input = {}) {
  if (!file?.path) throw new Error('No floor-plan file provided');

  const project = input.projectId ? getProject(input.projectId) : null;
  const annotations = normalizeAnnotations(parseMaybeJson(input.annotations) || project?.floorPlan?.annotations || {});
  const calibration = normalizeCalibration(parseMaybeJson(input.calibration) || project?.floorPlan?.analysis?.calibration || {});
  const options = { style: input.style || input.theme || project?.style || 'Indian Contemporary', budget: input.budgetTier || project?.budgetTier || 'premium' };
  const advisoryVision = await fpEngine.analyze(file.path, options);
  const analysis = buildAnnotatedAnalysis(project || buildDraftProject(input), annotations, calibration, normalizeVisionResult(advisoryVision));
  const merged = mergeVisionIntoAnalysis(analysis, advisoryVision);

  if (input.projectId) {
    return persistFloorPlanAnalysis(input.projectId, merged, { imagePath: file.path, originalName: file.originalname || file.filename || '' });
  }

  return {
    id: `fpa-${nanoid(10)}`,
    projectId: null,
    ...merged,
    createdAt: new Date().toISOString()
  };
}

export function normalizeFloorPlanAnalysisForRender(analysis = {}) {
  const rooms = Array.isArray(analysis.rooms) && analysis.rooms.length
    ? analysis.rooms
    : (analysis.roomsDetected || []).map((room, index) => ({
      id: `room-${index + 1}`,
      name: roomLabels[room] || room,
      type: room,
      areaSqFt: analysis.estimatedAreas?.find((item) => item.room === room)?.areaSqFt || null,
      dimensionsMm: dimensionsFromArea(analysis.estimatedAreas?.find((item) => item.room === room)),
      confidence: (analysis.confidence || 45) / 100,
      sourceLabel: 'confirmed'
    }));

  const components = Array.isArray(analysis.components) && analysis.components.length
    ? analysis.components
    : (analysis.componentMarkers || []).map((marker) => ({
      type: marker.type,
      moduleType: moduleTypeFor(marker.type),
      roomName: marker.roomLabel || roomLabels[marker.room] || marker.room,
      roomId: marker.room ? `room-${marker.room}` : '',
      confidence: 0.88,
      sourceLabel: 'confirmed',
      placementNote: marker.placementNote,
      furnitureRequirement: marker.furnitureRequirement,
      suggestedDimensions: dimensionsForMarker(marker.type)
    }));

  return {
    ...analysis,
    rooms,
    components,
    walls: analysis.walls || buildDescriptiveWalls(rooms),
    constraints: {
      ...(analysis.constraints || {}),
      project: analysis.constraints?.project || {},
      renderConstraints: rooms.map((room) => ({
        roomName: room.name,
        dimensions: room.dimensionsMm || room.dimensions || { width: 3600, length: 3600, height: 2750 },
        components: components.filter((component) => component.roomName === room.name || component.roomId === room.id || component.roomId === `room-${room.type}`)
      })),
      floorPlanUnderstanding: analysis.whatAiUnderstood,
      sourceLabels: analysis.sourceLabels || []
    }
  };
}

function persistFloorPlanAnalysis(projectId, analysis, fileMeta = {}) {
  const now = new Date().toISOString();
  const id = nanoid(12);

  const analysisJson = JSON.stringify({ id, projectId, ...analysis, createdAt: now });
  const roomsCount = analysis.rooms?.length || analysis.roomsDetected?.length || 0;
  const wallsCount = analysis.walls?.length || analysis.estimatedAreas?.length || 0;
  const componentsCount = analysis.components?.length || analysis.componentMarkers?.length || 0;
  const confidence = analysis.confidence || 0;
  const imagePath = fileMeta.imagePath || '';
  const originalName = fileMeta.originalName || '';

  getDb().prepare(`
    INSERT INTO floor_plan_analyses (id, project_id, image_path, original_filename, 
      analysis_json, rooms_count, walls_count, components_count, confidence, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
  `).run(id, projectId, imagePath, originalName, 
    analysisJson, roomsCount, wallsCount, componentsCount, confidence);

  return { id, projectId, ...analysis, createdAt: now };
}

export function getLatestFloorPlanAnalysis(projectId) {
  const row = getDb()
    .prepare('SELECT analysis_json FROM floor_plan_analyses WHERE project_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(projectId);
  if (!row) return null;
  return JSON.parse(row.analysis_json);
}

function buildAnnotatedAnalysis(project, annotations, calibration, advisoryVision) {
  const zones = annotations.zones.map((zone) => ({
    id: zone.id,
    room: zone.room,
    label: zone.label || roomLabels[zone.room] || zone.room,
    bounds: {
      x: pct(zone.x),
      y: pct(zone.y),
      w: pct(zone.w ?? zone.width),
      h: pct(zone.h ?? zone.height)
    },
    note: zone.note || ''
  }));
  const markers = annotations.markers.map((marker) => ({
    id: marker.id,
    room: marker.room,
    roomLabel: roomLabels[marker.room] || marker.room,
    type: marker.type || 'Component',
    x: pct(marker.x),
    y: pct(marker.y),
    placementNote: marker.placementNote || '',
    sizeNote: marker.sizeNote || '',
    furnitureRequirement: marker.furnitureRequirement || ''
  }));
  const roomsDetected = [...new Set([...zones.map((zone) => zone.room), ...markers.map((marker) => marker.room)].filter(Boolean))];
  const expectedRooms = Array.isArray(project.selectedSpaces) ? project.selectedSpaces : [];
  const missingRooms = expectedRooms.filter((room) => !roomsDetected.includes(room));
  const markerChecklist = buildMarkerChecklist(expectedRooms, markers);
  const componentTypes = [...new Set(markers.map((marker) => marker.type).filter(Boolean))];
  const furnitureRequirements = markers
    .filter((marker) => marker.furnitureRequirement)
    .map((marker) => `${marker.roomLabel}: ${marker.type} - ${marker.furnitureRequirement}`);
  const circulationConcerns = buildCirculationConcerns(project, zones, markers);
  const vastu = evaluateVastu(roomsDetected.length ? roomsDetected : expectedRooms, project.vastuStrictness || 'general');
  const estimatedAreas = estimateAreas(zones, calibration);
  const rooms = buildRoomsForRender({ zones, markers, roomsDetected, estimatedAreas, confidence: null });
  const components = buildComponentsForRender(markers);
  const walls = buildDescriptiveWalls(rooms);
  const adjacency = buildAdjacency(zones);
  const openings = extractOpenings(markers, advisoryVision);
  const confidence = confidenceFor({ zones, markers, calibration, advisoryVision });
  rooms.forEach((room) => { room.confidence = confidence / 100; });
  const understood = [
    roomsDetected.length ? `Detected ${roomsDetected.map((room) => roomLabels[room] || room).join(', ')} from manual zones and markers.` : 'No room zones have been marked yet.',
    componentTypes.length ? `Key marked components: ${componentTypes.join(', ')}.` : 'No furniture/component markers have been placed yet.',
    furnitureRequirements.length ? `Furniture notes captured for ${furnitureRequirements.length} marked components.` : 'Furniture requirements can be typed on each marker.',
    calibration.knownLengthMm ? 'Approximate sizes are estimated from the designer calibration.' : 'No scale calibration is set, so measurements are descriptive only.'
  ].join(' ');

  return {
    accuracyMode: calibration.knownLengthMm ? 'annotated-estimated-scale' : 'annotated-no-scale',
    confidence,
    whatAiUnderstood: understood,
    roomsDetected,
    rooms,
    missingRooms,
    componentMarkers: markers,
    components,
    walls,
    openings,
    adjacency,
    furnitureRequirements,
    circulationConcerns,
    vastuNotes: vastu.reports || [],
    vastuScore: vastu.score || 0,
    requiredMarkers: markerChecklist.required,
    missingComponents: markerChecklist.missing,
    humanReviewRequired: confidence < 72 || markerChecklist.missing.length > 0 || !calibration.knownLengthMm,
    renderReadiness: {
      status: confidence >= 78 && markerChecklist.missing.length === 0 ? 'ready' : confidence >= 55 ? 'needs-designer-review' : 'not-ready',
      confidence,
      canGenerateConceptRender: rooms.length > 0 || markers.length > 0,
      canGeneratePrecisionRender: confidence >= 78 && markerChecklist.missing.length === 0 && Boolean(calibration.knownLengthMm),
      note: calibration.knownLengthMm
        ? 'Annotated floor plan can guide prompt-constrained renders. Verify site dimensions before production.'
        : 'Annotated floor plan can guide concept renders. Add one known dimension before claiming approximate measurements.'
    },
    estimatedAreas,
    calibration,
    advisoryVision,
    providerTrace: [
      { stage: 'manual-annotation-fusion', provider: 'local', authoritative: true },
      advisoryVision?.provider ? { stage: 'vision-advisory', provider: advisoryVision.provider, authoritative: false } : null
    ].filter(Boolean),
    sourceLabels: [
      'confirmed: designer-marked zones and markers',
      calibration.knownLengthMm ? 'estimated: dimensions from manual calibration' : 'descriptive: no scale calibration provided',
      advisoryVision?.summary ? 'inferred: AI vision advisory only' : 'inferred: none'
    ],
    constraints: {
      confirmed: [
        ...zones.map((zone) => `${zone.label} zone marked`),
        ...markers.map((marker) => `${marker.type} in ${marker.roomLabel}`)
      ],
      estimated: estimatedAreas.map((area) => `${area.label}: ${area.widthMm} x ${area.depthMm} mm, ${area.areaSqFt} sq.ft`),
      inferred: advisoryVision?.summary ? [advisoryVision.summary] : [],
      renderConstraints: rooms.map((room) => ({
        roomName: room.name,
        dimensions: room.dimensionsMm,
        components: components.filter((component) => component.roomId === room.id || component.roomName === room.name)
      }))
    },
    nextDesignerActions: nextDesignerActions({ missingRooms, markers, calibration, circulationConcerns, missingComponents: markerChecklist.missing })
  };
}

function buildRoomsForRender({ zones, markers, roomsDetected, estimatedAreas }) {
  const fromZones = zones.map((zone, index) => {
    const area = estimatedAreas.find((item) => item.room === zone.room);
    return {
      id: `room-${zone.room || index + 1}`,
      name: zone.label,
      type: zone.room || 'room',
      areaSqFt: area?.areaSqFt || null,
      dimensionsMm: dimensionsFromArea(area),
      bounds: zone.bounds,
      notes: zone.note,
      sourceLabel: 'confirmed'
    };
  });
  if (fromZones.length) return fromZones;
  return roomsDetected.map((room, index) => ({
    id: `room-${room || index + 1}`,
    name: roomLabels[room] || room,
    type: room,
    areaSqFt: null,
    dimensionsMm: { width: 3600, length: 3600, height: 2750, label: 'descriptive default; calibrate before quoting dimensions' },
    sourceLabel: 'confirmed'
  }));
}

function buildComponentsForRender(markers) {
  return markers.map((marker, index) => ({
    id: marker.id || `component-${index + 1}`,
    type: marker.type,
    moduleType: moduleTypeFor(marker.type),
    roomName: marker.roomLabel || roomLabels[marker.room] || marker.room,
    roomId: marker.room ? `room-${marker.room}` : '',
    confidence: 0.9,
    sourceLabel: 'confirmed',
    placement: { x: marker.x, y: marker.y, note: marker.placementNote },
    sizeNote: marker.sizeNote,
    furnitureRequirement: marker.furnitureRequirement,
    suggestedDimensions: dimensionsForMarker(marker.type)
  }));
}

function buildDescriptiveWalls(rooms = []) {
  return rooms.flatMap((room) => [
    { roomId: room.id, roomName: room.name, type: 'descriptive', orientation: 'main wall', length: room.dimensionsMm?.width || 3600, sourceLabel: 'estimated' },
    { roomId: room.id, roomName: room.name, type: 'descriptive', orientation: 'return wall', length: room.dimensionsMm?.length || 3600, sourceLabel: 'estimated' }
  ]);
}

function buildAdjacency(zones) {
  return zones.flatMap((zone, index) => zones.slice(index + 1).filter((other) => boxesTouch(zone.bounds, other.bounds)).map((other) => ({
    from: zone.label,
    to: other.label,
    sourceLabel: 'estimated',
    note: 'Adjacency inferred from marked zone proximity.'
  })));
}

function extractOpenings(markers, advisoryVision) {
  const manual = markers
    .filter((marker) => ['Window', 'Door'].includes(marker.type))
    .map((marker) => ({ type: marker.type, room: marker.roomLabel, x: marker.x, y: marker.y, sourceLabel: 'confirmed', note: marker.placementNote || '' }));
  if (manual.length) return manual;
  return advisoryVision?.summary
    ? [{ type: 'advisory', sourceLabel: 'inferred', note: 'AI vision may have identified openings; verify against the floor plan before render approval.' }]
    : [];
}

function mergeVisionIntoAnalysis(analysis, vision = {}) {
  if (!vision?.rooms?.length && !vision?.components?.length) return analysis;
  const hasManualRooms = analysis.rooms?.length > 0;
  const rooms = hasManualRooms ? analysis.rooms : vision.rooms.map((room, index) => ({
    id: room.id || `vision-room-${index + 1}`,
    name: room.name || `Room ${index + 1}`,
    type: room.type || 'room',
    areaSqFt: room.areaSqFt || null,
    dimensionsMm: room.dimensionsMm || { width: 3600, length: 3600, height: 2750 },
    confidence: room.confidence || 0.45,
    sourceLabel: 'inferred',
    notes: room.notes || 'Advisory AI vision result; confirm with manual zone.'
  }));
  const components = analysis.components?.length ? analysis.components : (vision.components || []).map((component, index) => ({
    id: component.id || `vision-component-${index + 1}`,
    type: component.type || 'Component',
    moduleType: component.moduleType || moduleTypeFor(component.type),
    roomName: component.roomName || rooms[0]?.name || 'Unassigned',
    roomId: component.roomId || rooms[0]?.id || '',
    confidence: component.confidence || 0.45,
    sourceLabel: 'inferred',
    suggestedDimensions: component.suggestedDimensions || dimensionsForMarker(component.type)
  }));
  return {
    ...analysis,
    rooms,
    components,
    walls: analysis.walls?.length ? analysis.walls : (vision.walls || buildDescriptiveWalls(rooms)),
    confidence: Math.max(analysis.confidence || 0, Math.min(72, vision.confidence || 0)),
    whatAiUnderstood: [analysis.whatAiUnderstood, vision.whatAiUnderstood].filter(Boolean).join(' '),
    nextDesignerActions: [...new Set([...(analysis.nextDesignerActions || []), ...(vision.nextDesignerActions || [])])].slice(0, 8),
    constraints: {
      ...(analysis.constraints || {}),
      warnings: vision.constraints?.warnings || [],
      inferred: [...(analysis.constraints?.inferred || []), vision.whatAiUnderstood || vision.summary].filter(Boolean)
    }
  };
}

function buildCirculationConcerns(project, zones, markers) {
  const concerns = [];
  const selected = new Set(project.selectedSpaces || []);
  if (selected.has('living') && !markers.some((marker) => marker.type === 'TV Unit')) {
    concerns.push('Living room has no TV Unit marker. Mark the TV wall before generating final renders.');
  }
  if (selected.has('living') && !markers.some((marker) => marker.type === 'Sofa')) {
    concerns.push('Living room has no Sofa marker. Add sofa placement to improve render perspective.');
  }
  if (selected.has('kitchen') && !markers.some((marker) => marker.type === 'Kitchen Run')) {
    concerns.push('Kitchen has no Kitchen Run marker. Mark counter run and hob/sink notes before cutlist.');
  }
  if (selected.has('pooja') && !markers.some((marker) => marker.type === 'Mandir')) {
    concerns.push('Pooja selected but mandir placement is not marked.');
  }
  if (!zones.length) concerns.push('Draw room zones so the app can connect components to spaces.');
  return concerns;
}

function buildMarkerChecklist(selectedRooms = [], markers = []) {
  const requiredByRoom = {
    living: ['TV Unit', 'Sofa'],
    kitchen: ['Kitchen Run'],
    master: ['Bed', 'Wardrobe'],
    kids: ['Bed', 'Wardrobe'],
    guest: ['Bed', 'Wardrobe'],
    pooja: ['Mandir'],
    dining: ['Dining'],
    study: ['Study Desk'],
    foyer: ['Shoe Rack']
  };
  const markerTypesByRoom = new Map();
  markers.forEach((marker) => {
    const room = marker.room || 'unassigned';
    const types = markerTypesByRoom.get(room) || new Set();
    types.add(marker.type);
    markerTypesByRoom.set(room, types);
  });
  const required = selectedRooms.flatMap((room) => (requiredByRoom[room] || []).map((type) => ({ room, type })));
  const missing = required.filter(({ room, type }) => !markerTypesByRoom.get(room)?.has(type))
    .map(({ room, type }) => `${roomLabels[room] || room}: add ${type} marker`);
  return { required, missing };
}

function estimateAreas(zones, calibration) {
  if (!calibration.knownLengthMm || !calibration.referencePercent) return [];
  const mmPerPercent = Number(calibration.knownLengthMm) / Number(calibration.referencePercent);
  if (!Number.isFinite(mmPerPercent) || mmPerPercent <= 0) return [];
  return zones.map((zone) => {
    const widthMm = Math.round(zone.bounds.w * mmPerPercent);
    const depthMm = Math.round(zone.bounds.h * mmPerPercent);
    return {
      room: zone.room,
      label: zone.label,
      widthMm,
      depthMm,
      areaSqFt: Number(((widthMm * depthMm) / 92903.04).toFixed(1)),
      note: 'Estimated from manual annotation and calibration; verify on site.'
    };
  });
}

function confidenceFor({ zones, markers, calibration, advisoryVision }) {
  let score = 35;
  score += Math.min(zones.length, 6) * 7;
  score += Math.min(markers.length, 8) * 4;
  if (calibration.knownLengthMm) score += 12;
  if (advisoryVision?.summary) score += 6;
  return Math.max(20, Math.min(92, score));
}

function nextDesignerActions({ missingRooms, markers, calibration, circulationConcerns, missingComponents = [] }) {
  const actions = [];
  if (missingRooms.length) actions.push(`Mark zones for: ${missingRooms.map((room) => roomLabels[room] || room).join(', ')}.`);
  if (!markers.length) actions.push('Add at least TV Unit, Sofa, Kitchen Run, Wardrobe, and Mandir markers where applicable.');
  actions.push(...missingComponents.slice(0, 4));
  if (!calibration.knownLengthMm) actions.push('Add one known wall length if approximate size estimates are needed.');
  actions.push(...circulationConcerns.slice(0, 3));
  return [...new Set(actions)].slice(0, 6);
}

async function advisoryVisionAnalysis(project, input) {
  if (input.useVision === false) return { provider: 'manual-annotations', summary: '', advisoryOnly: true };
  const imageData = input.floorPlanImageBase64 || floorPlanDataUrl(project.floorPlan?.previewPath || project.floorPlan?.filePath);
  if (!imageData) return { provider: 'manual-annotations', summary: '' };
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_KEY_1 || process.env.GOOGLE_AI_STUDIO_KEY_2;
  if (key) {
    const gemini = await tryGeminiVision(key, imageData);
    if (gemini) return gemini;
  }
  if (isNativeOpenAiKey(process.env.OPENAI_API_KEY)) {
    const openai = await tryOpenAiVision(imageData);
    if (openai) return openai;
  }
  return { provider: 'manual-annotations', summary: '' };
}

async function tryGeminiVision(key, imageData) {
  try {
    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const { mimeType, base64 } = splitDataUrl(imageData);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Read this residential floor plan image. Summarize likely rooms, doors/windows/openings, visible labels, and uncertainty in 3 concise sentences. Do not invent measurements.' },
            { inlineData: { mimeType, data: base64 } }
          ]
        }]
      })
    });
    if (!response.ok) throw new Error(`Gemini ${response.status}`);
    const payload = await response.json();
    const summary = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join(' ').trim();
    return summary ? { provider: `gemini:${model}`, summary, advisoryOnly: true } : null;
  } catch (err) {
    console.warn(`Gemini floor-plan vision failed: ${err.message}`);
    return null;
  }
}

async function tryOpenAiVision(imageData) {
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI();
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Read this residential floor plan image. Summarize likely rooms, doors/windows/openings, visible labels, and uncertainty in 3 concise sentences. Do not invent measurements.' },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      }]
    });
    const summary = response.choices?.[0]?.message?.content?.trim();
    return summary ? { provider: 'openai-vision', summary, advisoryOnly: true } : null;
  } catch (err) {
    console.warn(`OpenAI floor-plan vision failed: ${err.message}`);
    return null;
  }
}

function floorPlanDataUrl(filePath = '') {
  if (!filePath || filePath.toLowerCase().endsWith('.pdf')) return '';
  const local = path.join(rootDir, filePath.replace(/^\//, ''));
  if (!fs.existsSync(local)) return '';
  const ext = path.extname(local).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
  return `data:${mimeType};base64,${fs.readFileSync(local).toString('base64')}`;
}

function splitDataUrl(value) {
  const match = String(value).match(/^data:([^;]+);base64,(.+)$/);
  return { mimeType: match?.[1] || 'image/png', base64: match?.[2] || value };
}

function buildDraftProject(input = {}) {
  const selectedSpaces = Array.isArray(input.selectedSpaces)
    ? input.selectedSpaces
    : String(input.rooms || input.selectedRooms || 'living,kitchen,master').split(',').map((item) => item.trim()).filter(Boolean);
  return {
    selectedSpaces,
    vastuStrictness: input.vastuStrictness || 'general',
    budgetTier: input.budgetTier || 'premium',
    style: input.style || input.theme || 'Indian Contemporary'
  };
}

function parseMaybeJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeVisionResult(result = {}) {
  return {
    provider: result.source || result.provider || 'vision-advisory',
    summary: result.whatAiUnderstood || result.summary || '',
    advisoryOnly: true,
    rooms: result.rooms || [],
    components: result.components || [],
    walls: result.walls || [],
    confidence: result.confidence || 0,
    constraints: result.constraints || {},
    nextDesignerActions: result.nextDesignerActions || []
  };
}

function dimensionsFromArea(area) {
  if (!area) return { width: 3600, length: 3600, height: 2750, label: 'descriptive default; add calibration for estimated size' };
  return {
    width: area.widthMm,
    length: area.depthMm,
    height: 2750,
    sourceLabel: 'estimated',
    label: 'estimated from calibration; verify on site'
  };
}

function moduleTypeFor(type = '') {
  const key = String(type).toLowerCase();
  if (key.includes('tv')) return 'tv-unit';
  if (key.includes('sofa')) return 'sofa';
  if (key.includes('wardrobe')) return 'wardrobe';
  if (key.includes('bed')) return 'bed';
  if (key.includes('kitchen')) return 'counter';
  if (key.includes('island')) return 'island';
  if (key.includes('dining')) return 'dining';
  if (key.includes('mandir') || key.includes('pooja')) return 'pooja-unit';
  if (key.includes('study')) return 'study-desk';
  if (key.includes('shoe')) return 'shoe-rack';
  if (key.includes('door')) return 'door';
  if (key.includes('window')) return 'window';
  return 'generic';
}

function dimensionsForMarker(type = '') {
  const map = {
    'TV Unit': { width: 2400, height: 2100, depth: 450 },
    Sofa: { width: 2400, height: 850, depth: 900 },
    Bed: { width: 1900, height: 1050, depth: 2100 },
    Wardrobe: { width: 1800, height: 2400, depth: 600 },
    'Kitchen Run': { width: 3000, height: 850, depth: 600 },
    Island: { width: 1800, height: 900, depth: 900 },
    Dining: { width: 1500, height: 760, depth: 900 },
    Mandir: { width: 900, height: 1800, depth: 420 },
    'Study Desk': { width: 1500, height: 760, depth: 600 },
    'Shoe Rack': { width: 1200, height: 1050, depth: 380 }
  };
  return map[type] || { width: 1200, height: 1800, depth: 450 };
}

function boxesTouch(a = {}, b = {}) {
  const ax2 = (a.x || 0) + (a.w || 0);
  const ay2 = (a.y || 0) + (a.h || 0);
  const bx2 = (b.x || 0) + (b.w || 0);
  const by2 = (b.y || 0) + (b.h || 0);
  const horizontalOverlap = Math.min(ax2, bx2) - Math.max(a.x || 0, b.x || 0);
  const verticalOverlap = Math.min(ay2, by2) - Math.max(a.y || 0, b.y || 0);
  const nearX = Math.abs(ax2 - (b.x || 0)) <= 3 || Math.abs(bx2 - (a.x || 0)) <= 3;
  const nearY = Math.abs(ay2 - (b.y || 0)) <= 3 || Math.abs(by2 - (a.y || 0)) <= 3;
  return (horizontalOverlap > 0 && nearY) || (verticalOverlap > 0 && nearX);
}

function normalizeAnnotations(annotations = {}) {
  return {
    zones: Array.isArray(annotations.zones) ? annotations.zones.map(normalizeAnnotationItem).filter(Boolean) : [],
    markers: Array.isArray(annotations.markers) ? annotations.markers.map(normalizeAnnotationItem).filter(Boolean) : []
  };
}

function normalizeAnnotationItem(item) {
  if (!item) return null;
  if (typeof item === 'object') return item;
  const text = String(item).trim();
  const psMatch = text.match(/^@\{(.+)\}$/);
  if (!psMatch) return null;
  const object = {};
  const parts = psMatch[1].split(/;\s*/);
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const raw = part.slice(idx + 1).trim();
    const numeric = Number(raw);
    object[key] = Number.isFinite(numeric) && raw !== '' ? numeric : raw;
  }
  return object;
}

function normalizeCalibration(calibration = {}) {
  return {
    knownLengthMm: Number(calibration.knownLengthMm || 0) || 0,
    referencePercent: Number(calibration.referencePercent || 0) || 0,
    note: calibration.note || ''
  };
}

function pct(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(Math.max(0, Math.min(100, number)));
}
