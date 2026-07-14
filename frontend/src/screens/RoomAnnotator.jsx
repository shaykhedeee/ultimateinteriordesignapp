import { useState, useEffect } from 'react';

function toastMsg(msg){ window.__toast?.success?.(msg) || window.__toast?.show?.(msg); }

export default function RoomAnnotator({ image, onRoomsDefined, projectId }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(0.05); // mm per pixel
  const [rooms, setRooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [wMm, setWMm] = useState('');
  const [hMm, setHMm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const canvasCanvasRef = typeof document !== 'undefined' ? document?.createElement?.('canvas') : null;

  useEffect(() => { if (typeof window === 'undefined') return; setRooms([]); setSelectedId(null); setName(''); setWMm(''); setHMm(''); setShowForm(false); }, [image]);

  // Prefill marked zones from the project's CAD rooms (canonical flow step 10)
  useEffect(() => {
    if (typeof window === 'undefined' || !projectId) return;
    fetch(`/api/projects/${projectId}/cad`).then(r => r.json()).then(cad => {
      const existing = JSON.parse(cad?.rooms_json || '[]');
      if (existing.length) {
        setRooms(existing.map(r => ({
          id: r.id || crypto.randomUUID(),
          name: r.name || 'Room',
          x: r.points?.[0]?.x ?? 100,
          y: r.points?.[0]?.y ?? 100,
          wMm: r.wMm ?? Math.round((r.widthMm ?? 3000)),
          hMm: r.hMm ?? Math.round((r.heightMm ?? 3000)),
          seats: r.seats || []
        })));
      }
    }).catch(() => {});
  }, [projectId, image]);

  if (typeof window === 'undefined') return null;

  function handleCanvasClick(e){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!selectedId){
      const room = { id: crypto.randomUUID(), name:'Room '+(rooms.length+1), x, y, wMm:'3000', hMm:'3000', seats:[] };
      setRooms([...rooms, room]);
      setSelectedId(room.id);
      setShowForm(true);
      return;
    }
    const room = rooms.find(r => r.id === selectedId);
    if (!room) return;
    room.w = isNaN(Number(wMm)) ? room.wMm : Number(wMm);
    room.h = isNaN(Number(hMm)) ? room.hMm : Number(hMm);
    room.name = name || room.name;
    toastMsg(`Room updated: ${room.name}`);
    setSelectedId(null);
    setShowForm(false);
  }

  function removeRoom(id){ setRooms(rooms.filter(r => r.id !== id)); if (selectedId === id) setSelectedId(null); }

  function finish(){
    const payload = rooms.map(r => ({ name: r.name, x: r.x, y: r.y, wMm: Number(r.wMm), hMm: Number(r.hMm), areaMm2: (Number(r.wMm)*Number(r.hMm)) }));
    onRoomsDefined && onRoomsDefined(payload);
    // Persist marked zones back to cad_drawings so the AI re-studies the altered plan
    if (projectId) {
      fetch(`/api/projects/${projectId}/cad`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms: payload })
      }).catch(() => {}).finally(() => { onComplete && onComplete(); });
    } else {
      onComplete && onComplete();
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="flex items-center gap-3">
          <img
          src={image}
          alt="floorplan"
          className="max-h-[60vh] rounded-lg object-contain border border-white/10"
          style={{ cursor: 'crosshair' }}
          onLoad={() => setImageLoaded(true)}
          onClick={handleCanvasClick}
        />
          <div className="min-w-[260px] space-y-3">
            <div className="text-xs text-white/60">Draw boxes to mark spaces. Select a room to assign name/scale. <span className="text-white/40">Click empty area to place, click room to confirm.</span></div>
            <div>
              <label className="block text-xs text-white/60">Scale. mm per pixel</label>
              <input type="number" value={scale} onChange={e=>setScale(Number(e.target.value))} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            </div>
            {selectedId && showForm && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-white/60">Room name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="Living, Bedroom, Kitchen..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-white/60">Width mm</label>
                    <input value={wMm} onChange={e=>setWMm(e.target.value)} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60">Height mm</label>
                    <input value={hMm} onChange={e=>setHMm(e.target.value)} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
                  </div>
                </div>
                <button onClick={handleCanvasClick} className="w-full rounded-md bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15">Confirm room</button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/60">{rooms.length} marked</div>
              <button onClick={finish} className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-white/90">Continue</button>
            </div>
            <div className="space-y-1">
              {rooms.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white">
                  <button onClick={()=>{ setSelectedId(r.id); setName(r.name); setWMm(String(r.wMm||'')); setHMm(String(r.hMm||'')); setShowForm(true); }} className="truncate text-left">{r.name}</button>
                  <button onClick={()=>removeRoom(r.id)} className="text-white/60 hover:text-red-300">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
