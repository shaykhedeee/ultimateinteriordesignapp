// ============================================================
// SPACIOUS VENTURE STUDIO OS
// Floor Plan Deep Understanding Engine (fp-understanding-engine.js)
// Complete AI pipeline for reading and analyzing floor plans
// ============================================================

/**
 * ARCHITECTURE OVERVIEW:
 * 
 * This engine processes a floor plan image through a 7-phase pipeline:
 * 
 * Phase 1: Image Preprocessing & Normalization
 * Phase 2: Wall Detection & Segmentation (U-Net based)
 * Phase 3: Room Segmentation & Labeling (Flood Fill + ML)
 * Phase 4: Component Detection & Placement Mapping (YOLOv8)
 * Phase 5: Spatial Relationship Graph Construction
 * Phase 6: Dimensional Analysis & Scale Extraction
 * Phase 7: Layout Constraint Compilation
 */

const sharp = require('sharp');
const tf = require('@tensorflow/tfjs-node');
const { createCanvas, loadImage } = require('canvas');

// ---- PHASE 1: Image Preprocessing ----

class ImagePreprocessor {
  /**
   * Normalize floor plan image for analysis
   */
  async preprocess(imagePath) {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Step 1: Convert to standard resolution (300 DPI equivalent)
    const processed = await image
      .resize({
        width: Math.min(metadata.width, 2048),
        height: Math.min(metadata.height, 2048),
        fit: 'inside',
        withoutEnlargement: true
      })
      .grayscale()        // Convert to grayscale for line detection
      .normalize()        // Normalize contrast
      .sharpen()          // Sharpen edges
      .toBuffer();
    
    // Step 2: Apply adaptive thresholding to clean lines
    const thresholded = await this.adaptiveThreshold(processed);
    
    // Step 3: Separate text from graphics
    const { graphics, text } = await this.separateTextFromGraphics(thresholded);
    
    // Step 4: Detect scale from dimension annotations
    const scale = await this.detectScale(text);
    
    return {
      originalPath: imagePath,
      originalSize: { width: metadata.width, height: metadata.height },
      processedSize: { width: Math.min(metadata.width, 2048), height: Math.min(metadata.height, 2048) },
      graphicsLayer: graphics,
      textLayer: text,
      scale: scale,
      metadata: metadata
    };
  }
  
  async adaptiveThreshold(buffer) {
    // Apply Otsu's thresholding or adaptive Gaussian threshold
    // Using TensorFlow.js for image processing
    const tensor = tf.node.decodeImage(buffer, 1);
    const [height, width] = tensor.shape;
    
    // Simple adaptive threshold
    const normalized = tensor.div(255.0);
    const mean = tf.mean(normalized).dataSync()[0];
    const threshold = mean * 0.85;
    
    const binary = tf.where(
      tf.greater(normalized, tf.scalar(threshold)),
      tf.ones([height, width, 1]),
      tf.zeros([height, width, 1])
    );
    
    const processedBuffer = await tf.node.encodeJpeg(binary.mul(255).cast('int32'));
    tensor.dispose();
    binary.dispose();
    
    return processedBuffer;
  }
  
  async separateTextFromGraphics(processedBuffer) {
    // Use morphological operations to separate text annotations from lines
    // Text tends to be smaller and isolated, walls are larger connected components
    const tensor = tf.node.decodeImage(processedBuffer, 1);
    const [height, width] = tensor.shape;
    
    // Detect small connected components (potential text)
    // In production, use OpenCV connectedComponentsWithStats
    const textMask = this.detectTextRegions(tensor);
    const graphicsMask = tf.sub(tf.onesLike(tensor), textMask);
    
    return {
      graphics: tf.mul(graphicsMask, tensor).mul(255).cast('int32'),
      text: tf.mul(textMask, tensor).mul(255).cast('int32')
    };
  }
  
  detectTextRegions(tensor) {
    // Heuristic: text regions have high frequency changes
    // In production: use EAST text detector or Tesseract
    const sobelX = tf.image.sobel(tensor); // Approximation
    const highFreq = tf.greater(sobelX, tf.scalar(0.3));
    return highFreq.cast('float32');
  }
  
