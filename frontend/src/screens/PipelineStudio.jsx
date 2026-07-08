import { useState, useCallback } from 'react';

const API_BASE = 'http://127.0.0.1:5055';

const STEPS = [
  { id: 'analyze', label: 'Analyze', desc: 'Read floor plan inputs and detect rooms.' },
  { id: 'enhance', label: 'Enhance', desc: 'Refine room sizes, openings, furniture.' },
  { id: 'edit', label: 'Edit & Refine', desc: 'Add modules, adjust dimensions.' },
  { id: 'generate', label: 'Generate 3D & Docs', desc: 'Build renders, SKP, DXF, PDF.' },
  { id: 'package', label: 'Package', desc: 'Bundle client deliverables for handoff.' },
];

const STEP_ORDER = STEPS.map(s => s.id);

const INITIAL_ROOMS = [
  { name:'Living Dining', w:5600, h:4200 },
  { name:'Master Bedroom', w:4200, h:3600 },
  { name:'Kitchen', w:3600, h:3000 },
];

function liftField(items, field){
  if (!Array.isArray(items)) return [];
  return items.map((it, idx) => ({ ...it, _humanLabel: it.name || `${field} ${idx+1}` }));
}

export default function PipelineStudio({ projectId: projectIdProp }){
  const pid = projectIdProp || 'proj-nambia-25bhk';
  const [activeStep, setActiveStep] = useState(STEP_ORDER[0]);
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState([]);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [result, setResult] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const pushLog = useCallback((msg) => setLog(prev => [...prev.slice(-80), { t: Date.now(), msg }]), []);

  async function runStep(step){
    try {
      setStatus('running');
      pushLog(`Starting ${step}...`);
      const pid = pid || 'proj-nambia-25bhk';
      const url = `${API_BASE}/api/projects/${pid}/${step === 'generate' ? 'pipeline/run' : step === 'package' ? 'delivery-package' : 'plan/measure'}`;
      const opts = { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ projectName:'Nambia', rooms: rooms.map(r => ({ ...r, openings:[], cabinets:[] })) }) };

      const res = await fetch(url, opts);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);

      pushLog(`${step} completed.`);
      if (data?.images?.length || data?.dxfs?.length || data?.pdfs?.length || data?.skpFiles?.length) {
        setResult(data);
      }
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
      const pid = pid || 'proj-nambia-25bhk';
      const url = `${API_BASE}/api/projects/${pid}/delivery-package`;
      const opts = { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ projectName:'Nambia', rooms: rooms.map(r => ({ ...r, openings:[], cabinets:[] })) }) };
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `ULTIDA_${pid}_package.zip`;
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline Studio</h1>
          <p className="text-slate-400 mt-1">Sequential generation: analyze → enhance → edit → 3D → package</p>
        </div>
        <button onClick={downloadPackage} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          Download Full Package
        </button>
      </div>

      <div className="mt-8 grid grid-cols-5 gap-3">
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
          {activeStep !== 'package' && (
            <button onClick={() => runStep(activeStep)} disabled={status==='running'} className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              {status==='running' ? 'Running...' : 'Run Step'}
            </button>
          )}
        </div>

        {activeStep === 'generate' && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-medium mb-2">Per-room generation</div>
            <div className="flex flex-wrap gap-2">
              {liftField(result?.rooms ? Object.keys(result.rooms).map(k=>({name:k})) : rooms, 'name').map(r => (
                <button key={r.name} onClick={() => setSelectedRoom(r.name)} className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/10">
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
              <div className="text-sm font-medium mb-2">Room outputs</div>
              <div className="flex flex-wrap gap-2">
                {(result?.rooms ? Object.keys(result.rooms).map(k=>({name:k})) : []).map(r => (
                  <button key={r.name} onClick={() => setSelectedRoom(r.name)} className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/10">
                    {r.name}
                  </button>
                ))}
              </div>
              {selectedRoom && (
                <div className="mt-4">
                  <div className="text-xs text-slate-400 mb-1">Downloads</div>
                  <div className="flex gap-2">
                    <a className="rounded-md bg-white/10 px-3 py-2 text-xs" href={`${API_BASE}/api/projects/${pid || 'proj-nambia-25bhk'}/renders/current/download?room=${encodeURIComponent(selectedRoom)}`}>Render</a>
                    <a className="rounded-md bg-white/10 px-3 py-2 text-xs" href={`${API_BASE}/api/projects/${pid || 'proj-nambia-25bhk'}/drawings/elevations/auto/dxf?room=${encodeURIComponent(selectedRoom)}`}>Elevation DXF</a>
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
