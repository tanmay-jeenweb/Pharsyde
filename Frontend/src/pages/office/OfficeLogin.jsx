import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginOfficeApi } from '../../services/officeApi';
import { Shield, Lock, User, ArrowRight, CheckCircle2, Store, Eye, EyeOff } from 'lucide-react';

export default function OfficeLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/office/dashboard';

  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginOfficeApi(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans">
      
      {/* Left Brand Panel (Emerald Green Theme) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-900/40 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white text-[#064e3b] flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-950/20">
            P
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">PHARSYDE</h1>
            <p className="text-xs text-emerald-200 font-medium tracking-wide">ENTERPRISE OFFICE SUITE</p>
          </div>
        </div>

        {/* Center Highlights */}
        <div className="relative z-10 my-auto max-w-lg space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 mb-4">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              Secure Administrative Gateway
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-snug">
              Unified Backoffice &amp; Master Data Management
            </h2>
            <p className="mt-4 text-emerald-100 text-sm xl:text-base leading-relaxed">
              Manage enterprise master data, configure granular user role permissions, monitor TechPOS inventory image synchronization, and audit activity logs with confidence.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              'User Master & Granular Role Permission Matrix',
              'Product Master with POS Inventory Alignment',
              'Product Image Master & High-Speed Image Sync',
              'Real-Time Activity & Audit Logs with JSON Diff'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-emerald-50">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 pt-6 border-t border-emerald-600/40 flex items-center justify-between text-xs text-emerald-200">
          <span>&copy; {new Date().getFullYear()} Pharsyde Enterprise</span>
          <Link to="/" className="flex items-center gap-1.5 text-white hover:text-emerald-100 font-semibold underline underline-offset-4">
            <Store className="w-3.5 h-3.5" />
            Switch to Public Storefront
          </Link>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
          
          {/* Header */}
          <div>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-bold text-lg">
                P
              </div>
              <span className="font-extrabold text-slate-800 text-sm tracking-tight">PHARSYDE OFFICE</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Office Login
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username or Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter username or email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white placeholder-slate-400 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white placeholder-slate-400 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 transition-all shadow-md shadow-emerald-900/10 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Office</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Need help? Contact system admin</span>
            <Link to="/" className="text-emerald-700 hover:text-emerald-800 font-semibold">
              Return to Store &rarr;
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}

