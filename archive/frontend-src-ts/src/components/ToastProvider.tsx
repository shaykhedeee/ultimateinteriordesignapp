import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, Sparkles, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'ai';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }]);
    
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    timers.current.set(id, timer);
  }, [removeToast]);

  useEffect(() => {
    return () => {
      timers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      case 'ai': return <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-emerald-500/40';
      case 'error': return 'border-red-500/40';
      case 'warning': return 'border-amber-500/40';
      case 'info': return 'border-blue-500/40';
      case 'ai': return 'border-indigo-500/40';
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto glass-panel p-3.5 rounded-2xl border ${getBorderColor(toast.type)} bg-slate-950/95 shadow-2xl animate-in slide-in-from-right-4 fade-in flex items-start gap-3 transition-all duration-300`}
          >
            <div className="mt-0.5 shrink-0">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-slate-100">{toast.title}</div>
              {toast.message && (
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-0.5 rounded text-slate-500 hover:text-slate-300 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
