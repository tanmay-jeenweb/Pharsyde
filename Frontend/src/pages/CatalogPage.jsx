import React, { useState, useEffect, useRef, useTransition } from 'react';
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
  Zap,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Tag,
  Grid,
  CheckCircle2,
  Check,
  X
} from 'lucide-react';

export default function CatalogPage() {
  const { showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper to parse categories from URL parameter (comma-separated or multiple)
  const parseCategoriesFromUrl = () => {
    const raw = searchParams.get('category');
    if (!raw) return [];
    return raw.split(',').map((c) => c.trim()).filter((c) => c && c !== 'All');
  };

  const urlSearch = searchParams.get('search');

  // State
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(parseCategoriesFromUrl);
  const [categoryFilterQuery, setCategoryFilterQuery] = useState('');
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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);
  const syncMenuRef = useRef(null);

  // Close sync menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (syncMenuRef.current && !syncMenuRef.current.contains(event.target)) {
        setIsSyncMenuOpen(false);
      }
    }
    if (isSyncMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSyncMenuOpen]);

  // Sync products from OpenAPI, then images from WebMenu
  // isQuick = true: fetches OpenAPI catalog and Page 1 of WebMenu images (recent/new items, ~4s)
  // isQuick = false: fetches OpenAPI catalog and all pages of WebMenu images (optimized ~14s)
  const handleSync = async (isQuick = true) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setIsSyncMenuOpen(false);
    const syncLabel = isQuick ? 'Quick Sync' : 'Full Sync';
    setSyncPhase('Syncing Products...');
    showToast(`Starting ${syncLabel}: Fetching product catalogue...`, 'info');

    try {
      // Step 1: Sync base products from OpenAPI
      const prodResult = await syncProductsApi();
      const productCount = prodResult.upsertedCount || prodResult.totalFetched || 0;
      showToast(
        `Products synced (${productCount} items). Now syncing images (${isQuick ? 'recent items' : 'full catalog'})...`,
        'info'
      );

      // Step 2: Sync product images from WebMenu eapi
      setSyncPhase(isQuick ? 'Syncing Recent Images...' : 'Syncing All Images...');
      const imgResult = await syncImagesApi({ quick: isQuick });

      showToast(
        `${syncLabel} complete! ${productCount} products & ${imgResult.totalWithImagesInProducts || imgResult.totalWithImages || 0} photos synchronized.`,
        'success'
      );
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      showToast(`${syncLabel} failed: ` + err.message, 'error');
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
          category: selectedCategories,
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
  }, [selectedCategories, debouncedSearch, page, limit, sortBy, sortOrder, refreshTrigger]);

  // Sync category from URL param if changed externally or on back/forward
  useEffect(() => {
    const urlCats = parseCategoriesFromUrl();
    const isDifferent =
      urlCats.length !== selectedCategories.length ||
      urlCats.some((c) => !selectedCategories.includes(c));

    if (isDifferent) {
      setSelectedCategories(urlCats);
      setPage(1);
    }
  }, [searchParams]);

  // Multiselect category toggle handler
  const toggleCategory = (cat) => {
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedCategories((prev) => {
      let next;
      if (cat === 'All') {
        next = [];
      } else if (prev.includes(cat)) {
        next = prev.filter((c) => c !== cat);
      } else {
        next = [...prev, cat];
      }

      setSearchParams((params) => {
        const p = new URLSearchParams(params);
        if (next.length === 0) {
          p.delete('category');
        } else {
          p.set('category', next.join(','));
        }
        return p;
      }, { replace: true });

      return next;
    });
  };

  // Clear all category filters
  const clearAllCategories = () => {
    setSelectedCategories([]);
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams((params) => {
      const p = new URLSearchParams(params);
      p.delete('category');
      return p;
    }, { replace: true });
  };

  // Reset all filters including search
  const resetFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('category');
      next.delete('search');
      return next;
    }, { replace: true });
  };

  // Scroll to top when category or search changes (prevents viewport clamping to page bottom)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategories, debouncedSearch]);

  const hasActiveFilters = selectedCategories.length > 0 || debouncedSearch.trim() !== '';

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered categories for sidebar search
  const displayedCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categoryFilterQuery.toLowerCase().trim())
  );

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
        
        {/* Minimal Clean Page Header */}
        <div className="mb-8 pb-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8EF705]/15 border border-[#8EF705]/40 text-[#488203] text-[11px] font-bold tracking-wider uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#599e03] animate-pulse" />
              <span>Live Catalogue</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-slate-900 uppercase">
              Explore Our Collection
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
              Verified inventory with real-time stock levels and certified high-resolution product photography.
            </p>
          </div>

          {/* Right Status Pill & Sync Action Button */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <div className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                <strong className="text-slate-900 font-bold">{totalCount.toLocaleString()}</strong> Products with Photos
              </span>
            </div>

            {/* Sync Action Split Button */}
            <div ref={syncMenuRef} className="relative inline-flex items-stretch rounded-xl shadow-xs">
              <button
                onClick={() => handleSync(true)}
                disabled={isSyncing}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-l-xl text-xs font-bold transition-all cursor-pointer ${
                  isSyncing
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-[#8EF705] hover:bg-[#80de04] text-slate-950 hover:shadow-md hover:shadow-[#8EF705]/20 active:scale-[0.98]'
                }`}
                title="Quick Sync: Syncs base catalogue and recent product images (~4s)"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isSyncing ? syncPhase || 'Syncing...' : 'Quick Sync'}</span>
              </button>

              <button
                onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
                disabled={isSyncing}
                className={`px-2 py-2 rounded-r-xl border-l border-black/10 text-xs font-bold transition-all cursor-pointer ${
                  isSyncing
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-t border-r border-b border-slate-200'
                    : 'bg-[#8EF705] hover:bg-[#80de04] text-slate-950 active:scale-[0.98]'
                }`}
                title="More sync options"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSyncMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSyncMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => handleSync(true)}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-start gap-2.5 text-slate-800 transition-colors"
                  >
                    <Zap className="w-4 h-4 text-[#599e03] mt-0.5 shrink-0 fill-current" />
                    <div>
                      <div className="font-bold text-slate-900">Quick Sync (~2-3s)</div>
                      <div className="text-[11px] text-slate-500">Latest 500 products (1 API call)</div>
                    </div>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => handleSync(false)}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-start gap-2.5 text-slate-800 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Optimized Full Sync (~15s)</div>
                      <div className="text-[11px] text-slate-500">All 1,500+ items (4 API calls)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Toolbar (Visible only on < lg screens) */}
        <div className="lg:hidden mb-6 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#8EF705]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
              <span>Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}</span>
              {selectedCategories.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#8EF705]" />
              )}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Sort:</span>
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
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#8EF705]"
              >
                <option value="newest">Recently Updated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="stock_desc">Highest Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid: Vertical Filter Sidebar on Left, Products on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Vertical Filter Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-28 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-5">
              
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#488203]" />
                  <span className="font-heading text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                    Filters
                  </span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-orange-600 hover:underline font-bold transition-colors cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Search Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, brand..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#8EF705] focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories Multiselect Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Categories
                    </label>
                    {selectedCategories.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#8EF705] text-black text-[10px] font-black">
                        {selectedCategories.length}
                      </span>
                    )}
                  </div>
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={clearAllCategories}
                      className="text-[11px] text-slate-400 hover:text-orange-600 hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Optional category quick search if categories count > 6 */}
                {categories.length > 6 && (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={categoryFilterQuery}
                      onChange={(e) => setCategoryFilterQuery(e.target.value)}
                      placeholder="Filter category list..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#8EF705]"
                    />
                  </div>
                )}

                <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {/* All Categories Option */}
                  <button
                    type="button"
                    onClick={() => toggleCategory('All')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                      selectedCategories.length === 0
                        ? 'bg-[#8EF705] text-black font-extrabold shadow-xs shadow-[#8EF705]/20 border-[#8EF705]'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Categories</span>
                    {selectedCategories.length === 0 && (
                      <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                    )}
                  </button>

                  {/* Individual Category Checkbox Rows */}
                  {displayedCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer group border ${
                          isSelected
                            ? 'bg-[#8EF705]/15 border-[#8EF705]/60 text-slate-950 font-bold'
                            : 'border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Checkbox Icon */}
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-[#8EF705] border-[#8EF705] text-black shadow-xs'
                                : 'border-slate-300 bg-white group-hover:border-slate-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{cat}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verified Image Indicator Badge */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Only items with verified photos</span>
              </div>
            </div>
          </aside>

          {/* Right Area: Products & Controls (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-6 min-h-[650px]">

            {/* Top Toolbar (Results Info, Active Filter Chips, Sort, Per Page) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Left: Results Count & Multiselect Active Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>
                  Showing <strong className="text-slate-900 font-bold">{startItem}</strong> - <strong className="text-slate-900 font-bold">{endItem}</strong> of <strong className="text-slate-900 font-bold">{totalCount.toLocaleString()}</strong> items
                  {selectedCategories.length === 1 && (
                    <span> in <span className="text-[#488203] font-bold">"{selectedCategories[0]}"</span></span>
                  )}
                  {selectedCategories.length > 1 && (
                    <span> across <span className="text-[#488203] font-bold">{selectedCategories.length} categories</span></span>
                  )}
                </span>

                {/* Multiselect Category Chips */}
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8EF705]/20 border border-[#8EF705]/50 text-slate-900 font-bold text-[11px]"
                  >
                    <span>{cat}</span>
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="hover:text-black cursor-pointer"
                      title={`Remove ${cat}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Clear all categories link if multiple selected */}
                {selectedCategories.length > 1 && (
                  <button
                    onClick={clearAllCategories}
                    className="text-[11px] text-orange-600 hover:underline font-bold px-1 cursor-pointer"
                  >
                    Clear categories
                  </button>
                )}

                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px]">
                    "{debouncedSearch}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-black cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {/* Right: Sort & Per Page selectors */}
              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
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
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#8EF705]"
                  >
                    <option value="newest">Recently Updated</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                    <option value="stock_desc">Highest Stock</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">Show:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#8EF705]"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <p className="font-semibold">{error}</p>
                <button
                  onClick={() => setPage(1)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
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
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#8EF705] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#80de04] transition-all shadow-md shadow-[#8EF705]/20 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Products Grid (3 columns on xl screens next to sidebar) */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                        className="w-9 h-9 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
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
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                        className="w-9 h-9 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
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
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Mobile Slide-Over Filter Drawer with Multiselect Checkboxes */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white border-l border-slate-200 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="font-heading text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#488203]" />
                  Filter by Category
                </span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* All Categories Option */}
              <button
                type="button"
                onClick={() => toggleCategory('All')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer border ${
                  selectedCategories.length === 0
                    ? 'bg-[#8EF705] text-black font-extrabold border-[#8EF705]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                {selectedCategories.length === 0 && <span className="w-2 h-2 rounded-full bg-black" />}
              </button>

              {/* Individual Categories Checkboxes */}
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-[#8EF705]/15 border-[#8EF705]/60 text-slate-950 font-bold'
                          : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#8EF705] border-[#8EF705] text-black'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">{cat}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Actions Bottom Bar */}
            <div className="pt-4 border-t border-slate-200 space-y-2 mt-6">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-extrabold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Show Results ({totalCount.toLocaleString()})
              </button>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    resetFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
