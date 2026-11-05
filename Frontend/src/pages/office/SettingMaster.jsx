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
  Trash2,
  ShieldCheck,
  Smartphone,
  Download,
  ArrowUpCircle,
  Copy,
  FileText,
  Scale,
  Truck
} from 'lucide-react';

export default function SettingMaster() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // ─── 0. Home Page Sections Visibility State ──────────────────
  const [showBestSellers, setShowBestSellers] = useState(true);
  const [originalShowBestSellers, setOriginalShowBestSellers] = useState(true);
  const [savingShowBestSellers, setSavingShowBestSellers] = useState(false);

  const [showNewArrivals, setShowNewArrivals] = useState(true);
  const [originalShowNewArrivals, setOriginalShowNewArrivals] = useState(true);
  const [savingShowNewArrivals, setSavingShowNewArrivals] = useState(false);

  // ─── 1. New Arrivals Limit State ─────────────────────────────
  const [newArrivalsLimit, setNewArrivalsLimit] = useState(24);
  const [originalLimit, setOriginalLimit] = useState(24);
  const [validationError, setValidationError] = useState('');
  const [savingArrivals, setSavingArrivals] = useState(false);

  // ─── 3. Government ID Mandatory State ────────────────────────
  const [govIdMandatory, setGovIdMandatory] = useState(false);
  const [originalGovIdMandatory, setOriginalGovIdMandatory] = useState(false);
  const [savingGovId, setSavingGovId] = useState(false);

  // ─── 4. Cannabis Legal Purchase Limit State ──────────────────
  const [cannabisMaxGrams, setCannabisMaxGrams] = useState(30.0);
  const [originalCannabisMaxGrams, setOriginalCannabisMaxGrams] = useState(30.0);
  const [cannabisLimitError, setCannabisLimitError] = useState('');
  const [savingCannabisLimit, setSavingCannabisLimit] = useState(false);

  // ─── 5. Free Delivery Minimum Threshold State ────────────────
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(75.0);
  const [originalFreeDeliveryThreshold, setOriginalFreeDeliveryThreshold] = useState(75.0);
  const [freeDeliveryError, setFreeDeliveryError] = useState('');
  const [savingFreeDelivery, setSavingFreeDelivery] = useState(false);

  // ─── 2. Best Sellers Multi-Select State ───────────────────────
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [originalBestSellerIds, setOriginalBestSellerIds] = useState([]);
  const [selectedProductsData, setSelectedProductsData] = useState([]);
  const [savingBestSellers, setSavingBestSellers] = useState(false);

  // ─── 4. Mobile App Version & Force Update State ──────────────
  const [mobileLatestVersion, setMobileLatestVersion] = useState('1.0.0');
  const [originalLatestVersion, setOriginalLatestVersion] = useState('1.0.0');
  const [mobileMinVersion, setMobileMinVersion] = useState('1.0.0');
  const [originalMinVersion, setOriginalMinVersion] = useState('1.0.0');
  const [mobileApkUrl, setMobileApkUrl] = useState('https://pharsyde.jeenhost.in/apk/app-release.apk');
  const [originalApkUrl, setOriginalApkUrl] = useState('https://pharsyde.jeenhost.in/apk/app-release.apk');
  const [mobileForceUpdate, setMobileForceUpdate] = useState(true);
  const [originalForceUpdate, setOriginalForceUpdate] = useState(true);
  const [mobileReleaseNotes, setMobileReleaseNotes] = useState('Performance improvements, checkout optimizations, and bug fixes.');
  const [originalReleaseNotes, setOriginalReleaseNotes] = useState('Performance improvements, checkout optimizations, and bug fixes.');
  const [savingMobileSettings, setSavingMobileSettings] = useState(false);

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

        // Parse Storefront Sections Visibility Settings
        const bestSellerVis = res.settings.find((s) => s.key === 'show_best_sellers');
        if (bestSellerVis) {
          const isVis = bestSellerVis.value === 'true' || bestSellerVis.value === true;
          setShowBestSellers(isVis);
          setOriginalShowBestSellers(isVis);
        }

        const newArrivalsVis = res.settings.find((s) => s.key === 'show_new_arrivals');
        if (newArrivalsVis) {
          const isVis = newArrivalsVis.value === 'true' || newArrivalsVis.value === true;
          setShowNewArrivals(isVis);
          setOriginalShowNewArrivals(isVis);
        }

        // Parse New Arrivals Limit
        const limitSetting = res.settings.find((s) => s.key === 'new_arrivals_limit');
        if (limitSetting) {
          const val = parseInt(limitSetting.value, 10);
          const safeVal = isNaN(val) || val <= 0 ? 24 : val;
          setNewArrivalsLimit(safeVal);
          setOriginalLimit(safeVal);
        }

        // Parse Government ID Mandatory Setting
        const govSetting = res.settings.find((s) => s.key === 'gov_id_mandatory');
        if (govSetting) {
          const isMandatory = govSetting.value === 'true' || govSetting.value === true;
          setGovIdMandatory(isMandatory);
          setOriginalGovIdMandatory(isMandatory);
        }

        // Parse Cannabis Purchase Limit Setting
        const cannabisSetting = res.settings.find((s) => s.key === 'cannabis_max_grams');
        if (cannabisSetting && cannabisSetting.value) {
          const val = parseFloat(cannabisSetting.value);
          const safeVal = !isNaN(val) && val > 0 ? val : 30.0;
          setCannabisMaxGrams(safeVal);
          setOriginalCannabisMaxGrams(safeVal);
        }

        // Parse Free Delivery Threshold Setting
        const deliverySetting = res.settings.find((s) => s.key === 'free_delivery_threshold');
        if (deliverySetting && deliverySetting.value) {
          const val = parseFloat(deliverySetting.value);
          const safeVal = !isNaN(val) && val >= 0 ? val : 75.0;
          setFreeDeliveryThreshold(safeVal);
          setOriginalFreeDeliveryThreshold(safeVal);
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

        // Parse Mobile App Version Settings
        const latestVerSetting = res.settings.find((s) => s.key === 'mobile_latest_version');
        if (latestVerSetting && latestVerSetting.value) {
          setMobileLatestVersion(latestVerSetting.value);
          setOriginalLatestVersion(latestVerSetting.value);
        }

        const minVerSetting = res.settings.find((s) => s.key === 'mobile_min_supported_version');
        if (minVerSetting && minVerSetting.value) {
          setMobileMinVersion(minVerSetting.value);
          setOriginalMinVersion(minVerSetting.value);
        }

        const apkUrlSetting = res.settings.find((s) => s.key === 'mobile_apk_url');
        if (apkUrlSetting && apkUrlSetting.value) {
          setMobileApkUrl(apkUrlSetting.value);
          setOriginalApkUrl(apkUrlSetting.value);
        }

        const forceSetting = res.settings.find((s) => s.key === 'mobile_force_update');
        if (forceSetting) {
          const isForce = forceSetting.value === 'true' || forceSetting.value === true;
          setMobileForceUpdate(isForce);
          setOriginalForceUpdate(isForce);
        }

        const notesSetting = res.settings.find((s) => s.key === 'mobile_release_notes');
        if (notesSetting && notesSetting.value) {
          setMobileReleaseNotes(notesSetting.value);
          setOriginalReleaseNotes(notesSetting.value);
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


  const handleToggleBestSellersVisibility = async (newValue) => {
    const valToSave = newValue !== undefined ? newValue : !showBestSellers;
    setShowBestSellers(valToSave);
    try {
      setSavingShowBestSellers(true);
      const res = await updateOfficeSettingApi('show_best_sellers', valToSave ? 'true' : 'false');
      if (res.success) {
        setOriginalShowBestSellers(valToSave);
        notify(`Best Sellers section on Home Page is now: ${valToSave ? 'Visible (Shown)' : 'Hidden'}.`);
      } else {
        setShowBestSellers(originalShowBestSellers);
        notify(res.message || 'Failed to update Best Sellers visibility', 'error');
      }
    } catch (err) {
      setShowBestSellers(originalShowBestSellers);
      notify(err.message || 'Error updating setting', 'error');
    } finally {
      setSavingShowBestSellers(false);
    }
  };

  const handleToggleNewArrivalsVisibility = async (newValue) => {
    const valToSave = newValue !== undefined ? newValue : !showNewArrivals;
    setShowNewArrivals(valToSave);
    try {
      setSavingShowNewArrivals(true);
      const res = await updateOfficeSettingApi('show_new_arrivals', valToSave ? 'true' : 'false');
      if (res.success) {
        setOriginalShowNewArrivals(valToSave);
        notify(`New Arrivals section on Home Page is now: ${valToSave ? 'Visible (Shown)' : 'Hidden'}.`);
      } else {
        setShowNewArrivals(originalShowNewArrivals);
        notify(res.message || 'Failed to update New Arrivals visibility', 'error');
      }
    } catch (err) {
      setShowNewArrivals(originalShowNewArrivals);
      notify(err.message || 'Error updating setting', 'error');
    } finally {
      setSavingShowNewArrivals(false);
    }
  };

  const handleSaveGovIdSetting = async () => {
    try {
      setSavingGovId(true);
      const res = await updateOfficeSettingApi('gov_id_mandatory', govIdMandatory ? 'true' : 'false');
      if (res.success) {
        setOriginalGovIdMandatory(govIdMandatory);
        notify(`Government ID requirement successfully set to: ${govIdMandatory ? 'Mandatory' : 'Optional'}`);
      } else {
        notify(res.message || 'Failed to update Government ID setting', 'error');
      }
    } catch (err) {
      console.error('Failed to update gov_id_mandatory setting:', err);
      notify(err.message || 'Error updating setting', 'error');
    } finally {
      setSavingGovId(false);
    }
  };

  const handleSaveCannabisLimit = async () => {
    setCannabisLimitError('');
    const num = parseFloat(cannabisMaxGrams);
    if (isNaN(num) || num <= 0) {
      setCannabisLimitError('Cannabis limit must be a positive number greater than 0.');
      return;
    }
    if (num > 1000) {
      setCannabisLimitError('Cannabis limit cannot exceed 1000 grams.');
      return;
    }

    try {
      setSavingCannabisLimit(true);
      const res = await updateOfficeSettingApi('cannabis_max_grams', String(num));
      if (res.success) {
        setOriginalCannabisMaxGrams(num);
        notify(`Cannabis purchase limit successfully updated to ${num}g.`);
      } else {
        notify(res.message || 'Failed to update cannabis purchase limit.', 'error');
      }
    } catch (err) {
      console.error('Failed to update cannabis_max_grams setting:', err);
      notify(err.message || 'Error updating setting', 'error');
    } finally {
      setSavingCannabisLimit(false);
    }
  };

  const handleSaveFreeDeliveryThreshold = async () => {
    setFreeDeliveryError('');
    const num = parseFloat(freeDeliveryThreshold);
    if (isNaN(num) || num < 0) {
      setFreeDeliveryError('Free delivery threshold must be a number equal to or greater than 0.');
      return;
    }

    try {
      setSavingFreeDelivery(true);
      const res = await updateOfficeSettingApi('free_delivery_threshold', String(num));
      if (res.success) {
        setOriginalFreeDeliveryThreshold(num);
        notify(`Free delivery minimum threshold successfully updated to $${num.toFixed(2)} CAD.`);
      } else {
        notify(res.message || 'Failed to update free delivery threshold.', 'error');
      }
    } catch (err) {
      console.error('Failed to update free_delivery_threshold setting:', err);
      notify(err.message || 'Error updating setting', 'error');
    } finally {
      setSavingFreeDelivery(false);
    }
  };

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

  // ─── Mobile Version Handlers ────────────────────────────────
  const handleBumpVersion = (type = 'patch') => {
    try {
      const parts = String(mobileLatestVersion).trim().replace(/^v/, '').split('.').map((p) => parseInt(p, 10) || 0);
      while (parts.length < 3) parts.push(0);

      if (type === 'patch') {
        parts[2] += 1;
      } else if (type === 'minor') {
        parts[1] += 1;
        parts[2] = 0;
      } else if (type === 'major') {
        parts[0] += 1;
        parts[1] = 0;
        parts[2] = 0;
      }
      setMobileLatestVersion(parts.join('.'));
    } catch {
      // ignore
    }
  };

  const handleSaveMobileSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingMobileSettings(true);
      await Promise.all([
        updateOfficeSettingApi('mobile_latest_version', String(mobileLatestVersion).trim()),
        updateOfficeSettingApi('mobile_min_supported_version', String(mobileMinVersion).trim()),
        updateOfficeSettingApi('mobile_apk_url', String(mobileApkUrl).trim()),
        updateOfficeSettingApi('mobile_force_update', mobileForceUpdate ? 'true' : 'false'),
        updateOfficeSettingApi('mobile_release_notes', String(mobileReleaseNotes).trim()),
      ]);

      setOriginalLatestVersion(mobileLatestVersion);
      setOriginalMinVersion(mobileMinVersion);
      setOriginalApkUrl(mobileApkUrl);
      setOriginalForceUpdate(mobileForceUpdate);
      setOriginalReleaseNotes(mobileReleaseNotes);

      notify('Mobile App Version & Force Update settings successfully saved!');
    } catch (err) {
      console.error('Failed to update mobile app settings:', err);
      notify(err.message || 'Error updating mobile settings', 'error');
    } finally {
      setSavingMobileSettings(false);
    }
  };

  // Unsaved changes flags
  const hasArrivalsChanges = Number(newArrivalsLimit) !== Number(originalLimit);
  const hasBestSellerChanges = useMemo(() => {
    if (selectedProductIds.length !== originalBestSellerIds.length) return true;
    const origSet = new Set(originalBestSellerIds.map(String));
    return selectedProductIds.some((id) => !origSet.has(String(id)));
  }, [selectedProductIds, originalBestSellerIds]);

  const hasMobileChanges = 
    mobileLatestVersion !== originalLatestVersion ||
    mobileMinVersion !== originalMinVersion ||
    mobileApkUrl !== originalApkUrl ||
    mobileForceUpdate !== originalForceUpdate ||
    mobileReleaseNotes !== originalReleaseNotes;

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

          <a
            href="/apk/app-release.apk"
            target="_blank"
            rel="noreferrer"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer shadow-xs"
            title="Download latest mobile app release APK"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile APK (v{mobileLatestVersion})</span>
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ========================================================
          SETTING 0: STOREFRONT HOME PAGE SECTIONS VISIBILITY
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Home Page Storefront Sections Visibility
              </h2>
              <p className="text-xs text-slate-500">
                Toggle switch to show or hide the Best Sellers and New Arrivals sections on the customer home page
              </p>
            </div>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Storefront Visibility
          </span>
        </div>

        <div className="p-6 space-y-6 divide-y divide-slate-100">
          {/* Best Sellers Section Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 first:pt-0">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800">Best Sellers Section</span>
                <span className="text-xs font-normal text-slate-400 font-mono">(show_best_sellers)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  showBestSellers ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {showBestSellers ? 'Visible on Home Page' : 'Hidden from Home Page'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Controls whether the Best Sellers section is displayed on the customer storefront home page. Toggle off to completely hide this section from customers.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                type="button"
                role="switch"
                aria-checked={showBestSellers}
                onClick={() => handleToggleBestSellersVisibility()}
                disabled={loading || savingShowBestSellers}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 ${
                  showBestSellers ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title={showBestSellers ? 'Click to hide Best Sellers section' : 'Click to show Best Sellers section'}
              >
                <span className="sr-only">Toggle Best Sellers Section</span>
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    showBestSellers ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              {savingShowBestSellers && <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />}
            </div>
          </div>

          {/* New Arrivals Section Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800">New Arrivals Section</span>
                <span className="text-xs font-normal text-slate-400 font-mono">(show_new_arrivals)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  showNewArrivals ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {showNewArrivals ? 'Visible on Home Page' : 'Hidden from Home Page'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Controls whether the New Arrivals section is displayed on the customer storefront home page. Toggle off to completely hide this section from customers.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <button
                type="button"
                role="switch"
                aria-checked={showNewArrivals}
                onClick={() => handleToggleNewArrivalsVisibility()}
                disabled={loading || savingShowNewArrivals}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 ${
                  showNewArrivals ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title={showNewArrivals ? 'Click to hide New Arrivals section' : 'Click to show New Arrivals section'}
              >
                <span className="sr-only">Toggle New Arrivals Section</span>
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    showNewArrivals ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
              {savingShowNewArrivals && <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />}
            </div>
          </div>
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

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              showNewArrivals ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              Home Page: {showNewArrivals ? 'Visible' : 'Hidden'}
            </span>
          </div>
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
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              showBestSellers ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              Home Page: {showBestSellers ? 'Visible' : 'Hidden'}
            </span>
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

      
      {/* ========================================================
          SETTING 3: GOVERNMENT ID UPLOAD REQUIREMENT
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              govIdMandatory ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Government-Approved ID Verification Policy
              </h2>
              <p className="text-xs text-slate-500">
                Configure whether customer ID document upload is mandatory or optional at checkout
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            govIdMandatory
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            {govIdMandatory ? 'Mandatory Enforced' : 'Optional (Discretionary)'}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Checkout Age Verification Document</span>
                <span className="text-xs font-normal text-slate-400 font-mono">(gov_id_mandatory)</span>
              </span>
              <span className="text-xs text-slate-500">
                Current Mode: <strong className={govIdMandatory ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                  {govIdMandatory ? 'Strict Verification Required' : 'Optional Upload'}
                </strong>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              When set to <strong className="text-slate-900">Mandatory</strong>, customers must upload a valid photo ID (Driver's License, Passport, or Age of Majority card) before they are allowed to complete their order or proceed to card payment. When set to <strong className="text-slate-900">Optional</strong>, customers can choose to submit an ID to expedite pickup or courier handover, but it is not strictly required to place an order.
            </p>

            {/* Toggle Switch Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-2">
              <button
                type="button"
                onClick={() => setGovIdMandatory(false)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  !govIdMandatory
                    ? 'border-[#0166dc] bg-[#0166dc]/10 ring-1 ring-[#0166dc]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Optional (Default)
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    !govIdMandatory ? 'border-[#0166dc] bg-[#0166dc]' : 'border-slate-300'
                  }`}>
                    {!govIdMandatory && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Customers may upload an ID to expedite delivery/pickup, but can check out without one. Physical ID checked upon arrival.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGovIdMandatory(true)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  govIdMandatory
                    ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Mandatory
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    govIdMandatory ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                  }`}>
                    {govIdMandatory && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Strictly requires customer to upload a document before order submission or payment. Blocks checkout if missing.
                </p>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Status:{' '}
              <strong className={govIdMandatory !== originalGovIdMandatory ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                {govIdMandatory !== originalGovIdMandatory ? "Unsaved Changes" : "Synchronized with Database"}
              </strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {govIdMandatory !== originalGovIdMandatory && (
                <button
                  type="button"
                  onClick={() => setGovIdMandatory(originalGovIdMandatory)}
                  disabled={savingGovId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveGovIdSetting}
                disabled={loading || savingGovId || govIdMandatory === originalGovIdMandatory}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  govIdMandatory !== originalGovIdMandatory
                    ? 'bg-slate-900 hover:bg-black text-white shadow-md active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {savingGovId ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Policy...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save ID Policy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SETTING 4: CANNABIS PURCHASE LIMIT CONFIGURATION (30g)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0166dc]/20 border border-[#0166dc]/40 text-[#0166dc] flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Cannabis Purchase Limit Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Configure the maximum allowable dried cannabis equivalent (DFE) in grams per transaction
              </p>
            </div>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200">
            Active: {cannabisMaxGrams}g Limit
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Maximum Dried Cannabis Equivalent (DFE)</span>
                <span className="text-xs font-normal text-slate-400 font-mono">(cannabis_max_grams)</span>
              </span>
              <span className="text-xs text-slate-500">
                Current Setting: <strong className="text-slate-900 font-bold">{cannabisMaxGrams} grams</strong>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              This setting defines the statutory cannabis purchase limit enforced throughout the storefront and backend APIs.
              It directly controls the <strong className="text-slate-900">progress bar in the Shopping Bag</strong>, prevents customers from exceeding weight limits when adding items or increasing quantities, and enforces compliance during checkout and Moneris payments.
            </p>

            {/* Input + Quick Preset Chips */}
            <div className="space-y-3 max-w-xl pt-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Transaction Weight Limit:
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.5"
                    value={cannabisMaxGrams}
                    onChange={(e) => {
                      setCannabisLimitError('');
                      setCannabisMaxGrams(e.target.value === '' ? '' : parseFloat(e.target.value) || 0);
                    }}
                    placeholder="e.g. 30"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0166dc] focus:ring-1 focus:ring-[#0166dc]"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    grams (g)
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setCannabisLimitError('');
                      setCannabisMaxGrams(30.0);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      Number(cannabisMaxGrams) === 30
                        ? 'bg-[#0166dc]/20 border-[#0166dc] text-[#0166dc] ring-1 ring-[#0166dc]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    30g (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCannabisLimitError('');
                      setCannabisMaxGrams(45.0);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      Number(cannabisMaxGrams) === 45
                        ? 'bg-[#0166dc]/20 border-[#0166dc] text-[#0166dc] ring-1 ring-[#0166dc]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    45g
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCannabisLimitError('');
                      setCannabisMaxGrams(60.0);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      Number(cannabisMaxGrams) === 60
                        ? 'bg-[#0166dc]/20 border-[#0166dc] text-[#0166dc] ring-1 ring-[#0166dc]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    60g
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCannabisLimitError('');
                      setCannabisMaxGrams(100.0);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      Number(cannabisMaxGrams) === 100
                        ? 'bg-[#0166dc]/20 border-[#0166dc] text-[#0166dc] ring-1 ring-[#0166dc]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    100g
                  </button>
                </div>
              </div>

              {cannabisLimitError && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{cannabisLimitError}</span>
                </p>
              )}
            </div>

            {/* Live Storefront Shopping Bag Preview */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Storefront Shopping Bag Gauge Preview:
              </span>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Scale className="w-4 h-4 text-[#0166dc]" />
                    <span>
                      Cannabis Legal Limit: <strong className="text-slate-900">{Math.max(0, Number(cannabisMaxGrams || 30) - 7).toFixed(1)}g</strong> remaining
                    </span>
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                    7.0 / {Number(cannabisMaxGrams || 30).toFixed(1)}g ({Math.round(Math.min(100, (7 / Math.max(1, Number(cannabisMaxGrams || 30))) * 100))}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#0166dc] to-[#0166dc] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (7 / Math.max(1, Number(cannabisMaxGrams || 30))) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Status:{' '}
              <strong className={Number(cannabisMaxGrams) !== Number(originalCannabisMaxGrams) ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                {Number(cannabisMaxGrams) !== Number(originalCannabisMaxGrams) ? "Unsaved Changes" : "Synchronized with Database"}
              </strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {Number(cannabisMaxGrams) !== Number(originalCannabisMaxGrams) && (
                <button
                  type="button"
                  onClick={() => {
                    setCannabisLimitError('');
                    setCannabisMaxGrams(originalCannabisMaxGrams);
                  }}
                  disabled={savingCannabisLimit}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveCannabisLimit}
                disabled={loading || savingCannabisLimit || Number(cannabisMaxGrams) === Number(originalCannabisMaxGrams)}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  Number(cannabisMaxGrams) !== Number(originalCannabisMaxGrams)
                    ? 'bg-slate-900 hover:bg-black text-white shadow-md active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {savingCannabisLimit ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Limit...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Cannabis Limit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SETTING 5: FREE DELIVERY THRESHOLD CONFIGURATION ($75)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Free Delivery Threshold Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Configure the minimum cart subtotal required for customer orders to qualify for free courier delivery
              </p>
            </div>
          </div>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200">
            Active: ${Number(freeDeliveryThreshold || 75).toFixed(2)} CAD
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Free Delivery Minimum Subtotal ($ CAD)</span>
                <span className="text-xs font-normal text-slate-400 font-mono">(free_delivery_threshold)</span>
              </span>
              <span className="text-xs text-slate-500">
                Current Setting: <strong className="text-slate-900 font-bold">${Number(freeDeliveryThreshold || 75).toFixed(2)} CAD</strong>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              This setting defines the minimum product subtotal required for customers to unlock free local delivery ($0.00).
              Orders below this threshold will automatically be charged the standard <strong className="text-slate-900">$9.99 CAD</strong> courier delivery fee.
              It directly controls the <strong className="text-slate-900">Free Delivery progress bar</strong> in the Shopping Bag drawer and enforces shipping fee calculations during checkout and Moneris payments.
            </p>

            {/* Input + Quick Preset Chips */}
            <div className="space-y-3 max-w-xl pt-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Minimum Cart Subtotal for Free Delivery:
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    $
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    step="5"
                    value={freeDeliveryThreshold}
                    onChange={(e) => {
                      setFreeDeliveryError('');
                      setFreeDeliveryThreshold(e.target.value === '' ? '' : parseFloat(e.target.value) || 0);
                    }}
                    placeholder="e.g. 75"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-16 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0166dc] focus:ring-1 focus:ring-[#0166dc]"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    CAD
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setFreeDeliveryError('');
                      setFreeDeliveryThreshold(50.0);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      Number(freeDeliveryThreshold) === 50
                        ? 'bg-[#0166dc]/20 border-[#0166dc] text-[#0166dc] ring-1 ring-[#0166dc]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    $50
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFreeDeliveryError('');
                      setFreeDeliveryThreshold(75.0);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      Number(freeDeliveryThreshold) === 75
                        ? 'bg-[#0166dc]/20 border-[#0166dc] text-[#0166dc] ring-1 ring-[#0166dc]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    $75 (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFreeDeliveryError('');
                      setFreeDeliveryThreshold(100.0);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      Number(freeDeliveryThreshold) === 100
                        ? 'bg-[#0166dc]/20 border-[#0166dc] text-[#0166dc] ring-1 ring-[#0166dc]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    $100
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFreeDeliveryError('');
                      setFreeDeliveryThreshold(150.0);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      Number(freeDeliveryThreshold) === 150
                        ? 'bg-[#0166dc]/20 border-[#0166dc] text-[#0166dc] ring-1 ring-[#0166dc]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    $150
                  </button>
                </div>
              </div>

              {freeDeliveryError && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{freeDeliveryError}</span>
                </p>
              )}
            </div>

            {/* Live Storefront Shopping Bag Preview */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Storefront Shopping Bag Gauge Preview:
              </span>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Truck className="w-4 h-4 text-[#0166dc]" />
                    {45 >= Number(freeDeliveryThreshold || 75) ? (
                      <span className="text-[#0166dc] font-black">Unlocked Free Winnipeg Delivery!</span>
                    ) : (
                      <span>
                        Add <strong className="text-slate-900">${Math.max(0, Number(freeDeliveryThreshold || 75) - 45).toFixed(2)}</strong> for Free Delivery
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                    {Math.round(Math.min(100, (45 / Math.max(1, Number(freeDeliveryThreshold || 75))) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#0166dc] to-orange-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (45 / Math.max(1, Number(freeDeliveryThreshold || 75))) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Status:{' '}
              <strong className={Number(freeDeliveryThreshold) !== Number(originalFreeDeliveryThreshold) ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                {Number(freeDeliveryThreshold) !== Number(originalFreeDeliveryThreshold) ? "Unsaved Changes" : "Synchronized with Database"}
              </strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {Number(freeDeliveryThreshold) !== Number(originalFreeDeliveryThreshold) && (
                <button
                  type="button"
                  onClick={() => {
                    setFreeDeliveryError('');
                    setFreeDeliveryThreshold(originalFreeDeliveryThreshold);
                  }}
                  disabled={savingFreeDelivery}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveFreeDeliveryThreshold}
                disabled={loading || savingFreeDelivery || Number(freeDeliveryThreshold) === Number(originalFreeDeliveryThreshold)}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  Number(freeDeliveryThreshold) !== Number(originalFreeDeliveryThreshold)
                    ? 'bg-slate-900 hover:bg-black text-white shadow-md active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {savingFreeDelivery ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Threshold...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Delivery Threshold</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SETTING 4: MOBILE APP VERSION & FORCE UPDATE CONFIGURATION
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Mobile App Version & Force Update Control
              </h2>
              <p className="text-xs text-slate-500">
                Manage Android APK release versions, download endpoints, and configure mandatory app updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              mobileForceUpdate
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {mobileForceUpdate ? 'Force Update Active' : 'Soft Prompt Only'}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white font-mono">
              v{mobileLatestVersion}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveMobileSettings} className="p-6 space-y-6">
          
          {/* Version Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Latest App Version */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ArrowUpCircle className="w-3.5 h-3.5 text-purple-600" />
                  <span>Latest Production App Version</span>
                  <span className="text-[10px] font-normal text-slate-400 font-mono">(mobile_latest_version)</span>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Bump:</span>
                  <button
                    type="button"
                    onClick={() => handleBumpVersion('patch')}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-[10px] font-mono font-bold text-slate-600 transition-colors cursor-pointer"
                    title="Bump patch version (+0.0.1)"
                  >
                    +0.0.1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBumpVersion('minor')}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-[10px] font-mono font-bold text-slate-600 transition-colors cursor-pointer"
                    title="Bump minor version (+0.1.0)"
                  >
                    +0.1.0
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={mobileLatestVersion}
                onChange={(e) => setMobileLatestVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 font-mono outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-white"
              />
              <p className="text-[11px] text-slate-500">
                Any mobile client connecting with a version different from this will be marked for update.
              </p>
            </div>

            {/* 2. Minimum Supported Version */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Minimum Supported Version</span>
                <span className="text-[10px] font-normal text-slate-400 font-mono">(mobile_min_supported_version)</span>
              </label>
              <input
                type="text"
                value={mobileMinVersion}
                onChange={(e) => setMobileMinVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 font-mono outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-white"
              />
              <p className="text-[11px] text-slate-500">
                Any installed app version strictly below this will ALWAYS be hard-blocked from continuing.
              </p>
            </div>
          </div>

          {/* 3. Direct APK Download Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct APK Download URL</span>
                <span className="text-[10px] font-normal text-slate-400 font-mono">(mobile_apk_url)</span>
              </label>
              <div className="flex items-center gap-2">
                <a
                  href="/apk/app-release.apk"
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-800 inline-flex items-center gap-1"
                >
                  <span>Test Download</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-300">•</span>
                <a
                  href="/api/app/check-update?version=0.9.0"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <span>API Test</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                value={mobileApkUrl}
                onChange={(e) => setMobileApkUrl(e.target.value)}
                placeholder="https://pharsyde.jeenhost.in/apk/app-release.apk"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-white pr-20"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(mobileApkUrl);
                  notify('APK URL copied to clipboard!');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Placed in <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">public_html/apk/app-release.apk</code> and accessible directly or via <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">/download/apk</code>.
            </p>
          </div>

          {/* 4. Force Update Mode Toggle */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Update Enforcement Policy</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">(mobile_force_update)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMobileForceUpdate(true)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  mobileForceUpdate
                    ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    Strict Force Update (Mandatory)
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    mobileForceUpdate ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                  }`}>
                    {mobileForceUpdate && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Matches Jasmin ERP flow. Blocks all app access with a non-dismissible modal until the user installs the new APK.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMobileForceUpdate(false)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  !mobileForceUpdate
                    ? 'border-slate-800 bg-slate-100/70 ring-1 ring-slate-800'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Soft Prompt (Optional Update)
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    !mobileForceUpdate ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                  }`}>
                    {!mobileForceUpdate && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Notifies users that an update is available, but provides a "Remind Me Later" option unless version is below minimum.
                </p>
              </button>
            </div>
          </div>

          {/* 5. Release Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Release Notes & Changelog</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">(mobile_release_notes)</span>
            </label>
            <textarea
              rows={3}
              value={mobileReleaseNotes}
              onChange={(e) => setMobileReleaseNotes(e.target.value)}
              placeholder="Describe new features, critical bug fixes, or performance enhancements..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-white"
            />
            <p className="text-[11px] text-slate-500">
              This text is displayed inside the mobile app update modal to inform users what's new.
            </p>
          </div>

          {/* Form Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Status:{' '}
              <strong className={hasMobileChanges ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                {hasMobileChanges ? "Unsaved Mobile Settings" : "Synchronized with Database"}
              </strong>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {hasMobileChanges && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileLatestVersion(originalLatestVersion);
                    setMobileMinVersion(originalMinVersion);
                    setMobileApkUrl(originalApkUrl);
                    setMobileForceUpdate(originalForceUpdate);
                    setMobileReleaseNotes(originalReleaseNotes);
                  }}
                  disabled={savingMobileSettings}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
              )}

              <button
                type="submit"
                disabled={loading || savingMobileSettings || !hasMobileChanges}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  hasMobileChanges
                    ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-700/20 shadow-md active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {savingMobileSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Mobile Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Mobile App Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* Helper FAQ Accordion / Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
          <HelpCircle className="w-4 h-4 text-emerald-700" />
          <span>Setting Master Help & Guidelines</span>
        </div>
        <div className="space-y-3 text-xs text-slate-600">
          <div>
            <h3 className="font-bold text-slate-800">How does the Mobile Force Update work?</h3>
            <p className="mt-0.5">When a mobile device launches the app, it hits <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">/api/app/check-update</code> with its current version. If different from the latest version and Force Update is active, the app blocks the UI and opens <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">/download/apk</code> to update.</p>
          </div>
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
