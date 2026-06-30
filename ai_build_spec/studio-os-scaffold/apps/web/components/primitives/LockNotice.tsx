export function LockNotice({ reason }: { reason?: string }) {
  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 8,
      border: '1px solid rgba(200,155,69,0.4)',
      background: 'rgba(200,155,69,0.12)',
      color: '#e1bf72',
      fontSize: 13,
      fontWeight: 600,
    }}>
      Scene Locked: {reason ?? 'This approved scene is read-only. Create a branch to continue editing.'}
    </div>
  );
}
