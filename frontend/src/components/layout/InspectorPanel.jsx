import React, { useMemo } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { selectSelectedEntity, selectModules, selectActiveLevel } from '../../lib/selectors/editorSelectors';
import MaterialSelector from '../design3d/MaterialSelector';
import {
  Sliders, Trash2, CheckCircle2, AlertTriangle, XCircle, Info, 
  HelpCircle, Compass, BadgeIndianRupee, Layers, Copy 
} from 'lucide-react';

const LAMINATE_PALETTE = [
  { id: 'lam_1', name: 'Premium Frosty White SF', brand: 'CenturyPly', color: '#f3f4f6' },
  { id: 'lam_2', name: 'Classic Warm Oak Woodgrain', brand: 'Greenlam', color: '#c29a6b' },
  { id: 'lam_3', name: 'Charcoal Matte Acrylic', brand: 'Merino', color: '#1e293b' },
  { id: 'lam_4', name: 'Light Beige Gloss SF', brand: 'CenturyPly', color: '#e5e5e0' }
];

export default function InspectorPanel() {
  const selectedEntity = useEditorStore(selectSelectedEntity);
  const selectedType = useEditorStore(state => state.selectedType);
  const selectedId = useEditorStore(state => state.selectedId);
  const applyPatch = useEditorStore(state => state.applyPatch);
  const isLocked = useEditorStore(state => state.isLocked);
  const duplicateModule = useEditorStore(state => state.duplicateModule);
  const applyBulkTemplate = useEditorStore(state => state.applyBulkTemplate);
  const materialsCatalog = useEditorStore(state => state.materialsCatalog) || [];
  const laminatePalette = materialsCatalog.filter(m => m.category === 'laminate');
  const paletteToUse = laminatePalette.length > 0 ? laminatePalette : LAMINATE_PALETTE;
  
  // Validation warnings list
  const validation = useEditorStore(state => state.validationResult);
  
  // Total Cost Accumulation
  const modules = useEditorStore(selectModules);
  const level = useEditorStore(selectActiveLevel);

  // Live budget estimate based on carcass parameters and materials
  const liveBudgetEstimate = useMemo(() => {
    let total = 0;
    modules.forEach(m => {
      const { widthMm = 600, heightMm = 720, depthMm = 560 } = m.geometry.size;
      const volumeM3 = (widthMm * heightMm * depthMm) / 1e9;
      
      // Calculate unit rate depending on module type
      let rate = 12000; // base rate per cubic meter
      if (m.moduleType.includes('wardrobe')) rate = 22000;
      else if (m.moduleType.includes('tv_unit')) rate = 15000;
      else if (m.moduleType.includes('mandir')) rate = 28000;
      
      // Material factor multiplier
      let matMultiplier = 1.0;
      const mat = m.materialAssignments?.shutter;
      if (mat === 'lam_3') matMultiplier = 1.4; // Acrylic is premium
      else if (mat === 'lam_2') matMultiplier = 1.25; // Woodgrain

      total += volumeM3 * rate * matMultiplier;
    });

    // Add wall paneling linear pricing
    level?.walls?.forEach(w => {
      const lengthMm = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
      total += (lengthMm / 1000) * 1200; // Rs 1200 per meter wall paint/finish
    });

    return Math.round(total);
  }, [modules, level]);

  const handleGeometryChange = (field, val) => {
    if (isLocked || !selectedEntity) return;
    
    // Read current values
    const currentGeo = selectedEntity.geometry;
    const { x, y, z } = currentGeo.anchor;
    const { widthMm, heightMm, depthMm } = currentGeo.size;
    const rotationDeg = currentGeo.rotationDeg;

    let newAnchor = { x, y, z };
    let newSize = { widthMm, heightMm, depthMm };
    let newRotation = rotationDeg;

    const parsedVal = parseFloat(val) || 0;

    if (field === 'x') newAnchor.x = parsedVal;
    else if (field === 'y') newAnchor.y = parsedVal;
    else if (field === 'z') newAnchor.z = parsedVal;
    else if (field === 'width') newSize.widthMm = parsedVal;
    else if (field === 'height') newSize.heightMm = parsedVal;
    else if (field === 'depth') newSize.depthMm = parsedVal;
    else if (field === 'rotation') newRotation = parsedVal;

    applyPatch({
      op: 'update_module_params',
      payload: {
        moduleId: selectedId,
        geometry: {
          anchor: newAnchor,
          size: newSize,
          rotationDeg: newRotation
        }
      }
    });
  };

  const handleMaterialChange = (slot, materialId) => {
    if (isLocked || !selectedEntity) return;
    applyPatch({
      op: 'assign_material',
      payload: {
        moduleId: selectedId,
        slotKey: slot,
        materialId
      }
    });
  };

  const handleRoomMetaChange = (field, val) => {
    if (isLocked || !selectedEntity) return;
    
    const payload = { roomId: selectedId };
    if (field === 'name') payload.name = val;
    if (field === 'roomType') payload.roomType = val;
    if (field === 'heightMm') payload.heightMm = parseFloat(val) || 2900;
    if (field === 'vastuZone') {
      payload.constraints = { ...selectedEntity.constraints, vastuZone: val };
    }

    applyPatch({
      op: 'update_room_metadata',
      payload
    });
  };

  const handleRemoveModule = async () => {
    if (isLocked || !selectedEntity) return;
    const ok = await window.__auraConfirm?.confirm?.('Delete Module', `Delete module "${selectedEntity.name}"?`) || Promise.resolve(false);
    if (ok) {
      applyPatch({
        op: 'remove_module',
        payload: { moduleId: selectedId }
      });
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden text-slate-200">
      
      {/* Scrollable Context Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* 1. Selection Inspector */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5 shrink-0">
            <Sliders className="w-3.5 h-3.5 text-[var(--gold)]" /> Properties Inspector
          </h3>

          {!selectedEntity ? (
            <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl text-center text-slate-500 text-xs">
              Select any Room, Wall, or Cabinet Module on the canvas to inspect and edit details.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              
              {/* Type tag */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Entity Type</span>
                <span className="bg-[var(--gold)]/15 text-[var(--gold)] px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                  {selectedType}
                </span>
              </div>

              {/* MODULE INSPECTOR */}
              {selectedType === 'module' && (
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Component Name</label>
                    <input
                      type="text"
                      value={selectedEntity.name || ""}
                      readOnly
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-slate-400 select-all outline-none"
                    />
                  </div>

                  {/* Dimensions fields */}
                  <div className="space-y-2">
                    <label className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Carcass Size (mm)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 block">Width (W)</span>
                        <input
                          type="number"
                          value={selectedEntity.geometry.size.widthMm}
                          onChange={(e) => handleGeometryChange('width', e.target.value)}
                          disabled={isLocked}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-center font-mono focus:border-[var(--gold)] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 block">Height (H)</span>
                        <input
                          type="number"
                          value={selectedEntity.geometry.size.heightMm}
                          onChange={(e) => handleGeometryChange('height', e.target.value)}
                          disabled={isLocked}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-center font-mono focus:border-[var(--gold)] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 block">Depth (D)</span>
                        <input
                          type="number"
                          value={selectedEntity.geometry.size.depthMm}
                          onChange={(e) => handleGeometryChange('depth', e.target.value)}
                          disabled={isLocked}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-center font-mono focus:border-[var(--gold)] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Positions field */}
                  <div className="space-y-2">
                    <label className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Scene Coordinates (mm)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 block">Offset X</span>
                        <input
                          type="number"
                          value={selectedEntity.geometry.anchor.x}
                          onChange={(e) => handleGeometryChange('x', e.target.value)}
                          disabled={isLocked}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-center font-mono focus:border-[var(--gold)] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 block">Offset Y</span>
                        <input
                          type="number"
                          value={selectedEntity.geometry.anchor.y}
                          onChange={(e) => handleGeometryChange('y', e.target.value)}
                          disabled={isLocked}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-center font-mono focus:border-[var(--gold)] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 block">Angle (Rot)</span>
                        <input
                          type="number"
                          value={selectedEntity.geometry.rotationDeg || 0}
                          onChange={(e) => handleGeometryChange('rotation', e.target.value)}
                          disabled={isLocked}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-center font-mono focus:border-[var(--gold)] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Materials slot picker — full multi-slot 3D material selector */}
                  <MaterialSelector
                    module={selectedEntity}
                    moduleType={selectedEntity.moduleType}
                    palette={paletteToUse}
                    isLocked={isLocked}
                    onChange={handleMaterialChange}
                  />

                  {/* Duplicate and Delete buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => duplicateModule(selectedId)}
                      disabled={isLocked}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                        isLocked
                          ? 'bg-slate-800 text-slate-600 border-transparent cursor-not-allowed'
                          : 'bg-slate-950 hover:bg-slate-850 text-[var(--gold)] border-slate-850 hover:border-[var(--gold)]/35'
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    <button
                      onClick={handleRemoveModule}
                      disabled={isLocked}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        isLocked
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/35'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}

              {/* ROOM INSPECTOR */}
              {selectedType === 'room' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Room Display Label</label>
                    <input
                      type="text"
                      value={selectedEntity.name || ""}
                      onChange={(e) => handleRoomMetaChange('name', e.target.value)}
                      disabled={isLocked}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-[var(--gold)] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block">Type</label>
                      <select
                        value={selectedEntity.roomType}
                        onChange={(e) => handleRoomMetaChange('roomType', e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-slate-200 outline-none"
                      >
                        <option value="living_room">Living Area</option>
                        <option value="kitchen">Modular Kitchen</option>
                        <option value="master_bedroom">Master Bed</option>
                        <option value="mandir_room">Mandir Room</option>
                        <option value="foyer">Foyer</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-semibold block">Slab H (mm)</label>
                      <input
                        type="number"
                        value={selectedEntity.heightMm}
                        onChange={(e) => handleRoomMetaChange('heightMm', e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 font-mono text-center outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Vastu Orientation Sector</label>
                    <select
                      value={selectedEntity.constraints?.vastuZone || "unknown"}
                      onChange={(e) => handleRoomMetaChange('vastuZone', e.target.value)}
                      disabled={isLocked}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-slate-200 outline-none"
                    >
                      <option value="unknown">Not Specified</option>
                      <option value="N">North (Kuber)</option>
                      <option value="E">East (Surya)</option>
                      <option value="NE">North-East (Eshanya)</option>
                      <option value="SE">South-East (Agni)</option>
                      <option value="NW">North-West (Vayu)</option>
                      <option value="SW">South-West (Niruthi)</option>
                    </select>
                  </div>

                  {/* Bulk Layout Templates */}
                  <div className="space-y-2.5 border-t border-slate-800 pt-4 mt-4">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Bulk Layout Presets</span>
                    <p className="text-[10px] text-slate-500 leading-normal">Place a coordinated set of cabinet runs, hobs, and fixtures at once.</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => applyBulkTemplate('kitchen_l_shape')}
                        disabled={isLocked}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-[var(--gold)]/30 rounded-lg text-[10px] font-bold text-slate-350 transition text-left px-3 flex items-center justify-between"
                      >
                        <span>L-Shaped Kitchen Setup</span>
                        <span className="text-[var(--gold)] font-mono font-normal">3 Units</span>
                      </button>
                      <button
                        onClick={() => applyBulkTemplate('bedroom_suite')}
                        disabled={isLocked}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-[var(--gold)]/30 rounded-lg text-[10px] font-bold text-slate-350 transition text-left px-3 flex items-center justify-between"
                      >
                        <span>Standard Bedroom Combo</span>
                        <span className="text-[var(--gold)] font-mono font-normal">2 Units</span>
                      </button>
                      <button
                        onClick={() => applyBulkTemplate('mandir_setup')}
                        disabled={isLocked}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-[var(--gold)]/30 rounded-lg text-[10px] font-bold text-slate-350 transition text-left px-3 flex items-center justify-between"
                      >
                        <span>Vastu-Compliant Mandir</span>
                        <span className="text-[var(--gold)] font-mono font-normal">1 Unit</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* WALL INSPECTOR */}
              {selectedType === 'wall' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px] mb-1">Endpoints (mm)</span>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 text-slate-300 font-mono text-[10px] space-y-1">
                      <div><b>Start Point:</b> X: {Math.round(selectedEntity.start.x)}, Y: {Math.round(selectedEntity.start.y)}</div>
                      <div><b>End Point:</b> X: {Math.round(selectedEntity.end.x)}, Y: {Math.round(selectedEntity.end.y)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px] mb-1">Thickness</span>
                      <div className="bg-slate-950/40 py-1.5 text-center rounded-lg border border-slate-850 font-mono text-slate-300">
                        {selectedEntity.thicknessMm} mm
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px] mb-1">Height</span>
                      <div className="bg-slate-950/40 py-1.5 text-center rounded-lg border border-slate-850 font-mono text-slate-300">
                        {selectedEntity.heightMm} mm
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Rule Engine Diagnostics */}
        <div className="space-y-2 shrink-0">
          <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
            <Compass className="w-3.5 h-3.5 text-[var(--gold)]" /> Rule Engine Checks
          </h3>
          
          <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
            <div className="bg-emerald-950/20 border border-emerald-900/40 py-1 px-2 rounded-lg text-center text-emerald-400">
              Pass: {validation.passCount}
            </div>
            <div className="bg-amber-950/20 border border-amber-900/40 py-1 px-2 rounded-lg text-center text-amber-400">
              Warn: {validation.warnCount}
            </div>
            <div className="bg-red-950/20 border border-red-900/40 py-1 px-2 rounded-lg text-center text-red-400">
              Fail: {validation.failCount}
            </div>
          </div>

          <div className="space-y-1.5 mt-2 max-h-[220px] overflow-y-auto pr-1">
            {validation.results.length === 0 ? (
              <div className="text-[10px] text-slate-500 py-3 text-center">No validations logged. Add components.</div>
            ) : (
              validation.results.map((res, i) => (
                <div 
                  key={i} 
                  className={`p-2 rounded-lg border text-[10px] flex items-start gap-2 ${
                    res.status === 'pass' 
                      ? 'bg-emerald-950/10 border-emerald-950 text-slate-300' 
                      : res.status === 'warn'
                        ? 'bg-amber-950/10 border-amber-950 text-slate-300'
                        : 'bg-red-950/10 border-red-950 text-slate-300'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {res.status === 'pass' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : res.status === 'warn' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </span>
                  <div>
                    <span className="font-bold text-slate-200 block text-[9px] font-mono tracking-wider">{res.ruleCode}</span>
                    <span className="text-slate-400 leading-relaxed block mt-0.5">{res.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Budget Estimate Widget */}
        <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-2xl space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
              <BadgeIndianRupee className="w-4 h-4 text-[var(--gold)]" /> Live Estimation
            </span>
            <span className="bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-[9px] text-[var(--gold)] uppercase font-mono">Smart Cost</span>
          </div>
          
          <div className="flex justify-between items-baseline mt-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Est. Contract BOQ</span>
            <strong className="text-xl font-black text-slate-100 font-mono text-right">
              ₹{liveBudgetEstimate.toLocaleString('en-IN')}
            </strong>
          </div>
          
          <div className="text-[9px] text-slate-500 border-t border-slate-850/80 pt-1.5 flex justify-between items-center">
            <span>Placed Units: <b>{modules.length}</b></span>
            <span>Walls: <b>{level?.walls?.length || 0}</b></span>
          </div>
        </div>

      </div>

      {/* Locked Status Badge Footer */}
      {isLocked && (
        <div className="p-3 bg-amber-950/15 border-t border-amber-900/30 text-[10px] text-amber-400 shrink-0 flex items-center gap-1.5 font-bold">
          <Info className="w-4 h-4 shrink-0 text-amber-500" />
          <span>Locked Scene: Read-only modifications.</span>
        </div>
      )}
    </div>
  );
}
