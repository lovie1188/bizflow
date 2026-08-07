// src/utils/api.js

export const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
export const API_BASE_URL = `${API_URL}/api`;

/**
 * Custom fetch wrapper that automatically attaches the JWT token from localStorage.
 * Token key: 'bizflow_token' (consistent across all login/register flows)
 */
export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('bizflow_token'); // ← fixed key
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    body: (options.body && typeof options.body === 'object' && !isFormData)
      ? JSON.stringify(options.body)
      : options.body,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = 'An error occurred.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (_) {}

    // Auto-logout on 401 (unless it's a login attempt)
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('bizflow_token');
      localStorage.removeItem('bizflow_user');
      localStorage.removeItem('bizflow_company');
      window.location.href = '/login';
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
};

/**
 * Get the current logged-in user from localStorage
 */
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('bizflow_user');
    return user ? JSON.parse(user) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Get the current company from localStorage
 */
export const getStoredCompany = () => {
  try {
    const company = localStorage.getItem('bizflow_company');
    return company ? JSON.parse(company) : null;
  } catch (_) {
    return null;
  }
};

/**
 * Clear all auth data from localStorage
 */
export const clearAuth = () => {
  localStorage.removeItem('bizflow_token');
  localStorage.removeItem('bizflow_user');
  localStorage.removeItem('bizflow_company');
};
