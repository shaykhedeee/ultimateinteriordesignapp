import React, { useState, useMemo } from 'react';
import { apiUrl } from '../../utils/api.js';
import { Star, Ruler, IndianRupee, CheckCircle2, Search, Filter, ChevronRight, Heart, ShoppingCart, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'kitchen', label: 'Modular Kitchen' },
  { id: 'wardrobe', label: 'Wardrobes & Storage' },
  { id: 'living', label: 'Living & Dining' },
  { id: 'pooja', label: 'Mandir / Pooja' },
  { id: 'bed', label: 'Beds & Study' },
  { id: 'tv', label: 'TV Units' },
];

const PRODUCTS = [
  {
    id: 'kitchen_base_cabinet',
    name: 'Base Drawer Run Unit',
    category: 'kitchen',
    brand: 'Godrej',
    series: 'Classic Plus',
    rating: 4.6,
    reviews: 214,
    price: 32000,
    width: 1200,
    height: 720,
    depth: 560,
    finish: 'Louvered shutters',
    material: 'Marine ply + BWR laminate',
    hardware: 'Hettich Soft-Close',
    color: '#C5A065',
    tags: ['kitchen', 'base', 'drawers', 'soft-close'],
    desc: 'Tandem drawer base cabinet with bottle pull-out and cutlery organizer. Designed for Indian kitchen workflows.'
  },
  {
    id: 'kitchen_wall_cabinet',
    name: 'Wall Overhead Unit',
    category: 'kitchen',
    brand: 'Häfele',
    series: 'Indus',
    rating: 4.4,
    reviews: 176,
    price: 18500,
    width: 900,
    height: 600,
    depth: 300,
    finish: 'High-gloss acrylic',
    material: 'MDF + acrylic',
    hardware: 'Häfele lift-up',
    color: '#E8EAED',
    tags: ['kitchen', 'wall', 'overhead', 'gloss'],
    desc: 'Single-wall overhead cabinet with lift-up mechanism and internal shelf spacing for jars/plates.'
  },
  {
    id: 'kitchen_loft',
    name: 'Loft Ceiling Storage',
    category: 'kitchen',
    brand: 'Godrej',
    series: 'Classic Plus',
    rating: 4.3,
    reviews: 132,
    price: 24000,
    width: 1200,
    height: 600,
    depth: 560,
    finish: 'Matte laminate',
    material: 'Marine ply + laminate',
    hardware: 'Hettich hinges',
    color: '#8C7B70',
    tags: ['kitchen', 'loft', 'storage'],
    desc: 'Top loft unit extending to slab. Ideal for lesser-used bulky storage with accessible lower daily-use cabinets.'
  },
  {
    id: 'wardrobe_aristo_sliding',
    name: 'Aristo Sliding Wardrobe',
    category: 'wardrobe',
    brand: 'Häfele',
    series: 'Sliding Systems',
    rating: 4.7,
    reviews: 289,
    price: 72000,
    width: 1800,
    height: 2400,
    depth: 600,
    finish: 'Aluminium + tinted glass',
    material: 'Anodized aluminium + glass',
    hardware: 'Häfele sliding gear',
    color: '#1F2937',
    tags: ['wardrobe', 'sliding', 'glass', 'aluminium'],
    desc: 'Slim-profile aristo sliding wardrobe with dark tinted glass and aluminium frame. Includes internal drawer tower option.'
  },
  {
    id: 'wardrobe_laminate_swing',
    name: 'Laminate Swing Wardrobe',
    category: 'wardrobe',
    brand: 'CenturyPly',
    series: 'Luxe',
    rating: 4.5,
    reviews: 198,
    price: 56000,
    width: 1500,
    height: 2100,
    depth: 600,
    finish: 'Bourbon Walnut laminate',
    material: 'CenturyPly + laminate',
    hardware: 'Hafele handles + hinges',
    color: '#7C4A1E',
    tags: ['wardrobe', 'swing', 'laminate'],
    desc: 'Classic swing-door wardrobe with internal hanging, shelf, and locker layout. Indian home favorite.'
  },
  {
    id: 'tv_unit_fluted_backlit',
    name: 'Fluted Backlit TV Console',
    category: 'tv',
    brand: 'Local OEM',
    series: 'Modern Living',
    rating: 4.8,
    reviews: 312,
    price: 43000,
    width: 2400,
    height: 500,
    depth: 420,
    finish: 'Fluted rafter panel',
    material: 'MDF + veneer/laminate',
    hardware: 'Concealed LED driver',
    color: '#D4AF37',
    tags: ['tv', 'living', 'backlit', 'fluted'],
    desc: 'Backlit fluted TV unit with rack management, cable conceal, and warm LED halo. Made for living room feature walls.'
  },
  {
    id: 'tv_unit_marble_floating',
    name: 'Luxury Floating Console',
    category: 'tv',
    brand: 'Local OEM',
    series: 'Premium Stone',
    rating: 4.6,
    reviews: 245,
    price: 68000,
    width: 2800,
    height: 600,
    depth: 450,
    finish: 'Calacatta Gold quartz',
    material: 'Quartz stone + carcass',
    hardware: 'Concealed brackets',
    color: '#F3E8D7',
    tags: ['tv', 'living', 'stone', 'floating'],
    desc: 'Cladded floating console with Calacatta Gold surface. Best for premium living rooms with hidden wall framing.'
  },
  {
    id: 'pooja_backlit_jali',
    name: 'Backlit Jali Mandir',
    category: 'pooja',
    brand: 'Local OEM',
    series: 'Traditional',
    rating: 4.9,
    reviews: 167,
    price: 27000,
    width: 900,
    height: 1800,
    depth: 450,
    finish: 'CNC jali + backlight',
    material: 'MDF + laminate',
    hardware: 'LED strip warm',
    color: '#D4AF37',
    tags: ['pooja', 'mandir', 'jali', 'backlit'],
    desc: 'Vastu-friendly CNC jali mandir with warm backlight. Can be floor-standing or wall-mounted.'
  },
  {
    id: 'bed_queen_upholstered',
    name: 'Queen Upholstered Bed',
    category: 'bed',
    brand: 'Local OEM',
    series: 'Comfort Series',
    rating: 4.4,
    reviews: 203,
    price: 38000,
    width: 1800,
    height: 1100,
    depth: 2100,
    finish: 'Velvet / leatherette',
    material: 'Plywood + upholstery',
    hardware: 'Soft-close gas-lift optional',
    color: '#9CA3AF',
    tags: ['bed', 'bedroom', 'storage'],
    desc: 'Queen-size platform bed with plush headboard and optional gas-lift under-bed storage.'
  },
  {
    id: 'study_compact',
    name: 'Compact Writing Desk',
    category: 'bed',
    brand: 'Local OEM',
    series: 'Study Series',
    rating: 4.2,
    reviews: 141,
    price: 18000,
    width: 1400,
    height: 760,
    depth: 550,
    finish: 'Oak veneer / laminate',
    material: 'MDF + veneer',
    hardware: 'Cable management grommets',
    color: '#C5A065',
    tags: ['study', 'desk', 'compact'],
    desc: 'Compact study desk with wire mesh panel, grommets, and a small open shelf for router/books.'
  },
  {
    id: 'living_crockery_cabinet',
    name: 'Crockery Glass Cabinet',
    category: 'living',
    brand: 'Häfele',
    series: 'Dining',
    rating: 4.5,
    reviews: 118,
    price: 41000,
    width: 1000,
    height: 1800,
    depth: 400,
    finish: 'Glass + LED shelf',
    material: 'MDF + glass',
    hardware: 'Soft-close hinges',
    color: '#E8EAED',
    tags: ['living', 'dining', 'glass', 'led'],
    desc: 'Display cabinet with glass shutters, LED shelf lighting, and mirrored back panel to enhance display.'
  },
];

