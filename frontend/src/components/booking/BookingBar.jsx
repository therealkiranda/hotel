// ============================================================
// src/components/booking/BookingBar.jsx — Search Widget
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBooking } from '../../context/BookingContext';

export default function BookingBar({ compact = false }) {
  const { updateBooking } = useBooking();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    check_in_date: today,
    check_out_date: tomorrow,
    adults: 1,
    children: 0,
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    updateBooking(form);
    navigate('/book');
  };

  const nights = Math.max(0, Math.ceil(
    (new Date(form.check_out_date) - new Date(form.check_in_date)) / 86400000
  ));

  const inputStyle = {
    width: '100%',
    border: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    color: '#1a1a1a',
    outline: 'none',
    padding: 0,
  };

  const fieldStyle = {
    flex: 1,
    minWidth: 140,
    padding: compact ? '0.75rem 1.25rem' : '1.25rem 1.5rem',
    borderRight: '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const labelStyle = {
    fontSize: '0.65rem',
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--color-primary)',
  };

  return (
    <motion.form onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      style={{ background: 'white', borderRadius: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', overflow: 'hidden' }}>

      {/* Check-in */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Check-in</label>
        <input type="date" value={form.check_in_date} min={today}
          onChange={e => {
            handleChange('check_in_date', e.target.value);
            if (e.target.value >= form.check_out_date) {
              const next = new Date(e.target.value);
              next.setDate(next.getDate() + 1);
              handleChange('check_out_date', next.toISOString().split('T')[0]);
            }
          }}
          style={{ ...inputStyle, cursor: 'pointer' }} required />
      </div>

      {/* Check-out */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Check-out</label>
        <input type="date" value={form.check_out_date}
          min={form.check_in_date || today}
          onChange={e => handleChange('check_out_date', e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }} required />
        {nights > 0 && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-secondary)' }}>
            {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
        )}
      </div>

      {/* Adults */}
      <div style={{ ...fieldStyle, minWidth: 110 }}>
        <label style={labelStyle}>Adults</label>
        <select value={form.adults} onChange={e => handleChange('adults', parseInt(e.target.value))}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Children */}
      <div style={{ ...fieldStyle, minWidth: 110 }}>
        <label style={labelStyle}>Children</label>
        <select value={form.children} onChange={e => handleChange('children', parseInt(e.target.value))}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* CTA */}
      <button type="submit" className="btn btn-primary"
        style={{ borderRadius: 0, padding: '1.25rem 2.5rem', fontWeight: 600,
          fontSize: '0.85rem', letterSpacing: '0.15em', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Check Availability
      </button>
    </motion.form>
  );
}
