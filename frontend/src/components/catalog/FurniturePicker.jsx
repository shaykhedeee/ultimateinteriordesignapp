import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronRight, Star, Ruler, IndianRupee, Heart } from 'lucide-react';
import { apiUrl } from '../../utils/api.js';

const CATEGORIES = ['All', 'Kitchen', 'Wardrobe', 'Living/Dining', 'Pooja/Mandir', 'Beds/Study', 'TV Units'];

const PRODUCTS = [
  { id: 'p1', name: 'Profile Modular Kitchen', brand: 'KitchenPro', category: 'Kitchen', price: 185000, width: 3000, depth: 650, material: 'Marine ply + PU', finish: 'Matte laminate', color: 'Smoke Grey', tags: ['modular', 'soft-close', 'pull-out'], rating: 4.7, reviewCount: 124 },
  { id: 'p2', name: 'Loft Wardrobe Unit', brand: 'SpaceMax', category: 'Wardrobe', price: 142000, width: 3600, depth: 600, material: 'MDF + laminate', finish: 'Gloss', color: 'Ebony', tags: ['loft', 'mirror', 'drawer'], rating: 4.4, reviewCount: 98 },
  { id: 'p3', name: 'Open-Shelf TV Unit', brand: 'LivingCraft', category: 'TV Units', price: 69000, width: 2400, depth: 450, material: 'Solidwood + laminates', finish: 'Textured laminate', color: 'Teak + Brass', tags: ['backlit', 'open', 'floating'], rating: 4.6, reviewCount: 87 },
  { id: 'p4', name: 'Contemporary Pooja Unit', brand: 'HeritageWood', category: 'Pooja/Mandir', price: 88000, width: 1500, depth: 350, material: 'Teak + brass inlay', finish: 'Sheen lacquer', color: 'Antique Teak', tags: ['vastu-ready', 'lidded', 'storage'], rating: 4.8, reviewCount: 64 },
  { id: 'p5', name: 'Study Cabinet + Bookshelf', brand: 'SpaceMax', category: 'Beds/Study', price: 95000, width: 1800, depth: 400, material: 'MDF + veneer', finish: 'Natural oak', color: 'Honey oak', tags: ['study', 'bookshelf', 'sliding'], rating: 4.3, reviewCount: 71 },
  { id: 'p6', name: 'Luxury Wardrobe', brand: 'KitchenPro', category: 'Wardrobe', price: 210000, width: 4200, depth: 650, material: 'BWR ply + membrane', finish: 'High gloss membrane', color: 'Pure white', tags: ['walk-in', 'led', 'pull-out'], rating: 4.9, reviewCount: 145 },
  { id: 'p7', name: 'Backlit TV Wall Unit', brand: 'LivingCraft', category: 'TV Units', price: 153000, width: 3600, depth: 500, material: 'Plywood + acrylic', finish: 'Acrylic high gloss', color: 'White backlit', tags: ['backlit', 'wall-mount', 'spotlight'], rating: 4.6, reviewCount: 102 },
  { id: 'p8', name: 'Modular Kitchen L-Shape', brand: 'KitchenPro', category: 'Kitchen', price: 126000, width: 2400, depth: 600, material: 'MR ply + india-ply', finish: 'Anti-scratch laminate', color: 'Cream + black strip', tags: ['L-shape', 'tall unit', 'basket'], rating: 4.5, reviewCount: 111 },
];

const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

function normalizeCatalogItem(item) {
  let dims = {};
  try { dims = JSON.parse(item.dimensions_json || '{}'); } catch {}
  const midpoint = (a, b, fallback) => a != null && b != null
    ? Math.round((Number(a) + Number(b)) / 2)
    : Number(a ?? b ?? fallback);
  const rawCategory = String(item.category || 'Living/Dining').toLowerCase();
  const category = rawCategory.includes('kitchen') ? 'Kitchen'
    : rawCategory.includes('wardrobe') ? 'Wardrobe'
      : rawCategory.includes('tv') ? 'TV Units'
        : rawCategory.includes('pooja') || rawCategory.includes('mandir') ? 'Pooja/Mandir'
          : rawCategory.includes('bed') || rawCategory.includes('study') ? 'Beds/Study'
            : 'Living/Dining';
  return {
    ...item,
    id: item.key || item.id,
    name: item.label || item.name,
    brand: item.brand || 'ULTIDA catalogue',
    category,
    price: Number(item.price || 0),
    width: Number(dims.widthMm || midpoint(dims.minWidth, dims.maxWidth, 600)),
    depth: Number(dims.depthMm || (item.category === 'wardrobe' ? 600 : 550)),
    height: Number(dims.heightMm || midpoint(dims.minHeight, dims.maxHeight, 2000)),
    finish: item.finish || item.preview_color || 'Configurable finish',
    color: item.preview_color || '#d8d0c1',
    tags: Array.isArray(item.tags) ? item.tags : String(item.room_types || '').split(',').filter(Boolean),
    image: item.image_url || item.preview_image || item.thumbnail_path || null,
    isCatalog: true
  };
}

