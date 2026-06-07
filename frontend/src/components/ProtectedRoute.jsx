import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import Loader from './ui/Loader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ height: '100vh' }}><Loader /></div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If the user's role is not in the allowed list, redirect to their default home
    return <Navigate to={ROLE_HOME[role] || '/shop'} replace />;
  }

  return children;
};

export default ProtectedRoute;
