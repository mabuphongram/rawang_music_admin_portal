import React from 'react';
import { useBackend } from '../../context/BackendContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useBackend();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const bgMap = {
          success: 'bg-[#1c1c1c] border-[#3ecf8e]/40 text-[#3ecf8e]',
          error: 'bg-[#1c1c1c] border-red-500/40 text-red-400',
          warning: 'bg-[#1c1c1c] border-amber-500/40 text-amber-400',
          info: 'bg-[#1c1c1c] border-[#282828] text-[#ededed]',
        };

        const IconMap = {
          success: CheckCircle2,
          error: AlertCircle,
          warning: AlertTriangle,
          info: Info,
        };

        const Icon = IconMap[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded border backdrop-blur-md shadow-2xl flex items-start gap-3 transition-all transform animate-in slide-in-from-top-2 duration-200 ${bgMap[toast.type]}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-mono font-medium leading-relaxed">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#888888] hover:text-white transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
