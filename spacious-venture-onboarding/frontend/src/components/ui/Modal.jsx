import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';

export function Modal({
  open,
  onClose,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  loading = false
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className={`modal modal-${variant}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <strong className="modal-title">{title}</strong>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {(onConfirm || onClose) && (
          <div className="modal-footer">
            <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
            {onConfirm && (
              <Button variant={variant === 'danger' ? 'danger' : 'gold'} onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
