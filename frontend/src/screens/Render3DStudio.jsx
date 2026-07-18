import { apiUrl, getApiBase, backendAssetSrc } from '../utils/api.js';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { 
  Compass, Code, Clipboard, Download, CheckCircle2, 
  ArrowRight, FileText, Layout, Info, Sparkles, Image as ImageIcon,
  RefreshCw, MessageSquare, Plus, AlertTriangle, XCircle, CheckCircle, Trash2, Eye, ShieldAlert,
  Palette, Play, Pause, SkipForward, Gauge
} from 'lucide-react';
import TvUnitGenerator from './TvUnitGenerator';
import Viewer360 from '../components/design3d/Viewer360';

const roomOptions = [
  { id: 'living', label: 'Grand Living Area' },
  { id: 'kitchen', label: 'Modular Kitchen' },
  { id: 'bedroom', label: 'Master Suite' },
  { id: 'pooja', label: 'Pooja Room' },
  { id: 'foyer', label: 'Foyer Entrance' }
];

const styleOptions = [
  { value: 'modern-luxury', label: 'Modern Luxury' },
  { value: 'bohemian-chic', label: 'Boho Chic' },
  { value: 'scandinavian-minimal', label: 'Scandi Minimal' },
  { value: 'indian-contemporary', label: 'Indian Contemporary' },
  { value: 'japandi-fusion', label: 'Japandi Fusion' },
  { value: 'industrial-rustic', label: 'Industrial Rustic' }
];

const vastuRules = {
  kitchen: {
    ideal: ['SE', 'NW'],
    names: ['South-East (Agni)', 'North-West (Vayu)'],
    rule: 'Stove should face East. Avoid placing Kitchen in North-East (water element) or South-West.'
  },
  masterBed: {
    ideal: ['SW'],
    names: ['South-West (Stability)'],
    rule: 'Master Bed headboard must face South or East. Avoid North-East beds which disturb sleep.'
  },
  living: {
    ideal: ['N', 'E', 'NE'],
    names: ['North (Wealth)', 'East (Social)', 'North-East (Spiritual)'],
    rule: 'Heavier sofas and consoles should occupy South/West. Keep North/East center light and airy.'
  },
  pooja: {
    ideal: ['NE'],
    names: ['North-East (Pure energy)'],
    rule: 'Mandir should occupy the pure North-East corner. Deities face East or West. Do not share toilet walls.'
  },
  foyer: {
    ideal: ['N', 'E'],
    names: ['North (Wealth entry)', 'East (Prosperity entry)'],
    rule: 'Foyers must be clean and well-lit to welcome positive energy streams.'
  }
};

