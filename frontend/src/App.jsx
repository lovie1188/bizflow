import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import ShopLayout  from './components/layouts/ShopLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Shop Pages
import ShopHome      from './pages/shop/ShopHome';
import ProductCatalog from './pages/shop/ProductCatalog';
import ProductDetail  from './pages/shop/ProductDetail';
import Cart          from './pages/shop/Cart';
import Checkout      from './pages/shop/Checkout';
import Login         from './pages/shop/Login';
import BuyerRegister from './pages/shop/BuyerRegister';
import BuyerOrders   from './pages/shop/BuyerOrders';
import OrderDetails  from './pages/shop/OrderDetails';
import BuyerInvoices from './pages/shop/BuyerInvoices';
import BuyerProfile  from './pages/shop/BuyerProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders    from './pages/admin/AdminOrders';
import AdminProducts  from './pages/admin/AdminProducts';
import AdminBuyers    from './pages/admin/AdminBuyers';
import AdminInvoices  from './pages/admin/AdminInvoices';
import AdminSettings  from './pages/admin/AdminSettings';
import AdminStaff     from './pages/admin/AdminStaff';

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Root → Storefront */}
          <Route path="/" element={<Navigate to="/shop" replace />} />

          {/* ─── Unified Login (top-level, accessible from everywhere) ─── */}
          <Route path="/login" element={<ShopLayout />}>
            <Route index element={<Login />} />
          </Route>

          {/* ─── Buyer Storefront ─── */}
          <Route path="/shop" element={<ShopLayout />}>
            <Route index          element={<ProductCatalog />} />
            <Route path="catalog" element={<ProductCatalog />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart"    element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="login"    element={<Login />} />
            <Route path="register" element={<BuyerRegister />} />
            <Route path="orders"   element={<BuyerOrders />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="invoices" element={<BuyerInvoices />} />
            <Route path="profile"  element={<BuyerProfile />} />
          </Route>

          {/* ─── Supplier Admin ─── */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index             element={<AdminDashboard />} />
            <Route path="orders"     element={<AdminOrders />} />
            <Route path="products"   element={<AdminProducts />} />
            <Route path="buyers"     element={<AdminBuyers />} />
            <Route path="invoices"   element={<AdminInvoices />} />
            <Route path="staff"      element={<AdminStaff />} />
            <Route path="settings"   element={<AdminSettings />} />
          </Route>

          {/* ─── Delivery Staff ─── */}
          <Route path="/delivery" element={<DeliveryDashboard />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
