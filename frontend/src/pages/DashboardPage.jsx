// ============================================================
// src/pages/DashboardPage.jsx — Customer Account Dashboard
// ============================================================
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/bookings').then(r => setBookings(r.data)).catch(() => {}),
      api.get('/users/loyalty').then(r => setLoyalty(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const TIER_COLORS = { Silver: '#94a3b8', Gold: '#d97706', Platinum: '#7c3aed' };

  return (
    <div style={{ paddingTop: 'calc(var(--header-height) + 2rem)', paddingBottom: '4rem',
      background: 'var(--color-background)', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', color: 'white', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: 0 }}>
              Welcome, {user?.first_name}
            </h1>
            <p style={{ color: '#6b7280', marginBottom: 0 }}>{user?.email}</p>
          </div>
          {loyalty && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ display: 'inline-block', background: TIER_COLORS[loyalty.tier] + '20',
                color: TIER_COLORS[loyalty.tier], padding: '0.35rem 1rem', borderRadius: 999,
                fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>
                {loyalty.tier} Member
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{loyalty.loyalty_points} points</div>
            </div>
          )}
        </motion.div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Stays', value: loyalty?.total_stays || 0 },
            { label: 'Loyalty Points', value: loyalty?.loyalty_points || 0 },
            { label: 'Total Spent', value: `$${Number(loyalty?.total_spent || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
            { label: 'Upcoming Stays', value: bookings.filter(b => b.status === 'confirmed').length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'white', borderRadius: 14, padding: '1.5rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700,
                color: 'var(--color-primary)' }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Bookings */}
        <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
            My Reservations
          </h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array.from({length: 3}).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />)}
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No reservations yet</p>
              <a href="/book" className="btn btn-primary">Book Your First Stay</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bookings.map(b => (
                <div key={b.booking_reference} style={{ display: 'flex', alignItems: 'center',
                  gap: '1.5rem', padding: '1.25rem', border: '1px solid #f1f5f9',
                  borderRadius: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{b.booking_reference}</span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999,
                        background: b.status === 'confirmed' ? '#d1fae5' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                        color: b.status === 'confirmed' ? '#065f46' : b.status === 'cancelled' ? '#991b1b' : '#92400e' }}>
                        {b.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.room_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{b.check_in_date} → {b.check_out_date}</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                      ${Number(b.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
