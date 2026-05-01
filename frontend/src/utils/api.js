export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Exporting both names for base URL compatibility
export const BASE_URL = API_BASE_URL;

/**
 * Helper functions for authentication and session management
 */
export const getAuthToken = () => localStorage.getItem("authToken");
export const getToken = () => localStorage.getItem("token");

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || localStorage.getItem("userData") || "null");
  } catch {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("token", token); 
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("userData", JSON.stringify(user));
  localStorage.setItem("isLogin", "true");
};

export const clearAuthSession = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userData");
  localStorage.removeItem("isLogin");
};

/**
 * apiFetch - Original fetch logic from src/utils/api.js
 * Primarily used in analytics and smart predict pages.
 * Defaults to GET.
 * @param {string} endpoint 
 */
export const apiFetch = async (endpoint) => {
    const token = getToken(); // Mengambil token (key: 'token') jika ada
    
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: headers,
    });

    if (!response.ok) {
        throw new Error('Gagal mengambil data dari server');
    }

    return response.json();
};

/**
 * authFetch - Original fetch logic from src copy/utils/api.js
 * Primarily used in Products and Transaction pages.
 * Supports multiple methods and handles 401/403 errors.
 * @param {string} path 
 * @param {object} options 
 */
export const authFetch = async (path, options = {}) => {
  const token = getAuthToken(); // Mengambil authToken (key: 'authToken') jika ada
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (response.status === 401 || response.status === 403) {
    clearAuthSession();
    window.location.href = "/login";
    throw new Error(data?.message || "Unauthorized");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Terjadi kesalahan pada server.");
  }

  return data;
};

export default API_BASE_URL;
