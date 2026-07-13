import React, { useState, useEffect, useMemo } from 'react';
import {
  Inbox, Plus, Search, Mail, Send, CheckCircle, XCircle, TrendingUp,
  Star, RefreshCw, ExternalLink, Upload, UserCheck, IndianRupee,
  Sparkles, Filter, FileText, Pencil, Check, X
} from 'lucide-react';

const STAGE_CONFIG = {
  new:          { label: 'New',          className: 'stage-new' },
  designs_sent: { label: 'Designs Sent', className: 'stage-designs' },
  token_paid:   { label: 'Token Paid',   className: 'stage-token' },
  closing:      { label: 'Closing',      className: 'stage-closing' },
  won:          { label: 'Won',          className: 'stage-won' },
  lost:         { label: 'Lost',         className: 'stage-lost' }
};
const STAGE_ORDER = ['new', 'designs_sent', 'token_paid', 'closing', 'won'];

const EMAIL_TEMPLATES = [
  {
    id: 'intro',
    label: '🏠 Initial Introduction',
    subject: 'Transform Your Home – Complimentary Design Consultation',
    body: `Dear {{NAME}},

We noticed you recently enquired about interior design services for your property at {{LOCATION}}.

At Sharma Interiors, we specialize in crafting dream homes that blend functionality with aesthetics — modular kitchens, bespoke wardrobes, elegant living spaces, and more.

We would love to offer you a complimentary 30-minute consultation to discuss your vision.

Warm Regards,
Design Team | Sharma Interiors`
  },
  {
    id: 'designs',
    label: '📐 Designs Sent',
    subject: 'Your Interior Design Concepts are Ready – {{NAME}}',
    body: `Hi {{NAME}},

As promised, we've attached your preliminary interior design concepts for your home at {{LOCATION}}.

✅ 2D Layout & Space Plan
✅ Mood Board & Material Selections
✅ Transparent Quotation

We'd love to walk you through them. Reply to schedule a presentation.

Best,
Sharma Interiors Design Studio`
  },
  {
    id: 'token',
    label: '💳 Token / Booking',
    subject: 'Securing Your Design Slot – {{NAME}}',
    body: `Hi {{NAME}},

Thank you for the token payment of ₹{{TOKENS}}! Your design slot is now confirmed.

Our senior designer will be in touch shortly to begin detailed measurements and the final design development.

Warm Regards,
Sharma Interiors`
  }
];

// Parse a CSV (from an Excel "Save As CSV" export or a pasted block).
// Header-based mapping with sensible fallbacks; positional if no header.
function parseCSV(text) {
  const lines = (text || '').trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const split = (l) => l.split(',').map(s => s.trim());
  const detectHeader = (h) => /name|client|customer/i.test(h);
  const header = split(lines[0]).map(h => h.toLowerCase());
  const hasHeader = header.some(detectHeader);
  const col = (names) => header.findIndex(h => names.some(n => h === n || h.startsWith(n)));
  const iName = hasHeader ? (col(['name','client','customer']) ?? -1) : 0;
  const iEmail = hasHeader ? (col(['email']) ?? -1) : 2;
  const iPhone = hasHeader ? (col(['phone','mobile','contact']) ?? -1) : 1;
  const iLoc = hasHeader ? (col(['location','city']) ?? -1) : 3;
  const iBud = hasHeader ? (col(['budget','amount']) ?? -1) : 4;
  const iArea = hasHeader ? (col(['area_sqft','area','sqft']) ?? -1) : 5;
  const iReq = hasHeader ? (col(['requirements','requirement','scope','notes']) ?? -1) : 6;
  const iStage = hasHeader ? (col(['stage','deal_stage','status']) ?? -1) : -1;
  const iTokens = hasHeader ? (col(['tokens_paid','token','advance']) ?? -1) : -1;
  const iDesigns = hasHeader ? (col(['designs_sent','designs']) ?? -1) : -1;
  const num = (v) => parseFloat(String(v || '').replace(/[^0-9.]/g, '')) || 0;
  const bool = (v) => /^(y|1|true|sent|yes)/i.test(String(v || '').trim());
  const startRow = hasHeader ? 1 : 0;
  return lines.slice(startRow).map(line => {
    const c = split(line);
    return {
      name: c[iName]?.trim() || '',
      email: iEmail >= 0 ? c[iEmail]?.trim() : '',
      phone: iPhone >= 0 ? c[iPhone]?.trim() : '',
      location: iLoc >= 0 ? c[iLoc]?.trim() : '',
      budget: iBud >= 0 ? num(c[iBud]) : 0,
      area: iArea >= 0 ? num(c[iArea]) : 0,
      requirements: iReq >= 0 ? c[iReq]?.trim() : '',
      deal_stage: iStage >= 0 ? c[iStage]?.trim().toLowerCase().replace(/[\s-]+/g, '_') : 'new',
      tokens_paid: iTokens >= 0 ? num(c[iTokens]) : 0,
      designs_sent: iDesigns >= 0 && bool(c[iDesigns]) ? 1 : 0
    };
  }).filter(r => r.name);
}

