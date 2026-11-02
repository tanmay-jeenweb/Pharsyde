import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardStatsApi, syncOfficeProductImagesApi } from '../../services/officeApi';
import { 
  Users, 
  ShieldCheck, 
  Package, 
  Image as ImageIcon, 
  FileText, 
  ArrowUpRight, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Activity,
  Plus
} from 'lucide-react';

export default function OfficeDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

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

  const handleSyncImages = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      const res = await syncOfficeProductImagesApi();
      if (res.success) {
        setSyncMessage(`Successfully updated ${res.result?.updatedByPk || 0} products by ID & ${res.result?.updatedBySku || 0} by SKU.`);
        await fetchStats();
      }
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
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
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleSyncImages}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing Images...' : 'Sync Product Images'}
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncMessage('')}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
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

