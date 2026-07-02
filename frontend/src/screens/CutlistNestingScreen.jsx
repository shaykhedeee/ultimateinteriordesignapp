import React, { useState, useEffect } from 'react';
import { Grid, Layers, Box, IndianRupee, Download } from 'lucide-react';

const SHEET_SIZES = [
  { id: '4x8', label: '4×8 ft standard', wFt: 4, hFt: 8 },
  { id: '5x10', label: '5×10 ft Bwp ply', wFt: 5, hFt: 10 },
  { id: '5x12', label: '5×12 teak ply', wFt: 5, hFt: 12 },
  { id: '6x12', label: '6×12 HDMR', wFt: 6, hFt: 12 }
];

const MATERIALS = [
  { id: 'bwp', label: 'BWP Marine Ply', ratePerSheet: 3200, utilizationPct: 0.88 },
  { id: 'mr', label: 'MR Commercial Ply', ratePerSheet: 1400, utilizationPct: 0.82 },
  { id: 'hdmr', label: 'HDMR / MDF', ratePerSheet: 1100, utilizationPct: 0.9 },
  { id: 'particle', label: 'Particle Board', ratePerSheet: 750, utilizationPct: 0.72 }
];

export default function CutlistNestingScreen({ projectId }) {
  const [sheetSizeId, setSheetSizeId] = useState(SHEET_SIZES[0].id);
  const [materialId, setMaterialId] = useState(MATERIALS[0].id);
  const [panelsJson, setPanelsJson] = useState('[]');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    fetch(`http://127.0.0.1:5055/api/projects/${projectId}/cutlist`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.panels_json) setPanelsJson(JSON.stringify(data.panels_json, null, 2));
      })
      .catch(() => {});
  }, [projectId]);

  const sheet = SHEET_SIZES.find(s => s.id === sheetSizeId) || SHEET_SIZES[0];
  const material = MATERIALS.find(m => m.id === materialId) || MATERIALS[0];
  const sheetAreaSqft = sheet.wFt * sheet.hFt;

  const compute = () => {
    try {
      const panels = JSON.parse(panelsJson || '[]');
      if (!Array.isArray(panels) || panels.length === 0) {
        setStatus('Add at least one panel first.', 'error');
        return;
      }
      const totalRequiredSqft = panels.reduce((sum, p) => sum + (p.widthFt || 1) * (p.heightFt || 1), 0);
      const effectiveYield = material.utilizationPct;
      const sheetsRequired = Math.max(1, Math.ceil(totalRequiredSqft / (sheetAreaSqft * effectiveYield)));
      const cost = sheetsRequired * material.ratePerSheet;
      setResult({ totalRequiredSqft, sheetAreaSqft, effectiveYield, sheetsRequired, cost, technology: 'maxrects', materialRate: material.ratePerSheet });
      setStatus('Nesting estimate computed.');
      setTimeout(() => setStatus(null), 2400);
    } catch (e) {
      setStatus('Invalid panels JSON.', 'error');
    }
  };

  const downloadSpec = () => {
    if (!result) return;
    const buffer = []; buffer.push(`Nest Estimate`); buffer.push(`Material: ${material.label}`); buffer.push(`Sheets: ${result.sheetsRequired} x ${sheet.label}`); buffer.push(`Waste-adjusted yield: ${Math.round(result.effectiveYield * 100)}%`); buffer.push(`Total cost: ₹${Math.round(result.cost).toLocaleString('en-IN')}`);
    const blob = new Blob([buffer.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nesting-${projectId || 'draft'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Nest spec exported.');
    setTimeout(() => setStatus(null), 2200);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Cutlist & Nesting
          </h2>
          <p className="text-[10px] text-[#8A8899] mt-0.5">Sheet optimization, waste-adjusted buy qty, and quick quote.</p>
        </div>
        {projectId && (
          <div className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            Project: {projectId}
          </div>
        )}
      </div>

      {status && (
        <div aria-live="polite" className="border border-emerald-800 bg-emerald-950/40 text-emerald-300 text-[11px] font-bold px-4 py-2 rounded-lg">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-4 xl:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sheet size</label>
              <select value={sheetSizeId} onChange={(e) => setSheetSizeId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
                {SHEET_SIZES.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Material</label>
              <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
                {MATERIALS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Panels JSON</label>
              <textarea value={panelsJson} onChange={(e) => setPanelsJson(e.target.value)} rows="8" placeholder="[{'widthFt':2,'heightFt':4}, ...]" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[10px] font-mono text-slate-200 outline-none focus:border-[#D4AF37] resize-none" />
            </div>
            <button onClick={compute} className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B08968] text-slate-950 font-extrabold text-[10px] uppercase tracking-wider rounded-xl">Compute Nesting</button>
          </div>
        </div>
        <div className="xl:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            {result ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Panels Area', value: `${result.totalRequiredSqft.toFixed(2)} sqft` },
                    { label: 'Sheet Area', value: `${result.sheetAreaSqft} sqft` },
                    { label: 'Sheets Needed', value: `${result.sheetsRequired}` },
                    { label: 'Material Rate', value: `₹${Math.round(result.materialRate).toLocaleString('en-IN')}` }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">{item.label}</span>
                      <strong className="text-[11px] text-slate-200 block mt-0.5">{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between"><span>Yield factor</span><span>{Math.round(result.effectiveYield * 100)}%</span></div>
                  <div className="flex justify-between font-black text-[#D4AF37] text-xs"><span>Buy cost</span><span>₹{Math.round(result.cost).toLocaleString('en-IN')}</span></div>
                </div>
                <button onClick={downloadSpec} className="border border-slate-800 text-slate-300 font-bold uppercase text-[10px] px-3 py-2 rounded-lg hover:bg-slate-800 transition">Export Nest Sheet</button>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 text-center py-10">
                Enter panels JSON and compute nesting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