export default function FurniturePicker({ project, onAddToProject, onConfigure }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [shortlist, setShortlist] = useState([]);
  const [selected, setSelected] = useState(null);
  const [catalog, setCatalog] = useState(PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [placingId, setPlacingId] = useState(null);

  useEffect(() => {
    if (!project?.id) return;
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl(`projects/${encodeURIComponent(project.id)}/catalog`))
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('catalog unavailable')))
      .then((data) => {
        const items = Array.isArray(data?.furniture) ? data.furniture.map(normalizeCatalogItem) : [];
        if (!cancelled && items.length) setCatalog(items);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [project?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (!q) return true;
      return [p.name, p.brand, p.category, p.finish, p.tags.join(' ')].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [query, category, catalog]);

  const addToScene = async (item) => {
    if (!project?.id) return onAddToProject?.(item);
    setPlacingId(item.id);
    try {
      const res = await fetch(apiUrl(`projects/${encodeURIComponent(project.id)}/scene/place`), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productKey: item.id, x: 0, y: 0, rotation: 0 })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || 'Unable to place item');
      onAddToProject?.({ ...item, sceneItem: data.item, sceneVersion: data.saved });
    } catch (error) {
      onAddToProject?.({ ...item, placementError: error.message });
    } finally { setPlacingId(null); }
  };

  const toggleShortlist = (item) => {
    setShortlist((prev) => (prev.some((s) => s.id === item.id) ? prev.filter((s) => s.id !== item.id) : [...prev, item]));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search kitchens, wardrobes, TV units, pooja units..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-[#C9A84C]"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition border ${category === c ? 'bg-[#C9A84C]/15 border-[#C9A84C]/50 text-[#C9A84C]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const inList = shortlist.some((s) => s.id === item.id);
          return (
            <div key={item.id} className={`rounded-2xl border p-4 transition hover:border-[#C9A84C]/60 bg-slate-950/40 ${selected?.id === item.id ? 'border-[#C9A84C]' : 'border-slate-850'}`}>
              <button type="button" onClick={() => setSelected(item)} className="w-full text-left">
                {item.image ? <img src={item.image} alt="" className="mb-3 h-28 w-full rounded-xl object-cover" /> : <div className="mb-3 h-28 rounded-xl" style={{ background: `linear-gradient(135deg, ${item.color || '#d8d0c1'}, #f5efe4)` }} />}
              </button>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.brand}</div>
                  <div className="text-xs font-bold text-slate-100 mt-0.5">{item.name}</div>
                </div>
                <button onClick={() => toggleShortlist(item)} className={`${inList ? 'text-[#C9A84C]' : 'text-slate-500 hover:text-slate-300'}`}>
                  <Heart className="w-4 h-4" fill={inList ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                <div className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5 text-slate-500" /><span>{item.width} x {item.depth} mm</span></div>
                <div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-slate-500" /><span>{formatPrice(item.price)}</span></div>
                <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#C9A84C]" /><span>{item.rating} ({item.reviewCount})</span></div>
                <div className="text-slate-500 truncate" title={item.finish}>{item.finish}</div>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => addToScene(item)} disabled={placingId === item.id} className="flex-1 py-2 rounded-xl bg-[#C9A84C] text-slate-950 text-[10px] font-black uppercase tracking-wider hover:bg-[#e0b94e] transition disabled:opacity-50">
                  {placingId === item.id ? 'Placing...' : 'Place in scene'}
                </button>
                <button onClick={() => onConfigure(item)} className="px-3 py-2 rounded-xl border border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-200 hover:border-slate-600 transition">
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {shortlist.length > 0 && (
        <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/40">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Shortlist</div>
          <div className="flex flex-wrap gap-2">
            {shortlist.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-200 bg-slate-900/60">
                <span className="truncate max-w-[180px]">{item.name}</span>
                <button onClick={() => toggleShortlist(item)} className="text-slate-400 hover:text-slate-200">×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="text-[10px] text-slate-500">Loading the project catalogue...</div>}
      {filtered.length === 0 && (
        <div className="text-center py-10 text-[11px] text-slate-500">No modules match your search. Try another category or keyword.</div>
      )}
    </div>
  );
}
