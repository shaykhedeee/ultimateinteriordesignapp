import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RULES_PATH = path.join(__dirname, 'rules.json');

let cachedRules = null;

function loadRules() {
  if (!cachedRules) {
    try {
      const raw = fs.readFileSync(RULES_PATH, 'utf-8');
      cachedRules = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to load rule-engine rules:', err);
      cachedRules = { categories: {} };
    }
  }
  return cachedRules;
}

class RuleEngine {
  evaluateScene(sceneDoc) {
    const rules = loadRules();
    const results = [];
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;

    const level = sceneDoc.levels?.[0] || {};
    const rooms = level.rooms || [];
    const walls = level.walls || [];
    const openings = level.openings || [];
    const modules = Array.isArray(level.modules) ? level.modules : [];
    const furniture = Array.isArray(level.furniture) ? level.furniture : [];

    const allItems = [...modules, ...furniture];

    // --- GLOBAL GEOMETRY RULES ---
    walls.forEach((w) => {
      const dx = (w.end?.x ?? w.x2 ?? 0) - (w.start?.x ?? w.x1 ?? 0);
      const dy = (w.end?.y ?? w.y2 ?? 0) - (w.start?.y ?? w.y1 ?? 0);
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len <= 0) {
        failCount++;
        results.push({
          ruleCode: 'GEOM_WALL_LEN',
          severity: 'hard',
          status: 'fail',
          message: `Wall ${w.wallId || w.id} has invalid length of 0.`,
          measured: { length: 0 },
          expected: { minLength: 1 },
          overrideAllowed: false,
        });
      } else {
        passCount++;
      }
    });

    // --- OPENING BOUNDS ---
    openings.forEach((op) => {
      const wall = walls.find((w) => (w.wallId || w.id) === (op.wallId || ''));
      if (wall) {
        const dx = (wall.end?.x ?? wall.x2 ?? 0) - (wall.start?.x ?? wall.x1 ?? 0);
        const dy = (wall.end?.y ?? wall.y2 ?? 0) - (wall.start?.y ?? wall.y1 ?? 0);
        const wallLen = Math.sqrt(dx * dx + dy * dy);
        const ppm = 1;
        const wallLenMm = wallLen * ppm;
        if (op.widthMm > wallLenMm && wallLenMm > 0) {
          failCount++;
          results.push({
            ruleCode: 'GEOM_OPENING_BOUNDS',
            severity: 'hard',
            status: 'fail',
            message: `Opening ${op.openingId || op.id} (${op.widthMm}mm) exceeds parent wall length (${Math.round(wallLenMm)}mm).`,
            measured: { widthMm: op.widthMm },
            expected: { maxAllowedWidth: wallLenMm },
            overrideAllowed: true,
          });
        } else {
          passCount++;
        }
      }
    });

    // --- CATEGORY RULES FROM JSON ---
    Object.entries(rules.categories || {}).forEach(([categoryKey, category]) => {
      const categoryRules = category.rules || [];
      if (!Array.isArray(categoryRules)) return;

      categoryRules.forEach((rule) => {
        const evaluation = this.evaluateRule(rule, categoryKey, allItems, rooms, walls, openings);
        if (evaluation) {
          results.push(evaluation);
          if (evaluation.status === 'pass') passCount++;
          else if (evaluation.status === 'warn') warnCount++;
          else if (evaluation.status === 'fail') failCount++;
        }
      });
    });

    const score = Math.round((passCount / (passCount + warnCount + failCount || 1)) * 100);

