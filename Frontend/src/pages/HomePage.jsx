import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../data/products';
import ProductCard from '../components/common/ProductCard';
import AppDownloadBadge from '../components/common/AppDownloadBadge';
import heroBg from '../assets/hero-bg.png';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Award,
  Zap,
  HeartHandshake,
  Check,
  ChevronRight,
  Flame,
  Shield,
  Layers,
  Thermometer,
  Clock,
  MapPin,
  Mail,
  Gift
} from 'lucide-react';

export default function HomePage() {
  const { navigateTo, showToast } = useApp();

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // idle | loading | success | error
  const [newsletterMsg, setNewsletterMsg] = useState('');

  // Experience Section interactive tab state
  const [activeExpTab, setActiveExpTab] = useState(0);

  const bestSellers = PRODUCTS.filter((p) => p.isBestSeller).slice(0, 4);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus('error');
      setNewsletterMsg('Please enter a valid email address.');
      return;
    }
    if (!newsletterConsent) {
      setNewsletterStatus('error');
      setNewsletterMsg('Please consent to receiving Pharsyde updates.');
      return;
    }

    setNewsletterStatus('loading');
    // Simulated backend subscription
    setTimeout(() => {
      setNewsletterStatus('success');
      setNewsletterMsg('Welcome to Pharsyde Circle. Check your inbox for your 10% welcome invitation.');
      showToast('Successfully subscribed to Pharsyde Circle', 'success');
      setNewsletterEmail('');
    }, 1000);
  };

  const experienceSteps = [
    {
      id: "genetics",
      phase: "01",
      subtitle: "PURITY & LINEAGE",
      title: "Precision Curation & Craft Genetics",
      desc: "Every cultivar in our vault is rigorously vetted for trichome density, terpene preservation, and clean burn. We collaborate directly with premier Canadian craft growers and micro-cultivators to secure small-batch harvests before they reach mainstream shelves.",
      stats: [
        { label: "Cure Duration", val: "21 Days Cold-Cured" },
        { label: "Terpene Profile", val: "Up to 4.5% Active" },
        { label: "Purity Grade", val: "100% Lab Tested" }
      ],
      features: ["Full Spectrum Whole Flower", "Hand-Trimmed & Air-Cured", "Certified Manitoba Retail"],
      image: "https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=1400&q=80",
      accent: "#8EF705"
    },
    {
      id: "hardware",
      phase: "02",
      subtitle: "THERMAL ENGINEERING",
      title: "Sleek Hardware & Solventless Extraction",
      desc: "Experience pure, unadulterated flavor. From aerospace-grade CNC 6061-T6 aluminum grinders to all-ceramic medical-core vaporizers, our hardware systems are engineered to prevent thermal degradation and preserve delicate monoterpenes.",
      stats: [
        { label: "Heating Element", val: "Full Medical Ceramic" },
        { label: "Extraction", val: "Solventless Ice Water" },
        { label: "Warranty", val: "7-Day Store Guarantee" }
      ],
      features: ["Zero Combustion Degradation", "Leak-Proof Aerospace Shell", "Dual Firing Precision"],
      image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1400&q=80",
      accent: "#EA580C"
    },
    {
      id: "fulfillment",
      phase: "03",
      subtitle: "EFFORTLESS FULFILLMENT",
      title: "Fast Winnipeg Delivery & Boutique Pickup",
      desc: "Conveniently located at 117 Regent Ave W in Winnipeg. Experience white-glove age-verified curbside pickup prepared in under 30 minutes, or discreet same-day courier delivery directly across the Winnipeg metropolitan area.",
      stats: [
        { label: "Storefront", val: "117 Regent Ave W" },
        { label: "Pickup Ready", val: "Within 30 Minutes" },
        { label: "Local Delivery", val: "Free Over $75 CAD" }
      ],
      features: ["Discreet Bonded Couriers", "19+ Government Photo ID Check", "Open 7 Days a Week"],
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1400&q=80",
      accent: "#8EF705"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* =========================================================================
          SECTION 2: HERO SECTION - THE ART OF PURE CANNABIS (LIGHT LUXURY)
         ========================================================================= */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] lg:min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50 border-b border-slate-200">
        {/* Soft radial ambient highlights with #8EF705 */}
        <div className="absolute top-1/3 left-1/6 w-[500px] h-[500px] bg-[#8EF705]/5 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-orange-500/10 blur-[150px] pointer-events-none rounded-full" />

        {/* Ambient subtle artwork backdrop with smooth light blending */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30 lg:opacity-40 pointer-events-none">
          <img
            src={heroBg}
            alt="The Art of Pure Cannabis"
            className="w-full h-full object-cover object-[65%_center] lg:object-[70%_center] mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/85 lg:via-[#F8FAFC]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-[#F8FAFC]/50" />
        </div>

        {/* Hero Content Grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Editorial Typography */}
            <div className="lg:col-span-7">
              {/* Top Line: THE ART OF ———— */}
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-5">
                <span className="font-sans text-xs sm:text-sm md:text-[15px] tracking-[0.35em] uppercase text-[#529402] font-black">
                  THE ART OF
                </span>
                <span className="w-14 sm:w-20 md:w-24 h-[2.5px] bg-gradient-to-r from-[#8EF705] to-transparent inline-block" />
              </div>

              {/* Main Headline: Pure CANNABIS */}
              <div className="flex flex-col mb-6 sm:mb-8 select-none">
                <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9.5rem] text-slate-900 font-light italic tracking-tight leading-[0.88]">
                  Pure
                </h1>
                <div className="relative inline-block mt-1 sm:mt-2">
                  <span className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8.5rem] tracking-[0.03em] uppercase text-[#225203] font-black leading-[0.88] block">
                    CANNABIS
                  </span>
                  <span className="h-1.5 sm:h-2 w-24 sm:w-36 bg-[#8EF705] rounded-full mt-3 block shadow-sm shadow-[#8EF705]/50" />
                </div>
              </div>

              {/* Bottom Line: QUALITY. CRAFTSMANSHIP. EXPERIENCE. */}
              <div className="flex items-center gap-3 sm:gap-4 mb-8">
                <span className="font-sans text-[10px] sm:text-xs md:text-sm tracking-[0.24em] uppercase text-slate-600 font-semibold">
                  QUALITY. CRAFTSMANSHIP. EXPERIENCE.
                </span>
                <span className="w-12 sm:w-16 md:w-20 h-[1px] bg-gradient-to-r from-slate-400 to-transparent inline-block" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigateTo('catalog')}
                  className="px-7 py-3.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-[#8EF705]/30 transition-all flex items-center gap-2 group hover:scale-[1.02]"
                >
                  <span>Explore Catalogue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigateTo('contact')}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-300 font-heading font-semibold text-xs uppercase tracking-wider transition-all shadow-xs"
                >
                  Visit Winnipeg Store
                </button>

                {/* Google Play Store Mobile App Download Badge */}
                <AppDownloadBadge />
              </div>
            </div>

            {/* Right: Modern Luxury Artwork Showcase Card */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-3 group">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/4.5] bg-slate-900">
                  <img
                    src={heroBg}
                    alt="Pharsyde Craft Botanicals"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-black tracking-widest uppercase bg-[#8EF705] text-black border border-[#8EF705] shadow-md backdrop-blur-md mb-2">
                      CURATED HARVEST • WINNIPEG 19+
                    </span>
                    <h3 className="font-heading text-lg font-bold text-white">
                      Botanical Craftsmanship
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: BRAND INTRODUCTION ("BEYOND THE ORDINARY")
         ========================================================================= */}
      <section id="brand-intro" className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Editorial Typography */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#529402]">
                <Sparkles className="w-4 h-4 text-[#8EF705]" />
                <span>The Pharsyde Philosophy</span>
              </div>

              <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight uppercase">
                BEYOND THE <br />
                <span className="text-[#225203]">ORDINARY</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-light">
                Pharsyde is built around a passion for quality, thoughtful curation and modern lifestyle experiences. Discover premium selections and products designed for those who value the details.
              </p>

              <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                We believe that consumption is an art form. From full-spectrum live rosins to precision-engineered dry flower accessories, we eliminate the guesswork and present only the finest artisanal creations Canada has to offer.
              </p>

              <div className="pt-4 flex items-center gap-6">
                <button
                  onClick={() => navigateTo('about')}
                  className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-widest text-slate-900 hover:text-[#529402] transition-colors group"
                >
                  <span>Learn Our Heritage & Standards</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Column: Visual Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Ambient glow backing */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#8EF705]/20 to-orange-500/15 rounded-3xl blur-2xl transform -rotate-3" />

                {/* Primary Card */}
                <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl p-6 group">
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden relative mb-5 bg-slate-100">
                    <img
                      src="https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=800&q=80"
                      alt="Cannabis Craftsmanship"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#8EF705] block mb-1">
                        Batch No. 892-CRAFT
                      </span>
                      <h4 className="font-heading text-lg font-bold text-white">
                        Curated Trichome Density
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: MAIN COLLECTIONS (3 Distinct Cards)
         ========================================================================= */}
      <section className="py-20 relative bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#529402] block mb-2">
              CURATED DOMAINS
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase">
              DISTINCT COLLECTIONS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CARD 1: PURE CANNABIS */}
            <div className="group relative rounded-3xl bg-white border border-slate-200 hover:border-[#8EF705] overflow-hidden transition-all duration-500 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-[#8EF705]/20">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80"
                  alt="The Art of Pure Cannabis"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2 group-hover:text-[#529402] transition-colors">
                    THE ART OF PURE CANNABIS
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Explore premium flower, concentrates, cartridges and carefully selected cannabis products.
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('catalog')}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-[#8EF705] hover:text-black text-slate-900 text-xs font-heading font-extrabold uppercase tracking-wider border border-slate-200 hover:border-[#8EF705] transition-all flex items-center justify-center gap-2 group/btn shadow-xs"
                >
                  <span>EXPLORE CANNABIS</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* CARD 2: ELEVATED RITUALS, CALM ENGINEERED */}
            <div className="group relative rounded-3xl bg-white border border-slate-200 hover:border-orange-500/60 overflow-hidden transition-all duration-500 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-orange-500/10">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
                  alt="Elevated Rituals"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                    ELEVATED RITUALS, CALM ENGINEERED
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Discover botanical-inspired products, accessories and tools designed to complement your lifestyle.
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('catalog')}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-900 text-xs font-heading font-bold uppercase tracking-wider border border-slate-200 hover:border-orange-600 transition-all flex items-center justify-center gap-2 group/btn shadow-xs"
                >
                  <span>EXPLORE COLLECTION</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* CARD 3: MODERN APOTHECARY FOR NIGHTFALL */}
            <div className="group relative rounded-3xl bg-white border border-slate-200 hover:border-[#8EF705] overflow-hidden transition-all duration-500 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-[#8EF705]/20">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
                  alt="Modern Apothecary"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2 group-hover:text-[#529402] transition-colors">
                    MODERN APOTHECARY FOR NIGHTFALL
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Explore thoughtfully selected lifestyle essentials and small-batch products.
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('catalog')}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-[#8EF705] hover:text-black text-slate-900 text-xs font-heading font-extrabold uppercase tracking-wider border border-slate-200 hover:border-[#8EF705] transition-all flex items-center justify-center gap-2 group/btn shadow-xs"
                >
                  <span>DISCOVER MORE</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: BEST SELLERS ("THE MOST WANTED")
         ========================================================================= */}
      <section className="py-24 relative bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-600 block mb-2">
                TOP CURATIONS
              </span>
              <h2 className="font-heading text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase">
                THE MOST WANTED
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Explore some of our most popular selections.
              </p>
            </div>

            <button
              onClick={() => navigateTo('catalog')}
              className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-[#529402] hover:text-slate-900 transition-colors"
            >
              <span>View Full Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: IMPROVED EXPERIENCE SECTION ("YOUR EXPERIENCE. YOUR WAY.")
         ========================================================================= */}
      <section className="py-28 relative bg-[#F8FAFC] border-y border-slate-200 overflow-hidden">
        {/* Ambient radial glows */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-[#8EF705]/15 blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-orange-500/10 blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Editorial Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight uppercase mb-4 leading-tight">
              YOUR EXPERIENCE. <br />
              <span className="bg-gradient-to-r from-slate-900 via-[#529402] to-orange-600 bg-clip-text text-transparent">
                YOUR WAY.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              From carefully selected products to thoughtfully curated accessories, discover a shopping experience designed around quality, convenience and attention to detail.
            </p>
          </div>

          {/* Horizontal Storytelling Tabs Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs max-w-4xl mx-auto">
            {experienceSteps.map((step, idx) => {
              const isActive = activeExpTab === idx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveExpTab(idx)}
                  className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-xs border border-[#8EF705]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-[11px] font-mono font-bold ${isActive ? 'text-[#529402]' : 'text-slate-400'}`}>
                    {step.phase}
                  </span>
                  <span>{step.subtitle}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-[#8EF705] shadow-[0_0_8px_#8EF705]" />}
                </button>
              );
            })}
          </div>

          {/* Dynamic Immersive Showcase Card */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
            {/* Visual Media Pane (7 Cols) */}
            <div className="lg:col-span-7 relative min-h-[380px] lg:min-h-[520px] bg-slate-100 overflow-hidden order-2 lg:order-1">
              <img
                key={experienceSteps[activeExpTab].image}
                src={experienceSteps[activeExpTab].image}
                alt={experienceSteps[activeExpTab].title}
                className="w-full h-full object-cover transition-all duration-700 ease-out scale-102 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Content & Metrics Pane (5 Cols) */}
            <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-8 order-1 lg:order-2 bg-white">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#529402]">
                    STAGE {experienceSteps[activeExpTab].phase} OF 03
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    {experienceSteps[activeExpTab].subtitle}
                  </span>
                </div>

                <h3 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight mb-4 leading-snug">
                  {experienceSteps[activeExpTab].title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-light">
                  {experienceSteps[activeExpTab].desc}
                </p>

                {/* Stat Metric Cards */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  {experienceSteps[activeExpTab].stats.map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <span className="text-xs text-slate-600 font-medium">{st.label}</span>
                      <span className="text-xs font-mono font-bold text-slate-900 tracking-wide">
                        {st.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button in #8EF705 */}
              <button
                onClick={() => navigateTo('catalog')}
                className="w-full py-3.5 px-6 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-[#8EF705]/25"
              >
                <span>Explore This Experience</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: IMPROVED BRAND VALUES ("THE PHARSYDE PROMISE")
         ========================================================================= */}
      <section className="py-28 relative bg-white overflow-hidden border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold uppercase tracking-[0.25em] text-orange-700 mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>FOUNDATIONAL PILLARS</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight uppercase mb-5 leading-tight">
              THE PHARSYDE <span className="font-heading italic font-light text-[#225203]">Promise</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-light">
              Our core commitments to uncompromising quality, meticulous curation, and modern living.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Pillar 01: Quality First */}
            <div className="group relative rounded-3xl p-8 bg-slate-50 border border-slate-200 hover:border-[#8EF705] transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-6 font-heading font-black text-6xl text-slate-200 group-hover:text-slate-300 transition-colors select-none pointer-events-none">
                01
              </span>

              <div>
                <div className="flex items-center justify-between mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-[#8EF705]/25 border border-[#8EF705]/60 group-hover:scale-105 flex items-center justify-center text-slate-900 shadow-sm transition-all duration-500">
                    <Award className="w-7 h-7 text-slate-900" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-white border border-slate-200 text-slate-600 group-hover:text-[#529402] group-hover:border-[#8EF705] transition-colors">
                    PILLAR 01
                  </span>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#529402] mb-1.5 block">
                  STANDARDS & PURITY
                </span>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-3 transition-colors">
                  Quality First
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-light">
                  We never compromise on product integrity. Every batch is certified, cold-stored, and handled with meticulous care.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#529402] shrink-0" />
                  <span className="font-medium">Small-Batch Lot Verified</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#529402] shrink-0" />
                  <span className="font-medium">Cold-Chain Maintained</span>
                </div>
              </div>
            </div>

            {/* Pillar 02: Thoughtful Selection */}
            <div className="group relative rounded-3xl p-8 bg-slate-50 border border-slate-200 hover:border-orange-500/60 transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-6 font-heading font-black text-6xl text-slate-200 group-hover:text-slate-300 transition-colors select-none pointer-events-none">
                02
              </span>

              <div>
                <div className="flex items-center justify-between mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 group-hover:border-orange-500 flex items-center justify-center text-orange-600 shadow-sm transition-all duration-500 group-hover:scale-105">
                    <Compass className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-white border border-slate-200 text-slate-600 group-hover:text-orange-600 group-hover:border-orange-300 transition-colors">
                    PILLAR 02
                  </span>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600 mb-1.5 block">
                  ARTISANAL VAULT
                </span>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-3 transition-colors">
                  Thoughtful Selection
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-light">
                  We curate intentional items, weeding out filler products so our shelves hold only what truly elevates your ritual.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="font-medium">Master Grower Direct</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="font-medium">Zero Low-Grade Filler</span>
                </div>
              </div>
            </div>

            {/* Pillar 03: Customer Experience */}
            <div className="group relative rounded-3xl p-8 bg-slate-50 border border-slate-200 hover:border-[#8EF705] transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-6 font-heading font-black text-6xl text-slate-200 group-hover:text-slate-300 transition-colors select-none pointer-events-none">
                03
              </span>

              <div>
                <div className="flex items-center justify-between mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-[#8EF705]/25 border border-[#8EF705]/60 group-hover:scale-105 flex items-center justify-center text-slate-900 shadow-sm transition-all duration-500">
                    <HeartHandshake className="w-7 h-7 text-slate-900" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-white border border-slate-200 text-slate-600 group-hover:text-[#529402] group-hover:border-[#8EF705] transition-colors">
                    PILLAR 03
                  </span>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#529402] mb-1.5 block">
                  CONCIERGE & CARE
                </span>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-3 transition-colors">
                  Customer Experience
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-light">
                  Knowledgeable budtenders, seamless digital purchasing, rapid local fulfillment, and transparent return guidelines.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#529402] shrink-0" />
                  <span className="font-medium">117 Regent Ave Storefront</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#529402] shrink-0" />
                  <span className="font-medium">30-Minute Rapid Pickup</span>
                </div>
              </div>
            </div>

            {/* Pillar 04: Modern Lifestyle */}
            <div className="group relative rounded-3xl p-8 bg-slate-50 border border-slate-200 hover:border-orange-500/60 transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-6 font-heading font-black text-6xl text-slate-200 group-hover:text-slate-300 transition-colors select-none pointer-events-none">
                04
              </span>

              <div>
                <div className="flex items-center justify-between mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 group-hover:border-orange-500 flex items-center justify-center text-orange-600 shadow-sm transition-all duration-500 group-hover:scale-105">
                    <Zap className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-white border border-slate-200 text-slate-600 group-hover:text-orange-600 group-hover:border-orange-300 transition-colors">
                    PILLAR 04
                  </span>
                </div>

                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600 mb-1.5 block">
                  ELEVATED DESIGN
                </span>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-3 transition-colors">
                  Modern Lifestyle
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-light">
                  Designed for contemporary living. Elegant aesthetics that seamlessly integrate with high-end interior spaces.
                </p>
              </div>

              <div className="pt-5 border-t border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="font-medium">Sculptural Borosilicate Glass</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="font-medium">CNC Machined Hardware</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: IMPROVED NEWSLETTER ("STAY IN THE LOOP")
         ========================================================================= */}
      <section className="py-24 relative bg-[#F8FAFC] border-t border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-14 shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Editorial Value Proposition */}
              <div className="lg:col-span-6 space-y-5">
                <h2 className="font-heading text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                  STAY IN <br />
                  <span className="bg-gradient-to-r from-[#8EF705] via-[#529402] to-orange-600 bg-clip-text text-transparent">
                    THE LOOP
                  </span>
                </h2>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg font-light">
                  Be the first to discover new collections, updates and exclusive announcements.
                </p>

                {/* VIP Perks */}
                <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#8EF705]/30 text-slate-900 flex items-center justify-center shrink-0 border border-[#8EF705]">
                      <Check className="w-3 h-3 text-slate-900 stroke-[3]" />
                    </div>
                    <span>First allocation of rare single-origin craft releases</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center shrink-0 border border-orange-200">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>10% Welcome discount voucher code delivered instantly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#8EF705]/30 text-slate-900 flex items-center justify-center shrink-0 border border-[#8EF705]">
                      <Check className="w-3 h-3 text-slate-900 stroke-[3]" />
                    </div>
                    <span>Invitations to Winnipeg store tasting & hardware drops</span>
                  </div>
                </div>
              </div>

              {/* Right Column: High-End Subscription Form */}
              <div className="lg:col-span-6">
                <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                      JOIN THE CIRCLE
                    </span>
                  </div>

                  <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="name@domain.com"
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          disabled={newsletterStatus === 'loading'}
                          className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#8EF705] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Privacy Consent Checkbox */}
                    <label className="flex items-start gap-3 text-left text-xs text-slate-600 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={newsletterConsent}
                        onChange={(e) => setNewsletterConsent(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 bg-white text-[#8EF705] focus:ring-0"
                      />
                      <span className="leading-snug">
                        I confirm I am 19+ and consent to receiving marketing communications from Pharsyde. You may unsubscribe at any time.
                      </span>
                    </label>

                    {/* Status feedback */}
                    {newsletterMsg && (
                      <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                        newsletterStatus === 'success'
                          ? 'bg-[#8EF705]/20 text-slate-900 border border-[#8EF705]'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {newsletterStatus === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#529402]" />
                        ) : null}
                        <span>{newsletterMsg}</span>
                      </div>
                    )}

                    {/* Submit CTA in #8EF705 */}
                    <button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="w-full py-4 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-[#8EF705]/30"
                    >
                      {newsletterStatus === 'loading' ? (
                        <span>Validating Membership...</span>
                      ) : (
                        <>
                          <span>Subscribe to Pharsyde Circle</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-[10px] text-slate-400 text-center">
                    Zero spam promise. We protect your privacy in compliance with Canadian anti-spam legislation (CASL).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
