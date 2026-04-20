// ============================================================
// src/pages/admin/AdminBlog.jsx
// FIX #7: Full rich blog editor — formatting toolbar,
//   image upload with preview, per-post SEO fields,
//   category, tags, featured image, status management
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../utils/api';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');

const CATEGORIES = ['News','Travel Guide','Wellness','Dining','Events','Sustainability','Behind the Scenes'];

// ─── Rich Text Toolbar ───────────────────────────────────────
function EditorToolbar({ onCmd, onInsertImage }) {
  const btn = (label, cmd, val, title) => (
    <button type="button" title={title || label}
      onMouseDown={e => { e.preventDefault(); onCmd(cmd, val); }}
      style={{ padding:'5px 9px', border:'1px solid #e2e8f0', borderRadius:5, cursor:'pointer',
        background:'white', fontSize:'0.82rem', color:'#374151', lineHeight:1,
        fontWeight: ['Bold','H2','H3'].includes(label) ? 700 : 400,
        fontStyle: label === 'Italic' ? 'italic' : 'normal',
        textDecoration: label === 'Underline' ? 'underline' : 'none',
        transition:'background 0.15s' }}
      onMouseEnter={e => e.target.style.background='#f1f5f9'}
      onMouseLeave={e => e.target.style.background='white'}>
      {label}
    </button>
  );
  const sep = () => <div style={{ width:1, background:'#e2e8f0', margin:'0 4px', height:24 }} />;
  return (
    <div style={{ display:'flex', gap:'3px', padding:'0.625rem 0.75rem', background:'#f8fafc',
      borderBottom:'1px solid #e2e8f0', flexWrap:'wrap', alignItems:'center', borderRadius:'8px 8px 0 0' }}>
      {btn('H2','formatBlock','h2','Heading 2')}
      {btn('H3','formatBlock','h3','Heading 3')}
      {sep()}
      {btn('B','bold',null,'Bold')}
      {btn('I','italic',null,'Italic')}
      {btn('U','underline',null,'Underline')}
      {btn('S','strikeThrough',null,'Strikethrough')}
      {sep()}
      {btn('• List','insertUnorderedList',null,'Bullet List')}
      {btn('1. List','insertOrderedList',null,'Numbered List')}
      {sep()}
      {btn('"Quote"','formatBlock','blockquote','Blockquote')}
      {btn('</>','formatBlock','pre','Code Block')}
      {sep()}
      <button type="button" title="Insert Link"
        onMouseDown={e => {
          e.preventDefault();
          const url = prompt('Enter URL:');
          if (url) onCmd('createLink', url);
        }}
        style={{ padding:'5px 9px', border:'1px solid #e2e8f0', borderRadius:5, cursor:'pointer',
          background:'white', fontSize:'0.82rem', color:'#374151' }}>
        🔗 Link
      </button>
      <button type="button" title="Insert Image" onMouseDown={e => { e.preventDefault(); onInsertImage(); }}
        style={{ padding:'5px 9px', border:'1px solid #e2e8f0', borderRadius:5, cursor:'pointer',
          background:'white', fontSize:'0.82rem', color:'#374151' }}>
        🖼 Image
      </button>
      {sep()}
      {btn('⟵ Undo','undo',null,'Undo')}
      {btn('↻ Redo','redo',null,'Redo')}
      {sep()}
      <button type="button" title="Clear Formatting"
        onMouseDown={e => { e.preventDefault(); onCmd('removeFormat'); }}
        style={{ padding:'5px 9px', border:'1px solid #e2e8f0', borderRadius:5, cursor:'pointer',
          background:'white', fontSize:'0.82rem', color:'#374151' }}>
        ✕ Clear
      </button>
    </div>
  );
}

