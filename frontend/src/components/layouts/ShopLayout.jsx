import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Search, User, Menu, X,
  FileText, LogOut, LayoutDashboard, ChevronDown,
  Phone, Mail, Facebook, Twitter, Instagram,
  ShieldCheck, Truck, Clock, RefreshCw
} from 'lucide-react';
import Logo from '../Logo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import BottomNav from './BottomNav';
import ToastContainer from '../ui/Toast';

const ShopLayout = () => {
  const { cartItems } = useCart();
  const { isLoggedIn, user, logout, homeRoute } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { label: 'Home',    path: '/shop' },
    { label: 'Catalog', path: '/shop/catalog' },
  ];

  return (
    <div className="shop-layout">
      <ToastContainer />

      {/* ── Sticky Navbar ── */}
      <nav className={`shop-navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="shop-navbar-inner">

          {/* Left: hamburger (mobile) + logo */}
          <div className="navbar-left">
            <button
              className="btn-icon show-mobile"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Logo to="/shop" />
          </div>

          {/* Centre: horizontal nav links (desktop) */}
          <div className="shop-nav-links hide-mobile">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`shop-nav-link${isActive(link.path) ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <>
                <Link
                  to="/shop/orders"
                  className={`shop-nav-link${isActive('/shop/orders') ? ' active' : ''}`}
                >
                  My Orders
                </Link>
                <Link
                  to="/shop/invoices"
                  className={`shop-nav-link${isActive('/shop/invoices') ? ' active' : ''}`}
                >
                  Invoices
                </Link>
              </>
            )}
          </div>

          {/* Centre: search bar */}
          <div className="shop-search hide-mobile">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
          </div>

          {/* Right: cart + auth */}
          <div className="navbar-right">
            {/* Cart */}
            <Link to="/shop/cart" className="cart-btn" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartItems.length > 0 && (
                <span className="cart-badge">{cartItems.length}</span>
              )}
            </Link>

            {/* User */}
            {isLoggedIn ? (
              <div style={{ position: 'relative' }} className="hide-mobile">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', gap: '6px' }}
                >
                  <User size={15} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    {user?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown size={12} style={{ opacity: 0.5 }} />
                </button>

                {userMenuOpen && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      width: '210px', padding: '6px 0',
                      boxShadow: 'var(--shadow-lg)', zIndex: 100,
                      border: '1px solid var(--border-base)'
                    }}
                  >
                    <Link to={homeRoute} className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    {user?.role === 'buyer' && (
                      <>
                        <Link to="/shop/orders" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FileText size={15} /> My Orders
                        </Link>
                        <Link to="/shop/invoices" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FileText size={15} /> Invoices
                        </Link>
                        <Link to="/shop/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <User size={15} /> Profile
                        </Link>
                      </>
                    )}
                    <div style={{ height: '1px', background: 'var(--border-base)', margin: '4px 0' }} />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="dropdown-item"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary hide-mobile" style={{ padding: '8px 18px', fontSize: '13px' }}>
                <User size={15} /> Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search row */}
        <div className="mobile-search-row show-mobile">
          <div className="shop-search" style={{ flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input type="text" placeholder="Search products…" />
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-down menu ── */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/shop" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/shop/catalog" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
            Catalog
          </Link>
          {isLoggedIn ? (
            <>
              <div style={{ height: '1px', background: 'var(--border-base)', margin: '6px 0' }} />
              <Link to={homeRoute} className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              {user?.role === 'buyer' && (
                <>
                  <Link to="/shop/orders" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                    <FileText size={16} /> My Orders
                  </Link>
                  <Link to="/shop/profile" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                    <User size={16} /> Profile
                  </Link>
                </>
              )}
              <button className="mobile-menu-item mobile-menu-logout" onClick={() => { logout(); setMenuOpen(false); }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
              <User size={16} /> Sign In
            </Link>
          )}
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="shop-main">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="shop-footer">
        <div className="container-fluid">
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ marginBottom: '14px' }}>
                <Logo to="/shop" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '280px', marginBottom: '16px' }}>
                Premium B2B e-commerce for MSMEs. Wholesale ordering with automated GST invoicing and 15-day payment terms.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                  <a key={i} href="#" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.65)' }}>
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>Quick Links</h4>
              <div className="footer-links">
                {[
                  { label: 'Home', path: '/shop' },
                  { label: 'Catalog', path: '/shop/catalog' },
                  { label: 'My Orders', path: '/shop/orders' },
                  { label: 'My Invoices', path: '/shop/invoices' },
                  { label: 'Cart', path: '/shop/cart' },
                ].map(({ label, path }) => (
                  <Link key={path} to={path}>{label}</Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>Categories</h4>
              <div className="footer-links" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>
                {['Ice Cream & Desserts', 'Frozen Vegetables', 'Dairy & Cheese', 'Bakery Supplies', 'FMCG Products'].map(cat => (
                  <a key={cat} href={`/shop/catalog?category=${cat}`}>{cat}</a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>
                  <Phone size={14} style={{ flexShrink: 0, color: 'var(--color-brand)' }} />
                  +91 98765 43210
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>
                  <Mail size={14} style={{ flexShrink: 0, color: 'var(--color-brand)' }} />
                  support@bizflow.in
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>Compliance</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>
                  <span>✓ 15-Day Payment Terms</span>
                  <span>✓ GST Invoicing</span>
                  <span>✓ E-Way Bills</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-copy">
            © {new Date().getFullYear()} BizFlow Platform. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Nav ── */}
      <BottomNav />
    </div>
  );
};

export default ShopLayout;
