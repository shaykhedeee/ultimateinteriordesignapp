import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid, Layers, Save, CheckCircle2, ChevronDown,
  Search, IndianRupee, FileText, Ruler, Wand2, Lightbulb
} from 'lucide-react';

const STYLES = [
  {
    id: 'pop',
    label: 'POP / Plaster of Paris',
    desc: 'Smooth curved edges, ornate medallions, traditional gypsum feel.',
    costPerSqft: 85,
    defaultHeightMm: 2400,
    drops: ['concentric_medallion', 'profile_curve', 'straight_edge']
  },
  {
    id: 'gypsum',
    label: 'Gypsum Board',
    desc: 'Clean flat planes, hidden beams, industrial minimal look.',
    costPerSqft: 65,
    defaultHeightMm: 2700,
    drops: ['straight_edge', 'bulkhead', 'beam_reveal', 'stepped']
  },
  {
    id: 'coffered',
    label: 'Coffered / Waffle',
    desc: 'Recessed grid pattern with cove/indirect lighting pockets.',
    costPerSqft: 120,
    defaultHeightMm: 2800,
    drops: ['grid_waffle', 'cove_pocket', 'recessed_spot']
  },
  {
    id: 't_profile_led',
    label: 'T-Profile LED',
    desc: 'Modern slim line T-grid with integrated LED strips.',
    costPerSqft: 95,
    defaultHeightMm: 2600,
    drops: ['t_grid', 'linear_led', 'spot_array']
  },
  {
    id: 'cove_lighting',
    label: 'Cove Lighting',
    desc: 'Perimeter indirect glow, shadow-free ambient ceilings.',
    costPerSqft: 110,
    defaultHeightMm: 2400,
    drops: ['perimeter_cove', 'cornice_glow', 'valley_gap']
  }
];

const ROOM_PRESETS = [
  { id: 'living', label: 'Living / Dining', baseAreaSqft: 350, perimeterFt: 90 },
  { id: 'master', label: 'Master Bedroom', baseAreaSqft: 220, perimeterFt: 60 },
  { id: 'kids', label: 'Kids Bedroom', baseAreaSqft: 150, perimeterFt: 48 },
  { id: 'kitchen', label: 'Kitchen', baseAreaSqft: 120, perimeterFt: 40 },
  { id: 'pooja', label: 'Pooja Room', baseAreaSqft: 60, perimeterFt: 28 }
];

const fixtureLabels = {
  concentric_medallion: 'Concentric Medallion',
  profile_curve: 'Profile Curve',
  straight_edge: 'Straight Edge',
  bulkhead: 'Bulkhead',
  beam_reveal: 'Beam Reveal',
  stepped: 'Stepped Step-down',
  grid_waffle: 'Waffle Grid',
  cove_pocket: 'Cove Pocket',
  recessed_spot: 'Recessed Spot',
  t_grid: 'T-Grid Batten',
  linear_led: 'Linear LED',
  spot_array: 'Spot Array',
  perimeter_cove: 'Perimeter Cove',
  cornice_glow: 'Cornice Glow',
  valley_gap: 'Valley Gap'
};

