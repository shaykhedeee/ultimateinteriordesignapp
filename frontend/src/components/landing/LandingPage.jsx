import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, Ruler, Palette, FileText, Zap, ArrowRight, Check, Star } from 'lucide-react';

const API = '';

const FEATURES = [
  { icon: Ruler,    title:'Plan Intelligence',     desc:'Upload a floor plan; AI extracts rooms, walls, openings, scale and Vastu zones automatically.' },
  { icon: Layers,   title:'Editable 3D Scene',     desc:'One parametric source of truth — place modular cabinets, wardrobes and pooja units with real mm precision.' },
  { icon: Sparkles, title:'Photoreal Renders',     desc:'Gemini / OpenAI / Freepik pipelines produce 8k interiors in your studio style, not stock photos.' },
  { icon: Palette,  title:'Materials & Quotes',    desc:'Laminate, hardware and finish library feeds a GST-ready BOM and client quotation in seconds.' },
  { icon: FileText, title:'Drawings & Elevations', desc:'Annotated wall drawings, cabinet elevations and DXF/PDF exports — production-ready every time.' },
  { icon: Zap,      title:'AURA Co-pilot',         desc:'Chat to restyle rooms, optimise budgets and regenerate renders. The AI partner that ships work.' }
];

const PIPELINE = [
  { step:'01', title:'Intake',      desc:'Client brief, lifestyle, budget & references' },
  { step:'02', title:'Plan',        desc:'Floor-plan model with AI-detected rooms' },
  { step:'03', title:'Scene',       desc:'Editable 3D truth, parametric modules' },
  { step:'04', title:'Docs',        desc:'Elevations, DXF & PDF exports' },
  { step:'05', title:'Renders',     desc:'Photoreal AI visuals in your style' },
  { step:'06', title:'Deliver',     desc:'Presentation pack & client sign-off' }
];

const COMPETITORS = ['Magicplan', 'Infurnia', 'Planner 5D', 'Bella'];