function WalkthroughWorkspace({ projectId, cadDrawing, selectedLaminates, onLaminateChange, selectedRoomId, onSelectRoom }) {
  // Working walkthrough: smooth transitions, hotspots, 360 view, room queue playback
  const [activeRoomId, setActiveRoomId] = useState(selectedRoomId || (cadDrawing?.rooms_json ? JSON.parse(cadDrawing.rooms_json)[0]?.id : ''));
  const [isPlaying, setIsPlaying] = useState(false);
  const [dwellMs, setDwellMs] = useState(4000);
  const [speed, setSpeed] = useState(1);
  const [roomQueue, setRoomQueue] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [panoramaUrl, setPanoramaUrl] = useState(null);
  const [show360, setShow360] = useState(false);
  const [generating360, setGenerating360] = useState(false);
  const [cameraPos, setCameraPos] = useState({ x: 0, z: 0 });
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frameIdRef = useRef(null);
  const dragRef = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (Array.isArray(cadDrawing?.rooms_json)) {
      setRoomQueue(JSON.parse(cadDrawing.rooms_json).slice(0, 20));
    }
  }, [cadDrawing]);

  useEffect(() => {
    if (!activeRoomId) return;
    const rooms = JSON.parse(cadDrawing?.rooms_json || '[]');
    const room = rooms.find((r) => r.id === activeRoomId);
    if (room && mountRef.current) {
      const ppm = cadDrawing?.pixels_per_meter || 40;
      const x = room.x / ppm;
      const z = room.y / ppm;
      setCameraPos({ x, z });
    }
    onSelectRoom && onSelectRoom(activeRoomId);
  }, [activeRoomId, cadDrawing, onSelectRoom]);

  useEffect(() => {
    if (!mountRef.current || !activeRoomId) return;
    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c111d);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(cameraPos.x, 1.6, cameraPos.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const ceilingLight = new THREE.PointLight(0xfff7e6, 1.2, 30);
    ceilingLight.position.set(cameraPos.x, 2.6, cameraPos.z);
    scene.add(ceilingLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 2.7;
    scene.add(ceiling);

    const walls = JSON.parse(cadDrawing?.walls_json || '[]');
    const openings = JSON.parse(cadDrawing?.openings_json || '[]');
    const furniture = JSON.parse(cadDrawing?.furniture_json || '[]');
    const ppm = cadDrawing?.pixels_per_meter || 40;
    let yaw = Math.PI;
    let pitch = 0;

    walls.forEach((w) => {
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const length = Math.hypot(dx, dy) / ppm;
      if (!length) return;
      const geo = new THREE.BoxGeometry(length, 2.7, 0.15);
      const mat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((w.x1 + w.x2) / 2 / ppm, 1.35, (w.y1 + w.y2) / 2 / ppm);
      mesh.rotation.y = -Math.atan2(dy, dx);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      scene.add(mesh);
    });

    openings.forEach((op) => {
      const geo = new THREE.PlaneGeometry(0.9, 1.8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(op.x / ppm, 0.9, op.y / ppm);
      scene.add(mesh);
    });

    const activeLaminate = selectedLaminates?.find((l) => l.type === 'shutter_facade')?.color || '#a1a1aa';
    const carcassLaminate = selectedLaminates?.find((l) => l.type === 'carcass')?.color || '#7c6f5b';
    const countertopLaminate = selectedLaminates?.find((l) => l.type === 'countertop')?.color || '#e5e5e5';

    const getMaterial = (furnitureType, finishType) => {
      if (finishType === 'carcass') return { color: carcassLaminate, roughness: 0.7, metalness: 0.05 };
      if (finishType === 'countertop') return { color: countertopLaminate, roughness: 0.2, metalness: 0.3 };
      return { color: activeLaminate, roughness: 0.5, metalness: 0.1 };
    };

    furniture.forEach((f) => {
      const widthM = (f.w || f.width || 600) / ppm;
      const depthM = (f.d || f.height || 600) / ppm;
      const heightM = f.type === 'wardrobe' ? 2.2 : f.type === 'bed' ? 0.6 : f.type === 'counter' ? 0.85 : 0.75;
      const baseMaterial = getMaterial(f.type, 'shutter_facade');
      const geo = new THREE.BoxGeometry(widthM, heightM, depthM);
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(baseMaterial.color), roughness: baseMaterial.roughness, metalness: baseMaterial.metalness });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(f.x / ppm, heightM / 2, f.y / ppm);
      mesh.rotation.y = -(f.rotation || 0) * Math.PI / 180;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: f.id, name: f.name, type: f.type, finishTarget: 'shutter_facade' };
      scene.add(mesh);
    });

    const hotspots = [
      { x: cameraPos.x + 1.2, z: cameraPos.z, label: 'Main Sofa', icon: '🛋️', type: 'furniture', action: 'sofa' },
      { x: cameraPos.x - 1.5, z: cameraPos.z + 0.5, label: 'Feature Wall', icon: '🖼️', type: 'design', action: 'wall' },
      { x: cameraPos.x, z: cameraPos.z - 1.8, label: 'Focus Light', icon: '💡', type: 'lighting', action: 'light' }
    ];
    hotspots.forEach((pt) => {
      const geo = new THREE.SphereGeometry(0.12, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ color: 0xD4AF37 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pt.x, 1.4, pt.z);
      mesh.userData = { hotspot: true, label: pt.label, action: pt.action, type: pt.type };
      scene.add(mesh);
    });

    const onMouseDown = (e) => { dragRef.current = true; prevMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      yaw -= (e.clientX - prevMouse.current.x) * 0.004;
      pitch -= (e.clientY - prevMouse.current.y) * 0.004;
      pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { dragRef.current = false; };
    const onClick = (e) => {
      if (dragRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, false);
      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData?.hotspot) { setSelectedHotspot(obj.userData); return; }
      }
      setSelectedHotspot(null);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('mouseleave', onMouseUp);
    dom.addEventListener('click', onClick);
    dom.addEventListener('touchstart', (e) => { dragRef.current = true; prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
    dom.addEventListener('touchmove', (e) => { if (dragRef.current && e.touches.length === 1) { yaw -= (e.touches[0].clientX - prevMouse.current.x) * 0.005; pitch -= (e.touches[0].clientY - prevMouse.current.y) * 0.005; pitch = Math.max(-1.2, Math.min(1.2, pitch)); prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } }, { passive: true });
    dom.addEventListener('touchend', (e) => { const t = e.changedTouches[0]; if (t) { const rect = renderer.domElement.getBoundingClientRect(); const mouse = new THREE.Vector2(((t.clientX - rect.left) / rect.width) * 2 - 1, -((t.clientY - rect.top) / rect.height) * 2 + 1); const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(mouse, camera); const hits = raycaster.intersectObjects(scene.children, false); const hit = hits.find(h => h.object.userData?.hotspot); if (hit) setSelectedHotspot(hit.object.userData); else setSelectedHotspot(null); } dragRef.current = false; });

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const target = new THREE.Vector3(camera.position.x + 10 * Math.sin(yaw) * Math.cos(pitch), camera.position.y + 10 * Math.sin(pitch), camera.position.z + 10 * Math.cos(yaw) * Math.cos(pitch));
      camera.lookAt(target);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = (mountRef.current.clientWidth || 800) / (mountRef.current.clientHeight || 600);
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth || 800, mountRef.current.clientHeight || 600);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', onResize);
      ['mousedown','mousemove','mouseup','mouseleave','click','touchstart','touchmove','touchend'].forEach(ev => dom.removeEventListener(ev, (() => {})));
      if (mountRef.current && dom.parentNode === mountRef.current) mountRef.current.removeChild(dom);
      renderer.dispose();
    };
  }, [activeRoomId, walls, openings, furniture, rooms, ppm, selectedLaminates, cameraPos]);

  useEffect(() => {
    if (!isPlaying) return;
    const rooms = JSON.parse(cadDrawing?.rooms_json || '[]').slice(0, 20);
    if (!rooms.length) return;
    const idx = rooms.findIndex((r) => r.id === activeRoomId);
    const next = rooms[idx + 1]?.id || rooms[0].id;
    const timer = setInterval(() => setActiveRoomId(next), dwellMs / speed);
    return () => clearInterval(timer);
  }, [isPlaying, dwellMs, speed, activeRoomId, cadDrawing]);

  const handleGenerate360 = async () => {
    try {
      setGenerating360(true);
      setPanoramaUrl(null);
      const res = await fetch(`${API_BASE}/projects/${projectId}/walkthrough/360`, { method: 'POST' });
      const data = await res.json();
      if (data?.panoramaUrl) setPanoramaUrl(data.panoramaUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating360(false);
    }
  };

  const rooms = JSON.parse(cadDrawing?.rooms_json || '[]');
  const currentRoom = roomQueue.find((r) => r.id === activeRoomId);

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-950 rounded-xl overflow-hidden min-h-[500px]">
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center z-10 shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Room Walkthrough:</span>
          <select value={activeRoomId} onChange={(e) => { setActiveRoomId(e.target.value); setSelectedHotspot(null); }} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
            {rooms.map((r) => (<option key={r.id} value={r.id}>{r.label || r.name || r.id}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Walkthrough playback">
          <button onClick={() => { setIsPlaying((p) => !p); setSelectedHotspot(null); }} className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:border-[#D4AF37] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]">
            {isPlaying ? <><Pause className="w-3.5 h-3.5 inline mr-1"/>Pause</> : <><Play className="w-3.5 h-3.5 inline mr-1"/>Play Tour</>}
          </button>
          <button onClick={() => setSpeed((s) => (s === 1 ? 0.5 : s === 0.5 ? 2 : 1))} className="text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition">{speed}x</button>
          <button onClick={() => setDwellMs((d) => Math.max(1000, d + 1000))} className="text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition">Slower</button>
          <button onClick={() => setDwellMs((d) => Math.max(1000, d - 1000))} className="text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition">Faster</button>
          <button onClick={handleGenerate360} className="text-[9px] font-black uppercase tracking-wider bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/20 px-2 py-1 rounded-lg transition">{generating360 ? 'Generating...' : '360 View'}</button>
          <button onClick={() => { setIsPlaying(false); setActiveRoomId(roomQueue[0]?.id || ''); setSelectedHotspot(null); }} className="text-[9px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition">End</button>
        </div>
      </div>
      <div className="px-3 pt-2 pb-1 bg-slate-900/60 border-b border-slate-800 shrink-0 flex gap-2 overflow-x-auto" role="listbox" aria-label="Room walkthrough queue">
        {rooms.map((r) => (
          <button key={r.id} onClick={() => { setActiveRoomId(r.id); setSelectedHotspot(null); }} role="option" aria-selected={r.id === activeRoomId} className={`px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-wide transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${r.id === activeRoomId ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}>
            <SkipForward className="w-3 h-3 inline mr-1" aria-hidden="true"/>{r.label || r.name || r.id}
          </button>
        ))}
        {!rooms.length && <span className="text-[10px] text-slate-500 italic" role="status">No rooms in queue.</span>}
      </div>
      <div ref={mountRef} className="flex-grow w-full relative min-h-0 cursor-move">
        <div className="absolute top-3 right-3 bg-slate-900/80 border border-slate-850 px-2 py-1 rounded text-[9px] text-slate-300 font-mono pointer-events-none select-none z-10">
          {isPlaying ? 'TOURING' : 'PAUSED'} · {dwellMs / 1000}s/room · {rooms.length} ROOMS
        </div>
        {selectedHotspot && (
          <div className="absolute top-3 left-3 z-20 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl w-64 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">In-Room Detail</span>
              <button onClick={() => setSelectedHotspot(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
            </div>
            <div>
              <strong className="text-xs text-slate-200 block">{selectedHotspot.label}</strong>
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Type: {selectedHotspot.type}</span>
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Action: {selectedHotspot.action}</span>
            </div>
            <button onClick={() => { setShow360(true); setSelectedHotspot(null); }} className="w-full py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-[#D4AF37]/20 transition">View This Spot in 360</button>
          </div>
        )}
      </div>
      {show360 && (
        <div className="absolute inset-0 z-30 bg-black/90">
          <Viewer360 equirectImage={panoramaUrl} onClose={() => { setShow360(false); setPanoramaUrl(null); }} />
          {!panoramaUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={handleGenerate360} className="bg-[#D4AF37] text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase">{generating360 ? 'Generating...' : 'Generate 360 View'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Render3DStudio({ projectId, onComplete }) {
  const [project, setProject] = useState(null);
  const [brief, setBrief] = useState(null);
  const [sketchupScript, setSketchupScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [cadDrawing, setCadDrawing] = useState(null);
  const [selectedLaminates, setSelectedLaminates] = useState([]);
  const [activeTab3D, setActiveTab3D] = useState('renders'); // 'renders' or 'walkthrough'

  const handleWalkthroughLaminateChange = async (name, code, color, componentType = 'shutter_facade') => {
    try {
      const updatedLaminates = selectedLaminates.filter(l => l.type !== componentType);
      updatedLaminates.push({ type: componentType, name, code, color, updatedAt: new Date().toISOString() });

      const res = await fetch(`${API_BASE}/projects/${projectId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laminates: updatedLaminates,
          hardware: [],
          notes: 'Walkthrough custom finish update'
        })
      });
      if (res.ok) {
        setSelectedLaminates(updatedLaminates);
        loadCADAndMaterials();
        loadProjectData();
        setStatus(`Laminate updated: ${name} on ${componentType.replace(/_/g, ' ')}.`, 'success');
      }
    } catch (err) {
      console.error("Error saving walkthrough materials:", err);
      setStatus('Failed to save laminate change.', 'error');
    }
  };
  
  // AI Image Generation states
  const [rendersList, setRendersList] = useState([]);
  const [selectedRender, setSelectedRender] = useState(null);
  const [targetRoom, setTargetRoom] = useState('living');
  const [style, setStyle] = useState('modern-luxury');
  const [budgetTier, setBudgetTier] = useState('premium');
  const [modelTier, setModelTier] = useState('precision');
  const [spendMode, setSpendMode] = useState('smart-cost');
  const [cameraAngle, setCameraAngle] = useState('diagonal');
  const [variantCount, setVariantCount] = useState(1);
  const [renderMode, setRenderMode] = useState('new-interior'); // new-interior | photo-to-render | renovation
  const [sourceType, setSourceType] = useState('ai'); // ai | library-reuse | camera-capture | manual
  const [removePeople, setRemovePeople] = useState(true);
  const [furnitureRequirement, setFurnitureRequirement] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [revisionCount, setRevisionCount] = useState(0);
  const [iterations, setIterations] = useState([]);
  const [cameraFile, setCameraFile] = useState(null);

  // Recolor & Color Swap States
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [activeColor, setActiveColor] = useState(null);
  const [colorSuggestions, setColorSuggestions] = useState([]);

  // AI Laminate Swapper States
  const [isAnalyzingComponents, setIsAnalyzingComponents] = useState(false);
  const [detectedComponents, setDetectedComponents] = useState([]);
  const [selectedSwapComponent, setSelectedSwapComponent] = useState(null);
  const [customLaminateFile, setCustomLaminateFile] = useState(null);
  const [customLaminatePreview, setCustomLaminatePreview] = useState(null);
  const [catalogMaterials, setCatalogMaterials] = useState([]);
  const [selectedCatalogMaterial, setSelectedCatalogMaterial] = useState(null);
  const [materialSelectTab, setMaterialSelectTab] = useState('laminate'); // 'laminate' or 'paint'
  const [laminateSwapInstruction, setLaminateSwapInstruction] = useState('');
  const [isSwappingLaminate, setIsSwappingLaminate] = useState(false);
  const [swapperStepMessage, setSwapperStepMessage] = useState('');
  const [beforeAfterMode, setBeforeAfterMode] = useState(false);
  const [previousRenderForCompare, setPreviousRenderForCompare] = useState(null);
  const [laminateHistory, setLaminateHistory] = useState([]);
  const [savedLaminateSnapshots, setSavedLaminateSnapshots] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('success');
  const [swapperStepIndex, setSwapperStepIndex] = useState(0);

  const setStatus = useCallback((message, type = 'success') => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);

  // Generation state for clearer UX
  const [generationLabel, setGenerationLabel] = useState('Generate Renders');
  const editorControllerRef = useRef(null);

  const renderPresets = [
    {
      id: 'preset-3bhk-living',
      label: '3BHK Living',
      room: 'living',
      style: 'indian-contemporary',
      cameraAngle: 'wide',
      prompt: 'Spacious 3BHK living area with sheesham wood TV unit, marble flooring, warm jacquard sofa set, and ambient mood lighting.'
    },
    {
      id: 'preset-modular-kitchen',
      label: 'Modular Kitchen',
      room: 'kitchen',
      style: 'modern-luxury',
      cameraAngle: 'diagonal',
      prompt: 'Straight modular kitchen with quartz countertop, chimney, hob, soft-close shutters, textured backsplash and pendant lights.'
    },
    {
      id: 'preset-master-bedroom',
      label: 'Master Bedroom',
      room: 'masterBed',
      style: 'scandinavian-minimal',
      cameraAngle: 'diagonal',
      prompt: 'Serene master bedroom with king-size upholstered bed, walnut wardrobe, bedside tables, layered rugs and warm reading lights.'
    },
    {
      id: 'preset-pooja-room',
      label: 'Pooja Room',
      room: 'pooja',
      style: 'indian-contemporary',
      cameraAngle: 'elevation',
      prompt: 'Sacred Pooja room with marble backdrop, wooden jali doors, brass accents, acoustic panels, LED wall niches and calm lighting.'
    },
    {
      id: 'preset-foyer',
      label: 'Foyer',
      room: 'foyer',
      style: 'bohemian-chic',
      cameraAngle: 'diagonal',
      prompt: 'Welcoming foyer with shoe rack, statement feature wall, console table with artefacts, ambient cove lighting and vitrified tile flooring.'
    }
  ];

  const applyPreset = (preset) => {
    setTargetRoom(preset.room);
    setStyle(preset.style);
    setCameraAngle(preset.cameraAngle);
    setFurnitureRequirement(preset.prompt);
    setStatus(`Preset applied: ${preset.label}.`, 'success');
  };

  const getComponentsForRoom = (roomType) => {
    const list = {
      kitchen: [
        { id: 'Cabinet Shutters', label: 'Cabinet Shutters' },
        { id: 'Carcass Laminate', label: 'Carcass Box' },
        { id: 'Countertop Stone', label: 'Countertop' },
        { id: 'Backsplash Tile', label: 'Backsplash' }
      ],
      living: [
        { id: 'Sofa Fabric', label: 'Sofa Fabric' },
        { id: 'TV Backdrop', label: 'TV Backdrop' },
        { id: 'TV Console Cabinet', label: 'TV Console' },
        { id: 'Wall Paint', label: 'Wall Paint' }
      ],
      bedroom: [
        { id: 'Wardrobe Shutters', label: 'Wardrobe Doors' },
        { id: 'Bed Headboard Fabric', label: 'Bed Headboard' },
        { id: 'Side Tables', label: 'Side Tables' },
        { id: 'Wall Paint', label: 'Wall Paint' }
      ],
      masterBed: [
        { id: 'Wardrobe Shutters', label: 'Wardrobe Doors' },
        { id: 'Bed Headboard Fabric', label: 'Bed Headboard' },
        { id: 'Side Tables', label: 'Side Tables' },
        { id: 'Wall Paint', label: 'Wall Paint' }
      ],
      pooja: [
        { id: 'Mandir Jali', label: 'Wooden Jali' },
        { id: 'Marble Backdrop', label: 'Marble Back' },
        { id: 'Wall Paint', label: 'Wall Paint' }
      ],
      foyer: [
        { id: 'Shoe Rack Shutter', label: 'Shoe Cabinet' },
        { id: 'Accent Rafters', label: 'Accent Rafters' },
        { id: 'Wall Paint', label: 'Wall Paint' }
      ]
    };
    return list[roomType] || list.living;
  };

  const getPaletteForComponent = (comp) => {
    if (comp?.includes('Sofa') || comp?.includes('Fabric') || comp?.includes('Headboard')) {
      return [
        { name: 'Beige', hex: '#d4c5b2' }, { name: 'Charcoal', hex: '#2d2d2d' },
        { name: 'Navy Blue', hex: '#1e4d6e' }, { name: 'Teal Green', hex: '#008080' },
        { name: 'Terracotta', hex: '#c17e3a' }, { name: 'Mustard', hex: '#d4a017' },
        { name: 'Sage Green', hex: '#a8b8a0' }, { name: 'Blush Pink', hex: '#e8c4b8' }
      ];
    }
    return [
      { name: 'Natural Walnut', hex: '#8b6f47' }, { name: 'Pure White', hex: '#f5f5f0' },
      { name: 'Dark Walnut', hex: '#5c3a1e' }, { name: 'Warm Oak', hex: '#c4b49d' },
      { name: 'Charcoal Grey', hex: '#4a4a4a' }, { name: 'Teak Wood', hex: '#8b7a60' },
      { name: 'Metallic Brass', hex: '#b39556' }, { name: 'Slate Grey', hex: '#708090' }
    ];
  };

  const handleColorChange = async (componentType, colorName, colorHex) => {
    if (!selectedRender) return;
    setActiveColor(colorName);
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/renders/change-color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          renderId: selectedRender.id,
          variantKey: 'default',
          componentType,
          newColor: colorName,
          roomType: selectedRender.room || targetRoom
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`Instant Recolor: ${componentType} → ${colorName}.`);
        if (data.suggestions) {
          setColorSuggestions(data.suggestions);
        }
      } else {
        setStatus('Recolor failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error("Recolor failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const roomChoices = useMemo(() => {
    if (!brief || !brief.selectedSpaces || brief.selectedSpaces.length === 0) {
      return [
        { id: 'living', label: 'Grand Living Area' },
        { id: 'kitchen', label: 'Modular Kitchen' },
        { id: 'masterBed', label: 'Master Suite' }
      ];
    }
    const labelMap = {
      living: 'Grand Living Area',
      kitchen: 'Modular Kitchen',
      masterBed: 'Master Suite',
      kidsBed: 'Kids Bedroom',
      pooja: 'Pooja Room',
      foyer: 'Foyer Entrance'
    };
    return brief.selectedSpaces.map(id => ({
      id,
      label: labelMap[id] || id
    }));
  }, [brief]);

  useEffect(() => {
    if (roomChoices.length > 0 && !roomChoices.some(r => r.id === targetRoom)) {
      setTargetRoom(roomChoices[0].id);
    }
  }, [roomChoices]);
  
  // Rules states
  const [kitchenRules, setKitchenRules] = useState({
    hobSinkSwapped: false,
    chimneyOverHob: true,
    loftAligned: true,
    uniformLoftHeight: true
  });
  const [livingRules, setLivingRules] = useState({
    concealedRafterDoors: true,
    raftersEndFirstDoor: true,
    backPanelMaterial: 'marble',
    sofaShape: 'L-shaped'
  });

  // Upload slots files
  const [uploads, setUploads] = useState({
    sitePhoto: null,
    stylePhoto: null,
    zoomedFloorPlan: null,
    fullFloorPlan: null
  });

  // Review & Mistake logs states
  const [reviewNote, setReviewNote] = useState('');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [isMistakeModalOpen, setIsMistakeModalOpen] = useState(false);
  const [mistakeDescription, setMistakeDescription] = useState('');
  const [mistakeCorrection, setMistakeCorrection] = useState('');
  const [correctionsList, setCorrectionsList] = useState([]);
  const [revisionRequest, setRevisionRequest] = useState('');
  const [providerStatus, setProviderStatus] = useState(null);

  const fetchProviderStatus = async () => {
    try {
      const base = apiUrl('');
      const res = await fetch(`${base}/providers/status`);
      const data = await res.json();
      setProviderStatus(data);
    } catch (err) {
      console.warn("Failed to load provider status:", err);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProjectData();
      loadCADAndMaterials();
      fetchRenders();
      loadCorrections();
      fetchProviderStatus();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadCorrections();
    }
  }, [targetRoom]);

  const loadProjectData = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`);
      const data = await res.json();
      setProject(data);
      if (data.client_brief_json) {
        const parsedBrief = JSON.parse(data.client_brief_json);
        setBrief(parsedBrief);
        if (parsedBrief.primaryStyle) setStyle(parsedBrief.primaryStyle);
        if (parsedBrief.budgetTier) setBudgetTier(parsedBrief.budgetTier);
        if (parsedBrief.notes && !furnitureRequirement) {
          setFurnitureRequirement(parsedBrief.notes.slice(0, 150));
        }
      }
    } catch (err) {
      console.error("Error loading project:", err);
    }
  };

  const handleRegenerateRenders = async () => {
    try {
      setStatus('Regenerating all renders…', 'loading');
      await fetch(`${API_BASE}/projects/${projectId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType: 'render_generation' })
      });
      setProject(prev => prev ? { ...prev, stale_renders: 0 } : null);
      setStatus('Render regeneration queued.', 'success');
    } catch (err) {
      console.error(err);
      setStatus('Regeneration failed.', 'error');
    }
  };

  const loadCADAndMaterials = async () => {
    try {
      const resCAD = await fetch(`${API_BASE}/projects/${projectId}/cad`);
      const drawing = await resCAD.json();
      setCadDrawing(drawing);

      const resMat = await fetch(`${API_BASE}/projects/${projectId}/materials`);
      const materials = await resMat.json();
      setSelectedLaminates(JSON.parse(materials.laminates_json || '[]'));

      generateRubyScript(drawing);
    } catch (err) {
      console.error("Error loading render assets:", err);
    }
  };

  const fetchRenders = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/renders`);
      const data = await res.json();
      setRendersList(data);
      if (data.length > 0) {
        setSelectedRender(prev => data.find(r => r.id === prev?.id) || data[0]);
      }
    } catch (err) {
      console.error("Error loading renders list:", err);
    }
  };

  const loadCorrections = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/renders/mistakes?room=${targetRoom}`);
      const data = await res.json();
      setCorrectionsList(data.items || []);
    } catch (err) {
      console.error("Error loading corrections list:", err);
    }
  };

  const generateAIRender = async () => {
    if (isGenerating) {
      if (editorControllerRef.current) {
        editorControllerRef.current.abort();
        editorControllerRef.current = null;
      }
      setIsGenerating(false);
      setGenerationStatus('Generation cancelled');
      setGenerationLabel('Generate Renders');
      return;
    }
    setIsGenerating(true);
    setGenerationLabel('Cancel');
    setGenerationStatus('Generating...');
    editorControllerRef.current = new AbortController();
    try {
      const formData = new FormData();
      formData.append('room', targetRoom);
      formData.append('style', style);
      formData.append('budgetTier', budgetTier);
      formData.append('modelTier', modelTier);
      formData.append('spendMode', spendMode);
      formData.append('cameraAngle', cameraAngle);
      formData.append('variantCount', variantCount);
      formData.append('removePeople', String(removePeople));
      formData.append('furnitureRequirement', furnitureRequirement);
      formData.append('customInstruction', customInstruction);
      formData.append('renderMode', renderMode);
      formData.append('sourceType', cameraFile ? 'camera-capture' : 'generative');
      if (providerStatus?.activeLabel) formData.append('provider', providerStatus.activeLabel);
      if (providerStatus?.activeModel) formData.append('model', providerStatus.activeModel);
      if (providerStatus?.defaultProvider) formData.append('defaultProvider', providerStatus.defaultProvider);

      // Append kitchen rules
      formData.append('hobSinkSwapped', String(kitchenRules.hobSinkSwapped));
      formData.append('chimneyOverHob', String(kitchenRules.chimneyOverHob));
      formData.append('loftAligned', String(kitchenRules.loftAligned));
      formData.append('uniformLoftHeight', String(kitchenRules.uniformLoftHeight));

      // Append living rules
      formData.append('concealedRafterDoors', String(livingRules.concealedRafterDoors));
      formData.append('raftersEndFirstDoor', String(livingRules.raftersEndFirstDoor));
      formData.append('backPanelMaterial', livingRules.backPanelMaterial);
      formData.append('sofaShape', livingRules.sofaShape);

      // Append uploaded files
      Object.entries(uploads).forEach(([key, val]) => {
        if (val?.file) {
          formData.append(key, val.file);
        }
      });

      const res = await fetch(`${API_BASE}/projects/${projectId}/renders/generate`, {
        method: 'POST',
        body: formData,
        signal: editorControllerRef.current.signal
      });
      const data = await res.json();
      setGenerationStatus(data?.success ? 'Render complete.' : 'Render finished with issues.');
      if (data.success) {
        setStatus('Render generated.');
        await fetchRenders();
        if (data.render) {
          setSelectedRender(data.render);
        }
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        setGenerationStatus('Generation cancelled');
        setStatus('Generation cancelled.', 'warning');
      } else {
        console.error("AI Generation failed:", err);
        const msg = err?.message || 'Generation failed';
        setGenerationStatus('Generation failed');
        setStatus(`Generation failed: ${msg}`, 'error');
      }
    } finally {
      setIsGenerating(false);
      setGenerationLabel('Generate Renders');
      editorControllerRef.current = null;
    }
  };

  const handleEditRender = async () => {
    if (!selectedRender || !revisionRequest.trim()) return;
    if (isGenerating) {
      if (editorControllerRef.current) {
        editorControllerRef.current.abort();
        editorControllerRef.current = null;
      }
      setIsGenerating(false);
      setGenerationStatus('Edit cancelled');
      setGenerationLabel('Apply Edit');
      return;
    }
    setIsGenerating(true);
    setGenerationLabel('Cancel');
    setGenerationStatus('Applying edit...');
    editorControllerRef.current = new AbortController();
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/renders/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedRender.id,
          revisionRequest,
          renderMode,
          iterationNumber: revisionCount + 1
        }),
        signal: editorControllerRef.current.signal
      });
      const data = await res.json();
      setGenerationStatus(data?.success ? `Edit applied. Iteration ${revisionCount + 1}` : 'Edit finished with issues.');
      if (data.success) {
        setStatus(`Edit applied. Iteration ${revisionCount + 1}`);
        trackIteration(`Iteration ${revisionCount + 1}`, revisionRequest);
        setRevisionRequest('');
        await fetchRenders();
        if (data.render) {
          setSelectedRender(data.render);
        }
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        setGenerationStatus('Edit cancelled');
        setStatus('Edit cancelled.', 'warning');
      } else {
        console.error("AI Revision failed:", err);
        setGenerationStatus('Edit failed');
        setStatus('Edit failed.', 'error');
      }
    } finally {
      setIsGenerating(false);
      setGenerationLabel('Apply Edit');
      editorControllerRef.current = null;
    }
  };

  const handleReview = async (status) => {
    if (!selectedRender) return;
    setGenerationStatus(`Setting ${status}...`);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/renders/${selectedRender.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: reviewNote })
      });
      const data = await res.json();
      setGenerationStatus(data?.success ? `Marked as ${status}.` : 'Review update failed.');
      if (data.success) {
        setStatus(`Marked as ${status}.`);
        setReviewNote('');
        await fetchRenders();
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setGenerationStatus('Review failed');
      setStatus('Review failed.', 'error');
    }
  };

  const handleKeyboard = useCallback((e) => {
    if (!projectId) return;
    const tag = document.activeElement?.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      generateAIRender();
    }
    if (e.key.toLowerCase() === 'e' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleEditRender();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      setStatus('Save shortcut triggered.');
    }
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      handleReview('needs-revision');
    }
    if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      handleReview('approved');
    }
  }, [projectId, generateAIRender, handleEditRender]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  // Revision history trail for render iterations
  const revisionTrail = useMemo(() => {
    return iterations.slice(0, 8).map((it, idx) => ({
      id: it.id,
      label: it.label,
      preview: it.request?.slice(0, 40),
      time: it.time ? new Date(it.time).toLocaleTimeString() : ''
    }));
  }, [iterations]);

  const clearRevisionTrail = () => {
    setIterations([]);
    setRevisionCount(0);
  };

  const handleLogCorrection = async () => {
    if (!mistakeDescription.trim() || !mistakeCorrection.trim() || !selectedRender) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/renders/mistake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedRender.id,
          mistakeDescription,
          correction: mistakeCorrection
        })
      });
      const data = await res.json();
      if (data.success) {
        setMistakeDescription('');
        setMistakeCorrection('');
        setIsMistakeModalOpen(false);
        await loadCorrections();
        setStatus('Correction logged. SpaceTrace memory updated for future generations.');
      } else {
        setStatus(data.error || 'Failed to save correction.', 'error');
      }
    } catch (err) {
      console.error("Error saving correction:", err);
    }
  };

  const fetchCatalogMaterials = async () => {
    try {
      const base = apiUrl('');
      const res = await fetch(`${base}/material-catalog`);
      if (res.ok) {
        const data = await res.json();
        setCatalogMaterials(data);
      }
    } catch (err) {
      console.error("Error loading catalog materials:", err);
    }
  };

  const handleAnalyseComponents = async () => {
    if (!selectedRender) return;
    setIsAnalyzingComponents(true);
    try {
      // Fetch render image from server and convert to blob
      const imgUrl = backendAssetSrc(selectedRender.image_url) || selectedRender.image_url;

      const imgRes = await fetch(imgUrl);
      const imgBlob = await imgRes.blob();

      const formData = new FormData();
      formData.append('renderImage', imgBlob, 'render.png');
      formData.append('room', selectedRender.room || targetRoom);

      const res = await fetch(`${API_BASE}/projects/${projectId}/renders/analyse-components`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setDetectedComponents(data.components || []);
        if (data.components?.length > 0) {
          setSelectedSwapComponent(data.components[0].component);
        }
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      // Fallback: load standard defaults based on room type
      const defaults = {
        kitchen: ['Cabinet Shutters', 'Carcass Box', 'Countertop Stone', 'Backsplash Tile'],
        living: ['TV Backdrop Panel', 'TV Console Cabinet', 'Sofa Fabric', 'Wall Paint'],
        bedroom: ['Wardrobe Shutters', 'Bed Headboard', 'Wall Paint', 'Flooring']
      };
      const roomKey = selectedRender.room || targetRoom;
      const roomDefaults = (defaults[roomKey] || defaults.living).map(c => ({ component: c, confidence: 0.90, description: `Changeable ${c}` }));
      setDetectedComponents(roomDefaults);
      setSelectedSwapComponent(roomDefaults[0].component);
    } finally {
      setIsAnalyzingComponents(false);
    }
  };

  const handleLaminateSwap = async () => {
    if (!selectedRender || !selectedSwapComponent) return;
    setIsSwappingLaminate(true);
    setSwapperStepMessage('Preparing images and components...');

    try {
      setSwapperStepMessage('Downloading active render image...');
      setSwapperStepIndex(0);
      const imageUrl = backendAssetSrc(selectedRender.image_url) || selectedRender.image_url;
      const imageRes = await fetch(imageUrl);
      const imageBlob = await imageRes.blob();

      const formData = new FormData();
      formData.append('renderImage', imageBlob, 'render.png');
      formData.append('componentType', selectedSwapComponent);
      formData.append('room', selectedRender.room || targetRoom);
      setSwapperStepIndex(1);

      if (selectedCatalogMaterial) {
        setSwapperStepMessage('Attaching catalog material metadata...');
        const isPaint = selectedCatalogMaterial.category === 'paint' || materialSelectTab === 'paint';
        if (isPaint) {
          formData.append('paintCatalogId', selectedCatalogMaterial.id);
        } else {
          formData.append('laminateCatalogId', selectedCatalogMaterial.id);
        }
        formData.append('newMaterial', selectedCatalogMaterial.name);
        formData.append('newColor', selectedCatalogMaterial.color || '');
        formData.append('laminateCode', selectedCatalogMaterial.code || '');
        formData.append('laminateBrand', selectedCatalogMaterial.brand || '');
      } else if (customLaminateFile) {
        setSwapperStepMessage('Attaching custom swatch image...');
        setSwapperStepIndex(2);
        formData.append('newMaterial', 'Uploaded custom swatch');
        formData.append('laminateImage', customLaminateFile);
      } else {
        setStatus('Select a catalog material or upload a custom swatch first.', 'error');
        setIsSwappingLaminate(false);
        setSwapperStepIndex(0);
        return;
      }

      if (laminateSwapInstruction.trim()) {
        formData.append('instruction', laminateSwapInstruction);
      }

      setSwapperStepMessage('Running visual editor pipeline...');
      setSwapperStepIndex(2);
      const isPaint = selectedCatalogMaterial?.category === 'paint' || materialSelectTab === 'paint';
      const endpoint = isPaint
        ? `${API_BASE}/projects/${projectId}/renders/paint-swap`
        : `${API_BASE}/projects/${projectId}/renders/laminate-swap`;

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      setSwapperStepIndex(3);

      const data = await res.json();
      if (data.success && data.render) {
        setSwapperStepMessage('Finalizing swapped render...');
        setPreviousRenderForCompare(selectedRender);
        await fetchRenders();
        setSelectedRender(data.render);
        setBeforeAfterMode(true);
        setLaminateSwapInstruction('');
        setCustomLaminateFile(null);
        setCustomLaminatePreview(null);
        setSelectedCatalogMaterial(null);
        setStatus('Material swap finished. Showing before/after.');
      } else {
        setStatus(data.error || 'Material swap failed.', 'error');
      }
    } catch (err) {
      console.error("Laminate swap failed:", err);
      setStatus(`Material swap error: ${err.message}`, 'error');
    } finally {
      setIsSwappingLaminate(false);
      setSwapperStepMessage('');
      setSwapperStepIndex(0);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchCatalogMaterials();
    }
  }, [projectId]);

  const deleteCorrection = (id) => {
    setCorrectionsList(prev => prev.filter(c => c.id !== id));
  };

  const saveLaminateSnapshot = () => {
    const snapshot = {
      id: `lam-snap-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      laminates: [...selectedLaminates],
      renderId: selectedRender?.id || null,
      room: selectedRender?.room || targetRoom
    };
    setSavedLaminateSnapshots(prev => [snapshot, ...prev].slice(0, 20));
    setStatus('Laminate snapshot saved.', 'success');
  };

  const restoreLaminateSnapshot = (snapshot) => {
    setSelectedLaminates(snapshot.laminates);
    setStatus(`Restored snapshot from ${snapshot.createdAt}.`, 'success');
  };

  const exportLaminateSpec = () => {
    const lines = [
      'Laminate Specification',
      `Project: ${projectId || 'draft'}`,
      `Room: ${targetRoom}`,
      '',
      ...selectedLaminates.map(l => `- ${l.type}: ${l.name} | ${l.code} | ${l.color}`),
      '',
      `Total finishes: ${selectedLaminates.length}`
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laminate-spec-${projectId || 'draft'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Laminate specification exported.', 'success');
  };

  const generateRubyScript = (drawing) => {
    const walls = JSON.parse(drawing.walls_json || '[]');
    const furniture = JSON.parse(drawing.furniture_json || '[]');
    
    let script = `# ==========================================\n`;
    script += `# SpaceTrace AI - SketchUp Extrusion Adapter\n`;
    script += `# Copy and paste this script directly into \n`;
    script += `# Extensions -> Ruby Console in SketchUp\n`;
    script += `# ==========================================\n\n`;
    script += `model = Sketchup.active_model\n`;
    script += `entities = model.active_entities\n`;
    script += `model.start_operation('Draw Carcass layout', true)\n\n`;

    walls.forEach((w, idx) => {
      const x1 = (w.x1 / 10).toFixed(2);
      const y1 = (w.y1 / 10).toFixed(2);
      const x2 = (w.x2 / 10).toFixed(2);
      const y2 = (w.y2 / 10).toFixed(2);
      const t = (w.thickness / 10).toFixed(2);

      script += `# Drawing Wall Partition ${idx + 1}\n`;
      script += `pts = [[${x1}, ${y1}, 0], [${x2}, ${y2}, 0], [${x2}, ${(parseFloat(y2) + parseFloat(t)).toFixed(2)}, 0], [${x1}, ${(parseFloat(y1) + parseFloat(t)).toFixed(2)}, 0]]\n`;
      script += `face = entities.add_face(pts)\n`;
      script += `face.pushpull(-108) if face\n\n`;
    });

    furniture.forEach((f, idx) => {
      const fx = (f.x / 10).toFixed(2);
      const fy = (f.y / 10).toFixed(2);
      const fw = (f.width / 10).toFixed(2);
      const fh = (f.height / 10).toFixed(2);

      script += `# Placing Cabinet Box: ${f.name} [${idx + 1}]\n`;
      script += `pts = [\n`;
      script += `  [${fx} - ${fw}/2, ${fy} - ${fh}/2, 0],\n`;
      script += `  [${fx} + ${fw}/2, ${fy} - ${fh}/2, 0],\n`;
      script += `  [${fx} + ${fw}/2, ${fy} + ${fh}/2, 0],\n`;
      script += `  [${fx} - ${fw}/2, ${fy} + ${fh}/2, 0]\n`;
      script += `]\n`;
      script += `face = entities.add_face(pts)\n`;
      script += `face.pushpull(-32) if face\n\n`;
    });

    script += `model.commit_operation\n`;
    script += `UI.messagebox('SpaceTrace modular layout imported successfully!')\n`;

    setSketchupScript(script);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sketchupScript);
    setCopied(true);
    useAutoClear(copied ? true : false, setCopied, 2000, false);
  };

  const downloadScriptFile = () => {
    const blob = new Blob([sketchupScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project_${projectId}_sketchup.rb`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const approveRenders = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/renders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setStatus('3D Renders and SketchUp layout approved.');
        if (onComplete) onComplete();
      } else {
        setStatus(data.error || 'Approval failed.', 'error');
      }
    } catch (err) {
      console.error("Error approving renders:", err);
      setStatus('Unexpected error while approving renders.', 'error');
    }
  };

  // Vastu compliance calculations
  const vastuReport = useMemo(() => {
    if (!brief || !brief.rooms) {
      return { score: 90, reports: [] };
    }

    let score = 100;
    const reports = [];
    let assessedCount = 0;
    const strictness = brief.vastuStrictness || 'general';

    let deduction = 15;
    if (strictness === 'strict') deduction = 25;
    if (strictness === 'minimal') deduction = 5;

    brief.rooms.forEach(room => {
      // Map frontend brief type to Vastu rules key
      let ruleKey = null;
      if (room.type === 'kitchen') ruleKey = 'kitchen';
      else if (room.type === 'masterBed' || room.type === 'kidsBed') ruleKey = 'masterBed';
      else if (room.type === 'living') ruleKey = 'living';
      else if (room.type === 'pooja') ruleKey = 'pooja';
      else if (room.type === 'foyer') ruleKey = 'foyer';

      const rule = vastuRules[ruleKey];
      if (!rule) return;

      assessedCount++;
      const isIdeal = rule.ideal.includes(room.orientation?.toUpperCase());

      if (isIdeal) {
        reports.push({
          room: room.name,
          status: 'perfect',
          direction: room.orientation,
          title: `Ideal placement in ${room.orientation}`,
          message: `Compliant: ${rule.rule}`
        });
      } else {
        score -= deduction;
        reports.push({
          room: room.name,
          status: strictness === 'strict' ? 'critical' : 'warning',
          direction: room.orientation,
          title: strictness === 'strict' ? `CRITICAL Infraction in ${room.orientation}` : `Sub-optimal placement in ${room.orientation}`,
          message: `Vastu Tip: Relocate to ${rule.names[0]} if possible. Remedy: Place a copper pyramid helix in the corner.`
        });
      }
    });

    return {
      score: Math.max(0, score),
      reports
    };
  }, [brief]);

  const filteredRenders = useMemo(() => {
    return rendersList.filter(render => {
      if (reviewFilter === 'all') return true;
      if (reviewFilter === 'unreviewed') return !render.review_status || render.review_status === 'unreviewed';
      return render.review_status === reviewFilter;
    });
  }, [rendersList, reviewFilter]);

  const reviewCounts = useMemo(() => {
    return {
      all: rendersList.length,
      approved: rendersList.filter(r => r.review_status === 'approved').length,
      'needs-revision': rendersList.filter(r => r.review_status === 'needs-revision').length,
      unreviewed: rendersList.filter(r => !r.review_status || r.review_status === 'unreviewed').length,
      rejected: rendersList.filter(r => r.review_status === 'rejected').length
    };
  }, [rendersList]);

  // Site photo helpers
  const handlePhotoSelect = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      setUploads(prev => ({
        ...prev,
        [key]: {
          file: file,
          name: file.name,
          preview: URL.createObjectURL(file)
        }
      }));
    }
  };

  const clearUpload = (key) => {
    setUploads(prev => ({
      ...prev,
      [key]: null
    }));
  };

  const captureCameraPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setCameraFile(file);
        setUploads(prev => ({
          ...prev,
          sitePhoto: {
            file,
            name: file.name,
            preview: URL.createObjectURL(file)
          }
        }));
        setRenderMode('photo-to-render');
        setStatus('Camera photo captured for Photo-to-Render.', 'success');
      }
    };
    input.click();
  };

  const setRenovationMode = () => {
    setRenderMode('renovation');
    setStatus('Renovation mode: keep spatial layout, refresh materials/finishes.', 'success');
  };

  const setNewRenderMode = () => {
    setRenderMode('new-interior');
    setStatus('New interior mode selected.', 'success');
  };

  const trackIteration = (label, request) => {
    setIterations(prev => [
      { id: Date.now(), label, request, time: new Date().toISOString() },
      ...prev
    ].slice(0, 20));
    setRevisionCount(prev => prev + 1);
  };

  const projectIso = (x, y, z = 0) => {
    const angle = 30 * Math.PI / 180;
    const isoX = 220 + (x - y) * Math.cos(angle) * 0.45;
    const isoY = 130 + (x + y) * Math.sin(angle) * 0.45 - z * 0.5;
    return { x: isoX, y: isoY };
  };

  const renderIsometricWalls = () => {
    if (!cadDrawing) return null;
    const walls = JSON.parse(cadDrawing.walls_json || '[]');
    const furniture = JSON.parse(cadDrawing.furniture_json || '[]');
    const height = 90;

    const fillLaminateColor = selectedLaminates.find(l => l.type === 'shutter_facade')?.color || '#AA8C2C';

    return (
      <g>
        <path 
          d={`M ${projectIso(-100, -100).x} ${projectIso(-100, -100).y} 
              L ${projectIso(600, -100).x} ${projectIso(600, -100).y} 
              L ${projectIso(600, 600).x} ${projectIso(600, 600).y} 
              L ${projectIso(-100, 600).x} ${projectIso(-100, 600).y} Z`} 
          fill="#080c14" stroke="#1f2937" strokeWidth="1"
        />

        {furniture.map((f) => {
          const x = f.x; const y = f.y; const w = f.width; const h = f.height;
          const zH = 30;

          const p1 = projectIso(x - w/2, y - h/2, 0);
          const p2 = projectIso(x + w/2, y - h/2, 0);
          const p3 = projectIso(x + w/2, y + h/2, 0);
          const p4 = projectIso(x - w/2, y + h/2, 0);

          const pt1 = projectIso(x - w/2, y - h/2, zH);
          const pt2 = projectIso(x + w/2, y - h/2, zH);
          const pt3 = projectIso(x + w/2, y + h/2, zH);
          const pt4 = projectIso(x - w/2, y + h/2, zH);

          return (
            <g key={f.id}>
              <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${pt2.x},${pt2.y} ${pt1.x},${pt1.y}`} fill="#3f3f46" fillOpacity="0.4" />
              <polygon points={`${p1.x},${p1.y} ${p4.x},${p4.y} ${pt4.x},${pt4.y} ${pt1.x},${pt1.y}`} fill={fillLaminateColor} fillOpacity="0.7" stroke="#1e293b" />
              <polygon points={`${p4.x},${p4.y} ${p3.x},${p3.y} ${pt3.x},${pt3.y} ${pt4.x},${pt4.y}`} fill={fillLaminateColor} stroke="#1e293b" />
              <polygon points={`${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y} ${pt4.x},${pt4.y}`} fill={fillLaminateColor} fillOpacity="0.8" stroke="#1e293b" />
            </g>
          );
        })}

        {walls.map(w => {
          const p1 = projectIso(w.x1, w.y1, 0);
          const p2 = projectIso(w.x2, w.y2, 0);
          const pt1 = projectIso(w.x1, w.y1, height);
          const pt2 = projectIso(w.x2, w.y2, height);

          return (
            <g key={w.id}>
              <polygon 
                points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${pt2.x},${pt2.y} ${pt1.x},${pt1.y}`} 
                fill="#27272a" stroke="#52525b" strokeWidth="1" fillOpacity="0.85"
              />
              <line x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y} stroke="#a1a1aa" strokeWidth="2.5" />
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {project?.stale_renders === 1 && (
        <div className="bg-amber-950/20 border-b border-amber-900/40 px-6 py-3 text-xs text-amber-400 flex items-center justify-between font-bold shrink-0">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
            Renders Out-of-Date: The underlying 2D/3D design layout or materials have changed. Visualizations may not match the active design.
          </span>
          <button 
            onClick={handleRegenerateRenders}
            className="bg-[#D4AF37] hover:bg-[#c49e2f] text-slate-950 px-3 py-1 rounded-lg font-black uppercase text-[10px] transition"
          >
            Regenerate Renders
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 overflow-y-auto h-full max-h-screen pb-24 select-none">

      {/* Status bar */}
      <div className="xl:col-span-4">
        {statusMessage && (
          <div className={`mb-3 border rounded-lg px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-2 ${
            statusType === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusType === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            {statusType === 'success' ? <CheckCircle2 className="w-4 h-4" /> : statusType === 'error' ? <XCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            {statusMessage}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5 h-[80vh] overflow-y-auto">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
          <Sparkles className="w-4.5 h-4.5" /> visualizer console
        </h2>

        {project && (
          <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-lg text-xs space-y-1">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Active Client Project</span>
            <strong className="text-slate-200 block text-sm">{project.client_name}</strong>
            <span className="text-slate-400 block">{project.name}</span>
          </div>
        )}

        {providerStatus && (
          <div className="bg-slate-950/50 border border-slate-850 p-2.5 rounded-lg text-[10px] text-slate-400 flex justify-between items-center shrink-0 gap-3">
            <span>IMAGE GENERATOR:</span>
            <div className="flex items-center gap-2">
              <strong className="text-[#D4AF37] uppercase font-bold font-mono">
                {providerStatus.activeLabel || 'mock'}
              </strong>
              <span className="text-[9px] text-slate-500 font-mono">
                {providerStatus.liveImageGenReady ? 'ready' : providerStatus.liveImageGenRequested ? 'requested' : 'draft'}
              </span>
            </div>
          </div>
        )}

        {/* Room selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Design Target Room</label>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
            {roomChoices.map(r => (
              <button
                key={r.id}
                onClick={() => setTargetRoom(r.id)}
                className={`py-2 px-1 rounded-lg border text-center transition ${
                  targetRoom === r.id
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Render presets */}
        <div className="space-y-2">
          <div className="screen-section-title text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>Render Presets</span>
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]/70" />
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-[10px] font-bold">
            {renderPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="py-2 px-3 rounded-lg border text-left bg-slate-950 border-slate-850 text-slate-300 hover:border-[#D4AF37] hover:text-[#D4AF37] transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model tuning params */}
        <div className="space-y-3">
          <div className="screen-section-title text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>Generation Parameters</span>
            <span className="text-[8px] text-slate-500 font-mono uppercase">Quick States</span>
          </div>
          <div className="flex gap-1.5 text-[9px] font-black uppercase">
            <button
              type="button"
              onClick={() => { setBudgetTier('premium'); setModelTier('precision'); setVariantCount(2); setRemovePeople(true); setStatus('Quick state: Premium active.'); }}
              className={`flex-1 py-1.5 rounded border transition ${budgetTier === 'premium' && modelTier === 'precision' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'}`}
            >
              Pro
            </button>
            <button
              type="button"
              onClick={() => { setBudgetTier('standard'); setModelTier('balanced'); setVariantCount(3); setRemovePeople(false); setStatus('Quick state: Balanced studio active.'); }}
              className={`flex-1 py-1.5 rounded border transition ${budgetTier === 'standard' && modelTier === 'balanced' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'}`}
            >
              Studio
            </button>
            <button
              type="button"
              onClick={() => { setBudgetTier('economy'); setModelTier('draft'); setVariantCount(1); setRemovePeople(true); setStatus('Quick state: Economy draft active.', 'success'); }}
              className={`flex-1 py-1.5 rounded border transition ${budgetTier === 'economy' && modelTier === 'draft' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'}`}
            >
              Draft
            </button>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-semibold block">Aesthetic Theme Direction</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-[#D4AF37] outline-none"
            >
              {styleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold block">Camera Angle</label>
              <select
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="diagonal">Diagonal Iso</option>
                <option value="elevation">Direct Wall Elevation</option>
                <option value="wide">Wide-Angle View</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold block">Variant Count</label>
              <select
                value={variantCount}
                onChange={(e) => setVariantCount(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="1">1 Variant</option>
                <option value="2">2 Variants</option>
                <option value="3">3 Variants</option>
                <option value="4">4 Variants</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold block">Spend Mode</label>
            <select
              value={spendMode}
              onChange={(e) => setSpendMode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
            >
              <option value="smart-cost">Smart Cost (Balance Reuse)</option>
              <option value="demo-saver">Demo Saver (Copied assets)</option>
              <option value="premium-quality">Premium Quality (New Renders)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-semibold block">Workflow Mode</label>
            <div className="grid grid-cols-3 gap-1.5 text-[9px] font-black uppercase">
              <button
                type="button"
                onClick={setNewRenderMode}
                className={`py-2 rounded-lg border transition text-center ${
                  renderMode === 'new-interior'
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                New Interior
              </button>
              <button
                type="button"
                onClick={() => captureCameraPhoto()}
                className={`py-2 rounded-lg border transition text-center ${
                  renderMode === 'photo-to-render'
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                Capture Photo
              </button>
              <button
                type="button"
                onClick={setRenovationMode}
                className={`py-2 rounded-lg border transition text-center ${
                  renderMode === 'renovation'
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                Renovation
              </button>
            </div>
            <div className="text-[9px] text-slate-500">
              {renderMode === 'new-interior' ? 'Generate a fresh room visualization.' : renderMode === 'photo-to-render' ? 'Use camera/site photo as source.' : 'Keep spatial layout, refresh finishes.'}
            </div>
          </div>
          <div className="flex gap-2 text-[10px] text-slate-400 items-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mr-1">Source</span>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
            >
              <option value="ai">AI Generate</option>
              <option value="library-reuse">Library Reuse</option>
              <option value="camera-capture">Camera Capture</option>
              <option value="manual">Manual Upload</option>
            </select>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={removePeople}
                onChange={(e) => setRemovePeople(e.target.checked)}
                className="accent-[#D4AF37] rounded"
              />
              Remove people
            </label>
            <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${modelTier === 'precision' ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>
              {modelTier} model
            </div>
            <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${budgetTier === 'premium' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-850 text-slate-500'}`}>
              {budgetTier} spend
            </div>
          </div>
        </div>

        {/* Room-specific structural rules checkboxes */}
        {targetRoom === 'kitchen' && (
          <div className="space-y-2 bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-[10px] text-slate-400">
            <span className="font-bold text-slate-300 block mb-1">Kitchen Correction Rules</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={kitchenRules.hobSinkSwapped} onChange={(e) => setKitchenRules({...kitchenRules, hobSinkSwapped: e.target.checked})} className="accent-[#D4AF37]" />
              Hob left, sink under window
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={kitchenRules.chimneyOverHob} onChange={(e) => setKitchenRules({...kitchenRules, chimneyOverHob: e.target.checked})} className="accent-[#D4AF37]" />
              Chimney directly over hob
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={kitchenRules.loftAligned} onChange={(e) => setKitchenRules({...kitchenRules, loftAligned: e.target.checked})} className="accent-[#D4AF37]" />
              Lofts stop at window trim
            </label>
          </div>
        )}

        {targetRoom === 'living' && (
          <div className="space-y-2.5 bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-xs text-slate-400">
            <span className="font-bold text-slate-300 block text-[10px] mb-1">TV Wall Specifications</span>
            <label className="block text-[10px]">
              Back panel material
              <select value={livingRules.backPanelMaterial} onChange={(e) => setLivingRules({...livingRules, backPanelMaterial: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 mt-1 outline-none text-slate-200">
                <option value="marble">Backlit marble feature</option>
                <option value="wood">Walnut veneer panels</option>
                <option value="quartz">Fluted quartz stone</option>
              </select>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[10px]">
              <input type="checkbox" checked={livingRules.concealedRafterDoors} onChange={(e) => setLivingRules({...livingRules, concealedRafterDoors: e.target.checked})} className="accent-[#D4AF37]" />
              Concealed partition doors
            </label>
          </div>
        )}

        {/* References upload slots */}
        <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-xs">
          <span className="text-[10px] font-bold text-slate-300 block mb-1">Photo & Floorplan Uploads</span>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-bold">
            {[
              { key: 'sitePhoto', label: 'Site Photo' },
              { key: 'stylePhoto', label: 'Style Ref' },
              { key: 'zoomedFloorPlan', label: 'Zoomed Plan' },
              { key: 'fullFloorPlan', label: 'Full Plan' }
            ].map(slot => (
              <div key={slot.key} className="relative group bg-slate-900 border border-slate-855 rounded-lg text-center">
                <label className="cursor-pointer block truncate py-1.5 px-1 hover:text-[#D4AF37] transition">
                  {uploads[slot.key] ? `✓ ${slot.label}` : `+ ${slot.label}`}
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => handlePhotoSelect(slot.key, e)} className="hidden" />
                </label>
                {uploads[slot.key] && (
                  <button 
                    type="button" 
                    onClick={() => clearUpload(slot.key)}
                    className="absolute -top-1 -right-1 bg-red-650 hover:bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold shadow"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic prompts and generator */}
        <div className="space-y-2.5 mt-auto shrink-0">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Exact Furniture Prompt</label>
          <textarea
            value={furnitureRequirement}
            onChange={(e) => setFurnitureRequirement(e.target.value)}
            rows="2.5"
            placeholder="Describe walnut louvers, marble counters, LED stripes, custom parameters..."
            className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-[#D4AF37] resize-none"
          />
          <textarea
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            rows="1.5"
            placeholder="Extra generation instruction..."
            className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-[10px] text-slate-200 outline-none resize-none"
          />

          <button
            onClick={generateAIRender}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B08968] hover:brightness-110 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            {isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> {generationLabel}</> : <><Sparkles className="w-4 h-4" /> {generationLabel}</>}
          </button>
        </div>
      </div>

      {/* 2. Renders Visualization & Active Viewport (2/4 Column) */}
      <div className="xl:col-span-2 space-y-6 flex flex-col h-[80vh]">
        {/* Main Viewport */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col min-h-0 relative">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                <ImageIcon className="w-4.5 h-4.5 text-[#D4AF37]" />
                Design Studio
              </h2>
              {/* Tab Selector */}
              <div className="flex border border-slate-800 rounded-lg p-0.5 bg-slate-950 text-[10px] font-extrabold uppercase shrink-0">
                <button
                  onClick={() => setActiveTab3D('renders')}
                  className={`px-3 py-1 rounded transition ${activeTab3D === 'renders' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  🖼️ AI Renders
                </button>
                <button
                  onClick={() => setActiveTab3D('walkthrough')}
                  className={`px-3 py-1 rounded transition ${activeTab3D === 'walkthrough' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  🌐 3D Walkthrough
                </button>
                <button
                  onClick={() => setActiveTab3D('swapper')}
                  className={`px-3 py-1 rounded transition ${activeTab3D === 'swapper' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  🎨 AI Laminate Swapper
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab3D === 'renders' && selectedRender && (
                <button
                  onClick={() => setIsMistakeModalOpen(true)}
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold px-2 py-1 rounded hover:bg-amber-500/20 transition flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Teach AI
                </button>
              )}
              <span className="text-[10px] uppercase font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded">
                {activeTab3D === 'walkthrough' ? 'Interactive 3D Scene' : selectedRender ? `${selectedRender.room || 'living'} design` : 'empty viewport'}
              </span>
              {activeTab3D === 'renders' && revisionTrail.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Revisions ({revisionCount})</span>
                  <button onClick={clearRevisionTrail} className="text-[9px] font-bold uppercase text-slate-500 hover:text-slate-200 transition">Clear</button>
                </div>
              )}
            </div>
          </div>

          {activeTab3D === 'walkthrough' ? (
            <ThreeDWalkthrough 
              projectId={projectId} 
              cadDrawing={cadDrawing} 
              selectedLaminates={selectedLaminates} 
              onLaminateChange={handleWalkthroughLaminateChange} 
            />
          ) : activeTab3D === 'swapper' ? (
            /* AI Laminate Swapper View */
            <div className="flex-grow bg-slate-950 border border-slate-850 rounded-xl overflow-hidden relative flex flex-row min-h-0">
              {/* Left Column: Image View (with Compare Toggle) */}
              <div className="flex-grow flex flex-col relative min-w-0 h-full">
                <div className="flex-grow flex items-center justify-center relative min-w-0 h-full overflow-hidden bg-slate-950">
                  {selectedRender ? (
                    beforeAfterMode && previousRenderForCompare ? (
                      /* Side-by-side compare */
                      <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
                        <div className="relative border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                          <span className="absolute top-2 left-2 z-10 bg-slate-950/80 px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider text-slate-400">Before</span>
                          <img 
                          src={backendAssetSrc(previousRenderForCompare.image_url) || previousRenderForCompare.image_url} 
                            alt="Original Design"
                            className="w-full h-full object-cover flex-1"
                          />
                        </div>
                        <div className="relative border border-[#D4AF37]/50 rounded-lg overflow-hidden flex flex-col">
                          <span className="absolute top-2 left-2 z-10 bg-slate-950/80 px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider text-[#D4AF37]">After (Swapped)</span>
                          <img 
                            src={backendAssetSrc(selectedRender.image_url) || selectedRender.image_url}
                            alt="Swapped Design"
                            className="w-full h-full object-cover flex-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={backendAssetSrc(selectedRender.image_url) || selectedRender.image_url}
                        alt="Design View"
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="text-xs text-slate-500 flex flex-col items-center gap-2.5">
                      <ImageIcon className="w-12 h-12 opacity-25" />
                      <span>Select a render to start swapping.</span>
                    </div>
                  )}

                  {isSwappingLaminate && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20 p-6 text-center">
                      <RefreshCw className="w-10 h-10 text-[#D4AF37] animate-spin" />
                      <div className="space-y-1.5 max-w-sm">
                        <span className="text-xs font-black text-[#D4AF37] uppercase tracking-widest block">AI Laminate Swapper Active</span>
                        <p className="text-[10px] text-slate-300 leading-normal animate-pulse">{swapperStepMessage || 'Performing inpainting swap...'}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {[0,1,2,3].map(step => (
                          <div key={step} className={`text-[8px] font-black px-2 py-0.5 rounded border ${step <= swapperStepIndex ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                            {['Image','Meta','Swap','Done'][step]}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Compare Toggles */}
                {selectedRender && previousRenderForCompare && (
                  <div className="bg-slate-900/60 border-t border-slate-850 px-4 py-2 flex justify-between items-center shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Material Swap Diff Engine</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBeforeAfterMode(!beforeAfterMode)}
                        className={`text-[9px] font-extrabold uppercase px-3 py-1 rounded transition border ${
                          beforeAfterMode
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {beforeAfterMode ? '✕ Normal View' : '👁️ Compare Before/After'}
                      </button>
                      {beforeAfterMode && (
                        <>
                          <button
                            onClick={() => {/* slider mode only preserved via UI state later */}}
                            className="text-[9px] font-extrabold uppercase px-2 py-1 rounded transition border bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          >
                            Slider
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Laminate Swapper Control Panel */}
              <div className="w-72 border-l border-slate-850 p-4 space-y-4 bg-slate-900/90 flex flex-col h-full shrink-0 overflow-y-auto z-10">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-[#D4AF37]" />
                    AI Material Swapper
                  </h3>
                  <p className="text-[10px] text-slate-400">Swap finishes, grain & textures with pixel-level precision</p>
                </div>

                {/* 1. Component Detection */}
                <div className="space-y-2 border-t border-slate-850 pt-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Changeable Parts</label>
                    {detectedComponents.length === 0 && selectedRender && (
                      <button
                        onClick={handleAnalyseComponents}
                        disabled={isAnalyzingComponents}
                        className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition"
                      >
                        {isAnalyzingComponents ? 'Analyzing...' : 'Scan Image'}
                      </button>
                    )}
                  </div>

                  {detectedComponents.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {detectedComponents.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSwapComponent(c.component)}
                          className={`w-full text-left p-2 rounded-lg border text-[9px] transition flex justify-between items-center ${
                            selectedSwapComponent === c.component
                              ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-semibold truncate max-w-[150px]">
                            {c.component}
                          </div>
                          {c.confidence && (
                            <span className="text-[8px] font-mono text-[#D4AF37]/80 bg-slate-900 px-1 rounded">
                              {Math.round(c.confidence * 100)}%
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-500 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/60 italic text-center">
                      {!selectedRender ? 'Select a render image first.' : 'Scan image to detect changeable parts automatically.'}
                    </div>
                  )}
                </div>

                {/* 2. Choose Material */}
                {selectedSwapComponent && (
                  <div className="space-y-3 border-t border-slate-850 pt-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Choose Swatch / Finish</label>
                      <div className="flex gap-1.5 bg-slate-950 p-0.5 rounded border border-slate-850">
                        <button
                          onClick={() => {
                            setMaterialSelectTab('laminate');
                            setSelectedCatalogMaterial(null);
                          }}
                          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition ${
                            materialSelectTab === 'laminate' ? 'bg-slate-800 text-slate-100' : 'text-slate-500'
                          }`}
                        >
                          Laminates
                        </button>
                        <button
                          onClick={() => {
                            setMaterialSelectTab('paint');
                            setSelectedCatalogMaterial(null);
                          }}
                          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition ${
                            materialSelectTab === 'paint' ? 'bg-slate-800 text-slate-100' : 'text-slate-500'
                          }`}
                        >
                          Paint
                        </button>
                      </div>
                    </div>
                    
                    {materialSelectTab === 'laminate' ? (
                      <>
                        {/* Material catalog picker */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-slate-500 font-bold block uppercase">From Catalog:</span>
                          <select
                            onChange={(e) => {
                              const mat = catalogMaterials.find(m => m.id === e.target.value);
                              setSelectedCatalogMaterial(mat || null);
                              setCustomLaminateFile(null);
                              setCustomLaminatePreview(null);
                            }}
                            value={selectedCatalogMaterial?.id || ''}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 outline-none focus:border-[#D4AF37]"
                          >
                            <option value="">-- Choose Laminate / Stone / Fabric --</option>
                            {catalogMaterials.filter(m => m.category !== 'paint').map(m => (
                              <option key={m.id} value={m.id}>
                                [{m.brand}] {m.name} ({m.code || 'No Code'})
                              </option>
                            ))}
                          </select>
                          {selectedCatalogMaterial && (
                            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded p-2 text-[9px] text-slate-300 space-y-0.5">
                              <strong className="text-[#D4AF37] block font-bold uppercase">{selectedCatalogMaterial.name}</strong>
                              <div>Brand: {selectedCatalogMaterial.brand} | Code: {selectedCatalogMaterial.code}</div>
                              <div>Color: {selectedCatalogMaterial.color || 'N/A'} | Finish: {selectedCatalogMaterial.finish || 'N/A'}</div>
                            </div>
                          )}
                        </div>

                        {/* Custom upload swatch option */}
                        <div className="space-y-1.5 border-t border-slate-850/50 pt-2">
                          <span className="text-[9px] text-slate-500 font-bold block uppercase">OR Upload Custom Swatch:</span>
                          <div className="flex items-center gap-2">
                            <label className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-[9px] text-slate-400 text-center cursor-pointer hover:border-slate-700">
                              {customLaminateFile ? customLaminateFile.name : 'Choose Swatch Image'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setCustomLaminateFile(file);
                                    setSelectedCatalogMaterial(null);
                                    const reader = new FileReader();
                                    reader.onload = () => setCustomLaminatePreview(reader.result);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {customLaminatePreview && (
                              <img 
                                src={customLaminatePreview} 
                                alt="Preview" 
                                className="w-8 h-8 rounded border border-slate-700 object-cover shrink-0" 
                              />
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Paint grid swatches */
                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">Choose Paint Shade:</span>
                        <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-950 rounded border border-slate-850">
                          {catalogMaterials.filter(m => m.category === 'paint').map(m => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedCatalogMaterial(m);
                                setCustomLaminateFile(null);
                                setCustomLaminatePreview(null);
                              }}
                              style={{ backgroundColor: m.color || '#fff' }}
                              className={`w-9 h-9 rounded-full border-2 transition relative group ${
                                selectedCatalogMaterial?.id === m.id ? 'border-[#D4AF37] scale-105 shadow-md shadow-[#D4AF37]/20' : 'border-slate-800 hover:border-slate-650'
                              }`}
                              title={`${m.brand} - ${m.name} (${m.code})`}
                            >
                              <span className="sr-only">{m.name}</span>
                            </button>
                          ))}
                        </div>
                        {selectedCatalogMaterial && (
                          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded p-2.5 text-[9px] text-slate-350 space-y-0.5">
                            <strong className="text-[#D4AF37] block font-bold uppercase">{selectedCatalogMaterial.name}</strong>
                            <div>Brand: {selectedCatalogMaterial.brand} | Shade Code: {selectedCatalogMaterial.code}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span>Hex color: {selectedCatalogMaterial.color}</span>
                              <div className="w-3 h-3 rounded-full border border-slate-800" style={{ backgroundColor: selectedCatalogMaterial.color }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Instructions & Trigger */}
                {selectedSwapComponent && (
                  <div className="space-y-2 border-t border-slate-850 pt-2.5 mt-auto">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Designer Instructions</label>
                    <textarea
                      value={laminateSwapInstruction}
                      onChange={(e) => setLaminateSwapInstruction(e.target.value)}
                      rows="2.5"
                      placeholder="Example: align grain vertically, match the gloss level of base cabinets..."
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[9px] text-slate-200 outline-none resize-none"
                    />

                    <button
                      onClick={handleLaminateSwap}
                      disabled={isSwappingLaminate || (!selectedCatalogMaterial && !customLaminateFile)}
                      className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B08968] hover:brightness-110 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-40"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Swap Material
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Active Image Render and Recolor Panel */
            <div className="flex-grow bg-slate-950 border border-slate-850 rounded-xl overflow-hidden relative flex flex-row min-h-0">
              <div className="flex-grow flex items-center justify-center relative min-w-0 h-full">
                {selectedRender ? (
                  <img 
                    src={backendAssetSrc(selectedRender.image_url) || selectedRender.image_url || ''} 
                    alt="Bespoke Design Render"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-slate-500 flex flex-col items-center gap-2.5">
                    <ImageIcon className="w-12 h-12 opacity-25" />
                    <span>Select room parameters and click Generate Renders.</span>
                  </div>
                )}

                {isGenerating && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-20">
                    <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest animate-pulse">Running AI Space Projector...</span>
                  </div>
                )}
              </div>

              {/* Component Recolor Panel */}
              {selectedRender && (
                <div className="w-64 border-l border-slate-850 p-4 space-y-4 bg-slate-900/90 flex flex-col h-full shrink-0 overflow-y-auto z-10">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-[#D4AF37]" />
                      3-Second Recolor
                    </h3>
                    <p className="text-[10px] text-slate-400">Recolor single parts instantly via SAM masks</p>
                  </div>

                  {/* Component Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Part</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                      {getComponentsForRoom(selectedRender.room || targetRoom).map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() => setSelectedComponent(comp.id)}
                          className={`py-1.5 px-2 rounded-lg border text-center transition ${
                            selectedComponent === comp.id
                              ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {comp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color swatches */}
                  {selectedComponent ? (
                    <div className="space-y-2.5 flex-grow flex flex-col min-h-0">
                      <div className="border-t border-slate-850 pt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                          Indian Palette
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {getPaletteForComponent(selectedComponent).map((color, i) => (
                            <button
                              key={i}
                              className={`w-8 h-8 rounded-lg border relative group flex items-center justify-center transition ${
                                activeColor === color.name ? 'border-[#D4AF37] scale-95 ring-1 ring-[#D4AF37]' : 'border-slate-800 hover:border-slate-650'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                              onClick={() => handleColorChange(selectedComponent, color.name, color.hex)}
                            >
                              <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-slate-950 text-slate-200 text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-30 pointer-events-none">
                                {color.name}
                              </span>
                              {activeColor === color.name && <CheckCircle className="w-3.5 h-3.5 text-slate-950 mix-blend-difference" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Suggestions Section */}
                      {colorSuggestions.length > 0 && (
                        <div className="border-t border-slate-850 pt-2 mt-auto">
                          <span className="text-[9px] font-[#D4AF37] uppercase tracking-widest block mb-1">
                            AI Suggestions
                          </span>
                          <div className="space-y-1">
                            {colorSuggestions.map((sug, i) => (
                              <div key={i} className="flex justify-between items-center text-[9px] bg-slate-950/60 p-1.5 rounded border border-slate-850">
                                <span className="text-slate-400 font-semibold">{sug.role}:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded-full border border-slate-800" style={{ backgroundColor: sug.color }}></span>
                                  <span className="text-slate-200">{sug.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic py-4 text-center">
                      Select a component part to swap color
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Metadata / Quality Panel */}
          {selectedRender && (
            <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[9px] text-slate-400 grid grid-cols-2 gap-1.5">
              <div>
                <strong className="block text-slate-300 uppercase">Render quality</strong>
                {selectedRender.status || selectedRender.quality || 'production'}
              </div>
              <div>
                <strong className="block text-slate-300 uppercase">Preview</strong>
                {selectedRender.preview_url ? 'Available' : 'Default'}
              </div>
              <div>
                <strong className="block text-slate-300 uppercase">Model tier</strong>
                {modelTier}
              </div>
              <div>
                <strong className="block text-slate-300 uppercase">Budget tier</strong>
                {budgetTier}
              </div>
              <div>
                <strong className="block text-slate-300 uppercase">Variants</strong>
                {selectedRender.variant_count || variantCount}
              </div>
              <div>
                <strong className="block text-slate-300 uppercase">Camera</strong>
                {cameraAngle}
              </div>
            </div>
          )}

          {/* Render Quality Preset Chips */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quality Presets</span>
              <span className="text-[8px] text-slate-500 font-mono">smart-cost aware</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {[
                { id: 'draft', label: 'Draft', tier: 'draft', spend: 'economy' },
                { id: 'studio', label: 'Studio', tier: 'balanced', spend: 'demo-saver' },
                { id: 'pro', label: 'Pro', tier: 'precision', spend: 'premium-quality' }
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setModelTier(preset.tier);
                    setBudgetTier(preset.spend === 'economy' ? 'economy' : preset.spend === 'demo-saver' ? 'standard' : 'premium');
                    setVariantCount(preset.id === 'draft' ? 1 : preset.id === 'studio' ? 3 : 2);
                    setSpendMode(preset.spend);
                    setStatus(`Quality preset: ${preset.label}`, 'success');
                  }}
                  className={`shrink-0 text-[9px] font-black uppercase px-2.5 py-1.5 rounded border transition ${
                    modelTier === preset.tier && (preset.id === 'draft' ? budgetTier === 'economy' : preset.id === 'studio' ? budgetTier === 'standard' : budgetTier === 'premium')
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          {/* Review Panel Overlay */}
          {selectedRender && (
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg mt-3.5 space-y-2.5 shrink-0">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                <span>Design Sign-Off Review</span>
                <span className={`px-2 py-0.5 rounded text-[9px] ${
                  selectedRender.review_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                  selectedRender.review_status === 'needs-revision' ? 'bg-amber-500/10 text-amber-400' :
                  selectedRender.review_status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-slate-900 text-slate-500'
                }`}>
                  {selectedRender.review_status || 'unreviewed'}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Leave design review note..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                />
                <button onClick={() => handleReview('approved')} className="bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded hover:brightness-110 transition">Approve</button>
                <button onClick={() => handleReview('needs-revision')} className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded hover:brightness-110 transition">Revise</button>
                <button onClick={() => handleReview('rejected')} className="bg-red-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded hover:brightness-110 transition">Reject</button>
              </div>
            </div>
          )}

          {/* Laminate Actions Panel */}
          {selectedRender && (
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg mt-2 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Laminate Changer Actions</span>
                <span className="text-[8px] text-slate-500 font-mono">{selectedLaminates.length} active finish(es)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={saveLaminateSnapshot} className="text-[9px] uppercase font-black px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition">Save Snapshot</button>
                <button onClick={exportLaminateSpec} className="text-[9px] uppercase font-black px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition">Export Spec</button>
                <button onClick={() => setBeforeAfterMode(true)} disabled={!previousRenderForCompare} className="text-[9px] uppercase font-black px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition disabled:opacity-40">Compare Last Swap</button>
              </div>
              {savedLaminateSnapshots.length > 0 && (
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {savedLaminateSnapshots.map(snap => (
                    <div key={snap.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-850 rounded px-2 py-1.5 text-[9px]">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-bold">{snap.room || 'unknown room'}</span>
                        <span className="text-slate-500">{snap.createdAt}</span>
                      </div>
                      <button onClick={() => restoreLaminateSnapshot(snap)} className="text-[#D4AF37] hover:text-[#c49e2f] font-black uppercase">Restore</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedRender && (
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg mt-2 space-y-2.5 shrink-0">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                <span>Instruct AI to Revise Render</span>
              </div>
              <div className="flex flex-col gap-2">
                <div aria-live="polite" aria-atomic="true" role="status" className="text-[9px] font-black uppercase text-slate-400">
                  {isGenerating ? `Operating… ${generationLabel}` : revisionCount > 0 ? `Iterations: ${revisionCount}` : 'Ready to revise'}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={revisionRequest}
                    onChange={(e) => setRevisionRequest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isGenerating && revisionRequest.trim() && selectedRender) handleEditRender();
                    }}
                    placeholder="Instruct AI to refine this render (e.g. Change cabinets to grey, make rafters end at window)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    onClick={handleEditRender}
                    disabled={!selectedRender || (!revisionRequest.trim() && !isGenerating)}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#B08968] hover:brightness-110 text-slate-950 text-xs font-bold px-4 py-1.5 rounded flex items-center gap-1.5 transition disabled:opacity-40"
                  >
                    {isGenerating ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {generationLabel}</> : <><Sparkles className="w-3.5 h-3.5" /> Revise</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shortlist Swatches gallery strip */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shrink-0 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>Visual shortlists</span>
            <div className="flex items-center gap-1.5">
              <div className="flex border border-slate-800 rounded overflow-hidden">
                {['all', 'approved', 'unreviewed'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setReviewFilter(filter)}
                    className={`px-2 py-0.5 text-[9px] ${
                      reviewFilter === filter ? 'bg-slate-800 text-[#D4AF37]' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {filter} ({reviewCounts[filter] || 0})
                  </button>
                ))}
              </div>
              {selectedRender && (
              <>
              <button onClick={async () => {
                if (!selectedRender?.room) return;
                const targets = rendersList.filter(r => r.room === selectedRender.room && r.review_status !== 'approved');
                if (targets.length === 0) { setStatus('No room renders left to approve.', 'error'); return; }
                try {
                  await Promise.all(targets.map(r => fetch(`${API_BASE}/projects/${projectId}/renders/${r.id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved', note: '' }) }).then(res => res.json())));
                  await fetchRenders();
                  setStatus(`Bulk approved ${targets.length} render(s).`);
                } catch (e) {
                  setStatus('Bulk approve failed.', 'error');
                }
              }} className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition">Bulk Approve</button>
              <button onClick={async () => {
                if (!selectedRender?.room) return;
                const targets = rendersList.filter(r => r.room === selectedRender.room && r.review_status !== 'rejected');
                if (targets.length === 0) { setStatus('No room renders left to reject.', 'error'); return; }
                try {
                  await Promise.all(targets.map(r => fetch(`${API_BASE}/projects/${projectId}/renders/${r.id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected', note: '' }) }).then(res => res.json())));
                  await fetchRenders();
                  setStatus(`Bulk rejected ${targets.length} render(s).`, 'error');
                } catch (e) {
                  setStatus('Bulk reject failed.', 'error');
                }
              }} className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition">Bulk Reject</button>
              </>
              )}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto py-1">
            {filteredRenders.map((ren) => (
              <div
                key={ren.id}
                onClick={() => setSelectedRender(ren)}
                className={`h-16 w-24 shrink-0 border rounded-lg cursor-pointer overflow-hidden transition relative ${
                  selectedRender?.id === ren.id ? 'border-[#D4AF37] scale-95 shadow-md shadow-[#D4AF37]/15' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={backendAssetSrc(ren.image_url) || ren.image_url || ''}
                  alt="Variant swatch"
                  className="w-full h-full object-cover"
                />
                <span className={`absolute bottom-0.5 left-0.5 text-[8px] font-extrabold px-1 rounded ${
                  ren.review_status === 'approved' ? 'bg-emerald-500 text-slate-950' :
                  ren.review_status === 'rejected' ? 'bg-red-500 text-slate-950' :
                  ren.review_status === 'needs-revision' ? 'bg-amber-500 text-slate-950' :
                  'bg-slate-950 text-slate-400'
                }`}>
                  {ren.review_status || 'pending'}
                </span>
                <span className="absolute top-1 right-1 text-[8px] font-bold bg-slate-950/80 text-slate-300 px-1 rounded uppercase">
                  {ren.room || 'room'}
                </span>
              </div>
            ))}
            {filteredRenders.length === 0 && (
              <span className="text-[10px] text-slate-500 italic py-3 block">No variant swatches in this filter.</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Vastu Compliance Gauge & Technical Exports (1/4 Column) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5 h-[80vh] overflow-y-auto">
        
        {/* Vastu Compliance Gauge widget */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Vastu Compliance</h3>
              <span className="text-[9px] text-slate-500 block">Magnetic axis stability checks</span>
            </div>
            {/* Golden radial value */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#D4AF37]/40 text-[#D4AF37] font-extrabold text-sm shadow-md shadow-[#D4AF37]/10 bg-[#D4AF37]/5">
              {vastuReport.score}%
            </div>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {vastuReport.reports.map((r, idx) => (
              <div key={idx} className="bg-slate-900/60 p-2.5 rounded border border-slate-850 text-[10px] space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-300">{r.room} ({r.direction})</span>
                  <span className={r.status === 'perfect' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {r.status === 'perfect' ? 'Perfect' : 'Remedy Set'}
                  </span>
                </div>
                <p className="text-slate-500 leading-relaxed text-[9px]">{r.message}</p>
              </div>
            ))}
            {vastuReport.reports.length === 0 && (
              <p className="text-[10px] text-slate-500 italic text-center py-4">No spatial orientations set. Set room coordinates in Onboarding Wizard.</p>
            )}
          </div>
        </div>

        {/* 3D Carcass Preview */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>3D Isometric Carcass</span>
            <span className="text-[#D4AF37]">Metric mm scale</span>
          </div>
          <div className="h-28 border border-slate-850 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            <svg className="w-full h-full">
              {renderIsometricWalls()}
            </svg>
          </div>
          <div className="text-[9px] text-slate-400 leading-relaxed">
            • Extrusions default height: 2.7m (108 in).<br />
            • Mitred joints for BWP marine cabinets.
          </div>
        </div>

        {/* Reusable Visualizer mistake logs panel */}
        {correctionsList.length > 0 && (
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-xs">
            <span className="text-[10px] font-bold text-slate-300 block uppercase tracking-wider">Layout Correction Memory</span>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {correctionsList.map(c => (
                <div key={c.id} className="bg-slate-900 p-2 rounded relative group text-[9px]">
                  <button onClick={() => deleteCorrection(c.id)} className="absolute top-1 right-1 text-slate-600 hover:text-red-400 transition">✕</button>
                  <strong className="text-slate-300 block">Mistake: {c.mistake}</strong>
                  <span className="text-amber-500">Correction: {c.correction}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Drawings & Exporters */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3.5 mt-auto">
          <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-[#D4AF37]" /> Export deliverables
          </h4>
          <div className="bg-slate-900 rounded-lg p-2.5 h-16 overflow-y-auto font-mono text-[7.5px] text-[#D4AF37] leading-normal whitespace-pre border border-slate-850">
            {sketchupScript || "# Select 2D walls to export console commands"}
          </div>
          <div className="flex gap-2 text-[9px] font-bold uppercase">
            <button onClick={copyToClipboard} className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 text-center transition">
              {copied ? 'Copied!' : 'Copy Ruby'}
            </button>
            <button onClick={downloadScriptFile} className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 text-center transition">
              Download rb
            </button>
          </div>
          <button
            onClick={approveRenders}
            disabled={rendersList.filter(r => r.review_status === 'approved').length === 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-[10px] uppercase rounded-lg flex items-center justify-center gap-1.5 hover:brightness-110 shadow-lg shadow-emerald-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve Layout & Continue
          </button>
        </div>

      </div>

      {/* 4. Dialog Popups (Teach AI Mistake Logger Modal) */}
      {isMistakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-[#D4AF37]/40 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsMistakeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 text-sm"
            >
              ✕
            </button>
            <div className="text-xl text-[#D4AF37]">🎉</div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider">Teach AI (Log Visual Correction)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If the visualizer placed components incorrectly, write down the infraction. SpaceTrace correction memory overrides rules for future layouts.
            </p>

            <div className="space-y-3 text-xs">
              <label className="block space-y-1">
                <span className="text-slate-400 font-semibold">What did the AI visualizer do wrong?</span>
                <input 
                  type="text" 
                  value={mistakeDescription} 
                  onChange={(e) => setBrief(prev => prev)} // dummy
                  onInput={(e) => setMistakeDescription(e.target.value)}
                  placeholder="Example: placed double sink under solid wall instead of window" 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 outline-none focus:border-[#D4AF37]" 
                />
              </label>

              <label className="block space-y-1">
                <span className="text-slate-400 font-semibold">What is the correct design rule?</span>
                <input 
                  type="text" 
                  value={mistakeCorrection} 
                  onChange={(e) => setBrief(prev => prev)} // dummy
                  onInput={(e) => setMistakeCorrection(e.target.value)}
                  placeholder="Example: sink must be centered exactly on window midpoint" 
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 outline-none focus:border-[#D4AF37]" 
                />
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button onClick={() => setIsMistakeModalOpen(false)} className="bg-slate-950 border border-slate-800 text-slate-400 px-4 py-2 rounded font-bold hover:bg-slate-850">Cancel</button>
              <button onClick={handleLogCorrection} className="bg-gradient-to-r from-[#D4AF37] to-[#B08968] text-slate-950 px-4 py-2 rounded font-extrabold uppercase hover:brightness-110">Save Correction</button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
};
