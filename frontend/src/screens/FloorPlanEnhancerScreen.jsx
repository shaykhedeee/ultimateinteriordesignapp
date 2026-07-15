import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Compass, Check, AlertTriangle, ArrowUp, RotateCw, Plus, RefreshCw, Wand2, Info, Upload, Image as ImageIcon, Loader2, ShieldCheck, ShieldAlert, ShieldOff, FileDown } from 'lucide-react';

/**
 * FloorPlanEnhancerScreen — the single home for a project's floor plan.
 *
 * Flow (one upload, reused everywhere):
 *   1. User uploads a floor plan ONCE (DXF/DWG/PNG/JPG/PDF).
 *   2. Server stores it as projects.floorplan_url AND seeds cad_drawings,
 *      so every downstream tool (DXF export, elevations, Vastu, cutlist,
 *      delivery) reads the SAME plan — no re-uploads.
 *   3. We auto-vectorize (real mm for DXF; AI vision for images when a key
 *      is set) and run the AI Plan Enhancer → live SVG preview + score +
 *      actionable suggestions that persist fixes to cad_drawings.
 */
const SEV = {
  high:   { color: '#F87171', bg: 'rgba(248,113,113,.12)', label: 'High Priority' },
  medium: { color: '#FBBF24', bg: 'rgba(251,191,36,.12)',  label: 'Medium' },
  low:    { color: '#34D399', bg: 'rgba(52,211,153,.12)',  label: 'Low' },
};

