import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getMyOrdersApi, cancelOrderApi, checkOrderStockApi } from '../services/orderService';
import {
  Package,
  ShoppingBag,
  Truck,
  Store,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Sparkles,
  ExternalLink,
  LogOut,
  Lock,
  XCircle,
  AlertTriangle,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';

export default function AccountOrdersPage() {
  const { customerUser, customerToken, isCustomerLoggedIn, customerLogout, openAuthModal, navigateTo, showToast } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filterTab, setFilterTab] = useState('all');

  // Cancel order modal state
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getMyOrdersApi(customerToken);
      setOrders(data);
    } catch (err) {
      console.warn('Could not fetch orders:', err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCustomerLoggedIn) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [isCustomerLoggedIn, customerToken]);

  const toggleExpand = (id) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await cancelOrderApi(
        cancelModalOrder.id || cancelModalOrder.order_number,
        { reason: cancelReason },
        customerToken
      );

      // In-place update of order status in list
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelModalOrder.id || o.order_number === cancelModalOrder.order_number
            ? {
                ...o,
                order_status: 'Cancelled',
                payment_status: 'Refund Pending',
                notes: res.order?.notes || o.notes,
              }
            : o
        )
      );

      if (showToast) {
        showToast(
          `Order #${cancelModalOrder.order_number} cancelled. Items returned to inventory.`,
          'success'
        );
      }

      setCancelModalOrder(null);
    } catch (err) {
      console.error('[Order Cancel Error]', err);
      setCancelError(err.message || 'Failed to cancel order. Please try again or contact support.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (filterTab === 'pickup') return order.fulfillment_type === 'pickup';
    if (filterTab === 'delivery') return order.fulfillment_type === 'delivery';
    if (filterTab === 'confirmed') return order.order_status?.toLowerCase() === 'confirmed';
    if (filterTab === 'cancelled') return order.order_status?.toLowerCase() === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC]">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0166dc] animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0166dc]">
                Customer Account & Orders
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
              {isCustomerLoggedIn ? `WELCOME, ${customerUser?.name?.toUpperCase()}` : 'MY ORDERS'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isCustomerLoggedIn ? (
              <>
                <button
                  onClick={() => fetchOrders()}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0166dc] text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={customerLogout}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-6 py-2.5 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#0166dc]/20 flex items-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Protected User Route: Strictly require customer sign-in (Matches Zip Implementation) */}
        {!isCustomerLoggedIn ? (
          <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-[#0166dc]/15 border border-[#0166dc]/40 mx-auto flex items-center justify-center text-[#0166dc] shadow-inner">
              <Lock className="w-10 h-10 text-[#0166dc]" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0166dc]" />
                Customer Account Required
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                Sign In to View Orders
              </h2>
              <p className="text-xs sm:text-sm text-slate-500  leading-relaxed">
                Please sign in with your Pharsyde customer account to access your orders, track live fulfillment, and view itemized receipts.
              </p>
            </div>

            <div className="space-y-3 pt-2 ">
              <button
                onClick={() => openAuthModal('login')}
                className="w-full py-3.5 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white font-heading font-black text-xs uppercase tracking-wider shadow-md shadow-[#0166dc]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In to Your Account</span>
              </button>

              <button
                onClick={() => openAuthModal('register')}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Create New Account
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
              <button
                onClick={() => navigateTo('catalog')}
                className="text-xs font-bold text-[#0166dc] hover:text-[#386502] flex items-center gap-1.5 cursor-pointer"
              >
                <span>Browse Products Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Orders View: Strictly for authenticated customers */
          <>
            {/* TechPOS Loyalty & Rewards Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-black text-slate-900 uppercase tracking-tight text-base">
                      TechPOS Loyalty & Rewards
                    </h3>
                    {customerUser?.is_elite ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black uppercase tracking-wider">
                        VIP Elite
                      </span>
                    ) : customerUser?.techpos_member_id ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                        Member #{customerUser.techpos_member_id}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Earn 1 point per $1 CAD spent. Redeem 1,000 points for $1.00 CAD instant discount at checkout.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Available Balance</span>
                  <span className="font-mono text-2xl font-black text-amber-900">
                    ⭐ {Number(customerUser?.reward_points) || 0} <span className="text-xs font-bold text-slate-500">pts</span>
                  </span>
                </div>
                <div className="pl-4 border-l border-amber-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Discount Value</span>
                  <span className="font-mono text-xl font-black text-[#0166dc]">
                    ${((Number(customerUser?.reward_points) || 0) * 0.001).toFixed(3)} CAD
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">1,000 pts = $1 CAD</span>
                </div>
              </div>
            </div>

            {/* Member Profile Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Orders</span>
                <span className="font-mono text-2xl font-black text-slate-900">{orders.length}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Customer Name</span>
                <span className="text-sm font-bold text-slate-800 truncate block">{customerUser?.name}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Account Email</span>
                <span className="text-xs font-mono text-slate-600 truncate block">{customerUser?.email}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Compliance Status</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0166dc]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0166dc]" /> 19+ Verified
                </span>
              </div>
            </div>

            {/* Filter Controls & List Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Orders ({orders.length})
                </button>
                <button
                  onClick={() => setFilterTab('pickup')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'pickup'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pickup
                </button>
                <button
                  onClick={() => setFilterTab('delivery')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'delivery'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Courier Delivery
                </button>
                <button
                  onClick={() => setFilterTab('cancelled')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterTab === 'cancelled'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Cancelled ({orders.filter((o) => o.order_status?.toLowerCase() === 'cancelled').length})
                </button>
              </div>

              <button
                onClick={() => navigateTo('catalog')}
                className="text-xs text-[#0166dc] hover:text-[#386502] font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Explore Catalog & Order More</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Orders List Display */}
            {loading ? (
              <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#0166dc] animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">Loading orders from registry...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 uppercase">No Recent Orders Found</h3>
                  <p className="text-xs text-slate-500  mt-1">
                    You haven't placed any orders yet. Discover our curated collection of craft cannabis.
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('catalog')}
                  className="px-6 py-2.5 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Browse Catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id || expandedOrderId === order.order_number;
                  const isPickup = order.fulfillment_type === 'pickup';
                  const isSynced = order.sync_status === 'synced' || Boolean(order.techpos_order_id);
                  const isCancelled = order.order_status?.toLowerCase() === 'cancelled';
                  const isCancellable = ['confirmed', 'pending'].includes(order.order_status?.toLowerCase());

                  return (
                    <div
                      key={order.id || order.order_number}
                      className="rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-[#0166dc]/60 transition-all overflow-hidden"
                    >
                      {/* Order Overview Header */}
                      <div
                        onClick={() => toggleExpand(order.id || order.order_number)}
                        className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                              isCancelled
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : isPickup
                                ? 'bg-[#0166dc]/15 border-[#0166dc]/40 text-[#0166dc]'
                                : 'bg-orange-50 border-orange-200 text-orange-600'
                            }`}
                          >
                            {isCancelled ? <XCircle className="w-6 h-6" /> : isPickup ? <Store className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-base font-black text-slate-900 tracking-tight">
                                {order.order_number}
                              </span>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                                {new Date(order.created_at).toLocaleDateString('en-CA', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 mt-1">
                              {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'} •{' '}
                              <span className="uppercase font-semibold text-slate-700">
                                {isPickup ? 'Store Pickup' : 'Courier Delivery'}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 self-end md:self-center flex-wrap">
                          {/* Cancel Order Button (if eligible) */}
                          {isCancellable && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancelModalOrder(order);
                                setCancelReason('Changed my mind');
                                setCancelError(null);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 hover:text-rose-900 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="Cancel order and restore item stock"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Cancel Order</span>
                            </button>
                          )}

                          {/* Sync status pill */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border ${
                              isSynced
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                            title={isSynced ? `Synced with TechPOS ID: ${order.techpos_order_id}` : 'Syncing with POS registry'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isSynced ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
                            {isSynced ? 'POS Synced' : 'Sync Pending'}
                          </span>

                          {/* Fulfillment status pill */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              isCancelled
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : order.order_status?.toLowerCase() === 'confirmed' || order.order_status?.toLowerCase() === 'delivered'
                                ? 'bg-[#0166dc]/20 text-[#386502] border-[#0166dc]/50'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {order.order_status || 'Pending'}
                          </span>

                          <div className="text-right pl-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Total Paid
                            </span>
                            <span className="font-mono text-base font-black text-slate-900">
                              ${Number(order.total).toFixed(2)} CAD
                            </span>
                          </div>

                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Order Breakdown */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-6 space-y-6">
                          {/* Cancelled Banner */}
                          {isCancelled && (
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
                              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-bold text-rose-900">
                                  This order has been cancelled and its inventory was returned to stock.
                                </p>
                                <p className="text-rose-700">
                                  Payment Status: <strong className="font-semibold text-rose-900">{order.payment_status || 'Refund Pending'}</strong>. Your refund will credit back to your card within 3–5 business days.
                                </p>
                                {order.notes && order.notes.includes('Cancelled on') && (
                                  <p className="font-mono text-[11px] text-rose-600 pt-1 border-t border-rose-200/60">
                                    {order.notes.split('|').filter((n) => n.includes('Cancelled on')).pop()?.trim()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Compliance notice */}
                          {!isCancelled && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
                              <ShieldCheck className="w-4 h-4 text-[#0166dc] shrink-0" />
                              <span>
                                Manitoba Cannabis Compliance verified • Photo ID must be presented upon collection.
                              </span>
                            </div>
                          )}

                          {/* Items Table */}
                          <div className="space-y-3">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                              Order Items
                            </span>
                            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                      {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">{item.name}</p>
                                      <p className="text-slate-400 text-[11px]">
                                        SKU: {item.sku || 'N/A'} • {item.variant_label || 'Standard'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-slate-600 block">
                                      Qty: <strong className="text-slate-900">{item.quantity}</strong> × ${Number(item.price).toFixed(2)}
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">
                                      ${Number(item.subtotal || item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Financials Summary */}
                          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 text-xs text-slate-600 max-w-sm ml-auto">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span className="font-mono text-slate-900 font-semibold">
                                ${Number(order.subtotal).toFixed(2)} CAD
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fulfillment ({isPickup ? 'Pickup' : 'Courier'})</span>
                              <span className="font-mono text-slate-900">
                                {Number(order.shipping) === 0 ? 'FREE' : `$${Number(order.shipping).toFixed(2)}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Manitoba 12% Tax (GST+PST)</span>
                              <span className="font-mono text-slate-900">${Number(order.tax).toFixed(2)} CAD</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                              <span>Total Paid</span>
                              <span className="font-mono text-[#0166dc] font-black">
                                ${Number(order.total).toFixed(2)} CAD
                              </span>
                            </div>

                            {/* Additional Cancellation link in footer if eligible */}
                            {isCancellable && (
                              <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelModalOrder(order);
                                    setCancelReason('Changed my mind');
                                    setCancelError(null);
                                  }}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 cursor-pointer hover:underline"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Cancel this order</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-black text-slate-900 uppercase">
                    Cancel Order #{cancelModalOrder.order_number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total Amount:{' '}
                    <span className="font-mono font-bold text-slate-800">
                      ${Number(cancelModalOrder.total).toFixed(2)} CAD
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalOrder(null)}
                disabled={cancelLoading}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <Package className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Inventory Restock:</strong> All{' '}
                  {cancelModalOrder.items?.length || 1} item(s) will be added back to store inventory immediately.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Receipt className="w-4 h-4 text-[#0166dc] shrink-0 mt-0.5" />
                <span>
                  <strong>Payment Refund:</strong> A refund of{' '}
                  <strong>${Number(cancelModalOrder.total).toFixed(2)} CAD</strong> will be credited to your card in 3–5 business days.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Loyalty Points Reversal:</strong> Any points redeemed on this order will be refunded to your account balance.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={cancelLoading}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0166dc]"
              >
                <option value="Changed my mind">Changed my mind</option>
                <option value="Ordered wrong item or variant">Ordered wrong item or variant</option>
                <option value="Need to change delivery/pickup details">Need to change delivery/pickup details</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                disabled={cancelLoading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {cancelLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restocking & Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
