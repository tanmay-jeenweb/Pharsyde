import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import {
  getOfficeHomeSectionsApi,
  createOfficeHomeSectionApi,
  updateOfficeHomeSectionApi,
  toggleOfficeHomeSectionActiveApi,
  deleteOfficeHomeSectionApi,
  reorderOfficeHomeSectionsApi,
  getOfficeProductsApi
} from '../../services/officeApi';
import { getCategoriesApi } from '../../services/productService';

export default function HomeSectionMaster() {
  // ─── Main State ──────────────────────────────────────────────
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [notification, setNotification] = useState(null);

  // ─── Modal State ─────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields (3 Lines)
  const [heading, setHeading] = useState('');
  const [subHeading, setSubHeading] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [formError, setFormError] = useState('');

  // ─── Product Dropdown Selector State ─────────────────────────
  const [productSearch, setProductSearch] = useState('');
  const [dropdownCategory, setDropdownCategory] = useState('all');
  const [categoryList, setCategoryList] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [totalProductsWithImages, setTotalProductsWithImages] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Map of loaded product details (pk -> product object) for quick thumbnail & name lookups
  const [productsCache, setProductsCache] = useState(new Map());

  // ─── Helper: Show Notification ───────────────────────────────
  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 6000);
  };

  // ─── Fetch All Sections ──────────────────────────────────────
  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await getOfficeHomeSectionsApi();
      if (res.success && Array.isArray(res.sections)) {
        setSections(res.sections);
        // Pre-fetch details for all selected products across all sections for thumbnail rendering
        const allIds = new Set();
        res.sections.forEach((sec) => {
          if (Array.isArray(sec.product_ids)) {
            sec.product_ids.forEach((id) => allIds.add(String(id)));
          }
        });
        if (allIds.size > 0) {
          hydrateProductsCache(Array.from(allIds));
        }
      }
    } catch (err) {
      console.error('Failed to load home sections:', err);
      notify(err.message || 'Failed to fetch home sections', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Hydrate Products Cache ──────────────────────────────────
  const hydrateProductsCache = async (pks = []) => {
    if (!pks || pks.length === 0) return;
    try {
      const res = await getOfficeProductsApi({
        limit: 1000,
        active: 'true',
        hasImage: 'true'
      });
      if (res.success && Array.isArray(res.products)) {
        setProductsCache((prev) => {
          const next = new Map(prev);
          res.products.forEach((p) => {
            next.set(String(p.pk), p);
          });
          return next;
        });
      }
    } catch (err) {
      console.warn('Could not hydrate products cache:', err);
    }
  };

  // ─── Fetch Categories ────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const cats = await getCategoriesApi({ hasImage: true });
      if (Array.isArray(cats)) {
        setCategoryList(cats);
      }
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  };

  // ─── Search Products for Selector Dropdown ───────────────────
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
        // Also update cache
        setProductsCache((prev) => {
          const next = new Map(prev);
          res.products.forEach((p) => next.set(String(p.pk), p));
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to search products:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchCategories();
    searchProducts('', 'all');
  }, []);

  // Debounced search on input or category change
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(productSearch, dropdownCategory);
    }, 250);
    return () => clearTimeout(timer);
  }, [productSearch, dropdownCategory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Modal Open / Close Handlers ─────────────────────────────
  const openCreateModal = () => {
    setModalMode('create');
    setCurrentId(null);
    setHeading('');
    setSubHeading('');
    setSelectedProductIds([]);
    setIsActive(true);
    // Suggest next order number (current highest + 1)
    const maxOrder = sections.reduce((max, s) => Math.max(max, s.display_order || 0), 0);
    setDisplayOrder(maxOrder + 1);
    setFormError('');
    setIsModalOpen(true);
    setIsDropdownOpen(false);
    setProductSearch('');
    setDropdownCategory('all');
  };

  const openEditModal = (sec) => {
    setModalMode('edit');
    setCurrentId(sec.id);
    setHeading(sec.heading || '');
    setSubHeading(sec.sub_heading || '');
    const ids = Array.isArray(sec.product_ids) ? sec.product_ids.map(String) : [];
    setSelectedProductIds(ids);
    setIsActive(Boolean(sec.active));
    setDisplayOrder(sec.display_order || 1);
    setFormError('');
    setIsModalOpen(true);
    setIsDropdownOpen(false);
    setProductSearch('');
    setDropdownCategory('all');
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setFormError('');
  };

  // ─── Product Selection Handlers ──────────────────────────────
  const toggleProduct = (pk) => {
    const pkStr = String(pk);
    setSelectedProductIds((prev) =>
      prev.includes(pkStr) ? prev.filter((id) => id !== pkStr) : [...prev, pkStr]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredPks = productOptions.map((p) => String(p.pk));
    setSelectedProductIds((prev) => {
      const set = new Set([...prev, ...filteredPks]);
      return Array.from(set);
    });
  };

  const handleClearFiltered = () => {
    const filteredPks = new Set(productOptions.map((p) => String(p.pk)));
    setSelectedProductIds((prev) => prev.filter((id) => !filteredPks.has(id)));
  };

  const handleClearAllSelected = () => {
    setSelectedProductIds([]);
  };

  const removeSingleSelected = (pk) => {
    const pkStr = String(pk);
    setSelectedProductIds((prev) => prev.filter((id) => id !== pkStr));
  };

  // ─── Save / Submit Section ───────────────────────────────────
  const handleSubmitSection = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!heading.trim()) {
      setFormError('Section Heading is required.');
      return;
    }

    if (selectedProductIds.length === 0) {
      setFormError('Please select at least 1 product for this section.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        heading: heading.trim(),
        sub_heading: subHeading.trim(),
        product_ids: selectedProductIds,
        display_order: Number(displayOrder) || 1,
        active: isActive ? 1 : 0
      };

      if (modalMode === 'create') {
        const res = await createOfficeHomeSectionApi(payload);
        if (res.success) {
          notify(`Section "${payload.heading}" created successfully!`);
          setIsModalOpen(false);
          await fetchSections();
        } else {
          setFormError(res.message || 'Failed to create section.');
        }
      } else {
        const res = await updateOfficeHomeSectionApi(currentId, payload);
        if (res.success) {
          notify(`Section "${payload.heading}" updated successfully!`);
          setIsModalOpen(false);
          await fetchSections();
        } else {
          setFormError(res.message || 'Failed to update section.');
        }
      }
    } catch (err) {
      console.error('Error saving section:', err);
      setFormError(err.message || 'An error occurred while saving the section.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle Active Status ────────────────────────────────────
  const handleToggleActive = async (sec) => {
    try {
      const res = await toggleOfficeHomeSectionActiveApi(sec.id);
      if (res.success) {
        notify(`Section "${sec.heading}" is now ${res.section.active ? 'Active (Visible on Home)' : 'Inactive (Hidden)'}.`);
        setSections((prev) =>
          prev.map((s) => (s.id === sec.id ? { ...s, active: res.section.active } : s))
        );
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
      notify(err.message || 'Failed to toggle section status', 'error');
    }
  };

  // ─── Delete Section ──────────────────────────────────────────
  const handleDeleteSection = async (sec) => {
    if (!window.confirm(`Are you sure you want to permanently delete the section "${sec.heading}"?`)) {
      return;
    }

    try {
      const res = await deleteOfficeHomeSectionApi(sec.id);
      if (res.success) {
        notify(`Section "${sec.heading}" deleted successfully.`);
        setSections((prev) => prev.filter((s) => s.id !== sec.id));
      }
    } catch (err) {
      console.error('Failed to delete section:', err);
      notify(err.message || 'Failed to delete section', 'error');
    }
  };

  // ─── Reordering Handlers (Move Up / Move Down) ───────────────
  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Recalculate display_order sequentially: 1, 2, 3...
    const orderList = newSections.map((sec, idx) => ({
      id: sec.id,
      display_order: idx + 1
    }));

    // Optimistic UI update
    setSections(newSections.map((sec, idx) => ({ ...sec, display_order: idx + 1 })));

    try {
      setSavingOrder(true);
      await reorderOfficeHomeSectionsApi(orderList);
      notify('Sections order updated successfully.');
    } catch (err) {
      console.error('Failed to persist reorder:', err);
      notify(err.message || 'Failed to update section order', 'error');
      fetchSections(); // rollback
    } finally {
      setSavingOrder(false);
    }
  };

  // Helper to extract first image from product object
  const getProductImage = (product) => {
    if (!product) return null;
    let url = product.imageUrl;
    if (!url) return null;
    try {
      if (typeof url === 'string' && url.startsWith('[')) {
        const parsed = JSON.parse(url);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch {}
    return url;
  };

  // Render Thumbnail Avatar Stack for a section
  const renderThumbnailsCluster = (sec) => {
    const pks = Array.isArray(sec.product_ids) ? sec.product_ids : [];
    if (pks.length === 0) {
      return <span className="text-xs text-slate-400 italic">No products</span>;
    }

    const firstFour = pks.slice(0, 4);
    const extraCount = pks.length - 4;

    return (
      <div className="flex items-center -space-x-2">
        {firstFour.map((pk) => {
          const prod = productsCache.get(String(pk));
          const img = getProductImage(prod);
          return (
            <div
              key={pk}
              className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 overflow-hidden shadow-xs shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-600"
              title={prod?.product_name || `Product PK: ${pk}`}
            >
              {img ? (
                <img src={img} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{pk.toString().slice(-2)}</span>
              )}
            </div>
          );
        })}
        {extraCount > 0 && (
          <div className="w-8 h-8 rounded-lg border-2 border-white bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shadow-xs shrink-0">
            +{extraCount}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans pb-16">
      
      {/* ─── Notification Toast ──────────────────────────────────── */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs transition-all ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Header & Primary Action ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Home Page Section Master</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {sections.length} {sections.length === 1 ? 'Section' : 'Sections'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Dynamically create, reorder, and configure custom product showcase sections on your storefront Home Page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Storefront</span>
            </a>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Section</span>
            </button>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div className="mt-5 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Storefront Placement Notice:</span> All active sections created here will be automatically rendered on the customer-facing Home Page <strong>after the New Arrivals section</strong> and <strong>before the Newsletter CTA ("STAY IN THE LOOP")</strong> in the exact order configured below.
          </div>
        </div>
      </div>

      {/* ─── Sections Reorder & Management Table ─────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">Dynamic Section Sequence</span>
            {savingOrder && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Saving sequence...</span>
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Use the <strong>Up (▲)</strong> and <strong>Down (▼)</strong> arrows to change section placement on the Home Page
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading home page sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Layers className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Custom Sections Configured Yet</h3>
              <p className="text-xs text-slate-500">
                Create your first promotional showcase section to feature curated collections, staff picks, or brand drops directly on the storefront Home Page.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create First Section</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sections.map((sec, index) => {
              const isFirst = index === 0;
              const isLast = index === sections.length - 1;
              const productCount = Array.isArray(sec.product_ids) ? sec.product_ids.length : 0;

              return (
                <div
                  key={sec.id}
                  className={`p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    sec.active ? 'hover:bg-slate-50/70' : 'bg-slate-50/40 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Left: Reorder Controls & Order Badge */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={isFirst || savingOrder}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                        title={isFirst ? "Already at top" : "Move Up in Home Page Sequence"}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={isLast || savingOrder}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                        title={isLast ? "Already at bottom" : "Move Down in Home Page Sequence"}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">ORDER</span>
                      <span className="text-base font-black text-slate-800 leading-tight">#{sec.display_order}</span>
                    </div>

                    {/* Section Text Content */}
                    <div className="space-y-1 pl-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                          {sec.heading}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            sec.active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sec.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{sec.active ? 'Active on Storefront' : 'Inactive (Draft)'}</span>
                        </span>
                      </div>

                      {sec.sub_heading ? (
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                          {sec.sub_heading}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No sub-heading configured</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Products Avatar Preview & Actions */}
                  <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    
                    {/* Products Count & Thumbnails */}
                    <div className="flex items-center gap-3">
                      {renderThumbnailsCluster(sec)}
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-800 block">
                          {productCount} {productCount === 1 ? 'Product' : 'Products'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Curated selection</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Active Status Quick Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(sec)}
                        className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          sec.active
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                        }`}
                        title={sec.active ? "Click to deactivate and hide from Home Page" : "Click to activate and show on Home Page"}
                      >
                        {sec.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{sec.active ? 'Active' : 'Hidden'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(sec)}
                        className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                        title="Edit Section Details & Products"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec)}
                        className="w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL DIALOG ──────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {modalMode === 'create' ? 'Create New Home Section' : 'Edit Home Section'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure the 3 core inputs: Heading, Sub-heading, and Curated Products.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitSection} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Form Validation Error Banner */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ─── LINE 1: HEADING ────────────────────────────────────── */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Line 1: Heading <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">Displayed as main section title</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CURATED CONNOISSEUR DROPS, STAFF PICKS, SUMMER SPECIALS..."
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                  required
                />
              </div>

              {/* ─── LINE 2: SUB-HEADING ─────────────────────────────────── */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Line 2: Sub-Heading <span className="text-slate-400 font-normal">(Optional)</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">Displayed under the title</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hand-selected craft flower & small-batch solventless concentrates from certified growers."
                  value={subHeading}
                  onChange={(e) => setSubHeading(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                />
              </div>

              {/* ─── LINE 3: PRODUCTS MULTI-SELECT DROPDOWN ──────────────── */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Line 3: Products Multi-Select Dropdown <span className="text-rose-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span>{selectedProductIds.length} Selected</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Search products or filter by category to add items to this section. Only products with verified images are shown.
                </p>

                {/* Dropdown Container */}
                <div ref={dropdownRef} className="relative mt-2">
                  
                  {/* Dropdown Input Bar */}
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
                          ? `Search products to add (${selectedProductIds.length} currently selected)...`
                          : "Search products by name, brand, SKU..."
                      }
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        if (!isDropdownOpen) setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                    />

                    {/* Category Quick Filter Dropdown */}
                    {categoryList.length > 0 && (
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
                        {categoryList.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}

                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch('')}
                        className="p-1 text-slate-400 hover:text-slate-600 mr-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                      
                      {/* Popover Header Controls */}
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">
                          {searchLoading ? (
                            <span className="inline-flex items-center gap-1.5">
                              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                              <span>Searching inventory...</span>
                            </span>
                          ) : (
                            <span>
                              Showing <strong>{productOptions.length}</strong> of <strong>{totalProductsWithImages || productOptions.length}</strong> products
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
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={handleClearFiltered}
                                className="font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                              >
                                Clear Filtered
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Options Scroll Container */}
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {productOptions.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-500 font-medium">
                            {searchLoading ? 'Searching inventory...' : 'No products found matching your search.'}
                          </div>
                        ) : (
                          productOptions.map((product) => {
                            const pkStr = String(product.pk);
                            const isSelected = selectedProductIds.includes(pkStr);
                            const img = getProductImage(product);

                            return (
                              <div
                                key={product.pk}
                                onClick={() => toggleProduct(product.pk)}
                                className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-emerald-50/70 hover:bg-emerald-100/70' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>

                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                  {img ? (
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-bold">No img</span>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    {product.product_name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    {product.brand && <span className="font-semibold text-slate-700">{product.brand}</span>}
                                    {product.category && <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{product.category}</span>}
                                    {product.retail_price && (
                                      <span className="font-bold text-emerald-700">${Number(product.retail_price).toFixed(2)}</span>
                                    )}
                                  </div>
                                </div>

                                {isSelected && (
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider shrink-0">
                                    Selected
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  )}

                </div>

                {/* Selected Products Chips Bar */}
                {selectedProductIds.length > 0 && (
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Selected Products ({selectedProductIds.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllSelected}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Remove All
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pt-1">
                      {selectedProductIds.map((pk) => {
                        const prod = productsCache.get(String(pk));
                        const img = getProductImage(prod);
                        return (
                          <div
                            key={pk}
                            className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs group"
                          >
                            <div className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {img ? (
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-slate-500">P</span>
                              )}
                            </div>
                            <span className="truncate max-w-[140px] text-[11px]">
                              {prod?.product_name || `PK #${pk}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSingleSelected(pk)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── SECTION ORDER & VISIBILITY CONTROLS ──────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Display Order Position
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-sm font-semibold text-slate-900 outline-none"
                  />
                  <p className="text-[11px] text-slate-400">Lower numbers appear first on Home Page.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Storefront Visibility
                  </label>
                  <div className="pt-1">
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        {isActive ? 'Active (Publish to Storefront Home)' : 'Draft (Hidden from Storefront)'}
                      </span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">You can toggle visibility at any time from the list.</p>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Section' : 'Save Changes'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

