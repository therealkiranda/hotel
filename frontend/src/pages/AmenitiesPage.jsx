// ============================================================
// src/pages/AmenitiesPage.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { AmenityCard, SEOHead } from '../components/ui/RoomCard';

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seo, setSeo] = useState({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/public/amenities').then(r => setAmenities(r.data)).catch(() => {}),
      api.get('/public/seo/amenities').then(r => setSeo(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(amenities.map(a => a.category).filter(Boolean))];
  const filtered = filter === 'all' ? amenities : amenities.filter(a => a.category === filter);

  return (
    <>
      <SEOHead seo={seo} title="Amenities & Experiences" />

      {/* Hero */}
      <div style={{ background: 'var(--color-primary)',
        paddingTop: 'calc(var(--header-height) + 4rem)', paddingBottom: '5rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span style={{ display: 'block', color: 'var(--color-secondary)', fontSize: '0.7rem',
              letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Hotel Amenities
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'white',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginBottom: '1rem', fontWeight: 700 }}>
              World-Class Experiences
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
              Discover an extraordinary range of amenities crafted to enrich every moment of your stay.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap',
            marginBottom: '2.5rem', justifyContent: 'center' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                style={{ padding: '0.5rem 1.25rem', borderRadius: 999, border: '1.5px solid',
                  fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 500,
                  cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.25s',
                  borderColor: filter === cat ? 'var(--color-primary)' : '#e5e7eb',
                  background: filter === cat ? 'var(--color-primary)' : 'white',
                  color: filter === cat ? 'white' : '#6b7280' }}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
              {filtered.map((amenity, i) => (
                <motion.div key={amenity.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}>
                  <AmenityCard amenity={amenity} />
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
              No amenities in this category yet.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
