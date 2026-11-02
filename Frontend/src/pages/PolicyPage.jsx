import React from 'react';
import { STORE_INFO } from '../data/products';
import {
  ShieldAlert,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Store,
  FileText,
  Truck,
  HelpCircle
} from 'lucide-react';

export default function PolicyPage() {
  const policyHighlights = [
    {
      title: "Cannabis Products: Final Sale",
      desc: "By Manitoba and federal law, all cannabis products, pre-rolls, edibles, seeds, and extracts are final sale, except in the event of an official Health Canada recall.",
      badge: "FINAL SALE",
      icon: ShieldAlert,
      color: "text-orange-600"
    },
    {
      title: "Non-Cannabis Hardware: 7-Day Window",
      desc: "Eligible unopened accessories and non-cannabis lifestyle goods may be returned within 7 days of purchase in original seal and condition.",
      badge: "7 DAYS",
      icon: RotateCcw,
      color: "text-[#488203]"
    },
    {
      title: "Disposable Vapes: 24-Hour Notice",
      desc: "Any issues, dead-on-arrival (DOA) failures, or auto-firing with disposable vape hardware must be reported to Pharsyde within 24 hours of receipt.",
      badge: "24 HOURS",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Vape Batteries: 7-Day Store Warranty",
      desc: "Eligible electronic vape batteries and devices generally have a 7-day store warranty against manufacturer defects with original receipt.",
      badge: "7-DAY WARRANTY",
      icon: CheckCircle2,
      color: "text-[#488203]"
    },
    {
      title: "Order Discrepancies: 5-Day Window",
      desc: "Incorrect, missing, or packaging-damaged items in your fulfillment must be reported within 5 days of delivery or pickup.",
      badge: "5 DAYS",
      icon: AlertTriangle,
      color: "text-[#488203]"
    },
    {
      title: "In-Store Return Venue",
      desc: "All approved online or pickup returns and hardware diagnostic inspections must be brought physically to our Winnipeg storefront at 117 Regent Ave W.",
      badge: "IN-STORE ONLY",
      icon: Store,
      color: "text-slate-800"
    }
  ];

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC] text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#488203] block mb-2">
            CONSUMER PROTECTION & POLICIES
          </span>
          <h1 className="font-heading text-4xl sm:text-6xl font-black text-slate-900 tracking-tight uppercase mb-4">
            RETURN, EXCHANGE & WARRANTY
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Pharsyde is dedicated to providing authentic craft products and transparent service. 
            Please review our official policies covering cannabis, nicotine hardware, returns, and warranties below.
          </p>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {policyHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#8EF705] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-8">
          {/* Section 1: Cannabis Regulations */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-600" />
              1. Cannabis Products Policy (Final Sale)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In accordance with federal and Manitoba provincial regulations governing controlled substances, 
              <strong> all cannabis products (dried flower, pre-rolls, cartridges, concentrates, edibles, and seeds) are strictly FINAL SALE</strong>. 
              Once a cannabis product has left the possession of Pharsyde or has been handed over by our courier, it cannot be returned, refunded, or exchanged.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Official Recalls:</strong> In the rare event of a Health Canada or licensed producer mandatory recall, Pharsyde will coordinate replacement or refund per federal guidelines. Customers must retain the original product packaging with lot number and excise stamp intact.
            </p>
          </div>

          {/* Section 2: Hardware & Vape Devices */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#488203]" />
              2. Electronic Vape Devices & 7-Day Store Warranty
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Eligible electronic vape devices, rechargeable closed-system batteries (e.g. STLTH Loop, 510 thread batteries) generally have a <strong>7-day store warranty</strong> from the date of purchase against manufacturer electrical and battery defects.
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
              <li>Warranty covers internal battery failure, sensor malfunction, or failure to charge under normal use.</li>
              <li>Warranty does not cover physical drops, liquid submersion, unauthorized disassembly, or third-party charger damage.</li>
              <li>Original purchase receipt and manufacturer retail packaging with serial numbers must be present.</li>
            </ul>
          </div>

          {/* Section 3: Disposable Vapes Notice */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              3. Disposable Vape Concerns (24-Hour Reporting Window)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Because disposable vape devices are single-use sealed hardware, any concerns regarding dead-on-arrival (DOA) units, unsealed leaking packaging, or rapid malfunction must be reported within <strong>24 hours</strong> of purchase or courier delivery.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Upon notification, the device must be brought to our physical store for technician inspection. Devices with depleted e-liquid or evidence of tampering are not eligible for replacement.
            </p>
          </div>

          {/* Section 4: Non-Cannabis Accessories */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#488203]" />
              4. Non-Cannabis Accessories & 7-Day Returns
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Eligible non-cannabis accessories (unopened grinders, glassware, carrying cases, apparel, and lifestyle tools) carry a <strong>7-day return period</strong>. Items must be in 100% brand-new, unused condition with unbroken safety seals and original factory packaging.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              For health, sanitation, and safety reasons, any accessory that has been exposed to herbal matter, combustion, or residue is immediately exempt from return or exchange.
            </p>
          </div>

          {/* Section 5: Order Discrepancies & Storefront Returns */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase flex items-center gap-2">
              <Store className="w-5 h-5 text-slate-800" />
              5. Missing Items, Shipping Delays & Physical Store Venue
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Order Discrepancies:</strong> Incorrect or missing orders must be reported within <strong>5 days</strong> of delivery or pickup. Please inspect your parcel promptly upon receipt and email photos of packing slips and items to <a href={`mailto:${STORE_INFO.email}`} className="text-[#488203] underline font-bold">{STORE_INFO.email}</a>.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>In-Store Physical Requirement:</strong> In compliance with retail licensing, <strong>all approved online returns and hardware inspections must be brought to our physical store</strong> located at <strong>117 Regent Ave W, Winnipeg, MB R2C 1R1</strong>. We cannot accept mail-in return shipments of regulated goods.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Shipping Delays & Lost Packages:</strong> Local deliveries are conducted via age-verified bonded couriers. If an unexpected weather delay occurs, our team will proactively notify you via phone or SMS. Lost packages will be investigated in tandem with courier tracking logs.
            </p>
          </div>

          {/* Section 6: Age Verification & Refund Processing */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#488203]" />
              6. Mandatory Age Verification & Refund Method
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Age and identity verification are required</strong> for all applicable age-restricted deliveries and boutique pickups. Failure to produce valid government photo ID demonstrating 19+ age at delivery will result in order cancellation and return to store, subject to restocking and courier transit charges.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Refund Processing:</strong> Approved refunds are credited to the original method of payment (or store credit if paid via cash/e-Transfer). Card refund processing typically reflects within 3 to 5 business days depending on your financial institution.
            </p>
          </div>
        </div>

        {/* Store Help Banner */}
        <div className="mt-16 p-8 rounded-3xl bg-white border border-slate-200 shadow-md text-center space-y-4">
          <HelpCircle className="w-8 h-8 text-[#488203] mx-auto" />
          <h3 className="font-heading text-xl font-bold text-slate-900 uppercase">
            Questions Regarding a Recent Order?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Our knowledgeable staff at 117 Regent Ave W are here to assist with hardware diagnostics or order inquiries.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={`tel:${STORE_INFO.phone}`}
              className="px-6 py-2.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#8EF705]/25"
            >
              Call {STORE_INFO.phone}
            </a>
            <a
              href={`mailto:${STORE_INFO.email}`}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Email Customer Care
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
