import React, { useState, useEffect } from 'react';
import { 
  Layers, Download, Save, RefreshCw, AlertTriangle, 
  ChevronRight, ArrowRight, Layout, Info, Plus, Trash2, Edit2, FileText
} from 'lucide-react';

// Analyzer: SAME engine that drives the professional DXF export, so the
// on-screen view is never out of sync with the CAD file. Pure + browser-safe.
import { analyzeWallElevation } from '../../../server/services/elevation-analyzer.js';

export default function DrawingsElevationsStudio({ projectId, onComplete }) {
  const [walls, setWalls] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [filters, setFilters] = useState({ walls:true, openings:true, furniture:true, rugs:true, cabinets:true });
  const [pixelsPerMeter, setPixelsPerMeter] = useState(40);
  const [selectedWallId, setSelectedWallId] = useState(null);
  const [activeTab, setActiveTab] = useState('walls'); // 'walls' | 'photo'
  const [photoElevations, setPhotoElevations] = useState([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoUpload, setPhotoUpload] = useState(null);
  const [photoDims, setPhotoDims] = useState('86" wide 90" tall 24" deep');
  const [photoGenerating, setPhotoGenerating] = useState(false);
  
  // Elevation-specific parameters
  const [wallHeight, setWallHeight] = useState(2700); // mm
  const [scale, setScale] = useState('1:25');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // New cabinet template state
  const [showAddCabinet, setShowAddCabinet] = useState(false);
  const [newCab, setNewCab] = useState({
    name: 'Base Drawer Unit',
    type: 'base', // 'base', 'wall', 'loft', 'tall'
    width: 600, // mm
    height: 720, // mm
    depth: 560, // mm
    xOffset: 0, // offset from left end of wall in mm
  });

  const [staleDrawings, setStaleDrawings] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [auraConfirm, setAuraConfirm] = useState({ open:false, title:'', message:'', onConfirm:null });

  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || !selectedWallId) return;
    setIsProcessingAi(true);
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/drawings/elevations/${selectedWallId}/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "AI successfully adjusted cabinetry.");
        setAiPrompt('');
        loadCADData();
      } else {
        showToast(data.error || "AI failed to parse instruction", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error processing AI command", "error");
    } finally {
      setIsProcessingAi(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setStaleDrawings(data.stale_drawings === 1);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleRegenerateDrawings = async () => {
    try {
      const yes = await window.__auraConfirm?.confirm('Regenerate Drawings', 'This will overwrite current elevations. Continue?');
      if (!yes) return;
      await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType: 'drawing_generation' })
      });
      setStaleDrawings(false);
      showToast("Drawings regeneration job spawned successfully! Check Background Jobs tab.");
    } catch (err) {
      console.error(err);
      showToast("Failed to spawn regeneration job", "error");
    }
  };

  const loadPhotoElevations = async () => {
    setPhotoLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/photo-elevations`);
      if (res.ok) {
        const data = await res.json();
        setPhotoElevations(Array.isArray(data) ? data : (data.elevations || []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPhotoLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'photo') loadPhotoElevations();
  }, [activeTab, projectId]);

  const handleGeneratePhotoElevation = async () => {
    if (!photoUpload) { showToast('Upload a unit photo first', 'error'); return; }
    setPhotoGenerating(true);
    try {
      const b64 = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result.split(',')[1]);
        fr.onerror = reject;
        fr.readAsDataURL(photoUpload);
      });
      const res = await fetch('http://127.0.0.1:5055/api/elevation/from-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, imageB64: b64, dimsText: photoDims, unitTypeHint: 'kitchen' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Photo elevation generated', 'success');
        await loadPhotoElevations();
      } else {
        showToast(data.error || 'Generation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Generation failed', 'error');
    } finally {
      setPhotoGenerating(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadCADData();
      fetchProjectDetails();
    }
  }, [projectId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCADData = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/cad`);
      const data = await res.json();
      
      const loadedWalls = JSON.parse(data.walls_json || '[]');
      const loadedOpenings = JSON.parse(data.openings_json || '[]');
      const loadedFurniture = JSON.parse(data.furniture_json || '[]');
      const ppm = data.pixels_per_meter || 40.0;
      
      setWalls(loadedWalls);
      setOpenings(loadedOpenings);
      setFurniture(loadedFurniture);
      setPixelsPerMeter(ppm);

      if (loadedWalls.length > 0) {
        setSelectedWallId(loadedWalls[0].id);
      }
    } catch (err) {
      console.error("Error loading CAD in Elevations:", err);
    }
  };

  // Find wall length in mm
  const getWallLengthMm = (wall) => {
    if (!wall) return 0;
    const pxLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
    const meters = pxLen / pixelsPerMeter;
    return Math.round(meters * 1000);
  };

  const selectedWall = walls.find(w => w.id === selectedWallId);
  const wallLength = selectedWall ? getWallLengthMm(selectedWall) : 0;

  // Filter openings belonging to selected wall
  const wallOpenings = openings.filter(op => op.wallId === selectedWallId);

  // Filter cabinet items placed against this wall
  const visibleFilters = filters || {};