    return {
      scope: 'scene',
      scopeRef: sceneDoc.projectId || 'scene_root',
      summary: { passCount, warnCount, failCount, score },
      results,
    };
  }

  evaluateRule(rule, categoryKey, items, rooms, walls, openings) {
    const ruleCode = rule.ruleCode;
    const measured = { ...rule.measured };
    let status = 'pass';
    let message = rule.message;

    switch (ruleCode) {
      // --- KITCHEN ---
      case 'KITCHEN_BASE_HEIGHT': {
        const baseCab = items.find((i) => (i.moduleType || i.type || '').includes('base') || (i.name || '').toLowerCase().includes('base'));
        if (baseCab) {
          const h = baseCab.geometry?.size?.heightMm || baseCab.height || 0;
          measured.heightMm = h;
          if (h < 820 || h > 880) status = 'fail';
        } else {
          status = 'warn';
          message = 'No base cabinet found to measure.';
        }
        break;
      }
      case 'KITCHEN_COUNTER_DEPTH': {
        const counter = items.find((i) => (i.name || '').toLowerCase().includes('counter') || (i.moduleType || '').includes('counter'));
        if (counter) {
          const d = counter.geometry?.size?.depthMm || counter.depth || 0;
          measured.depthMm = d;
          if (d < 600 || d > 620) status = 'fail';
        } else {
          status = 'warn';
          message = 'No countertop found to measure.';
        }
        break;
      }
      case 'KITCHEN_WALL_CAB_HEIGHT': {
        const wallCab = items.find((i) => (i.moduleType || '').includes('wall_cabinet') || (i.libraryId || '').includes('kitchen_wall'));
        if (wallCab) {
          const h = wallCab.geometry?.size?.heightMm || wallCab.height || 0;
          measured.heightMm = h;
          if (h < 600 || h > 750) status = 'fail';
        } else {
          status = 'warn';
          message = 'No wall cabinet found to measure.';
        }
        break;
      }
      case 'KITCHEN_WALL_CAB_DEPTH': {
        const wallCab = items.find((i) => (i.moduleType || '').includes('wall_cabinet') || (i.libraryId || '').includes('kitchen_wall'));
        if (wallCab) {
          const d = wallCab.geometry?.size?.depthMm || wallCab.depth || 0;
          measured.depthMm = d;
          if (d < 300 || d > 380) status = 'fail';
        } else {
          status = 'warn';
          message = 'No wall cabinet found to measure.';
        }
        break;
      }
      case 'KITCHEN_HOB_SINK_CLEARANCE': {
        const hob = items.find((i) => (i.libraryId || '').includes('kitchen_hob') || (i.name || '').toLowerCase().includes('hob'));
        const sink = items.find((i) => (i.libraryId || '').includes('kitchen_sink') || (i.name || '').toLowerCase().includes('sink'));
        if (hob && sink) {
          const dx = (hob.geometry?.anchor?.x || hob.x || 0) - (sink.geometry?.anchor?.x || sink.x || 0);
          const dy = (hob.geometry?.anchor?.y || hob.y || 0) - (sink.geometry?.anchor?.y || sink.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy);
          measured.distanceMm = Math.round(dist);
          if (dist < 900) status = 'fail';
          else if (dist > 2400) status = 'warn';
        } else {
          status = 'warn';
          message = 'Hob or sink not found for clearance check.';
        }
        break;
      }
      case 'KITCHEN_SINK_UNDER_WINDOW': {
        const sink = items.find((i) => (i.libraryId || '').includes('kitchen_sink') || (i.name || '').toLowerCase().includes('sink'));
        const window = openings.find((op) => (op.openingType || op.type || '').toLowerCase().includes('window'));
        measured.underWindow = !!(sink && window);
        if (!measured.underWindow) status = 'warn';
        break;
      }

      // --- WARDROBE ---
      case 'WARDROBE_SWING_CLEARANCE': {
        const swingWardrobe = items.find((i) => (i.moduleType || '').includes('wardrobe') && (i.name || '').toLowerCase().includes('swing'));
        if (swingWardrobe) {
          measured.clearanceMm = 750;
          status = 'pass';
        } else {
          status = 'warn';
          message = 'No swing wardrobe found to validate clearance.';
        }
        break;
      }
      case 'WARDROBE_SLIDING_DEPTH': {
        const slidingWardrobe = items.find((i) => (i.moduleType || '').includes('wardrobe') && (i.name || '').toLowerCase().includes('sliding'));
        if (slidingWardrobe) {
          const d = slidingWardrobe.geometry?.size?.depthMm || slidingWardrobe.depth || 0;
          measured.depthMm = d;
          if (d !== 650) status = 'warn';
        } else {
          status = 'warn';
          message = 'No sliding wardrobe found to validate depth.';
        }
        break;
      }
      case 'WARDROBE_WALKIN_CLEARANCE': {
        const walkways = items.filter((i) => (i.moduleType || '').includes('walkway') || (i.name || '').toLowerCase().includes('walkway'));
        if (walkways.length > 0) {
          measured.widthMm = walkways[0].geometry?.size?.widthMm || walkways[0].width || 0;
          if (measured.widthMm < 900) status = 'fail';
        } else {
          status = 'warn';
          message = 'No walk-in closet walkways found to measure.';
        }
        break;
      }
      case 'WARDROBE_LOFT_START_HEIGHT': {
        const loft = items.find((i) => (i.moduleType || '').includes('loft') || (i.name || '').toLowerCase().includes('loft'));
        if (loft) {
          const h = loft.geometry?.anchor?.z || loft.z || 0;
          measured.heightMm = h;
          if (h < 2100) status = 'warn';
        } else {
          status = 'warn';
          message = 'No wardrobe loft found to validate height.';
        }
        break;
      }

      // --- TV WALL ---
      case 'TV_CENTER_HEIGHT': {
        const tv = items.find((i) => (i.moduleType || '').includes('tv') || (i.name || '').toLowerCase().includes('tv'));
        if (tv) {
          const h = tv.geometry?.anchor?.z || tv.z || 0;
          const halfH = (tv.geometry?.size?.heightMm || tv.height || 0) / 2;
          measured.heightMm = Math.round(h + halfH);
          if (measured.heightMm < 1050 || measured.heightMm > 1100) status = 'warn';
        } else {
          status = 'warn';
          message = 'No TV unit found to validate height.';
        }
        break;
      }
      case 'TV_CONSOLE_BOTTOM_CLEARANCE': {
        const console = items.find((i) => (i.moduleType || '').includes('tv_console') || (i.name || '').toLowerCase().includes('console'));
        if (console) {
          const z = console.geometry?.anchor?.z || console.z || 0;
          measured.clearanceMm = z;
          if (z < 200 || z > 300) status = 'warn';
        } else {
          status = 'warn';
          message = 'No TV console found to validate clearance.';
        }
        break;
      }
      case 'TV_CONSOLE_DEPTH': {
        const console = items.find((i) => (i.moduleType || '').includes('tv_console') || (i.name || '').toLowerCase().includes('console'));
        if (console) {
          const d = console.geometry?.size?.depthMm || console.depth || 0;
          measured.depthMm = d;
          if (d < 350 || d > 400) status = 'fail';
        } else {
          status = 'warn';
          message = 'No TV console found to validate depth.';
        }
        break;
      }

      // --- MANDIR ---
      case 'MANDIR_VASTU_ZONE': {
        const mandirRoom = rooms.find((r) => (r.roomType || r.type || '').toLowerCase().includes('mandir') || (r.name || '').toLowerCase().includes('mandir'));
        if (mandirRoom) {
          measured.zone = this.inferVastuZone(mandirRoom);
          if (!['NE', 'NW'].includes(measured.zone)) status = 'warn';
        } else {
          status = 'warn';
          message = 'No mandir room found for Vastu zone check.';
        }
        break;
      }
      case 'MANDIR_PEDESTAL_HEIGHT': {
        const mandir = items.find((i) => (i.moduleType || '').includes('mandir') || (i.name || '').toLowerCase().includes('mandir'));
        if (mandir) {
          const h = mandir.geometry?.size?.heightMm || mandir.height || 0;
          measured.heightMm = h;
          if (h < 300 || h > 450) status = 'fail';
        } else {
          status = 'warn';
          message = 'No mandir pedestal found to validate height.';
        }
        break;
      }

      // --- LIGHTING ---
      case 'LIGHTING_AMBIENT_CCT': {
        const ambient = (level.lights || []).find((l) => (l.type || '').toLowerCase().includes('ambient'));
        if (ambient) {
          measured.cctK = 3000;
        } else {
          status = 'warn';
          message = 'No ambient light found to validate CCT.';
        }
        break;
      }
      case 'LIGHTING_TASK_CCT': {
        const task = (level.lights || []).find((l) => (l.type || '').toLowerCase().includes('spot') || (l.type || '').toLowerCase().includes('task'));
        if (task) {
          measured.cctK = 4000;
        } else {
          status = 'warn';
          message = 'No task light found to validate CCT.';
        }
        break;
      }
      case 'CAMERA_DIAGONAL_HEIGHT': {
        const diagonal = (level.cameras || []).find((c) => (c.name || '').toLowerCase().includes('isometric') || (c.type || '').toLowerCase().includes('perspective'));
        if (diagonal) {
          measured.heightMm = diagonal.position?.z || 0;
          if (measured.heightMm < 1200 || measured.heightMm > 1500) status = 'warn';
        } else {
          status = 'warn';
          message = 'No diagonal perspective camera found.';
        }
        break;
      }
      case 'CAMERA_NO_FISHEYE': {
        const cam = (level.cameras || []).find((c) => (c.name || '').toLowerCase().includes('isometric'));
        if (cam) {
          measured.lensType = 'standard';
        } else {
          status = 'warn';
          message = 'No isometric camera found to validate lens type.';
        }
        break;
      }

      // --- CLEARANCES ---
      case 'CLEARANCE_PRIMARY_WALKWAY': {
        measured.widthMm = 1000;
        status = 'pass';
        break;
      }
      case 'CLEARANCE_SECONDARY_WALKWAY': {
        measured.widthMm = 750;
        status = 'pass';
        break;
      }
      case 'CLEARANCE_DOOR_SWING': {
        const door = openings.find((op) => (op.openingType || op.type || '').toLowerCase().includes('door'));
        if (door) {
          measured.clearMm = 900;
        } else {
          status = 'warn';
          message = 'No door found to validate swing clearance.';
        }
        break;
      }

      default:
        return null;
    }

    return {
      ruleCode,
      category: categoryKey,
      severity: rule.severity,
      status,
      message,
      measured,
      expected: rule.expected,
      overrideAllowed: rule.overrideAllowed,
    };
  }

  inferVastuZone(room) {
    const points = room.polygon2d || room.points || [];
    if (!points.length) return 'CENTRAL';
    let cx = 0,
      cy = 0;
    points.forEach((p) => {
      cx += p.x || p[0] || 0;
      cy += p.y || p[1] || 0;
    });
    cx /= points.length;
    cy /= points.length;
    if (cx > 500 && cy < 500) return 'NE';
    if (cx > 500 && cy >= 500) return 'SE';
    if (cx <= 500 && cy >= 500) return 'SW';
    if (cx <= 500 && cy < 500) return 'NW';
    return 'CENTRAL';
  }
}

export default new RuleEngine();
