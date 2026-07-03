import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { 
  Layers, Trash2, Download, CheckCircle2, XCircle, Sparkles, IndianRupee, Ruler, Grid, Sun
} from 'lucide-react';

const ROOM_OPTIONS = [
  { id: 'living', label: 'Living / Dining' },
  { id: 'masterBed', label: 'Master Bedroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'pooja', label: 'Pooja Room' },
  { id: 'foyer', label: 'Foyer' }
];

const CEILING_TYPES = [
  { id: 'pop', label: 'POP Plain', pricePerSqft: 75, notes: 'Gypsum POP with smooth finish' },
  { id: 'gypsum', label: 'Gypsum Board', pricePerSqft: 110, notes: 'Denshield gypsum board with MS frame' },
  { id: 'coflex', label: 'Coflex / T-Bar', pricePerSqft: 135, notes: 'Suspended coflex with T-grid system' },
  { id: 'wooden', label: 'Wooden Slats', pricePerSqft: 165, notes: 'Teak/ pine slats with LED cove' },
  { id: 'metal', label: 'Metal Lay-in', pricePerSqft: 155, notes: 'Anodized aluminum lay-in tiles' }
];

const LED_OPTIONS = [
  { id: 'none', label: 'None', price: 0 },
  { id: 'cove', label: 'Cove LED (warm)', price: 2200 },
  { id: 'strip', label: 'Strip LED (cool)', price: 1800 },
  { id: 'spot', label: 'Spot LEDs', price: 2800 },
  { id: 'rgb', label: 'RGB Smart Strip', price: 4200 }
];

const DEFAULT_ROOM = { width: 14, depth: 12, height: 10, area: 168 };

export default function CeilingStudio({ projectId }) {
  const [project, setProject] = useState(null);
  const [room, setRoom] = useState(ROOM_OPTIONS[0].id);
  const [innerWidth, setInnerWidth] = useState(DEFAULT_ROOM.width);
  const [innerDepth, setInnerDepth] = useState(DEFAULT_ROOM.depth);
  const [ceilingType, setCeilingType] = useState(CEILING_TYPES[0].id);
  const [ledType, setLedType] = useState(LED_OPTIONS[0].id);
  const [acDrop, setAcDrop] = useState(false);
  const [smokeDetector, setSmokeDetector] = useState(true);
  const [soffit, setSoffit] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    fetch(`${API_BASE}/projects/${projectId}`)
      .then(res => res.json())
      .then(setProject)
      .catch(() => {});
  }, [projectId]);

  const area = Math.max(1, innerWidth * innerDepth);

  const calc = () => {
    const type = CEILING_TYPES.find(t => t.id === ceilingType) || CEILING_TYPES[0];
    const led = LED_OPTIONS.find(l => l.id === ledType) || LED_OPTIONS[0];
    const frame = area * 18;
    const ceiling = area * type.pricePerSqft;
    const ledCost = led.price;
    const extras = (acDrop ? 3200 : 0) + (smokeDetector ? 900 : 0) + (soffit ? area * 45 : 0);
    const total = frame + ceiling + ledCost + extras;
    const markup = total * 0.12;
    const grand = total + markup;
    setEstimate({
      area, typeLabel: type.label, ledLabel: led.label, frame, ceiling, ledCost, extras, markup, total, grand
    });
    setStatus('False ceiling estimate computed.');
    setTimeout(() => setStatus(null), 2400);
  };

  const saveEstimate = async () => {
    if (!estimate || !projectId) return;
    setStatus('Saving estimate...');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/ceiling-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, ceilingType, ledType, acDrop, smokeDetector, soffit, dimensions: { width: innerWidth, depth: innerDepth, area }, estimate })
      });
      if (res.ok) {
        setStatus('Estimate saved to project record.');
        window.dispatchEvent(new CustomEvent('refresh-project-stats'));
      } else {
        setStatus('Save failed: server error.');
      }
    } catch (e) {
      setStatus('Save failed: network error.');
    }
    setTimeout(() => setStatus(null), 2400);
  };

  const exportEstimatePDF = () => {
    if (!estimate) return;
    const lines = [
      `False Ceiling Generator - Project ${projectId || 'Draft'}`,
      project ? `Client: ${project.client_name} | Project: ${project.name}` : '',
      `Room: ${room}`,
      `Dimensions: ${innerWidth} ft x ${innerDepth} ft`,
      `Area: ${area} sq ft`,
      ``,
      `Finish: ${estimate.typeLabel}`,
      `LED: ${estimate.ledLabel}`,
      ``,
      `Frame + Install:   ₹${Math.round(estimate.frame).toLocaleString('en-IN')}`,
      `Ceiling Material:  ₹${Math.round(estimate.ceiling).toLocaleString('en-IN')}`,
      `LED Cost:          ₹${Math.round(estimate.ledCost).toLocaleString('en-IN')}`,
      `Extras:            ₹${Math.round(estimate.extras).toLocaleString('en-IN')}`,
      `Site Markup (12%): ₹${Math.round(estimate.markup).toLocaleString('en-IN')}`,
      ``,
      `CLIENT QUOTE: ₹${Math.round(estimate.grand).toLocaleString('en-IN')}`
    ];
    const blob = new Blob([lines.filter(Boolean).join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `false-ceiling-estimate-${project?.client_name || 'draft'}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Estimate exported.');
    setTimeout(() => setStatus(null), 2400);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> False Ceiling Generator
          </h2>
          <p className="text-[10px] text-[#8A8899] mt-0.5">
            Indian market spec: POP / Gypsum / Coflex + LED cove + hardware extras
          </p>
        </div>
        {project && (
          <div className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            {project.client_name} · {project.name}
          </div>
        )}
      </div>

      {status && (
        <div aria-live="polite" className="border border-emerald-800 bg-emerald-950/40 text-emerald-300 text-[11px] font-bold px-4 py-2 rounded-lg">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4 xl:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Room</label>
              <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
                {ROOM_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Width (ft)</label>
                <input type="number" value={innerWidth} onChange={(e) => setInnerWidth(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Depth (ft)</label>
                <input type="number" value={innerDepth} onChange={(e) => setInnerDepth(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Material</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CEILING_TYPES.map(opt => (
                  <button key={opt.id} onClick={() => setCeilingType(opt.id)} className={`py-2 px-2 rounded-lg border text-[10px] font-bold text-left transition ${ceilingType === opt.id ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'}`}>
                    <span className="block truncate">{opt.label}</span>
                    <span className="text-[8px] text-slate-500 font-mono">₹{opt.pricePerSqft}/sqft</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">LED Lighting</label>
              <div className="grid grid-cols-2 gap-1.5">
                {LED_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => setLedType(opt.id)} className={`py-2 px-2 rounded-lg border text-[10px] font-bold text-left transition ${ledType === opt.id ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'}`}>
                    <span className="block truncate">{opt.label}</span>
                    <span className="text-[8px] text-slate-500 font-mono">{opt.price ? `₹${opt.price}` : '—'}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] text-slate-400">
                <input type="checkbox" checked={acDrop} onChange={(e) => setAcDrop(e.target.checked)} className="accent-[#D4AF37]" /> AC cassette drop
              </label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400">
                <input type="checkbox" checked={smokeDetector} onChange={(e) => setSmokeDetector(e.target.checked)} className="accent-[#D4AF37]" /> Smoke detector provision
              </label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400">
                <input type="checkbox" checked={soffit} onChange={(e) => setSoffit(e.target.checked)} className="accent-[#D4AF37]" /> Soffit bulkheads
              </label>
            </div>
            <button onClick={calc} className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B08968] text-slate-950 font-extrabold text-[10px] uppercase tracking-wider rounded-xl">Compute Estimate</button>
          </div>
        </div>

        {/* Estimate + Actions */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            {estimate ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Area', value: `${area} sq ft` },
                    { label: 'Frame + Install', value: `₹${Math.round(estimate.frame).toLocaleString('en-IN')}` },
                    { label: 'Ceiling Cost', value: `₹${Math.round(estimate.ceiling).toLocaleString('en-IN')}` },
                    { label: 'LED Cost', value: `₹${Math.round(estimate.ledCost).toLocaleString('en-IN')}` }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center">
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">{item.label}</span>
                      <strong className="text-[11px] text-slate-200 block mt-0.5">{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between"><span>Extras</span><span>₹{Math.round(estimate.extras).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Site markup</span><span>₹{Math.round(estimate.markup).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-black text-[#D4AF37] text-xs"><span>Client Quote</span><span>₹{Math.round(estimate.grand).toLocaleString('en-IN')}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEstimate} className="flex-1 py-2 border border-emerald-800 text-emerald-400 font-bold uppercase text-[10px] rounded-lg hover:bg-emerald-950/40 transition">Save to Project</button>
                  <button onClick={exportEstimatePDF} className="flex-1 py-2 border border-slate-800 text-slate-300 font-bold uppercase text-[10px] rounded-lg hover:bg-slate-900 transition">Export Estimate</button>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 text-center py-10">
                Configure material and room dimensions, then compute estimate.
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reference Layout Preview</div>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-center min-h-[140px]">
              <div className="relative w-48 h-32 border border-slate-700 rounded">
                <div className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-500">
                  <Ruler className="w-4 h-4 mr-1" /> {innerWidth} × {innerDepth} ft
                </div>
                <div className="absolute top-0 inset-x-0 h-2 bg-slate-700/60" />
                {acDrop && <div className="absolute top-6 right-6 w-10 h-10 border border-[#D4AF37]/60 rounded-full text-[8px] text-[#D4AF37] flex items-center justify-center">AC</div>}
                {smokeDetector && <div className="absolute top-6 left-6 w-3 h-3 border border-slate-300 rounded-full" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