export default function AdminBlog() {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);  // null = list, object = edit mode
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminApi.get('/public/blog?per_page=50&status=all')
      .then(r => setPosts(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = posts.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (editing !== null) {
    return <BlogEditor post={editing === 'new' ? null : editing}
      onSave={async () => { load(); setEditing(null); }}
      onCancel={() => setEditing(null)} />;
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.75rem' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)', marginBottom:0 }}>
            Blog & Journal
          </h1>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:0 }}>
            Create and manage hotel blog posts with SEO optimization
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + New Post
        </button>
      </div>

      {/* Filters */}
      <div style={{ background:'white', borderRadius:12, padding:'1rem 1.25rem',
        boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginBottom:'1.25rem',
        display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="Search posts…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'0.5rem 0.875rem', border:'1.5px solid #e2e8f0',
            borderRadius:8, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
        <div style={{ display:'flex', gap:'0.375rem' }}>
          {['all','published','draft','archived'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding:'0.4rem 0.875rem', borderRadius:6, border:'1.5px solid', cursor:'pointer',
                fontFamily:'var(--font-body)', fontSize:'0.8rem', fontWeight:filter===s?600:400,
                textTransform:'capitalize', transition:'all 0.2s',
                borderColor:filter===s?'var(--color-primary)':'#e2e8f0',
                background:filter===s?'var(--color-primary)':'white',
                color:filter===s?'white':'#64748b' }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Posts Table */}
      <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
              {['Title','Category','Status','Views','Featured','Date','Actions'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'1rem 1.25rem', color:'#64748b',
                  fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({length:4}).map((_,i) => (
              <tr key={i}><td colSpan={7} style={{ padding:'1rem' }}>
                <div className="skeleton" style={{ height:20 }} /></td></tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
                No posts found
              </td></tr>
            ) : filtered.map(post => (
              <tr key={post.id} style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'1rem 1.25rem', maxWidth:300 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    {post.featured_image ? (
                      <img src={`${API_URL}/${post.featured_image}`} alt=""
                        style={{ width:40, height:40, borderRadius:6, objectFit:'cover', flexShrink:0 }}
                        onError={e => e.target.style.display='none'} />
                    ) : (
                      <div style={{ width:40, height:40, borderRadius:6, background:'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                        color:'rgba(255,255,255,0.4)', fontSize:'1.1rem' }}>GL</div>
                    )}
                    <div>
                      <div style={{ fontWeight:600, color:'var(--color-primary)', lineHeight:1.3 }}>{post.title}</div>
                      <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:1 }}>/{post.slug}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:'1rem 1.25rem' }}>
                  <span style={{ fontSize:'0.72rem', background:'color-mix(in srgb, var(--color-secondary) 15%, white)',
                    color:'var(--color-secondary)', padding:'2px 8px', borderRadius:999, fontWeight:500 }}>
                    {post.category}
                  </span>
                </td>
                <td style={{ padding:'1rem 1.25rem' }}>
                  <span style={{ padding:'3px 10px', borderRadius:999, fontSize:'0.73rem', fontWeight:600,
                    background:post.status==='published'?'#d1fae5':post.status==='draft'?'#fef3c7':'#f3f4f6',
                    color:post.status==='published'?'#065f46':post.status==='draft'?'#92400e':'#6b7280' }}>
                    {post.status}
                  </span>
                </td>
                <td style={{ padding:'1rem 1.25rem', color:'#64748b' }}>{post.views||0}</td>
                <td style={{ padding:'1rem 1.25rem', textAlign:'center' }}>{post.featured?'⭐':'—'}</td>
                <td style={{ padding:'1rem 1.25rem', color:'#64748b', fontSize:'0.8rem' }}>
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding:'1rem 1.25rem' }}>
                  <div style={{ display:'flex', gap:'0.375rem' }}>
                    <button onClick={() => setEditing(post)}
                      style={{ padding:'4px 12px', background:'var(--color-primary)', color:'white',
                        border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem' }}>
                      Edit
                    </button>
                    <button onClick={async () => {
                      if (!confirm('Archive this post?')) return;
                      await adminApi.delete(`/admin/blog/${post.id}`);
                      load();
                    }} style={{ padding:'4px 12px', background:'#fee2e2', color:'#991b1b',
                      border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem' }}>
                      Archive
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Full Blog Editor ─────────────────────────────────────────
function BlogEditor({ post, onSave, onCancel }) {
  const editorRef  = useRef(null);
  const imgUpRef   = useRef(null);
  const featImgRef = useRef(null);
  const [tab, setTab]     = useState('content');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [postImages, setPostImages] = useState([]);

  const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  const [form, setForm] = useState({
    title:            post?.title || '',
    slug:             post?.slug  || '',
    excerpt:          post?.excerpt || '',
    content:          post?.content || '',
    category:         post?.category || 'News',
    tags:             Array.isArray(post?.tags) ? post.tags.join(', ') : '',
    status:           post?.status || 'draft',
    featured:         !!post?.featured,
    featured_image:   post?.featured_image || '',
    meta_title:       post?.meta_title || '',
    meta_description: post?.meta_description || '',
    meta_keywords:    post?.meta_keywords || '',
    og_image:         post?.og_image || '',
  });
  const u = (k,v) => setForm(p => ({ ...p, [k]:v }));

  // Initialise editor content
  useEffect(() => {
    if (editorRef.current && form.content) {
      editorRef.current.innerHTML = form.content;
    }
    // Load existing post images
    if (post?.id) {
      adminApi.get(`/media/blog/${post.id}`)
        .then(r => setPostImages(r.data||[]))
        .catch(() => {});
    }
  }, []);

  const execCmd = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const syncContent = () => {
    if (editorRef.current) u('content', editorRef.current.innerHTML);
  };

  // Upload inline image into editor
  const handleInlineImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'blog_image');
      if (post?.id) fd.append('post_id', post.id);
      const { data } = await adminApi.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = `${API_URL}/${data.file_path}`;
      editorRef.current?.focus();
      document.execCommand('insertImage', false, url);
      syncContent();
      setPostImages(prev => [...prev, data]);
    } catch { alert('Image upload failed'); }
    finally { setUploading(false); }
  };

  // Upload featured image
  const handleFeaturedImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'blog_image');
      const { data } = await adminApi.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      u('featured_image', data.file_path);
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async (saveStatus) => {
    syncContent();
    setSaving(true);
    try {
      const payload = {
        ...form,
        status: saveStatus || form.status,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (post?.id) {
        await adminApi.put(`/admin/blog/${post.id}`, payload);
      } else {
        await adminApi.post('/admin/blog', payload);
      }
      await onSave();
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const TABS = [
    { id:'content', label:'📝 Content' },
    { id:'seo',     label:'🔍 SEO' },
    { id:'media',   label:'🖼 Media' },
    { id:'settings',label:'⚙️ Settings' },
  ];

  const wordCount = form.content.replace(/<[^>]+>/g,'').split(/\s+/).filter(Boolean).length;
  const readMins  = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.5rem', alignItems:'start' }}>

      {/* ── Main Editor ─────────────────────────────────── */}
      <div>
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <button onClick={onCancel}
              style={{ padding:'6px 14px', border:'1px solid #e2e8f0', borderRadius:8,
                background:'white', cursor:'pointer', fontSize:'0.82rem', color:'#475569' }}>
              ← Back
            </button>
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.4rem', color:'var(--color-primary)', margin:0 }}>
              {post ? 'Edit Post' : 'New Post'}
            </h2>
          </div>
          <div style={{ display:'flex', gap:'0.625rem' }}>
            <button onClick={() => setPreviewMode(v => !v)}
              style={{ padding:'6px 14px', border:'1px solid #e2e8f0', borderRadius:8,
                background:previewMode?'#f1f5f9':'white', cursor:'pointer', fontSize:'0.82rem', color:'#475569' }}>
              {previewMode ? '✏️ Edit' : '👁 Preview'}
            </button>
            <button onClick={() => handleSave('draft')} disabled={saving}
              style={{ padding:'6px 14px', border:'1px solid #e2e8f0', borderRadius:8,
                background:'white', cursor:'pointer', fontSize:'0.82rem', color:'#475569' }}>
              Save Draft
            </button>
            <button onClick={() => handleSave('published')} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? 'Publishing…' : '🚀 Publish'}
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ background:'white', borderRadius:12, padding:'1.25rem', marginBottom:'1rem',
          boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <input placeholder="Post title…"
            value={form.title}
            onChange={e => { u('title', e.target.value); if (!post) u('slug', slugify(e.target.value)); }}
            style={{ width:'100%', border:'none', fontFamily:'var(--font-heading)',
              fontSize:'1.75rem', color:'var(--color-primary)', outline:'none',
              fontWeight:700, background:'transparent', marginBottom:'0.5rem' }} />
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span style={{ fontSize:'0.72rem', color:'#94a3b8', letterSpacing:'0.1em', textTransform:'uppercase' }}>
              Slug:
            </span>
            <input value={form.slug} onChange={e => u('slug', e.target.value)}
              style={{ flex:1, border:'none', fontFamily:'monospace', fontSize:'0.82rem',
                color:'#64748b', outline:'none', background:'transparent' }} />
            <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
              ~{readMins} min read · {wordCount} words
            </span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1rem', background:'white',
          borderRadius:10, padding:'0.3rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'0.5rem 1rem', border:'none', cursor:'pointer', borderRadius:7,
                fontFamily:'var(--font-body)', fontSize:'0.82rem', fontWeight:tab===t.id?600:400,
                color:tab===t.id?'white':'#64748b',
                background:tab===t.id?'var(--color-primary)':'transparent', transition:'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Tab */}
        {tab === 'content' && (
          <div style={{ background:'white', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            {!previewMode ? (
              <>
                <EditorToolbar onCmd={execCmd} onInsertImage={() => imgUpRef.current?.click()} />
                <input ref={imgUpRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => handleInlineImageUpload(e.target.files[0])} />
                {uploading && (
                  <div style={{ padding:'0.5rem 1rem', background:'#eff6ff', fontSize:'0.8rem', color:'#3b82f6' }}>
                    ⏳ Uploading image…
                  </div>
                )}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncContent}
                  onBlur={syncContent}
                  style={{
                    minHeight: 500,
                    padding: '1.25rem 1.5rem',
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    lineHeight: 1.9,
                    color: '#374151',
                    borderRadius: '0 0 12px 12px',
                  }}
                  dangerouslySetInnerHTML={{ __html: form.content }}
                />
                <style>{`
                  [contenteditable] h2 { font-family:var(--font-heading);font-size:1.75rem;color:var(--color-primary);margin:1.5rem 0 0.75rem;font-weight:700; }
                  [contenteditable] h3 { font-family:var(--font-heading);font-size:1.35rem;color:var(--color-primary);margin:1.25rem 0 0.625rem;font-weight:600; }
                  [contenteditable] blockquote { border-left:4px solid var(--color-secondary);padding:0.75rem 1.25rem;margin:1.25rem 0;background:#fafaf8;font-style:italic;color:#4b5563; }
                  [contenteditable] pre { background:#1e293b;color:#e2e8f0;padding:1rem 1.25rem;border-radius:8px;overflow-x:auto;font-size:0.85rem;margin:1.25rem 0; }
                  [contenteditable] img { max-width:100%;border-radius:8px;margin:0.75rem 0;cursor:pointer; }
                  [contenteditable] a { color:var(--color-secondary);text-decoration:underline; }
                  [contenteditable] ul,[contenteditable] ol { padding-left:1.5rem;margin:0.75rem 0; }
                  [contenteditable] li { margin:0.375rem 0; }
                  [contenteditable]:empty:before { content:attr(data-placeholder);color:#9ca3af; }
                `}</style>
              </>
            ) : (
              <div style={{ padding:'2rem' }}>
                <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'0.5rem' }}>
                    {form.category} · {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
                  </div>
                  <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2.25rem', color:'var(--color-primary)', marginBottom:'0.5rem', fontWeight:700 }}>
                    {form.title || 'Untitled Post'}
                  </h1>
                  {form.excerpt && <p style={{ fontSize:'1.05rem', color:'#64748b', fontStyle:'italic' }}>{form.excerpt}</p>}
                </div>
                {form.featured_image && (
                  <img src={`${API_URL}/${form.featured_image}`} alt={form.title}
                    style={{ width:'100%', maxHeight:400, objectFit:'cover', borderRadius:12, marginBottom:'1.5rem' }} />
                )}
                <div style={{ fontFamily:'var(--font-body)', fontSize:'1rem', lineHeight:1.9, color:'#374151' }}
                  dangerouslySetInnerHTML={{ __html: form.content || '<p style="color:#9ca3af">Start writing your post content…</p>' }} />
              </div>
            )}
          </div>
        )}

        {/* SEO Tab */}
        {tab === 'seo' && (
          <div style={{ background:'white', borderRadius:12, padding:'1.75rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            {/* Google Preview */}
            <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:12, padding:'1.25rem', marginBottom:'1.75rem' }}>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.875rem' }}>
                🔍 Google Search Preview
              </div>
              <div style={{ color:'#1a0dab', fontSize:'1.05rem', fontWeight:600, marginBottom:'0.25rem',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {form.meta_title || form.title || 'Post Title — Grand Lumière Hotel'}
              </div>
              <div style={{ color:'#006621', fontSize:'0.8rem', marginBottom:'0.25rem' }}>
                grandlumiere.com/blog/{form.slug || 'your-post-slug'}
              </div>
              <div style={{ color:'#545454', fontSize:'0.875rem', lineHeight:1.5,
                display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                {form.meta_description || form.excerpt || 'Add a meta description for this post…'}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'1.25rem' }}>
              <div>
                <label style={lbl}>SEO Title (55–60 chars recommended)</label>
                <input value={form.meta_title} onChange={e => u('meta_title', e.target.value)}
                  placeholder={form.title || 'SEO-optimized title'}
                  style={inp()} />
                <CharCount value={form.meta_title} max={60} />
              </div>
              <div>
                <label style={lbl}>Meta Description (150–160 chars recommended)</label>
                <textarea rows={3} value={form.meta_description}
                  onChange={e => u('meta_description', e.target.value)}
                  placeholder="Write a compelling description that appears in search results…"
                  style={{ ...inp(), resize:'vertical' }} />
                <CharCount value={form.meta_description} max={160} />
              </div>
              <div>
                <label style={lbl}>Meta Keywords (comma-separated)</label>
                <input value={form.meta_keywords} onChange={e => u('meta_keywords', e.target.value)}
                  placeholder="luxury hotel, boutique stay, fine dining, spa retreat"
                  style={inp()} />
              </div>
              <div>
                <label style={lbl}>Open Graph Image URL (for social sharing, 1200×630px ideal)</label>
                <input value={form.og_image} onChange={e => u('og_image', e.target.value)}
                  placeholder="https://... or upload below"
                  style={inp()} />
                {form.og_image && (
                  <img src={form.og_image.startsWith('http') ? form.og_image : `${API_URL}/${form.og_image}`}
                    alt="OG preview" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:8, marginTop:'0.625rem' }}
                    onError={e => e.target.style.display='none'} />
                )}
              </div>
              <div>
                <label style={lbl}>Excerpt (shown in blog listing)</label>
                <textarea rows={3} value={form.excerpt}
                  onChange={e => u('excerpt', e.target.value)}
                  placeholder="A brief summary that entices readers to click…"
                  style={{ ...inp(), resize:'vertical' }} />
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {tab === 'media' && (
          <div style={{ background:'white', borderRadius:12, padding:'1.75rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            {/* Featured Image */}
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', marginBottom:'1rem' }}>
              Featured Image
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'2rem' }}>
              <div>
                <input ref={featImgRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={e => handleFeaturedImage(e.target.files[0])} />
                <button onClick={() => featImgRef.current?.click()} disabled={uploading}
                  style={{ width:'100%', padding:'1.25rem', border:'2px dashed #e2e8f0', borderRadius:10,
                    background:'#f8fafc', cursor:'pointer', color:'#64748b', fontFamily:'var(--font-body)',
                    fontSize:'0.875rem', marginBottom:'0.75rem', display:'block' }}>
                  {uploading ? '⏳ Uploading…' : '📤 Upload Featured Image'}
                </button>
                <input value={form.featured_image} onChange={e => u('featured_image', e.target.value)}
                  placeholder="Or paste image URL / file path"
                  style={inp()} />
              </div>
              <div style={{ background:'#f8fafc', borderRadius:10, overflow:'hidden',
                display:'flex', alignItems:'center', justifyContent:'center', minHeight:160 }}>
                {form.featured_image ? (
                  <img src={form.featured_image.startsWith('http') ? form.featured_image : `${API_URL}/${form.featured_image}`}
                    alt="Featured" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display='none'; }} />
                ) : (
                  <div style={{ textAlign:'center', color:'#94a3b8' }}>
                    <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🖼</div>
                    <div style={{ fontSize:'0.82rem' }}>No featured image</div>
                  </div>
                )}
              </div>
            </div>

            {/* Post Images Library */}
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', marginBottom:'0.75rem' }}>
              Post Image Library
            </h3>
            <p style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'1rem' }}>
              Images uploaded for this post. Click an image to insert it into the content editor.
            </p>
            {postImages.length === 0 ? (
              <div style={{ textAlign:'center', padding:'2rem', background:'#f8fafc',
                borderRadius:10, color:'#94a3b8', fontSize:'0.875rem' }}>
                No images uploaded yet. Use the 🖼 Image button in the editor toolbar to add images.
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'0.75rem' }}>
                {postImages.map((img, i) => (
                  <div key={i} style={{ cursor:'pointer', borderRadius:8, overflow:'hidden',
                    border:'1.5px solid #e2e8f0', transition:'border-color 0.2s' }}
                    onClick={() => {
                      const url = `${API_URL}/${img.file_path}`;
                      editorRef.current?.focus();
                      document.execCommand('insertImage', false, url);
                      setTab('content');
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='var(--color-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
                    <img src={`${API_URL}/${img.file_path}`} alt=""
                      style={{ width:'100%', height:80, objectFit:'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div style={{ background:'white', borderRadius:12, padding:'1.75rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
              <div>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={e => u('category', e.target.value)} style={inp()}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select value={form.status} onChange={e => u('status', e.target.value)} style={inp()}>
                  {['draft','published','archived'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => u('tags', e.target.value)}
                  placeholder="luxury, spa, dining, travel"
                  style={inp()} />
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:'1rem',
                padding:'1rem', background:'#f8fafc', borderRadius:10 }}>
                <div>
                  <div style={{ fontWeight:600, color:'#1e293b' }}>Featured Post</div>
                  <div style={{ fontSize:'0.8rem', color:'#64748b' }}>Show this post in featured sections on homepage</div>
                </div>
                <button onClick={() => u('featured', !form.featured)}
                  style={{ width:48, height:26, borderRadius:999, border:'none', cursor:'pointer', flexShrink:0,
                    background:form.featured?'var(--color-primary)':'#e2e8f0', position:'relative', transition:'background 0.3s' }}>
                  <span style={{ position:'absolute', top:3, left:form.featured?24:2, width:20, height:20,
                    borderRadius:'50%', background:'white', transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Sidebar ────────────────────────────────── */}
      <div style={{ position:'sticky', top:80, display:'flex', flexDirection:'column', gap:'1rem' }}>
        {/* Publish box */}
        <div style={{ background:'white', borderRadius:12, padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1rem', color:'var(--color-primary)', marginBottom:'1rem' }}>
            Publish
          </h3>
          <div style={{ display:'flex', gap:'0.5rem', flexDirection:'column' }}>
            <button onClick={() => handleSave('published')} disabled={saving} className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center' }}>
              🚀 {saving ? 'Publishing…' : 'Publish Now'}
            </button>
            <button onClick={() => handleSave('draft')} disabled={saving}
              style={{ width:'100%', padding:'0.75rem', border:'1.5px solid #e2e8f0', borderRadius:6,
                background:'white', cursor:'pointer', fontFamily:'var(--font-body)', fontSize:'0.85rem',
                color:'#475569', fontWeight:500 }}>
              Save as Draft
            </button>
          </div>
          <div style={{ marginTop:'1rem', padding:'0.75rem', background:'#f8fafc', borderRadius:8,
            fontSize:'0.78rem', color:'#64748b', lineHeight:1.6 }}>
            <div><strong>Status:</strong> {form.status}</div>
            <div><strong>Words:</strong> {wordCount}</div>
            <div><strong>Read time:</strong> ~{readMins} min</div>
          </div>
        </div>

        {/* SEO Score */}
        <div style={{ background:'white', borderRadius:12, padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1rem', color:'var(--color-primary)', marginBottom:'1rem' }}>
            SEO Checklist
          </h3>
          {[
            { label:'Title set',            pass:!!form.title },
            { label:'Slug set',             pass:!!form.slug },
            { label:'Excerpt written',      pass:form.excerpt?.length > 50 },
            { label:'Meta title set',       pass:!!form.meta_title },
            { label:'Meta description set', pass:form.meta_description?.length >= 50 },
            { label:'Meta keywords added',  pass:!!form.meta_keywords },
            { label:'Featured image set',   pass:!!form.featured_image },
            { label:'Content > 300 words',  pass:wordCount >= 300 },
            { label:'OG image set',         pass:!!form.og_image || !!form.featured_image },
          ].map(({ label, pass }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:'0.5rem',
              padding:'0.3rem 0', fontSize:'0.8rem', color:pass?'#065f46':'#94a3b8' }}>
              <span>{pass?'✅':'○'}</span> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// helpers
const lbl = { display:'block', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:4 };
const inp = (extra={}) => ({ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0', borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', ...extra });
function CharCount({ value, max }) {
  const len = (value||'').length;
  return <div style={{ fontSize:'0.72rem', marginTop:3, color:len>max?'#ef4444':len>max*0.85?'#d97706':'#94a3b8' }}>
    {len}/{max} characters {len>max&&'(too long)'}
  </div>;
}
