import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  customerLoginApi,
  customerRegisterApi,
  getCustomerProfileApi,
} from '../services/orderService';
import { getPublicSettingsApi } from '../services/productService';

import {
  MAX_CANNABIS_GRAMS,
  getProductCannabisGrams,
  calculateCartCannabisGrams,
  validateCannabisLimit,
} from '../utils/cannabisLimit';

const AppContext = createContext();

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Selected product ID state (for detail views)
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Derive currentPage dynamically from URL pathname for full backward compatibility
  const getPageFromPath = (path) => {
    if (path === '/') return 'home';
    if (path.startsWith('/catalog') || path.startsWith('/products') || path.startsWith('/shop')) return 'catalog';
    if (path.startsWith('/product/')) return 'product-detail';
    if (path.startsWith('/checkout')) return 'checkout';
    if (path.startsWith('/account') || path.startsWith('/orders')) return 'account';
    if (path.startsWith('/policy') || path.startsWith('/policies') || path.startsWith('/terms') || path.startsWith('/privacy') || path.startsWith('/return-refund-policy')) return 'policy';
    if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/contact')) return 'contact';
    return 'home';
  };

  const currentPage = getPageFromPath(location.pathname);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('pharsyde_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cannabis Legal Limit State (Configurable dynamically via SettingMaster)
  const [cannabisMaxGrams, setCannabisMaxGrams] = useState(() => {
    try {
      const saved = localStorage.getItem('pharsyde_cannabis_limit');
      const parsed = parseFloat(saved);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    } catch {}
    return MAX_CANNABIS_GRAMS;
  });

  // Free Delivery Threshold State (Configurable dynamically via SettingMaster)
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(() => {
    try {
      const saved = localStorage.getItem('pharsyde_free_delivery_threshold');
      const parsed = parseFloat(saved);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    } catch {}
    return 75.0;
  });

  // Load Storefront Settings (Dynamic Cannabis Limit, Free Delivery Threshold, etc.)
  const refreshPublicSettings = useCallback(async () => {
    try {
      const res = await getPublicSettingsApi();
      if (res?.settings?.cannabis_max_grams) {
        const parsed = parseFloat(res.settings.cannabis_max_grams);
        if (Number.isFinite(parsed) && parsed > 0) {
          setCannabisMaxGrams(parsed);
          try {
            localStorage.setItem('pharsyde_cannabis_limit', String(parsed));
          } catch {}
        }
      }
      if (res?.settings?.free_delivery_threshold) {
        const parsedThreshold = parseFloat(res.settings.free_delivery_threshold);
        if (Number.isFinite(parsedThreshold) && parsedThreshold >= 0) {
          setFreeDeliveryThreshold(parsedThreshold);
          try {
            localStorage.setItem('pharsyde_free_delivery_threshold', String(parsedThreshold));
          } catch {}
        }
      }
      return res?.settings;
    } catch (err) {
      console.warn('Could not load storefront settings:', err);
    }
  }, []);

  useEffect(() => {
    refreshPublicSettings();

    // Cross-tab synchronization
    const handleStorageChange = (e) => {
      if (e.key === 'pharsyde_cannabis_limit' && e.newValue) {
        const parsed = parseFloat(e.newValue);
        if (Number.isFinite(parsed) && parsed > 0) {
          setCannabisMaxGrams(parsed);
        }
      }
      if (e.key === 'pharsyde_free_delivery_threshold' && e.newValue) {
        const parsed = parseFloat(e.newValue);
        if (Number.isFinite(parsed) && parsed >= 0) {
          setFreeDeliveryThreshold(parsed);
        }
      }
    };

    // Same-window/in-app synchronization (e.g. from SettingMaster)
    const handleCustomSettingsChanged = (e) => {
      if (e.detail?.key === 'cannabis_max_grams' && e.detail?.value) {
        const parsed = parseFloat(e.detail.value);
        if (Number.isFinite(parsed) && parsed > 0) {
          setCannabisMaxGrams(parsed);
        }
      }
      refreshPublicSettings();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pharsyde_settings_changed', handleCustomSettingsChanged);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pharsyde_settings_changed', handleCustomSettingsChanged);
    };
  }, [refreshPublicSettings]);

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Customer Auth State
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pharsyde_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState(() => {
    try {
      return localStorage.getItem('pharsyde_customer_token') || null;
    } catch {
      return null;
    }
  });

  const isCustomerLoggedIn = Boolean(customerToken && customerUser);

  // Customer Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  // Age Verification State (19+ Manitoba requirement)
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    try {
      return localStorage.getItem('pharsyde_age_verified') === 'true';
    } catch {
      return false;
    }
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem('pharsyde_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [cart]);

  // Sync Customer Profile & live reward points on mount or Token changes
  useEffect(() => {
    if (customerToken) {
      getCustomerProfileApi(customerToken)
        .then((user) => {
          if (user) {
            setCustomerUser(user);
            localStorage.setItem('pharsyde_customer_user', JSON.stringify(user));
          }
        })
        .catch(() => {
          customerLogout();
        });
    }
  }, [customerToken]);

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Customer Auth Operations
  const customerLogin = async (email, password) => {
    const res = await customerLoginApi({ email, password });
    if (res.success && res.token) {
      setCustomerToken(res.token);
      setCustomerUser(res.user);
      localStorage.setItem('pharsyde_customer_token', res.token);
      localStorage.setItem('pharsyde_customer_user', JSON.stringify(res.user));
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${res.user.name || 'Member'}!`, 'success');
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const customerRegister = async ({ name, email, password, phone, dateOfBirth, verificationToken }) => {
    const res = await customerRegisterApi({ name, email, password, phone, dateOfBirth, verificationToken });
    if (res.success && res.token) {
      setCustomerToken(res.token);
      setCustomerUser(res.user);
      localStorage.setItem('pharsyde_customer_token', res.token);
      localStorage.setItem('pharsyde_customer_user', JSON.stringify(res.user));
      setIsAuthModalOpen(false);
      showToast(`Welcome to Pharsyde, ${res.user.name}! Account created.`, 'success');
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const customerLogout = () => {
    setCustomerToken(null);
    setCustomerUser(null);
    localStorage.removeItem('pharsyde_customer_token');
    localStorage.removeItem('pharsyde_customer_user');
    showToast('Signed out successfully.', 'info');
  };

  // Cart operations
  const addToCart = (product, variant = null, quantity = 1) => {
    const targetVariant =
      variant || (product.variants && product.variants[0]) || { id: 'default', label: 'Standard', price: product.price };

    // ── Stock Check (local DB qty_available — no TechPOS API call) ──────────
    const dbQty = product.qty_available !== undefined ? parseFloat(product.qty_available) : null;
    if (dbQty !== null && !isNaN(dbQty)) {
      // How many of this product+variant are already in the cart?
      const alreadyInCart = cart.reduce((sum, item) => {
        if (item.product.id === product.id && item.variant.id === targetVariant.id) {
          return sum + item.quantity;
        }
        return sum;
      }, 0);

      if (alreadyInCart + quantity > dbQty) {
        const remaining = Math.max(0, dbQty - alreadyInCart);
        if (remaining <= 0) {
          showToast(
            `"${product.name}" is already at max available stock (${dbQty} in stock).`,
            'warning'
          );
        } else {
          showToast(
            `Only ${remaining} unit${remaining !== 1 ? 's' : ''} of "${product.name}" available. You already have ${alreadyInCart} in your cart.`,
            'warning'
          );
        }
        return false;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const itemGrams = getProductCannabisGrams({ product, variant: targetVariant });
    const additionalGrams = itemGrams * quantity;
    const currentGrams = calculateCartCannabisGrams(cart);

    if (currentGrams + additionalGrams > cannabisMaxGrams) {
      showToast(
        `Cannot add: Exceeds ${cannabisMaxGrams.toFixed(1)}g legal limit for cannabis (current: ${currentGrams.toFixed(1)}g, adding: ${additionalGrams.toFixed(1)}g).`,
        'error'
      );
      return false;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.variant.id === targetVariant.id
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { product, variant: targetVariant, quantity }];
      }
    });

    showToast(`Added ${product.name} (${targetVariant.label}) to your order`, 'success');
  };

  const updateQuantity = (productId, variantId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    // ── Stock Check (local DB qty_available — no TechPOS API call) ──────────
    const cartItem = cart.find(
      (item) => item.product.id === productId && item.variant.id === variantId
    );
    if (cartItem) {
      const dbQty =
        cartItem.product.qty_available !== undefined
          ? parseFloat(cartItem.product.qty_available)
          : null;
      if (dbQty !== null && !isNaN(dbQty) && qty > dbQty) {
        showToast(
          `Only ${dbQty} unit${dbQty !== 1 ? 's' : ''} of "${cartItem.product.name}" available in stock.`,
          'warning'
        );
        return false;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const proposedCart = cart.map((item) =>
      item.product.id === productId && item.variant.id === variantId
        ? { ...item, quantity: qty }
        : item
    );
    const proposedGrams = calculateCartCannabisGrams(proposedCart);

    if (proposedGrams > cannabisMaxGrams) {
      const currentGrams = calculateCartCannabisGrams(cart);
      showToast(
        `Cannot increase quantity: Exceeds ${cannabisMaxGrams.toFixed(1)}g legal cannabis limit (current: ${currentGrams.toFixed(1)}g, proposed: ${proposedGrams.toFixed(1)}g).`,
        'error'
      );
      return false;
    }

    setCart(proposedCart);
  };

  const removeFromCart = (productId, variantId) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.variant.id === variantId))
    );
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculate Totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCannabisGrams = calculateCartCannabisGrams(cart);
  const isCannabisLimitExceeded = Math.round(cartCannabisGrams * 100) > Math.round(cannabisMaxGrams * 100);

  // Age verification action
  const confirmAge = () => {
    setIsAgeVerified(true);
    try {
      localStorage.setItem('pharsyde_age_verified', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Navigation Helper backed by React Router
  const navigateTo = (page, productId = null) => {
    if (productId) {
      setSelectedProductId(productId);
    }
    if (page === 'product-detail' && productId) {
      navigate(`/product/${productId}`);
    } else if (page === 'home') {
      navigate('/');
    } else if (page === 'cannabis') {
      navigate('/cannabis');
    } else if (page === 'nicotine') {
      navigate('/nicotine');
    } else if (
      page === 'catalog' ||
      page === 'products' ||
      page === 'shop'
    ) {
      navigate('/cannabis');
    } else if (page.startsWith('/')) {
      navigate(page);
    } else {
      navigate(`/${page}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        selectedProductId,
        navigateTo,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartCount,
        cartCannabisGrams,
        MAX_CANNABIS_GRAMS: cannabisMaxGrams,
        cannabisMaxGrams,
        setCannabisMaxGrams,
        isCannabisLimitExceeded,
        refreshPublicSettings,
        refreshSettings: refreshPublicSettings,
        freeDeliveryThreshold,
        FREE_SHIPPING_THRESHOLD: freeDeliveryThreshold,
        setFreeDeliveryThreshold,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        isAgeVerified,
        confirmAge,
        toasts,
        showToast,
        customerUser,
        customerToken,
        isCustomerLoggedIn,
        customerLogin,
        customerRegister,
        customerLogout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