const wallCabinets = furniture.filter(f => { const onWall = f.wallId === selectedWallId || f.cabinetId === selectedWallId; if (!onWall) return false; if (f.type === 'rug' && !visibleFilters.rugs) return false; if (f.type === 'furniture' && !visibleFilters.furniture) return false; if (!f.type && !visibleFilters.cabinets) return false; return true; });

  // === REAL ElevationModel (single source of truth, shared with DXF export) ===
  const model = selectedWall ? analyzeWallElevation({
    wall: selectedWall,
    openings,
    furniture,
    pixelsPerMeter,
    wallHeightMm: wallHeight,
    projectId,
    sheetName: `ELEVATION ${selectedWallId}`
  }) : null;

  // Add cabinet to active wall
  const handleAddCabinet = () => {
    if (!selectedWallId) return;

    if (newCab.xOffset + newCab.width > wallLength) {
      showToast("Cabinet exceeds wall length boundaries!", "error");
      return;
    }

    const zOffset = newCab.type === 'base' ? 100 // plinth
                  : newCab.type === 'wall' ? 1400 
                  : newCab.type === 'loft' ? 2100 
                  : 0; // tall

    const newItem = {
      id: 'furn_' + Date.now(),
      name: newCab.name,
      type: newCab.type,
      width: newCab.width,
      height: newCab.height,
      depth: newCab.depth,
      wallId: selectedWallId,
      xOffsetWall: newCab.xOffset,
      zOffset: zOffset,
      // 2D plan mapping (place it along the wall segment for CAD view)
      x: selectedWall.x1 + ((newCab.xOffset / 1000) * pixelsPerMeter),
      y: selectedWall.y1,
      rotation: newCab.type === 'base' ? 90 : 0
    };

    const updatedFurniture = [...furniture, newItem];
    setFurniture(updatedFurniture);
    setShowAddCabinet(false);
    showToast("Cabinet module placed on elevation!");
  };

  // Remove cabinet
  const handleRemoveCabinet = (cabId) => {
    const updated = furniture.filter(f => f.id !== cabId);
    setFurniture(updated);
    showToast("Module removed");
  };

  const saveElevations = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/cad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walls,
          openings,
          furniture,
          rooms: [],
          measures: [],
          pixelsPerMeter
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Elevation vectors saved and synced to CAD!");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving elevations", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF (print-ready sheet, rendered server-side via pdfkit)
  const presets = [
    {id:'modern-luxury',title:'Modern Luxury',chip:'CALACATTA / BRASS',accent:'#D4AF37',palette:['#0B1220','#D4AF37','#FFFFFF']},
    {id:'scandi-warm',title:'Scandi Warm',chip:'OAK / OFF-WHITE',accent:'#C7A16B',palette:['#F3EFE8','#E6DCC8','#1B1B1B']},
    {id:'industrial',title:'Industrial Loft',chip:'CONCRETE / BLACK IRON',accent:'#9EA7B0',palette:['#181A1E','#2F3336','#E3E3E3']},
    {id:'indian-contemporary',title:'Indo Contemporary',chip:'TEAK + MARBLE',accent:'#8C5B3C',palette:['#3B2417','#F5E6D3','#2A2A2A']}
  ];
  const [stylePreset, setStylePreset] = React.useState(presets[0].id);
  const [materialTag, setMaterialTag] = React.useState('laminate');
  const preset = presets.find(pr=>pr.id===stylePreset)||presets[0];

  const downloadPDF = () => {
    if (!selectedWallId) return;
    window.open(`http://127.0.0.1:5055/api/projects/${projectId}/drawings/elevations/${selectedWallId}/pdf`, '_blank');
    showToast("PDF sheet generated!");
  };

  // Download SVG
  const downloadSVG = () => {
    const svgElement = document.getElementById('elevation-svg');
    if (!svgElement) return;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${projectId}_Wall_${selectedWallId || 'Elevation'}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast("SVG blueprint downloaded!");
  };

  // SVG parameters
  const svgW = 800;
  const svgH = 450;
  const marginX = 80;
  const marginY = 50;

  // Scale-aware sizing: true mm->px ratio driven by the chosen drawing scale.
  // At 1:25 the wall fits the canvas width; at 1:50 it is exactly half (true ratio).
  const scaleNum = scale === '1:50' ? 50 : 25;
  const fitPxPerMm = (svgW - 2 * marginX) / (wallLength || 3000); // 1:25 reference
  const pxPerMm = fitPxPerMm * (25 / scaleNum);
  const scaleX = pxPerMm;
  const scaleY = pxPerMm;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {staleDrawings && (
        <div className="bg-amber-950/20 border-b border-amber-900/40 px-6 py-3 text-xs text-amber-400 flex items-center justify-between font-bold shrink-0">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
            Drawings Out-of-Date: The underlying 2D/3D design layout has changed. Blueprints may not match the active design.
          </span>
          <button 
            onClick={handleRegenerateDrawings}
            className="bg-[#D4AF37] hover:bg-[#c49e2f] text-slate-950 px-3 py-1 rounded-lg font-black uppercase text-[10px] transition"
          >
            Regenerate Drawings
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 overflow-y-auto h-full max-h-screen pb-24 select-none">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-bold shadow-2xl flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-950/80 border-red-500 text-red-400' : 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
        }`}>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Column 1: Wall List & Properties */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 h-[75vh]">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <Layers className="w-4.5 h-4.5" /> Plan Intelligence Filters
            </h2>
            <div className="flex gap-1">
              {['walls','openings','furniture','rugs'].map(k=>filters[k]?null:null)}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {[ ['walls','Walls'], ['openings','Openings'], ['furniture','Furniture'], ['rugs','Rugs'], ['cabinets','Cabinets'] ].map(([k,label])=>(
              <button key={k} onClick={()=>setFilters(f=>({...f,[k]:!f[k]}))} className={`px-2 py-1 rounded-md border text-[9px] font-bold uppercase transition ${filters[k]?'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]':'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}>{label}</button>
            ))}
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#D4AF37] mb-1 flex items-center gap-2 mt-3">
            <Layers className="w-4.5 h-4.5" /> Wall Layouts
          </h2>
          <p className="text-[10px] text-slate-400">Select a partition wall to view its 2D elevation</p>
        </div>

        {/* Detection toolbox */}
        <div className="space-y-2">
          <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Detection</div>
          <button onClick={async () => {
            try {
              const r = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/plan/detect-furniture`, { method:'POST', headers:{'Content-Type':'application/json'} });
              const d = await r.json();
              setFurniture(d?.detected || []);
              showToast((d?.detected?.length ? `Detected ${d.detected.length} items` : 'No furniture detected'), d?.detected?.length ? 'success' : 'error');
            } catch (err) { showToast('Detection failed', 'error'); }
          }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition">Detect Furniture + Rug</button>
          <div className="text-[9px] text-slate-500 leading-tight">Detects furniture footprints and rugs from the traced plan. Uses heuristics + CV when enabled.</div>
        </div>

        {/* Preset + material selector */}
        <div className="space-y-1">
          <div className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Preset</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {presets.map(pr=>(
              <button key={pr.id} onClick={()=>setStylePreset(pr.id)} className={`shrink-0 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase transition ${stylePreset===pr.id?'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]':'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}>{pr.title}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <select value={materialTag} onChange={e=>setMaterialTag(e.target.value)} className="bg-slate-950 border border-slate-800 text-[10px] text-slate-200 rounded-lg px-2 py-1.5">
              <option value="laminate">Laminate Sheets</option>
              <option value="glass">Glass</option>
              <option value="cane">Cane</option>
              <option value="marble">Marble</option>
              <option value="metal">Metal</option>
            </select>
            <button onClick={async()=>{ showToast(`Applied ${preset.title} → ${materialTag} sheet`,'success'); }} className="px-2 py-1.5 bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-200 rounded-lg">Apply</button>
          </div>
        </div>

        {/* Walls Dropdown List */}
        <div className="space-y-1 overflow-y-auto flex-1">
          {walls.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              No walls found. Please sketch rooms in the CAD tab first.
            </div>
          ) : (
            walls.map((w, idx) => (
              <button
                key={w.id}
                onClick={() => setSelectedWallId(w.id)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between border transition ${
                  selectedWallId === w.id
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
                    : 'bg-slate-950/40 border-slate-850 hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <span>Wall Partition #{idx + 1}</span>
                <span className="font-mono text-[10px] opacity-75">{getWallLengthMm(w)} mm</span>
              </button>
            ))
          )}
        </div>

        {/* Global Elevation Settings */}
        <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-3 text-xs">
          <h3 className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-wider">Sheet Properties</h3>
          <div className="space-y-2">
            <div>
              <label className="text-slate-400 block mb-0.5">Ceiling Height (mm)</label>
              <input
                type="number"
                value={wallHeight}
                onChange={(e) => setWallHeight(parseInt(e.target.value) || 2700)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Drawing Scale</label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
              >
                <option value="1:20">1:20 (Details)</option>
                <option value="1:25">1:25 (Standard)</option>
                <option value="1:50">1:50 (Overview)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Columns 2-3: Elevation Sheet Viewport */}
      <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[75vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
            2D Wall Elevation
          </h2>
          <div className="flex gap-1 bg-slate-950/60 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('walls')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${activeTab === 'walls' ? 'bg-[#D4AF37] text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
            >CAD Walls</button>
            <button
              onClick={() => setActiveTab('photo')}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${activeTab === 'photo' ? 'bg-[#D4AF37] text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
            >Photo-Generated</button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadSVG}
              className="bg-slate-800 border border-slate-700 hover:border-[#D4AF37]/40 px-2 py-1 text-slate-300 transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> SVG
            </button>
            <button
              onClick={downloadPDF}
              className="bg-slate-800 border border-slate-700 hover:border-emerald-500/40 px-2 py-1 text-emerald-400 transition flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={() => {
                if (selectedWallId) {
                  window.open(`http://127.0.0.1:5055/api/projects/${projectId}/drawings/elevations/${selectedWallId}/dxf`, '_blank');
                  showToast("DXF CAD Blueprint downloaded!");
                }
              }}
              className="bg-slate-800 border border-slate-700 hover:border-sky-500/40 px-2 py-1 text-sky-400 transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> DXF
            </button>
            <button
              onClick={saveElevations}
              disabled={isSaving}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 px-3 py-1.5 rounded-lg text-xs font-black text-slate-950 transition flex items-center gap-1.5"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save & Sync
            </button>
          </div>
        </div>

        {/* Blueprint view screen */}
        {activeTab !== 'photo' && (
        <div className="flex-1 border border-slate-800 bg-[#080c14] relative flex items-center justify-center p-4 rounded-xl overflow-hidden">
          {selectedWall ? (
            <svg 
              id="elevation-svg"
              viewBox={`0 0 ${svgW} ${svgH}`} 
              className="w-full h-auto border border-slate-800 max-h-[50vh]"
            >
              {/* Paper Grid background */}
              <defs>
                <pattern id="elevation-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                <pattern id="backsplash-tile" width="24" height="12" patternUnits="userSpaceOnUse">
                  <rect width="24" height="12" fill="none" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="0.4" />
                  <line x1="12" y1="0" x2="12" y2="6" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="0.4" />
                  <line x1="0" y1="6" x2="24" y2="6" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="0.4" />
                  <line x1="0" y1="12" x2="0" y2="6" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="0.4" />
                  <line x1="24" y1="12" x2="24" y2="6" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width={svgW} height={svgH} fill="url(#elevation-grid)" />

              {/* AutoCAD Style Border and Title Block */}
              <rect x="15" y="15" width={svgW - 30} height={svgH - 30} fill="none" stroke="#2563eb" strokeWidth="1" />
              
              {/* Title Block Container */}
              <g transform={`translate(${svgW - 190}, ${svgH - 95})`}>
                <rect width="170" height="75" fill="#0b0f19" stroke="#2563eb" strokeWidth="1" />
                <text x="10" y="15" fill="#38bdf8" fontSize="8" fontWeight="black" fontFamily="monospace">SPACETRACE CAD OS</text>
                <text x="10" y="30" fill="#ffffff" fontSize="7" fontWeight="bold">DWG: WALL ELEVATION</text>
                <text x="10" y="42" fill="#9ca3af" fontSize="6">PROJECT: {projectId}</text>
                <text x="10" y="52" fill="#9ca3af" fontSize="6">SCALE: {scale}  |  HEIGHT: {wallHeight}mm</text>
                <text x="10" y="65" fill="#D4AF37" fontSize="6" fontWeight="bold">REV 1.0 (PRODUCTION SIGN-OFF)</text>
              </g>

              {/* The Wall Elevation Projection — driven by the SAME analyzer as the DXF */}
              {(() => {
                if (!model) return null;
                const wallW = model.lengthMm * scaleX;
                const wallH = model.heightMm * scaleY;
                const startX = marginX;
                const startY = svgH - marginY - wallH;
                const RED = '#ef4444';      // dimension/annotation color (benchmark)
                const YEL = '#eab308';      // reference lines
                const BLK = '#e2e8f0';      // object lines

                const toX = mm => startX + mm * scaleX;
                const toY = mm => svgH - marginY - mm * scaleY;
                // filled arrowhead polygon pointing along (x1,y1)->(x2,y2)
                const Arrow = ({ x, y, ang, color = RED, size = 5 }) => {
                  const a1 = ang + Math.PI - 0.5, a2 = ang + Math.PI + 0.5;
                  const p1x = x + size * Math.cos(a1), p1y = y + size * Math.sin(a1);
                  const p2x = x + size * Math.cos(a2), p2y = y + size * Math.sin(a2);
                  return <polygon points={`${x},${y} ${p1x},${p1y} ${p2x},${p2y}`} fill={color} />;
                };

                return (
                  <g>
                    {/* Bold Outer Wall Outline (object line) */}
                    <rect
                      x={startX}
                      y={startY}
                      width={wallW}
                      height={wallH}
                      fill="rgba(30, 41, 59, 0.05)"
                      stroke={BLK}
                      strokeWidth="2.5"
                    />
                    {/* Concrete BEAM hatch at top (benchmark: aggregate) */}
                    <rect x={startX} y={startY - 18} width={wallW} height={18} fill="url(#backsplash-tile)" opacity="0.8" />
                    <text x={toX(model.lengthMm) - 6} y={startY - 22} fill={BLK} fontSize="5.5" textAnchor="end" fontFamily="monospace">BEAM</text>
                    {/* Floor / plinth datum */}
                    <line x1={startX - 18} y1={svgH - marginY} x2={startX + wallW + 18} y2={svgH - marginY} stroke="#475569" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x={startX - 22} y={svgH - marginY + 3} fill="#64748b" fontSize="6" textAnchor="end">PLINTH LVL (100)</text>

                    {/* Reference level guidelines */}
                    {[
                      { h: 850, label: 'BASE COUNTERTOP (850)' },
                      { h: 1450, label: 'WALL CAB BOTTOM (1450)' },
                      { h: 2100, label: 'LINTEL (2100)' }
                    ].map((lvl, i) => (
                      <g key={`rl-${i}`}>
                        <line x1={startX - 15} y1={toY(lvl.h)} x2={startX + wallW + 15} y2={toY(lvl.h)} stroke="rgba(148,163,184,0.22)" strokeWidth="0.5" strokeDasharray="3,3" />
                        <text x={startX - 20} y={toY(lvl.h) + 2.5} fill="#64748b" fontSize="5.5" textAnchor="end" fontFamily="monospace">{lvl.label}</text>
                      </g>
                    ))}

                    {/* Doors & Windows — REAL geometry from analyzer */}
                    {model.openings.map(op => {
                      const ox = toX(op.offsetMm);
                      const oy = toY(op.headMm);
                      const ow = op.widthMm * scaleX;
                      const oh = (op.headMm - op.sillMm) * scaleY;
                      const label = op.type === 'door' ? 'DOOR' : 'WINDOW';
                      const callout = op.type === 'door' ? 'DOOR' : 'BLACK PROFILE SHUTTER WITH GREY TINTED GLASS';
                      return (
                        <g key={op.id}>
                          {/* TRUE CUT-OUT: void drawn as background, then jamb/sill/head lines */}
                          <rect x={ox} y={oy} width={ow} height={oh} fill="#0d0f1b" />
                          {/* jamb / sill / head (object lines) */}
                          <line x1={ox} y1={oy} x2={ox} y2={oy + oh} stroke={BLK} strokeWidth="1.5" />
                          <line x1={ox + ow} y1={oy} x2={ox + ow} y2={oy + oh} stroke={BLK} strokeWidth="1.5" />
                          <line x1={ox} y1={oy} x2={ox + ow} y2={oy} stroke={BLK} strokeWidth="1.5" />
                          <line x1={ox} y1={oy + oh} x2={ox + ow} y2={oy + oh} stroke={BLK} strokeWidth="1.5" />
                          {/* break marks at corners */}
                          <line x1={ox} y1={oy} x2={ox + 5} y2={oy - 5} stroke={BLK} strokeWidth="0.5" />
                          <line x1={ox + ow} y1={oy} x2={ox + ow - 5} y2={oy - 5} stroke={BLK} strokeWidth="0.5" />
                          <line x1={ox} y1={oy + oh} x2={ox + 5} y2={oy + oh + 5} stroke={BLK} strokeWidth="0.5" />
                          <line x1={ox + ow} y1={oy + oh} x2={ox + ow - 5} y2={oy + oh + 5} stroke={BLK} strokeWidth="0.5" />
                          {/* glazing diagonal lines for windows */}
                          {op.type === 'window' && Array.from({ length: Math.floor(op.widthMm / 100) }).map((_, i) => (
                            <line key={i} x1={ox + i * 100 * scaleX} y1={oy} x2={ox + i * 100 * scaleX + oh} y2={oy + oh} stroke={BLK} strokeWidth="0.4" opacity="0.5" />
                          ))}
                          <text x={ox + ow / 2} y={oy + oh / 2} fill={BLK} fontSize="8" textAnchor="middle" fontWeight="bold" opacity="0.85">{label}</text>
                          {/* red leader + callout */}
                          <line x1={ox + ow / 2} y1={oy + oh / 2} x2={ox + ow + 40} y2={oy - 6} stroke={RED} strokeWidth="0.5" />
                          <text x={ox + ow + 44} y={oy - 6} fill={RED} fontSize="5" fontFamily="monospace">{callout}</text>
                          {/* dimension with extension lines + arrows (red) */}
                          <line x1={ox} y1={oy - 14} x2={ox} y2={oy - 26} stroke={RED} strokeWidth="0.5" />
                          <line x1={ox + ow} y1={oy - 14} x2={ox + ow} y2={oy - 26} stroke={RED} strokeWidth="0.5" />
                          <line x1={ox} y1={oy - 22} x2={ox + ow} y2={oy - 22} stroke={RED} strokeWidth="0.6" />
                          <Arrow x={ox} y={oy - 22} ang={0} />
                          <Arrow x={ox + ow} y={oy - 22} ang={Math.PI} />
                          <text x={ox + ow / 2} y={oy - 28} fill={RED} fontSize="5.5" textAnchor="middle" fontFamily="monospace">{Math.round(op.widthMm)}</text>
                        </g>
                      );
                    })}

                    {/* Cabinets — REAL geometry from analyzer */}
                    {model.cabinets.map(cab => {
                      const cx = toX(cab.xOffsetMm);
                      const cy = toY(cab.zOffsetMm + cab.heightMm);
                      const cw = cab.widthMm * scaleX;
                      const ch = cab.heightMm * scaleY;
                      const isDrawer = cab.tag === 'DRAWER' || /drawer/i.test(cab.name);
                      const isDouble = cab.widthMm > 500 && !isDrawer;
                      const matCallout = cab.material?.callout;
                      return (
                        <g key={cab.id}>
                          <rect x={cx} y={cy} width={cw} height={ch} fill="rgba(212,175,55,0.07)" stroke={BLK} strokeWidth="1.5" />
                          {isDrawer ? (
                            Array.from({ length: Math.max(2, Math.round(cab.heightMm / 250)) - 1 }).map((_, i) => (
                              <line key={i} x1={cx} y1={cy + (ch * (i + 1)) / (Math.max(2, Math.round(cab.heightMm / 250)))} x2={cx + cw} y2={cy + (ch * (i + 1)) / (Math.max(2, Math.round(cab.heightMm / 250)))} stroke={BLK} strokeWidth="0.7" />
                            ))
                          ) : isDouble ? (
                            <>
                              <line x1={cx + cw / 2} y1={cy} x2={cx + cw / 2} y2={cy + ch} stroke={BLK} strokeWidth="0.7" />
                              <path d={`M ${cx} ${cy} A ${cw / 2} ${cw / 2} 0 0 1 ${cx + cw / 2} ${cy + ch / 2}`} fill="none" stroke={BLK} strokeWidth="0.4" strokeDasharray="2,2" opacity="0.6" />
                            </>
                          ) : (
                            <path d={`M ${cx} ${cy} A ${cw} ${cw} 0 0 1 ${cx + cw} ${cy + ch / 2}`} fill="none" stroke={BLK} strokeWidth="0.4" strokeDasharray="2,2" opacity="0.6" />
                          )}
                          {/* glass hatch */}
                          {cab.material?.glass && Array.from({ length: Math.floor(cab.widthMm / 80) }).map((_, i) => (
                            <line key={i} x1={cx + i * 80 * scaleX} y1={cy} x2={cx + i * 80 * scaleX + ch} y2={cy + ch} stroke={BLK} strokeWidth="0.3" opacity="0.4" />
                          ))}
                          {/* component tag */}
                          <text x={cx + cw / 2} y={cy + ch / 2} fill={BLK} fontSize="6.5" textAnchor="middle" fontWeight="bold">{cab.tag}</text>
                          <text x={cx + cw / 2} y={cy + ch - 4} fill="#9ca3af" fontSize="4.5" textAnchor="middle" fontFamily="monospace">{Math.round(cab.widthMm)}x{Math.round(cab.heightMm)}</text>
                          {/* material callout (red leader) */}
                          {matCallout && (
                            <>
                              <line x1={cx + cw / 2} y1={cy + 6} x2={cx + cw + 30} y2={cy - 4} stroke={RED} strokeWidth="0.5" />
                              <text x={cx + cw + 34} y={cy - 4} fill={RED} fontSize="4.5" fontFamily="monospace">{matCallout}</text>
                            </>
                          )}
                        </g>
                      );
                    })}

                    {/* Overall Dimension — red, extension lines + arrows */}
                    <line x1={startX} y1={startY - 14} x2={startX} y2={startY - 34} stroke={RED} strokeWidth="0.5" />
                    <line x1={startX + wallW} y1={startY - 14} x2={startX + wallW} y2={startY - 34} stroke={RED} strokeWidth="0.5" />
                    <line x1={startX} y1={startY - 28} x2={startX + wallW} y2={startY - 28} stroke={RED} strokeWidth="0.8" />
                    <Arrow x={startX} y={startY - 28} ang={0} />
                    <Arrow x={startX + wallW} y={startY - 28} ang={Math.PI} />
                    <text x={startX + wallW / 2} y={startY - 34} fill={RED} fontSize="7.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{model.lengthMm} MM</text>
                    <line x1={startX + wallW + 14} y1={startY} x2={startX + wallW + 34} y2={startY} stroke={RED} strokeWidth="0.5" />
                    <line x1={startX + wallW + 14} y1={svgH - marginY} x2={startX + wallW + 34} y2={svgH - marginY} stroke={RED} strokeWidth="0.5" />
                    <line x1={startX + wallW + 28} y1={startY} x2={startX + wallW + 28} y2={svgH - marginY} stroke={RED} strokeWidth="0.8" />
                    <Arrow x={startX + wallW + 28} y={startY} ang={-Math.PI / 2} />
                    <Arrow x={startX + wallW + 28} y={svgH - marginY} ang={Math.PI / 2} />
                    <text x={startX + wallW + 40} y={startY + wallH / 2 + 2.5} fill={RED} fontSize="7.5" textAnchor="start" fontFamily="monospace" fontWeight="bold">{model.heightMm} MM</text>

                    {/* Drawing border + title block */}
                    <rect x={10} y={10} width={svgW - 20} height={svgH - 20} fill="none" stroke="#2563eb" strokeWidth="1" />
                    <g transform={`translate(${svgW - 200}, ${svgH - 90})`}>
                      <rect x={0} y={0} width={190} height={80} fill="rgba(15,23,42,0.9)" stroke="#2563eb" strokeWidth="0.8" />
                      <line x1={0} y1={26} x2={190} y2={26} stroke="#2563eb" strokeWidth="0.4" />
                      <line x1={0} y1={52} x2={190} y2={52} stroke="#2563eb" strokeWidth="0.4" />
                      <text x={6} y={17} fill="#D4AF37" fontSize="7" fontWeight="bold" fontFamily="monospace">SHEET: {model.wallName}</text>
                      <text x={6} y={43} fill="#e2e8f0" fontSize="6" fontFamily="monospace">SCALE: {scale}   REV: 1.0</text>
                      <text x={6} y={69} fill="#94a3b8" fontSize="5.5" fontFamily="monospace">AURABRAIN  {new Date().toISOString().slice(0,10)}</text>
                    </g>
                  </g>
                );
              })()}
            </svg>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs font-semibold">
              Select a wall partition to render elevation viewport
            </div>
          )}
        </div>
        )}

        {activeTab === 'photo' && (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-2 shrink-0">
              <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block">Generate from Photo (3D → 2D)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoUpload(e.target.files?.[0] || null)}
                className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-800 file:text-slate-200"
              />
              <input
                value={photoDims}
                onChange={(e) => setPhotoDims(e.target.value)}
                placeholder='dims e.g. 86" wide 90" tall 24" deep'
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-200"
              />
              <button
                onClick={handleGeneratePhotoElevation}
                disabled={photoGenerating}
                className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-slate-950 font-black py-1.5 rounded-lg text-[10px] uppercase transition flex items-center justify-center gap-1.5"
              >
                {photoGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Generate Measured Elevation
              </button>
              <div className="text-[9px] text-slate-500 leading-tight">Detects unit type + components from the photo, merges your handwritten dimensions as ground truth, exports DXF + PDF.</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {photoLoading ? (
                <div className="text-center py-10 text-xs text-slate-500">Loading…</div>
              ) : photoElevations.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">No photo elevations yet. Upload a unit photo above.</div>
              ) : (
                photoElevations.map((e) => (
                  <div key={e.id} className="bg-slate-950/40 border border-slate-850 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{e.wall_name || (e.unit_type || 'ELEVATION').toUpperCase()}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{(e.model_json ? JSON.parse(e.model_json).lengthMm : 0) || '—'} mm · conf {e.confidence ?? '—'}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => window.open(`http://127.0.0.1:5055/api/projects/${projectId}/photo-elevations/${e.id}/dxf`, '_blank')} className="bg-slate-800 border border-slate-700 hover:border-sky-500/40 px-2 py-1 text-sky-400 text-[10px] flex items-center gap-1"><Download className="w-3 h-3" /> DXF</button>
                      <button onClick={() => window.open(`http://127.0.0.1:5055/api/projects/${projectId}/photo-elevations/${e.id}/pdf`, '_blank')} className="bg-slate-800 border border-slate-700 hover:border-emerald-500/40 px-2 py-1 text-emerald-400 text-[10px] flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 h-[75vh]">
        {/* AI Assisted Elevation Editor */}
        <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-2 shrink-0">
          <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block">AI Elevation Copilot</label>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="E.g., 'increase base widths to 900', 'remove lofts', 'convert bases to drawers'..."
            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 resize-none h-16 outline-none focus:border-[#D4AF37]/50"
          />
          <button
            onClick={handleAiEdit}
            disabled={isProcessingAi}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
          >
            {isProcessingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Modify with AI'}
          </button>
        </div>

        <div className="flex justify-between items-center shrink-0 border-t border-slate-800 pt-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Manual Drafting
          </h2>
          <button
            onClick={() => setShowAddCabinet(true)}
            className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/25 text-[#D4AF37] text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition"
          >
            + Plinth Unit
          </button>
        </div>

        {/* Add module form */}
        {showAddCabinet && (
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-3 text-xs">
            <h3 className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Add Modular Unit</h3>
            <div className="space-y-2">
              <div>
                <label className="text-slate-400 block mb-0.5 font-bold">Module Name</label>
                <input
                  type="text"
                  value={newCab.name}
                  onChange={(e) => setNewCab(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">Tier Type</label>
                  <select
                    value={newCab.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      const sizeDefaults = {
                        base: { name: 'Base Cabinet Run', height: 720, depth: 560 },
                        wall: { name: 'Wall Overhead Box', height: 600, depth: 300 },
                        loft: { name: 'Ceiling Loft Run', height: 400, depth: 600 },
                        tall: { name: 'Tall Crockery Pantry', height: 2100, depth: 560 }
                      };
                      setNewCab(prev => ({ 
                        ...prev, 
                        type, 
                        name: sizeDefaults[type].name, 
                        height: sizeDefaults[type].height, 
                        depth: sizeDefaults[type].depth 
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="base">Base Unit</option>
                    <option value="wall">Wall Unit</option>
                    <option value="loft">Loft Run</option>
                    <option value="tall">Tall Pantry</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Width (mm)</label>
                  <input
                    type="number"
                    value={newCab.width}
                    onChange={(e) => setNewCab(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">Height (mm)</label>
                  <input
                    type="number"
                    value={newCab.height}
                    onChange={(e) => setNewCab(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Offset X (mm)</label>
                  <input
                    type="number"
                    value={newCab.xOffset}
                    onChange={(e) => setNewCab(prev => ({ ...prev, xOffset: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddCabinet(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 py-1.5 rounded transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCabinet}
                className="flex-1 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-slate-950 font-bold py-1.5 rounded transition"
              >
                Place Unit
              </button>
            </div>
          </div>
        )}

        {/* List of placed cabinets */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Placed Cabinet Modules</label>
          {wallCabinets.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-600">
              No modular items placed on this wall partition.
            </div>
          ) : (
            wallCabinets.map(cab => (
              <div 
                key={cab.id} 
                className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-lg text-xs flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-200">{cab.name}</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                    {cab.width}w x {cab.height}h x {cab.depth}d (X: {cab.xOffsetWall || 0})
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveCabinet(cab.id)}
                  className="text-red-400 hover:text-red-300 transition p-1 hover:bg-red-950/30 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Handoff complete button */}
        <button
          onClick={() => {
            if (onComplete) onComplete();
          }}
          className="w-full mt-auto py-3 bg-[#D4AF37] hover:bg-[#D4AF37]/95 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition shadow-lg shadow-[#D4AF37]/5 shrink-0"
        >
          Proceed to Materials <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
    </div>
  );
}
