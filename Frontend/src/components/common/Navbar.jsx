import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Search, ShoppingBag, User, Menu, X, ShieldCheck, Sparkles, Package } from 'lucide-react';
import logoImg from '../../assets/image.webp';

export default function Navbar() {
  const { cartCount, setIsCartOpen, setIsSearchOpen, isAgeVerified, isCustomerLoggedIn, customerUser, openAuthModal } = useApp();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll listener for glassmorphism transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/new-arrivals', label: 'New Arrivals' },
    { path: '/best-sellers', label: 'Best Sellers' },
    { path: '/catalog', label: 'All Products' },
    ...(isCustomerLoggedIn ? [{ path: '/orders', label: 'My Orders' }] : []),
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/90 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.06)]'
            : 'bg-white/75 backdrop-blur-md py-4.5 border-b border-slate-200/40 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Brand Logo */}
            <Link
              to="/"
              className="group flex items-center text-left focus:outline-none py-1"
              aria-label="Pharsyde Home"
            >
              <img
                src={logoImg}
                alt="PHARSYDE"
                className="h-8 sm:h-10 md:h-11 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-[0_2px_12px_rgba(142,247,5,0.45)]"
              />
            </Link>

            {/* Centre: Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 bg-slate-100/90 backdrop-blur-xl px-3 py-1.5 rounded-full border border-slate-200/80 shadow-inner">
              {navLinks.map((link) => {
                const isActive = link.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`group relative px-4 py-2 text-xs lg:text-[13px] font-semibold tracking-[0.14em] uppercase transition-all duration-200 rounded-full ${
                      isActive
                        ? 'text-slate-900 font-bold bg-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{link.label}</span>

                    {/* Active Underline in #8EF705 */}
                    <span
                      className={`absolute bottom-0.5 inset-x-3.5 h-[2.5px] rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-[#8EF705] shadow-[0_0_10px_#8EF705] opacity-100'
                          : 'bg-[#8EF705]/0 opacity-0 group-hover:opacity-40 group-hover:bg-[#8EF705]'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search catalogue"
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#8EF705] text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-md hover:scale-105 group cursor-pointer"
                title="Search Products"
              >
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              {/* Customer Account / Orders trigger */}
              {isCustomerLoggedIn ? (
                <Link
                  to="/account"
                  aria-label="My Account and Orders"
                  className="relative hidden sm:flex h-10 px-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#8EF705] text-slate-800 items-center gap-2 transition-all duration-200 shadow-xs hover:shadow-md group"
                  title={`Signed in as ${customerUser?.name || 'Customer'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#8EF705] ring-2 ring-[#8EF705]/40" />
                  <span className="text-xs font-bold max-w-[80px] truncate">{customerUser?.name?.split(' ')[0]}</span>
                  {Number(customerUser?.reward_points) > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-bold flex items-center gap-0.5" title={`${customerUser.reward_points} TechPOS Loyalty Points`}>
                      <span>⭐</span>
                      <span>{Math.floor(Number(customerUser.reward_points))}</span>
                    </span>
                  )}
                  <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900" />
                </Link>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  aria-label="Sign In or Register"
                  className="hidden sm:flex w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#8EF705] text-slate-700 hover:text-slate-900 items-center justify-center transition-all duration-200 shadow-xs hover:shadow-md hover:scale-105 group"
                  title="Sign In / Register"
                >
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              )}

              {/* Shopping Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label="View shopping bag"
                className="relative w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#8EF705] text-slate-900 flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-md hover:scale-105 group cursor-pointer"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4 group-hover:scale-110 text-slate-800 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-black text-black bg-[#8EF705] rounded-full shadow-md shadow-[#8EF705]/40 ring-2 ring-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-[#8EF705] flex items-center justify-center transition-colors shadow-xs"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-orange-600" /> : <Menu className="w-5 h-5 text-slate-800" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Animated Slide-in Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white border-l border-slate-200 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="pb-4 mb-6 border-b border-slate-200 flex items-center justify-between">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <img
                    src={logoImg}
                    alt="PHARSYDE"
                    className="h-8 w-auto object-contain drop-shadow-[0_2px_8px_rgba(142,247,5,0.4)]"
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-orange-600" />
                </button>
              </div>

              <nav className="space-y-2">
                {navLinks.map((link) => {
                  const isActive = link.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold tracking-wide flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-[#8EF705]/20 text-slate-900 font-bold border-l-4 border-[#8EF705]'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span>{link.label}</span>
                      {isActive && <span className="w-5 h-[3px] rounded-full bg-[#8EF705] shadow-[0_0_8px_#8EF705]" />}
                    </Link>
                  );
                })}

                {isCustomerLoggedIn ? (
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4 text-[#488203]" />
                    <span>My Orders</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#488203]" />
                    <span>Sign In / Register</span>
                  </button>
                )}

                <Link
                  to="/policy"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 block"
                >
                  Return & Warranty Policies
                </Link>
              </nav>
            </div>

            {/* Store Information in Mobile Drawer */}
            <div className="pt-6 border-t border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="text-slate-900 font-semibold">Pharsyde Retail Store</p>
              <p>117 Regent Ave W, Winnipeg, MB</p>
              <p className="text-[#599e03] font-bold">(204) 222-4753</p>
              <p className="text-[11px] text-slate-500">Open Daily • Regulated Manitoba Dispensary</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
