import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getMyOrdersApi } from '../services/orderService';
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
} from 'lucide-react';

export default function AccountOrdersPage() {
  const { customerUser, customerToken, isCustomerLoggedIn, customerLogout, openAuthModal, navigateTo } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestLookupActive, setGuestLookupActive] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filterTab, setFilterTab] = useState('all');

  const fetchOrders = async (email = null) => {
    setLoading(true);
    try {
      const activeEmail = email || (customerUser ? customerUser.email : null);
      const data = await getMyOrdersApi(customerToken, activeEmail);
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
    }
  }, [isCustomerLoggedIn, customerToken]);

  const handleGuestSearch = (e) => {
    e.preventDefault();
    if (guestEmail.trim()) {
      setGuestLookupActive(true);
      fetchOrders(guestEmail.trim());
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (filterTab === 'pickup') return order.fulfillment_type === 'pickup';
    if (filterTab === 'delivery') return order.fulfillment_type === 'delivery';
    if (filterTab === 'confirmed') return order.order_status?.toLowerCase() === 'confirmed';
    return true;
  });

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8EF705] animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#488203]">
                Customer Account & Orders
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
              {isCustomerLoggedIn ? `WELCOME, ${customerUser?.name?.toUpperCase()}` : 'ORDER TRACKING & HISTORY'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isCustomerLoggedIn ? (
              <>
                <button
                  onClick={() => fetchOrders()}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#8EF705] text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={customerLogout}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-6 py-2.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#8EF705]/20 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Not Logged In Prompt & Guest Lookup */}
        {!isCustomerLoggedIn && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8EF705]/15 border border-[#8EF705]/30 flex items-center justify-center text-[#488203]">
                  <Sparkles className="w-5 h-5 text-[#488203]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 uppercase">
                    Connect Your Member Account
                  </h3>
                  <p className="text-xs text-slate-500">Sign in to automatically sync and access your full order history.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registered members can view all past pickup & courier deliveries, track current fulfillment status in real-time, and store Manitoba 19+ age-verified compliance profiles.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-6 py-2.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Guest Order Lookup */}
            <div className="md:col-span-5 p-8 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-[#8EF705]" />
                <h3 className="font-heading text-base font-bold uppercase">Guest Order Lookup</h3>
              </div>
              <p className="text-xs text-slate-300">
                Placed an order as a guest? Enter the email address you used at checkout to retrieve your order receipts.
              </p>
              <form onSubmit={handleGuestSearch} className="space-y-3 pt-1">
                <input
                  type="email"
                  required
                  placeholder="your-email@domain.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#8EF705]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? 'Searching...' : 'Find My Orders'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Member Profile Stats Summary */}
        {isCustomerLoggedIn && (
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
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#488203]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#488203]" /> 19+ Verified
              </span>
            </div>
          </div>
        )}

        {/* Filter Controls & List Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilterTab('pickup')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === 'pickup'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Pickup
            </button>
            <button
              onClick={() => setFilterTab('delivery')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === 'delivery'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Courier Delivery
            </button>
          </div>

          <button
            onClick={() => navigateTo('catalog')}
            className="text-xs text-[#488203] hover:text-[#386502] font-bold flex items-center gap-1"
          >
            <span>Explore Catalog & Order More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Orders List Display */}
        {loading ? (
          <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#488203] animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading orders from registry...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
              <ShoppingBag className="w-8 h-8 opacity-40" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 uppercase">No Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {isCustomerLoggedIn
                  ? "You haven't placed any orders yet. Discover our curated collection of craft cannabis."
                  : guestLookupActive
                  ? `No orders matching ${guestEmail} were found.`
                  : 'Sign in or search your email above to track your order receipts.'}
              </p>
            </div>
            <button
              onClick={() => navigateTo('catalog')}
              className="px-6 py-2.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-bold uppercase tracking-wider shadow-sm"
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

              return (
                <div
                  key={order.id || order.order_number}
                  className="rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-[#8EF705]/60 transition-all overflow-hidden"
                >
                  {/* Order Overview Header */}
                  <div
                    onClick={() => toggleExpand(order.id || order.order_number)}
                    className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isPickup
                            ? 'bg-[#8EF705]/15 border-[#8EF705]/40 text-[#488203]'
                            : 'bg-orange-50 border-orange-200 text-orange-600'
                        }`}
                      >
                        {isPickup ? <Store className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
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

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{isPickup ? 'Boutique Pickup (117 Regent Ave W)' : 'Winnipeg Courier'}</span>
                          <span>•</span>
                          <span className="font-medium">
                            {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      {/* Live TechPOS Sync Status */}
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isSynced
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isSynced ? 'Synced to Store POS' : 'Order Processing'}
                        </span>
                      </div>

                      {/* Total Amount */}
                      <div className="text-right">
                        <span className="font-mono text-base font-black text-slate-900 block">
                          ${Number(order.total).toFixed(2)} CAD
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {order.payment_status || 'Pending'}
                        </span>
                      </div>

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Receipt Breakdown */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-in fade-in duration-200">
                      {/* Customer Details & Fulfillment Note */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Recipient Information
                          </span>
                          <p className="font-bold text-slate-900">{order.customer_name}</p>
                          <p className="text-slate-600">{order.customer_email}</p>
                          {order.customer_phone && <p className="text-slate-600">{order.customer_phone}</p>}
                        </div>

                        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Fulfillment Instructions
                          </span>
                          <p className="font-semibold text-slate-900">
                            {isPickup ? 'In-Store Pickup at 117 Regent Ave W' : order.address || 'Winnipeg, MB'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Photo ID (19+) mandatory upon collection or courier arrival.
                          </p>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                        <div className="p-3 bg-slate-100 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 flex justify-between">
                          <span>Item Curations</span>
                          <span>Line Total</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                {item.image_url && (
                                  <img
                                    src={item.image_url}
                                    alt={item.product_name}
                                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200"
                                  />
                                )}
                                <div>
                                  <span className="font-bold text-slate-900 block">{item.product_name}</span>
                                  <span className="text-slate-500 text-[11px]">
                                    Qty: {item.quantity} • {item.variant_label || 'Standard Pack'} @ $
                                    {Number(item.unit_price).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-900">
                                ${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financials Totals */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs text-slate-600 max-w-sm ml-auto">
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
                          <span className="font-mono text-[#488203] font-black">
                            ${Number(order.total).toFixed(2)} CAD
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

