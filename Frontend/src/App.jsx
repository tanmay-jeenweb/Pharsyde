import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import AgeGateModal from './components/common/AgeGateModal';
import ToastContainer from './components/common/ToastContainer';
import ScrollToTop from './components/common/ScrollToTop';

// Storefront Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import BestSellersPage from './pages/BestSellersPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AccountOrdersPage from './pages/AccountOrdersPage';
import PolicyPage from './pages/PolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthModal from './components/auth/AuthModal';

// Office Portal Components & Pages (ERP Office Management)
import OfficeProtectedRoute from './components/office/OfficeProtectedRoute';
import OfficeLogin from './pages/office/OfficeLogin';
import OfficeDashboard from './pages/office/OfficeDashboard';
import UserMaster from './pages/office/UserMaster';
import CreateUserPage from './pages/office/CreateUserPage';
import UserTypeMaster from './pages/office/UserTypeMaster';
import CreateUserTypePage from './pages/office/CreateUserTypePage';
import ProductMaster from './pages/office/ProductMaster';
import CreateProductPage from './pages/office/CreateProductPage';
import ProductImageMaster from './pages/office/ProductImageMaster';
import ActivityReport from './pages/office/ActivityReport';
import OrderMaster from './pages/office/OrderMaster';
import SettingMaster from './pages/office/SettingMaster';

function MainStoreApp() {
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
          <Route path="/new-arrivals" element={<NewArrivalsPage />} />
          <Route path="/new-arrival" element={<Navigate to="/new-arrivals" replace />} />
          <Route path="/best-sellers" element={<BestSellersPage />} />
          <Route path="/best-seller" element={<Navigate to="/best-sellers" replace />} />
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
          <Route path="/order" element={<Navigate to="/checkout" replace />} />
          <Route path="/checkout/payment" element={<PaymentPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />

          {/* Customer Account & Order History */}
          <Route path="/account" element={<AccountOrdersPage />} />
          <Route path="/account/orders" element={<AccountOrdersPage />} />
          <Route path="/orders" element={<AccountOrdersPage />} />

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

      {/* Customer Sign In / Register Modal */}
      <AuthModal />

      {/* Toast Feedback Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
      <Routes>
        {/* ========================================================
            Office Management Routes (All prefixed with /office/..)
            ======================================================== */}
        <Route path="/office/login" element={<OfficeLogin />} />
        
        <Route
          path="/office/dashboard"
          element={
            <OfficeProtectedRoute>
              <OfficeDashboard />
            </OfficeProtectedRoute>
          }
        />

        <Route
          path="/office/user-master"
          element={
            <OfficeProtectedRoute>
              <UserMaster />
            </OfficeProtectedRoute>
          }
        />
        <Route
          path="/office/user-master/create"
          element={
            <OfficeProtectedRoute>
              <CreateUserPage />
            </OfficeProtectedRoute>
          }
        />
        <Route
          path="/office/user-master/edit/:id"
          element={
            <OfficeProtectedRoute>
              <CreateUserPage />
            </OfficeProtectedRoute>
          }
        />

        <Route
          path="/office/user-type-master"
          element={
            <OfficeProtectedRoute>
              <UserTypeMaster />
            </OfficeProtectedRoute>
          }
        />
        <Route
          path="/office/user-type-master/create"
          element={
            <OfficeProtectedRoute>
              <CreateUserTypePage />
            </OfficeProtectedRoute>
          }
        />
        <Route
          path="/office/user-type-master/edit/:id"
          element={
            <OfficeProtectedRoute>
              <CreateUserTypePage />
            </OfficeProtectedRoute>
          }
        />

        <Route
          path="/office/product-master"
          element={
            <OfficeProtectedRoute>
              <ProductMaster />
            </OfficeProtectedRoute>
          }
        />
        <Route
          path="/office/product-master/create"
          element={
            <OfficeProtectedRoute>
              <CreateProductPage />
            </OfficeProtectedRoute>
          }
        />
        <Route
          path="/office/product-master/edit/:id"
          element={
            <OfficeProtectedRoute>
              <CreateProductPage />
            </OfficeProtectedRoute>
          }
        />

        <Route
          path="/office/product-image-master"
          element={
            <OfficeProtectedRoute>
              <ProductImageMaster />
            </OfficeProtectedRoute>
          }
        />

        <Route
          path="/office/activity-report"
          element={
            <OfficeProtectedRoute>
              <ActivityReport />
            </OfficeProtectedRoute>
          }
        />

        {/* /office redirects to /office/dashboard */}
                <Route
          path="/office/orders"
          element={
            <OfficeProtectedRoute>
              <OrderMaster />
            </OfficeProtectedRoute>
          }
        />
        <Route
          path="/office/setting-master"
          element={
            <OfficeProtectedRoute>
              <SettingMaster />
            </OfficeProtectedRoute>
          }
        />
        <Route
          path="/office/settings"
          element={
            <OfficeProtectedRoute>
              <SettingMaster />
            </OfficeProtectedRoute>
          }
        />
        <Route path="/office" element={<Navigate to="/office/dashboard" replace />} />
        <Route path="/office/*" element={<Navigate to="/office/dashboard" replace />} />

        {/* ========================================================
            Public Storefront Routes
            ======================================================== */}
        <Route
          path="/*"
          element={
            <AppProvider>
              <MainStoreApp />
            </AppProvider>
          }
        />
      </Routes>
  );
}
