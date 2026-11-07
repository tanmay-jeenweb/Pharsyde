import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Info, AlertCircle, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-[60] flex flex-col gap-2.5 w-[calc(100%-2rem)] sm:w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isInfo = toast.type === 'info';
        const isSuccess = toast.type === 'success' || (!isError && !isWarning && !isInfo);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md animate-toast-in transition-all ${
              isError
                ? 'bg-red-50/95 border-red-200 text-red-700 shadow-red-500/10'
                : isWarning
                ? 'bg-amber-50/95 border-amber-200 text-amber-800 shadow-amber-500/10'
                : isInfo
                ? 'bg-blue-50/95 border-blue-200 text-blue-800 shadow-blue-500/10'
                : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#0166dc] shrink-0" />}
            {isInfo && <Info className="w-5 h-5 text-[#0166dc] shrink-0" />}
            {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            {isError && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}

            <p
              className={`text-xs sm:text-sm font-semibold flex-1 leading-snug ${
                isError
                  ? 'text-red-700'
                  : isWarning
                  ? 'text-amber-800'
                  : isInfo
                  ? 'text-blue-800'
                  : 'text-slate-800'
              }`}
            >
              {toast.message}
            </p>

            {removeToast && (
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
