import db from '../database/database.js';
import { nanoid } from 'nanoid';

class PlanIntelligenceCore {
  /**
   * 1. Client Intake Normalizer
   * Converts user brief inputs into structured design constraints.
   */
  normalizeIntake(briefData) {
    const defaultBrief = briefData || {};
    const rooms = defaultBrief.rooms || [];
    
    // Normalize budget band
    const budgetBand = defaultBrief.budgetBand || 'standard';
    let targetBudget = 500000;
    let maxBudget = 750000;
    if (budgetBand === 'economy') {
      targetBudget = 300000;
      maxBudget = 450000;
    } else if (budgetBand === 'premium') {
      targetBudget = 1000000;
      maxBudget = 1500000;
    } else if (budgetBand === 'luxury') {
      targetBudget = 2000000;
      maxBudget = 3500000;
    }

    const normalized = {
      budget: {
        band: budgetBand,
        targetBudget,
        maxBudget,
        currency: 'INR'
      },
      rooms: rooms.map(r => ({
        id: r.id || 'room_' + nanoid(4),
        type: r.type || 'bedroom',
        name: r.name || 'Room Name',
        priority: r.priority || 'must_have'
      })),
      style: {
        preferredStyles: defaultBrief.stylePreferences?.styles || ['modern'],
        colors: {
          liked: defaultBrief.stylePreferences?.likedColors || [],
          disliked: defaultBrief.stylePreferences?.dislikedColors || []
        },
        materials: {
          liked: defaultBrief.stylePreferences?.likedMaterials || [],
          disliked: defaultBrief.stylePreferences?.dislikedMaterials || []
        }
      },
      vastu: {
        enabled: defaultBrief.vastuConstraints?.enabled || false,
        northAngle: 0, // default North facing
        preferredDirections: defaultBrief.vastuConstraints?.preferredDirections || []
      },
      appliances: defaultBrief.functionalNeeds?.applianceList || [],
      storage: {
        priority: defaultBrief.functionalNeeds?.storagePriority || 'medium',
        loftAlignment: defaultBrief.loftAligned === 'true'
      },
      materials: {
        finishes: defaultBrief.rooms?.[0]?.finishes || ['laminate']
      }
    };

    return normalized;
  }

