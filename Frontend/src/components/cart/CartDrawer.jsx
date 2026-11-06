import React from 'react';
import { useApp } from '../../context/AppContext';
import { calculateCartTaxes } from '../../utils/taxCalculator';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, AlertTriangle, Scale } from 'lucide-react';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    navigateTo,
    cartCannabisGrams = 0,
    cannabisMaxGrams,
    isCannabisLimitExceeded = false,
    freeDeliveryThreshold = 75.0,
  } = useApp();

  if (!isCartOpen) return null;

  const FREE_SHIPPING_THRESHOLD = freeDeliveryThreshold || 75.0;
  const progressPercent = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);

  const CANNABIS_LIMIT = Number(cannabisMaxGrams) > 0 ? Number(cannabisMaxGrams) : 30.0;
  const excessCannabis = isCannabisLimitExceeded ? Math.max(0, cartCannabisGrams - CANNABIS_LIMIT) : 0;

  const taxSummary = calculateCartTaxes(cart);
  const estimatedTax = taxSummary.totalTax;
  const finalTotal = taxSummary.finalTotal;

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
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#0166dc]/25 border border-[#0166dc]/50 text-slate-900">
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

          {/* Progress Indicator: Free Shipping */}
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Truck className="w-4 h-4 text-[#0166dc]" />
                {cartSubtotal >= FREE_SHIPPING_THRESHOLD ? (
                  <span className="text-[#0166dc] font-black">Unlocked Free Winnipeg Delivery!</span>
                ) : (
                  <span>Add <strong className="text-slate-900">${remainingForFreeShipping.toFixed(2)}</strong> for Free Delivery</span>
                )}
              </span>
              <span className="text-[11px] text-slate-500 font-mono font-semibold">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#0166dc] to-orange-500 h-full transition-all duration-500 rounded-full"
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
                  className="px-6 py-2.5 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white font-extrabold uppercase tracking-wider transition-opacity shadow-sm"
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
                      <div className="text-[11px] text-[#0166dc] font-black">
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
            <div className="px-6 py-3 bg-white border-t border-slate-200 space-y-2.5">
              {/* Price Calculation Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 font-semibold">${cartSubtotal.toFixed(2)} CAD</span>
                </div>
                <div className="flex justify-between">
                  <span>{taxSummary.hasCannabis && taxSummary.hasNicotine ? 'Estimated Taxes (5% Cannabis / 12% Nicotine)' : taxSummary.hasNicotine ? 'Nicotine Tax (5% GST + 7% PST = 12%)' : 'Cannabis Tax (5% GST)'}</span>
                  <span className="font-mono text-slate-900">${estimatedTax.toFixed(2)} CAD</span>
                </div>
                
                {cartCannabisGrams > 0 && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                    
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span className="font-mono text-base text-[#0166dc] font-black">${finalTotal.toFixed(2)} CAD</span>
                </div>
              </div>

              {/* Cannabis Limit Warning Banner */}
              {isCannabisLimitExceeded && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Cart exceeds {CANNABIS_LIMIT.toFixed(1)}g limit by {(cartCannabisGrams - CANNABIS_LIMIT).toFixed(1)}g. Please reduce items to checkout.</span>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                disabled={isCannabisLimitExceeded}
                className={
                  isCannabisLimitExceeded
                    ? "w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-400 font-heading font-extrabold text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
                    : "w-full py-3.5 px-4 rounded-xl bg-[#0166dc] hover:bg-[#0153b3] text-white font-heading font-extrabold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0166dc]/25"
                }
              >
                <span>{isCannabisLimitExceeded ? `Exceeds ${CANNABIS_LIMIT.toFixed(1)}g Limit (${cartCannabisGrams.toFixed(1)}g)` : 'Proceed to Secure Checkout'}</span>
                {!isCannabisLimitExceeded && <ArrowRight className="w-4 h-4" />}
              </button>

              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
