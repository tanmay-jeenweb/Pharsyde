import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Info, AlertCircle, AlertTriangle } from 'lucide-react';

export default function ToastContainer() {
  const { toasts } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 ${
              isError
                ? 'bg-red-600 border-red-700 text-white shadow-red-600/30 ring-1 ring-white/10'
                : isWarning
                ? 'bg-amber-500 border-amber-600 text-white shadow-amber-500/25 ring-1 ring-white/10'
                : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#0166dc] shrink-0" />}
            {isInfo && <Info className="w-5 h-5 text-[#0166dc] shrink-0" />}
            {isWarning && <AlertTriangle className="w-5 h-5 text-white shrink-0" />}
            {isError && <AlertCircle className="w-5 h-5 text-white shrink-0" />}

            <p
              className={`text-xs sm:text-sm font-semibold flex-1 leading-snug ${
                isError || isWarning ? 'text-white' : 'text-slate-800'
              }`}
            >
              {toast.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
