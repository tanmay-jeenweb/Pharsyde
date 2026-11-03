import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Store,
  Truck,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Package,
} from 'lucide-react';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('order_number') || 'PHR-ORDER';

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6">
          
          {/* Success Badge */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#8EF705]/15 border border-[#8EF705]/40 flex items-center justify-center text-[#488203]">
            <CheckCircle2 className="w-9 h-9 text-[#488203]" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#488203] font-bold block mb-1">
              Order Confirmed • Moneris Verified • Manitoba Compliant
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 uppercase">
              ORDER #{orderId}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Thank you for shopping with Pharsyde! Your order has been placed and synchronized with our fulfillment system.
            </p>
          </div>

          {/* Fulfillment details */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 text-slate-600">
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-500" />
                Fulfillment Location:
              </span>
              <strong className="text-slate-900 uppercase font-heading">
                117 Regent Ave W, Winnipeg, MB
              </strong>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-slate-200 text-slate-600">
              <span className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                Payment Method:
              </span>
              <strong className="text-emerald-700 uppercase font-heading">
                Credit Card (Moneris Secured)
              </strong>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>19+ Photo ID Required:</strong> Under Manitoba regulations, physical government-issued photo ID (Driver&apos;s License or Passport) matching your order must be presented upon pickup or delivery.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#8EF705] hover:bg-[#7ce000] text-black font-heading font-black text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <Package className="w-4 h-4" />
              Continue Shopping
            </Link>

            <Link
              to="/account/orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-heading font-black text-xs uppercase tracking-wider transition-all"
            >
              View Order History
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

