import React, { useState, useEffect } from 'react';
import { Layers, Save, ZoomIn, ZoomOut, Maximize, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight, Scissors, Database, FileText, Download, CheckCircle, Table, BarChart3, HelpCircle } from 'lucide-react';
import WorkflowStatusBar from '../components/WorkflowStatusBar';

export default function CutlistNestingScreen({ projectId, onComplete }) {
  const [cabinets, setCabinets] = useState([
    { type: 'base_cabinet', h: 720, w: 600, d: 560, plinthH: 100, carcassPly: 18, backPly: 6, shutterPly: 19, jointType: 'butt', edgebandType: '0.8mm' }
  ]);
  
  const [globalOptions, setGlobalOptions] = useState({
    bladeKerf: 3,
    trimMargin: 10,
    mode: 'cnc',
    carcassPly: 18,
    backPly: 6,
    plinthH: 100
  });

  const [parts, setParts] = useState([]);
  const [nestingSheets, setNestingSheets] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadSavedCutlist();
      fetch(`/api/projects/${projectId}`)
        .then(r => r.json())
        .then(d => setProject(d && d.id ? d : null))
        .catch(() => {});
    }
  }, [projectId]);

  const loadSavedCutlist = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/cutlist`);
      const data = await res.json();
      const safe = data && typeof data === 'object' ? data : {};
      const loadedParts = JSON.parse(safe.cutlist_data_json || '[]');
      const loadedNesting = JSON.parse(safe.optimized_sheets_json || '{}');
      
      setParts(loadedParts);
      setNestingSheets(loadedNesting);
    } catch (err) {
      console.error("Error loading cutlist:", err);
    }
  };

  const addCabinet = () => {
    setCabinets(prev => [
      ...prev,
      { type: 'wardrobe_box', h: 2100, w: 900, d: 600, plinthH: 100, carcassPly: 18, backPly: 6, shutterPly: 19, jointType: 'butt', edgebandType: '2.0mm' }
    ]);
  };

  const removeCabinet = (idx) => {
    const updated = [...cabinets];
    updated.splice(idx, 1);
    setCabinets(updated);
  };

  const updateCabinetVal = (idx, field, val) => {
    const updated = [...cabinets];
    updated[idx][field] = val;
    setCabinets(updated);
  };

  const runNestingOptimization = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/cutlist/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cabinets,
          options: globalOptions
        })
      });
      const data = await res.json();
      
      setParts(Array.isArray(data.parts) ? data.parts : []);
      setNestingSheets(data.nesting && typeof data.nesting === 'object' && !Array.isArray(data.nesting) ? data.nesting : {});
      setIsCalculating(false);
    } catch (err) {
      console.error("Calculation failed:", err);
      setIsCalculating(false);
    }
  };

  const downloadExcelWorkbook = () => {
    // Simulated Download or call backend
    window.open(`/api/projects/${projectId}/signoff/pdf`, '_blank');
  };

  // Render optimized panel maps nested inside 8x4 sheet boundaries
  const renderNestingSheetMap = (materialName, sheetData) => {
    const sheetW = 2440;
    const sheetH = 1220;
    
    // Scale down coordinates to fit screen boundaries (SVG viewbox 600 x 300)
    const scaleX = 500 / sheetW;
    const scaleY = 250 / sheetH;

    const colorsList = ['#AA8C2C', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f97316'];

    return (
      <div className="space-y-4">
        {sheetData.sheets.map((sheet, sIdx) => (
          <div key={sheet.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-300">Sheet #{sIdx + 1} ({materialName})</span>
              <span className="text-[10px] text-slate-500 font-mono">Used Area: {((sheet.usedArea / (sheetW*sheetH))*100).toFixed(1)}%</span>
            </div>

            <div className="border border-slate-800 bg-[#080c14] relative flex items-center justify-center p-2 rounded-lg">
              <svg viewBox="0 0 520 270" className="w-full h-auto">
                {/* Border trim boundaries */}
                <rect x="2" y="2" width="516" height="266" fill="none" stroke="#374151" strokeDasharray="3,3" strokeWidth="0.5" />
                
                {/* Standard Sheet Boundary */}
                <rect x="10" y="10" width="500" height="250" fill="rgba(31, 41, 55, 0.2)" stroke="#4b5563" strokeWidth="1.5" />

                {/* Placed Panels */}
                {sheet.panelsPlaced.map((p, pIdx) => {
                  const x = 10 + p.x * scaleX;
                  const y = 10 + p.y * scaleY;
                  const w = p.w * scaleX;
                  const h = p.h * scaleY;
                  const color = colorsList[pIdx % colorsList.length];

                  return (
                    <g key={p.id}>
                      {/* Panel outline */}
                      <rect 
                        x={x} y={y} width={w} height={h} 
                        fill={`${color}15`} 
                        stroke={color} 
                        strokeWidth="1" 
                      />
                      {/* Panel Title label */}
                      {w > 35 && h > 15 && (
                        <text 
                          x={x + w/2} y={y + h/2 + 2} 
                          fill="#ffffff" 
                          fontSize="6.5" 
                          fontWeight="bold" 
                          textAnchor="middle"
                          fillOpacity="0.8"
                        >
                          {p.name.replace('Panel', '').substring(0, 12)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WorkflowStatusBar
        stageLabel="Cutlist & Nesting"
        nextAction={parts.length === 0
          ? 'Add cabinet modules, then run CNC nesting to produce the cutlist and sheet layout.'
          : (project?.stale_drawings === 1
              ? 'Drawings changed — re-run nesting to keep the cutlist synced with the scene graph.'
              : 'Export the cutlist and optimized sheets for the CNC shop.')}
        outputLabel="Part cutlist · optimized sheet nesting · DXF"
        stageComplete={project?.stale_drawings !== 1}
        stale={project?.stale_drawings}
        approvedCount={parts.length > 0 ? 1 : 0}
        needsReview={0}
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6 overflow-y-auto h-full max-h-screen pb-24 select-none">

      {/* 1. Cabinet Parameters Intake Board */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[75vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
            <Scissors className="w-4.5 h-4.5 text-brand-500" />
            Carcass Slicing Cabinets
          </h2>
          <button 
            onClick={addCabinet}
            className="bg-brand-500/15 border border-brand-500/30 hover:bg-brand-500/25 text-brand-500 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition"
          >
            + Add Cabinet
          </button>
        </div>

        {/* Global Nesting & Board Parameters */}
        <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl mb-4 text-xs space-y-2.5 shrink-0">
          <h3 className="text-[10px] font-extrabold text-[var(--gold)] uppercase tracking-wider">
            Nesting & Plywood Standards
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-0.5">Nesting Mode</label>
              <select
                value={globalOptions.mode}
                onChange={(e) => setGlobalOptions(prev => ({ ...prev, mode: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 font-bold"
              >
                <option value="cnc">CNC Router (MaxRects)</option>
                <option value="guillotine">Table Saw (Guillotine)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Saw Blade Kerf (mm)</label>
              <input
                type="number"
                value={globalOptions.bladeKerf}
                onChange={(e) => setGlobalOptions(prev => ({ ...prev, bladeKerf: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-slate-400 block mb-0.5">Carcass (mm)</label>
              <input
                type="number"
                value={globalOptions.carcassPly}
                onChange={(e) => setGlobalOptions(prev => ({ ...prev, carcassPly: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Backing (mm)</label>
              <input
                type="number"
                value={globalOptions.backPly}
                onChange={(e) => setGlobalOptions(prev => ({ ...prev, backPly: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Plinth (mm)</label>
              <input
                type="number"
                value={globalOptions.plinthH}
                onChange={(e) => setGlobalOptions(prev => ({ ...prev, plinthH: parseInt(e.target.value) || 0 }))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-200 font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {cabinets.map((cab, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-3 relative text-xs">
              <button 
                onClick={() => removeCabinet(idx)}
                className="absolute top-3 right-3 text-red-400 hover:bg-red-950/40 p-1 rounded transition text-[10px] font-bold px-2 py-0.5"
              >
                Delete
              </button>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">Cabinet Template</label>
                  <select
                    value={cab.type}
                    onChange={(e) => updateCabinetVal(idx, 'type', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                  >
                    <option value="base_cabinet">Modular Base Unit</option>
                    <option value="wardrobe_box">Wardrobe Carcass</option>
                    <option value="wall_loft">Kitchen Wall Loft</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Edge Banding</label>
                  <select
                    value={cab.edgebandType}
                    onChange={(e) => updateCabinetVal(idx, 'edgebandType', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                  >
                    <option value="0.8mm">0.8 mm (India Standard)</option>
                    <option value="2.0mm">2.0 mm (Premium PVC)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-0.5">Height (mm)</label>
                  <input 
                    type="number" value={cab.h} 
                    onChange={(e) => updateCabinetVal(idx, 'h', parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Width (mm)</label>
                  <input 
                    type="number" value={cab.w} 
                    onChange={(e) => updateCabinetVal(idx, 'w', parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-0.5">Depth (mm)</label>
                  <input 
                    type="number" value={cab.d} 
                    onChange={(e) => updateCabinetVal(idx, 'd', parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={runNestingOptimization}
          disabled={isCalculating}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition shrink-0"
        >
          {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          Run Nesting Slices
        </button>
      </div>

      {/* 2. Nesting Maps SVG Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[75vh]">
        <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2 mb-4 shrink-0">
          <BarChart3 className="w-4.5 h-4.5 text-brand-500" />
          Optimized Nesting Map
        </h2>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {Object.keys(nestingSheets).map(matName => (
            <div key={matName} className="space-y-2">
              <strong className="text-xs text-brand-500 uppercase tracking-widest block">{matName} Slices</strong>
              {renderNestingSheetMap(matName, nestingSheets[matName])}
            </div>
          ))}
          {Object.keys(nestingSheets).length === 0 && (
            <div className="text-center text-slate-500 py-20 text-xs font-semibold">
              No nesting coordinates calculated. Click Run Nesting Slices.
            </div>
          )}
        </div>
      </div>

      {/* 3. Detailed Slicing Dimensions Table & Handoff */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[75vh]">
        <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2 mb-4 shrink-0">
          <Table className="w-4.5 h-4.5 text-brand-500" />
          Exact Slicing Coordinates
        </h2>

        <div className="flex-grow overflow-y-auto space-y-4 pr-1">
          <table className="w-full text-[10px] text-left text-slate-400">
            <thead className="text-[9px] text-slate-500 uppercase bg-slate-950 font-bold">
              <tr>
                <th className="px-2 py-2">Part Label</th>
                <th className="px-2 py-2">Size (L x W)</th>
                <th className="px-2 py-2">Qty</th>
                <th className="px-2 py-2 text-right">Ply Thickness</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part, pIdx) => (
                <tr key={pIdx} className="border-b border-slate-850 hover:bg-slate-950/40">
                  <td className="px-2 py-2 font-semibold text-slate-300">{part.name}</td>
                  <td className="px-2 py-2 font-mono">{Math.round(part.length)} x {Math.round(part.width)} mm</td>
                  <td className="px-2 py-2">{part.qty}</td>
                  <td className="px-2 py-2 text-right">{part.material}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parts.length === 0 && (
            <div className="text-center text-slate-500 py-20 text-xs font-semibold">
              Calculate cabinet joints to view panel parts slicing details.
            </div>
          )}
        </div>

        <div className="space-y-3 shrink-0 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg text-[9px] text-slate-400 flex gap-2">
            <HelpCircle className="w-4.5 h-4.5 text-brand-500 shrink-0" />
            <span>
              All dimensions have edge banding thickness subtracted (e.g. -0.8mm or -2.0mm) according to the configured cabinet sides.
            </span>
          </div>

          <button
            onClick={() => {
              if (onComplete) onComplete();
            }}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
          >
            <CheckCircle className="w-4 h-4" />
            Handoff to Production (Complete)
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
