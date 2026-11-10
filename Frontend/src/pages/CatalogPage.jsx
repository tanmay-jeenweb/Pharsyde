import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getProductsApi, getCategoriesApi, getBrandsApi, getStrainsApi } from '../services/productService';
import { CANNABIS_CATEGORIES, NICOTINE_CATEGORIES, isCannabisCategory, isNicotineCategory } from '../data/categories';
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
  Check,
  X,
  Scale
} from 'lucide-react';

export default function CatalogPage({ pageType: propPageType }) {
  const {
    showToast,
    cartCannabisGrams = 0,
    cannabisMaxGrams,
    isCannabisLimitExceeded = false,
    setIsCartOpen,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isCannabisPage = propPageType === 'cannabis' || location.pathname === '/cannabis';
  const isNicotinePage = propPageType === 'nicotine' || location.pathname === '/nicotine';

  const CANNABIS_LIMIT = Number(cannabisMaxGrams) > 0 ? Number(cannabisMaxGrams) : 30.0;
  const cannabisProgressPercent = Math.min(100, (cartCannabisGrams / CANNABIS_LIMIT) * 100);
  const remainingCannabis = Math.max(0, CANNABIS_LIMIT - cartCannabisGrams);
  const excessCannabis = isCannabisLimitExceeded ? Math.max(0, cartCannabisGrams - CANNABIS_LIMIT) : 0;

  // Helper to parse categories from URL parameter (comma-separated or multiple)
  const parseCategoriesFromUrl = () => {
    const raw = searchParams.get('category');
    if (!raw) return [];
    const list = raw.split(',').map((c) => c.trim()).filter((c) => c && c !== 'All');
    if (isCannabisPage) {
      return list.filter(isCannabisCategory);
    }
    if (isNicotinePage) {
      return list.filter(isNicotineCategory);
    }
    return list;
  };

  const parseBrandsFromUrl = () => {
    const raw = searchParams.get('brand');
    if (!raw) return [];
    return raw.split(',').map((b) => b.trim()).filter((b) => b && b !== 'All');
  };

  const parseStrainsFromUrl = () => {
    const raw = searchParams.get('strain');
    if (!raw) return [];
    return raw.split(',').map((s) => s.trim()).filter((s) => s && s !== 'All');
  };

  const urlSearch = searchParams.get('search');
  const urlMinPrice = searchParams.get('minPrice') || '';
  const urlMaxPrice = searchParams.get('maxPrice') || '';

  // State
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState(() => {
    if (isCannabisPage) return CANNABIS_CATEGORIES;
    if (isNicotinePage) return NICOTINE_CATEGORIES;
    return [];
  });
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(parseCategoriesFromUrl);
  const [categoryFilterQuery, setCategoryFilterQuery] = useState('');

  // Brands State
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState(parseBrandsFromUrl);
  const [brandFilterQuery, setBrandFilterQuery] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Strains State
  const [strains, setStrains] = useState(() => {
    if (isCannabisPage) return ['Indica', 'Sativa', 'Hybrid', 'Blend', 'CBD'];
    return [];
  });
  const [selectedStrains, setSelectedStrains] = useState(parseStrainsFromUrl);

  // Price Range State
  const [minPrice, setMinPrice] = useState(urlMinPrice);
  const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(urlMinPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(urlMaxPrice);

  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch || '');
  const urlPageRaw = searchParams.get('page');
  const initialPage = urlPageRaw ? parseInt(urlPageRaw, 10) : 1;
  const [page, setPage] = useState(!isNaN(initialPage) && initialPage > 0 ? initialPage : 1);
  const [limit, setLimit] = useState(24);
  const [sortBy, setSortBy] = useState('modified');
  const [sortOrder, setSortOrder] = useState('DESC');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Debounce price input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [minPrice, maxPrice]);

  // Fetch available categories once on mount or when refreshed
  // Only shows categories that actually have products with images and stock in the DB
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const fetchedCategories = await getCategoriesApi({ hasImage: true, inStock: true });
        if (isMounted && fetchedCategories && fetchedCategories.length > 0) {
          // Filter to only the categories relevant to the current page
          if (isCannabisPage) {
            const filtered = fetchedCategories.filter(isCannabisCategory);
            if (isMounted) setCategories(filtered.length > 0 ? filtered : CANNABIS_CATEGORIES);
          } else if (isNicotinePage) {
            const filtered = fetchedCategories.filter(isNicotineCategory);
            if (isMounted) setCategories(filtered.length > 0 ? filtered : NICOTINE_CATEGORIES);
          } else {
            if (isMounted) setCategories(fetchedCategories);
          }
        }
      } catch (err) {
        console.warn('Could not load categories:', err);
        // Fall back to static lists so the filter doesn't appear empty
        if (isMounted) {
          if (isCannabisPage) setCategories(CANNABIS_CATEGORIES);
          else if (isNicotinePage) setCategories(NICOTINE_CATEGORIES);
        }
      }
    }
    loadCategories();
    return () => { isMounted = false; };
  }, [isCannabisPage, isNicotinePage]);

  // Fetch available brands and strains
  useEffect(() => {
    let isMounted = true;
    async function loadMetaFilters() {
      try {
        const catScope = isCannabisPage ? CANNABIS_CATEGORIES : isNicotinePage ? NICOTINE_CATEGORIES : '';
        const [fetchedBrands, fetchedStrains] = await Promise.all([
          getBrandsApi({ category: catScope, hasImage: true, inStock: true }),
          getStrainsApi({ category: catScope, hasImage: true, inStock: true })
        ]);

        if (isMounted) {
          if (fetchedBrands && fetchedBrands.length > 0) {
            setBrands(fetchedBrands);
          }
          if (fetchedStrains && fetchedStrains.length > 0) {
            setStrains(fetchedStrains);
          } else if (isCannabisPage) {
            setStrains(['Indica', 'Sativa', 'Hybrid', 'Blend', 'CBD']);
          }
        }
      } catch (err) {
        console.warn('Could not load brands or strains:', err);
      }
    }
    loadMetaFilters();
    return () => { isMounted = false; };
  }, [isCannabisPage, isNicotinePage]);

  // Fetch products whenever filters or pagination change
  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        let queryCategories = selectedCategories;
        if (isCannabisPage) {
          queryCategories = selectedCategories.length > 0 ? selectedCategories : CANNABIS_CATEGORIES;
        } else if (isNicotinePage) {
          queryCategories = selectedCategories.length > 0 ? selectedCategories : NICOTINE_CATEGORIES;
        }

        const data = await getProductsApi({
          category: queryCategories,
          brand: selectedBrands,
          strain: selectedStrains,
          minPrice: debouncedMinPrice,
          maxPrice: debouncedMaxPrice,
          search: debouncedSearch,
          page,
          limit,
          sortBy,
          sortOrder,
          hasImage: true, // Enforces only including items with images
          inStock: true // Don't show products with 0 stock in catalog
        });

        if (isMounted) {
          // Double defensive filter: never show product with 0 stock in catalog
          const inStockProducts = (data.products || []).filter((product) => {
            if (product.inStock === false) return false;
            const stock = product.qty_available !== undefined && product.qty_available !== null
              ? parseFloat(product.qty_available)
              : null;
            return stock === null || isNaN(stock) || stock > 0;
          });
          setProducts(inStockProducts);
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
  }, [selectedCategories, selectedBrands, selectedStrains, debouncedMinPrice, debouncedMaxPrice, debouncedSearch, page, limit, sortBy, sortOrder, isCannabisPage, isNicotinePage]);

  // Sync filters from URL param if changed externally or on back/forward
  useEffect(() => {
    const urlCats = parseCategoriesFromUrl();
    const isCatDiff =
      urlCats.length !== selectedCategories.length ||
      urlCats.some((c) => !selectedCategories.includes(c));
    if (isCatDiff) {
      setSelectedCategories(urlCats);
    }

    const urlB = parseBrandsFromUrl();
    const isBrandDiff =
      urlB.length !== selectedBrands.length ||
      urlB.some((b) => !selectedBrands.includes(b));
    if (isBrandDiff) {
      setSelectedBrands(urlB);
    }

    const urlS = parseStrainsFromUrl();
    const isStrainDiff =
      urlS.length !== selectedStrains.length ||
      urlS.some((s) => !selectedStrains.includes(s));
    if (isStrainDiff) {
      setSelectedStrains(urlS);
    }

    const uMin = searchParams.get('minPrice') || '';
    const uMax = searchParams.get('maxPrice') || '';
    if (uMin !== minPrice) setMinPrice(uMin);
    if (uMax !== maxPrice) setMaxPrice(uMax);

    const uPageRaw = searchParams.get('page');
    const uPage = uPageRaw ? parseInt(uPageRaw, 10) : 1;
    if (!isNaN(uPage) && uPage > 0 && uPage !== page) {
      setPage(uPage);
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
        p.delete('page');
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
      p.delete('page');
      p.delete('category');
      return p;
    }, { replace: true });
  };

  // Multiselect brand toggle handler
  const toggleBrand = (brandName) => {
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedBrands((prev) => {
      const next = prev.includes(brandName)
        ? prev.filter((b) => b !== brandName)
        : [...prev, brandName];
      setSearchParams((params) => {
        const p = new URLSearchParams(params);
        p.delete('page');
        if (next.length === 0) p.delete('brand');
        else p.set('brand', next.join(','));
        return p;
      }, { replace: true });
      return next;
    });
  };

  const clearAllBrands = () => {
    setSelectedBrands([]);
    setPage(1);
    setSearchParams((params) => {
      const p = new URLSearchParams(params);
      p.delete('page');
      p.delete('brand');
      return p;
    }, { replace: true });
  };

  // Multiselect strain toggle handler
  const toggleStrain = (strainName) => {
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedStrains((prev) => {
      const next = prev.includes(strainName)
        ? prev.filter((s) => s !== strainName)
        : [...prev, strainName];
      setSearchParams((params) => {
        const p = new URLSearchParams(params);
        p.delete('page');
        if (next.length === 0) p.delete('strain');
        else p.set('strain', next.join(','));
        return p;
      }, { replace: true });
      return next;
    });
  };

  const clearAllStrains = () => {
    setSelectedStrains([]);
    setPage(1);
    setSearchParams((params) => {
      const p = new URLSearchParams(params);
      p.delete('page');
      p.delete('strain');
      return p;
    }, { replace: true });
  };

  // Price range preset handler
  const applyPricePreset = (min, max) => {
    const sMin = min !== null && min !== undefined ? String(min) : '';
    const sMax = max !== null && max !== undefined ? String(max) : '';
    setMinPrice(sMin);
    setMaxPrice(sMax);
    setPage(1);
    setSearchParams((params) => {
      const p = new URLSearchParams(params);
      p.delete('page');
      if (sMin) p.set('minPrice', sMin); else p.delete('minPrice');
      if (sMax) p.set('maxPrice', sMax); else p.delete('maxPrice');
      return p;
    }, { replace: true });
  };

  const clearPrice = () => {
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    setSearchParams((params) => {
      const p = new URLSearchParams(params);
      p.delete('page');
      p.delete('minPrice');
      p.delete('maxPrice');
      return p;
    }, { replace: true });
  };

  // Reset all filters including search, brand, strain, price
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedStrains([]);
    setMinPrice('');
    setMaxPrice('');
    setDebouncedMinPrice('');
    setDebouncedMaxPrice('');
    setSearchQuery('');
    setDebouncedSearch('');
    setCategoryFilterQuery('');
    setBrandFilterQuery('');
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Scroll to top when filters change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategories, selectedBrands, selectedStrains, debouncedMinPrice, debouncedMaxPrice, debouncedSearch]);

  const hasPriceFilter = (debouncedMinPrice !== '' && debouncedMinPrice !== null) || (debouncedMaxPrice !== '' && debouncedMaxPrice !== null);
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedStrains.length > 0 ||
    hasPriceFilter ||
    debouncedSearch.trim() !== '';

  // Sort change handler
  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === 'price_asc') {
      setSortBy('retail_price');
      setSortOrder('ASC');
    } else if (val === 'price_desc') {
      setSortBy('retail_price');
      setSortOrder('DESC');
    } else if (val === 'thc_desc') {
      setSortBy('thc');
      setSortOrder('DESC');
    } else if (val === 'thc_asc') {
      setSortBy('thc');
      setSortOrder('ASC');
    } else {
      setSortBy('modified');
      setSortOrder('DESC');
    }
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams((params) => {
      const p = new URLSearchParams(params);
      p.delete('page');
      return p;
    }, { replace: true });
  };

  // Filtered categories for sidebar search
  const displayedCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categoryFilterQuery.toLowerCase().trim())
  );
  const visibleCategories = showAllCategories
    ? displayedCategories
    : displayedCategories.slice(0, 10);

  // Filtered brands for sidebar search
  const displayedBrands = brands.filter((b) =>
    b.toLowerCase().includes(brandFilterQuery.toLowerCase().trim())
  );
  const visibleBrands = showAllBrands ? displayedBrands : displayedBrands.slice(0, 8);

  // Strain styling helper
  const getStrainStyle = (strainName, isSelected) => {
    const lower = (strainName || '').toLowerCase();
    if (lower.includes('indica')) {
      return isSelected
        ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
        : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100/80';
    }
    if (lower.includes('sativa')) {
      return isSelected
        ? 'bg-amber-500 text-black border-amber-500 shadow-xs font-bold'
        : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100/80';
    }
    if (lower.includes('hybrid')) {
      return isSelected
        ? 'bg-[#0166dc] text-white border-[#0166dc] shadow-xs font-bold'
        : 'bg-blue-50 text-blue-950 border-blue-200 hover:bg-blue-100/80';
    }
    return isSelected
      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
  };

  const pricePresets = [
    { label: 'Under $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100+', min: 100, max: null }
  ];

  // Pagination calculation
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handlePageChange = (newPage) => {
    const targetPage = Math.max(1, Math.min(totalPages, newPage));
    if (targetPage === page) return;
    setPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams((params) => {
      const p = new URLSearchParams(params);
      if (targetPage > 1) {
        p.set('page', String(targetPage));
      } else {
        p.delete('page');
      }
      return p;
    }, { replace: true });
  };
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
    <div className="min-h-screen pt-28 pb-36 bg-[#F8FAFC]">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Minimal Clean Page Header */}
        <div className="mb-8 pb-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-slate-900 uppercase">
              {isCannabisPage ? 'Cannabis Products' : isNicotinePage ? 'Nicotine Products' : 'Explore Our Collection'}
            </h1>
          </div>

          {/* Right Status Pill */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <div className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0166dc]" />
              <span>
                <strong className="text-slate-900 font-bold">{totalCount.toLocaleString()}</strong> {isCannabisPage ? 'Cannabis Products' : isNicotinePage ? 'Nicotine Products' : 'Products'} Available
              </span>
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
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0166dc]"
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
              <span>Filters {hasActiveFilters && `(${selectedCategories.length + selectedBrands.length + selectedStrains.length + (hasPriceFilter ? 1 : 0)})`}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#0166dc]" />
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
                    : sortBy === 'thc' && sortOrder === 'DESC'
                    ? 'thc_desc'
                    : sortBy === 'thc' && sortOrder === 'ASC'
                    ? 'thc_asc'
                    : 'newest'
                }
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0166dc]"
              >
                <option value="newest">Recently Updated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="thc_desc">THC: High to Low</option>
                <option value="thc_asc">THC: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid: Vertical Filter Sidebar on Left, Products on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Vertical Filter Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-28">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col max-h-[calc(110vh-13rem)] overflow-hidden">
              
              {/* Pinned Sidebar Header */}
              <div className="p-5 pb-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#0166dc]" />
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

              {/* Independently Scrollable Filter Body */}
              <div className="flex-1 overflow-y-auto p-5 pt-4 space-y-5 overscroll-contain scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">

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
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0166dc] focus:bg-white transition-all"
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
                    <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#0166dc]">
                      CATEGORY
                    </label>
                    {selectedCategories.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#0166dc] text-white text-[10px] font-black">
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
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0166dc]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  {/* All Categories Option */}
                  <button
                    type="button"
                    onClick={() => toggleCategory('All')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer border ${
                      selectedCategories.length === 0
                        ? 'bg-[#0166dc] text-white font-extrabold shadow-xs shadow-[#0166dc]/20 border-[#0166dc]'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isCannabisPage ? 'All Cannabis Categories' : isNicotinePage ? 'All Nicotine Categories' : 'All Categories'}</span>
                    {selectedCategories.length === 0 && (
                      <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                    )}
                  </button>

                  {/* Individual Category Checkbox Rows */}
                  {visibleCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer group border ${
                          isSelected
                            ? 'bg-[#0166dc]/15 border-[#0166dc]/60 text-slate-950 font-bold'
                            : 'border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Checkbox Icon */}
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-[#0166dc] border-[#0166dc] text-white shadow-xs'
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

                  {/* Show More / Show Less Toggle (Matches user's screenshot) */}
                  {categories.length > 10 && !categoryFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setShowAllCategories((prev) => !prev)}
                      className="w-full text-left pt-2 pb-1 px-3 text-xs font-black uppercase tracking-wider text-[#0166dc] hover:text-[#376402] transition-colors cursor-pointer"
                    >
                      {showAllCategories ? 'SHOW LESS' : `SHOW MORE (${categories.length - 10})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Price Range Filter Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#0166dc]">
                      PRICE RANGE
                    </label>
                    {hasPriceFilter && (
                      <span className="w-2 h-2 rounded-full bg-[#0166dc]" />
                    )}
                  </div>
                  {hasPriceFilter && (
                    <button
                      onClick={clearPrice}
                      className="text-[11px] text-slate-400 hover:text-orange-600 hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {pricePresets.map((preset) => {
                    const isActive =
                      (preset.min === null || preset.min === 0 ? (minPrice === '' || minPrice === '0') : minPrice === String(preset.min)) &&
                      (preset.max === null ? maxPrice === '' : maxPrice === String(preset.max));
                    return (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => {
                          if (isActive) clearPrice();
                          else applyPricePreset(preset.min, preset.max);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer text-center truncate ${
                          isActive
                            ? 'bg-[#0166dc] text-white font-extrabold border-[#0166dc] shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Min / Max Inputs */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0166dc]"
                    />
                  </div>
                  <span className="text-slate-400 text-xs font-bold">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0166dc]"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Name Filter Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#0166dc]">
                      BRAND
                    </label>
                    {selectedBrands.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#0166dc] text-white text-[10px] font-black">
                        {selectedBrands.length}
                      </span>
                    )}
                  </div>
                  {selectedBrands.length > 0 && (
                    <button
                      onClick={clearAllBrands}
                      className="text-[11px] text-slate-400 hover:text-orange-600 hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Optional brand quick search if brand count > 6 */}
                {brands.length > 6 && (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={brandFilterQuery}
                      onChange={(e) => setBrandFilterQuery(e.target.value)}
                      placeholder="Filter brands..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0166dc]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  {visibleBrands.length === 0 ? (
                    <div className="text-[11px] text-slate-400 py-1.5 px-2">No brands found</div>
                  ) : (
                    visibleBrands.map((bName) => {
                      const isSelected = selectedBrands.includes(bName);
                      return (
                        <button
                          type="button"
                          key={bName}
                          onClick={() => toggleBrand(bName)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer group border ${
                            isSelected
                              ? 'bg-[#0166dc]/15 border-[#0166dc]/60 text-slate-950 font-bold'
                              : 'border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                isSelected
                                  ? 'bg-[#0166dc] border-[#0166dc] text-white shadow-xs'
                                  : 'border-slate-300 bg-white group-hover:border-slate-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate">{bName}</span>
                          </div>
                        </button>
                      );
                    })
                  )}

                  {/* Brand Show More / Show Less Toggle */}
                  {brands.length > 8 && !brandFilterQuery && (
                    <button
                      type="button"
                      onClick={() => setShowAllBrands((prev) => !prev)}
                      className="w-full text-left pt-2 pb-1 px-3 text-xs font-black uppercase tracking-wider text-[#0166dc] hover:text-[#376402] transition-colors cursor-pointer"
                    >
                      {showAllBrands ? 'SHOW LESS' : `SHOW MORE (${brands.length - 8})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Strain Filter Section */}
              {strains.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <label className="block text-[12px] font-extrabold uppercase tracking-wider text-[#0166dc]">
                        STRAIN
                      </label>
                      {selectedStrains.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#0166dc] text-white text-[10px] font-black">
                          {selectedStrains.length}
                        </span>
                      )}
                    </div>
                    {selectedStrains.length > 0 && (
                      <button
                        onClick={clearAllStrains}
                        className="text-[11px] text-slate-400 hover:text-orange-600 hover:underline font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {strains.map((strainName) => {
                      const isSelected = selectedStrains.includes(strainName);
                      return (
                        <button
                          type="button"
                          key={strainName}
                          onClick={() => toggleStrain(strainName)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${getStrainStyle(strainName, isSelected)}`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{strainName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verified Image Indicator Badge */}
              
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
                    <span> in <span className="text-[#0166dc] font-bold">"{selectedCategories[0]}"</span></span>
                  )}
                  {selectedCategories.length > 1 && (
                    <span> across <span className="text-[#0166dc] font-bold">{selectedCategories.length} categories</span></span>
                  )}
                </span>

                {/* Multiselect Category Chips */}
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0166dc]/20 border border-[#0166dc]/50 text-slate-900 font-bold text-[11px]"
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

                {/* Multiselect Brand Chips */}
                {selectedBrands.map((bName) => (
                  <span
                    key={bName}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px]"
                  >
                    <span>{bName}</span>
                    <button
                      onClick={() => toggleBrand(bName)}
                      className="hover:text-[#0166dc] cursor-pointer"
                      title={`Remove ${bName}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Multiselect Strain Chips */}
                {selectedStrains.map((sName) => (
                  <span
                    key={sName}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-[11px]"
                  >
                    <span>{sName}</span>
                    <button
                      onClick={() => toggleStrain(sName)}
                      className="hover:text-black cursor-pointer"
                      title={`Remove ${sName}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Price Range Chip */}
                {hasPriceFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-bold text-[11px]">
                    <span>${minPrice || '0'} - ${maxPrice || '∞'}</span>
                    <button
                      onClick={clearPrice}
                      className="hover:text-black cursor-pointer"
                      title="Clear price filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Search Term Chip */}
                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px]">
                    "{debouncedSearch}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-black cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Reset all filters link */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-orange-600 hover:underline font-bold px-1 cursor-pointer"
                  >
                    Reset all
                  </button>
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
                        : sortBy === 'thc' && sortOrder === 'DESC'
                        ? 'thc_desc'
                        : sortBy === 'thc' && sortOrder === 'ASC'
                        ? 'thc_asc'
                        : 'newest'
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0166dc]"
                  >
                    <option value="newest">Recently Updated</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="thc_desc">THC: High to Low</option>
                    <option value="thc_asc">THC: Low to High</option>
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
                    className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0166dc]"
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
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <p className="font-semibold text-red-700">{error}</p>
                <button
                  onClick={() => setPage(1)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0166dc]/20 flex items-center justify-center text-[#0166dc]">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-heading text-slate-900 mb-2">No Products Found</h3>
                <p className="text-slate-500 text-sm mb-6">
                  We couldn't find any products with photos matching your current category or search criteria.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#0166dc] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#0153b3] transition-all shadow-md shadow-[#0166dc]/20 cursor-pointer"
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
                    onClick={() => handlePageChange(page - 1)}
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
                        onClick={() => handlePageChange(1)}
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
                      onClick={() => handlePageChange(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        page === pNum
                          ? 'bg-[#0166dc] text-white shadow-md shadow-[#0166dc]/20 font-black'
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
                        onClick={() => handlePageChange(totalPages)}
                        className="w-9 h-9 rounded-xl border border-slate-200 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(page + 1)}
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
                  <SlidersHorizontal className="w-4 h-4 text-[#0166dc]" />
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
                    ? 'bg-[#0166dc] text-white font-extrabold border-[#0166dc]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{isCannabisPage ? 'All Cannabis Categories' : isNicotinePage ? 'All Nicotine Categories' : 'All Categories'}</span>
                {selectedCategories.length === 0 && <span className="w-2 h-2 rounded-full bg-black" />}
              </button>

              {/* Individual Categories Checkboxes */}
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {visibleCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-[#0166dc]/15 border-[#0166dc]/60 text-slate-950 font-bold'
                          : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#0166dc] border-[#0166dc] text-white'
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

                {/* Show More / Show Less Toggle (Mobile) */}
                {categories.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((prev) => !prev)}
                    className="w-full text-left pt-2 pb-1 px-3 text-xs font-black uppercase tracking-wider text-[#0166dc] hover:text-[#376402] transition-colors cursor-pointer"
                  >
                    {showAllCategories ? 'SHOW LESS' : `SHOW MORE (${categories.length - 10})`}
                  </button>
                )}
              </div>

              {/* Mobile Price Range Section */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Price Range (CAD)
                  </span>
                  {hasPriceFilter && (
                    <button
                      onClick={clearPrice}
                      className="text-[11px] text-orange-600 hover:underline font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {pricePresets.map((preset) => {
                    const isActive =
                      (preset.min === null || preset.min === 0 ? (minPrice === '' || minPrice === '0') : minPrice === String(preset.min)) &&
                      (preset.max === null ? maxPrice === '' : maxPrice === String(preset.max));
                    return (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => {
                          if (isActive) clearPrice();
                          else applyPricePreset(preset.min, preset.max);
                        }}
                        className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer text-center truncate ${
                          isActive
                            ? 'bg-[#0166dc] text-white font-extrabold border-[#0166dc]'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <span className="text-slate-400 text-xs font-bold">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Brand Section */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Brand {selectedBrands.length > 0 && `(${selectedBrands.length})`}
                  </span>
                  {selectedBrands.length > 0 && (
                    <button
                      onClick={clearAllBrands}
                      className="text-[11px] text-orange-600 hover:underline font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {brands.length > 6 && (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={brandFilterQuery}
                      onChange={(e) => setBrandFilterQuery(e.target.value)}
                      placeholder="Filter brands..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800"
                    />
                  </div>
                )}

                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {visibleBrands.map((bName) => {
                    const isSelected = selectedBrands.includes(bName);
                    return (
                      <button
                        type="button"
                        key={bName}
                        onClick={() => toggleBrand(bName)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer border ${
                          isSelected
                            ? 'bg-[#0166dc]/15 border-[#0166dc]/60 text-slate-950 font-bold'
                            : 'border-slate-100 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-[#0166dc] border-[#0166dc] text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{bName}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Strain Section */}
              {strains.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Strain {selectedStrains.length > 0 && `(${selectedStrains.length})`}
                    </span>
                    {selectedStrains.length > 0 && (
                      <button
                        onClick={clearAllStrains}
                        className="text-[11px] text-orange-600 hover:underline font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {strains.map((strainName) => {
                      const isSelected = selectedStrains.includes(strainName);
                      return (
                        <button
                          type="button"
                          key={strainName}
                          onClick={() => toggleStrain(strainName)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${getStrainStyle(strainName, isSelected)}`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{strainName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Actions Bottom Bar */}
            <div className="pt-4 border-t border-slate-200 space-y-2 mt-6">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-black font-extrabold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
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

      {/* Floating Bottom Cannabis Legal Limit Progress Bar — hidden when cart is empty (0g) */}
      {cartCannabisGrams > 0 && (!isNicotinePage || cartCannabisGrams > 0) && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-3.5 sm:p-4 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2 font-medium text-xs">
            <span className="flex items-center gap-2 text-slate-700">
              <div className={`p-1.5 rounded-xl shrink-0 ${
                isCannabisLimitExceeded
                  ? 'bg-red-50 text-red-600'
                  : cannabisProgressPercent >= 80
                  ? 'bg-orange-50 text-orange-500'
                  : 'bg-[#0166dc]/10 text-[#0166dc]'
              }`}>
                <Scale className="w-4 h-4 shrink-0" />
              </div>
              {isCannabisLimitExceeded ? (
                <span className="text-red-600 font-bold">
                  Exceeds {CANNABIS_LIMIT.toFixed(1)}g Legal Purchase Limit (+{excessCannabis.toFixed(1)}g)
                </span>
              ) : cartCannabisGrams >= CANNABIS_LIMIT ? (
                <span className="text-[#0166dc] font-black">
                  Reached {CANNABIS_LIMIT.toFixed(1)}g Legal Purchase Limit
                </span>
              ) : (
                <span>
                  Cannabis Legal Limit (30g per transaction): <strong className="text-slate-900 font-bold">{remainingCannabis.toFixed(1)}g</strong> remaining
                </span>
              )}
            </span>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className={`text-[11px] font-mono font-semibold shrink-0 ${
                isCannabisLimitExceeded
                  ? 'text-red-600 font-bold'
                  : cannabisProgressPercent >= 80
                  ? 'text-orange-600 font-bold'
                  : 'text-slate-600'
              }`}>
                {cartCannabisGrams.toFixed(1)} / {CANNABIS_LIMIT.toFixed(1)}g ({Math.round(cannabisProgressPercent)}%)
              </span>
              {cartCannabisGrams > 0 && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="px-3 py-1 rounded-lg bg-[#0166dc] hover:bg-[#0153b3] text-white text-[11px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                >
                  View Bag
                </button>
              )}
            </div>
          </div>

          <div className={`w-full ${isCannabisLimitExceeded ? 'bg-red-100' : 'bg-slate-200'} h-2 rounded-full overflow-hidden`}>
            <div
              className={`${
                isCannabisLimitExceeded
                  ? 'bg-red-500'
                  : cannabisProgressPercent >= 80
                  ? 'bg-gradient-to-r from-[#0166dc] to-orange-500'
                  : 'bg-gradient-to-r from-[#0166dc] to-[#0166dc]'
              } h-full transition-all duration-500 rounded-full`}
              style={{ width: `${cannabisProgressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
