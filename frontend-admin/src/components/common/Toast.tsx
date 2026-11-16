import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    info: (msg: string) => addToast('info', msg),
  };

  const typeConfig = {
    success: { icon: CheckCircle2, bg: 'bg-emerald-50 border-emerald-200 text-emerald-900', iconColor: 'text-emerald-600' },
    error: { icon: AlertCircle, bg: 'bg-rose-50 border-rose-200 text-rose-900', iconColor: 'text-rose-600' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200 text-amber-900', iconColor: 'text-amber-600' },
    info: { icon: Info, bg: 'bg-blue-50 border-blue-200 text-blue-900', iconColor: 'text-blue-600' },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => {
              const cfg = typeConfig[t.type];
              const Icon = cfg.icon;

              return (
                <div
                  key={t.id}
                  className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-start gap-3 animate-in slide-in-from-top-2 duration-200 ${cfg.bg}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
                  <p className="text-xs font-medium flex-1 leading-snug">{t.message}</p>
                  <button
                    onClick={() => removeToast(t.id)}
                    className="p-1 -mr-1 -mt-1 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