export default function LandingPage({ onEnterApp }) {
  const [brand, setBrand] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`${API}/api/whitelabel/public`).then(r => r.json()).then(d => {
      if (!active) return;
      const s = d.settings || {};
      setBrand(s);
      const root = document.documentElement;
      if (s.accentColor) root.style.setProperty('--wl-accent', s.accentColor);
      if (s.surfaceColor) root.style.setProperty('--wl-surface', s.surfaceColor);
      if (s.textColor) root.style.setProperty('--wl-text', s.textColor);
      if (s.fontDisplay) root.style.setProperty('--wl-font', s.fontDisplay);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const accent = brand?.accentColor || '#C9A84C';
  const studio = brand?.studioName || 'ULTIDA';
  const tagline = brand?.tagline || 'The Ultimate Interior Design Application';

  return (
    <div style={{ minHeight:'100vh', background:'var(--wl-surface, #0A0A0D)', color:'var(--wl-text, #F0EEE8)', fontFamily:'var(--wl-font, Inter), system-ui, sans-serif' }}>

      {/* ── Nav ── */}
      <header style={{ position:'sticky', top:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 40px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,10,13,0.7)', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg, ${accent}, ${accent}99)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#0A0A0D', fontWeight:900, fontSize:15 }}>{brand?.logoText || 'U'}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, letterSpacing:'-0.01em' }}>{studio}</div>
            <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Interior Design OS</div>
          </div>
        </div>
        <nav style={{ display:'flex', alignItems:'center', gap:'26px', fontSize:'12.5px', color:'var(--text-secondary)', fontWeight:600 }}>
          <a href="#features" style={{ color:'inherit', textDecoration:'none' }}>Features</a>
          <a href="#pipeline" style={{ color:'inherit', textDecoration:'none' }}>Pipeline</a>
          <a href="#compare" style={{ color:'inherit', textDecoration:'none' }}>Compare</a>
          <button onClick={onEnterApp} style={{ padding:'9px 18px', borderRadius:11, background:`linear-gradient(135deg, ${accent}, ${accent}cc)`, color:'#0A0A0D', fontWeight:700, border:'none', cursor:'pointer', fontSize:'12.5px' }}>Open Studio</button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section style={{ maxWidth:1120, margin:'0 auto', padding:'80px 40px 60px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'6px 14px', borderRadius:99, border:`1px solid ${accent}44`, background:`${accent}11`, color:accent, fontSize:'11px', fontWeight:700, letterSpacing:'0.04em', marginBottom:24 }}>
          <Sparkles style={{ width:13, height:13 }} /> AI-native interior design, end to end
        </div>
        <h1 style={{ fontSize:'clamp(36px, 6vw, 62px)', lineHeight:1.04, fontWeight:800, letterSpacing:'-0.03em', margin:'0 0 18px', maxWidth:880, marginLeft:'auto', marginRight:'auto' }}>
          {studio} — replace your <span style={{ color:accent }}>six-tool stack</span> with one subscription
        </h1>
        <p style={{ fontSize:'16px', color:'var(--text-secondary)', maxWidth:620, margin:'0 auto 32px', lineHeight:1.6, fontWeight:500 }}>{tagline}. From floor-plan to photoreal render to signed-off production package — without leaving the app.</p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={onEnterApp} style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 26px', borderRadius:13, background:`linear-gradient(135deg, ${accent}, ${accent}cc)`, color:'#0A0A0D', fontWeight:700, fontSize:'14px', border:'none', cursor:'pointer', boxShadow:`0 8px 30px ${accent}33` }}>
            Enter the Studio <ArrowRight style={{ width:16, height:16 }} />
          </button>
          <a href="#pipeline" style={{ display:'inline-flex', alignItems:'center', padding:'14px 26px', borderRadius:13, border:'1px solid rgba(255,255,255,0.12)', color:'var(--text-primary)', fontWeight:600, fontSize:'14px', textDecoration:'none' }}>See the pipeline</a>
        </div>
        <div style={{ display:'flex', gap:'28px', justifyContent:'center', marginTop:44, flexWrap:'wrap' }}>
          {[['8k','Photoreal renders'],['6→1','Tools replaced'],['<3 min','Plan to scene'],['GST','Ready quotes']].map(([n,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'26px', fontWeight:800, color:accent, letterSpacing:'-0.02em' }}>{n}</div>
              <div style={{ fontSize:'11px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ maxWidth:1120, margin:'0 auto', padding:'60px 40px' }}>
        <h2 style={{ fontSize:'30px', fontWeight:800, letterSpacing:'-0.02em', textAlign:'center', margin:'0 0 8px' }}>One platform, every craft</h2>
        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'14px', margin:'0 0 40px' }}>Built for Indian interior firms that sell outcomes, not just drawings.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'16px' }}>
          {FEATURES.map(({ icon:Icon, title, desc }) => (
            <div key={title} style={{ padding:'24px', borderRadius:18, border:'1px solid rgba(255,255,255,0.06)', background:'var(--surface-1)', boxShadow:'var(--shadow-card)' }}>
              <span style={{ width:42, height:42, borderRadius:12, display:'inline-flex', alignItems:'center', justifyContent:'center', background:`${accent}1a`, color:accent, marginBottom:14 }}>
                <Icon style={{ width:20, height:20 }} />
              </span>
              <div style={{ fontSize:'16px', fontWeight:700, marginBottom:6 }}>{title}</div>
              <p style={{ fontSize:'12.5px', color:'var(--text-secondary)', lineHeight:1.55, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section id="pipeline" style={{ maxWidth:1120, margin:'0 auto', padding:'60px 40px' }}>
        <h2 style={{ fontSize:'30px', fontWeight:800, letterSpacing:'-0.02em', textAlign:'center', margin:'0 0 40px' }}>The 6-stage pipeline</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'14px' }}>
          {PIPELINE.map((p, i) => (
            <div key={p.step} style={{ padding:'20px 18px', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', background:'linear-gradient(180deg, var(--surface-1), rgba(255,255,255,0.01))', position:'relative' }}>
              <div style={{ fontSize:'11px', fontWeight:800, color:accent, letterSpacing:'0.1em' }}>{p.step}</div>
              <div style={{ fontSize:'15px', fontWeight:700, margin:'8px 0 4px' }}>{p.title}</div>
              <p style={{ fontSize:'11px', color:'var(--text-muted)', lineHeight:1.45, margin:0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Compare ── */}
      <section id="compare" style={{ maxWidth:1120, margin:'0 auto', padding:'60px 40px' }}>
        <h2 style={{ fontSize:'30px', fontWeight:800, letterSpacing:'-0.02em', textAlign:'center', margin:'0 0 8px' }}>Why firms switch</h2>
        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'14px', margin:'0 0 36px' }}>Versus {COMPETITORS.join(' · ')}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'16px' }}>
          {[
            'Floor plan → render → production in one workspace',
            'Real mm cabinet geometry, not decoration-only 3D',
            'Indian GST quotes & laminate library built in',
            'AURA AI regenerates any room from a chat prompt',
            'White-label the whole studio for your brand',
            'DXF + PDF elevations your factory can cut'
          ].map((row) => (
            <div key={row} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'14px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)', background:'var(--surface-1)' }}>
              <Check style={{ width:16, height:16, color:accent, flexShrink:0, marginTop:1 }} />
              <span style={{ fontSize:'12.5px', color:'var(--text-secondary)', lineHeight:1.45 }}>{row}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth:920, margin:'0 auto', padding:'40px 40px 90px' }}>
        <div style={{ borderRadius:24, padding:'48px 40px', textAlign:'center', background:`linear-gradient(135deg, ${accent}14, rgba(255,255,255,0.02))`, border:`1px solid ${accent}33` }}>
          <h2 style={{ fontSize:'28px', fontWeight:800, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Ship your next project tonight</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'14px', margin:'0 0 26px' }}>Open the studio and run a full pipeline on a sample project in minutes.</p>
          <button onClick={onEnterApp} style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 30px', borderRadius:13, background:`linear-gradient(135deg, ${accent}, ${accent}cc)`, color:'#0A0A0D', fontWeight:700, fontSize:'14px', border:'none', cursor:'pointer' }}>
            Launch {studio} <ArrowRight style={{ width:16, height:16 }} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'28px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:600 }}>© {new Date().getFullYear()} {studio}. {tagline}.</div>
        <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>Powered by {studio} Interior Design OS</div>
      </footer>
    </div>
  );
}
