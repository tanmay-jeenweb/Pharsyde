import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, Eye, Check, ImageOff } from 'lucide-react';

export default function ProductCard({ product }) {
  const { addToCart, navigateTo } = useApp();
  const [addedAnim, setAddedAnim] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Normalization for DB (pk, product_name, imageUrl, retail_price) vs static mock data
  const productId = product.pk || product.id;
  const productName = product.product_name || product.name || 'Cannabis Product';
  const productImage = product.imageUrl || product.image;
  const productBrand = product.brand || 'PHARSYDE';
  const productCategory = product.category || 'Cannabis';
  const productWeight = product.size || product.weight || (product.equivalent_g ? `${product.equivalent_g}g eq.` : null);

  // Intelligent Strain normalization & detection
  const rawStrain = product.strain || product.strainType || product.strain_type;
  const detectStrain = () => {
    if (rawStrain && typeof rawStrain === 'string' && rawStrain.trim()) return rawStrain.trim();
    const text = `${product.product_name || product.name || ''} ${product.description || ''}`.toLowerCase();
    if (text.includes('indica')) return 'Indica';
    if (text.includes('sativa')) return 'Sativa';
    if (text.includes('hybrid')) return 'Hybrid';
    if (text.includes('cbd')) return 'High CBD';
    return null;
  };
  const productStrain = detectStrain();

  // Frosted-glass strain badge styling
  // Indica = Blue, Hybrid = Black, Sativa = Red
  const getStrainStyle = (strain) => {
    const lower = (strain || '').toLowerCase();
    if (lower.includes('indica')) {
      return {
        badge: 'bg-blue-700/80 text-blue-50 border border-blue-400/40 backdrop-blur-md shadow-xs',
        pill: 'bg-blue-500/10 text-blue-700 border border-blue-300/60 backdrop-blur-xs',
        dot: 'bg-blue-400'
      };
    }
    if (lower.includes('sativa')) {
      return {
        badge: 'bg-red-700/80 text-red-50 border border-red-400/40 backdrop-blur-md shadow-xs',
        pill: 'bg-red-500/10 text-red-700 border border-red-300/60 backdrop-blur-xs',
        dot: 'bg-red-400'
      };
    }
    if (lower.includes('hybrid')) {
      return {
        badge: 'bg-slate-900/85 text-slate-100 border border-slate-500/40 backdrop-blur-md shadow-xs',
        pill: 'bg-slate-900/10 text-slate-800 border border-slate-400/60 backdrop-blur-xs',
        dot: 'bg-slate-500'
      };
    }
    return {
      badge: 'bg-slate-900/70 text-blue-100 border border-blue-400/35 backdrop-blur-md shadow-xs',
      pill: 'bg-blue-500/10 text-[#0166dc] border border-blue-300/60 backdrop-blur-xs',
      dot: 'bg-blue-400'
    };
  };

  const strainStyle = getStrainStyle(productStrain);

  const rawPrice = product.retail_price !== undefined
    ? parseFloat(product.retail_price)
    : (typeof product.price === 'number' ? product.price : parseFloat(product.price || 0));
  const validPrice = isNaN(rawPrice) ? 0 : rawPrice;
  const formattedPrice = validPrice.toFixed(2);

  const thcVal = product.thC_LEVEL !== undefined && product.thC_LEVEL !== null && Number(product.thC_LEVEL) > 0
    ? `${parseFloat(product.thC_LEVEL).toFixed(1)}%`
    : (product.thc || null);

  const cbdVal = product.cbD_LEVEL !== undefined && product.cbD_LEVEL !== null && Number(product.cbD_LEVEL) > 0
    ? `${parseFloat(product.cbD_LEVEL).toFixed(1)}%`
    : (product.cbd || null);

  const qtyAvailable = product.qty_available !== undefined ? parseFloat(product.qty_available) : null;
  const isOutOfStock = qtyAvailable !== null && qtyAvailable <= 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    const normalizedProduct = {
      ...product,
      id: productId,
      name: productName,
      image: productImage,
      price: validPrice,
      brand: productBrand,
      category: productCategory
    };

    addToCart(
      normalizedProduct,
      product.variants?.[0] || { id: 'default', label: productWeight || 'Standard', price: validPrice },
      1
    );
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1200);
  };

  const handleCardClick = () => {
    navigateTo('product-detail', productId);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer rounded-3xl bg-white border border-slate-200/80 hover:border-[#0166dc] transition-all duration-150 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0166dc]/15 flex flex-col justify-between overflow-hidden shadow-xs"
    >
      {/* Top ambient brand highlight glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0166dc] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 pointer-events-none" />

      {/* Product Image Area */}
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-b from-slate-50/90 to-slate-100/40 border-b border-slate-100 flex items-center justify-center p-5">
        {productImage && !imgError ? (
          <img
            src={productImage}
            alt={productName}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-200 ease-out drop-shadow-xs"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
            <ImageOff className="w-9 h-9 stroke-1 text-slate-300" />
            <span className="text-[11px] font-medium text-slate-400">Image not available</span>
          </div>
        )}

        {/* Ambient Hover Spotlight */}
        <div className="absolute inset-0 bg-radial from-[#0166dc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" />

        {/* Transparentish Floating Badges Overlay (STRAIN) */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none z-10">
          {productStrain ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all duration-150 group-hover:scale-105 ${strainStyle.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${strainStyle.dot} animate-pulse`} />
              <span>{productStrain}</span>
            </span>
          ) : (
            <span />
          )}

          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-600/80 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase border border-rose-400/40 shadow-xs">
              Sold Out
            </span>
          ) : qtyAvailable !== null && qtyAvailable <= 5 ? (
            <span className="px-2.5 py-1 rounded-full bg-red-600/85 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase border border-red-400/40 shadow-xs">
              {qtyAvailable} Left
            </span>
          ) : null}
        </div>

        {/* Quick View Button overlay on hover (super quick 150ms) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-950/20 backdrop-blur-[2px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-heading font-extrabold tracking-wider uppercase border border-slate-200 hover:bg-[#0166dc] hover:text-white hover:border-[#0166dc] transition-all duration-150 shadow-md cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Product Details Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white space-y-3">
        <div>
          {/* Brand & Weight Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="uppercase tracking-widest text-[11px] text-[#0166dc] font-black truncate">
              {productBrand}
            </span>
            {productWeight && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70 shrink-0">
                {productWeight}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3
            title={productName}
            className="font-heading text-sm sm:text-[15px] font-extrabold text-slate-900 group-hover:text-[#0166dc] transition-colors duration-150 line-clamp-2 min-h-[2.6rem] leading-snug mb-2.5"
          >
            {productName}
          </h3>

          {/* Key Specs: Transparentish Strain Tag + Potency (THC/CBD) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {productStrain && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase border ${strainStyle.pill}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                {productStrain}
              </span>
            )}
            {thcVal && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 text-[10px] font-mono font-semibold">
                <span className="text-slate-400 font-sans">THC</span>
                <span className="font-bold text-slate-900">{thcVal}</span>
              </span>
            )}
            {cbdVal && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 text-[10px] font-mono font-semibold">
                <span className="text-slate-400 font-sans">CBD</span>
                <span className="font-bold text-slate-900">{cbdVal}</span>
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Modern Action Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block leading-none mb-1">Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black font-heading text-slate-900 tracking-tight">
                ${formattedPrice}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium">CAD</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={`Add ${productName} to bag`}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-heading font-black tracking-wider uppercase transition-all duration-150 shadow-xs cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : addedAnim
                ? 'bg-slate-900 text-white'
                : 'bg-[#0166dc] text-white hover:bg-[#0153b3] hover:shadow-lg hover:shadow-[#0166dc]/30 active:scale-95'
            }`}
          >
            {isOutOfStock ? (
              <span>Sold Out</span>
            ) : addedAnim ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#0166dc]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
