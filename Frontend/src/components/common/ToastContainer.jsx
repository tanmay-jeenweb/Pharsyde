import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';

export default function ToastContainer() {
  const { toasts } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 p-4 rounded-2xl bg-white/95 border border-slate-200 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#0166dc] shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-[#0166dc] shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />}

          <p className="text-xs sm:text-sm font-medium text-slate-800 flex-1 leading-snug">
            {toast.message}
          </p>
        </div>
      ))}
    </div>
  );
}
