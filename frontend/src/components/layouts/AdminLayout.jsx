import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  FileText, Settings, LogOut, Bell, Menu, X,
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../utils/api';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin',          icon: <LayoutDashboard size={18} /> },
  { name: 'Orders',    path: '/admin/orders',   icon: <ShoppingBag size={18} /> },
  { name: 'Products',  path: '/admin/products', icon: <Package size={18} /> },
  { name: 'Buyers',    path: '/admin/buyers',   icon: <Users size={18} /> },
  { name: 'Invoices',  path: '/admin/invoices', icon: <FileText size={18} /> },
  { name: 'Staff',     path: '/admin/staff',    icon: <Shield size={18} /> },
  { name: 'Settings',  path: '/admin/settings', icon: <Settings size={18} /> },
];

const AdminLayout = () => {
  const location = useLocation();
  const { user, company, logout, isLoggedIn, isSupplier, updateCompany } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile: drawer open/closed
  const [collapsed, setCollapsed]     = useState(false);   // desktop: icon-only mode
  const [isMobile, setIsMobile]       = useState(window.innerWidth <= 768);

  // Derived display values
  const displayName  = company?.name  || user?.name  || 'Admin';
  const displayEmail = user?.email    || '';
  const initials     = displayName.charAt(0).toUpperCase();

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn || !isSupplier) window.location.href = '/login';
  }, [isLoggedIn, isSupplier]);

  // Refresh company info on mount (fixes stale localStorage)
  useEffect(() => {
    if (!isLoggedIn || !isSupplier) return;
    fetchApi('/companies/settings')
      .then(data => { if (data?.name) updateCompany(data); })
      .catch(() => {});
  }, [isLoggedIn, isSupplier]);

  // Responsive resize
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) { setSidebarOpen(false); setCollapsed(false); }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close drawer on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div className="admin-shell">

      {/* ── Mobile overlay ── */}
      {isMobile && sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          'admin-sidebar',
          collapsed && !isMobile ? 'collapsed' : '',
          isMobile && sidebarOpen ? 'mobile-open' : '',
        ].join(' ')}
      >
        {/* Logo row */}
        <div className="sidebar-logo-row">
          {(!collapsed || isMobile) && <Logo to="/admin" />}
          {isMobile ? (
            <button className="btn-icon" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          ) : (
            <button className="btn-icon sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.name}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              title={collapsed && !isMobile ? item.name : ''}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="item-label">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-item sidebar-logout" onClick={logout}>
            <span className="sidebar-icon"><LogOut size={18} /></span>
            <span className="item-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="admin-main">

        {/* Header */}
        <header className="admin-header">
          <div className="flex-center" style={{ gap: '12px' }}>
            <button
              className="btn-icon"
              onClick={() => isMobile ? setSidebarOpen(o => !o) : setCollapsed(c => !c)}
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
            <span className="hide-mobile admin-page-title">{displayName}</span>
          </div>

          <div className="admin-header-right">
            <Link to="/shop" className="hide-mobile" style={{ color: 'var(--color-secondary)', fontSize: '13px', fontWeight: 500 }}>
              View Storefront
            </Link>

            <button className="btn-icon" style={{ position: 'relative' }} aria-label="Notifications">
              <Bell size={18} />
            </button>

            <div className="admin-user-chip">
              <div className="admin-avatar">{initials}</div>
              <div className="hide-mobile">
                <div style={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.2 }}>{displayName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{displayEmail}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="admin-content page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
