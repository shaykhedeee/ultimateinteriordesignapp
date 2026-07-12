import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Compass, Check, AlertTriangle, ArrowUp, RotateCw, Plus, RefreshCw, Wand2, Info } from 'lucide-react';

/**
 * FloorPlanEnhancerScreen — the REAL floor-plan enhancer.
 * Backed by /api/projects/:id/floorplan/analyze-enhance (Vastu + spatial
 * intelligence) and /floorplan/apply-enhancement (persists fixes to cad_drawings).
 * Renders the interpreted plan as SVG (rooms + furniture + openings), a live
 * enhancement-score gauge, and actionable suggestion cards whose Apply button
 * mutates + persists the plan and re-runs the analysis.
 */
const SEV = {
  high:   { color: '#F87171', bg: 'rgba(248,113,113,.12)', label: 'High Priority' },
  medium: { color: '#FBBF24', bg: 'rgba(251,191,36,.12)',  label: 'Medium' },
  low:    { color: '#34D399', bg: 'rgba(52,211,153,.12)',  label: 'Low' },
};

function Gauge({ score }) {
  const r = 54, c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  const col = score >= 80 ? '#34D399' : score >= 60 ? '#FBBF24' : '#F87171';
  return (
    <svg viewBox="0 0 140 140" className="w-32 h-32">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={col} strokeWidth="12"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      <text x="70" y="66" textAnchor="middle" fill="#f1f5f9" fontSize="28" fontWeight="800">{score}</text>
      <text x="70" y="86" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600">ENHANCE</text>
    </svg>
  );
}

function PlanSVG({ interpretation, layout }) {
  const rooms = interpretation?.rooms || [];
  const furniture = layout?.levels?.[0]?.furniture || [];
  const openings = interpretation?.openings || [];
  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    rooms.forEach(r => (r.points || []).forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }));
    furniture.forEach(f => {
      const x = Number(f.x ?? f.xOffsetWall ?? 0), y = Number(f.y ?? f.zOffset ?? 0);
      const w = Number(f.width ?? f.widthMm ?? 600), h = Number(f.height ?? f.heightMm ?? 600);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x + w);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y + h);
    });
    if (minX === Infinity) { minX = 0; minY = 0; maxX = 4000; maxY = 3000; }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }, [rooms, furniture]);

  const PAD = 40;
  const sx = (x) => PAD + ((x - bounds.minX) / (bounds.w || 1)) * 560;
  const sy = (y) => PAD + ((y - bounds.minY) / (bounds.h || 1)) * 420;
  const scaled = (mm) => (mm / (bounds.w || 4000)) * 560;

  return (
    <svg viewBox="0 0 640 500" className="w-full h-auto bg-slate-950/60 rounded-xl border border-slate-800">
      {/* room polygons */}
      {rooms.map((rm, i) => {
        const pts = (rm.points || []).map(p => `${sx(p.x)},${sy(p.y)}`).join(' ');
        return (
          <g key={rm.id || i}>
            {pts && <polygon points={pts} fill={rm.color || '#1e3a5e'} fillOpacity="0.35"
              stroke={rm.appliedEnhancement ? '#C9A84C' : '#334155'} strokeWidth="2" />}
            {pts && <text x={sx((rm.points[0].x + rm.points[2].x) / 2)} y={sy((rm.points[0].y + rm.points[2].y) / 2)}
              fill="#cbd5e1" fontSize="13" fontWeight="700" textAnchor="middle">{rm.name}</text>}
            {pts && <text x={sx((rm.points[0].x + rm.points[2].x) / 2)} y={sy((rm.points[0].y + rm.points[2].y) / 2) + 16}
              fill="#64748b" fontSize="10" textAnchor="middle">{Math.round(rm.widthMm || 0)}×{Math.round(rm.heightMm || 0)}mm</text>}
          </g>
        );
      })}
      {/* furniture footprints */}
      {furniture.map((f, i) => {
        const x = sx(Number(f.x ?? f.xOffsetWall ?? 0));
        const y = sy(Number(f.y ?? f.zOffset ?? 0));
        const w = scaled(Number(f.width ?? f.widthMm ?? 600));
        const h = scaled(Number(f.height ?? f.heightMm ?? 600));
        return (
          <g key={f.id || i}>
            <rect x={x} y={y} width={Math.max(6, w)} height={Math.max(6, h)} rx="3"
              fill="#C9A84C" fillOpacity="0.18" stroke="#C9A84C" strokeWidth="1.5"
              transform={`rotate(${Number(f.rotation || 0)} ${x + w / 2} ${y + h / 2})`} />
            <text x={x + w / 2} y={y + h / 2} fill="#C9A84C" fontSize="8" textAnchor="middle"
              transform={`rotate(${Number(f.rotation || 0)} ${x + w / 2} ${y + h / 2})`}>{(f.name || f.type || 'ITEM').slice(0, 14)}</text>
          </g>
        );
      })}
      {/* openings */}
      {openings.map((o, i) => (
        <circle key={o.id || i} cx={sx(Number(o.x ?? 0))} cy={sy(Number(o.y ?? 0))} r="5" fill="#38bdf8" />
      ))}
    </svg>
  );
}

