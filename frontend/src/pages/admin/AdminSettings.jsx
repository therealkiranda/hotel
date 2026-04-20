// ============================================================
// src/pages/admin/AdminSettings.jsx
// FIX #4,#5,#6,#9,#10,#11,#14: All settings in one place
// Tabs: Hotel Info | Payments | Social Auth | Currency | Profile | System
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../utils/api';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

const CURRENCIES = [
  { code:'USD', symbol:'$', name:'US Dollar' },
  { code:'EUR', symbol:'€', name:'Euro' },
  { code:'GBP', symbol:'£', name:'British Pound' },
  { code:'NPR', symbol:'रू', name:'Nepalese Rupee' },
  { code:'INR', symbol:'₹', name:'Indian Rupee' },
  { code:'AUD', symbol:'A$', name:'Australian Dollar' },
  { code:'CAD', symbol:'C$', name:'Canadian Dollar' },
  { code:'SGD', symbol:'S$', name:'Singapore Dollar' },
  { code:'AED', symbol:'د.إ', name:'UAE Dirham' },
  { code:'THB', symbol:'฿', name:'Thai Baht' },
  { code:'JPY', symbol:'¥', name:'Japanese Yen' },
  { code:'CNY', symbol:'¥', name:'Chinese Yuan' },
  { code:'CHF', symbol:'Fr', name:'Swiss Franc' },
  { code:'MYR', symbol:'RM', name:'Malaysian Ringgit' },
  { code:'ZAR', symbol:'R', name:'South African Rand' },
];

const API_BASE = (import.meta.env.VITE_API_URL||'http://localhost:4000/api').replace('/api','');

const TABS = [
  { id:'hotel',   label:'🏨 Hotel Info' },
  { id:'logo',    label:'🖼 Logo' },
  { id:'payments', label:'💳 Payments' },
  { id:'social',  label:'🔐 Social Login' },
  { id:'currency', label:'💱 Currency' },
  { id:'profile', label:'👤 My Profile' },
  { id:'system',  label:'⚙️ System' },
];

