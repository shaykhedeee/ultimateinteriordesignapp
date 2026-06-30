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
}

export default new DXFGenerator();
