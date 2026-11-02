import React, { useState, useEffect } from 'react';
import { getOfficeOrdersApi, getTechPosPurchaseOrdersApi } from '../../services/officeApi';
import {
  ShoppingBag,
  Package,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Building,
  Receipt,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function OrderMaster() {
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'techpos_po'
  const [storeOrders, setStoreOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const [ordersRes, poRes] = await Promise.all([
        getOfficeOrdersApi(),
        getTechPosPurchaseOrdersApi(),
      ]);
      setStoreOrders(ordersRes.orders || []);
      setPurchaseOrders(poRes.purchaseOrders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // Filter store orders
  const filteredStoreOrders = storeOrders.filter((o) => {
    const matchesSearch =
      !searchTerm ||
      o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'synced' && (o.sync_status === 'synced' || o.techpos_order_id)) ||
      (statusFilter === 'pending' && o.sync_status === 'pending') ||
      o.order_status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Filter TechPOS POs
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      !searchTerm ||
      po.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(po.id).includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' || po.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order Master
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Orders & TechPOS Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track storefront sales orders, monitor real-time TechPOS dispatch, and inspect MBLL purchase orders.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAllOrders}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Storefront Sales Orders
          </span>
          <div className="text-2xl font-black text-slate-900">{storeOrders.length}</div>
          <span className="text-xs text-[#488203] font-semibold mt-1 block">Live Website Orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            TechPOS Purchase Orders
          </span>
          <div className="text-2xl font-black text-slate-900">{purchaseOrders.length}</div>
          <span className="text-xs text-blue-600 font-semibold mt-1 block">MBLL & Vendor Shipments</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            TechPOS Synced Orders
          </span>
          <div className="text-2xl font-black text-emerald-700">
            {storeOrders.filter((o) => o.sync_status === 'synced' || o.techpos_order_id).length}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 block">Synced to Cash Register</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Sales Volume
          </span>
          <div className="text-2xl font-black text-slate-900">
            ${storeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0).toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 block">CAD Gross Revenue</span>
        </div>
      </div>

      {/* Main Table Card with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Strip */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('store');
                setStatusFilter('all');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'store'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5" />
              Storefront Customer Orders ({storeOrders.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('techpos_po');
                setStatusFilter('all');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'techpos_po'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Package className="w-3.5 h-3.5 inline mr-1.5" />
              TechPOS Purchase Orders ({purchaseOrders.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={activeTab === 'store' ? 'Search by Order #, Name...' : 'Search PO #, Vendor...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8EF705]"
            />
          </div>
        </div>

        {/* Tab 1: Storefront Customer Orders */}
        {activeTab === 'store' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-6">Order #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Fulfillment</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Total (CAD)</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">POS Status</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#488203]" />
                      Loading store orders...
                    </td>
                  </tr>
                ) : filteredStoreOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      No customer orders match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStoreOrders.map((order) => {
                    const isSynced = order.sync_status === 'synced' || Boolean(order.techpos_order_id);
                    const isPickup = order.fulfillment_type === 'pickup';

                    return (
                      <tr key={order.id || order.order_number} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-6 font-mono font-bold text-slate-900">
                          {order.order_number}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{order.customer_name}</div>
                          <div className="text-[11px] text-slate-400">{order.customer_email}</div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isPickup
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
                            }`}
                          >
                            {isPickup ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                            {isPickup ? 'Store Pickup' : 'Courier'}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{order.items?.length || 1} items</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          ${Number(order.total || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                            {order.payment_method}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSynced
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {isSynced ? 'Synced TechPOS' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 pr-6 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: TechPOS Purchase Orders */}
        {activeTab === 'techpos_po' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-6">PO # / ID</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Products Count</th>
                  <th className="p-3.5">Expected Date</th>
                  <th className="p-3.5">Total (CAD)</th>
                  <th className="p-3.5 pr-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading TechPOS Purchase Orders...
                    </td>
                  </tr>
                ) : filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      No purchase orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-6 font-mono font-bold text-slate-900">PO-{po.id}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{po.description || '—'}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Building className="w-3 h-3" />
                          {po.vendor || 'MBLL'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            po.status === 'Closed'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {po.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium">{po.products?.length || 0} line items</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {po.dateExpected ? new Date(po.dateExpected).toLocaleDateString() : po.creationDateString || '—'}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        ${Number(po.total || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        <button
                          onClick={() => setSelectedOrder({ isPO: true, ...po })}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                        >
                          View Lines
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Inspector for Order or PO */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {selectedOrder.isPO ? 'TechPOS Purchase Order' : 'Storefront Customer Order'}
                </span>
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  {selectedOrder.isPO ? selectedOrder.description || `PO #${selectedOrder.id}` : selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {selectedOrder.isPO ? (
                /* PO Inspector */
                <>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendor</span>
                      <strong className="text-slate-900">{selectedOrder.vendor}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                      <span className="font-bold text-slate-900">{selectedOrder.status}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                      Supplied Line Products ({selectedOrder.products?.length || 0}):
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {(selectedOrder.products || []).map((p, idx) => (
                        <div key={idx} className="p-3 flex justify-between bg-white">
                          <div>
                            <span className="font-bold text-slate-900 block">{p.product}</span>
                            <span className="text-[11px] text-slate-500">
                              SKU: {p.sku} • Qty: {p.quantity} @ ${Number(p.unitPrice).toFixed(2)}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            ${Number(p.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 text-right">
                    <span className="text-sm font-bold text-slate-900">
                      Total Invoice: <strong className="font-mono">${Number(selectedOrder.total).toFixed(2)} CAD</strong>
                    </span>
                  </div>
                </>
              ) : (
                /* Customer Order Inspector */
                <>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                      <strong className="text-slate-900">{selectedOrder.customer_name}</strong>
                      <div className="text-slate-500 text-[11px]">{selectedOrder.customer_email}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Fulfillment</span>
                      <strong className="text-slate-900">
                        {selectedOrder.fulfillment_type === 'pickup' ? 'Store Pickup' : selectedOrder.address}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                      Ordered Products:
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {(selectedOrder.items || []).map((item, idx) => (
                        <div key={idx} className="p-3 flex justify-between bg-white">
                          <div>
                            <span className="font-bold text-slate-900 block">{item.product_name}</span>
                            <span className="text-[11px] text-slate-500">
                              Qty: {item.quantity} • {item.variant_label || 'Standard'} @ ${Number(item.unit_price).toFixed(2)}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            ${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-900">${Number(selectedOrder.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Manitoba Tax (12%)</span>
                      <span className="font-mono text-slate-900">${Number(selectedOrder.tax).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total</span>
                      <span className="font-mono text-[#488203]">${Number(selectedOrder.total).toFixed(2)} CAD</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