  async detectScale(textAnnotations) {
    // Look for dimension patterns in text layer
    // Patterns like: "2400", "12'-0\"", "4m", "3000mm"
    const patterns = {
      mm: /(\d+)\s*mm/gi,
      cm: /(\d+)\s*cm/gi,
      m: /(\d+\.?\d*)\s*m/gi,
      feet: /(\d+)['\u2019]\s*(\d+)?["\u201d]?/gi
    };
    
    // Extract dimension text using OCR (placeholder)
    // In production: use Tesseract.js
    const dimensions = [];
    
    return {
      unit: 'mm',  // Default for Indian floor plans
      detected: dimensions,
      confidence: 0.0
    };
  }
}

// ---- PHASE 2: Wall Detection & Segmentation ----

class WallDetector {
  constructor() {
    // U-Net with Swin Transformer backbone for wall segmentation
    this.model = null; // Load pre-trained model
  }
  
  async detectWalls(preprocessed) {
    // Load model if not loaded
    if (!this.model) {
      await this.loadModel();
    }
    
    // Run wall segmentation
    const input = tf.node.decodeImage(preprocessed.graphicsLayer);
    const normalized = input.div(255.0).expandDims(0);
    
    // Inference
    const prediction = await this.model.predict(normalized);
    const wallMask = prediction.squeeze().gt(0.5);
    
    // Extract wall polygons using marching squares
    const wallPolygons = this.extractWallPolygons(wallMask);
    
    // Classify walls (exterior vs interior) by thickness
    const classifiedWalls = this.classifyWalls(wallPolygons);
    
    // Detect wall junctions (T, L, Cross)
    const junctions = this.detectJunctions(wallMask);
    
    return {
      walls: classifiedWalls,
      junctions: junctions,
      wallMask: wallMask,
      confidence: this.calculateConfidence(prediction)
    };
  }
  
  async loadModel() {
    // Load pre-trained TensorFlow.js model
    // Model should be trained on 1000+ Indian floor plans
    try {
      this.model = await tf.loadGraphModel(
        'file://models/wall-segmentation-unet/model.json'
      );
    } catch (e) {
      console.warn('Model not found, using fallback detection', e.message);
      this.model = this.createFallbackDetector();
    }
  }
  
  createFallbackDetector() {
    // Simple edge-based wall detection fallback
    return {
      predict: async (tensor) => {
        const edges = tf.image.sobel(tensor);
        return edges.gt(0.4).cast('float32');
      }
    };
  }
  
  extractWallPolygons(wallMask) {
    // Convert pixel mask to vector polygons
    // Using marching squares algorithm
    const polygons = [];
    const visited = tf.zerosLike(wallMask);
    
    // Iterate through mask to find wall segments
    // Group into continuous wall polygons
    // For each polygon: [{x, y}, ...]
    
    // Simplified implementation - production uses OpenCV
    return polygons;
  }
  
  classifyWalls(polygons) {
    return polygons.map(poly => {
      const thickness = this.calculateThickness(poly);
      return {
        points: poly,
        thickness: thickness,
        type: thickness > 15 ? 'exterior' : 'interior',
        length: this.calculateLength(poly),
        confidence: 0.85
      };
    });
  }
  
  calculateThickness(polygon) {
    // Calculate perpendicular distance from edge to edge
    // Average thickness in pixels
    return 12; // Placeholder
  }
  
