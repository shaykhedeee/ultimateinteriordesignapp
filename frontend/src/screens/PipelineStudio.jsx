import { useState, useCallback, useEffect } from 'react';
import RoomAnnotator from './RoomAnnotator.jsx';
import { API_BASE } from '../config';

const STEPS = [
  { id: 'analyze', label: 'Analyze', desc: 'Read floor plan inputs and detect rooms.' },
  { id: 'mark', label: 'Mark Spaces', desc: 'Trace & name each room, set real dimensions.' },
  { id: 'enhance', label: 'Enhance', desc: 'Refine room sizes, openings, furniture.' },
  { id: 'furnish', label: 'Moodboard & Modules', desc: 'Pick theme + modular furniture per room.' },
  { id: 'generate', label: 'Generate 3D & Docs', desc: 'Build renders, SKP, DXF, PDF.' },
  { id: 'package', label: 'Package', desc: 'Bundle client deliverables for handoff.' },
];

const STEP_ORDER = STEPS.map(s => s.id);

const INITIAL_ROOMS = [
  { name:'Living Dining', w:5600, h:4200 },
  { name:'Master Bedroom', w:4200, h:3600 },
  { name:'Kitchen', w:3600, h:3000 },
];

const MOOD_PRESETS = [
  { id:'luxe-marble', label:'Luxe Marble & Warm Cove', note:'white marble, beige, sage accents, warm perimeter cove LED' },
  { id:'sage-arch', label:'Sage + Arched Cream', note:'cream arches, sage green panels, black knobs' },
  { id:'dark-velvet', label:'Dark Velvet Suite', note:'dark tufted headboard, charcoal bedding, warm wood' },
  { id:'minimal-oak', label:'Minimal Light Oak', note:'fluted oak, white marble tops, glass' },
];

function liftField(items, field){
  if (!Array.isArray(items)) return [];
  return items.map((it, idx) => ({ ...it, _humanLabel: it.name || `${field} ${idx+1}` }));
}

