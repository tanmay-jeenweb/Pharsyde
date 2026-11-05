import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, AlertTriangle, Lock } from 'lucide-react';

export default function AgeGateModal() {
  const { isAgeVerified, confirmAge } = useApp();
  const [province, setProvince] = useState('MB');
  const [birthYear, setBirthYear] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (isAgeVerified) return null;

  const currentYear = new Date().getFullYear();
  const minAge = 19;

  const handleVerify = () => {
    if (!birthYear) {
      setErrorMessage('Please enter your birth year to confirm eligibility.');
      return;
    }
    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1900 || year > currentYear) {
      setErrorMessage('Please enter a valid four-digit birth year.');
      return;
    }

    if (currentYear - year < minAge) {
      setErrorMessage('You must be 19 years of age or older to enter this website.');
      return;
    }

    setErrorMessage('');
    confirmAge();
  };

  const handleDecline = () => {
    window.location.href = 'https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis.html';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl text-center overflow-hidden">
        {/* Ambient Top Glow in #0166dc */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-gradient-to-b from-[#0166dc]/25 to-transparent blur-2xl pointer-events-none" />

        {/* Icon & Brand */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#0166dc]/25 border border-[#0166dc]/50 flex items-center justify-center text-slate-900 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-slate-900" />
        </div>

        <span className="text-[11px] font-bold tracking-[0.25em] text-[#0166dc] uppercase block mb-2">
          AGE VERIFICATION REQUIRED
        </span>

        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          WELCOME TO PHARSYDE
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          In accordance with Canadian federal regulations and Manitoba Provincial Law (LGCA), 
          you must be at least <strong className="text-slate-900">19 years of age</strong> to view cannabis and nicotine products.
        </p>

        {/* Form Inputs */}
        <div className="space-y-4 mb-6 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Province
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white"
            >
              <option value="MB">Manitoba (19+)</option>
              <option value="ON">Ontario (19+)</option>
              <option value="BC">British Columbia (19+)</option>
              <option value="AB">Alberta (19+)</option>
              <option value="SK">Saskatchewan (19+)</option>
              <option value="QC">Quebec (19+)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter Birth Year
            </label>
            <input
              type="number"
              placeholder="e.g. 1995"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0166dc] focus:bg-white"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold uppercase tracking-wider border border-slate-200 transition-colors"
          >
            I am Under 19
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md shadow-[#0166dc]/25 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Enter Pharsyde</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-6 leading-tight">
          By entering, you confirm you are 19 years of age or older and agree to our Terms of Use and Privacy Policy. Valid government ID required upon delivery or pickup.
        </p>
      </div>
    </div>
  );
}
