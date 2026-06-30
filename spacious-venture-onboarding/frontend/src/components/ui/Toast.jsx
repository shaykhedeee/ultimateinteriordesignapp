import React, { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colors = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info'
};

export function Toast({ id, type = 'info', message, duration = 4000, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const Icon = icons[type] || icons.info;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => handleDismiss(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss?.(id), 250);
  }, [id, onDismiss]);

  const cls = ['toast', colors[type] || colors.info, exiting ? 'toast-exit' : 'toast-enter'].filter(Boolean).join(' ');

  return (
    <div className={cls} role="alert">
      <Icon size={18} className="toast-icon" />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
