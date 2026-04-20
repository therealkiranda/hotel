// ============================================================
// src/pages/CustomPage.jsx — Public custom page renderer
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../utils/api';

export default function CustomPage(){
  const {slug}=useParams();
  const [page,setPage]=useState(null);
  const [loading,setLoading]=useState(true);
  const [notFound,setNotFound]=useState(false);
  useEffect(()=>{
    setLoading(true);setNotFound(false);
    api.get(`/pages/public/${slug}`).then(r=>setPage(r.data)).catch(()=>setNotFound(true)).finally(()=>setLoading(false));
  },[slug]);
  if(loading) return <div style={{paddingTop:'var(--header-height)',minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"/></div>;
  if(notFound) return(
    <div style={{paddingTop:'var(--header-height)',minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
      <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📄</div>
      <h2 style={{fontFamily:'var(--font-heading)',color:'var(--color-primary)',marginBottom:'0.5rem'}}>Page Not Found</h2>
      <p style={{color:'#64748b',marginBottom:'1.5rem'}}>This page doesn't exist or has been removed.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
  return(
    <>
      <Helmet>
        <title>{page.meta_title||page.title}</title>
        {page.meta_description&&<meta name="description" content={page.meta_description}/>}
        {page.meta_keywords&&<meta name="keywords" content={page.meta_keywords}/>}
        {page.og_title&&<meta property="og:title" content={page.og_title}/>}
        {page.og_description&&<meta property="og:description" content={page.og_description}/>}
      </Helmet>
      <div style={{background:'var(--color-primary)',padding:'4rem 0 5rem',marginTop:'var(--header-height)'}}>
        <div className="container">
          <div style={{fontSize:'0.7rem',fontWeight:600,letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--color-secondary)',marginBottom:'0.75rem'}}>Information</div>
          <h1 style={{fontFamily:'var(--font-heading)',color:'white',fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:700,margin:0}}>{page.title}</h1>
        </div>
      </div>
      <div style={{background:'var(--color-background)',marginTop:-40,paddingBottom:'4rem'}}>
        <div className="container" style={{maxWidth:860}}>
          <div style={{background:'white',borderRadius:16,padding:'clamp(1.5rem,4vw,3rem)',boxShadow:'0 4px 24px rgba(0,0,0,0.07)'}}>
            <div dangerouslySetInnerHTML={{__html:page.content}} className="page-content" style={{fontFamily:'var(--font-body)',fontSize:'1rem',lineHeight:1.9,color:'#374151'}}/>
            <div style={{marginTop:'2rem',paddingTop:'1.5rem',borderTop:'1px solid #f1f5f9',fontSize:'0.78rem',color:'#94a3b8'}}>
              Last updated: {new Date(page.updated_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
