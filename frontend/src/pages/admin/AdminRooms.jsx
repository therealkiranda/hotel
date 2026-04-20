// ============================================================
// src/pages/admin/AdminRooms.jsx — Full Room Management
// FIX #3: Full room category editor with amenity checkboxes
// FIX #13: All amenity types (AC, TV, geyser, etc.) selectable
// ============================================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../utils/api';

const STATUS_COLOR = {
  available:    { bg:'#d1fae5', color:'#065f46' },
  occupied:     { bg:'#dbeafe', color:'#1e40af' },
  maintenance:  { bg:'#fee2e2', color:'#991b1b' },
  housekeeping: { bg:'#fef3c7', color:'#92400e' },
};

const AMENITY_ICONS = {
  bedroom:'🛏', bathroom:'🚿', technology:'📺',
  comfort:'❄️', kitchen:'☕', services:'🍽️', outdoor:'🌴',
};

const fmtMoney = (n, sym='$') => `${sym}${Number(n||0).toLocaleString()}`;

export default function AdminRooms() {
  const [categories, setCategories] = useState([]);
  const [amenityTypes, setAmenityTypes] = useState({ flat:[], grouped:{} });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('categories');
  const [editing, setEditing] = useState(null);       // category being edited
  const [editingRoom, setEditingRoom] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null); // for viewing rooms of a category
  const [catRooms, setCatRooms] = useState([]);

  useEffect(() => {
    Promise.all([
      adminApi.get('/room-categories').then(r => setCategories(r.data)).catch(() => {}),
      adminApi.get('/room-categories/amenity-types/all').then(r => setAmenityTypes(r.data)).catch(() => {}),
      adminApi.get('/admin/rooms').then(r => setRooms(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const loadCatRooms = async (catId) => {
    const { data } = await adminApi.get(`/room-categories/${catId}/rooms`);
    setCatRooms(data);
    setSelectedCat(catId);
  };

  const handleSaveCategory = async (formData) => {
    try {
      if (formData.id) {
        await adminApi.put(`/room-categories/${formData.id}`, formData);
        setCategories(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } : c));
      } else {
        const { data } = await adminApi.post('/room-categories', formData);
        const { data: updated } = await adminApi.get('/room-categories');
        setCategories(updated);
      }
      setShowCatForm(false); setEditing(null);
    } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
  };

  const handleToggleCategory = async (id, current) => {
    await adminApi.put(`/room-categories/${id}`, { is_active: current ? 0 : 1 });
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_active: current ? 0 : 1 } : c));
  };

  const handleSaveRoom = async (formData) => {
    try {
      if (formData.id) {
        await adminApi.put(`/room-categories/${formData.category_id}/rooms/${formData.id}`, formData);
        setCatRooms(prev => prev.map(r => r.id === formData.id ? { ...r, ...formData } : r));
      } else {
        const { data } = await adminApi.post(`/room-categories/${selectedCat}/rooms`, formData);
        loadCatRooms(selectedCat);
      }
      setShowRoomForm(false); setEditingRoom(null);
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleRoomStatus = async (id, field, value) => {
    await adminApi.put(`/admin/rooms/${id}/status`, { [field]: value });
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.75rem' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)', marginBottom:0 }}>
            Room Management
          </h1>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:0 }}>
            Manage room categories, types, amenities, and individual rooms
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          {tab === 'categories' && (
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowCatForm(true); }}>
              + New Room Category
            </button>
          )}
          {tab === 'rooms' && selectedCat && (
            <button className="btn btn-primary" onClick={() => { setEditingRoom(null); setShowRoomForm(true); }}>
              + Add Room
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:'1.5rem', background:'white',
        borderRadius:12, padding:'0.375rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', width:'fit-content' }}>
        {[{ id:'categories', label:'🏷️ Room Categories' },{ id:'rooms', label:'🛏 All Rooms' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'0.625rem 1.25rem', border:'none', cursor:'pointer', borderRadius:8,
              fontFamily:'var(--font-body)', fontSize:'0.85rem', fontWeight:tab===t.id?600:400,
              color:tab===t.id?'white':'#64748b', background:tab===t.id?'var(--color-primary)':'transparent',
              transition:'all 0.2s' }}>{t.label}</button>
        ))}
      </div>

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>}

      {/* ── CATEGORIES ──────────────────────────────────── */}
      {!loading && tab === 'categories' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:'1.5rem' }}>
          {categories.map(cat => (
            <motion.div key={cat.id} layout
              style={{ background:'white', borderRadius:16, overflow:'hidden',
                boxShadow:'0 2px 12px rgba(0,0,0,0.07)',
                opacity: cat.is_active ? 1 : 0.6,
                border:`1px solid ${cat.is_active ? 'rgba(0,0,0,0.05)' : '#f1f5f9'}` }}>

              {/* Header */}
              <div style={{ height:120,
                background:`linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, #000))`,
                padding:'1.25rem', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ fontFamily:'var(--font-heading)', color:'white',
                    fontSize:'1.3rem', fontWeight:700 }}>{cat.name}</div>
                  {!cat.is_active && (
                    <span style={{ fontSize:'0.68rem', background:'rgba(255,255,255,0.2)', color:'white',
                      padding:'2px 8px', borderRadius:999 }}>Hidden</span>
                  )}
                </div>
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <span style={{ fontFamily:'var(--font-heading)', color:'var(--color-secondary)',
                    fontSize:'1.5rem', fontWeight:700 }}>${Number(cat.base_price).toLocaleString()}</span>
                  <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.82rem', alignSelf:'flex-end' }}>/night</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding:'1.25rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1rem' }}>
                  {[
                    [`${cat.size_sqm || '—'} m²`, '📐'],
                    [cat.bed_type || '—', '🛏'],
                    [`Max ${cat.max_adults} adults`, '👥'],
                    [cat.view_type || '—', '🪟'],
                  ].map(([v, icon]) => (
                    <div key={v} style={{ fontSize:'0.78rem', color:'#64748b', display:'flex', gap:'0.375rem', alignItems:'center' }}>
                      <span>{icon}</span> {v}
                    </div>
                  ))}
                </div>

                {/* Amenity types summary */}
                {cat.amenity_types?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem', marginBottom:'1rem' }}>
                    {cat.amenity_types.slice(0, 6).map(a => (
                      <span key={a.amenity_type_id || a.id} style={{ fontSize:'0.7rem', padding:'2px 8px',
                        borderRadius:999, background:'#f1f5f9', color:'#475569' }}>
                        {a.icon} {a.name}
                      </span>
                    ))}
                    {cat.amenity_types.length > 6 && (
                      <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>+{cat.amenity_types.length - 6} more</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  <button onClick={() => { setEditing(cat); setShowCatForm(true); }}
                    style={{ flex:1, padding:'6px 12px', background:'var(--color-primary)', color:'white',
                      border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:500 }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => { setTab('rooms'); loadCatRooms(cat.id); }}
                    style={{ flex:1, padding:'6px 12px', background:'#dbeafe', color:'#1e40af',
                      border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:500 }}>
                    🛏 Rooms
                  </button>
                  <button onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                    style={{ padding:'6px 12px', background:cat.is_active?'#fee2e2':'#d1fae5',
                      color:cat.is_active?'#991b1b':'#065f46',
                      border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem' }}>
                    {cat.is_active ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── ALL ROOMS ───────────────────────────────────── */}
      {!loading && tab === 'rooms' && (
        <div>
          {selectedCat && (
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10,
              padding:'0.875rem 1.25rem', marginBottom:'1.25rem', fontSize:'0.875rem',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#1e40af' }}>
                Showing rooms for: <strong>{categories.find(c => c.id === selectedCat)?.name}</strong>
              </span>
              <button onClick={() => setSelectedCat(null)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#3b82f6', fontSize:'0.8rem' }}>
                Show all rooms ×
              </button>
            </div>
          )}

          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                    {['Room #','Category','Floor/Wing','Status','Housekeeping','Rate','OTA IDs','Actions'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'1rem 1.25rem', color:'#64748b',
                        fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(selectedCat ? catRooms : rooms).map(room => (
                    <tr key={room.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'1rem 1.25rem', fontWeight:700, color:'var(--color-primary)', fontFamily:'monospace' }}>
                        {room.room_number}
                      </td>
                      <td style={{ padding:'1rem 1.25rem' }}>{room.category_name || '—'}</td>
                      <td style={{ padding:'1rem 1.25rem', color:'#64748b' }}>
                        F{room.floor}{room.wing ? ` · ${room.wing}` : ''}
                      </td>
                      <td style={{ padding:'1rem 1.25rem' }}>
                        <select value={room.status}
                          onChange={e => handleRoomStatus(room.id, 'status', e.target.value)}
                          style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #e2e8f0',
                            fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-body)',
                            background: STATUS_COLOR[room.status]?.bg || '#f3f4f6',
                            color: STATUS_COLOR[room.status]?.color || '#374151' }}>
                          {['available','occupied','maintenance','housekeeping'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding:'1rem 1.25rem' }}>
                        <select value={room.housekeeping_status}
                          onChange={e => handleRoomStatus(room.id, 'housekeeping_status', e.target.value)}
                          style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #e2e8f0',
                            fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                          {['clean','dirty','in_progress'].map(s => (
                            <option key={s} value={s}>{s.replace('_',' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding:'1rem 1.25rem', fontWeight:600 }}>
                        ${Number(room.base_price || room.current_price || 0).toLocaleString()}
                      </td>
                      <td style={{ padding:'1rem 1.25rem', fontSize:'0.72rem', color:'#94a3b8' }}>
                        {room.expedia_room_id && <div>EXP: {room.expedia_room_id}</div>}
                        {room.booking_com_room_id && <div>BKG: {room.booking_com_room_id}</div>}
                        {!room.expedia_room_id && !room.booking_com_room_id && '—'}
                      </td>
                      <td style={{ padding:'1rem 1.25rem' }}>
                        <button onClick={() => { setEditingRoom(room); setShowRoomForm(true); }}
                          style={{ padding:'4px 12px', background:'var(--color-primary)', color:'white',
                            border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(selectedCat ? catRooms : rooms).length === 0 && (
                    <tr><td colSpan={8} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
                      {selectedCat ? 'No rooms in this category yet. Click "+ Add Room" to add.' : 'No rooms found'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY EDIT FORM (modal) ──────────────────── */}
      <AnimatePresence>
        {showCatForm && (
          <CategoryForm
            initial={editing}
            amenityTypes={amenityTypes}
            onSave={handleSaveCategory}
            onCancel={() => { setShowCatForm(false); setEditing(null); }} />
        )}
      </AnimatePresence>

      {/* ── ROOM EDIT FORM (modal) ──────────────────────── */}
      <AnimatePresence>
        {showRoomForm && (
          <RoomForm
            initial={editingRoom}
            categoryId={selectedCat}
            categories={categories}
            onSave={handleSaveRoom}
            onCancel={() => { setShowRoomForm(false); setEditingRoom(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Category Form Modal ─────────────────────────────────────
function CategoryForm({ initial, amenityTypes, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', slug: '', description: '', short_description: '',
    base_price: '', weekend_price: '', peak_price: '',
    max_adults: 2, max_children: 1, max_occupancy: 2,
    size_sqm: '', bed_type: '', bed_count: 1,
    view_type: '', floor_range: '',
    amenity_type_ids: [],
    expedia_rate_plan_id: '', booking_com_room_type_id: '',
    sort_order: 0,
    ...(initial || {}),
    amenity_type_ids: initial?.amenity_types?.map(a => a.amenity_type_id || a.id) || [],
  });
  const [saving, setSaving] = useState(false);
  const [mediaTab, setMediaTab] = useState('details');

  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleAmenity = (id) => {
    setForm(p => ({
      ...p,
      amenity_type_ids: p.amenity_type_ids.includes(id)
        ? p.amenity_type_ids.filter(a => a !== id)
        : [...p.amenity_type_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.base_price) return alert('Name and base price are required');
    setSaving(true);
    try { await onSave(form); }
    catch { setSaving(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200 }} />
      <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:40 }}
        style={{ position:'fixed', top:'2rem', left:'50%', transform:'translateX(-50%)',
          width:'90%', maxWidth:800, maxHeight:'90vh', overflowY:'auto', background:'white',
          borderRadius:20, zIndex:201, boxShadow:'0 32px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ padding:'1.5rem 2rem', borderBottom:'1px solid #f1f5f9',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          position:'sticky', top:0, background:'white', zIndex:1 }}>
          <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.4rem', color:'var(--color-primary)' }}>
            {initial ? `Edit: ${initial.name}` : 'New Room Category'}
          </h2>
          <button onClick={onCancel} style={{ background:'none', border:'none',
            fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8' }}>×</button>
        </div>

        {/* Sub-tabs */}
        <div style={{ display:'flex', padding:'0 2rem', borderBottom:'1px solid #f1f5f9', gap:'0.25rem' }}>
          {['details','amenities','pricing','ota'].map(t => (
            <button key={t} onClick={() => setMediaTab(t)}
              style={{ padding:'0.625rem 1rem', border:'none', cursor:'pointer',
                fontFamily:'var(--font-body)', fontSize:'0.82rem', fontWeight:mediaTab===t?600:400,
                color:mediaTab===t?'var(--color-primary)':'#64748b', background:'transparent',
                borderBottom:mediaTab===t?'2px solid var(--color-primary)':'2px solid transparent',
                textTransform:'capitalize', transition:'all 0.2s' }}>{t}</button>
          ))}
        </div>

        <div style={{ padding:'1.75rem 2rem' }}>
          {mediaTab === 'details' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
              {[
                { k:'name',              l:'Room Category Name *', full:true },
                { k:'slug',              l:'URL Slug *',           full:false, placeholder:'deluxe-room' },
                { k:'short_description', l:'Short Description',    full:true },
                { k:'size_sqm',          l:'Size (m²)',            t:'number' },
                { k:'bed_type',          l:'Bed Type',             placeholder:'King Bed' },
                { k:'bed_count',         l:'Bed Count',            t:'number' },
                { k:'view_type',         l:'View Type',            placeholder:'City View' },
                { k:'floor_range',       l:'Floor Range',          placeholder:'5-10' },
                { k:'max_adults',        l:'Max Adults',           t:'number' },
                { k:'max_children',      l:'Max Children',         t:'number' },
                { k:'max_occupancy',     l:'Max Occupancy',        t:'number' },
                { k:'sort_order',        l:'Sort Order',           t:'number' },
              ].map(({ k, l, t='text', full, placeholder }) => (
                <div key={k} style={{ gridColumn:full?'1/-1':undefined }}>
                  <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                    textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
                  <input type={t} value={form[k]||''} placeholder={placeholder}
                    onChange={e => {
                      u(k, e.target.value);
                      if (k === 'name' && !initial) u('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''));
                    }}
                    style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                      borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                  textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>
                  Full Description
                </label>
                <textarea rows={4} value={form.description||''}
                  onChange={e => u('description', e.target.value)}
                  style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                    borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', resize:'vertical' }} />
              </div>
            </div>
          )}

          {mediaTab === 'amenities' && (
            <div>
              <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'1.5rem' }}>
                Select all amenities available in this room category. These will be displayed to guests.
              </p>
              {Object.entries(amenityTypes.grouped || {}).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom:'1.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.875rem' }}>
                    <span style={{ fontSize:'1.1rem' }}>{AMENITY_ICONS[cat] || '✦'}</span>
                    <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1rem', color:'var(--color-primary)',
                      textTransform:'capitalize', margin:0 }}>{cat}</h3>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'0.625rem' }}>
                    {items.map(a => {
                      const checked = form.amenity_type_ids.includes(a.id);
                      return (
                        <label key={a.id} style={{ display:'flex', alignItems:'center', gap:'0.625rem',
                          cursor:'pointer', padding:'0.625rem 0.875rem', borderRadius:8,
                          border:`1.5px solid ${checked ? 'var(--color-primary)' : '#e2e8f0'}`,
                          background: checked ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'white',
                          transition:'all 0.2s', userSelect:'none' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleAmenity(a.id)}
                            style={{ accentColor:'var(--color-primary)', flexShrink:0 }} />
                          <span style={{ fontSize:'0.9rem' }}>{a.icon}</span>
                          <span style={{ fontSize:'0.8rem', fontWeight:checked?600:400,
                            color: checked?'var(--color-primary)':'#475569' }}>{a.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{ marginTop:'1rem', padding:'0.875rem 1rem', background:'#f8fafc',
                borderRadius:8, fontSize:'0.82rem', color:'#64748b' }}>
                ✅ {form.amenity_type_ids.length} amenities selected
              </div>
            </div>
          )}

          {mediaTab === 'pricing' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
              {[
                { k:'base_price',    l:'Base Price (per night) *', placeholder:'250' },
                { k:'weekend_price', l:'Weekend Price',            placeholder:'300' },
                { k:'peak_price',    l:'Peak Season Price',        placeholder:'400' },
              ].map(({ k, l, placeholder }) => (
                <div key={k}>
                  <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                    textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)',
                      color:'#94a3b8', fontWeight:500 }}>$</span>
                    <input type="number" value={form[k]||''} placeholder={placeholder}
                      onChange={e => u(k, e.target.value)}
                      style={{ width:'100%', padding:'0.625rem 0.875rem 0.625rem 1.75rem',
                        border:'1.5px solid #e2e8f0', borderRadius:6,
                        fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {mediaTab === 'ota' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
              <div style={{ gridColumn:'1/-1', background:'#eff6ff', borderRadius:10, padding:'1rem',
                fontSize:'0.82rem', color:'#3b82f6', lineHeight:1.7 }}>
                🌐 Link this room category to your OTA channel room types so bookings and availability
                sync correctly. Get these IDs from your Expedia and Booking.com partner accounts.
              </div>
              {[
                { k:'expedia_rate_plan_id',     l:'Expedia Rate Plan ID',        placeholder:'e.g. 12345678' },
                { k:'booking_com_room_type_id', l:'Booking.com Room Type ID',    placeholder:'e.g. 987654' },
              ].map(({ k, l, placeholder }) => (
                <div key={k}>
                  <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                    textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
                  <input type="text" value={form[k]||''} placeholder={placeholder}
                    onChange={e => u(k, e.target.value)}
                    style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                      borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:'1.25rem 2rem', borderTop:'1px solid #f1f5f9',
          display:'flex', gap:'1rem', justifyContent:'flex-end',
          position:'sticky', bottom:0, background:'white' }}>
          <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : initial ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Individual Room Form Modal ──────────────────────────────
function RoomForm({ initial, categoryId, categories, onSave, onCancel }) {
  const [form, setForm] = useState({
    room_number: '', floor: '', wing: '', current_price: '',
    status: 'available', housekeeping_status: 'clean',
    expedia_room_id: '', booking_com_room_id: '', notes: '',
    category_id: categoryId || '',
    ...(initial || {}),
  });
  const [saving, setSaving] = useState(false);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.room_number || !form.floor) return alert('Room number and floor required');
    setSaving(true);
    try { await onSave(form); }
    catch { setSaving(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200 }} />
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
        style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:'90%', maxWidth:560, background:'white', borderRadius:20, padding:'2rem',
          zIndex:201, boxShadow:'0 32px 80px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.4rem', color:'var(--color-primary)' }}>
            {initial ? `Edit Room ${initial.room_number}` : 'Add New Room'}
          </h2>
          <button onClick={onCancel} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8' }}>×</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          {[
            { k:'room_number', l:'Room Number *', placeholder:'101' },
            { k:'floor',       l:'Floor *',       placeholder:'1', t:'number' },
            { k:'wing',        l:'Wing',          placeholder:'North' },
            { k:'current_price', l:'Price Override ($)', placeholder:'Leave empty for category default', t:'number' },
          ].map(({ k, l, placeholder, t='text' }) => (
            <div key={k}>
              <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
              <input type={t} value={form[k]||''} placeholder={placeholder}
                onChange={e => u(k, e.target.value)}
                style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                  borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
            </div>
          ))}

          {[
            { k:'status', l:'Status', opts:['available','occupied','maintenance','housekeeping'] },
            { k:'housekeeping_status', l:'Housekeeping', opts:['clean','dirty','in_progress'] },
          ].map(({ k, l, opts }) => (
            <div key={k}>
              <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
              <select value={form[k]||''} onChange={e => u(k, e.target.value)}
                style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                  borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }}>
                {opts.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
              textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>Expedia Room ID</label>
            <input value={form.expedia_room_id||''} onChange={e => u('expedia_room_id', e.target.value)}
              placeholder="From Expedia extranet"
              style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
          </div>
          <div>
            <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
              textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>Booking.com Room ID</label>
            <input value={form.booking_com_room_id||''} onChange={e => u('booking_com_room_id', e.target.value)}
              placeholder="From Booking.com extranet"
              style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
          </div>

          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
              textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>Notes</label>
            <textarea rows={2} value={form.notes||''} onChange={e => u('notes', e.target.value)}
              placeholder="Internal notes about this room"
              style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', resize:'vertical' }} />
          </div>
        </div>

        <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem', justifyContent:'flex-end' }}>
          <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : initial ? 'Update Room' : 'Add Room'}
          </button>
        </div>
      </motion.div>
    </>
  );
}
