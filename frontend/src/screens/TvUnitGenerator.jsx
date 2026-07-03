import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { 
  Grid, Monitor, ChevronDown, Download, Sparkles, Box
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const UNIT_STYLES = [
  { id: 'wall-mounted', label: 'Wall-mounted classic', defaultDepth: 14, defaultHeight: 22 },
  { id: 'floating', label: 'Floating minimal', defaultDepth: 12, defaultHeight: 18 },
  { id: 'cabinet', label: 'Floor cabinet block', defaultDepth: 18, defaultHeight: 26 },
  { id: 'entertainment', label: 'Entertainment unit', defaultDepth: 22, defaultHeight: 24 }
];

const FINISHES = [
  { id: 'walnut', label: 'Natural Walnut', color: '#6b4f2f' },
  { id: 'white', label: 'Matte White', color: '#e8e7e4' },
  { id: 'black', label: 'Graphite Black', color: '#242424' },
  { id: 'teak', label: 'Teak Veneer', color: '#8b7a60' },
  { id: 'oak', label: 'Oak Light', color: '#c5b49a' }
];

export default function TvUnitGenerator({ projectId }) {
  const [project, setProject] = useState(null);
  const [style, setStyle] = useState(UNIT_STYLES[0].id);
  const [finish, setFinish] = useState(FINISHES[0].id);
  const [widthFt, setWidthFt] = useState(7);
  const [depthIn, setDepthIn] = useState(UNIT_STYLES[0].defaultDepth);
  const [heightIn, setHeightIn] = useState(UNIT_STYLES[0].defaultHeight);
  const [includeShelves, setIncludeShelves] = useState(true);
  const [includeDrawers, setIncludeDrawers] = useState(true);
  const [includeLed, setIncludeLed] = useState(true);
  const [wireManagement, setWireManagement] = useState(true);
  const [spec, setSpec] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    fetch(`${API_BASE}/projects/${projectId}`)
      .then(res => res.json())
      .then(setProject)
      .catch(() => {});
  }, [projectId]);

  const styleObj = UNIT_STYLES.find(s => s.id === style) || UNIT_STYLES[0];
  const finishObj = FINISHES.find(f => f.id === finish) || FINISHES[0];

  const calc = () => {
    const w = Math.max(2, widthFt);
    const d = Math.max(8, depthIn);
    const h = Math.max(14, heightIn);
    const baseSqft = (w * h) / 144;
    const plyPrice = baseSqft * 280;
    const hardware = 2200 + (includeDrawers ? 1800 : 0) + (wireManagement ? 1200 : 0);
    const led = includeLed ? 1600 : 0;
    const total = plyPrice + hardware + led + 1500;
    setSpec({ w, d, h, baseSqft, plyPrice, hardware, led, total });
    setStatus('TV unit spec calculated.');
    setTimeout(() => setStatus(null), 2200);
  };

  const downloadQb = () => {
    if (!spec) return;
    const lines = [
      'TV Unit Quick BOM',
      project ? `Client: ${project.client_name} | Project: ${project.name}` : `Project: ${projectId || 'Draft'}`,
      `Style: ${styleObj.label}`,
      `Finish: ${finishObj.label}`,
      `Width: ${spec.w} ft  Depth: ${spec.d} in  Height: ${spec.h} in`,
      `Plywood approx sqft: ${spec.baseSqft.toFixed(2)}`,
      `Plywood cost: ₹${Math.round(spec.plyPrice).toLocaleString('en-IN')}`,
      `Hardware: ₹${Math.round(spec.hardware).toLocaleString('en-IN')}`,
      `LED: ₹${Math.round(spec.led).toLocaleString('en-IN')}`,
      `Total: ₹${Math.round(spec.total).toLocaleString('en-IN')}`
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tv-unit-qb-${projectId || 'draft'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Quick BOM exported.');
    setTimeout(() => setStatus(null), 2200);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
            <Monitor className="w-4 h-4" /> TV Unit Generator
          </h2>
          <p className="text-[10px] text-[#8A8899] mt-0.5">Quick design, cut plan, cost estimate, and BOM.</p>
        </div>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mood</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
                {UNIT_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Laminate Finish</label>
              <div className="grid grid-cols-3 gap-1.5">
                {FINISHES.map(f => (
                  <button key={f.id} onClick={() => setFinish(f.id)} className={`py-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition ${finish === f.id ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    <span className="w-5 h-5 rounded-full border border-slate-700" style={{ background: f.color }} />
                    <span className="truncate w-full text-center px-1">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Width (ft)</label>
                <input type="number" value={widthFt} onChange={(e) => setWidthFt(parseFloat(e.target.value) || 2)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Depth (in)</label>
                <input type="number" value={depthIn} onChange={(e) => setDepthIn(parseInt(e.target.value, 10) || 8)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Height (in)</label>
                <input type="number" value={heightIn} onChange={(e) => setHeightIn(parseInt(e.target.value, 10) || 14)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] text-slate-400"><input type="checkbox" checked={includeShelves} onChange={(e) => setIncludeShelves(e.target.checked)} className="accent-[#D4AF37]" /> Adjustable shelves</label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400"><input type="checkbox" checked={includeDrawers} onChange={(e) => setIncludeDrawers(e.target.checked)} className="accent-[#D4AF37]" /> Soft-close drawers</label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400"><input type="checkbox" checked={includeLed} onChange={(e) => setIncludeLed(e.target.checked)} className="accent-[#D4AF37]" /> LED cove backlight</label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400"><input type="checkbox" checked={wireManagement} onChange={(e) => setWireManagement(e.target.checked)} className="accent-[#D4AF37]" /> Wire management channel</label>
            </div>
            <button onClick={calc} className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B08968] text-slate-950 font-extrabold text-[10px] uppercase tracking-wider rounded-xl">Generate Design</button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            {spec ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Width', value: `${spec.w} ft` },
                    { label: 'Depth', value: `${spec.d} in` },
                    { label: 'Height', value: `${spec.h} in` },
                    { label: 'Plywood', value: `${spec.baseSqft.toFixed(2)} sqft` }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">{item.label}</span>
                      <strong className="text-[11px] text-slate-200 block mt-0.5">{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between"><span>Plywood Cost</span><span>₹{Math.round(spec.plyPrice).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Hardware</span><span>₹{Math.round(spec.hardware).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>LED</span><span>₹{Math.round(spec.led).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-black text-[#D4AF37] text-xs"><span>Quote</span><span>₹{Math.round(spec.total).toLocaleString('en-IN')}</span></div>
                </div>
                <button onClick={downloadQb} className="flex items-center gap-2 border border-slate-800 text-slate-300 font-bold uppercase text-[10px] px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                  <Download className="w-3 h-3" /> Export Quick BOM
                </button>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 text-center py-10">
                Configure dimensions then generate design.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
