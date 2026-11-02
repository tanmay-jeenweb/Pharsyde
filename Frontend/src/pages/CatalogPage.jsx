import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getProductsApi, getCategoriesApi, syncImagesApi, syncProductsApi } from '../services/productService';
import ProductCard from '../components/common/ProductCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Tag,
  Grid,
  CheckCircle2,
  X
} from 'lucide-react';

export default function CatalogPage() {
  const { showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlCategory = searchParams.get('category');
  const urlSearch = searchParams.get('search');

  // State
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'All');
  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch || '');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [sortBy, setSortBy] = useState('modified');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncPhase, setSyncPhase] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Complete Sync: First Products from OpenAPI, then Images from WebMenu
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncPhase('Syncing Products...');
    showToast('Starting Sync: Fetching product catalogue...', 'info');

    try {
      // Step 1: Sync base products from OpenAPI
      const prodResult = await syncProductsApi();
      const productCount = prodResult.upsertedCount || prodResult.totalFetched || 0;
      showToast(`Products synced (${productCount} items). Now syncing images...`, 'info');

      // Step 2: Sync product images from WebMenu eapi
      setSyncPhase('Syncing Images...');
      const imgResult = await syncImagesApi();

      showToast(
        `Sync complete! ${productCount} products & ${imgResult.totalWithImagesInProducts || imgResult.totalWithImages || 0} photos synchronized.`,
        'success'
      );
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      showToast('Sync failed: ' + err.message, 'error');
    } finally {
      setIsSyncing(false);
      setSyncPhase('');
    }
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch available categories once on mount or when refreshed
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const fetchedCategories = await getCategoriesApi({ hasImage: true });
        if (isMounted && fetchedCategories && fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
        }
      } catch (err) {
        console.warn('Could not load categories:', err);
      }
    }
    loadCategories();
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  // Fetch products whenever filters, pagination, or sync changes
  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const data = await getProductsApi({
          category: selectedCategory === 'All' ? '' : selectedCategory,
          search: debouncedSearch,
          page,
          limit,
          sortBy,
          sortOrder,
          hasImage: true // Enforces only including items with images
        });

        if (isMounted) {
          setProducts(data.products || []);
          setTotalCount(data.total || 0);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch products:', err);
          setError('Unable to load products. Please ensure the backend server is running.');
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => { isMounted = false; };
  }, [selectedCategory, debouncedSearch, page, limit, sortBy, sortOrder, refreshTrigger]);

  // Sync category from URL param if changed externally or on back/forward
  useEffect(() => {
    if (urlCategory && urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
      setPage(1);
    } else if (!urlCategory && selectedCategory !== 'All') {
      setSelectedCategory('All');
      setPage(1);
    }
  }, [urlCategory]);

  // Category switch handler
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === 'All') next.delete('category');
      else next.set('category', cat);
      return next;
    }, { replace: true });
  };

  // Sort change handler
  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === 'price_asc') {
      setSortBy('retail_price');
      setSortOrder('ASC');
    } else if (val === 'price_desc') {
      setSortBy('retail_price');
      setSortOrder('DESC');
    } else if (val === 'name_asc') {
      setSortBy('product_name');
      setSortOrder('ASC');
    } else if (val === 'stock_desc') {
      setSortBy('qty_available');
      setSortOrder('DESC');
    } else {
      setSortBy('modified');
      setSortOrder('DESC');
    }
    setPage(1);
  };

  // Pagination calculation
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startItem = totalCount > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, totalCount);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return { pages, hasStartEllipsis: start > 1, hasEndEllipsis: end < totalPages };
  };

  const { pages, hasStartEllipsis, hasEndEllipsis } = getPageNumbers();

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header Banner */}
        <div className="mb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#8EF705]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8EF705]/20 border border-[#8EF705]/40 text-[#8EF705] text-xs font-bold tracking-wider uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Inventory Catalogue</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight mb-3">
              Explore Our Collection
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Browse our fully synced inventory of craft cannabis, pre-rolls, extracts, and vaporizers with verified product photography.
            </p>
          </div>

          {/* Quick Stat Pill & Sync Action Button */}
          <div className="mt-6 sm:mt-0 sm:absolute sm:right-10 sm:bottom-10 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8EF705] animate-pulse" />
              <span className="text-slate-200">
                <strong className="text-white font-bold">{totalCount.toLocaleString()}</strong> Products with Verified Photos
              </span>
            </div>

            {/* Unified Sync Button */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isSyncing
                  ? 'bg-slate-700/80 text-slate-300 cursor-not-allowed border border-slate-600'
                  : 'bg-[#8EF705] hover:bg-[#7ce004] text-slate-950 hover:shadow-[#8EF705]/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
              title="Sync all products from TechPOS OpenAPI, then sync product images from WebMenu"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? syncPhase || 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, brand, or SKU..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#8EF705] focus:ring-2 focus:ring-[#8EF705]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort & Limit Selectors */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort:</span>
                <select
                  onChange={handleSortChange}
                  value={
                    sortBy === 'retail_price' && sortOrder === 'ASC'
                      ? 'price_asc'
                      : sortBy === 'retail_price' && sortOrder === 'DESC'
                      ? 'price_desc'
                      : sortBy === 'product_name'
                      ? 'name_asc'
                      : sortBy === 'qty_available'
                      ? 'stock_desc'
                      : 'newest'
                  }
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#8EF705]"
                >
                  <option value="newest">Recently Updated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="stock_desc">Highest Stock</option>
                </select>
              </div>

              {/* Per Page */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#8EF705]"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
              <button
                onClick={() => handleSelectCategory('All')}
                className={`px-4 py-2 rounded-xl font-bold tracking-wide shrink-0 transition-all duration-200 ${
                  selectedCategory === 'All'
                    ? 'bg-[#8EF705] text-black shadow-md shadow-[#8EF705]/20 font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-semibold tracking-wide shrink-0 transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-[#8EF705] text-black shadow-md shadow-[#8EF705]/20 font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Info & Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 font-medium">
          <div>
            Showing <strong className="text-slate-800">{startItem}</strong> - <strong className="text-slate-800">{endItem}</strong> of{' '}
            <strong className="text-slate-800">{totalCount.toLocaleString()}</strong> items
            {selectedCategory !== 'All' && (
              <span> in <span className="text-[#529402] font-bold">"{selectedCategory}"</span></span>
            )}
            {debouncedSearch && (
              <span> matching <span className="text-[#529402] font-bold">"{debouncedSearch}"</span></span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Only products with images displayed</span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-8 text-center text-rose-700 flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => setPage(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase hover:bg-rose-700 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-slate-200 p-4 space-y-4 animate-pulse"
              >
                <div className="aspect-square bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-slate-200 rounded-md w-1/2" />
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-6 bg-slate-200 rounded-md w-16" />
                  <div className="h-8 bg-slate-200 rounded-xl w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty Results State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#8EF705]/20 flex items-center justify-center text-[#529402]">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">No Products Found</h3>
            <p className="text-slate-500 text-sm mb-6">
              We couldn't find any products with photos matching your current category or search criteria.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                setPage(1);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#8EF705] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#80de04] transition-all shadow-md shadow-[#8EF705]/20"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.pk || product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination Navigation */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
            <div className="text-xs text-slate-500">
              Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Prev Button */}
              <button
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Start Ellipsis */}
              {hasStartEllipsis && (
                <>
                  <button
                    onClick={() => {
                      setPage(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-9 h-9 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700"
                  >
                    1
                  </button>
                  <span className="px-1 text-slate-400">...</span>
                </>
              )}

              {/* Page Numbers */}
              {pages.map((pNum) => (
                <button
                  key={pNum}
                  onClick={() => {
                    setPage(pNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    page === pNum
                      ? 'bg-[#8EF705] text-black shadow-md shadow-[#8EF705]/20 font-black'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </button>
              ))}

              {/* End Ellipsis */}
              {hasEndEllipsis && (
                <>
                  <span className="px-1 text-slate-400">...</span>
                  <button
                    onClick={() => {
                      setPage(totalPages);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-9 h-9 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next Button */}
              <button
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

