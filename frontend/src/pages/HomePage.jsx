// ============================================================
// src/pages/HomePage.jsx — Full Landing Page
// Imports fixed: AmenityCard, ReviewCard, BlogCard, SEOHead
// all come from RoomCard.jsx as named exports
// ============================================================
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import BookingBar from '../components/booking/BookingBar';
import RoomCard, { AmenityCard, ReviewCard, BlogCard, SEOHead } from '../components/ui/RoomCard';

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

// ─── Animated Cinematic Background ─────────────────────────────
function HeroBackground({ heroType, videoUrl }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Particle / wave animation for 'animated' type
  useEffect(() => {
    if (heroType !== 'animated' && heroType !== 'particles') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);

    // Floating orbs
    const orbs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 80 + Math.random() * 180,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      hue: i % 2 === 0 ? 148 : 38,
      alpha: 0.04 + Math.random() * 0.06,
    }));

    // Particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.5 + Math.random() * 1.5,
      dx: (Math.random() - 0.5) * 0.2,
      dy: -0.1 - Math.random() * 0.4,
      alpha: 0.2 + Math.random() * 0.5,
    }));

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      // Animated orbs
      orbs.forEach(o => {
        o.x += o.dx;
        o.y += o.dy;
        if (o.x < -o.r) o.x = w + o.r;
        if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r;
        if (o.y > h + o.r) o.y = -o.r;
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, `hsla(${o.hue}, 60%, 50%, ${o.alpha})`);
        grad.addColorStop(1, `hsla(${o.hue}, 60%, 30%, 0)`);
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Floating particles
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,169,110,${p.alpha * (0.5 + 0.5 * Math.sin(frame * 0.02 + p.x))})`;
        ctx.fill();
      });

      // Subtle wave lines
      ctx.strokeStyle = 'rgba(201,169,110,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = h * 0.5 + Math.sin((x * 0.008) + (frame * 0.01) + i * 1.2) * (30 + i * 20);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [heroType]);

  if (heroType === 'video' && videoUrl) {
    // Detect YouTube URL and convert to embed
    const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const videoId = ytMatch[1];
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          title="Hero video"
        />
      );
    }
    return (
      <video autoPlay muted loop playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
        <source src={videoUrl} type="video/mp4" />
      </video>
    );
  }

  // Animated canvas background (default + fallback)
  return (
    <canvas ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
  );
}

export default function HomePage() {
  const { hotel, theme } = useTheme();
  const [rooms, setRooms] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [seo, setSeo] = useState({});
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 120]);

  useEffect(() => {
    Promise.all([
      api.get('/rooms').then(r => setRooms(r.data.slice(0, 4))).catch(() => {}),
      api.get('/public/amenities?featured=1').then(r => setAmenities(r.data.slice(0, 4))).catch(() => {}),
      api.get('/public/reviews?featured=1').then(r => setReviews(r.data)).catch(() => {}),
      api.get('/public/blog?featured=1&per_page=3').then(r => setPosts(r.data.data || [])).catch(() => {}),
      api.get('/public/seo/home').then(r => setSeo(r.data)).catch(() => {}),
    ]);
  }, []);

  return (
    <>
      <SEOHead seo={seo} />

      {/* ─── HERO ─────────────────────────────────────── */}
      <section ref={heroRef}
        style={{ position: 'relative', height: '100vh', minHeight: 700, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Dark gradient base */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, #060f0a 0%, #0e2419 35%, #1a3c2e 70%, #1f4a37 100%)' }} />

        {/* Animated background */}
        <motion.div style={{ position: 'absolute', inset: 0, y: heroY }}>
          <HeroBackground
            heroType={theme?.hero_type || 'animated'}
            videoUrl={theme?.hero_video_url} />
        </motion.div>

        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(6,15,10,0.2) 0%, rgba(6,15,10,0.35) 50%, rgba(6,15,10,0.88) 100%)' }} />

        {/* Decorative corner frame */}
        <div style={{ position: 'absolute', top: 100, left: 48, width: 80, height: 80,
          borderTop: '1px solid rgba(201,169,110,0.25)', borderLeft: '1px solid rgba(201,169,110,0.25)' }} />
        <div style={{ position: 'absolute', top: 100, right: 48, width: 80, height: 80,
          borderTop: '1px solid rgba(201,169,110,0.25)', borderRight: '1px solid rgba(201,169,110,0.25)' }} />
        <div style={{ position: 'absolute', bottom: 100, left: 48, width: 80, height: 80,
          borderBottom: '1px solid rgba(201,169,110,0.25)', borderLeft: '1px solid rgba(201,169,110,0.25)' }} />
        <div style={{ position: 'absolute', bottom: 100, right: 48, width: 80, height: 80,
          borderBottom: '1px solid rgba(201,169,110,0.25)', borderRight: '1px solid rgba(201,169,110,0.25)' }} />

        {/* Hero content */}
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', paddingTop: 80 }}>
          <motion.div initial="hidden" animate="visible" variants={stagger}>

            <motion.div variants={fadeUp}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ height: 1, width: 48, background: 'var(--color-secondary)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem',
                  letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 500 }}>
                  Est. Since 1987
                </span>
                <div style={{ height: 1, width: 48, background: 'var(--color-secondary)' }} />
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp}
              style={{ fontFamily: 'var(--font-heading)', color: 'white',
                fontSize: 'clamp(3rem, 7.5vw, 7rem)', fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 0.95, marginBottom: '1.25rem' }}>
              {hotel?.name?.split(' ').slice(0,-1).join(' ') || 'Grand'}
              <br />
              <em style={{ color: 'var(--color-secondary)', fontWeight: 400, fontStyle: 'italic' }}>
                {hotel?.name?.split(' ').slice(-1)[0] || 'Lumière'}
              </em>
            </motion.h1>

            <motion.p variants={fadeUp}
              style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.75)',
                fontSize: '1.1rem', maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.85, fontWeight: 300 }}>
              {hotel?.tagline || 'Where luxury meets serenity — an iconic retreat offering world-class hospitality and unforgettable experiences.'}
            </motion.p>

            <motion.div variants={fadeUp}
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/book" className="btn btn-gold btn-lg">Reserve Your Stay</Link>
              <Link to="/rooms" className="btn btn-outline-white btn-lg">Explore Rooms</Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp}
              className="hero-stats-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem', marginTop: '4.5rem', maxWidth: 600, margin: '4.5rem auto 0' }}>
              {[['250+','Luxury Rooms'],['4','Restaurants'],['5★','Rating'],['35+','Years']].map(([n, l]) => (
                <div key={l} style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-secondary)',
                    fontSize: 'clamp(1.4rem,3vw,2.5rem)', fontWeight: 700, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6 }}>{l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Scroll</span>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 1, height: 48,
              background: 'linear-gradient(to bottom, var(--color-secondary), transparent)' }} />
        </motion.div>
      </section>

      {/* ─── BOOKING BAR ─────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: -40 }}>
        <div className="container">
          <BookingBar />
        </div>
      </div>

      {/* ─── ROOMS ───────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-background)' }}>
        <div className="container">
          <motion.div className="section-header"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <span className="eyebrow">Accommodations</span>
            <h2>Rooms & Suites</h2>
            <p>Each space is thoughtfully curated with the finest materials and bespoke furnishings, designed for moments of pure indulgence.</p>
          </motion.div>

          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
            {rooms.length > 0 ? rooms.map(room => (
              <motion.div key={room.id} variants={fadeUp}><RoomCard room={room} /></motion.div>
            )) : Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="card" style={{ height: 380 }}>
                  <div className="skeleton" style={{ height: 240 }} />
                  <div style={{ padding: '1.25rem' }}>
                    <div className="skeleton" style={{ height: 24, marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 16, width: '60%' }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/rooms" className="btn btn-secondary btn-lg">View All Accommodations</Link>
          </div>
        </div>
      </section>

      {/* ─── EXPERIENCE BANNER ───────────────────────── */}
      <section style={{ background: 'var(--color-primary)', padding: 'clamp(4rem, 8vw, 7rem) 0',
        position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c9a96e'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")` }} />

        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.68rem',
                letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-secondary)', marginBottom: '1rem' }}>
                The Grand Lumière Experience
              </span>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'white',
                fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.15, marginBottom: '1.5rem', fontWeight: 700 }}>
                An Extraordinary<br />Journey Awaits
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.9, marginBottom: '2.5rem', maxWidth: 480 }}>
                From the moment you arrive, our devoted team crafts every detail of your stay with precision and passion.
                Discover a world where every wish is anticipated before it is spoken.
              </p>
              <Link to="/amenities" className="btn btn-gold btn-lg">Discover Our World</Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.8 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { icon: '✦', title: 'Butler Service', desc: 'Dedicated 24/7 personal butler for every suite guest' },
                { icon: '◈', title: 'Fine Dining', desc: '4 restaurants, including one Michelin-starred' },
                { icon: '◇', title: 'Luxury Spa', desc: '2,000 sqm sanctuary of wellness & rejuvenation' },
                { icon: '◉', title: 'Infinity Pool', desc: 'Rooftop pool with panoramic city views' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                  padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ color: 'var(--color-secondary)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>{icon}</div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '1.1rem',
                    fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 0 }}>{desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
        <style>{`@media(max-width:768px){
          .container > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }`}</style>
      </section>

      {/* ─── AMENITIES ───────────────────────────────── */}
      <section className="section">
        <div className="container">
          <motion.div className="section-header"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="eyebrow">Hotel Amenities</span>
            <h2>World-Class Experiences</h2>
            <p>Every corner of Grand Lumière is designed to delight, surprise, and inspire.</p>
          </motion.div>

          <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger}>
            {amenities.map(amenity => (
              <motion.div key={amenity.id} variants={fadeUp}>
                <AmenityCard amenity={amenity} />
              </motion.div>
            ))}
          </motion.div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/amenities" className="btn btn-secondary btn-lg">All Amenities & Services</Link>
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ─────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="section" style={{ background: '#f0f5f1' }}>
          <div className="container">
            <motion.div className="section-header"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="eyebrow">Guest Stories</span>
              <h2>Words From Our Guests</h2>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {reviews.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}>
                  <ReviewCard review={r} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── BLOG ────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="section">
          <div className="container">
            <motion.div className="section-header"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="eyebrow">Journal</span>
              <h2>Stories & Experiences</h2>
              <p>Discover local insights, hotel news, and curated travel guides from our team.</p>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}>
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <Link to="/blog" className="btn btn-secondary btn-lg">Read All Stories</Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 70%, black) 100%)',
        padding: 'clamp(4rem, 8vw, 7rem) 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08,
          background: 'radial-gradient(circle at 20% 80%, var(--color-secondary), transparent 50%), radial-gradient(circle at 80% 20%, var(--color-secondary), transparent 50%)' }} />
        <div className="container" style={{ position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', letterSpacing: '0.3em',
              textTransform: 'uppercase', color: 'var(--color-secondary)', display: 'block', marginBottom: '1rem' }}>
              Begin Your Journey
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'white',
              fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.15, marginBottom: '1.25rem', fontWeight: 700 }}>
              Reserve Your Piece<br />of Paradise
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 500, margin: '0 auto 2.5rem', fontSize: '1rem' }}>
              Book directly for our best available rate and receive exclusive complimentary benefits.
            </p>
            <Link to="/book" className="btn btn-gold btn-lg">Check Availability</Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
