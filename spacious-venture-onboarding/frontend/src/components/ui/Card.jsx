import React from 'react';

export function Card({ className = '', children, hover = false, ...rest }) {
  const cls = ['card', hover ? 'card-hover' : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardBody({ className = '', children }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}
