// ============================================================
// src/pages/admin/AdminReviews.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetch = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const { data } = await adminApi.get(`/admin/reviews${params}`);
      setReviews(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const update = async (id, updates) => {
    await adminApi.put(`/admin/reviews/${id}`, updates);
    fetch();
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '1.75rem' }}>
        Reviews Management
      </h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1.5px solid',
              borderColor: filter === f ? 'var(--color-primary)' : '#e2e8f0',
              background: filter === f ? 'var(--color-primary)' : 'white',
              color: filter === f ? 'white' : '#64748b', cursor: 'pointer',
              textTransform: 'capitalize', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="skeleton" style={{height:120,borderRadius:12}}/>)
        : reviews.map(r => (
          <div key={r.id} style={{ background: 'white', borderRadius: 16, padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${r.status==='approved'?'#10b981':r.status==='rejected'?'#ef4444':'#f59e0b'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{r.guest_name}</span>
                  {r.guest_country && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.guest_country}</span>}
                  <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-secondary)',
                    fontWeight: 700, fontSize: '1.1rem' }}>{r.rating_overall}/10</span>
                  {r.is_featured ? <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e',
                    padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>★ Featured</span> : null}
                </div>
                {r.title && <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.4rem' }}>{r.title}</div>}
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 0 }}>
                  "{r.comment}"
                </p>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                {r.status !== 'approved' && (
                  <button onClick={() => update(r.id, { status: 'approved', is_featured: r.is_featured })}
                    style={{ padding: '6px 14px', background: '#d1fae5', color: '#065f46', border: 'none',
                      borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                    ✓ Approve
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button onClick={() => update(r.id, { status: 'rejected', is_featured: false })}
                    style={{ padding: '6px 14px', background: '#fee2e2', color: '#991b1b', border: 'none',
                      borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                    ✕ Reject
                  </button>
                )}
                <button onClick={() => update(r.id, { status: r.status, is_featured: !r.is_featured })}
                  style={{ padding: '6px 14px', background: r.is_featured ? '#fef3c7' : '#f3f4f6',
                    color: r.is_featured ? '#92400e' : '#64748b', border: 'none',
                    borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                  {r.is_featured ? '★ Unfeature' : '☆ Feature'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && reviews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No {filter} reviews</div>
        )}
      </div>
    </div>
  );
}
