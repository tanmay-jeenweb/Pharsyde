import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import AgeGateModal from './components/common/AgeGateModal';
import ToastContainer from './components/common/ToastContainer';
import ScrollToTop from './components/common/ScrollToTop';

// Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import PolicyPage from './pages/PolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

function MainApp() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#8EF705] selection:text-black">
      {/* Scroll to top automatically on route changes */}
      <ScrollToTop />

      {/* 19+ Age Gate Compliance Modal */}
      <AgeGateModal />

      {/* Floating / Sticky Navigation Bar */}
      <Navbar />

      {/* Dynamic Main View via React Router */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />

          {/* Catalog route aliases */}
          <Route path="/products" element={<Navigate to="/catalog" replace />} />
          <Route path="/shop" element={<Navigate to="/catalog" replace />} />
          <Route path="/cannabis" element={<Navigate to="/catalog" replace />} />
          <Route path="/nicotine" element={<Navigate to="/catalog" replace />} />

          {/* Product detail views */}
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/catalog/:id" element={<ProductDetailsPage />} />

          {/* Checkout & transactional */}
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Informational pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/policies" element={<Navigate to="/policy" replace />} />
          <Route path="/terms" element={<Navigate to="/policy" replace />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Cart Drawer */}
      <CartDrawer />

      {/* Global Search Modal (Ctrl/Cmd+K) */}
      <GlobalSearchModal />

      {/* Toast Feedback Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
