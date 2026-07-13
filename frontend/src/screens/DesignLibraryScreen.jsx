import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, Image as ImageIcon, ArrowRight, LayoutGrid } from 'lucide-react';

// Design Library — the in-app "Inspiration / teaching" view built from the
// real Indian-interior reference images copied into frontend/public/reference-library.
// Surfaces real room photos + 3D renders so users learn materials, layouts and
// Indian design language, and can push an image as a render reference.
export default function DesignLibraryScreen({ onUseInspiration }) {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetch('/api/design-library')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setLibrary(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['all', ...library.map(g => g.category)], [library]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return library
      .filter(g => activeCat === 'all' || g.category === activeCat)
      .map(g => ({
        ...g,
        images: q
          ? g.images.filter(img => {
              const name = img.split('/').pop().toLowerCase();
              return name.includes(q) || g.label.toLowerCase().includes(q);
            })
          : g.images
      }))
      .filter(g => g.images.length > 0);
  }, [library, activeCat, query]);

  const totalImages = library.reduce((a, g) => a + g.count, 0);

  return (
    <div className="h-full overflow-auto bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white">Design Library</h1>
              <p className="text-[11px] text-slate-400">
                Real Indian interior references & 3D renders — {totalImages} images across {library.length} categories.
                Learn materials, layouts & finishes, then push any image as a render reference.
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search rooms, styles, finishes…"
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 w-64 focus:outline-none focus:border-[var(--gold)]"
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
                activeCat === cat
                  ? 'bg-[var(--gold)] text-slate-900 border-[var(--gold)]'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              {cat === 'all' ? 'All' : library.find(g => g.category === cat)?.label || cat}
            </button>
          ))}
        </div>

        {loading && <div className="text-slate-500 text-sm py-10 text-center">Loading design library…</div>}

        {/* Galleries */}
        {!loading && filtered.map(group => (
          <section key={group.category} className="space-y-2">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-100">{group.label}</h2>
              <span className="text-[10px] text-slate-500">{group.count} references</span>
              {group.stages && group.stages.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {group.stages.map(s => (
                    <span key={s} className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{s}</span>
                  ))}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {group.images.map((img, i) => (
                <div
                  key={i}
                  className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[4/3] cursor-pointer hover:border-[var(--gold)]/60 transition"
                  onClick={() => setLightbox(img)}
                >
                  <img
                    src={img}
                    alt={img.split('/').pop()}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={e => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onUseInspiration && onUseInspiration(group.category); }}
                      className="flex items-center gap-1 text-[10px] bg-[var(--gold)] text-slate-900 px-2 py-1 rounded font-bold"
                    >
                      Use as reference <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-10">No references match “{query}”.</div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          <button className="absolute top-6 right-6 text-white text-2xl" onClick={() => setLightbox(null)}>×</button>
        </div>
      )}
    </div>
  );
}
