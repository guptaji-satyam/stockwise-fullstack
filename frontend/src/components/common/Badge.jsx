import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizeStyles = {
    xs: 'text-[11px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};

export const OrderStatusBadge = ({ status }) => {
  const map = {
    Pending: { variant: 'warning', label: 'Pending' },
    Processing: { variant: 'info', label: 'Processing' },
    Shipped: { variant: 'purple', label: 'Shipped' },
    Delivered: { variant: 'success', label: 'Delivered' },
    Cancelled: { variant: 'danger', label: 'Cancelled' },
  };

  const current = map[status] || { variant: 'default', label: status };

  return <Badge variant={current.variant}>{current.label}</Badge>;
};

export const PaymentStatusBadge = ({ status }) => {
  const map = {
    Paid: { variant: 'success', label: 'Paid' },
    Pending: { variant: 'warning', label: 'Pending' },
    Failed: { variant: 'danger', label: 'Failed' },
    Refunded: { variant: 'purple', label: 'Refunded' },
  };

  const current = map[status] || { variant: 'default', label: status };

  return <Badge variant={current.variant}>{current.label}</Badge>;
};
