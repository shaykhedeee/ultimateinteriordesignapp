import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import LeftNavigator from '../components/layout/LeftNavigator';
import InspectorPanel from '../components/layout/InspectorPanel';
import Canvas2D from '../components/design2d/Canvas2D';
import { useEditorStore } from '../stores/editorStore';
import {
  Undo2, Redo2, Save, Sparkles, Image, Compass,
  Layers, Lock, Unlock, AlertCircle, RefreshCw, CheckCircle, X, ChevronDown,
  Maximize, Move, Square, Type, Ruler, Download, Camera as CameraIcon,
  Play, Pause, SkipForward, Gauge, Pencil, Wand2, BoxSelect, Video, FileText,
  LayoutTemplate, FileBarChart, LineChart, Scan, Search, Monitor, Box,
  Settings2, Grid
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
  { name: 'SOFAS', sub: ['Three Seater', 'Two Seater', 'Sectional', 'Curved', 'Benches'] },
  { name: 'CHAIRS', sub: ['Accent Chairs', 'Dining Chairs', 'Bar Chairs', 'Pouffe', 'Office Chairs'] },
  { name: 'TABLES', sub: ['Coffee Tables', 'Dining Tables', 'End Tables', 'Sideboards', 'Consoles'] },
  { name: 'BEDROOM', sub: ['Beds', 'Bedside Tables', 'Dressers'] },
  { name: 'CABINETS', sub: ['Shelves', 'Media Units', 'Bar Units', 'Partitions'] },
  { name: 'LIGHTING', sub: ['Pendants', 'Wall Lights', 'Floor Lamps', 'Spotlights'] },
  { name: 'OUTDOOR', sub: ['Outdoor Chairs', 'Outdoor Sofas'] },
];

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', icon: <Grid className="w-3.5 h-3.5" /> },
  { id: 'tv_unit', label: 'TV Units', icon: <Monitor className="w-3.5 h-3.5" /> },
  { id: 'pooja_unit', label: 'Pooja Units', icon: <Box className="w-3.5 h-3.5" /> },
  { id: 'wardrobe', label: 'Wardrobes', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'kitchen', label: 'Kitchen', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'living_room', label: 'Living Room', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
  { id: 'bedroom', label: 'Bedroom', icon: <Box className="w-3.5 h-3.5" /> },
  { id: 'dining_table', label: 'Dining', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'coffee_table', label: 'Coffee', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'bookshelf', label: 'Bookshelves', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'study_table', label: 'Study', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'utility_unit', label: 'Utility', icon: <Settings2 className="w-3.5 h-3.5" /> },
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

  const [cameraPreset, setCameraPreset] = useState('perspective');
  const [activeAction, setActiveAction] = useState('camera-angles');
  const [detecting, setDetecting] = useState(false);
  const [promptValue, setPromptValue] = useState('add false ceiling');
  const [applyStudioLights, setApplyStudioLights] = useState(true);
  const [selectedProductTab, setSelectedProductTab] = useState('catalog');
  const [activeRooms, setActiveRooms] = useState([]);
  const [rightTab, setRightTab] = useState('catalog');
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [statusChip, setStatusChip] = useState('Rooms are being saved. Once they appear, pick one to render.');
  const [actionCounts, setActionCounts] = useState({ assigned: 0, pending: 1 });
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (projectId && (rightTab === 'catalog' || rightTab === 'library')) {
      loadCatalog();
    }
  }, [projectId, rightTab]);

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetch(`${API_BASE}/furniture-catalog`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCatalogItems(data);
      } else {
        setCatalogItems([]);
      }
    } catch (e) {
      console.error('Failed to load catalog:', e);
      setCatalogItems([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  const visibleCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let items = catalogItems;
    if (catalogCategory !== 'all') {
      items = items.filter(item => {
        const cats = [item.category, ...(Array.isArray(item.tags) ? item.tags : [])];
        return cats.some(c => c?.includes(catalogCategory));
      });
    }
    if (q) {
      items = items.filter(item => {
        const hay = [item.label, item.category, ...(Array.isArray(item.tags) ? item.tags : [])].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    return items;
  }, [catalogItems, catalogCategory, searchQuery]);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/scenes`);
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
      const res = await fetch(`${API_BASE}/projects/${projectId}/scenes/${sceneId}/unlock`, { method: 'POST' });
      if (res.ok) {
        useEditorStore.setState({ isLocked: false, lockReason: '' });
        setStatusChip('Scene unlocked for edits.');
      }
    } else {
      const reason = window.prompt('Enter lock reason:', 'Approved by Client');
      if (reason !== null) {
        const res = await fetch(`${API_BASE}/projects/${projectId}/scenes/${sceneId}/lock`, {
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
      const res = await fetch(`${API_BASE}/projects/${projectId}/cad/ai-detect`, { method: 'POST' });
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

  return (
    <div className="w-full h-full bg-slate-950 text-slate-100">
      {/* Top workflow/context bar */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#D4AF37]" />
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-200 leading-tight">Design Studio</div>
            <div className="text-[9px] text-slate-500">Project <b className="text-slate-300">{projectId || '—'}</b></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDetect} className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg hover:border-[#D4AF37]/40 transition">
            {detecting ? 'Detecting...' : 'Detect Layout'}
          </button>
          <button onClick={handleSave} className="text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37] text-slate-950 px-3 py-1.5 rounded-lg hover:bg-[#e6c045] transition">
            Save Version
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-48px)]">
        {/* LEFT RAIL */}
        <div className="w-14 border-r border-slate-800 flex flex-col items-center py-3 gap-2">
          <LeftNavigator />
        </div>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 relative bg-slate-950">
          {!scene ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
              <div className="text-xs font-bold text-slate-300">Loading workspace...</div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Canvas2D />
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-500">Loading 3D…</div>}><Viewport3DComponent /></Suspense>

              {/* Selection overlay */}
              {selectionBox && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-xl shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-200">Selection Edit</h3>
                        <p className="text-[10px] text-slate-500">Describe the change for the selected zone.</p>
                      </div>
                      <button onClick={() => setSelectionBox(null)} className="text-slate-400 hover:text-slate-100"><X className="w-4 h-4" /></button>
                    </div>
                    <input
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleQueueApply} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider">Apply</button>
                      <button onClick={() => setSelectionBox(null)} className="text-slate-400 hover:text-slate-200 p-2"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
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
          )}
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

          <div className="px-3 pt-2 space-y-2">
            <div className="relative">
              <input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
              />
              <div className="absolute left-3 top-2.5 text-slate-500"><Search className="w-3.5 h-3.5" /></div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {CATEGORY_FILTERS.filter(f => f.id === 'all' || ['tv_unit','pooja_unit','wardrobe','kitchen','living_room','bedroom','dining_table','coffee_table','bookshelf','study_table','utility_unit'].includes(f.id)).map(f => (
                <button
                  key={f.id}
                  onClick={() => setCatalogCategory(f.id)}
                  className={`shrink-0 flex items-center gap-1 border rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wide transition ${
                    catalogCategory === f.id ? 'border-[#D4AF37]/60 text-[#C9A84C] bg-[#D4AF37]/10' : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[10px]">{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Categories</div>
              <div className="space-y-2">
                {PRODUCT_CATEGORIES.map(cat => (
                  <div key={cat.name} className="space-y-1">
                    <button className="flex items-center justify-between w-full text-[11px] font-bold text-slate-200 hover:text-purple-200 transition">
                      <span>{cat.name}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <div className="pl-3 space-y-1">
                      {cat.sub.map(item => (
                        <button key={item} className="text-[10px] text-slate-400 hover:text-slate-200 transition text-left">{item}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Catalog</div>
              <div className="grid grid-cols-2 gap-2">
                {catalogLoading && <div className="col-span-2 text-[10px] text-slate-500">Loading catalog...</div>}
                {!catalogLoading && catalogItems.length === 0 && (
                  <div className="col-span-2 text-[10px] text-slate-500">No catalog items found.</div>
                )}
                {visibleCatalog.map(item => (
                  <div key={item.key || item.id} className="bg-white rounded-xl overflow-hidden border border-slate-800">
                    <div className="h-24 w-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-500">
                      {item.thumbnail || item.image_path ? <img src={item.thumbnail || item.image_path} alt={item.label} className="w-full h-full object-cover" /> : 'Preview'}
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-black text-slate-900 leading-tight">{item.label}</div>
                      <div className="text-[9px] text-slate-500">{item.category}</div>
                      <div className="text-[10px] font-bold text-slate-900">{item.price ? `₹${Math.round(item.price).toLocaleString('en-IN')}` : 'Price on request'}</div>
                      <div className="text-[9px] text-slate-500">{item.dimensions_json ? JSON.stringify(item.dimensions_json) : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>HD</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-800 rounded-full border border-slate-700" aria-label="User avatar" />
              <button className="text-slate-400 hover:text-slate-200" aria-label="Download"><Download className="w-4 h-4" /></button>
            </div>
          </div>
        </aside>
      </div>

      {/* BRANCH MODAL */}
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
              <button onClick={() => setShowBranchModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Available Design Branches</span>
                <button onClick={handleCreateBranch} className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition">+ Fork New Variant</button>
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
                          <button onClick={() => { loadScene(projectId, b); setShowBranchModal(false); }} className="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-[#D4AF37]/35 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition">Switch to Variant</button>
                        ) : <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-3">Active Variant</span>}
                        {b !== 'main' && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Merge variant "${b}" into main?`)) {
                                loadScene(projectId, 'main');
                                setShowBranchModal(false);
                              }
                            }}
                            className="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition"
                          >
                            Merge to Main
                          </button>
                        )}
                        <button onClick={() => setShowBranchModal(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition">Close Manager</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
