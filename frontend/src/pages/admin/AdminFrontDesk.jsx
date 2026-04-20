// ============================================================
// src/pages/admin/AdminFrontDesk.jsx — PMS / Front Desk
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';

const SC={available:{bg:'#d1fae5',color:'#065f46',label:'Available'},occupied:{bg:'#fee2e2',color:'#991b1b',label:'Occupied'},housekeeping:{bg:'#fef3c7',color:'#92400e',label:'Housekeeping'},maintenance:{bg:'#e2e8f0',color:'#475569',label:'Maintenance'}};
const lbl={display:'block',fontSize:'0.68rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#475569',marginBottom:4};
const inp=(x={})=>({width:'100%',padding:'0.625rem 0.875rem',border:'1.5px solid #e2e8f0',borderRadius:6,fontFamily:'var(--font-body)',fontSize:'0.875rem',outline:'none',boxSizing:'border-box',...x});

export default function AdminFrontDesk(){
  const [rooms,setRooms]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('grid');
  const [selected,setSelected]=useState(null);
  const [flash,setFlash]=useState('');
  const [filter,setFilter]=useState('all');
  const [today,setToday]=useState({arrivals:[],departures:[]});
  const [avail,setAvail]=useState([]);
  const [checkIn,setCheckIn]=useState('');
  const [checkOut,setCheckOut]=useState('');
  const [searching,setSearching]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [successRef,setSuccessRef]=useState('');
  const [form,setForm]=useState({room_id:'',guest_first_name:'',guest_last_name:'',guest_email:'',guest_phone:'',guest_nationality:'',adults:1,children:0,payment_method:'cash',amount_paid:'',special_requests:'',internal_notes:''});
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const loadGrid=()=>{
    setLoading(true);
    adminApi.get('/frontdesk/room-grid').then(r=>setRooms(r.data)).catch(()=>{}).finally(()=>setLoading(false));
    adminApi.get('/frontdesk/today').then(r=>setToday(r.data)).catch(()=>{});
  };
  useEffect(()=>{loadGrid();},[]);

  const flash2=(m)=>{setFlash(m);setTimeout(()=>setFlash(''),3000);};
  const act=async(action,room)=>{
    try{
      if(action==='checkin') await adminApi.post(`/frontdesk/check-in/${room.booking_id}`);
      if(action==='checkout') await adminApi.post(`/frontdesk/check-out/${room.booking_id}`);
      if(action==='clean') await adminApi.put(`/frontdesk/room-status/${room.id}`,{status:'available',housekeeping_status:'clean'});
      if(action==='maintenance') await adminApi.put(`/frontdesk/room-status/${room.id}`,{status:'maintenance'});
      flash2('✅ Done');loadGrid();setSelected(null);
    }catch(e){alert(e.response?.data?.error||'Failed');}
  };

  const search=async()=>{
    if(!checkIn||!checkOut) return alert('Select dates first');
    setSearching(true);
    adminApi.get(`/frontdesk/available-rooms?check_in=${checkIn}&check_out=${checkOut}`)
      .then(r=>setAvail(r.data)).catch(()=>alert('Search failed')).finally(()=>setSearching(false));
  };

  const nights=checkIn&&checkOut?Math.max(0,Math.ceil((new Date(checkOut)-new Date(checkIn))/86400000)):0;
  const selRoom=avail.find(r=>r.id==form.room_id);
  const est=selRoom?(selRoom.base_price*nights*1.2).toFixed(2):'0.00';

  const submit=async()=>{
    if(!form.room_id||!form.guest_first_name||!form.guest_last_name||!checkIn||!checkOut) return alert('Room, dates and guest name are required');
    setSubmitting(true);
    try{
      const {data}=await adminApi.post('/frontdesk/walk-in',{...form,check_in_date:checkIn,check_out_date:checkOut});
      setSuccessRef(data.booking_reference);
      setForm({room_id:'',guest_first_name:'',guest_last_name:'',guest_email:'',guest_phone:'',guest_nationality:'',adults:1,children:0,payment_method:'cash',amount_paid:'',special_requests:'',internal_notes:''});
      setAvail([]);setCheckIn('');setCheckOut('');loadGrid();
    }catch(e){alert(e.response?.data?.error||'Failed');}
    finally{setSubmitting(false);}
  };

  const filtered=filter==='all'?rooms:rooms.filter(r=>r.status===filter);
  const counts={all:rooms.length,available:rooms.filter(r=>r.status==='available').length,occupied:rooms.filter(r=>r.status==='occupied').length,housekeeping:rooms.filter(r=>r.status==='housekeeping').length};

  return(
    <div>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontFamily:'var(--font-heading)',fontSize:'2rem',color:'var(--color-primary)',marginBottom:0}}>🏨 Front Desk</h1>
        <p style={{color:'#64748b',fontSize:'0.875rem'}}>Room grid, walk-in bookings, check-in & check-out</p>
      </div>
      {flash&&<div style={{background:'#d1fae5',color:'#065f46',padding:'0.875rem 1.25rem',borderRadius:10,marginBottom:'1.25rem',fontWeight:500}}>{flash}</div>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        {[['Today\'s Arrivals',today.arrivals],[`Today's Departures`,today.departures]].map(([title,list])=>(
          <div key={title} style={{background:'white',borderRadius:12,padding:'1.25rem',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#94a3b8',marginBottom:'0.75rem'}}>{title} ({list?.length||0})</div>
            {(list||[]).slice(0,4).map(b=>(
              <div key={b.id} style={{display:'flex',justifyContent:'space-between',padding:'0.35rem 0',borderBottom:'1px solid #f1f5f9',fontSize:'0.82rem'}}>
                <span style={{fontWeight:500,color:'#1e293b'}}>{b.guest_first_name} {b.guest_last_name}</span>
                <span style={{color:'#94a3b8'}}>{b.room_number}</span>
              </div>
            ))}
            {!(list?.length)&&<p style={{fontSize:'0.82rem',color:'#94a3b8',margin:0}}>None today</p>}
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:'0.25rem',background:'white',borderRadius:12,padding:'0.375rem',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',marginBottom:'1.5rem',width:'fit-content'}}>
        {[['grid','🗺 Room Grid'],['walkin','➕ Walk-in Booking']].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'0.6rem 1.25rem',border:'none',cursor:'pointer',borderRadius:8,fontFamily:'var(--font-body)',fontSize:'0.85rem',fontWeight:tab===id?600:400,color:tab===id?'white':'#64748b',background:tab===id?'var(--color-primary)':'transparent',transition:'all 0.2s'}}>{l}</button>
        ))}
      </div>

      {tab==='grid'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
            {[['Total',counts.all,'#f8fafc','#1e293b'],['Available',counts.available,'#d1fae5','#065f46'],['Occupied',counts.occupied,'#fee2e2','#991b1b'],['Housekeeping',counts.housekeeping,'#fef3c7','#92400e']].map(([l,v,bg,c])=>(
              <div key={l} style={{background:bg,borderRadius:12,padding:'1.25rem',textAlign:'center'}}>
                <div style={{fontSize:'2rem',fontWeight:700,color:c,fontFamily:'var(--font-heading)'}}>{v}</div>
                <div style={{fontSize:'0.75rem',color:c,opacity:0.8,fontWeight:600}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.25rem',flexWrap:'wrap',alignItems:'center'}}>
            {['all','available','occupied','housekeeping','maintenance'].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{padding:'0.4rem 1rem',borderRadius:999,border:'1.5px solid',cursor:'pointer',textTransform:'capitalize',borderColor:filter===s?'var(--color-primary)':'#e2e8f0',fontSize:'0.8rem',fontWeight:500,background:filter===s?'var(--color-primary)':'white',color:filter===s?'white':'#475569'}}>{s==='all'?`All (${counts.all})`:s}</button>
            ))}
            <button onClick={loadGrid} style={{marginLeft:'auto',padding:'0.4rem 1rem',borderRadius:999,border:'1.5px solid #e2e8f0',background:'white',color:'#475569',fontSize:'0.8rem',cursor:'pointer'}}>🔄 Refresh</button>
          </div>
          {loading?<div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>Loading…</div>:(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:'0.875rem'}}>
              {filtered.map(room=>{
                const s=SC[room.status]||SC.available;
                return(
                  <div key={room.id} onClick={()=>setSelected(room)} style={{background:'white',borderRadius:12,padding:'1.1rem',cursor:'pointer',border:`2px solid ${selected?.id===room.id?'var(--color-primary)':'#e2e8f0'}`,boxShadow:'0 2px 8px rgba(0,0,0,0.05)',transition:'all 0.18s'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                      <span style={{fontFamily:'var(--font-heading)',fontSize:'1.2rem',fontWeight:700,color:'var(--color-primary)'}}>{room.room_number}</span>
                      <span style={{background:s.bg,color:s.color,fontSize:'0.6rem',fontWeight:600,padding:'2px 7px',borderRadius:999,textTransform:'uppercase'}}>{s.label}</span>
                    </div>
                    <div style={{fontSize:'0.75rem',color:'#64748b'}}>{room.category_name}</div>
                    <div style={{fontSize:'0.7rem',color:'#94a3b8',marginTop:2}}>Floor {room.floor} · {room.wing||'—'}</div>
                    {room.booking_reference&&<div style={{marginTop:'0.625rem',padding:'0.5rem',background:'#f8fafc',borderRadius:6,fontSize:'0.72rem'}}><div style={{fontWeight:600,color:'#1e293b'}}>{room.guest_first_name} {room.guest_last_name}</div><div style={{color:'#94a3b8'}}>Out: {room.check_out_date}</div></div>}
                  </div>
                );
              })}
            </div>
          )}
          {selected&&(
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setSelected(null)}>
              <div style={{background:'white',borderRadius:20,padding:'2rem',width:380,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                  <h2 style={{fontFamily:'var(--font-heading)',fontSize:'1.4rem',color:'var(--color-primary)',margin:0}}>Room {selected.room_number}</h2>
                  <button onClick={()=>setSelected(null)} style={{background:'#f1f5f9',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',fontSize:'1rem'}}>×</button>
                </div>
                <div style={{fontSize:'0.85rem',color:'#475569',lineHeight:1.9,marginBottom:'1.25rem'}}>
                  <div><strong>Category:</strong> {selected.category_name}</div>
                  <div><strong>Floor:</strong> {selected.floor} · <strong>Wing:</strong> {selected.wing||'—'}</div>
                  <div><strong>Status:</strong> <span style={{textTransform:'capitalize'}}>{selected.status}</span></div>
                  <div><strong>Housekeeping:</strong> {selected.housekeeping_status}</div>
                  {selected.booking_reference&&<><div style={{marginTop:'0.5rem',fontWeight:600,color:'var(--color-primary)'}}>Current Guest</div><div>{selected.guest_first_name} {selected.guest_last_name}</div><div>{selected.guest_phone}</div><div>Ref: {selected.booking_reference}</div><div>Check-out: {selected.check_out_date}</div></>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
                  {selected.status==='available'&&selected.booking_id&&<button onClick={()=>act('checkin',selected)} className="btn btn-primary" style={{width:'100%'}}>✓ Check In Guest</button>}
                  {selected.status==='occupied'&&selected.booking_id&&<button onClick={()=>act('checkout',selected)} className="btn btn-primary" style={{width:'100%'}}>✓ Check Out Guest</button>}
                  {selected.status==='housekeeping'&&<button onClick={()=>act('clean',selected)} className="btn btn-primary" style={{width:'100%'}}>✓ Mark Clean & Available</button>}
                  {selected.status!=='maintenance'&&<button onClick={()=>act('maintenance',selected)} style={{width:'100%',padding:'0.75rem',border:'1.5px solid #e2e8f0',borderRadius:8,background:'white',color:'#64748b',cursor:'pointer',fontFamily:'var(--font-body)'}}>🔧 Set to Maintenance</button>}
                  {selected.status==='maintenance'&&<button onClick={()=>act('clean',selected)} className="btn btn-primary" style={{width:'100%'}}>✓ Mark Available</button>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='walkin'&&(
        <div>
          {successRef&&<div style={{background:'#d1fae5',color:'#065f46',padding:'1.25rem 1.5rem',borderRadius:12,marginBottom:'1.5rem',fontWeight:500}}>✅ Booking created! Ref: <strong>{successRef}</strong><button onClick={()=>setSuccessRef('')} style={{marginLeft:'1rem',background:'none',border:'none',color:'#065f46',cursor:'pointer',fontSize:'1.2rem'}}>×</button></div>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
            <div style={{background:'white',borderRadius:16,padding:'1.75rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.2rem',color:'var(--color-primary)',marginBottom:'1.25rem'}}>1. Dates & Room</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <div><label style={lbl}>Check-in *</label><input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} style={inp()}/></div>
                <div><label style={lbl}>Check-out *</label><input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} min={checkIn||new Date().toISOString().split('T')[0]} style={inp()}/></div>
              </div>
              <button onClick={search} disabled={searching} className="btn btn-secondary" style={{width:'100%',marginBottom:'1.25rem'}}>{searching?'Searching…':'🔍 Search Rooms'}</button>
              {nights>0&&<div style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'0.875rem'}}>Duration: <strong>{nights} night{nights!==1?'s':''}</strong></div>}
              {avail.map(room=>(
                <div key={room.id} onClick={()=>f('room_id',room.id)} style={{padding:'0.875rem 1rem',border:'1.5px solid',marginBottom:'0.5rem',cursor:'pointer',borderRadius:10,transition:'all 0.18s',borderColor:form.room_id==room.id?'var(--color-primary)':'#e2e8f0',background:form.room_id==room.id?'#f0fdf4':'white'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontWeight:600,color:'var(--color-primary)',fontSize:'0.9rem'}}>Room {room.room_number} — {room.category_name}</div><div style={{fontSize:'0.75rem',color:'#94a3b8'}}>Floor {room.floor} · {room.wing} · {room.bed_type}</div></div>
                    <div style={{fontFamily:'var(--font-heading)',fontWeight:700,color:'var(--color-secondary)'}}>${room.base_price}/night</div>
                  </div>
                  {nights>0&&<div style={{fontSize:'0.72rem',color:'#64748b',marginTop:4}}>Est: ${(room.base_price*nights*1.2).toFixed(2)}</div>}
                </div>
              ))}
            </div>
            <div style={{background:'white',borderRadius:16,padding:'1.75rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.2rem',color:'var(--color-primary)',marginBottom:'1.25rem'}}>2. Guest & Payment</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div><label style={lbl}>First Name *</label><input value={form.guest_first_name} onChange={e=>f('guest_first_name',e.target.value)} style={inp()}/></div>
                <div><label style={lbl}>Last Name *</label><input value={form.guest_last_name} onChange={e=>f('guest_last_name',e.target.value)} style={inp()}/></div>
                <div><label style={lbl}>Phone</label><input type="tel" value={form.guest_phone} onChange={e=>f('guest_phone',e.target.value)} style={inp()}/></div>
                <div><label style={lbl}>Email</label><input type="email" value={form.guest_email} onChange={e=>f('guest_email',e.target.value)} style={inp()}/></div>
                <div><label style={lbl}>Nationality</label><input value={form.guest_nationality} onChange={e=>f('guest_nationality',e.target.value)} style={inp()}/></div>
                <div><label style={lbl}>Adults</label><input type="number" min={1} max={6} value={form.adults} onChange={e=>f('adults',parseInt(e.target.value))} style={inp()}/></div>
                <div style={{gridColumn:'1/-1'}}><label style={lbl}>Payment</label><select value={form.payment_method} onChange={e=>f('payment_method',e.target.value)} style={inp()}><option value="cash">Cash</option><option value="qr_transfer">QR / Bank Transfer</option><option value="card">Card</option></select></div>
                <div><label style={lbl}>Amount Collected ($)</label><input type="number" min={0} step="0.01" value={form.amount_paid} onChange={e=>f('amount_paid',e.target.value)} placeholder={est} style={inp()}/></div>
                <div style={{display:'flex',alignItems:'flex-end',paddingBottom:2}}><div style={{background:'#f8fafc',borderRadius:8,padding:'0.625rem 0.875rem',fontSize:'0.8rem',color:'#64748b',width:'100%'}}>Est: <strong style={{color:'var(--color-secondary)'}}>${est}</strong>{nights>0&&<div style={{fontSize:'0.7rem'}}>{nights}n + 20% taxes</div>}</div></div>
                <div style={{gridColumn:'1/-1'}}><label style={lbl}>Special Requests</label><textarea rows={2} value={form.special_requests} onChange={e=>f('special_requests',e.target.value)} style={inp({resize:'vertical'})}/></div>
                <div style={{gridColumn:'1/-1'}}><label style={lbl}>Internal Notes</label><textarea rows={2} value={form.internal_notes} onChange={e=>f('internal_notes',e.target.value)} placeholder="Staff only" style={inp({resize:'vertical'})}/></div>
              </div>
              <button onClick={submit} disabled={submitting} className="btn btn-primary" style={{width:'100%',marginTop:'1.5rem',padding:'1rem',fontSize:'0.95rem'}}>{submitting?'Creating…':'✓ Create Walk-in Booking'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
