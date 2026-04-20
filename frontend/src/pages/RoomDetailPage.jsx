// ============================================================
// src/pages/RoomDetailPage.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useBooking } from '../context/BookingContext';
import { SEOHead } from '../components/ui/RoomCard';
import BookingBar from '../components/booking/BookingBar';

export default function RoomDetailPage() {
  const { slug } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const { updateBooking } = useBooking();

  useEffect(() => {
    api.get(`/rooms/${slug}`)
      .then(r => setRoom(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!room) return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem', paddingTop: 'calc(var(--header-height) + 4rem)' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', marginBottom: '1rem' }}>Room not found</h2>
      <Link to="/rooms" className="btn btn-primary">View All Rooms</Link>
    </div>
  );

  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const highlights = Array.isArray(room.highlights) ? room.highlights : [];
  const images = Array.isArray(room.images) ? room.images : [];

  return (
    <>
      <SEOHead title={`${room.name} — Grand Lumière Hotel`} />

      <div style={{ paddingTop: 'var(--header-height)' }}>
        {/* Image Gallery */}
        <div style={{ height: '65vh', minHeight: 400, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, #000))' }}>
          {images.length > 0 ? (
            <img src={images[activeImg]} alt={room.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-heading)', color: 'rgba(255,255,255,0.2)', fontSize: '5rem' }}>GL</span>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

          {/* Image thumbnails */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '0.5rem' }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{ width: i === activeImg ? 28 : 8, height: 8, borderRadius: 4, border: 'none',
                    background: i === activeImg ? 'var(--color-secondary)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          )}

          {/* Room name overlay */}
          <div style={{ position: 'absolute', bottom: '3rem', left: 0, right: 0 }}>
            <div className="container">
              <h1 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: 'clamp(2rem, 5vw, 4rem)',
                fontWeight: 700, marginBottom: '0.5rem' }}>{room.name}</h1>
              {room.view_type && (
                <span style={{ color: 'var(--color-secondary)', fontSize: '0.85rem',
                  letterSpacing: '0.15em', textTransform: 'uppercase' }}>{room.view_type}</span>
              )}
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '3rem clamp(1rem, 4vw, 3rem)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>
            {/* Main Content */}
            <div>
              {/* Highlights */}
              {highlights.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginBottom: '2rem' }}>
                  {highlights.map(h => (
                    <span key={h} style={{ padding: '0.4rem 1rem', borderRadius: 999,
                      border: '1.5px solid var(--color-secondary)', color: 'var(--color-secondary)',
                      fontSize: '0.8rem', fontWeight: 500 }}>{h}</span>
                  ))}
                </div>
              )}

              <p style={{ fontSize: '1.1rem', lineHeight: 1.9, color: '#4b5563', marginBottom: '2.5rem' }}>
                {room.description}
              </p>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem',
                    color: 'var(--color-primary)', marginBottom: '1.5rem' }}>Room Amenities</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {amenities.map(a => (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.75rem 1rem', background: 'white', borderRadius: 10,
                        border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <span style={{ color: 'var(--color-secondary)', fontSize: '0.9rem' }}>✦</span>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Details */}
              <div style={{ marginTop: '2.5rem', background: 'white', borderRadius: 16, padding: '2rem',
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
                  Room Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    room.size_sqm && ['Room Size', `${room.size_sqm} m²`],
                    room.bed_type && ['Bed Configuration', room.bed_type],
                    ['Max Adults', room.max_adults],
                    ['Max Children', room.max_children],
                    room.floor_range && ['Floor', room.floor_range],
                    room.view_type && ['View', room.view_type],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: 10 }}>
                      <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: '#9ca3af', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ background: 'white', borderRadius: 20, padding: '2rem',
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>Starting from</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 700,
                    color: 'var(--color-secondary)', lineHeight: 1 }}>
                    ${Number(room.base_price).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>per night · taxes not included</div>
                </div>

                <BookingBar compact />

                <Link to="/book" onClick={() => updateBooking({ room_category_id: room.id, room_name: room.name })}
                  className="btn btn-gold w-full"
                  style={{ width: '100%', display: 'block', textAlign: 'center', marginTop: '1rem', padding: '1rem' }}>
                  Reserve This Room
                </Link>

                <p style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.875rem', marginBottom: 0 }}>
                  Free cancellation · Best rate guaranteed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:900px){
        .container > div[style*="grid-template-columns: 1fr 380px"]{grid-template-columns:1fr !important;}
      }`}</style>
    </>
  );
}