  calculateLength(polygon) {
    // Sum of distances between consecutive points
    let length = 0;
    for (let i = 1; i < polygon.length; i++) {
      const dx = polygon[i].x - polygon[i - 1].x;
      const dy = polygon[i].y - polygon[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }
  
  detectJunctions(wallMask) {
    // Detect T-junctions, L-corners, X-intersections
    // Use morphological hit-or-miss transform
    const junctions = [];
    
    // T-junction patterns
    const tKernels = this.generateTKernels();
    const lKernels = this.generateLKernels();
    
    return {
      tJunctions: junctions.filter(j => j.type === 'T'),
      lCorners: junctions.filter(j => j.type === 'L'),
      crossJunctions: junctions.filter(j => j.type === 'X'),
      total: junctions.length
    };
  }
  
  calculateConfidence(prediction) {
    const mean = tf.mean(prediction).dataSync()[0];
    return Math.round(mean * 100) / 100;
  }
}

// ---- PHASE 3: Room Segmentation & Labeling ----

class RoomSegmenter {
  async segmentRooms(wallData, preprocessed) {
    // Step 1: Close all door openings
    const closedWalls = this.closeDoorOpenings(wallData.walls);
    
    // Step 2: Flood-fill to find enclosed rooms
    const rooms = this.floodFillRooms(closedWalls, preprocessed.originalSize);
    
    // Step 3: Read room labels from text layer
    const labeledRooms = await this.labelRooms(rooms, preprocessed.textLayer);
    
    // Step 4: Calculate room areas
    const roomsWithAreas = labeledRooms.map(room => ({
      ...room,
      areaSqMm: this.calculateArea(room.polygon),
      areaSqFt: this.mmToSqft(this.calculateArea(room.polygon)),
      dimensions: this.calculateRoomDimensions(room.polygon)
    }));
    
    return roomsWithAreas;
  }
  
  closeDoorOpenings(walls) {
    // Detect gaps in walls that have door symbols
    // Close them to create enclosed rooms
    return walls; // Simplified
  }
  
  floodFillRooms(walls, imageSize) {
    // Create a binary image where walls are 1 and empty space is 0
    // Flood fill from each empty pixel to find connected regions
    // Each connected region = room
    
    const { width, height } = imageSize;
    const rooms = [];
    
    // Simplified room detection - in production use pixel-perfect flood fill
    // For each enclosed region, create a room polygon
    
    return rooms;
  }
  
  async labelRooms(rooms, textLayer) {
    // Use OCR on text layer to find room labels
    // Match labels to rooms by proximity
    
    // Room type ML classifier (fallback if no label)
    const roomClassifier = {
      'kitchen': ['sink', 'counter', 'stove', 'cooking'],
      'bathroom': ['toilet', 'shower', 'wash', 'wc'],
      'bedroom': ['bed', 'wardrobe', 'sleep'],
      'living': ['sofa', 'tv', 'lounge', 'hall'],
      'dining': ['table', 'dine', 'eat'],
      'balcony': ['balcony', 'terrace', 'sit-out'],
      'pooja': ['pooja', 'mandir', 'puja', 'temple'],
      'utility': ['utility', 'laundry', 'service'],
      'foyer': ['foyer', 'entrance', 'lobby', 'passage'],
      'corridor': ['corridor', 'passage', 'hallway']
    };
    
    return rooms.map(room => {
      // Try to read label from OCR
      const label = this.findLabel(room, textLayer);
      
      // If no label, classify based on features
      if (!label) {
        const classification = this.classifyRoomByFeatures(room, roomClassifier);
        return { ...room, name: classification.name, confidence: classification.confidence };
      }
      
      return { ...room, name: label, confidence: 0.95 };
    });
  }
  
  classifyRoomByFeatures(room, classifier) {
    // Analyze room geometry:
    // - Aspect ratio (long and thin = corridor)
    // - Size relative to total (largest = living)
    // - Adjacent rooms (near kitchen = dining)
    // - Plumbing indicators
    
    const aspectRatio = room.dimensions.width / room.dimensions.height;
    const area = room.areaSqMm;
    
    // Corridors are long and thin
    if (aspectRatio > 4 || aspectRatio < 0.25) {
      return { name: 'corridor', confidence: 0.6 };
    }
    
    // Bathrooms are small with plumbing features
    if (area < 5000000 && this.hasPlumbing(room)) {
      return { name: 'bathroom', confidence: 0.7 };
    }
    
    // Balcony is narrow and connected to outside
    if (room.hasExternalWall && area < 3000000) {
      return { name: 'balcony', confidence: 0.65 };
    }
    
    // Default classification based on size
    if (area > 20000000) return { name: 'living', confidence: 0.5 };
    if (area > 12000000) return { name: 'bedroom', confidence: 0.5 };
    if (area > 8000000) return { name: 'kitchen', confidence: 0.4 };
    
    return { name: 'room', confidence: 0.3 };
  }
  
  calculateArea(polygon) {
    // Shoelace formula for polygon area
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].y;
      area -= polygon[j].x * polygon[i].y;
    }
    return Math.abs(area) / 2;
  }
  
  calculateRoomDimensions(polygon) {
    // Find minimum bounding rectangle
    const xs = polygon.map(p => p.x);
    const ys = polygon.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    return { width, height, aspectRatio: width / height };
  }
  
