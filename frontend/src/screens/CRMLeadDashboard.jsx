import { apiUrl, getApiBase } from '../utils/api.js';
const API_BASE = apiUrl('');
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, CheckCircle, XCircle, UserCheck, Sparkles, Inbox, 
  Plus, Search, Filter, Mail, MessageSquare, BarChart3, 
  TrendingUp, Star, Clock, ChevronDown, ChevronUp, Send,
  FileText, RefreshCw, ExternalLink, Trash2
} from 'lucide-react';

const EMAIL_TEMPLATES = [
  {
    id: 'intro',
    label: '🏠 Initial Introduction',
    subject: 'Transform Your Home – Complimentary Design Consultation',
    body: `Dear {{NAME}},

We noticed you recently enquired about interior design services for your property at {{LOCATION}}.

At Sharma Interiors, we specialize in crafting dream homes that blend functionality with aesthetics — modular kitchens, bespoke wardrobes, elegant living spaces, and more. Our designs are rooted in quality craftsmanship and transparent pricing.

We would love to offer you a **complimentary 30-minute consultation** to discuss your vision.

📞 Call us: +91-XXXXXXXXXX
🌐 Portfolio: www.sharmainteriors.in

Warm Regards,
Design Team | Sharma Interiors`
  },
  {
    id: 'followup',
    label: '📞 Post-Call Follow-Up',
    subject: 'Great Speaking With You, {{NAME}}! Next Steps Inside',
    body: `Hi {{NAME}},

Thank you for your time on our call today! It was wonderful learning about your home at {{LOCATION}} and your vision for your interiors.

As discussed, our senior designer will visit to take detailed measurements and present you with:
✅ 2D Floorplan Layout
✅ Material & Finish Selections
✅ Transparent Quotation

I've attached our brand portfolio for your reference. Please don't hesitate to reach out for any questions.

Looking forward to creating a beautiful space for you!

Best,
Sharma Interiors Design Studio`
  },
  {
    id: 'proposal',
    label: '📋 Formal Proposal Ready',
    subject: 'Your Interior Design Proposal is Ready – {{NAME}}',
    body: `Dear {{NAME}},

Exciting news! Your customized interior design proposal for your property at {{LOCATION}} is now ready.

📁 Attached: Design Brief + Material Selections + Quotation

The proposal includes:
• 2D Floorplan with room-wise layout
• Premium laminate & veneer selections (CenturyPly / Royale Touche)
• Hettich / Blum hardware specifications
• Budget breakdown: ₹{{BUDGET}}

We're confident this will exceed your expectations. Let's schedule a presentation call at your convenience.

Warm Regards,
Sharma Interiors | Design Excellence`
  },
  {
    id: 'nudge',
    label: '⏰ Gentle Follow-Up Nudge',
    subject: 'Still Thinking? We\'re Here to Help – Sharma Interiors',
    body: `Hi {{NAME}},

We hope you're doing well! We wanted to follow up regarding your interior design enquiry for {{LOCATION}}.

We understand decisions like these take time, so there's absolutely no rush. However, we wanted to share that our **Q3 calendar is filling up quickly**, and we'd love to secure your slot at our current pricing.

If you have any questions or would like to see more design samples, please reply to this email or call us directly.

Let's create your dream space together! 🏡

Best,
Sharma Interiors`
  }
];

const STATUS_CONFIG = {
  new: { label: 'New', className: 'status-new' },
  calling: { label: 'Calling', className: 'status-calling animate-pulse' },
  qualified: { label: 'Verified', className: 'status-qualified' },
  disqualified: { label: 'Disqualified', className: 'status-disqualified' },
  human_closed: { label: 'Deal Closed', className: 'status-closed' },
  human_lost: { label: 'Deal Lost', className: 'status-disqualified' }
};

