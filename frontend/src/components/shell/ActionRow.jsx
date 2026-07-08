import React from 'react';

/**
 * ActionRow — single quiet action row used in dashboards / tool hubs.
 * Replaces crammed 2-col icon grids and shouty full-width uppercase buttons.
 *
 * Props:
 *  icon     – lucide icon component
 *  title    – primary label (sentence case)
 *  desc     – muted supporting line
 *  onClick  – handler
 *  tone     – 'gold' (primary) | 'ghost' (secondary)
 *  badge    – optional small string (e.g. count)
 */
export default function ActionRow({ icon: Icon, title, desc, onClick, tone = 'ghost', badge }) {
  const isGold = tone === 'gold';
  return (
    <button
      onClick={onClick}
      className="group"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '11px 13px',
        borderRadius: '12px',
        border: isGold ? '1px solid var(--gold-border)' : '1px solid rgba(255,255,255,0.06)',
        background: isGold ? 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))' : 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.16s ease',
        color: 'var(--text-primary)'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = isGold ? 'var(--gold)' : 'rgba(201,168,76,0.25)'; e.currentTarget.style.background = isGold ? 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))' : 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isGold ? 'var(--gold-border)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = isGold ? 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))' : 'rgba(255,255,255,0.02)'; }}
    >
      {Icon && (
        <span style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isGold ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.05)',
          color: isGold ? 'var(--gold-bright)' : 'var(--text-secondary)'
        }}>
          <Icon style={{ width: 15, height: 15 }} />
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</span>
        {desc && <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>{desc}</span>}
      </span>
      {badge && (
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '2px 7px', flexShrink: 0 }}>{badge}</span>
      )}
    </button>
  );
}
