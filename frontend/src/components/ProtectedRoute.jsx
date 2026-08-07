import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import Loader from './ui/Loader';

/**
 * ProtectedRoute — True RBAC guard
 *
 * allowedRoles: if provided, only those roles can access this route.
 *               If user is logged in but role doesn't match, redirect to their own home.
 * publicOnly:   if true (login/register pages), redirect logged-in users to their home.
 */
const ProtectedRoute = ({ children, allowedRoles, publicOnly = false }) => {
  const { isLoggedIn, role, loading } = useAuth();
  const location = useLocation();

  // Show full-screen loader while auth state is initializing
  if (loading) {
    return <div style={{ height: '100vh' }}><Loader /></div>;
  }

  // ── Public-only pages (Login, Register) ──────────────────────
  // Logged-in users must not access these; send them to their home
  if (publicOnly && isLoggedIn) {
    const home = ROLE_HOME[role] || '/shop/catalog';
    return <Navigate to={home} replace />;
  }

  // ── Protected pages ──────────────────────────────────────────
  // 1. Not logged in → go to login
  if (!publicOnly && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Logged in but wrong role → redirect to own home
  if (allowedRoles && isLoggedIn && !allowedRoles.includes(role)) {
    const home = ROLE_HOME[role] || '/shop/catalog';
    return <Navigate to={home} replace />;
  }

  return children;
};

export default ProtectedRoute;
