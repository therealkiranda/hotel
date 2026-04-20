// ============================================================
// src/pages/LoginPage.jsx
// ============================================================
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-background)',
      padding: 'calc(var(--header-height) + 2rem) 2rem 3rem' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'white', borderRadius: 20, padding: '3rem', width: '100%', maxWidth: 440,
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>GL</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem',
            color: 'var(--color-primary)', marginBottom: '0.25rem' }}>Welcome Back</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 0 }}>
            Sign in to manage your reservations
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.875rem',
            borderRadius: 8, fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" required autoFocus
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create one</Link>
        </div>
      </motion.div>
    </div>
  );
}
