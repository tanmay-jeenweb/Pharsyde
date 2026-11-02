import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import AgeGateModal from './components/common/AgeGateModal';
import ToastContainer from './components/common/ToastContainer';

// Storefront Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CannabisPage from './pages/CannabisPage';
import NicotineVapePage from './pages/NicotineVapePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import PolicyPage from './pages/PolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// Office Portal Components & Pages (Green Theme / Reference from ERP)
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

function MainStoreApp() {
  const { currentPage } = useApp();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'catalog':
      case 'products':
      case 'shop':
        return <CatalogPage />;
      case 'cannabis':
        return <CannabisPage />;
      case 'nicotine':
        return <NicotineVapePage />;
      case 'product-detail':
        return <ProductDetailsPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'policy':
        return <PolicyPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#8EF705] selection:text-black">
      {/* 19+ Age Gate Compliance Modal */}
      <AgeGateModal />

      {/* Floating / Sticky Navigation Bar */}
      <Navbar />

      {/* Dynamic Main View */}
      <main className="flex-grow">
        {renderCurrentPage()}
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
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
