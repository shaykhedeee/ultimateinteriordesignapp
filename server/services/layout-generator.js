import db from '../database/database.js';
import { nanoid } from 'nanoid';

/**
 * Compiles 2D plan vectors (walls, rooms, openings, furniture) based on client onboarding brief specifications
 * @param {string} projectId 
 * @param {object} brief 
 */
export function generateLayoutFromBrief(projectId, brief) {
  const selectedSpaces = brief.selectedSpaces || ['living', 'kitchen', 'masterBed'];
  
  const wallsMap = {};
  const roomsList = [];
  const openingsList = [];
  const furnitureList = [];
  
  const pixelsPerMeter = 40.0; // 40px = 1m

  // Helper to add wall safely and prevent duplicates
  function addWall(id, x1, y1, x2, y2, thickness = 14, material = 'concrete') {
    // Sort coordinates to make keys unique
    const key = x1 <= x2 ? `${x1},${y1}->${x2},${y2}` : `${x2},${y2}->${x1},${y1}`;
    if (!wallsMap[key]) {
      wallsMap[key] = { id, x1, y1, x2, y2, thickness, material };
    }
    return wallsMap[key].id;
  }

  // --- Grid Coordinates Mapping ---
  // Foyer: X = 100 to 200, Y = 100 to 200
  // Pooja: X = 100 to 200, Y = 200 to 300
  // Living: X = 200 to 600, Y = 100 to 500
  // Kitchen: X = 600 to 900, Y = 100 to 400
  // Master Bed: X = 200 to 600, Y = 500 to 900
  // Kids Bed: X = 600 to 900, Y = 400 to 800

  // 1. Entry Foyer
  if (selectedSpaces.includes('foyer')) {
    roomsList.push({ 
      id: 'r_foyer', 
      name: 'Entry Foyer', 
      type: 'foyer', 
      points: [ {x:100, y:100}, {x:200, y:100}, {x:200, y:200}, {x:100, y:200} ], 
      color: '#805AD5',
      constraints: { vastuZone: 'N' }
    });
    addWall('w_f_1', 100, 100, 200, 100); // North
    addWall('w_f_2', 200, 100, 200, 200); // East (Living partition)
    addWall('w_f_3', 200, 200, 100, 200); // South (Pooja partition)
    addWall('w_f_4', 100, 200, 100, 100); // West (Outer)
    
    // Front entry door
    openingsList.push({ id: 'op_f_door', type: 'door', style: 'door_single', wallId: 'w_f_4', x: 100, y: 150, width: 36, angle: 90 });
    
    // Shoe console
    furnitureList.push({ 
      id: 'f_foyer_shoe', 
      libraryId: 'shoe_rack', 
      name: "Foyer Shoe Console", 
      x: 150, 
      y: 120, 
      width: 70, 
      height: 35, 
      rotation: 0, 
      color: '#805AD5', 
      wallId: 'w_f_1' 
    });
    
    if (brief.fittings?.includes('bench')) {
      furnitureList.push({ 
        id: 'f_foyer_bench', 
        libraryId: 'shoe_bench', 
        name: "Seating Foyer Bench", 
        x: 150, 
        y: 180, 
        width: 60, 
        height: 35, 
        rotation: 180, 
        color: '#805AD5', 
        wallId: 'w_f_3' 
      });
    }
  }

  // 2. Dedicated Pooja
  if (selectedSpaces.includes('pooja')) {
    roomsList.push({ 
      id: 'r_pooja', 
      name: 'Dedicated Pooja', 
      type: 'pooja', 
      points: [ {x:100, y:200}, {x:200, y:200}, {x:200, y:300}, {x:100, y:300} ], 
      color: '#D4AF37',
      constraints: { vastuZone: 'NE' }
    });
    addWall('w_p_1', 100, 200, 200, 200);
    addWall('w_p_2', 200, 200, 200, 300);
    addWall('w_p_3', 200, 300, 100, 300);
    addWall('w_p_4', 100, 300, 100, 200);

    // Arched pooja entry
    openingsList.push({ id: 'op_pooja_arch', type: 'opening', style: 'arch', wallId: 'w_p_2', x: 200, y: 250, width: 30, angle: 90 });

    // Mandir Unit
    furnitureList.push({ 
      id: 'f_pooja_mandir', 
      libraryId: 'mandir_floor_unit', 
      name: "Pooja Mandir Base", 
      x: 150, 
      y: 250, 
      width: 72, 
      height: 45, 
      rotation: 270, 
      color: '#D4AF37', 
      wallId: 'w_p_4' 
    });
  }

  // 3. Living Room
  if (selectedSpaces.includes('living')) {
    roomsList.push({ 
      id: 'r_living', 
      name: 'Grand Living Area', 
      type: 'living', 
      points: [ {x:200, y:100}, {x:600, y:100}, {x:600, y:500}, {x:200, y:500} ], 
      color: '#3182CE',
      constraints: { vastuZone: 'E' }
    });
    addWall('w_l_1', 200, 100, 600, 100); // North (Outer)
    addWall('w_l_2', 600, 100, 600, 500); // East (Kitchen partition)
    addWall('w_l_3', 600, 500, 200, 500); // South (Bedroom partition)
    addWall('w_l_4', 200, 500, 200, 100); // West (Foyer partition)

    // Sliding window
    openingsList.push({ id: 'op_living_win', type: 'window', style: 'window_slide', wallId: 'w_l_1', x: 400, y: 100, width: 72, angle: 0 });

    // TV Backdrop and Console
    furnitureList.push({ 
      id: 'f_living_tv', 
      libraryId: 'tv_unit', 
      name: "Floating TV Console", 
      x: 400, 
      y: 120, 
      width: 140, 
      height: 40, 
      rotation: 0, 
      color: '#3182CE', 
      wallId: 'w_l_1' 
    });

    if (brief.partitionStyle === 'cnc-jali') {
      furnitureList.push({ 
        id: 'f_living_jali', 
        libraryId: 'feature_wall_panel_system', 
        name: "CNC Jali Screen", 
        x: 210, 
        y: 250, 
        width: 10, 
        height: 180, 
        rotation: 90, 
        color: '#D4AF37', 
        wallId: 'w_l_4' 
      });
    }

    // Sofa
    furnitureList.push({ 
      id: 'f_living_sofa', 
      libraryId: 'lounge_sofa_3', 
      name: "L-Shape Sofa Run", 
      x: 400, 
      y: 440, 
      width: 160, 
      height: 80, 
      rotation: 180, 
      color: '#4A5568', 
      wallId: 'w_l_3' 
    });
  }

  // 4. Modular Kitchen
  if (selectedSpaces.includes('kitchen')) {
    roomsList.push({ 
      id: 'r_kitchen', 
      name: 'Modular Kitchen', 
      type: 'kitchen', 
      points: [ {x:600, y:100}, {x:900, y:100}, {x:900, y:400}, {x:600, y:400} ], 
      color: '#ED8936',
      constraints: { vastuZone: 'SE' }
    });
    addWall('w_k_1', 600, 100, 900, 100);
    addWall('w_k_2', 900, 100, 900, 400);
    addWall('w_k_3', 900, 400, 600, 400);
    addWall('w_k_4', 600, 400, 600, 100);

    // Window and entrance arch
    openingsList.push({ id: 'op_kitchen_win', type: 'window', style: 'window', wallId: 'w_k_2', x: 900, y: 250, width: 48, angle: 90 });
    openingsList.push({ id: 'op_kitchen_arch', type: 'opening', style: 'arch', wallId: 'w_k_4', x: 600, y: 320, width: 48, angle: 90 });

    const layout = brief.kitchenLayout || 'l-shaped';

    if (layout === 'l-shaped') {
      // Countertop bases
      furnitureList.push({ id: 'f_k_base_1', libraryId: 'kitchen_base_run', name: "Base Drawer Unit", x: 670, y: 130, width: 100, height: 60, rotation: 0, color: '#ED8936', wallId: 'w_k_1' });
      furnitureList.push({ id: 'f_k_hob', libraryId: 'kitchen_hob_unit', name: "Cooking Hob Unit", x: 770, y: 130, width: 80, height: 60, rotation: 0, color: '#ED8936', wallId: 'w_k_1' });
      
      // Sink
      furnitureList.push({ id: 'f_k_sink', libraryId: 'kitchen_sink_unit', name: "Water Sink Unit", x: 630, y: 220, width: 80, height: 60, rotation: 90, color: '#ED8936', wallId: 'w_k_4' });
      
      // Wall overhead
      furnitureList.push({ id: 'f_k_wall_1', libraryId: 'kitchen_wall_run', name: "Overhead Shutters", x: 670, y: 115, width: 100, height: 35, rotation: 0, color: '#ED8936', wallId: 'w_k_1' });
    } else if (layout === 'parallel') {
      // Two runs
      furnitureList.push({ id: 'f_k_base_1', libraryId: 'kitchen_base_run', name: "Base Run Left", x: 700, y: 130, width: 140, height: 60, rotation: 0, color: '#ED8936', wallId: 'w_k_1' });
      furnitureList.push({ id: 'f_k_hob', libraryId: 'kitchen_hob_unit', name: "Cooking Hob Unit", x: 800, y: 130, width: 80, height: 60, rotation: 0, color: '#ED8936', wallId: 'w_k_1' });
      furnitureList.push({ id: 'f_k_sink', libraryId: 'kitchen_sink_unit', name: "Water Sink Unit", x: 720, y: 370, width: 80, height: 60, rotation: 180, color: '#ED8936', wallId: 'w_k_3' });
    } else {
      // Straight run
      furnitureList.push({ id: 'f_k_base_1', libraryId: 'kitchen_base_run', name: "Base Counter", x: 680, y: 130, width: 120, height: 60, rotation: 0, color: '#ED8936', wallId: 'w_k_1' });
      furnitureList.push({ id: 'f_k_hob', libraryId: 'kitchen_hob_unit', name: "Cooking Hob Unit", x: 800, y: 130, width: 80, height: 60, rotation: 0, color: '#ED8936', wallId: 'w_k_1' });
      furnitureList.push({ id: 'f_k_sink', libraryId: 'kitchen_sink_unit', name: "Water Sink Unit", x: 880, y: 200, width: 80, height: 60, rotation: 90, color: '#ED8936', wallId: 'w_k_2' });
    }

    if (brief.appliances?.includes('fridge')) {
      furnitureList.push({ id: 'f_k_fridge', libraryId: 'refrigerator', name: "Double-Door Fridge", x: 870, y: 350, width: 75, height: 75, rotation: 270, color: '#718096', wallId: 'w_k_2' });
    }
  }

  // 5. Master Suite
  if (selectedSpaces.includes('masterBed')) {
    roomsList.push({ 
      id: 'r_masterBed', 
      name: 'Master Suite', 
      type: 'masterBed', 
      points: [ {x:200, y:500}, {x:600, y:500}, {x:600, y:900}, {x:200, y:900} ], 
      color: '#38A169',
      constraints: { vastuZone: 'SW' }
    });
    addWall('w_m_1', 200, 500, 600, 500);
    addWall('w_m_2', 600, 500, 600, 900);
    addWall('w_m_3', 600, 900, 200, 900);
    addWall('w_m_4', 200, 900, 200, 500);

    // Door and Window
    openingsList.push({ id: 'op_master_door', type: 'door', style: 'door_single', wallId: 'w_m_1', x: 250, y: 500, width: 36, angle: 180 });
    openingsList.push({ id: 'op_master_win', type: 'window', style: 'window_slide', wallId: 'w_m_3', x: 400, y: 900, width: 60, angle: 0 });

    // Bed
    furnitureList.push({ id: 'f_master_bed', libraryId: 'double_bed', name: "King Storage Bed", x: 400, y: 720, width: 140, height: 160, rotation: 0, color: '#38A169', wallId: 'w_m_3' });

    // Wardrobe along West wall
    const isSliding = brief.shutterFinish !== 'veneer';
    furnitureList.push({ 
      id: 'f_master_wardrobe', 
      libraryId: isSliding ? 'wardrobe_sliding' : 'wardrobe_swing', 
      name: "Master Sliding Wardrobe", 
      x: 230, 
      y: 700, 
      width: 140, 
      height: 60, 
      rotation: 90, 
      color: '#38A169', 
      wallId: 'w_m_4'
    });
  }

  // 6. Kids Bedroom
  if (selectedSpaces.includes('kidsBed')) {
    roomsList.push({ 
      id: 'r_kidsBed', 
      name: 'Kids Bedroom', 
      type: 'kidsBed', 
      points: [ {x:600, y:400}, {x:900, y:400}, {x:900, y:800}, {x:600, y:800} ], 
      color: '#4FD1C5',
      constraints: { vastuZone: 'NW' }
    });
    addWall('w_kb_1', 600, 400, 900, 400);
    addWall('w_kb_2', 900, 400, 900, 800);
    addWall('w_kb_3', 900, 800, 600, 800);
    addWall('w_kb_4', 600, 800, 600, 400);

    // Door and Window
    openingsList.push({ id: 'op_kids_door', type: 'door', style: 'door_single', wallId: 'w_kb_4', x: 600, y: 460, width: 36, angle: 90 });
    openingsList.push({ id: 'op_kids_win', type: 'window', style: 'window', wallId: 'w_kb_2', x: 900, y: 600, width: 48, angle: 90 });

    // Bed & Study Table
    furnitureList.push({ id: 'f_kids_bed', libraryId: 'single_bed', name: "Kids Storage Bed", x: 780, y: 650, width: 90, height: 140, rotation: 90, color: '#4FD1C5', wallId: 'w_kb_2' });
    furnitureList.push({ id: 'f_kids_study', libraryId: 'study_desk', name: "Study Desk Setup", x: 630, y: 720, width: 80, height: 50, rotation: 90, color: '#4FD1C5', wallId: 'w_kb_4' });
  }

  // Convert walls map to list
  const wallsList = Object.values(wallsMap);

  // Update in SQLite Database
  db.prepare(`
    UPDATE cad_drawings 
    SET walls_json = ?, openings_json = ?, furniture_json = ?, rooms_json = ?, measures_json = ?
    WHERE project_id = ?
  `).run(
    JSON.stringify(wallsList),
    JSON.stringify(openingsList),
    JSON.stringify(furnitureList),
    JSON.stringify(roomsList),
    JSON.stringify([]),
    projectId
  );

  // Set stale flags so downstream files will be marked as needing refresh
  db.prepare("UPDATE projects SET stale_renders = 1, stale_drawings = 1, stale_pricing = 1 WHERE id = ?").run(projectId);

  // Also sync parameters into active scene_versions main branch document if it exists
  const currentScene = db.prepare("SELECT * FROM scene_versions WHERE project_id = ? AND branch_name = 'main' AND is_current = 1").get(projectId);
  if (currentScene) {
    try {
      const doc = JSON.parse(currentScene.scene_json);
      const height = brief.ceilingHeight ? parseInt(brief.ceilingHeight) || 2900 : 2900;
      
      doc.levels[0].rooms = roomsList.map(r => ({
        roomId: r.id,
        roomType: r.type,
        name: r.name,
        polygon2d: r.points,
        heightMm: height,
        floorFinishId: null,
        ceilingStyleId: null,
        walls: [],
        modules: [],
        furniture: [],
        photos: []
      }));
      doc.levels[0].walls = wallsList.map(w => ({
        wallId: w.id,
        roomIdPrimary: roomsList[0]?.id || 'room_1',
        start: { x: w.x1 * 10, y: w.y1 * 10 },
        end: { x: w.x2 * 10, y: w.y2 * 10 },
        thicknessMm: w.thickness * 10,
        heightMm: height,
        openings: [],
        finishInnerId: null,
        finishOuterId: null,
        photos: []
      }));
      doc.levels[0].openings = openingsList.map(o => ({
        openingId: o.id,
        wallId: o.wallId,
        openingType: o.type,
        offsetFromStartMm: 1000,
        widthMm: o.width * 10,
        sillHeightMm: o.type === 'window' ? 900 : 0,
        headHeightMm: 2100
      }));
      doc.levels[0].modules = furnitureList.map(f => ({
        moduleId: f.id,
        moduleType: f.libraryId || 'furniture_item',
        roomRef: roomsList.find(r => r.type === f.libraryId?.split('_')?.[0])?.id || roomsList[0]?.id || 'room_1',
        name: f.name,
        geometry: {
          anchor: { roomId: roomsList[0]?.id || 'room_1', x: f.x * 10, y: f.y * 10, z: 0 },
          size: { widthMm: f.width * 10, heightMm: 720, depthMm: f.height * 10 },
          rotationDeg: f.rotation
        },
        params: {},
        materialAssignments: { carcass: 'lam_1', shutter: 'lam_1' },
        productionMapping: {}
      }));

      db.prepare(`
        UPDATE scene_versions
        SET scene_json = ?
        WHERE id = ?
      `).run(JSON.stringify(doc), currentScene.id);
    } catch(e) {
      console.error("Failed to update active scene version details:", e);
    }
  }

  // Log timeline event
  const eventId = 'ev_' + nanoid(6);
  db.prepare(`
    INSERT INTO timeline_events (id, project_id, event_type, title, detail)
    VALUES (?, ?, 'layout.generated', 'Automatic 2D Plan Layout Seeding', ?)
  `).run(eventId, projectId, `Generated room layout with ${roomsList.length} spaces, ${wallsList.length} walls, and ${furnitureList.length} component modules from onboarding preferences.`);
}
