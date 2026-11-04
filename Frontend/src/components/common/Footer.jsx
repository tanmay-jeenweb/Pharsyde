import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { STORE_INFO } from '../../data/products';
import { MapPin, Phone, Mail, Clock, ShieldAlert, Award, ArrowUpRight } from 'lucide-react';
import logoImg from '../../assets/image.webp';
import AppDownloadBadge from './AppDownloadBadge';

export default function Footer() {
  const { navigateTo } = useApp();

  return (
    <footer className="relative bg-white border-t border-slate-200 text-slate-600 overflow-hidden pt-16 pb-12 shadow-xs">
      {/* Ambient subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-[#8EF705]/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Link to="/">
                <img
                  src={logoImg}
                  alt="PHARSYDE"
                  className="h-9 w-auto object-contain cursor-pointer hover:opacity-90 transition-all drop-shadow-[0_2px_8px_rgba(142,247,5,0.4)]"
                />
              </Link>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Winnipeg's premier dispensary and lifestyle destination. Curating exceptional craft cannabis, 
              precision nicotine vapes, and refined accessories for the discerning consumer.
            </p>
            <div className="pt-2">
              <AppDownloadBadge />
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-4">
            <h4 className="font-heading text-slate-900 text-sm font-bold tracking-wider uppercase">
              Curated Collections
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/"
                  className="hover:text-slate-900 transition-colors flex items-center gap-1 group text-slate-600"
                >
                  <span>Home Showcase</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog"
                  className="hover:text-[#599e03] transition-colors flex items-center gap-1 group text-slate-600"
                >
                  <span>Product Catalogue</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-slate-900 transition-colors flex items-center gap-1 group text-slate-600"
                >
                  <span>About Pharsyde</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-slate-900 transition-colors flex items-center gap-1 group text-slate-600"
                >
                  <span>Contact & Store Visit</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Policies */}
          <div className="space-y-4">
            <h4 className="font-heading text-slate-900 text-sm font-bold tracking-wider uppercase">
              Policies & Protection
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/return-refund-policy"
                  className="hover:text-slate-900 transition-colors text-left text-slate-600 block"
                >
                  Return, Exchange & Warranty Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-slate-900 transition-colors text-left text-slate-600 block"
                >
                  Terms & Conditions of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-slate-900 transition-colors text-left text-slate-600 block"
                >
                  Privacy Policy (PIPEDA & CASL)
                </Link>
              </li>
              <li>
                <Link
                  to="/return-refund-policy#sec-02"
                  className="hover:text-slate-900 transition-colors text-left text-slate-600 block"
                >
                  Cannabis Final Sale & Recalls
                </Link>
              </li>
              <li>
                <Link
                  to="/return-refund-policy#sec-03"
                  className="hover:text-slate-900 transition-colors text-left text-slate-600 block"
                >
                  24-Hour Vape Concern Protocol
                </Link>
              </li>
              <li>
                <Link
                  to="/terms#tc-04"
                  className="hover:text-slate-900 transition-colors text-left text-slate-600 block"
                >
                  Age & Identity Verification Rules
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Retail Store Details */}
          <div className="space-y-4">
            <h4 className="font-heading text-slate-900 text-sm font-bold tracking-wider uppercase">
              Winnipeg Storefront
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#599e03] shrink-0 mt-0.5" />
                <span>{STORE_INFO.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-orange-600 shrink-0" />
                <a href={`tel:${STORE_INFO.phone}`} className="hover:text-slate-900 transition-colors">
                  {STORE_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#599e03] shrink-0" />
                <a href={`mailto:${STORE_INFO.email}`} className="hover:text-slate-900 transition-colors">
                  {STORE_INFO.email}
                </a>
              </div>
              <div className="flex items-start gap-3 pt-1">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5 text-slate-500">
                  <p>Mon – Fri: 7:00 AM – 10:00 PM</p>
                  <p>Saturday: 8:00 AM – 10:00 PM</p>
                  <p>Sunday: 9:00 AM – 9:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Warnings & Compliance Bar */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-10 flex flex-col md:flex-row items-center gap-4 text-xs">
          <ShieldAlert className="w-8 h-8 text-orange-600 shrink-0" />
          <div className="space-y-1 text-left">
            <p className="font-bold text-slate-900 tracking-wide uppercase">
              CANADIAN LEGAL & AGE NOTICE (MANITOBA 19+)
            </p>
            <p className="text-slate-600 leading-relaxed">
              Cannabis products and nicotine devices sold at Pharsyde are strictly for adult consumption by persons aged 19 or older in accordance with Manitoba regulations. Government-issued photo identification is mandatory for all in-store purchases and age-verified deliveries. Keep out of reach of children and youth. Please consume responsibly.
            </p>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} PHARSYDE Inc. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Winnipeg, Manitoba, Canada</span>
            <span>Secure SSL 256-Bit Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