export default function PipelineStudio({ projectId: projectIdProp }){
  const pid = projectIdProp || 'proj_demo_hsr'; // real selected project, else the seeded demo
  const [activeStep, setActiveStep] = useState(STEP_ORDER[0]);
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState([]);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [result, setResult] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [floorplanImage, setFloorplanImage] = useState('');

  const pushLog = useCallback((msg) => setLog(prev => [...prev.slice(-80), { t: Date.now(), msg }]), []);

  useEffect(() => {
    fetch(`${API_BASE}/api/furniture-catalog`).then(r=>r.json()).then(d=>setCatalog(d && d.catalog && typeof d.catalog === 'object' ? d.catalog : {})).catch(()=>{});
    fetch(`${API_BASE}/api/room-templates`).then(r=>r.json()).then(d=>setTemplates(d.templates||[])).catch(()=>{});
    fetch(`${API_BASE}/api/projects/${pid}`).then(r=>r.json()).then(d=>{
      if (d?.floorplan_url || d?.floorplanUrl) setFloorplanImage(d.floorplan_url || d.floorplanUrl);
    }).catch(()=>{});
  }, [pid]);

  async function runStep(step){
    try {
      setStatus('running');
      pushLog(`Starting ${step}...`);
      const currentPid = pid || 'proj_demo_hsr';
      const url = `${API_BASE}/api/projects/${currentPid}/${step === 'generate' ? 'pipeline/run' : step === 'package' ? 'delivery-package' : 'plan/measure'}`;
      const payload = { projectName: pid, rooms: rooms.map(r => ({ ...r, openings:[], cabinets:[] })) };
      const opts = { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) };
      const res = await fetch(url, opts);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      pushLog(`${step} completed.`);
      if (data?.images?.length || data?.dxfs?.length || data?.pdfs?.length || data?.skpFiles?.length) setResult(data);
      setStatus('ready');
      const idx = STEP_ORDER.indexOf(step);
      if (idx >= 0 && idx < STEP_ORDER.length-1) setActiveStep(STEP_ORDER[idx+1]);
    } catch (e){
      setStatus('error');
      pushLog(`${step} failed: ${e.message}`);
      window.__toast?.error?.(`${step} failed: ${e.message}`);
    }
  }

  async function downloadPackage(){
    try {
      setStatus('running');
      pushLog('Building package...');
      const currentPid = pid || 'proj_demo_hsr';
      const url = `${API_BASE}/api/projects/${currentPid}/delivery-package`;
      const opts = { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ projectName: pid, rooms: rooms.map(r => ({ ...r, openings:[], cabinets:[] })) }) };
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `ULTIDA_${currentPid}_package.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      pushLog('Package downloaded.');
      setStatus('ready');
    } catch (e){
      setStatus('error');
      pushLog(`Package failed: ${e.message}`);
      window.__toast?.error?.(`Package failed: ${e.message}`);
    }
  }

  async function applyTemplate(templateId){
    try {
      setStatus('running');
      pushLog(`Applying template ${templateId}...`);
      const res = await fetch(`${API_BASE}/api/projects/${pid}/apply-template`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ templateId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'apply failed');
      if (data.template?.defaultRoom) {
        setRooms(prev => prev.map(r => r.name.toLowerCase().includes('kitchen') ? { ...r, ...data.template.defaultRoom, name: data.template.name } : r));
      }
      pushLog(`Template applied: ${data.template?.name}`);
      setStatus('ready');
    } catch (e){ setStatus('error'); pushLog(`Template failed: ${e.message}`); }
  }

  async function regenerateRoomByName(roomName){
    try {
      const r = rooms.find(x => x.name === roomName) || { name: roomName, w: 4000, h: 3500 };
      setStatus('running');
      pushLog(`Regenerating ${roomName} via AURA pipeline...`);
      const res = await fetch(`${API_BASE}/api/projects/${pid}/pipeline/regenerate-room`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ room: r, projectName: pid }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'regen failed');
      setResult(prev => ({ ...prev, rooms: { ...(prev?.rooms||{}), [roomName]: true } }));
      pushLog(`Regenerated ${roomName}.`);
      setStatus('ready');
    } catch (e){ setStatus('error'); pushLog(`Regen failed: ${e.message}`); }
  }

  function setRoomMood(roomName, moodId){
    setRooms(prev => prev.map(r => r.name === roomName ? { ...r, theme: moodId } : r));
  }
  function setRoomFurniture(roomName, items){
    setRooms(prev => prev.map(r => r.name === roomName ? { ...r, furniture: items } : r));
  }

  // Build thumbnail list from server-served deliverables (when running) or local /_deliverables
  const roomArtifacts = (name) => {
    const base = `${API_BASE}/api/deliverables/${pid}/rooms/${encodeURIComponent(name)}`;
    return {
      render: `${base}/${encodeURIComponent(name)}_render.jpg`,
      renderPng: `${base}/${encodeURIComponent(name)}_render.png`,
      skp: `${base}/${encodeURIComponent(name)}_model.skp`,
      northDxf: `${base}/${encodeURIComponent(name)}_north.dxf`,
      northPdf: `${base}/${encodeURIComponent(name)}_north.pdf`,
    };
  };

  const roomList = (result?.rooms ? Object.keys(result.rooms).map(k=>({name:k})) : rooms);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline Studio</h1>
          <p className="text-slate-400 mt-1">Sequential generation: analyze → mark → enhance → moodboard → 3D → package</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCompareMode(m => !m)} className={`rounded-md px-4 py-2 text-sm font-medium ${compareMode ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>
            {compareMode ? 'Exit Compare' : 'Side-by-side Compare'}
          </button>
          <button onClick={downloadPackage} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
            Download Full Package
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 md:grid-cols-6 gap-3">
        {STEPS.map((s, idx) => {
          const isActive = activeStep === s.id;
          const activeIndex = STEP_ORDER.indexOf(activeStep);
          const isDone = activeIndex > idx;
          return (
            <button key={s.id} onClick={() => { if (isDone || isActive || idx <= activeIndex+1) setActiveStep(s.id); }} className={`rounded-lg border px-3 py-3 text-left ${isActive ? 'border-emerald-500 bg-emerald-500/10' : isDone ? 'border-emerald-700 bg-emerald-900/20' : 'border-white/10 bg-white/5'}`}>
              <div className="text-xs text-slate-300">{idx+1}</div>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-xs text-slate-400 mt-1">{s.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">{STEPS.find(s=>s.id===activeStep)?.label}</h2>
            <p className="text-slate-400 text-sm mt-1">{STEPS.find(s=>s.id===activeStep)?.desc}</p>
          </div>
          {activeStep !== 'package' && activeStep !== 'mark' && activeStep !== 'furnish' && (
            <button onClick={() => runStep(activeStep)} disabled={status==='running'} className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              {status==='running' ? 'Running...' : 'Run Step'}
            </button>
          )}
        </div>

        {/* ANALYZE */}
        {activeStep === 'analyze' && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-slate-300">Floor plan source:</p>
            {floorplanImage ? (
              <img src={floorplanImage} alt="floorplan" className="mt-2 max-h-64 rounded-lg border border-white/10" />
            ) : (
              <p className="text-xs text-slate-400 mt-2">No floorplan uploaded yet. Upload one in Client Intake, then re-run analysis.</p>
            )}
            <button onClick={() => runStep('analyze')} disabled={status==='running'} className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50">
              {status==='running' ? 'Analyzing...' : 'Analyze Floor Plan'}
            </button>
          </div>
        )}

        {/* MARK SPACES */}
        {activeStep === 'mark' && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 space-y-4">
            <p className="text-sm text-slate-300">Mark each room on the plan, name it, and set accurate dimensions (mm).</p>
            {floorplanImage ? (
              <RoomAnnotator
                image={floorplanImage}
                projectId={pid}
                onRoomsDefined={(payload) => {
                  if (payload && payload.length) {
                    setRooms(payload.map((p, i) => ({ name: p.name || `Room ${i+1}`, w: p.wMm || 3000, h: p.hMm || 3000 })));
                    pushLog(`Marked ${payload.length} rooms from plan.`);
                  }
                }}
              />
            ) : (
              <p className="text-xs text-slate-400">No floorplan uploaded yet — use the manual room grid below.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {rooms.map((r, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <input value={r.name} onChange={e=>setRooms(prev=>prev.map((x,idx)=>idx===i?{...x,name:e.target.value}:x))} className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm text-white" />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400">Width mm</label>
                      <input type="number" value={r.w} onChange={e=>setRooms(prev=>prev.map((x,idx)=>idx===i?{...x,w:Number(e.target.value)}:x))} className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Height mm</label>
                      <input type="number" value={r.h} onChange={e=>setRooms(prev=>prev.map((x,idx)=>idx===i?{...x,h:Number(e.target.value)}:x))} className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm text-white" />
                    </div>
                  </div>
                  <button onClick={()=>setRooms(prev=>prev.filter((_,idx)=>idx!==i))} className="mt-2 text-xs text-red-300 hover:text-red-200">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setRooms(prev=>[...prev, { name:`Room ${prev.length+1}`, w:3000, h:3000 }])} className="rounded-md bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15">Add Room</button>
              <button onClick={()=>setActiveStep('enhance')} className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">Save & Continue</button>
            </div>
          </div>
        )}

        {/* ENHANCE */}
        {activeStep === 'enhance' && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <button key={t.id} onClick={()=>applyTemplate(t.id)} className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/10">{t.name}</button>
              ))}
            </div>
            <p className="text-xs text-slate-400">Tip: apply a kitchen template to seed sizes, or refine each room manually below.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {rooms.map((r,i)=>(
                <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{r.w} × {r.h} mm</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input type="number" value={r.w} onChange={e=>setRooms(prev=>prev.map((x,idx)=>idx===i?{...x,w:Number(e.target.value)}:x))} className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-white" />
                    <input type="number" value={r.h} onChange={e=>setRooms(prev=>prev.map((x,idx)=>idx===i?{...x,h:Number(e.target.value)}:x))} className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-white" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>setActiveStep('furnish')} className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">Continue to Moodboard</button>
          </div>
        )}

        {/* FURNISH / MOODBOARD */}
        {activeStep === 'furnish' && (
          <div className="mt-4 space-y-4">
            {rooms.map((r,i)=>(
              <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{r.name}</div>
                  <button onClick={()=>regenerateRoomByName(r.name)} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500">Regenerate Room</button>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-slate-400 mb-1">Theme / Moodboard</div>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_PRESETS.map(m=>(
                      <button key={m.id} onClick={()=>setRoomMood(r.name, m.id)} className={`rounded-md border px-3 py-1.5 text-xs ${r.theme===m.id?'border-emerald-500 bg-emerald-500/10 text-white':'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>{m.label}</button>
                    ))}
                  </div>
                </div>
                {catalog && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-400 mb-1">Modular furniture modules</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(catalog).flatMap(([cat, items]) => (Array.isArray(items) ? items : []).map(it => (
                        <label key={it.id} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-300 hover:bg-white/10 cursor-pointer">
                          <input type="checkbox" checked={(r.furniture||[]).some(f=>f.id===it.id)} onChange={e=>{
                            const cur = r.furniture || [];
                            setRoomFurniture(r.name, e.target.checked ? [...cur, it] : cur.filter(f=>f.id!==it.id));
                          }} />
                          {it.name}
                        </label>
                      )))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={()=>setActiveStep('generate')} className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">Continue to Generate</button>
          </div>
        )}

        {/* GENERATE */}
        {activeStep === 'generate' && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-medium mb-2">Per-room generation</div>
            <div className="flex flex-wrap gap-2">
              {liftField(roomList, 'name').map(r => (
                <button key={r.name} onClick={() => setSelectedRoom(r.name)} className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/10">{r.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* PACKAGE with thumbnails + compare */}
        {activeStep === 'package' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-medium mb-2">Latest artifacts</div>
              <div className="space-y-2">
                {result ? (
                  <>
                    <div className="text-xs text-slate-300">Images: {result?.images?.length || 0}</div>
                    <div className="text-xs text-slate-300">DXF: {result?.dxfs?.length || 0}</div>
                    <div className="text-xs text-slate-300">PDF: {result?.pdfs?.length || 0}</div>
                    <div className="text-xs text-slate-300">SKP: {result?.skpFiles?.length || 0}</div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400">Run Generate first.</div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4 md:col-span-2">
              <div className="text-sm font-medium mb-2">Room outputs {compareMode && <span className="text-xs text-indigo-300">(side-by-side)</span>}</div>
              {compareMode ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {liftField(roomList, 'name').map(r => {
                    const a = roomArtifacts(r.name);
                    return (
                      <div key={r.name} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-medium text-white mb-2">{r.name}</div>
                        <img src={a.render} alt={r.name} onError={e=>{ if(e.currentTarget.src!==a.renderPng) e.currentTarget.src=a.renderPng; else e.currentTarget.style.opacity=0.2; }} className="h-40 w-full object-cover rounded-md border border-white/10 bg-black/40" />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a className="rounded-md bg-white/10 px-2 py-1 text-xs" href={a.skp}>SKP</a>
                          <a className="rounded-md bg-white/10 px-2 py-1 text-xs" href={a.northDxf}>DXF</a>
                          <a className="rounded-md bg-white/10 px-2 py-1 text-xs" href={a.northPdf}>PDF</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {liftField(roomList, 'name').map(r => {
                    const a = roomArtifacts(r.name);
                    return (
                      <div key={r.name} className="w-44 rounded-lg border border-white/10 bg-white/5 p-2">
                        <div className="text-xs font-medium text-white mb-1">{r.name}</div>
                        <img src={a.render} alt={r.name} onError={e=>{ if(e.currentTarget.src!==a.renderPng) e.currentTarget.src=a.renderPng; else e.currentTarget.style.opacity=0.2; }} className="h-24 w-full object-cover rounded-md border border-white/10 bg-black/40" />
                        <div className="mt-2 flex flex-wrap gap-1">
                          <a className="rounded-md bg-white/10 px-2 py-1 text-[10px]" href={a.skp}>SKP</a>
                          <a className="rounded-md bg-white/10 px-2 py-1 text-[10px]" href={a.northDxf}>DXF</a>
                          <a className="rounded-md bg-white/10 px-2 py-1 text-[10px]" href={a.northPdf}>PDF</a>
                        </div>
                      </div>
                    );
                  })}
                  {liftField(roomList, 'name').length === 0 && <div className="text-xs text-slate-400">No rooms. Complete Mark/Generate steps.</div>}
                </div>
              )}
              {selectedRoom && (
                <div className="mt-4">
                  <div className="text-xs text-slate-400 mb-1">Downloads for {selectedRoom}</div>
                  <div className="flex gap-2">
                    <a className="rounded-md bg-white/10 px-3 py-2 text-xs" href={`${API_BASE}/api/projects/${pid}/renders/current/download?room=${encodeURIComponent(selectedRoom)}`}>Render</a>
                    <a className="rounded-md bg-white/10 px-3 py-2 text-xs" href={`${API_BASE}/api/projects/${pid}/drawings/elevations/auto/dxf?room=${encodeURIComponent(selectedRoom)}`}>Elevation DXF</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="text-xs text-slate-400 mb-2">Run log</div>
        <div className="h-48 overflow-y-auto space-y-1 text-xs text-slate-300">
          {log.length === 0 && <div className="text-slate-500">No steps run yet.</div>}
          {log.slice(-40).map((entry, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-slate-500">{new Date(entry.t).toLocaleTimeString()}</span>
              <span>{entry.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
