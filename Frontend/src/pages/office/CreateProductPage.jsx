import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  getOfficeProductByIdApi, 
  createOfficeProductApi, 
  updateOfficeProductApi 
} from '../../services/officeApi';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams();
  const productId = routeId || searchParams.get('id');
  const isEditMode = Boolean(productId);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [form, setForm] = useState({
    product_name: '',
    sku: '',
    barcode: '',
    category: 'Cannabis',
    subCategory: '',
    brand: '',
    strain: '',
    size: '',
    cost: '',
    retail_price: '',
    qty_available: '10',
    imageUrl: '',
    secondImageUrl: '',
    long_description: '',
    active: true,
  });

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const res = await getOfficeProductByIdApi(productId);
          const p = res.product;
          if (p) {
            setForm({
              product_name: p.product_name || '',
              sku: p.sku || '',
              barcode: p.barcode || '',
              category: p.category || '',
              subCategory: p.subCategory || '',
              brand: p.brand || '',
              strain: p.strain || '',
              size: p.size || '',
              cost: p.cost != null ? String(p.cost) : '',
              retail_price: p.retail_price || '',
              qty_available: p.qty_available != null ? String(p.qty_available) : '0',
              imageUrl: p.imageUrl || '',
              secondImageUrl: p.secondImageUrl || '',
              long_description: p.long_description || '',
              active: p.active !== false && p.active !== 0,
            });
          }
        } catch (err) {
          notify(err.message || 'Failed to load product details', 'error');
          navigate('/office/product-master');
        } finally {
          setLoading(false);
        }
      }
    };

    loadProduct();
  }, [productId, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_name.trim()) {
      notify('Product name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        cost: form.cost ? Number(form.cost) : null,
        qty_available: form.qty_available ? Number(form.qty_available) : 0,
        active: !!form.active,
      };

      if (isEditMode) {
        await updateOfficeProductApi(productId, payload);
        notify('Product updated successfully.');
      } else {
        await createOfficeProductApi(payload);
        notify('Product created successfully.');
      }

      setTimeout(() => {
        navigate('/office/product-master');
      }, 700);
    } catch (err) {
      notify(err.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans max-w-5xl mx-auto w-full">
      
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

      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Product Item' : 'Add New Product'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEditMode
              ? 'Update catalog item attributes, pricing, stock levels, and TechPOS references.'
              : 'Register a new catalog product for storefront presentation and backoffice inventory.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/office/product-master')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#064e3b] hover:text-[#047857] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Product Master
        </button>
      </div>

      {/* Main Full Page Form Card */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064e3b]" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">
              Product Specifications & Inventory Values
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter product details, pricing, barcodes, and storefront imagery.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Product Name (spans 2 cols) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.product_name}
                  onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  placeholder="e.g. Gorilla Glue Pre-Roll 1g"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-semibold transition-all"
                />
              </div>

              {/* SKU Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  SKU Code
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. SKU-10492"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-mono transition-all"
                />
              </div>

              {/* Barcode / UPC */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Barcode / UPC
                </label>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="e.g. 8839291039"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-mono transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Flower, Pre-Roll, Edibles"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Sub-Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Sub-Category
                </label>
                <input
                  type="text"
                  value={form.subCategory}
                  onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                  placeholder="e.g. Sativa, Indica, Hybrid"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. Pharsyde Craft"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Strain */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Strain
                </label>
                <input
                  type="text"
                  value={form.strain}
                  onChange={(e) => setForm({ ...form, strain: e.target.value })}
                  placeholder="e.g. OG Kush"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Size / Unit */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Package Size / Unit
                </label>
                <input
                  type="text"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="e.g. 3.5g, 100ml"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cost Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-mono transition-all"
                />
              </div>

              {/* Retail Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Retail Price ($)
                </label>
                <input
                  type="text"
                  value={form.retail_price}
                  onChange={(e) => setForm({ ...form, retail_price: e.target.value })}
                  placeholder="e.g. 19.99"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-semibold font-mono transition-all"
                />
              </div>

              {/* Quantity Available (Stock) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Quantity Available (Stock)
                </label>
                <input
                  type="number"
                  value={form.qty_available}
                  onChange={(e) => setForm({ ...form, qty_available: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

            </div>

            {/* Images & Previews */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Product Images</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Primary Image */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary Image URL
                  </label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://images.techpos.ca/..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-mono transition-all"
                  />
                  {form.imageUrl && (
                    <div className="mt-3 w-28 h-28 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                      <img src={form.imageUrl} alt="Primary Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Secondary Image */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Secondary Image URL
                  </label>
                  <input
                    type="url"
                    value={form.secondImageUrl}
                    onChange={(e) => setForm({ ...form, secondImageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-mono transition-all"
                  />
                  {form.secondImageUrl && (
                    <div className="mt-3 w-28 h-28 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                      <img src={form.secondImageUrl} alt="Secondary Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Description */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Product Description
              </label>
              <textarea
                rows={4}
                value={form.long_description}
                onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                placeholder="Detailed description of the product, effects, aroma, THC/CBD percentages..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Active Switch */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-[#064e3b] w-4 h-4 rounded cursor-pointer"
                />
                <span>Active (Visible on public catalog & available in POS)</span>
              </label>
            </div>

            {/* Form Footer Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/office/product-master')}
                className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Product'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

