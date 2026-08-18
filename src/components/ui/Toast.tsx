import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast(title, message, 'success');
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast(title, message, 'error');
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 font-brand-sans">
        {toasts.map((toast) => {
          const config = {
            success: { bg: 'bg-[#FAF6EF]', border: 'border-[#667052]', text: 'text-[#4F583D]', icon: CheckCircle2, iconColor: 'text-[#667052]' },
            error: { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-900', icon: AlertCircle, iconColor: 'text-rose-600' },
            warning: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900', icon: AlertTriangle, iconColor: 'text-amber-600' },
            info: { bg: 'bg-[#FAF6EF]', border: 'border-[#B85C38]', text: 'text-[#292724]', icon: Info, iconColor: 'text-[#B85C38]' },
          }[toast.type];

          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg animate-in slide-in-from-bottom-2 duration-200 ${config.bg} ${config.border} ${config.text}`}
              role="alert"
              aria-live="polite"
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">{toast.title}</p>
                {toast.message && (
                  <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:opacity-75 rounded-lg shrink-0 cursor-pointer"
                aria-label="Fechar notificação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showToast: (title: string, message?: string) => console.log(title, message),
      showSuccess: (title: string, message?: string) => console.log('SUCCESS:', title, message),
      showError: (title: string, message?: string) => console.error('ERROR:', title, message),
    };
  }
  return context;
};
