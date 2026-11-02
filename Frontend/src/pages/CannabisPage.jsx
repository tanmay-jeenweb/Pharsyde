import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS, CANNABIS_CATEGORIES, STRAIN_TYPES } from '../data/products';
import ProductCard from '../components/common/ProductCard';
import {
  Filter,
  X,
  SlidersHorizontal,
  Search,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Check,
  ChevronDown
} from 'lucide-react';

export default function CannabisPage() {
  const { navigateTo } = useApp();

  // All cannabis products (excluding pure nicotine hardware)
  const cannabisProducts = useMemo(() => {
    return PRODUCTS.filter((p) => !p.nicotineType);
  }, []);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStrain, setSelectedStrain] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState(100);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Available brands derived dynamically
  const availableBrands = useMemo(() => {
    const brands = new Set(cannabisProducts.map((p) => p.brand));
    return ['All', ...Array.from(brands)];
  }, [cannabisProducts]);

  // Simulate subtle loading skeleton when category switches
  const handleCategoryChange = (cat) => {
    setIsLoading(true);
    setSelectedCategory(cat);
    setTimeout(() => setIsLoading(false), 250);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return cannabisProducts
      .filter((p) => {
        // Category
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
        // Strain Type
        if (selectedStrain !== 'All' && p.strainType !== selectedStrain) return false;
        // Brand
        if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;
        // Price
        if (p.price > maxPrice) return false;
        // Stock
        if (onlyInStock && !p.inStock) return false;
        // Search query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchEffects = p.effects?.some((e) => e.toLowerCase().includes(q));
          if (!matchName && !matchBrand && !matchDesc && !matchEffects) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'alpha') return a.name.localeCompare(b.name);
        if (sortBy === 'newest') return b.id.localeCompare(a.id);
        // Featured (default)
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      });
  }, [
    cannabisProducts,
    selectedCategory,
    selectedStrain,
    selectedBrand,
    maxPrice,
    onlyInStock,
    searchQuery,
    sortBy
  ]);

  // Reset Filters
  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedStrain('All');
    setSelectedBrand('All');
    setMaxPrice(100);
    setOnlyInStock(false);
    setSearchQuery('');
    setSortBy('featured');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedStrain !== 'All' ||
    selectedBrand !== 'All' ||
    maxPrice < 100 ||
    onlyInStock ||
    searchQuery !== '';

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC] text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl sm:text-6xl font-black text-slate-900 tracking-tight uppercase mb-3">
              EXPLORE THE COLLECTION
            </h1>
            <p className="text-base text-slate-600 max-w-2xl">
              Discover our curated selection of premium cannabis products.
            </p>
          </div>

          <button
            onClick={() => navigateTo('catalog')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-bold uppercase tracking-wider shadow-md shadow-[#8EF705]/20 self-start md:self-auto transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>View Full Live Inventory (2,000+ with Photos)</span>
          </button>
        </div>

        {/* Top Controls Bar: Search & Sort & Mobile Filter Toggle */}
        <div className="mb-8 p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search flower, cartridges, concentrates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#8EF705] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Action: Mobile Filter Button & Sort Select */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-900" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8EF705] focus:bg-white"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="alpha">Alphabetical (A-Z)</option>
                <option value="newest">Newest Releases</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-6 flex-wrap text-xs">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              Active Filters:
            </span>
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#8EF705]/20 text-slate-900 border border-[#8EF705] font-bold">
                Cat: {selectedCategory}
                <button onClick={() => setSelectedCategory('All')}>
                  <X className="w-3 h-3 hover:text-black" />
                </button>
              </span>
            )}
            {selectedStrain !== 'All' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-medium">
                Strain: {selectedStrain}
                <button onClick={() => setSelectedStrain('All')}>
                  <X className="w-3 h-3 hover:text-slate-900" />
                </button>
              </span>
            )}
            {selectedBrand !== 'All' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                Brand: {selectedBrand}
                <button onClick={() => setSelectedBrand('All')}>
                  <X className="w-3 h-3 hover:text-slate-900" />
                </button>
              </span>
            )}
            {maxPrice < 100 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-medium">
                Max: ${maxPrice}
                <button onClick={() => setMaxPrice(100)}>
                  <X className="w-3 h-3 hover:text-slate-900" />
                </button>
              </span>
            )}
            {onlyInStock && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#8EF705]/20 text-slate-900 border border-[#8EF705] font-bold">
                In Stock Only
                <button onClick={() => setOnlyInStock(false)}>
                  <X className="w-3 h-3 hover:text-black" />
                </button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-[11px] text-orange-600 hover:underline ml-2 font-semibold"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Grid Layout: Sidebar on Left (Desktop), Products on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm h-fit sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-heading text-sm font-bold tracking-wider text-slate-900 uppercase flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#529402]" />
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-orange-600 hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Categories
              </label>
              <div className="space-y-1">
                {CANNABIS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-[#8EF705]/20 text-slate-900 font-black border border-[#8EF705]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && (
                      <span className="w-2 h-2 rounded-full bg-[#8EF705] shadow-[0_0_6px_#8EF705]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Strain Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Strain Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STRAIN_TYPES.map((strain) => (
                  <button
                    key={strain}
                    onClick={() => setSelectedStrain(strain)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all border ${
                      selectedStrain === strain
                        ? 'bg-orange-50 text-orange-800 border-orange-300 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {strain}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
              >
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Price Range */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-2 font-medium">
                <span>Max Price</span>
                <span className="text-slate-900 font-mono font-bold">${maxPrice} CAD</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#8EF705] cursor-pointer"
              />
            </div>

            {/* In Stock Only Checkbox */}
            <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded border-slate-300 bg-slate-50 text-[#8EF705] focus:ring-0"
              />
              <span className="text-slate-800 font-medium">In-Stock Only</span>
            </label>
          </aside>

          {/* Product Grid Area on Right */}
          <div className="lg:col-span-3">
            {/* Results Count Bar */}
            <div className="flex items-center justify-between mb-6 text-xs text-slate-600">
              <span>
                Showing <strong className="text-slate-900">{filteredProducts.length}</strong> crafted products
              </span>
              <span className="text-[#529402] font-black">Winnipeg Boutique Inventory</span>
            </div>

            {/* Loading Skeleton Simulation */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl bg-white border border-slate-200 p-4 h-96 animate-pulse shadow-xs">
                    <div className="w-full h-48 bg-slate-200 rounded-xl mb-4" />
                    <div className="w-1/3 h-4 bg-slate-200 rounded mb-2" />
                    <div className="w-2/3 h-6 bg-slate-200 rounded mb-4" />
                    <div className="w-full h-10 bg-slate-200 rounded mt-auto" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Empty State */
              <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-orange-600">
                  <Filter className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900">
                  No matching products found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try broadening your search, adjusting the price threshold, or clearing your selected filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-extrabold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-in Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white border-l border-slate-200 p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <span className="font-heading text-base font-bold text-slate-900 uppercase">
                Filter Catalogue
              </span>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Categories
              </label>
              <div className="space-y-1">
                {CANNABIS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      handleCategoryChange(cat);
                      setIsMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${
                      selectedCategory === cat
                        ? 'bg-[#8EF705]/20 text-slate-900 font-bold border border-[#8EF705]'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Strain */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Strain
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STRAIN_TYPES.map((strain) => (
                  <button
                    key={strain}
                    onClick={() => {
                      setSelectedStrain(strain);
                      setIsMobileFilterOpen(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border ${
                      selectedStrain === strain
                        ? 'bg-orange-50 text-orange-800 border-orange-300 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {strain}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-extrabold uppercase tracking-wider shadow-sm"
            >
              Apply Filters ({filteredProducts.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
