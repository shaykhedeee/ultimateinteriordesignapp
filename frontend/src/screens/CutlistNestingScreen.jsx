import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Grid, Layers, Box, IndianRupee, Download, Settings2, FileDown, Ruler, Boxes } from 'lucide-react';

const MACHINES = [
  { id: 'generic', label: 'Generic CNC', desc: '1/2" router, 3mm kerf, 18mm depth' },
  { id: 'beam_saw', label: 'Beam Saw', desc: 'Full-depth panel saw, 4mm kerf' },
  { id: 'nesting_cnc', label: 'Nesting CNC', desc: 'Nesting router, compact parts' },
  { id: 'edge_banding', label: 'Edge Banding', desc: 'Edge trim line only' },
];

export default function CutlistNestingScreen({ projectId }) {
  const [sheetSizeId, setSheetSizeId] = useState('4x8');
  const [materialId, setMaterialId] = useState('bwp');
  const [panelsJson, setPanelsJson] = useState('[]');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [machineType, setMachineType] = useState('generic');

  useEffect(() => {
    if (!projectId) return;
    fetch(`${API_BASE}/projects/${projectId}/cutlist`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.panels_json) setPanelsJson(JSON.stringify(data.panels_json, null, 2));
      })
      .catch(() => {});
  }, [projectId]);

  const compute = () => {
    try {
      const panels = JSON.parse(panelsJson || '[]');
      if (!Array.isArray(panels) || panels.length === 0) {
        setStatus('Add panels first.', 'error');
        return;
      }
      const sheetArea = sheetSizeId === '5x10' ? 50 : sheetSizeId === '5x12' ? 60 : sheetSizeId === '6x12' ? 72 : 32;
      const effectiveYield = materialId === 'bwp' ? 0.88 : materialId === 'mr' ? 0.82 : materialId === 'hdmr' ? 0.9 : 0.72;
      const totalSqft = panels.reduce((s, p) => s + ((p.widthFt || 1) * (p.heightFt || 1)), 0);
      const sheets = Math.max(1, Math.ceil(totalSqft / (sheetArea * effectiveYield)));
      const cost = sheets * (materialId === 'bwp' ? 3200 : materialId === 'mr' ? 1400 : materialId === 'hdmr' ? 1100 : 750);
      setResult({ totalSqft, sheetArea, effectiveYield, sheets, cost });
      setStatus('Done');
      setTimeout(() => setStatus(null), 2400);
    } catch (e) {
      setStatus('Invalid panel list.', 'error');
    }
  };

  const downloadDxf = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/cutlist/dxf?machine=${encodeURIComponent(machineType)}`);
      if (!res.ok) throw new Error('DXF export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cutlist-${projectId}-${machineType}.dxf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('DXF exported');
      setTimeout(() => setStatus(null), 2400);
    } catch (e) {
      setStatus('DXF export failed', 'error');
    }
  };

  const downloadSpec = () => {
    if (!result) return;
    const lines = [
      `Sheet size: ${sheetSizeId}`,
      `Material: ${materialId}`,
      `Sheets needed: ${result.sheets}`,
      `Yield: ${Math.round(result.effectiveYield * 100)}%`,
      `Cost: ₹${Math.round(result.cost).toLocaleString('en-IN')}`
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nesting-${projectId || 'draft'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Estimate exported');
    setTimeout(() => setStatus(null), 2400);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-5 bg-slate-950 text-slate-100 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Cutlist & Nesting
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Cut parts, choose machine, export DXF.</p>
        </div>
        {projectId && (
          <div className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            {projectId}
          </div>
        )}
      </div>

      {status && (
        <div aria-live="polite" className="border border-emerald-800 bg-emerald-950/40 text-emerald-300 text-[11px] font-bold px-4 py-2 rounded-lg">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="space-y-4 xl:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Machine</label>
              <div className="grid grid-cols-2 gap-2">
                {MACHINES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMachineType(m.id)}
                    className={`text-left border rounded-xl px-3 py-2 transition ${
                      machineType === m.id ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#C9A84C]' : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wide">{m.label}</div>
                    <div className="text-[9px] font-mono">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sheet</label>
                <select value={sheetSizeId} onChange={(e) => setSheetSizeId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
                  <option value="4x8">4×8 ft</option>
                  <option value="5x10">5×10 ft</option>
                  <option value="5x12">5×12 ft</option>
                  <option value="6x12">6×12 ft</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Material</label>
                <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
                  <option value="bwp">BWP Marine Ply</option>
                  <option value="mr">MR Commercial Ply</option>
                  <option value="hdmr">HDMR / MDF</option>
                  <option value="particle">Particle Board</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Panels</label>
              <textarea
                value={panelsJson}
                onChange={(e) => setPanelsJson(e.target.value)}
                rows="8"
                placeholder="[{'widthFt':2,'heightFt':4}, ...]"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono text-slate-200 outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <button onClick={compute} className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B08968] text-slate-950 font-extrabold text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5">
              <Boxes className="w-3.5 h-3.5" /> Compute Cutlist
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            {result ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Panels Area', value: `${result.totalSqft.toFixed(2)} sqft`, icon: Ruler },
                    { label: 'Sheet Area', value: `${result.sheetArea} sqft`, icon: Grid },
                    { label: 'Sheets', value: result.sheets, icon: Layers },
                    { label: 'Cost', value: `₹${Math.round(result.cost).toLocaleString('en-IN')}`, icon: IndianRupee }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
                      <item.icon className="w-3.5 h-3.5 text-[#D4AF37] mx-auto mb-1" />
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">{item.label}</span>
                      <strong className="text-[11px] text-slate-200 block mt-0.5">{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between"><span>Yield</span><span>{Math.round(result.effectiveYield * 100)}%</span></div>
                  <div className="flex justify-between font-black text-[#D4AF37] text-xs"><span>Cut cost</span><span>₹{Math.round(result.cost).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Machine</span><span className="font-bold text-slate-200">{MACHINES.find(m => m.id === machineType)?.label || machineType}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadSpec} className="border border-slate-800 text-slate-300 font-bold uppercase text-[10px] px-3 py-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5">
                    <FileDown className="w-3.5 h-3.5" /> Export Sheet Text
                  </button>
                  <button onClick={downloadDxf} className="border border-[#D4AF37]/40 text-[#C9A84C] font-bold uppercase text-[10px] px-3 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Export DXF
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 text-center py-10">
                Enter panels and compute cutlist.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
