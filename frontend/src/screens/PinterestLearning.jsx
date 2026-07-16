import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Bookmark, Sparkles, ChevronRight, Trash2 } from 'lucide-react';

export default function PinterestLearning({ projectId }) {
  const [query, setQuery] = useState('indian bedroom laminate wardrobe');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [savedLibrary, setSavedLibrary] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [status, setStatus] = useState('');

  React.useEffect(() => {
    loadLibrary();
  }, [projectId]);

  const loadLibrary = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId || 'demo'}/library`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedLibrary(data);
      }
    } catch (e) {
      console.error('Failed to load library:', e);
    }
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setStatus('Searching style references...');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId || 'demo'}/pinterest/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setImages(data);
        setStatus(`Loaded ${data.length} references.`);
      } else if (Array.isArray(data.images)) {
        setImages(data.images);
        setStatus(`Loaded ${data.images.length} references.`);
      } else {
        setImages([]);
        setStatus('No references returned.');
      }
    } catch (e) {
      setImages([]);
      setStatus('Search failed. Check backend route.');
    } finally {
      setLoading(false);
    }
  };

  const saveToLibrary = async () => {
    if (!selectedIds.length) return;
    setLoading(true);
    setStatus(`Saving ${selectedIds.length} selected references to library...`);
    try {
      const payload = images
        .filter(img => selectedIds.includes(img.id))
        .map(img => ({
          id: img.id,
          url: img.url,
          thumbnail: img.thumbnail,
          title: img.title,
          source: img.source || 'pinterest',
          tags: img.tags || ['pinterest-saved']
        }));
      const res = await fetch(`${API_BASE}/projects/${projectId || 'demo'}/pinterest/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: payload })
      });
      const data = await res.json();
      setStatus(`Saved ${data.saved || selectedIds.length} references to library.`);
      await loadLibrary();
    } catch (e) {
      setStatus('Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-5 bg-slate-950 text-slate-100 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#C9A84C] flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-[#C9A84C]" /> Pinterest Learning
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Search, compare, and import style references for active learning.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="Style, material, room, palette..."
            className="bg-slate-900 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-[#C9A84C]"
          />
          <button
            onClick={runSearch}
            disabled={loading}
            className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase text-[10px] tracking-wider px-4 py-2 rounded-xl transition shadow-md shadow-[#D4AF37]/15 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Search
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{status || 'Ready'}</span>
        <button
          onClick={saveToLibrary}
          disabled={!selectedIds.length || loading}
          className="bg-slate-900 border border-slate-850 hover:border-[#C9A84C]/40 text-slate-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Save Selected
        </button>
      </div>

      {images.length === 0 && !loading && (
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-8 text-center text-slate-500 text-xs">
          Search Pinterest-style references to begin. Findings will populate tiles below.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map(img => {
          const selected = selectedIds.includes(img.id);
          return (
            <div
              key={img.id}
              onClick={() => toggleSelect(img.id)}
              className={`bg-slate-900/40 border rounded-2xl overflow-hidden cursor-pointer transition ${
                selected ? 'border-[#C9A84C]/70' : 'border-slate-850 hover:border-slate-800'
              }`}
            >
              <img
                src={img.url || img.thumbnail}
                alt={img.title || 'Style reference'}
                className="w-full h-40 object-cover"
              />
              <div className="p-2.5 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-200 truncate">{img.title || 'Untitled reference'}</div>
                <div className="text-[9px] text-slate-500 font-mono truncate">{img.source || 'Saved reference'}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved Reuse Library */}
      {savedLibrary.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
              Saved Reuse Library ({savedLibrary.length})
            </div>
            <div className="text-[9px] text-slate-500 font-mono">Persisted locally per project</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {savedLibrary.map(item => (
              <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden group">
                <img
                  src={item.thumbnail_path || item.image_path}
                  alt={item.filename}
                  className="w-full h-36 object-cover"
                />
                <div className="p-2.5 space-y-1">
                  <div className="text-[10px] font-bold text-slate-200 truncate">{item.filename}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">{item.category}{item.subcategory ? ` / ${item.subcategory}` : ''}</span>
                    <button
                      onClick={async () => {
                        await fetch(`${API_BASE}/projects/${projectId || 'demo'}/library/${item.id}`, { method: 'DELETE' });
                        await loadLibrary();
                      }}
                      className="text-[9px] text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
