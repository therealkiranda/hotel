// ============================================================
// src/pages/BlogPostPage.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import api from '../utils/api';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/public/blog/${slug}`)
      .then(r => setPost(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!post) return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem', paddingTop: 'calc(var(--header-height) + 4rem)' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>Post not found</h2>
      <Link to="/blog" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>← All Stories</Link>
    </div>
  );

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} | Grand Lumière Hotel</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
      </Helmet>

      {/* Hero */}
      <div style={{ height: '50vh', minHeight: 360, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 50%, #000))' }}>
        {post.featured_image && (
          <img src={post.featured_image} alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        )}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
        <div style={{ position: 'absolute', bottom: '3rem', left: 0, right: 0 }}>
          <div className="container">
            <Link to="/blog" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem',
              display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: '1rem' }}>
              ← Journal
            </Link>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--color-secondary)', color: 'white',
                padding: '3px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
                {post.category}
              </span>
              {date && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>{date}</span>}
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'white',
              fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, maxWidth: 720 }}>
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {post.excerpt && (
              <p style={{ fontFamily: 'var(--font-accent)', fontSize: '1.2rem', fontStyle: 'italic',
                color: 'var(--color-primary)', lineHeight: 1.8, marginBottom: '2rem',
                padding: '1.5rem 2rem', borderLeft: '3px solid var(--color-secondary)',
                background: 'color-mix(in srgb, var(--color-secondary) 6%, white)', borderRadius: '0 8px 8px 0' }}>
                {post.excerpt}
              </p>
            )}

            <div style={{ fontSize: '1.05rem', lineHeight: 1.9, color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: post.content }} />

            {post.author_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '3rem',
                paddingTop: '2rem', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', flexShrink: 0 }}>
                  {post.author_name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{post.author_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Grand Lumière Hotel</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
              <Link to="/blog" className="btn btn-secondary">← More Stories</Link>
              <Link to="/book" className="btn btn-gold">Book Your Stay</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
