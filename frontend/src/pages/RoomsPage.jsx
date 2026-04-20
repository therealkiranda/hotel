// ============================================================
// src/pages/RoomsPage.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import RoomCard, { SEOHead } from '../components/ui/RoomCard';
import BookingBar from '../components/booking/BookingBar';
import { useBooking } from '../context/BookingContext';

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } } };

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seo, setSeo] = useState({});
  const { booking } = useBooking();

  useEffect(() => {
    const params = new URLSearchParams();
    if (booking.check_in_date) params.set('check_in', booking.check_in_date);
    if (booking.check_out_date) params.set('check_out', booking.check_out_date);
    if (booking.adults) params.set('adults', booking.adults);
    if (booking.children) params.set('children', booking.children);

    Promise.all([
      api.get(`/rooms?${params}`).then(r => setRooms(r.data)).catch(() => {}),
      api.get('/public/seo/rooms').then(r => setSeo(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [booking.check_in_date, booking.check_out_date, booking.adults, booking.children]);

  return (
    <>
      <SEOHead seo={seo} title="Rooms & Suites" />

      {/* Hero */}
      <div style={{ background: 'var(--color-primary)', paddingTop: 'calc(var(--header-height) + 4rem)', paddingBottom: '5rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.7rem',
              letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-secondary)', marginBottom: '1rem' }}>
              Accommodations
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'white',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginBottom: '1rem', fontWeight: 700 }}>
              Rooms & Suites
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 560, margin: '0 auto',
              fontSize: '1.05rem', lineHeight: 1.8 }}>
              Each room is a masterpiece of comfort and design, crafted to exceed every expectation.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Booking Bar */}
      <div style={{ position: 'relative', marginTop: -36 }}>
        <div className="container"><BookingBar compact /></div>
      </div>

      {/* Rooms Grid */}
      <section className="section">
        <div className="container">
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card" style={{ height: 420 }}>
                  <div className="skeleton" style={{ height: 260 }} />
                  <div style={{ padding: '1.5rem' }}>
                    <div className="skeleton" style={{ height: 24, marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 20 }} />
                    <div className="skeleton" style={{ height: 38 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}
              initial="hidden" animate="visible" variants={stagger}>
              {rooms.map(room => (
                <motion.div key={room.id} variants={fadeUp}>
                  <RoomCard room={room} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && rooms.length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#6b7280' }}>
              <p style={{ fontSize: '1.1rem' }}>No rooms available. Please adjust your search dates.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
