import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Download,
  Palette,
  Sparkles,
  ImagePlus,
  Share2
} from 'lucide-react';

interface MoodItem {
  id: string;
  type: 'image' | 'color' | 'material' | 'text';
  url?: string;
  color?: string;
  label: string;
}

const INITIAL_MOOD_ITEMS: MoodItem[] = [
  { id: 'm1', type: 'image', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=80', label: 'Japandi Living Room' },
  { id: 'm2', type: 'color', color: '#b9936c', label: 'Warm European Oak' },
  { id: 'm3', type: 'image', url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80', label: 'Wabi-Sabi Texture' },
  { id: 'm4', type: 'color', color: '#eae6df', label: 'Warm Alabaster Wall' },
  { id: 'm5', type: 'image', url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80', label: 'Monstera Greenery' },
  { id: 'm6', type: 'color', color: '#5c4033', label: 'Smoked Walnut' },
  { id: 'm7', type: 'image', url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=400&q=80', label: 'Linen Drapes' },
  { id: 'm8', type: 'color', color: '#d4af37', label: 'Brushed Brass' },
  { id: 'm9', type: 'text', label: '2700K Warm + 38" clearance + FSC Oak only' },
];

const COLOR_PRESETS = [
  '#b9936c', '#eae6df', '#5c4033', '#d4af37', '#046307', '#c19a6b',
  '#f5f5f5', '#808080', '#d2b48c', '#1e1b4b', '#064e3b', '#7c2d12'
];

export const MoodBoard: React.FC = () => {
  const [items, setItems] = useState<MoodItem[]>(INITIAL_MOOD_ITEMS);
  const [title, setTitle] = useState('Japandi Wabi-Sabi Sanctuary Mood');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#6366f1');

  const addColor = (color: string) => {
    const newItem: MoodItem = {
      id: `m-${Date.now()}`,
      type: 'color',
      color,
      label: `Custom Palette ${items.length + 1}`
    };
    setItems(prev => [...prev, newItem]);
    setShowColorPicker(false);
  };

  const addImagePlaceholder = () => {
    const images = [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=400&q=80'
    ];
    const newItem: MoodItem = {
      id: `m-${Date.now()}`,
      type: 'image',
      url: images[Math.floor(Math.random() * images.length)],
      label: `Inspiration ${items.length + 1}`
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const aiExtractPalette = () => {
    const palette = ['#eae6df', '#b9936c', '#5c4033', '#d4af37', '#808080'];
    palette.forEach((color, i) => {
      setTimeout(() => {
        const newItem: MoodItem = {
          id: `ai-pal-${Date.now()}-${i}`,
          type: 'color',
          color,
          label: ['Warm Alabaster', 'European Oak', 'Dark Walnut', 'Antique Brass', 'Microcement'][i]
        };
        setItems(prev => [...prev, newItem]);
      }, i * 200);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950 text-slate-100 select-none">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-pink-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-pink-400" /> Mood Board & Style Curation
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-extrabold tracking-tight bg-transparent border-b-2 border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none text-white w-full max-w-xl transition"
          />
          <p className="text-slate-400 text-xs">Drag in inspiration images, colors, materials and textures. AI auto-extracts cohesive palettes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={addImagePlaceholder}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2 transition cursor-pointer"
          >
            <ImagePlus className="w-4 h-4 text-emerald-400" /> Add Image
          </button>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-400" /> Add Color
          </button>
          <button
            onClick={aiExtractPalette}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-purple-600/25 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> AI Extract Palette
          </button>
          <button
            onClick={() => alert("Mood board exported as PNG & shared to client portal.")}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-300 flex items-center gap-2 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Share to Client
          </button>
        </div>
      </div>

      {/* Color Picker Panel */}
      {showColorPicker && (
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 animate-in slide-in-from-top-3 fade-in space-y-3">
          <h3 className="text-xs font-bold text-purple-300 flex items-center gap-2">
            <Palette className="w-4 h-4" /> AI Color Harmony Picker
          </h3>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => addColor(color)}
                className="w-10 h-10 rounded-xl border-2 border-slate-700 hover:border-white hover:scale-110 transition shadow-lg cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-10 h-10 rounded-xl border-2 border-slate-700 hover:border-white cursor-pointer"
              />
              <button
                onClick={() => addColor(customColor)}
                className="mt-1 text-[9px] text-indigo-400 hover:text-indigo-300 font-mono block"
              >
                Use custom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Masonry Grid */}
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="break-inside-avoid group relative rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 bg-slate-900/60 hover:shadow-2xl"
          >
            {item.type === 'image' && item.url && (
              <>
                <img
                  src={item.url}
                  alt={item.label}
                  className="w-full object-cover group-hover:scale-105 transition duration-500"
                  style={{ minHeight: '100px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              </>
            )}
            
            {item.type === 'color' && item.color && (
              <div
                className="w-full aspect-square flex items-end p-3"
                style={{ backgroundColor: item.color }}
              >
                <span className="text-[9px] font-mono bg-slate-950/70 backdrop-blur px-2 py-1 rounded text-white">
                  {item.color}
                </span>
              </div>
            )}

            {item.type === 'text' && (
              <div className="p-4 bg-slate-800/80 backdrop-blur min-h-[80px] flex items-center">
                <p className="text-xs text-slate-300 italic leading-relaxed font-mono">"{item.label}"</p>
              </div>
            )}

            {/* Label & Delete */}
            <div className="p-2.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300 truncate pr-2">{item.label}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Cohesion Score */}
      <div className="glass-panel p-5 rounded-2xl border border-pink-500/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-purple-600/20">
            94
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-slate-100">AI Style Cohesion Score</div>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-lg">
              Your palette achieves 94% harmony with <span className="text-pink-400 font-semibold">Japandi Wabi-Sabi</span>.
              The oak-and-alabaster base is well balanced with brass accents and organic greenery.
            </p>
          </div>
        </div>
        <button
          onClick={() => alert("Full mood board exported as client presentation PDF.")}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Mood Board PDF
        </button>
      </div>
    </div>
  );
};
