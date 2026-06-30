/**
 * SpaceTrace AI - Professional AutoCAD DXF R12 Exporter
 * Generates structured, standard-compliant CAD files with accurate meter scaling,
 * layer separations, mathematical arcs, and detailed 2D office blocks.
 */
const DXFExporter = {
  /**
   * Main entry point. Generates and triggers download of a .dxf file.
   * @param {FloorplanEditor} editor The active FloorplanEditor instance
   */
  exportToDXF: function (editor) {
    if (!editor) {
      console.error("DXFExporter: No editor instance provided.");
      return;
    }

    const ppm = editor.pixelsPerMeter || 40.0;
    
    // --- STEP 1: CONVERT SVG PIXELS TO CARTESIAN METERS (Y-UP) ---
    // SVG has Y-down. CAD has Y-up. We invert Y and then align everything
    // to a positive bounding box starting at (1.0, 1.0) meter origin for clean CAD coordinate layouts.
    
    let minX = Infinity;
    let minY = Infinity;
    
    // Scan all coords to establish boundary
    function registerCoord(x, y) {
      const xm = x / ppm;
      const ym = -y / ppm; // Y-up inversion
      if (xm < minX) minX = xm;
      if (ym < minY) minY = ym;
    }

    // Scan walls
    editor.walls.forEach(w => {
      registerCoord(w.x1, w.y1);
      registerCoord(w.x2, w.y2);
    });

    // Scan furniture
    editor.furniture.forEach(f => {
      registerCoord(f.x, f.y);
      registerCoord(f.x + f.width, f.y + f.height);
    });

    // Scan openings
    editor.openings.forEach(op => {
      registerCoord(op.x, op.y);
    });

    // Scan rooms
    editor.rooms.forEach(r => {
      r.points.forEach(pt => {
        registerCoord(pt.x, pt.y);
      });
    });

    // If no elements, set standard bounds
    if (minX === Infinity) minX = 0;
    if (minY === Infinity) minY = 0;

    // We offset coordinates so minimum bounding coordinate is exactly at (1.0, 1.0) meter
    const offsetX = 1.0 - minX;
    const offsetY = 1.0 - minY;

    // Mapping helper from SVG (pixels) to CAD (meters, Y-up, offset to origin)
    function mapPoint(x, y) {
      return {
        x: (x / ppm) + offsetX,
        y: (-y / ppm) + offsetY
      };
    }

    // Convert angles (SVG clockwise to CAD counter-clockwise)
    function mapAngle(deg) {
      return (-deg + 360) % 360;
    }

    // --- STEP 2: DXF CODE WRITER HELPERS ---
    let dxf = "";
    
    function write(code, val) {
      dxf += `${code}\n${val}\n`;
    }

    function writeHeader() {
      write(0, "SECTION");
      write(2, "HEADER");
      write(9, "$ACADVER");
      write(1, "AC1009"); // Release 12 ASCII
      write(0, "ENDSEC");
    }

    function writeLayers() {
      write(0, "SECTION");
      write(2, "TABLES");
      write(0, "TABLE");
      write(2, "LAYER");
      write(70, 8); // total layers count
      
      const layers = [
        { name: "A-WALL", color: 3 }, // Green for Walls
        { name: "A-DOOR", color: 1 }, // Red for Doors
        { name: "A-GLAZ", color: 4 }, // Cyan for Windows
        { name: "A-FURN", color: 2 }, // Yellow for Furniture
        { name: "A-TEXT", color: 7 }, // White/Black for Room Names
        { name: "A-ANNO", color: 6 }, // Magenta for Dimensions/Calibration
        { name: "Image_Underlay", color: 8 }, // Dark Grey for Underlay Bounding Box
        { name: "0", color: 7 }
      ];

      layers.forEach(lay => {
        write(0, "LAYER");
        write(2, lay.name);
        write(70, 0);
        write(62, lay.color);
        write(6, "CONTINUOUS");
      });

      write(0, "ENDTAB");
      write(0, "ENDSEC");
    }

    // --- GEOMETRIC ENTITY WRITERS ---
    function writeLine(layer, x1, y1, x2, y2) {
      write(0, "LINE");
      write(8, layer);
      write(10, x1.toFixed(4));
      write(20, y1.toFixed(4));
      write(30, "0.0");
      write(11, x2.toFixed(4));
      write(21, y2.toFixed(4));
      write(31, "0.0");
    }

    function writeArc(layer, cx, cy, radius, startAngle, endAngle) {
      write(0, "ARC");
      write(8, layer);
      write(10, cx.toFixed(4));
      write(20, cy.toFixed(4));
      write(30, "0.0");
      write(40, radius.toFixed(4));
      write(50, startAngle.toFixed(2));
      write(51, endAngle.toFixed(2));
    }

    function writePolyline(layer, pts, closed = true) {
      write(0, "POLYLINE");
      write(8, layer);
      write(66, 1); // Vertices follow
      write(10, "0.0");
      write(20, "0.0");
      write(30, "0.0");
      write(70, closed ? 1 : 0);

      pts.forEach(pt => {
        write(0, "VERTEX");
        write(8, layer);
        write(10, pt.x.toFixed(4));
        write(20, pt.y.toFixed(4));
        write(30, "0.0");
      });

      write(0, "SEQEND");
      write(8, layer);
    }

    function writeText(layer, textStr, x, y, height = 0.25, rotation = 0) {
      write(0, "TEXT");
      write(8, layer);
      write(10, x.toFixed(4));
      write(20, y.toFixed(4));
      write(30, "0.0");
      write(40, height.toFixed(4));
      write(1, textStr);
      write(50, rotation.toFixed(2));
    }

    // --- STEP 3: BEGIN ENTITIES SECTION ---
    writeHeader();
    writeLayers();
    write(0, "SECTION");
    write(2, "ENTITIES");

    // --- 3A. EXPORT IMAGE BOUNDING BOX (AUTOMATES AutoCAD IMAGEATTACH) ---
    const sketchImg = editor.svg.querySelector('#sketch-img');
    if (sketchImg) {
      // Map the corners of the 1000x1000 background underlay image to Cartesian meters
      const pTL = mapPoint(0, 0);
      const pTR = mapPoint(1000, 0);
      const pBR = mapPoint(1000, 1000);
      const pBL = mapPoint(0, 1000);

      // Write Bounding box for image alignment
      const imgCorners = [
        { x: pTL.x, y: pTL.y },
        { x: pTR.x, y: pTR.y },
        { x: pBR.x, y: pBR.y },
        { x: pBL.x, y: pBL.y }
      ];
      writePolyline("Image_Underlay", imgCorners, true);

      // Write helpful text instructions in the center of the bounding box
      const cx = (pTL.x + pBR.x) / 2;
      const cy = (pTL.y + pBR.y) / 2;

      writeText("Image_Underlay", "<- CAD AUTO-CALIBRATED IMAGE UNDERLAY BOUNDARY ->", cx - 4.5, cy + 0.8, 0.3, 0);
      writeText("Image_Underlay", "AutoCAD Instruction: Type 'IMAGEATTACH' and select your floorplan file.", cx - 4.2, cy + 0.3, 0.2, 0);
      writeText("Image_Underlay", "Snap the attached image corners perfectly to this bounding box.", cx - 3.8, cy - 0.1, 0.2, 0);
      writeText("Image_Underlay", "This aligns and scales the image to match your vector drawing 1:1!", cx - 4.0, cy - 0.5, 0.2, 0);
    }

    // --- 3B. EXPORT WALLS ---
    editor.walls.forEach(w => {
      const p1 = mapPoint(w.x1, w.y1);
      const p2 = mapPoint(w.x2, w.y2);
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return;

      const thickness = (w.thickness || 10) / ppm; // wall thickness converted to meters
      
      // Calculate perpendicular normal vectors
      const nx = -dy / len;
      const ny = dx / len;
      const t = thickness / 2;

      // Closed 4-point polyline for CAD wall solids
      const corners = [
        { x: p1.x + nx * t, y: p1.y + ny * t },
        { x: p2.x + nx * t, y: p2.y + ny * t },
        { x: p2.x - nx * t, y: p2.y - ny * t },
        { x: p1.x - nx * t, y: p1.y - ny * t }
      ];

      writePolyline("A-WALL", corners, true);
      
      // Special center-line markers for glass partitions
      if (w.material === 'glass') {
        writeLine("A-WALL", p1.x, p1.y, p2.x, p2.y);
      }
    });

    // --- 3B. EXPORT OPENINGS (DOORS & WINDOWS) ---
    editor.openings.forEach(op => {
      const p = mapPoint(op.x, op.y);
      const width = op.width / ppm; // width in meters
      const angleRad = -op.angle * Math.PI / 180; // transform to Cartesian angle

      if (op.type === 'door') {
        // --- Swing Doors on A-DOOR ---
        if (op.style === 'door_single' || op.style === 'single_door') {
          // 1. Door Leaf Line (open at 90 deg)
          const leafRad = angleRad + Math.PI / 2;
          const leafX = p.x + width * Math.cos(leafRad);
          const leafY = p.y + width * Math.sin(leafRad);
          writeLine("A-DOOR", p.x, p.y, leafX, leafY);
          
          // 2. Exact Door Arc swing (90 degrees quarter-circle)
          const startAngle = mapAngle(op.angle);
          const endAngle = mapAngle(op.angle - 90);
          // In CAD, start angle must be less than end angle, or we swap them
          const sa = Math.min(startAngle, endAngle);
          const ea = Math.max(startAngle, endAngle);
          writeArc("A-DOOR", p.x, p.y, width, sa, ea);
          
          // 3. Wall Jam markers
          const jamX = p.x + width * Math.cos(angleRad);
          const jamY = p.y + width * Math.sin(angleRad);
          writeLine("A-DOOR", p.x, p.y, jamX, jamY);
        } 
        else if (op.style === 'door_double' || op.style === 'double_door') {
          const half = width / 2;
          
          // Left leaf
          const leafRad1 = angleRad + Math.PI / 2;
          const leafX1 = p.x + half * Math.cos(leafRad1);
          const leafY1 = p.y + half * Math.sin(leafRad1);
          writeLine("A-DOOR", p.x, p.y, leafX1, leafY1);
          
          // Left arc
          const sa1 = Math.min(mapAngle(op.angle), mapAngle(op.angle - 90));
          const ea1 = Math.max(mapAngle(op.angle), mapAngle(op.angle - 90));
          writeArc("A-DOOR", p.x, p.y, half, sa1, ea1);

          // Right hinge point
          const rx = p.x + width * Math.cos(angleRad);
          const ry = p.y + width * Math.sin(angleRad);
          
          // Right leaf
          const leafRad2 = angleRad + Math.PI / 2;
          const leafX2 = rx - half * Math.cos(leafRad2);
          const leafY2 = ry - half * Math.sin(leafRad2);
          writeLine("A-DOOR", rx, ry, leafX2, leafY2);
          
          // Right arc
          const sa2 = Math.min(mapAngle(op.angle - 180), mapAngle(op.angle - 90));
          const ea2 = Math.max(mapAngle(op.angle - 180), mapAngle(op.angle - 90));
          writeArc("A-DOOR", rx, ry, half, sa2, ea2);
          
          // Double Jams
          writeLine("A-DOOR", p.x, p.y, rx, ry);
        }
        else if (op.style === 'door_sliding' || op.style === 'sliding_door') {
          const half = width / 2;
          
          // Sliding pocket border rectangle
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);
          const nx = -sin;
          const ny = cos;
          
          const t = 0.05; // 5cm thick pocket
          const pocketPts = [
            { x: p.x + nx * t, y: p.y + ny * t },
            { x: p.x + half * cos + nx * t, y: p.y + half * sin + ny * t },
            { x: p.x + half * cos - nx * t, y: p.y + half * sin - ny * t },
            { x: p.x - nx * t, y: p.y - ny * t }
          ];
          writePolyline("A-DOOR", pocketPts, true);

          // Sliding panels line
          const px1 = p.x + (half - 0.2) * cos;
          const py1 = p.y + (half - 0.2) * sin;
          const px2 = p.x + (width - 0.1) * cos;
          const py2 = p.y + (width - 0.1) * sin;
          writeLine("A-DOOR", px1, py1, px2, py2);
          writeLine("A-DOOR", p.x, p.y, p.x + width * cos, p.y + width * sin);
        }
      } 
      else if (op.type === 'entrance' || op.style === 'archway') {
        // --- Open Archways (dashed guidelines on A-WALL) ---
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        // Draw two side lines representing the wall opening boundaries
        writeLine("A-WALL", p.x, p.y, p.x + width * cos, p.y + width * sin);
        // Draw two dashed arc or line indicators for the arch flow
        const nx = -sin;
        const ny = cos;
        const t = 0.05;
        // Dashed flow lines in CAD
        writeLine("A-WALL", p.x + nx * t, p.y + ny * t, p.x + width * cos + nx * t, p.y + width * sin + ny * t);
        writeLine("A-WALL", p.x - nx * t, p.y - ny * t, p.x + width * cos - nx * t, p.y + width * sin - ny * t);
      } 
      else if (op.type === 'window') {
        // --- Windows on A-GLAZ ---
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const nx = -sin;
        const ny = cos;
        const t = 0.06; // 6cm window glass pane thickness
        
        // Glass main casing
        const boxPts = [
          { x: p.x + nx * t, y: p.y + ny * t },
          { x: p.x + width * cos + nx * t, y: p.y + width * sin + ny * t },
          { x: p.x + width * cos - nx * t, y: p.y + width * sin - ny * t },
          { x: p.x - nx * t, y: p.y - ny * t }
        ];
        writePolyline("A-GLAZ", boxPts, true);

        // Center glass pane double divider
        writeLine("A-GLAZ", p.x + (width / 2) * cos - nx * t, p.y + (width / 2) * sin - ny * t, p.x + (width / 2) * cos + nx * t, p.y + (width / 2) * sin + ny * t);
        
        // Window outer sill line
        writeLine("A-GLAZ", p.x - 0.1 * cos - nx * 0.08, p.y - 0.1 * sin - ny * 0.08, p.x + (width + 0.1) * cos - nx * 0.08, p.y + (width + 0.1) * sin - ny * 0.08);
      }
    });

    // --- 3C. EXPORT FURNITURE SYMBOLS (DETAILED 2D BLOCKS ON A-FURN) ---
    editor.furniture.forEach(f => {
      // Internal furniture values are in pixels. Translate width, height to meters.
      const w = f.width / ppm;
      const h = f.height / ppm;
      
      // Calculate center point in CAD
      const svgCx = f.x + f.width / 2;
      const svgCy = f.y + f.height / 2;
      const c = mapPoint(svgCx, svgCy); // center point of CAD item
      
      const rotRad = -f.rotation * Math.PI / 180; // Cartesian counter-clockwise rotation

      // Local coordinate translation helper
      function localPt(lx, ly) {
        return {
          x: lx * Math.cos(rotRad) - ly * Math.sin(rotRad) + c.x,
          y: lx * Math.sin(rotRad) + ly * Math.cos(rotRad) + c.y
        };
      }

      function drawLocalRect(lx1, ly1, lx2, ly2) {
        const pts = [
          localPt(lx1, ly1),
          localPt(lx2, ly1),
          localPt(lx2, ly2),
          localPt(lx1, ly2)
        ];
        writePolyline("A-FURN", pts, true);
      }

      function drawLocalLine(lx1, ly1, lx2, ly2) {
        const p1 = localPt(lx1, ly1);
        const p2 = localPt(lx2, ly2);
        writeLine("A-FURN", p1.x, p1.y, p2.x, p2.y);
      }

      function drawLocalCircle(lcx, lcy, radius) {
        const pt = localPt(lcx, lcy);
        writeArc("A-FURN", pt.x, pt.y, radius, 0, 360);
      }

      // Draw local chair (behind standard desks)
      function drawLocalChair(lcx, lcy, scale = 1.0) {
        const size = 0.2 * scale;
        drawLocalRect(lcx - size, lcy - size, lcx + size, lcy + size); // cushion
        drawLocalLine(lcx - size - 0.05, lcy - size, lcx - size - 0.05, lcy + size); // left armrest
        drawLocalLine(lcx + size + 0.05, lcy - size, lcx + size + 0.05, lcy + size); // right armrest
        // backrest arc
        const bPts = [
          localPt(lcx - size, lcy - size - 0.05),
          localPt(lcx - size * 0.5, lcy - size - 0.09),
          localPt(lcx + size * 0.5, lcy - size - 0.09),
          localPt(lcx + size, lcy - size - 0.05)
        ];
        writePolyline("A-FURN", bPts, false);
      }

      // --- PROCEDURAL BLOCK RENDERING CORRESPONDING TO SYMBOLS ---
      if (f.libraryId === 'single_desk') {
        // Main desk surface
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        // Keyboard
        drawLocalRect(-0.2, h/2 - 0.25, 0.2, h/2 - 0.15);
        // Laptop Screen
        drawLocalRect(-0.25, h/2 - 0.09, 0.25, h/2 - 0.04);
        // Ergonomic office chair
        drawLocalChair(0, -h/2 - 0.22);
      } 
      else if (f.libraryId === 'executive_desk') {
        // Main L-desk body
        drawLocalRect(-w/2, -h/2, w/2, h/2 - 0.8);
        // Return Desk panel
        drawLocalRect(w/2 - 0.6, -h/2, w/2, h/2);
        // Monitor screen
        drawLocalRect(-0.35, h/2 - 0.95, 0.35, h/2 - 0.9);
        // Guest plush chairs (x2)
        drawLocalChair(-w/3, -h/2 - 0.22, 1.15);
      } 
      else if (f.libraryId === 'desk_cluster_4') {
        // Main Outer border
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        // Cross Dividers
        drawLocalLine(-w/2, 0, w/2, 0);
        drawLocalLine(0, -h/2, 0, h/2);
        
        // 4 laptops / keyboard set
        const quadX = w / 4;
        const quadY = h / 4;
        
        // Set 1 (Top Left)
        drawLocalRect(-quadX - 0.2, quadY - 0.1, -quadX + 0.2, quadY);
        drawLocalChair(-quadX, quadY + 0.3, 0.95);
        
        // Set 2 (Top Right)
        drawLocalRect(quadX - 0.2, quadY - 0.1, quadX + 0.2, quadY);
        drawLocalChair(quadX, quadY + 0.3, 0.95);

        // Set 3 (Bottom Left)
        drawLocalRect(-quadX - 0.2, -quadY, -quadX + 0.2, -quadY + 0.1);
        drawLocalChair(-quadX, -quadY - 0.3, 0.95);

        // Set 4 (Bottom Right)
        drawLocalRect(quadX - 0.2, -quadY, quadX + 0.2, -quadY + 0.1);
        drawLocalChair(quadX, -quadY - 0.3, 0.95);
      } 
      else if (f.libraryId === 'conference_table_large') {
        // Tablet capsule design
        drawLocalRect(-w/2 + h/2, -h/2, w/2 - h/2, h/2);
        // Cap left arc
        const pLeft = localPt(-w/2 + h/2, 0);
        writeArc("A-FURN", pLeft.x, pLeft.y, h/2, 90, 270);
        // Cap right arc
        const pRight = localPt(w/2 - h/2, 0);
        writeArc("A-FURN", pRight.x, pRight.y, h/2, 270, 90);
        
        // Conference grommet central details
        drawLocalRect(-w/4, -0.1, w/4, 0.1);
        
        // Spaced conference chairs (10 chairs)
        const numChairs = 4;
        const startX = -w/2 + 0.6;
        const stepX = (w - 1.2) / (numChairs - 1);
        for(let i=0; i<numChairs; i++) {
          drawLocalChair(startX + i * stepX, -h/2 - 0.2, 0.9);
          drawLocalChair(startX + i * stepX, h/2 + 0.2, 0.9);
        }
        drawLocalChair(-w/2 - 0.1, 0, 0.9);
        drawLocalChair(w/2 + 0.1, 0, 0.9);
      } 
      else if (f.libraryId === 'conference_table_round') {
        const radius = w / 2;
        drawLocalCircle(0, 0, radius);
        drawLocalCircle(0, 0, radius * 0.2); // center ring
        
        // 5 circular chairs around it
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5;
          const cx = (radius + 0.22) * Math.cos(angle);
          const cy = (radius + 0.22) * Math.sin(angle);
          drawLocalCircle(cx, cy, 0.18);
        }
      } 
      else if (f.libraryId === 'lounge_sofa_3') {
        // Sofa perimeter frame
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        // Backrest cushion
        drawLocalRect(-w/2 + 0.05, -h/2 + 0.05, w/2 - 0.05, -h/2 + 0.2);
        // Left armrest
        drawLocalRect(-w/2 + 0.05, -h/2 + 0.2, -w/2 + 0.18, h/2 - 0.05);
        // Right armrest
        drawLocalRect(w/2 - 0.18, -h/2 + 0.2, w/2 - 0.05, h/2 - 0.05);
        // Cushions split indicators
        const innerW = w - 0.36;
        drawLocalLine(-w/2 + 0.18 + innerW/3, -h/2 + 0.2, -w/2 + 0.18 + innerW/3, h/2 - 0.05);
        drawLocalLine(-w/2 + 0.18 + 2*innerW/3, -h/2 + 0.2, -w/2 + 0.18 + 2*innerW/3, h/2 - 0.05);
      }
      else if (f.libraryId === 'lounge_chair') {
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        drawLocalRect(-w/2 + 0.06, -h/2 + 0.06, w/2 - 0.06, -h/2 + 0.2); // backrest
        drawLocalRect(-w/2 + 0.06, -h/2 + 0.2, -w/2 + 0.16, h/2 - 0.06); // left arm
        drawLocalRect(w/2 - 0.16, -h/2 + 0.2, w/2 - 0.06, h/2 - 0.06); // right arm
      }
      else if (f.libraryId === 'coffee_table') {
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        drawLocalRect(-w/2 + 0.05, -h/2 + 0.05, w/2 - 0.05, h/2 - 0.05); // internal pane
      }
      else if (f.libraryId === 'pantry_table_cluster') {
        // Table top
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        // Bar stools
        const numStools = 3;
        const stepX = w / (numStools + 1);
        for(let i=1; i<=numStools; i++) {
          const sx = -w/2 + i * stepX;
          drawLocalCircle(sx, -h/2 - 0.15, 0.12);
          drawLocalCircle(sx, h/2 + 0.15, 0.12);
        }
      }
      else if (f.libraryId === 'potted_plant_large') {
        // Plant pot ring
        drawLocalCircle(0, 0, w/2);
        drawLocalCircle(0, 0, w/2 - 0.06);
        // Leaves shapes (star-like layout)
        drawLocalLine(0, 0, -w/2 - 0.1, -w/2 - 0.1);
        drawLocalLine(0, 0, w/2 + 0.1, -w/2 - 0.1);
        drawLocalLine(0, 0, w/2 + 0.12, w/2 + 0.12);
        drawLocalLine(0, 0, -w/2 - 0.12, w/2 + 0.12);
        drawLocalLine(0, 0, 0, -w/2 - 0.15);
        drawLocalLine(0, 0, 0, w/2 + 0.15);
      }
      else if (f.libraryId === 'printer_station') {
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        drawLocalRect(-w/2 - 0.05, -h/2 + 0.15, -w/2, h/2 - 0.15); // paper deck
        drawLocalRect(w/2 - 0.15, -h/2 + 0.1, w/2 - 0.05, h/2 - 0.1); // UI screen panel
      }
      else if (f.libraryId === 'server_rack') {
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        drawLocalRect(-w/2 + 0.05, -h/2 + 0.05, w/2 - 0.05, h/2 - 0.05); // glass casing
        // Slot rails
        drawLocalLine(-w/2 + 0.1, -h/2 + 0.15, w/2 - 0.1, -h/2 + 0.15);
        drawLocalLine(-w/2 + 0.1, -h/2 + 0.3, w/2 - 0.1, -h/2 + 0.3);
        drawLocalLine(-w/2 + 0.1, -h/2 + 0.45, w/2 - 0.1, -h/2 + 0.45);
      }
      else if (f.libraryId === 'toilet_wc') {
        drawLocalRect(-w/2, h/2 - 0.15, w/2, h/2); // tank
        // Toilet oval bowl approximation
        drawLocalCircle(0, -0.05, w/2);
        drawLocalLine(-w/2, h/2 - 0.15, -w/2, -0.05);
        drawLocalLine(w/2, h/2 - 0.15, w/2, -0.05);
      }
      else if (f.libraryId === 'bathroom_sink') {
        drawLocalRect(-w/2, -h/2, w/2, h/2); // counter
        drawLocalRect(-w/2 + 0.08, -h/2 + 0.08, w/2 - 0.08, h/2 - 0.08); // bowl
        drawLocalCircle(0, 0, 0.04); // drain
      }
      else if (f.libraryId === 'staircase') {
        // Main staircase core boundary
        drawLocalRect(-w/2, -h/2, w/2, h/2);
        // Center landing divider
        drawLocalLine(-w/2, 0, w/2, 0);
        // Individual step treads (12 steps)
        const numSteps = 12;
        const stepW = w / numSteps;
        for (let i = 0; i <= numSteps; i++) {
          const sx = -w/2 + i * stepW;
          drawLocalLine(sx, -h/2, sx, h/2);
        }
        // Red direction arrow path line
        drawLocalLine(-w/2 + 0.35, -h/4, w/2 - 0.35, -h/4);
        drawLocalLine(w/2 - 0.35, -h/4, w/2 - 0.35, 0);
        // Arrow tip pointer
        const arrTip = localPt(w/2 - 0.35, 0);
        const arrLeft = localPt(w/2 - 0.48, -0.15);
        const arrRight = localPt(w/2 - 0.22, -0.15);
        writeLine("A-FURN", arrTip.x, arrTip.y, arrLeft.x, arrLeft.y);
        writeLine("A-FURN", arrTip.x, arrTip.y, arrRight.x, arrRight.y);
      }
      else {
        // Fallback: draw generic item block boundary
        drawLocalRect(-w/2, -h/2, w/2, h/2);
      }

      // Add a clean label text centered at the furniture center
      writeText("A-FURN", f.name, c.x - 0.2, c.y - 0.05, 0.16, mapAngle(f.rotation));
    });

    // --- 3D. EXPORT ROOM SPACES & ROOM LABELS ---
    editor.rooms.forEach(room => {
      // 1. Write the closed room area boundary polyline
      const pts = room.points.map(pt => mapPoint(pt.x, pt.y));
      writePolyline("A-TEXT", pts, true);

      // 2. Add Room Title tag at center
      let cx = 0, cy = 0;
      room.points.forEach(pt => { cx += pt.x; cy += pt.y; });
      cx /= room.points.length;
      cy /= room.points.length;

      const p = mapPoint(cx, cy);

      // We calculate area in square meters
      let area = 0;
      const n = room.points.length;
      for (let i = 0; i < n; i++) {
        const p1 = room.points[i];
        const p2 = room.points[(i + 1) % n];
        area += p1.x * p2.y - p2.x * p1.y;
      }
      area = Math.abs(area) / 2;
      const sqMeters = area / (ppm * ppm);

      writeText("A-TEXT", room.name.toUpperCase(), p.x - 0.6, p.y + 0.1, 0.32, 0);
      writeText("A-TEXT", `${sqMeters.toFixed(1)} SQ M`, p.x - 0.4, p.y - 0.2, 0.18, 0);
    });

    // --- 3E. EXPORT MEASUREMENTS & TAPE ANNOTATIONS ---
    editor.measures.forEach(m => {
      const p1 = mapPoint(m.x1, m.y1);
      const p2 = mapPoint(m.x2, m.y2);
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);

      // Primary measure dimension line on A-ANNO
      writeLine("A-ANNO", p1.x, p1.y, p2.x, p2.y);
      
      // Extension tick mark lines at terminals
      const angle = Math.atan2(dy, dx);
      const crossRad = angle + Math.PI / 2;
      const size = 0.15; // 15cm ticks
      
      writeLine("A-ANNO", p1.x - size * Math.cos(crossRad), p1.y - size * Math.sin(crossRad), p1.x + size * Math.cos(crossRad), p1.y + size * Math.sin(crossRad));
      writeLine("A-ANNO", p2.x - size * Math.cos(crossRad), p2.y - size * Math.sin(crossRad), p2.x + size * Math.cos(crossRad), p2.y + size * Math.sin(crossRad));

      // Centered label text showing exact distance in meters
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const txt = `${len.toFixed(2)} m`;
      
      writeText("A-ANNO", txt, mx - 0.2, my + 0.1, 0.2, (angle * 180 / Math.PI));
    });

    // --- STEP 4: END THE ENTITIES SECTION & FILE ---
    write(0, "ENDSEC");
    write(0, "EOF");

    // --- STEP 5: PROMPT BROWSER DOWNLOAD ---
    const blob = new Blob([dxf], { type: "application/dxf;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `office-cad-layout-${Date.now()}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Generates and downloads an AutoCAD Script (.scr) that automates:
   * 1. Creating the Image_Underlay layer with Color 8
   * 2. IMAGEATTACHing the user's sketch at the exact Cartesian coordinates and scale
   * 3. Dimming the image underlay to 50% opacity/fade
   * 4. Bypassing manual SCALE and Reference alignment entirely!
   */
  exportToSCR: function (editor) {
    if (!editor) {
      console.error("DXFExporter: No editor instance provided.");
      return;
    }

    const ppm = editor.pixelsPerMeter || 40.0;
    
    // Calculate boundaries and offsets exactly as done in DXF export to keep 1:1 parity!
    let minX = Infinity;
    let minY = Infinity;
    
    function registerCoord(x, y) {
      const xm = x / ppm;
      const ym = -y / ppm;
      if (xm < minX) minX = xm;
      if (ym < minY) minY = ym;
    }

    editor.walls.forEach(w => {
      registerCoord(w.x1, w.y1);
      registerCoord(w.x2, w.y2);
    });
    editor.furniture.forEach(f => {
      registerCoord(f.x, f.y);
      registerCoord(f.x + f.width, f.y + f.height);
    });
    editor.openings.forEach(op => {
      registerCoord(op.x, op.y);
    });
    editor.rooms.forEach(r => {
      r.points.forEach(pt => {
        registerCoord(pt.x, pt.y);
      });
    });

    if (minX === Infinity) minX = 0;
    if (minY === Infinity) minY = 0;

    const offsetX = 1.0 - minX;
    const offsetY = 1.0 - minY;

    // The bottom-left point of the 1000x1000 base image
    const pBL_x = (0 / ppm) + offsetX;
    const pBL_y = (-1000 / ppm) + offsetY;
    const imgRealWidth = 1000 / ppm;
    
    // Get file name
    const imgName = editor.sketchFileName || 'sketch.png';
    
    let scr = "";
    scr += "; ==========================================================================\n";
    scr += "; SpaceTrace AI - Professional AutoCAD Underlay Auto-Aligner Script (.scr)\n";
    scr += "; Automates: Layering + IMAGEATTACH + Dimming (50% Fade) + 1:1 Scale Snapping\n";
    scr += "; ==========================================================================\n";
    scr += ";\n";
    scr += "; INSTRUCTIONS:\n";
    scr += "; 1. Place this SCR file in the SAME directory/folder as your sketch image: " + imgName + "\n";
    scr += "; 2. Open your exported DXF drawing in AutoCAD.\n";
    scr += "; 3. Type 'SCRIPT' in the AutoCAD command line and press Enter.\n";
    scr += "; 4. Select this .scr file and click Open.\n";
    scr += "; 5. AutoCAD will instantly load, scale, place and dim the underlay matching your vector plan 1:1!\n";
    scr += ";\n";
    scr += "; NOTE: If your sketch file is not named \"" + imgName + "\", rename it to match or\n";
    scr += "; edit the filename in line 23 of this script before running.\n";
    scr += ";\n";
    scr += "; ==========================================================================\n\n";

    // 1. Create and configure the underlay layer
    scr += "-LAYER M Image_Underlay C 8 Image_Underlay \n";
    
    // 2. Attach the image at the exact offset origin and scale (width = imgRealWidth)
    // Command sequence: -IMAGE Attach [Filename] [Insertion Point] [Scale] [Rotation Angle]
    scr += "-IMAGE A \"" + imgName + "\" " + pBL_x.toFixed(4) + "," + pBL_y.toFixed(4) + " " + imgRealWidth.toFixed(4) + " 0\n";
    
    // 3. Dim/Fade the image underlay to 50% for high contrast manual tracing overlays
    // Command sequence: -IMAGEADJUST [Select Last] Fade 50
    scr += "-IMAGEADJUST L F 50 \n";
    
    // 4. Zoom to Extents for a perfect view presentation
    scr += "ZOOM E\n";
    scr += "; Done! Your hand-drawn sketch is now attached, aligned, and scaled 1:1 perfectly!\n";
    
    const blob = new Blob([scr], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `align-underlay-${Date.now()}.scr`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Expose globally
window.DXFExporter = DXFExporter;
