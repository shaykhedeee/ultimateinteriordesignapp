import React from 'react';

const badgeVariants = {
  default: 'badge-default',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  gold: 'badge-gold',
  info: 'badge-info'
};

export function Badge({ variant = 'default', className = '', children }) {
  const cls = ['badge', badgeVariants[variant] || badgeVariants.default, className].filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}
