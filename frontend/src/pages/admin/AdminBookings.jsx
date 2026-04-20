// ============================================================
// src/pages/admin/AdminBookings.jsx
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../utils/api';

const STATUS_OPTIONS = ['all','pending','confirmed','checked_in','checked_out','cancelled','no_show'];
const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  confirmed: { bg: '#d1fae5', color: '#065f46' },
  checked_in: { bg: '#dbeafe', color: '#1e40af' },
  checked_out: { bg: '#f3f4f6', color: '#374151' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  no_show: { bg: '#fef3c7', color: '#92400e' },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 20 });
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      const { data } = await adminApi.get(`/admin/bookings?${params}`);
      setBookings(data.data);
      setTotal(data.total);
    } catch {} finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (bookingId, newStatus, notes = '') => {
    setUpdating(true);
    try {
      await adminApi.put(`/admin/bookings/${bookingId}/status`, { status: newStatus, notes });
      fetchBookings();
      setSelected(null);
    } catch (err) { alert('Failed to update status'); }
    finally { setUpdating(false); }
  };

  const fmtMoney = n => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '1.75rem' }}>
        Bookings Management
      </h1>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Search reference, email, name..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 220, padding: '0.625rem 1rem', border: '1.5px solid #e2e8f0',
            borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              style={{ padding: '0.5rem 0.875rem', borderRadius: 8, border: '1.5px solid',
                borderColor: status === s ? 'var(--color-primary)' : '#e2e8f0',
                background: status === s ? 'var(--color-primary)' : 'white',
                color: status === s ? 'white' : '#64748b', cursor: 'pointer',
                fontSize: '0.8rem', textTransform: 'capitalize', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button onClick={fetchBookings} style={{ padding: '0.625rem 1.25rem', background: '#f8fafc',
          border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Reference', 'Guest', 'Room', 'Check-in', 'Nights', 'Total', 'Method', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '1rem 1.25rem', color: '#64748b',
                    fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length: 5}).map((_, i) => (
                <tr key={i}><td colSpan={9} style={{ padding: '1rem' }}><div className="skeleton" style={{ height: 20 }} /></td></tr>
              )) : bookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700,
                    color: 'var(--color-primary)', fontSize: '0.8rem' }}>{b.booking_reference}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600 }}>{b.guest_first_name} {b.guest_last_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{b.guest_email}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>{b.room_name}</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b', whiteSpace: 'nowrap' }}>{b.check_in_date}</td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>{b.nights}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>{fmtMoney(b.total_amount)}</td>
                  <td style={{ padding: '1rem 1.25rem', textTransform: 'capitalize', color: '#64748b' }}>
                    {b.payment_method?.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ ...STATUS_COLORS[b.status], padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <button onClick={() => setSelected(b)} style={{ padding: '4px 12px', background: 'var(--color-primary)',
                      color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && bookings.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: 6,
                  cursor: page === 1 ? 'not-allowed' : 'pointer', background: 'white', opacity: page === 1 ? 0.5 : 1 }}>
                Previous
              </button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: 6,
                  cursor: page * 20 >= total ? 'not-allowed' : 'pointer', background: 'white', opacity: page * 20 >= total ? 0.5 : 1 }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="overlay" />
            <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '480px', background: 'white',
                zIndex: 201, overflowY: 'auto', boxShadow: '-4px 0 40px rgba(0,0,0,0.12)' }}>
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-primary)' }}>
                    {selected.booking_reference}
                  </h2>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none',
                    fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
                </div>

                {/* Details */}
                {[
                  ['Guest', `${selected.guest_first_name} ${selected.guest_last_name}`],
                  ['Email', selected.guest_email],
                  ['Phone', selected.guest_phone || '—'],
                  ['Room', selected.room_name],
                  ['Check-in', selected.check_in_date],
                  ['Check-out', selected.check_out_date],
                  ['Nights', selected.nights],
                  ['Adults', selected.adults],
                  ['Room Rate', fmtMoney(selected.room_rate)],
                  ['Subtotal', fmtMoney(selected.subtotal)],
                  ['Taxes', fmtMoney(selected.taxes)],
                  ['Total', fmtMoney(selected.total_amount)],
                  ['Payment Method', selected.payment_method?.replace('_', ' ')],
                  ['Payment Status', selected.payment_status],
                  ['Source', selected.source],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between',
                    padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <span style={{ color: '#64748b' }}>{l}</span>
                    <span style={{ fontWeight: 500, textTransform: 'capitalize', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                  </div>
                ))}

                {selected.special_requests && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 4 }}>
                      Special Requests
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 0 }}>{selected.special_requests}</p>
                  </div>
                )}

                {/* Status Actions */}
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: '#94a3b8', marginBottom: '0.875rem' }}>Update Status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[
                      { status: 'confirmed', label: '✓ Confirm Booking', style: { background: '#d1fae5', color: '#065f46' } },
                      { status: 'checked_in', label: '→ Mark Checked In', style: { background: '#dbeafe', color: '#1e40af' } },
                      { status: 'checked_out', label: '← Mark Checked Out', style: { background: '#f3f4f6', color: '#374151' } },
                      { status: 'cancelled', label: '✕ Cancel Booking', style: { background: '#fee2e2', color: '#991b1b' } },
                      { status: 'no_show', label: '⊘ Mark No Show', style: { background: '#fef3c7', color: '#92400e' } },
                    ].filter(a => a.status !== selected.status).map(({ status: s, label, style: st }) => (
                      <button key={s} disabled={updating}
                        onClick={() => updateStatus(selected.id, s)}
                        style={{ ...st, border: 'none', borderRadius: 8, padding: '0.75rem 1rem',
                          fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                          fontFamily: 'var(--font-body)', textAlign: 'left', opacity: updating ? 0.6 : 1 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
