import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  getOfficeSettingsApi, 
  updateOfficeSettingApi,
  getOfficeProductsApi
} from '../../services/officeApi';
import { getBestSellersProductsApi } from '../../services/productService';
import { 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  RotateCcw, 
  ExternalLink,
  Layers,
  HelpCircle,
  Search,
  Star,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Trash2
} from 'lucide-react';

export default function SettingMaster() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // ─── 1. New Arrivals Limit State ─────────────────────────────
  const [newArrivalsLimit, setNewArrivalsLimit] = useState(24);
  const [originalLimit, setOriginalLimit] = useState(24);
  const [validationError, setValidationError] = useState('');
  const [savingArrivals, setSavingArrivals] = useState(false);

  // ─── 2. Best Sellers Multi-Select State ───────────────────────
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [originalBestSellerIds, setOriginalBestSellerIds] = useState([]);
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [savingBestSellers, setSavingBestSellers] = useState(false);

  // Dropdown Product Search & Picker State
  const [productSearch, setProductSearch] = useState('');
  const [dropdownCategory, setDropdownCategory] = useState('all');
  const [productOptions, setProductOptions] = useState([]);
  const [totalProductsWithImages, setTotalProductsWithImages] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getOfficeSettingsApi();
      if (res.success && Array.isArray(res.settings)) {
        setSettings(res.settings);

        // Parse New Arrivals Limit
        const limitSetting = res.settings.find((s) => s.key === 'new_arrivals_limit');
        if (limitSetting) {
          const val = parseInt(limitSetting.value, 10);
          const safeVal = isNaN(val) || val <= 0 ? 24 : val;
          setNewArrivalsLimit(safeVal);
          setOriginalLimit(safeVal);
        }

        // Parse Best Seller Product IDs
        const bestSellerSetting = res.settings.find((s) => s.key === 'best_seller_product_ids');
        if (bestSellerSetting) {
          try {
            const parsed = typeof bestSellerSetting.value === 'string'
              ? JSON.parse(bestSellerSetting.value)
              : (Array.isArray(bestSellerSetting.value) ? bestSellerSetting.value : []);
            const cleanList = Array.isArray(parsed) ? parsed.map(String) : [];
            setSelectedProductIds(cleanList);
            setOriginalBestSellerIds(cleanList);
            await loadSelectedProductsData(cleanList);
          } catch (e) {
            console.error('Failed to parse best_seller_product_ids setting:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      notify(err.message || 'Failed to load system settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load details for selected products so thumbnails/names appear in chips
  const loadSelectedProductsData = async (ids = []) => {
    if (!ids || ids.length === 0) {
      setSelectedProductsData([]);
      return;
    }
    try {
      // 1. Try fetching directly via best-sellers endpoint which resolves exact PKs
      const bestRes = await getBestSellersProductsApi();
      if (bestRes.success && Array.isArray(bestRes.products) && bestRes.products.length > 0) {
        setSelectedProductsData(bestRes.products);
        return;
      }
    } catch {}

    try {
      // 2. Fallback: Query all catalog items with images
      const res = await getOfficeProductsApi({ limit: 1000, active: 'true', hasImage: 'true' });
      if (res.success && Array.isArray(res.products)) {
        const matching = res.products.filter((p) => ids.includes(String(p.pk)));
        setSelectedProductsData(matching);
      }
    } catch (e) {
      console.warn('Could not pre-load selected product previews:', e);
    }
  };

  useEffect(() => {
    fetchSettings();
    searchProducts('', 'all');
  }, []);

  // Search for Products inside Multi-Select Dropdown
  // Loads up to 1,000 products with valid images (matching the storefront All Products catalog)
  const searchProducts = async (term = '', category = dropdownCategory) => {
    try {
      setSearchLoading(true);
      const res = await getOfficeProductsApi({
        search: term.trim(),
        category: category !== 'all' ? category : '',
        limit: 1000,
        active: 'true',
        hasImage: 'true'
      });
      if (res.success && Array.isArray(res.products)) {
        setProductOptions(res.products);
        if (res.total !== undefined) {
          setTotalProductsWithImages(res.total);
        }
      }
    } catch (err) {
      console.error('Failed to search products:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(productSearch, dropdownCategory);
    }, 250);
    return () => clearTimeout(timer);
  }, [productSearch, dropdownCategory]);

  // Extract unique categories for the dropdown filter
  const dropdownCategoriesList = useMemo(() => {
    const set = new Set();
    productOptions.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [productOptions]);

  // ─── Arrivals Limit Handlers ──────────────────────────────────
  const handleLimitChange = (val) => {
    const num = parseInt(val, 10);
    setNewArrivalsLimit(isNaN(num) ? '' : num);

    if (isNaN(num) || num < 1) {
      setValidationError('Value must be a positive number of at least 1.');
    } else if (num > 120) {
      setValidationError('Limit cannot exceed 120 products for catalog performance.');
    } else {
      setValidationError('');
    }
  };

  const handleApplyPreset = (preset) => {
    setNewArrivalsLimit(preset);
    setValidationError('');
  };

  const handleResetArrivalsDefault = () => {
    setNewArrivalsLimit(24);
    setValidationError('');
  };

  const handleSaveArrivals = async (e) => {
    if (e) e.preventDefault();

    const num = parseInt(newArrivalsLimit, 10);
    if (isNaN(num) || num < 1 || num > 120) {
      setValidationError('Please provide a valid number between 1 and 120.');
      return;
    }

    try {
      setSavingArrivals(true);
      const res = await updateOfficeSettingApi('new_arrivals_limit', String(num));
      if (res.success) {
        setOriginalLimit(num);
        notify(`New Arrivals limit successfully updated to ${num} products!`);
      } else {
        notify(res.message || 'Failed to update setting', 'error');
      }
    } catch (err) {
      console.error(err);
      notify(err.message || 'Error updating setting', 'error');
    } finally {
      setSavingArrivals(false);
    }
  };

  // ─── Best Sellers Selection Handlers ──────────────────────────
  const toggleProductSelection = (product) => {
    const pId = String(product.pk);
    const exists = selectedProductIds.includes(pId);

    if (exists) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== pId));
      setSelectedProductsData((prev) => prev.filter((p) => String(p.pk) !== pId));
    } else {
      setSelectedProductIds((prev) => [...prev, pId]);
      setSelectedProductsData((prev) => {
        if (!prev.some((p) => String(p.pk) === pId)) {
          return [...prev, product];
        }
        return prev;
      });
    }
  };

  const removeSelectedProduct = (pId) => {
    const targetId = String(pId);
    setSelectedProductIds((prev) => prev.filter((id) => id !== targetId));
    setSelectedProductsData((prev) => prev.filter((p) => String(p.pk) !== targetId));
  };

  const handleSelectAllFiltered = () => {
    const newIds = [...selectedProductIds];
    const newItems = [...selectedProductsData];

    productOptions.forEach((p) => {
      const pId = String(p.pk);
      if (!newIds.includes(pId)) {
        newIds.push(pId);
        newItems.push(p);
      }
    });

    setSelectedProductIds(newIds);
    setSelectedProductsData(newItems);
  };

  const handleClearAllSelected = () => {
    setSelectedProductIds([]);
    setSelectedProductsData([]);
  };

  const handleSaveBestSellers = async () => {
    try {
      setSavingBestSellers(true);
      const payload = JSON.stringify(selectedProductIds);
      const res = await updateOfficeSettingApi('best_seller_product_ids', payload);
      if (res.success) {
        setOriginalBestSellerIds([...selectedProductIds]);
        notify(`Best Sellers successfully updated! (${selectedProductIds.length} products selected)`);
      } else {
        notify(res.message || 'Failed to update best sellers setting', 'error');
      }
    } catch (err) {
      console.error(err);
      notify(err.message || 'Error updating best sellers setting', 'error');
    } finally {
      setSavingBestSellers(false);
    }
  };

  // Unsaved changes flags
  const hasArrivalsChanges = Number(newArrivalsLimit) !== Number(originalLimit);
  const hasBestSellerChanges = useMemo(() => {
    if (selectedProductIds.length !== originalBestSellerIds.length) return true;
    const origSet = new Set(originalBestSellerIds.map(String));
    return selectedProductIds.some((id) => !origSet.has(String(id)));
  }, [selectedProductIds, originalBestSellerIds]);

  return (
    <div className="space-y-8 flex-1 flex flex-col font-sans max-w-5xl mx-auto w-full pb-16">
      
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs transition-all ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Sliders className="w-4 h-4" />
            <span>ERP Settings & Configurations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Setting Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage storefront product limits, select Best Seller highlights, and configure store behavior.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Reload settings from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <Link
            to="/new-arrivals"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer shadow-xs"
            title="Preview storefront New Arrivals page in new tab"
          >
            <span>New Arrivals</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/best-sellers"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer shadow-xs"
            title="Preview storefront Best Sellers page in new tab"
          >
            <span>Best Sellers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================
          SETTING 1: NEW ARRIVALS DISPLAY LIMIT
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                New Arrivals Display Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Controls the maximum number of latest products displayed on the New Arrivals storefront page
              </p>
            </div>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active Setting
          </span>
        </div>

        <form onSubmit={handleSaveArrivals} className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <label 
                htmlFor="newArrivalsLimit" 
                className="text-sm font-bold text-slate-800 flex items-center gap-2"
              >
                <span>New Arrivals Display Limit</span>
                <span className="text-xs font-normal text-slate-400 font-mono">(new_arrivals_limit)</span>
              </label>
              <span className="text-xs text-slate-500">
                Default: <strong className="text-slate-700">24 products</strong>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Specifies how many of the most recently created or updated products will be retrieved and shown on the 
              customer-facing <code className="px-1.5 py-0.5 rounded bg-slate-100 text-emerald-800 font-mono text-[11px]">/new-arrivals</code> page.
            </p>

            {/* Input & Quick Presets */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="relative w-40">
                <input
                  id="newArrivalsLimit"
                  type="number"
                  min="1"
                  max="120"
                  value={newArrivalsLimit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  disabled={loading || savingArrivals}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-base font-bold text-slate-900 outline-none transition-all ${
                    validationError
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 bg-white'
                  }`}
                  placeholder="24"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                  items
                </span>
              </div>

              {/* Preset Quick Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-400 mr-1">Presets:</span>
                {[12, 18, 24, 36, 48, 60].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    disabled={loading || savingArrivals}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      Number(newArrivalsLimit) === preset
                        ? 'bg-emerald-700 text-white shadow-xs scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {validationError && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetArrivalsDefault}
              disabled={loading || savingArrivals || Number(newArrivalsLimit) === 24}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default (24)</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {hasArrivalsChanges && (
                <button
                  type="button"
                  onClick={() => {
                    setNewArrivalsLimit(originalLimit);
                    setValidationError('');
                  }}
                  disabled={savingArrivals}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={loading || savingArrivals || !hasArrivalsChanges || !!validationError}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  hasArrivalsChanges && !validationError
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 shadow-md active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {savingArrivals ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Arrivals Limit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================
          SETTING 2: BEST SELLERS MULTI-SELECT PRODUCT DROPDOWN
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Best Sellers Product Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Select and configure the exact curated products to be displayed on the Best Sellers storefront page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span>{selectedProductIds.length} Selected</span>
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Best Seller Products Selector</span>
              <span className="text-xs font-normal text-slate-400 font-mono">(best_seller_product_ids)</span>
            </label>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Use the searchable multi-select dropdown below to pick products from your inventory. 
              Only products with verified images are listed (matching how products are loaded in the All Products catalog).
              Any product selected will be displayed on the customer-facing <code className="px-1.5 py-0.5 rounded bg-slate-100 text-amber-800 font-mono text-[11px]">/best-sellers</code> page.
            </p>
          </div>

          {/* Interactive Multi-Select Dropdown Container */}
          <div ref={dropdownRef} className="relative">
            
            {/* Dropdown Trigger & Search Input */}
            <div 
              className={`flex items-center rounded-2xl border bg-white px-3.5 py-2.5 transition-all shadow-xs ${
                isDropdownOpen
                  ? 'border-emerald-600 ring-2 ring-emerald-100'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              
              <input
                type="text"
                placeholder={
                  selectedProductIds.length > 0 
                    ? `Search to add more products (${selectedProductIds.length} currently selected)...` 
                    : "Search products by name, brand, SKU to select..."
                }
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  if (!isDropdownOpen) setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
              />

              {/* Category Quick Filter */}
              {dropdownCategoriesList.length > 0 && (
                <select
                  value={dropdownCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setDropdownCategory(newCat);
                    searchProducts(productSearch, newCat);
                  }}
                  className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-600 mr-2 cursor-pointer shrink-0"
                >
                  <option value="all">All Categories</option>
                  {dropdownCategoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}

              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title={isDropdownOpen ? "Close list" : "Open list"}
              >
                {isDropdownOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Dropdown Popover List */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Popover Subheader Controls */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    {searchLoading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                        <span>Searching catalogue...</span>
                      </span>
                    ) : (
                      <span>
                        Showing <strong>{productOptions.length}</strong> of <strong>{totalProductsWithImages || productOptions.length}</strong> products with images
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      disabled={productOptions.length === 0}
                      className="font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-40 cursor-pointer"
                    >
                      Select All ({productOptions.length})
                    </button>
                    {selectedProductIds.length > 0 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleClearAllSelected}
                          className="font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                        >
                          Clear All
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Scrollable Option Items */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                  {productOptions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No matching products found in the catalog.
                    </div>
                  ) : (
                    productOptions.map((product) => {
                      const isSelected = selectedProductIds.includes(String(product.pk));
                      return (
                        <div
                          key={product.pk}
                          onClick={() => toggleProductSelection(product)}
                          className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/70 hover:bg-emerald-100/60'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Left: Thumbnail & Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Checkbox indicator */}
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            {/* Product Thumbnail */}
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt=""
                                  className="w-full h-full object-contain"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            {/* Text Info */}
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                                {product.product_name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                                {product.brand && (
                                  <span className="font-semibold text-slate-700">{product.brand}</span>
                                )}
                                {product.category && (
                                  <>
                                    <span>•</span>
                                    <span>{product.category}</span>
                                  </>
                                )}
                                {product.sku && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-400">SKU: {product.sku}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Price & Selection Status */}
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-slate-900 font-mono">
                              ${parseFloat(product.retail_price || 0).toFixed(2)}
                            </span>
                            <div className="text-[10px] font-bold mt-0.5">
                              {isSelected ? (
                                <span className="text-emerald-700">Selected</span>
                              ) : (
                                <span className="text-slate-400">Click to add</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer in Popover */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{selectedProductIds.length} items currently selected</span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    Done Selecting
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Products Chips & Gallery */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Currently Selected Best Sellers ({selectedProductIds.length})
              </span>
              {selectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSelected}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove All</span>
                </button>
              )}
            </div>

            {selectedProductIds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-slate-50/50 space-y-2">
                <Star className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No products selected as Best Sellers yet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click on the search box above to open the multi-select dropdown and choose products to feature on the Best Sellers page.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedProductIds.map((pId) => {
                  const product = selectedProductsData.find((p) => String(p.pk) === String(pId)) || {
                    pk: pId,
                    product_name: `Product #${pId}`,
                    retail_price: null
                  };
                  return (
                    <div
                      key={pId}
                      className="rounded-xl border border-slate-200 bg-white p-2.5 flex items-center justify-between gap-2.5 shadow-xs hover:border-amber-300 transition-all group"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Product details */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate" title={product.product_name}>
                          {product.product_name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {product.retail_price ? `$${parseFloat(product.retail_price).toFixed(2)}` : `ID: ${pId}`}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeSelectedProduct(pId)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                        title="Remove from Best Sellers"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Best Sellers Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Status:{' '}
              <strong className={hasBestSellerChanges ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                {hasBestSellerChanges ? "Unsaved Selection Pending" : "Synchronized with Database"}
              </strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {hasBestSellerChanges && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductIds([...originalBestSellerIds]);
                    loadSelectedProductsData(originalBestSellerIds);
                  }}
                  disabled={savingBestSellers}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveBestSellers}
                disabled={loading || savingBestSellers || !hasBestSellerChanges}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  hasBestSellerChanges
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 shadow-md active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {savingBestSellers ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Best Sellers...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Best Sellers ({selectedProductIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Helper FAQ Accordion / Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
          <HelpCircle className="w-4 h-4 text-emerald-700" />
          <span>Setting Master Help & Guidelines</span>
        </div>
        <div className="space-y-3 text-xs text-slate-600">
          <div>
            <h3 className="font-bold text-slate-800">How does the Best Sellers multi-select work?</h3>
            <p className="mt-0.5">Click into the search field to filter products across your entire inventory. Check/uncheck products to add or remove them. Once you click "Save Best Sellers", those exact products will immediately appear on the customer-facing /best-sellers page.</p>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Can I reorder or remove selected best sellers?</h3>
            <p className="mt-0.5">Yes, each selected product card includes an (✕) remove icon. You can also click "Remove All" to clear the selection completely.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