  /**
   * 2. Floor Plan Ingestion
   */
  ingestFloorPlan(filename, mimeType) {
    const ext = filename.split('.').pop().toLowerCase();
    let detectedType = 'image';
    let layers = ['raw_pixels'];

    if (ext === 'pdf') {
      detectedType = 'pdf';
      layers = ['raster_layer', 'vector_text_layer'];
    } else if (ext === 'dxf' || ext === 'dwg') {
      detectedType = 'dxf';
      layers = ['walls_layer', 'openings_layer', 'furniture_layer', 'text_labels'];
    }

    return {
      filename,
      detectedType,
      layers,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * 3. Floor Plan Interpretation (Simulated CV Engine)
   */
  interpretFloorPlan(projectId, ingestResult) {
    // Determine rooms based on project intake if available
    const project = db.prepare("SELECT client_brief_json FROM projects WHERE id = ?").get(projectId);
    let roomsToCreate = ['Living', 'Kitchen', 'Master Bedroom'];
    if (project && project.client_brief_json) {
      try {
        const brief = JSON.parse(project.client_brief_json);
        if (brief.rooms && brief.rooms.length > 0) {
          roomsToCreate = brief.rooms.map(r => r.name);
        }
      } catch (e) {}
    }

    // Standard metric scale (e.g. 40 pixels = 1 meter)
    const scaleFactor = 40.0;
    const scaleUnit = 'mm';

    // Build Simulated Walls (bounding outer box + partitions)
    const walls = [
      { id: 'w_ext_n', x1: 100, y1: 100, x2: 900, y2: 100, thickness: 230, material: 'brick', confidence: 0.98 },
      { id: 'w_ext_e', x1: 900, y1: 100, x2: 900, y2: 900, thickness: 230, material: 'brick', confidence: 0.99 },
      { id: 'w_ext_s', x1: 900, y1: 900, x2: 100, y2: 900, thickness: 230, material: 'brick', confidence: 0.97 },
      { id: 'w_ext_w', x1: 100, y1: 900, x2: 100, y2: 100, thickness: 230, material: 'brick', confidence: 0.96 },
      // Inner partitions
      { id: 'w_part_1', x1: 500, y1: 100, x2: 500, y2: 900, thickness: 115, material: 'gypsum', confidence: 0.91 },
      { id: 'w_part_2', x1: 100, y1: 500, x2: 500, y2: 500, thickness: 115, material: 'gypsum', confidence: 0.89 }
    ];

    // Openings
    const openings = [
      { id: 'op_main_door', type: 'door', style: 'door_single', wallId: 'w_ext_w', x: 100, y: 300, width: 900, confidence: 0.95 },
      { id: 'op_kitchen_win', type: 'window', style: 'window_slide', wallId: 'w_ext_n', x: 700, y: 100, width: 1200, confidence: 0.92 },
      { id: 'op_living_win', type: 'window', style: 'window_slide', wallId: 'w_ext_s', x: 300, y: 900, width: 1800, confidence: 0.94 }
    ];

    // Detect rooms & polygons
    const detectedRooms = [];
    const colorPalette = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5'];
    
    roomsToCreate.forEach((roomName, idx) => {
      let points = [];
      let type = 'bedroom';
      if (roomName.toLowerCase().includes('kitchen')) {
        type = 'kitchen';
        points = [{ x: 500, y: 100 }, { x: 900, y: 100 }, { x: 900, y: 500 }, { x: 500, y: 500 }];
      } else if (roomName.toLowerCase().includes('living') || roomName.toLowerCase().includes('foyer')) {
        type = 'living';
        points = [{ x: 100, y: 100 }, { x: 500, y: 100 }, { x: 500, y: 500 }, { x: 100, y: 500 }];
      } else {
        points = [{ x: 100, y: 500 }, { x: 500, y: 500 }, { x: 500, y: 900 }, { x: 100, y: 900 }];
      }

      detectedRooms.push({
        id: 'r_det_' + nanoid(4),
        name: roomName,
        type,
        points,
        color: colorPalette[idx % colorPalette.length],
        confidence: 0.94
      });
    });

    // Extract service points
    const servicePoints = [
      { id: 'sp_sink_inlet', type: 'plumbing_inlet', room: 'Kitchen', x: 750, y: 120, confidence: 0.88 },
      { id: 'sp_ac_point', type: 'electrical_socket', room: 'Master Bedroom', x: 300, y: 880, confidence: 0.85 }
    ];

    const interpretation = {
      source: {
        fileAssetId: ingestResult.filename,
        mode: ingestResult.detectedType === 'dxf' ? 'hybrid' : 'image'
      },
      rooms: detectedRooms,
      walls,
      openings,
      dimensions: [
        { id: 'dim_1', fromPoint: { x: 100, y: 100 }, toPoint: { x: 900, y: 100 }, distanceMm: 20000, confidence: 0.95 }
      ],
      symbols: servicePoints,
      graph: {
        nodes: detectedRooms.map(r => ({ id: r.id, label: r.name })),
        edges: []
      },
      warnings: []
    };

    // Calculate overall confidence average
    const allConfidence = [
      ...walls.map(w => w.confidence),
      ...openings.map(o => o.confidence),
      ...detectedRooms.map(r => r.confidence)
    ];
    const overallConfidence = allConfidence.reduce((a, b) => a + b, 0) / allConfidence.length;

    // 4. Designer review queue items definition
    // Create automatic warning items for lower confidence items or potential vastu concerns
    const reviewItems = [];
    if (overallConfidence < 0.95) {
      reviewItems.push({
        id: 'rev_' + nanoid(6),
        item_type: 'wall',
        item_ref: 'w_part_2',
        confidence: 0.89,
        severity: 'warning',
        suggested_value_json: JSON.stringify({ thickness: 115, material: 'gypsum' })
      });
    }

    // Always ask designer to verify kitchen sink plumbing line
    reviewItems.push({
      id: 'rev_' + nanoid(6),
      item_type: 'symbol',
      item_ref: 'sp_sink_inlet',
      confidence: 0.88,
      severity: 'info',
      suggested_value_json: JSON.stringify({ type: 'plumbing_inlet', room: 'Kitchen' })
    });

    return {
      overallConfidence,
      scaleFactor,
      scaleUnit,
      interpretation,
      reviewItems
    };
  }

  /**
   * 5. Generate scene graph & auto layout proposal from spatial model
   */
  generateAutoLayoutProposal(spatialModel, briefConstraints) {
    const levels = spatialModel.levels || [];
    const rooms = levels[0]?.rooms || [];
    const walls = levels[0]?.walls || [];
    const openings = levels[0]?.openings || [];

    const furniture = [];
    const lights = [];
    
    // Automatically layout furniture based on room names/types
    rooms.forEach(room => {
      // Find bounding box for room
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      room.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      const widthPx = maxX - minX;
      const heightPx = maxY - minY;
      
      // Calculate sizes in real-world metric units
      const scale = 40.0; // 40px = 1m = 1000mm
      const roomWidthMm = (widthPx / scale) * 1000;
      const roomHeightMm = (heightPx / scale) * 1000;

      // Placement centers
      const centerX = minX + widthPx / 2;
      const centerY = minY + heightPx / 2;

      if (room.type === 'kitchen') {
        // L-shaped modular kitchen layout
        furniture.push({
          id: 'cab_sink_' + nanoid(4),
          libraryId: 'kitchen_sink_unit',
          name: 'Modular Sink Cabinet',
          x: minX + 45,
          y: minY + 45,
          width: 900, // exact mm
          height: 600, // depth mm
          rotation: 0,
          color: '#38A169',
          customization: {
            carcassPly: '18mm waterproof bwr',
            shutterFinish: 'high gloss acrylic'
          }
        });

        furniture.push({
          id: 'cab_hob_' + nanoid(4),
          libraryId: 'kitchen_hob_unit',
          name: 'Modular Hob Unit',
          x: minX + 135,
          y: minY + 45,
          width: 900,
          height: 600,
          rotation: 0,
          color: '#38A169',
          customization: {
            carcassPly: '18mm waterproof bwr',
            shutterFinish: 'high gloss acrylic'
          }
        });
      } else if (room.type === 'living') {
        // Floating TV Unit placement
        furniture.push({
          id: 'fur_tv_' + nanoid(4),
          libraryId: 'tv_console',
          name: 'Floating TV Unit',
          x: centerX,
          y: minY + 30,
          width: 1800,
          height: 400,
          rotation: 0,
          color: '#3182CE'
        });

        // 3-seater sofa + circulation spaces
        furniture.push({
          id: 'fur_sofa_' + nanoid(4),
          libraryId: 'sofa_3seater',
          name: 'Luxury 3-Seater Sofa',
          x: centerX,
          y: maxY - 80,
          width: 2100,
          height: 850,
          rotation: 180,
          color: '#3182CE'
        });
      } else {
        // Bedroom layout: Wardrobe + King bed
        furniture.push({
          id: 'fur_bed_' + nanoid(4),
          libraryId: 'king_bed',
          name: 'King Bed with Storage',
          x: centerX,
          y: centerY,
          width: 1800,
          height: 2000,
          rotation: 0,
          color: '#D69E2E'
        });

        furniture.push({
          id: 'fur_wardrobe_' + nanoid(4),
          libraryId: 'sliding_wardrobe',
          name: 'Modular Sliding Wardrobe',
          x: minX + 40,
          y: centerY,
          width: 1800,
          height: 600,
          rotation: 90,
          color: '#D69E2E'
        });
      }

      // Add default ceiling lights
      lights.push({
        id: 'light_' + nanoid(4),
        type: 'downlight',
        x: centerX,
        y: centerY,
        intensity: 800,
        color: '#fffaed'
      });
    });

    const sceneDoc = {
      schemaVersion: '1.0.0',
      units: 'mm',
      levels: [{
        levelId: 'level_0',
        name: 'Ground Floor',
        elevationMm: 0,
        rooms,
        walls,
        openings,
        furniture,
        lights
      }],
      materials: [
        { id: 'mat_default_carcass', name: 'Frosty White SF-9120', pricePerSqft: 45 }
      ],
      settings: {
        budgetTier: briefConstraints?.budget?.band || 'standard'
      }
    };

    return sceneDoc;
  }
}

export default new PlanIntelligenceCore();
