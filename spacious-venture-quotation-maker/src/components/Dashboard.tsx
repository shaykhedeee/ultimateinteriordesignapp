import React, { useState } from 'react';
import { 
  FileText, Search, Copy, Edit, Trash2, Eye, Plus, ArrowRight,
  TrendingUp, CheckSquare, Layers, Clock, User, Sparkles
} from 'lucide-react';
import { Quotation, RateItem, QuoteItem, CustomTemplate } from '../types';

interface DashboardProps {
  quotations: Quotation[];
  rateCard: RateItem[];
  onEdit: (q: Quotation) => void;
  onPreview: (q: Quotation) => void;
  onClientView: (q: Quotation) => void;
  onNavigateToAnalyser: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (q: Quotation) => void;
  onCreate: (
    items?: QuoteItem[], 
    specifications?: string[], 
    terms?: string[], 
    projectType?: string, 
    notes?: string
  ) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  quotations,
  rateCard,
  onEdit,
  onPreview,
  onClientView,
  onNavigateToAnalyser,
  onDelete,
  onDuplicate,
  onCreate
}) => {
  const [search, setSearch] = useState('');
  
  // Custom templates loaded from localStorage
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('sv_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering onCreate
    if (window.confirm("Are you sure you want to delete this custom template?")) {
      const updated = customTemplates.filter(t => t.id !== id);
      setCustomTemplates(updated);
      localStorage.setItem('sv_custom_templates', JSON.stringify(updated));
    }
  };

  // Statistics
  const totalEstimates = quotations.length;
  const draftEstimates = quotations.filter(q => q.status === 'DRAFT').length;
  const approvedEstimates = quotations.filter(q => q.status === 'APPROVED').length;
  const approvedValue = quotations
    .filter(q => q.status === 'APPROVED')
    .reduce((sum, q) => sum + q.grandTotal, 0);
  const pipelineValue = quotations
    .filter(q => q.status !== 'REJECTED')
    .reduce((sum, q) => sum + q.grandTotal, 0);

  // Average profit margin calculations
  const quotesWithCosting = quotations.filter(q => q.costing);
  const averageMargin = quotesWithCosting.length > 0
    ? (() => {
        const margins = quotesWithCosting.map(q => {
          const totalCost = (q.costing?.manufacturingCost || 0) + (q.costing?.hardwareCost || 0) + (q.costing?.laborCost || 0) + (q.costing?.transportCost || 0) + (q.costing?.designFee || 0) + (q.costing?.contingency || 0);
          const proposedSubtotal = q.subtotal - q.discount;
          return proposedSubtotal > 0 ? ((proposedSubtotal - totalCost) / proposedSubtotal) * 100 : 0;
        });
        return margins.reduce((s, m) => s + m, 0) / margins.length;
      })()
    : 0;

  // Filter list
  const filteredQuotes = quotations.filter(q => 
    q.clientName.toLowerCase().includes(search.toLowerCase()) ||
    q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
    q.projectLocation.toLowerCase().includes(search.toLowerCase())
  );

  // Template generators using Rate Card prices
  const generateTemplateItems = (type: '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'VILLA' | 'COMMERCIAL'): QuoteItem[] => {
    const findRate = (id: string): RateItem | undefined => {
      return rateCard.find(item => item.id === id);
    };

    const makeItem = (rateId: string, customCategory: string, customDesc?: string): QuoteItem => {
      const details = findRate(rateId);
      const rate = details ? details.defaultRate : 0;
      const dims = details ? details.defaultDimensions : '-';
      const name = details ? details.name : '';
      const unit = details ? details.defaultUnit : 'Sqft';
      const isLump = details ? details.rateType === 'LUMPSUM' : false;
      const mat = details ? details.defaultMaterial || '' : '';
      const fin = details ? details.defaultFinish || '' : '';
      const hdw = details ? details.defaultHardware || '' : '';

      const [wStr, hStr] = dims.split(' x ');
      const sqft = wStr && hStr ? parseFloat(wStr) * parseFloat(hStr) : 0;
      const amount = isLump ? rate : sqft * rate;
      return {
        id: Date.now() + Math.random().toString(),
        category: customCategory,
        description: customDesc || name,
        dimensions: dims,
        sqft: sqft,
        rate: rate,
        amount: amount,
        isLumpSum: isLump,
        unit: unit,
        material: mat,
        finish: fin,
        hardware: hdw
      };
    };

    const items: QuoteItem[] = [];

    // 1. Kitchen is standard in all residential
    if (type !== 'COMMERCIAL') {
      items.push(makeItem('r-k-base', 'Kitchen', 'Modular Kitchen Counter Base Cabinets'));
      items.push(makeItem('r-k-wall', 'Kitchen', 'Overhead Storage Wall Cabinets'));
      items.push(makeItem('r-k-loft', 'Kitchen', 'Kitchen Loft Shutter Panels'));
      items.push(makeItem('r-k-granite', 'Kitchen', 'Z-Black Granite Countertop & Profiling'));
      items.push(makeItem('r-k-cutlery', 'Kitchen'));
      items.push(makeItem('r-k-pullout', 'Kitchen'));
      items.push(makeItem('r-k-tandem', 'Kitchen'));
      items.push(makeItem('r-k-gola', 'Kitchen'));

      // 2. Foyer Shoe Rack is standard
      items.push(makeItem('r-foyer-shoerack', 'Foyer', 'Foyer Shoe Rack (With cushioned seating)'));

      // 3. Living Room TV Unit is standard
      items.push(makeItem('r-tv-console', 'Living Room', 'TV Entertainment Floating Console'));

      // 4. Master Bedroom is standard in all
      items.push(makeItem('r-w-mbr-sliding', 'Master Bedroom', 'MBR Sliding Wardrobe (Premium Sliding)'));
      items.push(makeItem('r-w-loft-standard', 'Wardrobe Loft', 'MBR Wardrobe Loft Framing & Shutters'));
    }

    if (type === '1BHK') {
      return items;
    }

    if (type !== 'COMMERCIAL') {
      // 2BHK/3BHK/4BHK/Villa get Dining Crockery Unit & Foyer bench
      items.push(makeItem('r-dining-crockery', 'Dining Area', 'Crockery Shutter Cabinet'));
      items.push(makeItem('r-foyer-cushionbench', 'Foyer', 'Cushioned Seating Bench with Shoe Drawers'));

      // 2BHK Bedroom 2 (Guest Bedroom)
      items.push(makeItem('r-w-gbr-hinged', 'Guest Bedroom', 'Guest Bedroom Wardrobe (Hinged)'));
      items.push(makeItem('r-w-loft-standard', 'Wardrobe Loft', 'Guest Bedroom Loft Shutters'));
    }

    if (type === '2BHK') {
      return items;
    }

    if (type !== 'COMMERCIAL') {
      // 3BHK/4BHK/Villa get Kids Bedroom & Bookshelves
      items.push(makeItem('r-w-kbr-hinged', 'Kids Bedroom', 'Kids Bedroom Wardrobe (Hinged)'));
      items.push(makeItem('r-w-loft-standard', 'Wardrobe Loft', 'Kids Bedroom Loft Shutters'));
      items.push(makeItem('r-w-kbr-study', 'Kids Bedroom', 'Kids Study Desk & Bookshelf Combo'));
      items.push(makeItem('r-kbr-trundlebed', 'Kids Bedroom', 'Kids Single Bed with Pullout Trundle Bed'));
      items.push(makeItem('r-living-bookshelf', 'Living Room', 'Premium Full-height Bookshelf / Display Unit'));
    }

    if (type === '3BHK') {
      return items;
    }

    if (type === '4BHK') {
      // 4 BHK gets living back paneling, dressing, study, ceiling, and painting
      items.push(makeItem('r-tv-paneling', 'Living Room', 'TV Backing Wall Paneling (Premium)'));
      items.push(makeItem('r-w-mbr-dressing', 'Master Bedroom', 'MBR Dressing Unit (Mirror & Storage)'));
      items.push(makeItem('r-mbr-studydesk', 'Master Bedroom', 'MBR Study / Office Desk'));
      items.push(makeItem('r-ceiling-peripheral', 'False Ceiling', 'False Ceiling (Gypsum Peripheral with COB cutouts)'));
      items.push(makeItem('r-service-painting', 'General Works', 'Asian Paints Royale Emulsion Interior Painting'));
      return items;
    }

    if (type === 'VILLA') {
      // Villa Extra features (Sofa, Dining set, Bar cabinet, Hydraulic Beds, Painting, Ceiling, and Services)
      items.push(makeItem('r-tv-paneling', 'Living Room', 'TV Backing Wall Paneling (Premium)'));
      items.push(makeItem('r-living-puja', 'Living Room', 'Puja Mandir (With CNC backlit panel)'));
      items.push(makeItem('r-living-sofa', 'Living Room', 'Custom 3-Seater Fabric Sofa (Premium foam)'));
      items.push(makeItem('r-dining-chair', 'Dining Area', 'Upholstered Dining Chairs (Set of 6)'));
      items.push(makeItem('r-dining-bar', 'Dining Area', 'Breakfast Counter / Bar Unit'));
      items.push(makeItem('r-dining-barcabinet', 'Dining Area', 'Executive Bar Cabinet (With Wine rack & Mirror)'));
      
      items.push(makeItem('r-w-mbr-dressing', 'Master Bedroom', 'Master Dressing Mirror & Vanity Cabinet'));
      items.push(makeItem('r-mbr-hydraulicbed', 'Master Bedroom', 'King-size Hydraulic Storage Bed (Premium)'));
      items.push(makeItem('r-mbr-headboard', 'Master Bedroom', 'Wall-mounted Tufted Cushioned Headboard'));
      items.push(makeItem('r-mbr-studydesk', 'Master Bedroom', 'Wall-hung Study / Office Desk (Dual Drawer)'));
      
      items.push(makeItem('r-bath-vanity', 'Bathrooms', 'Bathroom Vanity Counter Cabinet'));
      items.push(makeItem('r-bath-mirror', 'Bathrooms', 'Led Backlit Mirror & Wall Cabinet'));
      items.push(makeItem('r-utility-storage', 'Utility', 'Washing Machine Cabinet & Utility Storage'));
      items.push(makeItem('r-ceiling-peripheral', 'False Ceiling', 'Living & Dining False Ceiling (Peripheral)'));
      items.push(makeItem('r-service-painting', 'General Works', 'Asian Paints Royale Luxury Emulsion (Full House)'));
      items.push(makeItem('r-service-cladding', 'General Works', 'Kitchen Wall Dado Tiling / Quartz Cladding'));
      items.push(makeItem('r-service-profilelight', 'General Works', 'LED Profile Light Groove Cutting & Driver Installation'));

      return items;
    }

    if (type === 'COMMERCIAL') {
      items.push(makeItem('r-foyer-paneling', 'Foyer', 'Reception Wall Rafter Paneling'));
      items.push(makeItem('r-foyer-partition', 'Foyer', 'CNC Jali Partition & Decorative Panel'));
      items.push(makeItem('r-office-receptiondesk', 'General Works', 'Commercial Reception Desk / Console'));
      items.push(makeItem('r-office-conftable', 'General Works', 'Premium Conference Room Table (With cable manager)'));
      items.push(makeItem('r-office-cabinets', 'General Works', 'Office Executive Storage Cabinets / File Storage'));
      items.push(makeItem('r-living-bookshelf', 'General Works', 'Premium Full-height Bookshelf / Display Unit'));
      items.push(makeItem('r-ceiling-peripheral', 'False Ceiling', 'False Ceiling (Gypsum Peripheral)'));
      items.push(makeItem('r-ceiling-grid', 'False Ceiling', 'Grid Ceiling (PVC/Moisture-proof for Bathrooms)'));
      items.push(makeItem('r-service-painting', 'General Works', 'Asian Paints Royale Emulsion Interior Painting'));
      items.push(makeItem('r-service-electrical', 'General Works', 'Electrical Point Shifting & Wiring (Kitchen / Living)'));
      items.push(makeItem('r-service-cleaning', 'General Works', 'Post-Installation Deep Cleaning Service'));
      return items;
    }

    return items;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'SENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INITIAL_QUOTE': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const handleCreateFromStandard = (type: '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'VILLA' | 'COMMERCIAL', label: string) => {
    onCreate(generateTemplateItems(type), undefined, undefined, label);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
      {/* Welcome Banner */}
      <div className="bg-[#1f352b] rounded-xl p-6 md:p-8 text-white shadow-md mb-8 relative overflow-hidden border border-[#b8873b]/20">
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-[#b8873b]/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-xl md:text-3xl font-serif font-bold mb-2">Estimate Command Center</h2>
            <p className="text-white/70 text-xs md:text-sm max-w-xl">
              Create, duplicate, and export high-density print-ready quotations for Spacious Venture projects in Sarjapur. Fully connected to local CNC factory rates.
            </p>
          </div>
          <button
            onClick={() => onCreate()}
            className="bg-[#b8873b] hover:bg-[#a37632] text-white py-2 px-5 rounded-lg shadow-md font-bold text-sm flex items-center gap-2 transition-all active:scale-95 border border-[#f5e6cf]/10"
          >
            <Plus size={18} />
            <span>Create Custom Estimate</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-stone-100 rounded-lg text-stone-600">
            <FileText size={22} />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">Total Quotes</span>
            <strong className="text-xl md:text-2xl font-black text-stone-800">{totalEstimates}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">Draft Quotes</span>
            <strong className="text-xl md:text-2xl font-black text-stone-800">{draftEstimates}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckSquare size={22} />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">Approved Quotes</span>
            <strong className="text-xl md:text-2xl font-black text-stone-800">{approvedEstimates}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">Approved Revenue</span>
            <strong className="text-lg md:text-xl font-black text-stone-800">₹{approvedValue.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <TrendingUp size={22} className="transform rotate-90" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold block">Average Margin</span>
            <strong className="text-xl md:text-2xl font-black text-stone-800">{averageMargin > 0 ? `${averageMargin.toFixed(1)}%` : 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* AI Floor Plan Callout */}
      <div className="bg-gradient-to-r from-[#1f352b] to-[#2c4d3e] rounded-xl p-5 border border-[#b8873b]/30 shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#b8873b]/20 rounded-xl text-[#b8873b]">
            <Sparkles size={26} className="animate-pulse" />
          </div>
          <div>
            <strong className="text-sm font-bold block">Generate Quotation with Floor Plan AI</strong>
            <p className="text-[11px] text-white/70 mt-0.5 leading-normal max-w-xl">
              Describe room furniture, input cabinet sizes, or upload blueprints. The AI-enabled layout analyser automatically constructs quote list items based on standard catalog specifications.
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToAnalyser}
          className="bg-[#b8873b] hover:bg-[#a37632] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          <span>Launch AI Analyser</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Quick Launch Templates */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm mb-8">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Layers size={14} className="text-[#b8873b]" />
          <span>Quick Project Templates (Auto-Priced from Active Rate Card)</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button 
            onClick={() => handleCreateFromStandard('1BHK', '1 BHK Apartment')}
            className="group border border-stone-200 hover:border-[#b8873b]/40 rounded-xl p-4 text-left hover:bg-stone-50/50 transition-all shadow-sm active:scale-95"
          >
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Kitchen + 1 Bed</span>
            <strong className="text-xs font-bold text-stone-800 block group-hover:text-[#1f352b] transition-colors leading-tight">1 BHK Standard</strong>
            <span className="text-[9px] text-[#b8873b] mt-3 inline-flex items-center gap-1">Generate <ArrowRight size={8} /></span>
          </button>

          <button 
            onClick={() => handleCreateFromStandard('2BHK', '2 BHK Apartment')}
            className="group border border-stone-200 hover:border-[#b8873b]/40 rounded-xl p-4 text-left hover:bg-stone-50/50 transition-all shadow-sm active:scale-95"
          >
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Kitchen + 2 Bed + Dining</span>
            <strong className="text-xs font-bold text-stone-800 block group-hover:text-[#1f352b] transition-colors leading-tight">2 BHK Standard</strong>
            <span className="text-[9px] text-[#b8873b] mt-3 inline-flex items-center gap-1">Generate <ArrowRight size={8} /></span>
          </button>

          <button 
            onClick={() => handleCreateFromStandard('3BHK', '3 BHK Apartment')}
            className="group border border-stone-200 hover:border-[#b8873b]/40 rounded-xl p-4 text-left hover:bg-stone-50/50 transition-all shadow-sm active:scale-95"
          >
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Kitchen + 3 Bed + Study</span>
            <strong className="text-xs font-bold text-stone-800 block group-hover:text-[#1f352b] transition-colors leading-tight">3 BHK Premium</strong>
            <span className="text-[9px] text-[#b8873b] mt-3 inline-flex items-center gap-1">Generate <ArrowRight size={8} /></span>
          </button>

          <button 
            onClick={() => handleCreateFromStandard('4BHK', '4 BHK Apartment')}
            className="group border border-stone-200 hover:border-[#b8873b]/40 rounded-xl p-4 text-left hover:bg-stone-50/50 transition-all shadow-sm active:scale-95"
          >
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Kitchen + 4 Bed + Ceiling</span>
            <strong className="text-xs font-bold text-stone-800 block group-hover:text-[#1f352b] transition-colors leading-tight">4 BHK Luxury</strong>
            <span className="text-[9px] text-[#b8873b] mt-3 inline-flex items-center gap-1">Generate <ArrowRight size={8} /></span>
          </button>

          <button 
            onClick={() => handleCreateFromStandard('VILLA', 'Villa / Row House')}
            className="group border border-stone-200 hover:border-[#b8873b]/40 rounded-xl p-4 text-left hover:bg-stone-50/50 transition-all shadow-sm active:scale-95"
          >
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Luxury Villa Package</span>
            <strong className="text-xs font-bold text-stone-800 block group-hover:text-[#1f352b] transition-colors leading-tight">Villa Master</strong>
            <span className="text-[9px] text-[#b8873b] mt-3 inline-flex items-center gap-1">Generate <ArrowRight size={8} /></span>
          </button>

          <button 
            onClick={() => handleCreateFromStandard('COMMERCIAL', 'Commercial / Office')}
            className="group border border-[#b8873b]/20 hover:border-[#b8873b]/50 rounded-xl p-4 text-left bg-[#1f352b]/5 hover:bg-[#1f352b]/10 transition-all shadow-sm active:scale-95"
          >
            <span className="text-[9px] uppercase font-bold text-[#b8873b] tracking-wider block mb-1">Workspace Layout</span>
            <strong className="text-xs font-bold text-[#1f352b] block leading-tight">Office Template</strong>
            <span className="text-[9px] text-stone-500 mt-3 inline-flex items-center gap-1">Generate <ArrowRight size={8} /></span>
          </button>
        </div>
      </div>

      {/* Saved Custom Templates (Society Templates) */}
      {customTemplates.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm mb-8">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Layers size={14} className="text-[#b8873b]" />
            <span>Saved Society & Custom Templates ({customTemplates.length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {customTemplates.map((template) => (
              <div 
                key={template.id}
                onClick={() => onCreate(template.items, template.specifications, template.terms, template.projectType, template.notes)}
                className="group relative border border-[#b8873b]/20 hover:border-[#b8873b]/50 rounded-xl p-4 text-left hover:bg-[#1f352b]/5 transition-all shadow-sm active:scale-95 cursor-pointer bg-[#f5e6cf]/5"
              >
                <button
                  onClick={(e) => handleDeleteTemplate(template.id, e)}
                  title="Delete Template"
                  className="absolute top-2.5 right-2.5 p-1 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100 transition-colors z-20"
                >
                  <Trash2 size={13} />
                </button>
                <span className="text-[9px] uppercase font-bold text-[#b8873b] tracking-wider block mb-1">
                  {template.projectType}
                </span>
                <strong className="text-sm font-bold text-stone-800 block group-hover:text-[#1f352b] transition-colors pr-6 truncate">
                  {template.name}
                </strong>
                <span className="text-[9px] text-stone-400 mt-3 inline-flex items-center gap-1">
                  Use Template <ArrowRight size={9} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Main Quotations Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-stone-50/30">
          <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">All Project Quotations</h3>
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search by client, location, or quote #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-[#b8873b] bg-white shadow-inner transition-colors"
            />
          </div>
        </div>

        {/* Quotes List */}
        {filteredQuotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-400 text-[9px] uppercase tracking-widest font-black border-b border-stone-200">
                  <th className="py-3.5 px-6">Quote Number</th>
                  <th className="py-3.5 px-4">Client / Property</th>
                  <th className="py-3.5 px-4">Property Type</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Estimate Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-stone-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-stone-700 font-mono">{quote.quoteNumber}</td>
                    <td className="py-4 px-4">
                      <strong className="text-stone-800 font-bold block text-sm">{quote.clientName || 'Unnamed Client'}</strong>
                      <span className="text-stone-400 text-[10px] block mt-0.5">{quote.projectLocation || 'No location set'}</span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-stone-600">{quote.projectType}</td>
                    <td className="py-4 px-4 text-stone-500">{new Date(quote.dateOfIssue).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</td>
                    <td className="py-4 px-4 text-right font-bold text-stone-800">₹{quote.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${getStatusBadgeClass(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex justify-center items-center gap-1.5">
                        <button 
                          onClick={() => onPreview(quote)}
                          title="Preview & Export PDF"
                          className="p-1.5 bg-[#1f352b]/5 hover:bg-[#1f352b]/15 text-[#1f352b] rounded-lg transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => onClientView(quote)}
                          title="Client Review Portal"
                          className="p-1.5 bg-[#b8873b]/5 hover:bg-[#b8873b]/15 text-[#b8873b] rounded-lg transition-colors"
                        >
                          <User size={15} />
                        </button>
                        <button 
                          onClick={() => onEdit(quote)}
                          title="Edit Quotation"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => onDuplicate(quote)}
                          title="Duplicate/Revise"
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                        >
                          <Copy size={15} />
                        </button>
                        <button 
                          onClick={() => onDelete(quote.id)}
                          title="Delete"
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-stone-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30 text-[#1f352b]" />
            <h4 className="font-bold text-stone-700 text-sm mb-1">No Quotations Found</h4>
            <p className="text-xs">Create a new estimate from scratch or use one of the standard templates above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
