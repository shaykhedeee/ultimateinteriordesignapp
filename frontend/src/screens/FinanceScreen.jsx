import React, { useState, useEffect, useMemo } from 'react';
import { safeParse } from '../lib/safe.js';
import { computeQuote, buildMilestones, MILESTONE_SCHEDULES } from '../lib/boq.js';
import { computeInvoice, isInterStateSupply, splitGst } from '../lib/invoice.js';
import { 
  Plus, Trash2, Save, X, PlusCircle, ChevronDown, Percent, 
  IndianRupee, FileText, CheckCircle2, ShoppingBag, TrendingUp, 
  Settings as SettingsIcon, Database, LayoutDashboard, CloudUpload,
  ArrowUpRight, AlertTriangle, ShieldCheck, RefreshCw, Printer, Edit3
} from 'lucide-react';

// --- Default Constants ---
const DEFAULT_BANK_DETAILS = {
  accountName: "SPACIOUS VENTURE INTERIOR DESIGN STUDIO",
  bankName: "HDFC Bank",
  accountNumber: "50200095385369",
  ifscCode: "HDFC0001953",
  branch: "Sarjapur Road, Bangalore",
  upiId: "spaciousventure@hdfcbank"
};

const DEFAULT_COMPANY_PROFILE = {
  name: "SPACIOUS VENTURE",
  tagline: "Factory-Direct Interior Studio",
  address: "Sulikunte Road, Sarjapur, Bengaluru, Karnataka 560099",
  phone: "+91 95385 36950",
  email: "info@spaciousventure.com",
  website: "www.spaciousventure.com",
  gstNo: "29AAGCS9538Q1Z2",
  logo: "",
  signature: "",
  bankDetails: DEFAULT_BANK_DETAILS
};

const DEFAULT_SPECS = [
  "Carcass/Core: 18mm BWP (Boiling Water Proof) Marine Plywood for all wet areas (Kitchen & Vanity) and 18mm BWR Plywood for wardrobes.",
  "Cabinet Backings: 8mm BWP Plywood backing for all cabinets, mechanically fastened and silicone-sealed.",
  "Shutters/Finish: 1.2mm Scratch-Resistant Acrylic for Kitchen and 1.0mm Glossy/Matte Premium Laminates for wardrobes.",
  "Hardware & Hinges: 3-way adjustable heavy-duty German Soft-Close Hinges by HETTICH or HAFELE.",
  "Edge-Banding: 2.0mm thickness moisture-resistant PVC Edge Banding machine-applied at 200°C.",
  "Warranty & Support: 10-Year structural warranty against manufacturing defects."
];

const DEFAULT_TERMS = [
  "Manufacturer Pricing: All prices are factory-direct from our Sarjapur unit. No showroom markups.",
  "Validity: This quotation is valid for 15 days from the date of issue.",
  "Basis of Quote: This estimate is subject to revision based on actual site measurements.",
  "GST & Taxes: Quoted prices are exclusive of GST. GST @ 18% will be added to the final invoice.",
  "Payment Terms: 10% booking fee, 50% before production, 35% on dispatch, 5% on handover."
];

const DEFAULT_RATE_ITEMS = [
  { id: "r-foyer-shoerack", category: "Foyer", name: "Foyer Shoe Rack (With cushioned seating)", defaultDimensions: "4 x 3", defaultRate: 1450, rateType: "SQFT", defaultUnit: "Sqft", defaultMaterial: "BWR Plywood", defaultFinish: "1.0mm Matte Laminate", defaultHardware: "Hettich soft-close hinges" },
  { id: "r-foyer-partition", category: "Foyer", name: "CNC Jali Partition & Decorative Panel", defaultDimensions: "4 x 8", defaultRate: 1650, rateType: "SQFT", defaultUnit: "Sqft", defaultMaterial: "18mm MDF", defaultFinish: "Duco Paint / Polish", defaultHardware: "L-clamps & fasteners" },
  { id: "r-living-tvunit", category: "Living", name: "Modern Suspended TV Console Unit", defaultDimensions: "6 x 4", defaultRate: 1850, rateType: "SQFT", defaultUnit: "Sqft", defaultMaterial: "BWR Plywood", defaultFinish: "High Gloss Laminate & Charcoal Louvers", defaultHardware: "Soft-close channels & cable manager" },
  { id: "r-kitchen-base", category: "Kitchen", name: "Kitchen Base Cabinet (BWP Marine Plywood)", defaultDimensions: "8 x 2.75", defaultRate: 2450, rateType: "SQFT", defaultUnit: "Sqft", defaultMaterial: "18mm BWP Plywood", defaultFinish: "1.2mm Scratch-Resistant Acrylic", defaultHardware: "Hettich InnoTech tandem runners" },
  { id: "r-kitchen-wall", category: "Kitchen", name: "Kitchen Wall Cabinet (Hydraulic lift up)", defaultDimensions: "8 x 2", defaultRate: 1650, rateType: "SQFT", defaultUnit: "Sqft", defaultMaterial: "18mm BWR Plywood", defaultFinish: "Glossy Laminate / Glass shutters", defaultHardware: "Blum Aventos lift system" },
  { id: "r-bed-wardrobe", category: "Bedroom", name: "Sliding Wardrobe (Floor-to-ceiling)", defaultDimensions: "6 x 9", defaultRate: 2150, rateType: "SQFT", defaultUnit: "Sqft", defaultMaterial: "18mm BWR Plywood", defaultFinish: "1.0mm Matte & Mirror combination", defaultHardware: "Heavy sliding track with soft-closer" },
  { id: "r-bed-loft", category: "Bedroom", name: "Overhead Loft Storage", defaultDimensions: "6 x 2.5", defaultRate: 1150, rateType: "SQFT", defaultUnit: "Sqft", defaultMaterial: "18mm BWR Plywood", defaultFinish: "Laminate matching wardrobe", defaultHardware: "Standard soft-close hinges" },
  { id: "r-utility-vanity", category: "Utility", name: "Bathroom Mirror Vanity Casing", defaultDimensions: "2.5 x 2.5", defaultRate: 1550, rateType: "SQFT", defaultUnit: "Sqft", defaultMaterial: "18mm BWP Marine Plywood", defaultFinish: "Matte PU / Acrylic Shutter", defaultHardware: "SS-304 anti-corrosive hinges" }
];

