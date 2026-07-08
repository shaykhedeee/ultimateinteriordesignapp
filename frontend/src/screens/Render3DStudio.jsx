import React, { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Compass, Code, Clipboard, Download, CheckCircle2, 
  ArrowRight, FileText, Layout, Info, Sparkles, Image as ImageIcon,
  RefreshCw, MessageSquare, Plus, AlertTriangle, XCircle, CheckCircle, Trash2, Eye, ShieldAlert,
  Palette
} from 'lucide-react';

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

function ThreeDWalkthrough({ projectId, cadDrawing, selectedLaminates, onLaminateChange }) {
  const mountRef = React.useRef(null);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [selectedCabinet, setSelectedCabinet] = useState(null);
  const [catalogLaminates, setCatalogLaminates] = useState([]);
  
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5055/api/material-catalog');
        if (res.ok) {
          const data = await res.json();
          setCatalogLaminates(data.filter(item => item.category === 'laminate'));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCatalog();
  }, []);

  const walls = useMemo(() => JSON.parse(cadDrawing?.walls_json || '[]'), [cadDrawing]);
  const openings = useMemo(() => JSON.parse(cadDrawing?.openings_json || '[]'), [cadDrawing]);
  const furniture = useMemo(() => JSON.parse(cadDrawing?.furniture_json || '[]'), [cadDrawing]);
  const rooms = useMemo(() => JSON.parse(cadDrawing?.rooms_json || '[]'), [cadDrawing]);
  const ppm = cadDrawing?.pixels_per_meter || 40.0;

  useEffect(() => {
    if (rooms.length > 0 && !activeRoomId) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  useEffect(() => {
    if (!mountRef.current || !activeRoomId || rooms.length === 0) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c111d);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);

    const activeRoom = rooms.find(r => r.id === activeRoomId);
    let cameraX = 10;
    let cameraZ = 10;
    if (activeRoom) {
      cameraX = activeRoom.x / ppm;
      cameraZ = activeRoom.y / ppm;
    }
    camera.position.set(cameraX, 1.6, cameraZ);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const ceilingLight = new THREE.PointLight(0xfff7e6, 1.2, 30);
    ceilingLight.position.set(cameraX, 2.6, cameraZ);
    ceilingLight.castShadow = true;
    scene.add(ceilingLight);

    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const ceilingGeo = new THREE.PlaneGeometry(100, 100);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = 2.7;
    scene.add(ceilingMesh);

    const wallGroup = new THREE.Group();
    scene.add(wallGroup);
    walls.forEach(w => {
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const length = Math.hypot(dx, dy) / ppm;
      if (length === 0) return;

      const wallGeo = new THREE.BoxGeometry(length, 2.7, 0.15);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);

      const cx = (w.x1 + w.x2) / 2 / ppm;
      const cz = (w.y1 + w.y2) / 2 / ppm;
      const angle = Math.atan2(dy, dx);

      wallMesh.position.set(cx, 1.35, cz);
      wallMesh.rotation.y = -angle;
      wallMesh.receiveShadow = true;
      wallMesh.castShadow = true;
      wallGroup.add(wallMesh);
    });

    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);

    const activeLaminate = selectedLaminates.find(l => l.type === 'shutter_facade')?.color || '#a1a1aa';

    furniture.forEach(f => {
      const widthM = f.width / ppm;
      const depthM = f.height / ppm;
      const heightM = f.type === 'wardrobe' ? 2.2 : f.type === 'bed' ? 0.6 : f.type === 'counter' ? 0.85 : 0.75;
      
      const geo = new THREE.BoxGeometry(widthM, heightM, depthM);
      const mat = new THREE.MeshStandardMaterial({ 
        color: activeLaminate, 
        roughness: 0.5, 
        metalness: 0.1 
      });
      const mesh = new THREE.Mesh(geo, mat);

      const fx = f.x / ppm;
      const fz = f.y / ppm;
      mesh.position.set(fx, heightM / 2, fz);
      mesh.rotation.y = -(f.rotation || 0) * Math.PI / 180;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: f.id, name: f.name, type: f.type };

      furnitureGroup.add(mesh);
    });

    let yaw = Math.PI;
    let pitch = 0;
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      yaw -= dx * 0.004;
      pitch -= dy * 0.004;
      pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const handleCanvasClick = (e) => {
      if (isDragging) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const intersects = raycaster.intersectObjects(furnitureGroup.children);
      if (intersects.length > 0) {
        const clickedObj = intersects[0].object;
        setSelectedCabinet({
          id: clickedObj.userData.id,
          name: clickedObj.userData.name,
          type: clickedObj.userData.type
        });
      } else {
        setSelectedCabinet(null);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', handleCanvasClick);

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e) => {
      if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - prevMouse.x;
        const dy = e.touches[0].clientY - prevMouse.y;
        yaw -= dx * 0.005;
        pitch -= dy * 0.005;
        pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    dom.addEventListener('touchstart', onTouchStart);
    dom.addEventListener('touchmove', onTouchMove);
    dom.addEventListener('touchend', onMouseUp);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const target = new THREE.Vector3(
        camera.position.x + 10 * Math.sin(yaw) * Math.cos(pitch),
        camera.position.y + 10 * Math.sin(pitch),
        camera.position.z + 10 * Math.cos(yaw) * Math.cos(pitch)
      );
      camera.lookAt(target);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', handleCanvasClick);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onMouseUp);
      if (mountRef.current && dom) {
        mountRef.current.removeChild(dom);
      }
      renderer.dispose();
    };
  }, [activeRoomId, walls, openings, furniture, rooms, ppm, selectedLaminates]);

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-950 rounded-xl overflow-hidden min-h-[500px]">
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center z-10 shrink-0">
        <span className="text-xs font-bold text-slate-300">Room Walkthrough View:</span>
        <select 
          value={activeRoomId} 
          onChange={(e) => { setActiveRoomId(e.target.value); setSelectedCabinet(null); }}
          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
        >
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div ref={mountRef} className="flex-grow w-full relative min-h-0 cursor-move">
        <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-slate-850 px-2 py-1 rounded text-[8px] text-slate-500 font-mono pointer-events-none select-none z-10">
          DRAG TO PANORAMA LOOK-AROUND (360) · CLICK CABINETS TO CHOOSE LAMINATES
        </div>

        {selectedCabinet && (
          <div className="absolute top-3 right-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl w-60 z-20 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Customize Finish</span>
              <button onClick={() => setSelectedCabinet(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
            </div>
            <div>
              <strong className="text-xs text-slate-200 block truncate">{selectedCabinet.name}</strong>
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Module: {selectedCabinet.type}</span>
            </div>
            
            <div className="border-t border-slate-800 pt-2.5 space-y-2">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Select Shutter Laminate</span>
              <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-0.5">
                {catalogLaminates.map(lam => (
                  <button
                    key={lam.id}
                    onClick={() => {
                      onLaminateChange(lam.name, lam.code, lam.color);
                    }}
                    className="w-10 h-10 rounded border border-slate-800 relative group flex items-center justify-center hover:border-slate-500 transition"
                    style={{ backgroundColor: lam.color }}
                    title={`${lam.brand} ${lam.name}`}
                  >
                    <span className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-slate-950 text-slate-200 text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-30 pointer-events-none">
                      {lam.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
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

  const handleWalkthroughLaminateChange = async (name, code, color) => {
    try {
      const updatedLaminates = [
        ...selectedLaminates.filter(l => l.type !== 'shutter_facade'),
        { type: 'shutter_facade', name, code, color }
      ];

      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/materials`, {
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
      }
    } catch (err) {
      console.error("Error saving walkthrough materials:", err);
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
  const [activeProvider, setActiveProvider] = useState('auto');
  const [renderStyle, setRenderStyle] = useState('photoreal');
  const [variantCount, setVariantCount] = useState(1);
  const [removePeople, setRemovePeople] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' | '9:16' | '1:1'
  const [furnitureRequirement, setFurnitureRequirement] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
  const [laminateSwapInstruction, setLaminateSwapInstruction] = useState('');
  const [isSwappingLaminate, setIsSwappingLaminate] = useState(false);
  const [swapperStepMessage, setSwapperStepMessage] = useState('');
  const [beforeAfterMode, setBeforeAfterMode] = useState(false);
  const [previousRenderForCompare, setPreviousRenderForCompare] = useState(null);

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
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders/change-color`, {
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
        window.__toast?.show(`Instant Recolor: ${componentType} changed to ${colorName}. SAM component mask recolored in 3.5 seconds!`);
        if (data.suggestions) {
          setColorSuggestions(data.suggestions);
        }
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
      const res = await fetch('http://127.0.0.1:5055/api/providers/status');
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
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}`);
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
      const yes = await window.__auraConfirm?.confirm('Regenerate Renders', 'Regenerating all renders may consume API credits. Continue?');
      if (!yes) return;
      await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: 'render_generation',
          cameraAngle,
          provider: activeProvider,
          renderStyle,
          variantCount
        })
      });
      setProject(prev => prev ? { ...prev, stale_renders: 0 } : null);
      window.__toast?.success("Render regeneration job spawned successfully! Check Background Jobs tab.");
    } catch (err) {
      console.error(err);
    }
  };

  const loadCADAndMaterials = async () => {
    try {
      const resCAD = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/cad`);
      const drawing = await resCAD.json();
      setCadDrawing(drawing);

      const resMat = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/materials`);
      const materials = await resMat.json();
      setSelectedLaminates(JSON.parse(materials.laminates_json || '[]'));

      generateRubyScript(drawing);
    } catch (err) {
      console.error("Error loading render assets:", err);
    }
  };

  const fetchRenders = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders`);
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
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders/mistakes?room=${targetRoom}`);
      const data = await res.json();
      setCorrectionsList(data.items || []);
    } catch (err) {
      console.error("Error loading corrections list:", err);
    }
  };

  const generateAIRender = async () => {
    setIsGenerating(true);
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
      formData.append('aspectRatio', aspectRatio);
      formData.append('furnitureRequirement', furnitureRequirement);
      formData.append('customInstruction', customInstruction);
      formData.append('cameraAngle', cameraAngle);
      formData.append('activeProvider', activeProvider);
      formData.append('renderStyle', renderStyle);
      
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

      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders/generate`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchRenders();
        if (data.render) {
          setSelectedRender(data.render);
        }
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditRender = async () => {
    if (!selectedRender || !revisionRequest.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedRender.id,
          revisionRequest
        })
      });
      const data = await res.json();
      if (data.success) {
        setRevisionRequest('');
        await fetchRenders();
        if (data.render) {
          setSelectedRender(data.render);
        }
      }
    } catch (err) {
      console.error("AI Revision failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReview = async (status) => {
    if (!selectedRender) return;
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders/${selectedRender.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: reviewNote })
      });
      const data = await res.json();
      if (data.success) {
        setReviewNote('');
        await fetchRenders();
        window.__toast?.show(`Render marked as ${status}!`);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  const handleLogCorrection = async () => {
    if (!mistakeDescription.trim() || !mistakeCorrection.trim() || !selectedRender) return;
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders/mistake`, {
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
        window.__toast?.show("Layout correction logged. SpaceTrace visualizer adjusted for future generations.");
      }
    } catch (err) {
      console.error("Error saving correction:", err);
    }
  };

  const fetchCatalogMaterials = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5055/api/material-catalog');
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
      const imgUrl = selectedRender.image_url.startsWith('/storage') 
        ? `http://127.0.0.1:5055${selectedRender.image_url}` 
        : selectedRender.image_url;

      const imgRes = await fetch(imgUrl);
      const imgBlob = await imgRes.blob();

      const formData = new FormData();
      formData.append('renderImage', imgBlob, 'render.png');
      formData.append('room', selectedRender.room || targetRoom);

      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders/analyse-components`, {
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
      // 1. Fetch render image blob
      setSwapperStepMessage('Downloading active render image...');
      const renderImgUrl = selectedRender.image_url.startsWith('/storage') 
        ? `http://127.0.0.1:5055${selectedRender.image_url}` 
        : selectedRender.image_url;
      const renderImgRes = await fetch(renderImgUrl);
      const renderImgBlob = await renderImgRes.blob();

      const formData = new FormData();
      formData.append('renderImage', renderImgBlob, 'render.png');
      formData.append('componentType', selectedSwapComponent);
      formData.append('room', selectedRender.room || targetRoom);

      // 2. Add material metadata
      if (selectedCatalogMaterial) {
        formData.append('laminateCatalogId', selectedCatalogMaterial.id);
        formData.append('newMaterial', selectedCatalogMaterial.name);
        formData.append('newColor', selectedCatalogMaterial.color || '');
        formData.append('laminateCode', selectedCatalogMaterial.code || '');
        formData.append('laminateBrand', selectedCatalogMaterial.brand || '');
      } else if (customLaminateFile) {
        formData.append('newMaterial', 'Uploaded custom swatch');
        formData.append('laminateImage', customLaminateFile);
      } else {
        window.__toast?.show('Please select a material from catalog or upload a custom swatch image.');
        setIsSwappingLaminate(false);
        return;
      }

      if (laminateSwapInstruction.trim()) {
        formData.append('instruction', laminateSwapInstruction);
      }

      // 3. Post to laminate-swap API
      setSwapperStepMessage('Running visual editor pipeline. Recolor, lighting & shadow matching in progress...');
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders/laminate-swap`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.render) {
        setSwapperStepMessage('Success! Loading render output...');
        
        // Save current selected render as previous for compare view
        setPreviousRenderForCompare(selectedRender);

        await fetchRenders();
        const found = data.render;
        setSelectedRender(found);

        // Turn on compare mode by default to show changes
        setBeforeAfterMode(true);
        setLaminateSwapInstruction('');
        setCustomLaminateFile(null);
        setCustomLaminatePreview(null);
        setSelectedCatalogMaterial(null);
      } else {
        window.__toast?.show(`Error: ${data.error || 'Failed to complete material swap'}`);
      }
    } catch (err) {
      console.error("Laminate swap failed:", err);
      window.__toast?.show(`Error during material swap: ${err.message}`);
    } finally {
      setIsSwappingLaminate(false);
      setSwapperStepMessage('');
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
    setTimeout(() => setCopied(false), 2000);
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
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        window.__toast?.show("3D Renders and SketchUp layout approved!");
        if (onComplete) onComplete();
      }
    } catch (err) {
      console.error("Error approving renders:", err);
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
      
      {/* 1. Renders Control Panel (Sidebar - 1/4 Column) */}
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
          <div className="bg-slate-950/50 border border-slate-850 p-2.5 rounded-lg text-[10px] text-slate-400 flex justify-between items-center shrink-0">
            <span>IMAGE GENERATOR:</span>
            <strong className="text-[#D4AF37] uppercase font-bold font-mono">
              {providerStatus.activeLabel || 'mock'}
            </strong>
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

        {/* Model tuning params */}
        <div className="space-y-3">
          <div className="screen-section-title text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">Generation Parameters</div>
          
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
 
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold block">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-[#C9A84C]"
              >
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold block">Spend Mode</label>
              <select
                value={spendMode}
                onChange={(e) => setSpendMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="smart-cost">Smart Cost</option>
                <option value="demo-saver">Demo Saver</option>
                <option value="premium-quality">Premium</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
            <input 
              type="checkbox" 
              checked={removePeople} 
              onChange={(e) => setRemovePeople(e.target.checked)} 
              className="accent-[#D4AF37] rounded"
            />
            Remove people from generation
          </label>
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
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B08968] hover:brightness-110 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Sparkles className="w-4 h-4" />
            Generate Renders
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
                            src={previousRenderForCompare.image_url.startsWith('/storage') ? `http://127.0.0.1:5055${previousRenderForCompare.image_url}` : previousRenderForCompare.image_url} 
                            alt="Original Design"
                            className="w-full h-full object-cover flex-1"
                          />
                        </div>
                        <div className="relative border border-[#D4AF37]/50 rounded-lg overflow-hidden flex flex-col">
                          <span className="absolute top-2 left-2 z-10 bg-slate-950/80 px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider text-[#D4AF37]">After (Swapped)</span>
                          <img 
                            src={selectedRender.image_url.startsWith('/storage') ? `http://127.0.0.1:5055${selectedRender.image_url}` : selectedRender.image_url} 
                            alt="Swapped Design"
                            className="w-full h-full object-cover flex-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={selectedRender.image_url.startsWith('/storage') ? `http://127.0.0.1:5055${selectedRender.image_url}` : selectedRender.image_url} 
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
                      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4AF37]" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Compare Toggles */}
                {selectedRender && previousRenderForCompare && (
                  <div className="bg-slate-900/60 border-t border-slate-850 px-4 py-2 flex justify-between items-center shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Material Swap Diff Engine</span>
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
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Choose Swatch / Finish</label>
                    
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
                        {catalogMaterials.map(m => (
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
                    src={selectedRender.image_url && selectedRender.image_url.startsWith('/storage') ? `http://127.0.0.1:5055${selectedRender.image_url}` : (selectedRender.image_url || '')} 
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

          {/* Revision Request Input */}
          {selectedRender && (
            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg mt-2 space-y-2.5 shrink-0">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                <span>Instruct AI to Revise Render</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={revisionRequest}
                  onChange={(e) => setRevisionRequest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditRender();
                  }}
                  placeholder="Instruct AI to refine this render (e.g. Change cabinets to grey, make rafters end at window)..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                />
                <button
                  onClick={handleEditRender}
                  disabled={isGenerating || !revisionRequest.trim()}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B08968] hover:brightness-110 text-slate-950 text-xs font-bold px-4 py-1.5 rounded flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Revise
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Shortlist Swatches gallery strip */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shrink-0 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
            <span>Visual shortlists</span>
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
                  src={ren.image_url && ren.image_url.startsWith('/storage') ? `http://127.0.0.1:5055${ren.image_url}` : (ren.image_url || '')} 
                  alt="Variant swatch"
                  className="w-full h-full object-cover"
                />
                <span className={`absolute bottom-0.5 right-0.5 text-[8px] font-extrabold px-1 rounded ${
                  ren.review_status === 'approved' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                }`}>
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
}
