// ============================================================
// src/utils/api.js — Axios API Client
// ============================================================
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hotel_token');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin')) {
        // Soft redirect
      }
    }
    return Promise.reject(err);
  }
);

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotel_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hotel_admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export default api;
