import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'; // L-5: global error boundary

// Layouts
import ShopLayout  from './components/layouts/ShopLayout';
import AdminLayout from './components/layouts/AdminLayout';

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

// Public Pages — no longer needed; ShopHome handles public mode via useParams
// import PublicStore from './pages/public/PublicStore';

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

              {/* Root → If Custom Domain, show their public store, else redirect to login */}
              {isCustomDomain ? (
                <Route path="/" element={<ShopLayout />}>
                  <Route index element={<ShopHome />} />
                  <Route path="register" element={<BuyerRegister />} />
                </Route>
              ) : (
                <Route path="/" element={<Navigate to="/login" replace />} />
              )}
              
              {/* Public Storefront — /store/:storeName — No auth required */}
              {/* ShopHome auto-detects isPublic via useParams storeName */}
              <Route path="/store/:storeName" element={<ShopLayout />}>
                <Route index element={<ShopHome />} />
                <Route path="register" element={<BuyerRegister />} />
              </Route>

              {/* ─── Login (publicOnly: logged-in users auto-redirected to their home) ─── */}
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

              {/* ─── Buyer Storefront (only buyer role) ─── */}
              <Route
                path="/shop"
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <ShopLayout />
                  </ProtectedRoute>
                }
              >
                <Route index           element={<ShopHome />} />
                <Route path="catalog"  element={<ProductCatalog />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="cart"     element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders"   element={<BuyerOrders />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="purchase-orders" element={<BuyerPurchaseOrders />} />
                <Route path="invoices" element={<BuyerInvoices />} />
                <Route path="profile"  element={<BuyerProfile />} />
              </Route>

              {/* ─── Supplier / Admin (only admin, supplier roles) ─── */}
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

              {/* ─── Delivery Staff (admin, delivery, staff roles) ─── */}
              <Route
                path="/delivery"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'delivery', 'staff']}>
                    <DeliveryDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ─── Developer (only developer role) ─── */}
              <Route
                path="/developer"
                element={
                  <ProtectedRoute allowedRoles={['developer']}>
                    <DeveloperDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all → login */}
              <Route path="*" element={<Navigate to="/login" replace />} />

            </Routes>
          </Router>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
