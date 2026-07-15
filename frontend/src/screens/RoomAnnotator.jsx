import { useEffect, useMemo, useRef, useState } from 'react';

function toastMsg(msg) {
  window.__toast?.success?.(msg) || window.__toast?.show?.(msg);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function RoomAnnotator({ image, onRoomsDefined, projectId }) {
  const wrapRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [scale, setScale] = useState(5); // mm per pixel
  const [name, setName] = useState('');
  const [wMm, setWMm] = useState('');
  const [hMm, setHMm] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedId) || null, [rooms, selectedId]);

  useEffect(() => {
    setRooms([]);
    setSelectedId(null);
    setDraft(null);
    setDrawing(false);
    setName('');
    setWMm('');
    setHMm('');
  }, [image]);

  // Prefill from the canonical plan record when available.
  useEffect(() => {
    if (typeof window === 'undefined' || !projectId) return;
    fetch(`/api/projects/${projectId}/cad`)
      .then(r => r.json())
      .then(cad => {
        const existing = JSON.parse(cad?.rooms_json || '[]');
        if (existing.length) {
          setRooms(existing.map((r, idx) => ({
            id: r.id || crypto.randomUUID(),
            name: r.name || `Room ${idx + 1}`,
            x: Number(r.x ?? r.points?.[0]?.x ?? 40),
            y: Number(r.y ?? r.points?.[0]?.y ?? 40),
            wMm: Number(r.wMm ?? r.widthMm ?? 3000),
            hMm: Number(r.hMm ?? r.heightMm ?? 3000)
          })));
        }
      })
      .catch(() => {});
  }, [projectId, image]);

  if (typeof window === 'undefined') return null;

  const getPos = (e) => {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: clamp(clientX - rect.left, 0, rect.width),
      y: clamp(clientY - rect.top, 0, rect.height)
    };
  };

  const beginDraw = (e) => {
    if (e.button !== 0) return;
    if (e.target?.closest?.('[data-room-hit="true"]')) return;
    const p = getPos(e);
    setSelectedId(null);
    setName('');
    setWMm('');
    setHMm('');
    setDraft({ x: p.x, y: p.y, x2: p.x, y2: p.y });
    setDrawing(true);
  };

  const moveDraw = (e) => {
    if (!drawing || !draft) return;
    const p = getPos(e);
    setDraft(prev => prev ? { ...prev, x2: p.x, y2: p.y } : prev);
  };

  const endDraw = () => {
    if (!drawing || !draft) return;
    const x = Math.min(draft.x, draft.x2);
    const y = Math.min(draft.y, draft.y2);
    const wPx = Math.abs(draft.x2 - draft.x);
    const hPx = Math.abs(draft.y2 - draft.y);
    setDrawing(false);
    setDraft(null);
    if (wPx < 14 || hPx < 14) return;

    const room = {
      id: crypto.randomUUID(),
      name: `Room ${rooms.length + 1}`,
      x,
      y,
      wMm: Math.max(1, Math.round(wPx * scale)),
      hMm: Math.max(1, Math.round(hPx * scale))
    };
    setRooms(prev => [...prev, room]);
    setSelectedId(room.id);
    setName(room.name);
    setWMm(String(room.wMm));
    setHMm(String(room.hMm));
    toastMsg(`Room placed: ${room.name}`);
  };

  const commitRoom = () => {
    if (!selectedRoom) return;
    const updated = rooms.map(r => r.id === selectedRoom.id ? {
      ...r,
      name: (name || r.name || '').trim() || r.name,
      wMm: Number(wMm || r.wMm || 0) || r.wMm,
      hMm: Number(hMm || r.hMm || 0) || r.hMm
    } : r);
    setRooms(updated);
    setSelectedId(null);
    setName('');
    setWMm('');
    setHMm('');
    toastMsg(`Room updated: ${selectedRoom.name}`);
  };

  const removeRoom = (id) => {
    const updated = rooms.filter(r => r.id !== id);
    setRooms(updated);
    if (selectedId === id) {
      setSelectedId(null);
      setName('');
      setWMm('');
      setHMm('');
    }
  };

  const finish = async () => {
    const payload = rooms.map(r => ({
      id: r.id,
      name: r.name,
      x: Math.round(r.x),
      y: Math.round(r.y),
      wMm: Math.round(Number(r.wMm) || 0),
      hMm: Math.round(Number(r.hMm) || 0),
      areaMm2: Math.round((Number(r.wMm) || 0) * (Number(r.hMm) || 0))
    }));
    onRoomsDefined?.(payload);
    if (projectId) {
      try {
        await fetch(`/api/projects/${projectId}/cad`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rooms: payload })
        });
      } catch {}
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.55fr)_360px] gap-4">
      <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Mark Spaces</div>
            <div className="text-[11px] text-white/50">Drag on the plan to draw a room, then rename and set dimensions in millimetres.</div>
          </div>
          <div className="text-[11px] text-white/60">
            {rooms.length} marked
          </div>
        </div>

        <div
          ref={wrapRef}
          className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-slate-950"
          onMouseDown={beginDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
        >
          <img
            src={image}
            alt="floorplan"
            className="block w-full h-auto select-none"
            onLoad={() => setImageLoaded(true)}
            draggable="false"
          />

          <div className="absolute inset-0">
            {rooms.map(room => {
              const isActive = room.id === selectedId;
              const widthPx = Math.max(18, (Number(room.wMm) || 0) / Math.max(scale, 0.001));
              const heightPx = Math.max(18, (Number(room.hMm) || 0) / Math.max(scale, 0.001));
              return (
                <button
                  key={room.id}
                  data-room-hit="true"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(room.id);
                    setName(room.name || '');
                    setWMm(String(room.wMm || ''));
                    setHMm(String(room.hMm || ''));
                  }}
                  className="absolute text-left"
                  style={{
                    left: room.x,
                    top: room.y,
                    width: widthPx,
                    height: heightPx,
                    border: isActive ? '2px solid #C9A84C' : '1px solid rgba(255,255,255,0.45)',
                    background: isActive ? 'rgba(201,168,76,0.18)' : 'rgba(15,23,42,0.26)',
                    color: '#fff',
                    borderRadius: 10,
                    padding: 8
                  }}
                >
                  <div className="text-[12px] font-bold leading-tight truncate">{room.name}</div>
                  <div className="text-[10px] text-white/65 mt-1">
                    {Math.round(Number(room.wMm) || 0)} x {Math.round(Number(room.hMm) || 0)} mm
                  </div>
                </button>
              );
            })}

            {draft && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: Math.min(draft.x, draft.x2),
                  top: Math.min(draft.y, draft.y2),
                  width: Math.abs(draft.x2 - draft.x),
                  height: Math.abs(draft.y2 - draft.y),
                  border: '2px dashed #C9A84C',
                  background: 'rgba(201,168,76,0.12)',
                  borderRadius: 10
                }}
              />
            )}
          </div>
        </div>

        <div className="text-[11px] text-white/50">
          {imageLoaded ? 'Image loaded. Draw a box anywhere on the plan.' : 'Loading image...'}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Scale</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={scale}
            onChange={e => setScale(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
          />
          <div className="mt-1 text-[10px] text-white/45">Millimetres per pixel. Increase this if the room boxes are too small.</div>
        </div>

        {selectedRoom ? (
          <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Selected Room</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Room name"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={wMm}
                onChange={e => setWMm(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Width mm"
              />
              <input
                type="number"
                value={hMm}
                onChange={e => setHMm(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Height mm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={commitRoom} className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-white/90">
                Update
              </button>
              <button onClick={() => removeRoom(selectedRoom.id)} className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-red-300 hover:text-red-200">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 bg-black/15 p-3 text-[11px] text-white/55">
            Draw a room box, then select it from the overlay to rename or resize it.
          </div>
        )}

        <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
          {rooms.map(r => (
            <div key={r.id} className={`rounded-md border px-2 py-2 text-xs ${selectedId === r.id ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/10 bg-white/5'}`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(r.id);
                  setName(r.name || '');
                  setWMm(String(r.wMm || ''));
                  setHMm(String(r.hMm || ''));
                }}
                className="w-full text-left"
              >
                <div className="font-semibold text-white truncate">{r.name}</div>
                <div className="mt-0.5 text-white/45">
                  {Math.round(Number(r.wMm) || 0)} x {Math.round(Number(r.hMm) || 0)} mm
                </div>
              </button>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="rounded-md border border-white/10 bg-white/5 p-3 text-[11px] text-white/45">
              No rooms marked yet.
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={finish} className="flex-1 rounded-md bg-[var(--gold)] px-3 py-2 text-sm font-semibold text-black hover:brightness-110">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
