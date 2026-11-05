import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getProductsApi } from '../../services/productService';
import { PRODUCTS } from '../../data/products';
import { Search, X, ArrowRight, Sparkles, ImageOff } from 'lucide-react';

export default function GlobalSearchModal() {
  const { isSearchOpen, setIsSearchOpen, navigateTo } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  // Global key listener for Ctrl/Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  // Fetch search results from backend API
  useEffect(() => {
    if (!isSearchOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      // Show default top items
      getProductsApi({ hasImage: true, limit: 4 })
        .then((res) => setResults(res.products || []))
        .catch(() => setResults(PRODUCTS.slice(0, 4)));
      return;
    }

    setLoading(true);
    const handler = setTimeout(() => {
      getProductsApi({ search: trimmed, hasImage: true, limit: 6 })
        .then((res) => {
          setResults(res.products || []);
          setLoading(false);
        })
        .catch(() => {
          // Fallback to local mock
          const filtered = PRODUCTS.filter(
            (p) =>
              p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
              p.brand.toLowerCase().includes(trimmed.toLowerCase()) ||
              p.category.toLowerCase().includes(trimmed.toLowerCase())
          );
          setResults(filtered);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(handler);
  }, [query, isSearchOpen]);

  if (!isSearchOpen) return null;

  const handleSelectProduct = (productId) => {
    setIsSearchOpen(false);
    navigateTo('product-detail', productId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={() => setIsSearchOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified inventory (e.g. Carmel, Hash, Vape, Sativa)..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>{query ? 'Matching Inventory (Photos Verified)' : 'Popular Cultivars & Releases'}</span>
            {loading && <span className="text-[#0166dc] animate-pulse">Searching...</span>}
          </div>

          {results.length === 0 && !loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm">No products found with image for "{query}"</p>
            </div>
          ) : (
            results.map((product) => {
              const pId = product.pk || product.id;
              const pName = product.product_name || product.name;
              const pImg = product.imageUrl || product.image;
              const pPrice = product.retail_price ? parseFloat(product.retail_price) : product.price;

              return (
                <div
                  key={pId}
                  onClick={() => handleSelectProduct(pId)}
                  className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 p-1 shrink-0 overflow-hidden border border-slate-200/80 flex items-center justify-center">
                      {pImg ? (
                        <img src={pImg} alt={pName} className="w-full h-full object-contain" />
                      ) : (
                        <ImageOff className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0166dc]">
                          {product.brand || 'PHARSYDE'}
                        </span>
                        {product.strain && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold uppercase">
                            {product.strain}
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading text-sm font-bold text-slate-900 truncate group-hover:text-[#0166dc] transition-colors">
                        {pName}
                      </h4>
                      <span className="text-[11px] text-slate-400">{product.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-3">
                    {pPrice !== undefined && (
                      <span className="font-heading text-sm font-bold text-slate-900">
                        ${Number(pPrice).toFixed(2)}
                      </span>
                    )}
                    <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#0166dc] text-slate-400 group-hover:text-black flex items-center justify-center transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0166dc]" />
            <span>Pharsyde Live Inventory</span>
          </span>
          <button
            onClick={() => {
              setIsSearchOpen(false);
              navigateTo('cannabis');
            }}
            className="text-[#0166dc] hover:underline font-semibold"
          >
            View Cannabis Collection →
          </button>
        </div>
      </div>
    </div>
  );
}
