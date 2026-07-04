import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  ChevronDown,
  Globe,
  Server,
  KeyRound,
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  GaugeCircle,
  IndianRupee
} from 'lucide-react';

const API_BASE = getApiBase();

const STATUS_LABEL = {
  configured: 'Configured',
  not_configured: 'Not Configured'
};
const STATUS_STYLE = {
  configured: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
  not_configured: 'border-slate-700 text-slate-400 bg-slate-900'
};

function showToast(setToast, msg, type = 'success') {
  setToast({ msg, type });
  useAutoClear(toast?.msg || null, setToast, 2400);
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [envInfo, setEnvInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [whitelabel, setWhitelabel] = useState(null);
  const [brandSaving, setBrandSaving] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [estimateInput, setEstimateInput] = useState({ laminateSqft: 0, hardwareBaseCost: 0, laborSqft: 0, transportBaseCost: 0, client: true });

  // Editable local state for globals
  const [globals, setGlobals] = useState({
    defaultProvider: '',
    defaultModel: '',
    freeProvidersFirst: true,
    maxCostPerImage: 0,
    spendMode: 'smart-cost'
  });

  const loadProviders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/providers`).then(r => r.json());
      if (res?.success) setSettings(res);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const loadEnv = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/diagnostics/api-keys`).then(r => r.json()).catch(() => ({}));
      setEnvInfo(res || {});
    } catch (e) {
      setEnvInfo({});
    }
  };

  const loadWhitelabel = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/whitelabel`);
      const data = await res.json();
      setWhitelabel(data);
    } catch (e) {
      console.error('Failed to load whitelabel:', e);
    }
  };

  const loadPricing = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/pricing`).then(r => r.json());
      if (res?.success) setPricing(res.settings);
    } catch (e) {
      console.error('Failed to load pricing:', e);
    }
  };

  const savePricing = async () => {
    if (!pricing) return;
    setPricingSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/pricing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pricing) });
      const data = await res.json();
      if (data?.success) setPricing(data.settings);
    } catch (e) {
      console.error('Failed to save pricing:', e);
    } finally {
      setPricingSaving(false);
    }
  };

  const runEstimate = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/demo/estimate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(estimateInput) });
      const data = await res.json();
      if (data?.success) setEstimate(data);
    } catch (e) {
      console.error('Estimate failed:', e);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadProviders(), loadEnv(), loadWhitelabel(), loadPricing()]).finally(() => setLoading(false));
  }, []);

  const saveProvider = async (providerKey, patch) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerKey, patch })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || `Failed to update ${providerKey}`);
      setSettings(prev => ({
        ...prev,
        providers: { ...prev.providers, [providerKey]: { ...prev.providers[providerKey], ...data.provider } }
      }));
      showToast(setToast, `${providerKey} saved`);
    } catch (err) {
      setError(err.message);
      showToast(setToast, err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = async (providerKey, nextEnabled) => {
    await saveProvider(providerKey, { enabled: nextEnabled });
  };

  const saveGlobals = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings/defaults`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globals)
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save defaults');
      setSettings(prev => ({
        ...prev,
        defaultProvider: data.settings.defaultProvider,
        defaultModel: data.settings.defaultModel,
        freeProvidersFirst: data.settings.freeProvidersFirst,
        maxCostPerImage: data.settings.maxCostPerImage
      }));
      showToast(setToast, 'Defaults saved');
    } catch (err) {
      setError(err.message);
      showToast(setToast, err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const providers = settings?.providers || {};
  const sortedProviders = Object.entries(providers).sort((a, b) => {
    const ao = a[1]?.fallbackOrder ?? 99;
    const bo = b[1]?.fallbackOrder ?? 99;
    if (ao !== bo) return ao - bo;
    return a[0].localeCompare(b[0]);
  });

  const maxCost = Number(globals.maxCostPerImage) || 0;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#020617] text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#C9A84C] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#C9A84C]" aria-hidden="true" />
              Provider &amp; Execution Settings
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Manage image generation providers, fallback order, model IDs, endpoints, spend guardrails, and local tool defaults. Keys remain masked and never leave this workstation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="text-[11px] border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-2 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              aria-label="Refresh settings from backend"
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Refresh
            </button>
            <button
              onClick={saveGlobals}
              disabled={saving || !settings}
              className="text-[11px] bg-[#D4AF37] hover:bg-[#e6c045] disabled:opacity-60 text-slate-950 px-3 py-2 rounded-xl transition font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Save default settings"
            >
              <Save className="w-3.5 h-3.5 inline mr-1.5" />
              Save Defaults
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="border border-rose-500/40 bg-rose-950/50 text-rose-300 rounded-xl px-4 py-3 text-xs font-semibold">
            {error}
          </div>
        )}

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 border px-4 py-2 rounded-xl text-[11px] font-bold shadow-lg bg-slate-950"
          >
            {toast.msg}
          </div>
        )}

        {loading && !settings && (
          <div className="border border-slate-800 bg-slate-950 rounded-xl p-6 text-xs text-slate-400">
            Loading provider configuration...
          </div>
        )}

        {settings && (
          <>
            {/* Global Execution Defaults */}
            <section aria-labelledby="globals-heading" className="glass-card border border-slate-850 rounded-3xl p-6">
              <h3 id="globals-heading" className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
                <GaugeCircle className="w-4 h-4 text-[#C9A84C]" aria-hidden="true" />
                Global Execution Defaults
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="setting-defaultProvider" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Default Provider</label>
                  <select
                    id="setting-defaultProvider"
                    value={globals.defaultProvider}
                    onChange={(e) => setGlobals(prev => ({ ...prev, defaultProvider: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
                    aria-label="Default provider"
                  >
                    {Object.keys(providers).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="setting-defaultModel" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Default Model</label>
                  <input
                    id="setting-defaultModel"
                    value={globals.defaultModel}
                    onChange={(e) => setGlobals(prev => ({ ...prev, defaultModel: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
                    aria-label="Default model ID"
                  />
                </div>
                <div>
                  <label htmlFor="setting-maxCost" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Max Cost Per Image</label>
                  <input
                    id="setting-maxCost"
                    type="number"
                    min={0}
                    value={globals.maxCostPerImage}
                    onChange={(e) => setGlobals(prev => ({ ...prev, maxCostPerImage: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
                    aria-label="Maximum cost per generated image"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Spend Mode</span>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-300 h-[34px] flex items-center">
                    {globals.spendMode}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">Environment-controlled spend strategy</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={globals.freeProvidersFirst}
                    onChange={(e) => setGlobals(prev => ({ ...prev, freeProvidersFirst: e.target.checked }))}
                    className="accent-[#D4AF37]"
                    aria-label="Prefer free providers before paid options"
                  />
                  Free providers first
                </label>
                <span className="text-slate-700">|</span>
                <span className="text-[10px] text-slate-500">Changes require “Save Defaults”</span>
              </div>
            </section>

            {/* Cost Guardrails */}
            <section aria-labelledby="guardrails-heading" className="glass-card border border-slate-850 rounded-3xl p-6">
              <h3 id="guardrails-heading" className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
                <Shield className="w-4 h-4 text-[#C9A84C]" aria-hidden="true" />
                Cost Guardrails
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Live Generation</div>
                  <div className="text-xs text-slate-200 font-semibold mt-1">{envInfo?.liveImageGen ? 'ON' : 'OFF'}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Env: LIVE_IMAGE_GEN</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Active Provider</div>
                  <div className="text-xs text-slate-200 font-semibold mt-1">{envInfo?.imageProvider || 'unknown'}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Env: IMAGE_PROVIDER</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Default Status</div>
                  <div className="text-xs text-slate-200 font-semibold mt-1">{globals.defaultProvider || '—'}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Persisted default provider fallback</div>
                </div>
              </div>
            </section>

            {/* Providers */}
            <section aria-labelledby="providers-heading" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 id="providers-heading" className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#C9A84C]" aria-hidden="true" />
                  Providers
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">Order shows fallback priority</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedProviders.map(([key, cfg]) => {
                  const isSavingThis = saving;
                  const configured = cfg?.configured ?? false;
                  const liveStatus = cfg?.liveStatus || 'not_configured';
                  const localEnabled = cfg?.enabled !== false;

                  return (
                    <div key={key} className="glass-card border border-slate-850 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{key}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate max-w-[260px]">{cfg?.endpoint || '—'}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${STATUS_STYLE[liveStatus] || STATUS_STYLE.not_configured}`}>
                            {STATUS_LABEL[liveStatus] || liveStatus}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor={`settings-${key}-model`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Model ID</label>
                          <input
                            id={`settings-${key}-model`}
                            value={cfg?.model || ''}
                            onChange={(e) => setSettings(prev => prev && { ...prev, providers: { ...prev.providers, [key]: { ...prev.providers[key], model: e.target.value } } })}
                            onBlur={(e) => saveProvider(key, { model: e.target.value })}
                            aria-label={`Model ID for ${key}`}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                        <div>
                          <label htmlFor={`settings-${key}-endpoint`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Endpoint</label>
                          <input
                            id={`settings-${key}-endpoint`}
                            value={cfg?.endpoint || ''}
                            onChange={(e) => setSettings(prev => prev && { ...prev, providers: { ...prev.providers, [key]: { ...prev.providers[key], endpoint: e.target.value } } })}
                            onBlur={(e) => saveProvider(key, { endpoint: e.target.value })}
                            aria-label={`Endpoint for ${key}`}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor={`settings-${key}-fallback`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fallback Order</label>
                          <input
                            id={`settings-${key}-fallback`}
                            type="number"
                            min={1}
                            value={cfg?.fallbackOrder ?? ''}
                            onChange={(e) => setSettings(prev => prev && { ...prev, providers: { ...prev.providers, [key]: { ...prev.providers[key], fallbackOrder: Number(e.target.value) } } })}
                            onBlur={(e) => saveProvider(key, { fallbackOrder: Number(e.target.value) || 99 })}
                            aria-label={`Fallback order for ${key}`}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Enabled</span>
                          <button
                            onClick={() => toggleProvider(key, !localEnabled)}
                            aria-pressed={localEnabled}
                            aria-label={`${localEnabled ? 'Disable' : 'Enable'} ${key}`}
                            className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${localEnabled ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                          >
                            {localEnabled ? 'Active' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Capabilities</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(cfg?.capabilities || []).map(cap => (
                            <span key={cap} className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg font-mono">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="text-[10px] font-semibold">API key excluded from UI</span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono">local-only</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Whitelabel / Professional Branding */}
            <section aria-labelledby="whitelabel-heading" className="glass-card border border-slate-850 rounded-3xl p-6">
              <h3 id="whitelabel-heading" className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
                <Globe className="w-4 h-4 text-[#C9A84C]" aria-hidden="true" />
                Whitelabel & Branding
              </h3>
              <BrandEditor />
            </section>

            {/* Pricing Settings */}
            <section aria-labelledby="pricing-heading" className="glass-card border border-slate-850 rounded-3xl p-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                <h3 id="pricing-heading" className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-[#C9A84C]" aria-hidden="true" />
                  Pricing Settings
                </h3>
                <button onClick={savePricing} disabled={pricingSaving || !pricing} className="text-[10px] font-black uppercase tracking-wider bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/20 px-2 py-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]">
                  {pricingSaving ? 'Saving...' : 'Save Pricing'}
                </button>
              </div>
              {pricing && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Laminate price per sqft</label>
                    <input type="number" value={pricing.laminate_price_per_sqft} onChange={e => setPricing({...pricing, laminate_price_per_sqft: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hardware markup %</label>
                    <input type="number" value={pricing.hardware_markup_percent} onChange={e => setPricing({...pricing, hardware_markup_percent: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Labor per sqft</label>
                    <input type="number" value={pricing.labor_per_sqft} onChange={e => setPricing({...pricing, labor_per_sqft: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Transport %</label>
                    <input type="number" value={pricing.transport_percent} onChange={e => setPricing({...pricing, transport_percent: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Profit %</label>
                    <input type="number" value={pricing.profit_percent} onChange={e => setPricing({...pricing, profit_percent: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Client discount %</label>
                    <input type="number" value={pricing.client_discount_percent} onChange={e => setPricing({...pricing, client_discount_percent: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Client tax %</label>
                    <input type="number" value={pricing.client_tax_percent} onChange={e => setPricing({...pricing, client_tax_percent: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Showroom multiplier</label>
                    <input type="number" step="0.01" value={pricing.showroom_multiplier} onChange={e => setPricing({...pricing, showroom_multiplier: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Economy max ₹/sqft</label>
                    <input type="number" value={pricing.price_band_economy_max} onChange={e => setPricing({...pricing, price_band_economy_max: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Standard max ₹/sqft</label>
                    <input type="number" value={pricing.price_band_standard_max} onChange={e => setPricing({...pricing, price_band_standard_max: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Premium max ₹/sqft</label>
                    <input type="number" value={pricing.price_band_premium_max} onChange={e => setPricing({...pricing, price_band_premium_max: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-[#D4AF37]" />
                  </div>
                </div>
              )}
            </section>

            {/* Tool Defaults Summary */}
            <section aria-labelledby="tooldefaults-heading" className="glass-card border border-slate-850 rounded-3xl p-6">
              <h3 id="tooldefaults-heading" className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
                <Activity className="w-4 h-4 text-[#C9A84C]" aria-hidden="true" />
                Tool Defaults
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'Default Provider', value: globals.defaultProvider || '—' },
                  { label: 'Default Model', value: globals.defaultModel || '—' },
                  { label: 'Free Providers First', value: globals.freeProvidersFirst ? 'Yes' : 'No' },
                  { label: 'Max Cost Per Image', value: `$${Number(maxCost).toFixed(2)}` },
                  { label: 'Spend Mode', value: globals.spendMode || '—' },
                  { label: 'Providers Count', value: Object.keys(providers).length }
                ].map(row => (
                  <div key={row.label} className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{row.label}</div>
                    <div className="text-sm text-slate-200 font-semibold mt-1 break-all">{row.value}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <style>{`
        .glass-card {
          background: linear-gradient(180deg, rgba(30,30,36,0.85) 0%, rgba(2,6,23,0.7) 100%);
          backdrop-filter: blur(10px) saturate(120%);
        }
      `}</style>
    </div>
  );
}
