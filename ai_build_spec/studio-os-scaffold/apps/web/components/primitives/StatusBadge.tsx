type Variant = 'approved' | 'review' | 'locked' | 'stale';

export function StatusBadge({ label, variant }: { label: string; variant: Variant }) {
  return <span className={`badge ${variant}`}>{label}</span>;
}
