import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { 
  getOfficeProductsApi, 
  toggleOfficeProductActiveApi, 
  deleteOfficeProductApi 
} from '../../services/officeApi';

export default function ProductMaster() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [showInactive, setShowInactive] = useState(false);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchProducts = async (currentSearch = search) => {
    try {
      setLoading(true);
      const res = await getOfficeProductsApi({
        search: currentSearch.trim(),
        category: selectedCategory,
        brand: selectedBrand,
        active: showInactive ? '' : 'true',
        limit: 150,
        offset: 0,
      });
      setProducts(res.products || []);
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query so typing triggers server-side product search across all 10,000+ items
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedBrand, showInactive]);

  // Extract unique categories & brands for filter dropdowns
  const categoriesList = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const handleToggleActive = async (p) => {
    const newState = !p.active;
    const actionLabel = newState ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} "${p.product_name}"?`)) return;

    try {
      await toggleOfficeProductActiveApi(p.pk, newState);
      notify(`Product "${p.product_name}" ${actionLabel}d successfully.`);
      await fetchProducts();
    } catch (err) {
      notify(err.message || 'Failed to update product status', 'error');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete product "${p.product_name}"?`)) return;

    try {
      await deleteOfficeProductApi(p.pk);
      notify(`Product "${p.product_name}" deleted.`);
      await fetchProducts();
    } catch (err) {
      notify(err.message || 'Failed to delete product', 'error');
    }
  };

  // Columns definition matching ERP's MaterialMaster
  const columns = useMemo(() => [
    {
      key: 'image',
      label: 'Photo',
      sortable: false,
      minWidth: '70px',
      render: (row) => (
        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt=""
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          )}
        </div>
      ),
    },
    {
      key: 'product_name',
      label: 'Product Details',
      minWidth: '240px',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900 leading-snug">
            {row.product_name}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono flex-wrap">
            {row.brand && (
              <span className="text-[#064e3b] font-semibold font-sans">
                {row.brand}
              </span>
            )}
            {row.brand && row.sku && <span className="text-slate-300">•</span>}
            {row.sku && <span>SKU: {row.sku}</span>}
            {row.barcode && (
              <>
                <span className="text-slate-300">•</span>
                <span>UPC: {row.barcode}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      minWidth: '140px',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#064e3b] border border-emerald-200">
          {row.category || 'General'}
        </span>
      ),
    },
    {
      key: 'retail_price',
      label: 'Retail Price',
      minWidth: '110px',
      render: (row) => {
        const p = row.retail_price;
        const formatted = p && !isNaN(Number(p)) ? `$${Number(p).toFixed(2)}` : p || '—';
        return <span className="font-bold text-slate-900 font-mono text-sm">{formatted}</span>;
      },
    },
    {
      key: 'qty_available',
      label: 'Stock Qty',
      minWidth: '120px',
      render: (row) => {
        const qty = Number(row.qty_available) || 0;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              qty > 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {qty > 0 ? `${qty} in stock` : 'Out of stock'}
          </span>
        );
      },
    },
    {
      key: 'active',
      label: 'Status',
      minWidth: '110px',
      render: (row) => {
        const isActive = row.active !== false && row.active !== 0;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isActive ? 'Active' : 'Deactivated'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      minWidth: '140px',
      render: (row) => {
        const isActive = row.active !== false && row.active !== 0;
        return (
          <div className="flex items-center gap-2">
            {/* Edit Button (Navigates to Full Page Form) */}
            <button
              onClick={() => navigate(`/office/product-master/create?id=${row.pk}`)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bcccdc] bg-[#f0f4f8] text-[#064e3b] hover:bg-[#e6ebf0] transition-colors cursor-pointer"
              title="Edit Product"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
              </svg>
            </button>

            {/* Toggle Active Button (ERP Format) */}
            <button
              onClick={() => handleToggleActive(row)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                isActive
                  ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
              title={isActive ? 'Deactivate Product' : 'Activate Product'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
              </svg>
            </button>

            {/* Delete Button (ERP Format) */}
            <button
              onClick={() => handleDelete(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Delete Product"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12m-1.5 0-.563 12.375A2.25 2.25 0 0113.693 21H10.307a2.25 2.25 0 01-2.244-2.125L7.5 7.5m3-3h3A1.5 1.5 0 0115 6v1.5H9V6a1.5 1.5 0 011.5-1.5Z" />
              </svg>
            </button>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans">
      
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <span>{notification.msg}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main DataTable (Exact ERP Format) */}
      <DataTable
        tableId="product_master"
        title="Product Master"
        data={products}
        columns={columns}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        serverSide={true}
        searchPlaceholder="Search products by name, SKU, or brand..."
        toggleActions={
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            {categoriesList.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#047857] cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Show Deactivated Toggle (ERP Format) */}
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600 select-none">
              <div
                onClick={() => setShowInactive((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                  showInactive ? 'bg-amber-400' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    showInactive ? 'translate-x-4' : ''
                  }`}
                />
              </div>
              Show Deactivated
            </label>
          </div>
        }
        actionButton={
          <button
            onClick={() => navigate('/office/product-master/create')}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#064e3b] text-white hover:bg-[#047857] transition-colors cursor-pointer shadow-sm hover:shadow"
            title="Create Product"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        }
      />

    </div>
  );
}
