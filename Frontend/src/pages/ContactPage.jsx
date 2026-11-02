import React, { useState } from 'react';
import { STORE_INFO } from '../data/products';
import { useApp } from '../context/AppContext';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export default function ContactPage() {
  const { showToast } = useApp();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Valid email is required';
    if (!form.message.trim() || form.message.length < 10) {
      errs.message = 'Please enter a message of at least 10 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please correct highlighted fields before submitting', 'error');
      return;
    }

    setStatus('loading');

    // Simulate backend submission
    setTimeout(() => {
      setStatus('success');
      setFeedbackMessage(
        `Thank you ${form.name}. Your message has been received by our Winnipeg dispensary team. We will reply to ${form.email} shortly.`
      );
      showToast('Message sent to Pharsyde customer care', 'success');
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC] text-slate-900 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#8EF705]/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#488203] block mb-2">
            CONNECT WITH PHARSYDE
          </span>
          <h1 className="font-heading text-4xl sm:text-6xl font-black text-slate-900 tracking-tight uppercase mb-4">
            REACH OUR WINNIPEG DISPENSARY
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Have questions about product availability, order fulfillment, or specific terpene profiles? 
            Our knowledgeable team is ready to assist you.
          </p>
        </div>

        {/* Contact Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Card 1: Address */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#8EF705] transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#8EF705]/15 border border-[#8EF705]/40 flex items-center justify-center text-[#488203] mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#488203] block mb-1">
                Storefront Location
              </span>
              <h3 className="font-heading text-base font-bold text-slate-900 mb-2">
                117 Regent Ave W
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Winnipeg, MB R2C 1R1 <br />
                Canada
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=117+Regent+Ave+W+Winnipeg+MB+R2C 1R1"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#488203] hover:underline font-bold"
            >
              <span>Get Driving Directions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 2: Phone */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-orange-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-600 block mb-1">
                Direct Line
              </span>
              <h3 className="font-heading text-base font-bold text-slate-900 mb-2">
                (204) 222-4753
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Speak directly with an on-duty budtender during open hours.
              </p>
            </div>
            <a
              href={`tel:${STORE_INFO.phone}`}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-orange-600 hover:underline font-bold"
            >
              <span>Call Store Now</span>
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 3: Email */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#8EF705] transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#8EF705]/15 border border-[#8EF705]/40 flex items-center justify-center text-[#488203] mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#488203] block mb-1">
                Electronic Mail
              </span>
              <h3 className="font-heading text-base font-bold text-slate-900 mb-2 break-all">
                {STORE_INFO.email}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inquiries, feedback & warranty diagnostic support.
              </p>
            </div>
            <a
              href={`mailto:${STORE_INFO.email}`}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#488203] hover:underline font-bold"
            >
              <span>Send Email</span>
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 4: Hours */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block mb-1">
                Store Hours
              </span>
              <h3 className="font-heading text-base font-bold text-slate-900 mb-2">
                Open 7 Days a Week
              </h3>
              <div className="text-xs text-slate-600 space-y-1">
                <p>Mon – Fri: 7am – 10pm</p>
                <p>Saturday: 8am – 10pm</p>
                <p>Sunday: 9am – 9pm</p>
              </div>
            </div>
            <span className="mt-4 text-[11px] text-[#488203] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8EF705]" />
              Open for Walk-In & Pickup
            </span>
          </div>
        </div>

        {/* Form and Map Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Form (7 Cols) */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
              <MessageSquare className="w-5 h-5 text-[#488203]" />
              <h2 className="font-heading text-xl font-bold text-slate-900 uppercase">
                Send Us a Message
              </h2>
            </div>

            {feedbackMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-[#8EF705]/15 border border-[#8EF705]/40 text-[#3d6e03] text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#488203] shrink-0 mt-0.5" />
                <p className="leading-relaxed">{feedbackMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  />
                  {errors.name && <span className="text-[10px] text-red-600">{errors.name}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  />
                  {errors.email && <span className="text-[10px] text-red-600">{errors.email}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(204) 555-0199"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Product Stock & Strains">Product Stock & Strains</option>
                    <option value="Order & Delivery Status">Order & Delivery Status</option>
                    <option value="Hardware & Warranty">Hardware & Warranty</option>
                    <option value="Wholesale & Producer Inquiry">Wholesale & Producer Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Message *
                </label>
                <textarea
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="How can our Winnipeg dispensary team assist you today?"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                />
                {errors.message && <span className="text-[10px] text-red-600">{errors.message}</span>}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-[#8EF705]/25"
              >
                {status === 'loading' ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Map Preview & Location Details (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
              <h3 className="font-heading text-lg font-bold text-slate-900 uppercase pb-3 border-b border-slate-100">
                Storefront Map & Location
              </h3>

              {/* Map Preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80"
                  alt="Winnipeg Map Graphic"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-[#8EF705] flex items-center justify-center text-black mb-3 shadow-lg shadow-[#8EF705]/30">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading text-base font-bold text-slate-900">
                    117 Regent Ave W
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Winnipeg, Manitoba R2C 1R1
                  </p>
                  <a
                    href="https://maps.google.com/?q=117+Regent+Ave+W+Winnipeg+MB+R2C 1R1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-md shadow-[#8EF705]/25"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Parking and Transit */}
              <div className="space-y-3 text-xs text-slate-600 pt-2">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#488203] shrink-0 mt-0.5" />
                  <span>Free dedicated customer parking available directly on Regent Ave W.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#488203] shrink-0 mt-0.5" />
                  <span>Curbside pickup designated bays ready within 30 minutes of online placement.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
