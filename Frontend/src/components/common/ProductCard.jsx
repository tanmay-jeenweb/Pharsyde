import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, Eye, Check, Sparkles, ImageOff } from 'lucide-react';

export default function ProductCard({ product }) {
  const { addToCart, navigateTo } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Normalization for DB (pk, product_name, imageUrl, retail_price) vs static mock data
  const productId = product.pk || product.id;
  const productName = product.product_name || product.name || 'Cannabis Product';
  const productImage = product.imageUrl || product.image;
  const productBrand = product.brand || 'PHARSYDE';
  const productCategory = product.category || 'Cannabis';
  const productStrain = product.strain || product.strainType;
  const productWeight = product.size || product.weight || (product.equivalent_g ? `${product.equivalent_g}g eq.` : null);

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

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

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
    setTimeout(() => setAddedAnim(false), 1500);
  };

  const handleCardClick = () => {
    navigateTo('product-detail', productId);
  };

  // Strain color theme
  const getStrainBadgeColor = (strain) => {
    const lower = (strain || '').toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (lower.includes('sativa')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (lower.includes('hybrid')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg) translateY(-5px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)'
      }}
      className="group relative cursor-pointer rounded-2xl bg-white border border-slate-200/90 hover:border-[#0166dc] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl hover:shadow-[#0166dc]/15"
    >
      {/* Top subtle neon highlight line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0166dc] to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {/* Product Image Area */}
      <div className="relative w-full aspect-square overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center p-3">
        {productImage && !imgError ? (
          <img
            src={productImage}
            alt={productName}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
            <ImageOff className="w-8 h-8 stroke-1 text-slate-300" />
            <span className="text-[11px] font-medium text-slate-400">Image not available</span>
          </div>
        )}

        {/* Subtle scrim for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1 pointer-events-none">
          {productStrain ? (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border backdrop-blur-xs ${getStrainBadgeColor(productStrain)}`}>
              {productStrain}
            </span>
          ) : <span />}

          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold tracking-wider uppercase">
              Sold Out
            </span>
          ) : qtyAvailable !== null && qtyAvailable <= 5 ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold tracking-wider uppercase">
              Only {qtyAvailable} left
            </span>
          ) : null}
        </div>

        {/* Quick View Button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/30 backdrop-blur-xs">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-bold tracking-wider uppercase border border-slate-200 hover:bg-[#0166dc] hover:text-white hover:border-[#0166dc] transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Full Details</span>
          </button>
        </div>
      </div>

      {/* Product Details Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white">
        <div>
          {/* Brand & Weight */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span className="uppercase tracking-wider text-[11px] text-[#0166dc] font-black truncate max-w-[150px]">
              {productBrand}
            </span>
            {productWeight && (
              <span className="text-[11px] text-slate-400 font-medium shrink-0">{productWeight}</span>
            )}
          </div>

          {/* Product Title */}
          <h3
            title={productName}
            className="font-heading text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0166dc] transition-colors line-clamp-2 min-h-[2.5rem] mb-2 leading-snug"
          >
            {productName}
          </h3>

          {/* Key Specs (THC, CBD, Category) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 mb-4">
            {thcVal && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                THC: <span className="text-slate-900 font-semibold">{thcVal}</span>
              </span>
            )}
            {cbdVal && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                CBD: <span className="text-slate-900 font-semibold">{cbdVal}</span>
              </span>
            )}
          </div>
        </div>

        {/* Price & Add to Cart Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-heading text-slate-900">
                ${formattedPrice}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">CAD</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={`Add ${productName} to bag`}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : addedAnim
                ? 'bg-slate-900 text-white'
                : 'bg-[#0166dc] text-white hover:bg-[#0153b3] hover:shadow-md hover:shadow-[#0166dc]/30'
            }`}
          >
            {isOutOfStock ? (
              <span>Out of Stock</span>
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
