// ============================================================
// src/App.jsx — Complete Application Router
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';

// ── Public Pages ─────────────────────────────────────────────
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmPage from './pages/BookingConfirmPage';
import AmenitiesPage from './pages/AmenitiesPage';
import AmenityDetailPage from './pages/AmenityDetailPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import CustomPage from './pages/CustomPage';

// ── Admin Pages ───────────────────────────────────────────────
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminRooms from './pages/admin/AdminRooms';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminBlog from './pages/admin/AdminBlog';
import AdminAmenities from './pages/admin/AdminAmenities';
import AdminTheme from './pages/admin/AdminTheme';
import AdminSEO from './pages/admin/AdminSEO';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReviews from './pages/admin/AdminReviews';
import AdminOTA from './pages/admin/AdminOTA';
import AdminHR from './pages/admin/AdminHR';
import AdminPayments from './pages/admin/AdminPayments';
import AdminFrontDesk from './pages/admin/AdminFrontDesk';
import AdminPages from './pages/admin/AdminPages';

// ── Layouts & Guards ─────────────────────────────────────────
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <BookingProvider>
            <BrowserRouter>
              <Routes>
                {/* ── Guest Site ─────────────────────── */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/rooms" element={<RoomsPage />} />
                  <Route path="/rooms/:slug" element={<RoomDetailPage />} />
                  <Route path="/book" element={<BookingPage />} />
                  <Route path="/book/confirm/:reference" element={<BookingConfirmPage />} />
                  <Route path="/amenities" element={<AmenitiesPage />} />
                  <Route path="/amenities/:slug" element={<AmenityDetailPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/pages/:slug" element={<CustomPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* ── Admin Panel ────────────────────── */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="frontdesk" element={<AdminFrontDesk />} />
                    <Route path="bookings" element={<AdminBookings />} />
                    <Route path="rooms" element={<AdminRooms />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="blog" element={<AdminBlog />} />
                    <Route path="amenities" element={<AdminAmenities />} />
                    <Route path="pages" element={<AdminPages />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="ota" element={<AdminOTA />} />
                    <Route path="hr" element={<AdminHR />} />
                    <Route path="theme" element={<AdminTheme />} />
                    <Route path="seo" element={<AdminSEO />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </BookingProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
