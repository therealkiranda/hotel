// ============================================================
// src/pages/NotFoundPage.jsx
// ============================================================
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--color-background)', padding:'2rem', textAlign:'center',
      paddingTop:'var(--header-height)' }}>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}>
        <div style={{ fontFamily:'var(--font-heading)', fontSize:'8rem', fontWeight:700,
          color:'var(--color-secondary)', lineHeight:1, marginBottom:'1rem', opacity:0.6 }}>
          404
        </div>
        <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2.5rem', color:'var(--color-primary)',
          marginBottom:'1rem' }}>Page Not Found</h1>
        <p style={{ color:'#6b7280', maxWidth:420, margin:'0 auto 2.5rem', lineHeight:1.8 }}>
          The page you're looking for doesn't exist. It may have been moved or the URL may be incorrect.
        </p>
        <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/" className="btn btn-primary btn-lg">Return Home</Link>
          <Link to="/rooms" className="btn btn-secondary btn-lg">View Rooms</Link>
        </div>
      </motion.div>
    </div>
  );
}
