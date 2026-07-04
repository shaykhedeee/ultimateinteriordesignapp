import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { 
  Layers, Download, Save, RefreshCw, AlertTriangle, 
  ChevronRight, ArrowRight, Layout, Info, Plus, Trash2, Edit2
} from 'lucide-react';

export default function DrawingsElevationsStudio({ projectId, onComplete }) {
  const [walls, setWalls] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [pixelsPerMeter, setPixelsPerMeter] = useState(40);
  const [selectedWallId, setSelectedWallId] = useState(null);
  
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

  // Accurate measurements state for this elevation
  const [wallMeasurements, setWallMeasurements] = useState({
    wallLengthMm: 0,
    ceilingHeightMm: 2700,
    moduleWidthMm: 900,
    moduleHeightMm: 720,
    moduleDepthMm: 600,
    wallUnitHeightMm: 1400,
  });
  const [measurementsSaved, setMeasurementsSaved] = useState(false);

  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || !selectedWallId) return;
    setIsProcessingAi(true);
    try {
      const body = { prompt: aiPrompt };
      if (measurementsSaved) body.userMeasurements = wallMeasurements;
      const res = await fetch(`${API_BASE}/projects/${projectId}/drawings/elevations/${selectedWallId}/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

  const regenerateElevationFromRender = async () => {
    if (!selectedWallId) return;
    setIsProcessingAi(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/render-3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallId: selectedWallId, measurements: measurementsSaved ? wallMeasurements : {} })
      });
      const data = await res.json();
      if (data?.success || data?.imageUrl) {
        showToast("Elevation regenerated from 3D render with updated measurements.");
      } else {
        showToast(data?.error || "Could not regenerate elevation from render", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error regenerating elevation", "error");
    } finally {
      setIsProcessingAi(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`);
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
      await fetch(`${API_BASE}/projects/${projectId}/jobs`, {
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

  useEffect(() => {
    if (projectId) {
      loadCADData();
      fetchProjectDetails();
    }
  }, [projectId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    useAutoClear(toast?.msg || null, setToast, 3000);
  };

  const loadCADData = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/cad`);
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
    if (measurementsSaved && wallMeasurements.wallLengthMm) {
      return wallMeasurements.wallLengthMm;
    }
    const pxLen = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
    const meters = pxLen / pixelsPerMeter;
    return Math.round(meters * 1000);
  };

  const updateMeasurement = (key, value) => {
    setWallMeasurements(prev => ({ ...prev, [key]: Number(value) || 0 }));
    setMeasurementsSaved(false);
  };

  const saveMeasurements = () => {
    setMeasurementsSaved(true);
    showToast("Accurate measurements applied to this elevation.");
  };

  const selectedWall = walls.find(w => w.id === selectedWallId);
  const wallLength = selectedWall ? getWallLengthMm(selectedWall) : 0;

  // Filter openings belonging to selected wall
  const wallOpenings = openings.filter(op => op.wallId === selectedWallId);

  // Filter cabinet items placed against this wall
  // Cabinets will have wallId and xOffset, or we can check proximity
  const wallCabinets = furniture.filter(f => f.wallId === selectedWallId || f.cabinetId === selectedWallId);

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
      const res = await fetch(`${API_BASE}/projects/${projectId}/cad`, {
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

  // Scale calculations for SVG rendering
  const scaleX = (svgW - 2 * marginX) / (wallLength || 3000);
  const scaleY = (svgH - 2 * marginY) / wallHeight;

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
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#D4AF37] mb-1 flex items-center gap-2">
            <Layers className="w-4.5 h-4.5" /> Wall Layouts
          </h2>
          <p className="text-[10px] text-slate-400">Select a partition wall to view its 2D elevation</p>
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

        {/* Accurate Measurements Panel */}
        <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-wider">Measurements</h3>
            <span className="text-[9px] font-mono text-slate-400">{measurementsSaved ? 'Saved' : 'Unsaved'}</span>
          </div>
          <div className="space-y-1.5">
            <div>
              <label className="text-slate-400 block mb-0.5">Wall Length (mm)</label>
              <input
                type="number"
                value={wallMeasurements.wallLengthMm || ''}
                onChange={(e) => updateMeasurement('wallLengthMm', e.target.value)}
                placeholder="Measured wall length"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Ceiling Height (mm)</label>
              <input
                type="number"
                value={wallMeasurements.ceilingHeightMm || wallHeight}
                onChange={(e) => updateMeasurement('ceilingHeightMm', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-0.5">Module Width (mm)</label>
                <input
                  type="number"
                  value={wallMeasurements.moduleWidthMm || ''}
                  onChange={(e) => updateMeasurement('moduleWidthMm', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Module Height (mm)</label>
                <input
                  type="number"
                  value={wallMeasurements.moduleHeightMm || ''}
                  onChange={(e) => updateMeasurement('moduleHeightMm', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-0.5">Module Depth (mm)</label>
                <input
                  type="number"
                  value={wallMeasurements.moduleDepthMm || ''}
                  onChange={(e) => updateMeasurement('moduleDepthMm', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Wall Unit Height (mm)</label>
                <input
                  type="number"
                  value={wallMeasurements.wallUnitHeightMm || ''}
                  onChange={(e) => updateMeasurement('wallUnitHeightMm', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>
            <button
              onClick={saveMeasurements}
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-[11px] transition"
            >
              Apply Measurements
            </button>
          </div>
        </div>
      </div>

      {/* Columns 2-3: Elevation Sheet Viewport */}
      <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[75vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
            2D Wall Elevation Canvas
          </h2>
          <div className="flex gap-2">
            <button
              onClick={downloadSVG}
              className="bg-slate-800 border border-slate-700 hover:border-[#D4AF37]/40 px-2 py-1 text-slate-300 transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> SVG
            </button>
            <button
              onClick={() => {
                if (selectedWallId) {
                  window.open(`${API_BASE}/projects/${projectId}/drawings/elevations/${selectedWallId}/dxf`, '_blank');
                  showToast("DXF CAD Blueprint downloaded!");
                }
              }}
              className="bg-slate-800 border border-slate-700 hover:border-sky-500/40 px-2 py-1 text-sky-400 transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> DXF
            </button>
            <button
              onClick={regenerateElevationFromRender}
              disabled={isProcessingAi}
              className="bg-indigo-700 hover:bg-indigo-600 border border-indigo-500 text-white px-2 py-1 transition flex items-center gap-1"
            >
              {isProcessingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              From Render
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

              {/* The Wall Elevation Projection */}
              {(() => {
                const wallW = wallLength * scaleX;
                const wallH = wallHeight * scaleY;
                const startX = marginX;
                const startY = svgH - marginY - wallH;

                return (
                  <g>
                    {/* Bold Outer Wall Outline */}
                    <rect 
                      x={startX} 
                      y={startY} 
                      width={wallW} 
                      height={wallH} 
                      fill="rgba(30, 41, 59, 0.05)" 
                      stroke="#9ca3af" 
                      strokeWidth="2.5" 
                    />

                    {/* Subtle Tile Backsplash Area (dado zone between 850mm counter and 1450mm wall unit) */}
                    <rect 
                      x={startX} 
                      y={svgH - marginY - 1450 * scaleY} 
                      width={wallW} 
                      height={600 * scaleY} 
                      fill="url(#backsplash-tile)" 
                      opacity="0.4"
                    />

                    {/* Standard Horizontal Reference Guidelines */}
                    {[
                      { h: 100, label: 'PLINTH SKIRTING (100)' },
                      { h: 850, label: 'BASE COUNTERTOP (850)' },
                      { h: 1450, label: 'WALL CABINET BOTTOM / DADO (1450)' },
                      { h: 2100, label: 'LINTEL LEVEL (2100)' }
                    ].map((lvl, index) => {
                      const lvlY = svgH - marginY - lvl.h * scaleY;
                      return (
                        <g key={`grid-line-${index}`}>
                          <line 
                            x1={startX - 15} 
                            y1={lvlY} 
                            x2={startX + wallW + 15} 
                            y2={lvlY} 
                            stroke="rgba(148, 163, 184, 0.25)" 
                            strokeWidth="0.5" 
                            strokeDasharray="3,3"
                          />
                          <text 
                            x={startX - 20} 
                            y={lvlY + 2.5} 
                            fill="#64748b" 
                            fontSize="5.5" 
                            textAnchor="end"
                            fontFamily="monospace"
                          >
                            {lvl.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Plinth Floor Level line */}
                    <line 
                      x1={startX - 20} 
                      y1={svgH - marginY} 
                      x2={startX + wallW + 20} 
                      y2={svgH - marginY} 
                      stroke="#475569" 
                      strokeWidth="1.5" 
                      strokeDasharray="4,4"
                    />

                    {/* Plinth Height level label */}
                    <text x={startX - 25} y={svgH - marginY + 3} fill="#64748b" fontSize="6.5" textAnchor="end">PLINTH LVL (100)</text>

                    {/* Doors & Windows Openings */}
                    {wallOpenings.map(op => {
                      // Project position
                      const opX = startX + ((Math.max(0, op.x - selectedWall.x1) / pixelsPerMeter) * 1000) * scaleX;
                      const opW = (op.width || 50) * 10 * scaleX;
                      const opH = op.type === 'door' ? 2100 * scaleY : 1200 * scaleY;
                      const opY = op.type === 'door' ? (svgH - marginY - opH) : (svgH - marginY - 1000 * scaleY - opH); // window starts at 1000mm sill height

                      return (
                        <g key={op.id}>
                          {/* Main Opening frame */}
                          <rect 
                            x={opX} 
                            y={opY} 
                            width={opW} 
                            height={opH} 
                            fill="#0d0f1b" 
                            stroke="#38bdf8" 
                            strokeWidth="1.5" 
                          />
                          
                          {/* Micro-detailing for door/window frame outlines */}
                          {op.type === 'door' ? (
                            <>
                              {/* Inner door frame outline */}
                              <rect 
                                x={opX + 5} 
                                y={opY + 5} 
                                width={opW - 10} 
                                height={opH - 5} 
                                fill="none" 
                                stroke="#38bdf8" 
                                strokeWidth="0.8" 
                                opacity="0.6" 
                              />
                              {/* Door handle / lever */}
                              <rect 
                                x={opX + opW - 12} 
                                y={opY + opH / 2 - 6} 
                                width={4} 
                                height={12} 
                                rx={1} 
                                fill="#ffffff" 
                                stroke="#38bdf8" 
                                strokeWidth="0.5" 
                              />
                            </>
                          ) : (
                            <>
                              {/* Inner window frame */}
                              <rect 
                                x={opX + 4} 
                                y={opY + 4} 
                                width={opW - 8} 
                                height={opH - 8} 
                                fill="none" 
                                stroke="#38bdf8" 
                                strokeWidth="0.8" 
                                opacity="0.6" 
                              />
                              {/* Pane divisions */}
                              <line 
                                x1={opX + opW / 2} 
                                y1={opY} 
                                x2={opX + opW / 2} 
                                y2={opY + opH} 
                                stroke="#38bdf8" 
                                strokeWidth="1" 
                                opacity="0.7" 
                              />
                              <line 
                                x1={opX} 
                                y1={opY + opH / 2} 
                                x2={opX + opW} 
                                y2={opY + opH / 2} 
                                stroke="#38bdf8" 
                                strokeWidth="0.6" 
                                opacity="0.5" 
                              />
                            </>
                          )}

                          <text 
                            x={opX + opW/2} 
                            y={opY + opH/2} 
                            fill="#38bdf8" 
                            fontSize="8" 
                            textAnchor="middle"
                            fontWeight="bold"
                            opacity="0.85"
                          >
                            {op.type === 'door' ? 'DOOR' : 'WINDOW'}
                          </text>
                        </g>
                      );
                    })}

                    {/* Placed Parametric Cabinets */}
                    {wallCabinets.map(cab => {
                      const cabW = (cab.width || 600) * scaleX;
                      const cabH = (cab.height || 720) * scaleY;
                      const cabX = startX + (cab.xOffsetWall || 0) * scaleX;
                      const cabZ = (cab.zOffset || 0) * scaleY;
                      const cabY = svgH - marginY - cabZ - cabH;

                      const colors = cab.type === 'base' ? '#AA8C2C' 
                                   : cab.type === 'wall' ? '#3b82f6' 
                                   : cab.type === 'loft' ? '#a855f7' 
                                   : '#10b981';

                      const isDrawer = cab.name.toLowerCase().includes('drawer') || cab.name.toLowerCase().includes('pullout');
                      const isDoubleDoor = (cab.width || 600) > 500 && !isDrawer;

                      return (
                        <g key={cab.id} className="group">
                          {/* Cabinet frame */}
                          <rect 
                            x={cabX} 
                            y={cabY} 
                            width={cabW} 
                            height={cabH} 
                            fill={`${colors}12`} 
                            stroke={colors} 
                            strokeWidth="1.5" 
                          />
                          
                          {/* Cabinet door swing guidelines and handles */}
                          {isDrawer ? (
                            <>
                              {/* Drawers: 3 horizontal drawer subdivisions */}
                              <line 
                                x1={cabX} 
                                y1={cabY + cabH / 3} 
                                x2={cabX + cabW} 
                                y2={cabY + cabH / 3} 
                                stroke={colors} 
                                strokeWidth="0.8" 
                              />
                              <line 
                                x1={cabX} 
                                y1={cabY + (2 * cabH) / 3} 
                                x2={cabX + cabW} 
                                y2={cabY + (2 * cabH) / 3} 
                                stroke={colors} 
                                strokeWidth="0.8" 
                              />
                              {/* Drawers handles (3 horizontal pull handles) */}
                              <rect 
                                x={cabX + cabW / 2 - 15} 
                                y={cabY + cabH / 6 - 1.5} 
                                width={30} 
                                height={3} 
                                rx={1} 
                                fill="#ffffff" 
                                opacity="0.9" 
                              />
                              <rect 
                                x={cabX + cabW / 2 - 15} 
                                y={cabY + cabH / 2 - 1.5} 
                                width={30} 
                                height={3} 
                                rx={1} 
                                fill="#ffffff" 
                                opacity="0.9" 
                              />
                              <rect 
                                x={cabX + cabW / 2 - 15} 
                                y={cabY + (5 * cabH) / 6 - 1.5} 
                                width={30} 
                                height={3} 
                                rx={1} 
                                fill="#ffffff" 
                                opacity="0.9" 
                              />
                            </>
                          ) : isDoubleDoor ? (
                            <>
                              {/* Double door vertical center partition line */}
                              <line 
                                x1={cabX + cabW / 2} 
                                y1={cabY} 
                                x2={cabX + cabW / 2} 
                                y2={cabY + cabH} 
                                stroke={colors} 
                                strokeWidth="0.8" 
                              />
                              {/* Symmetrical Left/Right Hinge swing dashed lines meeting at center */}
                              <polyline 
                                points={`${cabX},${cabY} ${cabX + cabW / 2},${cabY + cabH / 2} ${cabX},${cabY + cabH}`} 
                                fill="none" 
                                stroke={colors} 
                                strokeWidth="0.5" 
                                strokeDasharray="2,2" 
                                opacity="0.65" 
                              />
                              <polyline 
                                points={`${cabX + cabW},${cabY} ${cabX + cabW / 2},${cabY + cabH / 2} ${cabX + cabW},${cabY + cabH}`} 
                                fill="none" 
                                stroke={colors} 
                                strokeWidth="0.5" 
                                strokeDasharray="2,2" 
                                opacity="0.65" 
                              />
                              {/* Double door handles */}
                              <rect 
                                x={cabX + cabW / 2 - 7} 
                                y={cabY + cabH / 2 - 10} 
                                width={1.5} 
                                height={20} 
                                rx={0.5} 
                                fill="#ffffff" 
                                opacity="0.9" 
                              />
                              <rect 
                                x={cabX + cabW / 2 + 5.5} 
                                y={cabY + cabH / 2 - 10} 
                                width={1.5} 
                                height={20} 
                                rx={0.5} 
                                fill="#ffffff" 
                                opacity="0.9" 
                              />
                            </>
                          ) : (
                            <>
                              {/* Single Door: Left hinged swing dashed lines meeting at right edge */}
                              <polyline 
                                points={`${cabX},${cabY} ${cabX + cabW},${cabY + cabH / 2} ${cabX},${cabY + cabH}`} 
                                fill="none" 
                                stroke={colors} 
                                strokeWidth="0.5" 
                                strokeDasharray="2,2" 
                                opacity="0.65" 
                              />
                              {/* Single door handle near right edge */}
                              <rect 
                                x={cabX + cabW - 7} 
                                y={cabY + cabH / 2 - 10} 
                                width={1.5} 
                                height={20} 
                                rx={0.5} 
                                fill="#ffffff" 
                                opacity="0.9" 
                              />
                            </>
                          )}

                          {/* Module Label */}
                          <text 
                            x={cabX + cabW/2} 
                            y={cabY + cabH/2 + 2} 
                            fill="#ffffff" 
                            fontSize="7" 
                            fontWeight="bold" 
                            textAnchor="middle"
                            fillOpacity="0.8"
                          >
                            {cab.name}
                          </text>

                          {/* Dimensions label below */}
                          <text 
                            x={cabX + cabW/2} 
                            y={cabY + cabH - 5} 
                            fill={colors} 
                            fontSize="5.5" 
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {cab.width} x {cab.height}
                          </text>
                        </g>
                      );
                    })}

                    {/* Overall Dimension Annotations */}
                    {/* Top Wall Width Dimension */}
                    <line x1={startX} y1={startY - 15} x2={startX + wallW} y2={startY - 15} stroke="#d4c5b2" strokeWidth="0.8" />
                    <line x1={startX} y1={startY - 20} x2={startX} y2={startY - 10} stroke="#d4c5b2" strokeWidth="0.8" />
                    <line x1={startX + wallW} y1={startY - 20} x2={startX + wallW} y2={startY - 10} stroke="#d4c5b2" strokeWidth="0.8" />
                    <text x={startX + wallW/2} y={startY - 20} fill="#d4c5b2" fontSize="7.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      {wallLength} mm
                    </text>

                    {/* Right Side Wall Height Dimension */}
                    <line x1={startX + wallW + 15} y1={startY} x2={startX + wallW + 15} y2={svgH - marginY} stroke="#d4c5b2" strokeWidth="0.8" />
                    <line x1={startX + wallW + 10} y1={startY} x2={startX + wallW + 20} y2={startY} stroke="#d4c5b2" strokeWidth="0.8" />
                    <line x1={startX + wallW + 10} y1={svgH - marginY} x2={startX + wallW + 20} y2={svgH - marginY} stroke="#d4c5b2" strokeWidth="0.8" />
                    <text x={startX + wallW + 25} y={startY + wallH/2 + 2.5} fill="#d4c5b2" fontSize="7.5" textAnchor="start" fontFamily="monospace" fontWeight="bold">
                      {wallHeight} mm
                    </text>
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
