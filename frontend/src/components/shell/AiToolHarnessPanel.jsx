import React, { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../utils/api.js';

export default function AiToolHarnessPanel({ projectId = 'demo' }) {
  const [status, setStatus] = useState(null);
  const [tools, setTools] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [params, setParams] = useState('{"room":"living"}');
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  const addLog = (entry) => setLogs(prev => [{ ts: Date.now(), ...entry }, ...prev].slice(0, 80));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statusRes, toolsRes] = await Promise.all([
          fetch(apiUrl('ai/harness/status')).then(r => r.json()),
          fetch(apiUrl('ai/harness/tools')).then(r => r.json())
        ]);
        if (!cancelled) {
          setStatus(statusRes);
          setTools(toolsRes);
          const slugs = Object.keys(toolsRes || {});
          setSelectedSlug(prev => prev || slugs[0] || '');
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const options = useMemo(() => {
    if (!tools) return [];
    return Object.entries(tools).map(([slug, tool]) => ({ slug, label: `${slug} -> ${tool.taskType}` }));
  }, [tools]);

  const runOne = async () => {
    setBusy(true);
    setError('');
    addLog({ type: 'start', slug: selectedSlug, provider: provider || 'default' });
    try {
      let body = { toolSlug: selectedSlug, projectId, provider: provider || undefined, model: model || undefined, params: {} };
      try { body = { toolSlug: selectedSlug, projectId, provider: provider || undefined, model: model || undefined, params: params ? JSON.parse(params) : {} }; } catch {}

      const res = await fetch(apiUrl('tools/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      addLog({ type: res.ok ? 'success' : 'error', status: res.status, data });
    } catch (e) {
      setError(e.message);
      addLog({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const runBatch = async () => {
    setBusy(true);
    setError('');
    addLog({ type: 'start', batch: true });
    try {
      let runs = { runs: [] };
      try { runs = params ? JSON.parse(params) : { runs: [] }; } catch {}
      const safeRuns = Array.isArray(runs.runs) ? runs.runs : [];
      const bounded = safeRuns.slice(0, 8).map(run => ({
        toolSlug: run.toolSlug || selectedSlug,
        projectId: run.projectId || projectId,
        params: run.params || {},
        provider: run.provider || provider || undefined,
        model: run.model || model || undefined
      }));

      const res = await fetch(apiUrl('ai/harness/batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runs: bounded })
      });
      const data = await res.json();
      addLog({ type: res.ok ? 'success' : 'error', status: res.status, data });
    } catch (e) {
      setError(e.message);
      addLog({ type: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  };

  const providerSummary = status?.providerSummary || null;

  return (
    <div className="space-y-3 border border-slate-800 bg-slate-950/60 p-3 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">AI Tool Harness</div>
          <div className="text-[9px] text-slate-500 font-mono">Real provider-routed execution</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {providerSummary?.activeLabel || 'ready'}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {providerSummary?.liveImageGenReady ? 'LIVE' : 'DRAFT'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="md:col-span-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tool / task type</label>
          <select
            value={selectedSlug}
            onChange={e => setSelectedSlug(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
          >
            {options.map(opt => (
              <option key={opt.slug} value={opt.slug}>{opt.slug}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Provider override</label>
          <input
            value={provider}
            onChange={e => setProvider(e.target.value)}
            placeholder="auto"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
          />
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Model override</label>
          <input
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="auto"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
          />
        </div>
      </div>

      <div>
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Params JSON / batch input</label>
        <textarea
          value={params}
          onChange={e => setParams(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-mono text-slate-200"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={runOne}
          disabled={busy}
          className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-lg disabled:opacity-60"
        >
          {busy ? 'Running…' : 'Run Tool'}
        </button>
        <button
          onClick={runBatch}
          disabled={busy}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold uppercase tracking-wider text-[10px] rounded-lg disabled:opacity-60"
        >
          Run Batch
        </button>
        <span className="text-[9px] text-slate-500 font-mono">Harness status: {status?.activeLabel || 'loading'} • {status?.supportedTaskTypes?.length || 0} tasks</span>
      </div>

      {Boolean(error) && <div className="text-[10px] text-red-400 font-mono">{error}</div>}

      <div className="space-y-1">
        {logs.map((log, idx) => (
          <div key={log.ts + '-' + idx} className="text-[9px] font-mono text-slate-400 bg-slate-900/40 border border-slate-800 rounded-lg px-2 py-1">
            <span className="text-slate-500">[{new Date(log.ts).toISOString().slice(11, 23)}]</span>{' '}
            <span className="text-[#D4AF37]">{log.type}</span>{' '}
            {log.slug ? <span>{log.slug}</span> : null}
            <span className="text-slate-500 truncate block">{JSON.stringify(log).slice(0, 220)}</span>
          </div>
        ))}
        {!logs.length && <div className="text-[9px] text-slate-600 font-mono">No runs yet.</div>}
      </div>

      <RagAssistantPanel projectId={projectId} />
    </div>
  );
}

function RagAssistantPanel({ projectId = 'demo' }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ingest = async () => {
    setBusy(true); setError(''); setResult(null);
    try {
      const res = await fetch(apiUrl('rag/ingest'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, title, mimeType: 'text/plain', text })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const runQuery = async () => {
    setBusy(true); setError(''); setResult(null);
    try {
      const res = await fetch(apiUrl('rag/query'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, query, collection: 'project-knowledge', maxResults: 6 })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-2 border border-slate-800 bg-slate-950/60 p-3 rounded-xl">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">RAG Memory</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Document title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200" placeholder="Client brief" />
        </div>
        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Query</label>
          <input value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200" placeholder="Budget constraints for master bedroom" />
        </div>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-mono text-slate-200" placeholder="Paste text to ingest into project memory..." />
      <div className="flex items-center gap-2">
        <button onClick={ingest} disabled={busy} className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-black uppercase tracking-wider text-[10px] rounded-lg disabled:opacity-60">Ingest</button>
        <button onClick={runQuery} disabled={busy} className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold uppercase tracking-wider text-[10px] rounded-lg disabled:opacity-60">Query</button>
        <span className="text-[9px] text-slate-500 font-mono">project: {projectId}</span>
      </div>
      {Boolean(error) && <div className="text-[10px] text-red-400 font-mono">{error}</div>}
      {result && (
        <div className="text-[10px] font-mono text-slate-400 bg-slate-900/40 border border-slate-800 rounded-lg px-2 py-1.5 whitespace-pre wrap">{JSON.stringify(result, null, 2).slice(0, 1200)}</div>
      )}
    </div>
  );
}
