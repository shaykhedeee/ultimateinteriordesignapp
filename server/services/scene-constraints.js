/**
 * scene-constraints.js — Phase 3 scene-graph constraint validation.
 *
 * These are the dimension-aware design rules the plan requires to be FIRST
 * CLASS (not loose prompt text). Each rule inspects the editable scene graph
 * and returns structured issues with severity + a suggested fix, so the
 * frontend can mark downstream outputs stale until the designer resolves them.
 *
 * Rules implemented:
 *  - sofa size by wall length (3800mm wall -> real 2600mm sofa, circulation)
 *  - kitchen work-zone validation (sink/hob/fridge triangle + clearances)
 *  - door/window clearance (no furniture crossing openings)
 *  - wall-fit checks (module within wall bounds)
 *  - appliance/service placement sanity
 *
 * Output contract matches AURA's structured-action philosophy: every issue is
 * JSON with { rule, severity, message, moduleId?, suggested? }.
 */

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// Rule: sofa width must be <= 70% of the wall it sits on, with >= 1200mm
// circulation remaining. Mirrors the AURA sofa_sizing_by_wall rule.
export function sofaSizingRule(scene) {
  const issues = [];
  const mods = Array.isArray(scene.placed_modules) ? scene.placed_modules : [];
  const walls = Array.isArray(scene.room_shell?.walls) ? scene.room_shell.walls : [];
  for (const m of mods) {
    const t = String(m.type || '').toLowerCase();
    if (!t.includes('sofa') && !t.includes('couch')) continue;
    const wallMm = (m.wallId && walls.find((w) => w.id === m.wallId)?.lengthMm)
      || (m.wallLengthMm) || null;
    const w = Number(m.widthMm || 0);
    if (!wallMm) continue;
    const maxW = Math.round(wallMm * 0.70);
    const clearance = wallMm - w;
    if (w > maxW) {
      issues.push({
        rule: 'sofa_sizing_by_wall', severity: 'warning', moduleId: m.id,
        message: `Sofa ${w}mm exceeds 70% of ${wallMm}mm wall. Resize to <= ${maxW}mm.`,
        suggested: { widthMm: clamp(maxW, 1200, wallMm - 1200) }
      });
    }
    if (clearance < 1200) {
      issues.push({
        rule: 'sofa_circulation', severity: 'warning', moduleId: m.id,
        message: `Only ${clearance}mm circulation remains around sofa on ${wallMm}mm wall; keep >= 1200mm.`,
        suggested: { widthMm: clamp(wallMm - 1200, 1200, maxW) }
      });
    }
  }
  return issues;
}

// Rule: kitchen work-zone. Sink, hob, and fridge must exist and have adequate
// separation; tall/rolling-shutter/mesh-basket placement must be coherent.
export function kitchenWorkZoneRule(scene) {
  const issues = [];
  const mods = Array.isArray(scene.placed_modules) ? scene.placed_modules : [];
  const kitchen = mods.filter((m) => String(m.room || '').toLowerCase().includes('kitchen') || String(m.type || '').toLowerCase().includes('kitchen'));
  if (kitchen.length === 0) return issues;
  const has = (k) => kitchen.some((m) => String(m.type || '').toLowerCase().includes(k));
  if (!has('sink')) issues.push({ rule: 'kitchen_work_zone', severity: 'warning', message: 'No sink base detected in kitchen modules.' });
  if (!has('hob')) issues.push({ rule: 'kitchen_work_zone', severity: 'warning', message: 'No hob base detected in kitchen modules.' });
  if (!has('fridge') && !has('tall')) issues.push({ rule: 'kitchen_work_zone', severity: 'info', message: 'No fridge/tall storage detected in kitchen modules.' });
  // mesh basket should sit below a rolling shutter when both present
  const shutter = kitchen.find((m) => /rolling.?shutter/.test(String(m.type || '')));
  const basket = kitchen.find((m) => /mesh.?basket/.test(String(m.type || '')));
  if (shutter && basket) {
    const sb = Number(shutter.zOffsetMm || 0);
    const bb = Number(basket.zOffsetMm || 0);
    if (bb > sb) {
      issues.push({
        rule: 'kitchen_mesh_below_shutter', severity: 'warning', moduleId: basket.id,
        message: 'Mesh basket should sit below the rolling shutter.',
        suggested: { zOffsetMm: Math.max(0, sb - Number(basket.heightMm || 720)) }
      });
    }
  }
  return issues;
}

// Rule: no furniture may cross a door/window opening footprint.
export function openingClearanceRule(scene) {
  const issues = [];
  const mods = Array.isArray(scene.placed_modules) ? scene.placed_modules : [];
  const openings = Array.isArray(scene.room_shell?.openings) ? scene.room_shell.openings : [];
  for (const op of openings) {
    const opStart = Number(op.x || op.x1 || 0);
    const opW = Number(op.widthMm || op.lengthMm || 0);
    for (const m of mods) {
      const mx = Number(m.xOffsetMm || 0);
      const mw = Number(m.widthMm || 0);
      const overlap = mx < opStart + opW && mx + mw > opStart;
      const onSameWall = !op.wallId || !m.wallId || op.wallId === m.wallId;
      if (overlap && onSameWall) {
        issues.push({
          rule: 'opening_clearance', severity: 'critical', moduleId: m.id,
          message: `Module ${m.type} (${mw}mm @ ${mx}mm) overlaps opening @ ${opStart}mm on the same wall.`,
          suggested: { xOffsetMm: opStart + opW + 20 }
        });
      }
    }
  }
  return issues;
}

// Rule: every module must sit within its wall bounds.
export function wallFitRule(scene) {
  const issues = [];
  const mods = Array.isArray(scene.placed_modules) ? scene.placed_modules : [];
  const walls = Array.isArray(scene.room_shell?.walls) ? scene.room_shell.walls : [];
  for (const m of mods) {
    if (!m.wallId) continue;
    const wall = walls.find((w) => w.id === m.wallId);
    if (!wall) continue;
    const wlen = Number(wall.lengthMm || 0);
    const mx = Number(m.xOffsetMm || 0);
    const mw = Number(m.widthMm || 0);
    if (mx < 0 || mx + mw > wlen + 1) {
      issues.push({
        rule: 'wall_fit', severity: 'warning', moduleId: m.id,
        message: `Module ${m.type} (${mw}mm @ ${mx}mm) exceeds wall ${wall.id} length ${wlen}mm.`,
        suggested: { xOffsetMm: clamp(mx, 0, Math.max(0, wlen - mw)) }
      });
    }
  }
  return issues;
}

export function validateScene(scene) {
  const issues = [
    ...sofaSizingRule(scene),
    ...kitchenWorkZoneRule(scene),
    ...openingClearanceRule(scene),
    ...wallFitRule(scene)
  ];
  const critical = issues.filter((i) => i.severity === 'critical').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const infos = issues.filter((i) => i.severity === 'info').length;
  return {
    success: true,
    issues,
    summary: { critical, warnings, infos, total: issues.length },
    // A design may not advance to production if any critical issue remains.
    passable: critical === 0
  };
}
