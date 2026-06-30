import { getDb, rowToJson } from './database.js';
import { getCutlistByProject } from './cutlist-engine.js';

export function auditProjectDimensions(projectId) {
  const db = getDb();
  
  // Load floor plan annotations
  const floorPlanRow = db.prepare('SELECT annotations FROM floor_plans WHERE project_id = ?').get(projectId);
  if (!floorPlanRow) {
    return {
      status: 'no-drawings',
      alerts: [],
      score: 100,
      note: 'No uploaded floor plan found for comparison.'
    };
  }

  let annotations = { zones: [], markers: [] };
  try {
    annotations = JSON.parse(floorPlanRow.annotations);
  } catch (e) {
    console.error('Error parsing floor plan annotations for audit', e);
  }

  const cutlist = getCutlistByProject(projectId);
  if (!cutlist || !cutlist.modules?.length) {
    return {
      status: 'no-cutlist',
      alerts: [],
      score: 100,
      note: 'No cutlist project found to compare.'
    };
  }

  const alerts = [];
  const markersMap = new Map((annotations.markers || []).map((marker) => [marker.id, marker]));

  cutlist.modules.forEach((module) => {
    // Check if module is linked to a marker
    const marker = module.sourceMarkerId ? markersMap.get(module.sourceMarkerId) : null;
    if (marker) {
      const parsedMarker = parseDimensions(marker.sizeNote);
      if (parsedMarker) {
        const mismatches = [];
        
        if (parsedMarker.widthMm && parsedMarker.widthMm !== module.widthMm) {
          mismatches.push(`Width: Cutlist has ${module.widthMm}mm, but Drawing specifies ${parsedMarker.widthMm}mm`);
        }
        if (parsedMarker.heightMm && parsedMarker.heightMm !== module.heightMm) {
          mismatches.push(`Height: Cutlist has ${module.heightMm}mm, but Drawing specifies ${parsedMarker.heightMm}mm`);
        }
        if (parsedMarker.depthMm && module.depthMm && parsedMarker.depthMm !== module.depthMm) {
          mismatches.push(`Depth: Cutlist has ${module.depthMm}mm, but Drawing specifies ${parsedMarker.depthMm}mm`);
        }

        if (mismatches.length > 0) {
          alerts.push({
            moduleId: module.id,
            moduleName: module.name,
            room: module.room,
            markerId: marker.id,
            markerType: marker.type,
            mismatches
          });
        }
      }
    }
  });

  const totalModulesCount = cutlist.modules.length;
  const conflictCount = alerts.length;
  const score = totalModulesCount > 0 ? Math.max(0, Math.round(((totalModulesCount - conflictCount) / totalModulesCount) * 100)) : 100;

  return {
    status: conflictCount > 0 ? 'conflicts-found' : 'verified-clean',
    alerts,
    score,
    conflictCount,
    note: conflictCount > 0 
      ? `Audit found ${conflictCount} module size discrepancies between drawings and cutlists.`
      : 'All cutlist module dimensions align perfectly with floor plan drawing annotations.'
  };
}

function parseDimensions(value = '') {
  const match = String(value).match(/(\d{3,4})\s*(?:x|\*)\s*(\d{3,4})(?:\s*(?:x|\*)\s*(\d{2,4}))?/i);
  if (!match) return null;
  return {
    widthMm: Number(match[1]),
    heightMm: Number(match[2]),
    depthMm: match[3] ? Number(match[3]) : undefined
  };
}
