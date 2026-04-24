// ============================================================
// src/pages/admin/AdminFrontDesk.jsx — Full PMS / Front Desk
// Counter booking, room assign, guest ID, invoice,
// restaurant & amenity consumption billing
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../utils/api';

const P = '#1a3c2e';
const G = '#c9a96e';
const sc = { available:{bg:'#d1fae5',cl:'#065f46',label:'Available'}, occupied:{bg:'#fee2e2',cl:'#991b1b',label:'Occupied'}, housekeeping:{bg:'#fef3c7',cl:'#92400e',label:'Housekeeping'}, maintenance:{bg:'#e2e8f0',cl:'#475569',label:'Maintenance'} };
const lbl = { display:'block', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'#475569', marginBottom:4 };
const inp = (x={}) => ({ width:'100%', padding:'0.6rem 0.8rem', border:'1.5px solid #e2e8f0', borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', ...x });
const btn = (x={}) => ({ padding:'0.6rem 1.25rem', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:'0.85rem', fontWeight:600, transition:'all 0.18s', ...x });
const card = (x={}) => ({ background:'white', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', ...x });

const CHARGE_CATS = [
  { value:'restaurant', label:'🍽 Restaurant' },
  { value:'bar',        label:'🍷 Bar / Beverages' },
  { value:'spa',        label:'💆 Spa & Wellness' },
  { value:'room_service',label:'🛎 Room Service' },
  { value:'amenity',    label:'✦ Amenity' },
  { value:'laundry',    label:'👔 Laundry' },
  { value:'transport',  label:'🚗 Transport' },
  { value:'minibar',    label:'🧃 Mini Bar' },
  { value:'other',      label:'📦 Other' },
];

const ID_TYPES = ['passport','national_id','driving_license','other'];

function Flash({ msg }) {
  if (!msg) return null;
  const ok = msg.startsWith('✅');
  return <div style={{ background: ok?'#d1fae5':'#fee2e2', color: ok?'#065f46':'#991b1b', padding:'0.75rem 1rem', borderRadius:8, marginBottom:'1rem', fontWeight:500, fontSize:'0.875rem' }}>{msg}</div>;
}

function Badge({ status }) {
  const s = sc[status] || sc.maintenance;
  return <span style={{ background:s.bg, color:s.cl, fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:20, letterSpacing:'0.06em', textTransform:'uppercase' }}>{s.label}</span>;
}

// ──────────────────────────────────────────────────────────
// INVOICE PRINT VIEW
// ──────────────────────────────────────────────────────────
function InvoiceView({ data, onClose }) {
  const { booking, charges, payments, balance } = data;
  const sym = booking.currency_symbol || 'NPR';

  const print = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${booking.booking_reference}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:30px;color:#1a1a1a;max-width:700px;margin:0 auto}
      h1{color:#1a3c2e;margin:0}table{width:100%;border-collapse:collapse;margin:12px 0}
      th{background:#1a3c2e;color:white;padding:8px 10px;text-align:left;font-size:0.8rem}
      td{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:0.85rem}
      .tot{font-weight:700;font-size:1rem}.right{text-align:right}.gold{color:#c9a96e}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #1a3c2e;padding-bottom:16px}
      @media print{body{padding:0}.no-print{display:none}}
    </style></head><body>
    <div class="header">
      <div><h1>${booking.hotel_name}</h1><p style="margin:4px 0;color:#666;font-size:0.8rem">${booking.hotel_address}</p><p style="margin:4px 0;color:#666;font-size:0.8rem">${booking.hotel_phone} | ${booking.hotel_email}</p></div>
      <div style="text-align:right"><h2 style="margin:0;color:#c9a96e">INVOICE</h2><p style="margin:4px 0;font-size:0.85rem">Ref: <strong>${booking.booking_reference}</strong></p><p style="margin:4px 0;font-size:0.8rem">Printed: ${new Date().toLocaleString()}</p></div>
    </div>
    <table><tr><th colspan="2">GUEST DETAILS</th><th colspan="2">STAY DETAILS</th></tr>
    <tr><td>Name</td><td><strong>${booking.guest_first_name} ${booking.guest_last_name}</strong></td><td>Room</td><td><strong>${booking.room_number} — ${booking.room_type}</strong></td></tr>
    <tr><td>Phone</td><td>${booking.guest_phone||'-'}</td><td>Check-in</td><td>${new Date(booking.check_in_date).toLocaleDateString()}</td></tr>
    <tr><td>Email</td><td>${booking.guest_email||'-'}</td><td>Check-out</td><td>${new Date(booking.check_out_date).toLocaleDateString()}</td></tr>
    <tr><td>Nationality</td><td>${booking.guest_nationality||'-'}</td><td>Nights</td><td>${booking.nights}</td></tr></table>
    <table><tr><th>DESCRIPTION</th><th class="right">QTY</th><th class="right">RATE (${sym})</th><th class="right">AMOUNT (${sym})</th></tr>
    <tr><td>Room Charges — ${booking.room_type} (${booking.nights} nights)</td><td class="right">${booking.nights}</td><td class="right">${parseFloat(booking.room_rate).toLocaleString()}</td><td class="right">${parseFloat(booking.subtotal).toLocaleString()}</td></tr>
    ${charges.map(c=>`<tr><td>${c.category.toUpperCase()}: ${c.description}</td><td class="right">${c.quantity}</td><td class="right">${parseFloat(c.unit_price).toLocaleString()}</td><td class="right">${parseFloat(c.amount).toLocaleString()}</td></tr>`).join('')}
    ${parseFloat(booking.discount_amount)>0?`<tr><td colspan="3" class="right" style="color:green">Discount</td><td class="right" style="color:green">-${parseFloat(booking.discount_amount).toLocaleString()}</td></tr>`:''}
    <tr><td colspan="3" class="right">Tax (13% VAT)</td><td class="right">${parseFloat(booking.taxes).toLocaleString()}</td></tr>
    <tr><td colspan="3" class="right">Service Charge (10%)</td><td class="right">${parseFloat(booking.service_charge).toLocaleString()}</td></tr>
    <tr><td colspan="3" class="right tot">TOTAL</td><td class="right tot">${sym} ${(parseFloat(booking.total_amount)+charges.reduce((s,c)=>s+parseFloat(c.amount),0)).toLocaleString()}</td></tr>
    <tr><td colspan="3" class="right" style="color:green">Amount Paid</td><td class="right" style="color:green">${sym} ${payments.filter(p=>p.status==='verified').reduce((s,p)=>s+parseFloat(p.amount),0).toLocaleString()}</td></tr>
    <tr style="background:#fff3cd"><td colspan="3" class="right tot">BALANCE DUE</td><td class="right tot" style="color:#c9a96e">${sym} ${parseFloat(balance).toLocaleString()}</td></tr></table>
    <p style="margin-top:24px;font-size:0.75rem;color:#888;text-align:center">Thank you for staying at ${booking.hotel_name}. We hope to welcome you again.</p>
    <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'1rem' }}>
      <div style={{ ...card(), width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', padding:'1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <h3 style={{ margin:0, fontFamily:'var(--font-heading)', color:P }}>Invoice — {booking.booking_reference}</h3>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button onClick={print} style={{ ...btn({ background:P, color:'white' }) }}>🖨 Print</button>
            <button onClick={onClose} style={{ ...btn({ background:'#f1f5f9', color:'#475569' }) }}>✕ Close</button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1.25rem', background:'#f8fafb', borderRadius:8, padding:'1rem' }}>
          <div><span style={lbl}>Guest</span><strong>{booking.guest_first_name} {booking.guest_last_name}</strong></div>
          <div><span style={lbl}>Room</span><strong>{booking.room_number} — {booking.room_type}</strong></div>
          <div><span style={lbl}>Check-in</span>{new Date(booking.check_in_date).toLocaleDateString()}</div>
          <div><span style={lbl}>Check-out</span>{new Date(booking.check_out_date).toLocaleDateString()}</div>
          <div><span style={lbl}>Nights</span>{booking.nights}</div>
          <div><span style={lbl}>Status</span><Badge status={booking.status === 'checked_in' ? 'occupied' : 'available'} /></div>
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem', marginBottom:'1rem' }}>
          <thead>
            <tr style={{ background:P }}>
              {['Description','Qty','Rate','Amount'].map(h => (
                <th key={h} style={{ padding:'8px 10px', color:'white', textAlign: h==='Description'?'left':'right', fontWeight:600, fontSize:'0.78rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom:'1px solid #f0f0f0' }}>
              <td style={{ padding:'8px 10px' }}>Room — {booking.room_type} ({booking.nights} nights)</td>
              <td style={{ padding:'8px 10px', textAlign:'right' }}>{booking.nights}</td>
              <td style={{ padding:'8px 10px', textAlign:'right' }}>{parseFloat(booking.room_rate).toLocaleString()}</td>
              <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:600 }}>{parseFloat(booking.subtotal).toLocaleString()}</td>
            </tr>
            {charges.map(c => (
              <tr key={c.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                <td style={{ padding:'8px 10px', color:'#64748b' }}><span style={{ fontSize:'0.72rem', background:'#f1f5f9', borderRadius:4, padding:'1px 6px', marginRight:6, textTransform:'uppercase' }}>{c.category}</span>{c.description}</td>
                <td style={{ padding:'8px 10px', textAlign:'right' }}>{c.quantity}</td>
                <td style={{ padding:'8px 10px', textAlign:'right' }}>{parseFloat(c.unit_price).toLocaleString()}</td>
                <td style={{ padding:'8px 10px', textAlign:'right' }}>{parseFloat(c.amount).toLocaleString()}</td>
              </tr>
            ))}
            {parseFloat(booking.discount_amount) > 0 && (
              <tr><td colSpan={3} style={{ padding:'8px 10px', textAlign:'right', color:'green' }}>Discount</td><td style={{ padding:'8px 10px', textAlign:'right', color:'green' }}>-{parseFloat(booking.discount_amount).toLocaleString()}</td></tr>
            )}
            <tr style={{ background:'#fafafa' }}><td colSpan={3} style={{ padding:'8px 10px', textAlign:'right', color:'#64748b' }}>Tax (13% VAT)</td><td style={{ padding:'8px 10px', textAlign:'right' }}>{parseFloat(booking.taxes).toLocaleString()}</td></tr>
            <tr style={{ background:'#fafafa' }}><td colSpan={3} style={{ padding:'8px 10px', textAlign:'right', color:'#64748b' }}>Service Charge (10%)</td><td style={{ padding:'8px 10px', textAlign:'right' }}>{parseFloat(booking.service_charge).toLocaleString()}</td></tr>
            <tr style={{ borderTop:'2px solid #1a3c2e' }}><td colSpan={3} style={{ padding:'10px', textAlign:'right', fontWeight:700, fontSize:'0.95rem' }}>TOTAL</td><td style={{ padding:'10px', textAlign:'right', fontWeight:700, fontSize:'0.95rem' }}>{(parseFloat(booking.total_amount)+charges.reduce((s,c)=>s+parseFloat(c.amount),0)).toLocaleString()}</td></tr>
            <tr style={{ color:'green' }}><td colSpan={3} style={{ padding:'8px 10px', textAlign:'right' }}>Paid</td><td style={{ padding:'8px 10px', textAlign:'right' }}>{payments.filter(p=>p.status==='verified').reduce((s,p)=>s+parseFloat(p.amount),0).toLocaleString()}</td></tr>
            <tr style={{ background:'#fff8e6' }}><td colSpan={3} style={{ padding:'10px', textAlign:'right', fontWeight:700, color:G }}>BALANCE DUE</td><td style={{ padding:'10px', textAlign:'right', fontWeight:700, color:G, fontSize:'1rem' }}>{parseFloat(balance).toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// BOOKING FOLIO (guest charges panel)
// ──────────────────────────────────────────────────────────
function BookingFolio({ bookingId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chargeForm, setChargeForm] = useState({ category:'restaurant', description:'', quantity:1, unit_price:'', notes:'' });
  const [payForm, setPayForm] = useState({ amount:'', method:'cash', notes:'' });
  const [tab, setTab] = useState('charges');
  const [flash, setFlash] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminApi.get(`/frontdesk/booking/${bookingId}`); setData(r.data); }
    catch { setFlash('❌ Failed to load'); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const setFlashMsg = m => { setFlash(m); setTimeout(() => setFlash(''), 3500); };

  const addCharge = async () => {
    if (!chargeForm.description || !chargeForm.unit_price) return setFlashMsg('❌ Description and price required');
    setSubmitting(true);
    try {
      await adminApi.post(`/frontdesk/booking/${bookingId}/charge`, chargeForm);
      setFlashMsg('✅ Charge added');
      setChargeForm({ category:'restaurant', description:'', quantity:1, unit_price:'', notes:'' });
      load();
    } catch (e) { setFlashMsg('❌ ' + (e.response?.data?.error || 'Failed')); }
    finally { setSubmitting(false); }
  };

  const removeCharge = async (id) => {
    if (!window.confirm('Remove this charge?')) return;
    try { await adminApi.delete(`/frontdesk/charge/${id}`); setFlashMsg('✅ Removed'); load(); }
    catch { setFlashMsg('❌ Failed'); }
  };

  const addPayment = async () => {
    if (!payForm.amount) return setFlashMsg('❌ Enter amount');
    setSubmitting(true);
    try {
      await adminApi.post(`/frontdesk/booking/${bookingId}/payment`, payForm);
      setFlashMsg('✅ Payment recorded');
      setPayForm({ amount:'', method:'cash', notes:'' });
      load();
    } catch (e) { setFlashMsg('❌ ' + (e.response?.data?.error || 'Failed')); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:900, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:'2rem' }}>Loading folio…</div>
    </div>
  );

  const { booking, charges, payments } = data || {};
  const sym = 'NPR';
  const totalCharges = (charges||[]).reduce((s,c) => s+parseFloat(c.amount),0);
  const totalPaid = (payments||[]).filter(p=>p.status==='verified').reduce((s,p) => s+parseFloat(p.amount),0);
  const grandTotal = parseFloat(booking?.total_amount||0) + totalCharges;
  const balance = grandTotal - totalPaid;

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:900, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0.5rem' }}>
        <div style={{ ...card(), width:'100%', maxWidth:720, maxHeight:'92vh', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
            <div>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:P, fontWeight:700 }}>
                Folio — {booking?.booking_reference}
              </div>
              <div style={{ fontSize:'0.8rem', color:'#64748b' }}>
                {booking?.guest_first_name} {booking?.guest_last_name} · Room {booking?.room_number}
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'0.68rem', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Balance</div>
                <div style={{ fontWeight:700, color: balance > 0 ? '#dc2626' : '#16a34a', fontSize:'1.1rem' }}>{sym} {balance.toLocaleString()}</div>
              </div>
              <button onClick={() => setShowInvoice(true)} style={{ ...btn({ background:G, color:'white' }) }}>🧾 Invoice</button>
              <button onClick={onClose} style={{ ...btn({ background:'#f1f5f9', color:'#475569' }) }}>✕</button>
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.25rem', padding:'0.5rem 1rem', borderBottom:'1px solid #e2e8f0', flexShrink:0 }}>
            {[['charges','📦 Charges'],['payment','💵 Payment'],['summary','📊 Summary']].map(([id,l]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ ...btn({ background: tab===id ? P : 'transparent', color: tab===id ? 'white' : '#64748b', padding:'0.45rem 1rem' }) }}>{l}</button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'1rem 1.25rem' }}>
            <Flash msg={flash} />

            {tab === 'charges' && (
              <div>
                <div style={{ ...card({ padding:'1rem', marginBottom:'1rem', border:'1px solid #e2e8f0' }) }}>
                  <div style={{ fontWeight:700, fontSize:'0.85rem', color:P, marginBottom:'0.75rem' }}>➕ Add Charge</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                    <div>
                      <label style={lbl}>Category</label>
                      <select value={chargeForm.category} onChange={e => setChargeForm(p=>({...p,category:e.target.value}))} style={inp()}>
                        {CHARGE_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Description</label>
                      <input value={chargeForm.description} onChange={e => setChargeForm(p=>({...p,description:e.target.value}))} placeholder="e.g. Club Sandwich" style={inp()} />
                    </div>
                    <div>
                      <label style={lbl}>Quantity</label>
                      <input type="number" min="0.1" step="0.1" value={chargeForm.quantity} onChange={e => setChargeForm(p=>({...p,quantity:e.target.value}))} style={inp()} />
                    </div>
                    <div>
                      <label style={lbl}>Unit Price (NPR)</label>
                      <input type="number" min="0" value={chargeForm.unit_price} onChange={e => setChargeForm(p=>({...p,unit_price:e.target.value}))} placeholder="0.00" style={inp()} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={lbl}>Notes (optional)</label>
                      <input value={chargeForm.notes} onChange={e => setChargeForm(p=>({...p,notes:e.target.value}))} style={inp()} />
                    </div>
                  </div>
                  <div style={{ marginTop:'0.75rem', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'0.5rem' }}>
                    {chargeForm.quantity && chargeForm.unit_price && (
                      <span style={{ fontSize:'0.85rem', color:'#64748b' }}>
                        Total: <strong>NPR {(parseFloat(chargeForm.quantity||0)*parseFloat(chargeForm.unit_price||0)).toLocaleString()}</strong>
                      </span>
                    )}
                    <button onClick={addCharge} disabled={submitting} style={{ ...btn({ background:P, color:'white' }) }}>
                      {submitting ? 'Adding…' : '+ Add Charge'}
                    </button>
                  </div>
                </div>

                {charges?.length === 0 && <div style={{ textAlign:'center', color:'#94a3b8', padding:'1.5rem', fontSize:'0.875rem' }}>No extra charges yet</div>}
                {charges?.map(c => (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0.75rem', borderBottom:'1px solid #f1f5f9', fontSize:'0.875rem' }}>
                    <div>
                      <span style={{ fontSize:'0.72rem', background:'#f1f5f9', borderRadius:4, padding:'1px 6px', marginRight:6, textTransform:'uppercase', color:'#475569' }}>{c.category}</span>
                      <span style={{ fontWeight:500 }}>{c.description}</span>
                      <span style={{ color:'#94a3b8', fontSize:'0.78rem', marginLeft:8 }}>×{c.quantity}</span>
                      {c.notes && <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:2 }}>{c.notes}</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <strong style={{ color:P }}>{sym} {parseFloat(c.amount).toLocaleString()}</strong>
                      <button onClick={() => removeCharge(c.id)} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:'0.85rem' }}>✕</button>
                    </div>
                  </div>
                ))}
                {charges?.length > 0 && (
                  <div style={{ display:'flex', justifyContent:'flex-end', padding:'0.75rem 0', fontWeight:700 }}>
                    Extra Charges: {sym} {totalCharges.toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {tab === 'payment' && (
              <div>
                <div style={{ ...card({ padding:'1rem', marginBottom:'1rem', border:'1px solid #e2e8f0' }) }}>
                  <div style={{ fontWeight:700, fontSize:'0.85rem', color:P, marginBottom:'0.75rem' }}>💵 Record Cash Payment</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                    <div>
                      <label style={lbl}>Amount (NPR)</label>
                      <input type="number" min="0" value={payForm.amount} onChange={e => setPayForm(p=>({...p,amount:e.target.value}))} placeholder="0.00" style={inp()} />
                    </div>
                    <div>
                      <label style={lbl}>Method</label>
                      <select value={payForm.method} onChange={e => setPayForm(p=>({...p,method:e.target.value}))} style={inp()}>
                        <option value="cash">💵 Cash</option>
                        <option value="card">💳 Card</option>
                        <option value="qr_transfer">📱 QR / eSewa / FonePay</option>
                        <option value="bank_transfer">🏦 Bank Transfer</option>
                      </select>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={lbl}>Notes</label>
                      <input value={payForm.notes} onChange={e => setPayForm(p=>({...p,notes:e.target.value}))} style={inp()} />
                    </div>
                  </div>
                  <div style={{ marginTop:'0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.85rem', color: balance>0?'#dc2626':'#16a34a', fontWeight:600 }}>
                      Balance Due: {sym} {balance.toLocaleString()}
                    </span>
                    <button onClick={addPayment} disabled={submitting} style={{ ...btn({ background:'#16a34a', color:'white' }) }}>
                      {submitting ? 'Saving…' : '✓ Record Payment'}
                    </button>
                  </div>
                </div>

                <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#475569', marginBottom:'0.5rem' }}>Payment History</div>
                {payments?.length === 0 && <div style={{ color:'#94a3b8', fontSize:'0.875rem' }}>No payments yet</div>}
                {payments?.map(p => (
                  <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0', borderBottom:'1px solid #f1f5f9', fontSize:'0.85rem' }}>
                    <div>
                      <span style={{ fontWeight:500, textTransform:'capitalize' }}>{p.method?.replace(/_/g,' ')}</span>
                      {p.notes && <span style={{ color:'#94a3b8', marginLeft:8 }}>{p.notes}</span>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <span style={{ color:'#64748b', fontSize:'0.78rem' }}>{new Date(p.processed_at).toLocaleString()}</span>
                      <strong style={{ color:'#16a34a' }}>{sym} {parseFloat(p.amount).toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'summary' && (
              <div>
                {[
                  ['Room Charges', booking?.subtotal],
                  ['Discount', `-${booking?.discount_amount||0}`],
                  ['Extra Charges', totalCharges],
                  ['Tax (13%)', booking?.taxes],
                  ['Service Charge (10%)', booking?.service_charge],
                  ['TOTAL DUE', grandTotal, true],
                  ['Total Paid', totalPaid, false, '#16a34a'],
                  ['BALANCE', balance, true, balance > 0 ? '#dc2626' : '#16a34a'],
                ].map(([label, val, bold, color]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0', borderBottom:'1px solid #f1f5f9', fontWeight: bold?700:400, color: color||'inherit', fontSize: bold?'0.95rem':'0.875rem' }}>
                    <span>{label}</span>
                    <span>{sym} {parseFloat(val||0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvoice && data && <InvoiceView data={data} onClose={() => setShowInvoice(false)} />}
    </>
  );
}

// ──────────────────────────────────────────────────────────
// MAIN FRONT DESK PAGE
// ──────────────────────────────────────────────────────────
export default function AdminFrontDesk() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [flash, setFlash] = useState('');
  const [today, setToday] = useState({ arrivals:[], departures:[] });
  const [avail, setAvail] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState('');
  const [folioId, setFolioId] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching2, setSearching2] = useState(false);

  const [form, setForm] = useState({
    room_id:'', guest_first_name:'', guest_last_name:'', guest_email:'', guest_phone:'',
    guest_nationality:'', guest_id_type:'passport', guest_id_number:'', guest_address:'', guest_dob:'',
    adults:1, children:0, payment_method:'cash', amount_paid:'', discount_amount:'',
    special_requests:'', internal_notes:''
  });
  const f = (k,v) => setForm(p => ({...p,[k]:v}));
  const setFlashMsg = m => { setFlash(m); setTimeout(() => setFlash(''), 3500); };

  const loadGrid = () => {
    setLoading(true);
    adminApi.get('/frontdesk/room-grid').then(r => setRooms(r.data)).catch(() => {}).finally(() => setLoading(false));
    adminApi.get('/frontdesk/today').then(r => setToday(r.data)).catch(() => {});
  };

  useEffect(() => { loadGrid(); }, []);

  const doSearch = async (q) => {
    if (q.length < 2) return setSearchResults([]);
    setSearching2(true);
    try { const r = await adminApi.get(`/frontdesk/search?q=${encodeURIComponent(q)}`); setSearchResults(r.data); }
    catch {}
    finally { setSearching2(false); }
  };

  const nights = checkIn && checkOut ? Math.max(0, Math.ceil((new Date(checkOut)-new Date(checkIn))/86400000)) : 0;
  const selRoom = avail.find(r => r.id == form.room_id);
  const sub = selRoom ? selRoom.base_price * nights : 0;
  const disc = parseFloat(form.discount_amount || 0);
  const taxable = Math.max(0, sub - disc);
  const est = (taxable * 1.23).toFixed(2);

  const search = async () => {
    if (!checkIn || !checkOut) return alert('Select check-in and check-out dates first');
    setSearching(true);
    adminApi.get(`/frontdesk/available-rooms?check_in=${checkIn}&check_out=${checkOut}`)
      .then(r => setAvail(r.data)).catch(() => alert('Search failed')).finally(() => setSearching(false));
  };

  const submit = async () => {
    if (!form.room_id || !form.guest_first_name || !form.guest_last_name || !checkIn || !checkOut)
      return alert('Room, dates and guest name are required');
    setSubmitting(true);
    try {
      const { data } = await adminApi.post('/frontdesk/walk-in', { ...form, check_in_date:checkIn, check_out_date:checkOut });
      setSuccessRef(data.booking_reference);
      setForm({ room_id:'', guest_first_name:'', guest_last_name:'', guest_email:'', guest_phone:'', guest_nationality:'', guest_id_type:'passport', guest_id_number:'', guest_address:'', guest_dob:'', adults:1, children:0, payment_method:'cash', amount_paid:'', discount_amount:'', special_requests:'', internal_notes:'' });
      setAvail([]); setCheckIn(''); setCheckOut('');
      loadGrid();
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const act = async (action, room) => {
    try {
      if (action === 'checkin')  await adminApi.post(`/frontdesk/check-in/${room.booking_id}`);
      if (action === 'checkout') await adminApi.post(`/frontdesk/check-out/${room.booking_id}`);
      if (action === 'clean')    await adminApi.put(`/frontdesk/room-status/${room.id}`, { status:'available', housekeeping_status:'clean' });
      if (action === 'maintenance') await adminApi.put(`/frontdesk/room-status/${room.id}`, { status:'maintenance' });
      setFlashMsg('✅ Done'); loadGrid(); setSelected(null);
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);
  const counts = { all:rooms.length, available:rooms.filter(r=>r.status==='available').length, occupied:rooms.filter(r=>r.status==='occupied').length, housekeeping:rooms.filter(r=>r.status==='housekeeping').length };
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div style={{ marginBottom:'1.25rem' }}>
        <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(1.5rem,4vw,2rem)', color:P, marginBottom:0 }}>🏨 Front Desk</h1>
        <p style={{ color:'#64748b', fontSize:'0.875rem', margin:'4px 0 0' }}>PMS — counter booking, guest charges, invoices</p>
      </div>

      <Flash msg={flash} />

      {/* Today arrivals / departures */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
        {[["Today's Arrivals", today.arrivals, '#d1fae5', '#065f46'], ["Today's Departures", today.departures, '#fee2e2', '#991b1b']].map(([title, list, bg, cl]) => (
          <div key={title} style={{ ...card({ padding:'1rem' }) }}>
            <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:cl, marginBottom:'0.5rem', background:bg, display:'inline-block', padding:'2px 8px', borderRadius:20 }}>{title} ({list?.length||0})</div>
            {(list||[]).slice(0,4).map(b => (
              <div key={b.id} style={{ display:'flex', justifyContent:'space-between', padding:'0.3rem 0', borderBottom:'1px solid #f1f5f9', fontSize:'0.82rem' }}>
                <span style={{ fontWeight:500 }}>{b.guest_first_name} {b.guest_last_name}</span>
                <span style={{ color:'#94a3b8' }}>Rm {b.room_number}</span>
              </div>
            ))}
            {!(list?.length) && <p style={{ fontSize:'0.82rem', color:'#94a3b8', margin:0 }}>None today</p>}
          </div>
        ))}

        {/* Quick search */}
        <div style={{ ...card({ padding:'1rem' }) }}>
          <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem' }}>🔍 Quick Search</div>
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); doSearch(e.target.value); }} placeholder="Name, room, ref, phone…" style={inp()} />
          {searching2 && <div style={{ fontSize:'0.8rem', color:'#94a3b8', marginTop:4 }}>Searching…</div>}
          {searchResults.map(b => (
            <div key={b.id} onClick={() => setFolioId(b.id)}
              style={{ display:'flex', justifyContent:'space-between', padding:'0.35rem 0', borderBottom:'1px solid #f1f5f9', fontSize:'0.8rem', cursor:'pointer' }}>
              <span style={{ fontWeight:500 }}>{b.guest_first_name} {b.guest_last_name} · Rm {b.room_number}</span>
              <span style={{ color:G, fontWeight:600 }}>Folio ↗</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.25rem', background:'white', borderRadius:12, padding:'0.35rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginBottom:'1.25rem', overflowX:'auto' }}>
        {[['grid','🗺 Room Grid'],['walkin','➕ Counter Booking']].map(([id,l]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ ...btn({ padding:'0.55rem 1.1rem', background: tab===id?P:'transparent', color: tab===id?'white':'#64748b', fontWeight: tab===id?600:400, whiteSpace:'nowrap' }) }}>{l}</button>
        ))}
      </div>

      {/* ── ROOM GRID ── */}
      {tab === 'grid' && (
        <div>
          <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap', marginBottom:'1rem' }}>
            {Object.entries(counts).map(([s,n]) => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ ...btn({ padding:'0.4rem 1rem', background: filter===s?P:'white', color: filter===s?'white':'#475569', border:`1.5px solid ${filter===s?P:'#e2e8f0'}`, fontSize:'0.8rem' }) }}>
                {s.charAt(0).toUpperCase()+s.slice(1)} ({n})
              </button>
            ))}
          </div>

          {loading
            ? <div style={{ textAlign:'center', color:'#94a3b8', padding:'3rem' }}>Loading rooms…</div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.75rem' }}>
                {filtered.map(room => (
                  <div key={room.id} onClick={() => setSelected(room)}
                    style={{ ...card({ padding:'0.875rem', cursor:'pointer', border:`1.5px solid ${selected?.id===room.id?P:'transparent'}`, transition:'all 0.18s' }) }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                      <span style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', fontWeight:700, color:P }}>
                        {room.room_number}
                      </span>
                      <Badge status={room.status} />
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'#64748b' }}>{room.category_name}</div>
                    <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Floor {room.floor}{room.wing?` · ${room.wing}`:''}</div>
                    {room.guest_first_name && (
                      <div style={{ marginTop:'0.5rem', fontSize:'0.78rem', fontWeight:500, color:'#1e293b', borderTop:'1px solid #f1f5f9', paddingTop:'0.4rem' }}>
                        {room.guest_first_name} {room.guest_last_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
          }

          {/* Room detail panel */}
          {selected && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:800, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0.5rem' }}
              onClick={e => { if (e.target===e.currentTarget) setSelected(null); }}>
              <div style={{ ...card({ padding:'1.25rem', width:'100%', maxWidth:480 }) }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                  <h3 style={{ margin:0, fontFamily:'var(--font-heading)', color:P }}>Room {selected.room_number}</h3>
                  <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#94a3b8' }}>✕</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1rem', fontSize:'0.85rem' }}>
                  <div><span style={lbl}>Type</span>{selected.category_name}</div>
                  <div><span style={lbl}>Status</span><Badge status={selected.status} /></div>
                  <div><span style={lbl}>Floor</span>{selected.floor}</div>
                  <div><span style={lbl}>Bed</span>{selected.bed_type}</div>
                </div>
                {selected.guest_first_name && (
                  <div style={{ background:'#f8fafb', borderRadius:8, padding:'0.75rem', marginBottom:'1rem', fontSize:'0.85rem' }}>
                    <div style={{ fontWeight:600, marginBottom:'0.35rem' }}>{selected.guest_first_name} {selected.guest_last_name}</div>
                    <div style={{ color:'#64748b' }}>{selected.guest_phone}</div>
                    <div style={{ color:'#64748b' }}>In: {new Date(selected.check_in_date).toLocaleDateString()} · Out: {new Date(selected.check_out_date).toLocaleDateString()}</div>
                    <div style={{ color:'#64748b', textTransform:'capitalize' }}>Payment: {selected.payment_status}</div>
                  </div>
                )}
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {selected.booking_id && selected.booking_status === 'confirmed' && (
                    <button onClick={() => act('checkin', selected)} style={{ ...btn({ background:P, color:'white', flex:1 }) }}>✓ Check In</button>
                  )}
                  {selected.booking_id && selected.booking_status === 'checked_in' && (
                    <>
                      <button onClick={() => setFolioId(selected.booking_id)} style={{ ...btn({ background:G, color:'white', flex:1 }) }}>🧾 Folio</button>
                      <button onClick={() => act('checkout', selected)} style={{ ...btn({ background:'#dc2626', color:'white', flex:1 }) }}>→ Check Out</button>
                    </>
                  )}
                  {selected.status === 'housekeeping' && (
                    <button onClick={() => act('clean', selected)} style={{ ...btn({ background:'#16a34a', color:'white', flex:1 }) }}>✓ Mark Clean</button>
                  )}
                  {selected.status === 'available' && (
                    <button onClick={() => act('maintenance', selected)} style={{ ...btn({ background:'#f59e0b', color:'white', flex:1 }) }}>⚠ Maintenance</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COUNTER BOOKING ── */}
      {tab === 'walkin' && (
        <div style={{ maxWidth:760 }}>
          {successRef && (
            <div style={{ background:'#d1fae5', color:'#065f46', padding:'1rem', borderRadius:10, marginBottom:'1.25rem', fontWeight:600 }}>
              ✅ Counter Booking Created — Ref: <strong>{successRef}</strong>
              <button onClick={() => setSuccessRef('')} style={{ float:'right', background:'none', border:'none', cursor:'pointer', color:'#065f46' }}>✕</button>
            </div>
          )}

          {/* Step 1: Dates */}
          <div style={{ ...card({ padding:'1.25rem', marginBottom:'1rem' }) }}>
            <div style={{ fontWeight:700, color:P, marginBottom:'0.75rem', fontSize:'0.9rem' }}>1️⃣ Select Dates</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'0.75rem', alignItems:'flex-end' }}>
              <div>
                <label style={lbl}>Check-in</label>
                <input type="date" min={todayStr} value={checkIn} onChange={e => setCheckIn(e.target.value)} style={inp()} />
              </div>
              <div>
                <label style={lbl}>Check-out</label>
                <input type="date" min={checkIn||todayStr} value={checkOut} onChange={e => setCheckOut(e.target.value)} style={inp()} />
              </div>
              <button onClick={search} disabled={searching} style={{ ...btn({ background:P, color:'white', whiteSpace:'nowrap' }) }}>
                {searching ? 'Searching…' : '🔍 Find Rooms'}
              </button>
            </div>
            {nights > 0 && <div style={{ marginTop:'0.5rem', fontSize:'0.85rem', color:'#64748b' }}>{nights} night{nights!==1?'s':''}</div>}
          </div>

          {/* Step 2: Room select */}
          {avail.length > 0 && (
            <div style={{ ...card({ padding:'1.25rem', marginBottom:'1rem' }) }}>
              <div style={{ fontWeight:700, color:P, marginBottom:'0.75rem', fontSize:'0.9rem' }}>2️⃣ Choose Room</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.6rem' }}>
                {avail.map(r => (
                  <div key={r.id} onClick={() => f('room_id', r.id)}
                    style={{ ...card({ padding:'0.75rem', cursor:'pointer', border:`2px solid ${form.room_id==r.id?P:'#e2e8f0'}`, background: form.room_id==r.id?'color-mix(in srgb,var(--color-primary) 4%,white)':'white' }) }}>
                    <div style={{ fontFamily:'var(--font-heading)', fontSize:'1rem', fontWeight:700, color:P }}>Rm {r.room_number}</div>
                    <div style={{ fontSize:'0.78rem', color:'#64748b' }}>{r.category_name}</div>
                    <div style={{ fontSize:'0.78rem', color:'#94a3b8' }}>Floor {r.floor} · {r.bed_type}</div>
                    <div style={{ fontWeight:700, color:G, marginTop:'0.35rem', fontSize:'0.9rem' }}>NPR {r.base_price?.toLocaleString()}/night</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Guest details */}
          <div style={{ ...card({ padding:'1.25rem', marginBottom:'1rem' }) }}>
            <div style={{ fontWeight:700, color:P, marginBottom:'0.75rem', fontSize:'0.9rem' }}>3️⃣ Guest Details</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div>
                <label style={lbl}>First Name *</label>
                <input value={form.guest_first_name} onChange={e=>f('guest_first_name',e.target.value)} style={inp()} />
              </div>
              <div>
                <label style={lbl}>Last Name *</label>
                <input value={form.guest_last_name} onChange={e=>f('guest_last_name',e.target.value)} style={inp()} />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input value={form.guest_phone} onChange={e=>f('guest_phone',e.target.value)} placeholder="+977 98XXXXXXXX" style={inp()} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={form.guest_email} onChange={e=>f('guest_email',e.target.value)} style={inp()} />
              </div>
              <div>
                <label style={lbl}>Nationality</label>
                <input value={form.guest_nationality} onChange={e=>f('guest_nationality',e.target.value)} style={inp()} />
              </div>
              <div>
                <label style={lbl}>Date of Birth</label>
                <input type="date" value={form.guest_dob} onChange={e=>f('guest_dob',e.target.value)} style={inp()} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Address</label>
                <input value={form.guest_address} onChange={e=>f('guest_address',e.target.value)} style={inp()} />
              </div>

              <div>
                <label style={lbl}>ID Type</label>
                <select value={form.guest_id_type} onChange={e=>f('guest_id_type',e.target.value)} style={inp()}>
                  {ID_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>ID Number</label>
                <input value={form.guest_id_number} onChange={e=>f('guest_id_number',e.target.value)} placeholder="Passport / NID No." style={inp()} />
              </div>

              <div>
                <label style={lbl}>Adults</label>
                <input type="number" min="1" max="10" value={form.adults} onChange={e=>f('adults',e.target.value)} style={inp()} />
              </div>
              <div>
                <label style={lbl}>Children</label>
                <input type="number" min="0" max="10" value={form.children} onChange={e=>f('children',e.target.value)} style={inp()} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Special Requests</label>
                <input value={form.special_requests} onChange={e=>f('special_requests',e.target.value)} style={inp()} />
              </div>
            </div>
          </div>

          {/* Step 4: Payment */}
          <div style={{ ...card({ padding:'1.25rem', marginBottom:'1.25rem' }) }}>
            <div style={{ fontWeight:700, color:P, marginBottom:'0.75rem', fontSize:'0.9rem' }}>4️⃣ Payment</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
              <div>
                <label style={lbl}>Method</label>
                <select value={form.payment_method} onChange={e=>f('payment_method',e.target.value)} style={inp()}>
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="qr_transfer">📱 QR / eSewa</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Discount (NPR)</label>
                <input type="number" min="0" value={form.discount_amount} onChange={e=>f('discount_amount',e.target.value)} placeholder="0" style={inp()} />
              </div>
              <div>
                <label style={lbl}>Amount Paid (NPR)</label>
                <input type="number" min="0" value={form.amount_paid} onChange={e=>f('amount_paid',e.target.value)} placeholder="0.00" style={inp()} />
              </div>
            </div>
            {selRoom && nights > 0 && (
              <div style={{ marginTop:'0.875rem', background:'#f8fafb', borderRadius:8, padding:'0.75rem', fontSize:'0.85rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span>Room × {nights} nights</span><span>NPR {sub.toLocaleString()}</span></div>
                {disc>0&&<div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, color:'green' }}><span>Discount</span><span>-NPR {disc.toLocaleString()}</span></div>}
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, color:'#64748b' }}><span>Tax + Service (23%)</span><span>NPR {(taxable*0.23).toFixed(2)}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:'1rem', borderTop:'1px solid #e2e8f0', paddingTop:6, marginTop:4 }}><span>TOTAL DUE</span><span style={{ color:P }}>NPR {parseFloat(est).toLocaleString()}</span></div>
              </div>
            )}
          </div>

          <button onClick={submit} disabled={submitting || !form.room_id}
            style={{ ...btn({ background: (!form.room_id||submitting)?'#94a3b8':P, color:'white', width:'100%', padding:'0.875rem', fontSize:'1rem' }) }}>
            {submitting ? '⏳ Creating Booking…' : '✓ Create Counter Booking & Check In'}
          </button>
        </div>
      )}

      {/* Folio modal */}
      {folioId && <BookingFolio bookingId={folioId} onClose={() => { setFolioId(null); loadGrid(); }} />}
    </div>
  );
}
