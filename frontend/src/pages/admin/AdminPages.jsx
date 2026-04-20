// ============================================================
// src/pages/admin/AdminPages.jsx — Page Builder
// Best available rich text editor (contentEditable toolbar)
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../../utils/api';

const lbl={display:'block',fontSize:'0.68rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#475569',marginBottom:4};
const inp=(x={})=>({width:'100%',padding:'0.625rem 0.875rem',border:'1.5px solid #e2e8f0',borderRadius:6,fontFamily:'var(--font-body)',fontSize:'0.875rem',outline:'none',boxSizing:'border-box',...x});
const defForm=()=>({title:'',slug:'',content:'',meta_title:'',meta_description:'',meta_keywords:'',og_title:'',og_description:'',is_active:1});
const slug=(t)=>t.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');

// Rich Text Editor — toolbar + contentEditable (works in any browser, no npm needed)
function RichEditor({value,onChange}){
  const ref=useRef(null);
  const init=useRef(false);
  useEffect(()=>{if(ref.current&&!init.current){ref.current.innerHTML=value||'';init.current=true;}},[]);
  const ex=(cmd,val=null)=>{document.execCommand(cmd,false,val);ref.current?.focus();};
  const Btn=({ch,cmd,val,title})=>(
    <button type="button" onMouseDown={e=>{e.preventDefault();ex(cmd,val);}} title={title}
      style={{padding:'3px 7px',border:'1px solid #e2e8f0',borderRadius:4,background:'white',cursor:'pointer',fontSize:'0.82rem',minWidth:28,lineHeight:1.2}}>{ch}</button>
  );
  return(
    <div style={{border:'1.5px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:'3px',padding:'7px 8px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',alignItems:'center'}}>
        <select onChange={e=>ex('formatBlock',e.target.value)} defaultValue="" style={{padding:'3px 6px',border:'1px solid #e2e8f0',borderRadius:4,background:'white',fontSize:'0.8rem',cursor:'pointer'}}>
          <option value="">¶ Normal</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code</option>
        </select>
        <Btn ch={<b>B</b>} cmd="bold" title="Bold"/>
        <Btn ch={<i>I</i>} cmd="italic" title="Italic"/>
        <Btn ch={<u>U</u>} cmd="underline" title="Underline"/>
        <Btn ch="S̶" cmd="strikethrough" title="Strikethrough"/>
        <span style={{width:1,height:18,background:'#e2e8f0',margin:'0 2px'}}/>
        <Btn ch="≡L" cmd="justifyLeft" title="Left"/>
        <Btn ch="≡C" cmd="justifyCenter" title="Center"/>
        <Btn ch="≡R" cmd="justifyRight" title="Right"/>
        <span style={{width:1,height:18,background:'#e2e8f0',margin:'0 2px'}}/>
        <Btn ch="• List" cmd="insertUnorderedList" title="Bullet list"/>
        <Btn ch="1. List" cmd="insertOrderedList" title="Numbered list"/>
        <span style={{width:1,height:18,background:'#e2e8f0',margin:'0 2px'}}/>
        <button type="button" onMouseDown={e=>{e.preventDefault();const u=prompt('Enter URL (https://...)');if(u)ex('createLink',u);ref.current?.focus();}} title="Insert link"
          style={{padding:'3px 7px',border:'1px solid #e2e8f0',borderRadius:4,background:'white',cursor:'pointer',fontSize:'0.82rem'}}>🔗</button>
        <button type="button" onMouseDown={e=>{e.preventDefault();const u=prompt('Enter image URL');if(u)ex('insertImage',u);ref.current?.focus();}} title="Insert image"
          style={{padding:'3px 7px',border:'1px solid #e2e8f0',borderRadius:4,background:'white',cursor:'pointer',fontSize:'0.82rem'}}>🖼</button>
        <Btn ch="—" cmd="insertHorizontalRule" title="Divider"/>
        <Btn ch="✕" cmd="removeFormat" title="Clear formatting"/>
        <button type="button" onMouseDown={e=>{e.preventDefault();if(ref.current){ref.current.innerHTML='<table style="width:100%;border-collapse:collapse"><tr><th style="border:1px solid #e2e8f0;padding:8px">Header 1</th><th style="border:1px solid #e2e8f0;padding:8px">Header 2</th></tr><tr><td style="border:1px solid #e2e8f0;padding:8px">Cell 1</td><td style="border:1px solid #e2e8f0;padding:8px">Cell 2</td></tr></table>';onChange(ref.current.innerHTML);}}} title="Insert table"
          style={{padding:'3px 7px',border:'1px solid #e2e8f0',borderRadius:4,background:'white',cursor:'pointer',fontSize:'0.82rem'}}>⊞ Table</button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={()=>onChange(ref.current?.innerHTML||'')}
        style={{minHeight:380,padding:'1.25rem 1.5rem',fontFamily:'var(--font-body)',fontSize:'0.95rem',lineHeight:1.8,outline:'none',color:'#1e293b'}}
      />
      <style>{`[contenteditable] h1,[contenteditable] h2,[contenteditable] h3{font-family:var(--font-heading);color:var(--color-primary)}[contenteditable] blockquote{border-left:3px solid var(--color-secondary);padding-left:1rem;color:#64748b;font-style:italic;margin:1rem 0}[contenteditable] a{color:var(--color-primary)}[contenteditable] table{width:100%;border-collapse:collapse}[contenteditable] td,[contenteditable] th{border:1px solid #e2e8f0;padding:.5rem .75rem}`}</style>
    </div>
  );
}

export default function AdminPages(){
  const [pages,setPages]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(defForm());
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState('');
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const load=()=>adminApi.get('/pages').then(r=>setPages(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const openNew=()=>{setForm(defForm());setMsg('');setEditing('new');};
  const openEdit=async(page)=>{
    setMsg('');
    const {data}=await adminApi.get(`/pages/${page.id}`);
    setForm({title:data.title||'',slug:data.slug||'',content:data.content||'',meta_title:data.meta_title||'',meta_description:data.meta_description||'',meta_keywords:data.meta_keywords||'',og_title:data.og_title||'',og_description:data.og_description||'',is_active:data.is_active??1});
    setEditing(page.id);
  };
  const save=async()=>{
    if(!form.title||!form.slug) return setMsg('❌ Title and slug required');
    setSaving(true);
    try{
      if(editing==='new') await adminApi.post('/pages',form);
      else await adminApi.put(`/pages/${editing}`,form);
      setMsg('✅ Saved!');load();setTimeout(()=>{setMsg('');setEditing(null);},1500);
    }catch(e){setMsg('❌ '+(e.response?.data?.error||'Failed'));}
    finally{setSaving(false);}
  };
  const del=async(id)=>{if(!confirm('Delete?'))return;await adminApi.delete(`/pages/${id}`);load();};

  if(editing) return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem'}}>
        <button onClick={()=>setEditing(null)} style={{background:'#f1f5f9',border:'none',borderRadius:8,padding:'0.5rem 1rem',cursor:'pointer',fontSize:'0.85rem',color:'#475569'}}>← Back</button>
        <h1 style={{fontFamily:'var(--font-heading)',fontSize:'1.75rem',color:'var(--color-primary)',margin:0}}>{editing==='new'?'New Page':'Edit Page'}</h1>
      </div>
      {msg&&<div style={{padding:'0.875rem 1.25rem',borderRadius:10,marginBottom:'1.25rem',background:msg.startsWith('✅')?'#d1fae5':'#fee2e2',color:msg.startsWith('✅')?'#065f46':'#991b1b',fontWeight:500}}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'1.5rem',alignItems:'start'}}>
        <div>
          <div style={{background:'white',borderRadius:16,padding:'1.75rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'1.25rem'}}>
            <div style={{marginBottom:'1.25rem'}}>
              <label style={lbl}>Page Title *</label>
              <input value={form.title} onChange={e=>{f('title',e.target.value);if(!form.slug||editing==='new')f('slug',slug(e.target.value));}} placeholder="e.g. Privacy Policy" style={inp()}/>
            </div>
            <div style={{marginBottom:'1.5rem'}}>
              <label style={lbl}>URL Slug * <span style={{color:'#94a3b8',fontWeight:400,fontSize:'0.65rem'}}>(page at /pages/your-slug)</span></label>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontSize:'0.82rem',color:'#94a3b8',whiteSpace:'nowrap'}}>/pages/</span>
                <input value={form.slug} onChange={e=>f('slug',e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-'))} placeholder="privacy-policy" style={{...inp(),flex:1}}/>
              </div>
            </div>
            <label style={lbl}>Page Content</label>
            <RichEditor key={editing} value={form.content} onChange={v=>f('content',v)}/>
          </div>
        </div>
        <div style={{position:'sticky',top:20}}>
          <div style={{background:'white',borderRadius:16,padding:'1.75rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'1rem'}}>
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',color:'var(--color-primary)',marginBottom:'1.25rem'}}>🔍 SEO</h3>
            {[{k:'meta_title',l:'Meta Title',ph:'Search engine title'},{k:'meta_description',l:'Meta Description',ph:'150-160 chars',ta:true},{k:'meta_keywords',l:'Keywords',ph:'key1, key2'},{k:'og_title',l:'OG Title',ph:'Social title'},{k:'og_description',l:'OG Description',ph:'Social description',ta:true}].map(({k,l,ph,ta})=>(
              <div key={k} style={{marginBottom:'0.875rem'}}>
                <label style={lbl}>{l}</label>
                {ta?<textarea rows={2} value={form[k]||''} onChange={e=>f(k,e.target.value)} placeholder={ph} style={inp({resize:'vertical'})}/>:<input value={form[k]||''} onChange={e=>f(k,e.target.value)} placeholder={ph} style={inp()}/>}
              </div>
            ))}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'0.5rem'}}>
              <span style={{fontSize:'0.85rem',fontWeight:600,color:'#1e293b'}}>Published</span>
              <button onClick={()=>f('is_active',form.is_active?0:1)} style={{width:44,height:24,borderRadius:999,border:'none',cursor:'pointer',position:'relative',transition:'background 0.3s',background:form.is_active?'var(--color-primary)':'#e2e8f0'}}>
                <span style={{position:'absolute',top:2,left:form.is_active?22:2,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
              </button>
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn btn-primary" style={{width:'100%',padding:'1rem',fontSize:'0.95rem'}}>{saving?'Saving…':editing==='new'?'✓ Create Page':'✓ Save Changes'}</button>
        </div>
      </div>
    </div>
  );

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <div><h1 style={{fontFamily:'var(--font-heading)',fontSize:'2rem',color:'var(--color-primary)',marginBottom:0}}>📄 Pages</h1><p style={{color:'#64748b',fontSize:'0.875rem',marginBottom:0}}>Create and manage pages with rich content and SEO</p></div>
        <button onClick={openNew} className="btn btn-primary">+ New Page</button>
      </div>
      {loading?<div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>Loading…</div>:pages.length===0?(
        <div style={{textAlign:'center',padding:'4rem',background:'white',borderRadius:16,color:'#94a3b8'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📄</div>
          <div style={{fontSize:'1.1rem',marginBottom:'1rem'}}>No pages yet</div>
          <button onClick={openNew} className="btn btn-primary">Create first page</button>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {pages.map(page=>(
            <div key={page.id} style={{background:'white',borderRadius:12,padding:'1.25rem 1.5rem',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',display:'flex',alignItems:'center',gap:'1.5rem'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:'var(--color-primary)',marginBottom:2}}>{page.title}</div>
                <div style={{fontSize:'0.78rem',color:'#94a3b8'}}>/pages/{page.slug} · {new Date(page.updated_at).toLocaleDateString()}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                <span style={{fontSize:'0.72rem',fontWeight:600,padding:'3px 10px',borderRadius:999,background:page.is_active?'#d1fae5':'#fee2e2',color:page.is_active?'#065f46':'#991b1b'}}>{page.is_active?'Published':'Draft'}</span>
                <a href={`/pages/${page.slug}`} target="_blank" rel="noopener" style={{fontSize:'0.78rem',color:'var(--color-primary)',opacity:0.6}}>View ↗</a>
                <button onClick={()=>openEdit(page)} style={{padding:'0.4rem 0.875rem',border:'1.5px solid #e2e8f0',borderRadius:8,background:'white',cursor:'pointer',fontSize:'0.8rem',color:'#475569'}}>Edit</button>
                <button onClick={()=>del(page.id)} style={{padding:'0.4rem 0.875rem',border:'1.5px solid #fee2e2',borderRadius:8,background:'white',cursor:'pointer',fontSize:'0.8rem',color:'#ef4444'}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
