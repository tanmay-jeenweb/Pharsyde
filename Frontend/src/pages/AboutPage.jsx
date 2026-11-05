import React from 'react';
import { useApp } from '../context/AppContext';
import { STORE_INFO } from '../data/products';
import { Sparkles, Award, Compass, HeartHandshake, MapPin, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const { navigateTo } = useApp();

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC] text-slate-900 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#0166dc]/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        {/* Hero Banner */}
        <div className="text-center mb-20">
          <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight uppercase leading-[1.08] mb-6">
            MORE THAN A COLLECTION. <br />
            <span className="bg-gradient-to-r from-slate-900 via-[#0166dc] to-orange-600 bg-clip-text text-transparent">
              A WAY OF LIFE.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 font-light leading-relaxed ">
            Pharsyde brings together thoughtfully curated products and a modern approach to the cannabis and lifestyle experience.
          </p>
        </div>

        {/* Story Section 1: Brand Introduction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#0166dc]">
              01 • BRAND INTRODUCTION
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 uppercase">
              REDEFINING THE RETAIL DISPENSARY
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Located at 117 Regent Ave W in Winnipeg, Pharsyde was conceived as an antidote to generic, cookie-cutter cannabis shops. We view cannabis and modern vaporization not merely as commodities, but as sophisticated lifestyle rituals that deserve an equally elevated presentation.
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every detail—from the bright, clean interior presentation to the hand-selected artisan flower on our shelves—is designed to inspire confidence, comfort, and appreciation for true craftsmanship.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 aspect-[4/3] shadow-xl group">
              <img
                src="https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=1000&q=80"
                alt="Pharsyde Retail Atmosphere"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-70" />
            </div>
          </div>
        </div>

        {/* Story Section 2: Brand Philosophy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 aspect-[4/3] shadow-xl group">
              <img
                src="https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80"
                alt="Brand Philosophy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-70" />
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-orange-600">
              02 • BRAND PHILOSOPHY
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 uppercase">
              CRAFT OVER CONVENTIONAL
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Our philosophy hinges on the belief that consumers deserve transparency, deep knowledge, and products cultivated with genuine respect for the plant.
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              We champion micro-cultivators, small-batch extractors, and innovative industrial designers whose creations demonstrate exceptional terpene preservation, clean curing practices, and refined aesthetics.
            </p>
          </div>
        </div>

        {/* Story Section 3: Product Curation & Customer Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {/* Curation */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0166dc]/15 border border-[#0166dc]/40 flex items-center justify-center text-[#0166dc]">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#0166dc]">
              03 • PRODUCT CURATION
            </span>
            <h3 className="font-heading text-2xl font-bold text-slate-900 uppercase">
              Rigorous Standards
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our menu is intentionally focused. Rather than overwhelming shelves with thousands of indistinguishable SKUs, our team systematically vets every cultivar for moisture retention, terpene profile, burn characteristics, and genetic lineage. If it does not exceed our expectations, it does not enter our vault.
            </p>
          </div>

          {/* Customer Experience */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-orange-600">
              04 • CUSTOMER EXPERIENCE
            </span>
            <h3 className="font-heading text-2xl font-bold text-slate-900 uppercase">
              Welcoming & Informed
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Whether you are an experienced connoisseur seeking rare solventless live rosins or someone exploring soothing CBD blends for the first time, our knowledgeable budtenders at 117 Regent Ave W provide unpretentious, personalized consultations tailored to your individual comfort level.
            </p>
          </div>
        </div>

        {/* Winnipeg Storefront Spotlight Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#0166dc] font-bold">
              <MapPin className="w-4 h-4" />
              <span>Visit the Flagship</span>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 uppercase">
              EXPERIENCE PHARSYDE IN PERSON
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 ">
              Conveniently located at 117 Regent Ave W in Winnipeg. Stop by to view our full display cases or consult directly with our staff.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <button
              onClick={() => navigateTo('contact')}
              className="px-6 py-3.5 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white font-black text-xs font-heading uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0166dc]/25"
            >
              <span>Store Hours & Directions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
