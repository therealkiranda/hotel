// ============================================================
// src/pages/admin/AdminOTA.jsx — OTA Channel Manager
// Manage Expedia, Booking.com, Airbnb integrations
// ============================================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../utils/api';

const CHANNEL_INFO = {
  expedia: {
    label: 'Expedia', color: '#ffcc00', bg: '#fff8e1',
    logo: '🌐', commission: '18%',
    docs: 'https://developers.expediagroup.com/docs/apis/for-lodging-suppliers',
    endpoint: 'https://services.expediapartnercentral.com/eqc/',
  },
  booking_com: {
    label: 'Booking.com', color: '#003580', bg: '#e8eef7',
    logo: '🏨', commission: '15%',
    docs: 'https://developers.booking.com/api/supply/index.html',
    endpoint: 'https://supply-xml.booking.com/hotels/ota/',
  },
  airbnb: {
    label: 'Airbnb', color: '#ff5a5f', bg: '#fff0f0',
    logo: '🏠', commission: '3%',
    docs: 'https://developers.airbnb.com',
    endpoint: '',
  },
  hotels_com: {
    label: 'Hotels.com', color: '#c40000', bg: '#fff0f0',
    logo: '🏢', commission: '18%',
    docs: 'https://www.hotels.com/hotel-supply',
    endpoint: '',
  },
};

