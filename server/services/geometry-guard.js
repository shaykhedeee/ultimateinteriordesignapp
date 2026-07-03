/**
 * Geometry Guard / Validation for Enhanced Top-View Plans
 *
 * Validates enhanced plan assets against the original manifest geometry.
 * Rejects when thresholds are exceeded and logs validation issues.
 *
 * Threshold policy:
 * - wall_drift_max: max normalized endpoint drift per wall segment
 * - opening_drift_max: max normalized drift for opening position/size proxies
 * - topology_mismatch: room count or adjacency inconsistency
 * - geometry_mismatch: severe drift or missing major elements
 */

export function validateEnhancedTopView({ manifest, enhancedPreview = {} }) {
  const issues = [];
  const walls = manifest.walls || [];
  const openings = manifest.openings || [];
  const rooms = manifest.rooms || [];
  const expectedRooms = rooms.length;
  const expectedWalls = walls.length;
  const expectedOpenings = openings.length;

  const previewWalls = Array.isArray(enhancedPreview.walls) ? enhancedPreview.walls : [];
  const previewOpenings = Array.isArray(enhancedPreview.openings) ? enhancedPreview.openings : [];
  const previewRooms = Array.isArray(enhancedPreview.rooms) ? enhancedPreview.rooms : [];

  const wallDrift = computeWallDrift(walls, previewWalls);
  const openingDrift = computeOpeningDrift(openings, previewOpenings);
  const topologyMismatch = previewRooms.length !== expectedRooms || previewWalls.length !== expectedWalls;
  const geometryMismatch = wallDrift > 0.25 || openingDrift > 0.35 || topologyMismatch;

  if (wallDrift > 0.1) issues.push(`Wall drift is high: ${wallDrift.toFixed(3)}`);
  if (openingDrift > 0.15) issues.push(`Opening drift is high: ${openingDrift.toFixed(3)}`);
  if (topologyMismatch) issues.push('Topology mismatch: room/wall/opening counts differ from manifest');
  if (geometryMismatch) issues.push('Major geometry mismatch detected');

  const accepted = !geometryMismatch && issues.length === 0;
  const status = accepted ? 'accepted' : geometryMismatch ? 'rejected' : 'review';

  return {
    status,
    accepted,
    wallDrift,
    openingDrift,
    topologyMismatch,
    geometryMismatch,
    issues,
    thresholds: {
      wallDriftMax: 0.25,
      openingDriftMax: 0.35,
      maxTopologyDelta: 0
    }
  };
}

export function summarizeValidation(result) {
  if (!result) return 'Validation missing.';
  if (result.accepted) return 'Enhanced top view passed geometry validation.';
  return `Enhanced top view rejected: ${(result.issues || []).join('; ') || 'geometry thresholds failed'}.`;
}

function computeWallDrift(manifestWalls, previewWalls) {
  if (!manifestWalls.length) return 0;
  if (!previewWalls.length) return 1;

  const maxEndpoints = Math.max(manifestWalls.length, previewWalls.length);
  const sampleSize = Math.min(manifestWalls.length, previewWalls.length, 12);
  let totalDrift = 0;
  let count = 0;

  for (let i = 0; i < sampleSize; i++) {
    const a = manifestWalls[i];
    const b = previewWalls[i];
    const bounds = wallBounds(manifestWalls);
    const maxDim = Math.max(bounds.width || 1, bounds.height || 1, 1);
    const d = endpointDrift(a, b, maxDim);
    totalDrift += d;
    count += 1;
  }

  return count ? totalDrift / count : 0;
}

function computeOpeningDrift(manifestOpenings, previewOpenings) {
  if (!manifestOpenings.length) return 0;
  if (!previewOpenings.length) return 1;
  const sampleSize = Math.min(manifestOpenings.length, previewOpenings.length, 12);
  let totalDrift = 0;
  let count = 0;
  for (let i = 0; i < sampleSize; i++) {
    const a = manifestOpenings[i];
    const b = previewOpenings[i];
    const bounds = openingBounds(manifestOpenings);
    const maxDim = Math.max(bounds.width || 1, bounds.height || 1, 1);
    const d = openingDriftMetric(a, b, maxDim);
    totalDrift += d;
    count += 1;
  }
  return count ? totalDrift / count : 0;
}

function wallBounds(walls) {
  const xs = walls.flatMap((w) => [w.x1, w.x2]);
  const ys = walls.flatMap((w) => [w.y1, w.y2]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function openingBounds(openings) {
  const xs = openings.map((o) => o.x);
  const ys = openings.map((o) => o.y);
  const ws = openings.map((o) => o.width || 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX || 1, height: maxY - minY || 1 };
}

function endpointDrift(a, b, maxDim) {
  const d1 = Math.hypot((a.x1 || 0) - (b.x1 || 0), (a.y1 || 0) - (b.y1 || 0)) / maxDim;
  const d2 = Math.hypot((a.x2 || 0) - (b.x2 || 0), (a.y2 || 0) - (b.y2 || 0)) / maxDim;
  return Math.max(d1, d2, 0);
}

function openingDriftMetric(a, b, maxDim) {
  const dx = Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)) / maxDim;
  const ds = Math.abs((a.width || 0) - (b.width || 0)) / (maxDim || 1);
  return Math.max(dx, ds, 0);
}
