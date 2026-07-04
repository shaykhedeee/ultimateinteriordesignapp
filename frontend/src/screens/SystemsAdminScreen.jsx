import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Shield, Key, Activity, Sliders, RefreshCw, ExternalLink } from 'lucide-react';

const API_LABELS = {
  OPENAI_API_KEY: 'OpenAI Image/LLM API',
  FREEPIK_API_KEY: 'Freepik Flux-Dev API',
  PEXELS_API_KEY: 'Pexels Stock Image API',
  GOOGLE_AI_STUDIO_KEY: 'Google Gemini Imagen/Model API',
  HUGGINGFACE_API_KEY: 'HuggingFace Inference API',
  OPENROUTER_API_KEY: 'OpenRouter Aggregator API',
  IMAGINE_ART_API_KEY: 'Imagine Art Visualizer API'
};

const STATUS_CLASS = {
  Active: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  'Not Loaded': 'border-slate-700 text-slate-500 bg-slate-900'
};

export default function SystemsAdminScreen() {
  const [keys, setKeys] = useState({});
  const [liveImageGen, setLiveImageGen] = useState(false);
  const [auraProvider, setAuraProvider] = useState('openrouter');
  const [auraModel, setAuraModel] = useState('auto');
  const [auraStatus, setAuraStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchKeys();
    fetchAuraStatus();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('getApiBase()/diagnostics/api-keys');
      const data = await res.json();
      setKeys(data.keys || {});
      setLiveImageGen(Boolean(data.liveImageGen));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuraStatus = async () => {
    try {
      const res = await fetch('getApiBase()/admin/aura-status');
      if (res.ok) {
        const data = await res.json();
        setAuraStatus(data);
        if (data?.provider) setAuraProvider(data.provider);
        if (data?.model) setAuraModel(data.model);
      }
    } catch {
      // legacy backend may not expose new endpoint yet
    }
  };

  const saveAuraConfig = async () => {
    try {
      await fetch('getApiBase()/admin/aura-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: auraProvider, model: auraModel })
      });
      showToast('AURA orchestrator config saved');
      fetchAuraStatus();
    } catch (err) {
      showToast('Save failed', 'error');
      console.error(err);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    useAutoClear(message?.text || null, setMessage, 2500);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
            System Credentials &amp; Active API Keys Status
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Admin-only configuration surface. Keys and provider selections are never returned in full from the backend.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-300">
            Live Generation:{' '}
            <strong className={liveImageGen ? 'text-emerald-400' : 'text-amber-400'}>
              {liveImageGen ? 'ON' : 'OFF'}
            </strong>
          </span>
          <button
            onClick={() => {
              setLiveImageGen((value) => !value);
              showToast(`Live generation ${liveImageGen ? 'disabled' : 'enabled'}`);
            }}
            className="text-[11px] border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg transition"
          >
            Toggle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {Object.entries(API_LABELS).map(([envKey, name]) => {
          const info = keys[envKey] || {};
          const status = info.status || 'Not Loaded';
          const value = info.value || '—';
          return (
            <div
              key={envKey}
              className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 text-left"
            >
              <div className="text-[11px] text-slate-200 font-bold truncate">{name}</div>
              <div className="text-[9px] text-slate-500 font-mono mt-1 font-semibold">{envKey}</div>
              <div className="flex justify-between items-center mt-2">
                <span
                  title={value}
                  className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[140px]"
                >
                  {value}
                </span>
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    STATUS_CLASS[status] || STATUS_CLASS['Not Loaded']
                  }`}
                >
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" />
            AURA Orchestrator
          </h3>
          <button
            onClick={fetchAuraStatus}
            className="text-[10px] border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-slate-200 font-bold">{auraStatus?.status || 'checking...'}</span>
            </div>
            <div className="flex justify-between">
              <span>Provider:</span>
              <span className="text-slate-200 font-mono">{auraStatus?.provider || auraProvider || 'openrouter'}</span>
            </div>
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="text-slate-200 font-mono">{auraStatus?.model || auraModel || 'auto'}</span>
            </div>
            <div className="flex justify-between">
              <span>OpenRouter Active:</span>
              <span className={auraStatus?.openRouter ? 'text-emerald-400' : 'text-amber-400'}>
                {auraStatus?.openRouter ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gemini Active:</span>
              <span className={auraStatus?.gemini ? 'text-emerald-400' : 'text-amber-400'}>
                {auraStatus?.gemini ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fallback Available:</span>
              <span className={auraStatus?.fallbackAvailable ? 'text-emerald-400' : 'text-amber-400'}>
                {auraStatus?.fallbackAvailable ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Provider</label>
            <select
              value={auraProvider}
              onChange={(e) => setAuraProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
            >
              <option value="openrouter">OpenRouter</option>
              <option value="gemini">Gemini</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Model</label>
            <input
              value={auraModel}
              onChange={(e) => setAuraModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
              placeholder="auto or model id"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={saveAuraConfig}
              className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#e6c045] text-slate-950 font-bold text-[11px] px-3 py-2 rounded-lg transition"
            >
              <Sliders className="w-4 h-4" /> Save AURA Config
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 border px-4 py-2 rounded-xl text-[11px] font-bold shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-500/40 text-emerald-300 bg-slate-950'
              : 'border-rose-500/40 text-rose-300 bg-slate-950'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
