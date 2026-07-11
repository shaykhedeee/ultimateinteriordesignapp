import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useEditorStore } from '../../stores/editorStore';
import { selectRooms, selectWalls, selectOpenings, selectModules } from '../../lib/selectors/editorSelectors';
import { resolveMaterial, getSlotsForModuleType } from '../../lib/materialSlots';
import { HelpCircle, Sparkles } from 'lucide-react';

const LAMINATE_COLORS = {
  lam_1: 0xf3f4f6, // Frosty White
  lam_2: 0xc29a6b, // Warm Oak
  lam_3: 0x1e293b, // Charcoal Matte
  lam_4: 0xe5e5e0  // Light Beige
};

// Build a Three.js MeshStandardMaterial for a given catalog material assignment,
// honouring finish (gloss/matte) and procedural wood/marble textures.
const buildSlotMaterial = (materialId, catalog, renderMode) => {
  const catalogMat = resolveMaterial(materialId, catalog);
  let colorHex = LAMINATE_COLORS[materialId] || 0xf3f4f6;
  if (catalogMat && catalogMat.color) {
    try { colorHex = parseInt(catalogMat.color.replace('#', '0x'), 16); } catch (e) { /* keep fallback */ }
  }

  let roughness = 0.5;
  let metalness = 0.15;
  let map = null;

  if (renderMode === 'textures' && catalogMat) {
    const finishLower = (catalogMat.finish || '').toLowerCase();
    const nameLower = (catalogMat.name || '').toLowerCase();
    if (finishLower.includes('gloss') || finishLower.includes('acrylic')) {
      roughness = 0.1; metalness = 0.25;
    } else if (finishLower.includes('matte') || finishLower.includes('suede')) {
      roughness = 0.85; metalness = 0.05;
    }
    if (nameLower.includes('oak') || nameLower.includes('walnut') || nameLower.includes('wood') || nameLower.includes('ply') || nameLower.includes('wenge') || nameLower.includes('laminate')) {
      map = createWoodgrainTexture(catalogMat.color || '#c29a6b');
    } else if (nameLower.includes('marble') || nameLower.includes('stone') || nameLower.includes('granite') || nameLower.includes('quartz')) {
      map = createMarbleTexture(catalogMat.color || '#e5e5e0');
    }
  }

  return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : colorHex, map, roughness, metalness });
};

// Procedural texture generators to match actual catalog materials in Three.js
const createWoodgrainTexture = (colorHex) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Fill base color
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 256, 256);

  // Wavy wood lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    const x = Math.random() * 256;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 15, 80, x - 15, 170, x, 256);
    ctx.stroke();
  }

  // Fine accent lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    const x = Math.random() * 256;
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 8, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  return texture;
};

