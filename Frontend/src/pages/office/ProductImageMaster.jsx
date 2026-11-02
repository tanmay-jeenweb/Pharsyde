import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../../components/DataTable';
import { 
  getOfficeProductImagesApi, 
  updateOfficeProductImageApi, 
  syncOfficeProductImagesApi 
} from '../../services/officeApi';

export default function ProductImageMaster() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [form, setForm] = useState({
    imageUrl: '',
    secondImageUrl: '',
  });

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await getOfficeProductImagesApi({ filter, limit: 150, offset: 0 });
      setImages(res.images || []);
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to load images', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [filter]);

  const handleSyncToProducts = async () => {
    try {
      setSyncing(true);
      const res = await syncOfficeProductImagesApi();
      if (res.success) {
        notify(
          `Sync completed: ${res.result?.updatedByPk || 0} updated by ID, ${res.result?.updatedBySku || 0} by SKU. Total catalog items with images: ${res.result?.totalWithImagesInProducts || 0}.`
        );
        await fetchImages();
      }
    } catch (err) {
      notify(err.message || 'Image synchronization failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const openEditModal = (rec) => {
    setEditingImage(rec);
    setForm({
      imageUrl: rec.imageUrl || '',
      secondImageUrl: rec.secondImageUrl || '',
    });
    setModalOpen(true);
  };

  const handleSaveImages = async (e) => {
    e.preventDefault();
    if (!editingImage) return;

    setSaving(true);
    try {
      await updateOfficeProductImageApi(editingImage.id, form);
      notify(`Images for "${editingImage.name || editingImage.sku || editingImage.id}" updated.`);
      setModalOpen(false);
      await fetchImages();
    } catch (err) {
      notify(err.message || 'Failed to update images', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: 'primary_image',
      label: 'Primary Image',
      sortable: false,
      minWidth: '90px',
      render: (row) => (
        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
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
            <span className="text-[10px] text-slate-400 font-medium">None</span>
          )}
        </div>
      ),
    },
    {
      key: 'second_image',
      label: 'Secondary Image',
      sortable: false,
      minWidth: '90px',
      render: (row) => (
        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
          {row.secondImageUrl ? (
            <img
              src={row.secondImageUrl}
              alt=""
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">None</span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Product / SKU Reference',
      minWidth: '220px',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900 leading-snug">
            {row.name || 'Unnamed Asset'}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            {row.sku && (
              <span className="text-[#064e3b] font-semibold">SKU: {row.sku}</span>
            )}
            {row.sku && <span className="text-slate-300">•</span>}
            <span className="text-slate-400">ID: {row.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'imageUrl',
      label: 'Image Source Link',
      minWidth: '240px',
      render: (row) =>
        row.imageUrl ? (
          <a
            href={row.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#064e3b] hover:text-[#047857] hover:underline truncate max-w-xs flex items-center gap-1 font-mono"
          >
            <span className="truncate">{row.imageUrl}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        ) : (
          <span className="text-xs text-amber-600 font-semibold italic">Missing Image URL</span>
        ),
    },
    {
      key: 'source_page',
      label: 'TechPOS Page',
      minWidth: '110px',
      render: (row) => (
        <span className="text-xs text-slate-600 font-mono">
          {row.source_page ? `Page ${row.source_page}` : '—'}
        </span>
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Modified',
      minWidth: '140px',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      minWidth: '100px',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* Edit Button (ERP Format) */}
          <button
            onClick={() => openEditModal(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bcccdc] bg-[#f0f4f8] text-[#064e3b] hover:bg-[#e6ebf0] transition-colors cursor-pointer"
            title="Edit Image URLs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
            </svg>
          </button>
        </div>
      ),
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
        tableId="product_image_master"
        title="Product Image Master"
        data={images}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by SKU, product name, or ID..."
        toggleActions={
          <div className="flex items-center gap-2">
            {['all', 'with_image', 'missing_image'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer capitalize ${
                  filter === tab
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        }
        actionButton={
          <button
            onClick={handleSyncToProducts}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#064e3b] text-white hover:bg-[#047857] text-xs font-bold transition-colors cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
            title="Sync Images to Products Catalog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{syncing ? 'Syncing...' : 'Sync to Catalog'}</span>
          </button>
        }
      />

      {/* Edit Image Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#064e3b] to-[#047857] text-white">
              <div>
                <h3 className="text-lg font-bold">Edit Image URLs</h3>
                <p className="text-xs text-emerald-100 mt-0.5 font-mono truncate max-w-sm">
                  {editingImage?.name || editingImage?.sku || editingImage?.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveImages} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Image URL
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {form.imageUrl && (
                <div className="w-24 h-24 rounded-lg bg-slate-50 border border-slate-200 p-1 mx-auto flex items-center justify-center overflow-hidden">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Secondary Image URL
                </label>
                <input
                  type="url"
                  value={form.secondImageUrl}
                  onChange={(e) => setForm({ ...form, secondImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