function Gauge({ score }) {
  const r = 54, c = 2 * Math.PI * r;
  const off = c * (1 - (score || 0) / 100);
  const col = score >= 80 ? '#34D399' : score >= 60 ? '#FBBF24' : '#F87171';
  return (
    <svg viewBox="0 0 140 140" className="w-32 h-32">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={col} strokeWidth="12"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      <text x="70" y="66" textAnchor="middle" fill="#f1f5f9" fontSize="28" fontWeight="800">{score || 0}</text>
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
        const c0 = rm.points?.[0], c2 = rm.points?.[2];
        return (
          <g key={rm.id || i}>
            {pts && <polygon points={pts} fill={rm.color || '#1e3a5e'} fillOpacity="0.35"
              stroke={rm.appliedEnhancement ? '#C9A84C' : '#334155'} strokeWidth="2" />}
            {pts && c0 && c2 && (
              <>
                <text x={sx((c0.x + c2.x) / 2)} y={sy((c0.y + c2.y) / 2)} fill="#cbd5e1" fontSize="13" fontWeight="700" textAnchor="middle">{rm.name}</text>
                <text x={sx((c0.x + c2.x) / 2)} y={sy((c0.y + c2.y) / 2) + 16} fill="#64748b" fontSize="10" textAnchor="middle">{Math.round(rm.widthMm || 0)}×{Math.round(rm.heightMm || 0)}mm</text>
              </>
            )}
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
  const API = '';
  const [floorplanUrl, setFloorplanUrl] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(null);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadReviewItems = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/review-items`);
      if (res.ok) {
        const j = await res.json();
        setReviewItems(j.items || []);
        setReviewOpen(j.openTotal || 0);
      }
    } catch {}
  }, [projectId]);

  useEffect(() => { loadReviewItems(); }, [loadReviewItems, data]);

  const resolveReview = useCallback(async (itemId, status) => {
    if (!projectId) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`${API}/api/projects/${projectId}/review-items/${itemId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) { await loadReviewItems(); }
    } catch {} finally { setReviewLoading(false); }
  }, [projectId, API, loadReviewItems]);

  // Load the project's single stored floorplan (uploaded once, reused forever).
  const loadFloorplan = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${API}/api/projects/${projectId}`);
      const p = await res.json();
      setFloorplanUrl(p.floorplan_url || null);
      if (p.floorplan_url) setUploadMsg('Floor plan already uploaded for this project — reused across all tools.');
    } catch (_) { /* no-op */ }
  }, [projectId]);

  const analyze = useCallback(async () => {
    if (!projectId) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${API}/api/projects/${projectId}/floorplan/analyze-enhance`, { method: 'POST' });
      const d = await r.json();
      if (!d.success) { setError(d.message || d.error); setData(null); }
      else setData(d);
    } catch (e) { setError('Could not reach enhancement service. Is the server running?'); }
    setBusy(false);
  }, [projectId]);

  useEffect(() => { loadFloorplan(); analyze(); }, [loadFloorplan, analyze]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null); setUploadMsg(null);
    try {
      const fd = new FormData();
      fd.append('floorplan', file);
      const res = await fetch(`${API}/api/projects/${projectId}/floorplan/auto-vectorize`, { method: 'POST', body: fd });
      const d = await res.json();
      if (!d.success) { setError(d.message || d.error); }
      else {
        setFloorplanUrl(d.floorplanUrl);
        setUploadMsg(d.message || 'Floor plan uploaded and vectorized.');
        await analyze();
      }
    } catch (err) {
      setError('Upload failed: ' + (err.message || err));
    }
    setUploading(false);
  };

  const apply = async (sug) => {
    if (!sug.target) return;
    setApplying(sug.id);
    try {
      const r = await fetch(`${API}/api/projects/${projectId}/floorplan/apply-enhancement`, {
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
              <p className="text-xs text-slate-500">Upload once — the plan is stored for the entire project. AI scores & fixes your layout in real time.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C9A84C] text-slate-950 font-bold text-xs hover:bg-[#C9A84C]/90 cursor-pointer disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading…' : 'Upload Floor Plan (once)'}
              <input type="file" accept=".dxf,.dwg,image/*,.pdf" onChange={onUpload} className="hidden" />
            </label>
            <button onClick={analyze} disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Re-analyze
            </button>
            {data && (
              <>
                <a href={`/api/projects/${projectId}/drawings/floorplan/dxf`} download
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs hover:bg-slate-800">
                  <FileDown className="w-4 h-4" /> DXF
                </a>
                <a href={`/api/projects/${projectId}/drawings/floorplan/pro-dxf`} download
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-700/40 bg-emerald-900/20 text-emerald-300 text-xs hover:bg-emerald-900/30 font-bold">
                  <FileDown className="w-4 h-4" /> Pro DXF
                </a>
              </>
            )}
          </div>
        </div>

        {uploadMsg && !error && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-4 text-xs text-emerald-200/90">{uploadMsg}</div>
        )}

        {error && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 mb-5">
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-1"><AlertTriangle className="w-4 h-4" /> {error.includes('trace') || error.includes('walls') ? 'Plan needs walls' : 'Notice'}</div>
            <p className="text-sm text-amber-200/80">{error}</p>
            <p className="text-xs text-slate-400 mt-2">Upload a DXF/DWG for true-mm auto-trace, or an image (add a Gemini key in Settings → API Keys for automatic room detection).</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Preview + plan */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Your Floor Plan (stored once per project)</div>
              {floorplanUrl ? (
                <img src={`${API}${floorplanUrl}`} alt="Floor plan"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 object-contain max-h-[420px]" />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 rounded-lg border border-dashed border-slate-800">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-xs">No floor plan yet — upload one above (DXF / image / PDF).</span>
                </div>
              )}
            </div>

            {data && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Interpreted & Enhanced Plan</div>
                <PlanSVG interpretation={data.interpretation} layout={data.layout} />
                <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                  <span>Rooms: <b className="text-slate-300">{data.interpretation?.rooms?.length || 0}</b></span>
                  <span>Furniture: <b className="text-slate-300">{data.layout?.levels?.[0]?.furniture?.length || 0}</b></span>
                  <span>North ∠: <b className="text-slate-300">{data.northAngle || 0}°</b></span>
                </div>
              </div>
            )}
          </div>

          {/* Score + suggestions */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col items-center">
              <Gauge score={score} />
              <div className="text-xs text-slate-400 mt-1 text-center">{data?.enhancement?.summary}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" /> Enhancement Suggestions
              </div>
              {!data && !error && <div className="text-xs text-slate-400 py-3">Upload a floor plan to generate suggestions.</div>}
              {sugs.length === 0 && data ? (
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

          {/* Plan Review Queue — designer resolves critical/warning items (gates scene generation) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A84C]" /> Plan Review Queue
              </span>
              {reviewOpen > 0 ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[9px] font-bold border border-amber-500/30">{reviewOpen} open</span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">Cleared</span>
              )}
            </div>

            {reviewItems.length === 0 && (
              <div className="text-xs text-slate-400 py-3">No plan-review items. Run the Plan Enhancer above to generate intelligence checks.</div>
            )}

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {reviewItems.map((it) => {
                const open = !['accepted','corrected','ignored'].includes(it.status);
                const sevColor = it.severity === 'critical' ? '#f59e0b' : it.severity === 'warning' ? '#eab308' : '#64748b';
                const sevBg = it.severity === 'critical' ? 'rgba(245,158,11,0.12)' : it.severity === 'warning' ? 'rgba(234,179,8,0.10)' : 'rgba(100,116,139,0.10)';
                const Ico = it.severity === 'critical' ? ShieldAlert : it.severity === 'warning' ? ShieldAlert : ShieldOff;
                return (
                  <div key={it.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3" style={{ borderLeft: `3px solid ${sevColor}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-bold text-slate-200 capitalize">{it.itemType} {it.itemRef ? `· ${it.itemRef}` : ''}</div>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1" style={{ color: sevColor, background: sevBg }}>
                        <Ico className="w-2.5 h-2.5" /> {it.severity}
                      </span>
                    </div>
                    {it.suggestedValue && Object.keys(it.suggestedValue).length > 0 && (
                      <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Suggested: {JSON.stringify(it.suggestedValue).slice(0, 120)}
                      </div>
                    )}
                    {it.confidence != null && (
                      <div className="text-[9px] text-slate-500 mt-1">Confidence: {Math.round((it.confidence || 0) * 100)}%</div>
                    )}
                    {open ? (
                      <div className="flex gap-1.5 mt-2">
                        <button onClick={() => resolveReview(it.id, 'accepted')} disabled={reviewLoading}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-bold border border-emerald-500/20 disabled:opacity-50">
                          <Check className="w-3 h-3" /> Accept
                        </button>
                        <button onClick={() => resolveReview(it.id, 'corrected')} disabled={reviewLoading}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-[#C9A84C]/15 hover:bg-[#C9A84C]/25 text-[#C9A84C] text-[10px] font-bold border border-[#C9A84C]/20 disabled:opacity-50">
                          Corrected
                        </button>
                        <button onClick={() => resolveReview(it.id, 'ignored')} disabled={reviewLoading}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-slate-700/20 hover:bg-slate-700/30 text-slate-300 text-[10px] font-bold border border-slate-700/30 disabled:opacity-50">
                          Ignore
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 mt-2"><Check className="w-3 h-3" /> Resolved · {it.status}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
