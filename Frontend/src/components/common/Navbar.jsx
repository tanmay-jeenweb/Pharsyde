import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Search, ShoppingBag, User, Menu, X, Package, ChevronDown } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { CANNABIS_CATEGORIES, NICOTINE_CATEGORIES } from '../../data/categories';

// Categories to show in the dropdown menu (nicely formatted labels)
const CANNABIS_DROPDOWN = [
  { key: 'Dried Flower',                     label: 'Dried Flower' },
  { key: 'PRE-ROLLED',                       label: 'Pre-Rolled' },
  { key: 'FORTIFIED PRE-ROLLED',             label: 'Fortified Pre-Rolled' },
  { key: 'CARTRIDGE 510',                    label: 'Cartridges 510' },
  { key: 'Vape',                             label: 'Vape' },
  { key: 'Disposable Vapes',                 label: 'Disposable Vapes' },
  { key: 'Extracts Inhaled',                 label: 'Extracts (Inhaled)' },
  { key: 'Extracts Ingested',                label: 'Extracts (Ingested)' },
  { key: 'Edibles-Candy/Chocolate/Confec',   label: 'Edibles – Candy & Chocolate' },
  { key: 'Edibles-Beverages Dried',          label: 'Edibles – Beverages (Dry)' },
  { key: 'Edibles-Beverages Liquid',         label: 'Edibles – Beverages (Liquid)' },
  { key: 'THC POUCHES',                      label: 'THC Pouches' },
  { key: 'KIEF',                             label: 'Kief' },
  { key: 'MILLED/BLENDED',                   label: 'Milled / Blended' },
  { key: 'Topical Products',                 label: 'Topical Products' },
  { key: 'CANNABIS PLANT SEEDS',             label: 'Plant Seeds' },
];

const NICOTINE_DROPDOWN = [
  { key: 'Nicotine Vapes',              label: 'Nicotine Vapes' },
  { key: 'Nicotine Closed Pods',        label: 'Closed Pod Systems' },
  { key: 'Nicotine E-Juice',            label: 'E-Juice / Salt Nic' },
  { key: 'NICOTINE POUCHES / SNUS',     label: 'Pouches & Snus' },
  { key: 'vapes & e-juices',            label: 'Vapes & E-Juices' },
  { key: 'vaping accessories',          label: 'Vaping Accessories' },
];

/** Splits an array into chunks of `size` */
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