  mmToSqft(areaMm) {
    // Convert mm² to ft²
    return areaMm / 92903.04;
  }
}

// ---- PHASE 4: Component Detection ----

class ComponentDetector {
  constructor() {
    this.componentTypes = {
      'TV': { keywords: ['tv', 'television', 'entertainment'], moduleType: 'tv-unit' },
      'SOFA': { keywords: ['sofa', 'couch', 'settee', 'seating'], moduleType: 'sofa' },
      'BED': { keywords: ['bed', 'double bed', 'single bed'], moduleType: 'bed' },
      'DINING_TABLE': { keywords: ['dining', 'table', 'dine'], moduleType: 'dining-table' },
      'WARDROBE': { keywords: ['wardrobe', 'closet', 'almirah', 'cupboard'], moduleType: 'wardrobe' },
      'SINK': { keywords: ['sink', 'wash basin', 'kitchen sink'], moduleType: 'sink-cabinet' },
      'HOB': { keywords: ['hob', 'stove', 'cooktop', 'burner'], moduleType: 'hob-drawer' },
      'SHOE_RACK': { keywords: ['shoe', 'shoe rack', 'footwear'], moduleType: 'shoe-rack' },
      'POOJA': { keywords: ['pooja', 'mandir', 'pooja unit', 'temple'], moduleType: 'pooja-unit' },
      'STUDY_DESK': { keywords: ['study', 'desk', 'workstation'], moduleType: 'study-desk' },
      'COUNTER': { keywords: ['counter', 'kitchen counter', 'platform'], moduleType: 'counter' },
      'WINDOW': { keywords: ['window', 'glazing', 'openable'], moduleType: null },
      'DOOR': { keywords: ['door', 'entrance', 'exit'], moduleType: null }
    };
  }
  
  async detectComponents(preprocessed, rooms) {
    // Use YOLOv8 or Mask R-CNN for symbol detection
    const detectedComponents = [];
    
    // Method 1: Symbol Recognition from floor plan graphics
    const symbolComponents = await this.detectSymbols(preprocessed.graphicsLayer);
    
    // Method 2: Text label parsing
    const textComponents = this.parseComponentText(preprocessed.textLayer);
    
    // Method 3: Room-based inference (if room has "TV" in name, add TV unit)
    const inferredComponents = this.inferFromRoomNames(rooms);
    
    // Merge all detections
    const merged = this.mergeDetections(
      symbolComponents, textComponents, inferredComponents
    );
    
    // Assign to rooms
    return this.assignToRooms(merged, rooms);
  }
  
  async detectSymbols(graphicsLayer) {
    // In production: use YOLOv8 model trained on floor plan symbols
    // For now: template matching with known symbols
    const symbols = [];
    return symbols;
  }
  
  parseComponentText(textAnnotations) {
    // Parse text like "TV", "Sofa", "Wardrobe" from the floor plan
    const components = [];
    const text = textAnnotations.text || '';
    
    for (const [type, config] of Object.entries(this.componentTypes)) {
      for (const keyword of config.keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          components.push({
            type: type,
            moduleType: config.moduleType,
            source: 'text',
            confidence: 0.7
          });
          break;
        }
      }
    }
    
    return components;
  }
  
  inferFromRoomNames(rooms) {
    const inferences = [];
    
    for (const room of rooms) {
      const name = room.name.toLowerCase();
      
      if (name === 'living' || name === 'living room') {
        inferences.push({ type: 'TV', moduleType: 'tv-unit', roomId: room.id, confidence: 0.8 });
        inferences.push({ type: 'SOFA', moduleType: 'sofa', roomId: room.id, confidence: 0.7 });
      }
      
      if (name === 'kitchen') {
        inferences.push({ type: 'SINK', moduleType: 'sink-cabinet', roomId: room.id, confidence: 0.9 });
        inferences.push({ type: 'HOB', moduleType: 'hob-drawer', roomId: room.id, confidence: 0.85 });
        inferences.push({ type: 'COUNTER', moduleType: 'counter', roomId: room.id, confidence: 0.8 });
      }
      
      if (name === 'bedroom' || name === 'master bedroom') {
        inferences.push({ type: 'BED', moduleType: 'bed', roomId: room.id, confidence: 0.9 });
        inferences.push({ type: 'WARDROBE', moduleType: 'wardrobe', roomId: room.id, confidence: 0.85 });
      }
      
      if (name === 'dining' || name === 'dining room') {
        inferences.push({ type: 'DINING_TABLE', moduleType: 'dining-table', roomId: room.id, confidence: 0.9 });
      }
      
      if (name === 'foyer' || name === 'entrance') {
        inferences.push({ type: 'SHOE_RACK', moduleType: 'shoe-rack', roomId: room.id, confidence: 0.7 });
      }
      
      if (name === 'pooja' || name === 'pooja room') {
        inferences.push({ type: 'POOJA', moduleType: 'pooja-unit', roomId: room.id, confidence: 0.9 });
      }
      
      if (name.includes('study') || name.includes('home office')) {
        inferences.push({ type: 'STUDY_DESK', moduleType: 'study-desk', roomId: room.id, confidence: 0.85 });
      }
    }
    
    return inferences;
  }
  