const createMarbleTexture = (colorHex) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 256, 256);

  // White soft veins
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, 0);
    ctx.bezierCurveTo(Math.random() * 256, 90, Math.random() * 256, 160, Math.random() * 256, 256);
    ctx.stroke();
  }

  // Dark veins
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * 256);
    ctx.bezierCurveTo(80, Math.random() * 256, 170, Math.random() * 256, 256, Math.random() * 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

export default function Viewport3D() {
  const mountRef = useRef(null);
  const rebuildRef = useRef(null);
  const rooms = useEditorStore(selectRooms);
  const walls = useEditorStore(selectWalls);
  const openings = useEditorStore(selectOpenings);
  const modules = useEditorStore(selectModules);
  
  const selectedId = useEditorStore(state => state.selectedId);
  const selectEntity = useEditorStore(state => state.selectEntity);
  const activeRoomId = useEditorStore(state => state.activeRoomId);
  const materialsCatalog = useEditorStore(state => state.materialsCatalog) || [];
  
  // Render modes: 'solid' (fast flat colors), 'textures' (procedural wood/marble, finish reflection properties)
  const [renderMode, setRenderMode] = useState('textures');
  
  // Store refs to keep rendering loop in sync with react state
  const stateRef = useRef({ walls, openings, modules, selectedId, activeRoomId, materialsCatalog, renderMode });
  
  useEffect(() => {
    stateRef.current = { walls, openings, modules, selectedId, activeRoomId, materialsCatalog, renderMode };
  }, [walls, openings, modules, selectedId, activeRoomId, materialsCatalog, renderMode]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- 1. Scene, Camera, Renderer Setup ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x080c14, 0.00008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 10, 50000);
    camera.position.set(3000, 3500, 4000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // --- 2. Controls & Lights ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent camera from going underground
    controls.minDistance = 200;
    controls.maxDistance = 20000;
    controls.target.set(1500, 200, 1500);

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    // Key Directional Light (Sunlight)
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 0.85);
    sunLight.position.set(3000, 6000, 2000);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 15000;
    const d = 4000;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Soft warm fill light
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.35);
    fillLight.position.set(-3000, 3000, -2000);
    scene.add(fillLight);

    // --- 3. Grid & Floor Helpers ---
    const gridHelper = new THREE.GridHelper(10000, 100, 0x1f2937, 0x111827);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // Groups for layout meshes
    const floorGroup = new THREE.Group();
    const wallsGroup = new THREE.Group();
    const modulesGroup = new THREE.Group();
    scene.add(floorGroup);
    scene.add(wallsGroup);
    scene.add(modulesGroup);

    // --- 4. Interactive Object Click Selection (Raycasting) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // We only intersect with placed module objects
      const intersects = raycaster.intersectObjects(modulesGroup.children, true);
      if (intersects.length > 0) {
        // Find the root mesh with userData
        let obj = intersects[0].object;
        while (obj && obj !== scene) {
          if (obj.userData?.moduleId) {
            selectEntity(obj.userData.moduleId, 'module');
            return;
          }
          obj = obj.parent;
        }
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // --- 5. Reconstruction & Update Loop ---
    // Instead of completely clearing and reloading, we check changes or do a clean build on dependency change.
    // Given the lightweight setup, a clean rebuild of layout meshes is extremely fast for standard rooms.
    const rebuild3DScene = () => {
      const { walls: currentWalls, modules: currentModules, selectedId: activeSelectedId } = stateRef.current;

      // --- Clear existing meshes ---
      while(floorGroup.children.length > 0) floorGroup.remove(floorGroup.children[0]);
      while(wallsGroup.children.length > 0) wallsGroup.remove(wallsGroup.children[0]);
      while(modulesGroup.children.length > 0) modulesGroup.remove(modulesGroup.children[0]);

      // --- A. Build Slab Floors ---
      // We will render a base ground floor plate at Y = 0
      const floorGeo = new THREE.PlaneGeometry(8000, 8000);
      const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x0f172a, 
        roughness: 0.8,
        metalness: 0.1
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(1500, -2, 1500);
      floorMesh.receiveShadow = true;
      floorGroup.add(floorMesh);

      // --- B. Build Extruded Walls ---
      currentWalls.forEach(wall => {
        const dx = wall.end.x - wall.start.x;
        const dz = wall.end.y - wall.start.y;
        const length = Math.hypot(dx, dz);
        if (length === 0) return;

        const wallHeight = wall.heightMm || 2900;
        const wallThickness = wall.thicknessMm || 150;
        const angle = Math.atan2(dz, dx);

        // Geometries
        const wallGeo = new THREE.BoxGeometry(length, wallHeight, wallThickness);
        const wallMat = new THREE.MeshStandardMaterial({
          color: 0x475569, // Slate gray
          roughness: 0.9,
          metalness: 0.1
        });
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        
        // Map 2D coordinate space (x, y) to 3D coordinate space (X, Y=Height, Z)
        const cx = (wall.start.x + wall.end.x) / 2;
        const cz = (wall.start.y + wall.end.y) / 2;
        wallMesh.position.set(cx, wallHeight / 2, cz);
        
        // SVG Y going down corresponds to Three.js Z going down
        wallMesh.rotation.y = -angle;
        wallMesh.receiveShadow = true;
        wallMesh.castShadow = true;

        wallsGroup.add(wallMesh);
      });

      // --- C. Build Placed Modules (Parametric Cabinets) ---
      currentModules.forEach(mod => {
        const isSelected = activeSelectedId === mod.moduleId;
        const { x, y, z = 0 } = mod.geometry.anchor;
        const { widthMm, heightMm, depthMm } = mod.geometry.size;
        const rotationDeg = mod.geometry.rotationDeg || 0;

        const modGroup = new THREE.Group();
        modGroup.position.set(x, z + heightMm / 2, y);
        modGroup.rotation.y = -rotationDeg * Math.PI / 180;
        modGroup.userData = { moduleId: mod.moduleId };

        // Resolve every material slot from the module's assignments (not just shutter).
        const { materialsCatalog: currentCatalog, renderMode: currentMode } = stateRef.current;
        const slots = getSlotsForModuleType(mod.moduleType);
        const assignments = mod.materialAssignments || {};
        const matFor = (slot) => buildSlotMaterial(assignments[slot] || 'lam_1', currentCatalog, currentMode);

        // 1. Carcass Box (interior shell — uses the 'carcass' slot)
        const carcassGeo = new THREE.BoxGeometry(widthMm, heightMm, depthMm);
        const carcassMesh = new THREE.Mesh(carcassGeo, matFor('carcass'));
        carcassMesh.castShadow = true;
        carcassMesh.receiveShadow = true;
        modGroup.add(carcassMesh);

        // 2. Selection Outline Highlight (renders box frame if active)
        if (isSelected) {
          const helper = new THREE.BoxHelper(carcassMesh, 0xd4af37);
          helper.material.linewidth = 3;
          modGroup.add(helper);
        }

        // 3. Shutter Panel (front facade — uses the 'shutter' slot)
        const frontPanelGeo = new THREE.BoxGeometry(widthMm - 8, heightMm - 8, 12);
        const frontPanelMesh = new THREE.Mesh(frontPanelGeo, matFor('shutter'));
        frontPanelMesh.position.set(0, 0, depthMm / 2 + 6);
        frontPanelMesh.castShadow = true;
        modGroup.add(frontPanelMesh);

        // 4. Countertop slab (kitchen units) — uses the 'countertop' slot
        if (slots.includes('countertop')) {
          const topGeo = new THREE.BoxGeometry(widthMm + 20, 40, depthMm + 20);
          const topMesh = new THREE.Mesh(topGeo, matFor('countertop'));
          topMesh.position.set(0, heightMm / 2 + 20, 0);
          topMesh.castShadow = true;
          topMesh.receiveShadow = true;
          modGroup.add(topMesh);
        }

        // 5. Back panel (TV units / mandir) — uses the 'backPanel' slot
        if (slots.includes('backPanel')) {
          const backGeo = new THREE.BoxGeometry(widthMm - 8, heightMm - 8, 8);
          const backMesh = new THREE.Mesh(backGeo, matFor('backPanel'));
          backMesh.position.set(0, 0, -depthMm / 2 - 4);
          backMesh.receiveShadow = true;
          modGroup.add(backMesh);
        }

        // 6. Handle fitting bar (always present)
        const handleGeo = new THREE.BoxGeometry(widthMm * 0.35, 10, 15);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xcca43b, metalness: 0.9, roughness: 0.2 });
        const handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.position.set(0, heightMm * 0.3, depthMm / 2 + 15);
        modGroup.add(handleMesh);

        modulesGroup.add(modGroup);
      });
    };

    // Store rebuild helper in ref to trigger it reactively on state updates
    rebuildRef.current = rebuild3DScene;

    // Initialize 3D layout representation
    rebuild3DScene();

    // Trigger rebuilds when values update in store
    const unsubscribe = useEditorStore.subscribe(
      (state) => {
        rebuild3DScene();
      }
    );

    // --- 6. Animation Render Loop ---
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- 7. Resize Observer ---
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 8. Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Re-run builder when rendering mode changes
  useEffect(() => {
    if (rebuildRef.current) {
      rebuildRef.current();
    }
  }, [renderMode]);

  const handleSendToRender = () => {
    // Collect active scene module metrics to pre-fill parameters
    const prefill = {
      room: activeRoomId === 'room_1' ? 'kitchen' : 'living',
      style: 'modern-luxury',
      budgetTier: 'premium',
      customInstruction: `Procedural Three.js Scene: Extruded partitions with dynamic catalog finishes (Total modules placed: ${modules.length}).`
    };
    localStorage.setItem('prefill_render_params', JSON.stringify(prefill));
    
    // Dispatch event to app layout to switch tab
    const event = new CustomEvent('navigate-to-tab', { detail: 'renders' });
    window.dispatchEvent(event);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#080c14] border border-slate-800 rounded-2xl">
      {/* 3D WebGL Canvas Target */}
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Visualizer Legend Overlay */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={handleSendToRender}
          className="bg-gradient-to-r from-[#C9A84C] to-[#AA8C2C] hover:from-[#e5bd3d] hover:to-[#bfa032] text-slate-950 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-[#C9A84C]/10"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Send to Render Studio
        </button>
        <div className="bg-slate-900/90 border border-slate-800/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg text-[9px] font-bold text-slate-400 tracking-wider uppercase">
          <span>3D Parametric Viewport</span>
        </div>
      </div>

      {/* Render Mode Toggle Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 border border-slate-800/80 p-1 rounded-xl flex gap-1 shadow-lg">
        <button
          onClick={() => setRenderMode('solid')}
          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition ${
            renderMode === 'solid' 
              ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/35 text-[#C9A84C]' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          🎨 Solid
        </button>
        <button
          onClick={() => setRenderMode('textures')}
          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition ${
            renderMode === 'textures' 
              ? 'bg-[#C9A84C]/15 border border-[#C9A84C]/35 text-[#C9A84C]' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          🪵 Textured
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/80 border border-slate-850 px-2.5 py-1.5 rounded-lg text-[8px] text-[#8A8899] font-bold font-mono">
        DRAG TO ROTATE · CTRL+DRAG TO PAN · SCROLL TO ZOOM
      </div>
    </div>
  );
}
