import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      icon: AlertCircle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }[variant];

  const Icon = variantConfig.icon;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 z-10 space-y-4">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${variantConfig.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 ${variantConfig.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
