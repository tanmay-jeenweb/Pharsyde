import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getProductByIdApi, getProductsApi } from '../services/productService';
import { PRODUCTS } from '../data/products';
import ProductCard from '../components/common/ProductCard';
import {
  ArrowLeft,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  Flame,
  Info,
  Scale,
  Barcode,
  Package,
  Store,
  Tag,
  AlertCircle,
  FileText,
  BadgePercent,
  ImageOff
} from 'lucide-react';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProductId, navigateTo, addToCart } = useApp();

  const activeId = id || selectedProductId;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Gallery state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Quantity & cart feedback
  const [quantity, setQuantity] = useState(1);
  const [addedAnim, setAddedAnim] = useState(false);

  // Fetch product from API by ID/pk
  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setLoading(true);
      setError(null);
      setImgError(false);

      if (!activeId) {
        // Fallback to static mock if no ID selected
        const fallback = PRODUCTS[0];
        setProduct(fallback);
        setSelectedImage(fallback.image);
        setLoading(false);
        return;
      }

      try {
        const fetched = await getProductByIdApi(activeId);
        if (!isMounted) return;

        if (fetched) {
          setProduct(fetched);
          const primaryImg = fetched.imageUrl || fetched.secondImageUrl || null;
          setSelectedImage(primaryImg);

          // Fetch related products from same category with images
          if (fetched.category) {
            getProductsApi({
              category: fetched.category,
              hasImage: true,
              limit: 4
            })
              .then((res) => {
                if (isMounted && res.products) {
                  setRelatedProducts(
                    res.products.filter((p) => p.pk !== fetched.pk && p.sku !== fetched.sku).slice(0, 3)
                  );
                }
              })
              .catch(() => {});
          }
        } else {
          // Check static mock
          const mockMatch = PRODUCTS.find((p) => String(p.id) === String(activeId));
          if (mockMatch) {
            setProduct(mockMatch);
            setSelectedImage(mockMatch.image);
          } else {
            setError(`Product with ID "${activeId}" could not be found.`);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        // Fallback to static mock if API fails
        const mockMatch = PRODUCTS.find((p) => String(p.id) === String(activeId));
        if (mockMatch) {
          setProduct(mockMatch);
          setSelectedImage(mockMatch.image);
        } else {
          setError('Failed to connect to backend server.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [activeId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC]">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="animate-pulse space-y-8">
            <div className="h-6 bg-slate-200 rounded-md w-48" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 aspect-square bg-slate-200 rounded-3xl" />
              <div className="lg:col-span-5 space-y-4">
                <div className="h-4 bg-slate-200 rounded-md w-1/4" />
                <div className="h-10 bg-slate-200 rounded-md w-3/4" />
                <div className="h-8 bg-slate-200 rounded-md w-1/3" />
                <div className="h-32 bg-slate-200 rounded-2xl" />
                <div className="h-12 bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-red-200 p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-heading text-slate-900 mb-2">Product Not Found</h2>
          <p className="text-sm text-red-600 font-medium mb-6">{error || 'This product is no longer in active stock.'}</p>
          <button
            onClick={() => navigate('/catalog')}
            className="w-full py-3 rounded-xl bg-[#0166dc] text-white font-bold uppercase tracking-wider text-xs hover:bg-[#0153b3] transition-all shadow-md shadow-[#0166dc]/20"
          >
            Return to Product Catalogue
          </button>
        </div>
      </div>
    );
  }

  // Normalization of fields between DB and Mock
  const productId = product.pk || product.id;
  const productName = product.product_name || product.name;
  const productBrand = product.brand || 'PHARSYDE';
  const productCategory = product.category || 'Cannabis';
  const productSubCategory = product.subCategory || product.other_category || null;
  const productStrain = product.strain || product.strainType;
  const productSku = product.sku || null;
  const productBarcode = product.barcode || null;
  const productSize = product.size || product.weight || null;
  const equivalentG = product.equivalent_g ? parseFloat(product.equivalent_g) : null;

  const rawRetailPrice = product.retail_price !== undefined
    ? parseFloat(product.retail_price)
    : (typeof product.price === 'number' ? product.price : parseFloat(product.price || 0));
  const retailPrice = isNaN(rawRetailPrice) ? 0 : rawRetailPrice;

  const membershipPrice = product.membership_price && product.membership_price !== 'N.A.'
    ? parseFloat(product.membership_price)
    : null;

  const salePrice = product.sale_price && product.sale_price !== 'N.A.'
    ? parseFloat(product.sale_price)
    : null;

  const effectivePrice = (salePrice && salePrice > 0) ? salePrice : retailPrice;

  const qtyAvailable = product.qty_available !== undefined ? parseFloat(product.qty_available) : null;
  const isOutOfStock = qtyAvailable !== null && qtyAvailable <= 0;

  const thcLevel = product.thC_LEVEL !== undefined && product.thC_LEVEL !== null && Number(product.thC_LEVEL) > 0
    ? `${parseFloat(product.thC_LEVEL).toFixed(2)}%`
    : (product.thc || null);

  const thcRange = product.thC_Range || null;

  const cbdLevel = product.cbD_LEVEL !== undefined && product.cbD_LEVEL !== null && Number(product.cbD_LEVEL) > 0
    ? `${parseFloat(product.cbD_LEVEL).toFixed(2)}%`
    : (product.cbd || null);

  const cbdRange = product.cbD_Range || null;

  // Build gallery from primary and secondary images
  const galleryImages = [
    product.imageUrl,
    product.secondImageUrl,
    ...(product.gallery || [])
  ].filter(Boolean);

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    const normalizedProduct = {
      ...product,
      id: productId,
      name: productName,
      image: selectedImage || product.imageUrl || product.image,
      price: effectivePrice,
      brand: productBrand,
      category: productCategory
    };

    const success = addToCart(
      normalizedProduct,
      { id: 'default', label: productSize || 'Standard Pack', price: effectivePrice },
      quantity
    );
    if (success !== false) {
      setAddedAnim(true);
      setTimeout(() => setAddedAnim(false), 2000);
  
    }


  };

  // Strain color theme
  const getStrainBadgeColor = (strain) => {
    const lower = (strain || '').toLowerCase();
    if (lower.includes('indica')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (lower.includes('sativa')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (lower.includes('hybrid')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC] text-slate-900">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-800 hover:text-[#0166dc] font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 font-medium">
            <Link to="/cannabis" className="hover:text-slate-900">Cannabis</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700">{productCategory}</span>
            {productSubCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-600">{productSubCategory}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 truncate font-semibold">{productName}</span>
          </div>
        </div>

        {/* Main Product Showcase Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-16">
          
          {/* Left Column: Image Gallery (7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Image Viewport */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-md flex items-center justify-center p-6 group">
              {selectedImage && !imgError ? (
                <img
                  src={selectedImage}
                  alt={productName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-8 text-center">
                  <ImageOff className="w-16 h-16 stroke-1 text-slate-300" />
                  <span className="text-sm font-medium text-slate-400">High-resolution photo not available</span>
                </div>
              )}

              {/* Strain Badge Floating Top Left */}
              {productStrain && (
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase border shadow-sm ${getStrainBadgeColor(productStrain)}`}>
                    {productStrain}
                  </span>
                </div>
              )}

              {/* Stock Status Pill Top Right */}
              <div className="absolute top-4 right-4">
                {isOutOfStock ? (
                  <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                    Out of Stock
                  </span>
                ) : qtyAvailable !== null ? (
                  <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {qtyAvailable > 10 ? 'In Stock' : `Only ${qtyAvailable} In Stock`}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    Available in Store
                  </span>
                )}
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(imgUrl);
                      setImgError(false);
                    }}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 p-2 transition-all shrink-0 ${
                      selectedImage === imgUrl
                        ? 'border-[#0166dc] shadow-md shadow-[#0166dc]/30 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Specifications & Purchase (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              {/* Brand & Category Breadcrumb */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#0166dc]">
                  {productBrand}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {productCategory}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4 leading-snug">
                {productName}
              </h1>

              {/* Pricing Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Retail Price
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-3xl font-black text-slate-900">
                      ${retailPrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">CAD</span>
                  </div>
                </div>

                {membershipPrice && membershipPrice > 0 && (
                  <div className="text-right border-l border-slate-100 pl-4">
                    <span className="text-[10px] text-[#0166dc] uppercase font-black tracking-wider block">
                      Member Price
                    </span>
                    <span className="font-heading text-xl font-black text-[#0166dc]">
                      ${membershipPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Cannabinoid Profile (THC & CBD) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-2 gap-3 mb-6">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">
                    THC Potency
                  </span>
                  <span className="font-heading text-lg font-black text-slate-900">
                    {thcLevel || 'N/A'}
                  </span>
                  {thcRange && (
                    <span className="text-[11px] text-slate-500 block">Range: {thcRange}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">
                    CBD Potency
                  </span>
                  <span className="font-heading text-lg font-black text-slate-900">
                    {cbdLevel || 'N/A'}
                  </span>
                  {cbdRange && (
                    <span className="text-[11px] text-slate-500 block">Range: {cbdRange}</span>
                  )}
                </div>

                {productSize && (
                  <div className="pt-2 border-t border-slate-100 col-span-2 flex items-center justify-between text-xs text-slate-700">
                    <span className="font-medium text-slate-500">Package Size / Unit:</span>
                    <span className="font-bold text-slate-900">{productSize}</span>
                  </div>
                )}

                {equivalentG !== null && equivalentG > 0 && (
                  <div className="pt-1 col-span-2 flex items-center justify-between text-xs text-slate-700">
                    <span className="font-medium text-slate-500">Cannabis Equivalent:</span>
                    <span className="font-bold text-slate-900">{equivalentG.toFixed(2)}g</span>
                  </div>
                )}
              </div>

              {/* Long Description / Product Notes */}
              {product.long_description ? (
                <div className="mb-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0166dc]" />
                    <span>Product Description</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200">
                    {product.long_description}
                  </p>
                </div>
              ) : product.description ? (
                <div className="mb-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Curator's Notes
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200">
                    {product.description}
                  </p>
                </div>
              ) : null}

              {/* Add to Cart Control Bar */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  {/* Quantity Counter */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-xs">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock}
                      className="text-slate-500 hover:text-slate-900 px-2 py-0.5 text-sm font-bold disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold font-mono text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={isOutOfStock}
                      className="text-slate-500 hover:text-slate-900 px-2 py-0.5 text-sm font-bold disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Bag Action Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 py-3.5 px-6 rounded-xl font-heading font-extrabold text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : addedAnim
                        ? 'bg-slate-900 text-white'
                        : 'bg-[#0166dc] hover:bg-[#0153b3] text-white shadow-[#0166dc]/25'
                    }`}
                  >
                    {isOutOfStock ? (
                      <span>Sold Out • Contact Store</span>
                    ) : addedAnim ? (
                      <>
                        <Check className="w-4 h-4 text-[#0166dc]" />
                        <span>Added to Your Order</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add To Bag • ${(effectivePrice * quantity).toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Pickup and Compliance Note */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Store className="w-3.5 h-3.5 text-[#0166dc]" />
                    <span>In-Store Express Pickup Available</span>
                  </div>
                  <p className="text-slate-500">
                    Government-issued 19+ photo ID and physical payment card required at Pharsyde Dispensary checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Inventory Specifications Data Matrix */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs mb-16">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Package className="w-5 h-5 text-[#0166dc]" />
            <h3 className="font-heading text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
              Inventory & Compliance Specifications
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">

            {/* Barcode */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Barcode / UPC</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{productBarcode || 'N/A'}</span>
            </div>

            {/* Inventory PK */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">System Inventory ID (PK)</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{productId}</span>
            </div>

            {/* Store ID */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Store Location</span>
              <span className="font-bold text-slate-800 text-sm">Store #{product.storeId || 1} (Regent Ave W)</span>
            </div>

            {/* Category */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Primary Category</span>
              <span className="font-bold text-slate-800 text-sm">{productCategory}</span>
            </div>

            {/* SubCategory */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Sub-Category</span>
              <span className="font-bold text-slate-800 text-sm">{productSubCategory || 'Standard'}</span>
            </div>

            {/* Strain Classification */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Cannabis Lineage</span>
              <span className="font-bold text-slate-800 text-sm">{productStrain || 'Unclassified'}</span>
            </div>

            {/* Units Per Case */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Units Per Case</span>
              <span className="font-bold text-slate-800 text-sm">{product.default_units_per_case || '1.00'}</span>
            </div>

            {/* Stock Quantity */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Quantity Available</span>
              <span className="font-bold text-slate-800 text-sm">{qtyAvailable !== null ? `${qtyAvailable} Units` : 'In Stock'}</span>
            </div>

            {/* Supplier */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Licensed Producer / Supplier</span>
              <span className="font-bold text-slate-800 text-sm">{product.supplier || productBrand}</span>
            </div>

            {/* Taxable */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Tax Classification</span>
              <span className="font-bold text-slate-800 text-sm">{product.taxable ? 'Taxable Goods' : 'Standard Cannabis Tax'}</span>
            </div>

            {/* Discountable */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Discount Eligibility</span>
              <span className="font-bold text-slate-800 text-sm">{product.discountable ? 'Promo Eligible' : 'Standard Pricing'}</span>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#0166dc] block mb-1">
                  You May Also Like
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  More from {productCategory}
                </h3>
              </div>
              <Link
                to="/catalog"
                className="text-xs font-bold text-slate-700 hover:text-[#0166dc] flex items-center gap-1 transition-colors"
              >
                <span>View Full Catalogue</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.pk || relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
