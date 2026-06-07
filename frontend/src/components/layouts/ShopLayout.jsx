import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Package, FileText, LogOut, LayoutDashboard } from 'lucide-react';
import Logo from '../Logo';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const ShopLayout = () => {
  const { cartItems } = useCart();
  const { isLoggedIn, user, logout, homeRoute } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="shop-layout">

      {/* ── Top Navbar ── */}
      <nav className="shop-navbar glass-panel">
        <div className="shop-navbar-inner container">

          {/* Left: hamburger (mobile) + logo */}
          <div className="navbar-left">
            <button
              className="btn-icon show-mobile"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              style={{ marginRight: '8px' }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Logo to="/shop" />
          </div>

          {/* Centre: search (hidden on mobile) */}
          <div className="shop-search hide-mobile">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Search products…" />
          </div>

          {/* Right: cart + auth */}
          <div className="navbar-right">
            <Link to="/shop/cart" className="cart-btn" aria-label="Cart">
              <ShoppingCart size={22} />
              {cartItems.length > 0 && (
                <span className="cart-badge">{cartItems.length}</span>
              )}
            </Link>

            {isLoggedIn ? (
              <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to={homeRoute} style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 500 }}>
                  {user?.name || 'Dashboard'}
                </Link>
                <button onClick={logout} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }}>
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary hide-mobile" style={{ padding: '7px 14px', fontSize: '13px' }}>
                <User size={15} /> Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search row */}
        <div className="mobile-search-row show-mobile">
          <div className="shop-search" style={{ flex: 1 }}>
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search products…" />
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-down menu ── */}
      {menuOpen && (
        <div className="mobile-menu glass-panel">
          {isLoggedIn ? (
            <>
              <Link to={homeRoute} className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link to="/shop/orders" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <FileText size={18} /> My Orders
              </Link>
              <Link to="/shop/profile" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                <User size={18} /> Profile
              </Link>
              <button className="mobile-menu-item mobile-menu-logout" onClick={() => { logout(); setMenuOpen(false); }}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
              <User size={18} /> Sign In
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
        <div className="container">
          <div className="footer-grid">
            <div>
              <h3 style={{ marginBottom: '12px' }}>BizFlow</h3>
              <p>Premium B2B E-commerce for MSMEs. Wholesale ordering with automated GST and compliance.</p>
            </div>
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <li>Ice Cream &amp; Desserts</li>
                <li>Frozen Vegetables</li>
                <li>Dairy &amp; Cheese</li>
                <li>Bakery Supplies</li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compliance</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <li>15-Day Payment Terms</li>
                <li>GST Invoicing</li>
                <li>E-Way Bills</li>
              </ul>
            </div>
          </div>
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} BizFlow Platform. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="mobile-bottom-nav">
        <Link to="/shop/catalog" className={`mobile-nav-item ${isActive('/shop/catalog') || isActive('/shop') ? 'active' : ''}`}>
          <Package size={22} />
          <span>Catalog</span>
        </Link>
        <Link to="/shop/cart" className={`mobile-nav-item ${isActive('/shop/cart') ? 'active' : ''}`} style={{ position: 'relative' }}>
          <ShoppingCart size={22} />
          {cartItems.length > 0 && <span className="mobile-nav-badge">{cartItems.length}</span>}
          <span>Cart</span>
        </Link>
        <Link to="/shop/orders" className={`mobile-nav-item ${isActive('/shop/orders') ? 'active' : ''}`}>
          <FileText size={22} />
          <span>Orders</span>
        </Link>
        <Link to="/shop/profile" className={`mobile-nav-item ${isActive('/shop/profile') ? 'active' : ''}`}>
          <User size={22} />
          <span>Profile</span>
        </Link>
      </nav>

    </div>
  );
};

export default ShopLayout;