export default function AdminOTA() {
  const [channels, setChannels] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [rateOverrides, setRateOverrides] = useState([]);
  const [roomCategories, setRoomCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState({});
  const [syncing, setSyncing] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('channels');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.get('/ota/channels').then(r => setChannels(r.data)).catch(() => {}),
      adminApi.get('/ota/sync-logs?limit=30').then(r => setSyncLogs(r.data)).catch(() => {}),
      adminApi.get('/ota/rate-overrides').then(r => setRateOverrides(r.data)).catch(() => {}),
      adminApi.get('/rooms').then(r => setRoomCategories(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSave = async (channel) => {
    try {
      await adminApi.put(`/ota/channels/${channel}`, editing[channel] || {});
      setChannels(prev => prev.map(c => c.channel === channel ? { ...c, ...editing[channel] } : c));
      setSaved(channel);
      setTimeout(() => setSaved(''), 2000);
    } catch { alert('Failed to save'); }
  };

  const handleSync = async (channel) => {
    setSyncing(prev => ({ ...prev, [channel]: true }));
    try {
      const { data } = await adminApi.post(`/ota/sync/${channel}`, { sync_type: 'full_sync' });
      alert(`${CHANNEL_INFO[channel].label} sync: ${data.status}\n${data.message || ''}`);
      adminApi.get('/ota/sync-logs?limit=30').then(r => setSyncLogs(r.data)).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.error || 'Sync failed');
    } finally {
      setSyncing(prev => ({ ...prev, [channel]: false }));
    }
  };

  const handlePushAvailability = async () => {
    try {
      const { data } = await adminApi.post('/ota/push-availability', {});
      alert(JSON.stringify(data.pushed?.map(p => `${p.channel}: ${p.status}`).join('\n')));
    } catch { alert('Push failed'); }
  };

  const stat = (s) => ({ success: { bg:'#d1fae5',color:'#065f46' }, failed: { bg:'#fee2e2',color:'#991b1b' }, partial: { bg:'#fef3c7',color:'#92400e' } }[s] || { bg:'#f3f4f6',color:'#6b7280' });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.75rem' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)' }}>
            OTA Channel Manager
          </h1>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:0 }}>
            Manage Expedia, Booking.com and other channel connections to prevent overbooking
          </p>
        </div>
        <button onClick={handlePushAvailability}
          className="btn btn-primary">
          ↑ Push Availability to All Channels
        </button>
      </div>

      {/* How it works banner */}
      <div style={{ background:'#eff6ff', borderRadius:12, padding:'1rem 1.5rem', marginBottom:'1.5rem',
        border:'1px solid #bfdbfe', display:'flex', alignItems:'center', gap:'1rem' }}>
        <span style={{ fontSize:'1.5rem' }}>🔄</span>
        <div>
          <div style={{ fontWeight:600, color:'#1e40af', fontSize:'0.9rem' }}>Overbooking Prevention</div>
          <div style={{ fontSize:'0.82rem', color:'#3b82f6' }}>
            When a room is booked here, availability is automatically pushed to all enabled OTA channels.
            When an OTA booking arrives via webhook, we check our own database first — if no room is available,
            the OTA booking is held for admin review instead of being auto-confirmed.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', borderBottom:'2px solid #f1f5f9' }}>
        {['channels','sync-logs','rate-overrides'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'0.75rem 1.5rem', border:'none', cursor:'pointer', fontFamily:'var(--font-body)',
              fontSize:'0.85rem', fontWeight: tab===t ? 600 : 400,
              color: tab===t ? 'var(--color-primary)' : '#64748b',
              borderBottom: tab===t ? '2px solid var(--color-primary)' : '2px solid transparent',
              background:'transparent', marginBottom:-2, textTransform:'capitalize',
              transition:'all 0.2s' }}>
            {t.replace('-',' ')}
          </button>
        ))}
      </div>

      {/* CHANNELS TAB */}
      {tab === 'channels' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(440px,1fr))', gap:'1.5rem' }}>
          {loading ? Array.from({length:4}).map((_,i) => (
            <div key={i} className="skeleton" style={{ height:320, borderRadius:16 }} />
          )) : channels.map(ch => {
            const info = CHANNEL_INFO[ch.channel] || {};
            const isOpen = selected === ch.channel;
            const edit = editing[ch.channel] || {};

            return (
              <motion.div key={ch.channel} layout
                style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
                  overflow:'hidden', border:`1px solid ${ch.is_enabled ? info.color+'40' : '#e2e8f0'}` }}>

                {/* Header */}
                <div style={{ padding:'1.5rem', display:'flex', alignItems:'center', gap:'1rem',
                  background: ch.is_enabled ? info.bg : '#f8fafc' }}>
                  <span style={{ fontSize:'2rem' }}>{info.logo}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem',
                        color:'var(--color-primary)', margin:0 }}>{info.label}</h3>
                      <span style={{ fontSize:'0.72rem', padding:'2px 10px', borderRadius:999,
                        background: ch.is_enabled ? '#d1fae5' : '#f1f5f9',
                        color: ch.is_enabled ? '#065f46' : '#6b7280', fontWeight:600 }}>
                        {ch.is_enabled ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:2 }}>
                      Commission: {ch.default_commission_pct}% · Auto-confirm: {ch.auto_confirm_bookings ? 'Yes' : 'No'}
                    </div>
                    {ch.last_sync_at && (
                      <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:1 }}>
                        Last sync: {new Date(ch.last_sync_at).toLocaleString()} ·{' '}
                        <span style={{ ...stat(ch.last_sync_status), padding:'1px 6px', borderRadius:4, fontSize:'0.68rem' }}>
                          {ch.last_sync_status}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={() => handleSync(ch.channel)}
                      disabled={!ch.is_enabled || syncing[ch.channel]}
                      style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #e2e8f0',
                        cursor: ch.is_enabled ? 'pointer' : 'not-allowed', background:'white',
                        fontSize:'0.78rem', opacity: !ch.is_enabled ? 0.4 : 1 }}>
                      {syncing[ch.channel] ? '↻ Syncing...' : '↻ Sync'}
                    </button>
                    <button onClick={() => setSelected(isOpen ? null : ch.channel)}
                      style={{ padding:'6px 14px', borderRadius:6,
                        background: isOpen ? 'var(--color-primary)' : 'white',
                        color: isOpen ? 'white' : '#475569',
                        border:'1px solid', borderColor: isOpen ? 'var(--color-primary)' : '#e2e8f0',
                        cursor:'pointer', fontSize:'0.78rem' }}>
                      {isOpen ? 'Close' : 'Configure'}
                    </button>
                  </div>
                </div>

                {/* Config Panel */}
                {isOpen && (
                  <div style={{ padding:'1.5rem', borderTop:'1px solid #f1f5f9' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                      {[
                        { k:'hotel_id', l:'Hotel ID *', placeholder:'Your property ID on '+info.label },
                        { k:'api_key', l:'API Key *', placeholder:'Partner API key', type:'password' },
                        { k:'api_secret', l:'API Secret', placeholder:'API secret (if required)', type:'password' },
                        { k:'username', l:'Username', placeholder:'EQC username' },
                        { k:'api_endpoint', l:'API Endpoint', placeholder: info.endpoint },
                        { k:'default_commission_pct', l:'Commission %', placeholder:'15', type:'number' },
                        { k:'markup_pct', l:'Markup %', placeholder:'0', type:'number' },
                        { k:'availability_buffer', l:'Availability Buffer (rooms)', placeholder:'0', type:'number' },
                        { k:'sync_interval_minutes', l:'Sync Interval (mins)', placeholder:'15', type:'number' },
                      ].map(({ k, l, placeholder, type='text' }) => (
                        <div key={k} style={{ gridColumn: k==='api_endpoint'||k==='hotel_id' ? '1/-1' : undefined }}>
                          <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                            textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
                          <input type={type} placeholder={placeholder}
                            defaultValue={ch[k] || ''}
                            onChange={e => setEditing(prev => ({ ...prev, [ch.channel]: { ...prev[ch.channel], [k]: e.target.value } }))}
                            style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                              borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
                        </div>
                      ))}

                      {/* Toggles */}
                      {[
                        { k:'is_enabled', l:'Channel Enabled' },
                        { k:'auto_confirm_bookings', l:'Auto-confirm incoming bookings' },
                      ].map(({ k, l }) => (
                        <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <label style={{ fontSize:'0.875rem', fontWeight:500, color:'#1e293b' }}>{l}</label>
                          <button onClick={() => {
                            const current = edit[k] !== undefined ? edit[k] : ch[k];
                            setEditing(prev => ({ ...prev, [ch.channel]: { ...prev[ch.channel], [k]: !current } }));
                          }}
                            style={{ width:44, height:24, borderRadius:999, border:'none', cursor:'pointer',
                              background: (edit[k]!==undefined ? edit[k] : ch[k]) ? 'var(--color-primary)' : '#e2e8f0',
                              position:'relative', transition:'background 0.3s', flexShrink:0 }}>
                            <span style={{ position:'absolute', top:2,
                              left:(edit[k]!==undefined ? edit[k] : ch[k]) ? 22 : 2,
                              width:20, height:20, borderRadius:'50%', background:'white',
                              transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', alignItems:'center' }}>
                      <button onClick={() => handleSave(ch.channel)}
                        style={{ background:'var(--color-primary)', color:'white', border:'none', cursor:'pointer',
                          padding:'0.625rem 1.5rem', borderRadius:6, fontSize:'0.85rem', fontWeight:500 }}>
                        {saved===ch.channel ? '✓ Saved!' : 'Save Configuration'}
                      </button>
                      <a href={info.docs} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:'0.8rem', color:'var(--color-primary)', opacity:0.7 }}>
                        View {info.label} API Docs ↗
                      </a>
                    </div>

                    {ch.channel === 'expedia' && (
                      <div style={{ marginTop:'1rem', background:'#eff6ff', borderRadius:8, padding:'0.875rem 1rem',
                        fontSize:'0.8rem', color:'#3b82f6', lineHeight:1.6 }}>
                        <strong>Expedia EQC Setup:</strong> Log into Expedia Partner Central → Connectivity → 
                        Generate EQC API credentials. Set your hotel_id to your Expedia Hotel ID (numeric).
                        Webhook URL: <code style={{ background:'white', padding:'2px 6px', borderRadius:4 }}>
                          {window.location.origin}/api/ota/webhook/expedia</code>
                      </div>
                    )}
                    {ch.channel === 'booking_com' && (
                      <div style={{ marginTop:'1rem', background:'#eff6ff', borderRadius:8, padding:'0.875rem 1rem',
                        fontSize:'0.8rem', color:'#3b82f6', lineHeight:1.6 }}>
                        <strong>Booking.com Setup:</strong> Go to Booking.com Extranet → Property → Connectivity → 
                        Request API access. Your hotel_id is your Booking.com Property ID.
                        Webhook URL: <code style={{ background:'white', padding:'2px 6px', borderRadius:4 }}>
                          {window.location.origin}/api/ota/webhook/booking-com</code>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* SYNC LOGS TAB */}
      {tab === 'sync-logs' && (
        <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                {['Channel','Type','Status','Rooms','Bookings','Duration','Triggered By','Time'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'1rem 1.25rem', color:'#64748b',
                    fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {syncLogs.length === 0
                ? <tr><td colSpan={8} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>No sync logs yet</td></tr>
                : syncLogs.map(log => (
                <tr key={log.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'0.875rem 1.25rem' }}>
                    <span style={{ fontWeight:600, textTransform:'capitalize' }}>{log.channel.replace('_',' ')}</span>
                  </td>
                  <td style={{ padding:'0.875rem 1.25rem', color:'#64748b', fontSize:'0.82rem' }}>
                    {log.sync_type.replace(/_/g,' ')}
                  </td>
                  <td style={{ padding:'0.875rem 1.25rem' }}>
                    <span style={{ ...stat(log.status), padding:'3px 10px', borderRadius:999,
                      fontSize:'0.75rem', fontWeight:600 }}>{log.status}</span>
                  </td>
                  <td style={{ padding:'0.875rem 1.25rem', textAlign:'center' }}>{log.rooms_synced}</td>
                  <td style={{ padding:'0.875rem 1.25rem', textAlign:'center' }}>{log.bookings_imported}</td>
                  <td style={{ padding:'0.875rem 1.25rem', color:'#64748b' }}>
                    {log.duration_ms ? `${log.duration_ms}ms` : '—'}
                  </td>
                  <td style={{ padding:'0.875rem 1.25rem', color:'#64748b', textTransform:'capitalize' }}>
                    {log.triggered_by}
                  </td>
                  <td style={{ padding:'0.875rem 1.25rem', color:'#64748b', fontSize:'0.78rem' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RATE OVERRIDES TAB */}
      {tab === 'rate-overrides' && (
        <div>
          <div style={{ background:'white', borderRadius:16, padding:'1.75rem',
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1.5rem' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
              Add Rate Override
            </h3>
            <RateOverrideForm
              roomCategories={roomCategories}
              onAdd={async (data) => {
                await adminApi.post('/ota/rate-overrides', data);
                const { data: updated } = await adminApi.get('/ota/rate-overrides');
                setRateOverrides(updated);
              }} />
          </div>

          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                  {['Channel','Room','Date From','Date To','Price','Min Stay','Actions'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'1rem 1.25rem', color:'#64748b',
                      fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rateOverrides.length === 0
                  ? <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>No rate overrides</td></tr>
                  : rateOverrides.map(o => (
                  <tr key={o.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'0.875rem 1.25rem', fontWeight:600, textTransform:'capitalize' }}>
                      {o.channel.replace('_',' ')}
                    </td>
                    <td style={{ padding:'0.875rem 1.25rem' }}>{o.room_name}</td>
                    <td style={{ padding:'0.875rem 1.25rem', color:'#64748b' }}>{o.date_from}</td>
                    <td style={{ padding:'0.875rem 1.25rem', color:'#64748b' }}>{o.date_to}</td>
                    <td style={{ padding:'0.875rem 1.25rem', fontWeight:700, color:'var(--color-secondary)' }}>
                      ${Number(o.override_price).toLocaleString()}
                    </td>
                    <td style={{ padding:'0.875rem 1.25rem', color:'#64748b' }}>{o.min_stay_nights}n</td>
                    <td style={{ padding:'0.875rem 1.25rem' }}>
                      <button onClick={async () => {
                        await adminApi.delete(`/ota/rate-overrides/${o.id}`);
                        setRateOverrides(prev => prev.filter(r => r.id !== o.id));
                      }} style={{ padding:'4px 12px', background:'#fee2e2', color:'#991b1b',
                        border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RateOverrideForm({ roomCategories, onAdd }) {
  const [form, setForm] = useState({ channel:'expedia', room_category_id:'', date_from:'', date_to:'', override_price:'', min_stay_nights:1 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.channel || !form.room_category_id || !form.date_from || !form.date_to || !form.override_price)
      return alert('All fields required');
    setSaving(true);
    try {
      await onAdd(form);
      setForm({ channel:'expedia', room_category_id:'', date_from:'', date_to:'', override_price:'', min_stay_nights:1 });
    } catch { alert('Failed to add'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem', alignItems:'end' }}>
      {[
        { k:'channel', l:'Channel', el:'select', opts:['expedia','booking_com','airbnb','hotels_com'] },
        { k:'room_category_id', l:'Room Category', el:'select', opts: roomCategories.map(r => ({ v: r.id, l: r.name || r.category_name })) },
        { k:'date_from', l:'From Date', t:'date' },
        { k:'date_to', l:'To Date', t:'date' },
        { k:'override_price', l:'Override Price ($)', t:'number' },
        { k:'min_stay_nights', l:'Min Stay (nights)', t:'number' },
      ].map(({ k, l, t, el, opts }) => (
        <div key={k}>
          <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
            textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
          {el === 'select' ? (
            <select value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))}
              style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }}>
              <option value="">Select...</option>
              {opts?.map(o => typeof o === 'string'
                ? <option key={o} value={o}>{o.replace('_',' ')}</option>
                : <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          ) : (
            <input type={t || 'text'} value={form[k]}
              onChange={e => setForm(p => ({...p,[k]:e.target.value}))}
              style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
          )}
        </div>
      ))}
      <button onClick={handleSubmit} disabled={saving}
        style={{ background:'var(--color-primary)', color:'white', border:'none', cursor:'pointer',
          padding:'0.625rem 1.25rem', borderRadius:6, fontSize:'0.875rem', fontWeight:500, height:40, alignSelf:'end' }}>
        {saving ? 'Adding...' : '+ Add Override'}
      </button>
    </div>
  );
}
