// Image processing and Computer Vision-like line detection for Sketch-to-Floorplan conversion
const CVProcessor = {
  /**
   * Applies brightness, contrast, and binarization thresholding to a canvas
   */
  processImage: function (srcCanvas, destCanvas, brightness, contrast, threshold, invert = false) {
    const srcCtx = srcCanvas.getContext('2d');
    const destCtx = destCanvas.getContext('2d');
    
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    
    destCanvas.width = w;
    destCanvas.height = h;
    
    destCtx.drawImage(srcCanvas, 0, 0);
    const imgData = destCtx.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    
    // --- 3x3 SPATIAL BOX BLUR FOR PRE-PROCESSING NOISE FILTER ---
    // Smooths grainy paper textures and gradients so walls detect as clean, straight lines.
    const copy = new Uint8ClampedArray(pixels);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let rSum = 0, gSum = 0, bSum = 0;
        
        // Unroll 3x3 neighborhood kernel for extreme performance
        for (let ky = -1; ky <= 1; ky++) {
          const rowOffset = ((y + ky) * w + x) * 4;
          
          rSum += copy[rowOffset - 4] + copy[rowOffset] + copy[rowOffset + 4];
          gSum += copy[rowOffset - 3] + copy[rowOffset + 1] + copy[rowOffset + 5];
          bSum += copy[rowOffset - 2] + copy[rowOffset + 2] + copy[rowOffset + 6];
        }
        
        const destIdx = (y * w + x) * 4;
        pixels[destIdx] = rSum / 9;
        pixels[destIdx + 1] = gSum / 9;
        pixels[destIdx + 2] = bSum / 9;
      }
    }
    
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < pixels.length; i += 4) {
      let r = pixels[i];
      let g = pixels[i + 1];
      let b = pixels[i + 2];
      
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      gray += brightness;
      gray = factor * (gray - 128) + 128;
      
      let finalVal = gray < threshold ? 0 : 255;
      
      if (invert) {
        finalVal = 255 - finalVal;
      }
      
      pixels[i] = finalVal;
      pixels[i + 1] = finalVal;
      pixels[i + 2] = finalVal;
      pixels[i + 3] = 255;
    }
    
    destCtx.putImageData(imgData, 0, 0);
  },

  /**
   * Detects horizontal and vertical walls from a binarized canvas
   */
  detectWalls: function (binarizedCanvas, options = {}) {
    const minLineLength = options.minLineLength || 40; 
    const lineThicknessGap = options.lineThicknessGap || 15; 
    const snapTolerance = options.snapTolerance || 25; 
    
    const ctx = binarizedCanvas.getContext('2d');
    const w = binarizedCanvas.width;
    const h = binarizedCanvas.height;
    
    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    
    function isBlack(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      const index = (y * w + x) * 4;
      return pixels[index] < 128;
    }
    
    const horizSegments = [];
    const vertSegments = [];
    
    // --- 1. HORIZONTAL SCANNING ---
    for (let y = 0; y < h; y += 4) { 
      let startX = -1;
      for (let x = 0; x < w; x++) {
        if (isBlack(x, y)) {
          if (startX === -1) {
            startX = x;
          }
        } else {
          if (startX !== -1) {
            const length = x - startX;
            if (length >= minLineLength) {
              horizSegments.push({ x1: startX, y1: y, x2: x, y2: y, len: length });
            }
            startX = -1;
          }
        }
      }
      if (startX !== -1) {
        const length = w - startX;
        if (length >= minLineLength) {
          horizSegments.push({ x1: startX, y1: y, x2: w, y2: y, len: length });
        }
      }
    }
    
    // --- 2. VERTICAL SCANNING ---
    for (let x = 0; x < w; x += 4) { 
      let startY = -1;
      for (let y = 0; y < h; y++) {
        if (isBlack(x, y)) {
          if (startY === -1) {
            startY = y;
          }
        } else {
          if (startY !== -1) {
            const length = y - startY;
            if (length >= minLineLength) {
              vertSegments.push({ x1: x, y1: startY, x2: x, y2: y, len: length });
            }
            startY = -1;
          }
        }
      }
      if (startY !== -1) {
        const length = h - startY;
        if (length >= minLineLength) {
          vertSegments.push({ x1: x, y1: startY, x2: x, y2: h, len: length });
        }
      }
    }
    
    const mergedHoriz = [];
    const usedHoriz = new Set();
    
    for (let i = 0; i < horizSegments.length; i++) {
      if (usedHoriz.has(i)) continue;
      
      const s1 = horizSegments[i];
      let cluster = [s1];
      usedHoriz.add(i);
      
      for (let j = i + 1; j < horizSegments.length; j++) {
        if (usedHoriz.has(j)) continue;
        const s2 = horizSegments[j];
        
        const yDist = Math.abs(s1.y1 - s2.y1);
        const horizOverlap = Math.min(s1.x2, s2.x2) - Math.max(s1.x1, s2.x1);
        
        if (yDist <= lineThicknessGap && horizOverlap > -snapTolerance) {
          cluster.push(s2);
          usedHoriz.add(j);
        }
      }
      
      const minX = Math.min(...cluster.map(s => s.x1));
      const maxX = Math.max(...cluster.map(s => s.x2));
      const avgY = cluster.reduce((sum, s) => sum + s.y1, 0) / cluster.length;
      
      mergedHoriz.push({ x1: minX, y1: avgY, x2: maxX, y2: avgY });
    }
    
    const mergedVert = [];
    const usedVert = new Set();
    
    for (let i = 0; i < vertSegments.length; i++) {
      if (usedVert.has(i)) continue;
      
      const s1 = vertSegments[i];
      let cluster = [s1];
      usedVert.add(i);
      
      for (let j = i + 1; j < vertSegments.length; j++) {
        if (usedVert.has(j)) continue;
        const s2 = vertSegments[j];
        
        const xDist = Math.abs(s1.x1 - s2.x1);
        const vertOverlap = Math.min(s1.y2, s2.y2) - Math.max(s1.y1, s2.y1);
        
        if (xDist <= lineThicknessGap && vertOverlap > -snapTolerance) {
          cluster.push(s2);
          usedVert.add(j);
        }
      }
      
      const minY = Math.min(...cluster.map(s => s.y1));
      const maxY = Math.max(...cluster.map(s => s.y2));
      const avgX = cluster.reduce((sum, s) => sum + s.x1, 0) / cluster.length;
      
      mergedVert.push({ x1: avgX, y1: minY, x2: avgX, y2: maxY });
    }
    
    let detectedWalls = [...mergedHoriz, ...mergedVert];
    
    // --- ORTHOGONAL AXIS ALIGNMENT (PRE-WELD) ---
    // Forces near-horizontal and near-vertical segments to be strictly axis-aligned.
    // This enables the subsequent T-junction and corner welding loops to match exact coordinates!
    detectedWalls.forEach(w => {
      const dx = Math.abs(w.x2 - w.x1);
      const dy = Math.abs(w.y2 - w.y1);
      if (dx > dy) {
        const avgY = (w.y1 + w.y2) / 2;
        w.y1 = avgY;
        w.y2 = avgY;
      } else {
        const avgX = (w.x1 + w.x2) / 2;
        w.x1 = avgX;
        w.x2 = avgX;
      }
    });
    
    for (let k = 0; k < 4; k++) { // Increased to 4 iterations for double-pass welding
      for (let i = 0; i < detectedWalls.length; i++) {
        const w1 = detectedWalls[i];
        
        for (let j = 0; j < detectedWalls.length; j++) {
          if (i === j) continue;
          const w2 = detectedWalls[j];
          
          const pointsToSnap = [
            { w: w1, p: '1', x: w1.x1, y: w1.y1 },
            { w: w1, p: '2', x: w1.x2, y: w1.y2 }
          ];
          
          pointsToSnap.forEach(pt => {
            const d11 = Math.hypot(pt.x - w2.x1, pt.y - w2.y1);
            if (d11 < snapTolerance) {
              if (pt.p === '1') { w1.x1 = w2.x1; w1.y1 = w2.y1; }
              else { w1.x2 = w2.x1; w1.y2 = w2.y1; }
              return;
            }
            
            const d12 = Math.hypot(pt.x - w2.x2, pt.y - w2.y2);
            if (d12 < snapTolerance) {
              if (pt.p === '1') { w1.x1 = w2.x2; w1.y1 = w2.y2; }
              else { w1.x2 = w2.x2; w1.y2 = w2.y2; }
              return;
            }
            
            if (w2.x1 === w2.x2) { 
              const isWithinYRange = pt.y >= Math.min(w2.y1, w2.y2) - snapTolerance && pt.y <= Math.max(w2.y1, w2.y2) + snapTolerance;
              const xDist = Math.abs(pt.x - w2.x1);
              if (xDist < snapTolerance && isWithinYRange) {
                if (pt.p === '1') { w1.x1 = w2.x1; }
                else { w1.x2 = w2.x1; }
                
                if (pt.y < Math.min(w2.y1, w2.y2)) {
                  if (w2.y1 < w2.y2) w2.y1 = pt.y; else w2.y2 = pt.y;
                } else if (pt.y > Math.max(w2.y1, w2.y2)) {
                  if (w2.y1 > w2.y2) w2.y1 = pt.y; else w2.y2 = pt.y;
                }
              }
            } else if (w2.y1 === w2.y2) { 
              const isWithinXRange = pt.x >= Math.min(w2.x1, w2.x2) - snapTolerance && pt.x <= Math.max(w2.x1, w2.x2) + snapTolerance;
              const yDist = Math.abs(pt.y - w2.y1);
              if (yDist < snapTolerance && isWithinXRange) {
                if (pt.p === '1') { w1.y1 = w2.y1; }
                else { w1.y2 = w2.y1; }
                
                if (pt.x < Math.min(w2.x1, w2.x2)) {
                  if (w2.x1 < w2.x2) w2.x1 = pt.x; else w2.x2 = pt.x;
                } else if (pt.x > Math.max(w2.x1, w2.x2)) {
                  if (w2.x1 > w2.x2) w2.x1 = pt.x; else w2.x2 = pt.x;
                }
              }
            }
          });
        }
      }
    }
    
    detectedWalls = detectedWalls.filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) > minLineLength / 2);
    
    return detectedWalls;
  },

  /**
   * Detects collinear wall gaps and classifies them as doors, windows, or entrances
   */
  detectWallsAndOpenings: function (binarizedCanvas, options = {}) {
    const detectedWalls = this.detectWalls(binarizedCanvas, options);
    
    const openings = [];
    const refinedWalls = [...detectedWalls];
    const lineThicknessGap = options.lineThicknessGap || 15;
    const snapTolerance = options.snapTolerance || 25;
    
    const ctx = binarizedCanvas.getContext('2d');
    const w = binarizedCanvas.width;
    const h = binarizedCanvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    
    function isBlack(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      const index = (Math.floor(y) * w + Math.floor(x)) * 4;
      return pixels[index] < 128;
    }
    
    const toRemove = new Set();
    const wallsToAdd = [];
    
    // Find pairs of collinear walls with a small gap
    for (let i = 0; i < refinedWalls.length; i++) {
      if (toRemove.has(i)) continue;
      const w1 = refinedWalls[i];
      
      for (let j = 0; j < refinedWalls.length; j++) {
        if (i === j || toRemove.has(j) || toRemove.has(i)) continue;
        const w2 = refinedWalls[j];
        
        // Check if horizontal collinear
        if (w1.y1 === w1.y2 && w2.y1 === w2.y2 && Math.abs(w1.y1 - w2.y1) < 8) {
          const left = w1.x2 < w2.x1 ? w1 : w2;
          const right = w1.x2 < w2.x1 ? w2 : w1;
          const gap = right.x1 - left.x2;
          
          if (gap > 22 && gap < 90) { // Gap between ~0.55m and 2.25m
            const idx1 = refinedWalls.indexOf(left);
            const idx2 = refinedWalls.indexOf(right);
            toRemove.add(idx1);
            toRemove.add(idx2);
            
            const midX = left.x2 + gap / 2;
            const midY = (left.y1 + right.y1) / 2;
            
            let blackCountInside = 0;
            let blackCountOutside = 0;
            
            for (let gx = left.x2 + 2; gx < right.x1 - 2; gx++) {
              for (let gy = midY - 4; gy <= midY + 4; gy++) {
                if (isBlack(gx, gy)) blackCountInside++;
              }
              for (let gy = midY - gap; gy < midY - 4; gy++) {
                if (isBlack(gx, gy)) blackCountOutside++;
              }
              for (let gy = midY + 5; gy <= midY + gap; gy++) {
                if (isBlack(gx, gy)) blackCountOutside++;
              }
            }
            
            // --- NEW: Centerline Black Pixel Ratio ---
            let centerlineBlackX = 0;
            const spanX = (right.x1 - 2) - (left.x2 + 2);
            for (let gx = left.x2 + 2; gx < right.x1 - 2; gx++) {
              let colHasBlack = false;
              for (let gy = midY - 3; gy <= midY + 3; gy++) {
                if (isBlack(gx, gy)) {
                  colHasBlack = true;
                  break;
                }
              }
              if (colHasBlack) centerlineBlackX++;
            }
            const centerlineRatio = spanX > 0 ? centerlineBlackX / spanX : 0;
            
            let type = 'door';
            let style = 'single_door';
            
            if (centerlineRatio > 0.55) {
              // High continuous density along centerline = glass window pane!
              type = 'window';
              style = 'window_std';
            } else {
              // Low centerline density = open doorway or empty entrance
              const totalNearbyPixels = blackCountInside + blackCountOutside;
              if (totalNearbyPixels > 5) {
                type = 'door';
                style = gap > 55 ? 'double_door' : 'single_door';
              } else {
                type = 'entrance';
                style = 'archway';
              }
            }
            
            wallsToAdd.push({
              x1: left.x1,
              y1: midY,
              x2: right.x2,
              y2: midY,
              opening: {
                type,
                style,
                x: midX,
                y: midY,
                width: gap
              }
            });
          }
        }
        
        // Check if vertical collinear
        else if (w1.x1 === w1.x2 && w2.x1 === w2.x2 && Math.abs(w1.x1 - w2.x1) < 8) {
          const top = w1.y2 < w2.y1 ? w1 : w2;
          const bottom = w1.y2 < w2.y1 ? w2 : w1;
          const gap = bottom.y1 - top.y2;
          
          if (gap > 22 && gap < 90) { // Gap between ~0.55m and 2.25m
            const idx1 = refinedWalls.indexOf(top);
            const idx2 = refinedWalls.indexOf(bottom);
            toRemove.add(idx1);
            toRemove.add(idx2);
            
            const midX = (top.x1 + bottom.x1) / 2;
            const midY = top.y2 + gap / 2;
            
            let blackCountInside = 0;
            let blackCountOutside = 0;
            
            for (let gy = top.y2 + 2; gy < bottom.y1 - 2; gy++) {
              for (let gx = midX - 4; gx <= midX + 4; gx++) {
                if (isBlack(gx, gy)) blackCountInside++;
              }
              for (let gx = midX - gap; gx < midX - 4; gx++) {
                if (isBlack(gx, gy)) blackCountOutside++;
              }
              for (let gx = midX + 5; gx <= midX + gap; gx++) {
                if (isBlack(gx, gy)) blackCountOutside++;
              }
            }
            
            // --- NEW: Centerline Black Pixel Ratio (Vertical) ---
            let centerlineBlackY = 0;
            const spanY = (bottom.y1 - 2) - (top.y2 + 2);
            for (let gy = top.y2 + 2; gy < bottom.y1 - 2; gy++) {
              let rowHasBlack = false;
              for (let gx = midX - 3; gx <= midX + 3; gx++) {
                if (isBlack(gx, gy)) {
                  rowHasBlack = true;
                  break;
                }
              }
              if (rowHasBlack) centerlineBlackY++;
            }
            const centerlineRatio = spanY > 0 ? centerlineBlackY / spanY : 0;
            
            let type = 'door';
            let style = 'single_door';
            
            if (centerlineRatio > 0.55) {
              // High continuous vertical density = glass window pane!
              type = 'window';
              style = 'window_std';
            } else {
              const totalNearbyPixels = blackCountInside + blackCountOutside;
              if (totalNearbyPixels > 5) {
                type = 'door';
                style = gap > 55 ? 'double_door' : 'single_door';
              } else {
                type = 'entrance';
                style = 'archway';
              }
            }
            
            wallsToAdd.push({
              x1: midX,
              y1: top.y1,
              x2: midX,
              y2: bottom.y2,
              opening: {
                type,
                style,
                x: midX,
                y: midY,
                width: gap
              }
            });
          }
        }
      }
    }
    
    const finalWalls = refinedWalls.filter((_, idx) => !toRemove.has(idx));
    wallsToAdd.forEach(w => {
      finalWalls.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 });
      if (w.opening) {
        openings.push(w.opening);
      }
    });
    
    return {
      walls: finalWalls,
      openings
    };
  },

  /**
   * Semi-automatic line trace helper
   */
  getSemiAutoTrace: function (binarizedCanvas, p1, p2) {
    const ctx = binarizedCanvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, binarizedCanvas.width, binarizedCanvas.height);
    const pixels = imgData.data;
    
    const steps = 15;
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(p1.x + t * (p2.x - p1.x));
      const y = Math.round(p1.y + t * (p2.y - p1.y));
      
      let bestDx = 0;
      let bestDy = 0;
      let found = false;
      let minD = 999;
      
      for (let dy = -8; dy <= 8; dy++) {
        for (let dx = -8; dx <= 8; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < binarizedCanvas.width && py >= 0 && py < binarizedCanvas.height) {
            const index = (py * binarizedCanvas.width + px) * 4;
            if (pixels[index] < 128) {
              const d = dx*dx + dy*dy;
              if (d < minD) {
                minD = d;
                bestDx = dx;
                bestDy = dy;
                found = true;
              }
            }
          }
        }
      }
      
      if (found) {
        sumX += bestDx;
        sumY += bestDy;
        count++;
      }
    }
    
    if (count > 0) {
      const shiftX = sumX / count;
      const shiftY = sumY / count;
      return {
        x1: p1.x + shiftX,
        y1: p1.y + shiftY,
        x2: p2.x + shiftX,
        y2: p2.y + shiftY
      };
    }
    
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  },

  /**
   * Generates a high-quality hand-drawn simulated "sketch blueprint" on a canvas.
   * Tailored entirely for office plans and office layouts!
   */
  generateSampleSketch: function (canvas, sampleType = 'studio') {
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // warm paper tone
    ctx.fillStyle = "#FDFBF7"; 
    ctx.fillRect(0, 0, 800, 600);
    
    // Grid Lines (graph paper)
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
    }
    for (let y = 0; y < 600; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }
    
    // sketchy line helper
    function drawSketchyLine(x1, y1, x2, y2, thickness = 4) {
      ctx.strokeStyle = "#1E293B"; 
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const steps = Math.max(5, Math.floor(dist / 12));
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        let px = x1 + t * (x2 - x1);
        let py = y1 + t * (y2 - y1);
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;
        
        const shake = (Math.random() - 0.5) * 2.2;
        px += nx * shake;
        py += ny * shake;
        
        ctx.lineTo(px, py);
      }
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // double stroke
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = thickness * 0.7;
      ctx.beginPath();
      ctx.moveTo(x1 + (Math.random() - 0.5) * 2, y1 + (Math.random() - 0.5) * 2);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        let px = x1 + t * (x2 - x1) + (Math.random() - 0.5) * 3;
        let py = y1 + t * (y2 - y1) + (Math.random() - 0.5) * 3;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(x2 + (Math.random() - 0.5) * 2, y2 + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }

    // --- RENDER GEOMETRIES SPECIFIC TO OFFICE PLANS ---
    if (sampleType === 'studio') {
      // 1. Compact Office Studio (boss office, board room, central space)
      drawSketchyLine(100, 80, 700, 80, 5); 
      drawSketchyLine(700, 80, 700, 500, 5); 
      drawSketchyLine(700, 500, 100, 500, 5); 
      drawSketchyLine(100, 500, 100, 80, 5); 
      
      // Board Room partition
      drawSketchyLine(440, 80, 440, 280, 4.2);
      drawSketchyLine(440, 280, 700, 280, 4.2);
      
      // Manager Corner Office divider
      drawSketchyLine(100, 320, 260, 320, 4.2);
      drawSketchyLine(260, 320, 260, 500, 4.2);
      
      // Central Lobby / Desk sketches
      ctx.strokeStyle = "rgba(74, 85, 104, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(570, 180, 40, 0, 2 * Math.PI); ctx.stroke(); // Meeting table
      ctx.strokeRect(310, 380, 60, 40); // Reception desk
      
      // text labels
      ctx.font = "italic bold 13px 'Courier New', monospace";
      ctx.fillStyle = "rgba(30, 41, 59, 0.65)";
      ctx.fillText("BOARD ROOM", 500, 130);
      ctx.fillText("CEO OFFICE", 130, 410);
      ctx.fillText("OPEN OFFICE", 300, 240);
    } 
    else if (sampleType === 'l_shaped') {
      // 2. Large L-Shaped Executive Corporate Suite
      drawSketchyLine(80, 80, 480, 80, 5.5); 
      drawSketchyLine(480, 80, 480, 260, 5.5); 
      drawSketchyLine(480, 260, 720, 260, 5.5); 
      drawSketchyLine(720, 260, 720, 520, 5.5); 
      drawSketchyLine(720, 520, 80, 520, 5.5); 
      drawSketchyLine(80, 520, 80, 80, 5.5); 
      
      // Pantry breakroom area
      drawSketchyLine(250, 80, 250, 240, 4.2);
      drawSketchyLine(80, 240, 250, 240, 4.2);
      
      // Executive cabins (bottom left)
      drawSketchyLine(80, 380, 280, 380, 4.2);
      drawSketchyLine(280, 380, 280, 520, 4.2);
      
      // Server Room compartment (bottom center)
      drawSketchyLine(400, 380, 400, 520, 4.2);
      drawSketchyLine(280, 380, 400, 380, 4.2);
      
      // labels
      ctx.font = "italic bold 13px 'Courier New', monospace";
      ctx.fillStyle = "rgba(30, 41, 59, 0.65)";
      ctx.fillText("BREAKROOM", 110, 150);
      ctx.fillText("EXEC ROOM", 110, 440);
      ctx.fillText("IT SERVER", 300, 440);
      ctx.fillText("HOT DESK ZONE", 510, 360);
    } 
    else if (sampleType === 'clinic') {
      // 3. Open-Plan Creative Tech Agency (massive workstation clusters, phone pods, central lobby)
      drawSketchyLine(80, 80, 720, 80, 5.5);
      drawSketchyLine(720, 80, 720, 520, 5.5);
      drawSketchyLine(720, 520, 80, 520, 5.5);
      drawSketchyLine(80, 520, 80, 80, 5.5);
      
      // Restrooms & Server core partition block
      drawSketchyLine(80, 300, 280, 300, 4.5);
      drawSketchyLine(280, 300, 280, 520, 4.5);
      drawSketchyLine(280, 410, 80, 410, 4.0); // splits toilets
      
      // Two Quiet Phone booth zones (top right)
      drawSketchyLine(540, 80, 540, 180, 4.2);
      drawSketchyLine(540, 180, 720, 180, 4.2);
      drawSketchyLine(630, 80, 630, 180, 4.0); // splits pods
      
      // Center lobby lounge separator divider
      drawSketchyLine(360, 220, 540, 220, 3.5);
      
      // Labels
      ctx.font = "italic bold 13px 'Courier New', monospace";
      ctx.fillStyle = "rgba(30, 41, 59, 0.65)";
      ctx.fillText("PHONE BOOTH 1", 555, 115);
      ctx.fillText("PHONE BOOTH 2", 640, 115);
      ctx.fillText("MALE Rest", 110, 350);
      ctx.fillText("FEMALE Rest", 110, 460);
      ctx.fillText("MAIN OPEN BAY (HOTDESKS)", 320, 140);
      ctx.fillText("LOUNGE HUB", 380, 280);
    }
    else if (sampleType === 'blueprint_mvp') {
      // 4. Exact replica sketch of the User's Blueprint floor plan (2nd image)
      
      // Outer perimeter (concrete) core boundary
      drawSketchyLine(50, 50, 750, 50, 5.5);
      drawSketchyLine(750, 50, 750, 550, 5.5);
      drawSketchyLine(750, 550, 50, 550, 5.5);
      drawSketchyLine(50, 550, 50, 50, 5.5);
      
      // Left Top Pantry (top-left)
      drawSketchyLine(120, 50, 120, 200, 4.2);
      drawSketchyLine(50, 200, 120, 200, 4.2);
      
      // Corner Office (top-left next to pantry)
      drawSketchyLine(240, 50, 240, 200, 4.2);
      drawSketchyLine(120, 200, 240, 200, 4.2);
      
      // Office Cabin 2 (top middle-left)
      drawSketchyLine(320, 50, 320, 200, 4.2);
      drawSketchyLine(240, 200, 320, 200, 4.2);

      // Washroom U (top middle unisex)
      drawSketchyLine(320, 150, 380, 150, 4.2);
      drawSketchyLine(380, 50, 380, 150, 4.2);

      // Large Meeting Room (top middle-right)
      drawSketchyLine(480, 50, 480, 200, 4.2);
      drawSketchyLine(380, 200, 480, 200, 4.2);

      // Washroom M & F cabins (top-right corner)
      drawSketchyLine(650, 50, 650, 200, 4.2);
      drawSketchyLine(650, 200, 750, 200, 4.2);
      drawSketchyLine(700, 50, 700, 200, 4.0); // splits M and F

      // Middle-Right Cabin 1
      drawSketchyLine(650, 200, 650, 310, 4.2);
      drawSketchyLine(650, 310, 750, 310, 4.2);

      // Lower Middle-Right Cabin 2
      drawSketchyLine(650, 310, 650, 430, 4.2);
      drawSketchyLine(650, 430, 750, 430, 4.2);

      // Bottom-Right Corner Cabin 3
      drawSketchyLine(620, 430, 620, 550, 4.2);
      drawSketchyLine(620, 430, 750, 430, 4.2);

      // Bottom Cabin 2 (bottom middle-right)
      drawSketchyLine(460, 430, 460, 550, 4.2);
      drawSketchyLine(460, 430, 620, 430, 4.2);

      // Bottom Cabin 1 (bottom middle-left)
      drawSketchyLine(300, 430, 300, 550, 4.2);
      drawSketchyLine(300, 430, 460, 430, 4.2);

      // Stairs Core outer walls (bottom-left)
      drawSketchyLine(50, 430, 300, 430, 4.2);
      drawSketchyLine(300, 430, 300, 550, 4.2);

      // Left Cabin 1 (mid-left)
      drawSketchyLine(50, 310, 240, 310, 4.2);
      drawSketchyLine(240, 200, 240, 310, 4.2);

      // Left Cabin 2 (lower mid-left)
      drawSketchyLine(50, 430, 240, 430, 4.2);
      drawSketchyLine(240, 310, 240, 430, 4.2);
      drawSketchyLine(120, 310, 120, 430, 4.0); // sub divider

      // --- Staircase details (A-FURN) sketchy representation ---
      drawSketchyLine(70, 490, 210, 490, 2.5); // stairs center
      for (let i = 0; i <= 9; i++) {
        const sx = 70 + i * 15;
        drawSketchyLine(sx, 445, sx, 535, 1.2);
      }

      // Sketchy Text labels
      ctx.font = "italic bold 13px 'Courier New', monospace";
      ctx.fillStyle = "rgba(30, 41, 59, 0.65)";
      ctx.fillText("PANTRY", 62, 120);
      ctx.fillText("washroom U", 290, 100);
      ctx.fillText("Washroom M", 655, 120);
      ctx.fillText("Washroom F", 702, 120);
      ctx.fillText("STAIRS CORE", 100, 470);
      ctx.fillText("CREATIVE HUB", 380, 310);
    }
  }
};

window.CVProcessor = CVProcessor;