import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import AgeGateModal from './components/common/AgeGateModal';
import ToastContainer from './components/common/ToastContainer';

// Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CannabisPage from './pages/CannabisPage';
import NicotineVapePage from './pages/NicotineVapePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CheckoutPage from './pages/CheckoutPage';
import PolicyPage from './pages/PolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

function MainApp() {
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
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
