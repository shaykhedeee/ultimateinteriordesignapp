import React, { useState, useEffect, useRef } from 'react';
import { Zap, CheckCircle2, AlertTriangle, CircleSlash, ChevronRight, X } from 'lucide-react';

const API = 'http://127.0.0.1:5055';

const MODE_META = {
  live:          { label:'AI Live',        color:'var(--emerald)', bg:'rgba(45,212,170,0.10)', border:'rgba(45,212,170,0.30)', Icon: CheckCircle2, glow: '0 0 18px rgba(45,212,170,0.25)' },
  partial:       { label:'AI Partial',     color:'#F59E0B',        bg:'rgba(245,158,11,0.10)', border:'rgba(245,158,11,0.30)', Icon: AlertTriangle,  glow: '0 0 18px rgba(245,158,11,0.20)' },
  misconfigured: { label:'AI Misconfigured', color:'#F87171',      bg:'rgba(248,113,113,0.10)', border:'rgba(248,113,113,0.30)', Icon: AlertTriangle, glow: '0 0 18px rgba(248,113,113,0.20)' },
  offline:       { label:'AI Offline',     color:'var(--text-muted)', bg:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.10)', Icon: CircleSlash, glow: 'none' }
};

/**
 * AiStatusBanner — honest, dismissible system AI status pill.
 * Polls /api/system/ai-status every 30s. "Setup" navigates to settings.
 */
export default function AiStatusBanner({ onOpenSetup }) {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const dismissKey = 'ultida_ai_banner_dismissed';
  const timer = useRef(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(dismissKey) === '1');
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/system/ai-status`);
        if (res.ok) setStatus(await res.json());
      } catch { /* offline */ }
    };
    load();
    timer.current = setInterval(load, 30000);
    return () => clearInterval(timer.current);
  }, []);

  if (dismissed || !status) return null;
  const meta = MODE_META[status.mode] || MODE_META.offline;
  const { Icon } = meta;

  const dismiss = () => { setDismissed(true); localStorage.setItem(dismissKey, '1'); };

  return (
    <div style={{ position:'fixed', bottom:18, left:18, zIndex:90, maxWidth: 360 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'9px 12px', borderRadius:'13px', cursor:'pointer',
          background: meta.bg, border:`1px solid ${meta.border}`,
          boxShadow: meta.glow, backdropFilter:'blur(10px)',
          color: meta.color, transition:'all 0.2s'
        }}
      >
        <Icon style={{ width:15, height:15 }} />
        <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.02em' }}>
          {meta.label}
          {status.readyProviders?.length > 0 && (
            <span style={{ color:'var(--text-secondary)', fontWeight:500 }}> · {status.readyProviders.length} provider{status.readyProviders.length>1?'s':''}</span>
          )}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:0, display:'flex' }}
          aria-label="Dismiss"
        >
          <X style={{ width:12, height:12 }} />
        </button>
      </div>

      {open && (
        <div style={{
          marginTop:8, padding:'14px 16px', borderRadius:'14px',
          background:'rgba(15,15,20,0.96)', border:`1px solid ${meta.border}`,
          boxShadow:'var(--shadow-panel)', backdropFilter:'blur(12px)',
          color:'var(--text-primary)'
        }}>
          <div style={{ fontSize:'11px', fontWeight:700, color: meta.color, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{meta.label}</div>
          <p style={{ fontSize:'11.5px', color:'var(--text-secondary)', lineHeight:1.5, margin:'0 0 10px' }}>{status.recommendation}</p>

          {status.readyProviders?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:10 }}>
              {status.readyProviders.map(p => (
                <span key={p.key} style={{ fontSize:'9.5px', fontWeight:600, padding:'3px 8px', borderRadius:8, background:'rgba(45,212,170,0.10)', color:'var(--emerald)', border:'1px solid rgba(45,212,170,0.22)' }}>
                  {p.label}
                </span>
              ))}
            </div>
          )}

          {status.missingKeysForLiveRender?.length > 0 && (
            <div style={{ fontSize:'10.5px', color:'var(--text-muted)', marginBottom:10 }}>
              <span style={{ color:'var(--amber)' }}>Add keys:</span> {status.missingKeysForLiveRender.join(', ')}
            </div>
          )}

          <div style={{ display:'flex', gap:'8px' }}>
            {onOpenSetup && (
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onOpenSetup(); }}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'8px', borderRadius:10, background:'linear-gradient(135deg, var(--gold) 0%, var(--gold-deep) 100%)', color:'#0A0A0D', fontSize:'11px', fontWeight:700, cursor:'pointer', border:'none' }}
              >
                Setup <ChevronRight style={{ width:13, height:13 }} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
