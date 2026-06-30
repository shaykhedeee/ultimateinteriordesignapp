import React from 'react';
import { Button } from './Button.jsx';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`empty-state ${className}`}>
      {Icon && <Icon size={32} className="empty-state-icon" />}
      <strong className="empty-state-title">{title}</strong>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="gold" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
