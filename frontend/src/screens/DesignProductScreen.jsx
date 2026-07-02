import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, PlusCircle, MousePointer2, PencilRuler, Type, Trash2, CheckCircle2, AlertTriangle, GripVertical } from 'lucide-react';

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
  return res.json();
}

export default function DesignProductScreen({ projectId, onNavigateToTab }) {
  const [mode, setMode] = useState('select');
  const [canvasItems, setCanvasItems] = useState([]);
  const [textItems, setTextItems] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [reviewItems, setReviewItems] = useState([]);
  const [activeComponent, setActiveComponent] = useState(null);
  const [productPreview, setProductPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [hideResolved, setHideResolved] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    apiGet(`/api/projects/${projectId}/design-product?mock=1`).then((data) => {
      if (Array.isArray(data?.items)) setCanvasItems(data.items);
      if (Array.isArray(data?.texts)) setTextItems(data.texts);
      if (Array.isArray(data?.dimensions)) setDimensions(data.dimensions);
      if (Array.isArray(data?.reviewItems)) setReviewItems(data.reviewItems);
    }).catch(() => {});
  }, [projectId, hideResolved]);

  const addReviewItem = (title, severity) => {
    setReviewItems((prev) => [{ id: crypto.randomUUID(), title, severity, accepted: prev.length === 0 } , ...prev]);
  };

  const visibleReviewItems = useMemo(() => {
    if (!hideResolved) return reviewItems;
    return reviewItems.filter((item) => item.accepted !== true);
  }, [reviewItems, hideResolved]);

  const designerTools = [
    { key: 'select', label: 'Select', icon: <MousePointer2 className="w-4 h-4" />, desc: 'Move/resize elements on the canvas' },
    { key: 'text', label: 'Smart Text', icon: <Type className="w-4 h-4" />, desc: 'Generate compliant annotations with AI' },
    { key: 'dimension', label: 'Auto Dimension', icon: <PencilRuler className="w-4 h-4" />, desc: 'Place QA dimensions automatically' },
  ];

  const handleGenerateProductPreview = async () => {
    if (!projectId) return;
    setLoadingPreview(true);
    try {
      const res = await apiPost(`/api/projects/${projectId}/design-product/preview`, { mode: 'product' });
      setProductPreview({ imageUrl: res?.previewUrl, update: res?.update });
    } catch (e) {
      setProductPreview({ error: 'Preview generation failed.', update: null });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExportPackage = () => {
    const payload = JSON.stringify({ canvasItems, texts: textItems, dimensions, reviewItems: visibleReviewItems }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `design-product-${projectId || 'draft'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full overflow-y-auto text-left space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Design Product Workspace</h3>
          <p className="text-[10px] text-slate-500">Prepare presentation-ready deliverables, QA reviews, dimensions, and export packages.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleGenerateProductPreview} className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 rounded-lg text-[10px] font-black uppercase" disabled={loadingPreview}>
            {loadingPreview ? 'Generating...' : 'Generate Product Preview'}
          </button>
          <button onClick={handleExportPackage} disabled={!projectId} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-200 hover:text-white disabled:opacity-40">Export Package</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Product Canvas</div>
              <div className="flex flex-wrap gap-2">
                {designerTools.map((t) => (
                  <button key={t.key} onClick={() => setMode(t.key as Mode)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${mode === t.key ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-slate-950 border-slate-850 text-slate-300'}`}>{t.label}</button>
                ))}
              </div>
            </div>
            <div className="min-h-[260px] rounded-xl border border-slate-850 bg-slate-950 p-3">
              <div className="flex flex-col gap-2">
                {(canvasItems || []).map((item) => (
                  <div key={item.id} onClick={() => setActiveComponent(item)} className={`p-3 rounded-xl border cursor-pointer ${activeComponent === item ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-slate-800 bg-slate-900/40'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-200">{item.name || item.id}</span>
                      <button onClick={() => setCanvasItems((prev) => prev.filter((x) => x.id !== item.id))} className="text-[10px] font-black uppercase text-red-300">Remove</button>
                    </div>
                    {item.description && <div className="text-[9px] text-slate-500">{item.description}</div>}
                  </div>
                ))}
                {(!canvasItems || canvasItems.length === 0) && <div className="text-[10px] text-slate-500">No items. Generate preview to seed product canvas.</div>}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Compliance Checklist / QA Review</div>
              <label className="flex items-center gap-2 text-[10px] text-slate-500">
                <input type="checkbox" checked={hideResolved} onChange={(e) => setHideResolved(e.target.checked)} />
                Hide resolved
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => addReviewItem('Product specification complete', 'info')} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-200 hover:text-white">Add QA Item</button>
              <button onClick={() => addReviewItem('Brand/spec alignment check', 'warning')} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-200 hover:text-white">Add Warning</button>
              <button onClick={() => addReviewItem('Elevation rejects visual rule', 'critical')} className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-black uppercase text-slate-200 hover:text-white">Add Critical</button>
            </div>
            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
              {visibleReviewItems.map((item) => (
                <div key={item.id} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${item.accepted ? 'border-emerald-500/40 bg-emerald-500/10' : item.severity === 'critical' ? 'border-red-500/40 bg-red-500/10' : 'border-slate-800 bg-slate-950/60'}`}>
                  <div>
                    <div className="text-[11px] font-bold text-slate-200">{item.title}</div>
                    <div className="text-[9px] text-slate-500 font-mono">{item.severity}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { const next = reviewItems.map((r) => r.id === item.id ? { ...r, accepted: !r.accepted } : r); setReviewItems(next); }} className="px-2 py-1 rounded-md border border-slate-800 bg-slate-900 text-[10px] font-black uppercase text-slate-300 hover:text-white">{item.accepted ? 'Reopen' : 'Resolve'}</button>
                    <button onClick={() => { setReviewItems(reviewItems.filter((r) => r.id !== item.id)); }} className="px-2 py-1 rounded-md border border-red-500/40 bg-red-500/10 text-[10px] font-black uppercase text-red-300">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Preview</div>
            {productPreview ? (
              <div className="space-y-2">
                {productPreview.imageUrl && <img src={productPreview.imageUrl} className="w-full rounded-xl border border-slate-800 bg-slate-950" alt="Design product preview" />}
                {productPreview.update && <div className="text-[10px] text-slate-400 font-mono">Render status: {productPreview.update}</div>}
                {productPreview.error && <div className="text-[10px] text-red-300 font-mono">{productPreview.error}</div>}
              </div>
            ) : (
              <div className="text-[10px] text-slate-500">Generate a preview to display product imagery and render summary.</div>
            )}
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Selection</div>
            {activeComponent ? (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-200">{activeComponent.name || activeComponent.id}</div>
                {activeComponent.description && <div className="text-[10px] text-slate-400">{activeComponent.description}</div>}
                <div className="text-[10px] text-slate-500 font-mono">id: {activeComponent.id}</div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500">Select a product canvas element to inspect details.</div>
            )}
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Render Controls</div>
            <button onClick={() => onNavigateToTab?.('renders')} className="w-full py-2 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-lg text-[10px] font-black uppercase">Open 3D Render Studio</button>
            <button onClick={() => onNavigateToTab?.('catalog')} className="w-full py-2 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-lg text-[10px] font-black uppercase">Open Furniture Catalog</button>
            <button onClick={() => onNavigateToTab?.('finance')} className="w-full py-2 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-lg text-[10px] font-black uppercase">Open Commerce & Quotes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
