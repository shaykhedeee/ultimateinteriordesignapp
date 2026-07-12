import React, { useState, useEffect, useRef } from 'react';
import { Compass, Sparkles, CheckCircle2, AlertTriangle, Move, Wand2, Layers, ArrowRight, RefreshCw } from 'lucide-react';

const API = 'http://127.0.0.1:8787';

// Compass glyphs for the 9 Vastu zones.
const ZONE_META = {
  N:  { label: 'North',       color: '#60A5FA' },
  NE: { label: 'North-East',  color: '#34D399' },
  E:  { label: 'East',        color: '#A3E635' },
  SE: { label: 'South-East',  color: '#F97316' },
  S:  { label: 'South',       color: '#EF4444' },
  SW: { label: 'South-West',  color: '#C9A84C' },
  W:  { label: 'West',        color: '#818CF8' },
  NW: { label: 'North-West',  color: '#22D3EE' },
  C:  { label: 'Center (Brahmasthan)', color: '#94A3B8' },
};

export default function VastuStudioScreen({ projectId, onApplyDone }) {
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [err, setErr] = useState(null);
  const [cad, setCad] = useState(null);
  const mapRef = useRef(null);

  const load = async () => {
    if (!projectId) { setErr('Select a project first (top-right picker).'); return; }
    setLoading(true); setErr(null);
    try {
      const [a, s, c] = await Promise.all([
        fetch(`${API}/api/projects/${projectId}/vastu/analyze`).then(r => r.ok ? r.json() : null),
        fetch(`${API}/api/projects/${projectId}/vastu/suggest`).then(r => r.ok ? r.json() : null),
        fetch(`${API}/api/projects/${projectId}/cad`).then(r => r.ok ? r.json() : null),
      ]);
      setAnalysis(a);
      setSuggestions(s);
      setCad(c);
    } catch (e) {
      setErr(e.message || 'Failed to scan plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const applyFull = async () => {
    if (!projectId) return;
    setApplying(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/vastu/auto-apply-full`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const d = await res.json();
      if (d.ok) {
        window.__toast?.success(`Vastu applied — ${d.applied?.length || 0} item(s) repositioned to ideal zones.`);
        await load();
        if (onApplyDone) onApplyDone();
      } else {
        window.__toast?.error(d.error || 'Apply failed');
      }
    } catch (e) {
      window.__toast?.error(e.message || 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  const furniture = cad?.furniture || (cad?.furniture_json ? JSON.parse(cad.furniture_json || '[]') : []) || [];
  const rooms = cad?.rooms || (cad?.rooms_json ? JSON.parse(cad.rooms_json || '[]') : []) || [];

  // Build a normalized plan bounding box for the compass overlay.
  const bounds = (() => {
    if (analysis?.bounds) return analysis.bounds;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const add = (x, y) => { if (x == null || y == null) return; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
    for (const r of rooms) for (const p of (r.points || [])) add(p.x, p.y);
    for (const f of furniture) add(f.x, f.y);
    if (!isFinite(minX)) return null;
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
  })();

  const toMapXY = (x, y) => {
    if (!bounds || !mapRef.current) return null;
    const rect = mapRef.current.getBoundingClientRect();
    const px = ((x - bounds.minX) / Math.max(1, bounds.w)) * rect.width;
    const py = ((y - bounds.minY) / Math.max(1, bounds.h)) * rect.height;
    return { px, py };
  };

  const counts = analysis?.counts || { compliant: 0, violation: 0, unknown: 0, total: 0 };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-[var(--gold)]" /> Vastu Studio — Floor-Plan Scanner
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Scans room geometry, classifies every furniture item by Vastu zone, and suggests compliant placement.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition">
            {loading ? 'Scanning…' : 'Re-scan'}
          </button>
          <button onClick={applyFull} disabled={applying || !analysis?.needsApply} className="bg-[var(--gold)] hover:bg-[var(--gold-bright)] disabled:bg-slate-800 disabled:text-slate-500 text-[#0A0A0D] px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5">
            {applying ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Applying…</> : <><Wand2 className="w-3.5 h-3.5" /> Auto-Apply All</>}
          </button>
        </div>
      </div>

      {err && <div className="bg-red-950/30 border border-red-800/50 text-red-300 text-xs p-3 rounded-xl">{err}</div>}

      {!analysis && !loading && !err && (
        <div className="border border-dashed border-slate-850 rounded-2xl p-10 text-center text-slate-500 text-xs">
          No CAD plan found. Upload a floor plan in <span className="text-slate-300">Plan Intelligence</span> first, then scan here.
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-slate-400 text-xs p-6"><RefreshCw className="w-5 h-5 animate-spin text-[var(--gold)]" /> Scanning floor plan geometry & classifying furniture…</div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Column 1: Compass map + summary */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex gap-3">
              <Stat label="Compliant" value={counts.compliant} tone="ok" />
              <Stat label="To Fix" value={counts.violation} tone="bad" />
              <Stat label="Unclassified" value={counts.unknown} tone="mid" />
              <Stat label="Total Items" value={counts.total} tone="neutral" />
            </div>

            {/* Plan + 9-zone compass overlay */}
            <div
              ref={mapRef}
              className="relative w-full h-[420px] bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden"
            >
              {/* zone tints */}
              {bounds && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                  <defs>
                    <radialGradient id="zonefade" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.0" />
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#zonefade)" />
                  {Object.entries(ZONE_META).filter(([z]) => z !== 'C').map(([z, m]) => {
                    const pos = zoneCentroidCss(z);
                    return (
                      <text key={z} x={pos.x} y={pos.y} fill={m.color} fontSize="11" fontWeight="700" textAnchor="middle" opacity="0.7" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {z}
                      </text>
                    );
                  })}
                </svg>
              )}

              {/* N compass marker */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-300 uppercase tracking-widest">North ↑</div>

              {/* furniture pins */}
              {analysis.items.map(it => {
                const f = furniture.find(x => x.id === it.id) || {};
                const xy = toMapXY(f.x ?? (analysis.bounds ? analysis.bounds.cx : 0), f.y ?? (analysis.bounds ? analysis.bounds.cy : 0));
                if (!xy) return null;
                const m = ZONE_META[it.zone] || ZONE_META.C;
                const color = it.status === 'compliant' ? '#34D399' : it.status === 'violation' ? '#F87171' : '#94A3B8';
                return (
                  <div key={it.id} className="absolute" style={{ left: xy.px - 6, top: xy.py - 6 }}
                       title={`${it.label}: ${it.zone}${it.suggestion ? ` → ${it.suggestion.zone}` : ''}`}>
                    <div className="w-3 h-3 rounded-full border border-slate-950" style={{ background: color }} />
                  </div>
                );
              })}

              {!bounds && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs">No geometry to render — add rooms/furniture first.</div>
              )}
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              Green = Vastu-aligned · Red = needs relocation · Grey = unclassified. The 9-zone compass is derived from the plan bounding box (North = up).
            </p>
          </div>

          {/* Column 2: item-by-item compliance + suggestions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Move className="w-3.5 h-3.5 text-[var(--gold)]" /> Furniture → Zone Report
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {analysis.items.map(it => (
                <div key={it.id} className={`bg-slate-900/40 border p-3 rounded-xl ${it.status === 'violation' ? 'border-red-800/50' : it.status === 'compliant' ? 'border-emerald-800/40' : 'border-slate-850'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{it.label}</span>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded"
                          style={{ background: (ZONE_META[it.zone] || ZONE_META.C).color + '22', color: (ZONE_META[it.zone] || ZONE_META.C).color }}>
                      {it.zone}
                    </span>
                  </div>
                  {it.status === 'violation' && it.suggestion ? (
                    <div className="mt-1.5 text-[10px] text-slate-400 leading-relaxed">
                      <span className="text-red-300 font-semibold">Move to {it.suggestion.zone}</span> — {it.suggestion.place}.
                    </div>
                  ) : it.status === 'compliant' ? (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Aligned with Vastu.</div>
                  ) : (
                    <div className="mt-1.5 text-[10px] text-slate-500">No Vastu rule mapped for this item.</div>
                  )}
                </div>
              ))}
              {analysis.missingKeyItems?.map(m => (
                <div key={m.key} className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-200">Missing: {m.key}</span>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">{m.zone}</span>
                  </div>
                  <div className="mt-1.5 text-[10px] text-amber-200/80 leading-relaxed">{m.summary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ideal per-room blueprint */}
      {suggestions?.perRoom && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Layers className="w-3.5 h-3.5 text-[var(--gold)]" /> Ideal Placement Blueprint (per room)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {suggestions.perRoom.map((r, i) => (
              <div key={i} className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{r.room}</span>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded" style={{ background: (ZONE_META[r.zone] || ZONE_META.C).color + '22', color: (ZONE_META[r.zone] || ZONE_META.C).color }}>{r.zone}</span>
                </div>
                {r.suggestions.length ? (
                  <ul className="space-y-1.5">
                    {r.suggestions.map((s, j) => (
                      <li key={j} className="text-[10px] text-slate-400 flex gap-2">
                        <ArrowRight className="w-3 h-3 text-[var(--gold)] shrink-0 mt-0.5" />
                        <span><strong className="text-slate-300">{s.label}</strong> — {s.place}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-slate-600">No specific Vastu item mapped for this zone.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const colors = { ok: 'text-emerald-400 border-emerald-800/40', bad: 'text-red-400 border-red-800/40', mid: 'text-amber-400 border-amber-800/40', neutral: 'text-slate-300 border-slate-800' };
  return (
    <div className={`flex-1 bg-slate-900/40 border ${colors[tone]} rounded-xl p-3 text-center`}>
      <div className="text-lg font-black">{value}</div>
      <div className="text-[8px] font-bold uppercase tracking-wider opacity-70">{label}</div>
    </div>
  );
}

// CSS-percentage centroid for a zone label on the compass overlay.
function zoneCentroidCss(zone) {
  const map = {
    N: [50, 12], NE: [82, 12], E: [88, 50], SE: [82, 88], S: [50, 88], SW: [18, 88], W: [12, 50], NW: [18, 12], C: [50, 50],
  };
  const v = map[zone] || [50, 50];
  return { x: `${v[0]}%`, y: `${v[1]}%` };
}
