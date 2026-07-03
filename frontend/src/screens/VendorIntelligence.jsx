import { apiUrl, getApiBase } from '../utils/api.js';
import React, { useState, useEffect } from 'react';
import { Store, Package, IndianRupee, RefreshCw, Truck, ShieldCheck, ExternalLink, Search } from 'lucide-react';

export default function VendorIntelligence({ projectId }) {
  const [activeTab, setActiveTab] = useState('laminates');
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [query, setQuery] = useState('');

  const VENDOR_CATEGORIES = [
    { id: 'laminates', label: 'Laminates' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'worktops', label: 'Worktops' },
    { id: 'lighting', label: 'Lighting' }
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`getApiBase()/projects/${projectId || 'demo'}/vendors/${activeTab}`);
        if (!res.ok) throw new Error('vendor_load_failed');
        const data = await res.json();
        setVendors(Array.isArray(data) ? data : []);
      } catch (e) {
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId, activeTab]);

  useEffect(() => {
    const loadHardware = async () => {
      try {
        const res = await fetch(`getApiBase()/catalog/hardware?query=${encodeURIComponent(query || activeTab)}`);
        if (!res.ok) throw new Error('hardware_load_failed');
        const data = await res.json();
        setHardware(Array.isArray(data) ? data : []);
      } catch (e) {
        setHardware([]);
      }
    };
    loadHardware();
  }, [query, activeTab, projectId]);

  const refreshVendorPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`getApiBase()/projects/${projectId || 'demo'}/vendors/${activeTab}/refresh`, {
        method: 'POST'
      });
      const data = await res.json();
      setVendors(Array.isArray(data.vendors) ? data.vendors : vendors);
    } catch (e) {
      // ignore refresh failure silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-5 bg-slate-950 text-slate-100 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#C9A84C] flex items-center gap-1.5">
            <Store className="w-4 h-4 text-[#C9A84C]" /> Vendor Intelligence
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Supplier scoring, pricing freshness, and procurement routing.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU / brand / vendor"
              className="bg-slate-900 border border-slate-850 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-[#C9A84C]"
            />
          </div>
          <button
            onClick={refreshVendorPrices}
            className="bg-slate-900 border border-slate-850 hover:border-[#C9A84C]/40 text-slate-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {VENDOR_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition ${
              activeTab === cat.id ? 'bg-[#D4AF37]/10 border-[#D9C77B]/40 text-[#C9A84C]' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {vendors.length === 0 && !loading && (
          <div className="md:col-span-3 bg-slate-900/40 border border-slate-850 rounded-2xl p-6 text-center text-slate-500 text-xs">
            No vendor intelligence loaded for this category. Check catalog routes or backend seeding.
          </div>
        )}
        {vendors.map((vendor, idx) => (
          <div key={idx} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-[10px] font-black text-slate-300">
                  {(vendor.brand || vendor.name || 'V').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{vendor.name || vendor.brand || 'Vendor'}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{vendor.sku || vendor.code || '—'}</div>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                {vendor.leadTime ? `${vendor.leadTime}d` : 'In Stock'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-2.5">
                <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Price</div>
                <div className="text-slate-200 font-mono font-black mt-0.5">
                  {vendor.price != null ? `₹${Number(vendor.price).toLocaleString()}` : '—'}
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-2.5">
                <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">MOQ</div>
                <div className="text-slate-200 font-mono font-black mt-0.5">{vendor.moq || vendor.minOrder || '1'}</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-2.5">
                <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Rating</div>
                <div className="text-slate-200 font-mono font-black mt-0.5">{vendor.rating ? `${vendor.rating}/5` : '—'}</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-2.5">
                <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Fulfillment</div>
                <div className="text-slate-200 font-mono font-black mt-0.5">{vendor.fulfillment || 'Hub'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified
              </span>
              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-500" /> Logistics Ready
              </span>
            </div>

            <VendorApprovalFlow vendor={vendor} />

          </div>
        ))}
      </div>
    </div>
  );
}
