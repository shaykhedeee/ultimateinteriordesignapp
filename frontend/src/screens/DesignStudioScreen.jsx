import React, { useEffect, useState, useMemo } from 'react';
import LeftNavigator from '../components/layout/LeftNavigator';
import InspectorPanel from '../components/layout/InspectorPanel';
import Canvas2D from '../components/design2d/Canvas2D';
import Viewport3D from '../components/design3d/Viewport3D';
import { useEditorStore } from '../stores/editorStore';
import {
  Undo2, Redo2, Save, Sparkles, Image, Compass,
  Layers, Lock, Unlock, AlertCircle, RefreshCw, CheckCircle, X, ChevronDown,
  Maximize, Move, Square, Type, Ruler, Download, Camera as CameraIcon,
  Play, Pause, SkipForward, Gauge, Pencil, Wand2, BoxSelect, Video, FileText,
  LayoutTemplate, FileBarChart, LineChart, Scan
} from 'lucide-react';

const RENDER_ACTIONS = [
  { id: 'region-edit', label: 'Region Edit', icon: <BoxSelect className="w-4 h-4" /> },
  { id: 'camera-angles', label: 'Camera Angles', icon: <CameraIcon className="w-4 h-4" /> },
  { id: 'layout-plan', label: 'Layout Plan', icon: <LayoutTemplate className="w-4 h-4" /> },
  { id: 'elevation', label: 'Elevation', icon: <FileText className="w-4 h-4" /> },
  { id: 'rcp', label: 'RCP', icon: <Layers className="w-4 h-4" /> },
  { id: 'upscale', label: 'Upscale', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { id: 'bom', label: 'BOM', icon: <FileBarChart className="w-4 h-4" /> },
  { id: 'lineage', label: 'Lineage', icon: <LineChart className="w-4 h-4" /> },
  { id: 'download', label: 'Download', icon: <Download className="w-4 h-4" /> },
];

const CAMERA_PRESETS = [
  { id: 'perspective', label: 'Perspective' },
  { id: 'isometric', label: 'Isometric' },
];

const CATALOG_TABS = [
  { id: 'catalog', label: 'CATALOG' },
  { id: 'library', label: 'LIBRARY' },
  { id: 'product-board', label: 'PRODUCT BOARD' },
  { id: 'upload', label: 'UPLOAD' },
  { id: 'style', label: 'STYLE' },
];

const PRODUCT_CATEGORIES = [
  {
    name: 'SOFAS AND BENCHES',
    sub: ['Three Seater Sofas', 'Two Seater Sofas', 'Sectional Sofas', 'Curved Sofas', 'Benches']
  },
  {
    name: 'CHAIRS AND POUFF...',
    sub: ['Lounge & Accent Chairs', 'Dining Chairs', 'Bar Chairs', 'Pouffe', 'Office Chairs']
  },
  {
    name: 'TABLES AND CONS...',
    sub: ['Coffee Tables', 'Dining Tables', 'End Tables', 'Bar Tables', 'Sideboards', 'Dressers & Desk', 'Consoles']
  },
  { name: 'BEDROOM', sub: ['Beds', 'Bedside Tables'] },
  {
    name: 'CABINETS AND SHE...',
    sub: ['Shelves', 'Media Units', 'Bar Units', 'Partitions']
  },
  {
    name: 'OUTDOOR FURNITU...',
    sub: ['Outdoor Chairs', 'Outdoor Sofas']
  },
];

const SAMPLE_PRODUCTS = [
  { name: 'Keith Display Unit', brand: 'Natelier', price: '₹2,06,499', dims: '107×45×220 cm' },
  { name: 'Orion Book Tower', brand: 'Natelier', price: '₹2,24,200', dims: '61×61×210 cm' },
  { name: 'Harper Display Unit', brand: 'Bentchair', price: '₹1,76,999', dims: '130×36×160 cm' },
  { name: 'Maren Display Unit', brand: 'Bentchair', price: '₹95,579', dims: '53×53×156 cm' },
  { name: 'Luna Wall Shelf', brand: 'Ferm Living', price: '₹48,900', dims: '90×12×25 cm' },
  { name: 'Arc Console Table', brand: 'Minimal&Co', price: '₹72,499', dims: '120×40×78 cm' },
];

export default function DesignStudioScreen({ projectId, onComplete }) {
  const loadScene = useEditorStore(state => state.loadScene);
  const saveSceneVersion = useEditorStore(state => state.saveSceneVersion);
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);

  const scene = useEditorStore(state => state.scene);
  const versionNumber = useEditorStore(state => state.versionNumber);
  const isLocked = useEditorStore(state => state.isLocked);
  const lockReason = useEditorStore(state => state.lockReason);
  const isSaving = useEditorStore(state => state.isSaving);
  const history = useEditorStore(state => state.history);
  const historyIndex = useEditorStore(state => state.historyIndex);

  const [layoutMode, setLayoutMode] = useState('split');
  const branchName = useEditorStore(state => state.branchName);
  const [branches, setBranches] = useState(['main']);
  const [versions, setVersions] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Studio UX state
  const [cameraPreset, setCameraPreset] = useState('perspective');
  const [activeAction, setActiveAction] = useState('camera-angles');
  const [detecting, setDetecting] = useState(false);
  const [promptValue, setPromptValue] = useState('add false ceiling');
  const [applyStudioLights, setApplyStudioLights] = useState(true);
  const [selectedProductTab, setSelectedProductTab] = useState('catalog');
  const [activeRooms, setActiveRooms] = useState([]);
  const [rightTab, setRightTab] = useState('catalog');
  const [selectionBox, setSelectionBox] = useState(null);
  const [statusChip, setStatusChip] = useState('Rooms are being saved. Once they appear, pick one to render.');
  const [actionCounts, setActionCounts] = useState({ assigned: 0, pending: 1 });

  useEffect(() => {
    if (projectId) {
      loadScene(projectId, branchName);
      fetchBranches();
    }
  }, [projectId, versionNumber]);

  useEffect(() => {
    if (activeRooms.length === 0 && scene) {
      setActiveRooms([
        { id: 'z1', name: 'Open Zone 1' },
        { id: 'z2', name: 'Open Zone 2' },
        { id: 'z3', name: 'Open Zone 3' },
        { id: 'z4', name: 'Open Zone 4' },
        { id: 'z5', name: 'Open Zone 5' },
        { id: 'z6', name: 'Open bedroom' },
      ]);
    }
  }, [scene]);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
        const unique = Array.from(new Set(data.map(v => v.branch_name || 'main')));
        setBranches(unique);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBranchChange = (selected) => {
    loadScene(projectId, selected);
  };

  const handleCreateBranch = () => {
    const newB = window.prompt('Enter new design branch name (e.g. v2_modern, vastu_alt):');
    if (newB) {
      const cleaned = newB.trim().toLowerCase().replace(/\s+/g, '_');
      loadScene(projectId, cleaned);
      setBranches(prev => Array.from(new Set([...prev, cleaned])));
    }
  };

  const handleToggleLock = async () => {
    const sceneId = useEditorStore.getState().sceneId;
    if (isLocked) {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes/${sceneId}/unlock`, { method: 'POST' });
      if (res.ok) {
        useEditorStore.setState({ isLocked: false, lockReason: '' });
        setStatusChip('Scene unlocked for edits.');
      }
    } else {
      const reason = window.prompt('Enter lock reason:', 'Approved by Client');
      if (reason !== null) {
        const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/scenes/${sceneId}/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        if (res.ok) {
          useEditorStore.setState({ isLocked: true, lockReason: reason });
          setStatusChip('Scene locked: ' + reason);
        }
      }
    }
  };

  const handleSave = () => {
    const reason = window.prompt('Enter revision note for this version:', `Revision ${versionNumber + 1}`);
    if (reason !== null) {
      saveSceneVersion(reason || undefined);
      setStatusChip('Version saved.');
    }
  };

  const handleDetect = async () => {
    setDetecting(true);
    setStatusChip('Detecting objects in the layout — one moment.');
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/cad/ai-detect`, { method: 'POST' });
      const data = await res.json();
      setStatusChip(data?.message || 'Detection complete.');
      setActionCounts({ assigned: 2, pending: 0 });
    } catch (e) {
      setStatusChip('Detection failed. Retry shortly.');
    } finally {
      setDetecting(false);
    }
  };

  const handleRunAction = async (actionId) => {
    setActiveAction(actionId);
    setStatusChip(`${actionId.replace('-', ' ')} initiated...`);
  };

  const handleQueueApply = async () => {
    setSelectionBox(null);
    setStatusChip('Action applied. Re-rendering affected zones.');
  };

  if (!scene) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Spatial Scene Graph...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[92vh] flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* ── 1. TOP APP BAR ── */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-white" />
              ))}
            </div>
            <span className="text-sm font-black tracking-widest text-slate-100">Bella</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <nav className="flex items-center gap-1 text-[11px] font-semibold" aria-label="Design studio tabs">
            {['AI Director', 'Interior', '1/1 edits', 'Invoice'].map(tab => (
              <button key={tab} className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-slate-950 border border-slate-800 hover:border-[#D4AF37] text-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition">
            + New
          </button>
        </div>
      </div>

      {/* ── 2. MAIN 3-PANEL WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <aside className="w-72 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rooms are being saved. Once they appear, pick one to render.</div>
              <div className="text-xs font-bold text-slate-200">Rooms ready — pick one to render.</div>
              <div className="flex flex-col gap-1.5">
                {activeRooms.map(room => (
                  <button
                    key={room.id}
                    className="flex items-center justify-between bg-slate-950 border border-slate-800 hover:border-[#D4AF37] text-slate-200 px-3 py-2 rounded-xl text-[11px] font-semibold transition"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
                      {room.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-400">{statusChip}</div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Camera view</div>
              <div className="flex gap-2">
                {CAMERA_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setCameraPreset(preset.id)}
                    className={`flex-1 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wide transition ${
                      cameraPreset === preset.id
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#D4AF37]'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Render ready — choose what you want to do next.</div>
              <div className="grid grid-cols-2 gap-2">
                {RENDER_ACTIONS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleRunAction(item.id)}
                    className={`flex items-center gap-2 bg-slate-950 border rounded-xl px-3 py-2 text-[11px] font-semibold transition ${
                      activeAction === item.id
                        ? 'border-purple-500/70 text-purple-200 shadow-lg shadow-purple-900/20'
                        : 'border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prompt</label>
              <textarea
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                rows={3}
                placeholder="add false ceiling"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs outline-none focus:border-[#D4AF37] resize-none"
              />
              <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyStudioLights}
                  onChange={(e) => setApplyStudioLights(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                Apply Studio Lights
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bella</div>
              <div className="text-[10px] text-slate-400 leading-relaxed">
                I have a floor plan. Generate render. Change the sofa in this room.
              </div>
              <div className="flex gap-2">
                <input
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="Message Bella..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                />
                <button className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-xl">
                  <Maximize className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">0/100</div>
            </div>
          </div>
        </aside>

        {/* CENTER PANEL */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 flex gap-1 text-xs font-bold">
                <button className="px-2.5 py-1 rounded-lg bg-slate-900 text-purple-300 border border-purple-500/60">ALL</button>
                <button className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200">Rooms</button>
                <button className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200">Products</button>
                <button className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200">Layers</button>
              </div>
              <button
                onClick={handleDetect}
                className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 hover:border-purple-500 transition"
              >
                {detecting ? <Scan className="w-3.5 h-3.5 animate-pulse text-purple-400" /> : <Scan className="w-3.5 h-3.5 text-slate-500" />}
                {detecting ? 'Detecting...' : 'Detect'}
              </button>
              <button className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 hover:border-[#D4AF37] transition">
                <Pencil className="w-3.5 h-3.5 text-slate-500" /> Draw Object
              </button>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition" aria-label="Undo">
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition" aria-label="Redo">
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-semibold">
              {actionCounts.assigned} assigned • {actionCounts.pending} pending
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0">
              {layoutMode === '2d' && <Canvas2D />}
              {layoutMode === '3d' && <Viewport3D />}
              {layoutMode === 'split' && (
                <>
                  <div className="w-1/2 h-full border-r border-slate-800"><Canvas2D /></div>
                  <div className="w-1/2 h-full"><Viewport3D /></div>
                </>
              )}
            </div>

            {/* Floating Selection Toolbar */}
            {selectionBox && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rectangle</span>
                </div>
                <input
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500 w-64"
                />
                <button className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-[11px] font-bold">
                  + Queue
                </button>
                <button
                  onClick={handleQueueApply}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider"
                >
                  Apply
                </button>
                <button
                  onClick={() => setSelectionBox(null)}
                  className="text-slate-400 hover:text-slate-200 p-2"
                  aria-label="Close selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bottom Left PLAN Zone */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 w-48 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">PLAN Zone</div>
              <div className="text-[10px] text-slate-400 leading-snug">Top-down room occupancy preview.</div>
              <div className="text-[9px] text-slate-500 mt-1">Smart Fill available on Mother Node only.</div>
            </div>

            {/* Top-right status badge */}
            <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur">
              Selection active — type your edit in the prompt bar next to your selection.
            </div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="w-80 shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 pt-3">
            <nav className="flex gap-1 text-[10px] font-black uppercase tracking-widest" aria-label="Catalog tabs">
              {CATALOG_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg transition ${
                    rightTab === tab.id
                      ? 'text-slate-100 border-b-2 border-purple-500'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <button className="text-slate-500 hover:text-slate-300" aria-label="Close panel">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 pt-2">
            <div className="relative">
              <input
                placeholder="Search products..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
              />
              <div className="absolute left-3 top-2.5 text-slate-500">
                <LayoutTemplate className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">All Products</div>
              <div className="space-y-2">
                {PRODUCT_CATEGORIES.map(cat => (
                  <div key={cat.name} className="space-y-1">
                    <button className="flex items-center justify-between w-full text-[11px] font-bold text-slate-200 hover:text-purple-200 transition">
                      <span>{cat.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <div className="pl-3 space-y-1">
                      {cat.sub.map(item => (
                        <button key={item} className="text-[10px] text-slate-400 hover:text-slate-200 transition text-left">
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_PRODUCTS.map(product => (
                <div key={product.name} className="bg-white rounded-xl overflow-hidden border border-slate-800">
                  <div className="h-24 w-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-500">Preview</div>
                  <div className="p-2 space-y-1">
                    <div className="text-[10px] font-black text-slate-900 leading-tight">{product.name}</div>
                    <div className="text-[9px] text-slate-500">{product.brand}</div>
                    <div className="text-[10px] font-bold text-slate-900">{product.price}</div>
                    <div className="text-[9px] text-slate-500">{product.dims}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>HD</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-800 rounded-full border border-slate-700" aria-label="User avatar" />
              <button className="text-slate-400 hover:text-slate-200" aria-label="Download">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── 3. BRANCH MODAL ── */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up text-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Design Variant Branch Manager</h3>
                  <p className="text-[10px] text-slate-500">Fork, switch, and compare design layouts side-by-side</p>
                </div>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Available Design Branches</span>
                <button onClick={handleCreateBranch} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition">
                  + Fork New Variant
                </button>
              </div>
              <div className="space-y-2.5">
                {branches.map(b => {
                  const branchVersions = versions.filter(v => v.branch_name === b);
                  const latestV = branchVersions.length > 0 ? branchVersions[0] : null;
                  const totalV = branchVersions.length;
                  const isCurrentBranch = b === branchName;
                  let summary = {};
                  try { summary = latestV ? JSON.parse(latestV.summary_json || '{}') : {}; } catch (e) { }

                  return (
                    <div key={b} className={`p-4 rounded-xl border flex items-center justify-between transition ${isCurrentBranch ? 'bg-[#D4AF37]/5 border-[#D4AF37]/50 shadow-md shadow-[#D4AF37]/5' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-slate-200 uppercase font-bold tracking-wider">{b.replace('_', ' ')}</strong>
                          {isCurrentBranch && <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Active</span>}
                          {latestV?.is_locked === 1 && <span className="bg-amber-950/40 text-amber-500 border border-amber-900/40 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Locked</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>Latest Version: <b>v{latestV?.version_number || 1}.0</b></span>
                          <span>·</span>
                          <span>Total Revisions: <b>{totalV}</b></span>
                        </div>
                        {summary?.reason && <div className="text-[10px] text-slate-500 italic mt-1.5">"{summary.reason}"</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCurrentBranch ? (
                          <button onClick={() => { loadScene(projectId, b); setShowBranchModal(false); }} className="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-[#D4AF37]/35 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition">
                            Switch to Variant
                          </button>
                        ) : <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-3">Active Variant</span>}
                        {b !== 'main' && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Merge variant "${b}" into main?`)) {
                                loadScene(projectId, 'main');
                                setShowBranchModal(false);
                              }
                            }}
                            className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/25 text-[#D4AF37] px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition"
                          >
                            Merge to Main
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex justify-end">
              <button onClick={() => setShowBranchModal(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition">
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
