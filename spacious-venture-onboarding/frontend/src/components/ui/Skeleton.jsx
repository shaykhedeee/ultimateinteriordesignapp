import React from 'react';

export function Skeleton({ width = '100%', height = 16, className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-card">
      <Skeleton height={14} width="60%" />
      <Skeleton height={28} width="40%" style={{ marginTop: 8 }} />
      <Skeleton height={12} width="80%" style={{ marginTop: 6 }} />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <div className="skeleton-table-row" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12, padding: 12 }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={14} />
      ))}
    </div>
  );
}
