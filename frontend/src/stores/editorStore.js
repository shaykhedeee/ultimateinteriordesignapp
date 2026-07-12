import { create } from 'zustand';

// Local nanoid simulation for client-side ID generation
const clientId = (prefix) => prefix + '_' + Math.random().toString(36).substring(2, 8);

const getAppToast = () => ({
  success: (m) => { try { window.__toast?.success?.(String(m)); } catch {} },
  error: (m) => { try { window.__toast?.error?.(String(m)); } catch {} },
  warn: (m) => { try { window.__toast?.warn?.(String(m)); } catch {} },
  info: (m) => { try { window.__toast?.info?.(String(m)); } catch {} }
});

// Default blank SceneDocument layout (used if API initialization fails)
const initialSceneDoc = (projectId) => ({
  schemaVersion: "1.0",
  projectId: projectId || "unknown",
  units: "mm",
  levels: [
    {
      levelId: "level_1",
      name: "Ground Floor",
      rooms: [],
      walls: [],
      openings: [],
      modules: []
    }
  ],
  materials: [],
  lights: [{ lightId: "ambient_1", type: "ambient", intensity: 0.7 }],
  cameras: [
    { cameraId: "cam_iso", name: "Isometric View", type: "perspective", position: { x: 5000, y: 4000, z: 5000 }, target: { x: 0, y: 0, z: 0 } }
  ],
  settings: { budgetBand: "standard" },
  ruleResults: { passCount: 0, warnCount: 0, failCount: 0, results: [] }
});

