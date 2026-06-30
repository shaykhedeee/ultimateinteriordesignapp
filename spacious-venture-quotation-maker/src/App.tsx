import React, { useState, useEffect } from 'react';
import { Plus, Settings as SettingsIcon, LayoutDashboard, Database, Layers, Sparkles, Wrench } from 'lucide-react';
import { Quotation, ViewState, QuoteItem, CompanyProfile, RateItem, MaterialItem, CustomTemplate } from './types';
import { 
  DEFAULT_COMPANY_PROFILE, 
  DEFAULT_TERMS, 
  DEFAULT_SPECS, 
  DEFAULT_PAYMENT_SCHEDULE,
  DEFAULT_RATE_ITEMS,
  DEFAULT_MATERIALS
} from './constants';
import Dashboard from './components/Dashboard';
import QuotationForm from './components/QuotationForm';
import QuotationPreview from './components/QuotationPreview';
import RateManager from './components/RateManager';
import Settings from './components/Settings';
import Toast from './components/Toast';
import MaterialsManager from './components/MaterialsManager';
import TemplatesManager from './components/TemplatesManager';
import ClientView from './components/ClientView';
import FloorPlanAnalyser from './components/FloorPlanAnalyser';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LIST);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // --- Company Profile State ---
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem('sv_company_profile');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_PROFILE;
    } catch {
      return DEFAULT_COMPANY_PROFILE;
    }
  });

  // --- Rate Card (Catalog) State ---
  const [rateCard, setRateCard] = useState<RateItem[]>(() => {
    try {
      const saved = localStorage.getItem('sv_rate_card');
      return saved ? JSON.parse(saved) : DEFAULT_RATE_ITEMS;
    } catch {
      return DEFAULT_RATE_ITEMS;
    }
  });

  // --- Materials Catalog State ---
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem('sv_materials_library');
      return saved ? JSON.parse(saved) : DEFAULT_MATERIALS;
    } catch {
      return DEFAULT_MATERIALS;
    }
  });

  // --- Custom Templates State ---
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('sv_custom_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- Quotations State ---
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem('sv_quotations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeQuote, setActiveQuote] = useState<Quotation | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('sv_company_profile', JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem('sv_rate_card', JSON.stringify(rateCard));
  }, [rateCard]);

  useEffect(() => {
    localStorage.setItem('sv_materials_library', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('sv_custom_templates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  useEffect(() => {
    localStorage.setItem('sv_quotations', JSON.stringify(quotations));
  }, [quotations]);

  const handleCreateNew = (
    templateItems?: QuoteItem[],
    specifications?: string[],
    terms?: string[],
    projectType?: string,
    notes?: string
  ) => {
    const defaultMilestones = DEFAULT_PAYMENT_SCHEDULE.map(m => ({ ...m, amount: 0 }));
    const newQuote: Quotation = {
      id: Date.now().toString(),
      quoteNumber: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      projectLocation: '',
      projectType: projectType || '2 BHK Apartment',
      dateOfIssue: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 Days validity standard
      items: templateItems ? JSON.parse(JSON.stringify(templateItems)) : [],
      requestedItems: [],
      isGstEnabled: true,
      gstPercentage: 18,
      subtotal: 0,
      discount: 0,
      gst: 0,
      grandTotal: 0,
      projectDuration: '40 Working Days',
      specifications: specifications ? [...specifications] : [...DEFAULT_SPECS],
      terms: terms ? [...terms] : [...DEFAULT_TERMS],
      bankDetails: { ...companyProfile.bankDetails },
      paymentSchedule: defaultMilestones,
      notes: notes || '',
      status: 'DRAFT',
      revision: 0
    };
    
    // Auto-calculate if items were loaded from template
    if (templateItems && templateItems.length > 0) {
      const subtotal = templateItems.reduce((sum, item) => sum + item.amount, 0);
      const gst = subtotal * 0.18;
      newQuote.subtotal = subtotal;
      newQuote.gst = gst;
      newQuote.grandTotal = subtotal + gst;
      newQuote.paymentSchedule = defaultMilestones.map(m => ({
        ...m,
        amount: Math.round(subtotal * (m.percentage / 100))
      }));
    }

    setActiveQuote(newQuote);
    setView(ViewState.EDIT);
  };

  const handleEdit = (quote: Quotation) => {
    setActiveQuote(JSON.parse(JSON.stringify(quote))); // deep copy
    setView(ViewState.EDIT);
  };

  const handlePreview = (quote: Quotation) => {
    setActiveQuote(quote);
    setView(ViewState.PREVIEW);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this quotation? This cannot be undone.")) {
      setQuotations(prev => prev.filter(q => q.id !== id));
      showToast('Quotation deleted successfully.', 'success');
    }
  };

  const handleDuplicate = (quote: Quotation) => {
    const duplicated: Quotation = {
      ...JSON.parse(JSON.stringify(quote)),
      id: Date.now().toString(),
      quoteNumber: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'DRAFT',
      revision: quote.revision + 1,
      createdAt: new Date().toISOString()
    };
    setQuotations(prev => [duplicated, ...prev]);
    showToast('Quotation duplicated as Draft.', 'success');
  };

  const handleSave = (updatedQuote: Quotation) => {
    setQuotations(prev => {
      const exists = prev.some(q => q.id === updatedQuote.id);
      if (exists) {
        return prev.map(q => q.id === updatedQuote.id ? updatedQuote : q);
      }
      return [updatedQuote, ...prev];
    });
    setActiveQuote(updatedQuote);
    setView(ViewState.PREVIEW);
    showToast('Quotation saved successfully.', 'success');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-[#f5e6cf] selection:text-[#1f352b]">
      {/* Top Navbar */}
      <header className="bg-[#1f352b] text-white py-3.5 px-4 md:px-8 shadow-md no-print flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView(ViewState.LIST)}>
          <div className="h-9 w-28 bg-white rounded-lg flex items-center justify-center border border-[#b8873b] shadow-inner p-1 overflow-hidden">
            <img src="/spacious-venture-logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight leading-none mb-0.5">{companyProfile.name}</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#b8873b] font-bold">{companyProfile.tagline}</p>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 md:gap-3">
          <button 
            onClick={() => setView(ViewState.LIST)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${view === ViewState.LIST ? 'bg-white/10 text-white border-b-2 border-[#b8873b]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard size={16} />
            <span className="hidden md:inline">Dashboard</span>
          </button>

          <button 
            onClick={() => setView(ViewState.ANALYSER)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${view === ViewState.ANALYSER ? 'bg-white/10 text-white border-b-2 border-[#b8873b]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
          >
            <Sparkles size={16} className="text-[#b8873b]" />
            <span className="hidden md:inline font-bold">Floor Plan AI</span>
          </button>

          <button 
            onClick={() => setView(ViewState.TEMPLATES)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${view === ViewState.TEMPLATES ? 'bg-white/10 text-white border-b-2 border-[#b8873b]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
          >
            <Layers size={16} />
            <span className="hidden md:inline">Templates</span>
          </button>

          <button 
            onClick={() => setView(ViewState.MATERIALS)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${view === ViewState.MATERIALS ? 'bg-white/10 text-white border-b-2 border-[#b8873b]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
          >
            <Wrench size={16} />
            <span className="hidden md:inline">Materials Library</span>
          </button>
          
          <button 
            onClick={() => setView(ViewState.RATE_CARD)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${view === ViewState.RATE_CARD ? 'bg-white/10 text-white border-b-2 border-[#b8873b]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
          >
            <Database size={16} />
            <span className="hidden md:inline">Rate Catalog</span>
          </button>

          <button 
            onClick={() => setView(ViewState.SETTINGS)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${view === ViewState.SETTINGS ? 'bg-white/10 text-white border-b-2 border-[#b8873b]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
          >
            <SettingsIcon size={16} />
            <span className="hidden md:inline">Profile Settings</span>
          </button>

          <div className="w-px h-6 bg-white/20 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => handleCreateNew()}
            className="bg-[#b8873b] hover:bg-[#a37632] text-white px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg transition-all text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 ml-2"
          >
            <Plus size={16} />
            <span>New Estimate</span>
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 relative pb-10">
        {view === ViewState.LIST && (
          <Dashboard 
            quotations={quotations} 
            onEdit={handleEdit} 
            onPreview={handlePreview} 
            onClientView={(q) => {
              setActiveQuote(q);
              setView(ViewState.CLIENT_VIEW);
            }}
            onNavigateToAnalyser={() => setView(ViewState.ANALYSER)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onCreate={handleCreateNew}
            rateCard={rateCard}
          />
        )}
        
        {view === ViewState.EDIT && activeQuote && (
          <QuotationForm 
            quotation={activeQuote} 
            rateCard={rateCard}
            materials={materials}
            onSave={handleSave} 
            onCancel={() => setView(ViewState.LIST)}
            companyProfile={companyProfile}
            showToast={showToast}
          />
        )}

        {view === ViewState.PREVIEW && activeQuote && (
          <QuotationPreview 
            quotation={activeQuote} 
            onEdit={() => setView(ViewState.EDIT)} 
            onBack={() => setView(ViewState.LIST)}
            onClientReview={(q) => {
              setActiveQuote(q);
              setView(ViewState.CLIENT_VIEW);
            }}
            companyProfile={companyProfile}
            showToast={showToast}
          />
        )}

        {view === ViewState.RATE_CARD && (
          <RateManager 
            rateCard={rateCard}
            onSave={(updatedCard) => {
              setRateCard(updatedCard);
              showToast('Rate catalog updated successfully.', 'success');
              setView(ViewState.LIST);
            }}
            onCancel={() => setView(ViewState.LIST)}
          />
        )}

        {view === ViewState.SETTINGS && (
          <Settings 
            profile={companyProfile}
            onSave={(updatedProfile) => {
              setCompanyProfile(updatedProfile);
              showToast('Profile settings saved.', 'success');
              setView(ViewState.LIST);
            }}
            onCancel={() => setView(ViewState.LIST)}
          />
        )}

        {view === ViewState.MATERIALS && (
          <MaterialsManager 
            materials={materials}
            onSave={(updatedMaterials) => {
              setMaterials(updatedMaterials);
              showToast('Materials catalog updated successfully.', 'success');
              setView(ViewState.LIST);
            }}
            onCancel={() => setView(ViewState.LIST)}
          />
        )}

        {view === ViewState.TEMPLATES && (
          <TemplatesManager 
            customTemplates={customTemplates}
            rateCard={rateCard}
            onSave={(updatedTemplates) => {
              setCustomTemplates(updatedTemplates);
              showToast('Custom templates catalog updated successfully.', 'success');
            }}
            onCancel={() => setView(ViewState.LIST)}
            onCreateQuoteFromTemplate={(items, specs, terms, projectType, notes) => {
              handleCreateNew(items, specs, terms, projectType, notes);
            }}
          />
        )}

        {view === ViewState.CLIENT_VIEW && activeQuote && (
          <ClientView 
            quotation={activeQuote}
            companyProfile={companyProfile}
            onApprove={(approvedQuote) => {
              handleSave(approvedQuote);
              setView(ViewState.PREVIEW);
            }}
            onBack={() => setView(ViewState.LIST)}
          />
        )}

        {view === ViewState.ANALYSER && (
          <FloorPlanAnalyser 
            rateCard={rateCard}
            onCreateQuote={(items, projectType, notes) => {
              handleCreateNew(items, undefined, undefined, projectType, notes);
            }}
            onCancel={() => setView(ViewState.LIST)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white py-5 px-8 text-center text-stone-400 text-xs no-print border-t border-stone-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <p>&copy; {new Date().getFullYear()} {companyProfile.name} Interiors. Built for CNC Production Workflow.</p>
          <div className="flex gap-4">
            <span className="hover:text-stone-600 cursor-pointer">Local Storage DB</span>
            <span>•</span>
            <span className="hover:text-stone-600 cursor-pointer">Sarjapur Factory Direct</span>
          </div>
        </div>
      </footer>

      {/* Global Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default App;