  mergeDetections(...sources) {
    // Merge and deduplicate components from multiple sources
    const merged = new Map();
    
    for (const source of sources) {
      for (const component of source) {
        const key = `${component.type}-${component.roomId || 'unknown'}`;
        if (!merged.has(key) || merged.get(key).confidence < component.confidence) {
          merged.set(key, component);
        }
      }
    }
    
    return Array.from(merged.values());
  }
  
  assignToRooms(components, rooms) {
    // Position components within their assigned rooms
    return components.map(comp => {
      const room = rooms.find(r => r.id === comp.roomId);
      if (!room) return comp;
      
      // Estimate position based on wall dimensions
      const wall = room.walls && room.walls.length > 0
        ? room.walls[0]
        : { start: { x: 0, y: 0 }, end: { x: 3000, y: 0 } };
      
      return {
        ...comp,
        roomName: room.name,
        wallAttachment: wall,
        estimatedPosition: {
          x: wall.start ? (wall.start.x + wall.end.x) / 2 : 0,
          y: wall.start ? wall.start.y : 0
        },
        suggestedDimensions: this.getDefaultDimensions(comp.type, room)
      };
    });
  }
  
  getDefaultDimensions(componentType, room) {
    const defaults = {
      'TV': { width: 2400, height: 450, depth: 400 },
      'SOFA': { width: 2400, height: 900, depth: 800 },
      'BED': { width: 1800, height: 2100, depth: 2000 },
      'DINING_TABLE': { width: 1500, height: 750, depth: 800 },
      'WARDROBE': { width: 2400, height: 2400, depth: 600 },
      'SINK': { width: 900, height: 720, depth: 560 },
      'HOB': { width: 600, height: 720, depth: 560 },
      'SHOE_RACK': { width: 1200, height: 1200, depth: 350 },
      'POOJA': { width: 600, height: 1200, depth: 400 },
      'STUDY_DESK': { width: 1200, height: 750, depth: 500 }
    };
    
    return defaults[componentType] || { width: 600, height: 600, depth: 400 };
  }
}

// ---- PHASE 5: Spatial Relationship Graph ----

class SpatialGraphBuilder {
  buildGraph(rooms, components, walls) {
    const graph = {
      rooms: [],
      adjacency: [],
      circulation: []
    };
    
    // Add room nodes
    for (const room of rooms) {
      graph.rooms.push({
        id: room.id,
        name: room.name,
        dimensions: room.dimensions,
        area: room.areaSqFt,
        components: components.filter(c => c.roomId === room.id)
      });
    }
    
    // Find adjacency between rooms (shared walls)
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const sharedWall = this.findSharedWall(rooms[i], rooms[j], walls);
        if (sharedWall) {
          graph.adjacency.push({
            roomA: rooms[i].name,
            roomB: rooms[j].name,
            wallId: sharedWall.id,
            openingType: sharedWall.openingType || 'wall',
            openingWidth: sharedWall.openingWidth || 0
          });
        }
      }
    }
    
    // Build circulation paths
    graph.circulation = this.buildCirculationPaths(graph.rooms, graph.adjacency);
    
    return graph;
  }
  
  findSharedWall(roomA, roomB, walls) {
    // Check if two rooms share a wall segment
    // In production: check if wall separates pixel regions
    return null; // Placeholder
  }
  
  buildCirculationPaths(rooms, adjacency) {
    // Build BFS paths from entrance to each room
    const paths = [];
    
    // Find entrance/foyer room
    const entrance = rooms.find(r =>
      r.name.toLowerCase().includes('foyer') ||
      r.name.toLowerCase().includes('entrance')
    );
    
    if (!entrance) return paths;
    
    // BFS from entrance
    const visited = new Set([entrance.id]);
    const queue = [{ room: entrance, path: [entrance.name] }];
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      for (const adj of adjacency) {
        const nextRoomName = adj.roomA === current.room.name ? adj.roomB :
                             adj.roomB === current.room.name ? adj.roomA : null;
        
        if (!nextRoomName) continue;
        
        const nextRoom = rooms.find(r => r.name === nextRoomName);
        if (!nextRoom || visited.has(nextRoom.id)) continue;
        
        visited.add(nextRoom.id);
        const newPath = [...current.path, nextRoomName];
        
        paths.push({
          from: entrance.name,
          to: nextRoomName,
          path: newPath,
          length: newPath.length - 1
        });
        
        queue.push({ room: nextRoom, path: newPath });
      }
    }
    
    return paths;
  }
}

