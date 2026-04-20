// ============================================================
// src/pages/BlogPage.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { BlogCard, SEOHead } from '../components/ui/RoomCard';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seo, setSeo] = useState({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/public/blog?page=${page}&per_page=9`)
        .then(r => { setPosts(r.data.data || []); setTotal(r.data.total || 0); })
        .catch(() => {}),
      page === 1
        ? api.get('/public/seo/blog').then(r => setSeo(r.data)).catch(() => {})
        : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [page]);

  return (
    <>
      <SEOHead seo={seo} title="Hotel Journal & Travel Guides" />

      {/* Hero */}
      <div style={{ background: 'var(--color-primary)',
        paddingTop: 'calc(var(--header-height) + 4rem)', paddingBottom: '5rem' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span style={{ display: 'block', color: 'var(--color-secondary)', fontSize: '0.7rem',
              letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Journal
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'white',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginBottom: '1rem', fontWeight: 700 }}>
              Stories & Experiences
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
              Curated travel guides, hotel news, and local insights from the Grand Lumière team.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 380, borderRadius: 16 }} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
              <p style={{ fontSize: '1.1rem' }}>No blog posts published yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {posts.map((post, i) => (
                <motion.div key={post.id}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.55 }}>
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 9 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: '1rem', marginTop: '3rem' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary">
                ← Previous
              </button>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Page {page} of {Math.ceil(total / 9)}
              </span>
              <button disabled={page * 9 >= total} onClick={() => setPage(p => p + 1)} className="btn btn-secondary">
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
