import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Image, Package, IndianRupee, MessageSquare,
  Download, Printer, ChevronDown, ChevronRight, Plus, Trash2,
  Eye, Check, Layers, Star, Share2, Edit3, LayoutGrid,
  BookOpen, Award, Palette, Sparkles, Move
} from 'lucide-react';

const API = '/api';

// ── Style colours (Vastu / status semantics) ──────────────────────────
const PALETTE_TAGS = [
  { label: 'Primary', hex: '#C9A84C' },
  { label: 'Secondary', hex: '#F0EEE8' },
  { label: 'Accent', hex: '#2DD4AA' },
  { label: 'Dark', hex: '#1C1C28' }
];

const SECTION_ICONS = {
  cover:     <BookOpen    style={{ width:14, height:14 }} />,
  brief:     <FileText    style={{ width:14, height:14 }} />,
  floorplan: <LayoutGrid  style={{ width:14, height:14 }} />,
  moodboard: <Image       style={{ width:14, height:14 }} />,
  renders:   <Sparkles    style={{ width:14, height:14 }} />,
  materials: <Palette     style={{ width:14, height:14 }} />,
  commercial:<IndianRupee style={{ width:14, height:14 }} />,
  notes:     <MessageSquare style={{ width:14, height:14 }} />
};

const ALL_SECTIONS = [
  { id:'cover',     label:'Cover Sheet',          desc:'Project identity, client name, designer branding' },
  { id:'brief',     label:'Brief Summary',         desc:'Room-wise key decisions from intake form' },
  { id:'floorplan', label:'Floor Plan Sheet',      desc:'2D CAD underlay with zone labels' },
  { id:'moodboard', label:'Room Mood Boards',      desc:'Reference images with material palette chips' },
  { id:'renders',   label:'3D Render Gallery',     desc:'Approved renders laid out as a board' },
  { id:'materials', label:'Material Schedule',     desc:'Client-readable finish and hardware table' },
  { id:'commercial',label:'Commercial Summary',    desc:'Budget, category breakdown, payment milestones' },
  { id:'notes',     label:'Revision Notes',        desc:'Open comments per section / round' }
];

/* ════════════════════════════════════════════════════════════════════════
   PRESENTATION STUDIO
   ════════════════════════════════════════════════════════════════════════ */