export default function CRMLeadDashboard({ onProjectClosed }) {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [simulatedAnswer, setSimulatedAnswer] = useState('yes');
  const [isCalling, setIsCalling] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioWave, setAudioWave] = useState(false);
  
  // CRM Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(EMAIL_TEMPLATES[0]);
  const [emailBody, setEmailBody] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedLead, setExpandedLead] = useState(null);
  const [apiKeysInfo, setApiKeysInfo] = useState(null);
  const [showKeysPanel, setShowKeysPanel] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetch(apiUrl('/diagnostics/api-keys'))
      .then(res => res.json())
      .then(setApiKeysInfo)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedLead && selectedTemplate) {
      const body = selectedTemplate.body
        .replace(/{{NAME}}/g, selectedLead.name || '')
        .replace(/{{LOCATION}}/g, selectedLead.location || 'Bangalore')
        .replace(/{{BUDGET}}/g, selectedLead.budget?.toLocaleString() || 'N/A');
      const subject = selectedTemplate.subject
        .replace(/{{NAME}}/g, selectedLead.name || '');
      setEmailBody(body);
      setEmailSubject(subject);
    }
  }, [selectedLead, selectedTemplate]);

  const fetchLeads = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(apiUrl('/leads'));
      const data = await res.json();
      setLeads(data);
      if (data.length > 0 && !selectedLead) {
        setSelectedLead(data[0]);
      }
    } catch (err) {
      console.error("Error loading leads:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    useAutoClear(toast?.msg || null, setToast, 3000);
  };

  const importDemoLeads = async () => {
    try {
      const demoList = [
        { name: "Rohan Sharma", email: "rohan.s@example.com", phone: "+91 98765 43210", location: "HSR Layout, Bangalore", budget: 850000, area: 1200, requirements: "3 BHK Modular Kitchen, Master Bedroom Wardrobes, TV unit, Complete false ceiling" },
        { name: "Anjali Verma", email: "anjali.v@example.com", phone: "+91 98200 12345", location: "Whitefield, Bangalore", budget: 1650000, area: 1900, requirements: "Premium 4 BHK interior design, complete false ceiling, Vastu compliant, imported tiles" },
        { name: "Vikram Singh", email: "vikram.s@example.com", phone: "+91 97400 55566", location: "Indiranagar, Bangalore", budget: 180000, area: 450, requirements: "Need only one wardrobe and repair for kitchen cabinets" },
        { name: "Priya Patel", email: "priya.p@example.com", phone: "+91 96000 77788", location: "Koramangala, Bangalore", budget: 720000, area: 1050, requirements: "Modular kitchen, master bed wardrobe, study room furniture, pooja unit" },
        { name: "Arjun Nair", email: "arjun.n@example.com", phone: "+91 99887 66554", location: "Electronic City, Bangalore", budget: 2200000, area: 2400, requirements: "Luxury 4 BHK with imported marble, Italian kitchen, home theatre, smart lighting" }
      ];
      await fetch(apiUrl('/leads/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadList: demoList })
      });
      fetchLeads();
      showToast('5 demo leads imported successfully!');
    } catch (err) {
      console.error("Error importing leads:", err);
      showToast('Import failed', 'error');
    }
  };

  const triggerCallSimulation = async () => {
    if (!selectedLead) return;
    setIsCalling(true);
    setTranscript('📞 Dialing lead...');
    setAudioWave(true);
    try {
      const res = await fetch(`${API_BASE}/leads/${selectedLead.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: simulatedAnswer })
      });
      const data = await res.json();
      setIsCalling(false);
      setTranscript(data.transcript);
      setAudioWave(false);
      setSelectedLead(prev => ({ ...prev, voice_status: data.status, call_transcript: data.transcript }));
      showToast(data.status === 'qualified' ? '✅ Lead qualified! Moved to follow-up board.' : '❌ Lead disqualified.');
    } catch (err) {
      console.error("Call failed:", err);
      setIsCalling(false);
      setAudioWave(false);
    }
  };

  const closeDeal = async (leadId, status) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      fetchLeads();
      if (status === 'human_closed' && data.projectId) {
        showToast('🏠 Deal closed! Project workspace created.');
        onProjectClosed(data.projectId);
      } else {
        showToast('Deal marked as lost.');
      }
    } catch (err) {
      console.error("Error closing deal:", err);
    }
  };

  const sendEmail = () => {
    showToast(`📧 Email drafted for ${selectedLead?.name}. Open in mail client.`);
    const mailto = `mailto:${selectedLead?.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_blank');
  };

  // Computed & filtered leads
  const filteredLeads = useMemo(() => {
    let out = [...leads];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      out = out.filter(l => 
        l.name?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.requirements?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      out = out.filter(l => l.voice_status === filterStatus);
    }
    if (sortBy === 'score') out.sort((a, b) => b.score - a.score);
    else if (sortBy === 'budget') out.sort((a, b) => b.budget - a.budget);
    else if (sortBy === 'newest') out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return out;
  }, [leads, searchQuery, filterStatus, sortBy]);

  const qualifiedLeads = leads.filter(l => l.voice_status === 'qualified');
  const closedLeads = leads.filter(l => l.voice_status === 'human_closed');
  const totalBudgetQualified = qualifiedLeads.reduce((s, l) => s + (l.budget || 0), 0);

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 55) return 'score-mid';
    return 'score-low';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* ── Stats Strip ── */}
      <div className="flex-shrink-0 flex gap-3 px-6 pt-4 pb-3 border-b border-slate-800/50 items-center">
        <div className="flex flex-1 gap-3">
          {[
            { label: 'Total Leads', value: leads.length, icon: <Inbox className="w-4 h-4" />, color: 'text-slate-300' },
            { label: 'Qualified', value: qualifiedLeads.length, icon: <Star className="w-4 h-4" />, color: 'text-emerald-400' },
            { label: 'Deals Closed', value: closedLeads.length, icon: <TrendingUp className="w-4 h-4" />, color: 'text-[#D4AF37]' },
            { label: 'Pipeline Value', value: `₹${(totalBudgetQualified / 100000).toFixed(1)}L`, icon: <BarChart3 className="w-4 h-4" />, color: 'text-blue-400' },
            { label: 'Win Rate', value: `${leads.length > 0 ? ((closedLeads.length / leads.length) * 100).toFixed(0) : 0}%`, icon: <CheckCircle className="w-4 h-4" />, color: 'text-purple-400' }
          ].map((stat, i) => (
            <div key={i} className="flex-1 bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <div className={`${stat.color} opacity-70`}>{stat.icon}</div>
              <div>
                <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</div>
                <div className={`text-sm font-extrabold ${stat.color}`}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowKeysPanel(!showKeysPanel)}
          className={`flex-shrink-0 bg-slate-900 border text-[11px] font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
            showKeysPanel ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🔑 {showKeysPanel ? 'Hide API Keys' : 'View API Keys'}
        </button>
      </div>

      {/* ── API Keys Diagnostic Drawer ── */}
      {showKeysPanel && apiKeysInfo && (
        <div className="flex-shrink-0 mx-6 mt-3 bg-slate-900/90 border border-[#D4AF37]/30 rounded-2xl p-4 shadow-lg shadow-[#D4AF37]/5 slide-down">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              🔑 System Credentials & Active API Keys Status
            </h3>
            <span className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg text-slate-400">
              Live Generation: <strong className={apiKeysInfo.liveImageGen ? 'text-emerald-400' : 'text-amber-400'}>{apiKeysInfo.liveImageGen ? 'ON' : 'OFF'}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(apiKeysInfo.keys || {}).map(([key, info]) => (
              <div key={key} className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl text-left">
                <div className="text-[10px] text-slate-200 font-bold truncate">{info.name}</div>
                <div className="text-[9px] text-slate-500 font-mono mt-1 font-semibold">{key}</div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[120px]">
                    {info.value || '—'}
                  </span>
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    info.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {info.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main 3-Column Grid ── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-5 p-5 overflow-hidden">
        
        {/* ── COLUMN 1: Leads Queue ── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          
          {/* Queue Header */}
          <div className="flex-shrink-0 p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#D4AF37]" />
                Inbox Leads Queue
                <span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded-full font-bold">{filteredLeads.length}</span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchLeads}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={importDemoLeads}
                  className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> Import CSV
                </button>
              </div>
            </div>

            {/* Search + Filter Row */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40 placeholder:text-slate-600"
                />
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 outline-none focus:border-[#D4AF37]/40 cursor-pointer"
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="qualified">Verified</option>
                <option value="disqualified">Disq.</option>
                <option value="human_closed">Closed</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 outline-none focus:border-[#D4AF37]/40 cursor-pointer"
              >
                <option value="score">↓ Score</option>
                <option value="budget">↓ Budget</option>
                <option value="newest">↓ Newest</option>
              </select>
            </div>
          </div>

          {/* Lead List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-slate-600">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No leads found</p>
                <p className="text-[10px] mt-1">Try adjusting your search filters</p>
              </div>
            )}
            {filteredLeads.map(lead => {
              const statusCfg = STATUS_CONFIG[lead.voice_status] || STATUS_CONFIG.new;
              const isExpanded = expandedLead === lead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => { setSelectedLead(lead); setTranscript(''); }}
                  className={`lead-card p-3 rounded-xl border cursor-pointer ${
                    selectedLead?.id === lead.id
                      ? 'bg-slate-800/80 border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/5'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-200 truncate">{lead.name}</strong>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${getScoreClass(lead.score)}`}>
                          {lead.score}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{lead.requirements}</p>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[9px]">
                    <span className="text-slate-500">{lead.location}</span>
                    <span className="text-[#D4AF37]/80 font-semibold font-mono">
                      ₹{lead.budget ? (lead.budget / 100000).toFixed(1) + 'L' : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COLUMN 2: AI Caller + Email Outreach ── */}
        <div className="flex flex-col gap-4 overflow-hidden">
          
          {/* Tab switcher */}
          <div className="flex-shrink-0 flex rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
            <button
              onClick={() => setShowEmailPanel(false)}
              className={`flex-1 text-[11px] font-bold py-2.5 flex items-center justify-center gap-1.5 transition ${!showEmailPanel ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Phone className="w-3.5 h-3.5" /> AI Caller
            </button>
            <button
              onClick={() => setShowEmailPanel(true)}
              className={`flex-1 text-[11px] font-bold py-2.5 flex items-center justify-center gap-1.5 transition ${showEmailPanel ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Mail className="w-3.5 h-3.5" /> Email Outreach
            </button>
          </div>

          {!showEmailPanel ? (
            /* ── AI VOICE CALLER ── */
            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden">
              <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2 mb-3 flex-shrink-0">
                <Phone className="w-4 h-4 text-blue-400" />
                AI Qualification Caller
              </h2>

              {selectedLead ? (
                <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                  {/* Dial Target Card */}
                  <div className="flex-shrink-0 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Dial Target</div>
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm text-slate-200 block">{selectedLead.name}</strong>
                        <span className="text-xs font-mono text-blue-400">{selectedLead.phone}</span>
                      </div>
                      <div className="text-right text-[10px] text-slate-400">
                        <div>Score: <span className={`font-bold ${getScoreClass(selectedLead.score)}`}>{selectedLead.score}</span></div>
                        <div>₹{selectedLead.budget?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Response Toggle */}
                  <div className="flex-shrink-0 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Simulate Client Response
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSimulatedAnswer('yes')}
                        className={`py-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                          simulatedAnswer === 'yes'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                            : 'border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Yes, Needs Interiors
                      </button>
                      <button
                        onClick={() => setSimulatedAnswer('no')}
                        className={`py-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                          simulatedAnswer === 'no'
                            ? 'bg-red-500/15 border-red-500 text-red-400'
                            : 'border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> No, Disqualify
                      </button>
                    </div>
                  </div>

                  {/* Live Audio Wave */}
                  {audioWave && (
                    <div className="flex-shrink-0 h-12 bg-blue-950/30 rounded-xl flex items-center justify-center gap-1 border border-blue-500/20">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-blue-400 rounded-full audio-wave-bar"
                          style={{ animationDelay: `${i * 0.08}s` }}
                        />
                      ))}
                      <span className="text-xs font-semibold text-blue-300 ml-2">Calling...</span>
                    </div>
                  )}

                  {/* Transcript Display */}
                  <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl p-3 overflow-y-auto font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-line min-h-0">
                    {transcript || selectedLead.call_transcript || (
                      <span className="text-slate-600 italic">Click "Dial Lead" to run the AI qualification simulation via Vapi/Bland AI flow...</span>
                    )}
                  </div>

                  {/* Dial Button */}
                  <button
                    disabled={isCalling}
                    onClick={triggerCallSimulation}
                    className={`flex-shrink-0 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                      isCalling
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                    }`}
                  >
                    {isCalling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                    {isCalling ? 'AI Calling Lead...' : 'Dial Lead Verification'}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-xs text-center">
                  <div>
                    <Phone className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Select a lead to begin calling
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── EMAIL OUTREACH ── */
            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden">
              <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2 mb-3 flex-shrink-0">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                Email Outreach Studio
              </h2>

              {selectedLead ? (
                <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                  {/* Recipient */}
                  <div className="flex-shrink-0 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">To: </span>
                      <span className="text-slate-200 font-semibold">{selectedLead.name}</span>
                      <span className="text-slate-500 ml-2">{selectedLead.email}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </div>

                  {/* Template Picker */}
                  <div className="flex-shrink-0 grid grid-cols-2 gap-1.5">
                    {EMAIL_TEMPLATES.map(tmpl => (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplate(tmpl)}
                        className={`text-left px-2.5 py-2 rounded-lg border text-[10px] font-semibold transition ${
                          selectedTemplate?.id === tmpl.id
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
                            : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>

                  {/* Subject */}
                  <div className="flex-shrink-0">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Subject</label>
                    <input
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-[#D4AF37]/40"
                    />
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1 block flex-shrink-0">Body (Auto-personalized)</label>
                    <textarea
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      className="flex-1 w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-300 font-mono outline-none focus:border-[#D4AF37]/40 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={sendEmail}
                    className="flex-shrink-0 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] hover:from-[#e8c94a] hover:to-[#c4a030] text-slate-950 shadow-lg transition"
                  >
                    <Send className="w-4 h-4" />
                    Send via Mail Client
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-xs text-center">
                  <div>
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Select a lead to compose email
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COLUMN 3: Qualified Human Follow-Up ── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden">
          <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2 mb-4 flex-shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Senior Human Follow-Up Board
            {qualifiedLeads.length > 0 && (
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">{qualifiedLeads.length}</span>
            )}
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3">
            {qualifiedLeads.map(lead => (
              <div key={lead.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2.5 slide-up">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-xs font-bold text-slate-200">{lead.name}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{lead.location}</span>
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-400 border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5 rounded-full">
                    AI Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wider">Budget</span>
                    <strong className="text-[#D4AF37] font-mono">₹{lead.budget?.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wider">Area</span>
                    <strong className="text-slate-200">{lead.area} sq ft</strong>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{lead.requirements}</p>

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => closeDeal(lead.id, 'human_closed')}
                    className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#AA8C2C] hover:from-[#e8c94a] hover:to-[#c4a030] text-slate-950 font-extrabold text-[10px] uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Deal Closed!
                  </button>
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/25 text-blue-400 font-bold text-[10px] px-2.5 py-2 rounded-xl transition"
                    title="Draft Follow-up Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => closeDeal(lead.id, 'human_lost')}
                    className="bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/40 text-red-400 font-bold text-[10px] px-2.5 py-2 rounded-xl transition"
                    title="Mark Deal Lost"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            
            {qualifiedLeads.length === 0 && (
              <div className="text-center py-12">
                <UserCheck className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-xs font-semibold text-slate-500">No verified leads yet</p>
                <p className="text-[10px] text-slate-600 mt-1">Qualify a lead via the AI Calling Bot</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`toast-notification text-xs font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'border-red-500/30 text-red-300' : 'text-slate-200'}`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
