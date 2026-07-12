class RuleEngine {
  /**
   * Evaluates design rules for a scene version
   * @param {object} sceneDoc 
   */
  evaluateScene(sceneDoc) {
    const results = [];
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;

    const level = sceneDoc.levels?.[0] || {};
    const rooms = level.rooms || [];
    const walls = level.walls || [];
    const openings = level.openings || [];
    const furniture = level.furniture || [];

    // --- 1. GLOBAL GEOMETRY RULES ---
    // Rule: Non-zero wall lengths
    walls.forEach(w => {
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len <= 0) {
        failCount++;
        results.push({
          ruleCode: 'GEOM_WALL_LEN',
          severity: 'hard',
          status: 'fail',
          message: `Wall ${w.id} has invalid length of 0.`,
          measured: { length: 0 },
          expected: { minLength: 1 },
          overrideAllowed: false
        });
      } else {
        passCount++;
      }
    });

    // Rule: Openings must fit inside wall bounds
    openings.forEach(op => {
      const wall = walls.find(w => w.id === op.wallId);
      if (wall) {
        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const wallLen = Math.sqrt(dx * dx + dy * dy) * 25; // scaled to mm representation
        if (op.width > wallLen) {
          failCount++;
          results.push({
            ruleCode: 'GEOM_OPENING_BOUNDS',
            severity: 'hard',
            status: 'fail',
            message: `Opening ${op.id} (width: ${op.width}mm) exceeds parent wall length (${Math.round(wallLen)}mm).`,
            measured: { width: op.width },
            expected: { maxAllowedWidth: wallLen },
            overrideAllowed: true
          });
        } else {
          passCount++;
        }
      }
    });

    // --- 2. VASTU COMPLIANCE RULES ---
    rooms.forEach(room => {
      // Vastu zones logic based on coordinates
      // NE: x: 500-900, y: 100-500
      // SE: x: 500-900, y: 500-900
      // SW: x: 100-500, y: 500-900
      // NW: x: 100-500, y: 100-500
      const points = Array.isArray(room.points) ? room.points : [];
      if (points.length === 0) {
        // Malformed room (no polygon) — flag instead of crashing the whole pass.
        warnCount++;
        results.push({
          ruleCode: 'GEOM_ROOM_POINTS',
          severity: 'soft',
          status: 'warn',
          message: `Room "${room.name || room.type || room.id || 'unknown'}" has no polygon points — Vastu zoning skipped.`,
          measured: { points: 0 },
          expected: { minPoints: 3 },
          overrideAllowed: true
        });
        return;
      }
      let cx = 0, cy = 0;
      points.forEach(p => {
        cx += p.x;
        cy += p.y;
      });
      cx = cx / points.length;
      cy = cy / points.length;

      let zone = 'CENTRAL';
      if (cx > 500 && cy < 500) zone = 'NE';
      else if (cx > 500 && cy >= 500) zone = 'SE';
      else if (cx <= 500 && cy >= 500) zone = 'SW';
      else if (cx <= 500 && cy < 500) zone = 'NW';

      if (room.type === 'kitchen') {
        // Preferred South-East (SE)
        if (zone !== 'SE') {
          warnCount++;
          results.push({
            ruleCode: 'VASTU_KITCHEN_ZONE',
            severity: 'soft',
            status: 'warn',
            message: `Kitchen is placed in ${zone} zone. Traditional Vastu recommends South-East (SE) for Agni (fire element).`,
            measured: { zone },
            expected: { preferredZones: ['SE'] },
            overrideAllowed: true
          });
        } else {
          passCount++;
        }
      } else if (room.type === 'pooja') {
        // Preferred North-East (NE)
        if (zone !== 'NE') {
          warnCount++;
          results.push({
            ruleCode: 'VASTU_MANDIR_ZONE',
            severity: 'soft',
            status: 'warn',
            message: `Pooja Mandir room is in ${zone} zone. Traditional Vastu recommends North-East (NE) for deity placement.`,
            measured: { zone },
            expected: { preferredZones: ['NE'] },
            overrideAllowed: true
          });
        } else {
          passCount++;
        }
      }
    });

    // --- 3. CLEARANCE & CIRCULATION RULES ---
    // Kitchen Hob and Sink clearance rule
    const kitchenSinks = furniture.filter(f => f.libraryId === 'kitchen_sink_unit');
    const kitchenHobs = furniture.filter(f => f.libraryId === 'kitchen_hob_unit');
    
    if (kitchenSinks.length > 0 && kitchenHobs.length > 0) {
      kitchenSinks.forEach(sink => {
        kitchenHobs.forEach(hob => {
          const dx = (sink.x - hob.x) * 25; // scaled to mm representation
          const dy = (sink.y - hob.y) * 25;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 900) {
            failCount++;
            results.push({
              ruleCode: 'CLEARANCE_HOB_SINK',
              severity: 'hard',
              status: 'fail',
              message: `Distance between Hob and Sink is ${Math.round(dist)}mm. Minimum safety clearance is 900mm to prevent fire/water collision.`,
              measured: { distanceMm: Math.round(dist) },
              expected: { minDistanceMm: 900 },
              overrideAllowed: true
            });
          } else if (dist > 2400) {
            warnCount++;
            results.push({
              ruleCode: 'CLEARANCE_HOB_SINK_MAX',
              severity: 'advisory',
              status: 'warn',
              message: `Hob-to-Sink distance is ${Math.round(dist)}mm. Distances over 2400mm degrade ergonomic workflow.`,
              measured: { distanceMm: Math.round(dist) },
              expected: { maxRecommendedMm: 2400 },
              overrideAllowed: true
            });
          } else {
            passCount++;
          }
        });
      });
    }

    // Wardrobe clearance — advisory recommendation (front clearance not measured from plan)
    const wardrobes = furniture.filter(f => (f.libraryId || '').includes('wardrobe'));
    wardrobes.forEach(wardrobe => {
      warnCount++;
      results.push({
        ruleCode: 'CLEARANCE_WARDROBE_FRONT',
        severity: 'advisory',
        status: 'warn',
        message: `Wardrobe '${wardrobe.name || wardrobe.libraryId}' — verify ≥900mm front clearance for door swing & circulation. (Not measured from plan; manual check required.)`,
        measured: { clearanceMm: null },
        expected: { minClearanceMm: 900 },
        overrideAllowed: true
      });
    });

    const score = Math.round((passCount / (passCount + warnCount + failCount || 1)) * 100);

    return {
      scope: 'scene',
      scopeRef: sceneDoc.projectId || 'scene_root',
      summary: {
        passCount,
        warnCount,
        failCount,
        score
      },
      results
    };
  }
}

export default new RuleEngine();
