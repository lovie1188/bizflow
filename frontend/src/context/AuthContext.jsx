import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchApi, clearAuth, getStoredUser, getStoredCompany } from '../utils/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/**
 * Role → redirect path mapping
 * Roles: admin (supplier), buyer, delivery, developer (hidden)
 */
export const ROLE_HOME = {
  admin:     '/admin',
  supplier:  '/admin',
  buyer:     '/shop/catalog',
  delivery:  '/delivery',
  staff:     '/delivery',
  developer: '/developer',
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(getStoredUser);
  const [company, setCompany] = useState(getStoredCompany);
  const [loading, setLoading] = useState(false);

  // Derived state
  const isLoggedIn     = !!user;
  const role           = user?.role || 'public';
  const isSupplier     = role === 'admin' || role === 'supplier';
  const isBuyer        = role === 'buyer';
  const isDelivery     = role === 'delivery';
  const isDeveloper    = role === 'developer';
  const needsSetup     = isSupplier && company && !company.setup_complete;
  const homeRoute      = ROLE_HOME[role] || '/shop';

  // ── Login ────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: { email, password }, // M-6: fetchApi handles JSON.stringify internally
      });

      const userData    = data.user;
      const companyData = data.company || null;

      // Persist
      localStorage.setItem('bizflow_token',   data.token);
      localStorage.setItem('bizflow_user',    JSON.stringify(userData));
      if (companyData) {
        localStorage.setItem('bizflow_company', JSON.stringify(companyData));
      }

      setUser(userData);
      setCompany(companyData);

      return { success: true, user: userData, company: companyData };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setCompany(null);
    window.location.href = '/login';
  }, []);

  // ── Complete initial setup ────────────────────────────────────
  const completeSetup = useCallback(async (setupData) => {
    setLoading(true);
    try {
      const data = await fetchApi('/auth/setup', {
        method: 'POST',
        body: setupData, // M-6: fetchApi handles JSON.stringify internally
      });
      const updatedCompany = { ...company, ...data.company, setup_complete: true };
      localStorage.setItem('bizflow_company', JSON.stringify(updatedCompany));
      setCompany(updatedCompany);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [company]);

  // ── Update company in context (after settings save) ──────────
  const updateCompany = useCallback((updatedFields) => {
    const updated = { ...company, ...updatedFields };
    localStorage.setItem('bizflow_company', JSON.stringify(updated));
    setCompany(updated);
  }, [company]);

  const value = {
    user, company, loading, isLoggedIn,
    role, isSupplier, isBuyer, isDelivery, isDeveloper,
    needsSetup, homeRoute,
    login, logout, completeSetup, updateCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