function FurniturePicker({ project, materialsCatalog, onAddToProject, onConfigure }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [mode, setMode] = useState('shop'); // shop | compare | specs

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter(p => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      );
    });
  }, [query, category]);

  const toggleShortlist = (product) => {
    setShortlist(list => list.some(x => x.id === product.id) ? list.filter(x => x.id !== product.id) : [...list, product]);
  };

  const openProduct = (product) => {
    setSelected(product);
    setMode('specs');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search sofas, wardrobes, pooja units..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-[#D4AF37]"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-[#D4AF37]"
        >
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button
          onClick={() => setMode(mode === 'shop' ? 'compare' : 'shop')}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 hover:border-[#D4AF37]/50 transition"
        >
          <Filter className="w-4 h-4" />
          {mode === 'shop' ? 'Compare' : 'Browse'}
        </button>
      </div>

      {mode === 'compare' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Comparing {shortlist.length}</span>
            <button onClick={() => setShortlist([])} className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200">Clear</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {shortlist.map(p => (
              <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{p.category}</span>
                    <strong className="text-xs text-slate-200 block">{p.name}</strong>
                  </div>
                  <button onClick={() => toggleShortlist(p)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-1 text-[10px] text-slate-400">
                  <div className="flex justify-between"><span>Brand</span><span className="text-slate-200">{p.brand}</span></div>
                  <div className="flex justify-between"><span>Series</span><span className="text-slate-200">{p.series}</span></div>
                  <div className="flex justify-between"><span>Finish</span><span className="text-slate-200">{p.finish}</span></div>
                  <div className="flex justify-between"><span>Material</span><span className="text-slate-200">{p.material}</span></div>
                  <div className="flex justify-between"><span>Hardware</span><span className="text-slate-200">{p.hardware}</span></div>
                  <div className="flex justify-between"><span>Size</span><span className="text-slate-200">{p.width} × {p.height} × {p.depth} mm</span></div>
                  <div className="flex justify-between font-black text-[#D4AF37]"><span>Price</span><span>₹{p.price.toLocaleString('en-IN')}</span></div>
                </div>
                <button onClick={() => { onConfigure && onConfigure(p); onAddToProject && onAddToProject(p); }} className="w-full bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-[9px] font-black uppercase tracking-wider px-2 py-2 rounded-lg transition">Add to project</button>
              </div>
            ))}
            {shortlist.length === 0 && <p className="text-[10px] text-slate-500">Select items from the catalog to compare.</p>}
          </div>
        </div>
      )}

      {mode === 'specs' && selected && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{selected.category}</span>
              <h4 className="text-sm font-black text-slate-100">{selected.name}</h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-[#D4AF37]"><Star className="w-3 h-3" /> {selected.rating}</span>
                <span>{selected.reviews} reviews</span>
                <span>{selected.brand}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{selected.desc}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div><span className="block text-[9px] text-slate-500 uppercase tracking-wider">Finish</span>{selected.finish}</div>
                <div><span className="block text-[9px] text-slate-500 uppercase tracking-wider">Material</span>{selected.material}</div>
                <div><span className="block text-[9px] text-slate-500 uppercase tracking-wider">Hardware</span>{selected.hardware}</div>
                <div><span className="block text-[9px] text-slate-500 uppercase tracking-wider">Dimensions</span>{selected.width} × {selected.height} × {selected.depth} mm</div>
              </div>
            </div>
            <div className="shrink-0 space-y-2 text-right">
              <div className="text-xl font-black text-[#D4AF37] flex items-center gap-1 justify-end"><IndianRupee className="w-4 h-4" /> {selected.price.toLocaleString('en-IN')}</div>
              <div className="flex gap-2">
                <button onClick={() => { onConfigure && onConfigure(selected); onAddToProject && onAddToProject(selected); }} className="bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition">Use this</button>
                <button onClick={() => setMode('shop')} className="bg-slate-950 border border-slate-800 text-[#D4AF37] text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition">Back</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(mode === 'shop' || mode === 'compare') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-[#D4AF37]/50 transition">
              <div className="space-y-2">
                <div className="w-full h-28 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${p.color}22, ${p.color}08)` }}>
                  <div className="w-16 h-16 rounded-xl border border-slate-700/60 bg-slate-950/60 flex items-center justify-center text-[10px] font-black uppercase tracking-wider text-slate-300 text-center leading-tight px-2">{p.name.split(' ').slice(0,2).join(' ')}</div>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{p.category}</span>
                  <strong className="text-xs text-slate-200 block truncate">{p.name}</strong>
                  <span className="text-[10px] text-slate-400 block line-clamp-2">{p.desc}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 text-[#D4AF37]"><Star className="w-3 h-3" /> {p.rating}</span>
                  <span>{p.brand}</span>
                </div>
                <div className="text-[10px] font-mono text-[#D4AF37] font-bold">{p.width} × {p.height} × {p.depth} mm</div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 mt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">From</span>
                  <span className="text-xs font-black text-slate-100 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {p.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleShortlist(p)} className={`p-2 rounded-lg border transition ${shortlist.some(x => x.id === p.id) ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
                    <Heart className="w-4 h-4" />
                  </button>
                  <button onClick={() => openProduct(p)} className="bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-[9px] font-black uppercase tracking-wider px-2.5 py-2 rounded-lg transition">View</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-xs text-slate-500 col-span-full text-center py-10">No items match your search.</div>}
        </div>
      )}
    </div>
  );
}

export default FurniturePicker;