const CATEGORIES = ["Foyer", "Living", "Kitchen", "Bedroom", "Utility", "Other"];

export default function FinanceScreen({ projectId }) {
  const [activeSubTab, setActiveSubTab] = useState('quote_builder');

  // --- Global States ---
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // --- Transactions View States (Invoices, PO, VO) ---
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [variations, setVariations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  
  // Form Inputs for Transactions
  const [paymentAmount, setPaymentAmount] = useState('150000');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [variationDesc, setVariationDesc] = useState('Upgrade wardrobe shutters to acrylic finish');
  const [variationCost, setVariationCost] = useState('35000');
  const [poVendor, setPoVendor] = useState('Greenlam Laminates India');
  const [poAmount, setPoAmount] = useState('45000');

  // --- Invoice Builder State (itemized GST invoice) ---
  const [invoiceItems, setInvoiceItems] = useState([
    { description: 'Modular woodwork fabrication charge', hsn: '9403', qty: 1, rate: 150000, amount: 150000 }
  ]);
  const [invoiceClientName, setInvoiceClientName] = useState('');
  const [invoiceClientAddress, setInvoiceClientAddress] = useState('');
  const [invoiceClientGstin, setInvoiceClientGstin] = useState('');
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [invoiceGstRate, setInvoiceGstRate] = useState(18);
  const [invoiceIsGst, setInvoiceIsGst] = useState(true);
  const [invoiceInterState, setInvoiceInterState] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');

  // Live GST invoice totals
  const invoiceCalc = useMemo(
    () => computeInvoice({
      items: invoiceItems,
      discount: invoiceDiscount,
      isGstEnabled: invoiceIsGst,
      gstRate: invoiceGstRate,
      isInterState: invoiceInterState
    }),
    [invoiceItems, invoiceDiscount, invoiceIsGst, invoiceGstRate, invoiceInterState]
  );

  // --- Company Settings (Persists in LocalStorage) ---
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('sv_company_profile');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_PROFILE;
    } catch {
      return DEFAULT_COMPANY_PROFILE;
    }
  });

  // --- Rate Card State (Persists in LocalStorage) ---
  const [rateCard, setRateCard] = useState(() => {
    try {
      const saved = localStorage.getItem('sv_rate_card');
      return saved ? JSON.parse(saved) : DEFAULT_RATE_ITEMS;
    } catch {
      return DEFAULT_RATE_ITEMS;
    }
  });

  // --- Quotation Builder State (Linked to Project via API) ---
  const [quoteItems, setQuoteItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [quoteDuration, setQuoteDuration] = useState('40 Working Days');
  const [specifications, setSpecifications] = useState(DEFAULT_SPECS);
  const [terms, setTerms] = useState(DEFAULT_TERMS);

  // New item inputs
  const [newItemRoom, setNewItemRoom] = useState('Living Room');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDims, setNewItemDims] = useState('6 x 4');
  const [newItemRate, setNewItemRate] = useState(1850);
  const [newItemLump, setNewItemLump] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState('Living');

  const [newSpec, setNewSpec] = useState('');
  const [newTerm, setNewTerm] = useState('');

  // Save Settings & Rate card back to localStorage
  useEffect(() => {
    localStorage.setItem('sv_company_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('sv_rate_card', JSON.stringify(rateCard));
  }, [rateCard]);

  // Load project details and transaction lists
  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resProj, resInvoices, resPayments, resVariations, resPOs, resQuotation] = await Promise.all([
        fetch(`http://127.0.0.1:5055/api/projects/${projectId}`),
        fetch(`http://127.0.0.1:5055/api/projects/${projectId}/invoices`),
        fetch(`http://127.0.0.1:5055/api/projects/${projectId}/payments`),
        fetch(`http://127.0.0.1:5055/api/projects/${projectId}/variation-orders`),
        fetch(`http://127.0.0.1:5055/api/projects/${projectId}/purchase-orders`),
        fetch(`http://127.0.0.1:5055/api/projects/${projectId}/quotation`)
      ]);

      const proj = await resProj.json();
      setProject(proj);

      setInvoices(await resInvoices.json());
      setPayments(await resPayments.json());
      setVariations(await resVariations.json());
      setPurchaseOrders(await resPOs.json());

      const quoteData = await resQuotation.json();
      if (quoteData && quoteData.quotation_json) {
        const q = safeParse(quoteData?.quotation_json, {});
        setQuoteItems(q.items || []);
        setDiscount(q.discount || 0);
        setIsGstEnabled(q.isGstEnabled !== false);
        setGstPercentage(q.gstPercentage || 18);
        setQuoteDuration(q.projectDuration || '40 Working Days');
        setSpecifications(q.specifications || DEFAULT_SPECS);
        setTerms(q.terms || DEFAULT_TERMS);
      } else {
        // Fallback or empty layout
        setQuoteItems([]);
        setDiscount(0);
        setIsGstEnabled(true);
        setSpecifications(DEFAULT_SPECS);
        setTerms(DEFAULT_TERMS);
      }
    } catch (err) {
      console.error("Error loading financial data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Quotation Calculations (shared single source of truth) ---
  const { subTotal, taxable: taxableTotal, gstValue, grandTotal } = useMemo(
    () => computeQuote({ items: quoteItems, discount, isGstEnabled, gstRate: gstPercentage }),
    [quoteItems, discount, isGstEnabled, gstPercentage]
  );

  const paymentMilestones = useMemo(
    () => buildMilestones(grandTotal, MILESTONE_SCHEDULES.finance),
    [grandTotal]
  );

  // Add Item to Quotation
  const handleAddQuoteItem = () => {
    if (!newItemName) return;

    let sqft = 1.0;
    let dimensions = 'Lump Sum';

    if (!newItemLump) {
      const parts = newItemDims.split('x').map(p => p.trim());
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (!isNaN(w) && !isNaN(h)) {
        sqft = w * h;
        dimensions = `${w} x ${h} ft`;
      }
    }

    const rate = parseFloat(newItemRate) || 0;
    const amount = Math.round(sqft * rate);

    const newItem = {
      id: 'qi_' + Math.random().toString(36).substr(2, 5),
      room: newItemRoom,
      name: newItemName,
      dimensions,
      sqft,
      rate,
      amount,
      isLumpSum: newItemLump,
      category: newItemCategory
    };

    setQuoteItems(prev => [...prev, newItem]);
    setNewItemName('');
  };

  const handleSelectCatalogItem = (rateId) => {
    const rateItem = rateCard.find(r => r.id === rateId);
    if (!rateItem) return;

    setNewItemName(rateItem.name);
    setNewItemDims(rateItem.defaultDimensions);
    setNewItemRate(rateItem.defaultRate);
    setNewItemLump(rateItem.rateType === 'LUMPSUM');
    setNewItemCategory(rateItem.category);
  };

  const handleDeleteQuoteItem = (id) => {
    setQuoteItems(prev => prev.filter(i => i.id !== id));
  };

  // Save Quotation to API
  const handleSaveQuotation = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation: {
            items: quoteItems,
            discount,
            isGstEnabled,
            gstPercentage,
            milestones: paymentMilestones,
            subTotal,
            gstValue,
            grandTotal,
            projectDuration: quoteDuration,
            specifications,
            terms
          }
        })
      });

      // Synchronize back-end estimates sets
      await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/estimate-sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateType: 'concept',
          totals: { subtotal: subTotal, taxTotal: gstValue, grandTotal },
          items: quoteItems.map(qi => ({
            lineCode: qi.id,
            category: qi.category || 'modular_unit',
            description: `[${qi.room}] ${qi.name}`,
            quantity: 1,
            uom: qi.isLumpSum ? 'lot' : 'sqft',
            lineTotal: qi.amount
          }))
        })
      });

      if (res.ok) {
        showStatusMessage("Quotation & BOQ Estimate synchronized successfully!", 'success');
        loadData();
      }
    } catch (err) {
      console.error(err);
      showStatusMessage("Failed to save quotation", 'error');
    }
  };

  // Export PDF
  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/quotation/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation: {
            items: quoteItems,
            discount,
            isGstEnabled,
            gstPercentage,
            milestones: paymentMilestones,
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
      a.download = `ULTIDA-Quotation-${projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-fill invoice from the current quotation (links pricing to the quote)
  const handleFillInvoiceFromQuote = () => {
    if (quoteItems.length === 0) {
      showStatusMessage('Add line items to the quotation first', 'error');
      return;
    }
    setInvoiceItems(quoteItems.map(qi => ({
      description: `[${qi.room || 'General'}] ${qi.name}`,
      hsn: '9403',
      qty: qi.isLumpSum ? 1 : (qi.sqft ? 1 : 1),
      rate: qi.isLumpSum ? qi.amount : Math.round((qi.amount || 0)),
      amount: qi.amount
    })));
    setInvoiceDiscount(discount);
    setInvoiceIsGst(isGstEnabled);
    setInvoiceGstRate(gstPercentage);
    showStatusMessage('Invoice pre-filled from quotation', 'success');
  };

  // --- Transactions API Operations ---
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: invoiceItems,
          description: invoiceItems[0]?.description || 'Invoice',
          discount: Number(invoiceDiscount) || 0,
          isGstEnabled: invoiceIsGst,
          gstRate: Number(invoiceGstRate) || 18,
          isInterState: invoiceInterState,
          clientName: invoiceClientName,
          clientAddress: invoiceClientAddress,
          clientGstin: invoiceClientGstin,
          dueDate: invoiceDueDate,
          issueDate: new Date().toISOString().slice(0, 10),
          supplier: {
            name: profile.name,
            address: profile.address,
            gstNo: profile.gstNo,
            bankDetails: profile.bankDetails
          }
        })
      });
      if (res.ok) {
        showStatusMessage("Tax invoice issued successfully!", 'success');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Download a GST tax-invoice PDF for a given invoice id
  const handleDownloadInvoicePDF = async (invoiceId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/invoices/${invoiceId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier: { name: profile.name, address: profile.address, gstNo: profile.gstNo, bankDetails: profile.bankDetails } })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ULTIDA-TaxInvoice-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel / void a tax invoice (GST compliance — never hard-delete a numbered invoice)
  const handleCancelInvoice = async (invoiceId, invoiceNumber) => {
    if (!window.confirm(`Cancel tax invoice ${invoiceNumber}? It will be marked CANCELLED (not deleted) and excluded from ageing.`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/invoices/${invoiceId}/cancel`, { method: 'POST' });
      if (res.ok) {
        showStatusMessage(`Invoice ${invoiceNumber} cancelled`, 'success');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showStatusMessage(err.error || 'Could not cancel invoice', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const allocations = selectedInvoiceId ? [{ invoiceId: selectedInvoiceId, amount: parseFloat(paymentAmount) || 0 }] : [];
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paymentMethod,
          allocations
        })
      });
      if (res.ok) {
        showStatusMessage("Receipt payment logged successfully!", 'success');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVariation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/variation-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: variationDesc,
          costDelta: parseFloat(variationCost)
        })
      });
      if (res.ok) {
        showStatusMessage("Variation order registered!", 'success');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/projects/${projectId}/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: poVendor,
          grandTotal: parseFloat(poAmount)
        })
      });
      if (res.ok) {
        showStatusMessage("Vendor PO dispatched successfully!", 'success');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helpers
  const showStatusMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleLogoUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfile(prev => ({ ...prev, [field]: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateRate = (id, field, value) => {
    setRateCard(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddRateCardItem = (category) => {
    const newItem = {
      id: 'r_new_' + Math.random().toString(36).substr(2, 5),
      category,
      name: 'New Custom Item',
      defaultDimensions: '6 x 3',
      defaultRate: 1500,
      rateType: 'SQFT',
      defaultUnit: 'Sqft',
      defaultMaterial: 'BWR Plywood',
      defaultFinish: '1.0mm Laminate',
      defaultHardware: 'Soft-close hinges'
    };
    setRateCard(prev => [...prev, newItem]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0A0A0B] text-[#F0EEE8]">
      
      {/* ── Sub-navigation Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between border-b border-stone-850 px-6 py-4 bg-[#111113]">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-[#C9A84C]" />
          <div>
            <h1 className="text-sm font-black tracking-wider text-slate-100 uppercase">ULTIDA Commerce Center</h1>
            <p className="text-[10px] text-[#8A8899]">Manage quotations, billing schedules, vendor procurement, and rate catalogs</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0A0A0B] p-1 rounded-xl border border-stone-800">
          {[
            { id: 'quote_builder', label: 'Quotation Workspace', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'transactions', label: 'Invoices & POs', icon: <IndianRupee className="w-3.5 h-3.5" /> },
            { id: 'rate_manager', label: 'Rate Catalog', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'company_settings', label: 'Company Settings', icon: <SettingsIcon className="w-3.5 h-3.5" /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                activeSubTab === t.id 
                  ? 'bg-[#C9A84C] text-slate-950 shadow-md font-bold' 
                  : 'text-[#8A8899] hover:text-[#F0EEE8] hover:bg-stone-900/60'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Status Messages */}
      {message && (
        <div className={`p-3 text-xs font-bold text-center border-b flex items-center justify-center gap-2 transition ${
          message.type === 'error' ? 'bg-red-950/40 border-red-900/40 text-red-300' : 'bg-emerald-950/40 border-emerald-900/40 text-emerald-300'
        }`}>
          {message.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Main Tab Scroll Workspace ── */}
      <main className="flex-grow overflow-y-auto p-6 min-h-0">
        
        {/* TAB 1: QUOTATION WORKSPACE */}
        {activeSubTab === 'quote_builder' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Col: Builder spreadsheet */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                  <h3 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider">Itemized Line Items</h3>
                  
                  {/* Auto fill dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8A8899] font-bold">Pick Template:</span>
                    <select
                      onChange={(e) => handleSelectCatalogItem(e.target.value)}
                      defaultValue=""
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg px-2.5 py-1 text-[11px] text-[#F0EEE8] outline-none cursor-pointer focus:border-[#C9A84C]"
                    >
                      <option value="" disabled>Choose Catalog Preset...</option>
                      {rateCard.map(rc => (
                        <option key={rc.id} value={rc.id}>{rc.category} — {rc.name} (₹{rc.defaultRate}/{rc.defaultUnit})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-850 text-[#8A8899] uppercase tracking-wider text-[9px] font-bold">
                        <th className="py-2.5">Room</th>
                        <th className="py-2.5">Item Name</th>
                        <th className="py-2.5">Dimensions (W x H ft)</th>
                        <th className="py-2.5">Rate (₹)</th>
                        <th className="py-2.5">Lump Sum</th>
                        <th className="py-2.5 text-right">Amount (₹)</th>
                        <th className="py-2.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {quoteItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-stone-600 italic">No line items added. Select a template preset above or add a manual row.</td>
                        </tr>
                      ) : (
                        quoteItems.map((item) => (
                          <tr key={item.id} className="hover:bg-stone-900/20">
                            <td className="py-2">
                              <input
                                type="text"
                                value={item.room}
                                onChange={(e) => {
                                  const updated = quoteItems.map(qi => qi.id === item.id ? { ...qi, room: e.target.value } : qi);
                                  setQuoteItems(updated);
                                }}
                                className="bg-transparent text-[#F0EEE8] outline-none w-24 border-b border-transparent focus:border-[#C9A84C] py-0.5"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = quoteItems.map(qi => qi.id === item.id ? { ...qi, name: e.target.value } : qi);
                                  setQuoteItems(updated);
                                }}
                                className="bg-transparent text-[#F0EEE8] outline-none w-44 border-b border-transparent focus:border-[#C9A84C] py-0.5"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="text"
                                value={item.dimensions}
                                disabled={item.isLumpSum}
                                onChange={(e) => {
                                  const updated = quoteItems.map(qi => {
                                    if (qi.id === item.id) {
                                      const parts = e.target.value.split('x').map(p => p.trim());
                                      const w = parseFloat(parts[0]);
                                      const h = parseFloat(parts[1]);
                                      const sqft = (!isNaN(w) && !isNaN(h)) ? w * h : 1;
                                      return { ...qi, dimensions: e.target.value, sqft, amount: Math.round(sqft * qi.rate) };
                                    }
                                    return qi;
                                  });
                                  setQuoteItems(updated);
                                }}
                                className="bg-transparent text-[#F0EEE8] outline-none w-20 border-b border-transparent focus:border-[#C9A84C] py-0.5"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => {
                                  const rate = parseFloat(e.target.value) || 0;
                                  const updated = quoteItems.map(qi => qi.id === item.id ? { ...qi, rate, amount: Math.round(qi.isLumpSum ? rate : qi.sqft * rate) } : qi);
                                  setQuoteItems(updated);
                                }}
                                className="bg-transparent text-[#F0EEE8] font-mono outline-none w-16 border-b border-transparent focus:border-[#C9A84C] py-0.5"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="checkbox"
                                checked={item.isLumpSum}
                                onChange={(e) => {
                                  const isLump = e.target.checked;
                                  const updated = quoteItems.map(qi => {
                                    if (qi.id === item.id) {
                                      return { ...qi, isLumpSum: isLump, amount: isLump ? qi.rate : Math.round(qi.sqft * qi.rate) };
                                    }
                                    return qi;
                                  });
                                  setQuoteItems(updated);
                                }}
                                className="w-3.5 h-3.5 text-[#C9A84C] accent-[#C9A84C] bg-stone-900 border-stone-800 rounded focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-slate-200">
                              ₹{item.amount?.toLocaleString()}
                            </td>
                            <td className="py-2 text-center">
                              <button onClick={() => handleDeleteQuoteItem(item.id)} className="text-red-400 hover:text-red-300 p-1 rounded transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Row Controls */}
                <div className="bg-[#0A0A0B] p-4 rounded-xl border border-stone-850 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Room (e.g. Master Bedroom)"
                    value={newItemRoom}
                    onChange={e => setNewItemRoom(e.target.value)}
                    className="flex-grow bg-[#111113] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Furniture Item Description"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="flex-grow bg-[#111113] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Width x Height ft"
                    value={newItemDims}
                    disabled={newItemLump}
                    onChange={e => setNewItemDims(e.target.value)}
                    className="w-28 bg-[#111113] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Rate"
                    value={newItemRate}
                    onChange={e => setNewItemRate(e.target.value)}
                    className="w-24 bg-[#111113] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#8A8899]">
                    <input
                      type="checkbox"
                      checked={newItemLump}
                      onChange={e => setNewItemLump(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#C9A84C] accent-[#C9A84C] bg-stone-900 border-stone-800 rounded"
                    />
                    <span>Lump Sum</span>
                  </label>
                  <button onClick={handleAddQuoteItem} className="px-4 py-2 bg-[#C9A84C] hover:bg-[#AA8C2C] text-slate-950 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>
              </div>

              {/* Terms and Specifications Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Specifications Column */}
                <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider border-b border-stone-850 pb-2">Material Specifications</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {specifications.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2 bg-[#0A0A0B] p-2.5 rounded-lg border border-stone-850 text-[11px] text-[#8A8899]">
                        <span className="flex-1 leading-relaxed">{s}</span>
                        <button onClick={() => setSpecifications(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 p-0.5 rounded hover:bg-stone-900">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add technical specification..."
                      value={newSpec}
                      onChange={e => setNewSpec(e.target.value)}
                      className="flex-grow bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none"
                    />
                    <button onClick={() => { if (newSpec) { setSpecifications(prev => [...prev, newSpec]); setNewSpec(''); } }} className="px-3 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-[#F0EEE8] rounded-lg text-xs font-bold font-mono">+</button>
                  </div>
                </div>

                {/* Terms Column */}
                <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider border-b border-stone-850 pb-2">Terms & Conditions</h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {terms.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2 bg-[#0A0A0B] p-2.5 rounded-lg border border-stone-850 text-[11px] text-[#8A8899]">
                        <span className="flex-1 leading-relaxed">{t}</span>
                        <button onClick={() => setTerms(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 p-0.5 rounded hover:bg-stone-900">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add legal term..."
                      value={newTerm}
                      onChange={e => setNewTerm(e.target.value)}
                      className="flex-grow bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none"
                    />
                    <button onClick={() => { if (newTerm) { setTerms(prev => [...prev, newTerm]); setNewTerm(''); } }} className="px-3 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-[#F0EEE8] rounded-lg text-xs font-bold font-mono">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Totals summary, milestones, and save actions */}
            <div className="space-y-6">
              
              {/* Financial Calculation Panel */}
              <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider border-b border-stone-850 pb-2">Quotation Summary</h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#8A8899]">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{subTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#8A8899]">
                    <span>Discount (INR):</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-[#0A0A0B] border border-stone-800 rounded px-2 py-1 text-right text-xs text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[#8A8899]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGstEnabled}
                        onChange={e => setIsGstEnabled(e.target.checked)}
                        className="w-3.5 h-3.5 text-[#C9A84C] accent-[#C9A84C] bg-stone-900 border-stone-800 rounded"
                      />
                      <span>Apply GST Tax ({gstPercentage}%):</span>
                    </label>
                    <span className="font-mono">₹{gstValue.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-stone-800 pt-3 flex justify-between text-sm font-bold">
                    <span className="text-[#F0EEE8]">Grand Total (incl. tax):</span>
                    <span className="text-[#C9A84C] font-mono">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Duration Config */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#8A8899] font-semibold">Delivery Timeline:</span>
                  <input
                    type="text"
                    value={quoteDuration}
                    onChange={e => setQuoteDuration(e.target.value)}
                    className="w-40 bg-[#0A0A0B] border border-stone-800 rounded px-2 py-1 text-right text-xs text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                  />
                </div>

                {/* Project Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={handleSaveQuotation} className="py-2.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-[#F0EEE8] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition">
                    <Save className="w-4 h-4" /> Save Quote
                  </button>
                  <button onClick={handleDownloadPDF} className="py-2.5 bg-[#C9A84C] hover:bg-[#AA8C2C] text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition">
                    <Printer className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>

              {/* Milestone Breakdowns */}
              <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider border-b border-stone-850 pb-2">Milestone Payments Schedule</h3>
                
                <div className="space-y-3">
                  {paymentMilestones.map((ms, idx) => (
                    <div key={idx} className="bg-[#0A0A0B] border border-stone-850 p-3 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300">{ms.stage}</span>
                        <span className="bg-[#C9A84C]/10 text-[#C9A84C] font-black border border-[#C9A84C]/25 px-2 py-0.5 rounded text-[10px]">{ms.percentage}%</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[#8A8899]">
                        <span>Milestone billing amount:</span>
                        <strong className="font-mono text-slate-200">₹{ms.amount.toLocaleString()}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTIONS & INVOICES */}
        {activeSubTab === 'transactions' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Issuing & List Invoices */}
            <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider border-b border-stone-850 pb-2">Issued Invoices</h3>
              
              {invoices.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex justify-between items-center text-xs bg-[#0A0A0B] p-3 rounded-xl border border-stone-850">
                      <div className="min-w-0">
                        <strong className="text-slate-300 block">{inv.invoiceNumber}</strong>
                        <span className="text-[10px] text-stone-500 truncate block max-w-[160px]">{inv.description}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${inv.status === 'paid' ? 'text-emerald-400' : inv.status === 'partial' ? 'text-sky-400' : 'text-amber-500'}`}>
                          {inv.status}{inv.balanceDue > 0 ? ` · due ₹${inv.balanceDue.toLocaleString()}` : ''}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="font-bold text-[#F0EEE8] font-mono">₹{inv.grandTotal?.toLocaleString()}</div>
                        {inv.cancelled ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-rose-400">CANCELLED</span>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleDownloadInvoicePDF(inv.id)}
                              className="text-[9px] text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/10 rounded px-2 py-0.5 font-bold uppercase tracking-wider transition">
                              PDF
                            </button>
                            <button type="button" onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber)}
                              className="text-[9px] text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 rounded px-2 py-0.5 font-bold uppercase tracking-wider transition">
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-600 text-xs">No client invoices issued yet.</div>
              )}

              <form onSubmit={handleCreateInvoice} className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Itemized Tax Invoice</label>
                  <button type="button" onClick={handleFillInvoiceFromQuote}
                    className="text-[10px] text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/10 rounded px-2 py-1 font-bold uppercase tracking-wider transition">
                    Fill from Quote
                  </button>
                </div>

                {/* Client */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Client Name</label>
                    <input type="text" value={invoiceClientName} onChange={e => setInvoiceClientName(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Client GSTIN (optional)</label>
                    <input type="text" value={invoiceClientGstin} onChange={e => setInvoiceClientGstin(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Client Address</label>
                  <input type="text" value={invoiceClientAddress} onChange={e => setInvoiceClientAddress(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none" />
                </div>

                {/* Line items */}
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_44px_52px_48px_70px_72px_20px] gap-1 text-[9px] text-[#8A8899] font-bold uppercase tracking-wider px-1">
                    <span>Description</span><span className="text-center">Qty</span><span className="text-center">GST%</span><span className="text-center">Rate</span><span className="text-right">Amt</span><span></span>
                  </div>
                  {invoiceItems.map((it, i) => (
                    <div key={i} className="grid grid-cols-[1fr_44px_52px_48px_70px_72px_20px] gap-1 items-center">
                      <input type="text" value={it.description} onChange={e => { const n=[...invoiceItems]; n[i].description=e.target.value; setInvoiceItems(n); }}
                        className="bg-[#0A0A0B] border border-stone-800 rounded p-1.5 text-[11px] text-[#F0EEE8] outline-none" />
                      <input type="number" value={it.qty} onChange={e => { const n=[...invoiceItems]; n[i].qty=Number(e.target.value); n[i].amount=Math.round((Number(e.target.value)||0)*(n[i].rate||0)); setInvoiceItems(n); }}
                        className="bg-[#0A0A0B] border border-stone-800 rounded p-1.5 text-[11px] text-right text-[#F0EEE8] outline-none font-mono" />
                      <select value={it.gstRate != null ? it.gstRate : ''} onChange={e => { const n=[...invoiceItems]; const v=e.target.value===''?undefined:Number(e.target.value); n[i].gstRate=v; const lineAmt=Math.round((n[i].qty||1)*(n[i].rate||0)); n[i].amount=lineAmt; setInvoiceItems(n); }}
                        className="bg-[#0A0A0B] border border-stone-800 rounded p-1.5 text-[11px] text-[#F0EEE8] outline-none font-mono cursor-pointer">
                        <option value="">Auto</option>
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                      <input type="number" value={it.rate} onChange={e => { const n=[...invoiceItems]; n[i].rate=Number(e.target.value); n[i].amount=Math.round((n[i].qty||0)*(Number(e.target.value)||0)); setInvoiceItems(n); }}
                        className="bg-[#0A0A0B] border border-stone-800 rounded p-1.5 text-[11px] text-right text-[#F0EEE8] outline-none font-mono" />
                      <span className="text-[11px] text-right text-[#C9A84C] font-mono pr-1">{(it.amount||0).toLocaleString()}</span>
                      <button type="button" onClick={() => setInvoiceItems(invoiceItems.filter((_, j) => j !== i))}
                        className="text-rose-400 hover:text-rose-300 text-xs">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setInvoiceItems([...invoiceItems, { description: '', hsn: '9403', gstRate: undefined, qty: 1, rate: 0, amount: 0 }])}
                    className="text-[10px] text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/10 rounded px-2 py-1 font-bold uppercase tracking-wider transition w-full">
                    + Add Line
                  </button>
                </div>

                {/* GST + discount controls */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">GST %</label>
                    <select value={invoiceGstRate} onChange={e => setInvoiceGstRate(Number(e.target.value))}
                      className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none">
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Discount ₹</label>
                    <input type="number" value={invoiceDiscount} onChange={e => setInvoiceDiscount(Number(e.target.value))}
                      className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-right text-[#F0EEE8] outline-none font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Due Date</label>
                    <input type="date" value={invoiceDueDate} onChange={e => setInvoiceDueDate(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-1.5 text-xs text-[#F0EEE8] outline-none" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-[#8A8899] cursor-pointer select-none">
                  <input type="checkbox" checked={invoiceInterState} onChange={e => setInvoiceInterState(e.target.checked)}
                    className="accent-[#C9A84C]" />
                  Inter-state supply (apply IGST instead of CGST+SGST)
                </label>

                {/* Live totals */}
                <div className="bg-[#0A0A0B] border border-stone-800 rounded-xl p-3 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between"><span className="text-stone-400">Subtotal</span><span className="text-[#F0EEE8]">₹{invoiceCalc.subTotal.toLocaleString()}</span></div>
                  {invoiceCalc.discount > 0 && <div className="flex justify-between"><span className="text-stone-400">Discount</span><span className="text-rose-400">-₹{invoiceCalc.discount.toLocaleString()}</span></div>}
                  <div className="flex justify-between"><span className="text-stone-400">Taxable</span><span className="text-[#F0EEE8]">₹{invoiceCalc.taxable.toLocaleString()}</span></div>
                  {(invoiceCalc.slabs || []).map(s => {
                    const { cgst: c, sgst: s2, igst: i } = splitGst(s.rate, invoiceCalc.isInterState);
                    if (invoiceCalc.isInterState) return <div key={s.rate} className="flex justify-between"><span className="text-stone-400">IGST @ {s.rate}%</span><span className="text-[#F0EEE8]">₹{Math.round((s.taxable * s.rate) / 100).toLocaleString()}</span></div>;
                    return <div key={s.rate} className="flex justify-between"><span className="text-stone-400">CGST+SGST @ {s.rate}%</span><span className="text-[#F0EEE8]">₹{Math.round((s.taxable * s.rate) / 100).toLocaleString()}</span></div>;
                  })}
                  {invoiceCalc.cgst > 0 && <div className="flex justify-between"><span className="text-stone-400">CGST @ {invoiceCalc.gstRate/2}%</span><span className="text-[#F0EEE8]">₹{invoiceCalc.cgst.toLocaleString()}</span></div>}
                  {invoiceCalc.sgst > 0 && <div className="flex justify-between"><span className="text-stone-400">SGST @ {invoiceCalc.gstRate/2}%</span><span className="text-[#F0EEE8]">₹{invoiceCalc.sgst.toLocaleString()}</span></div>}
                  {invoiceCalc.igst > 0 && <div className="flex justify-between"><span className="text-stone-400">IGST @ {invoiceCalc.gstRate}%</span><span className="text-[#F0EEE8]">₹{invoiceCalc.igst.toLocaleString()}</span></div>}
                  {invoiceCalc.roundOff !== 0 && <div className="flex justify-between"><span className="text-stone-400">Round Off</span><span className="text-[#F0EEE8]">{invoiceCalc.roundOff>0?'+':''}₹{invoiceCalc.roundOff.toFixed(2)}</span></div>}
                  <div className="flex justify-between border-t border-stone-800 pt-1 mt-1"><span className="text-[#C9A84C] font-bold">GRAND TOTAL</span><span className="text-[#C9A84C] font-bold">₹{invoiceCalc.grandTotal.toLocaleString()}</span></div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-[#C9A84C] hover:bg-[#b8963f] text-[#0A0A0B] text-xs font-bold rounded-xl uppercase tracking-wider transition">
                  Issue Tax Invoice (₹{invoiceCalc.grandTotal.toLocaleString()})
                </button>
              </form>
            </div>

            {/* Inflow Payment Receipts */}
            <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider border-b border-stone-850 pb-2">Record Receipt Payments</h3>
              
              {payments.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {payments.map(pay => (
                    <div key={pay.id} className="flex justify-between items-center text-xs bg-[#0A0A0B] p-3 rounded-xl border border-stone-850">
                      <div>
                        <strong className="text-emerald-400 block font-mono">₹{pay.amount?.toLocaleString()}</strong>
                        <span className="text-[10px] text-stone-500">Method: {pay.paymentMethod?.toUpperCase()} · {pay.paymentDate}</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        {pay.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-stone-600 text-xs">No payment records saved yet.</div>
              )}

              {invoices.filter(i => i.status !== 'paid').length > 0 && (
                <form onSubmit={handleRecordPayment} className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Invoice</label>
                      <select
                        value={selectedInvoiceId}
                        onChange={e => setSelectedInvoiceId(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-2.5 text-xs text-[#F0EEE8] outline-none cursor-pointer"
                      >
                        <option value="" disabled>Select...</option>
                        {invoices.filter(i => i.status !== 'paid').map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.invoiceNumber} (₹{inv.amount})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Method</label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-2.5 text-xs text-[#F0EEE8] outline-none cursor-pointer"
                      >
                        <option value="upi">UPI / GPAY</option>
                        <option value="bank_transfer">IMPS / NEFT</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8A8899] font-bold uppercase tracking-wider">Received Amount (₹)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-stone-800 rounded-lg p-2.5 text-xs text-[#F0EEE8] outline-none font-mono"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-[#C9A84C] hover:bg-[#AA8C2C] text-slate-950 text-xs font-bold rounded-xl uppercase tracking-wider transition">
                    Save Receipt
                  </button>
                </form>
              )}
            </div>

            {/* Scope VO & Procurement PO */}
            <div className="space-y-6">
              
              {/* Variation Orders */}
              <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider border-b border-stone-850 pb-2">Variation Orders (VO)</h3>
                {variations.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {variations.map(v => (
                      <div key={v.id} className="flex justify-between items-center text-xs bg-[#0A0A0B] p-2.5 rounded-xl border border-stone-850">
                        <div>
                          <strong className="text-slate-300 block">{v.variationCode}</strong>
                          <span className="text-[10px] text-stone-500">{v.description}</span>
                        </div>
                        <div className="font-bold text-purple-400 font-mono">+₹{v.costDelta?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-stone-600 text-xs">No scope modifications registered.</div>
                )}
                <form onSubmit={handleCreateVariation} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={variationDesc}
                    onChange={e => setVariationDesc(e.target.value)}
                    className="flex-grow bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Cost"
                    value={variationCost}
                    onChange={e => setVariationCost(e.target.value)}
                    className="w-20 bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none font-mono"
                  />
                  <button type="submit" className="px-3 bg-stone-800 border border-stone-700 text-[#C9A84C] rounded-lg text-xs font-bold font-mono">+</button>
                </form>
              </div>

              {/* Vendor PO */}
              <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-[#F0EEE8] uppercase tracking-wider border-b border-stone-850 pb-2">Purchase Orders (PO)</h3>
                {purchaseOrders.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {purchaseOrders.map(po => (
                      <div key={po.id} className="flex justify-between items-center text-xs bg-[#0A0A0B] p-2.5 rounded-xl border border-stone-850">
                        <div>
                          <strong className="text-slate-300 block">{po.poNumber}</strong>
                          <span className="text-[10px] text-stone-500">{po.vendorName}</span>
                        </div>
                        <div className="font-bold text-[#C9A84C] font-mono">₹{po.grandTotal?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-stone-600 text-xs">No vendor purchase orders logged.</div>
                )}
                <form onSubmit={handleCreatePO} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Vendor Name"
                    value={poVendor}
                    onChange={e => setPoVendor(e.target.value)}
                    className="flex-grow bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none"
                  />
                  <input
                    type="number"
                    placeholder="PO Value"
                    value={poAmount}
                    onChange={e => setPoAmount(e.target.value)}
                    className="w-20 bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-xs text-[#F0EEE8] outline-none font-mono"
                  />
                  <button type="submit" className="px-3 bg-stone-800 border border-stone-700 text-[#C9A84C] rounded-lg text-xs font-bold font-mono">+</button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: RATE CATALOG MANAGER */}
        {activeSubTab === 'rate_manager' && (
          <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-6">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Dynamic Production Rate Card</h3>
                <p className="text-[10px] text-[#8A8899]">Define base manufacturing rates (per Sqft or Lumpsum) used by the item auto-builder.</p>
              </div>
            </div>

            <div className="space-y-6">
              {CATEGORIES.map(category => {
                const itemsInCategory = rateCard.filter(r => r.category === category);
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex justify-between items-center border-b border-stone-850 pb-1.5">
                      <h4 className="text-xs font-extrabold text-[#C9A84C] uppercase tracking-widest">{category} Category</h4>
                      <button onClick={() => handleAddRateCardItem(category)} className="text-[10px] text-[#C9A84C] hover:underline font-bold flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Add Custom Product
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {itemsInCategory.map(item => (
                        <div key={item.id} className="bg-[#0A0A0B] border border-stone-850 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => handleUpdateRate(item.id, 'name', e.target.value)}
                              className="bg-transparent font-bold text-xs outline-none border-b border-transparent focus:border-[#C9A84C] flex-grow mr-2 text-slate-200"
                            />
                            <button
                              onClick={() => setRateCard(prev => prev.filter(r => r.id !== item.id))}
                              className="text-red-400 hover:text-red-300 transition text-[10px]"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-bold text-stone-500 uppercase">Unit Rate (₹)</span>
                              <input
                                type="number"
                                value={item.defaultRate}
                                onChange={e => handleUpdateRate(item.id, 'defaultRate', parseFloat(e.target.value) || 0)}
                                className="bg-[#111113] border border-stone-800 rounded p-1.5 font-mono text-[#F0EEE8]"
                              />
                            </label>
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-bold text-stone-500 uppercase">Default Dimensions</span>
                              <input
                                type="text"
                                value={item.defaultDimensions}
                                onChange={e => handleUpdateRate(item.id, 'defaultDimensions', e.target.value)}
                                className="bg-[#111113] border border-stone-800 rounded p-1.5 text-[#F0EEE8]"
                              />
                            </label>
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-bold text-stone-500 uppercase">Rate Type</span>
                              <select
                                value={item.rateType}
                                onChange={e => handleUpdateRate(item.id, 'rateType', e.target.value)}
                                className="bg-[#111113] border border-stone-800 rounded p-1.5 text-[#F0EEE8] cursor-pointer"
                              >
                                <option value="SQFT">Per SQFT</option>
                                <option value="LUMPSUM">Lump Sum</option>
                              </select>
                            </label>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10px] text-[#8A8899] border-t border-stone-900 pt-2">
                            <span>Core: {item.defaultMaterial || 'Plywood'}</span>
                            <span>Finish: {item.defaultFinish || 'Laminate'}</span>
                            <span>Hardware: {item.defaultHardware || 'Soft-close'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY SETTINGS */}
        {activeSubTab === 'company_settings' && (
          <div className="bg-[#111113] border border-stone-850 rounded-2xl p-5 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Company & Remittance Details</h3>
              <p className="text-[10px] text-[#8A8899]">Enter remittance details, website, address, logo, and signature stamp. These will populate printed quotations and estimates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Studio Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider border-b border-stone-850 pb-1.5">Studio Profile</h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Company Name</span>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Tagline</span>
                    <input
                      type="text"
                      value={profile.tagline}
                      onChange={e => setProfile({ ...profile, tagline: e.target.value })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-[9px] font-bold text-stone-500 uppercase">Office Address</span>
                  <textarea
                    value={profile.address}
                    onChange={e => setProfile({ ...profile, address: e.target.value })}
                    rows={2}
                    className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C] resize-none"
                  />
                </label>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Phone</span>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Email</span>
                    <input
                      type="text"
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">GSTIN (India)</span>
                    <input
                      type="text"
                      value={profile.gstNo}
                      onChange={e => setProfile({ ...profile, gstNo: e.target.value })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C] font-mono"
                    />
                  </label>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider border-b border-stone-850 pb-1.5">Bank Remittance Destinations</h4>
                
                <label className="flex flex-col gap-1 text-xs">
                  <span className="text-[9px] font-bold text-stone-500 uppercase">Beneficiary Account Name</span>
                  <input
                    type="text"
                    value={profile.bankDetails.accountName}
                    onChange={e => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, accountName: e.target.value } })}
                    className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Bank Name</span>
                    <input
                      type="text"
                      value={profile.bankDetails.bankName}
                      onChange={e => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, bankName: e.target.value } })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Account Number</span>
                    <input
                      type="text"
                      value={profile.bankDetails.accountNumber}
                      onChange={e => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, accountNumber: e.target.value } })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C] font-mono"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">IFSC Code</span>
                    <input
                      type="text"
                      value={profile.bankDetails.ifscCode}
                      onChange={e => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, ifscCode: e.target.value } })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C] font-mono"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase">UPI ID</span>
                    <input
                      type="text"
                      value={profile.bankDetails.upiId}
                      onChange={e => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, upiId: e.target.value } })}
                      className="bg-[#0A0A0B] border border-stone-800 rounded-lg p-2 text-[#F0EEE8] outline-none focus:border-[#C9A84C]"
                    />
                  </label>
                </div>
              </div>

              {/* Logo / Signature Uploads */}
              <div className="md:col-span-2 grid grid-cols-2 gap-6 pt-4 border-t border-stone-850">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-stone-500 uppercase block">Company Logo</span>
                  <div className="flex items-center gap-4 border border-dashed border-stone-800 p-4 rounded-xl bg-[#0A0A0B]">
                    <div className="w-16 h-16 bg-[#111113] border border-stone-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {profile.logo ? (
                        <img src={profile.logo} alt="Company Logo" className="object-contain w-full h-full p-1" />
                      ) : (
                        <span className="text-[9px] text-stone-600">No Image</span>
                      )}
                    </div>
                    <label className="flex-1 flex flex-col items-center justify-center py-2.5 px-3 border border-stone-850 rounded-lg hover:bg-stone-900/40 cursor-pointer text-xs font-semibold text-slate-350 gap-1 transition">
                      <CloudUpload size={16} className="text-[#C9A84C]" />
                      <span>Upload Logo</span>
                      <input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'logo')} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-stone-500 uppercase block">Authorized Signature Stamp</span>
                  <div className="flex items-center gap-4 border border-dashed border-stone-800 p-4 rounded-xl bg-[#0A0A0B]">
                    <div className="w-16 h-16 bg-[#111113] border border-stone-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {profile.signature ? (
                        <img src={profile.signature} alt="Signature" className="object-contain w-full h-full p-1" />
                      ) : (
                        <span className="text-[9px] text-stone-600">No Image</span>
                      )}
                    </div>
                    <label className="flex-1 flex flex-col items-center justify-center py-2.5 px-3 border border-stone-850 rounded-lg hover:bg-stone-900/40 cursor-pointer text-xs font-semibold text-slate-350 gap-1 transition">
                      <CloudUpload size={16} className="text-[#C9A84C]" />
                      <span>Upload Signature</span>
                      <input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'signature')} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