export default function AdminSettings() {
  const [tab, setTab]         = useState('hotel');
  const [info, setInfo]       = useState({});
  const [social, setSocial]   = useState([]);
  const [admin, setAdmin]     = useState({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState('');
  const [loading, setLoading] = useState(true);
  const qrInputRef            = useRef(null);
  const logoInputRef          = useRef(null);

  useEffect(() => {
    Promise.all([
      adminApi.get('/admin/hotel-info').then(r => setInfo(r.data)).catch(() => {}),
      adminApi.get('/admin/social-auth').then(r => setSocial(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));

    // Get admin profile from token
    try {
      const token   = localStorage.getItem('hotel_admin_token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      setAdmin({ name: payload.name || '', email: payload.email || '', role: payload.role || '' });
    } catch {}
  }, []);

  const save = async (section, data) => {
    setSaving(true);
    try {
      await adminApi.put('/admin/hotel-info', data);
      setInfo(prev => ({ ...prev, ...data }));
      setSaved(section);
      setTimeout(() => setSaved(''), 2000);
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'qr_code');
    try {
      const { data } = await adminApi.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setInfo(prev => ({ ...prev, qr_code_image_path: data.file_path }));
      alert('QR code uploaded and saved ✓');
    } catch { alert('Upload failed'); }
  };

  const toggleSocial = async (provider, enabled, extras = {}) => {
    await adminApi.put(`/admin/social-auth/${provider}`, { is_enabled: enabled ? 1 : 0, ...extras });
    setSocial(prev => prev.map(s => s.provider === provider ? { ...s, is_enabled: enabled ? 1 : 0, ...extras } : s));
    setSaved('social'); setTimeout(() => setSaved(''), 1500);
  };

  const i = (k, v) => setInfo(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)', marginBottom:0 }}>
          Settings
        </h1>
        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:0 }}>
          Manage hotel information, payments, social login, currency, and system configuration
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1.5rem', background:'white',
        borderRadius:14, padding:'0.375rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
        overflowX:'auto', flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'0.625rem 1rem', border:'none', cursor:'pointer', borderRadius:10,
              fontFamily:'var(--font-body)', fontSize:'0.82rem', fontWeight:tab===t.id?600:400,
              color:tab===t.id?'white':'#64748b',
              background:tab===t.id?'var(--color-primary)':'transparent',
              transition:'all 0.2s', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>}

      {/* ══ HOTEL INFO ══════════════════════════════════ */}
      {!loading && tab === 'hotel' && (
        <SettingsCard title="Hotel Information"
          onSave={() => save('hotel', info)} saving={saving} saved={saved==='hotel'}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
            {[
              { k:'name',              l:'Hotel Name *',         full:true },
              { k:'tagline',           l:'Tagline',              full:true },
              { k:'address',           l:'Street Address',       full:true },
              { k:'city',              l:'City' },
              { k:'country',           l:'Country' },
              { k:'postal_code',       l:'Postal / ZIP Code' },
              { k:'phone',             l:'Main Phone',           t:'tel' },
              { k:'phone_secondary',   l:'Secondary Phone',      t:'tel' },
              { k:'email',             l:'Main Email',           t:'email' },
              { k:'email_reservations',l:'Reservations Email',   t:'email' },
              { k:'check_in_time',     l:'Check-in Time',        t:'time' },
              { k:'check_out_time',    l:'Check-out Time',       t:'time' },
              { k:'facebook_url',      l:'Facebook URL' },
              { k:'instagram_url',     l:'Instagram URL' },
              { k:'twitter_url',       l:'Twitter / X URL' },
              { k:'tripadvisor_url',   l:'TripAdvisor URL' },
            ].map(({ k, l, t='text', full }) => (
              <Field key={k} label={l} value={info[k]||''} type={t}
                onChange={v => i(k, v)} full={full} />
            ))}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>Description</label>
              <textarea rows={4} value={info.description||''} onChange={e => i('description', e.target.value)}
                style={inputStyle({ resize:'vertical' })} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>Cancellation Policy</label>
              <textarea rows={3} value={info.cancellation_policy||''} onChange={e => i('cancellation_policy', e.target.value)}
                style={inputStyle({ resize:'vertical' })} />
            </div>
          </div>
        </SettingsCard>
      )}

      {/* ══ LOGO ════════════════════════════════════════ */}
      {!loading && tab === 'logo' && (
        <SettingsCard title="🖼 Hotel Logo" saving={saving} saved={saved==='logo'}
          onSave={() => save('logo', { logo_path: info.logo_path })}>
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'1.25rem', fontSize:'0.85rem', color:'#64748b', lineHeight:1.7 }}>
              Upload your hotel logo. It appears in the website header and admin panel sidebar.
              If no logo is uploaded, the hotel name text is shown. Recommended: PNG or SVG with transparent background.
            </div>
            <div style={{ display:'flex', gap:'2rem', alignItems:'flex-start', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'#475569', marginBottom:'0.75rem' }}>Current Logo</div>
                {info.logo_path ? (
                  <div style={{ position:'relative', display:'inline-block' }}>
                    <img src={API_BASE + '/' + info.logo_path} alt="Logo"
                      style={{ maxHeight:80, maxWidth:240, objectFit:'contain', border:'1px solid #e2e8f0', borderRadius:8, padding:8, background:'white' }}
                      onError={e => e.target.style.display='none'} />
                    <button onClick={async () => {
                        await adminApi.put('/admin/hotel-info', { logo_path: '' });
                        i('logo_path', '');
                        setSaved('logo'); setTimeout(() => setSaved(''), 2000);
                      }}
                      style={{ position:'absolute', top:-8, right:-8, width:22, height:22, borderRadius:'50%', background:'#ef4444', color:'white', border:'none', cursor:'pointer', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                  </div>
                ) : (
                  <div style={{ width:160, height:80, border:'2px dashed #e2e8f0', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.8rem' }}>No logo uploaded</div>
                )}
              </div>
              <div>
                <div style={{ fontSize:'0.7rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'#475569', marginBottom:'0.75rem' }}>Upload New Logo</div>
                <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const fd = new FormData(); fd.append('file', file); fd.append('category', 'logo');
                    try {
                      const { data } = await adminApi.post('/media/upload', fd, { headers:{'Content-Type':'multipart/form-data'} });
                      i('logo_path', data.file_path);
                      await adminApi.put('/admin/hotel-info', { logo_path: data.file_path });
                      setSaved('logo'); setTimeout(() => setSaved(''), 2000);
                    } catch { alert('Upload failed'); }
                  }}
                  style={{ display:'none' }} />
                <button onClick={() => logoInputRef.current?.click()} className="btn btn-secondary">📤 Upload Logo</button>
                <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:'0.5rem', lineHeight:1.5 }}>PNG, SVG, JPG or WebP · Max 10MB</div>
              </div>
            </div>
          </div>
        </SettingsCard>
      )}

      {/* ══ PAYMENTS ════════════════════════════════════ */}
      {!loading && tab === 'payments' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          {/* Cash */}
          <SettingsCard title="💵 Cash Payment"
            onSave={() => save('cash', { cash_payment_enabled: info.cash_payment_enabled })}
            saving={saving} saved={saved==='cash'}>
            <ToggleRow label="Accept Cash Payments" desc="Guests can pay in cash at the hotel"
              value={!!info.cash_payment_enabled}
              onChange={v => i('cash_payment_enabled', v ? 1 : 0)} />
          </SettingsCard>

          {/* QR Payment */}
          <SettingsCard title="📱 QR Code / Bank Transfer"
            onSave={() => save('qr', {
              qr_payment_enabled: info.qr_payment_enabled,
              qr_payment_title: info.qr_payment_title,
              qr_bank_name: info.qr_bank_name,
              qr_account_name: info.qr_account_name,
              qr_account_number: info.qr_account_number,
              qr_payment_instructions: info.qr_payment_instructions,
              qr_payment_deadline_hours: info.qr_payment_deadline_hours,
            })} saving={saving} saved={saved==='qr'}>

            <ToggleRow label="Enable QR / Bank Transfer Payment"
              desc="Show QR code and bank details at checkout; customers upload payment proof"
              value={!!info.qr_payment_enabled}
              onChange={v => i('qr_payment_enabled', v ? 1 : 0)} />

            {!!info.qr_payment_enabled && (
              <div style={{ marginTop:'1.25rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
                <Field label="Payment Method Label" value={info.qr_payment_title||'QR / Bank Transfer'}
                  onChange={v => i('qr_payment_title', v)} placeholder="e.g. eSewa / QR / Bank Transfer" />
                <Field label="Bank Name" value={info.qr_bank_name||''}
                  onChange={v => i('qr_bank_name', v)} placeholder="e.g. Himalayan Bank" />
                <Field label="Account Name" value={info.qr_account_name||''}
                  onChange={v => i('qr_account_name', v)} placeholder="e.g. Grand Lumière Hotel Pvt. Ltd." />
                <Field label="Account Number" value={info.qr_account_number||''}
                  onChange={v => i('qr_account_number', v)} placeholder="e.g. 01234567890" />
                <Field label="Payment Deadline (hours)" type="number" value={info.qr_payment_deadline_hours||24}
                  onChange={v => i('qr_payment_deadline_hours', v)} placeholder="24" />
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={labelStyle}>Payment Instructions (shown to customer)</label>
                  <textarea rows={3} value={info.qr_payment_instructions||''}
                    onChange={e => i('qr_payment_instructions', e.target.value)}
                    placeholder="Scan the QR code or transfer to the account above. Use your booking reference as the payment note."
                    style={inputStyle({ resize:'vertical' })} />
                </div>

                {/* QR Image Upload */}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={labelStyle}>QR Code Image</label>
                  <div style={{ display:'flex', gap:'1.25rem', alignItems:'flex-start' }}>
                    {info.qr_code_image_path ? (
                      <div style={{ position:'relative' }}>
                        <img src={`${API_URL}/${info.qr_code_image_path}`} alt="QR Code"
                          style={{ width:120, height:120, objectFit:'contain', border:'1px solid #e2e8f0', borderRadius:10 }}
                          onError={e => e.target.style.display='none'} />
                        <button onClick={() => i('qr_code_image_path', '')}
                          style={{ position:'absolute', top:-8, right:-8, width:22, height:22, borderRadius:'50%',
                            background:'#ef4444', color:'white', border:'none', cursor:'pointer', fontSize:'0.7rem' }}>
                          ×
                        </button>
                      </div>
                    ) : (
                      <div style={{ width:120, height:120, border:'2px dashed #e2e8f0', borderRadius:10,
                        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                        color:'#94a3b8', fontSize:'0.75rem', gap:'0.375rem' }}>
                        <span style={{ fontSize:'2rem' }}>📱</span>No QR yet
                      </div>
                    )}
                    <div>
                      <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQRUpload}
                        style={{ display:'none' }} />
                      <button onClick={() => qrInputRef.current?.click()}
                        className="btn btn-secondary btn-sm" style={{ marginBottom:'0.5rem', display:'block' }}>
                        📤 Upload QR Code Image
                      </button>
                      <div style={{ fontSize:'0.75rem', color:'#94a3b8', lineHeight:1.5 }}>
                        Upload your bank or payment app QR code.<br />
                        Accepted: JPG, PNG, WebP (max 10MB)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SettingsCard>

          {/* Online Payment (Future) */}
          <SettingsCard title="💳 Online Payment (Coming Soon)"
            onSave={() => save('online', {
              online_payment_enabled: info.online_payment_enabled,
              online_payment_provider: info.online_payment_provider,
              online_payment_key: info.online_payment_key,
              online_payment_secret: info.online_payment_secret,
            })} saving={saving} saved={saved==='online'}>

            <ToggleRow label="Enable Online Payment Gateway"
              desc="Allow credit/debit card payments through an online gateway"
              value={!!info.online_payment_enabled}
              onChange={v => i('online_payment_enabled', v ? 1 : 0)} />

            {!!info.online_payment_enabled && (
              <div style={{ marginTop:'1.25rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={labelStyle}>Payment Provider</label>
                  <select value={info.online_payment_provider||''} onChange={e => i('online_payment_provider', e.target.value)}
                    style={inputStyle()}>
                    <option value="">Select provider...</option>
                    {['Stripe','PayPal','Razorpay','eSewa','Khalti','Flutterwave','Square'].map(p => (
                      <option key={p} value={p.toLowerCase()}>{p}</option>
                    ))}
                  </select>
                </div>
                <Field label="API Key / Public Key" value={info.online_payment_key||''}
                  onChange={v => i('online_payment_key', v)} placeholder="pk_live_..." />
                <Field label="Secret Key" type="password" value={info.online_payment_secret||''}
                  onChange={v => i('online_payment_secret', v)} placeholder="sk_live_..." />
                <div style={{ gridColumn:'1/-1', background:'#fef3c7', borderRadius:8, padding:'0.875rem 1rem',
                  fontSize:'0.82rem', color:'#92400e' }}>
                  ⚠️ Online payment integration requires developer setup. Add your provider's SDK
                  to the frontend and webhook handler to the backend. The credentials above are stored
                  securely and will be used by the payment module.
                </div>
              </div>
            )}
          </SettingsCard>
        </div>
      )}

      {/* ══ SOCIAL LOGIN ════════════════════════════════ */}
      {!loading && tab === 'social' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div style={{ background:'#eff6ff', borderRadius:12, padding:'1rem 1.25rem',
            fontSize:'0.82rem', color:'#3b82f6', lineHeight:1.7 }}>
            🔐 Enable social login to let guests sign in with their existing accounts.
            You must create OAuth apps in each platform's developer console and add the credentials here.
            The callback URL for each is shown below.
          </div>

          {social.map(s => (
            <SocialProviderCard key={s.provider} provider={s}
              onSave={(data) => toggleSocial(s.provider, data.is_enabled, data)}
              saved={saved === 'social'} />
          ))}
        </div>
      )}

      {/* ══ CURRENCY ════════════════════════════════════ */}
      {!loading && tab === 'currency' && (
        <SettingsCard title="💱 Currency & Region Settings"
          onSave={() => save('currency', { default_currency: info.default_currency, currency_symbol: info.currency_symbol })}
          saving={saving} saved={saved==='currency'}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>Default Currency</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'0.75rem', marginTop:'0.5rem' }}>
                {CURRENCIES.map(cur => (
                  <button key={cur.code} onClick={() => { i('default_currency', cur.code); i('currency_symbol', cur.symbol); }}
                    style={{ padding:'0.75rem 1rem', border:'1.5px solid',
                      borderColor: info.default_currency===cur.code ? 'var(--color-primary)' : '#e2e8f0',
                      borderRadius:10, cursor:'pointer', textAlign:'left',
                      background: info.default_currency===cur.code ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'white',
                      transition:'all 0.2s', fontFamily:'var(--font-body)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontWeight:600, color:'var(--color-primary)', fontSize:'1.1rem' }}>{cur.symbol}</span>
                      <span style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:600 }}>{cur.code}</span>
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'#475569', marginTop:2 }}>{cur.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Custom Currency Symbol</label>
              <input value={info.currency_symbol||'$'} onChange={e => i('currency_symbol', e.target.value)}
                placeholder="$" maxLength={5} style={inputStyle()} />
              <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:4 }}>
                Override the symbol shown to guests (e.g. रू for NPR)
              </div>
            </div>
            <div>
              <label style={labelStyle}>Currency Code</label>
              <input value={info.default_currency||'USD'} onChange={e => i('default_currency', e.target.value)}
                placeholder="USD" maxLength={10} style={inputStyle()} />
            </div>

            <div style={{ gridColumn:'1/-1', background:'#f8fafc', borderRadius:10, padding:'1rem',
              fontSize:'0.82rem', color:'#64748b', lineHeight:1.7 }}>
              <strong>Preview:</strong> Room price will be shown as{' '}
              <strong>{info.currency_symbol||'$'}250 {info.default_currency||'USD'}</strong> per night
            </div>
          </div>
        </SettingsCard>
      )}

      {/* ══ MY PROFILE ══════════════════════════════════ */}
      {!loading && tab === 'profile' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          <SettingsCard title="👤 Profile Information"
            onSave={async () => {
              setSaving(true);
              try {
                await adminApi.put('/admin/profile', { name: admin.name, email: admin.email });
                setSaved('profile'); setTimeout(() => setSaved(''), 2000);
              } catch (err) {
                alert(err.response?.data?.error || 'Failed to update profile');
              } finally { setSaving(false); }
            }} saving={saving} saved={saved==='profile'}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
              <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:'1.25rem',
                padding:'1.25rem', background:'#f8fafc', borderRadius:12 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--color-primary)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontFamily:'var(--font-heading)', fontSize:'1.5rem', fontWeight:700, flexShrink:0 }}>
                  {admin.name?.[0] || 'A'}
                </div>
                <div>
                  <div style={{ fontWeight:700, color:'var(--color-primary)', fontSize:'1.05rem' }}>{admin.name}</div>
                  <div style={{ fontSize:'0.85rem', color:'#64748b' }}>{admin.email}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--color-secondary)', textTransform:'capitalize', marginTop:2 }}>
                    {admin.role?.replace('_',' ')}
                  </div>
                </div>
              </div>
              <Field label="Full Name" value={admin.name||''} onChange={v => setAdmin(p=>({...p,name:v}))} />
              <Field label="Email Address" type="email" value={admin.email||''} onChange={v => setAdmin(p=>({...p,email:v}))} />
            </div>
          </SettingsCard>

          <PasswordChangeCard />
        </div>
      )}

      {/* ══ SYSTEM ══════════════════════════════════════ */}
      {!loading && tab === 'system' && (
        <SettingsCard title="⚙️ System Controls"
          onSave={() => save('system', {
            booking_system_enabled: info.booking_system_enabled,
            maintenance_message: info.maintenance_message,
          })} saving={saving} saved={saved==='system'}>

          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <ToggleRow label="Booking System Active"
              desc="When OFF, guests cannot make new bookings. Existing bookings are unaffected."
              value={info.booking_system_enabled !== 0}
              onChange={v => i('booking_system_enabled', v ? 1 : 0)}
              danger={!info.booking_system_enabled} />

            {!info.booking_system_enabled && (
              <div>
                <label style={labelStyle}>Maintenance Message (shown to guests)</label>
                <textarea rows={3} value={info.maintenance_message||''}
                  onChange={e => i('maintenance_message', e.target.value)}
                  placeholder="Our booking system is temporarily offline for maintenance. Please call us to make a reservation."
                  style={inputStyle({ resize:'vertical' })} />
              </div>
            )}

            <div style={{ background:'#f8fafc', borderRadius:10, padding:'1rem 1.25rem',
              fontSize:'0.82rem', color:'#64748b', lineHeight:1.8 }}>
              <div style={{ fontWeight:600, color:'#475569', marginBottom:'0.5rem' }}>📊 System Information</div>
              <div>Version: Grand Lumière Hotel System v2.0</div>
              <div>Database: MySQL / MariaDB</div>
              <div>API: Node.js + Express</div>
              <div>Frontend: React + Vite</div>
            </div>
          </div>
        </SettingsCard>
      )}
    </div>
  );
}

