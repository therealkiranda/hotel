// ============================================================
// src/pages/AmenityDetailPage.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { SEOHead } from '../components/ui/RoomCard';

export default function AmenityDetailPage() {
  const { slug } = useParams();
  const [amenity, setAmenity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/public/amenities/${slug}`)
      .then(r => setAmenity(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!amenity) return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem',
      paddingTop: 'calc(var(--header-height) + 4rem)' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
        Amenity not found
      </h2>
      <Link to="/amenities" className="btn btn-primary">View All Amenities</Link>
    </div>
  );

  return (
    <>
      <SEOHead title={`${amenity.name} — Grand Lumière Hotel`} />

      {/* Hero */}
      <div style={{ background: 'var(--color-primary)',
        paddingTop: 'calc(var(--header-height) + 4rem)', paddingBottom: '5rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <span style={{ display: 'block', color: 'var(--color-secondary)', fontSize: '0.7rem',
              letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {amenity.category}
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'white',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', fontWeight: 700 }}>
              {amenity.name}
            </h1>
            {amenity.opening_hours && (
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Open: {amenity.opening_hours}
              </span>
            )}
          </motion.div>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          {amenity.image_path && (
            <div style={{ height: 400, borderRadius: 20, overflow: 'hidden', marginBottom: '3rem' }}>
              <img src={amenity.image_path} alt={amenity.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.9, color: '#4b5563', marginBottom: '2rem' }}>
              {amenity.description || amenity.short_description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem', marginBottom: '2.5rem' }}>
              {amenity.opening_hours && (
                <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: '#9ca3af', marginBottom: 4 }}>Hours</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{amenity.opening_hours}</div>
                </div>
              )}
              {amenity.location && (
                <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: '#9ca3af', marginBottom: 4 }}>Location</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{amenity.location}</div>
                </div>
              )}
              {amenity.price_info && (
                <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: '#9ca3af', marginBottom: 4 }}>Pricing</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{amenity.price_info}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/book" className="btn btn-primary btn-lg">Reserve Your Stay</Link>
              <Link to="/amenities" className="btn btn-secondary btn-lg">All Amenities</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
