import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS, NICOTINE_CATEGORIES } from '../data/products';
import ProductCard from '../components/common/ProductCard';
import {
  ShieldAlert,
  Zap,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  X
} from 'lucide-react';

export default function NicotineVapePage() {
  const { navigateTo } = useApp();

  // All nicotine vape products
  const nicotineProducts = useMemo(() => {
    return PRODUCTS.filter((p) => p.nicotineType);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const availableBrands = useMemo(() => {
    const brands = new Set(nicotineProducts.map((p) => p.brand));
    return ['All', ...Array.from(brands)];
  }, [nicotineProducts]);

  const filteredProducts = useMemo(() => {
    return nicotineProducts
      .filter((p) => {
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
        if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;
        if (p.price > maxPrice) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchFlavor = p.flavor?.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchFlavor) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      });
  }, [nicotineProducts, selectedCategory, selectedBrand, maxPrice, searchQuery, sortBy]);

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC] text-slate-900 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Compliance Warning Banner: Canadian Tobacco and Vaping Products Act */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white border-l-4 border-l-orange-500 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <strong className="text-slate-900 block uppercase tracking-wider font-heading">
                WARNING: Nicotine is highly addictive. (Health Canada)
              </strong>
              <p>
                Products on this page are strictly for existing adult nicotine consumers aged 19+ in Manitoba. Federal law restricts nicotine concentrations to a maximum of 20 mg/mL.
              </p>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-heading text-4xl sm:text-6xl font-black text-slate-900 tracking-tight uppercase mb-3">
            NICOTINE VAPOR COLLECTION
          </h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Regulated closed-system devices, replacement pods, and long-lasting pre-filled vaporizers curated for adult satisfaction.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-8 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search STLTH, Vice, Oxbar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              {NICOTINE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  Brand: {b}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto opacity-70" />
            <h3 className="font-heading text-xl font-bold text-slate-900">
              No nicotine products match your filter
            </h3>
            <p className="text-xs text-slate-500">
              Reset your criteria or explore our complete craft cannabis inventory.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedBrand('All');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Responsible Vaping Footer Note */}
        <div className="mt-16 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-heading font-bold text-slate-900 uppercase text-sm mb-1">
              Pharsyde Hardware Guarantee
            </h4>
            <p>
              All closed pod systems and electronic vape hardware carry a 7-day store warranty at our 117 Regent Ave W location in Winnipeg.
            </p>
          </div>
          <button
            onClick={() => navigateTo('policy')}
            className="text-[#529402] hover:underline font-black shrink-0"
          >
            Review 7-Day Warranty Terms →
          </button>
        </div>
      </div>
    </div>
  );
}
