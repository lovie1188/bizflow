import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'; // L-5: global error boundary

// Layouts
import ShopLayout  from './components/layouts/ShopLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Platform Pages — public, no auth required
import PlatformLanding  from './pages/platform/PlatformLanding';
import Marketplace      from './pages/platform/Marketplace';
import SupplierRegister from './pages/platform/SupplierRegister';

// Shop Pages
import ShopHome             from './pages/shop/ShopHome';
import ProductCatalog       from './pages/shop/ProductCatalog';
import ProductDetail        from './pages/shop/ProductDetail';
import Cart                 from './pages/shop/Cart';
import Checkout             from './pages/shop/Checkout';
import Login                from './pages/shop/Login';
import BuyerRegister        from './pages/shop/BuyerRegister';
import BuyerOrders          from './pages/shop/BuyerOrders';
import OrderDetails         from './pages/shop/OrderDetails';
import BuyerInvoices        from './pages/shop/BuyerInvoices';
import BuyerProfile         from './pages/shop/BuyerProfile';
import BuyerPurchaseOrders  from './pages/shop/BuyerPurchaseOrders';
import ForgotPassword       from './pages/shop/ForgotPassword';
import ResetPassword        from './pages/shop/ResetPassword';

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

// Developer Pages
import DeveloperDashboard from './pages/developer/DeveloperDashboard';

import { CartProvider }   from './context/CartContext';
import { AuthProvider }   from './context/AuthContext';
import { ToastProvider }  from './context/ToastContext';
import ProtectedRoute     from './components/ProtectedRoute';


function App() {
  // Detect Custom Domain mapping (anything other than localhost or bizflow.in)
  const hostname = window.location.hostname;
  const isCustomDomain = hostname !== 'localhost' && !hostname.includes('bizflow.in');

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>

              {/* ─── Root ───────────────────────────────────────────────────── */}
              {/* Custom domain → show that supplier's store */}
              {/* Platform domain → show BizFlow landing page */}
              {isCustomDomain ? (
                <Route path="/" element={<ShopLayout />}>
                  <Route index element={<ShopHome />} />
                  <Route path="register" element={<BuyerRegister />} />
                </Route>
              ) : (
                <Route path="/" element={<PlatformLanding />} />
              )}

              {/* ─── Platform Public Pages (no auth) ────────────────────────── */}
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/supplier-register" element={<ShopLayout />}>
                <Route index element={<SupplierRegister />} />
              </Route>

              {/* ─── Public Supplier Storefront — /store/:storeName ─────────── */}
              {/* Full public browsing: homepage, catalog, product detail */}
              <Route path="/store/:storeName" element={<ShopLayout />}>
                <Route index           element={<ShopHome />} />
                <Route path="catalog"  element={<ProductCatalog />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="register" element={<BuyerRegister />} />
              </Route>

              {/* ─── Standalone Buyer Register ───────────────────────────────── */}
              <Route path="/buyer-register" element={<ShopLayout />}>
                <Route index element={<BuyerRegister />} />
              </Route>

              {/* ─── Forgot / Reset Password (public) ───────────────────────── */}
              <Route path="/forgot-password" element={<ShopLayout />}>
                <Route index element={<ForgotPassword />} />
              </Route>
              <Route path="/reset-password" element={<ShopLayout />}>
                <Route index element={<ResetPassword />} />
              </Route>

              {/* ─── Login (publicOnly: logged-in users → their home) ────────── */}
              <Route
                path="/login"
                element={
                  <ProtectedRoute publicOnly>
                    <ShopLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Login />} />
              </Route>

              {/* ─── Buyer Storefront (buyer role only) ──────────────────────── */}
              <Route
                path="/shop"
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <ShopLayout />
                  </ProtectedRoute>
                }
              >
                <Route index                element={<ShopHome />} />
                <Route path="catalog"       element={<ProductCatalog />} />
                <Route path="product/:id"   element={<ProductDetail />} />
                <Route path="cart"          element={<Cart />} />
                <Route path="checkout"      element={<Checkout />} />
                <Route path="orders"        element={<BuyerOrders />} />
                <Route path="orders/:id"    element={<OrderDetails />} />
                <Route path="purchase-orders" element={<BuyerPurchaseOrders />} />
                <Route path="invoices"      element={<BuyerInvoices />} />
                <Route path="profile"       element={<BuyerProfile />} />
              </Route>

              {/* ─── Supplier / Admin ────────────────────────────────────────── */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supplier']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index             element={<AdminDashboard />} />
                <Route path="orders"     element={<AdminOrders />} />
                <Route path="products"   element={<AdminProducts />} />
                <Route path="buyers"     element={<AdminBuyers />} />
                <Route path="invoices"   element={<AdminInvoices />} />
                <Route path="staff"      element={<AdminStaff />} />
                <Route path="settings"   element={<AdminSettings />} />
              </Route>

              {/* ─── Delivery Staff ──────────────────────────────────────────── */}
              <Route
                path="/delivery"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'delivery', 'staff']}>
                    <DeliveryDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ─── Developer ───────────────────────────────────────────────── */}
              <Route
                path="/developer"
                element={
                  <ProtectedRoute allowedRoles={['developer']}>
                    <DeveloperDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all → landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </Router>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

