// ============================================================
// src/pages/admin/AdminSEO.jsx
// ============================================================
import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';

export default function AdminSEO() {
  const [pages, setPages] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.get('/admin/seo').then(r => {
      setPages(r.data);
      if (r.data.length > 0) {
        setActive(r.data[0]);
        setForm(r.data[0]);
      }
    }).catch(() => {});
  }, []);

  const selectPage = (page) => { setActive(page); setForm(page); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.put(`/admin/seo/${active.page_identifier}`, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setPages(prev => prev.map(p => p.page_identifier === active.page_identifier ? { ...p, ...form } : p));
    } catch { alert('Failed to save SEO settings'); } finally { setSaving(false); }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '1.75rem' }}>
        SEO Management
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
        {/* Page List */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', alignSelf: 'start' }}>
          {pages.map(page => (
            <button key={page.page_identifier} onClick={() => selectPage(page)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '1rem 1.25rem',
                border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontFamily: 'var(--font-body)',
                background: active?.page_identifier === page.page_identifier ? 'color-mix(in srgb, var(--color-primary) 6%, white)' : 'white',
                color: active?.page_identifier === page.page_identifier ? 'var(--color-primary)' : '#64748b',
                fontWeight: active?.page_identifier === page.page_identifier ? 600 : 400,
                fontSize: '0.875rem', borderLeft: `3px solid ${active?.page_identifier === page.page_identifier ? 'var(--color-primary)' : 'transparent'}` }}>
              <div style={{ textTransform: 'capitalize' }}>{page.page_identifier}</div>
            </button>
          ))}
        </div>

        {/* Editor */}
        {active && (
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-primary)',
                textTransform: 'capitalize' }}>{active.page_identifier} Page SEO</h2>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save'}
              </button>
            </div>

            {[
              { key: 'meta_title', label: 'Meta Title', desc: 'Appears in browser tab and search results (50-60 chars ideal)' },
              { key: 'meta_description', label: 'Meta Description', desc: 'Appears under title in search results (150-160 chars ideal)', rows: 3 },
              { key: 'meta_keywords', label: 'Meta Keywords', desc: 'Comma-separated keywords' },
              { key: 'og_title', label: 'Open Graph Title', desc: 'Title for social media sharing' },
              { key: 'og_description', label: 'Open Graph Description', desc: 'Description for social media sharing', rows: 2 },
              { key: 'og_image', label: 'Open Graph Image URL', desc: 'Image URL for social sharing (1200×630 recommended)' },
              { key: 'robots', label: 'Robots Directive', desc: 'e.g. index,follow or noindex,nofollow' },
            ].map(({ key, label, desc, rows }) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                {rows ? (
                  <textarea className="form-input" rows={rows} value={form[key] || ''}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                ) : (
                  <input type="text" className="form-input" value={form[key] || ''}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                )}
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem', marginBottom: 0 }}>{desc}</p>
                {(key === 'meta_title' || key === 'meta_description') && form[key] && (
                  <div style={{ fontSize: '0.72rem', color: (form[key].length > (key === 'meta_title' ? 60 : 160)) ? '#ef4444' : '#10b981',
                    marginTop: 2 }}>
                    {form[key].length} characters
                  </div>
                )}
              </div>
            ))}

            {/* SERP Preview */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.5rem', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Search Result Preview</div>
              <div style={{ fontSize: '1.1rem', color: '#1a0dab', marginBottom: '0.25rem', fontWeight: 400 }}>
                {form.meta_title || 'Page title will appear here'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#006621', marginBottom: '0.25rem' }}>
                https://grandlumiere.com/{active.page_identifier === 'home' ? '' : active.page_identifier}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#545454', lineHeight: 1.5 }}>
                {form.meta_description || 'Meta description will appear here in search results...'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
