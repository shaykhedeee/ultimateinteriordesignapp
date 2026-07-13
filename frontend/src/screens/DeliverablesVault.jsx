import React, { useState, useEffect, useCallback } from 'react';
import { Archive, RefreshCw, Download, FileText, Layers, Box, Image as ImageIcon, Search, ShieldCheck, Filter } from 'lucide-react';

const API = 'http://127.0.0.1:5055';

const TYPE_ICON = {
  'PDF Brief': FileText,
  'Cutlist': Layers,
  'CNC / Cutlist': Layers,
  'DXF Drawing': Box,
  'SketchUp Model': Box,
  'Elevation': ImageIcon,
  'Render / Asset': ImageIcon,
  'Generated Pack': FileText
};

export default function DeliverablesVault() {
  const [docs, setDocs] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/documents`);
      const d = await r.json();
      setDocs(d.documents || []);
      setMeta({ total: d.total, pdfBriefs: d.pdfBriefs, cutlistPdfs: d.cutlistPdfs, dxfCount: d.dxfCount });
    } catch (e) {
      setToast('Could not load vault');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter(d => {
    if (filter !== 'all' && d.type !== filter) return false;
    if (q && !(`${d.title} ${d.client} ${d.file}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const openDoc = (d) => window.open(`${API}${d.url}`, '_blank');
  const downloadDoc = (d) => {
    const a = document.createElement('a');
    a.href = `${API}${d.url}`;
    a.download = d.file;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const types = ['all', ...Array.from(new Set(docs.map(d => d.type)))];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Archive className="w-6 h-6 text-[var(--gold)]" /> Deliverables Vault
          </h1>
          <p className="text-slate-400 mt-1">Every client-facing output — reopen, audit and hand over.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-[var(--gold)]/40 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Total Documents" value={meta.total ?? 0} icon={Archive} />
        <Kpi label="PDF Briefs" value={meta.pdfBriefs ?? 0} icon={FileText} />
        <Kpi label="Cutlist / CNC" value={meta.cutlistPdfs ?? 0} icon={Layers} />
        <Kpi label="DXF Drawings" value={meta.dxfCount ?? 0} icon={Box} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search client or file…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:border-[var(--gold)] outline-none" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${filter === t ? 'bg-[var(--gold)] text-black' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading vault…</div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-500 text-sm border border-dashed border-slate-700 rounded-2xl p-10 text-center">
          No documents yet. Generate a brief, cutlist, elevation or render and it will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(d => {
            const Icon = TYPE_ICON[d.type] || FileText;
            return (
              <div key={d.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 hover:border-[var(--gold)]/30 transition">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[var(--gold)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-100 truncate">{d.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{d.client}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{d.type}</span>
                      <span className="text-[10px] text-slate-500">{d.sizeLabel}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{d.ext.replace('.', '')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openDoc(d)} className="flex-1 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-semibold hover:border-[var(--gold)]/40">Open</button>
                  <button onClick={() => downloadDoc(d)} className="flex-1 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-semibold hover:border-[var(--gold)]/40 flex items-center justify-center gap-1">
                    <Download className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
    </div>
  );
}

function Kpi({ label, value, icon: Icon }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
        <Icon className="w-4 h-4 text-[var(--gold)]" />
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
