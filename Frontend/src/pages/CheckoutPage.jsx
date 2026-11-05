import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { checkEmailApi } from '../services/orderService';

import { uploadDocumentApi } from '../services/uploadService';
import { preloadPaymentApi, setMonerisPaymentSession } from '../services/paymentService';
import { calculateCartTaxes } from '../utils/taxCalculator';
import { getPublicSettingsApi } from '../services/productService';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Truck,
  Store,
  CreditCard,
  ArrowLeft,
  AlertTriangle,
  Receipt,
  FileCheck,
  User,
  Sparkles,
  Scale,
  UploadCloud,
  X,
  Loader2,
} from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cart,
    cartSubtotal,
    navigateTo,
    showToast,
    customerUser,
    customerToken,
    isCustomerLoggedIn,
    openAuthModal,
    cartCannabisGrams = 0,
    isCannabisLimitExceeded = false,
    MAX_CANNABIS_GRAMS = 30.0,
    freeDeliveryThreshold = 75.0,
  } = useApp();

  const cannabisMaxLimit = MAX_CANNABIS_GRAMS || 30.0;
  const FREE_SHIPPING_THRESHOLD = freeDeliveryThreshold || 75.0;

  // Form State
  // Store Policy State
  const [isGovIdMandatory, setIsGovIdMandatory] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    fulfillmentType: 'pickup', // pickup | delivery
    address: '',
    city: 'Winnipeg',
    postalCode: '',
    paymentMethod: 'credit', // 'credit' | 'debit'
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    ageConsent: false,
    idConsent: false,
    specialInstructions: '',
  });

  // Load Storefront Policy (e.g. Government ID mandatory requirement)
  useEffect(() => {
    let isMounted = true;
    async function loadStorePolicy() {
      try {
        const res = await getPublicSettingsApi();
        if (isMounted && res?.settings?.gov_id_mandatory !== undefined) {
          setIsGovIdMandatory(res.settings.gov_id_mandatory === 'true' || res.settings.gov_id_mandatory === true);
        }
      } catch (err) {
        console.warn('Could not load public settings:', err);
      }
    }
    loadStorePolicy();
    return () => { isMounted = false; };
  }, []);

  // Autofill with logged-in customer info if available
  useEffect(() => {
    if (customerUser) {
      const names = (customerUser.name || '').trim().split(/\s+/);
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || names[0] || '',
        lastName: prev.lastName || names.slice(1).join(' ') || '',
        email: prev.email || customerUser.email || '',
        phone: prev.phone || customerUser.mob_no || '',
      }));
    }
  }, [customerUser]);


  // Government ID Upload State (Optional)
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadDocError(null);
    setIsUploadingDoc(true);
    try {
      const res = await uploadDocumentApi(file);
      setUploadedDoc(res);
      showToast('Government ID uploaded successfully.', 'success');
    } catch (err) {
      console.error('ID Upload failed:', err);
      setUploadDocError(err.message || 'Failed to upload document.');
      showToast(err.message || 'Failed to upload document.', 'error');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = () => {
    setUploadedDoc(null);
    setUploadDocError(null);
  };

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed] = useState(null);

  // Loyalty Rewards State & Calculations
  const [redeemRewards, setRedeemRewards] = useState(false);
  const availablePoints = isCustomerLoggedIn ? Number(customerUser?.reward_points || 0) : 0;
  const pointRate = (Number(customerUser?.reward_points_dollar_value) > 0 && availablePoints > 0)
    ? (Number(customerUser.reward_points_dollar_value) / availablePoints)
    : 1.00;
  const availableDollarValue = Number(customerUser?.reward_points_dollar_value) > 0
    ? Number(customerUser.reward_points_dollar_value)
    : availablePoints * pointRate;
  const maxRedeemablePoints = Math.min(availablePoints, Math.floor(cartSubtotal / pointRate));
  const rewardDiscount = redeemRewards ? Math.round(maxRedeemablePoints * pointRate * 100) / 100 : 0.00;

  // Calculations
  const isPickup = formData.fulfillmentType === 'pickup';
  const shippingFee = isPickup || cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 9.99;
  const taxSummary = calculateCartTaxes(cart, {
    discount: rewardDiscount,
    shipping: shippingFee,
  });
  const orderTotal = taxSummary.finalTotal;

  const [existingAccountEmail, setExistingAccountEmail] = useState(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // clear error for that field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (name === 'email' && existingAccountEmail && value.trim().toLowerCase() !== existingAccountEmail) {
      setExistingAccountEmail(null);
    }
  };

  const handleEmailBlur = async () => {
    if (isCustomerLoggedIn) return;
    const emailToTest = (formData.email || '').trim().toLowerCase();
    if (!emailToTest || !emailToTest.includes('@')) {
      setExistingAccountEmail(null);
      return;
    }
    try {
      setIsCheckingEmail(true);
      const res = await checkEmailApi(emailToTest);
      if (res && res.exists) {
        setExistingAccountEmail(emailToTest);
      } else {
        setExistingAccountEmail(null);
      }
    } catch (err) {
      console.warn('Check email failed:', err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required for fulfillment contact';

    if (!formData.ageConsent) {
      newErrors.ageConsent = 'You must confirm you are at least 19 years of age.';
    }
    if (!formData.idConsent) {
      newErrors.idConsent = 'You must acknowledge valid photo ID is required upon receiving order.';
    }

    if (isGovIdMandatory && !uploadedDoc) {
      newErrors.govId = 'A government-approved ID document is required to proceed with checkout.';
    }

    if (!isPickup) {
      if (!formData.address.trim()) newErrors.address = 'Street address is required for delivery';
      if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please correct highlighted fields before submitting', 'error');
      return;
    }

    // If guest, verify email doesn't belong to an existing account
    if (!isCustomerLoggedIn && formData.email) {
      const emailToTest = formData.email.trim().toLowerCase();
      try {
        setIsCheckingEmail(true);
        const checkRes = await checkEmailApi(emailToTest);
        if (checkRes && checkRes.exists) {
          setExistingAccountEmail(emailToTest);
          setErrors((prev) => ({
            ...prev,
            email: 'An account with this email already exists. Please log in to complete your order.',
          }));
          showToast('An account with this email already exists. Please log in.', 'error');
          openAuthModal('login');
          return;
        }
      } catch (checkErr) {
        console.warn('Pre-checkout email check failed:', checkErr);
      } finally {
        setIsCheckingEmail(false);
      }
    }

    setIsSubmitting(true);

    const payload = {
      items: cart.map((item) => ({
        product_id: item.product.id || item.product.pk,
        techpos_product_id: item.product.techpos_product_id || item.product.pk,
        sku: item.product.sku,
        product_name: item.product.name || item.product.product_name,
        category: item.product.category,
        subCategory: item.product.subCategory,
        isCannabis: item.product.isCannabis ?? item.product.is_cannabis,
        equivalent_g: item.product.equivalent_g ?? item.product.dfe,
        variant_label: item.variant.label,
        quantity: item.quantity,
        unit_price: item.variant.price,
        image_url: item.product.image || item.product.imageUrl,
      })),
      customer: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        govIdUrl: uploadedDoc?.fileUrl || null,
        gov_id_url: uploadedDoc?.fileUrl || null,
      },
      govIdUrl: uploadedDoc?.fileUrl || null,
      gov_id_url: uploadedDoc?.fileUrl || null,
      fulfillmentType: formData.fulfillmentType,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      paymentMethod: formData.paymentMethod,
      notes: formData.specialInstructions,
      redeem_rewards: redeemRewards,
      redeemed_points: redeemRewards ? maxRedeemablePoints : 0,
    };

    try {
      // Process Credit Card via Moneris Hosted Checkout
      const preloadResult = await preloadPaymentApi(payload, customerToken);
      setMonerisPaymentSession(preloadResult);
      navigate(`/checkout/payment?attempt=${encodeURIComponent(preloadResult.paymentAttemptId)}`);
    } catch (err) {
      console.error('Order processing failed:', err);
      if (err.data?.code === 'ACCOUNT_EXISTS' || (err.message && err.message.toLowerCase().includes('already exists'))) {
        setExistingAccountEmail(formData.email.trim().toLowerCase());
        showToast('An account with this email already exists. Please log in.', 'error');
        openAuthModal('login');
        return;
      }
      showToast(err.message || 'Unable to process checkout. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order is completed, show confirmation view
  if (orderConfirmed) {
    return (
      <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#8EF705]/15 border border-[#8EF705]/40 flex items-center justify-center text-[#488203]">
              <CheckCircle2 className="w-9 h-9 text-[#488203]" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#488203] font-bold block mb-1">
                Order Received • Manitoba Compliant
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 uppercase">
                ORDER #{orderConfirmed.orderId}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                A confirmation summary has been registered for {orderConfirmed.customer.email}.
              </p>
            </div>

            {/* Order Details Receipt Box */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4 text-xs">
              <div className="flex justify-between pb-3 border-b border-slate-200 text-slate-600">
                <span>Fulfillment Mode:</span>
                <strong className="text-slate-900 uppercase font-heading">
                  {orderConfirmed.customer.fulfillmentType === 'pickup'
                    ? 'In-Store Pickup (117 Regent Ave W)'
                    : 'Winnipeg Age-Verified Courier'}
                </strong>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#488203] block">
                  Curated Selections:
                </span>
                {orderConfirmed.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-900">
                    <span className="font-medium">
                      {item.quantity}x {item.product.name || item.product.product_name} ({item.variant.label})
                    </span>
                    <span className="font-mono font-bold">${(item.variant.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 font-semibold">${orderConfirmed.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manitoba 12% Tax (GST+PST)</span>
                  <span className="font-mono text-slate-900">${orderConfirmed.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fulfillment Fee</span>
                  <span className="font-mono text-slate-900">
                    {orderConfirmed.shipping === 0 ? 'FREE' : `$${orderConfirmed.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total Paid</span>
                  <span className="font-mono text-[#488203] font-black">${orderConfirmed.total.toFixed(2)} CAD</span>
                </div>
              </div>
            </div>

            {/* Age & Handover Reminder */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-semibold">Important Fulfillment Requirement</strong>
                <p>
                  You must present government-issued photo ID (19+) matching the name{' '}
                  <span className="text-slate-900 font-bold">
                    {orderConfirmed.customer.firstName} {orderConfirmed.customer.lastName}
                  </span>{' '}
                  at collection or courier handover.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {isCustomerLoggedIn && (
                <button
                  onClick={() => navigateTo('orders')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#8EF705]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View in Order History</span>
                </button>
              )}

              <button
                onClick={() => navigateTo('home')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty and no confirmed order
  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#F8FAFC] text-center">
        <div className="max-w-md mx-auto px-4 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
            <Receipt className="w-8 h-8 opacity-50" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">Your Bag is Empty</h2>
          <p className="text-xs text-slate-500">
            Add items to your bag before heading to checkout.
          </p>
          <button
            onClick={() => navigateTo('catalog')}
            className="px-6 py-3 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black text-xs font-heading font-black uppercase tracking-wider transition-all shadow-md shadow-[#8EF705]/25"
          >
            Explore Catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#488203] block mb-1">
              SECURE TRANSACTION
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase">
              CHECKOUT
            </h1>
          </div>
          <button
            onClick={() => navigateTo('catalog')}
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>

        {/* Member Sign In Callout if Guest */}
        {!isCustomerLoggedIn && (
          <div className="mb-8 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#8EF705]/20 flex items-center justify-center text-[#488203]">
                <Sparkles className="w-4 h-4 text-[#488203]" />
              </div>
              <p className="text-xs text-slate-600">
                Already registered? <strong className="text-slate-900">Sign in to autofill your details and link this order to your account.</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="shrink-0 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all"
            >
              Sign In
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Form Fields (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Legal Age & ID Declaration */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <h3 className="font-heading text-base font-bold text-slate-900 uppercase">
                  1. Age & Eligibility Compliance
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    name="ageConsent"
                    checked={formData.ageConsent}
                    onChange={handleInputChange}
                    className="mt-0.5 rounded border-slate-300 bg-white accent-[#8EF705] focus:ring-0"
                  />
                  <span>
                    I confirm under penalty of law that I am <strong className="text-slate-900">19 years of age or older</strong> (legal age in Manitoba).
                  </span>
                </label>
                {errors.ageConsent && <p className="text-[11px] text-red-600">{errors.ageConsent}</p>}

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    name="idConsent"
                    checked={formData.idConsent}
                    onChange={handleInputChange}
                    className="mt-0.5 rounded border-slate-300 bg-white accent-[#8EF705] focus:ring-0"
                  />
                  <span>
                    I acknowledge that <strong className="text-slate-900">valid government-issued photo ID</strong> will be physically inspected upon store pickup or courier delivery.
                  </span>
                </label>
                {errors.idConsent && <p className="text-[11px] text-red-600">{errors.idConsent}</p>}
              </div>
            </div>

            {/* Step 2: Customer Contact */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-heading text-base font-bold text-slate-900 uppercase pb-3 border-b border-slate-100">
                2. Customer Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  />
                  {errors.firstName && <span className="text-[10px] text-red-600">{errors.firstName}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  />
                  {errors.lastName && <span className="text-[10px] text-red-600">{errors.lastName}</span>}
                </div>
                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                    {isCheckingEmail && (
                      <span className="text-[10px] text-slate-400 animate-pulse">Checking account...</span>
                    )}
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleEmailBlur}
                    placeholder="you@example.com"
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white transition-colors ${
                      existingAccountEmail ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300 focus:border-[#8EF705]'
                    }`}
                  />
                  {errors.email && <span className="text-[10px] text-red-600 block mt-1">{errors.email}</span>}

                  {existingAccountEmail && (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-[11px] leading-tight">
                          We found an account for <strong>{existingAccountEmail}</strong>! Please log in to complete your checkout.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Log In</span>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="(204) 000-0000"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                  />
                  {errors.phone && <span className="text-[10px] text-red-600">{errors.phone}</span>}
                </div>
              </div>
            
              {/* Optional Government-Approved ID Upload */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#488203]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Government-Approved ID
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isGovIdMandatory
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isGovIdMandatory ? 'Mandatory *' : 'Optional'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {isGovIdMandatory ? (
                    <>
                      <strong className="text-amber-800 font-bold">Age Verification Required:</strong> Upload a photo or PDF of your Driver's License, Passport, or Age of Majority card before placing your order. <strong className="text-slate-700">Physical ID will still be inspected at pickup or courier delivery.</strong>
                    </>
                  ) : (
                    <>
                      Upload a photo or PDF of your Driver's License, Passport, or Age of Majority card to expedite pickup &amp; delivery confirmation. <strong className="text-slate-700">Physical ID will still be physically verified upon collection or courier arrival.</strong>
                    </>
                  )}
                </p>

                {!uploadedDoc ? (
                  <div>
                    <label
                      className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        isUploadingDoc
                          ? 'bg-slate-50 border-slate-300 opacity-60 cursor-not-allowed'
                          : 'bg-slate-50 hover:bg-[#8EF705]/5 border-slate-300 hover:border-[#8EF705]'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileUpload}
                        disabled={isUploadingDoc}
                        className="sr-only"
                      />
                      {isUploadingDoc ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <Loader2 className="w-5 h-5 animate-spin text-[#488203]" />
                          <span>Uploading and securing document...</span>
                        </div>
                      ) : (
                        <div className="text-center space-y-1.5">
                          <div className="w-10 h-10 mx-auto rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600">
                            <UploadCloud className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800">
                              Click to select or drag &amp; drop document
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              JPG, PNG, WEBP, or PDF • Max 10MB
                            </span>
                          </div>
                        </div>
                      )}
                    </label>
                    {uploadDocError && (
                      <p className="mt-1.5 text-[11px] text-red-600 font-medium">{uploadDocError}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate">
                          {uploadedDoc.originalName || 'Government ID Uploaded'}
                        </span>
                        <span className="block text-[10px] text-emerald-700 font-medium">
                          Uploaded successfully • {uploadedDoc.size ? (uploadedDoc.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Ready'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={uploadedDoc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-200 rounded-lg transition-colors"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveDoc}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-white cursor-pointer"
                        title="Remove document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Fulfillment Method */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-heading text-base font-bold text-slate-900 uppercase pb-3 border-b border-slate-100">
                3. Fulfillment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.fulfillmentType === 'pickup'
                      ? 'bg-[#8EF705]/10 border-[#8EF705] text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Store className="w-5 h-5 text-[#488203]" />
                    <input
                      type="radio"
                      name="fulfillmentType"
                      value="pickup"
                      checked={formData.fulfillmentType === 'pickup'}
                      onChange={handleInputChange}
                      className="accent-[#8EF705]"
                    />
                  </div>
                  <div>
                    <strong className="block text-sm text-slate-900">In-Store Boutique Pickup</strong>
                    <span className="text-[11px] block text-slate-500 mt-1">
                      117 Regent Ave W, Winnipeg
                    </span>
                    <span className="text-xs font-bold text-[#488203] mt-2 block font-mono">
                      FREE • Ready in 30 mins
                    </span>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.fulfillmentType === 'delivery'
                      ? 'bg-[#8EF705]/10 border-[#8EF705] text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Truck className="w-5 h-5 text-orange-600" />
                    <input
                      type="radio"
                      name="fulfillmentType"
                      value="delivery"
                      checked={formData.fulfillmentType === 'delivery'}
                      onChange={handleInputChange}
                      className="accent-[#8EF705]"
                    />
                  </div>
                  <div>
                    <strong className="block text-sm text-slate-900">Winnipeg Local Courier</strong>
                    <span className="text-[11px] block text-slate-500 mt-1">
                      Same-day delivery (19+ ID check)
                    </span>
                    <span className="text-xs font-bold text-orange-600 mt-2 block font-mono">
                      {cartSubtotal >= FREE_SHIPPING_THRESHOLD ? `FREE (Over $${FREE_SHIPPING_THRESHOLD.toFixed(0)})` : '$9.99 CAD'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Delivery Address fields if courier selected */}
              {!isPickup && (
                <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main St, Apt 4B"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#8EF705] focus:bg-white"
                    />
                    {errors.address && <span className="text-[10px] text-red-600">{errors.address}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        readOnly
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="R2C 1R1"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 uppercase focus:outline-none focus:border-[#8EF705] focus:bg-white"
                      />
                      {errors.postalCode && <span className="text-[10px] text-red-600">{errors.postalCode}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Payment Selection */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-heading text-base font-bold text-slate-900 uppercase">
                  4. Payment Method
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Instant Card Checkout
                </span>
              </div>

              <div className="space-y-3">
                {/* Credit Card Option */}
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'credit'
                      ? 'bg-emerald-50/60 border-[#8EF705] ring-2 ring-[#8EF705]/40 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-100/70 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">Credit Card</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Instant Online
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Visa, MasterCard, American Express, Discover
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit"
                    checked={formData.paymentMethod === 'credit'}
                    onChange={handleInputChange}
                    className="accent-[#8EF705] w-4 h-4 cursor-pointer"
                  />
                </label>

                {/* Debit Card Option */}
                <label
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'debit'
                      ? 'bg-emerald-50/60 border-[#8EF705] ring-2 ring-[#8EF705]/40 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">Debit Card</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Instant Online
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Visa Debit & Debit MasterCard (Direct Canadian Bank Cards)
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="debit"
                    checked={formData.paymentMethod === 'debit'}
                    onChange={handleInputChange}
                    className="accent-[#8EF705] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              
            </div>
          </div>

          {/* Right Column: Order Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-lg sticky top-28 space-y-6">
              <h3 className="font-heading text-lg font-bold text-slate-900 uppercase pb-3 border-b border-slate-100">
                Order Summary ({cart.length})
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={`${item.product.id}-${item.variant.id}`} className="flex items-center gap-3 text-xs">
                    <img
                      src={item.product.image || item.product.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-900 block truncate">
                        {item.product.name || item.product.product_name}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Qty: {item.quantity} • {item.variant.label}
                      </span>
                    </div>
                    <span className="font-mono text-slate-900 shrink-0 font-bold">
                      ${(item.variant.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* TechPOS Loyalty Reward Tokens Card (Always Visible) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border border-amber-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          Reward Tokens
                        </span>
                        {isCustomerLoggedIn && customerUser?.techpos_member_id && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-mono font-semibold">
                            #{customerUser.techpos_member_id}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        TechPOS Loyalty Program
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-amber-900 block">
                      ⭐ {availablePoints} tokens
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      (${availableDollarValue.toFixed(2)} CAD)
                    </span>
                  </div>
                </div>

                {isCustomerLoggedIn ? (
                  availablePoints > 0 ? (
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-amber-200 cursor-pointer text-xs text-slate-900 font-medium select-none hover:border-amber-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={redeemRewards}
                        onChange={(e) => setRedeemRewards(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-amber-600 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-900 block">
                          Redeem {maxRedeemablePoints} tokens for instant discount
                        </span>
                        <span className="text-[11px] text-[#488203] font-mono font-bold block mt-0.5">
                          -${(maxRedeemablePoints * pointRate).toFixed(2)} CAD off order total
                        </span>
                      </div>
                    </label>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-100/40 border border-amber-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-[11px]">
                          Balance: <strong className="text-slate-900 font-mono">0 tokens ($0.00 CAD)</strong>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
                        +Earn tokens on this order
                      </span>
                    </div>
                  )
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-100/40 border border-amber-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-600">
                      Balance: <strong className="text-slate-900 font-mono">0 tokens</strong> (Guest)
                    </span>
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="text-[10px] font-bold text-slate-900 hover:text-black underline cursor-pointer"
                    >
                      Sign In to Link Tokens
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 font-semibold">${cartSubtotal.toFixed(2)} CAD</span>
                </div>
                <div className="flex justify-between">
                  <span>Fulfillment Method</span>
                  <span className="font-mono text-slate-900">
                    {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)} CAD`}
                  </span>
                </div>

                {/* Reward Tokens Line Item - Always Shown */}
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reward Tokens</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({availablePoints} tokens avail)
                    </span>
                  </span>
                  <span className={`font-mono font-bold ${redeemRewards && rewardDiscount > 0 ? 'text-[#488203]' : 'text-slate-500'}`}>
                    {redeemRewards && rewardDiscount > 0 ? `-${rewardDiscount.toFixed(2)} CAD` : '$0.00 CAD'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{taxSummary.hasCannabis && taxSummary.hasNicotine ? 'Estimated Taxes (5% Cannabis / 12% Nicotine)' : taxSummary.hasNicotine ? 'Nicotine Tax (5% GST + 7% PST = 12%)' : 'Cannabis Tax (5% GST)'}</span>
                  <span className="font-mono text-slate-900">${taxSummary.totalTax.toFixed(2)} CAD</span>
                </div>
                {taxSummary.hasCannabis && taxSummary.hasNicotine && (
                  <div className="flex justify-between text-[11px] text-slate-400 pl-2">
                    <span>• Cannabis 5% GST: ${taxSummary.cannabisTax.toFixed(2)} | Nicotine 12%: ${taxSummary.nicotineTax.toFixed(2)}</span>
                  </div>
                )}
                {cartCannabisGrams > 0 && (
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Scale className="w-3.5 h-3.5 text-slate-700" />
                      <span>Cannabis Weight</span>
                    </span>
                    <span className={`font-mono font-bold ${isCannabisLimitExceeded ? 'text-red-600' : 'text-slate-900'}`}>
                      {cartCannabisGrams.toFixed(1)}g / {cannabisMaxLimit.toFixed(1)}g
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total Due</span>
                  <span className="font-mono text-[#488203] font-black">${orderTotal.toFixed(2)} CAD</span>
                </div>
              </div>

              {/* Cannabis Limit Exceeded Warning */}
              {isCannabisLimitExceeded && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Order exceeds {cannabisMaxLimit.toFixed(1)}g legal limit for cannabis products ({cartCannabisGrams.toFixed(1)}g). Please reduce items to proceed.</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || isCannabisLimitExceeded}
                className={
                  isCannabisLimitExceeded
                    ? "w-full py-4 rounded-xl bg-slate-200 text-slate-400 font-heading font-black text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
                    : "w-full py-4 rounded-xl bg-[#8EF705] hover:bg-[#80de04] text-black font-heading font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-[#8EF705]/25 flex items-center justify-center gap-2"
                }
              >
                {isSubmitting ? (
                  <span>Processing Manitoba Order...</span>
                ) : isCannabisLimitExceeded ? (
                  <span>Cannabis Limit Exceeded ({cartCannabisGrams.toFixed(1)}g / {cannabisMaxLimit.toFixed(1)}g)</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Proceed to Payment • {orderTotal.toFixed(2)} CAD
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
