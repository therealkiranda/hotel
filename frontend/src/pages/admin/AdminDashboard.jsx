// ============================================================
// src/pages/admin/AdminDashboard.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../utils/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0 });
const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};

  const statCards = [
    { label: 'Total Bookings', value: fmt(stats.total_bookings), icon: '📋', color: '#1a3c2e', sub: `${fmt(stats.pending_bookings)} pending` },
    { label: 'Revenue This Month', value: fmtMoney(stats.revenue_this_month), icon: '💰', color: '#d97706', sub: `${fmtMoney(stats.revenue_this_year)} this year` },
    { label: 'Active Guests', value: fmt(stats.active_guests), icon: '👥', color: '#2563eb', sub: `${fmt(stats.arrivals_today)} arrivals today` },
    { label: 'Room Occupancy', value: `${stats.total_rooms ? Math.round((stats.occupied_rooms / stats.total_rooms) * 100) : 0}%`, icon: '🛏', color: '#7c3aed', sub: `${fmt(stats.available_rooms)} available` },
    { label: 'Total Customers', value: fmt(stats.total_customers), icon: '⭐', color: '#0891b2', sub: `+${fmt(stats.new_customers_this_month)} this month` },
    { label: 'Departures Today', value: fmt(stats.departures_today), icon: '✈', color: '#be185d', sub: `${fmt(stats.arrivals_today)} arrivals` },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
          Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Welcome back! Here's what's happening at the hotel today.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {statCards.map(({ label, value, icon, color, sub }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ background: 'white', borderRadius: 16, padding: '1.5rem',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>
                    {label}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700,
                  color: '#1e293b', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.4rem' }}>{sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Revenue Chart */}
            <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-primary)',
                marginBottom: '1.5rem' }}>Monthly Revenue</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem', height: 180, padding: '0 0.5rem' }}>
                {(data?.monthlyRevenue || []).slice(-12).map((m, i) => {
                  const maxRev = Math.max(...(data?.monthlyRevenue || []).map(x => x.revenue || 0), 1);
                  const pct = Math.max(4, ((m.revenue || 0) / maxRev) * 100);
                  return (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{fmtMoney(m.revenue).replace('$', '$').split('.')[0]}</div>
                      <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                        transition={{ delay: i * 0.05, duration: 0.6, ease: 'easeOut' }}
                        style={{ width: '100%', background: 'linear-gradient(to top, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, var(--color-secondary)))',
                          borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', transform: 'rotate(-35deg)', transformOrigin: 'center', width: 30, textAlign: 'center' }}>
                        {m.month?.slice(5)}
                      </div>
                    </div>
                  );
                })}
                {(!data?.monthlyRevenue?.length) && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                    No revenue data yet
                  </div>
                )}
              </div>
            </div>

            {/* Booking Sources */}
            <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
                Booking Sources
              </h3>
              {(data?.bySource || []).map(({ source, count }, i) => {
                const total = (data?.bySource || []).reduce((a, b) => a + b.count, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const colors = ['var(--color-primary)', 'var(--color-secondary)', '#2563eb', '#7c3aed', '#be185d'];
                return (
                  <div key={source} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b', textTransform: 'capitalize' }}>{source?.replace('_', ' ')}</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: colors[i % colors.length], borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
              {!data?.bySource?.length && <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No bookings yet</p>}
            </div>
          </div>

          {/* Recent Bookings */}
          <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
              Recent Bookings
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Reference', 'Guest', 'Room', 'Check-in', 'Check-out', 'Total', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#94a3b8',
                        fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentBookings || []).map((b, i) => (
                    <tr key={b.booking_reference}
                      style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'monospace' }}>{b.booking_reference}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{b.guest_first_name} {b.guest_last_name}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>{b.room_name}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>{b.check_in_date}</td>
                      <td style={{ padding: '0.875rem 1rem', color: '#64748b' }}>{b.check_out_date}</td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{fmtMoney(b.total_amount)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                  {!data?.recentBookings?.length && (
                    <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No bookings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    confirmed: { bg: '#d1fae5', color: '#065f46', label: 'Confirmed' },
    checked_in: { bg: '#dbeafe', color: '#1e40af', label: 'Checked In' },
    checked_out: { bg: '#f3f4f6', color: '#374151', label: 'Checked Out' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    no_show: { bg: '#fef3c7', color: '#92400e', label: 'No Show' },
  };
  const c = config[status] || { bg: '#f3f4f6', color: '#374151', label: status };
  return (
    <span style={{ background: c.bg, color: c.color, padding: '3px 10px',
      borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>{c.label}</span>
  );
}
