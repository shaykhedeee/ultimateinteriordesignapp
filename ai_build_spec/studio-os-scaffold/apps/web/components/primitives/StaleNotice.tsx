export function StaleNotice({ label }: { label: string }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 8,
      border: '1px solid rgba(196,106,74,0.35)',
      background: 'rgba(196,106,74,0.12)',
      color: '#e79c83',
      fontSize: 13,
      fontWeight: 600,
    }}>
      Stale Output Warning: {label}
    </div>
  );
}
