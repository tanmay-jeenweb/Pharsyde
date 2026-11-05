import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, Mail, User, Phone, Calendar, ShieldCheck, ArrowRight, Loader2, Sparkles, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';
import { sendOtpApi, verifyOtpApi } from '../../services/orderService';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalTab, setAuthModalTab, customerLogin, customerRegister, showToast } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);

  // Register multi-step state: 'form' | 'otp'
  const [registerStep, setRegisterStep] = useState('form');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsActivation(false);
    if (!loginData.email || !loginData.password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    try {
      await customerLogin(loginData.email, loginData.password);
    } catch (err) {
      if (err.data?.code === 'IN_STORE_ACCOUNT_NEEDS_ACTIVATION' || (err.message && err.message.toLowerCase().includes('in-store'))) {
        setNeedsActivation(true);
        setError(err.message || 'We found your in-store TechPOS membership! Please set your online password to activate it.');
      } else {
        setNeedsActivation(false);
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to customer's email
  const handleInitiateRegister = async (e) => {
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
      const res = await sendOtpApi({
        email: registerData.email,
        purpose: 'customer_register',
      });
      setRegisterStep('otp');
      setResendCooldown(res.cooldownSeconds || 60);
      setOtpCode('');
      showToast(`Verification code sent to ${registerData.email}`, 'info');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await sendOtpApi({
        email: registerData.email,
        purpose: 'customer_register',
      });
      setResendCooldown(res.cooldownSeconds || 60);
      showToast('A new verification code has been sent to your email.', 'info');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP with backend to get verificationToken
      const verifyRes = await verifyOtpApi({
        email: registerData.email,
        otp: cleanOtp,
        purpose: 'customer_register',
      });

      const verificationToken = verifyRes.verificationToken;

      // 2. Submit user registration with verificationToken
      await customerRegister({
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        dateOfBirth: registerData.dateOfBirth,
        verificationToken,
      });

      // Reset state on success
      setRegisterStep('form');
      setOtpCode('');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
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
            <div className="w-9 h-9 rounded-xl bg-[#0166dc]/20 border border-[#0166dc]/40 flex items-center justify-center text-[#0166dc]">
              <Lock className="w-4 h-4 text-[#0166dc]" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900 tracking-tight uppercase">
                {authModalTab === 'login'
                  ? 'Customer Sign In'
                  : registerStep === 'otp'
                  ? 'Verify Your Email'
                  : 'Create Customer Account'}
              </h3>
              <p className="text-[11px] text-slate-500">Pharsyde Member Portal</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              setRegisterStep('form');
              setError('');
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Visible on Login & Step 1 of Register) */}
        {registerStep === 'form' && (
          <div className="grid grid-cols-2 p-1.5 mx-6 mt-6 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('login');
                setError('');
                setRegisterStep('form');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                setRegisterStep('form');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authModalTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Account
            </button>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
            <p className="leading-tight">{error}</p>
          </div>
        )}

        {/* In-Store Activation Notice */}
        {needsActivation && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>In-Store TechPOS Account Found!</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Your membership exists in our physical store. Click below to set your website password and activate online ordering!
            </p>
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('register');
                setRegisterData((prev) => ({ ...prev, email: loginData.email }));
                setNeedsActivation(false);
                setError('');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Activate Online Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        {authModalTab === 'login' ? (
          /* Sign In Form */
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#0166dc]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
            </button>

            <p className="text-[11px] text-slate-500 text-center pt-2">
              Don't have an online account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setRegisterStep('form');
                  setError('');
                }}
                className="text-[#0166dc] font-bold hover:underline cursor-pointer"
              >
                Register now
              </button>
            </p>
          </form>
        ) : registerStep === 'otp' ? (
          /* Step 2: Email OTP Verification Form */
          <form onSubmit={handleVerifyAndRegister} className="p-6 space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#0166dc]/20 border border-[#0166dc]/40 flex items-center justify-center mx-auto text-[#0166dc] mb-2">
                <Mail className="w-5 h-5 text-[#0166dc]" />
              </div>
              <p className="text-xs text-slate-600">
                A 6-digit verification code was emailed to:
              </p>
              <p className="text-sm font-bold text-slate-900 font-mono">
                {registerData.email}
              </p>
              <button
                type="button"
                onClick={() => {
                  setRegisterStep('form');
                  setError('');
                }}
                className="inline-flex items-center gap-1 text-[11px] text-[#0166dc] hover:underline font-semibold mt-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change email</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl py-3 text-2xl font-mono font-black text-center tracking-[0.4em] text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.trim().length !== 6}
              className="w-full py-3 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] disabled:opacity-50 text-black text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#0166dc]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Create Account</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Didn't receive the email?</span>
              {resendCooldown > 0 ? (
                <span className="font-mono text-slate-400">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-[#0166dc] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Step 1: Registration Information Form */
          <form onSubmit={handleInitiateRegister} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">A verification code will be sent to this email.</p>
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0166dc] focus:bg-white"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-[11px] text-slate-600">
              <input
                type="checkbox"
                checked={registerData.ageConsent}
                onChange={(e) => setRegisterData({ ...registerData, ageConsent: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 accent-[#0166dc]"
              />
              <span>
                I confirm I am <strong className="text-slate-900">19+ years of age</strong> (legal age in Manitoba).
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#0166dc]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Continue to Email Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setError('');
                }}
                className="text-[#0166dc] font-bold hover:underline cursor-pointer"
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
