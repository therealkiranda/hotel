// ============================================================
// src/components/auth/AdminRoute.jsx
// ============================================================
import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
  const token = localStorage.getItem('hotel_admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('hotel_admin_token');
      return <Navigate to="/admin/login" replace />;
    }
    if (!payload.isAdmin) return <Navigate to="/admin/login" replace />;
    return <Outlet />;
  } catch {
    return <Navigate to="/admin/login" replace />;
  }
}