function ClientBoard({ onProjectCreated }) {
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [sortBy, setSortBy] = useState('stage');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals / panels
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // Add-client form
  const blankForm = { name: '', email: '', phone: '', location: '', budget: '', area: '', requirements: '', deal_stage: 'new', tokens_paid: '' };
  const [form, setForm] = useState(blankForm);

  // Import state
  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState([]);

  // Email state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://127.0.0.1:5055/api/leads');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.leads) ? data.leads : []);
      setClients(list);
      if (list.length && !selectedId) setSelectedId(list[0].id);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const patchClient = async (id, patch) => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      const data = await res.json().catch(() => ({}));
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch, ...data } : c));
      return data;
    } catch (err) {
      console.error('Error updating client:', err);
      showToast('Update failed', 'error');
    }
  };

  const advanceStage = (client) => {
    const idx = STAGE_ORDER.indexOf(client.deal_stage);
    const next = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
    if (next === client.deal_stage) return;
    patchClient(client.id, { deal_stage: next });
    showToast(`Moved ${client.name} → ${STAGE_CONFIG[next].label}`);
  };

  const setStage = (client, stage) => patchClient(client.id, { deal_stage: stage });

  const toggleDesignsSent = (client) =>
    patchClient(client.id, { designs_sent: client.designs_sent ? 0 : 1 });

  const updateTokens = (client, value) =>
    patchClient(client.id, { tokens_paid: Number(value) || 0 });

  const createProject = async (client) => {
    try {
      const res = await fetch(`http://127.0.0.1:5055/api/leads/${client.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'human_closed' })
      });
      const data = await res.json().catch(() => ({}));
      await patchClient(client.id, { deal_stage: 'won' });
      showToast('🏠 Project workspace created from this client.');
      if (data.projectId && onProjectCreated) setTimeout(() => onProjectCreated(data.projectId), 800);
    } catch (err) {
      console.error('Error creating project:', err);
      showToast('Could not create project', 'error');
    }
  };

  // ── Add client ──
  const submitAdd = async () => {
    if (!form.name.trim()) { showToast('Client name is required', 'error'); return; }
    try {
      await fetch('http://127.0.0.1:5055/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadList: [{
          ...form,
          budget: Number(form.budget) || 0,
          area: Number(form.area) || 0,
          tokens_paid: Number(form.tokens_paid) || 0,
          designs_sent: 0
        }] })
      });
      setForm(blankForm);
      setShowAdd(false);
      fetchClients();
      showToast('Client added.');
    } catch (err) {
      console.error('Error adding client:', err);
      showToast('Add failed', 'error');
    }
  };

  // ── Import CSV ──
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCsvText(String(reader.result || '')); previewCsv(String(reader.result || '')); };
    reader.readAsText(file);
  };
  const previewCsv = (text) => setImportPreview(parseCSV(text));
  const doImport = async () => {
    const rows = importPreview.length ? importPreview : parseCSV(csvText);
    if (!rows.length) { showToast('No valid rows found', 'error'); return; }
    try {
      await fetch('http://127.0.0.1:5055/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadList: rows })
      });
      setCsvText(''); setImportPreview([]); setShowImport(false);
      fetchClients();
      showToast(`Imported ${rows.length} clients.`);
    } catch (err) {
      console.error('Import failed:', err);
      showToast('Import failed', 'error');
    }
  };

  // ── Email / send designs ──
  const openEmail = (client, templateId) => {
    const t = EMAIL_TEMPLATES.find(x => x.id === templateId) || EMAIL_TEMPLATES[1];
    const body = t.body
      .replace(/{{NAME}}/g, client.name || '')
      .replace(/{{LOCATION}}/g, client.location || 'Bangalore')
      .replace(/{{TOKENS}}/g, (client.tokens_paid || 0).toLocaleString());
    setEmailSubject(t.subject.replace(/{{NAME}}/g, client.name || ''));
    setEmailBody(body);
    setShowEmail(true);
  };
  const sendEmail = (client) => {
    const mailto = `mailto:${client.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_blank');
    showToast(`📧 Email drafted for ${client.name}.`);
  };

  // Build the real render-pack PDF for this client and download it.
  const handleSendDesigns = async (client) => {
    try {
      showToast('Building design pack…');
      const res = await fetch(`http://127.0.0.1:5055/api/leads/${client.id}/send-designs`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'NO_PROJECT') {
          showToast('No project linked yet — create one first', 'error');
        } else {
          showToast(data.message || data.error || 'Could not build pack', 'error');
        }
        return;
      }
      // Download the generated PDF (the attached designs).
      const a = document.createElement('a');
      a.href = `http://127.0.0.1:5055${data.downloadUrl}`;
      a.download = `${client.name.replace(/\s+/g, '_')}_designs.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Refresh so the "Designs Sent" badge flips on.
      fetchClients();
      showToast(`📎 Design pack (${data.count} render(s)) ready & downloaded.`);
    } catch (err) {
      console.error('Send designs failed:', err);
      showToast('Send designs failed', 'error');
    }
  };

  // ── Derived ──
  const selected = clients.find(c => c.id === selectedId) || null;
  const filtered = useMemo(() => {
    let out = [...clients];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      out = out.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.requirements?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q));
    }
    if (filterStage !== 'all') out = out.filter(c => c.deal_stage === filterStage);
    if (sortBy === 'stage') out.sort((a, b) => STAGE_ORDER.indexOf(a.deal_stage) - STAGE_ORDER.indexOf(b.deal_stage));
    else if (sortBy === 'budget') out.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    else if (sortBy === 'tokens') out.sort((a, b) => (b.tokens_paid || 0) - (a.tokens_paid || 0));
    else if (sortBy === 'newest') out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return out;
  }, [clients, searchQuery, filterStage, sortBy]);

  const counts = useMemo(() => {
    const c = { total: clients.length, new: 0, designs_sent: 0, token_paid: 0, closing: 0, won: 0, lost: 0, tokens: 0 };
    clients.forEach(x => {
      c[x.deal_stage] = (c[x.deal_stage] || 0) + 1;
      c.tokens += Number(x.tokens_paid) || 0;
    });
    return c;
  }, [clients]);

  const followUp = clients.filter(c => c.deal_stage !== 'won' && c.deal_stage !== 'lost');

  const fmtINR = (n) => {
    const v = Number(n) || 0;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
    return `₹${v.toLocaleString()}`;
  };
  const getScoreClass = (s) => s >= 80 ? 'score-high' : s >= 55 ? 'score-mid' : 'score-low';

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Stats strip */}
      <div className="flex-shrink-0 flex gap-3 px-6 pt-4 pb-3 border-b border-slate-800/50 items-center flex-wrap">
        {[
          { label: 'Clients', value: counts.total, icon: <Inbox className="w-4 h-4" />, color: 'text-slate-300' },
          { label: 'Designs Sent', value: counts.designs_sent, icon: <FileText className="w-4 h-4" />, color: 'text-blue-400' },
          { label: 'Token Paid', value: counts.token_paid, icon: <CheckCircle className="w-4 h-4" />, color: 'text-purple-400' },
          { label: 'Tokens ₹', value: fmtINR(counts.tokens), icon: <IndianRupee className="w-4 h-4" />, color: 'text-[var(--gold)]' },
          { label: 'Closing', value: counts.closing, icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-400' },
          { label: 'Won', value: counts.won, icon: <Star className="w-4 h-4" />, color: 'text-emerald-400' }
        ].map((stat, i) => (
          <div key={i} className="flex-1 min-w-[120px] bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <div className={`${stat.color} opacity-70`}>{stat.icon}</div>
            <div>
              <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</div>
              <div className={`text-sm font-extrabold ${stat.color}`}>{stat.value}</div>
            </div>
          </div>
        ))}
        <div className="flex-shrink-0 flex gap-2">
          <button onClick={() => setShowAdd(true)}
            className="bg-[var(--gold)]/15 border border-[var(--gold)]/30 hover:bg-[var(--gold)]/25 text-[var(--gold)] text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition">
            <Plus className="w-3.5 h-3.5" /> Add Client
          </button>
          <button onClick={() => setShowImport(true)}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition">
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <button onClick={fetchClients} title="Refresh"
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-5 p-5 overflow-hidden">

        {/* COLUMN 1: Client list */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="flex-shrink-0 p-5 border-b border-white/5 bg-black/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black text-slate-100 tracking-widest uppercase flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[var(--gold)]" />
                Client List
                <span className="text-[9px] bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20 px-2 py-0.5 rounded-full font-black">{filtered.length}</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative group">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--gold)] transition-colors" />
                <input
                  type="text" placeholder="Search name, phone, location..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-[var(--gold)]/50 focus:bg-black/60 transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
              <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[11px] text-slate-300 outline-none cursor-pointer focus:border-[var(--gold)]/50 transition-all font-semibold">
                <option value="all">All Stages</option>
                <option value="new">New Lead</option>
                <option value="designs_sent">Designs Sent</option>
                <option value="token_paid">Token Paid</option>
                <option value="closing">Closing</option>
                <option value="won">Won Deal</option>
                <option value="lost">Lost</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[11px] text-slate-300 outline-none cursor-pointer focus:border-[var(--gold)]/50 transition-all font-semibold">
                <option value="stage">↓ Stage</option>
                <option value="tokens">↓ Tokens</option>
                <option value="budget">↓ Budget</option>
                <option value="newest">↓ Newest</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Inbox className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-xs font-bold tracking-wide text-slate-400">No clients found</p>
                <p className="text-[10px] mt-1 opacity-70">Add a new lead or adjust filters</p>
              </div>
            )}
            {filtered.map(c => {
              const st = STAGE_CONFIG[c.deal_stage] || STAGE_CONFIG.new;
              const isSel = selectedId === c.id;
              return (
                <div key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 group ${isSel ? 'bg-[var(--gold)]/5 border-[var(--gold)]/40 shadow-[0_0_20px_rgba(201,168,76,0.1)]' : 'bg-black/30 border-white/5 hover:border-[var(--gold)]/20 hover:bg-black/50'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <strong className={`text-xs font-black truncate transition-colors ${isSel ? 'text-[var(--gold)]' : 'text-slate-200 group-hover:text-white'}`}>{c.name}</strong>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${getScoreClass(c.score)}`}>{c.score}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{c.requirements || c.location || '—'}</p>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${st.className}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[9px]">
                    <span className="text-slate-500">{c.location || c.phone || '—'}</span>
                    <div className="flex items-center gap-1.5">
                      {Number(c.tokens_paid) > 0 && <span className="pill-token text-[8px] font-bold px-1.5 py-0.5 rounded-full">₹{(c.tokens_paid/1000).toFixed(0)}k</span>}
                      {c.designs_sent ? <span className="pill-designs text-[8px] font-bold px-1.5 py-0.5 rounded-full">📐 Sent</span> : null}
                      <span className="text-[var(--gold)]/80 font-semibold font-mono">{fmtINR(c.budget)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Selected client detail */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {selected ? (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <strong className="text-sm font-bold text-slate-100 block">{selected.name}</strong>
                  <span className="text-[11px] font-mono text-blue-400">{selected.phone}</span>
                  {selected.email && <span className="text-[11px] text-slate-500 ml-2">{selected.email}</span>}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STAGE_CONFIG[selected.deal_stage]?.className || 'stage-new'}`}>
                  {STAGE_CONFIG[selected.deal_stage]?.label || 'New'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Budget</span>
                  <strong className="text-[var(--gold)] font-mono">{fmtINR(selected.budget)}</strong>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Area</span>
                  <strong className="text-slate-200">{selected.area} sq ft</strong>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Location</span>
                  <strong className="text-slate-200">{selected.location || '—'}</strong>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Score</span>
                  <strong className={`font-mono ${getScoreClass(selected.score)}`}>{selected.score}</strong>
                </div>
              </div>

              {selected.requirements && (
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-[10px] text-slate-300 leading-relaxed">
                  {selected.requirements}
                </div>
              )}

              {/* Stage pipeline */}
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Deal Stage</div>
                <div className="flex flex-wrap gap-1.5">
                  {STAGE_ORDER.map(s => (
                    <button key={s} onClick={() => setStage(selected, s)}
                      className={`text-[9px] font-bold px-2 py-1 rounded-full border transition ${selected.deal_stage === s ? STAGE_CONFIG[s].className + ' ring-1 ring-white/20' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                      {STAGE_CONFIG[s].label}
                    </button>
                  ))}
                  <button onClick={() => setStage(selected, 'lost')}
                    className={`text-[9px] font-bold px-2 py-1 rounded-full border transition ${selected.deal_stage === 'lost' ? 'stage-lost ring-1 ring-white/20' : 'border-slate-800 text-slate-500 hover:text-red-400'}`}>
                    Lost
                  </button>
                </div>
              </div>

              {/* Tokens + designs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tokens Paid (₹)</div>
                  <input
                    type="number" value={selected.tokens_paid || 0}
                    onChange={e => updateTokens(selected, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-purple-300 font-mono outline-none focus:border-purple-500/40"
                  />
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Designs Sent</div>
                  <button onClick={() => toggleDesignsSent(selected)}
                    className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition flex items-center justify-center gap-1 ${selected.designs_sent ? 'bg-blue-500/15 border-blue-500 text-blue-300' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                    {selected.designs_sent ? <><Check className="w-3 h-3" /> Sent</> : <><X className="w-3 h-3" /> Not Sent</>}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Notes</div>
                <textarea
                  defaultValue={selected.notes || ''}
                  onBlur={e => patchClient(selected.id, { notes: e.target.value })}
                  placeholder="Follow-up notes, preferences, next action…"
                  className="w-full h-16 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 outline-none focus:border-[var(--gold)]/40 resize-none leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-auto">
                <button onClick={() => advanceStage(selected)}
                  disabled={selected.deal_stage === 'won' || selected.deal_stage === 'lost'}
                  className="w-full py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-gradient-to-r from-[var(--gold)] to-[#AA8C2C] hover:from-[#e8c94a] hover:to-[#c4a030] text-slate-950 shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Advance Stage
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleSendDesigns(selected)}
                    className="py-2 rounded-xl font-bold text-[10px] bg-slate-900 border border-blue-600/30 text-blue-300 hover:bg-blue-600/10 transition flex items-center justify-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Send Designs
                  </button>
                  <button onClick={() => createProject(selected)}
                    disabled={selected.deal_stage === 'won'}
                    className="py-2 rounded-xl font-bold text-[10px] bg-slate-900 border border-emerald-600/30 text-emerald-300 hover:bg-emerald-600/10 transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Sparkles className="w-3.5 h-3.5" /> Create Project
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs text-center">
              <div><Inbox className="w-8 h-8 mx-auto mb-2 opacity-20" />Select a client to view details</div>
            </div>
          )}
        </div>

        {/* COLUMN 3: Follow-up board */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden">
          <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase flex items-center gap-2 mb-4 flex-shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Follow-Up Board
            {followUp.length > 0 && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">{followUp.length}</span>}
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            {followUp.length === 0 && (
              <div className="text-center py-12">
                <UserCheck className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-xs font-semibold text-slate-500">All caught up</p>
                <p className="text-[10px] text-slate-600 mt-1">No pending follow-ups</p>
              </div>
            )}
            {followUp
              .sort((a, b) => STAGE_ORDER.indexOf(a.deal_stage) - STAGE_ORDER.indexOf(b.deal_stage))
              .map(c => (
                <div key={c.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 slide-up">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-xs font-bold text-slate-200">{c.name}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{c.location || c.phone}</span>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${STAGE_CONFIG[c.deal_stage]?.className || 'stage-new'}`}>
                      {STAGE_CONFIG[c.deal_stage]?.label || 'New'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--gold)]/80 font-semibold font-mono">{fmtINR(c.budget)}</span>
                    {Number(c.tokens_paid) > 0 && <span className="pill-token text-[8px] font-bold px-1.5 py-0.5 rounded-full">₹{(c.tokens_paid/1000).toFixed(0)}k</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedId(c.id)} className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] py-1.5 rounded-lg transition">Open</button>
                    <button onClick={() => advanceStage(c)} disabled={c.deal_stage === 'won' || c.deal_stage === 'lost'}
                      className="flex-1 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/25 text-blue-300 font-bold text-[10px] py-1.5 rounded-lg transition disabled:opacity-40">Advance</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ── Add Client Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2"><Plus className="w-4 h-4 text-[var(--gold)]" /> Add Client</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              <Fld label="Name *" value={form.name} onChange={v => setForm({ ...form, name: v })} />
              <div className="grid grid-cols-2 gap-2">
                <Fld label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
                <Fld label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
              </div>
              <Fld label="Location" value={form.location} onChange={v => setForm({ ...form, location: v })} />
              <div className="grid grid-cols-3 gap-2">
                <Fld label="Budget ₹" type="number" value={form.budget} onChange={v => setForm({ ...form, budget: v })} />
                <Fld label="Area sqft" type="number" value={form.area} onChange={v => setForm({ ...form, area: v })} />
                <Fld label="Token ₹" type="number" value={form.tokens_paid} onChange={v => setForm({ ...form, tokens_paid: v })} />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Requirements</label>
                <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
                  className="w-full h-16 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 outline-none focus:border-[var(--gold)]/40 resize-none" />
              </div>
              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Stage</label>
                <select value={form.deal_stage} onChange={e => setForm({ ...form, deal_stage: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 outline-none cursor-pointer">
                  {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 text-[11px] font-bold hover:text-slate-200">Cancel</button>
              <button onClick={submitAdd} className="px-4 py-2 rounded-xl bg-[var(--gold)] text-slate-950 text-[11px] font-bold hover:bg-[#e8c94a]">Add Client</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import CSV Modal ── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2"><Upload className="w-4 h-4 text-[var(--gold)]" /> Import Clients (CSV)</h3>
              <button onClick={() => setShowImport(false)} className="text-slate-500 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">
              Export your Excel sheet as <strong>.csv</strong> and upload it. Recognised columns: name, phone, email, location, budget, area, requirements, stage, tokens_paid, designs_sent.
              Or paste CSV text below.
            </p>
            <input type="file" accept=".csv,text/csv" onChange={handleFile}
              className="block w-full text-[11px] text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 file:text-[11px] file:font-bold mb-3" />
            <textarea value={csvText} onChange={e => { setCsvText(e.target.value); previewCsv(e.target.value); }}
              placeholder="name,phone,email,location,budget,area,requirements,stage,tokens_paid,designs_sent&#10;Rohan Sharma,+91 98765 43210,rohan@x.com,HSR Layout,850000,1200,Modular Kitchen,new,0,0"
              className="w-full h-32 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 font-mono outline-none focus:border-[var(--gold)]/40 resize-none" />
            {importPreview.length > 0 && (
              <div className="mt-2 text-[10px] text-emerald-400">✓ {importPreview.length} rows parsed — {importPreview.slice(0, 3).map(r => r.name).join(', ')}{importPreview.length > 3 ? '…' : ''}</div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowImport(false)} className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 text-[11px] font-bold hover:text-slate-200">Cancel</button>
              <button onClick={doImport} className="px-4 py-2 rounded-xl bg-[var(--gold)] text-slate-950 text-[11px] font-bold hover:bg-[#e8c94a]">Import {importPreview.length || ''}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Designs Email Modal ── */}
      {showEmail && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowEmail(false)}>
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2"><Mail className="w-4 h-4 text-[var(--gold)]" /> Send Designs — {selected.name}</h3>
              <button onClick={() => setShowEmail(false)} className="text-slate-500 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {EMAIL_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => openEmail(selected, t.id)}
                  className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition">
                  {t.label}
                </button>
              ))}
            </div>
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Subject</label>
            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-[var(--gold)]/40 mb-3" />
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Body</label>
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)}
              className="w-full h-40 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-300 font-mono outline-none focus:border-[var(--gold)]/40 resize-none leading-relaxed" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowEmail(false)} className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 text-[11px] font-bold hover:text-slate-200">Cancel</button>
              <button onClick={() => sendEmail(selected)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[#AA8C2C] text-slate-950 text-[11px] font-bold hover:from-[#e8c94a] flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Open Mail</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast-notification text-xs font-semibold flex items-center gap-2 ${toast.type === 'error' ? 'border-red-500/30 text-red-300' : 'text-slate-200'}`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Fld({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">{label}</label>
      <input type={type} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-[var(--gold)]/40" />
    </div>
  );
}

export default ClientBoard;
