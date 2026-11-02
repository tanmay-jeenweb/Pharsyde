import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    if (path.startsWith('/policy')) return 'policy';
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

  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Cart operations
  const addToCart = (product, variant = null, quantity = 1) => {
    const targetVariant = variant || (product.variants && product.variants[0]) || { id: 'default', label: 'Standard', price: product.price };
    
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        item => item.product.id === product.id && item.variant.id === targetVariant.id
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
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId && item.variant.id === variantId
          ? { ...item, quantity: qty }
          : item
      )
    );
  };

  const removeFromCart = (productId, variantId) => {
    setCart(prev =>
      prev.filter(item => !(item.product.id === productId && item.variant.id === variantId))
    );
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculate Totals
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
    } else if (page === 'catalog' || page === 'products' || page === 'shop' || page === 'cannabis' || page === 'nicotine') {
      navigate('/catalog');
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
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        isAgeVerified,
        confirmAge,
        toasts,
        showToast
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