export default function PresentationStudio({ projectId }) {
  const [project, setProject]       = useState(null);
  const [renders, setRenders]       = useState([]);
  const [materials, setMaterials]   = useState([]);
  const [leads, setLeads]           = useState([]);
  const [activeSectionId, setActiveSectionId] = useState('cover');
  const [enabledSections, setEnabledSections] = useState(
    Object.fromEntries(ALL_SECTIONS.map(s => [s.id, true]))
  );
  const [shortlisted, setShortlisted] = useState(new Set());
  const [notes, setNotes]           = useState({});
  const [branding, setBranding]     = useState({
    studioName:  'Sharma Interiors',
    tagline:     'Where craft meets computation',
    designerName:'Muskan Sharma',
    phone:       '+91 98765 43210',
    email:       'hello@sharmainteriors.in',
    logoColor:   '#C9A84C'
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [share, setShare]         = useState(null);   // { token, shareUrl, downloadUrl, fileName }
  const [shareBusy, setShareBusy] = useState(false);
  const [copyOk, setCopyOk]       = useState(false);
  const [sharePack, setSharePack] = useState('signoff'); // 'brief' | 'signoff' | 'quotation'
  const printRef = useRef(null);

  // ── Data fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      fetch(`${API}/projects`).then(r => r.json()),
      fetch(`${API}/projects/${projectId}/renders`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/material-catalog`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/leads`).then(r => r.ok ? r.json() : [])
    ]).then(([projects, rens, mats, lds]) => {
      setProject(projects.find(p => p.id === projectId) || null);
      setRenders(Array.isArray(rens) ? rens : []);
      setMaterials(Array.isArray(mats) ? mats : []);
      setLeads(Array.isArray(lds) ? lds : []);
      // auto-shortlist approved renders
      const approved = (Array.isArray(rens) ? rens : []).filter(r => r.status === 'approved').map(r => r.id);
      setShortlisted(new Set(approved));
    }).catch(console.error);
  }, [projectId]);

  const toggleSection  = (id) => setEnabledSections(p => ({ ...p, [id]: !p[id] }));
  const toggleShortlist = (id) => setShortlisted(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const activeSection  = ALL_SECTIONS.find(s => s.id === activeSectionId);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrinting(false), 1000);
    }, 200);
  };

  const handleShare = async () => {
    if (!projectId) return;
    setShareBusy(true);
    setCopyOk(false);
    try {
      const res = await fetch(`${API}/projects/${projectId}/client-share?pack=${sharePack}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setShare({
          token: data.token,
          shareUrl: `${data.shareUrl}`,
          downloadUrl: `${data.downloadUrl}`,
          fileName: data.fileName
        });
      } else {
        window.__toast?.show('Could not generate share link: ' + (data.error || 'unknown error'));
      }
    } catch (err) {
      console.error(err);
      window.__toast?.show('Share generation failed: ' + err.message);
    } finally {
      setShareBusy(false);
    }
  };

  const copyShareLink = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.shareUrl);
      setCopyOk(true);
      } catch {
        const ok = await window.__auraConfirm?.confirm?.('Copy Link', 'Clipboard is blocked. Open link instead?') || Promise.resolve(false);
        if (ok) window.open(share.shareUrl, '_blank');
      }
  };

  const clientLead = leads.find(l => l.id === project?.lead_id);
  const clientName = project?.client_name || clientLead?.name || 'Client';
  const budgetL    = project?.budget ? (project.budget / 100000).toFixed(1) : '—';

  if (!projectId) {
    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--text-muted)' }}>
        <Award style={{ width:48, height:48, opacity:0.3 }} />
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text-secondary)', marginBottom:4 }}>Presentation Studio</div>
          <div style={{ fontSize:11 }}>Select a project from the header to build your client presentation pack.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--base-100)' }}>

      {/* ── Top toolbar ── */}
      <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--surface-1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,var(--gold),var(--gold-deep))', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Award style={{ width:16, height:16, color:'#060609' }} />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)' }}>Presentation Studio</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>
              {project?.name || '—'} · {clientName}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ display:'flex', gap:4, background:'rgba(0,0,0,0.25)', borderRadius:10, padding:4, border:'1px solid rgba(255,255,255,0.06)' }}>
            {['brief','signoff','quotation'].map(p => (
              <button
                key={p}
                onClick={() => { setSharePack(p); setShare(null); }}
                title={`${p} PDF pack`}
                style={{ padding:'5px 12px', borderRadius:8, fontSize:10, fontWeight:700, cursor:'pointer', textTransform:'capitalize', background: sharePack === p ? 'var(--gold)' : 'transparent', color: sharePack === p ? '#060609' : 'var(--text-muted)', border:'none', letterSpacing:'0.04em', transition:'all 0.15s' }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              window.open(`${API}/projects/${projectId}/elevations/combined-pdf`, '_blank');
              __toast?.success("Combined elevations PDF downloading…");
            }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-secondary)', fontWeight:700, fontSize:11, cursor:'pointer' }}
          >
            <Download style={{ width:13, height:13 }} />
            Combined A3 Elevations
          </button>
          <button
            onClick={handlePrint}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:10, background:'var(--gold)', color:'#060609', border:'none', fontWeight:800, fontSize:11, cursor:'pointer', letterSpacing:'0.06em' }}
          >
            <Printer style={{ width:13, height:13 }} />
            Export PDF / Print
          </button>
          <button
            onClick={handleShare}
            disabled={shareBusy}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background: share ? 'rgba(45,212,170,0.12)' : 'rgba(255,255,255,0.05)', border:'1px solid ' + (share ? 'rgba(45,212,170,0.45)' : 'rgba(255,255,255,0.08)'), color: share ? '#2DD4AA' : 'var(--text-secondary)', fontWeight:700, fontSize:11, cursor:'pointer' }}
          >
            <Share2 style={{ width:12, height:12 }} />
            {shareBusy ? 'Generating…' : 'Share Link'}
          </button>
        </div>
      </div>

      {/* Client share result panel */}
      {share && (
        <div style={{ padding:'10px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(45,212,170,0.06)', display:'flex', alignItems:'center', gap:12, flexShrink:0, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'#2DD4AA' }}>Client Link Ready · {sharePack}</span>
          <input
            readOnly
            value={share.shareUrl}
            onFocus={e => e.target.select()}
            style={{ flex:1, minWidth:260, background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'7px 10px', fontSize:11, color:'var(--text-secondary)', fontFamily:'monospace', outline:'none' }}
          />
          <button
            onClick={copyShareLink}
            style={{ padding:'7px 14px', borderRadius:8, background:'var(--gold)', color:'#060609', border:'none', fontWeight:800, fontSize:11, cursor:'pointer' }}
          >
            {copyOk ? 'Copied!' : 'Copy'}
          </button>
          <a
            href={share.downloadUrl}
            target="_blank"
            rel="noreferrer"
            style={{ padding:'7px 14px', borderRadius:8, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'var(--text-secondary)', fontWeight:700, fontSize:11, textDecoration:'none', cursor:'pointer' }}
          >
            Download PDF
          </a>
          <button
            onClick={async () => {
              if (!share?.token) return;
              const ok = await window.__auraConfirm?.confirm?.('Revoke Link', 'Revoke this share link? The client will no longer be able to access it.') || false;
              if (!ok) return;
              try {
                await fetch(`${API}/projects/${projectId}/client-share/${share.token}/revoke`, { method: 'DELETE' });
                setShare(null);
                setSharePack('signoff');
                window.__toast?.show('Share link revoked and file removed.');
              } catch (err) {
                window.__toast?.show('Revoke failed: ' + err.message);
              }
            }}
            style={{ padding:'7px 14px', borderRadius:8, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', color:'#EF4444', fontWeight:700, fontSize:11, cursor:'pointer' }}
          >
            Revoke
          </button>
        </div>
      )}

      {/* ── Main 3-column layout ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── LEFT: Section navigator ── */}
        <div style={{ width:220, borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', flexShrink:0, background:'var(--surface-1)', overflowY:'auto' }}>
          <div style={{ padding:'12px 14px 6px', fontSize:9, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)' }}>
            Pack Sections
          </div>
          {ALL_SECTIONS.map(sec => (
            <div
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              style={{
                padding:'9px 14px', cursor:'pointer', transition:'all 0.15s',
                display:'flex', alignItems:'center', gap:9,
                borderLeft: activeSectionId === sec.id ? '2.5px solid var(--gold)' : '2.5px solid transparent',
                background: activeSectionId === sec.id ? 'rgba(201,168,76,0.06)' : 'transparent',
              }}
              onMouseEnter={e => { if(activeSectionId !== sec.id) e.currentTarget.style.background='rgba(255,255,255,0.025)'; }}
              onMouseLeave={e => { if(activeSectionId !== sec.id) e.currentTarget.style.background='transparent'; }}
            >
              <span style={{ color: activeSectionId === sec.id ? 'var(--gold)' : 'var(--text-muted)', flexShrink:0 }}>
                {SECTION_ICONS[sec.id]}
              </span>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight: activeSectionId === sec.id ? 700 : 600, color: activeSectionId === sec.id ? 'var(--gold-bright)' : 'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {sec.label}
                </div>
              </div>
              {/* toggle */}
              <button
                onClick={e => { e.stopPropagation(); toggleSection(sec.id); }}
                style={{ marginLeft:'auto', flexShrink:0, width:18, height:18, borderRadius:4, border:'1px solid rgba(255,255,255,0.12)', background: enabledSections[sec.id] ? 'var(--gold)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s' }}
              >
                {enabledSections[sec.id] && <Check style={{ width:10, height:10, color:'#060609' }} />}
              </button>
            </div>
          ))}

          <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:'auto', flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:8 }}>
              Pack Summary
            </div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', display:'flex', flexDirection:'column', gap:4 }}>
              <span>✓ {Object.values(enabledSections).filter(Boolean).length} / {ALL_SECTIONS.length} sections</span>
              <span>✓ {shortlisted.size} renders shortlisted</span>
              <span>✓ ₹{budgetL}L total budget</span>
            </div>
          </div>
        </div>

        {/* ── CENTRE: Section editor ── */}
        <div style={{ flex:1, overflow:'auto', padding:'24px' }}>
          <SectionEditor
            sectionId={activeSectionId}
            project={project}
            renders={renders}
            materials={materials}
            branding={branding}
            setBranding={setBranding}
            clientName={clientName}
            budgetL={budgetL}
            shortlisted={shortlisted}
            toggleShortlist={toggleShortlist}
            notes={notes}
            setNotes={setNotes}
          />
        </div>

        {/* ── RIGHT: Live preview panel ── */}
        <div style={{ width:260, borderLeft:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', flexShrink:0, background:'var(--surface-1)', overflowY:'auto' }}>
          <div style={{ padding:'12px 14px 6px', fontSize:9, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)' }}>
            Page Preview
          </div>
          <LivePreview
            sectionId={activeSectionId}
            project={project}
            renders={renders}
            shortlisted={shortlisted}
            branding={branding}
            clientName={clientName}
            budgetL={budgetL}
          />
        </div>
      </div>

      {/* Print stylesheet injection */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-pack, .print-pack * { visibility: visible !important; }
          .print-pack { position: fixed; top: 0; left: 0; width: 100vw; z-index: 9999; background: white; }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION EDITOR — renders the edit form for each section
   ════════════════════════════════════════════════════════════════════════ */
function SectionEditor({ sectionId, project, renders, materials, branding, setBranding, clientName, budgetL, shortlisted, toggleShortlist, notes, setNotes }) {
  const setNote = (id, val) => setNotes(p => ({ ...p, [id]: val }));

  const cardStyle = {
    background:'var(--surface-2)', border:'1px solid rgba(255,255,255,0.06)',
    borderRadius:16, padding:20, marginBottom:16
  };
  const labelStyle = { fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 };
  const inputStyle = {
    background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9,
    padding:'8px 12px', fontSize:12, color:'var(--text-primary)', outline:'none', width:'100%', fontFamily:'inherit'
  };

  /* ── COVER ── */
  if (sectionId === 'cover') return (
    <div>
      <SectionHeader icon={<BookOpen />} title="Cover Sheet" desc="Designer branding, project title, client name" />
      <div style={cardStyle}>
        <span style={labelStyle}>Studio / Firm Name</span>
        <input style={inputStyle} value={branding.studioName} onChange={e => setBranding(p => ({...p, studioName:e.target.value}))} />
      </div>
      <div style={cardStyle}>
        <span style={labelStyle}>Designer Name</span>
        <input style={inputStyle} value={branding.designerName} onChange={e => setBranding(p => ({...p, designerName:e.target.value}))} />
      </div>
      <div style={cardStyle}>
        <span style={labelStyle}>Tagline</span>
        <input style={inputStyle} value={branding.tagline} onChange={e => setBranding(p => ({...p, tagline:e.target.value}))} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={cardStyle}>
          <span style={labelStyle}>Phone</span>
          <input style={inputStyle} value={branding.phone} onChange={e => setBranding(p => ({...p, phone:e.target.value}))} />
        </div>
        <div style={cardStyle}>
          <span style={labelStyle}>Email</span>
          <input style={inputStyle} value={branding.email} onChange={e => setBranding(p => ({...p, email:e.target.value}))} />
        </div>
      </div>
      <div style={cardStyle}>
        <span style={labelStyle}>Accent / Brand Colour</span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="color" value={branding.logoColor} onChange={e => setBranding(p => ({...p, logoColor:e.target.value}))} style={{ width:40, height:32, borderRadius:6, border:'none', cursor:'pointer', background:'none' }} />
          <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--text-secondary)' }}>{branding.logoColor}</span>
        </div>
      </div>
      <div style={cardStyle}>
        <span style={labelStyle}>Project Title</span>
        <input style={{...inputStyle, background:'rgba(201,168,76,0.05)', borderColor:'var(--gold-border)'}} value={project?.name || ''} readOnly />
      </div>
      <div style={cardStyle}>
        <span style={labelStyle}>Client Name</span>
        <input style={{...inputStyle, background:'rgba(201,168,76,0.05)', borderColor:'var(--gold-border)'}} value={clientName} readOnly />
      </div>
    </div>
  );

  /* ── BRIEF ── */
  if (sectionId === 'brief') return (
    <div>
      <SectionHeader icon={<FileText />} title="Brief Summary" desc="Room-wise key decisions captured during onboarding" />
      {['Living / Dining', 'Master Bedroom', 'Kitchen', 'Kids Room', 'Bathrooms'].map(room => (
        <div key={room} style={cardStyle}>
          <span style={labelStyle}>{room} — Key Decisions</span>
          <textarea
            rows={3}
            style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
            placeholder={`e.g. Japandi style, oak flooring, hidden storage behind TV panel...`}
            value={notes[`brief_${room}`] || ''}
            onChange={e => setNote(`brief_${room}`, e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  /* ── FLOORPLAN ── */
  if (sectionId === 'floorplan') return (
    <div>
      <SectionHeader icon={<LayoutGrid />} title="Floor Plan Sheet" desc="Upload or reference the approved 2D layout with zone annotations" />
      <div style={{ ...cardStyle, display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:40, border:'2px dashed rgba(255,255,255,0.08)' }}>
        <LayoutGrid style={{ width:40, height:40, color:'var(--text-muted)', opacity:0.5 }} />
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-secondary)' }}>Upload Floor Plan Image</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>PNG, PDF or DXF · Approved 2D layout from CAD screen</div>
        </div>
        <label style={{ padding:'8px 20px', borderRadius:10, background:'var(--gold)', color:'#060609', fontWeight:800, fontSize:11, cursor:'pointer' }}>
          Upload Blueprint
          <input type="file" className="hidden" accept="image/*,application/pdf" style={{ display:'none' }} />
        </label>
      </div>
      <div style={cardStyle}>
        <span style={labelStyle}>Zone Notes (for annotated callouts)</span>
        <textarea rows={4} style={{ ...inputStyle, resize:'vertical' }} placeholder="Living: 18×12 ft · Dining: 10×10 ft · Kitchen: L-shaped open plan..." value={notes.floorplan_zones || ''} onChange={e => setNote('floorplan_zones', e.target.value)} />
      </div>
    </div>
  );

  /* ── MOODBOARD ── */
  if (sectionId === 'moodboard') return (
    <div>
      <SectionHeader icon={<Image />} title="Room Mood Boards" desc="Reference images paired with material palette chips" />
      {['Living Room', 'Master Bedroom', 'Kitchen', 'Bathrooms'].map(room => (
        <div key={room} style={cardStyle}>
          <span style={labelStyle}>{room} Mood Board</span>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
            {[0,1,2].map(i => (
              <label key={i} style={{ aspectRatio:'16/10', background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:10, color:'var(--text-muted)', gap:4 }}>
                <Plus style={{ width:14, height:14 }} />
                Ref Image {i+1}
                <input type="file" accept="image/*" style={{ display:'none' }} />
              </label>
            ))}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {PALETTE_TAGS.map(pt => (
              <div key={pt.label} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:pt.hex, flexShrink:0 }} />
                <span style={{ fontSize:10, color:'var(--text-secondary)', fontWeight:600 }}>{pt.label}</span>
              </div>
            ))}
          </div>
          <textarea rows={2} style={{ ...inputStyle, resize:'vertical', marginTop:10 }} placeholder={`Describe ${room} mood: e.g. warm Japandi, oak and linen...`} value={notes[`mood_${room}`] || ''} onChange={e => setNote(`mood_${room}`, e.target.value)} />
        </div>
      ))}
    </div>
  );

  /* ── RENDERS ── */
  if (sectionId === 'renders') return (
    <div>
      <SectionHeader icon={<Sparkles />} title="3D Render Gallery" desc="Shortlist renders to include in the client pack" />
      {renders.length === 0 ? (
        <div style={{ ...cardStyle, textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <Sparkles style={{ width:32, height:32, opacity:0.3, margin:'0 auto 12px' }} />
          <div style={{ fontSize:12, fontWeight:600 }}>No renders found for this project yet.</div>
          <div style={{ fontSize:10, marginTop:4 }}>Generate renders in the 3D Render Studio, then return here to shortlist them.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
          {renders.map(r => {
            const isShortlisted = shortlisted.has(r.id);
            return (
              <div key={r.id} style={{ position:'relative', borderRadius:14, overflow:'hidden', border: isShortlisted ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)', background:'var(--surface-2)', cursor:'pointer', transition:'all 0.18s' }} onClick={() => toggleShortlist(r.id)}>
                {r.image_url ? (
                  <img src={r.image_url} alt={r.room_type} style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block' }} />
                ) : (
                  <div style={{ width:'100%', aspectRatio:'16/9', background:'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Sparkles style={{ width:24, height:24, opacity:0.2 }} />
                  </div>
                )}
                <div style={{ padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)' }}>{r.room_type || 'Room Render'}</div>
                    <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'capitalize' }}>{r.style || 'AI Generated'}</div>
                  </div>
                  <div style={{ width:22, height:22, borderRadius:6, background: isShortlisted ? 'var(--gold)' : 'rgba(255,255,255,0.06)', border:'1px solid '+(isShortlisted ? 'var(--gold)' : 'rgba(255,255,255,0.12)'), display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                    {isShortlisted && <Check style={{ width:12, height:12, color:'#060609' }} />}
                  </div>
                </div>
                {isShortlisted && (
                  <div style={{ position:'absolute', top:8, left:8, background:'var(--gold)', color:'#060609', fontSize:8, fontWeight:900, padding:'2px 8px', borderRadius:5, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                    Shortlisted
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ ...cardStyle, marginTop:16 }}>
        <span style={labelStyle}>Gallery Intro Text</span>
        <textarea rows={2} style={{ ...inputStyle, resize:'vertical' }} placeholder="e.g. Selected 3D visualizations representing your approved design direction..." value={notes.renders_intro || ''} onChange={e => setNote('renders_intro', e.target.value)} />
      </div>
    </div>
  );

  /* ── MATERIALS ── */
  if (sectionId === 'materials') return (
    <div>
      <SectionHeader icon={<Palette />} title="Material & Finish Schedule" desc="Client-readable table of all selected finishes and hardware" />
      {materials.length === 0 ? (
        <div style={{ ...cardStyle, textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <Palette style={{ width:32, height:32, opacity:0.3, margin:'0 auto 12px' }} />
          <div style={{ fontSize:12, fontWeight:600 }}>No materials in catalog.</div>
        </div>
      ) : (
        <div style={{ ...cardStyle, overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                {['Material Name','Category','Finish / Grade','Area','Rate / sqft','Notes'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:9, fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.slice(0,10).map((m, i) => (
                <tr key={m.id || i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'8px 10px', color:'var(--text-primary)', fontWeight:600 }}>{m.name}</td>
                  <td style={{ padding:'8px 10px', color:'var(--text-muted)', textTransform:'capitalize' }}>{m.category}</td>
                  <td style={{ padding:'8px 10px', color:'var(--text-secondary)' }}>{m.finish || 'Matte'}</td>
                  <td style={{ padding:'8px 10px', color:'var(--text-muted)', fontFamily:'monospace' }}>—</td>
                  <td style={{ padding:'8px 10px', color:'var(--gold)', fontFamily:'monospace', fontWeight:700 }}>₹{m.price_per_sqft || '—'}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <input style={{ ...inputStyle, padding:'3px 8px', fontSize:10, width:120 }} placeholder="Note..." value={notes[`mat_${m.id}`] || ''} onChange={e => setNote(`mat_${m.id}`, e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ── COMMERCIAL ── */
  if (sectionId === 'commercial') return (
    <div>
      <SectionHeader icon={<IndianRupee />} title="Commercial Summary" desc="Budget overview, category breakdown, payment milestones" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Total Budget', val:`₹${budgetL}L`, color:'var(--gold)' },
          { label:'Modular Joinery', val:'~60%', color:'var(--blue-soft)' },
          { label:'Civil / Painting', val:'~25%', color:'var(--emerald)' }
        ].map(kpi => (
          <div key={kpi.label} style={{ background:'var(--surface-2)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:14 }}>
            <div style={{ fontSize:9, fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{kpi.label}</div>
            <div style={{ fontSize:22, fontWeight:900, color:kpi.color }}>{kpi.val}</div>
          </div>
        ))}
      </div>
      <div style={cardStyle}>
        <span style={labelStyle}>Payment Milestone Notes</span>
        <textarea rows={5} style={{ ...inputStyle, resize:'vertical', lineHeight:1.7 }} placeholder="Milestone 1: 30% advance on order placement — ₹XL&#10;Milestone 2: 40% on material delivery — ₹XL&#10;Milestone 3: 30% on installation completion — ₹XL" value={notes.commercial_milestones || ''} onChange={e => setNote('commercial_milestones', e.target.value)} />
      </div>
      <div style={cardStyle}>
        <span style={labelStyle}>Inclusions / Exclusions</span>
        <textarea rows={4} style={{ ...inputStyle, resize:'vertical' }} placeholder="Included: modular joinery, electrical fixtures, hardware&#10;Excluded: civil work, painting, AC, plumbing" value={notes.commercial_scope || ''} onChange={e => setNote('commercial_scope', e.target.value)} />
      </div>
    </div>
  );

  /* ── NOTES ── */
  if (sectionId === 'notes') return (
    <div>
      <SectionHeader icon={<MessageSquare />} title="Revision Notes" desc="Open comments and revision requests from client review" />
      {['Round 1 (Initial Concept)', 'Round 2 (Material Finalization)', 'Round 3 (Pre-Production Sign-off)'].map(round => (
        <div key={round} style={cardStyle}>
          <span style={labelStyle}>{round}</span>
          <textarea rows={4} style={{ ...inputStyle, resize:'vertical', lineHeight:1.7 }} placeholder="e.g. Client requested wardrobe handles to be changed from Matte Black to Brushed Gold..." value={notes[`round_${round}`] || ''} onChange={e => setNote(`round_${round}`, e.target.value)} />
        </div>
      ))}
    </div>
  );

  return <div style={{ color:'var(--text-muted)', padding:20 }}>Select a section from the left panel.</div>;
}

/* ── Section header ── */
function SectionHeader({ icon, title, desc }) {
  return (
    <div style={{ marginBottom:20, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
        <span style={{ color:'var(--gold)' }}>{icon}</span>
        <h2 style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>{title}</h2>
      </div>
      <p style={{ fontSize:11, color:'var(--text-muted)', marginLeft:22 }}>{desc}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   LIVE PREVIEW PANEL — mini card showing what the page will look like
   ════════════════════════════════════════════════════════════════════════ */
function LivePreview({ sectionId, project, renders, shortlisted, branding, clientName, budgetL }) {
  const previewStyle = {
    margin:12, background:'white', borderRadius:10, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.4)',
    aspectRatio:'210/297', display:'flex', flexDirection:'column', color:'#111'
  };

  const shortlistedRenders = renders.filter(r => shortlisted.has(r.id));

  return (
    <div style={{ padding:'4px 0', overflowY:'auto' }}>
      {/* Page preview */}
      <div style={previewStyle}>
        {sectionId === 'cover' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:`linear-gradient(145deg, #0A0A0D, ${branding.logoColor}22)`, color:'white', padding:20, justifyContent:'space-between' }}>
            <div style={{ fontSize:7, fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase', color:branding.logoColor }}>{branding.studioName}</div>
            <div>
              <div style={{ fontSize:14, fontWeight:900, color:'white', lineHeight:1.3, marginBottom:6 }}>{project?.name || 'Project Name'}</div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.6)', marginBottom:2 }}>Prepared for</div>
              <div style={{ fontSize:11, fontWeight:700, color:'white' }}>{clientName}</div>
              <div style={{ width:30, height:2, background:branding.logoColor, marginTop:8, borderRadius:2 }} />
            </div>
            <div style={{ fontSize:6, color:'rgba(255,255,255,0.4)' }}>{branding.tagline} · {new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</div>
          </div>
        )}
        {sectionId === 'renders' && (
          <div style={{ padding:10, flex:1 }}>
            <div style={{ fontSize:6, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'#888', marginBottom:8 }}>3D Render Gallery</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {shortlistedRenders.slice(0,4).map(r => (
                <div key={r.id} style={{ aspectRatio:'16/9', background:'#eee', borderRadius:5, overflow:'hidden' }}>
                  {r.image_url && <img src={r.image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                </div>
              ))}
              {shortlistedRenders.length === 0 && (
                <div style={{ gridColumn:'span 2', height:60, background:'#f5f5f5', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, color:'#aaa' }}>
                  No renders shortlisted yet
                </div>
              )}
            </div>
          </div>
        )}
        {sectionId === 'commercial' && (
          <div style={{ padding:10, flex:1 }}>
            <div style={{ fontSize:6, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', color:'#888', marginBottom:8 }}>Commercial Summary</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4, marginBottom:8 }}>
              {[['Total Budget','₹'+budgetL+'L'],['Joinery','~60%'],['Civil','~25%']].map(([l,v]) => (
                <div key={l} style={{ background:'#f9f9f9', borderRadius:5, padding:'5px 6px', textAlign:'center' }}>
                  <div style={{ fontSize:5, color:'#999', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
                  <div style={{ fontSize:9, fontWeight:900, color:'#222', marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:6, color:'#aaa' }}>Payment milestones: 30% · 40% · 30%</div>
          </div>
        )}
        {!['cover','renders','commercial'].includes(sectionId) && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#f9f9f9' }}>
            <div style={{ textAlign:'center', color:'#ccc' }}>
              <div style={{ fontSize:8, fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.1em' }}>{ALL_SECTIONS.find(s=>s.id===sectionId)?.label}</div>
              <div style={{ fontSize:6 }}>Content preview here</div>
            </div>
          </div>
        )}
      </div>

      {/* Pack summary card */}
      <div style={{ margin:'0 12px 12px', background:'var(--surface-2)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:14 }}>
        <div style={{ fontSize:9, fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:8 }}>
          Pack Details
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:10, color:'var(--text-secondary)' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>Project</span>
            <span style={{ fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', maxWidth:120, whiteSpace:'nowrap' }}>{project?.name || '—'}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>Client</span>
            <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{clientName}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>Renders</span>
            <span style={{ fontWeight:700, color:'var(--gold)' }}>{shortlisted.size} selected</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>Budget</span>
            <span style={{ fontWeight:700, color:'var(--gold)' }}>₹{budgetL}L</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>Date</span>
            <span style={{ color:'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
