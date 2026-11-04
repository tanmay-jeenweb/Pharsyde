import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getNewArrivalsProductsApi } from '../services/productService';
import ProductCard from '../components/common/ProductCard';
import { 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Filter, 
  SlidersHorizontal, 
  Search, 
  Flame, 
  Package,
  Layers,
  ArrowUpDown
} from 'lucide-react';

export default function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [limit, setLimit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local filter & sort
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'price-low', 'price-high', 'name'

  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getNewArrivalsProductsApi();
      if (res.success && Array.isArray(res.products)) {
        setProducts(res.products);
        if (res.limit) setLimit(res.limit);
      } else {
        throw new Error(res.message || 'Failed to load new arrival products');
      }
    } catch (err) {
      console.error('Error fetching new arrivals:', err);
      setError(err.message || 'Unable to connect to product service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  // Extract unique categories available in this arrival batch
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Filter and sort locally for instantaneous responsiveness
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Keep only products with valid images (matching All Products catalog)
        const hasValidImage = p.imageUrl && p.imageUrl.trim() !== '' && p.imageUrl !== '[]';
        if (!hasValidImage) return false;

        // Category filter
        if (selectedCategory !== 'All' && p.category !== selectedCategory) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = (p.product_name || p.name || '').toLowerCase().includes(q);
          const brandMatch = (p.brand || '').toLowerCase().includes(q);
          const categoryMatch = (p.category || '').toLowerCase().includes(q);
          const skuMatch = (p.sku || '').toLowerCase().includes(q);
          if (!nameMatch && !brandMatch && !categoryMatch && !skuMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'price-low') {
          const priceA = parseFloat(a.retail_price || a.price || 0);
          const priceB = parseFloat(b.retail_price || b.price || 0);
          return priceA - priceB;
        }
        if (sortOption === 'price-high') {
          const priceA = parseFloat(a.retail_price || a.price || 0);
          const priceB = parseFloat(b.retail_price || b.price || 0);
          return priceB - priceA;
        }
        if (sortOption === 'name') {
          return (a.product_name || a.name || '').localeCompare(b.product_name || b.name || '');
        }
        // 'newest' default preserves API order (created_at DESC, modified DESC)
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortOption]);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50 font-sans selection:bg-[#8EF705] selection:text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#8EF705]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8EF705]/20 border border-[#8EF705]/40 text-[#8EF705] text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(142,247,5,0.2)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fresh Drops & Curated Inventory</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              New <span className="text-[#8EF705]">Arrivals</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Explore the latest hand-picked additions to our live store menu. From freshly harvested strains 
              and premium flower to artisan edibles, concentrates, and hardware.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                <Flame className="w-3.5 h-3.5 text-[#8EF705]" />
                <span>Showing latest <strong>{products.length}</strong> items</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>Default limit: <strong>{limit}</strong></span>
              </span>
              <Link 
                to="/catalog"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors underline ml-1"
              >
                <span>Browse Full 10,000+ Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Filters, Search & Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search new arrivals by strain, brand, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#8EF705] focus:bg-white focus:ring-2 focus:ring-[#8EF705]/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort & Refresh */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#8EF705] cursor-pointer"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Product Name (A-Z)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchNewArrivals}
                disabled={loading}
                className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh latest products"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 1 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" />
                <span>Categories:</span>
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Counter Banner */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{products.length}</strong> new arrivals
            {selectedCategory !== 'All' && <span> in "{selectedCategory}"</span>}
          </span>
          <span className="text-slate-400">
            Updated daily from TechPOS
          </span>
        </div>

        {/* Main Grid or Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-slate-200 p-4 h-96 flex flex-col justify-between animate-pulse"
              >
                <div className="w-full h-48 bg-slate-100 rounded-xl mb-4" />
                <div className="space-y-2.5">
                  <div className="w-20 h-4 bg-slate-100 rounded" />
                  <div className="w-full h-5 bg-slate-100 rounded" />
                  <div className="w-3/4 h-4 bg-slate-100 rounded" />
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="w-16 h-6 bg-slate-100 rounded" />
                  <div className="w-24 h-8 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-rose-200 p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-900">Unable to load new arrivals</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={fetchNewArrivals}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/catalog"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Go to Catalog
              </Link>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No matching products found</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try resetting your filter or search query to see other new arrivals.'
                : 'There are currently no products flagged as new arrivals. Check out the main catalog!'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              {(searchQuery || selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <Link
                to="/catalog"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
              >
                Explore Full Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.pk || product.id} product={product} />
            ))}
          </div>
        )}

        {/* Bottom Banner to Full Catalog */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Looking for something specific?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Browse our complete catalog featuring thousands of cannabis products, concentrates, edibles, beverages, and accessories with advanced filters.
            </p>
          </div>

          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-[0.98] shrink-0"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4 text-[#8EF705]" />
          </Link>
        </div>

      </div>
    </div>
  );
}

