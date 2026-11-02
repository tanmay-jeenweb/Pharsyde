import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ShoppingBag } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen pt-36 pb-24 bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#8EF705]/20 border border-[#8EF705]/50 flex items-center justify-center text-[#529402]">
          <Compass className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#529402]">
            Error 404
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            PAGE NOT FOUND
          </h1>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            The page you are looking for doesn't exist or has moved. Explore our curated selection or return home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>

          <Link
            to="/catalog"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md shadow-[#8EF705]/25 inline-flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Catalogue</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

