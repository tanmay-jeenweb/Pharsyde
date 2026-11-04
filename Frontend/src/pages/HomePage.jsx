import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/common/ProductCard';
import AppDownloadBadge from '../components/common/AppDownloadBadge';
import {
  getBestSellersProductsApi,
  getNewArrivalsProductsApi,
  getProductsApi
} from '../services/productService';
import heroBg from '../assets/hero-bg.png';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Award,
  Zap,
  HeartHandshake,
  Check,
  Mail
} from 'lucide-react';

export default function HomePage() {
  const { navigateTo, showToast } = useApp();

  // Products State from Backend API
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingBestSellers, setLoadingBestSellers] = useState(true);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);

  // Best Sellers Carousel Scroll State
  const bestSellersRef = useRef(null);
  const [canScrollBestLeft, setCanScrollBestLeft] = useState(false);
  const [canScrollBestRight, setCanScrollBestRight] = useState(false);

  // New Arrivals Carousel Scroll & Progress State
  const newArrivalsRef = useRef(null);
  const [canScrollNewLeft, setCanScrollNewLeft] = useState(false);
  const [canScrollNewRight, setCanScrollNewRight] = useState(false);
  const [newScrollProgress, setNewScrollProgress] = useState(0);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // idle | loading | success | error
  const [newsletterMsg, setNewsletterMsg] = useState('');

  // Fetch real best sellers & new arrivals from database
  useEffect(() => {
    let isMounted = true;

    async function loadBestSellers() {
      try {
        setLoadingBestSellers(true);
        const res = await getBestSellersProductsApi();
        let items = (res && res.success && Array.isArray(res.products)) ? res.products : [];
        items = items.filter((p) => p.imageUrl && p.imageUrl.trim() !== '' && p.imageUrl !== '[]');

        // If fewer than 4 configured best sellers, backfill from catalog with images
        if (items.length < 4) {
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

        if (items.length === 0) {
          const fallback = await getProductsApi({ limit: 12, sortBy: 'modified', sortOrder: 'DESC', hasImage: true });
          if (fallback && Array.isArray(fallback.products)) {
            items = fallback.products;
          }
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

    loadBestSellers();
    loadNewArrivals();

    return () => {
      isMounted = false;
    };
  }, []);

  // Check scroll state for Best Sellers
  const handleBestSellersScroll = () => {
    if (!bestSellersRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = bestSellersRef.current;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollBestLeft(scrollLeft > 10);
    setCanScrollBestRight(scrollLeft < maxScroll - 10);
  };

  const scrollBest = (direction) => {
    if (!bestSellersRef.current) return;
    const { clientWidth } = bestSellersRef.current;
    const amount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
    bestSellersRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(handleBestSellersScroll, 350);
  };

  // Check scroll state for New Arrivals
  const handleNewArrivalsScroll = () => {
    if (!newArrivalsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = newArrivalsRef.current;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollNewLeft(scrollLeft > 10);
    setCanScrollNewRight(scrollLeft < maxScroll - 10);

    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setNewScrollProgress(progress);
  };

  const scrollNew = (direction) => {
    if (!newArrivalsRef.current) return;
    const { clientWidth } = newArrivalsRef.current;
    const amount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
    newArrivalsRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(handleNewArrivalsScroll, 350);
  };

  useEffect(() => {
    handleBestSellersScroll();
    handleNewArrivalsScroll();
    window.addEventListener('resize', handleBestSellersScroll);
    window.addEventListener('resize', handleNewArrivalsScroll);
    return () => {
      window.removeEventListener('resize', handleBestSellersScroll);
      window.removeEventListener('resize', handleNewArrivalsScroll);
    };
  }, [bestSellers, newArrivals, loadingBestSellers, loadingNewArrivals]);

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
    setTimeout(() => {
      setNewsletterStatus('success');
      setNewsletterMsg('Welcome to Pharsyde Circle. Check your inbox for your 10% welcome invitation.');
      showToast('Successfully subscribed to Pharsyde Circle', 'success');
      setNewsletterEmail('');
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* =========================================================================
          SECTION 1: HERO SECTION - THE ART OF PURE CANNABIS (LIGHT LUXURY)
         ========================================================================= */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] lg:min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50 border-b border-slate-200">
        <div className="absolute top-1/3 left-1/6 w-[500px] h-[500px] bg-[#8EF705]/5 blur-[160px] pointer-events-none rounded-full" />
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

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-5">
                <span className="font-sans text-xs sm:text-sm md:text-[15px] tracking-[0.35em] uppercase text-[#529402] font-black">
                  THE ART OF
                </span>
                <span className="w-14 sm:w-20 md:w-24 h-[2.5px] bg-gradient-to-r from-[#8EF705] to-transparent inline-block" />
              </div>

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

              <div className="flex items-center gap-3 sm:gap-4 mb-8">
                <span className="font-sans text-[10px] sm:text-xs md:text-sm tracking-[0.24em] uppercase text-slate-600 font-semibold">
                  QUALITY. CRAFTSMANSHIP. EXPERIENCE.
                </span>
                <span className="w-12 sm:w-16 md:w-20 h-[1px] bg-gradient-to-r from-slate-400 to-transparent inline-block" />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigateTo('catalog')}
                  className="px-7 py-3.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-[#8EF705]/30 transition-all flex items-center gap-2 group hover:scale-[1.02] cursor-pointer"
                >
                  <span>Explore Catalogue</span>
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
          SECTION 2: BRAND INTRODUCTION ("BEYOND THE ORDINARY")
         ========================================================================= */}
      <section id="brand-intro" className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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
                  className="inline-flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-widest text-slate-900 hover:text-[#529402] transition-colors group cursor-pointer"
                >
                  <span>Learn Our Heritage & Standards</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#8EF705]/20 to-orange-500/15 rounded-3xl blur-2xl transform -rotate-3" />

                <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl p-6 group">
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden relative mb-5 bg-slate-100">
                    <img
                      src={heroBg}
                      alt="Cannabis Craftsmanship"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#8EF705] block mb-1">
                        WINNIPEG, MANITOBA • 19+
                      </span>
                      <h4 className="font-heading text-lg font-bold text-white">
                        Licensed Manitoba Craft Retailer
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
          SECTION 3: BEST SELLERS (ELEVATED SUBTLE LIGHT SHOWCASE CONTAINER)
         ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2.5rem] bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50/80 border border-slate-200/90 p-8 sm:p-12 relative overflow-hidden shadow-xs">
            {/* Soft ambient light highlight */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#8EF705]/10 blur-[110px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-10 w-64 h-64 bg-orange-500/5 blur-[90px] pointer-events-none rounded-full" />

            {/* Header Row */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-[#529402] block mb-2">
                  COMMUNITY FAVORITES
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  BEST SELLERS
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl font-light">
                  Our most requested craft cultivars and accessories, backed by verified repeat orders.
                </p>
              </div>

              {/* Right Controls: Arrow Navigation + View All */}
              <div className="relative z-10 flex items-center gap-3 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => scrollBest('left')}
                    disabled={!canScrollBestLeft}
                    aria-label="Previous best sellers"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      canScrollBestLeft
                        ? 'text-slate-800 hover:bg-[#8EF705] hover:text-black cursor-pointer active:scale-95'
                        : 'text-slate-300 cursor-not-allowed opacity-40'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollBest('right')}
                    disabled={!canScrollBestRight}
                    aria-label="Next best sellers"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      canScrollBestRight
                        ? 'text-slate-800 hover:bg-[#8EF705] hover:text-black cursor-pointer active:scale-95'
                        : 'text-slate-300 cursor-not-allowed opacity-40'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => navigateTo('best-sellers')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-[#8EF705] text-white hover:text-black font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Carousel Stream */}
            <div className="relative z-10">
              {loadingBestSellers ? (
                <div className="flex gap-6 overflow-hidden py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-[275px] sm:w-[295px] shrink-0 rounded-2xl bg-white border border-slate-200 p-4 space-y-4 animate-pulse shadow-xs"
                    >
                      <div className="aspect-square bg-slate-100 rounded-xl" />
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-9 bg-slate-100 rounded-xl w-full mt-4" />
                    </div>
                  ))}
                </div>
              ) : bestSellers.length > 0 ? (
                <div
                  ref={bestSellersRef}
                  onScroll={handleBestSellersScroll}
                  className="flex gap-6 overflow-x-auto scroll-smooth py-2 snap-x snap-mandatory"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {bestSellers.map((product) => (
                    <div
                      key={product.pk || product.id}
                      className="w-[275px] sm:w-[295px] shrink-0 snap-start"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center rounded-2xl border border-dashed border-slate-300 bg-white/70">
                  <p className="text-sm font-medium text-slate-500">
                    No best sellers currently available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: NEW ARRIVALS (PANORAMIC CRISP WHITE STREAM WITH PROGRESS BAR)
         ========================================================================= */}
      <section className="py-20 relative bg-white border-t border-slate-200 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8EF705]/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8EF705] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#529402]"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#529402]">
                  FRESH HARVEST DROPS
                </span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
                NEW ARRIVALS
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl font-light">
                Discover the latest single-strain flowers, live resin carts, and boutique arrivals.
              </p>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollNew('left')}
                  disabled={!canScrollNewLeft}
                  aria-label="Scroll left new arrivals"
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                    canScrollNewLeft
                      ? 'bg-slate-100 hover:bg-[#8EF705] border-slate-200 hover:border-[#8EF705] text-slate-800 hover:text-black shadow-xs cursor-pointer active:scale-95'
                      : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollNew('right')}
                  disabled={!canScrollNewRight}
                  aria-label="Scroll right new arrivals"
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                    canScrollNewRight
                      ? 'bg-slate-100 hover:bg-[#8EF705] border-slate-200 hover:border-[#8EF705] text-slate-800 hover:text-black shadow-xs cursor-pointer active:scale-95'
                      : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => navigateTo('new-arrivals')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cards Track with Dynamic Progress Bar */}
          {loadingNewArrivals ? (
            <div className="flex gap-6 overflow-hidden py-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[275px] sm:w-[295px] shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-4 animate-pulse shadow-xs"
                >
                  <div className="aspect-square bg-slate-200/70 rounded-xl" />
                  <div className="h-4 bg-slate-200/70 rounded w-3/4" />
                  <div className="h-3 bg-slate-200/70 rounded w-1/2" />
                  <div className="h-9 bg-slate-200/70 rounded-xl w-full mt-4" />
                </div>
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <div className="space-y-6">
              <div
                ref={newArrivalsRef}
                onScroll={handleNewArrivalsScroll}
                className="flex gap-6 overflow-x-auto scroll-smooth py-2 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {newArrivals.map((product) => (
                  <div
                    key={product.pk || product.id}
                    className="w-[275px] sm:w-[295px] shrink-0 snap-start"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Interactive Smooth Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-[#529402] to-[#8EF705] rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(10, newScrollProgress)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-medium text-slate-500">
                No new arrivals found at this moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: BRAND VALUES ("THE PHARSYDE PROMISE")
         ========================================================================= */}
      <section className="py-28 relative bg-[#F8FAFC] overflow-hidden border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            
            <h2 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight uppercase mb-5 leading-tight">
              THE PHARSYDE <span className="font-heading italic font-light text-[#225203]">Promise</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-light">
              Our core commitments to uncompromising quality, meticulous curation, and modern living.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Pillar 01: Quality First */}
            <div className="group relative rounded-3xl p-8 bg-white border border-slate-200 hover:border-[#8EF705] transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-6 font-heading font-black text-6xl text-slate-200 group-hover:text-slate-300 transition-colors select-none pointer-events-none">
                01
              </span>

              <div>
                <div className="flex items-center justify-between mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-[#8EF705]/25 border border-[#8EF705]/60 group-hover:scale-105 flex items-center justify-center text-slate-900 shadow-sm transition-all duration-500">
                    <Award className="w-7 h-7 text-slate-900" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-slate-50 border border-slate-200 text-slate-600 group-hover:text-[#529402] group-hover:border-[#8EF705] transition-colors">
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

              <div className="pt-5 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#529402] shrink-0" />
                  <span className="font-medium">Small-Batch Lot Verified</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#529402] shrink-0" />
                  <span className="font-medium">Cold-Chain Maintained</span>
                </div>
              </div>
            </div>

            {/* Pillar 02: Thoughtful Selection */}
            <div className="group relative rounded-3xl p-8 bg-white border border-slate-200 hover:border-orange-500/60 transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-6 font-heading font-black text-6xl text-slate-200 group-hover:text-slate-300 transition-colors select-none pointer-events-none">
                02
              </span>

              <div>
                <div className="flex items-center justify-between mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 group-hover:border-orange-500 flex items-center justify-center text-orange-600 shadow-sm transition-all duration-500 group-hover:scale-105">
                    <Compass className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-slate-50 border border-slate-200 text-slate-600 group-hover:text-orange-600 group-hover:border-orange-300 transition-colors">
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

              <div className="pt-5 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="font-medium">Master Grower Direct</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="font-medium">Zero Low-Grade Filler</span>
                </div>
              </div>
            </div>

            {/* Pillar 03: Customer Experience */}
            <div className="group relative rounded-3xl p-8 bg-white border border-slate-200 hover:border-[#8EF705] transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-6 font-heading font-black text-6xl text-slate-200 group-hover:text-slate-300 transition-colors select-none pointer-events-none">
                03
              </span>

              <div>
                <div className="flex items-center justify-between mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-[#8EF705]/25 border border-[#8EF705]/60 group-hover:scale-105 flex items-center justify-center text-slate-900 shadow-sm transition-all duration-500">
                    <HeartHandshake className="w-7 h-7 text-slate-900" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-slate-50 border border-slate-200 text-slate-600 group-hover:text-[#529402] group-hover:border-[#8EF705] transition-colors">
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

              <div className="pt-5 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#529402] shrink-0" />
                  <span className="font-medium">117 Regent Ave Storefront</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#529402] shrink-0" />
                  <span className="font-medium">30-Minute Rapid Pickup</span>
                </div>
              </div>
            </div>

            {/* Pillar 04: Modern Lifestyle */}
            <div className="group relative rounded-3xl p-8 bg-white border border-slate-200 hover:border-orange-500/60 transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-6 font-heading font-black text-6xl text-slate-200 group-hover:text-slate-300 transition-colors select-none pointer-events-none">
                04
              </span>

              <div>
                <div className="flex items-center justify-between mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 group-hover:border-orange-500 flex items-center justify-center text-orange-600 shadow-sm transition-all duration-500 group-hover:scale-105">
                    <Zap className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase bg-slate-50 border border-slate-200 text-slate-600 group-hover:text-orange-600 group-hover:border-orange-300 transition-colors">
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

              <div className="pt-5 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="font-medium">Sculptural Borosilicate Glass</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="font-medium">CNC Machined Hardware</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: NEWSLETTER ("STAY IN THE LOOP")
         ========================================================================= */}
      <section className="py-24 relative bg-white border-t border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-3xl bg-slate-50/80 border border-slate-200 p-8 sm:p-14 shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
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
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#8EF705] transition-colors"
                        />
                      </div>
                    </div>

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

                    <button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="w-full py-4 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-[#8EF705]/30 cursor-pointer"
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
