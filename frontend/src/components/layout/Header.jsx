// ============================================================
// src/components/layout/Header.jsx
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_LINKS = [
  { label: 'Rooms & Suites', href: '/rooms' },
  { label: 'Amenities', href: '/amenities' },
  { label: 'Experiences', href: '/blog' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { hotel } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const headerStyle = scrolled || !isHome
    ? { background: 'var(--color-primary)', boxShadow: '0 2px 20px rgba(0,0,0,0.15)' }
    : { background: 'transparent' };

  return (
    <>
      <motion.header
        style={{ ...headerStyle, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 'var(--header-height)', display: 'flex', alignItems: 'center',
          transition: 'background 0.4s ease, box-shadow 0.4s ease' }}
        initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            {hotel?.logo_path ? (
              <img
                src={`${(import.meta.env.VITE_API_URL||'http://localhost:4000/api').replace('/api','')}/${hotel.logo_path}`}
                alt={hotel?.name||'Logo'}
                style={{ height: 44, maxWidth: 160, objectFit: 'contain', filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
                onError={e => { e.target.style.display='none'; }}
              />
            ) : (
              <>
                <div style={{ width: 36, height: 36, background: 'var(--color-secondary)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                    {(hotel?.name||'GL').slice(0,2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '1.25rem',
                    fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1 }}>
                    {hotel?.name || 'Grand Lumière'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', color: 'var(--color-secondary)',
                    fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', lineHeight: 1, marginTop: 2 }}>
                    Hotel & Suites
                  </div>
                </div>
              </>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}
            className="desktop-nav">
            {NAV_LINKS.map(({ label, href }) => (
              <NavLink key={href} to={href}
                style={({ isActive }) => ({
                  fontFamily: 'var(--font-body)', color: 'white', fontSize: '0.8rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 400,
                  textDecoration: 'none', opacity: isActive ? 1 : 0.8,
                  borderBottom: isActive ? '1px solid var(--color-secondary)' : '1px solid transparent',
                  paddingBottom: 2, transition: 'all 0.3s ease',
                })}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button onClick={() => setUserMenuOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 14px 6px 8px',
                    cursor: 'pointer', color: 'white', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  {user.first_name}
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      style={{ position: 'absolute', right: 0, top: '110%', background: 'white',
                        borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', minWidth: 180,
                        overflow: 'hidden', zIndex: 10 }}>
                      <Link to="/dashboard" style={{ display: 'block', padding: '12px 18px', fontSize: '0.9rem',
                        color: 'var(--color-primary)', borderBottom: '1px solid #f0f0f0' }}>My Dashboard</Link>
                      <button onClick={logout} style={{ display: 'block', width: '100%', textAlign: 'left',
                        padding: '12px 18px', fontSize: '0.9rem', color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login"
                style={{ fontFamily: 'var(--font-body)', color: 'white', fontSize: '0.8rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85 }}
                className="desktop-nav">Sign In</Link>
            )}

            <Link to="/book" className="btn btn-gold btn-sm desktop-nav">
              Book Now
            </Link>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileOpen(v => !v)} className="mobile-menu-btn"
              style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none',
                border: 'none', cursor: 'pointer', padding: 4 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ display: 'block', width: 24, height: 1.5,
                  background: 'white', transition: 'all 0.3s ease',
                  transform: mobileOpen
                    ? i === 1 ? 'scaleX(0)' : i === 0 ? 'translateY(6.5px) rotate(45deg)' : 'translateY(-6.5px) rotate(-45deg)'
                    : 'none' }} />
              ))}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 300,
                background: 'var(--color-primary)', zIndex: 151, padding: '5rem 2rem 2rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {NAV_LINKS.map(({ label, href }) => (
                <Link key={href} to={href}
                  style={{ color: 'white', fontFamily: 'var(--font-heading)', fontSize: '1.5rem',
                    fontWeight: 500, padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {label}
                </Link>
              ))}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {user ? (
                  <>
                    <Link to="/dashboard" className="btn btn-outline-white">My Dashboard</Link>
                    <button onClick={logout} className="btn btn-secondary"
                      style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-outline-white">Sign In</Link>
                    <Link to="/register" className="btn btn-gold">Create Account</Link>
                  </>
                )}
                <Link to="/book" className="btn btn-gold">Reserve Now</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