export default function FalseCeilingGenerator({ projectId, onComplete }) {
  const [project, setProject] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [roomPreset, setRoomPreset] = useState(ROOM_PRESETS[0].id);
  const [customArea, setCustomArea] = useState('');
  const [selectedDrops, setSelectedDrops] = useState([]);
  const [includeMotorizedLift, setIncludeMotorizedLift] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!projectId) return;
    fetch(`http://127.0.0.1:5055/api/projects/${projectId}`)
      .then(r => r.json())
      .then(setProject)
      .catch(console.error);
  }, [projectId]);

  useEffect(() => {
    recomputePrompt();
  }, [selectedStyle, roomPreset, selectedDrops, includeMotorizedLift, customArea]);

  const preset = ROOM_PRESETS.find(r => r.id === roomPreset) || ROOM_PRESETS[0];
  const style = STYLES.find(s => s.id === selectedStyle) || STYLES[0];

  const areaSqft = customArea ? Math.max(40, parseFloat(customArea) || preset.baseAreaSqft) : preset.baseAreaSqft;
  const perimeter = useMemo(() => {
    const perimeterFromArea = Math.sqrt(areaSqft) * 4;
    return preset.perimeterFt;
  }, [areaSqft, roomPreset]);

  const materialCost = useMemo(() => areaSqft * style.costPerSqft, [areaSqft, style]);
  const fixtureCost = useMemo(() => selectedDrops.length * 1800 + (includeMotorizedLift ? 8500 : 0), [selectedDrops, includeMotorizedLift]);
  const laborCost = useMemo(() => Math.round(areaSqft * 40 + perimeter * 110), [areaSqft, perimeter]);
  const totalCost = useMemo(() => materialCost + fixtureCost + laborCost, [materialCost, fixtureCost, laborCost]);

  const toggleDrop = (id) => {
    setSelectedDrops(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const recomputePrompt = () => {
    const presetLabel = preset.label;
    const styleLabel = style.label;
    const drops = selectedDrops.map(d => fixtureLabels[d] || d).join(', ');
    const prompt = `Design a ${styleLabel} false ceiling for ${presetLabel}. Lighting treatments: ${drops || 'standard'}. Area approx ${Math.round(areaSqft)} sqft. Include joinery notes for ${selectedStyle === 'pop' ? 'POP cornice and medallions' : selectedStyle === 'gypsum' ? 'gypsum board bulkheads' : selectedStyle === 'coffered' ? 'coffered grid with LED pockets' : selectedStyle === 't_profile_led' ? 'T-profile LED suspension' : 'perimeter cove lighting'}. ${includeMotorizedLift ? 'Provide motorized loft access hatch.' : ''}`;
    setPromptText(prompt);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ceilingType: selectedStyle,
        room: preset.id,
        areaSqft,
        fixtures: selectedDrops,
        motorizedLift: includeMotorizedLift,
        estimatedCost: totalCost,
        promptText,
        notes
      };
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'false_ceiling', payload })
      });
      if (res.ok) setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const svgCeiling = useMemo(() => {
    const w = 600;
    const h = 280;
    const pad = 40;
    const gridSize = 60;
    const cols = Math.floor((w - pad * 2) / gridSize);
    const rows = Math.floor((h - pad * 2) / gridSize);
    const cells = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const x = pad + c * gridSize;
        const y = pad + r * gridSize;
        if (r < rows) {
          cells.push(<line key={`h${r}-${c}`} x1={x} y1={y} x2={x + gridSize} y2={y} stroke="#1f2937" strokeWidth="1" />);
        }
        if (c < cols) {
          cells.push(<line key={`v${r}-${c}`} x1={x} y1={y} x2={x} y2={y + gridSize} stroke="#1f2937" strokeWidth="1" />);
        }
      }
    }
    const perimeterRect = <rect x={pad} y={pad} width={cols * gridSize} height={rows * gridSize} fill="none" stroke="#C9A84C" strokeWidth="1.5" />;
    let extras;
    if (selectedStyle === 'coffered') {
      extras = (
        <>
          {perimeterRect}
          <rect x={pad + gridSize} y={pad + gridSize} width={(cols - 2) * gridSize} height={(rows - 2) * gridSize} fill="rgba(212,175,55,0.05)" stroke="#C9A84C" strokeWidth="0.75" />
        </>
      );
    } else if (selectedStyle === 't_profile_led') {
      extras = (
        <>
          {perimeterRect}
          {Array.from({ length: rows }).map((_, r) => <line key={`t${r}`} x1={pad} y1={pad + r * gridSize} x2={pad + cols * gridSize} y2={pad + r * gridSize} stroke="#334155" strokeWidth="6" strokeLinecap="square" />)}
        </>
      );
    } else if (selectedStyle === 'cove_lighting') {
      extras = (
        <>
          <rect x={pad - 8} y={pad - 8} width={cols * gridSize + 16} height={rows * gridSize + 16} fill="none" stroke="#fbbf24" strokeWidth="8" strokeDasharray="4 4" />
          {perimeterRect}
        </>
      );
    } else if (selectedStyle === 'pop') {
      extras = (
        <>
          {perimeterRect}
          <circle cx={w / 2} cy={h / 2} r="28" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={w / 2} cy={h / 2} r="18" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
        </>
      );
    } else {
      extras = perimeterRect;
    }
    const fixtureMarks = selectedDrops.slice(0, 6).map((d, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = pad + 40 + col * ((cols - 2) * gridSize);
      const y = pad + 40 + row * ((rows - 2) * gridSize);
      return <circle key={d} cx={x} cy={y} r="5" fill="#D4AF37" stroke="#0f172a" strokeWidth="1.5" />;
    });
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <defs>
          <pattern id="ceilGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#0b1220" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ceilGrid)" />
        {cells}
        {extras}
        {fixtureMarks}
      </svg>
    );
  }, [selectedStyle, selectedDrops]);

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-slate-850 pb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">False Ceiling Generator</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Indian-style ceiling layout preview, prompt text, estimate and draft save.</p>
        </div>
        <div className="text-[9px] font-mono bg-slate-950 border border-slate-850 px-2 py-1 rounded text-slate-400">
          PROJECT: <span className="text-[#D4AF37]">{project?.id || projectId}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Room Type</span>
                <select value={roomPreset} onChange={e => setRoomPreset(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]/50">
                  {ROOM_PRESETS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ceiling Style</span>
                <select value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]/50">
                  {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Area Override (sqft)</span>
                <input type="number" value={customArea} onChange={e => setCustomArea(e.target.value)} placeholder={String(preset.baseAreaSqft)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`p-3 rounded-xl border text-left transition ${selectedStyle === s.id ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}>
                  <span className="text-[10px] font-bold text-slate-200 block">{s.label}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">₹{s.costPerSqft}/sqft</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[#D4AF37]" /> Fixtures & Treatments</span>
              <span className="text-[9px] font-mono text-[#D4AF37]">{selectedDrops.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {style.drops.map(d => (
                <button key={d} onClick={() => toggleDrop(d)} className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition ${selectedDrops.includes(d) ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
                  {fixtureLabels[d] || d}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
              <input type="checkbox" checked={includeMotorizedLift} onChange={e => setIncludeMotorizedLift(e.target.checked)} className="accent-[#D4AF37]" />
              Include motorized loft access hatch / lift panel
            </label>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-2"><Grid className="w-4 h-4 text-[#D4AF37]" /> Layout Preview</span>
            {svgCeiling}
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-3">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4 text-[#D4AF37]" /> AI Prompt Text</span>
            <textarea value={promptText} onChange={e => setPromptText(e.target.value)} rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40 resize-none" />
          </div>
        </div>

        {/* Summary + Cost + Save */}
        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl space-y-2">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5 text-[#D4AF37]" />Estimate</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Area</span>
                <strong className="text-slate-200">{Math.round(areaSqft)} sqft</strong>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Style</span>
                <strong className="text-slate-200">{style.label}</strong>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Material</span>
                <strong className="text-slate-200">₹{materialCost.toLocaleString()}</strong>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Fixtures</span>
                <strong className="text-slate-200">₹{fixtureCost.toLocaleString()}</strong>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Labour</span>
                <strong className="text-slate-200">₹{laborCost.toLocaleString()}</strong>
              </div>
              <div className="bg-[#D4AF37]/10 p-2 rounded-xl border border-[#D4AF37]/25">
                <span className="text-[9px] text-[#D4AF37] block font-black uppercase">Total</span>
                <strong className="text-[#D4AF37]">₹{totalCost.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl space-y-2">
            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Project Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[10px] text-slate-200 outline-none focus:border-[#D4AF37]/40 resize-none" placeholder="Lift access, bulkhead chases, false-ceiling height, etc." />
          </div>

          <button onClick={handleSave} disabled={isSaving || saved} className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition ${saved ? 'bg-emerald-500 text-white' : 'bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 shadow-lg shadow-[#D4AF37]/15'}`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved to Drafts</> : isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save to Project Drafts</>}
          </button>
          {onComplete && <button onClick={onComplete} className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-[10px] uppercase tracking-wider">Back to Command Center</button>}
        </div>
      </div>
    </div>
  );
}
