// ============================================================
// src/pages/admin/AdminTheme.jsx
// FIX #8: Admin can upload their own hero videos/images/banners
// FIX #1: Button color preview updates instantly
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../utils/api';
import { useTheme, COLOR_SCHEMES, FONT_OPTIONS } from '../../context/ThemeContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

export default function AdminTheme() {
  const { theme, updateTheme, applyColorScheme } = useTheme();
  const [local, setLocal]   = useState({ ...theme });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [tab, setTab]       = useState('colors');
  const [mediaLib, setMediaLib] = useState([]);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => { setLocal({ ...theme }); }, [theme]);

  // Live preview — apply to DOM as user changes values
  const u = (k, v) => {
    const next = { ...local, [k]: v };
    setLocal(next);
    updateTheme({ [k]: v }); // immediate DOM update
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.put('/admin/theme', local);
      updateTheme(local);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch { alert('Failed to save theme'); }
    finally { setSaving(false); }
  };

  const handleMediaUpload = async (file, category) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      const { data } = await adminApi.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (category === 'hero_video') {
        u('hero_video_url', data.file_path);
        u('hero_type', 'video');
      } else if (category === 'hero_image') {
        u('hero_video_url', data.file_path);
        u('hero_type', 'image');
      }
      // Refresh media library
      loadMedia();
      alert(`${category === 'hero_video' ? 'Video' : 'Image'} uploaded successfully ✓`);
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const loadMedia = async () => {
    try {
      const { data } = await adminApi.get('/media?category=hero_video&per_page=20');
      const { data: imgs } = await adminApi.get('/media?category=hero_image&per_page=20');
      setMediaLib([...(data.data||[]), ...(imgs.data||[])]);
    } catch {}
  };

  useEffect(() => { loadMedia(); }, []);

  const TABS = [
    { id:'colors',    label:'🎨 Colors' },
    { id:'fonts',     label:'🔤 Fonts' },
    { id:'hero',      label:'🎬 Hero & Media' },
    { id:'animation', label:'✨ Animation' },
    { id:'preview',   label:'👁 Preview' },
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.75rem' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)', marginBottom:0 }}>
            Theme & Appearance
          </h1>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:0 }}>
            All changes apply instantly — save when happy
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1.5rem', background:'white',
        borderRadius:12, padding:'0.375rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'0.625rem 1.1rem', border:'none', cursor:'pointer', borderRadius:8,
              fontFamily:'var(--font-body)', fontSize:'0.82rem', fontWeight:tab===t.id?600:400,
              color:tab===t.id?'white':'#64748b', background:tab===t.id?'var(--color-primary)':'transparent',
              transition:'all 0.2s' }}>{t.label}</button>
        ))}
      </div>

      {/* ── COLORS ──────────────────────────────────────── */}
      {tab === 'colors' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
          {/* Color Schemes */}
          <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
              Preset Color Schemes
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                <motion.button key={key} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={() => { applyColorScheme(key); setLocal(prev => ({ ...prev, color_scheme:key, primary_color:scheme.primary, secondary_color:scheme.secondary, accent_color:scheme.accent, background_color:scheme.background, text_color:scheme.text })); }}
                  style={{ border:`2px solid ${local.color_scheme===key?'var(--color-secondary)':'#e2e8f0'}`,
                    borderRadius:12, padding:'0.875rem', cursor:'pointer', textAlign:'left',
                    background: local.color_scheme===key?'#fafaf8':'white', transition:'all 0.2s' }}>
                  <div style={{ display:'flex', gap:'0.35rem', marginBottom:'0.5rem' }}>
                    {scheme.preview.map((c, i) => (
                      <div key={i} style={{ width:18, height:18, borderRadius:'50%', background:c,
                        border:'1px solid rgba(0,0,0,0.1)' }} />
                    ))}
                  </div>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#1e293b' }}>{scheme.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
              Custom Colors
            </h3>
            <p style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'1.25rem' }}>
              Fine-tune individual colors. Changes apply immediately to buttons, text, and backgrounds.
            </p>
            {[
              { k:'primary_color',    l:'Primary Color (header, buttons, nav)' },
              { k:'secondary_color',  l:'Accent / Gold Color (highlights, prices)' },
              { k:'background_color', l:'Page Background' },
              { k:'text_color',       l:'Body Text Color' },
            ].map(({ k, l }) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem' }}>
                <label style={{ fontSize:'0.8rem', fontWeight:500, color:'#1e293b', flex:1, lineHeight:1.4 }}>{l}</label>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
                  <input type="color" value={local[k]||'#000000'} onChange={e => u(k, e.target.value)}
                    style={{ width:42, height:32, border:'1.5px solid #e2e8f0', borderRadius:6, cursor:'pointer', padding:2 }} />
                  <input type="text" value={local[k]||''} onChange={e => u(k, e.target.value)}
                    style={{ width:90, padding:'0.4rem 0.625rem', border:'1.5px solid #e2e8f0',
                      borderRadius:6, fontFamily:'monospace', fontSize:'0.8rem', outline:'none' }} />
                </div>
              </div>
            ))}

            {/* Button color preview */}
            <div style={{ marginTop:'1.5rem', padding:'1rem', background:'#f8fafc', borderRadius:10 }}>
              <div style={{ fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94a3b8', marginBottom:'0.75rem' }}>
                Button Preview (updates instantly)
              </div>
              <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                <div style={{ background:local.primary_color, color:'white', padding:'0.6rem 1.25rem',
                  borderRadius:4, fontSize:'0.8rem', fontWeight:500, letterSpacing:'0.1em' }}>
                  Primary Button
                </div>
                <div style={{ background:local.secondary_color, color:'white', padding:'0.6rem 1.25rem',
                  borderRadius:4, fontSize:'0.8rem', fontWeight:500, letterSpacing:'0.1em' }}>
                  Gold Button
                </div>
                <div style={{ background:'transparent', color:local.primary_color,
                  border:`1.5px solid ${local.primary_color}`,
                  padding:'0.6rem 1.25rem', borderRadius:4, fontSize:'0.8rem', fontWeight:500 }}>
                  Outline Button
                </div>
              </div>
            </div>
          </div>

          {/* Custom CSS */}
          <div style={{ gridColumn:'1/-1', background:'white', borderRadius:16, padding:'1.75rem',
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'0.5rem' }}>
              Custom CSS Overrides
            </h3>
            <p style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'1rem' }}>
              Advanced: inject custom CSS that applies site-wide. Use CSS variables like <code>var(--color-primary)</code> for theme-aware styles.
            </p>
            <textarea rows={8} value={local.custom_css||''} onChange={e => u('custom_css', e.target.value)}
              placeholder="/* Your custom CSS here */&#10;.hero-section { min-height: 90vh; }&#10;.btn-primary { border-radius: 24px; }"
              style={{ width:'100%', padding:'0.875rem', border:'1.5px solid #e2e8f0', borderRadius:8,
                fontFamily:'monospace', fontSize:'0.82rem', outline:'none', resize:'vertical' }} />
          </div>
        </div>
      )}

      {/* ── FONTS ───────────────────────────────────────── */}
      {tab === 'fonts' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
          <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
              Typography
            </h3>
            {[
              { k:'font_heading', l:'Heading Font (titles, room names)', opts:FONT_OPTIONS.heading },
              { k:'font_body',    l:'Body Font (paragraphs, buttons)',    opts:FONT_OPTIONS.body },
              { k:'font_accent',  l:'Accent Font (italic highlights)',    opts:FONT_OPTIONS.heading },
            ].map(({ k, l, opts }) => (
              <div key={k} style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:600,
                  letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:6 }}>{l}</label>
                <select value={local[k]||''} onChange={e => u(k, e.target.value)}
                  style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                    borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', marginBottom:8 }}>
                  {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div style={{ fontFamily:`'${local[k]}', serif`, fontSize:'1.4rem',
                  color:'var(--color-primary)', lineHeight:1.2 }}>
                  The Grand Lumière Hotel & Suites
                </div>
                <div style={{ fontFamily:`'${local[k]}', serif`, fontSize:'0.9rem',
                  color:'#64748b', lineHeight:1.6, fontStyle:'italic', marginTop:4 }}>
                  Luxury accommodations since 1987
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
              Font Preview
            </h3>
            <div style={{ background:'var(--color-primary)', borderRadius:12, padding:'2rem', textAlign:'center', color:'white' }}>
              <div style={{ fontFamily:`'${local.font_body}', sans-serif`, fontSize:'0.7rem',
                letterSpacing:'0.3em', textTransform:'uppercase', color:'var(--color-secondary)', marginBottom:'0.75rem' }}>
                Luxury Accommodations
              </div>
              <div style={{ fontFamily:`'${local.font_heading}', serif`, fontSize:'2.5rem',
                fontWeight:700, lineHeight:1.1, marginBottom:'0.75rem' }}>
                Grand Lumière<br />
                <em style={{ color:'var(--color-secondary)', fontWeight:400, fontStyle:'italic', fontSize:'2rem' }}>
                  Hotel & Suites
                </em>
              </div>
              <div style={{ fontFamily:`'${local.font_body}', sans-serif`, fontSize:'0.9rem',
                color:'rgba(255,255,255,0.75)', marginBottom:'1.5rem', lineHeight:1.7 }}>
                Where luxury meets serenity — an iconic retreat offering world-class hospitality.
              </div>
              <div style={{ display:'inline-flex', gap:'0.75rem' }}>
                <div style={{ background:'var(--color-secondary)', color:'white', padding:'0.75rem 1.75rem',
                  borderRadius:4, fontFamily:`'${local.font_body}', sans-serif`,
                  fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:500 }}>
                  Reserve Now
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO & MEDIA ────────────────────────────────── */}
      {tab === 'hero' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
          {/* Hero Type */}
          <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
              Homepage Hero Style
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.5rem' }}>
              {[
                { v:'animated', l:'🌊 Animated Canvas', d:'Gold particles + floating orbs (no upload needed)' },
                { v:'video',    l:'🎬 Video Background', d:'Upload your own MP4 video' },
                { v:'image',    l:'🖼️ Image Background', d:'Upload a high-quality photo' },
              ].map(({ v, l, d }) => (
                <label key={v} style={{ display:'flex', alignItems:'flex-start', gap:'0.875rem',
                  cursor:'pointer', padding:'0.875rem 1rem', borderRadius:10,
                  border:`1.5px solid ${local.hero_type===v?'var(--color-primary)':'#e2e8f0'}`,
                  background:local.hero_type===v?'color-mix(in srgb, var(--color-primary) 4%, white)':'white',
                  transition:'all 0.2s' }}>
                  <input type="radio" name="hero_type" value={v} checked={local.hero_type===v}
                    onChange={() => u('hero_type', v)} style={{ marginTop:3, accentColor:'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--color-primary)' }}>{l}</div>
                    <div style={{ fontSize:'0.8rem', color:'#64748b', marginTop:2 }}>{d}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Overlay opacity */}
            <div>
              <label style={{ display:'block', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'#475569', marginBottom:6 }}>
                Overlay Darkness: {Math.round((local.hero_overlay_opacity || 0.45) * 100)}%
              </label>
              <input type="range" min="0.1" max="0.9" step="0.05"
                value={local.hero_overlay_opacity || 0.45}
                onChange={e => u('hero_overlay_opacity', parseFloat(e.target.value))}
                style={{ width:'100%', accentColor:'var(--color-primary)' }} />
            </div>
          </div>

          {/* Media Upload */}
          <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
              Upload Hero Media
            </h3>

            {/* Video upload */}
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'#475569', marginBottom:'0.625rem' }}>
                Hero Video (MP4, max 100MB)
              </label>
              <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/mov"
                onChange={e => e.target.files[0] && handleMediaUpload(e.target.files[0], 'hero_video')}
                style={{ display:'none' }} />
              <button onClick={() => videoRef.current?.click()} disabled={uploading}
                style={{ width:'100%', padding:'1.25rem', border:'2px dashed #e2e8f0', borderRadius:10,
                  background:'#f8fafc', cursor:'pointer', color:'#64748b', fontSize:'0.875rem',
                  fontFamily:'var(--font-body)', transition:'all 0.2s' }}>
                {uploading ? '⏳ Uploading…' : '🎬 Click to upload hero video'}
              </button>
            </div>

            {/* Image upload */}
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'#475569', marginBottom:'0.625rem' }}>
                Hero Image / Banner (JPG, PNG, WebP)
              </label>
              <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e => e.target.files[0] && handleMediaUpload(e.target.files[0], 'hero_image')}
                style={{ display:'none' }} />
              <button onClick={() => imageRef.current?.click()} disabled={uploading}
                style={{ width:'100%', padding:'1.25rem', border:'2px dashed #e2e8f0', borderRadius:10,
                  background:'#f8fafc', cursor:'pointer', color:'#64748b', fontSize:'0.875rem',
                  fontFamily:'var(--font-body)', transition:'all 0.2s' }}>
                {uploading ? '⏳ Uploading…' : '🖼️ Click to upload hero image'}
              </button>
            </div>

            {/* Current media URL */}
            {local.hero_video_url && (
              <div style={{ background:'#f0fdf4', borderRadius:8, padding:'0.875rem 1rem', fontSize:'0.8rem' }}>
                <div style={{ fontWeight:600, color:'#065f46', marginBottom:4 }}>
                  ✅ Current hero media:
                </div>
                <code style={{ color:'#374151', wordBreak:'break-all', fontSize:'0.75rem' }}>
                  {local.hero_video_url}
                </code>
                <div style={{ marginTop:'0.5rem' }}>
                  <button onClick={() => { u('hero_video_url', ''); u('hero_type', 'animated'); }}
                    style={{ fontSize:'0.75rem', color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>
                    ✕ Remove & use animated background
                  </button>
                </div>
              </div>
            )}

            {/* URL override */}
            <div style={{ marginTop:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'#475569', marginBottom:6 }}>
                Or paste YouTube / External URL
              </label>
              <input type="text" value={local.hero_video_url||''}
                onChange={e => {
                  const val = e.target.value;
                  u('hero_video_url', val);
                  // Auto-detect YouTube and set hero_type to video
                  if (val && val.match(/youtube\.com|youtu\.be/)) {
                    u('hero_type', 'video');
                  }
                }}
                placeholder="https://youtube.com/watch?v=... or https://..."
                style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                  borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
              <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:4 }}>
                Supports YouTube links — auto-embeds as muted looping background
              </div>
            </div>
          </div>

          {/* Media Library */}
          {mediaLib.length > 0 && (
            <div style={{ gridColumn:'1/-1', background:'white', borderRadius:16, padding:'1.75rem',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', marginBottom:'1rem' }}>
                Uploaded Hero Media
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem' }}>
                {mediaLib.map(m => (
                  <div key={m.id} style={{ border:'1.5px solid', borderRadius:10, overflow:'hidden', cursor:'pointer',
                    borderColor: local.hero_video_url===m.file_path ? 'var(--color-secondary)' : '#e2e8f0' }}
                    onClick={() => { u('hero_video_url', m.file_path); u('hero_type', m.file_type==='video'?'video':'image'); }}>
                    {m.file_type === 'video'
                      ? <div style={{ height:90, background:'#0f172a', display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:'2rem' }}>🎬</div>
                      : <img src={`${API_URL}/${m.file_path}`} alt={m.original_name}
                          style={{ width:'100%', height:90, objectFit:'cover' }}
                          onError={e => e.target.style.display='none'} />
                    }
                    <div style={{ padding:'0.5rem 0.625rem', fontSize:'0.72rem', color:'#64748b',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {m.original_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANIMATION ───────────────────────────────────── */}
      {tab === 'animation' && (
        <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.5rem' }}>
            Animation & Motion
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em',
                textTransform:'uppercase', color:'#475569', marginBottom:'0.875rem' }}>
                Animation Speed
              </label>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                {['slow','normal','fast'].map(s => (
                  <button key={s} onClick={() => u('animation_speed', s)}
                    style={{ flex:1, padding:'0.875rem', border:`1.5px solid`,
                      borderColor: local.animation_speed===s?'var(--color-primary)':'#e2e8f0',
                      borderRadius:8, cursor:'pointer',
                      background: local.animation_speed===s?'color-mix(in srgb, var(--color-primary) 6%, white)':'white',
                      fontSize:'0.85rem', fontWeight:local.animation_speed===s?600:400,
                      textTransform:'capitalize', color:'#1e293b', fontFamily:'var(--font-body)' }}>
                    {s === 'slow' ? '🐢 Slow' : s === 'normal' ? '🚶 Normal' : '⚡ Fast'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'1rem', background:'#f8fafc', borderRadius:10 }}>
              <div>
                <div style={{ fontWeight:600, color:'#1e293b' }}>Enable Animations</div>
                <div style={{ fontSize:'0.8rem', color:'#64748b' }}>Scroll reveals, hover effects, transitions</div>
              </div>
              <button onClick={() => u('animations_enabled', !local.animations_enabled)}
                style={{ width:48, height:26, borderRadius:999, border:'none', cursor:'pointer',
                  background: local.animations_enabled ? 'var(--color-primary)' : '#e2e8f0',
                  position:'relative', transition:'background 0.3s', flexShrink:0 }}>
                <span style={{ position:'absolute', top:3, left:local.animations_enabled?24:2,
                  width:20, height:20, borderRadius:'50%', background:'white',
                  transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW ─────────────────────────────────────── */}
      {tab === 'preview' && (
        <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:'1.25rem 1.75rem', borderBottom:'1px solid #f1f5f9' }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', margin:0 }}>
              Live Site Preview
            </h3>
          </div>
          <div style={{ background:local.background_color||'#f8f5f0', padding:'3rem' }}>
            {/* Mini homepage mock */}
            <div style={{ background:local.primary_color, borderRadius:16, padding:'3rem 2rem', textAlign:'center', marginBottom:'1.5rem' }}>
              <div style={{ fontFamily:`'${local.font_body}', sans-serif`, fontSize:'0.68rem',
                letterSpacing:'0.3em', textTransform:'uppercase', color:local.secondary_color, marginBottom:'0.75rem' }}>
                Est. Since 1987
              </div>
              <div style={{ fontFamily:`'${local.font_heading}', serif`, color:'white',
                fontSize:'3.5rem', fontWeight:700, lineHeight:1.05, marginBottom:'1rem' }}>
                Grand Lumière
                <br />
                <em style={{ color:local.secondary_color, fontWeight:400, fontStyle:'italic', fontSize:'2.5rem' }}>
                  Hotel & Suites
                </em>
              </div>
              <div style={{ fontFamily:`'${local.font_body}', sans-serif`, color:'rgba(255,255,255,0.75)',
                fontSize:'1rem', marginBottom:'1.75rem', lineHeight:1.8 }}>
                Where luxury meets serenity
              </div>
              <div style={{ display:'inline-flex', gap:'0.75rem' }}>
                <div style={{ background:local.secondary_color, color:'white', padding:'0.875rem 2rem',
                  borderRadius:4, fontFamily:`'${local.font_body}', sans-serif`,
                  fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:500 }}>
                  Reserve Your Stay
                </div>
                <div style={{ background:'transparent', color:'white',
                  border:`1.5px solid rgba(255,255,255,0.5)`,
                  padding:'0.875rem 2rem', borderRadius:4, fontFamily:`'${local.font_body}', sans-serif`,
                  fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:500 }}>
                  Explore Rooms
                </div>
              </div>
            </div>

            {/* Mock cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
              {['Deluxe Room','Junior Suite','Executive Suite'].map((name, i) => (
                <div key={name} style={{ background:'white', borderRadius:12, overflow:'hidden',
                  boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
                  <div style={{ height:100, background:`linear-gradient(135deg, ${local.primary_color}, ${local.secondary_color}30)` }} />
                  <div style={{ padding:'1rem' }}>
                    <div style={{ fontFamily:`'${local.font_heading}', serif`, fontSize:'1.1rem',
                      color:local.primary_color, marginBottom:'0.375rem' }}>{name}</div>
                    <div style={{ fontFamily:`'${local.font_heading}', serif`, fontSize:'1.2rem',
                      fontWeight:700, color:local.secondary_color }}>
                      ${[250,420,750][i].toLocaleString()}/night
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
