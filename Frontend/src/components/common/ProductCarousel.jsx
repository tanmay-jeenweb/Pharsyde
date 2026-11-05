import React, { useRef, useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export default function ProductCarousel({
  badge,
  badgeColor = 'text-[#0166dc] bg-[#0166dc]/15 border-[#0166dc]/40',
  title,
  subtitle,
  products = [],
  loading = false,
  viewAllText = 'View All',
  onViewAll,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [products, loading]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
        <div>
          {badge && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border mb-2.5 ${badgeColor}`}
            >
              <Sparkles className="w-3 h-3" />
              {badge}
            </span>
          )}
          <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Actions: Arrow Controls + View All */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Scroll Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-[#0166dc] hover:border-[#0166dc] hover:text-black shadow-xs cursor-pointer active:scale-95'
                  : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                canScrollRight
                  ? 'bg-white border-slate-300 text-slate-800 hover:bg-[#0166dc] hover:border-[#0166dc] hover:text-black shadow-xs cursor-pointer active:scale-95'
                  : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-[#0166dc] text-slate-900 hover:text-black border border-slate-200 hover:border-[#0166dc] text-xs font-heading font-extrabold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <span>{viewAllText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Carousel Track */}
      {loading ? (
        <div className="flex gap-6 overflow-hidden py-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[270px] sm:w-[295px] shrink-0 rounded-2xl bg-white border border-slate-200 p-4 space-y-4 animate-pulse shadow-xs"
            >
              <div className="aspect-square bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-9 bg-slate-100 rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 pt-1 snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {products.map((product) => (
            <div
              key={product.pk || product.id}
              className="w-[270px] sm:w-[295px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">
            No products currently available in this section.
          </p>
        </div>
      )}
    </div>
  );
}