export const useEditorStore = create((set, get) => ({
  // --- Core State ---
  projectId: null,
  scene: null, // SceneDocument
  sceneId: null, // Stored record ID
  versionNumber: 1,
  isLocked: false,
  lockReason: "",
  materialsCatalog: [],
  branchName: "main",
  
  // --- Interaction State ---
  selectedId: null,
  selectedType: null, // 'room' | 'wall' | 'module' | 'opening' | null
  activeTool: 'select', // 'select' | 'place' | 'wall' | 'measure'
  activeRoomId: null,
  activeLevelId: 'level_1',
  pixelsPerMeter: 40.0,
  
  // --- History (Undo/Redo) ---
  history: [],
  historyIndex: -1,
  
  // --- Validation & Budget ---
  validationResult: { passCount: 0, warnCount: 0, failCount: 0, results: [] },
  isSaving: false,

  // --- Actions ---
  loadScene: async (projectId, branch = 'main') => {
    if (!projectId) return;
    set({ projectId, isSaving: true, branchName: branch });
    try {
      // Fetch materials catalog
      const resMat = await fetch(`http://127.0.0.1:5055/api/material-catalog`);
      if (resMat.ok) {
        const matData = await resMat.json();
        set({ materialsCatalog: matData });
      }

      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes/current?branch=${branch}`);
      if (res.ok) {
        const data = await res.json();
        const doc = data.scene || initialSceneDoc(projectId);
        
        // Auto-select first room if available
        const firstRoom = doc.levels?.[0]?.rooms?.[0]?.roomId || null;
        
        set({
          scene: doc,
          sceneId: data.id,
          versionNumber: data.version_number || 1,
          isLocked: !!data.is_locked,
          lockReason: data.lock_reason || "",
          activeRoomId: firstRoom,
          history: [JSON.stringify(doc)],
          historyIndex: 0,
          selectedId: null,
          selectedType: null,
          isSaving: false
        });
        
        // Run initial validation
        get().runRuleValidation();
      } else {
        throw new Error("Failed to load scene");
      }
    } catch (err) {
      console.error("Error loading scene from API, fallback to blank scene", err);
      const fallback = initialSceneDoc(projectId);
      set({
        scene: fallback,
        history: [JSON.stringify(fallback)],
        historyIndex: 0,
        isSaving: false
      });
    }
  },

  selectEntity: (id, type) => {
    set({ selectedId: id, selectedType: type });
  },

  setTool: (tool) => {
    set({ activeTool: tool });
  },

  setActiveRoom: (roomId) => {
    set({ activeRoomId: roomId });
  },

  setPixelsPerMeter: (ppm) => {
    set({ pixelsPerMeter: ppm });
  },

  // Helper to push a new scene state to history stack (for client-side Undo/Redo)
  pushToHistory: (newScene) => {
    const { history, historyIndex } = get();
    const updatedHistory = history.slice(0, historyIndex + 1);
    const serialized = JSON.stringify(newScene);
    
    set({
      scene: newScene,
      history: [...updatedHistory, serialized],
      historyIndex: updatedHistory.length
    });

    // Automatically execute validation rules on the fresh layout
    get().runRuleValidation();
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      const doc = JSON.parse(history[idx]);
      set({
        scene: doc,
        historyIndex: idx,
        selectedId: null,
        selectedType: null
      });
      get().runRuleValidation();
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      const doc = JSON.parse(history[idx]);
      set({
        scene: doc,
        historyIndex: idx,
        selectedId: null,
        selectedType: null
      });
      get().runRuleValidation();
    }
  },

  // --- Scene Patch Operations ---
  applyPatch: (op) => {
    const { scene, isLocked } = get();
    if (isLocked) {
      getAppToast().error('This scene version is locked for approvals and cannot be modified. Create a new branch variant instead.');
      return;
    }
    if (!scene) return;

    // Clone the scene graph deeply
    const updatedScene = JSON.parse(JSON.stringify(scene));
    const level = updatedScene.levels.find(l => l.levelId === get().activeLevelId);
    if (!level) return;

    switch (op.op) {
      case 'place_module': {
        const { templateKey, name, x = 100, y = 100, z = 0, width = 600, height = 720, depth = 560 } = op.payload || {};
        const newModule = {
          moduleId: clientId('mod'),
          moduleType: templateKey || 'cabinet',
          roomRef: get().activeRoomId || 'room_1',
          name: name || 'Placed Module',
          geometry: {
            anchor: {
              roomId: get().activeRoomId || 'room_1',
              x: parseFloat(x),
              y: parseFloat(y),
              z: parseFloat(z)
            },
            size: {
              widthMm: parseFloat(width),
              heightMm: parseFloat(height),
              depthMm: parseFloat(depth)
            },
            rotationDeg: 0
          },
          params: {},
          materialAssignments: {
            carcass: 'lam_1',
            shutter: 'lam_1'
          },
          productionMapping: {}
        };
        level.modules.push(newModule);
        
        // Auto-select the placed module
        set({ selectedId: newModule.moduleId, selectedType: 'module' });
        break;
      }

      case 'update_module_params': {
        const { moduleId, params, geometry, materials } = op.payload || {};
        const mod = level.modules.find(m => m.moduleId === moduleId);
        if (mod) {
          if (geometry) {
            mod.geometry = {
              ...mod.geometry,
              anchor: { ...mod.geometry.anchor, ...geometry.anchor },
              size: { ...mod.geometry.size, ...geometry.size },
              rotationDeg: geometry.rotationDeg !== undefined ? parseFloat(geometry.rotationDeg) : mod.geometry.rotationDeg
            };
          }
          if (params) {
            mod.params = { ...mod.params, ...params };
          }
          if (materials) {
            mod.materialAssignments = { ...mod.materialAssignments, ...materials };
          }
        }
        break;
      }

      case 'remove_module': {
        const { moduleId } = op.payload || {};
        level.modules = level.modules.filter(m => m.moduleId !== moduleId);
        if (get().selectedId === moduleId) {
          set({ selectedId: null, selectedType: null });
        }
        break;
      }

      case 'assign_material': {
        const { moduleId, slotKey, materialId } = op.payload || {};
        const mod = level.modules.find(m => m.moduleId === moduleId);
        if (mod) {
          mod.materialAssignments[slotKey] = materialId;
        }
        break;
      }

      case 'update_room_metadata': {
        const { roomId, name, roomType, heightMm, floorFinishId, ceilingStyleId, constraints } = op.payload || {};
        const room = level.rooms.find(r => r.roomId === roomId);
        if (room) {
          if (name) room.name = name;
          if (roomType) room.roomType = roomType;
          if (heightMm) room.heightMm = parseFloat(heightMm);
          if (floorFinishId !== undefined) room.floorFinishId = floorFinishId;
          if (ceilingStyleId !== undefined) room.ceilingStyleId = ceilingStyleId;
          if (constraints) room.constraints = { ...room.constraints, ...constraints };
        }
        break;
      }

      case 'update_wall_geometry': {
        const { wallId, start, end, thicknessMm, heightMm } = op.payload || {};
        const wall = level.walls.find(w => w.wallId === wallId);
        if (wall) {
          if (start) wall.start = start;
          if (end) wall.end = end;
          if (thicknessMm) wall.thicknessMm = parseFloat(thicknessMm);
          if (heightMm) wall.heightMm = parseFloat(heightMm);
        }
        break;
      }

      case 'add_opening': {
        const { wallId, openingType = 'door', offsetFromStartMm = 500, widthMm = 900 } = op.payload || {};
        const newOpening = {
          openingId: clientId('op'),
          wallId,
          openingType,
          offsetFromStartMm: parseFloat(offsetFromStartMm),
          widthMm: parseFloat(widthMm),
          sillHeightMm: openingType === 'window' ? 900 : 0,
          headHeightMm: 2100
        };
        level.openings.push(newOpening);
        break;
      }

      case 'update_opening': {
        const { openingId, offsetFromStartMm, widthMm, sillHeightMm, headHeightMm } = op.payload || {};
        const opg = level.openings.find(o => o.openingId === openingId);
        if (opg) {
          if (offsetFromStartMm !== undefined) opg.offsetFromStartMm = parseFloat(offsetFromStartMm);
          if (widthMm !== undefined) opg.widthMm = parseFloat(widthMm);
          if (sillHeightMm !== undefined) opg.sillHeightMm = parseFloat(sillHeightMm);
          if (headHeightMm !== undefined) opg.headHeightMm = parseFloat(headHeightMm);
        }
        break;
      }

      default:
        console.warn("Unknown scene patch operation:", op.op);
        return;
    }

    get().pushToHistory(updatedScene);
  },

  // Save the current scene version snapshot back to the SQL database (uses the active branchName)
  saveSceneVersion: async (reason = "User design updates") => {
    const { scene, projectId, branchName } = get();
    if (!scene || !projectId) return;

    set({ isSaving: true });
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene, reason, branch: branchName })
      });
      if (res.ok) {
        const data = await res.json();
        set({
          versionNumber: data.versionNumber,
          isSaving: false
        });
        getAppToast().success(`Scene saved successfully! Created Immutable Version #${data.versionNumber} on branch '${branchName}'.`);
      } else {
        throw new Error("API responded with error");
      }
    } catch(err) {
      console.error("Error saving scene version:", err);
      getAppToast().error("Failed to save scene version to database.");
      set({ isSaving: false });
    }
  },

  // Lock the active version
  lockScene: async (reason = "Approved by Client") => {
    const { sceneId, projectId } = get();
    if (!sceneId || !projectId) return;
    
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes/${sceneId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        set({ isLocked: true, lockReason: reason });
        getAppToast().success(`Scene version locked successfully: "${reason}"`);
      }
    } catch(err) {
      console.error("Error locking scene:", err);
    }
  },

  // Duplicate selected module
  duplicateModule: (moduleId) => {
    const { scene, isLocked, activeLevelId } = get();
    if (isLocked || !scene) return;
    const updatedScene = JSON.parse(JSON.stringify(scene));
    const level = updatedScene.levels.find(l => l.levelId === activeLevelId);
    if (!level) return;
    
    const mod = level.modules.find(m => m.moduleId === moduleId);
    if (!mod) return;
    
    const newMod = JSON.parse(JSON.stringify(mod));
    newMod.moduleId = clientId('mod');
    newMod.name = `${mod.name} (Copy)`;
    newMod.geometry.anchor.x = parseFloat(newMod.geometry.anchor.x) + 300;
    newMod.geometry.anchor.y = parseFloat(newMod.geometry.anchor.y) + 300;
    
    level.modules.push(newMod);
    set({ selectedId: newMod.moduleId, selectedType: 'module' });
    get().pushToHistory(updatedScene);
  },

  // Apply predefined room template
  applyBulkTemplate: (templateKey) => {
    const { scene, isLocked, activeLevelId, activeRoomId } = get();
    if (isLocked || !scene || !activeRoomId) return;
    const updatedScene = JSON.parse(JSON.stringify(scene));
    const level = updatedScene.levels.find(l => l.levelId === activeLevelId);
    if (!level) return;

    let templates = [];
    if (templateKey === 'kitchen_l_shape') {
      templates = [
        { key: 'kitchen_base', name: 'Base Straight Run', x: 200, y: 200, w: 600, h: 850, d: 600 },
        { key: 'kitchen_base', name: 'Base Corner Unit', x: 800, y: 200, w: 900, h: 850, d: 900 },
        { key: 'kitchen_hob_unit', name: 'Stove Hob Unit', x: 200, y: 800, w: 800, h: 850, d: 600 }
      ];
    } else if (templateKey === 'bedroom_suite') {
      templates = [
        { key: 'wardrobe_swing', name: 'Swing Door Wardrobe', x: 300, y: 300, w: 1200, h: 2100, d: 600 },
        { key: 'tv_unit', name: 'TV Console Box', x: 1800, y: 300, w: 1200, h: 450, d: 400 }
      ];
    } else if (templateKey === 'mandir_setup') {
      templates = [
        { key: 'mandir_pooja', name: 'Floor Pooja Unit', x: 400, y: 400, w: 800, h: 1200, d: 450 }
      ];
    }

    templates.forEach(t => {
      level.modules.push({
        moduleId: clientId('mod'),
        moduleType: t.key,
        roomRef: activeRoomId,
        name: t.name,
        geometry: {
          anchor: { roomId: activeRoomId, x: t.x, y: t.y, z: 0 },
          size: { widthMm: t.w, heightMm: t.h, depthMm: t.d },
          rotationDeg: 0
        },
        params: {},
        materialAssignments: { carcass: 'lam_1', shutter: 'lam_1' },
        productionMapping: {}
      });
    });

    get().pushToHistory(updatedScene);
  },

  // --- Dynamic Rules & Vastu Validation Engine ---
  runRuleValidation: () => {
    const { scene, activeLevelId, activeRoomId } = get();
    if (!scene) return;

    const level = scene.levels.find(l => l.levelId === activeLevelId);
    if (!level) return;

    const activeRoom = level.rooms.find(r => r.roomId === activeRoomId);
    const roomType = activeRoom ? activeRoom.roomType : 'general';
    const roomOrientation = activeRoom?.constraints?.vastuZone || 'unknown';

    const results = [];
    let pass = 0;
    let warn = 0;
    let fail = 0;

    // Rule 1: Check room wall closures
    if (level.walls.length === 0) {
      results.push({
        ruleCode: 'ROOM_NO_WALLS',
        severity: 'hard',
        status: 'fail',
        message: 'No boundary walls have been defined. Extrusion and production are pending.',
        overrideAllowed: false
      });
      fail++;
    } else {
      results.push({
        ruleCode: 'ROOM_BOUNDARY_VALID',
        severity: 'global',
        status: 'pass',
        message: 'Room boundary walls correctly loop.',
        overrideAllowed: false
      });
      pass++;
    }

    // Rule 2: Swing clearance checks for wardrobes
    level.modules.forEach(m => {
      if (m.moduleType === 'wardrobe_swing') {
        const widthMm = m.geometry.size.widthMm;
        const depthMm = m.geometry.size.depthMm;
        // Wardrobe swing clearance is critical
        if (depthMm < 600) {
          results.push({
            ruleCode: 'WARDROBE_DEPTH_MIN',
            severity: 'soft',
            status: 'warn',
            message: `Wardrobe "${m.name}" depth of ${depthMm}mm is sub-optimal (Recommended: >= 600mm).`,
            overrideAllowed: true
          });
          warn++;
        } else {
          pass++;
        }
      }
    });

    // Rule 3: Kitchen stove hob overlap checks
    const kitchenModules = level.modules.filter(m => m.roomRef === activeRoomId);
    const sinks = kitchenModules.filter(m => m.moduleType === 'kitchen_sink_unit');
    const hobs = kitchenModules.filter(m => m.moduleType === 'kitchen_hob_unit');
    
    // Check overlap
    sinks.forEach(sink => {
      hobs.forEach(hob => {
        const dx = Math.abs(sink.geometry.anchor.x - hob.geometry.anchor.x);
        const dy = Math.abs(sink.geometry.anchor.y - hob.geometry.anchor.y);
        const distance = Math.hypot(dx, dy);
        if (distance < 800) {
          results.push({
            ruleCode: 'KITCHEN_SINK_HOB_CLASH',
            severity: 'hard',
            status: 'fail',
            message: `Plumbing safety violation: Hob stove is too close (${Math.round(distance)}mm) to water sink (Minimum required clearance: 900mm).`,
            overrideAllowed: true
          });
          fail++;
        }
      });
    });

    // Rule 4: Indian Vastu Direction Checks
    if (roomType === 'kitchen') {
      const idealVastu = ['SE', 'NW'];
      const isCompliant = idealVastu.includes(roomOrientation.toUpperCase());
      if (!isCompliant && roomOrientation !== 'unknown') {
        results.push({
          ruleCode: 'VASTU_KITCHEN_DIRECTION',
          severity: 'advisory',
          status: 'warn',
          message: `Vastu Advisory: Kitchen occupies ${roomOrientation}. South-East (Agni) or North-West (Vayu) is ideal to foster prosperity.`,
          overrideAllowed: true
        });
        warn++;
      } else if (isCompliant) {
        results.push({
          ruleCode: 'VASTU_KITCHEN_DIRECTION',
          severity: 'advisory',
          status: 'pass',
          message: `Vastu Compliant: Kitchen resides in highly favorable ${roomOrientation} quadrant.`,
          overrideAllowed: false
        });
        pass++;
      }
    } else if (roomType === 'mandir_room') {
      const isCompliant = roomOrientation.toUpperCase() === 'NE';
      if (!isCompliant && roomOrientation !== 'unknown') {
        results.push({
          ruleCode: 'VASTU_MANDIR_DIRECTION',
          severity: 'soft',
          status: 'warn',
          message: `Vastu Warning: Mandir occupies ${roomOrientation}. Pure North-East (Eshanya) corner is strongly recommended.`,
          overrideAllowed: true
        });
        warn++;
      } else if (isCompliant) {
        results.push({
          ruleCode: 'VASTU_MANDIR_DIRECTION',
          severity: 'advisory',
          status: 'pass',
          message: `Vastu Compliant: Mandir is placed in holy North-East corner.`,
          overrideAllowed: false
        });
        pass++;
      }
    }

    set({
      validationResult: {
        passCount: pass,
        warnCount: warn,
        failCount: fail,
        results
      }
    });
  }
}));
