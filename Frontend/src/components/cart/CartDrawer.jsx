import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Truck, Sparkles } from 'lucide-react';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, removeFromCart, cartSubtotal, navigateTo } = useApp();
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  if (!isCartOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 75.0;
  const progressPercent = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);

  // Manitoba Tax: 5% GST + 7% PST = 12%
  const taxRate = 0.12;
  const estimatedTax = (cartSubtotal - promoDiscount) * taxRate;
  const deliveryFee = cartSubtotal >= FREE_SHIPPING_THRESHOLD || cartSubtotal === 0 ? 0 : 9.99;
  const finalTotal = Math.max(0, cartSubtotal - promoDiscount + estimatedTax + deliveryFee);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    if (promoCode.trim().toUpperCase() === 'PHARSYDE10') {
      const discount = cartSubtotal * 0.1;
      setPromoDiscount(discount);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon code. Try PHARSYDE10');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigateTo('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#8EF705]/25 border border-[#8EF705]/50 text-slate-900">
                <ShoppingBag className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 tracking-wider">
                  SHOPPING BAG
                </h2>
                <p className="text-xs text-slate-500">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} curated
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-orange-500/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Truck className="w-4 h-4 text-[#529402]" />
                {cartSubtotal >= FREE_SHIPPING_THRESHOLD ? (
                  <span className="text-[#529402] font-black">Unlocked Free Winnipeg Delivery!</span>
                ) : (
                  <span>Add <strong className="text-slate-900">${remainingForFreeShipping.toFixed(2)}</strong> for Free Delivery</span>
                )}
              </span>
              <span className="text-[11px] text-slate-500 font-mono font-semibold">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#8EF705] to-orange-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">
                    Your bag is empty
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Explore our collection of craft cannabis and precision vaporizers to elevate your ritual.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('catalog');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-extrabold uppercase tracking-wider transition-opacity shadow-sm"
                >
                  Explore Catalogue
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.variant.id}`}
                  className="flex gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-heading text-sm font-bold text-slate-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.variant.id)}
                          aria-label="Remove item"
                          className="text-slate-400 hover:text-orange-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-[11px] text-[#529402] font-black">
                        {item.product.brand} • {item.variant.label}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        ${(item.variant.price * item.quantity).toFixed(2)}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity - 1)}
                          className="text-slate-500 hover:text-slate-900 p-0.5"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-mono font-bold text-slate-900 px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity + 1)}
                          className="text-slate-500 hover:text-slate-900 p-0.5"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t border-slate-200 space-y-4">
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. PHARSYDE10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-[#8EF705] hover:text-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Apply
                </button>
              </form>
              {promoError && <p className="text-[11px] text-orange-600 font-medium">{promoError}</p>}
              {promoApplied && (
                <p className="text-[11px] text-[#529402] font-black flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#529402]" /> 10% Welcome Discount Applied!
                </p>
              )}

              {/* Price Calculation Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 font-semibold">${cartSubtotal.toFixed(2)} CAD</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-[#529402] font-bold">
                    <span>Discount</span>
                    <span className="font-mono">-${promoDiscount.toFixed(2)} CAD</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Tax (MB 12% GST+PST)</span>
                  <span className="font-mono text-slate-900">${estimatedTax.toFixed(2)} CAD</span>
                </div>
                <div className="flex justify-between">
                  <span>Winnipeg Delivery / Pickup</span>
                  <span className="font-mono text-slate-900">
                    {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)} CAD`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span className="font-mono text-base text-[#529402] font-black">${finalTotal.toFixed(2)} CAD</span>
                </div>
              </div>

              {/* Checkout Button in #8EF705 */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8EF705]/25"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#529402]" />
                <span>19+ Age Verification at Fulfillment • Manitoba Compliant</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
