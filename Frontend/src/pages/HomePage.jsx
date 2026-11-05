import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/common/ProductCard';
import AppDownloadBadge from '../components/common/AppDownloadBadge';
import {
  getBestSellersProductsApi,
  getNewArrivalsProductsApi,
  getProductsApi,
  getPublicSettingsApi,
  getPublicHomeSectionsApi
} from '../services/productService';
import { subscribeNewsletterApi } from '../services/formService';
import heroBg from '../assets/hero-bg.png';
import cannabisCategoryImg from '../assets/cannabis-category.png';
import nicotineCategoryImg from '../assets/nicotine-vape-category.png';
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Check,
  Mail,
  Sparkles,
  Zap
} from 'lucide-react';

export default function HomePage() {
  const { navigateTo, showToast } = useApp();

  // Storefront Section Visibility Settings from DB
  const [showBestSellersSection, setShowBestSellersSection] = useState(true);
  const [showNewArrivalsSection, setShowNewArrivalsSection] = useState(true);

  // Products State from Backend API
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingBestSellers, setLoadingBestSellers] = useState(true);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);

  // Dynamic Custom Sections (Configured via Home Page Section Master)
  const [homeSections, setHomeSections] = useState([]);
  const [loadingHomeSections, setLoadingHomeSections] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  // Toggle State for 4-Card Preview vs Full List
  const [showAllBestSellers, setShowAllBestSellers] = useState(false);
  const [showAllNewArrivals, setShowAllNewArrivals] = useState(false);
  const bestSellersSectionRef = useRef(null);
  const newArrivalsSectionRef = useRef(null);

  // Sliced or full lists
  const displayedBestSellers = showAllBestSellers ? bestSellers : bestSellers.slice(0, 4);
  const displayedNewArrivals = showAllNewArrivals ? newArrivals : newArrivals.slice(0, 4);

  const handleToggleBestSellers = () => {
    if (showAllBestSellers && bestSellersSectionRef.current) {
      bestSellersSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowAllBestSellers((prev) => !prev);
  };

  const handleToggleNewArrivals = () => {
    if (showAllNewArrivals && newArrivalsSectionRef.current) {
      newArrivalsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowAllNewArrivals((prev) => !prev);
  };

  const handleToggleDynamicSection = (secId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // idle | loading | success | error
  const [newsletterMsg, setNewsletterMsg] = useState('');

  // Fetch real best sellers & new arrivals from database
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const res = await getPublicSettingsApi();
        if (isMounted && res && res.success && res.settings) {
          if (res.settings.show_best_sellers !== undefined) {
            setShowBestSellersSection(res.settings.show_best_sellers === 'true' || res.settings.show_best_sellers === true);
          }
          if (res.settings.show_new_arrivals !== undefined) {
            setShowNewArrivalsSection(res.settings.show_new_arrivals === 'true' || res.settings.show_new_arrivals === true);
          }
        }
      } catch (err) {
        console.warn('Could not load public storefront settings:', err);
      }
    }

    async function loadBestSellers() {
      try {
        setLoadingBestSellers(true);
        const res = await getBestSellersProductsApi();
        let items = (res && res.success && Array.isArray(res.products)) ? res.products : [];
        items = items.filter((p) => p.imageUrl && p.imageUrl.trim() !== '' && p.imageUrl !== '[]');

        // If fewer than 12 configured best sellers, backfill from catalog with images
        if (items.length < 12) {
          try {
            const fallback = await getProductsApi({ limit: 12, sortBy: 'modified', sortOrder: 'DESC', hasImage: true });
            if (fallback && Array.isArray(fallback.products)) {
              const existingIds = new Set(items.map((i) => i.pk || i.id));
              const extras = fallback.products.filter((p) => !existingIds.has(p.pk || p.id));
              items = [...items, ...extras].slice(0, 12);
            }
          } catch {}
        }

        if (isMounted) {
          setBestSellers(items);
        }
      } catch (err) {
        console.warn('Could not load best sellers:', err);
        try {
          const fallback = await getProductsApi({ limit: 12, hasImage: true });
          if (isMounted && fallback?.products) {
            setBestSellers(fallback.products);
          }
        } catch {}
      } finally {
        if (isMounted) setLoadingBestSellers(false);
      }
    }

    async function loadNewArrivals() {
      try {
        setLoadingNewArrivals(true);
        const res = await getNewArrivalsProductsApi({ limit: 12 });
        let items = (res && res.success && Array.isArray(res.products)) ? res.products : [];
        items = items.filter((p) => p.imageUrl && p.imageUrl.trim() !== '' && p.imageUrl !== '[]');

        if (items.length < 12) {
          try {
            const fallback = await getProductsApi({ limit: 12, sortBy: 'modified', sortOrder: 'DESC', hasImage: true });
            if (fallback && Array.isArray(fallback.products)) {
              const existingIds = new Set(items.map((i) => i.pk || i.id));
              const extras = fallback.products.filter((p) => !existingIds.has(p.pk || p.id));
              items = [...items, ...extras].slice(0, 12);
            }
          } catch {}
        }

        if (isMounted) {
          setNewArrivals(items);
        }
      } catch (err) {
        console.warn('Could not load new arrivals:', err);
        try {
          const fallback = await getProductsApi({ limit: 12, sortBy: 'modified', sortOrder: 'DESC', hasImage: true });
          if (isMounted && fallback?.products) {
            setNewArrivals(fallback.products);
          }
        } catch {}
      } finally {
        if (isMounted) setLoadingNewArrivals(false);
      }
    }

    async function loadHomeSections() {
      try {
        setLoadingHomeSections(true);
        const res = await getPublicHomeSectionsApi();
        if (isMounted && res && res.success && Array.isArray(res.sections)) {
          setHomeSections(res.sections);
        }
      } catch (err) {
        console.warn('Could not load dynamic home sections:', err);
      } finally {
        if (isMounted) setLoadingHomeSections(false);
      }
    }

    loadSettings();
    loadBestSellers();
    loadNewArrivals();
    loadHomeSections();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus('error');
      setNewsletterMsg('Please enter a valid email address.');
      return;
    }
    if (!newsletterConsent) {
      setNewsletterStatus('error');
      setNewsletterMsg('Please confirm you are 19+ and consent to receiving Pharsyde updates.');
      return;
    }

    setNewsletterStatus('loading');
    setNewsletterMsg('');

    try {
      const res = await subscribeNewsletterApi({
        email: newsletterEmail.trim(),
        consent: newsletterConsent,
        source: 'homepage_circle'
      });
      setNewsletterStatus('success');
      setNewsletterMsg(
        res?.message || 'Welcome to Pharsyde Circle. Check your inbox for your 10% welcome invitation.'
      );
      showToast(res?.message || 'Successfully subscribed to Pharsyde Circle', 'success');
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterStatus('error');
      const errorMsg = err.message || 'Subscription failed. Please check your email and try again.';
      setNewsletterMsg(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* =========================================================================
          SECTION 1: HERO SECTION - THE ART OF PURE CANNABIS (LIGHT LUXURY)
         ========================================================================= */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] lg:min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50 border-b border-slate-200">
        <div className="absolute top-1/3 left-1/6 w-[500px] h-[500px] bg-[#0166dc]/5 blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-orange-500/10 blur-[150px] pointer-events-none rounded-full" />

        <div className="absolute inset-0 z-0 overflow-hidden opacity-30 lg:opacity-40 pointer-events-none">
          <img
            src={heroBg}
            alt="The Art of Pure Cannabis"
            className="w-full h-full object-cover object-[65%_center] lg:object-[70%_center] mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/85 lg:via-[#F8FAFC]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-[#F8FAFC]/50" />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 xl:px-16 pt-28 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-5">
                <span className="font-sans text-xs sm:text-sm md:text-[15px] tracking-[0.35em] uppercase text-[#0166dc] font-black">
                  THE ART OF
                </span>
                <span className="w-14 sm:w-20 md:w-24 h-[2.5px] bg-gradient-to-r from-[#0166dc] to-transparent inline-block" />
              </div>

              <div className="flex flex-col mb-6 sm:mb-8 select-none">
                <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[9.5rem] text-slate-900 font-light italic tracking-tight leading-[0.88]">
                  Pure
                </h1>
                <div className="relative inline-block mt-1 sm:mt-2">
                  <span className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[8.5rem] tracking-[0.03em] uppercase text-[#014ea6] font-black leading-[0.88] block">
                    CANNABIS
                  </span>
                  <span className="h-1.5 sm:h-2 w-24 sm:w-36 bg-[#0166dc] rounded-full mt-3 block shadow-sm shadow-[#0166dc]/50" />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 mb-8">
                <span className="font-sans text-[10px] sm:text-xs md:text-sm tracking-[0.24em] uppercase text-slate-600 font-semibold">
                  QUALITY. CRAFTSMANSHIP. EXPERIENCE.
                </span>
                <span className="w-12 sm:w-16 md:w-20 h-[1px] bg-gradient-to-r from-slate-400 to-transparent inline-block" />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigateTo('cannabis')}
                  className="px-7 py-3.5 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white font-heading font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-[#0166dc]/30 transition-all flex items-center gap-2 group hover:scale-[1.02] cursor-pointer"
                >
                  <span>Explore Cannabis</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigateTo('contact')}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 border border-slate-300 font-heading font-semibold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  Visit Winnipeg Store
                </button>

                {/* Google Play Store Mobile App Download Badge */}
                <AppDownloadBadge />
              </div>
            </div>

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
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-black tracking-widest uppercase bg-[#0166dc] text-white border border-[#0166dc] shadow-md backdrop-blur-md mb-2">
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
          SECTION 2: FEATURED CATEGORIES - CANNABIS & NICOTINE VAPE BUTTONS
         ========================================================================= */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 border-b border-slate-200/80 relative overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/2 left-10 w-96 h-96 bg-[#0166dc]/8 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-cyan-500/8 blur-[140px] pointer-events-none rounded-full" />

        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0166dc] shadow-[0_0_10px_#0166dc]" />
                <span className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-[#0166dc]">
                  EXPLORE OUR COLLECTIONS
                </span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                CANNABIS & NICOTINE VAPE
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-light">
                Select your preferred collection to discover lab-tested craft cannabis or premium nicotine vape devices and pods.
              </p>
            </div>
          </div>

          {/* Dual Category Buttons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* BUTTON 1: CANNABIS */}
            <Link
              to="/cannabis"
              aria-label="Shop Cannabis Collection"
              className="group relative flex flex-col sm:flex-row items-stretch justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#0A121E] text-white border border-slate-800/90 hover:border-[#0166dc] shadow-xl hover:shadow-[0_20px_50px_rgba(1, 102, 220,0.22)] transition-all duration-500 overflow-hidden cursor-pointer h-full"
            >
              {/* Internal Accent Glow */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#0166dc]/15 blur-3xl pointer-events-none rounded-full group-hover:bg-[#0166dc]/25 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0166dc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Text / Action Content */}
              <div className="relative z-10 flex flex-col justify-between w-full sm:w-1/2 pr-0 sm:pr-4 h-full">
                <div>
                  <h3 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-white group-hover:text-[#0166dc] transition-colors duration-300">
                    Cannabis
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 mt-2 font-light leading-relaxed">
                    Craft dried flower, pre-rolls, concentrates, extracts, edibles & infused beverages. Curated Manitoba craft harvests with verified lab-tested potency.
                  </p>
                  
                </div>

                {/* Styled Button Target (aligned at the bottom) */}
                <div className="mt-8">
                  <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#0166dc] text-white font-heading font-extrabold text-xs uppercase tracking-wider group-hover:bg-white group-hover:scale-105 transition-all duration-300 shadow-md shadow-[#0166dc]/30">
                    <span>Shop Cannabis</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Image Preview / Showcase */}
              <div className="relative z-10 w-full sm:w-1/2 mt-6 sm:mt-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-[#0166dc]/25 to-transparent blur-2xl rounded-full scale-90 group-hover:scale-115 transition-transform duration-700" />
                <img
                  src={cannabisCategoryImg}
                  alt="Cannabis"
                  className="relative z-10 max-h-56 sm:max-h-64 w-auto object-contain rounded-2xl drop-shadow-[0_15px_35px_rgba(1, 102, 220,0.4)] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-500"
                />
              </div>
            </Link>

            {/* BUTTON 2: NICOTINE VAPE */}
            <Link
              to="/nicotine"
              aria-label="Shop Nicotine Vape Collection"
              className="group relative flex flex-col sm:flex-row items-stretch justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#0A161E] text-white border border-slate-800/90 hover:border-cyan-400 shadow-xl hover:shadow-[0_20px_50px_rgba(6,182,212,0.22)] transition-all duration-500 overflow-hidden cursor-pointer h-full"
            >
              {/* Internal Accent Glow */}
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-400/15 blur-3xl pointer-events-none rounded-full group-hover:bg-cyan-400/25 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Text / Action Content */}
              <div className="relative z-10 flex flex-col justify-between w-full sm:w-1/2 pr-0 sm:pr-4 h-full">
                <div>
                  <h3 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-white group-hover:text-cyan-300 transition-colors duration-300">
                    Nicotine Vape
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 mt-2 font-light leading-relaxed">
                    Closed pod systems, disposables, authentic e-liquids, replacement coils & hardware.
                  </p>
                </div>

                {/* Styled Button Target (aligned at the bottom) */}
                <div className="mt-8">
                  <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-cyan-400 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider group-hover:bg-white group-hover:scale-105 transition-all duration-300 shadow-md shadow-cyan-400/30">
                    <span>Shop Nicotine Vape</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Image Preview / Showcase */}
              <div className="relative z-10 w-full sm:w-1/2 mt-6 sm:mt-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-cyan-400/25 to-transparent blur-2xl rounded-full scale-90 group-hover:scale-115 transition-transform duration-700" />
                <img
                  src={nicotineCategoryImg}
                  alt="Nicotine Vape"
                  className="relative z-10 max-h-56 sm:max-h-64 w-auto object-contain rounded-2xl drop-shadow-[0_15px_35px_rgba(6,182,212,0.4)] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-500"
                />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: BEST SELLERS (PANORAMIC CRISP WHITE SHOWCASE)
         ========================================================================= */}
      {showBestSellersSection && (
        <section ref={bestSellersSectionRef} className="py-20 relative bg-white border-t border-slate-200 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0166dc]/5 blur-[120px] pointer-events-none rounded-full" />

          <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  BEST SELLERS
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 font-light">
                  Our most requested craft cultivars and accessories, backed by verified repeat orders.
                </p>
              </div>

              {/* Header Action Button (View All / Show Less) */}
              {bestSellers.length > 4 && (
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleToggleBestSellers}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer group"
                  >
                    <span>{showAllBestSellers ? 'Show Less' : `View All (${bestSellers.length})`}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllBestSellers ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {loadingBestSellers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-4 animate-pulse shadow-xs"
                  >
                    <div className="aspect-square bg-slate-200/70 rounded-xl" />
                    <div className="h-4 bg-slate-200/70 rounded w-3/4" />
                    <div className="h-3 bg-slate-200/70 rounded w-1/2" />
                    <div className="h-9 bg-slate-200/70 rounded-xl w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : bestSellers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 py-2">
                  {displayedBestSellers.map((product) => (
                    <ProductCard
                      key={product.pk || product.id}
                      product={product}
                    />
                  ))}
                </div>

                {bestSellers.length > 4 && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={handleToggleBestSellers}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer group"
                    >
                      <span>{showAllBestSellers ? 'Show Less' : `View All (${bestSellers.length} Products)`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllBestSellers ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm font-medium text-slate-500">
                  No best sellers currently available.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 4: NEW ARRIVALS (PANORAMIC CRISP WHITE SHOWCASE)
         ========================================================================= */}
      {showNewArrivalsSection && (
        <section ref={newArrivalsSectionRef} className="py-20 relative bg-white border-t border-slate-200 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0166dc]/5 blur-[120px] pointer-events-none rounded-full" />

          <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  NEW ARRIVALS
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 font-light">
                  Discover the latest single-strain flowers, live resin carts, and boutique arrivals.
                </p>
              </div>

              {/* Header Action Button (View All / Show Less) */}
              {newArrivals.length > 4 && (
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleToggleNewArrivals}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer group"
                  >
                    <span>{showAllNewArrivals ? 'Show Less' : `View All (${newArrivals.length})`}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllNewArrivals ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {loadingNewArrivals ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-4 animate-pulse shadow-xs"
                  >
                    <div className="aspect-square bg-slate-200/70 rounded-xl" />
                    <div className="h-4 bg-slate-200/70 rounded w-3/4" />
                    <div className="h-3 bg-slate-200/70 rounded w-1/2" />
                    <div className="h-9 bg-slate-200/70 rounded-xl w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : newArrivals.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 py-2">
                  {displayedNewArrivals.map((product) => (
                    <ProductCard
                      key={product.pk || product.id}
                      product={product}
                    />
                  ))}
                </div>

                {newArrivals.length > 4 && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={handleToggleNewArrivals}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer group"
                    >
                      <span>{showAllNewArrivals ? 'Show Less' : `View All (${newArrivals.length} Products)`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllNewArrivals ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm font-medium text-slate-500">
                  No new arrivals found at this moment.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          DYNAMIC CUSTOM HOME SECTIONS (Configured via Home Page Section Master)
         ========================================================================= */}
      {homeSections.map((sec) => {
        const isExpanded = Boolean(expandedSections[sec.id]);
        const displayedProducts = isExpanded ? sec.products : sec.products.slice(0, 4);

        return (
          <section
            key={sec.id}
            className="py-20 relative bg-white border-t border-slate-200 overflow-hidden"
          >
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0166dc]/5 blur-[120px] pointer-events-none rounded-full" />

            <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
                <div>
                  <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                    {sec.heading}
                  </h2>
                  {sec.sub_heading && (
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 font-light">
                      {sec.sub_heading}
                    </p>
                  )}
                </div>

                {/* Header Action Button (View All / Show Less) */}
                {sec.products.length > 4 && (
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleDynamicSection(sec.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer group"
                    >
                      <span>{isExpanded ? 'Show Less' : `View All (${sec.products.length})`}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 py-2">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.pk || product.id}
                    product={product}
                  />
                ))}
              </div>

              {/* Bottom Centered Toggle Button */}
              {sec.products.length > 4 && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggleDynamicSection(sec.id)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer group"
                  >
                    <span>
                      {isExpanded ? 'Show Less' : `View All (${sec.products.length} Products)`}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* =========================================================================
          SECTION 6: NEWSLETTER ("STAY IN THE LOOP")
         ========================================================================= */}
      <section className="py-24 relative bg-white border-t border-slate-200 overflow-hidden">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="rounded-3xl bg-slate-50/80 border border-slate-200 p-8 sm:p-14 shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-5">
                <h2 className="font-heading text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                  STAY IN <br />
                  <span className="bg-gradient-to-r from-[#0166dc] via-[#0166dc] to-orange-600 bg-clip-text text-transparent">
                    THE LOOP
                  </span>
                </h2>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-light">
                  Be the first to discover new collections, updates and exclusive announcements.
                </p>

                <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0166dc]/30 text-slate-900 flex items-center justify-center shrink-0 border border-[#0166dc]">
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
                    <div className="w-5 h-5 rounded-full bg-[#0166dc]/30 text-slate-900 flex items-center justify-center shrink-0 border border-[#0166dc]">
                      <Check className="w-3 h-3 text-slate-900 stroke-[3]" />
                    </div>
                    <span>Invitations to Winnipeg store tasting & hardware drops</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
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
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0166dc] transition-colors"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-3 text-left text-xs text-slate-600 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={newsletterConsent}
                        onChange={(e) => setNewsletterConsent(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 bg-white text-[#0166dc] focus:ring-0"
                      />
                      <span className="leading-snug">
                        I confirm I am 19+ and consent to receiving marketing communications from Pharsyde. You may unsubscribe at any time.
                      </span>
                    </label>

                    {newsletterMsg && (
                      <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                        newsletterStatus === 'success'
                          ? 'bg-[#0166dc]/20 text-slate-900 border border-[#0166dc]'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {newsletterStatus === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0166dc]" />
                        ) : null}
                        <span>{newsletterMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="w-full py-4 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white font-heading font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-[#0166dc]/30 cursor-pointer"
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