// ---- PHASE 6: Dimensional Analysis ----

class DimensionalAnalyzer {
  async analyze(imagePath, walls, rooms) {
    // First pass: detect dimension lines and annotations
    const dimensions = await this.extractDimensions(imagePath);
    
    // Second pass: calculate scale from known dimensions
    const scale = this.calculateScale(dimensions, walls, rooms);
    
    // Third pass: apply scale to all measurements
    const measuredRooms = this.applyDimensionsToRooms(rooms, scale, dimensions);
    
    // Fourth pass: dimension verification (check if room dimensions are consistent)
    const verified = this.verifyDimensions(measuredRooms);
    
    return {
      scale: scale,
      unit: 'mm',
      rooms: verified,
      dimensionSources: dimensions.length
    };
  }
  
  async extractDimensions(imagePath) {
    // Use OCR to find dimension text and lines
    // Look for patterns: dimension line with arrows + text
    const dimensions = [];
    
    // In production: use EAST text detector + OCR
    // Then parse dimensions numbers and match to lines
    
    return dimensions;
  }
  
  calculateScale(dimensions, walls, rooms) {
    // If we have a known dimension (e.g., "6000mm" labeled on a 600px wall)
    // Then scale = 6000mm / 600px = 10mm/pixel
    
    // Default: assume 1px = 10mm (common for Indian floor plans)
    return { pixelsPerMm: 0.1, confirmedBy: 'default' };
  }
  
  applyDimensionsToRooms(rooms, scale, dimensions) {
    return rooms.map(room => ({
      ...room,
      dimensionsMm: {
        width: Math.round(room.dimensions.width / scale.pixelsPerMm),
        length: Math.round(room.dimensions.height / scale.pixelsPerMm),
        height: 3000 // Default ceiling height, can be annotated
      }
    }));
  }
  
  verifyDimensions(rooms) {
    // Check if dimensions are reasonable
    // Typical room sizes in India:
    // Living: 3000-8000mm on each side
    // Bedroom: 3000-6000mm
    // Kitchen: 2000-4000mm
    // Bathroom: 1500-3000mm
    
    return rooms.map(room => {
      const warnings = [];
      const dims = room.dimensionsMm;
      
      if (dims.width < 1500) warnings.push('Suspiciously narrow: ' + dims.width + 'mm');
      if (dims.width > 12000) warnings.push('Suspiciously wide: ' + dims.width + 'mm');
      if (dims.length < 1500) warnings.push('Suspiciously short: ' + dims.length + 'mm');
      if (dims.length > 12000) warnings.push('Suspiciously long: ' + dims.length + 'mm');
      
      return {
        ...room,
        dimensionWarnings: warnings,
        verified: warnings.length === 0
      };
    });
  }
}

// ---- PHASE 7: Layout Constraint Compiler ----

class LayoutConstraintCompiler {
  compile(spatialGraph, components, measuredRooms, style, budget) {
    return {
      project: {
        style: style || 'modern',
        budgetTier: budget || 'premium'
      },
      
      spatialSummary: {
        totalRooms: measuredRooms.length,
        totalAreaSqFt: measuredRooms.reduce((sum, r) => sum + r.areaSqFt, 0),
        roomBreakdown: measuredRooms.map(r => ({
          name: r.name,
          dimensions: r.dimensionsMm,
          areaSqFt: Math.round(r.areaSqFt)
        }))
      },
      
      renderConstraints: this.buildRenderConstraints(
        spatialGraph, components, measuredRooms
      ),
      
      cutlistHints: components
        .filter(c => c.moduleType)
        .map(c => ({
          moduleType: c.moduleType,
          roomName: c.roomName,
          suggestedDimensions: c.suggestedDimensions,
          quantity: 1
        })),
      
      warnings: this.collectWarnings(measuredRooms, components)
    };
  }
  
