import db from '../database/database.js';

/**
 * Checks consistency between the 3D scene graph and the 2D elevation models.
 * @param {string} projectId 
 * @returns {object} Consistency report
 */
export function checkSceneToElevationConsistency(projectId) {
  const report = {
    consistent: true,
    mismatches: [],
    checkedSceneModules: 0,
    checkedElevationModules: 0
  };

  // 1. Get active scene version
  const sceneRow = db.prepare(`
    SELECT scene_json FROM scene_versions 
    WHERE project_id = ? AND is_current = 1 
    ORDER BY version_number DESC LIMIT 1
  `).get(projectId);

  if (!sceneRow) {
    report.consistent = false;
    report.mismatches.push({
      type: 'missing_scene',
      message: 'No active 3D scene version found for this project.',
      severity: 'error'
    });
    return report;
  }

  let sceneModules = [];
  try {
    const sceneJson = JSON.parse(sceneRow.scene_json);
    sceneModules = sceneJson.placed_modules || [];
  } catch (err) {
    report.consistent = false;
    report.mismatches.push({
      type: 'corrupted_scene',
      message: 'Failed to parse the active 3D scene JSON graph.',
      severity: 'error'
    });
    return report;
  }

  report.checkedSceneModules = sceneModules.length;

  // 2. Get 2D elevations
  const elevations = db.prepare(`
    SELECT wall_id, wall_name, model_json FROM photo_elevations 
    WHERE project_id = ?
  `).all(projectId);

  if (!elevations || elevations.length === 0) {
    report.consistent = false;
    report.mismatches.push({
      type: 'missing_elevations',
      message: 'No 2D elevation drawings have been generated or associated with this project.',
      severity: 'warning'
    });
    return report;
  }

  // Parse all 2D cabinet entities
  const elevationCabinets = [];
  for (const elev of elevations) {
    try {
      const model = JSON.parse(elev.model_json);
      const cabs = model.cabinets || [];
      for (const c of cabs) {
        elevationCabinets.push({
          ...c,
          wallId: elev.wall_id,
          wallName: elev.wall_name
        });
      }
    } catch (_) {}
  }

  report.checkedElevationModules = elevationCabinets.length;

  // 3. Perform comparison
  // A. Check for each scene module if it matches elevation module dimensions
  for (const sm of sceneModules) {
    const matchingEm = elevationCabinets.find(em => em.id === sm.id);
    if (!matchingEm) {
      report.mismatches.push({
        type: 'missing_in_elevation',
        moduleId: sm.id,
        message: `Module '${sm.id}' (Type: ${sm.type}) exists in 3D scene but is missing in the 2D elevation layouts.`,
        severity: 'warning'
      });
      report.consistent = false;
      continue;
    }

    // Compare dimensions: normalize property names to tolerate widthMm/width_mm differences
    const smW = sm.widthMm || sm.width_mm || sm.width || 0;
    const emW = matchingEm.widthMm || matchingEm.width_mm || matchingEm.width || 0;
    const smH = sm.heightMm || sm.height_mm || sm.height || 0;
    const emH = matchingEm.heightMm || matchingEm.height_mm || matchingEm.height || 0;
    const smD = sm.depthMm || sm.depth_mm || sm.depth || 0;
    const emD = matchingEm.depthMm || matchingEm.depth_mm || matchingEm.depth || 0;

    if (Math.abs(smW - emW) > 1.0) {
      report.mismatches.push({
        type: 'dimension_mismatch',
        moduleId: sm.id,
        message: `Module '${sm.id}' width mismatch: 3D scene has ${smW}mm, but 2D elevation has ${emW}mm.`,
        severity: 'error',
        field: 'width'
      });
      report.consistent = false;
    }

    if (Math.abs(smH - emH) > 1.0) {
      report.mismatches.push({
        type: 'dimension_mismatch',
        moduleId: sm.id,
        message: `Module '${sm.id}' height mismatch: 3D scene has ${smH}mm, but 2D elevation has ${emH}mm.`,
        severity: 'error',
        field: 'height'
      });
      report.consistent = false;
    }

    // Depth checks only for 3D-to-2D items that explicitly declare depth
    if (smD && emD && Math.abs(smD - emD) > 1.0) {
      report.mismatches.push({
        type: 'dimension_mismatch',
        moduleId: sm.id,
        message: `Module '${sm.id}' depth mismatch: 3D scene has ${smD}mm, but 2D elevation has ${emD}mm.`,
        severity: 'error',
        field: 'depth'
      });
      report.consistent = false;
    }
  }

  // B. Check for modules in elevation that are missing in 3D scene
  for (const em of elevationCabinets) {
    const matchingSm = sceneModules.find(sm => sm.id === em.id);
    if (!matchingSm) {
      report.mismatches.push({
        type: 'missing_in_scene',
        moduleId: em.id,
        message: `Cabinet '${em.id}' exists in the 2D elevation for '${em.wallName}' but is missing in the 3D scene graph.`,
        severity: 'warning'
      });
      report.consistent = false;
    }
  }

  return report;
}
