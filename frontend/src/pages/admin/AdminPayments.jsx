// ============================================================
// src/pages/admin/AdminPayments.jsx — Payment Management
// QR proof verification, cash recording, payment history
// ============================================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../utils/api';

const fmtMoney = n => `$${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2})}`;
const API_URL = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:4000';

export default function AdminPayments() {
  const [tab, setTab] = useState('pending-proofs');
  const [proofs, setProofs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [qrSettings, setQrSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'pending-proofs') {
        const { data } = await adminApi.get('/payments/pending-proofs');
        setProofs(data);
      } else if (tab === 'history') {
        const { data } = await adminApi.get('/payments?per_page=50');
        setPayments(data.data||[]);
      } else if (tab === 'qr-settings') {
        const { data } = await adminApi.get('/admin/hotel-info');
        setQrSettings(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [tab]);

  const handleVerify = async (id, action) => {
    try {
      await adminApi.put(`/payments/${id}/verify`, {
        action,
        notes: action === 'reject' ? (rejectNotes || 'Proof does not match booking amount') : undefined
      });
      setSelected(null);
      setRejectNotes('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleSaveQR = async () => {
    await adminApi.put('/admin/hotel-info', {
      qr_payment_enabled: qrSettings.qr_payment_enabled,
      qr_bank_name: qrSettings.qr_bank_name,
      qr_account_name: qrSettings.qr_account_name,
      qr_account_number: qrSettings.qr_account_number,
      qr_payment_instructions: qrSettings.qr_payment_instructions,
      qr_payment_deadline_hours: qrSettings.qr_payment_deadline_hours,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)', marginBottom:'0.25rem' }}>
          Payment Management
        </h1>
        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:0 }}>
          Verify QR payment proofs, record cash, configure payment settings
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:'1.5rem', background:'white',
        borderRadius:12, padding:'0.375rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        {[
          { id:'pending-proofs', label:`📸 Pending Proofs${proofs.length > 0 ? ` (${proofs.length})` : ''}` },
          { id:'history', label:'📋 Payment History' },
          { id:'qr-settings', label:'📱 QR Settings' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'0.625rem 1.25rem', border:'none', cursor:'pointer', borderRadius:8,
              fontFamily:'var(--font-body)', fontSize:'0.82rem', fontWeight:tab===t.id?600:400,
              color:tab===t.id?'white':'#64748b',
              background:tab===t.id?'var(--color-primary)':'transparent', transition:'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>}

      {/* ── PENDING PROOFS ─────────────────────── */}
      {!loading && tab === 'pending-proofs' && (
        <div>
          {proofs.length === 0 ? (
            <div style={{ background:'white', borderRadius:16, padding:'4rem', textAlign:'center',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
              <h3 style={{ fontFamily:'var(--font-heading)', color:'var(--color-primary)', marginBottom:'0.5rem' }}>
                All caught up!
              </h3>
              <p style={{ color:'#64748b' }}>No payment proofs awaiting verification</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'1.5rem' }}>
              {proofs.map(p => (
                <motion.div key={p.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  style={{ background:'white', borderRadius:16, overflow:'hidden',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.08)', border:'1px solid #fef3c7' }}>

                  {/* Proof Image Preview */}
                  {p.proof_image_path && (
                    <div style={{ height:200, background:'#f8fafc', overflow:'hidden', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center' }}
                      onClick={() => window.open(`${API_URL}/${p.proof_image_path}`, '_blank')}>
                      {p.proof_file_type?.includes('pdf') ? (
                        <div style={{ textAlign:'center', color:'#64748b' }}>
                          <div style={{ fontSize:'3rem' }}>📄</div>
                          <div style={{ fontSize:'0.82rem' }}>PDF — Click to open</div>
                        </div>
                      ) : (
                        <img src={`${API_URL}/${p.proof_image_path}`} alt="Payment proof"
                          style={{ width:'100%', height:'100%', objectFit:'contain' }}
                          onError={e => { e.target.style.display='none'; }} />
                      )}
                    </div>
                  )}

                  <div style={{ padding:'1.25rem' }}>
                    {/* Booking info */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                      <div>
                        <div style={{ fontFamily:'monospace', fontWeight:700, color:'var(--color-primary)', fontSize:'0.9rem' }}>
                          {p.booking_reference}
                        </div>
                        <div style={{ fontSize:'0.82rem', color:'#64748b' }}>
                          {p.guest_first_name} {p.guest_last_name}
                        </div>
                        <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{p.guest_email}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'var(--font-heading)', fontSize:'1.25rem', fontWeight:700, color:'var(--color-secondary)' }}>
                          {fmtMoney(p.amount || p.total_amount)}
                        </div>
                        <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
                          {p.check_in_date} → {p.check_out_date}
                        </div>
                      </div>
                    </div>

                    {p.transaction_id && (
                      <div style={{ background:'#f8fafc', borderRadius:6, padding:'0.5rem 0.75rem',
                        fontSize:'0.78rem', color:'#475569', marginBottom:'1rem' }}>
                        <strong>Transaction ID:</strong> {p.transaction_id}
                      </div>
                    )}

                    <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginBottom:'1rem' }}>
                      Submitted: {new Date(p.proof_uploaded_at).toLocaleString()}
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', gap:'0.75rem' }}>
                      <button onClick={() => setSelected({ ...p, action:'verify' })}
                        style={{ flex:1, padding:'0.75rem', background:'#d1fae5', color:'#065f46',
                          border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem',
                          fontFamily:'var(--font-body)', transition:'all 0.2s' }}>
                        ✓ Verify Payment
                      </button>
                      <button onClick={() => setSelected({ ...p, action:'reject' })}
                        style={{ flex:1, padding:'0.75rem', background:'#fee2e2', color:'#991b1b',
                          border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.85rem',
                          fontFamily:'var(--font-body)', transition:'all 0.2s' }}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENT HISTORY ──────────────────── */}
      {!loading && tab === 'history' && (
        <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                  {['Booking','Guest','Amount','Method','Status','Date','Proof'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'1rem 1.25rem', color:'#64748b',
                      fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'1rem 1.25rem', fontFamily:'monospace', fontWeight:700,
                      color:'var(--color-primary)', fontSize:'0.82rem' }}>{p.booking_reference}</td>
                    <td style={{ padding:'1rem 1.25rem' }}>{p.guest_first_name} {p.guest_last_name}</td>
                    <td style={{ padding:'1rem 1.25rem', fontWeight:700 }}>{fmtMoney(p.amount)}</td>
                    <td style={{ padding:'1rem 1.25rem', textTransform:'capitalize', color:'#64748b' }}>
                      {p.method?.replace('_',' ')}
                    </td>
                    <td style={{ padding:'1rem 1.25rem' }}>
                      <span style={{ padding:'3px 10px', borderRadius:999, fontSize:'0.73rem', fontWeight:600,
                        ...{ verified:{ bg:'#d1fae5',color:'#065f46' }, pending:{ bg:'#fef3c7',color:'#92400e' },
                          proof_submitted:{ bg:'#dbeafe',color:'#1e40af' }, failed:{ bg:'#fee2e2',color:'#991b1b' },
                          refunded:{ bg:'#f3f4f6',color:'#6b7280' } }[p.status] || { bg:'#f3f4f6',color:'#6b7280' } }}>
                        {p.status?.replace('_',' ')}
                      </span>
                    </td>
                    <td style={{ padding:'1rem 1.25rem', color:'#64748b', fontSize:'0.78rem' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding:'1rem 1.25rem' }}>
                      {p.proof_image_path && (
                        <a href={`${API_URL}/${p.proof_image_path}`} target="_blank" rel="noopener"
                          style={{ color:'var(--color-primary)', fontSize:'0.8rem', fontWeight:500 }}>
                          View ↗
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>No payments yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── QR SETTINGS ──────────────────────── */}
      {!loading && tab === 'qr-settings' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'1.5rem', alignItems:'start' }}>
          <div style={{ background:'white', borderRadius:16, padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.25rem', color:'var(--color-primary)', margin:0 }}>
                QR / Bank Transfer Payment Settings
              </h2>
              <button onClick={handleSaveQR} className="btn btn-primary btn-sm">
                {saved ? '✓ Saved!' : 'Save Settings'}
              </button>
            </div>

            {/* Enable toggle */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'1rem', background:'#f8fafc', borderRadius:10, marginBottom:'1.5rem' }}>
              <div>
                <div style={{ fontWeight:600, color:'var(--color-primary)' }}>Enable QR Payment</div>
                <div style={{ fontSize:'0.82rem', color:'#64748b' }}>
                  Customers will see QR code and bank details at checkout
                </div>
              </div>
              <button onClick={() => setQrSettings(p => ({ ...p, qr_payment_enabled: !p.qr_payment_enabled }))}
                style={{ width:48, height:26, borderRadius:999, border:'none', cursor:'pointer',
                  background: qrSettings.qr_payment_enabled ? 'var(--color-primary)' : '#e2e8f0',
                  position:'relative', transition:'background 0.3s', flexShrink:0 }}>
                <span style={{ position:'absolute', top:3,
                  left: qrSettings.qr_payment_enabled ? 24 : 2,
                  width:20, height:20, borderRadius:'50%', background:'white',
                  transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
              </button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
              {[
                { k:'qr_bank_name', l:'Bank Name', placeholder:'e.g. National Bank of Nepal' },
                { k:'qr_account_name', l:'Account Name', placeholder:'e.g. Grand Lumière Hotel Pvt. Ltd.' },
                { k:'qr_account_number', l:'Account Number', placeholder:'e.g. 0123456789' },
                { k:'qr_payment_deadline_hours', l:'Payment Deadline (hours)', placeholder:'24', t:'number' },
              ].map(({ k,l,placeholder,t='text' }) => (
                <div key={k}>
                  <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                    textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
                  <input type={t} placeholder={placeholder} value={qrSettings[k]||''}
                    onChange={e => setQrSettings(p=>({...p,[k]:e.target.value}))}
                    style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                      borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                  textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>
                  Payment Instructions (shown to customer)
                </label>
                <textarea rows={4} value={qrSettings.qr_payment_instructions||''}
                  onChange={e => setQrSettings(p=>({...p,qr_payment_instructions:e.target.value}))}
                  placeholder="e.g. Scan the QR code below with your banking app. Enter your booking reference as the payment note. Upload your payment screenshot after completing the transfer."
                  style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                    borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', resize:'vertical' }} />
              </div>
            </div>

            <div style={{ marginTop:'1.5rem', padding:'1rem', background:'#fffbeb',
              borderRadius:10, border:'1px solid #fcd34d', fontSize:'0.82rem', color:'#92400e', lineHeight:1.7 }}>
              <strong>📱 QR Code Image:</strong> Upload your bank's QR code image via the file manager or FTP
              to <code style={{ background:'white', padding:'2px 6px', borderRadius:4 }}>uploads/qr-codes/payment-qr.png</code>,
              then set the path in the database:<br />
              <code style={{ background:'white', padding:'4px 8px', borderRadius:4, display:'block', marginTop:'0.5rem', fontSize:'0.78rem' }}>
                UPDATE hotel_info SET qr_code_image_path = 'uploads/qr-codes/payment-qr.png' WHERE id = 1;
              </code>
            </div>
          </div>

          {/* Preview */}
          <div style={{ background:'white', borderRadius:16, padding:'1.5rem',
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'sticky', top:90 }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)',
              marginBottom:'1.25rem' }}>Customer Preview</h3>
            <div style={{ border:`1.5px solid var(--color-secondary)`, borderRadius:12, padding:'1.25rem' }}>
              <div style={{ textAlign:'center', marginBottom:'1rem' }}>
                <div style={{ width:120, height:120, background:'#f8fafc', borderRadius:8,
                  margin:'0 auto 0.75rem', display:'flex', alignItems:'center', justifyContent:'center',
                  border:'1px dashed #e2e8f0', fontSize:'2.5rem' }}>📱</div>
                <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Your QR code appears here</div>
              </div>
              {qrSettings.qr_bank_name && (
                <div style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'0.375rem' }}>
                  <strong>Bank:</strong> {qrSettings.qr_bank_name}
                </div>
              )}
              {qrSettings.qr_account_name && (
                <div style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'0.375rem' }}>
                  <strong>Account:</strong> {qrSettings.qr_account_name}
                </div>
              )}
              {qrSettings.qr_account_number && (
                <div style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'0.75rem' }}>
                  <strong>Number:</strong> {qrSettings.qr_account_number}
                </div>
              )}
              {qrSettings.qr_payment_instructions && (
                <div style={{ fontSize:'0.8rem', color:'#475569', lineHeight:1.6, borderTop:'1px solid #f1f5f9', paddingTop:'0.75rem' }}>
                  {qrSettings.qr_payment_instructions}
                </div>
              )}
              <div style={{ marginTop:'0.875rem', fontSize:'0.75rem', color:'#94a3b8' }}>
                Upload proof within {qrSettings.qr_payment_deadline_hours||24} hours
              </div>
            </div>
          </div>

          <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 380px"]{grid-template-columns:1fr!important;}}`}</style>
        </div>
      )}

      {/* Verify / Reject Confirmation Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setSelected(null)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200 }} />
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                width:'90%', maxWidth:480, background:'white', borderRadius:20, padding:'2rem', zIndex:201,
                boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.4rem',
                color: selected.action==='verify' ? '#065f46' : '#991b1b', marginBottom:'1rem' }}>
                {selected.action === 'verify' ? '✓ Verify Payment' : '✕ Reject Payment Proof'}
              </h2>
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'1rem', marginBottom:'1.25rem' }}>
                <div style={{ fontWeight:600, marginBottom:4 }}>{selected.booking_reference}</div>
                <div style={{ fontSize:'0.875rem', color:'#64748b' }}>
                  {selected.guest_first_name} {selected.guest_last_name} — {fmtMoney(selected.amount || selected.total_amount)}
                </div>
              </div>
              {selected.action === 'verify' ? (
                <p style={{ color:'#4b5563', lineHeight:1.7, marginBottom:'1.5rem' }}>
                  Verifying this payment will confirm the booking and update payment status to <strong>Verified</strong>.
                  The booking will be automatically confirmed.
                </p>
              ) : (
                <div style={{ marginBottom:'1.5rem' }}>
                  <label style={{ fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em',
                    textTransform:'uppercase', color:'#475569', display:'block', marginBottom:6 }}>
                    Rejection Reason (shown to customer)
                  </label>
                  <textarea rows={3} value={rejectNotes}
                    onChange={e => setRejectNotes(e.target.value)}
                    placeholder="e.g. Amount does not match booking total. Please re-upload correct proof."
                    style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                      borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', resize:'vertical' }} />
                </div>
              )}
              <div style={{ display:'flex', gap:'1rem' }}>
                <button onClick={() => setSelected(null)} className="btn btn-secondary">Cancel</button>
                <button onClick={() => handleVerify(selected.id, selected.action)}
                  style={{ flex:1, padding:'0.875rem', border:'none', borderRadius:6, cursor:'pointer',
                    fontFamily:'var(--font-body)', fontWeight:600, fontSize:'0.9rem',
                    background: selected.action==='verify' ? '#065f46' : '#991b1b', color:'white' }}>
                  {selected.action === 'verify' ? 'Confirm & Verify' : 'Reject Proof'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
