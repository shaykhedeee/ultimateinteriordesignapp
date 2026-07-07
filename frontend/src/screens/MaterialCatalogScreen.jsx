import React, { useState, useEffect, useMemo } from 'react';
import { 
  Palette, BookOpen, Layers, Save, CheckCircle, 
  ArrowRight, Download, Plus, ShoppingBag, Eye, 
  Search, Tag, IndianRupee, Calculator, Star, Filter,
  ChevronDown, X, Info, Trash2, AlertTriangle
} from 'lucide-react';

const BROCHURES = [
  { brand: 'CenturyPly', title: 'CenturyLaminates 2026 Collection', pages: 84, color: '#7c3aed' },
  { brand: 'Royale Touche', title: 'Premium Luxury Finishes Vol. IV', pages: 120, color: '#D4AF37' },
  { brand: 'Blum', title: 'Kitchen Fittings & Motion Systems 2026', pages: 210, color: '#2563eb' },
  { brand: 'Hettich', title: 'InnoTech Atira Organizers Catalogue', pages: 95, color: '#059669' },
  { brand: 'Greenlam', title: 'Greenlam Stones & Decorative Surfaces', pages: 160, color: '#dc2626' },
  { brand: 'Merino', title: 'Merino Acrylic Premium Shutters', pages: 72, color: '#0891b2' },
];

