// ============================================================
// src/pages/BookingPage.jsx — Multi-Step Booking Workflow
// FIX #5: Only show enabled payment methods, phone required
// FIX #2: Use formatPrice from ThemeContext for currency display
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BookingBar from '../components/booking/BookingBar';

const STEPS = ['Select Room', 'Guest Details', 'Confirm & Pay'];

export default function BookingPage() {
  const { booking, updateBooking, updateGuestInfo, setAvailability } = useBooking();
  const { user } = useAuth();
  const { hotel, formatPrice } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [selectedAvail, setSelectedAvail] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill guest info if logged in
  useEffect(() => {
    if (user) {
      updateGuestInfo({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Fetch rooms when dates/guests are set
  useEffect(() => {
    if (booking.check_in_date && booking.check_out_date) {
      setLoading(true);
      api.get(`/rooms?check_in=${booking.check_in_date}&check_out=${booking.check_out_date}&adults=${booking.adults}&children=${booking.children}`)
        .then(r => setRooms(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [booking.check_in_date, booking.check_out_date, booking.adults, booking.children]);

  const checkAvailability = async (roomCategory) => {
    setCheckingAvail(true);
    try {
      const { data } = await api.post('/bookings/check-availability', {
        room_category_id: roomCategory.id,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        adults: booking.adults,
        children: booking.children,
      });

      if (data.available) {
        setSelectedAvail(data);
        updateBooking({
          room_category_id: roomCategory.id,
          room_id: data.room_id,
          room_name: roomCategory.name,
          room_rate: data.room_rate,
          nights: data.nights,
          subtotal: parseFloat(data.subtotal),
          taxes: parseFloat(data.taxes),
          total: parseFloat(data.total),
        });
        setStep(1);
      } else {
        setError(data.message || 'Room not available for selected dates');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to check availability');
    } finally {
      setCheckingAvail(false);
    }
  };

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', {
        room_id: booking.room_id,
        room_category_id: booking.room_category_id,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        adults: booking.adults,
        children: booking.children,
        room_rate: booking.room_rate,
        promo_code: promoInput || undefined,
        payment_method: booking.payment_method,
        special_requests: booking.guest_info.special_requests,
        guest_first_name: booking.guest_info.first_name,
        guest_last_name: booking.guest_info.last_name,
        guest_email: booking.guest_info.email,
        guest_phone: booking.guest_info.phone,
        guest_nationality: booking.guest_info.nationality,
      });
      navigate(`/book/confirm/${data.booking_reference}`, {
        state: {
          guest_account_created: data.guest_account_created,
          temp_password: data.temp_password,
        }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // formatPrice comes from ThemeContext (currency-aware)

  return (
    <div style={{ paddingTop: 'var(--header-height)', background: 'var(--color-background)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-primary)', padding: '3rem 0 5rem' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-heading)', color: 'white', fontSize: 'clamp(2rem, 4vw, 3rem)',
            marginBottom: '0.5rem' }}>Reserve Your Stay</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 0 }}>Best rate guaranteed when booking directly</p>
        </div>
      </div>

      <div className="container" style={{ marginTop: -40 }}>
        <BookingBar compact />

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
          margin: '3rem 0 2rem', flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%',
                background: i <= step ? 'var(--color-primary)' : '#e5e7eb',
                color: i <= step ? 'white' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.3s',
                boxShadow: i === step ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: i === step ? 600 : 400,
                color: i === step ? 'var(--color-primary)' : '#9ca3af' }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ width: 40, height: 1, background: '#e5e7eb', marginLeft: '0.25rem' }} />}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b',
            padding: '1rem 1.25rem', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: Select Room */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: 'var(--color-primary)',
                marginBottom: '1.5rem' }}>Choose Your Accommodation</h2>

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="card">
                      <div className="skeleton" style={{ height: 200 }} />
                      <div style={{ padding: '1.25rem' }}>
                        <div className="skeleton" style={{ height: 20, marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 16 }} />
                        <div className="skeleton" style={{ height: 38 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Please select check-in and check-out dates above to see available rooms.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {rooms.map(room => {
                    const avail = room.availability;
                    const isAvailable = !avail || avail.available_rooms > 0;
                    return (
                      <div key={room.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', opacity: isAvailable ? 1 : 0.6 }}>
                        <div style={{ height: 200, background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, #000))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {room.images?.[0] ? (
                            <img src={room.images[0]} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontFamily: 'var(--font-heading)', color: 'rgba(255,255,255,0.3)', fontSize: '3rem' }}>GL</span>
                          )}
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-primary)',
                            marginBottom: '0.5rem' }}>{room.name}</h3>
                          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.6 }}>
                            {room.short_description}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                            {room.highlights?.slice(0, 3).map(h => (
                              <span key={h} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999,
                                background: '#f3f4f6', color: '#6b7280' }}>{h}</span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem',
                                color: 'var(--color-secondary)', fontWeight: 700 }}>
                                ${Number(room.base_price).toLocaleString()}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/night</span>
                            </div>
                            <button onClick={() => isAvailable && checkAvailability(room)}
                              disabled={!isAvailable || checkingAvail}
                              className="btn btn-primary btn-sm"
                              style={{ opacity: isAvailable ? 1 : 0.5 }}>
                              {checkingAvail ? 'Checking...' : isAvailable ? 'Select' : 'Unavailable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: Guest Details */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '2rem', alignItems: 'start' }} className="booking-grid">
                <div style={{ background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
                    Your Details
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {[
                      { field: 'first_name', label: 'First Name', type: 'text', required: true },
                      { field: 'last_name', label: 'Last Name', type: 'text', required: true },
                      { field: 'email', label: 'Email Address', type: 'email', required: true },
                      { field: 'phone', label: 'Phone Number *', type: 'tel', required: true },
                    ].map(({ field, label, type, required }) => (
                      <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{label}</label>
                        <input type={type} className="form-input" required={required}
                          value={booking.guest_info[field] || ''}
                          onChange={e => updateGuestInfo({ [field]: e.target.value })} />
                      </div>
                    ))}
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                      <label className="form-label">Nationality</label>
                      <input type="text" className="form-input"
                        value={booking.guest_info.nationality || ''}
                        onChange={e => updateGuestInfo({ nationality: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                      <label className="form-label">Special Requests</label>
                      <textarea className="form-input" rows={3}
                        placeholder="Anniversary, dietary needs, late check-in, etc."
                        value={booking.guest_info.special_requests || ''}
                        onChange={e => updateGuestInfo({ special_requests: e.target.value })} />
                    </div>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-primary)',
                    margin: '2rem 0 1.25rem' }}>Payment Method</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[
                      hotel?.cash_payment_enabled   && ['cash',        'Pay at Hotel'],
                      hotel?.qr_payment_enabled     && ['qr_transfer', hotel?.qr_payment_title || 'QR / Bank Transfer'],
                      hotel?.online_payment_enabled && ['card',        'Credit Card (Online)'],
                    ].filter(Boolean).map(([val, lbl]) => (
                      <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
                        cursor: 'pointer', padding: '0.75rem 1.25rem', borderRadius: 8,
                        border: `1.5px solid ${booking.payment_method === val ? 'var(--color-primary)' : '#e5e7eb'}`,
                        background: booking.payment_method === val ? 'rgba(26,60,46,0.05)' : 'white',
                        transition: 'all 0.2s', fontSize: '0.875rem', fontWeight: 500 }}>
                        <input type="radio" name="payment" value={val}
                          checked={booking.payment_method === val}
                          onChange={() => updateBooking({ payment_method: val })}
                          style={{ accentColor: 'var(--color-primary)' }} />
                        {lbl}
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button onClick={() => setStep(0)} className="btn btn-secondary">← Back</button>
                    <button onClick={() => {
                      const g = booking.guest_info;
                      if (!g.first_name || !g.last_name || !g.email || !g.phone) {
                        setError('Please fill in all required fields including phone number');
                        return;
                      }
                      if (!booking.payment_method) {
                        setError('Please select a payment method');
                        return;
                      }
                      setError('');
                      setStep(2);
                    }} className="btn btn-primary" style={{ flex: 1 }}>Continue to Review →</button>
                  </div>
                </div>

                {/* Booking Summary Sidebar */}
                <BookingSummary booking={booking} promoInput={promoInput} setPromoInput={setPromoInput} formatPrice={formatPrice} />
              </div>
            </motion.div>
          )}

          {/* STEP 2: Confirm */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '2rem', alignItems: 'start' }} className="booking-grid">
                <div style={{ background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
                    Review & Confirm
                  </h2>

                  {/* Summary Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 2rem', marginBottom: '2rem' }}>
                    {[
                      ['Room', booking.room_name],
                      ['Guests', `${booking.adults} adult${booking.adults > 1 ? 's' : ''}${booking.children > 0 ? `, ${booking.children} child` : ''}`],
                      ['Check-in', booking.check_in_date],
                      ['Check-out', booking.check_out_date],
                      ['Duration', `${booking.nights} night${booking.nights !== 1 ? 's' : ''}`],
                      ['Payment', booking.payment_method?.replace('_', ' ')],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: '#9ca3af', marginBottom: 2 }}>{l}</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-primary)', textTransform: 'capitalize' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: '#9ca3af', marginBottom: '0.5rem' }}>Guest</div>
                    <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: 2 }}>
                      {booking.guest_info.first_name} {booking.guest_info.last_name}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 2 }}>{booking.guest_info.email}</p>
                    {booking.guest_info.phone && <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 0 }}>{booking.guest_info.phone}</p>}
                  </div>

                  <div style={{ background: '#f8f5f0', borderRadius: 8, padding: '1rem 1.25rem',
                    fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.7, marginBottom: '2rem' }}>
                    By confirming this booking, you agree to our cancellation policy and hotel terms. 
                    A confirmation email will be sent to {booking.guest_info.email}.
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setStep(1)} className="btn btn-secondary">← Edit Details</button>
                    <button onClick={handleSubmitBooking} disabled={submitting}
                      className="btn btn-gold" style={{ flex: 1, fontSize: '0.95rem', padding: '1.1rem' }}>
                      {submitting ? 'Confirming...' : `Confirm Booking — ${formatPrice(booking.total)}`}
                    </button>
                  </div>
                </div>

                <BookingSummary booking={booking} formatPrice={formatPrice} showPromo={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: '4rem' }} />
      </div>
    </div>
  );
}

function BookingSummary({ booking, promoInput, setPromoInput, formatPrice, showPromo = true }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.07)', position: 'sticky', top: 100 }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-primary)',
        marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}>
        Booking Summary
      </h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
        <span style={{ color: '#6b7280' }}>{booking.room_name || '—'}</span>
        <span style={{ fontWeight: 600 }}>{booking.nights} nights</span>
      </div>
      {[
        ['Room Rate', `${formatPrice(booking.room_rate)} × ${booking.nights}n`],
        ['Subtotal', formatPrice(booking.subtotal)],
        ['Taxes & Fees (15%)', formatPrice(booking.taxes)],
        ['Service Charge (5%)', formatPrice(booking.subtotal * 0.05 || 0)],
      ].map(([l, v]) => (
        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0',
          fontSize: '0.85rem', borderBottom: '1px solid #f9fafb' }}>
          <span style={{ color: '#6b7280' }}>{l}</span>
          <span>{v}</span>
        </div>
      ))}

      {showPromo && (
        <div style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#9ca3af', display: 'block', marginBottom: 4 }}>Promo Code</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" placeholder="Enter code" value={promoInput}
              onChange={e => setPromoInput(e.target.value.toUpperCase())}
              style={{ flex: 1, padding: '0.6rem 0.875rem', border: '1.5px solid #e5e7eb',
                borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none' }} />
            <button className="btn btn-secondary btn-sm">Apply</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '2px solid var(--color-primary)' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700,
          color: 'var(--color-primary)' }}>Total</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700,
          color: 'var(--color-secondary)' }}>{formatPrice(booking.total)}</span>
      </div>
      <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.5rem', marginBottom: 0 }}>
        Includes all taxes and service charges
      </p>
    </div>
  );
}
