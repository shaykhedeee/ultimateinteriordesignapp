/**
 * Zone Extraction and Design Planning Workflow
 *
 * Turns rooms/zones from the layout manifest into design-ready units that can be
 * rendered and edited independently.
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import db from '../database/database.js';
import { generateInteriorAsset } from './image-provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../storage');
const zoneAssetsDir = path.join(storageDir, 'zone_assets');
const zoneThumbsDir = path.join(storageDir, 'zone_assets', 'thumbnails');

function getProviderStatusFallback() {
  return { providers: {}, live: false };
}

export const ZONE_STATUSES = {
  DRAFT: 'draft',
  PLANNING: 'planning',
  READY: 'ready',
  RENDERING: 'rendering',
  REVIEW: 'review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const BUDGET_TIERS = ['economy', 'standard', 'premium', 'luxury'];

export function extractZonesFromManifest(manifest = {}) {
  const rooms = manifest.rooms || [];
  const walls = manifest.walls || [];
  const openings = manifest.openings || [];
  const symbols = manifest.symbols || [];
  const dimensions = manifest.dimensions || [];
  const level = manifest.levels?.[0] || null;

  const result = rooms.map((room, index) => {
    const roomWalls = walls.filter((w) => w.roomId === room.id || w.room_index === index || (!w.roomId && !w.room_index && index === 0));
    const roomOpenings = openings.filter((o) => o.roomId === room.id || o.room_index === index || (!o.roomId && !o.room_index && index === 0));
    const roomSymbols = symbols.filter((s) => s.roomId === room.id || s.room_index === index || (!s.roomId && !s.room_index && index === 0));
    const roomDimensions = dimensions.filter((d) => d.roomId === room.id || d.room_index === index || (!d.roomId && !d.room_index && index === 0));

    const areaMm2 = computeRoomArea(room);
    const perimeterMm = computeRoomPerimeter(room);
    const boundingBox = computeRoomBoundingBox(room);
    const longestSpanMm = Math.max(boundingBox.width, boundingBox.height);
    const aspectRatio = boundingBox.height > 0 ? +(boundingBox.width / boundingBox.height).toFixed(2) : null;
    const windowAreaMm2 = roomOpenings.filter((o) => o.type === 'window').reduce((sum, o) => sum + (o.width || 0) * (o.height || 0), 0);
    const doorAreaMm2 = roomOpenings.filter((o) => o.type !== 'window').reduce((sum, o) => sum + (o.width || 0) * (o.height || 0), 0);
    const windowToWallRatio = perimeterMm > 0 ? +(windowAreaMm2 / (perimeterMm * 1000)).toFixed(4) : 0;

    return {
      id: room.id || `zone_${index + 1}`,
      room_index: index,
      name: room.name || room.type || `Zone ${index + 1}`,
      type: room.type || room.name || 'generic',
      points: room.points || [],
      wall_count: roomWalls.length,
      opening_count: roomOpenings.length,
      symbol_count: roomSymbols.length,
      dimensions: roomDimensions,
      area_mm2: areaMm2,
      area_sqft: +(areaMm2 / 92903.04).toFixed(2),
      perimeter_mm: perimeterMm,
      longest_span_mm: longestSpanMm,
      bounding_box: boundingBox,
      aspect_ratio: aspectRatio,
      window_to_wall_ratio: windowToWallRatio,
      window_count: roomOpenings.filter((o) => o.type === 'window').length,
      door_count: roomOpenings.filter((o) => o.type !== 'window').length,
      confidence: typeof room.confidence === 'number' ? room.confidence : 0.85,
      level: level?.id || room.level || 'unknown',
      metadata: {
        ...(room.metadata || {}),
        indoor: room.indoor !== false,
        hasFixedElements: roomSymbols.length > 0,
        climate_zone: room.climate_zone || level?.climate_zone || null,
        sun_orientation: room.sun_orientation || level?.sun_orientation || null
      }
    };
  });

  return {
    zones: result,
    summary: {
      zone_count: result.length,
      total_area_mm2: result.reduce((sum, z) => sum + (z.area_mm2 || 0), 0),
      total_area_sqft: result.reduce((sum, z) => sum + (z.area_sqft || 0), 0),
      missing_geometry: result.filter((z) => z.wall_count === 0 || z.points.length < 3).length
    }
  };
}

export function createZoneAssetFilename({ projectId, zoneId, kind = 'thumbnail', preset = 'technical_clean' }) {
  const safeProject = String(projectId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeZone = String(zoneId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeProject}__${safeZone}__${kind}__${preset}.png`;
}

export function renderZoneThumbnail({ projectId, zone, manifest, preset = 'technical_clean' }) {
  try {
    fs.mkdirSync(zoneThumbsDir, { recursive: true });
    const points = zone.points || [];
    const svgWidth = 800;
    const svgHeight = 600;
    const padding = 40;

    if (!points.length) {
      const placeholderPath = path.join(zoneThumbsDir, `placeholder__${zone.id || 'zone'}.svg`);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
        <rect width="100%" height="100%" fill="#f4f4f5"/>
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14" fill="#52525b">${escapeXml(zone.name || 'Zone')}</text>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="ui-monospace, monospace" font-size="11" fill="#a1a1aa">No polygon geometry available</text>
      </svg>`;
      fs.writeFileSync(placeholderPath, svg, 'utf8');
      return { svgUrl: `/storage/zone_assets/thumbnails/${path.basename(placeholderPath)}`, pngUrl: null, fallback: true };
    }

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const aspect = width / height;

    let drawWidth = svgWidth - padding * 2;
    let drawHeight = svgHeight - padding * 2;
    if (drawWidth / drawHeight > aspect) drawWidth = drawHeight * aspect;
    else drawHeight = drawWidth / aspect;

    const cx = (svgWidth - drawWidth) / 2;
    const cy = (svgHeight - drawHeight) / 2;

    const mapPoint = (p) => ({
      x: cx + ((p.x - minX) / width) * drawWidth,
      y: cy + ((p.y - minY) / height) * drawHeight
    });

    const polygonPoints = points.map((p) => `${mapPoint(p).x.toFixed(2)},${mapPoint(p).y.toFixed(2)}`).join(' ');
    const wallColor = '#18181b';
    const fillColor = '#f4f4f5';
    const labelX = cx + drawWidth / 2;
    const labelY = cy + drawHeight / 2;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <polygon points="${polygonPoints}" fill="${fillColor}" stroke="${wallColor}" stroke-width="2.5" stroke-linejoin="round"/>
      <text x="${labelX}" y="${labelY}" dominant-baseline="middle" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14" fill="#18181b">${escapeXml(zone.name || 'Zone')}</text>
      <text x="${labelX}" y="${labelY + 16}" dominant-baseline="middle" text-anchor="middle" font-family="ui-monospace, monospace" font-size="11" fill="#52525b">${escapeXml(zone.type || '')} • ${zone.area_sqft || '?'} sq ft</text>
    </svg>`;

    const thumbPath = path.join(zoneThumbsDir, createZoneAssetFilename({ projectId, zoneId: zone.id, kind: 'thumbnail', preset }));
    fs.writeFileSync(thumbPath, svg, 'utf8');
    return {
      svgUrl: `/storage/zone_assets/thumbnails/${path.basename(thumbPath)}`,
      pngUrl: null,
      fallback: false
    };
  } catch (err) {
    return { svgUrl: null, pngUrl: null, fallback: true, error: err.message };
  }
}

export async function persistZonePlanResult({ projectId, floorPlanVersionId, zoneId, mode, status = 'ready', plan, asset, fallbackReason }) {
  const id = 'zone_plan_' + nanoid(10);
  const existing = db.prepare("SELECT id FROM zone_design_plans WHERE project_id = ? AND zone_id = ?").get(projectId, zoneId);
  if (existing) {
    db.prepare("UPDATE zone_design_plans SET mode=?, status=?, design_direction=?, style_keywords=?, palette=?, materials=?, lighting_strategy=?, placement_notes=?, suggested_products=?, rendering_constraints=?, prompt_ready_instructions=?, constraints=?, source_thumb_svg_url=?, generated_image_url=?, provider=?, model=?, fallback_reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(
        mode,
        status,
        plan?.design_direction || null,
        plan?.style_keywords ? JSON.stringify(plan.style_keywords) : null,
        plan?.palette ? JSON.stringify(plan.palette) : null,
        plan?.materials ? JSON.stringify(plan.materials) : null,
        plan?.lighting_strategy || null,
        plan?.placement_notes ? JSON.stringify(plan.placement_notes) : null,
        plan?.suggested_products ? JSON.stringify(plan.suggested_products) : null,
        plan?.rendering_constraints || null,
        plan?.prompt_ready_instructions || null,
        plan?.constraints ? JSON.stringify(plan.constraints) : null,
        asset?.svgUrl || null,
        asset?.imageUrl || asset?.filePath || null,
        asset?.provider || null,
        asset?.model || null,
        fallbackReason || null,
        existing.id
      );
    return existing.id;
  }

  db.prepare(`INSERT INTO zone_design_plans
    (id, organization_id, project_id, floor_plan_version_id, zone_id, mode, status, design_direction, style_keywords, palette, materials, lighting_strategy, placement_notes, suggested_products, rendering_constraints, prompt_ready_instructions, constraints, source_thumb_svg_url, generated_image_url, provider, model, fallback_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      id,
      null,
      String(projectId || 'unknown'),
      String(floorPlanVersionId || ''),
      String(zoneId || ''),
      mode || 'faithful_clean',
      status,
      plan?.design_direction || null,
      plan ? JSON.stringify(plan.style_keywords || []) : null,
      plan ? JSON.stringify(plan.palette || []) : null,
      plan ? JSON.stringify(plan.materials || []) : null,
      plan?.lighting_strategy || null,
      plan ? JSON.stringify(plan.placement_notes || []) : null,
      plan ? JSON.stringify(plan.suggested_products || []) : null,
      plan?.rendering_constraints || null,
      plan?.prompt_ready_instructions || null,
      plan ? JSON.stringify(plan.constraints || {}) : null,
      asset?.svgUrl || null,
      asset?.imageUrl || asset?.filePath || null,
      asset?.provider || null,
      asset?.model || null,
      fallbackReason || null
    );
  return id;
}

export function getZonePlan(projectId, zoneId) {
  return db.prepare("SELECT * FROM zone_design_plans WHERE project_id = ? AND zone_id = ?").get(String(projectId || 'unknown'), String(zoneId || ''));
}

export function listZonePlans(projectId, floorPlanVersionId) {
  const query = floorPlanVersionId
    ? "SELECT * FROM zone_design_plans WHERE project_id = ? AND floor_plan_version_id = ? ORDER BY updated_at DESC"
    : "SELECT * FROM zone_design_plans WHERE project_id = ? ORDER BY updated_at DESC";
  const args = floorPlanVersionId ? [String(projectId || 'unknown'), String(floorPlanVersionId)] : [String(projectId || 'unknown')];
  return db.prepare(query).all(...args);
}

export function recordZoneThumbnail({ projectId, zoneId, kind, preset, filePath, url, fallback = false }) {
  const id = 'zone_asset_' + nanoid(10);
  db.prepare(`INSERT INTO zone_assets (id, project_id, zone_id, kind, preset, file_path, url, fallback, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
    .run(id, String(projectId || 'unknown'), String(zoneId || 'unknown'), kind || 'thumbnail', preset || 'technical_clean', filePath || '', url || '', fallback ? 1 : 0);
  return id;
}

function computeRoomArea(room) {
  const pts = room.points || [];
  if (pts.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += (pts[j].x || 0) * (pts[i].y || 0);
    area -= (pts[i].x || 0) * (pts[j].y || 0);
  }
  return Math.abs(area / 2);
}

function computeRoomPerimeter(room) {
  const pts = room.points || [];
  if (pts.length < 3) return 0;
  let perimeter = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    perimeter += Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
  }
  return perimeter;
}

function computeRoomBoundingBox(room) {
  const pts = room.points || [];
  if (!pts.length) return { width: 0, height: 0 };
  const xs = pts.map((p) => p.x || 0);
  const ys = pts.map((p) => p.y || 0);
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}

function escapeXml(value) {
  return String(value ?? '')
    .split('&').join('&')
    .split('<').join('<')
    .split('>').join('>')
    .split('"').join('"')
    .split("'").join("'");
}
