import React, { useEffect, useMemo, useState } from 'react';
import { GitCompare, Eye, X, RefreshCw, ArrowRightLeft, Wand2 } from 'lucide-react';

/**
 * @typedef {Object} CandidateRender
 * @property {string} id
 * @property {string} [project_id]
 * @property {string} [room]
 * @property {string} [style]
 * @property {string} [image_url]
 * @property {string} [status]
 */

const DEFAULT_A = { id: 'a', room: 'living', style: 'modern', image_url: '', status: 'rendered' };
const DEFAULT_B = { id: 'b', room: 'living', style: 'classic', image_url: '', status: 'rendered' };

export default function RenderComparison({ projectId }) {
  const [renderA, setRenderA] = useState(DEFAULT_A);
  const [renderB, setRenderB] = useState(DEFAULT_B);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`http://127.0.0.1:5055/api/projects/${projectId}/renders`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.renders || data?.items || [];
        const mapped = list.map((item) => ({
          id: item.id || item.render_id || String(Math.random()),
          project_id: projectId,
          room: item.room || item.room_type || 'living',
          style: item.style || item.style_tags || item.brief_style || '',
          image_url: item.image_url || item.url || item.asset_path || '',
          status: item.status || item.review_status || 'rendered',
        }));
        setCandidates(mapped);
        if (mapped[0]) setRenderA(mapped[0]);
        if (mapped[1]) setRenderB(mapped[1]);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load renders.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const imageSrc = (item) => {
    if (!item || !item.image_url) return '';
    if (item.image_url.startsWith('/storage')) return `http://127.0.0.1:5055${item.image_url}`;
    return item.image_url;
  };

  const handleUploadComparison = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/render-comparison/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renderAId: renderA.id,
          renderBId: renderB.id,
          notes,
          imageUrl: renderB.image_url || renderA.image_url || '',
        }),
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      alert(data?.success ? `Comparison saved: ${data.comparisonId}` : 'Comparison saved.');
    } catch (err) {
      setError(err.message || 'Failed to save comparison.');
    } finally {
      setSubmitting(false);
    }
  };

  const comparisonSummary = useMemo(() => {
    if (!renderA || !renderB) return 'Select two renders to compare material and lighting changes.';
    const parts = [];
    if (renderA.style && renderB.style && renderA.style !== renderB.style) {
      parts.push(`Style changed from ${renderA.style} to ${renderB.style}.`);
    }
    if (renderA.room && renderB.room && renderA.room !== renderB.room) {
      parts.push(`Room context changed from ${renderA.room} to ${renderB.room}.`);
    }
    if (!parts.length) return 'Both renders share the same room/style metadata. Review pixel differences in the compare view.';
    return parts.join(' ');
  }, [renderA, renderB]);

  return (
    <div className="space-y-5 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
            <GitCompare className="w-4.5 h-4.5 text-[#D4AF37]" />
            Render Comparison
          </h2>
          <p className="text-[10px] text-slate-500">Compare two render candidates side-by-side or as an adjustable overlay.</p>
        </div>
        <div className="flex gap-2 text-[10px] font-bold uppercase">
          <button
            onClick={() => setShowOverlay(false)}
            className={`px-3 py-1.5 rounded-lg border ${!showOverlay ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" /> Side by Side
          </button>
          <button
            onClick={() => setShowOverlay(true)}
            className={`px-3 py-1.5 rounded-lg border ${showOverlay ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 inline mr-1" /> Overlay
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Render A</span>
          <select
            value={renderA.id}
            onChange={(e) => {
              const next = candidates.find((c) => c.id === e.target.value);
              setRenderA(next || candidates[0] || DEFAULT_A);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-2 outline-none focus:border-[#D4AF37]"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.room} — {c.style || c.id}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Render B</span>
          <select
            value={renderB.id}
            onChange={(e) => {
              const next = candidates.find((c) => c.id === e.target.value);
              setRenderB(next || candidates[1] || DEFAULT_B);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-2 outline-none focus:border-[#D4AF37]"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.room} — {c.style || c.id}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-[10px] text-slate-400">
        {comparisonSummary}
      </div>

      <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
        {showOverlay ? (
          <div className="relative h-64 md:h-80">
            {imageSrc(renderA) && (
              <img src={imageSrc(renderA)} alt="Render A" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {imageSrc(renderB) && (
              <img
                src={imageSrc(renderB)}
                alt="Render B overlay"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: overlayOpacity }}
              />
            )}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-300 uppercase">Overlay</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-[10px] font-mono text-slate-400">{Math.round(overlayOpacity * 100)}%</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">A</span>
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                {imageSrc(renderA) ? (
                  <img src={imageSrc(renderA)} alt="Render A" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">No image</div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">B</span>
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                {imageSrc(renderB) ? (
                  <img src={imageSrc(renderB)} alt="Render B" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">No image</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comparison Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note material, lighting, or room changes."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-2 outline-none focus:border-[#D4AF37] min-h-[80px]"
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleUploadComparison}
            disabled={submitting || loading}
            className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#c49e2f] text-slate-950 font-black uppercase text-[10px] rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-1"
          >
            {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {submitting ? 'Saving...' : 'Save Comparison'}
          </button>
        </div>
      </div>
    </div>
  );
}
