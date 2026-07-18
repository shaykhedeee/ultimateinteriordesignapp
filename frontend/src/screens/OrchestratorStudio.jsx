import React, { useState, useEffect } from 'react';
import { apiUrl } from '../utils/api.js';
import {
  Play, Square, RefreshCcw, CheckCircle2, AlertCircle, Clock,
  Loader2, ArrowRight, Image as ImageIcon, Sparkles, ShieldCheck
} from 'lucide-react';

const BUDGET_TIERS = ['economy', 'standard', 'premium', 'luxury'];
const ROOM_TYPES = ['living', 'bedroom', 'kitchen', 'dining', 'pooja', 'study', 'bathroom'];
const STYLE_PRESETS = ['modern', 'contemporary', 'minimal', 'scandinavian', 'japandi', 'luxury', 'traditional', 'industrial'];

export default function OrchestratorStudio({ projectId }) {
  const [room, setRoom] = useState('living');
  const [style, setStyle] = useState('modern');
  const [budgetTier, setBudgetTier] = useState('standard');
  const [customPrompt, setCustomPrompt] = useState('');
  const [maxRooms, setMaxRooms] = useState(3);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [abortController, setAbortController] = useState(null);

  const appendLog = (level, message) => {
    setLogs((prev) => [...prev, { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, level, message, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
  };

  const runOrchestrator = async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setError(null);
    setLogs([]);
    const controller = new AbortController();
    setAbortController(controller);

    appendLog('info', 'Starting multi-agent interiors orchestrator...');
    try {
      const body = {
        projectId: projectId || 'demo',
        userStyle: style,
        userCustomPrompt: customPrompt || undefined,
        rooms: [room],
        maxRooms,
        provider: provider || undefined,
        model: model || undefined
      };
      appendLog('info', `Posting to /api/ai/interiors/orchestrate with rooms=[${body.rooms.join(',')}] maxRooms=${maxRooms}`);

      const res = await fetch(apiUrl('ai/interiors/orchestrate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : { raw: await res.text() };

      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      appendLog('success', 'Orchestrator pipeline completed.');
      setResult(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        appendLog('warning', 'Orchestration aborted by user.');
      } else {
        const msg = err.message || 'Unknown error';
        setError(msg);
        appendLog('error', `Pipeline failed: ${msg}`);
      }
    } finally {
      setRunning(false);
      setAbortController(null);
    }
  };

  const stop = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  useEffect(() => {
    return () => {
      if (abortController) abortController.abort();
    };
  }, [abortController]);

  const renderStepIcon = (step) => {
    const status = step?.status || 'pending';
    if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (status === 'running') return <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
    if (status === 'failed') return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    return <Clock className="w-3.5 h-3.5 text-slate-500" />;
  };

  const steps = result?.steps || [];

  return (
    <div className="h-full w-full bg-[#020617] text-slate-100 flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800/80 bg-slate-900/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-100">Orchestrator Studio</h3>
            <p className="text-[10px] text-slate-400">Multi-agent render pipeline: plan → extract → RAG → prompt → render → QA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runOrchestrator}
            disabled={running}
            className="px-3 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#AA8C2C] disabled:opacity-50 text-[10px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 transition"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run Pipeline
          </button>
          {running && (
            <button
              type="button"
              onClick={stop}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/60 text-[10px] font-black uppercase tracking-wider text-red-300 flex items-center gap-1.5 transition"
            >
              <Square className="w-3.5 h-3.5" />
              Abort
            </button>
          )}
          <button
            type="button"
            onClick={() => { setResult(null); setError(null); setLogs([]); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-[#D4AF37]/60 text-[10px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5 transition"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="shrink-0 border-b border-slate-800/80 bg-slate-900/30 px-4 py-2.5">
        <div className="flex items-center gap-2 overflow-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">AURA quick actions</span>
          {[
            { id: 'aura:auto', label: 'Auto-optimize project' },
            { id: 'aura:materials', label: 'Optimize materials' },
            { id: 'aura:cutlist', label: 'Generate cutlist' },
            { id: 'aura:elevation', label: 'Export elevations' },
            { id: 'aura:budget', label: 'Optimize budget' }
          ].map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              onClick={async () => {
                setRunning(true);
                setResult(null);
                setError(null);
                setLogs((prev) => [...prev, { id: `log-${Date.now()}`, level: 'info', message: `AURA action: ${cmd.label}` , ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
                try {
                  const projectId = await (await import('../stores/appStore.js')).useAppStore.getState().ensureProject();
                  const res = await fetch(apiUrl('ai/actions/execute'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actionId: cmd.id, params: { room, style, budgetTier }, context: { projectId, organizationId: 'global' } })
                  });
                  const data = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));
                  setLogs((prev) => [...prev, { id: `log-${Date.now()}`, level: data.success ? 'success' : 'error', message: `${cmd.label}: ${data.success ? (data.message || 'Executed') : (data.error || 'Failed')}` , ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
                } catch (err) {
                  setLogs((prev) => [...prev, { id: `log-${Date.now()}`, level: 'error', message: `${cmd.label} failed: ${err.message}` , ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
                } finally {
                  setRunning(false);
                }
              }}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-[#D4AF37]/60 text-[10px] font-black uppercase tracking-wider text-slate-200 transition"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Room</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
              {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
              {STYLE_PRESETS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Budget tier</label>
            <select value={budgetTier} onChange={(e) => setBudgetTier(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]">
              {BUDGET_TIERS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Max rooms</label>
            <input type="number" min={1} max={8} value={maxRooms} onChange={(e) => setMaxRooms(parseInt(e.target.value || '1', 10))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="xl:col-span-2 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Custom instruction</label>
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Optional: add specific requirements, furniture, lighting, or material requests." className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37] resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Provider override (optional)</label>
            <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="provider" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="model" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
            <p className="text-[10px] text-slate-500">Leave blank to use the default provider routing.</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-500/40 bg-red-950/30 px-3 py-2.5 text-[11px] font-bold text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-1">Pipeline error</div>
              <div className="text-[11px] text-red-200/90">{error}</div>
            </div>
          </div>
        )}

        {/* Live logs */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Run log</span>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-2.5 space-y-1 max-h-52 overflow-auto">
            {logs.length === 0 && <div className="text-[10px] text-slate-500">No runs yet. Press Run Pipeline.</div>}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-[11px]">
                <span className="text-[9px] font-mono text-slate-500 mt-px">{log.ts}</span>
                {log.level === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-px" />}
                {log.level === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-px" />}
                {log.level === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-px" />}
                {log.level === 'info' && <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" />}
                <span className={`font-mono ${log.level === 'error' ? 'text-red-300' : log.level === 'success' ? 'text-emerald-300' : 'text-slate-300'}`}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps / plan */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent plan & steps</span>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
            {steps.length === 0 && !result && <div className="text-[10px] text-slate-500">Run a pipeline to see the agent plan and steps.</div>}
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={step.id || idx} className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2">
                  <div className="mt-0.5 shrink-0">{renderStepIcon(step)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">{step.agent || `Step ${idx + 1}`}</span>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">{step.status || 'pending'}</span>
                    </div>
                    {step.input && <div className="text-[10px] text-slate-400 mt-1">In: {typeof step.input === 'string' ? step.input : JSON.stringify(step.input)}</div>}
                    {step.output && <div className="text-[10px] text-slate-300 mt-1">Out: {typeof step.output === 'string' ? step.output : JSON.stringify(step.output)}</div>}
                    {step.error && <div className="text-[10px] text-red-300 mt-1">Error: {step.error}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Render result */}
        {result && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Render result</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              {result.variants && result.variants.length > 0 ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                  {result.variants.map((variant, idx) => (
                    <div key={variant.id || idx} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                      {variant.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={variant.url} alt={`Variant ${idx + 1}`} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center text-[10px] text-slate-500">No preview available</div>
                      )}
                      <div className="px-2 py-1.5 text-[10px] text-slate-300 font-mono">Variant {idx + 1}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="text-[10px] text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-2.5 overflow-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
