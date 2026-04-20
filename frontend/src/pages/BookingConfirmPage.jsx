// ============================================================
// src/pages/BookingConfirmPage.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

export default function BookingConfirmPage() {
  const { reference } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const guestAccountCreated = location.state?.guest_account_created;
  const tempPassword = location.state?.temp_password;

  useEffect(() => {
    api.get(`/bookings/${reference}`)
      .then(r => setBooking(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)',
      paddingTop: 'calc(var(--header-height) + 4rem)', paddingBottom: '4rem' }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'white', borderRadius: 20, padding: '3rem', textAlign: 'center',
            boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          {/* Success Icon */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#d1fae5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
            ✓
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            Booking Confirmed!
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Thank you for choosing Grand Lumière. Your reservation is pending confirmation.
          </p>

          <div style={{ background: 'var(--color-background)', borderRadius: 12, padding: '1.5rem',
            marginBottom: '2rem', border: '2px dashed var(--color-secondary)' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#9ca3af', marginBottom: '0.5rem' }}>Booking Reference</div>
            <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700,
              color: 'var(--color-primary)', letterSpacing: '0.1em' }}>{reference}</div>
          </div>

          {booking && (
            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              {[
                ['Guest', `${booking.guest_first_name} ${booking.guest_last_name}`],
                ['Room', booking.room_name],
                ['Check-in', booking.check_in_date],
                ['Check-out', booking.check_out_date],
                ['Nights', booking.nights],
                ['Total', `$${Number(booking.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                ['Payment', booking.payment_method?.replace('_', ' ')],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '0.625rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.9rem' }}>
                  <span style={{ color: '#6b7280' }}>{l}</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '2rem' }}>
            A confirmation email has been sent to <strong>{booking?.guest_email}</strong>. 
            Our team will confirm your booking within 24 hours.
          </p>

          {guestAccountCreated && tempPassword && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12,
              padding: '1.25rem 1.5rem', margin: '1.5rem 0', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem' }}>🎉 Your account has been created!</div>
              <div style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.7 }}>
                An account was created with your booking email so you can manage your reservation.<br/>
                <strong>Email:</strong> {booking?.guest_email}<br/>
                <strong>Temporary Password:</strong>{' '}
                <code style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{tempPassword}</code>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                Please log in and change your password. This is shown only once.
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn btn-primary">View My Bookings</Link>
            <Link to="/login" className="btn btn-secondary">Log In to Account</Link>
            <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>Back to Home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
