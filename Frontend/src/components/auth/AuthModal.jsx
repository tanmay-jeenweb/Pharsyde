import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, Mail, User, Phone, Calendar, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalTab, setAuthModalTab, customerLogin, customerRegister, showToast } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign In Form
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register Form
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    ageConsent: false,
  });

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginData.email || !loginData.password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    try {
      await customerLogin(loginData.email, loginData.password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!registerData.name || !registerData.email || !registerData.password) {
      setError('Please complete all required fields.');
      return;
    }
    if (!registerData.ageConsent) {
      setError('You must confirm you are 19+ years old to register.');
      return;
    }

    setLoading(true);
    try {
      await customerRegister({
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        dateOfBirth: registerData.dateOfBirth,
      });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8EF705]/20 border border-[#8EF705]/40 flex items-center justify-center text-[#488203]">
              <Lock className="w-4 h-4 text-[#488203]" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900 tracking-tight uppercase">
                {authModalTab === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
              </h3>
              <p className="text-[11px] text-slate-500">Pharsyde Member Portal</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-6 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('login');
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              authModalTab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('register');
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              authModalTab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Account
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Login Form */}
        {authModalTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#8EF705]/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In to Account</span>}
            </button>

            <p className="text-[11px] text-slate-500 text-center pt-2">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setError('');
                }}
                className="text-[#488203] font-bold hover:underline"
              >
                Register now
              </button>
            </p>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="(204) 000-0000"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={registerData.dateOfBirth}
                    onChange={(e) => setRegisterData({ ...registerData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={registerData.ageConsent}
                onChange={(e) => setRegisterData({ ...registerData, ageConsent: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 accent-[#8EF705]"
              />
              <span>
                I confirm I am <strong className="text-slate-900">19+ years of age</strong> (legal age in Manitoba).
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#8EF705]/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Member Account</span>}
            </button>

            <p className="text-[11px] text-slate-500 text-center pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setError('');
                }}
                className="text-[#488203] font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

