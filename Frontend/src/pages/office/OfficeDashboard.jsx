import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardStatsApi, syncOfficeProductImagesApi } from '../../services/officeApi';
import { syncImagesApi, syncProductsApi } from '../../services/productService';
import { 
  Users, 
  ShieldCheck, 
  ShoppingBag, 
  Building, 
  Receipt, 
  Package, 
  Image as ImageIcon, 
  FileText, 
  ArrowUpRight, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Activity,
  Plus,
  Zap,
  Sliders
} from 'lucide-react';

export default function OfficeDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState('');
  const [syncPhase, setSyncPhase] = useState('');
  const [syncStatus, setSyncStatus] = useState('success');
  const [syncMessage, setSyncMessage] = useState('');
  const [dashboardOrderTab, setDashboardOrderTab] = useState('sales');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStatsApi();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // TechPOS API & WebMenu Synchronization
  // isQuick = true: OpenAPI catalog + Page 1 WebMenu images (recent/new items, ~2-3s)
  // isQuick = false: OpenAPI catalog + all pages of WebMenu images (optimized ~15s)
  const handleSync = async (isQuick = true) => {
    if (syncing) return;
    setSyncing(true);
    setSyncType(isQuick ? 'quick' : 'full');
    const syncLabel = isQuick ? 'Quick Sync' : 'Full Sync';
    setSyncPhase('Syncing Products...');
    setSyncStatus('info');
    setSyncMessage(`Starting ${syncLabel}: Fetching product catalogue from TechPOS...`);

    try {
      // Step 1: Sync base products from OpenAPI
      const prodResult = await syncProductsApi();
      const productCount = prodResult.upsertedCount || prodResult.totalFetched || 0;
      setSyncMessage(
        `Products synced (${productCount} items). Now syncing images (${isQuick ? 'recent items' : 'full catalog'})...`
      );

      // Step 2: Sync product images from WebMenu eapi
      setSyncPhase(isQuick ? 'Syncing Recent Images...' : 'Syncing All Images...');
      const imgResult = await syncImagesApi({ quick: isQuick });

      const imgCount = imgResult.totalWithImagesInProducts || imgResult.totalWithImages || 0;
      setSyncStatus('success');
      setSyncMessage(
        `${syncLabel} complete! ${productCount} products & ${imgCount} photos synchronized.`
      );
      // Immediately refresh dashboard stats with new numbers
      await fetchStats();
    } catch (err) {
      console.error(`${syncLabel} failed:`, err);
      setSyncStatus('error');
      setSyncMessage(`${syncLabel} failed: ` + (err.message || 'Unknown error'));
    } finally {
      setSyncing(false);
      setSyncType('');
      setSyncPhase('');
      setTimeout(() => {
        setSyncMessage((prev) => (prev.includes('complete!') ? '' : prev));
      }, 8000);
    }
  };

  const handleSyncImages = async () => {
    try {
      setSyncing(true);
      setSyncType('images');
      setSyncStatus('info');
      setSyncMessage('Syncing local product images...');
      const res = await syncOfficeProductImagesApi();
      if (res.success) {
        setSyncStatus('success');
        setSyncMessage(`Successfully updated ${res.result?.updatedByPk || 0} products by ID & ${res.result?.updatedBySku || 0} by SKU.`);
        await fetchStats();
      }
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
      setSyncType('');
      setTimeout(() => setSyncMessage(''), 6000);
    }
  };

  const getActionBadgeClass = (type) => {
    const t = (type || '').toUpperCase();
    switch (t) {
      case 'LOGIN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CREATED':
      case 'ACTIVATED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATED':
      case 'SYNC':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETED':
      case 'DEACTIVATED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Office Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Overview
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise administration, master records, product catalogs, and system audit monitoring.
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading || syncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Quick Sync Button */}
          <button
            type="button"
            onClick={() => handleSync(true)}
            disabled={syncing}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              syncing && syncType === 'quick'
                ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-wait'
                : syncing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-[#8EF705] hover:bg-[#80de04] text-slate-950 hover:shadow-md hover:shadow-[#8EF705]/20 active:scale-[0.98]'
            }`}
            title="Quick Sync: Syncs base catalogue and recent product images (~2-3s)"
          >
            {syncing && syncType === 'quick' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{syncing && syncType === 'quick' ? syncPhase || 'Quick Syncing...' : 'Quick Sync'}</span>
          </button>

          {/* Full Sync Button */}
          <button
            type="button"
            onClick={() => handleSync(false)}
            disabled={syncing}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              syncing && syncType === 'full'
                ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-wait'
                : syncing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-md hover:shadow-emerald-700/20 active:scale-[0.98]'
            }`}
            title="Optimized Full Sync: Syncs all base catalogue items and all images (~15s)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing && syncType === 'full' ? 'animate-spin' : ''}`} />
            <span>{syncing && syncType === 'full' ? syncPhase || 'Full Syncing...' : 'Full Sync'}</span>
          </button>

          {/* Sync Local DB Images */}
          <button
            type="button"
            onClick={handleSyncImages}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Sync images from product_images table to products table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing && syncType === 'images' ? 'animate-spin' : ''}`} />
            {syncing && syncType === 'images' ? 'Syncing...' : 'Sync Local DB Images'}
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncMessage && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-xs transition-all ${
            syncStatus === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : syncStatus === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatus === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : syncStatus === 'info' ? (
              <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <span>{syncMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncMessage('')}
            className={`text-xs font-bold hover:underline ${
              syncStatus === 'error'
                ? 'text-rose-700'
                : syncStatus === 'info'
                ? 'text-blue-700'
                : 'text-emerald-700'
            }`}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Card 1: Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">User Master</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '—' : stats?.users?.total ?? 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="text-emerald-700 font-bold">{stats?.users?.active ?? 0} active</span>
              <span>•</span>
              <span className="text-slate-400">{stats?.users?.inactive ?? 0} inactive</span>
            </div>
          </div>
          <Link
            to="/office/user-master"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Manage Users</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 2: User Types / Roles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">User Type Master</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '—' : stats?.users?.typesCount ?? 0}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Configured enterprise permission profiles
            </div>
          </div>
          <Link
            to="/office/user-type-master"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Configure Roles</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 3: Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Product Master</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '—' : (stats?.products?.total ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="text-emerald-700 font-bold">{(stats?.products?.active ?? 0).toLocaleString()} active</span>
              <span>•</span>
              <span className="text-slate-400">POS aligned</span>
            </div>
          </div>
          <Link
            to="/office/product-master"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Open Product Master</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 4: Product Images */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Product Image Master</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '—' : (stats?.images?.total ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="text-emerald-700 font-bold">{stats?.images?.withImages ?? 0} with URLs</span>
              <span>•</span>
              <span className="text-amber-600">{stats?.images?.missingImages ?? 0} pending</span>
            </div>
          </div>
          <Link
            to="/office/product-image-master"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Inspect Images</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 5: Orders & Purchase Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Master</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? '—' : ((stats?.orders?.total ?? 0) + (stats?.orders?.purchaseOrdersCount ?? 0))}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="text-emerald-700 font-bold">{stats?.orders?.total ?? 0} sales</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{stats?.orders?.purchaseOrdersCount ?? 0} TechPOS POs</span>
            </div>
          </div>
          <Link
            to="/office/orders"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Manage Orders</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* Quick Launchpad & Masters Shortcut Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Enterprise Masters Quick Launchpad
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link
            to="/office/user-master"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">User Master</h3>
                <p className="text-xs text-slate-500">Create, edit, and toggle users</p>
              </div>
            </div>
          </Link>

          <Link
            to="/office/user-type-master"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">User Type Master</h3>
                <p className="text-xs text-slate-500">CRUD permissions per role</p>
              </div>
            </div>
          </Link>

          <Link
            to="/office/product-master"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">Product Master</h3>
                <p className="text-xs text-slate-500">Inventory items & pricing</p>
              </div>
            </div>
          </Link>

          <Link
            to="/office/product-image-master"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">Product Image Master</h3>
                <p className="text-xs text-slate-500">Batch image URLs & sync</p>
              </div>
            </div>
          </Link>

          <Link
            to="/office/setting-master"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">Setting Master</h3>
                <p className="text-xs text-slate-500">New arrivals limit & store configs</p>
              </div>
            </div>
          </Link>

        </div>
      </div>

      
      {/* Live Storefront Sales & TechPOS Purchase Orders Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8EF705]/20 border border-[#8EF705]/40 flex items-center justify-center text-[#488203]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Live Store Orders & TechPOS Purchase Orders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time storefront checkouts and synced supplier orders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setDashboardOrderTab('sales')}
                className={`px-3 py-1 rounded-md transition-all ${dashboardOrderTab === 'sales' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Storefront Sales ({stats?.orders?.total || 0})
              </button>
              <button
                type="button"
                onClick={() => setDashboardOrderTab('po')}
                className={`px-3 py-1 rounded-md transition-all ${dashboardOrderTab === 'po' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                TechPOS POs ({stats?.orders?.purchaseOrdersCount || 0})
              </button>
            </div>

            <Link
              to="/office/orders"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 ml-2"
            >
              Open Order Master &rarr;
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {dashboardOrderTab === 'sales' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#064e3b] text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Total (CAD)</th>
                  <th className="px-4 py-3">POS Sync</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading orders...</td>
                  </tr>
                ) : !stats?.orders?.recentOrders || stats.orders.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No customer orders recorded yet. Place an order on the storefront to test.
                    </td>
                  </tr>
                ) : (
                  stats.orders.recentOrders.slice(0, 5).map((o) => (
                    <tr key={o.id || o.order_number} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{o.order_number}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{o.customer_name}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {o.fulfillment_type || 'pickup'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        ${Number(o.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.sync_status === 'synced' || o.techpos_order_id ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {o.sync_status === 'synced' || o.techpos_order_id ? 'Synced' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to="/office/orders" className="text-emerald-700 font-bold hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#064e3b] text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">PO #</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total (CAD)</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading TechPOS purchase orders...</td>
                  </tr>
                ) : !stats?.orders?.recentPurchaseOrders || stats.orders.recentPurchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No purchase orders returned from TechPOS.
                    </td>
                  </tr>
                ) : (
                  stats.orders.recentPurchaseOrders.slice(0, 5).map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">PO-{po.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{po.description || '—'}</td>
                      <td className="px-4 py-3 font-medium text-blue-700">{po.vendor || 'MBLL'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {po.status || 'Closed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        ${Number(po.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {po.creationDateString || (po.dateExpected ? new Date(po.dateExpected).toLocaleDateString() : '—')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to="/office/orders" className="text-emerald-700 font-bold hover:underline">
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>


      {/* Recent Activity Log Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Recent Office Activity Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time audit trail of administrator and user actions</p>
          </div>
          <Link
            to="/office/activity-report"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            View Full Report &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#064e3b] text-white text-xs font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Target Master</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                    Loading recent logs...
                  </td>
                </tr>
              ) : !stats?.recentActivities || stats.recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No recent activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                stats.recentActivities.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {log.username || 'System'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {log.master_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getActionBadgeClass(log.change_type)}`}>
                        {log.change_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/office/activity-report"
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

