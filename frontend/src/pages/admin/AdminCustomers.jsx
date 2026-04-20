// ============================================================
// src/pages/admin/AdminCustomers.jsx
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../utils/api';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, per_page: 25 });
    if (search) p.set('search', search);
    adminApi.get(`/admin/customers?${p}`)
      .then(r => { setCustomers(r.data.data); setTotal(r.data.total); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (id, status) => {
    await adminApi.put(`/admin/customers/${id}/status`, { status });
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  return (
    <div>
      <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)', marginBottom:'1.75rem' }}>
        Customer Management
      </h1>

      <div style={{ background:'white', borderRadius:16, padding:'1.25rem 1.5rem',
        boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1.5rem' }}>
        <input type="text" placeholder="Search by name or email..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width:'100%', maxWidth:400, padding:'0.625rem 1rem', border:'1.5px solid #e2e8f0',
            borderRadius:8, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
      </div>

      <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                {['Customer','Email','Phone','Stays','Spent','Points','Status','Actions'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'1rem 1.25rem', color:'#64748b',
                    fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:6}).map((_,i) => (
                <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height:20, margin:'1rem' }} /></td></tr>
              )) : customers.map(c => (
                <tr key={c.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'1rem 1.25rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--color-primary)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'white', fontSize:'0.75rem', fontWeight:700, flexShrink:0 }}>
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:600 }}>{c.first_name} {c.last_name}</div>
                        {c.nationality && <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{c.nationality}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'1rem 1.25rem', color:'#64748b' }}>{c.email}</td>
                  <td style={{ padding:'1rem 1.25rem', color:'#64748b' }}>{c.phone || '—'}</td>
                  <td style={{ padding:'1rem 1.25rem', textAlign:'center', fontWeight:600 }}>{c.total_stays}</td>
                  <td style={{ padding:'1rem 1.25rem', fontWeight:600 }}>${Number(c.total_spent||0).toLocaleString('en-US',{maximumFractionDigits:0})}</td>
                  <td style={{ padding:'1rem 1.25rem', color:'var(--color-secondary)', fontWeight:600 }}>{c.loyalty_points}</td>
                  <td style={{ padding:'1rem 1.25rem' }}>
                    <span style={{ padding:'3px 10px', borderRadius:999, fontSize:'0.75rem', fontWeight:600,
                      background: c.status==='active'?'#d1fae5':c.status==='banned'?'#fee2e2':'#fef3c7',
                      color: c.status==='active'?'#065f46':c.status==='banned'?'#991b1b':'#92400e' }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding:'1rem 1.25rem' }}>
                    <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)}
                      style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #e2e8f0',
                        fontSize:'0.78rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                      {['active','suspended','banned'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr><td colSpan={8} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 25 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'1rem 1.5rem', borderTop:'1px solid #f1f5f9' }}>
            <span style={{ fontSize:'0.85rem', color:'#64748b' }}>
              {(page-1)*25+1}–{Math.min(page*25,total)} of {total}
            </span>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                style={{ padding:'0.5rem 1rem', border:'1px solid #e2e8f0', borderRadius:6,
                  cursor:page===1?'not-allowed':'pointer', background:'white', opacity:page===1?0.5:1 }}>Prev</button>
              <button disabled={page*25>=total} onClick={() => setPage(p=>p+1)}
                style={{ padding:'0.5rem 1rem', border:'1px solid #e2e8f0', borderRadius:6,
                  cursor:page*25>=total?'not-allowed':'pointer', background:'white', opacity:page*25>=total?0.5:1 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
