import React from 'react';

export type BadgeVariant =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUND_INITIATED'
  | 'REFUNDED'
  | 'PAID'
  | 'UNPAID'
  | 'FAILED'
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PUBLISHED'
  | 'DRAFT'
  | 'DEFAULT';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  // Order Statuses
  PENDING: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
  CONFIRMED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Confirmed' },
  PROCESSING: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Processing' },
  PACKED: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Packed' },
  SHIPPED: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500', label: 'Shipped' },
  OUT_FOR_DELIVERY: { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500', label: 'Out for Delivery' },
  DELIVERED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Delivered' },
  CANCELLED: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Cancelled' },
  RETURN_REQUESTED: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Return Requested' },
  RETURNED: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500', label: 'Returned' },
  REFUND_INITIATED: { bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500', label: 'Refund Initiated' },
  REFUNDED: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500', label: 'Refunded' },

  // Payment Statuses
  PAID: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
  UNPAID: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Unpaid' },
  FAILED: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Failed' },

  // Inventory Statuses
  IN_STOCK: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'In Stock' },
  LOW_STOCK: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Low Stock' },
  OUT_OF_STOCK: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Out of Stock' },

  // General Statuses
  ACTIVE: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
  INACTIVE: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Inactive' },
  PUBLISHED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Published' },
  DRAFT: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Draft' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const normalizedKey = (status || '').toUpperCase().replace(/[\s-]/g, '_');
  const style = statusStyles[normalizedKey] || {
    bg: 'bg-slate-100 border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    label: status,
  };

  const displayText = label || style.label || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${style.bg} ${style.text} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{displayText}</span>
    </span>
  );
};
