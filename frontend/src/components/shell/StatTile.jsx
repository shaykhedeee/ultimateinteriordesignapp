import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

/**
 * StatTile — calm, refined KPI tile. Replaces shouty `font-black uppercase
 * tracking-wider` stat blocks with a quiet luxury hierarchy.
 *
 * Props:
 *  label   – small caps muted label
 *  value   – large display number/string
 *  sub     – tiny supporting caption
 *  accent  – CSS color for the value (defaults to gold)
 *  glow    – bool, adds the gold radial glow + border
 *  trend   – optional { dir:'up'|'down', pct } for a delta chip
 */
export default function StatTile({ label, value, sub, accent = 'var(--gold)', glow = false, trend }) {
  return (
    <div
      style={{
        background: glow
          ? 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)'
          : 'var(--surface-1)',
        border: glow ? '1px solid var(--gold-border)' : '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: glow ? 'var(--shadow-gold)' : 'var(--shadow-card)',
        minHeight: '92px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {glow && (
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 80% at 100% 0%, rgba(201,168,76,0.10), transparent 60%)', pointerEvents:'none' }} />
      )}
      <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:'8px' }}>
        {label}
      </span>
      <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
        <strong style={{ fontSize:'27px', fontWeight:800, color: accent, lineHeight:1, letterSpacing:'-0.02em' }}>{value}</strong>
        {trend && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:'2px', fontSize:'10px', fontWeight:700, color: trend.dir === 'up' ? 'var(--emerald)' : 'var(--red-soft)' }}>
            {trend.dir === 'up' ? <ArrowUpRight style={{ width:11, height:11 }} /> : <TrendingUp style={{ width:11, height:11, transform:'rotate(180deg)' }} />}
            {trend.pct}
          </span>
        )}
      </div>
      {sub && (
        <span style={{ fontSize:'9px', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginTop:'8px' }}>
          {sub}
        </span>
      )}
    </div>
  );
}
