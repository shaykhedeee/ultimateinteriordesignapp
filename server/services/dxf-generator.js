class DXFGenerator {
  /**
   * Generates DXF drawing content for a wall elevation
   * @param {string} viewName
   * @param {number} wallLength
   * @param {number} wallHeight
   * @param {Array} cabinets
   */
  generateElevationDXF(viewName, wallLength, wallHeight, cabinets) {
    let dxf = [];

    // Header section
    dxf.push("  0", "SECTION", "  2", "HEADER", "  0", "ENDSEC");

    // Tables section (layers definition)
    dxf.push("  0", "SECTION", "  2", "TABLES", "  0", "TABLE", "  2", "LAYER", " 70", "3");

    // Layer 0
    dxf.push("  0", "LAYER", "  2", "0", " 70", "0", " 62", "7", "  6", "CONTINUOUS");
    // Wall Layer
    dxf.push("  0", "LAYER", "  2", "WALL_OUTLINE", " 70", "0", " 62", "1", "  6", "CONTINUOUS"); // Red
    // Cabinets Layer
    dxf.push("  0", "LAYER", "  2", "CABINETRY", " 70", "0", " 62", "4", "  6", "CONTINUOUS"); // Cyan
    // Annotation Layer
    dxf.push("  0", "LAYER", "  2", "ANNOTATIONS", " 70", "0", " 62", "2", "  6", "CONTINUOUS"); // Yellow

    dxf.push("  0", "ENDTAB", "  0", "ENDSEC");

    // Entities section
    dxf.push("  0", "SECTION", "  2", "ENTITIES");

    // Helper to draw a line in DXF
    const drawLine = (x1, y1, x2, y2, layer) => {
      dxf.push("  0", "LINE");
      dxf.push("  8", layer);
      dxf.push(" 10", parseFloat(x1).toFixed(3));
      dxf.push(" 20", parseFloat(y1).toFixed(3));
      dxf.push(" 30", "0.0");
      dxf.push(" 11", parseFloat(x2).toFixed(3));
      dxf.push(" 21", parseFloat(y2).toFixed(3));
      dxf.push(" 31", "0.0");
    };

    // Helper to draw a text label
    const drawText = (x, y, text, height, layer) => {
      dxf.push("  0", "TEXT");
      dxf.push("  8", layer);
      dxf.push(" 10", parseFloat(x).toFixed(3));
      dxf.push(" 20", parseFloat(y).toFixed(3));
      dxf.push(" 30", "0.0");
      dxf.push(" 40", parseFloat(height).toFixed(3));
      dxf.push("  1", text);
    };

    // 1. Draw wall outline (WALL_OUTLINE layer)
    drawLine(0, 0, wallLength, 0, "WALL_OUTLINE");
    drawLine(wallLength, 0, wallLength, wallHeight, "WALL_OUTLINE");
    drawLine(wallLength, wallHeight, 0, wallHeight, "WALL_OUTLINE");
    drawLine(0, wallHeight, 0, 0, "WALL_OUTLINE");

    // Draw Title text
    drawText(50, wallHeight + 100, `ELEVATION: ${viewName.toUpperCase()} (SCALE 1:25)`, 60, "ANNOTATIONS");

    // 2. Draw each cabinetry module (CABINETRY layer)
    cabinets.forEach(cab => {
      const x = cab.xOffsetWall || cab.x || 0;
      const z = cab.zOffset || 0;
      const w = cab.width || 600;
      const h = cab.height || 720;

      // Draw box rectangle
      drawLine(x, z, x + w, z, "CABINETRY");
      drawLine(x + w, z, x + w, z + h, "CABINETRY");
      drawLine(x + w, z + h, x, z + h, "CABINETRY");
      drawLine(x, z + h, x, z, "CABINETRY");

      // Draw cross panel guidelines for representation
      drawLine(x, z, x + w, z + h, "CABINETRY");
      drawLine(x + w, z, x, z + h, "CABINETRY");

      // Draw cabinet label
      drawText(x + 15, z + h / 2 - 10, cab.name, 35, "ANNOTATIONS");
      drawText(x + 15, z + h / 2 - 50, `${w}w x ${h}h`, 25, "ANNOTATIONS");
    });

    // End Entities and EOF
    dxf.push("  0", "ENDSEC", "  0", "EOF");

    return dxf.join("\n");
  }

  /**
   * Generates a professional DXF for a scene/modules with CNC-aware metadata
   */
  generateSceneDXF({ levelName, rooms, walls, openings, modules, machineType = 'generic' }) {
    const dxf = [];
    const machine = CNC_PRESETS[machineType] || CNC_PRESETS.generic;

    dxf.push("  0", "SECTION", "  2", "HEADER");
    dxf.push("  9", "$ACADVER", "  1", "AC1024");
    dxf.push("  9", "$INSUNITS", " 70", "6");
    dxf.push("  0", "ENDSEC");

    // Layers
    dxf.push("  0", "SECTION", "  2", "TABLES", "  0", "TABLE", "  2", "LAYER", " 70", "6");
    [
      { name: "0", color: 7 },
      { name: "WALLS", color: 1 },
      { name: "OPENINGS", color: 3 },
      { name: "FURNITURE", color: 4 },
      { name: "DIMENSIONS", color: 2 },
      { name: "CUT_PATHS", color: 5 },
    ].forEach(layer => {
      dxf.push("  0", "LAYER", "  2", layer.name, " 70", "0", " 62", String(layer.color), "  6", "CONTINUOUS");
    });
    dxf.push("  0", "ENDTAB", "  0", "ENDSEC");

    dxf.push("  0", "SECTION", "  2", "ENTITIES");

    const addLine = (x1, y1, x2, y2, layer, lineType = 'CONTINUOUS') => {
      dxf.push("  0", "LINE", "  8", layer, "  6", lineType);
      dxf.push(" 10", parseFloat(x1).toFixed(3), " 20", parseFloat(y1).toFixed(3), " 30", "0.0");
      dxf.push(" 11", parseFloat(x2).toFixed(3), " 21", parseFloat(y2).toFixed(3), " 31", "0.0");
    };

    const addText = (x, y, text, height, layer) => {
      dxf.push("  0", "TEXT", "  8", layer);
      dxf.push(" 10", parseFloat(x).toFixed(3), " 20", parseFloat(y).toFixed(3), " 30", "0.0");
      dxf.push(" 40", parseFloat(height).toFixed(3), "  1", String(text));
    };

    const addPolyline = (pts, layer, closed = true) => {
      dxf.push("  0", "LWPOLYLINE", "  8", layer);
      dxf.push(" 90", String(pts.length), " 70", closed ? "1" : "0");
      pts.forEach(([x, y]) => {
        dxf.push(" 10", parseFloat(x).toFixed(3), " 20", parseFloat(y).toFixed(3));
      });
    };

    const offsetBase = machine.drawingOffset || 0;

    // Walls
    const wallPolygons = (Array.isArray(walls) ? walls : []).map(w => {
      const x1 = Number(w.x1 || 0) + offsetBase;
      const y1 = Number(w.y1 || 0) + offsetBase;
      const x2 = Number(w.x2 || x1 + 1000) + offsetBase;
      const y2 = Number(w.y2 || y1 + 100) + offsetBase;
      return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
    });

    wallPolygons.forEach(pts => addPolyline(pts, 'WALLS', true));

    // Openings
    (Array.isArray(openings) ? openings : []).forEach(o => {
      const x = Number(o.x || o.cx || 0) + offsetBase;
      const y = Number(o.y || o.cy || 0) + offsetBase;
      const w = Number(o.width || o.w || 900);
      const h = Number(o.height || o.h || 2100);
      addPolyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 'OPENINGS', true);
    });

    // Modules / furniture
    (Array.isArray(modules) ? modules : []).forEach((m, idx) => {
      const x = Number(m.x || m.cx || 0) + offsetBase;
      const y = Number(m.y || m.cy || 0) + offsetBase;
      const w = Number(m.width || m.w || 600);
      const h = Number(m.depth || m.d || 400);
      const d = Number(m.depth || m.d || m.height || h);
      addPolyline([[x, y], [x + w, y], [x + w, y + d], [x, y + d]], 'FURNITURE', true);
      addText(x + 8, y + d / 2, `${m.name || ('MOD_' + (idx + 1))}`, machine.annotationHeight || 18, 'DIMENSIONS');
      addText(x + 8, y + d / 2 - 28, `${w} x ${d}`, machine.annotationHeight || 16, 'DIMENSIONS');
    });

    addText(offsetBase + 20, offsetBase - 60, `SCENE: ${levelName || 'Layout'} | Machine: ${machine.label} | Tool: ${machine.tool || '1/2" Router'}`, machine.annotationHeight || 20, 'DIMENSIONS');
    addText(offsetBase + 20, offsetBase - 90, `Cut depth: ${machine.cutDepth || '18mm'} | Sheet: ${machine.sheet || '4x8'}`, machine.annotationHeight || 16, 'DIMENSIONS');

    dxf.push("  0", "ENDSEC", "  0", "EOF");
    return dxf.join("\n");
  }

  /**
   * Generates a CNC-ready DXF from production cutlist parts
   */
  generateCutlistDXF({ cutlistId, parts = [], nesting = {}, machineType = 'generic' }) {
    const safeParts = Array.isArray(parts) ? parts : [];
    const machine = CNC_PRESETS[machineType] || CNC_PRESETS.generic;
    const dxf = [];

    dxf.push("  0", "SECTION", "  2", "HEADER");
    dxf.push("  9", "$ACADVER", "  1", "AC1024");
    dxf.push("  9", "$INSUNITS", " 70", "6");
    dxf.push("  0", "ENDSEC");

    dxf.push("  0", "SECTION", "  2", "TABLES", "  0", "TABLE", "  2", "LAYER", " 70", "5");
    [
      { name: "0", color: 7 },
      { name: "PARTS", color: 4 },
      { name: "CUT_PATHS", color: 5 },
      { name: "DRILLS", color: 3 },
      { name: "NOTES", color: 2 },
    ].forEach(layer => {
      dxf.push("  0", "LAYER", "  2", layer.name, " 70", "0", " 62", String(layer.color), "  6", "CONTINUOUS");
    });
    dxf.push("  0", "ENDTAB", "  0", "ENDSEC");

    dxf.push("  0", "SECTION", "  2", "ENTITIES");

    const addLine = (x1, y1, x2, y2, layer) => {
      dxf.push("  0", "LINE", "  8", layer);
      dxf.push(" 10", parseFloat(x1).toFixed(3), " 20", parseFloat(y1).toFixed(3), " 30", "0.0");
      dxf.push(" 11", parseFloat(x2).toFixed(3), " 21", parseFloat(y2).toFixed(3), " 31", "0.0");
    };

    const addText = (x, y, text, height, layer) => {
      dxf.push("  0", "TEXT", "  8", layer);
      dxf.push(" 10", parseFloat(x).toFixed(3), " 20", parseFloat(y).toFixed(3), " 30", "0.0");
      dxf.push(" 40", parseFloat(height).toFixed(3), "  1", String(text));
    };

    let cursorX = 0;
    let cursorY = 0;
    const gap = machine.partGap || 12;
    const rowHeight = machine.rowHeight || 240;

    safeParts.forEach((part, idx) => {
      const w = Number(part.lengthMm || part.length || 0);
      const h = Number(part.widthMm || part.width || 0);
      const qty = Number(part.quantity || 1);

      if (cursorX + w > (machine.sheetWidthMm || 2440)) {
        cursorX = 0;
        cursorY += rowHeight;
      }

      const x1 = cursorX;
      const y1 = cursorY;
      const x2 = cursorX + w;
      const y2 = cursorY + h;

      addLine(x1, y1, x2, y1, 'CUT_PATHS');
      addLine(x2, y1, x2, y2, 'CUT_PATHS');
      addLine(x2, y2, x1, y2, 'CUT_PATHS');
      addLine(x1, y2, x1, y1, 'CUT_PATHS');

      if (qty > 1) {
        addText(x1 + 4, y1 + 14, `QTY: ${qty}`, 18, 'NOTES');
      }
      addText(x1 + 4, y1 + 34, `${part.partCode || ('P' + (idx + 1))}`, 20, 'PARTS');
      addText(x1 + 4, y1 + 54, `${w}x${h}`, 18, 'DIMENSIONS');
      if (part.edgeL1 || part.edgeL2 || part.edgeW1 || part.edgeW2) {
        addText(x1 + 4, y1 + 72, `Edge: ${[part.edgeL1, part.edgeL2, part.edgeW1, part.edgeW2].filter(Boolean).join(' | ')}`, 16, 'NOTES');
      }

      cursorX += w + gap;
    });

    addText(20, cursorY + rowHeight + 40, `CUTLIST: ${cutlistId || ''} | Machine: ${machine.label} | Tool: ${machine.tool || '1/2" Router'}`, 22, 'NOTES');
    addText(20, cursorY + rowHeight + 70, `Sheet: ${machine.sheet || '4x8'} | Kerf: ${machine.kerf || '3mm'} | Cut depth: ${machine.cutDepth || '18mm'}`, 18, 'NOTES');

    dxf.push("  0", "ENDSEC", "  0", "EOF");
    return dxf.join("\n");
  }
}

