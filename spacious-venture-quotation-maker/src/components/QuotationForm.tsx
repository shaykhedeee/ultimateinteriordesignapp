import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, PlusCircle, ChevronDown, Percent } from 'lucide-react';
import { Quotation, QuoteItem, RateItem, CompanyProfile, PaymentMilestone, MaterialItem } from '../types';
import { CATEGORY_SUGGESTIONS, PROJECT_TYPES } from '../constants';

interface QuotationFormProps {
  quotation: Quotation;
  rateCard: RateItem[];
  materials: MaterialItem[];
  onSave: (q: Quotation) => void;
  onCancel: () => void;
  companyProfile: CompanyProfile;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const QuotationForm: React.FC<QuotationFormProps> = ({
  quotation,
  rateCard,
  materials,
  onSave,
  onCancel,
  companyProfile,
  showToast
}) => {
  // Main form states
  const [clientName, setClientName] = useState(quotation.clientName);
  const [clientPhone, setClientPhone] = useState(quotation.clientPhone || '');
  const [clientEmail, setClientEmail] = useState(quotation.clientEmail || '');
  const [projectLocation, setProjectLocation] = useState(quotation.projectLocation);
  const [projectType, setProjectType] = useState(quotation.projectType);
  const [quoteNumber, setQuoteNumber] = useState(quotation.quoteNumber);
  const [dateOfIssue, setDateOfIssue] = useState(quotation.dateOfIssue);
  const [validUntil, setValidUntil] = useState(quotation.validUntil);
  const [projectDuration, setProjectDuration] = useState(quotation.projectDuration || '40 Working Days');
  const [notes, setNotes] = useState(quotation.notes || '');

  // Line items state
  const [items, setItems] = useState<QuoteItem[]>(() => JSON.parse(JSON.stringify(quotation.items)));
  const [requestedItems, setRequestedItems] = useState<QuoteItem[]>(() => JSON.parse(JSON.stringify(quotation.requestedItems || [])));

  // Financials
  const [isGstEnabled, setIsGstEnabled] = useState(quotation.isGstEnabled);
  const [gstPercentage, setGstPercentage] = useState(quotation.gstPercentage || 18);
  const [discount, setDiscount] = useState(quotation.discount);

  // Specs, Terms, and Milestones
  const [specifications, setSpecifications] = useState<string[]>(() => [...quotation.specifications]);
  const [terms, setTerms] = useState<string[]>(() => [...quotation.terms]);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>(() => 
    quotation.paymentSchedule && quotation.paymentSchedule.length > 0
      ? JSON.parse(JSON.stringify(quotation.paymentSchedule))
      : []
  );

  // New Specs/Terms input
  const [newSpec, setNewSpec] = useState('');
  const [newTerm, setNewTerm] = useState('');

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<string>(CATEGORY_SUGGESTIONS[0]);
  const [showBankOverride, setShowBankOverride] = useState(false);

  // Specific bank details override
  const [bankDetails, setBankDetails] = useState(() => ({
    accountName: quotation.bankDetails?.accountName || companyProfile.bankDetails?.accountName || '',
    bankName: quotation.bankDetails?.bankName || companyProfile.bankDetails?.bankName || '',
    accountNumber: quotation.bankDetails?.accountNumber || companyProfile.bankDetails?.accountNumber || '',
    ifscCode: quotation.bankDetails?.ifscCode || companyProfile.bankDetails?.ifscCode || '',
    branch: quotation.bankDetails?.branch || companyProfile.bankDetails?.branch || '',
    upiId: quotation.bankDetails?.upiId || companyProfile.bankDetails?.upiId || ''
  }));

  // Auto-calculated totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    discountVal: 0,
    gstVal: 0,
    grandTotal: 0
  });

  // Costing States
  const [costing, setCosting] = useState(() => ({
    manufacturingCost: quotation.costing?.manufacturingCost || 0,
    hardwareCost: quotation.costing?.hardwareCost || 0,
    transportCost: quotation.costing?.transportCost || 0,
    laborCost: quotation.costing?.laborCost || 0,
    designFee: quotation.costing?.designFee || 0,
    contingency: quotation.costing?.contingency || 0
  }));

  // Auto-initialize costing on subtotal change if not customized
  useEffect(() => {
    const sub = totals.subtotal;
    if (sub > 0 && costing.manufacturingCost === 0 && costing.hardwareCost === 0) {
      setCosting({
        manufacturingCost: Math.round(sub * 0.40),
        hardwareCost: Math.round(sub * 0.12),
        laborCost: Math.round(sub * 0.10),
        transportCost: Math.round(sub * 0.03),
        designFee: Math.round(sub * 0.05),
        contingency: Math.round(sub * 0.05)
      });
    }
  }, [totals.subtotal]);

  // Helper for dynamic material markups
  const getRateWithMarkup = (
    baseRate: number, 
    carcassName: string, 
    finishName: string, 
    hardwareName: string
  ) => {
    let carcassMarkup = 0;
    let finishMarkup = 0;
    let hardwareMarkup = 0;

    const carcassItem = materials.find(m => m.name === carcassName && m.type === 'carcass');
    if (carcassItem) carcassMarkup = carcassItem.markupPercentage;

    const finishItem = materials.find(m => m.name === finishName && m.type === 'finish');
    if (finishItem) finishMarkup = finishItem.markupPercentage;

    const hardwareItem = materials.find(m => m.name === hardwareName && m.type === 'hardware');
    if (hardwareItem) hardwareMarkup = hardwareItem.markupPercentage;

    return Math.round(baseRate * (1 + carcassMarkup + finishMarkup + hardwareMarkup));
  };

  // Calculate totals whenever items or discounts change
  useEffect(() => {
    const sub = items.reduce((acc, i) => acc + (i.amount || 0), 0) + requestedItems.reduce((acc, i) => acc + (i.amount || 0), 0);
    const disc = discount;
    const taxable = Math.max(0, sub - disc);
    const gstVal = isGstEnabled ? taxable * (gstPercentage / 100) : 0;
    const total = taxable + gstVal;

    setTotals({
      subtotal: sub,
      discountVal: disc,
      gstVal: gstVal,
      grandTotal: total
    });
  }, [items, requestedItems, isGstEnabled, gstPercentage, discount]);

  // Sync Payment Milestones to grandTotal
  useEffect(() => {
    setMilestones(prev => 
      prev.map(m => ({
        ...m,
        amount: Math.round(totals.grandTotal * (m.percentage / 100))
      }))
    );
  }, [totals.grandTotal]);

  // Dimension Parser to compute SQFT
  const calculateItemAmount = (widthHeightStr: string, rate: number, isLumpSum?: boolean) => {
    if (isLumpSum) return rate;
    const parts = widthHeightStr.split('x').map(p => p.trim());
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isNaN(w) && !isNaN(h)) {
      return w * h * rate;
    }
    return 0;
  };

  const calculateItemSqft = (widthHeightStr: string, isLumpSum?: boolean) => {
    if (isLumpSum) return 0;
    const parts = widthHeightStr.split('x').map(p => p.trim());
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isNaN(w) && !isNaN(h)) {
      return w * h;
    }
    return 0;
  };

  // Dropdown Product Selection Handler
  const handleProductSelect = (index: boolean, itemId: string, rateId: string) => {
    const catalogItem = rateCard.find(r => r.id === rateId);
    if (!catalogItem) return;

    const targetItems = index ? [...items] : [...requestedItems];
    const updateIdx = targetItems.findIndex(i => i.id === itemId);
    if (updateIdx === -1) return;

    const isLump = catalogItem.rateType === 'LUMPSUM';
    const dims = catalogItem.defaultDimensions;
    const rate = catalogItem.defaultRate;
    
    const defaultCarcass = catalogItem.defaultMaterial || '';
    const defaultFinish = catalogItem.defaultFinish || '';
    const defaultHardware = catalogItem.defaultHardware || '';
    const rateWithMarkup = getRateWithMarkup(rate, defaultCarcass, defaultFinish, defaultHardware);
    
    const sqft = calculateItemSqft(dims, isLump);
    const amount = calculateItemAmount(dims, rateWithMarkup, isLump);

    targetItems[updateIdx] = {
      ...targetItems[updateIdx],
      description: catalogItem.name,
      dimensions: dims,
      rate: rateWithMarkup,
      baseRate: rate,
      sqft: sqft,
      amount: amount,
      isLumpSum: isLump,
      unit: catalogItem.defaultUnit,
      material: defaultCarcass,
      finish: defaultFinish,
      hardware: defaultHardware
    };

    if (index) {
      setItems(targetItems);
    } else {
      setRequestedItems(targetItems);
    }
  };

  // Row input field changes
  const handleItemFieldChange = (isDetailed: boolean, itemId: string, field: keyof QuoteItem, value: any) => {
    const targetItems = isDetailed ? [...items] : [...requestedItems];
    const updateIdx = targetItems.findIndex(i => i.id === itemId);
    if (updateIdx === -1) return;

    const updatedRow = { ...targetItems[updateIdx], [field]: value };

    // Auto-calculate dependencies
    if (field === 'dimensions' || field === 'rate' || field === 'isLumpSum' || field === 'material' || field === 'finish' || field === 'hardware') {
      const isLump = field === 'isLumpSum' ? value : updatedRow.isLumpSum;
      const dims = field === 'dimensions' ? value : updatedRow.dimensions;
      
      let baseRate = updatedRow.baseRate || updatedRow.rate || 0;
      if (field === 'rate') {
        baseRate = Number(value);
        updatedRow.baseRate = baseRate; // Manual rate changes updates baseRate
      }

      const carcassName = field === 'material' ? value : (updatedRow.material || '');
      const finishName = field === 'finish' ? value : (updatedRow.finish || '');
      const hardwareName = field === 'hardware' ? value : (updatedRow.hardware || '');

      const rate = getRateWithMarkup(baseRate, carcassName, finishName, hardwareName);
      updatedRow.rate = rate;
      updatedRow.sqft = calculateItemSqft(dims, isLump);
      updatedRow.amount = calculateItemAmount(dims, rate, isLump);
    }

    targetItems[updateIdx] = updatedRow;
    if (isDetailed) {
      setItems(targetItems);
    } else {
      setRequestedItems(targetItems);
    }
  };

  const handleAddNewRow = (isDetailed: boolean, category = 'General') => {
    const newRow: QuoteItem = {
      id: Date.now() + Math.random().toString(),
      category: category,
      description: '',
      dimensions: '10 x 2.75',
      sqft: 27.5,
      rate: 0,
      amount: 0,
      isLumpSum: false,
      unit: 'Sqft'
    };

    if (isDetailed) {
      setItems(prev => [...prev, newRow]);
    } else {
      setRequestedItems(prev => [...prev, newRow]);
    }
  };

  const handleRemoveRow = (isDetailed: boolean, itemId: string) => {
    if (isDetailed) {
      setItems(prev => prev.filter(i => i.id !== itemId));
    } else {
      setRequestedItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  // Material Specs and Terms
  const handleAddSpec = () => {
    if (newSpec.trim()) {
      setSpecifications(prev => [...prev, newSpec.trim()]);
      setNewSpec('');
    }
  };

  const handleAddTerm = () => {
    if (newTerm.trim()) {
      setTerms(prev => [...prev, newTerm.trim()]);
      setNewTerm('');
    }
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveTerm = (idx: number) => {
    setTerms(prev => prev.filter((_, i) => i !== idx));
  };

  // Payment schedule validation and saving
  const handleMilestonePercentChange = (idx: number, pct: number) => {
    setMilestones(prev => 
      prev.map((m, i) => i === idx ? { ...m, percentage: pct, amount: Math.round(totals.grandTotal * (pct / 100)) } : m)
    );
  };

  const handleMilestoneNameChange = (idx: number, name: string) => {
    setMilestones(prev => 
      prev.map((m, i) => i === idx ? { ...m, milestone: name } : m)
    );
  };

  const handleAddMilestone = () => {
    setMilestones(prev => [
      ...prev,
      { milestone: `Milestone ${prev.length + 1}`, percentage: 0, amount: 0 }
    ]);
  };

  const handleRemoveMilestone = (idx: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuotation = () => {
    if (!clientName.trim()) {
      showToast('Client Name is required.', 'error');
      return;
    }

    const totalPct = milestones.reduce((sum, m) => sum + m.percentage, 0);
    if (totalPct !== 100) {
      showToast(`Payment Milestones sum is ${totalPct}%. It must sum to exactly 100%.`, 'error');
      return;
    }

    const savedQuote: Quotation = {
      id: quotation.id,
      quoteNumber: quoteNumber,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      projectLocation: projectLocation.trim(),
      projectType: projectType,
      dateOfIssue: dateOfIssue,
      validUntil: validUntil,
      items: items,
      requestedItems: requestedItems,
      isGstEnabled: isGstEnabled,
      gstPercentage: gstPercentage,
      subtotal: totals.subtotal,
      discount: totals.discountVal,
      gst: totals.gstVal,
      grandTotal: totals.grandTotal,
      projectDuration: projectDuration.trim(),
      paymentSchedule: milestones,
      specifications: specifications,
      terms: terms,
      bankDetails: bankDetails,
      notes: notes.trim(),
      costing: costing,
      status: quotation.status,
      revision: quotation.revision + 1,
      createdAt: quotation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(savedQuote);
  };

  // Group rest of uncategorized items
  const uncategorized = items.filter(i => !CATEGORY_SUGGESTIONS.includes(i.category || ''));
  const hasUncategorized = uncategorized.length > 0;

  const tabsToRender = [...CATEGORY_SUGGESTIONS];
  if (hasUncategorized) {
    tabsToRender.push('Other Rooms');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
      {/* Editor Header Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center border-b border-stone-100 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-800">
              {quotation.clientName ? `Edit Quotation: ${quotation.clientName}` : 'Create New Quotation'}
            </h2>
            <p className="text-stone-400 text-xs mt-1">Configure client details, modular layout entries, and payment structure.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-stone-200 bg-white rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuotation}
              className="px-4 py-2 bg-[#1f352b] hover:bg-[#2c493c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14} />
              <span>Save & Preview</span>
            </button>
          </div>
        </div>

        {/* Client Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Client Name *</span>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Mr. Rahul"
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-bold text-stone-700"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Phone Number</span>
            <input
              type="text"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              placeholder="e.g. +91 95385 36950"
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email Address</span>
            <input
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              placeholder="e.g. rahul@gmail.com"
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Apartment / Gated Community</span>
            <input
              type="text"
              value={projectLocation}
              onChange={e => setProjectLocation(e.target.value)}
              placeholder="e.g. Adarsh Mayberry, Gunjur"
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Property Type</span>
            <select
              value={projectType}
              onChange={e => setProjectType(e.target.value)}
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white text-stone-600"
            >
              {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Quote Number</span>
            <input
              type="text"
              value={quoteNumber}
              onChange={e => setQuoteNumber(e.target.value)}
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-mono"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Date of Issue</span>
            <input
              type="date"
              value={dateOfIssue}
              onChange={e => setDateOfIssue(e.target.value)}
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Valid Until</span>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
          </label>
          
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Project Completion Target</span>
            <input
              type="text"
              value={projectDuration}
              onChange={e => setProjectDuration(e.target.value)}
              placeholder="e.g. 40 Working Days"
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
          </label>

          <label className="flex flex-col gap-1 md:col-span-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Project Scope Notes / Description</span>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Master Bedroom wardrobes, modular kitchen with BWP core, Hettich fittings."
              className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
          </label>
        </div>
      </div>

      {/* DETAILED ESTIMATE BUILDER SECTION */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-stone-100 pb-3">
          <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Detailed Room-wise Estimate</h3>
          
          <button
            onClick={() => handleAddNewRow(true, activeTab === 'Other Rooms' ? 'Other' : activeTab)}
            className="text-xs text-[#b8873b] hover:text-[#a37632] font-bold flex items-center gap-1 bg-white hover:bg-stone-50 px-3 py-1.5 border border-stone-200 rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle size={14} />
            <span>Add Item to {activeTab}</span>
          </button>
        </div>

        {/* Tabs navigation */}
        <div className="flex gap-2 border-b border-stone-200 pb-3 mb-6 overflow-x-auto no-scrollbar scroll-smooth">
          {tabsToRender.map(cat => {
            const count = cat === 'Other Rooms' 
              ? uncategorized.length
              : items.filter(i => i.category === cat).length;
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${isActive ? 'bg-[#1f352b] text-white shadow-md' : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'}`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-[#b8873b] text-white' : 'bg-stone-200 text-stone-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active room editor table */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/10 overflow-hidden">
          <div className="bg-stone-50 p-4 border-b border-stone-200/60 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#b8873b] rounded-full"></span>
              <strong className="text-sm font-serif font-bold text-[#1f352b]">{activeTab} Details</strong>
            </div>
          </div>

          {/* Active room items table */}
          {(() => {
            const activeRoomItems = activeTab === 'Other Rooms' 
              ? uncategorized 
              : items.filter(i => i.category === activeTab);
            
            if (activeRoomItems.length === 0) {
              return (
                <div className="p-8 text-center text-stone-400 italic text-xs">
                  No items in {activeTab}. Click "Add Item to {activeTab}" to add some.
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                  <thead>
                    <tr className="bg-stone-50/30 text-[9px] uppercase tracking-widest font-bold text-stone-400 border-b border-stone-200/50">
                      <th className="py-2.5 px-4 w-1/4">Auto-Price Catalog Dropdown</th>
                      <th className="py-2.5 px-2">Description / Name</th>
                      <th className="py-2.5 px-2 w-24">Dimensions (W x H)</th>
                      <th className="py-2.5 px-2 w-20 text-center">Lump Sum</th>
                      <th className="py-2.5 px-2 w-20 text-right">SQFT</th>
                      <th className="py-2.5 px-2 w-28 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-4 w-28 text-right">Amount (₹)</th>
                      <th className="py-2.5 px-4 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {activeRoomItems.map(item => (
                      <tr key={item.id} className="hover:bg-white transition-colors bg-white/40">
                        {/* Product Dropdown Selector */}
                        <td className="py-3.5 px-4 align-top">
                          <select
                            onChange={e => handleProductSelect(true, item.id, e.target.value)}
                            defaultValue=""
                            className="w-full border border-stone-200 rounded p-1.5 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-medium text-stone-600"
                          >
                            <option value="" disabled>-- Select Catalog Product --</option>
                            {rateCard
                              .filter(r => r.category === item.category || r.category.includes(item.category || '') || item.category === 'General Works')
                              .map(rateItem => (
                                <option key={rateItem.id} value={rateItem.id}>
                                  {rateItem.name} (₹{rateItem.defaultRate})
                                </option>
                              ))}
                            <option value="" disabled>-- Other Products --</option>
                            {rateCard
                              .filter(r => r.category !== item.category && !r.category.includes(item.category || ''))
                              .map(rateItem => (
                                <option key={rateItem.id} value={rateItem.id}>
                                  [{rateItem.category}] {rateItem.name}
                                </option>
                              ))}
                          </select>
                        </td>

                        {/* Description / Custom Text */}
                        <td className="py-3.5 px-2 align-top">
                          <textarea
                            value={item.description}
                            onChange={e => handleItemFieldChange(true, item.id, 'description', e.target.value)}
                            placeholder="Enter custom description..."
                            rows={2}
                            className="w-full border border-stone-200 rounded p-1.5 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-semibold text-[#1f352b]"
                          />
                          <div className="flex flex-col gap-1 mt-1.5 bg-stone-50 p-2 rounded border border-stone-200/50">
                            <div className="text-[8px] font-bold text-stone-400 uppercase tracking-wider mb-0.5 flex justify-between">
                              <span>Module Specifications</span>
                              {item.baseRate && item.rate !== item.baseRate && (
                                <span className="text-[#b8873b]">Markup Applied: +₹{item.rate - item.baseRate}</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <label className="flex-1 flex flex-col gap-0.5">
                                <span className="text-[7px] font-bold text-stone-500 uppercase">Carcass/Core</span>
                                <select
                                  value={item.material || ''}
                                  onChange={e => handleItemFieldChange(true, item.id, 'material', e.target.value)}
                                  className="border border-stone-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-[#b8873b] bg-white text-stone-600 font-medium"
                                >
                                  <option value="">-- Select Carcass --</option>
                                  {materials.filter(m => m.type === 'carcass').map(m => (
                                    <option key={m.id} value={m.name}>
                                      {m.name} {m.markupPercentage !== 0 ? `(${m.markupPercentage > 0 ? '+' : ''}${Math.round(m.markupPercentage * 100)}%)` : ''}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex-1 flex flex-col gap-0.5">
                                <span className="text-[7px] font-bold text-stone-500 uppercase">Finish</span>
                                <select
                                  value={item.finish || ''}
                                  onChange={e => handleItemFieldChange(true, item.id, 'finish', e.target.value)}
                                  className="border border-stone-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-[#b8873b] bg-white text-stone-600 font-medium"
                                >
                                  <option value="">-- Select Finish --</option>
                                  {materials.filter(m => m.type === 'finish').map(m => (
                                    <option key={m.id} value={m.name}>
                                      {m.name} {m.markupPercentage !== 0 ? `(${m.markupPercentage > 0 ? '+' : ''}${Math.round(m.markupPercentage * 100)}%)` : ''}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex-1 flex flex-col gap-0.5">
                                <span className="text-[7px] font-bold text-stone-500 uppercase">Hardware</span>
                                <select
                                  value={item.hardware || ''}
                                  onChange={e => handleItemFieldChange(true, item.id, 'hardware', e.target.value)}
                                  className="border border-stone-200 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:border-[#b8873b] bg-white text-stone-600 font-medium"
                                >
                                  <option value="">-- Select Hardware --</option>
                                  {materials.filter(m => m.type === 'hardware').map(m => (
                                    <option key={m.id} value={m.name}>
                                      {m.name} {m.markupPercentage !== 0 ? `(${m.markupPercentage > 0 ? '+' : ''}${Math.round(m.markupPercentage * 100)}%)` : ''}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </div>
                        </td>

                        {/* Dimensions */}
                        <td className="py-3.5 px-2 align-top">
                          <input
                            type="text"
                            value={item.dimensions}
                            disabled={item.isLumpSum}
                            onChange={e => handleItemFieldChange(true, item.id, 'dimensions', e.target.value)}
                            placeholder="e.g. 10 x 2.75"
                            className="w-full border border-stone-200 rounded p-1.5 text-xs text-center font-mono focus:outline-none focus:border-[#b8873b] disabled:bg-stone-100 disabled:text-stone-400 bg-white"
                          />
                        </td>

                        {/* Lump Sum Toggle */}
                        <td className="py-3.5 px-2 align-top text-center">
                          <input
                            type="checkbox"
                            checked={item.isLumpSum || false}
                            onChange={e => handleItemFieldChange(true, item.id, 'isLumpSum', e.target.checked)}
                            className="w-4 h-4 text-[#1f352b] border-stone-300 rounded focus:ring-[#b8873b] mx-auto mt-2"
                          />
                        </td>

                        {/* SQFT */}
                        <td className="py-3.5 px-2 align-top text-right font-mono font-bold text-stone-500 pt-3">
                          {item.isLumpSum ? '-' : item.sqft.toFixed(2)}
                        </td>

                        {/* Rate */}
                        <td className="py-3.5 px-2 align-top w-28 min-w-[110px]">
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-[10px] pointer-events-none">₹</span>
                            <input
                              type="number"
                              value={item.rate || ''}
                              onChange={e => handleItemFieldChange(true, item.id, 'rate', Number(e.target.value))}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 border border-stone-200 rounded text-xs text-right font-bold focus:outline-none focus:border-[#b8873b] bg-white text-stone-700 font-mono"
                            />
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 align-top text-right font-black text-stone-900 pt-3 font-mono">
                          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Remove Row */}
                        <td className="py-3.5 px-4 align-top text-center pt-2.5">
                          <button
                            onClick={() => handleRemoveRow(true, item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* SUPPLEMENTARY / SERVICES WORKS SECTION */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center border-b border-stone-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Supplementary / Optional Works</h3>
          <button
            onClick={() => handleAddNewRow(false)}
            className="text-xs text-stone-600 hover:text-stone-800 font-bold flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-3 py-1 border border-stone-200 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={14} />
            <span>Add Optional Item</span>
          </button>
        </div>

        {requestedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
              <thead>
                <tr className="bg-stone-50 text-[9px] uppercase tracking-widest font-bold text-stone-400 border-b border-stone-200/50">
                  <th className="py-2 px-4 w-1/4">Auto-Price catalog dropdown</th>
                  <th className="py-2 px-2">Description / Name</th>
                  <th className="py-2 px-2 w-28 text-right">Lump Sum Price (₹)</th>
                  <th className="py-2 px-4 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {requestedItems.map(item => (
                  <tr key={item.id} className="hover:bg-stone-50/20">
                    <td className="py-3 px-4">
                      <select
                        onChange={e => handleProductSelect(false, item.id, e.target.value)}
                        defaultValue=""
                        className="w-full border border-stone-200 rounded p-1.5 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-medium text-stone-600"
                      >
                        <option value="" disabled>-- Select Catalog Product --</option>
                        {rateCard.map(r => (
                          <option key={r.id} value={r.id}>
                            [{r.category}] {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleItemFieldChange(false, item.id, 'description', e.target.value)}
                        placeholder="Enter item description..."
                        className="w-full border border-stone-200 rounded p-1.5 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-bold text-stone-700"
                      />
                    </td>
                    <td className="py-3 px-2 text-right w-40 min-w-[150px]">
                      <div className="relative w-36 ml-auto">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-stone-400 text-[10px] pointer-events-none">₹</span>
                        <input
                          type="number"
                          value={item.amount || ''}
                          onChange={e => handleItemFieldChange(false, item.id, 'amount', Number(e.target.value))}
                          placeholder="0"
                          className="w-full pl-6 pr-2 py-1.5 border border-stone-200 rounded text-xs text-right font-bold focus:outline-none focus:border-[#b8873b] bg-white text-stone-700 font-mono"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRemoveRow(false, item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-stone-400 italic text-xs">
            No supplementary or optional works currently added.
          </div>
        )}
      </div>

      {/* CORE SPECIFICATIONS & TERMS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Specifications List */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 border-b border-stone-100 pb-2">Material Specifications</h3>
          
          <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
            {specifications.map((spec, idx) => (
              <div key={idx} className="flex justify-between items-center gap-3 p-1.5 bg-stone-50 rounded border border-stone-100 hover:bg-stone-100/30">
                <input
                  type="text"
                  value={spec}
                  onChange={e => {
                    const updated = [...specifications];
                    updated[idx] = e.target.value;
                    setSpecifications(updated);
                  }}
                  className="text-xs text-stone-700 bg-transparent flex-1 border-0 focus:ring-0 focus:outline-none p-1 font-medium"
                />
                <button
                  onClick={() => handleRemoveSpec(idx)}
                  className="text-stone-400 hover:text-red-600 transition-colors p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSpec}
              onChange={e => setNewSpec(e.target.value)}
              placeholder="Add new material specification..."
              className="flex-1 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
            <button
              onClick={handleAddSpec}
              className="bg-[#1f352b] hover:bg-[#2c493c] text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
            >
              Add
            </button>
          </div>
        </div>

        {/* Terms & Conditions List */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 border-b border-stone-100 pb-2">Terms & Conditions</h3>
          
          <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
            {terms.map((term, idx) => (
              <div key={idx} className="flex justify-between items-center gap-3 p-1.5 bg-stone-50 rounded border border-stone-100 hover:bg-stone-100/30">
                <span className="text-xs text-stone-400 font-bold pl-1.5">{idx + 1}.</span>
                <input
                  type="text"
                  value={term}
                  onChange={e => {
                    const updated = [...terms];
                    updated[idx] = e.target.value;
                    setTerms(updated);
                  }}
                  className="text-xs text-stone-700 bg-transparent flex-1 border-0 focus:ring-0 focus:outline-none p-1 font-medium"
                />
                <button
                  onClick={() => handleRemoveTerm(idx)}
                  className="text-stone-400 hover:text-red-600 transition-colors p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTerm}
              onChange={e => setNewTerm(e.target.value)}
              placeholder="Add new contract clause..."
              className="flex-1 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
            />
            <button
              onClick={handleAddTerm}
              className="bg-[#1f352b] hover:bg-[#2c493c] text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Specific bank details override */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-8">
        <button
          type="button"
          onClick={() => setShowBankOverride(!showBankOverride)}
          className="w-full flex justify-between items-center text-left text-xs font-bold text-stone-400 uppercase tracking-widest"
        >
          <span>Quotation Bank Remittance Details (Override Defaults)</span>
          <ChevronDown size={14} className={`transform transition-transform duration-200 ${showBankOverride ? 'rotate-180' : ''}`} />
        </button>
        
        {showBankOverride && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-100">
            <label className="flex flex-col gap-1.5 col-span-1 md:col-span-3">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Beneficiary Account Name</span>
              <input
                type="text"
                value={bankDetails.accountName}
                onChange={e => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-semibold text-stone-700"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Bank Name</span>
              <input
                type="text"
                value={bankDetails.bankName}
                onChange={e => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Account Number</span>
              <input
                type="text"
                value={bankDetails.accountNumber}
                onChange={e => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                className="border border-stone-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">IFSC Code</span>
              <input
                type="text"
                value={bankDetails.ifscCode}
                onChange={e => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                className="border border-stone-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
              />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Bank Branch</span>
              <input
                type="text"
                value={bankDetails.branch}
                onChange={e => setBankDetails(prev => ({ ...prev, branch: e.target.value }))}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">UPI Address (Optional)</span>
              <input
                type="text"
                value={bankDetails.upiId}
                onChange={e => setBankDetails(prev => ({ ...prev, upiId: e.target.value }))}
                className="border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-[#b8873b] bg-white font-mono text-stone-700"
              />
            </label>
          </div>
        )}
      </div>

      {/* ESTIMATE FINANCIALS & PAYMENT SCHEDULE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-start">
        
        {/* Milestone Payment Percentages */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 md:col-span-2">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 border-b border-stone-100 pb-2">
            Payment Schedule (Milestones)
          </h3>
          
          <div className="space-y-3">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2.5 last:border-0 last:pb-0">
                <input
                  type="text"
                  value={milestone.milestone}
                  onChange={e => handleMilestoneNameChange(idx, e.target.value)}
                  className="text-xs font-semibold text-stone-700 bg-transparent flex-1 border border-stone-200 rounded p-1.5 focus:outline-none focus:border-[#b8873b] bg-white"
                />
                
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={milestone.percentage}
                    onChange={e => handleMilestonePercentChange(idx, Number(e.target.value))}
                    className="w-12 border border-stone-200 rounded p-1.5 text-center font-bold text-xs focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
                  />
                  <span className="text-stone-400 text-xs"><Percent size={12} /></span>
                </div>

                <span className="w-24 text-right text-xs font-mono font-bold text-[#1f352b]">
                  ₹{milestone.amount.toLocaleString('en-IN')}
                </span>
                
                <button
                  onClick={() => handleRemoveMilestone(idx)}
                  className="text-stone-400 hover:text-red-600 transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-dashed border-stone-200">
            <button
              type="button"
              onClick={handleAddMilestone}
              className="text-xs text-[#b8873b] hover:text-[#a37632] font-bold flex items-center gap-1 bg-white hover:bg-stone-50 px-3 py-1.5 border border-stone-200 rounded-lg shadow-sm transition-colors"
            >
              <Plus size={12} />
              <span>Add Milestone</span>
            </button>

            <div className="text-xs">
              <span className="font-bold text-stone-500">Total: </span>
              <strong className={`font-black px-2 py-0.5 rounded ${milestones.reduce((s, m) => s + m.percentage, 0) === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {milestones.reduce((sum, m) => sum + m.percentage, 0)}% (Required: 100%)
              </strong>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">
            Pricing Summary
          </h3>

          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-stone-500">Subtotal</span>
            <strong className="text-stone-800 font-bold font-mono">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>

          {/* Discount Input */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-stone-500">Discount (₹)</span>
            <input
              type="number"
              value={discount || ''}
              onChange={e => setDiscount(Number(e.target.value))}
              placeholder="0"
              className="w-28 border border-stone-200 rounded p-1 text-right font-bold text-xs focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
            />
          </div>

          {/* GST Toggle and Edit percentage */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-stone-500">Add GST</span>
            <input
              type="checkbox"
              checked={isGstEnabled}
              onChange={e => setIsGstEnabled(e.target.checked)}
              className="w-4 h-4 text-[#1f352b] border-stone-300 rounded focus:ring-[#b8873b]"
            />
          </div>

          <div className="flex justify-between items-center text-xs border-b border-stone-100 pb-3">
            <span className="font-bold text-stone-500">GST Rate (%)</span>
            <input
              type="number"
              value={gstPercentage}
              disabled={!isGstEnabled}
              onChange={e => setGstPercentage(Number(e.target.value))}
              className="w-20 border border-stone-200 rounded p-1 text-right font-bold text-xs focus:outline-none focus:border-[#b8873b] bg-white disabled:bg-stone-100 text-stone-700"
            />
          </div>

          {isGstEnabled && (
            <div className="flex justify-between items-center text-xs text-stone-500">
              <span>GST Value</span>
              <span className="font-mono">₹{totals.gstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="pt-3 flex justify-between items-center text-[#1f352b]">
            <span className="font-black text-xs uppercase">Grand Total</span>
            <strong className="text-xl font-serif font-black font-mono">
              ₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

      </div>

      {/* INTERNAL ESTIMATE COSTING & MARGIN CALCULATOR */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-8">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 border-b border-stone-100 pb-2 flex justify-between items-center">
          <span>Internal Project Costing & Margin Analysis (Strictly Confidential)</span>
          <span className="text-[10px] text-red-500 font-bold uppercase">For Studio Eyes Only</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cost Items Grid */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-xs text-stone-500">
              <span className="font-bold uppercase text-[9px]">Manufacturing Materials Cost (Plywood/Laminates)</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 font-mono">₹</span>
                <input
                  type="number"
                  value={costing.manufacturingCost || ''}
                  onChange={e => setCosting(prev => ({ ...prev, manufacturingCost: Number(e.target.value) }))}
                  className="w-full pl-7 pr-2 py-2 border border-stone-200 rounded-lg font-bold font-mono focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-stone-500">
              <span className="font-bold uppercase text-[9px]">Hardware & Fitting Cost (Hettich/Blum/Ebco)</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 font-mono">₹</span>
                <input
                  type="number"
                  value={costing.hardwareCost || ''}
                  onChange={e => setCosting(prev => ({ ...prev, hardwareCost: Number(e.target.value) }))}
                  className="w-full pl-7 pr-2 py-2 border border-stone-200 rounded-lg font-bold font-mono focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-stone-500">
              <span className="font-bold uppercase text-[9px]">Labor & Installation (Factory + Site Assembly)</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 font-mono">₹</span>
                <input
                  type="number"
                  value={costing.laborCost || ''}
                  onChange={e => setCosting(prev => ({ ...prev, laborCost: Number(e.target.value) }))}
                  className="w-full pl-7 pr-2 py-2 border border-stone-200 rounded-lg font-bold font-mono focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-stone-500">
              <span className="font-bold uppercase text-[9px]">Transport, Logistics & Handling</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 font-mono">₹</span>
                <input
                  type="number"
                  value={costing.transportCost || ''}
                  onChange={e => setCosting(prev => ({ ...prev, transportCost: Number(e.target.value) }))}
                  className="w-full pl-7 pr-2 py-2 border border-stone-200 rounded-lg font-bold font-mono focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-stone-500">
              <span className="font-bold uppercase text-[9px]">Designer Commission & Presentation Fees</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 font-mono">₹</span>
                <input
                  type="number"
                  value={costing.designFee || ''}
                  onChange={e => setCosting(prev => ({ ...prev, designFee: Number(e.target.value) }))}
                  className="w-full pl-7 pr-2 py-2 border border-stone-200 rounded-lg font-bold font-mono focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-stone-500">
              <span className="font-bold uppercase text-[9px]">Contingency & Material Buffer</span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 font-mono">₹</span>
                <input
                  type="number"
                  value={costing.contingency || ''}
                  onChange={e => setCosting(prev => ({ ...prev, contingency: Number(e.target.value) }))}
                  className="w-full pl-7 pr-2 py-2 border border-stone-200 rounded-lg font-bold font-mono focus:outline-none focus:border-[#b8873b] bg-white text-stone-700"
                />
              </div>
            </label>
          </div>

          {/* Margin Analysis Summary Card */}
          {(() => {
            const totalCost = (costing.manufacturingCost || 0) + (costing.hardwareCost || 0) + (costing.laborCost || 0) + (costing.transportCost || 0) + (costing.designFee || 0) + (costing.contingency || 0);
            const proposedSubtotal = totals.subtotal - totals.discountVal;
            const netProfit = proposedSubtotal - totalCost;
            const marginPct = proposedSubtotal > 0 ? (netProfit / proposedSubtotal) * 100 : 0;
            
            let colorClass = 'bg-stone-50 border-stone-200 text-stone-700';
            if (proposedSubtotal > 0) {
              if (marginPct < 15) colorClass = 'bg-red-50 border-red-200 text-red-800';
              else if (marginPct < 25) colorClass = 'bg-amber-50 border-amber-200 text-amber-800';
              else colorClass = 'bg-emerald-50 border-emerald-200 text-emerald-800';
            }

            return (
              <div className={`border p-5 rounded-2xl flex flex-col justify-between ${colorClass}`}>
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-[10px] uppercase tracking-wider block">Real-time Margin Analysis</span>
                  <div className="flex justify-between">
                    <span>Gross Estimate Subtotal:</span>
                    <span className="font-mono font-bold">₹{proposedSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Cost price:</span>
                    <span className="font-mono font-bold">₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-300/30 pt-2 mt-2 font-bold">
                    <span>Projected Net Profit:</span>
                    <span className="font-mono text-sm">₹{netProfit.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-300/30 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold block opacity-70">Estimated Profit Margin</span>
                  <strong className="text-2xl font-serif font-black font-mono">
                    {marginPct.toFixed(1)}%
                  </strong>
                  <div className="text-[9px] mt-1.5 opacity-80 font-medium">
                    {marginPct < 15 ? '⚠️ Warning: Margin below standard (15%).' : marginPct < 25 ? '👍 Safe: Acceptable studio margin.' : '🌟 Excellent: Highly profitable estimate!'}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Editor Actions Bottom Bar */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-stone-200 bg-white rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveQuotation}
          className="px-5 py-2.5 bg-[#1f352b] hover:bg-[#2c493c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
        >
          <Save size={16} />
          <span>Save & Preview</span>
        </button>
      </div>
    </div>
  );
};

export default QuotationForm;