const TYPE_LABELS = {
  carcass_interior: { label: 'Carcass', color: 'text-slate-400', bg: 'bg-slate-800/50' },
  shutter_facade: { label: 'Shutter', color: 'text-blue-400', bg: 'bg-blue-950/30' },
  premium_highlight: { label: 'Premium', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
};

export default function MaterialCatalogScreen({ projectId, onComplete }) {
  const [notes, setNotes] = useState('');
  const [selectedLaminates, setSelectedLaminates] = useState([]);
  const [selectedHardware, setSelectedHardware] = useState([]);
  
  // Catalog State from Backend
  const [laminateCatalog, setLaminateCatalog] = useState([]);
  const [hardwareCatalog, setHardwareCatalog] = useState([]);
  const [stalePricing, setStalePricing] = useState(false);

  // Filter State
  const [laminateSearch, setLaminateSearch] = useState('');
  const [laminateTypeFilter, setLaminateTypeFilter] = useState('all');
  const [hwSearch, setHwSearch] = useState('');
  const [showCostEstimator, setShowCostEstimator] = useState(false);
  const [estimatorSqft, setEstimatorSqft] = useState(120);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // CRUD Form States
  const [showAddLaminateForm, setShowAddLaminateForm] = useState(false);
  const [newLaminate, setNewLaminate] = useState({ name: '', brand: 'CenturyPly', finish: 'Suede Matte', color: '#f3f4f6', pricePerSqft: '60', code: 'SF-NEW', subcategory: 'shutter_facade' });
  
  const [showAddHwForm, setShowAddHwForm] = useState(false);
  const [newHw, setNewHw] = useState({ name: '', brand: 'Hettich', category: 'hinges', desc: 'Soft-close fitting', price: '450', unit: 'per piece', code: 'HW-NEW' });

  // Quotation Builder States
  const [showQuotationBuilder, setShowQuotationBuilder] = useState(true);
  const [quoteItems, setQuoteItems] = useState([]);
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [quoteRoom, setQuoteRoom] = useState('Living Room');
  const [quoteItemName, setQuoteItemName] = useState('');
  const [quoteRate, setQuoteRate] = useState(1200);
  const [quoteWidth, setQuoteWidth] = useState('');
  const [quoteHeight, setQuoteHeight] = useState('');
  const [isLumpSum, setIsLumpSum] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchQuotation();
      fetchSelections();
    }
    fetchCatalog();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setStalePricing(data.stale_pricing === 1);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5055/api/material-catalog');
      if (res.ok) {
        const data = await res.json();
        setLaminateCatalog(data.filter(item => item.category === 'laminate'));
        setHardwareCatalog(data.filter(item => item.category === 'hardware'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuotation = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/quotation`);
      const data = await res.json();
      if (data && data.quotation_json) {
        const q = JSON.parse(data.quotation_json);
        setQuoteItems(q.items || []);
        setIsGstEnabled(q.isGstEnabled !== false);
        setDiscount(q.discount || 0);
      }
    } catch (err) {
      console.error("Error loading quotation:", err);
    }
  };

  const saveQuotation = async () => {
    try {
      await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation: {
            items: quoteItems,
            discount,
            isGstEnabled,
            gstPercentage: 18,
            milestones: getMilestones(grandTotal),
            subTotal,
            gstValue,
            grandTotal
          }
        })
      });
      
      // Auto log timeline event
      await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/estimate-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateType: 'concept',
          totals: { subtotal: subTotal, taxTotal: gstValue, grandTotal },
          items: quoteItems.map(qi => ({ lineCode: qi.id, category: 'estimate_builder', description: `[${qi.room}] ${qi.name}`, quantity: 1, uom: 'lot', lineTotal: qi.amount }))
        })
      });

      window.__toast?.show("BOQ estimate and quotation saved successfully!");
    } catch (err) {
      console.error("Error saving quotation:", err);
    }
  };

  const addQuoteItem = () => {
    if (!quoteItemName) return;
    let sqft = 1.0;
    let dimensions = 'Lump Sum';
    if (!isLumpSum) {
      const w = parseFloat(quoteWidth);
      const h = parseFloat(quoteHeight);
      if (!isNaN(w) && !isNaN(h)) {
        sqft = w * h;
        dimensions = `${w} x ${h} ft`;
      }
    }
    const rate = parseFloat(quoteRate);
    const amount = Math.round(sqft * (isNaN(rate) ? 0 : rate));
    const newItem = {
      id: 'qi_' + Math.random().toString(36).substr(2, 5),
      room: quoteRoom,
      name: quoteItemName,
      dimensions,
      sqft,
      rate,
      amount,
      isLumpSum
    };
    setQuoteItems(prev => [...prev, newItem]);
    setQuoteItemName('');
    setQuoteWidth('');
    setQuoteHeight('');
  };

  const deleteQuoteItem = (id) => {
    setQuoteItems(prev => prev.filter(i => i.id !== id));
  };

  const subTotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [quoteItems]);

  const taxable = useMemo(() => {
    return Math.max(0, subTotal - discount);
  }, [subTotal, discount]);

  const gstValue = useMemo(() => {
    return isGstEnabled ? taxable * 0.18 : 0;
  }, [taxable, isGstEnabled]);

  const grandTotal = useMemo(() => {
    return taxable + gstValue;
  }, [taxable, gstValue]);

  const getMilestones = (total) => {
    return [
      { stage: '10% Booking Fee', amount: Math.round(total * 0.10) },
      { stage: '40% Site Execution & Structure Start', amount: Math.round(total * 0.40) },
      { stage: '40% Material Sourcing & Delivery', amount: Math.round(total * 0.40) },
      { stage: '10% Final Finishing & Handover', amount: Math.round(total * 0.10) }
    ];
  };

  const exportQuotationPDF = async () => {
    await saveQuotation();
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/quotation/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation: {
            items: quoteItems,
            discount,
            isGstEnabled,
            gstPercentage: 18,
            milestones: getMilestones(grandTotal),
            subTotal,
            gstValue,
            grandTotal
          }
        })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SpaceTrace-Quotation-${projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    }
  };

  const fetchSelections = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/materials`);
      const data = await res.json();
      setSelectedLaminates(JSON.parse(data.laminates_json || '[]'));
      setSelectedHardware(JSON.parse(data.hardware_json || '[]'));
      setNotes(data.notes || '');
    } catch (err) {
      console.error("Error loading selections:", err);
    }
  };

  const toggleLaminate = (item) => {
    setSelectedLaminates(prev => {
      const exists = prev.some(l => l.id === item.id || l.code === item.code);
      return exists ? prev.filter(l => (l.id !== item.id && l.code !== item.code)) : [...prev, item];
    });
  };

  const toggleHardware = (item) => {
    setSelectedHardware(prev => {
      const exists = prev.some(h => h.id === item.id || h.code === item.code);
      return exists ? prev.filter(h => (h.id !== item.id && h.code !== item.code)) : [...prev, item];
    });
  };

  const handleAddLaminateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:5055/api/material-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'laminate',
          subcategory: newLaminate.subcategory,
          code: newLaminate.code,
          name: newLaminate.name,
          brand: newLaminate.brand,
          finish: newLaminate.finish,
          color: newLaminate.color,
          pricePerSqft: parseFloat(newLaminate.pricePerSqft),
          rating: 4.8
        })
      });
      if (res.ok) {
        setShowAddLaminateForm(false);
        setNewLaminate({ name: '', brand: 'CenturyPly', finish: 'Suede Matte', color: '#f3f4f6', pricePerSqft: '60', code: 'SF-NEW', subcategory: 'shutter_facade' });
        fetchCatalog();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleAddHwSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:5055/api/material-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'hardware',
          subcategory: newHw.category,
          code: newHw.code,
          name: newHw.name,
          brand: newHw.brand,
          finish: newHw.desc,
          color: '',
          pricePerSqft: parseFloat(newHw.price),
          rating: 4.9
        })
      });
      if (res.ok) {
        setShowAddHwForm(false);
        setNewHw({ name: '', brand: 'Hettich', category: 'hinges', desc: 'Soft-close fitting', price: '450', unit: 'per piece', code: 'HW-NEW' });
        fetchCatalog();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteMaterial = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to deactivate this material item?")) {
      try {
        await fetch(`http://127.0.0.1:5055/api/material-catalog/${id}`, {
          method: 'DELETE'
        });
        fetchCatalog();
      } catch(err) {
        console.error(err);
      }
    }
  };

  const handleRegeneratePricing = async () => {
    try {
      await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType: 'pricing_generation' })
      });
      setStalePricing(false);
      window.__toast?.show("Pricing regeneration job spawned successfully! Check Background Jobs tab.");
    } catch (err) {
      console.error(err);
    }
  };

  const saveMaterials = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laminates: selectedLaminates, hardware: selectedHardware, notes })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          if (onComplete) onComplete();
        }, 1200);
      }
    } catch (err) {
      console.error("Error saving materials:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered lists
  const filteredLaminates = useMemo(() => {
    return laminateCatalog.filter(item => {
      const matchSearch = !laminateSearch || 
        item.name.toLowerCase().includes(laminateSearch.toLowerCase()) ||
        item.brand.toLowerCase().includes(laminateSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(laminateSearch.toLowerCase());
      const matchType = laminateTypeFilter === 'all' || item.subcategory === laminateTypeFilter;
      return matchSearch && matchType;
    });
  }, [laminateCatalog, laminateSearch, laminateTypeFilter]);

  const filteredHardware = useMemo(() => {
    return hardwareCatalog.filter(item =>
      !hwSearch ||
      item.name.toLowerCase().includes(hwSearch.toLowerCase()) ||
      item.brand.toLowerCase().includes(hwSearch.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(hwSearch.toLowerCase())
    );
  }, [hardwareCatalog, hwSearch]);

  // Cost Estimate
  const estimatedMaterialCost = useMemo(() => {
    const avgPricePerSqft = selectedLaminates.length > 0
      ? selectedLaminates.reduce((s, l) => s + (l.pricePerSqft || 0), 0) / selectedLaminates.length
      : 0;
    const lamCost = avgPricePerSqft * estimatorSqft;
    const hwCost = selectedHardware.reduce((s, h) => s + (h.pricePerSqft || h.price || 0), 0);
    return { lamCost, hwCost, total: lamCost + hwCost };
  }, [selectedLaminates, selectedHardware, estimatorSqft]);

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.round(rating) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-slate-700'}`} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Output Stale Invalidation Banner */}
      {stalePricing && (
        <div className="bg-amber-950/20 border-b border-amber-900/40 px-6 py-3 text-xs text-amber-400 flex items-center justify-between font-bold shrink-0">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
            Pricing Out-of-Date: The underlying 3D layout or component selection has changed. Pricing estimates may not reflect the active design.
          </span>
          <button 
            onClick={handleRegeneratePricing}
            className="bg-[#D4AF37] hover:bg-[#c49e2f] text-slate-950 px-3 py-1 rounded-lg font-black uppercase text-[10px] transition"
          >
            Regenerate Pricing
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 p-5 overflow-y-auto h-full pb-24">
        
        {/* ── 1. Laminates & Veneers Catalog ── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col" style={{ maxHeight: '78vh' }}>
          <div className="flex-shrink-0 p-4 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#D4AF37]" />
                Laminates & Veneers
                <span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded-full font-bold">{selectedLaminates.length} sel.</span>
              </h2>
              <button 
                onClick={() => setShowAddLaminateForm(!showAddLaminateForm)}
                className="bg-slate-950 border border-slate-800 hover:border-[#D4AF37]/35 text-[#D4AF37] px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition"
              >
                {showAddLaminateForm ? 'View Catalog' : '+ Add Swatch'}
              </button>
            </div>

            {/* Form to Create New Laminate catalog item */}
            {showAddLaminateForm ? (
              <form onSubmit={handleAddLaminateSubmit} className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <input
                    type="text" placeholder="Swatch Name" required
                    value={newLaminate.name} onChange={e => setNewLaminate({...newLaminate, name: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <input
                    type="text" placeholder="Brand"
                    value={newLaminate.brand} onChange={e => setNewLaminate({...newLaminate, brand: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <input
                    type="text" placeholder="Code (e.g. LAM-99)" required
                    value={newLaminate.code} onChange={e => setNewLaminate({...newLaminate, code: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <input
                    type="text" placeholder="Color Hex (e.g. #ff0000)"
                    value={newLaminate.color} onChange={e => setNewLaminate({...newLaminate, color: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <input
                    type="number" placeholder="Price/sqft" required
                    value={newLaminate.pricePerSqft} onChange={e => setNewLaminate({...newLaminate, pricePerSqft: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <select
                    value={newLaminate.subcategory} onChange={e => setNewLaminate({...newLaminate, subcategory: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-350 outline-none"
                  >
                    <option value="carcass_interior">Carcass Finish</option>
                    <option value="shutter_facade">Shutter Finish</option>
                    <option value="premium_highlight">Premium Finish</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-1.5 bg-[#D4AF37] hover:bg-[#c49e2f] text-slate-950 text-[9px] font-bold rounded uppercase transition">
                  Create Swatch
                </button>
              </form>
            ) : (
              <div className="flex gap-2">
                <div className="flex-grow relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text" placeholder="Search finishes..."
                    value={laminateSearch} onChange={e => setLaminateSearch(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40 placeholder:text-slate-600"
                  />
                </div>
                <select
                  value={laminateTypeFilter}
                  onChange={e => setLaminateTypeFilter(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 outline-none focus:border-[#D4AF37]/40 cursor-pointer shrink-0"
                >
                  <option value="all">All Types</option>
                  <option value="carcass_interior">Carcass</option>
                  <option value="shutter_facade">Shutter</option>
                  <option value="premium_highlight">Premium</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredLaminates.map(item => {
              const isSelected = selectedLaminates.some(l => l.code === item.code);
              const typeCfg = TYPE_LABELS[item.subcategory] || TYPE_LABELS['shutter_facade'];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleLaminate(item)}
                  className={`material-swatch p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 relative group ${
                    isSelected
                      ? 'bg-slate-800/90 border-[#D4AF37]/50 shadow-md shadow-[#D4AF37]/5'
                      : 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  {/* Swatch Color */}
                  <div
                    className="w-11 h-11 rounded-lg border border-slate-700/50 shrink-0 shadow-inner relative overflow-hidden"
                    style={{ backgroundColor: item.color }}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <strong className="text-xs text-slate-200 leading-tight truncate pr-4">{item.name}</strong>
                      <span className="text-[9px] font-mono text-slate-500 shrink-0">{item.code}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.brand} · {item.finish || 'Matte'}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeCfg.bg} ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {renderStars(item.rating || 4.8)}
                        <span className="text-[9px] text-[#D4AF37] font-bold font-mono">₹{item.pricePerSqft}/sqft</span>
                      </div>
                    </div>
                  </div>

                  {/* Deactivate CRUD Button */}
                  <button 
                    onClick={(e) => handleDeleteMaterial(e, item.id)}
                    className="absolute top-2 right-2 p-1 bg-slate-900 border border-slate-850 hover:border-red-500 hover:text-red-400 rounded text-slate-650 opacity-0 group-hover:opacity-100 transition shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 2. Hardware & Fittings Catalog ── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col" style={{ maxHeight: '78vh' }}>
          <div className="flex-shrink-0 p-4 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                Hardware & Fittings
                <span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded-full font-bold">{selectedHardware.length} sel.</span>
              </h2>
              <button 
                onClick={() => setShowAddHwForm(!showAddHwForm)}
                className="bg-slate-950 border border-slate-800 hover:border-[#D4AF37]/35 text-[#D4AF37] px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition"
              >
                {showAddHwForm ? 'View Catalog' : '+ Add Fitting'}
              </button>
            </div>

            {/* Form to Create New Hardware Catalog item */}
            {showAddHwForm ? (
              <form onSubmit={handleAddHwSubmit} className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <input
                    type="text" placeholder="Fitting Name" required
                    value={newHw.name} onChange={e => setNewHw({...newHw, name: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <input
                    type="text" placeholder="Brand"
                    value={newHw.brand} onChange={e => setNewHw({...newHw, brand: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <input
                    type="text" placeholder="Code (e.g. H-02)" required
                    value={newHw.code} onChange={e => setNewHw({...newHw, code: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <input
                    type="number" placeholder="Cost" required
                    value={newHw.price} onChange={e => setNewHw({...newHw, price: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                  />
                  <select
                    value={newHw.category} onChange={e => setNewHw({...newHw, category: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-350 outline-none col-span-2"
                  >
                    <option value="runners">Runners / Telescopic</option>
                    <option value="hinges">Hinges / Soft-close</option>
                    <option value="baskets">Wire Baskets / Pantry</option>
                    <option value="lift_systems">Horizontal Lift Systems</option>
                    <option value="handles">Cabinet Handles / G-Profile</option>
                  </select>
                  <input
                    type="text" placeholder="Short description"
                    value={newHw.desc} onChange={e => setNewHw({...newHw, desc: e.target.value})}
                    className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 outline-none col-span-2"
                  />
                </div>
                <button type="submit" className="w-full py-1.5 bg-[#D4AF37] hover:bg-[#c49e2f] text-slate-950 text-[9px] font-bold rounded uppercase transition">
                  Create Fitting
                </button>
              </form>
            ) : (
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" placeholder="Search hardware..."
                  value={hwSearch} onChange={e => setHwSearch(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40 placeholder:text-slate-600"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredHardware.map(item => {
              const isSelected = selectedHardware.some(h => h.code === item.code);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleHardware(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 relative group ${
                    isSelected
                      ? 'bg-slate-800/90 border-[#D4AF37]/50 shadow-md shadow-[#D4AF37]/5'
                      : 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 pr-4">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                        <strong className="text-xs text-slate-200 leading-tight truncate">{item.name}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.brand} · {item.subcategory.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-[#D4AF37] font-mono block">₹{item.pricePerSqft || item.price || 0}</span>
                      <span className="text-[9px] text-slate-500">per unit</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pr-4">{item.finish || 'Soft-close mechanism'}</p>
                  <div className="flex items-center gap-1">{renderStars(item.rating || 4.9)}</div>

                  {/* Deactivate CRUD Button */}
                  <button 
                    onClick={(e) => handleDeleteMaterial(e, item.id)}
                    className="absolute top-3.5 right-3 p-1 bg-slate-900 border border-slate-850 hover:border-red-500 hover:text-red-400 rounded text-slate-650 opacity-0 group-hover:opacity-100 transition shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Summary & Estimation Panel ── */}
        <div className="space-y-4">
          
          {/* Selection Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              Selection Summary
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">Laminates</span>
                <strong className="text-[#D4AF37] text-2xl block">{selectedLaminates.length}</strong>
                <span className="text-slate-500 text-[9px]">of {laminateCatalog.length} active</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">Hardware</span>
                <strong className="text-[#D4AF37] text-2xl block">{selectedHardware.length}</strong>
                <span className="text-slate-500 text-[9px]">of {hardwareCatalog.length} active</span>
              </div>
            </div>

            {/* Selected Laminates Preview */}
            {selectedLaminates.length > 0 && (
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Selected Finishes</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLaminates.map(lam => (
                    <div
                      key={lam.id || lam.code}
                      onClick={() => toggleLaminate(lam)}
                      title={lam.name}
                      className="w-7 h-7 rounded-lg border-2 border-[#D4AF37]/40 cursor-pointer hover:scale-110 transition-transform relative group"
                      style={{ backgroundColor: lam.color }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-[9px] text-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none">
                        {lam.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Material Cost Projector */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex justify-between items-center cursor-pointer font-bold text-slate-350 text-[11px]" onClick={() => setShowCostEstimator(!showCostEstimator)}>
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" /> Material Cost Projector
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showCostEstimator ? 'rotate-180' : ''}`} />
              </div>

              {showCostEstimator && (
                <div className="space-y-3.5 pt-2 border-t border-slate-800/60 slide-up text-[10px]">
                  <div className="flex items-center justify-between gap-3 text-slate-400">
                    <span>Assumed Surface Area (sqft):</span>
                    <input
                      type="number"
                      value={estimatorSqft}
                      onChange={e => setEstimatorSqft(Math.max(1, Number(e.target.value)))}
                      className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-right text-slate-200 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1 border-t border-slate-850 pt-2 text-slate-500">
                    <div className="flex justify-between">
                      <span>Est. Laminate Cost ({estimatorSqft} sqft):</span>
                      <span>₹{Math.round(estimatedMaterialCost.lamCost).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Hardware Cost ({selectedHardware.length} items):</span>
                      <span>₹{Math.round(estimatedMaterialCost.hwCost).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#D4AF37] border-t border-slate-850 pt-1.5 text-[11px]">
                      <span>Total Estimated Cost:</span>
                      <span>₹{Math.round(estimatedMaterialCost.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quotation Builder Toggle */}
            <button
              onClick={() => setShowQuotationBuilder(!showQuotationBuilder)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition"
            >
              <span className="flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5" /> Itemized Quotation Builder</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showQuotationBuilder ? 'rotate-180' : ''}`} />
            </button>

            {showQuotationBuilder && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-4 slide-up">
                {/* Add Item Form */}
                <div className="space-y-2.5 p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg">
                  <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider block">Add Room Estimate</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <select 
                      value={quoteRoom} 
                      onChange={e => setQuoteRoom(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-slate-205 outline-none cursor-pointer"
                    >
                      <option value="Living Room">Living Room</option>
                      <option value="Modular Kitchen">Kitchen</option>
                      <option value="Master Bedroom">Master Suite</option>
                      <option value="Pooja Room">Pooja Room</option>
                      <option value="Foyer Entrance">Foyer</option>
                      <option value="Custom Room">Custom</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer font-bold select-none">
                      <input 
                        type="checkbox" 
                        checked={isLumpSum} 
                        onChange={e => setIsLumpSum(e.target.checked)} 
                        className="accent-[#D4AF37]" 
                      />
                      Lump Sum Rate
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="Item Name (e.g. Wardrobe shutters)"
                    value={quoteItemName}
                    onChange={e => setQuoteItemName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-200 outline-none"
                  />

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    {!isLumpSum ? (
                      <>
                        <input
                          type="number"
                          placeholder="Width (ft)"
                          value={quoteWidth}
                          onChange={e => setQuoteWidth(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Height (ft)"
                          value={quoteHeight}
                          onChange={e => setQuoteHeight(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Rate / sqft"
                          value={quoteRate}
                          onChange={e => setQuoteRate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 outline-none"
                        />
                      </>
                    ) : (
                      <input
                        type="number"
                        placeholder="Lump Sum Price"
                        value={quoteRate}
                        onChange={e => setQuoteRate(e.target.value)}
                        className="col-span-3 w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 outline-none"
                      />
                    )}
                  </div>

                  <button
                    onClick={addQuoteItem}
                    className="w-full py-1.5 bg-[#D4AF37] hover:bg-[#c49e2f] text-slate-950 text-[10px] font-bold rounded uppercase transition"
                  >
                    + Add to Bill
                  </button>
                </div>

                {/* Itemized List */}
                {quoteItems.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {quoteItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-[10px] bg-slate-950/65 p-2 rounded border border-slate-850">
                        <div>
                          <strong className="text-slate-350 block leading-tight">[{item.room}] {item.name}</strong>
                          <span className="text-[9px] text-slate-500">{item.dimensions} @ ₹{item.rate}/{(item.isLumpSum ? 'ea' : 'sqft')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300 font-bold">₹{item.amount.toLocaleString()}</span>
                          <button 
                            onClick={() => deleteQuoteItem(item.id)}
                            className="text-red-400 hover:text-red-300 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals & Taxes */}
                <div className="border-t border-slate-800 pt-2 space-y-2 text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-250">₹{subTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Discount (INR)</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value))}
                      className="w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-right text-slate-200 outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Add 18% GST</span>
                    <input
                      type="checkbox"
                      checked={isGstEnabled}
                      onChange={e => setIsGstEnabled(e.target.checked)}
                      className="accent-[#D4AF37] rounded cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 flex justify-between font-bold">
                    <span className="text-slate-200">Grand Total</span>
                    <span className="text-[#D4AF37] font-mono text-sm">₹{Math.round(grandTotal).toLocaleString()}</span>
                  </div>
                </div>

                {/* Milestone Splits */}
                {grandTotal > 0 && (
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850 text-[9px] space-y-1.5">
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Payment Milestone Splits (10/40/40/10)</span>
                    {getMilestones(grandTotal).map((ms, idx) => (
                      <div key={idx} className="flex justify-between text-slate-500">
                        <span>{ms.stage}</span>
                        <span className="font-mono text-slate-350">₹{ms.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {grandTotal > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={saveQuotation}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[10px] font-bold rounded uppercase transition"
                    >
                      Save Estimate
                    </button>
                    <button
                      onClick={exportQuotationPDF}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-[#D4AF37]/35 text-[#D4AF37] text-[10px] font-bold rounded uppercase flex items-center justify-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF Proposal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                Project Slicing Notes & Grain Specs
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40 resize-none"
                placeholder="Specify grain direction, edgeband thickness preferences, room assignments..."
              />
            </div>

            {/* Save Selections Button */}
            <button
              onClick={saveMaterials}
              disabled={isSaving}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition ${
                saveSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] hover:from-[#e8c94a] hover:to-[#c4a030] text-slate-950'
              }`}
            >
              {saveSuccess
                ? <><CheckCircle className="w-4 h-4" /> Selections Saved!</>
                : isSaving
                  ? 'Saving...'
                  : <><Save className="w-4 h-4" /> Approve & Continue to Renders</>
              }
            </button>
          </div>

          {/* Digital Brochure Library */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              Digital Brochure Library
            </h3>
            <div className="space-y-2">
              {BROCHURES.map((br, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between hover:border-slate-700 transition group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs" style={{ background: br.color + '25', border: `1px solid ${br.color}35`, color: br.color }}>
                      {br.brand[0]}
                    </div>
                    <div>
                      <strong className="text-[11px] text-slate-300 block leading-tight">{br.title}</strong>
                      <span className="text-[9px] text-slate-500">{br.brand} · {br.pages}pg</span>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-[#D4AF37] transition opacity-0 group-hover:opacity-100">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
