import React, { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { selectRooms } from '../../lib/selectors/editorSelectors';
import { Home, Layout, Grid, BookOpen, Compass, Plus } from 'lucide-react';

const MODULE_LIBRARY = [
  {
    category: 'Modular Kitchen',
    items: [
      { key: 'kitchen_base_run', name: 'Base Unit Run', w: 1200, h: 720, d: 560, desc: 'Under-counter standard run cabinet' },
      { key: 'kitchen_wall_run', name: 'Wall Overhead Unit', w: 900, h: 600, d: 300, desc: 'Upper wall hanging cabinet' },
      { key: 'kitchen_loft_storage', name: 'Loft Unit Run', w: 1200, h: 600, d: 560, desc: 'Ceiling touch overhead lofts' },
      { key: 'kitchen_hob_unit', name: 'Hob Cooking Box', w: 900, h: 720, d: 560, desc: 'Gas stove integrated base unit' },
      { key: 'kitchen_sink_unit', name: 'Sink Water Box', w: 800, h: 720, d: 560, desc: 'Sink support cabinet carcass' }
    ]
  },
  {
    category: 'Wardrobes & Storage',
    items: [
      { key: 'wardrobe_swing', name: 'Swing Door Wardrobe', w: 1200, h: 2100, d: 600, desc: 'Double swing shutters carcass' },
      { key: 'wardrobe_sliding', name: 'Sliding Wardrobe', w: 1800, h: 2100, d: 650, desc: 'Standard 2-track sliding unit' },
      { key: 'loft_storage', name: 'Wardrobe Top Loft', w: 1200, h: 600, d: 600, desc: 'Additional top loft boxes' },
      { key: 'study_desk', name: 'Integrated Study Table', w: 1000, h: 750, d: 500, desc: 'Study writing table top' }
    ]
  },
  {
    category: 'Living & Dining',
    items: [
      { key: 'tv_unit', name: 'Modern TV Console', w: 1800, h: 450, d: 400, desc: 'TV media entertainment console' },
      { key: 'feature_wall_panel_system', name: 'Backlit Rafter Wall', w: 2400, h: 2700, d: 50, desc: 'Backlit marble and wood paneling' },
      { key: 'crockery_unit', name: 'Crockery Glass Display', w: 1000, h: 1800, d: 400, desc: 'Glass shutter dining showcase' },
      { key: 'shoe_rack', name: 'Shoe Cabinet Console', w: 900, h: 900, d: 350, desc: 'Shoe rack organiser bench' }
    ]
  },
  {
    category: 'Mandir / Pooja',
    items: [
      { key: 'mandir_floor_unit', name: 'Pooja Floor Mandir', w: 800, h: 1200, d: 450, desc: 'Vastu-perfect floor temple base' },
      { key: 'mandir_wall_unit', name: 'Pooja Hanging Mandir', w: 600, h: 800, d: 300, desc: 'Wall mounted carved pooja box' }
    ]
  }
];

export default function LeftNavigator() {
  const rooms = useEditorStore(selectRooms);
  const activeRoomId = useEditorStore(state => state.activeRoomId);
  const setActiveRoom = useEditorStore(state => state.setActiveRoom);
  const selectEntity = useEditorStore(state => state.selectEntity);
  const applyPatch = useEditorStore(state => state.applyPatch);
  const isLocked = useEditorStore(state => state.isLocked);

  const [activeTab, setActiveTab] = useState('library'); // 'rooms' | 'library'

  const handlePlaceModule = (item) => {
    if (isLocked) return;
    
    // Propose default placement coordinates based on active room
    applyPatch({
      op: 'place_module',
      payload: {
        templateKey: item.key,
        name: item.name,
        x: 1500, // spawn coordinate x (mm)
        y: 1500, // spawn coordinate y (mm)
        z: 0,
        width: item.w,
        height: item.h,
        depth: item.d
      }
    });
  };

  return (
    <div className="w-full h-full bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
      
      {/* Navigator Tabs */}
      <div className="flex border-b border-slate-800 p-2 gap-1.5 shrink-0 bg-slate-950/40">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'library'
              ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" /> Library
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'rooms'
              ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-3.5 h-3.5" /> Rooms
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'rooms' ? (
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Project Spaces</h3>
            {rooms.length === 0 ? (
              <div className="text-slate-500 text-xs py-4 text-center">No rooms configured.</div>
            ) : (
              <div className="space-y-1">
                {rooms.map(room => (
                  <button
                    key={room.roomId}
                    onClick={() => {
                      setActiveRoom(room.roomId);
                      selectEntity(room.roomId, 'room');
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left flex items-center justify-between transition ${
                      activeRoomId === room.roomId
                        ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20'
                        : 'bg-slate-950/20 border border-transparent hover:border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="truncate">
                      <span>{room.name}</span>
                      <span className="text-[9px] text-slate-500 ml-1.5 block font-medium uppercase tracking-wider">{room.roomType.replace('_', ' ')}</span>
                    </div>
                    {room.constraints?.vastuZone && (
                      <span className="text-[9px] bg-slate-850 px-1.5 py-0.5 rounded font-bold font-mono text-[var(--gold)]">
                        {room.constraints.vastuZone}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {MODULE_LIBRARY.map((cat, idx) => (
              <div key={idx} className="space-y-2.5">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-800/60 pb-1.5">{cat.category}</h4>
                <div className="space-y-2">
                  {cat.items.map((item, i) => (
                    <div
                      key={i}
                      className="bg-slate-950/30 border border-slate-850/60 p-3.5 rounded-2xl flex flex-col justify-between hover:border-[var(--gold)]/25 hover:bg-slate-950/50 transition-all duration-200"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">{item.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.desc}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-1.5">
                          Size: {item.w} × {item.h} × {item.d} mm
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlaceModule(item)}
                        disabled={isLocked}
                        className={`mt-3 py-1.5 px-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
                          isLocked
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/20'
                        }`}
                      >
                        <Plus className="w-3 h-3" /> Place Module
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footnote */}
      <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-[10px] text-slate-500 shrink-0 flex items-center gap-1.5">
        <Compass className="w-3.5 h-3.5 text-[var(--gold)]" />
        <span>Indian Modular Standards Enforced</span>
      </div>
    </div>
  );
}
