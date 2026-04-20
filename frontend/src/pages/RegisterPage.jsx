// ============================================================
// src/pages/RegisterPage.jsx
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', phone: '', newsletter_subscribed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'Registration failed. Please try again.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--color-background)', padding:'calc(var(--header-height) + 2rem) 2rem 3rem' }}>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
        style={{ background:'white', borderRadius:20, padding:'3rem', width:'100%', maxWidth:500,
          boxShadow:'0 8px 40px rgba(0,0,0,0.1)' }}>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--color-primary)',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
            <span style={{ fontFamily:'var(--font-heading)', color:'white', fontSize:'1.25rem', fontWeight:700 }}>GL</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2.25rem', color:'var(--color-primary)', marginBottom:'0.25rem' }}>
            Create Account
          </h1>
          <p style={{ color:'#6b7280', fontSize:'0.9rem', marginBottom:0 }}>
            Join Grand Lumière for exclusive member benefits
          </p>
        </div>

        {error && (
          <div style={{ background:'#fee2e2', color:'#991b1b', padding:'0.875rem',
            borderRadius:8, fontSize:'0.875rem', textAlign:'center', marginBottom:'1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            {[['first_name','First Name',true],['last_name','Last Name',true]].map(([k,l,r]) => (
              <div key={k} className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">{l}{r && ' *'}</label>
                <input type="text" className="form-input" required={r}
                  value={form[k]} onChange={e => update(k, e.target.value)} />
              </div>
            ))}
          </div>

          {[
            { k:'email', l:'Email Address *', t:'email', req:true },
            { k:'phone', l:'Phone Number', t:'tel', req:false },
            { k:'password', l:'Password (min. 8 chars) *', t:'password', req:true },
          ].map(({ k, l, t, req }) => (
            <div key={k} className="form-group">
              <label className="form-label">{l}</label>
              <input type={t} className="form-input" required={req}
                minLength={t==='password' ? 8 : undefined}
                value={form[k]} onChange={e => update(k, e.target.value)} />
            </div>
          ))}

          <label style={{ display:'flex', alignItems:'center', gap:'0.625rem', cursor:'pointer',
            fontSize:'0.875rem', color:'#4b5563', marginBottom:'1.5rem' }}>
            <input type="checkbox" checked={form.newsletter_subscribed}
              onChange={e => update('newsletter_subscribed', e.target.checked)}
              style={{ accentColor:'var(--color-primary)', width:16, height:16 }} />
            Subscribe to exclusive offers and hotel news
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary"
            style={{ width:'100%', padding:'1rem', fontSize:'0.95rem' }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.875rem', color:'#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--color-primary)', fontWeight:600 }}>Sign In</Link>
        </div>

        <p style={{ textAlign:'center', fontSize:'0.75rem', color:'#9ca3af', marginTop:'1rem', marginBottom:0 }}>
          By creating an account you agree to our{' '}
          <Link to="#" style={{ color:'var(--color-primary)' }}>Privacy Policy</Link> and{' '}
          <Link to="#" style={{ color:'var(--color-primary)' }}>Terms of Service</Link>
        </p>
      </motion.div>
    </div>
  );
}
