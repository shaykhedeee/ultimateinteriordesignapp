class DrawingGenerator {
  /**
   * Generates full automated 2D drawings from a scene document
   * @param {object} sceneDoc 
   */
  generateDrawings(sceneDoc) {
    const level = sceneDoc.levels?.[0] || {};
    const rooms = level.rooms || [];
    const walls = level.walls || [];
    const openings = level.openings || [];
    const furniture = level.furniture || [];
    const lights = level.lights || [];

    const scale = 40.0; // 40px = 1000mm

    // --- 1. ANNOTATED FLOOR PLAN ---
    const floorPlan = {
      title: "Annotated 2D Layout Plan",
      scaleText: "1:50",
      rooms: rooms.map(r => {
        // Calculate center and area
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        r.points.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });

        const widthM = (maxX - minX) / scale;
        const heightM = (maxY - minY) / scale;
        const areaSqM = widthM * heightM;
        const areaSqFt = areaSqM * 10.7639;

        return {
          id: r.id,
          name: r.name,
          type: r.type,
          centroid: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
          areaSqM: parseFloat(areaSqM.toFixed(2)),
          areaSqFt: parseFloat(areaSqFt.toFixed(1)),
          dimensionsText: `${(widthM).toFixed(2)}m x ${(heightM).toFixed(2)}m`
        };
      }),
      walls: walls.map(w => {
        const dx = w.x2 - w.x1;
        const dy = w.y2 - w.y1;
        const lenM = Math.sqrt(dx * dx + dy * dy) / scale;
        return {
          ...w,
          lengthMm: Math.round(lenM * 1000),
          lengthText: `${(lenM).toFixed(2)}m`
        };
      }),
      openings: openings.map(o => ({
        ...o,
        labelText: `${o.type.toUpperCase()} (${o.width}mm)`
      }))
    };

    // --- 2. AUTOMATED WALL ELEVATIONS ---
    const elevations = [];
    rooms.forEach(room => {
      // Find room bounds
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      room.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      const roomWidthMm = ((maxX - minX) / scale) * 1000;
      const roomHeightMm = ((maxY - minY) / scale) * 1000;

      // Generate 4 standard elevations (A, B, C, D) corresponding to room wall faces
      const wallFaces = [
        { face: 'Elevation A (North)', length: roomWidthMm, yMin: minY, isHorizontal: true, isMin: true },
        { face: 'Elevation B (East)', length: roomHeightMm, xMin: maxX, isHorizontal: false, isMin: false },
        { face: 'Elevation C (South)', length: roomWidthMm, yMin: maxY, isHorizontal: true, isMin: false },
        { face: 'Elevation D (West)', length: roomHeightMm, xMin: minX, isHorizontal: false, isMin: true }
      ];

      wallFaces.forEach((face, index) => {
        const projectionHeightMm = 2700; // Standard ceiling height: 2.7m
        const viewBoxes = [];
        
        // Find furniture units belonging to this room and close to this wall face
        const roomFurniture = furniture.filter(f => {
          // Bounding check if inside room coordinates
          const isInsideX = f.x >= minX - 10 && f.x <= maxX + 10;
          const isInsideY = f.y >= minY - 10 && f.y <= maxY + 10;
          if (!isInsideX || !isInsideY) return false;

          // Proximity to wall face
          if (face.isHorizontal) {
            const dist = Math.abs(f.y - face.yMin);
            return dist < 80; // close to wall
          } else {
            const dist = Math.abs(f.x - face.xMin);
            return dist < 80;
          }
        });

        // Project 3D modules onto 2D elevation coordinate space
        roomFurniture.forEach(item => {
          let elevationX = 0;
          
          if (face.isHorizontal) {
            elevationX = (item.x - minX) * (1000 / scale);
          } else {
            elevationX = (item.y - minY) * (1000 / scale);
          }

          // Cabinet metrics
          const width = item.width || 900;
          const height = item.height || 720;
          const depth = item.depth || 600;

          // Compute cabinet elevation bounding box (base units on floor, wall units higher)
          const elevationY = item.libraryId.includes('wall') ? 1400 : 0; // standard kitchen wall height

          viewBoxes.push({
            id: item.id,
            name: item.name,
            x: Math.round(elevationX - width / 2),
            y: elevationY,
            width,
            height,
            depth,
            labelText: `${item.name} (${width}x${height})`
          });
        });

        elevations.push({
          id: `elev_${room.id}_${index}`,
          roomName: room.name,
          viewName: face.face,
          wallLengthMm: Math.round(face.length),
          ceilingHeightMm: projectionHeightMm,
          projectionElements: viewBoxes,
          dimensions: [
            { id: 'dim_h', type: 'horizontal', valueMm: Math.round(face.length) },
            { id: 'dim_v', type: 'vertical', valueMm: projectionHeightMm }
          ]
        });
      });
    });

    // --- 3. REFLECTED CEILING PLAN (RCP) ---
    const rcp = {
      title: "Reflected Ceiling Plan (RCP)",
      lightingFixtureCount: lights.length,
      fixtures: lights.map(light => ({
        id: light.id,
        type: light.type,
        x: light.x,
        y: light.y,
        intensityText: `${light.intensity} lumens`
      }))
    };

    // --- 4. SCHEDULES & BILL OF MATERIALS (BOM) LIST ---
    const schedule = furniture.map((item, idx) => ({
      serialNo: idx + 1,
      id: item.id,
      name: item.name,
      category: item.libraryId.includes('kitchen') ? 'Modular Kitchen' : (item.libraryId.includes('wardrobe') ? 'Bedroom Wardrobe' : 'Living Console'),
      dimensionsText: `${item.width || 900}w x ${item.height || 720}h x ${item.depth || 600}d`,
      materialFinish: item.customization?.shutterFinish || 'Suede Laminate'
    }));

    return {
      success: true,
      projectId: sceneDoc.projectId,
      floorPlan,
      elevations,
      rcp,
      schedule
    };
  }
}

export default new DrawingGenerator();
