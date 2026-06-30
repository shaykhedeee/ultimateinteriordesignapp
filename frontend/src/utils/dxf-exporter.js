/**
 * SpaceTrace AI - Professional AutoCAD DXF R12 Exporter (ES Module)
 * Generates structured, standard-compliant CAD files with accurate meter scaling,
 * layer separations, mathematical arcs, and detailed 2D office blocks.
 */

export function exportToDXF({ walls, openings, furniture, rooms, measures, pixelsPerMeter = 40.0, hasUnderlay = false, sketchFileName = 'sketch.png' }) {
  const ppm = pixelsPerMeter;
  
  // --- STEP 1: CONVERT SVG PIXELS TO CARTESIAN METERS (Y-UP) ---
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
  walls.forEach(w => {
    registerCoord(w.x1, w.y1);
    registerCoord(w.x2, w.y2);
  });

  // Scan furniture
  furniture.forEach(f => {
    registerCoord(f.x, f.y);
    registerCoord(f.x + (f.width || 0), f.y + (f.height || 0));
  });

  // Scan openings
  openings.forEach(op => {
    registerCoord(op.x, op.y);
  });

  // Scan rooms
  rooms.forEach(r => {
    if (r.points && Array.isArray(r.points)) {
      r.points.forEach(pt => {
        registerCoord(pt.x, pt.y);
      });
    }
  });

  // If no elements, set standard bounds
  if (minX === Infinity) minX = 0;
  if (minY === Infinity) minY = 0;

  // Offset coordinates so minimum bounding coordinate is exactly at (1.0, 1.0) meter
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

  // --- STEP 3: BEGIN ENTITIES SECTION ---
  writeHeader();
  writeLayers();
  write(0, "SECTION");
  write(2, "ENTITIES");

  // --- 3A. EXPORT IMAGE BOUNDING BOX ---
  if (hasUnderlay) {
    const pTL = mapPoint(0, 0);
    const pTR = mapPoint(1000, 0);
    const pBR = mapPoint(1000, 1000);
    const pBL = mapPoint(0, 1000);

    const imgCorners = [
      { x: pTL.x, y: pTL.y },
      { x: pTR.x, y: pTR.y },
      { x: pBR.x, y: pBR.y },
      { x: pBL.x, y: pBL.y }
    ];
    writePolyline("Image_Underlay", imgCorners, true);

    const cx = (pTL.x + pBR.x) / 2;
    const cy = (pTL.y + pBR.y) / 2;

    writeText("Image_Underlay", "<- CAD AUTO-CALIBRATED IMAGE UNDERLAY BOUNDARY ->", cx - 4.5, cy + 0.8, 0.3, 0);
    writeText("Image_Underlay", "AutoCAD Instruction: Type 'IMAGEATTACH' and select your floorplan file.", cx - 4.2, cy + 0.3, 0.2, 0);
    writeText("Image_Underlay", "Snap the attached image corners perfectly to this bounding box.", cx - 3.8, cy - 0.1, 0.2, 0);
    writeText("Image_Underlay", "This aligns and scales the image to match your vector drawing 1:1!", cx - 4.0, cy - 0.5, 0.2, 0);
  }

  // --- 3B. EXPORT WALLS ---
  walls.forEach(w => {
    const p1 = mapPoint(w.x1, w.y1);
    const p2 = mapPoint(w.x2, w.y2);
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const thickness = (w.thickness || 10) / ppm;
    const nx = -dy / len;
    const ny = dx / len;
    const t = thickness / 2;

    const corners = [
      { x: p1.x + nx * t, y: p1.y + ny * t },
      { x: p2.x + nx * t, y: p2.y + ny * t },
      { x: p2.x - nx * t, y: p2.y - ny * t },
      { x: p1.x - nx * t, y: p1.y - ny * t }
    ];

    writePolyline("A-WALL", corners, true);
    
    if (w.material === 'glass') {
      writeLine("A-WALL", p1.x, p1.y, p2.x, p2.y);
    }
  });

  // --- 3C. EXPORT OPENINGS ---
  openings.forEach(op => {
    const p = mapPoint(op.x, op.y);
    const width = op.width / ppm;
    const angleRad = -op.angle * Math.PI / 180;

    if (op.type === 'door') {
      if (op.style === 'door_single' || op.style === 'single_door' || op.style === 'single') {
        const leafRad = angleRad + Math.PI / 2;
        const leafX = p.x + width * Math.cos(leafRad);
        const leafY = p.y + width * Math.sin(leafRad);
        writeLine("A-DOOR", p.x, p.y, leafX, leafY);
        
        const startAngle = mapAngle(op.angle);
        const endAngle = mapAngle(op.angle - 90);
        const sa = Math.min(startAngle, endAngle);
        const ea = Math.max(startAngle, endAngle);
        writeArc("A-DOOR", p.x, p.y, width, sa, ea);
        
        const jamX = p.x + width * Math.cos(angleRad);
        const jamY = p.y + width * Math.sin(angleRad);
        writeLine("A-DOOR", p.x, p.y, jamX, jamY);
      } 
      else if (op.style === 'door_double' || op.style === 'double_door' || op.style === 'double') {
        const half = width / 2;
        const leafRad1 = angleRad + Math.PI / 2;
        const leafX1 = p.x + half * Math.cos(leafRad1);
        const leafY1 = p.y + half * Math.sin(leafRad1);
        writeLine("A-DOOR", p.x, p.y, leafX1, leafY1);
        
        const sa1 = Math.min(mapAngle(op.angle), mapAngle(op.angle - 90));
        const ea1 = Math.max(mapAngle(op.angle), mapAngle(op.angle - 90));
        writeArc("A-DOOR", p.x, p.y, half, sa1, ea1);

        const rx = p.x + width * Math.cos(angleRad);
        const ry = p.y + width * Math.sin(angleRad);
        
        const leafRad2 = angleRad + Math.PI / 2;
        const leafX2 = rx - half * Math.cos(leafRad2);
        const leafY2 = ry - half * Math.sin(leafRad2);
        writeLine("A-DOOR", rx, ry, leafX2, leafY2);
        
        const sa2 = Math.min(mapAngle(op.angle - 180), mapAngle(op.angle - 90));
        const ea2 = Math.max(mapAngle(op.angle - 180), mapAngle(op.angle - 90));
        writeArc("A-DOOR", rx, ry, half, sa2, ea2);
        
        writeLine("A-DOOR", p.x, p.y, rx, ry);
      }
      else if (op.style === 'door_sliding' || op.style === 'sliding_door' || op.style === 'sliding') {
        const half = width / 2;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const nx = -sin;
        const ny = cos;
        
        const t = 0.05; 
        const pocketPts = [
          { x: p.x + nx * t, y: p.y + ny * t },
          { x: p.x + half * cos + nx * t, y: p.y + half * sin + ny * t },
          { x: p.x + half * cos - nx * t, y: p.y + half * sin - ny * t },
          { x: p.x - nx * t, y: p.y - ny * t }
        ];
        writePolyline("A-DOOR", pocketPts, true);

        const px1 = p.x + (half - 0.2) * cos;
        const py1 = p.y + (half - 0.2) * sin;
        const px2 = p.x + (width - 0.1) * cos;
        const py2 = p.y + (width - 0.1) * sin;
        writeLine("A-DOOR", px1, py1, px2, py2);
        writeLine("A-DOOR", p.x, p.y, p.x + width * cos, p.y + width * sin);
      }
    } 
    else if (op.type === 'entrance' || op.style === 'archway') {
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      writeLine("A-WALL", p.x, p.y, p.x + width * cos, p.y + width * sin);
      const nx = -sin;
      const ny = cos;
      const t = 0.05;
      writeLine("A-WALL", p.x + nx * t, p.y + ny * t, p.x + width * cos + nx * t, p.y + width * sin + ny * t);
      writeLine("A-WALL", p.x - nx * t, p.y - ny * t, p.x + width * cos - nx * t, p.y + width * sin - ny * t);
    } 
    else if (op.type === 'window') {
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      const nx = -sin;
      const ny = cos;
      const t = 0.06; 
      
      const boxPts = [
        { x: p.x + nx * t, y: p.y + ny * t },
        { x: p.x + width * cos + nx * t, y: p.y + width * sin + ny * t },
        { x: p.x + width * cos - nx * t, y: p.y + width * sin - ny * t },
        { x: p.x - nx * t, y: p.y - ny * t }
      ];
      writePolyline("A-GLAZ", boxPts, true);

      writeLine("A-GLAZ", p.x + (width / 2) * cos - nx * t, p.y + (width / 2) * sin - ny * t, p.x + (width / 2) * cos + nx * t, p.y + (width / 2) * sin + ny * t);
      writeLine("A-GLAZ", p.x - 0.1 * cos - nx * 0.08, p.y - 0.1 * sin - ny * 0.08, p.x + (width + 0.1) * cos - nx * 0.08, p.y + (width + 0.1) * sin - ny * 0.08);
    }
  });

  // --- 3D. EXPORT FURNITURE ---
  furniture.forEach(f => {
    const w = f.width / ppm;
    const h = f.height / ppm;
    
    const svgCx = f.x + f.width / 2;
    const svgCy = f.y + f.height / 2;
    const c = mapPoint(svgCx, svgCy); 
    const rotRad = -f.rotation * Math.PI / 180;

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

    function drawLocalChair(lcx, lcy, scale = 1.0) {
      const size = 0.2 * scale;
      drawLocalRect(lcx - size, lcy - size, lcx + size, lcy + size);
      drawLocalLine(lcx - size - 0.05, lcy - size, lcx - size - 0.05, lcy + size);
      drawLocalLine(lcx + size + 0.05, lcy - size, lcx + size + 0.05, lcy + size);
      const bPts = [
        localPt(lcx - size, lcy - size - 0.05),
        localPt(lcx - size * 0.5, lcy - size - 0.09),
        localPt(lcx + size * 0.5, lcy - size - 0.09),
        localPt(lcx + size, lcy - size - 0.05)
      ];
      writePolyline("A-FURN", bPts, false);
    }

    const fid = f.type || f.libraryId || '';
    if (fid.includes('desk') || fid.includes('table')) {
      drawLocalRect(-w/2, -h/2, w/2, h/2);
      drawLocalRect(-0.2, h/2 - 0.25, 0.2, h/2 - 0.15); 
      drawLocalChair(0, -h/2 - 0.22);
    } 
    else if (fid.includes('sofa') || fid.includes('couch')) {
      drawLocalRect(-w/2, -h/2, w/2, h/2);
      drawLocalRect(-w/2 + 0.05, -h/2 + 0.05, w/2 - 0.05, -h/2 + 0.2); 
      drawLocalRect(-w/2 + 0.05, -h/2 + 0.2, -w/2 + 0.18, h/2 - 0.05); 
      drawLocalRect(w/2 - 0.18, -h/2 + 0.2, w/2 - 0.05, h/2 - 0.05); 
    }
    else if (fid.includes('chair') || fid.includes('stool')) {
      drawLocalCircle(0, 0, w/2);
      drawLocalChair(0, 0);
    }
    else if (fid.includes('bed')) {
      drawLocalRect(-w/2, -h/2, w/2, h/2);
      drawLocalRect(-w/2 + 0.1, -h/2 + 0.1, w/2 - 0.1, -h/2 + 0.3); 
    }
    else if (fid.includes('plant')) {
      drawLocalCircle(0, 0, w/2);
      drawLocalLine(0, 0, -w/2, -w/2);
      drawLocalLine(0, 0, w/2, w/2);
    }
    else if (fid.includes('toilet') || fid.includes('wc')) {
      drawLocalRect(-w/2, h/2 - 0.15, w/2, h/2);
      drawLocalCircle(0, -0.05, w/2);
    }
    else if (fid.includes('sink') || fid.includes('basin')) {
      drawLocalRect(-w/2, -h/2, w/2, h/2);
      drawLocalRect(-w/2 + 0.08, -h/2 + 0.08, w/2 - 0.08, h/2 - 0.08);
    }
    else {
      drawLocalRect(-w/2, -h/2, w/2, h/2);
    }

    writeText("A-FURN", f.name || f.type || 'Object', c.x - 0.2, c.y - 0.05, 0.16, mapAngle(f.rotation || 0));
  });

  // --- 3D. EXPORT ROOM SPACES ---
  rooms.forEach(room => {
    if (room.points && Array.isArray(room.points)) {
      const pts = room.points.map(pt => mapPoint(pt.x, pt.y));
      writePolyline("A-TEXT", pts, true);

      let cx = 0, cy = 0;
      room.points.forEach(pt => { cx += pt.x; cy += pt.y; });
      cx /= room.points.length;
      cy /= room.points.length;

      const p = mapPoint(cx, cy);

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
    }
  });

  // --- 3F. EXPORT DIMENSIONS ---
  measures.forEach(m => {
    const p1 = mapPoint(m.x1, m.y1);
    const p2 = mapPoint(m.x2, m.y2);
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);

    writeLine("A-ANNO", p1.x, p1.y, p2.x, p2.y);
    
    const angle = Math.atan2(dy, dx);
    const crossRad = angle + Math.PI / 2;
    const size = 0.15; 
    
    writeLine("A-ANNO", p1.x - size * Math.cos(crossRad), p1.y - size * Math.sin(crossRad), p1.x + size * Math.cos(crossRad), p1.y + size * Math.sin(crossRad));
    writeLine("A-ANNO", p2.x - size * Math.cos(crossRad), p2.y - size * Math.sin(crossRad), p2.x + size * Math.cos(crossRad), p2.y + size * Math.sin(crossRad));

    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const txt = `${len.toFixed(2)} m`;
    
    writeText("A-ANNO", txt, mx - 0.2, my + 0.1, 0.2, (angle * 180 / Math.PI));
  });

  // --- STEP 4: END THE ENTITIES SECTION & FILE ---
  write(0, "ENDSEC");
  write(0, "EOF");

  // --- STEP 5: DOWNLOAD DXF ---
  const blob = new Blob([dxf], { type: "application/dxf;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spacetrace-cad-${Date.now()}.dxf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToSCR({ walls, openings, furniture, rooms, measures, pixelsPerMeter = 40.0, sketchFileName = 'sketch.png' }) {
  const ppm = pixelsPerMeter;
  let minX = Infinity;
  let minY = Infinity;
  
  function registerCoord(x, y) {
    const xm = x / ppm;
    const ym = -y / ppm;
    if (xm < minX) minX = xm;
    if (ym < minY) minY = ym;
  }

  walls.forEach(w => {
    registerCoord(w.x1, w.y1);
    registerCoord(w.x2, w.y2);
  });
  furniture.forEach(f => {
    registerCoord(f.x, f.y);
    registerCoord(f.x + (f.width || 0), f.y + (f.height || 0));
  });
  openings.forEach(op => {
    registerCoord(op.x, op.y);
  });
  rooms.forEach(r => {
    if (r.points && Array.isArray(r.points)) {
      r.points.forEach(pt => {
        registerCoord(pt.x, pt.y);
      });
    }
  });

  if (minX === Infinity) minX = 0;
  if (minY === Infinity) minY = 0;

  const offsetX = 1.0 - minX;
  const offsetY = 1.0 - minY;

  const pBL_x = (0 / ppm) + offsetX;
  const pBL_y = (-1000 / ppm) + offsetY;
  const imgRealWidth = 1000 / ppm;
  
  let scr = "";
  scr += "; ==========================================================================\n";
  scr += "; SpaceTrace AI - Professional AutoCAD Underlay Auto-Aligner Script (.scr)\n";
  scr += "; Automates: Layering + IMAGEATTACH + Dimming (50% Fade) + 1:1 Scale Snapping\n";
  scr += "; ==========================================================================\n;\n";
  scr += "; INSTRUCTIONS:\n";
  scr += "; 1. Place this SCR file in the SAME directory/folder as your sketch image: " + sketchFileName + "\n";
  scr += "; 2. Open your exported DXF drawing in AutoCAD.\n";
  scr += "; 3. Type 'SCRIPT' in the AutoCAD command line and press Enter.\n";
  scr += "; 4. Select this .scr file and click Open.\n";
  scr += "; 5. AutoCAD will instantly load, scale, place and dim the underlay matching your vector plan 1:1!\n;\n";
  scr += "; ==========================================================================\n\n";

  scr += "-LAYER M Image_Underlay C 8 Image_Underlay \n";
  scr += "-IMAGE A \"" + sketchFileName + "\" " + pBL_x.toFixed(4) + "," + pBL_y.toFixed(4) + " " + imgRealWidth.toFixed(4) + " 0\n";
  scr += "-IMAGEADJUST L F 50 \n";
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
