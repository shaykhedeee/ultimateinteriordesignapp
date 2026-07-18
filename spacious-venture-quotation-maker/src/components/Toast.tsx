import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: 'bg-[#1f352b] text-white border-l-4 border-[#b8873b]',
    error: 'bg-red-900 text-white border-l-4 border-red-500',
    info: 'bg-stone-800 text-white border-l-4 border-blue-400'
  };

  const icons = {
    success: <CheckCircle2 size={18} className="text-[#b8873b]" />,
    error: <AlertCircle size={18} className="text-red-400" />,
    info: <Info size={18} className="text-blue-400" />
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border border-stone-700/20 max-w-sm animate-bounce-short transition-all duration-300">
      <div className={`flex items-center gap-2.5 ${styles[type]}`}>
        {icons[type]}
        <span className="text-xs font-semibold pr-4">{message}</span>
        <button onClick={onClose} className="hover:opacity-70 text-white/60 p-0.5">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
