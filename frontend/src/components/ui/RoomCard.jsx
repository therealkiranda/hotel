// ============================================================
// src/components/ui/RoomCard.jsx
// All card components + SEOHead exported from one file
// ============================================================
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../../context/ThemeContext';

// ─── RoomCard (default export) ───────────────────────────────
export default function RoomCard({ room }) {
  const image = room.images?.[0];

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ background: 'white', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Image */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, #000))' }}>
        {image ? (
          <img src={image} alt={room.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', color: 'rgba(255,255,255,0.25)', fontSize: '3rem' }}>GL</span>
          </div>
        )}
        {room.view_type && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)',
            color: 'white', fontSize: '0.7rem', padding: '4px 10px', borderRadius: 999,
            backdropFilter: 'blur(8px)', letterSpacing: '0.1em' }}>
            {room.view_type}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-primary)',
          marginBottom: '0.5rem', fontWeight: 600 }}>{room.name}</h3>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1rem', flex: 1 }}>
          {room.short_description}
        </p>

        {room.highlights?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
            {room.highlights.slice(0, 3).map(h => (
              <span key={h} style={{ fontSize: '0.72rem',
                background: 'color-mix(in srgb, var(--color-secondary) 12%, white)',
                color: 'color-mix(in srgb, var(--color-secondary) 90%, black)',
                padding: '3px 10px', borderRadius: 999, letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div>
            {room.base_price && (
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem',
                color: 'var(--color-secondary)', fontWeight: 700 }}>
                From ${Number(room.base_price).toLocaleString()}
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', letterSpacing: '0.05em' }}>per night</div>
          </div>
          <Link to={`/rooms/${room.slug}`} className="btn btn-primary btn-sm">View Details</Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── AmenityCard ─────────────────────────────────────────────
export function AmenityCard({ amenity }) {
  return (
    <Link to={`/amenities/${amenity.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
        style={{ background: 'white', borderRadius: 16, padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%',
          border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}>
        <div style={{ width: 52, height: 52,
          background: 'color-mix(in srgb, var(--color-primary) 8%, white)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
          border: '1px solid color-mix(in srgb, var(--color-primary) 12%, transparent)' }}>
          <span style={{ fontSize: '1.5rem', color: 'var(--color-secondary)' }}>✦</span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-primary)',
          marginBottom: '0.5rem', fontWeight: 600 }}>{amenity.name}</h3>
        {amenity.opening_hours && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', letterSpacing: '0.1em',
            textTransform: 'uppercase', marginBottom: '0.75rem' }}>{amenity.opening_hours}</div>
        )}
        <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.7, marginBottom: 0 }}>
          {amenity.short_description}
        </p>
      </motion.div>
    </Link>
  );
}

// ─── ReviewCard ──────────────────────────────────────────────
export function ReviewCard({ review }) {
  const stars = Math.round((Number(review.rating_overall) / 10) * 5);
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '2rem',
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '1rem' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: i < stars ? 'var(--color-secondary)' : '#e5e7eb', fontSize: '1.1rem' }}>★</span>
        ))}
        <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-heading)', fontSize: '1rem',
          color: 'var(--color-secondary)', fontWeight: 700 }}>{review.rating_overall}/10</span>
      </div>
      {review.title && (
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--color-primary)',
          marginBottom: '0.75rem', fontWeight: 600 }}>{review.title}</h4>
      )}
      <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.8, marginBottom: '1.25rem',
        fontStyle: 'italic', flex: 1 }}>"{review.comment}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
        borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-heading)', flexShrink: 0 }}>
          {review.guest_name?.[0] || '?'}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)' }}>{review.guest_name}</div>
          {review.guest_country && (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{review.guest_country}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BlogCard ────────────────────────────────────────────────
export function BlogCard({ post }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US',
        { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
        style={{ background: 'white', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 200, overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, #000))' }}>
          {post.featured_image ? (
            <img src={post.featured_image} alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-heading)', color: 'rgba(255,255,255,0.2)', fontSize: '2rem' }}>GL</span>
            </div>
          )}
        </div>
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem',
              background: 'color-mix(in srgb, var(--color-secondary) 15%, white)',
              color: 'var(--color-secondary)', padding: '3px 10px', borderRadius: 999,
              fontWeight: 500, letterSpacing: '0.05em' }}>{post.category}</span>
            {date && <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{date}</span>}
          </div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-primary)',
            marginBottom: '0.75rem', fontWeight: 600, lineHeight: 1.3 }}>{post.title}</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.7, flex: 1, marginBottom: '1rem' }}>
            {post.excerpt}
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase' }}>Read More →</span>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── SEOHead ─────────────────────────────────────────────────
export function SEOHead({ seo, title }) {
  const { hotel } = useTheme();
  const siteName = hotel?.name || 'Grand Lumière Hotel';
  const metaTitle = seo?.meta_title || title || siteName;
  const metaDesc = seo?.meta_description || hotel?.description || '';

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      {seo?.meta_keywords && <meta name="keywords" content={seo.meta_keywords} />}
      <meta name="robots" content={seo?.robots || 'index,follow'} />
      <meta property="og:title" content={seo?.og_title || metaTitle} />
      <meta property="og:description" content={seo?.og_description || metaDesc} />
      {seo?.og_image && <meta property="og:image" content={seo.og_image} />}
      <meta property="og:type" content="website" />
      {seo?.canonical_url && <link rel="canonical" href={seo.canonical_url} />}
    </Helmet>
  );
}
