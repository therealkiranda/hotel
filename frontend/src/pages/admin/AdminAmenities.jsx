// ============================================================
// src/pages/admin/AdminAmenities.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { adminApi } from '../../utils/api';
import api from '../../utils/api';

export default function AdminAmenities() {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', slug:'', short_description:'', description:'', category:'services', opening_hours:'', price_info:'', is_featured:false, sort_order:0 });

  useEffect(() => {
    api.get('/public/amenities').then(r => setAmenities(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSlug = title => title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  const handleSave = async () => {
    try {
      const { data } = await adminApi.post('/admin/amenities', form);
      setAmenities(prev => [...prev, { id: data.id, ...form }]);
      setShowForm(false);
      setForm({ name:'', slug:'', short_description:'', description:'', category:'services', opening_hours:'', price_info:'', is_featured:false, sort_order:0 });
    } catch { alert('Failed to save'); }
  };

  const toggleActive = async (id, current) => {
    await adminApi.put(`/admin/amenities/${id}`, { is_active: !current });
    setAmenities(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.75rem' }}>
        <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)' }}>Amenities</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>+ Add Amenity</button>
      </div>

      {showForm && (
        <div style={{ background:'white', borderRadius:16, padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1.5rem' }}>
          <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.25rem', color:'var(--color-primary)', marginBottom:'1.5rem' }}>New Amenity</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
            {[
              { k:'name', l:'Name *', full:false },
              { k:'slug', l:'Slug', full:false },
              { k:'short_description', l:'Short Description', full:true },
              { k:'opening_hours', l:'Opening Hours', full:false },
              { k:'price_info', l:'Price Info', full:false },
            ].map(({ k, l, full }) => (
              <div key={k} className="form-group" style={{ marginBottom:0, gridColumn: full ? '1/-1' : undefined }}>
                <label className="form-label">{l}</label>
                <input className="form-input" value={form[k]}
                  onChange={e => setForm(p => ({ ...p, [k]: e.target.value, ...(k==='name' ? { slug: handleSlug(e.target.value) } : {}) }))} />
              </div>
            ))}
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category:e.target.value }))}>
                {['dining','wellness','recreation','business','services'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Sort Order</label>
              <input type="number" className="form-input" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) }))} />
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1', marginBottom:0 }}>
              <label className="form-label">Full Description</label>
              <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} />
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.875rem', cursor:'pointer' }}>
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured:e.target.checked }))} />
              Feature on homepage
            </label>
          </div>
          <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem' }}>
            <button className="btn btn-primary" onClick={handleSave}>Save Amenity</button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.25rem' }}>
        {loading ? Array.from({length:6}).map((_,i) => <div key={i} className="skeleton" style={{ height:160, borderRadius:16 }} />) :
        amenities.map(a => (
          <div key={a.id} style={{ background:'white', borderRadius:16, padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
            opacity: a.is_active === 0 ? 0.6 : 1, borderTop:`4px solid ${a.is_featured ? 'var(--color-secondary)' : 'var(--color-primary)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em',
                color:'var(--color-secondary)', fontWeight:600 }}>{a.category}</span>
              {a.is_featured === 1 && <span style={{ fontSize:'0.7rem', background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:999 }}>Featured</span>}
            </div>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', marginBottom:'0.4rem' }}>{a.name}</h3>
            <p style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'0.75rem', lineHeight:1.6 }}>{a.short_description}</p>
            {a.opening_hours && <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>🕐 {a.opening_hours}</div>}
            <div style={{ marginTop:'1rem' }}>
              <button onClick={() => toggleActive(a.id, a.is_active !== 0)}
                style={{ padding:'4px 12px', border:'1px solid', borderRadius:6, cursor:'pointer', fontSize:'0.78rem',
                  borderColor: a.is_active !== 0 ? '#e2e8f0' : 'var(--color-primary)',
                  background: a.is_active !== 0 ? '#f8fafc' : 'var(--color-primary)',
                  color: a.is_active !== 0 ? '#64748b' : 'white' }}>
                {a.is_active !== 0 ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