// ─── Reusable Components ─────────────────────────────────────

const labelStyle = {
  display: 'block', fontSize: '0.68rem', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569', marginBottom: 4,
};

const inputStyle = (extra = {}) => ({
  width: '100%', padding: '0.625rem 0.875rem', border: '1.5px solid #e2e8f0',
  borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
  ...extra,
});

function Field({ label, value, onChange, type='text', placeholder, full }) {
  return (
    <div style={{ gridColumn: full ? '1/-1' : undefined }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={inputStyle()} />
    </div>
  );
}

function SettingsCard({ title, children, onSave, saving, saved }) {
  return (
    <div style={{ background:'white', borderRadius:16, padding:'2rem',
      boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', margin:0 }}>
          {title}
        </h2>
        {onSave && (
          <button onClick={onSave} disabled={saving}
            style={{ padding:'0.5rem 1.5rem', background: saved ? '#065f46' : 'var(--color-primary)',
              color:'white', border:'none', borderRadius:8, cursor:saving?'not-allowed':'pointer',
              fontSize:'0.82rem', fontWeight:600, fontFamily:'var(--font-body)', transition:'all 0.3s' }}>
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange, danger }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' }}>
      <div>
        <div style={{ fontWeight:600, color: danger ? '#991b1b' : '#1e293b', fontSize:'0.9rem' }}>{label}</div>
        {desc && <div style={{ fontSize:'0.8rem', color:'#64748b', marginTop:2 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ width:48, height:26, borderRadius:999, border:'none', cursor:'pointer', flexShrink:0,
          background: value ? (danger?'#991b1b':'var(--color-primary)') : '#e2e8f0',
          position:'relative', transition:'background 0.3s' }}>
        <span style={{ position:'absolute', top:3, left:value?24:2, width:20, height:20,
          borderRadius:'50%', background:'white', transition:'left 0.3s',
          boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
}

function SocialProviderCard({ provider: p, onSave, saved }) {
  const [data, setData] = useState({
    is_enabled: p.is_enabled,
    client_id: p.client_id || '',
    client_secret: p.client_secret || '',
    redirect_uri: p.redirect_uri || '',
  });
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]     = useState(false);

  const INFO = {
    google:   { icon:'🔵', label:'Google', docs:'https://console.cloud.google.com/apis/credentials', color:'#4285f4' },
    facebook: { icon:'🔷', label:'Facebook', docs:'https://developers.facebook.com/apps/', color:'#1877f2' },
    apple:    { icon:'⬛', label:'Apple', docs:'https://developer.apple.com/account/resources/identifiers/list', color:'#000' },
  };
  const info = INFO[p.provider] || { icon:'🔑', label:p.provider, docs:'#', color:'#64748b' };
  const callbackUrl = `${window.location.origin}/api/auth/social/${p.provider}/callback`;

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(data); }
    catch { alert('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background:'white', borderRadius:16, overflow:'hidden',
      boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${data.is_enabled?info.color+'30':'#e2e8f0'}` }}>
      <div style={{ padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
        <span style={{ fontSize:'1.5rem' }}>{info.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, color:'var(--color-primary)' }}>{info.label} Login</div>
          <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
            {data.is_enabled ? '✅ Active — users can sign in with ' + info.label : '⭕ Disabled'}
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          {/* Enable toggle */}
          <button onClick={() => setData(d => ({ ...d, is_enabled: d.is_enabled ? 0 : 1 }))}
            style={{ width:44, height:24, borderRadius:999, border:'none', cursor:'pointer',
              background: data.is_enabled ? info.color : '#e2e8f0', position:'relative', transition:'background 0.3s' }}>
            <span style={{ position:'absolute', top:2, left:data.is_enabled?22:2, width:20, height:20,
              borderRadius:'50%', background:'white', transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
          </button>
          <button onClick={() => setExpanded(v => !v)}
            style={{ padding:'6px 14px', border:'1px solid #e2e8f0', borderRadius:8,
              background:'white', cursor:'pointer', fontSize:'0.8rem', color:'#475569' }}>
            {expanded ? 'Close ▲' : 'Configure ▼'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'1.25rem 1.5rem', borderTop:'1px solid #f1f5f9',
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
              <div style={{ gridColumn:'1/-1', background:'#eff6ff', borderRadius:8,
                padding:'0.875rem 1rem', fontSize:'0.8rem', color:'#3b82f6', lineHeight:1.6 }}>
                <strong>Setup Guide:</strong> Create an OAuth app at{' '}
                <a href={info.docs} target="_blank" rel="noopener" style={{ color:'#3b82f6' }}>
                  {info.label} Developer Console
                </a>
                {'. Add this as your authorized redirect URI: '}
                <code style={{ background:'white', padding:'2px 6px', borderRadius:4, fontSize:'0.75rem' }}>
                  {callbackUrl}
                </code>
              </div>
              {[
                { k:'client_id',     l:`${info.label} App / Client ID` },
                { k:'client_secret', l:`${info.label} App Secret`,       t:'password' },
                { k:'redirect_uri',  l:'Redirect / Callback URI',         placeholder:callbackUrl, full:true },
              ].map(({ k, l, t='text', placeholder, full }) => (
                <div key={k} style={{ gridColumn:full?'1/-1':undefined }}>
                  <label style={labelStyle}>{l}</label>
                  <input type={t} value={data[k]||''} placeholder={placeholder}
                    onChange={e => setData(d => ({ ...d, [k]: e.target.value }))}
                    style={inputStyle()} />
                </div>
              ))}
              <div style={{ gridColumn:'1/-1', display:'flex', gap:'0.75rem' }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding:'0.625rem 1.5rem', background:'var(--color-primary)', color:'white',
                    border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>
                  {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save ' + info.label + ' Settings'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PasswordChangeCard() {
  const [form, setForm] = useState({ current:'', next:'', confirm:'' });
  const [msg, setMsg]   = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (!form.current || !form.next) return setMsg('All fields required');
    if (form.next !== form.confirm) return setMsg('New passwords do not match');
    if (form.next.length < 8) return setMsg('Password must be at least 8 characters');
    setSaving(true);
    try {
      await adminApi.put('/admin/profile/password', { current_password:form.current, new_password:form.next });
      setMsg('✅ Password changed successfully');
      setForm({ current:'', next:'', confirm:'' });
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Failed'));
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background:'white', borderRadius:16, padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.5rem' }}>
        🔒 Change Password
      </h2>
      {msg && (
        <div style={{ background: msg.startsWith('✅')?'#d1fae5':'#fee2e2',
          color: msg.startsWith('✅')?'#065f46':'#991b1b',
          padding:'0.75rem 1rem', borderRadius:8, fontSize:'0.875rem', marginBottom:'1.25rem' }}>
          {msg}
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
        {[
          { k:'current', l:'Current Password' },
          { k:'next',    l:'New Password' },
          { k:'confirm', l:'Confirm New Password' },
        ].map(({ k, l }) => (
          <div key={k}>
            <label style={labelStyle}>{l}</label>
            <input type="password" value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))}
              placeholder="••••••••" style={inputStyle()} />
          </div>
        ))}
      </div>
      <div style={{ marginTop:'1.25rem' }}>
        <button onClick={handleChange} disabled={saving} className="btn btn-primary">
          {saving ? 'Changing…' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