const KIND_ICON = { add_room: Plus, add_furniture: Plus, rotate_furniture: RotateCw, rezone_furniture: ArrowUp, annotate: Info };

export default function FloorPlanEnhancerScreen({ projectId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(null);

  const analyze = useCallback(async () => {
    if (!projectId) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/floorplan/analyze-enhance`, { method: 'POST' });
      const d = await r.json();
      if (!d.success) { setError(d.message || d.error); setData(null); }
      else setData(d);
    } catch (e) { setError('Could not reach enhancement service. Is the server running on :8787?'); }
    setBusy(false);
  }, [projectId]);

  useEffect(() => { analyze(); }, [analyze]);

  const apply = async (sug) => {
    if (!sug.target) return;
    setApplying(sug.id);
    try {
      const r = await fetch(`http://127.0.0.1:8787/api/projects/${projectId}/floorplan/apply-enhancement`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: sug.target })
      });
      const d = await r.json();
      if (d.success) { __toast?.success?.('Enhancement applied'); await analyze(); }
      else __toast?.error?.(d.error || 'apply failed');
    } catch (e) { __toast?.error?.('apply failed'); }
    setApplying(null);
  };

  const score = data?.enhancement?.score ?? 0;
  const sugs = data?.enhancement?.suggestions || [];

  return (
    <div className="h-full w-full bg-slate-950 text-slate-200 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">Floor Plan Enhancer</h1>
              <p className="text-xs text-slate-500">Vastu-compliant layout intelligence — detect, score & fix your plan in real time.</p>
            </div>
          </div>
          <button onClick={analyze} disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C9A84C] text-slate-950 font-bold text-xs hover:bg-[#C9A84C]/90 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Re-analyze
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 mb-5">
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-1"><AlertTriangle className="w-4 h-4" /> Plan needs traced walls</div>
            <p className="text-sm text-amber-200/80">{error}</p>
            <p className="text-xs text-slate-400 mt-2">Open <b>Plan Intelligence</b> (Compass tab), draw your walls + openings, then return here.</p>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Plan + gauge */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Interpreted Plan</div>
                <PlanSVG interpretation={data.interpretation} layout={data.layout} />
                <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                  <span>Rooms: <b className="text-slate-300">{data.interpretation?.rooms?.length || 0}</b></span>
                  <span>Furniture: <b className="text-slate-300">{data.layout?.levels?.[0]?.furniture?.length || 0}</b></span>
                  <span>North ∠: <b className="text-slate-300">{data.northAngle || 0}°</b></span>
                </div>
              </div>
            </div>

            {/* Score + suggestions */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col items-center">
                <Gauge score={score} />
                <div className="text-xs text-slate-400 mt-1 text-center">{data.enhancement?.summary}</div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" /> Enhancement Suggestions
                </div>
                {sugs.length === 0 ? (
                  <div className="text-xs text-emerald-400 flex items-center gap-2 py-3"><Check className="w-4 h-4" /> Plan is fully optimized.</div>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {sugs.map((s) => {
                      const sv = SEV[s.severity] || SEV.low;
                      const Ico = KIND_ICON[s.target?.kind] || Info;
                      return (
                        <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3" style={{ borderLeft: `3px solid ${sv.color}` }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs font-bold text-slate-200">{s.title}</div>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0" style={{ color: sv.color, background: sv.bg }}>{sv.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">{s.detail}</div>
                          {s.target?.kind && (
                            <button onClick={() => apply(s)} disabled={applying === s.id}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 text-[#C9A84C] text-[10px] font-bold border border-[#C9A84C]/20 disabled:opacity-50">
                              <Ico className="w-3 h-3" /> {applying === s.id ? 'Applying…' : 'Apply Fix'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