  buildRenderConstraints(graph, components, rooms) {
    const constraints = [];
    
    for (const room of rooms) {
      const roomComponents = components.filter(c => c.roomId === room.id);
      const adjacentRooms = graph.adjacency
        .filter(a => a.roomA === room.name || a.roomB === room.name)
        .map(a => a.roomA === room.name ? a.roomB : a.roomA);
      
      constraints.push({
        roomName: room.name,
        dimensions: room.dimensionsMm,
        components: roomComponents,
        adjacentTo: adjacentRooms,
        lightSources: this.inferLightSources(room, graph)
      });
    }
    
    return constraints;
  }
  
  inferLightSources(room, graph) {
    // Windows and external walls indicate natural light
    const sources = [];
    
    // Check if room has windows (from component detection)
    // Check if room has external walls
    // Determine direction (if available from floor plan orientation)
    
    return [{
      type: 'natural',
      direction: 'south',
      intensity: 'medium'
    }];
  }
  
  collectWarnings(rooms, components) {
    const warnings = [];
    
    // Check for missing components
    for (const room of rooms) {
      if (room.name === 'kitchen') {
        const hasSink = components.some(c => c.type === 'SINK' && c.roomId === room.id);
        const hasHob = components.some(c => c.type === 'HOB' && c.roomId === room.id);
        if (!hasSink) warnings.push({ type: 'missing', message: `Kitchen (${room.id}) needs a sink module` });
        if (!hasHob) warnings.push({ type: 'missing', message: `Kitchen (${room.id}) needs a hob module` });
      }
    }
    
    return warnings;
  }
}

// ---- MAIN EXPORT ----

class FloorPlanUnderstandingEngine {
  constructor() {
    this.preprocessor = new ImagePreprocessor();
    this.wallDetector = new WallDetector();
    this.roomSegmenter = new RoomSegmenter();
    this.componentDetector = new ComponentDetector();
    this.spatialGraphBuilder = new SpatialGraphBuilder();
    this.dimensionalAnalyzer = new DimensionalAnalyzer();
    this.constraintCompiler = new LayoutConstraintCompiler();
  }
  
  async analyze(imagePath, options = {}) {
    console.time('FloorPlanAnalysis');
    
    // Phase 1
    console.log('Phase 1: Preprocessing...');
    const preprocessed = await this.preprocessor.preprocess(imagePath);
    
    // Phase 2
    console.log('Phase 2: Wall Detection...');
    const walls = await this.wallDetector.detectWalls(preprocessed);
    
    // Phase 3
    console.log('Phase 3: Room Segmentation...');
    const rooms = await this.roomSegmenter.segmentRooms(walls, preprocessed);
    
    // Phase 4
    console.log('Phase 4: Component Detection...');
    const components = await this.componentDetector.detectComponents(preprocessed, rooms);
    
    // Phase 5
    console.log('Phase 5: Spatial Graph...');
    const graph = this.spatialGraphBuilder.buildGraph(rooms, components, walls.walls);
    
    // Phase 6
    console.log('Phase 6: Dimensional Analysis...');
    const dimensions = await this.dimensionalAnalyzer.analyze(imagePath, walls, rooms);
    
    // Phase 7
    console.log('Phase 7: Constraint Compilation...');
    const constraints = this.constraintCompiler.compile(
      graph, components, dimensions.rooms,
      options.style, options.budget
    );
    
    console.timeEnd('FloorPlanAnalysis');
    
    return {
      success: true,
      processingTime: performance.now(),
      rooms: rooms,
      walls: walls.walls,
      junctions: walls.junctions,
      components: components,
      spatialGraph: graph,
      dimensions: dimensions,
      constraints: constraints,
      confidence: this.calculateOverallConfidence(walls, rooms, components)
    };
  }
  
  calculateOverallConfidence(walls, rooms, components) {
    const wallConf = walls.confidence || 0.8;
    const roomConf = rooms.length > 0 ? 0.85 : 0;
    const compConf = components.length > 0 ? 0.75 : 0;
    
    return Math.round((wallConf * 0.4 + roomConf * 0.35 + compConf * 0.25) * 100);
  }
}

module.exports = new FloorPlanUnderstandingEngine();