/** Reusable category dropdown menu — multi-column, max 5 items per col */
function CategoryDropdown({ items, basePath, onSelect }) {
  const columns = chunkArray(items, 5);

  return (
    <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-150">
      {/* Arrow */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-t border-l border-slate-200/80 shadow-sm" />
      <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 py-3 px-2">
        {/* "All" option — spans full width */}
        <Link
          to={basePath}
          onClick={onSelect}
          className="flex items-center px-3 py-1.5 mb-1 text-xs font-bold text-[#0166dc] uppercase tracking-widest hover:bg-[#0166dc]/8 rounded-lg transition-colors whitespace-nowrap"
        >
          All Products
        </Link>
        <div className="mx-2 mb-2 border-t border-slate-100" />
        {/* Category columns */}
        <div className="flex gap-1">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className={`flex flex-col ${colIdx < columns.length - 1 ? 'border-r border-slate-100 pr-1 mr-1' : ''}`}>
              {col.map(({ key, label }) => (
                <Link
                  key={key}
                  to={`${basePath}?category=${encodeURIComponent(key)}`}
                  onClick={onSelect}
                  className="px-3 py-2 text-[13px] font-medium text-slate-700 hover:text-[#0166dc] hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Desktop nav item — simple link or link+dropdown */
function NavItem({ link, isActive, dropdownItems, basePath }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timeoutRef = useRef(null);

  const hasDropdown = dropdownItems && dropdownItems.length > 0;

  const openMenu = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const closeMenu = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!hasDropdown) {
    return (
      <Link
        to={link.path}
        className={`group relative px-4 sm:px-5 py-2 text-sm lg:text-[15px] font-semibold tracking-wide uppercase whitespace-nowrap transition-all duration-200 rounded-full shrink-0 ${
          isActive
            ? 'text-slate-900 bg-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
      >
        <span>{link.label}</span>
        <span
          className={`absolute bottom-1 inset-x-4 h-[2px] rounded-full transition-all duration-300 ${
            isActive
              ? 'bg-[#0166dc] shadow-[0_0_8px_#0166dc] opacity-100'
              : 'bg-[#0166dc]/0 opacity-0 group-hover:opacity-40 group-hover:bg-[#0166dc]'
          }`}
        />
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <Link
        to={link.path}
        className={`group relative flex items-center gap-1 px-4 sm:px-5 py-2 text-sm lg:text-[15px] font-semibold tracking-wide uppercase whitespace-nowrap transition-all duration-200 rounded-full shrink-0 ${
          isActive
            ? 'text-slate-900 bg-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
      >
        <span>{link.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        <span
          className={`absolute bottom-1 inset-x-4 h-[2px] rounded-full transition-all duration-300 ${
            isActive
              ? 'bg-[#0166dc] shadow-[0_0_8px_#0166dc] opacity-100'
              : 'bg-[#0166dc]/0 opacity-0 group-hover:opacity-40 group-hover:bg-[#0166dc]'
          }`}
        />
      </Link>

      {open && (
        <CategoryDropdown
          items={dropdownItems}
          basePath={basePath || link.path}
          onSelect={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export default function Navbar() {
  const { cartCount, setIsCartOpen, setIsSearchOpen, isCustomerLoggedIn, customerUser, openAuthModal } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCannabisOpen, setMobileCannabisOpen] = useState(false);
  const [mobileNicotineOpen, setMobileNicotineOpen] = useState(false);

  // Scroll listener for glassmorphism transition
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/cannabis', label: 'Cannabis', dropdown: CANNABIS_DROPDOWN },
    { path: '/nicotine', label: 'Nicotine', dropdown: NICOTINE_DROPDOWN },
    ...(isCustomerLoggedIn ? [{ path: '/orders', label: 'My Orders' }] : []),
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/90 py-3 sm:py-3.5 shadow-[0_4px_24px_rgba(15,23,42,0.06)]'
            : 'bg-white/85 backdrop-blur-md py-4 sm:py-5 border-b border-slate-200/50 shadow-xs'
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-14">
          <div className="flex items-center justify-between gap-6 sm:gap-8">
            {/* Left: Brand Logo */}
            <Link
              to="/"
              className="group flex items-center text-left focus:outline-none shrink-0 py-0.5"
              aria-label="Pharsyde Home"
            >
              <img
                src={logoImg}
                alt="PHARSYDE"
                className="h-9 sm:h-10 md:h-11 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-[0_2px_12px_rgba(1,102,220,0.35)]"
              />
            </Link>

            {/* Centre: Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 sm:space-x-1.5 bg-slate-100/90 backdrop-blur-xl px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/80 shadow-inner">
              {navLinks.map((link) => {
                const isActive = link.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path);
                return (
                  <NavItem
                    key={link.path}
                    link={link}
                    isActive={isActive}
                    dropdownItems={link.dropdown}
                    basePath={link.path}
                  />
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2.5 sm:space-x-3.5">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search catalogue"
                className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0166dc] text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-md hover:scale-105 group cursor-pointer"
                title="Search Products"
              >
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>

              {/* Customer Account / Orders trigger */}
              {isCustomerLoggedIn ? (
                <Link
                  to="/account"
                  aria-label="My Account and Orders"
                  className="relative hidden sm:flex h-10 px-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0166dc] text-slate-800 items-center gap-2 transition-all duration-200 shadow-xs hover:shadow-md group"
                  title={`Signed in as ${customerUser?.name || 'Customer'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#0166dc] ring-2 ring-[#0166dc]/40" />
                  <span className="text-xs font-bold truncate">{customerUser?.name?.split(' ')[0]}</span>
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
                  className="hidden sm:flex w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0166dc] text-slate-700 hover:text-slate-900 items-center justify-center transition-all duration-200 shadow-xs hover:shadow-md hover:scale-105 group"
                  title="Sign In / Register"
                >
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              )}

              {/* Shopping Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label="View shopping bag"
                className="relative w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0166dc] text-slate-900 flex items-center justify-center transition-all duration-200 shadow-xs hover:shadow-md hover:scale-105 group cursor-pointer"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4 group-hover:scale-110 text-slate-800 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-black text-white bg-[#0166dc] rounded-full shadow-md shadow-[#0166dc]/40 ring-2 ring-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="lg:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-[#0166dc] flex items-center justify-center transition-colors shadow-xs"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-orange-600" /> : <Menu className="w-5 h-5 text-slate-800" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Animated Slide-in Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white border-l border-slate-200 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div>
              <div className="pb-4 mb-6 border-b border-slate-200 flex items-center justify-between">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <img
                    src={logoImg}
                    alt="PHARSYDE"
                    className="h-8 w-auto object-contain drop-shadow-[0_2px_8px_rgba(1,102,220,0.35)]"
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

              <nav className="space-y-1">
                {/* Home */}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold tracking-wide flex items-center justify-between transition-all ${
                    location.pathname === '/'
                      ? 'bg-[#0166dc]/10 text-[#0166dc] font-bold border-l-4 border-[#0166dc]'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Home</span>
                </Link>

                {/* Cannabis with sub-categories */}
                <div>
                  <button
                    onClick={() => setMobileCannabisOpen((p) => !p)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold tracking-wide flex items-center justify-between transition-all ${
                      location.pathname.startsWith('/cannabis')
                        ? 'bg-[#0166dc]/10 text-[#0166dc] font-bold border-l-4 border-[#0166dc]'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>Cannabis</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileCannabisOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileCannabisOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-[#0166dc]/20 pl-3">
                      <Link
                        to="/cannabis"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-[#0166dc] rounded-lg hover:bg-[#0166dc]/8 transition-colors"
                      >
                        All Cannabis
                      </Link>
                      {CANNABIS_DROPDOWN.map(({ key, label }) => (
                        <Link
                          key={key}
                          to={`/cannabis?category=${encodeURIComponent(key)}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nicotine with sub-categories */}
                <div>
                  <button
                    onClick={() => setMobileNicotineOpen((p) => !p)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold tracking-wide flex items-center justify-between transition-all ${
                      location.pathname.startsWith('/nicotine')
                        ? 'bg-[#0166dc]/10 text-[#0166dc] font-bold border-l-4 border-[#0166dc]'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>Nicotine</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileNicotineOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileNicotineOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-[#0166dc]/20 pl-3">
                      <Link
                        to="/nicotine"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm font-bold text-[#0166dc] rounded-lg hover:bg-[#0166dc]/8 transition-colors"
                      >
                        All Nicotine
                      </Link>
                      {NICOTINE_DROPDOWN.map(({ key, label }) => (
                        <Link
                          key={key}
                          to={`/nicotine?category=${encodeURIComponent(key)}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remaining links */}
                {isCustomerLoggedIn ? (
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4 text-[#0166dc]" />
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
                    <User className="w-4 h-4 text-[#0166dc]" />
                    <span>Sign In / Register</span>
                  </button>
                )}

                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold tracking-wide flex items-center justify-between transition-all ${
                    location.pathname.startsWith('/contact')
                      ? 'bg-[#0166dc]/10 text-[#0166dc] font-bold border-l-4 border-[#0166dc]'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Contact
                </Link>

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
              <p className="text-[#0166dc] font-bold">(204) 222-4753</p>
              <p className="text-[11px] text-slate-500">Open Daily • Regulated Manitoba Dispensary</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