/**
 * CNC machine presets for DXF generation.
 * Add new machines here.
 */
const CNC_PRESETS = {
  generic: {
    label: 'Generic CNC',
    tool: '1/2" Router',
    sheet: '4x8',
    sheetWidthMm: 2440,
    kerf: '3mm',
    cutDepth: '18mm',
    partGap: 12,
    rowHeight: 240,
    annotationHeight: 18,
    drawingOffset: 0,
  },
  beam_saw: {
    label: 'Beam Saw',
    tool: 'Beam Saw',
    sheet: '4x8',
    sheetWidthMm: 2440,
    kerf: '4mm',
    cutDepth: 'Full',
    partGap: 8,
    rowHeight: 220,
    annotationHeight: 18,
    drawingOffset: 0,
  },
  nesting_cnc: {
    label: 'Nesting CNC',
    tool: '1/2" or 1/4" Router',
    sheet: '4x8',
    sheetWidthMm: 2440,
    kerf: '3mm',
    cutDepth: '18mm',
    partGap: 10,
    rowHeight: 200,
    annotationHeight: 18,
    drawingOffset: 0,
  },
  edge_banding: {
    label: 'Edge Banding Line',
    tool: 'Edge Banding',
    sheet: '4x8',
    sheetWidthMm: 2440,
    kerf: '1mm',
    cutDepth: '12mm',
    partGap: 15,
    rowHeight: 260,
    annotationHeight: 20,
    drawingOffset: 0,
  },
};

export { DXFGenerator, CNC_PRESETS };
export default new DXFGenerator();
