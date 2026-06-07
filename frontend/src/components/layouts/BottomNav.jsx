import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Package, FileText, User, LayoutDashboard, Store } from 'lucide-react';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const isAdminView = location.pathname.startsWith('/admin');

  if (isAdminView) {
    return (
      <nav className="bottom-nav">
        <NavLink to="/admin" end className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={22} className="icon" />
          <span className="label">Dashboard</span>
        </NavLink>
        <NavLink to="/admin/products" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Package size={22} className="icon" />
          <span className="label">Products</span>
        </NavLink>
        <NavLink to="/admin/orders" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={22} className="icon" />
          <span className="label">Orders</span>
        </NavLink>
        <NavLink to="/shop" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Store size={22} className="icon" />
          <span className="label">Store</span>
        </NavLink>
      </nav>
    );
  }

  return (
    <nav className="bottom-nav">
      <NavLink to="/shop/catalog" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Package size={22} className="icon" />
        <span className="label">Shop</span>
      </NavLink>

      <NavLink to="/shop/cart" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingCart size={22} className="icon" />
        <span className="label">Cart</span>
      </NavLink>

      <NavLink to="/shop/orders" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <FileText size={22} className="icon" />
        <span className="label">Orders</span>
      </NavLink>

      <NavLink to="/shop/profile" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User size={22} className="icon" />
        <span className="label">Profile</span>
      </NavLink>

      {isAdmin && (
        <NavLink to="/admin" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={22} className="icon" />
          <span className="label">Admin</span>
        </NavLink>
      )}
    </nav>
  );
};

export default BottomNav;
