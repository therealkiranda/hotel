// ============================================================
// src/components/admin/AdminLayout.jsx
// Grouped nav, logo support, Front Desk + Pages
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const API_BASE = (import.meta.env.VITE_API_URL||'http://localhost:4000/api').replace('/api','');
const NAV=[
  {group:'OPERATIONS',items:[
    {label:'Dashboard',icon:'◈',href:'/admin',end:true},
    {label:'Front Desk',icon:'🏨',href:'/admin/frontdesk'},
    {label:'Bookings',icon:'📋',href:'/admin/bookings'},
    {label:'Rooms',icon:'🛏',href:'/admin/rooms'},
    {label:'Payments',icon:'💳',href:'/admin/payments'},
  ]},
  {group:'GUESTS',items:[
    {label:'Customers',icon:'👥',href:'/admin/customers'},
    {label:'Reviews',icon:'★',href:'/admin/reviews'},
  ]},
  {group:'CHANNELS',items:[
    {label:'OTA Manager',icon:'🌐',href:'/admin/ota'},
  ]},
  {group:'CONTENT',items:[
    {label:'Pages',icon:'📄',href:'/admin/pages'},
    {label:'Blog',icon:'✏️',href:'/admin/blog'},
    {label:'Amenities',icon:'✦',href:'/admin/amenities'},
  ]},
  {group:'PEOPLE',items:[
    {label:'HR Module',icon:'👔',href:'/admin/hr'},
  ]},
  {group:'CONFIG',items:[
    {label:'Theme',icon:'🎨',href:'/admin/theme'},
    {label:'SEO',icon:'🔍',href:'/admin/seo'},
    {label:'Settings',icon:'⚙',href:'/admin/settings'},
  ]},
];

export default function AdminLayout(){
  const [collapsed,setCollapsed]=useState(false);
  const navigate=useNavigate();
  const {hotel}=useTheme();
  const logout=()=>{localStorage.removeItem('hotel_admin_token');navigate('/admin/login');};
  const admin=(()=>{try{const t=localStorage.getItem('hotel_admin_token');return t?JSON.parse(atob(t.split('.')[1])):null;}catch{return null;}})();
  const logoSrc=hotel?.logo_path?`${API_BASE}/${hotel.logo_path}`:null;
  return(
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#f1f5f9',fontFamily:'var(--font-body)'}}>
      <motion.aside animate={{width:collapsed?60:230}} transition={{duration:0.25,ease:'easeOut'}}
        style={{background:'var(--color-primary)',display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden',zIndex:10}}>
        <div style={{padding:collapsed?'1.25rem 0':'1.25rem',display:'flex',alignItems:'center',
          justifyContent:collapsed?'center':'space-between',borderBottom:'1px solid rgba(255,255,255,0.08)',minHeight:68}}>
          {!collapsed&&(logoSrc
            ?<img src={logoSrc} alt="logo" style={{height:36,maxWidth:130,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
            :<div><div style={{fontFamily:'var(--font-heading)',color:'white',fontSize:'1.05rem',fontWeight:700,lineHeight:1}}>{hotel?.name||'Grand Lumière'}</div>
              <div style={{fontSize:'0.6rem',color:'var(--color-secondary)',letterSpacing:'0.15em',textTransform:'uppercase',marginTop:2}}>Admin Panel</div></div>
          )}
          {collapsed&&logoSrc&&<img src={logoSrc} alt="logo" style={{height:28,width:28,objectFit:'contain',borderRadius:4}}/>}
          <button onClick={()=>setCollapsed(v=>!v)} style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:6,
            width:26,height:26,cursor:'pointer',color:'white',fontSize:'0.75rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {collapsed?'→':'←'}
          </button>
        </div>
        <nav style={{flex:1,padding:'0.5rem 0',overflowY:'auto',overflowX:'hidden'}}>
          {NAV.map(({group,items})=>(
            <div key={group}>
              {!collapsed?<div style={{padding:'0.75rem 1.25rem 0.2rem',fontSize:'0.58rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',fontWeight:600}}>{group}</div>
               :<div style={{margin:'0.4rem 0.75rem',height:1,background:'rgba(255,255,255,0.1)'}}/>}
              {items.map(item=>(
                <NavLink key={item.href} to={item.href} end={item.end}
                  style={({isActive})=>({display:'flex',alignItems:'center',gap:collapsed?0:'0.75rem',
                    padding:collapsed?'0.7rem 0':'0.65rem 1.25rem',justifyContent:collapsed?'center':'flex-start',
                    color:isActive?'var(--color-secondary)':'rgba(255,255,255,0.65)',
                    background:isActive?'rgba(255,255,255,0.07)':'transparent',
                    borderLeft:isActive?'3px solid var(--color-secondary)':'3px solid transparent',
                    fontSize:'0.845rem',fontWeight:isActive?600:400,transition:'all 0.18s',textDecoration:'none',whiteSpace:'nowrap'})}>
                  <span style={{fontSize:'0.9rem',flexShrink:0,width:collapsed?'auto':16,textAlign:'center'}}>{item.icon}</span>
                  {!collapsed&&item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div style={{padding:collapsed?'0.875rem 0':'0.875rem 1.25rem',borderTop:'1px solid rgba(255,255,255,0.08)',
          display:'flex',alignItems:'center',gap:'0.75rem',justifyContent:collapsed?'center':'flex-start'}}>
          <div style={{width:30,height:30,borderRadius:'50%',background:'var(--color-secondary)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.8rem',fontWeight:700,flexShrink:0}}>
            {admin?.name?.[0]||'A'}
          </div>
          {!collapsed&&<div style={{flex:1,minWidth:0}}>
            <div style={{color:'white',fontSize:'0.82rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{admin?.name||'Admin'}</div>
            <button onClick={logout} style={{background:'none',border:'none',color:'rgba(255,255,255,0.45)',fontSize:'0.72rem',cursor:'pointer',padding:0,fontFamily:'var(--font-body)'}}>Sign out</button>
          </div>}
        </div>
      </motion.aside>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{height:56,background:'white',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 1.5rem',gap:'1rem',flexShrink:0}}>
          <span style={{fontSize:'0.75rem',color:'#94a3b8',textTransform:'capitalize'}}>{admin?.role?.replace('_',' ')}</span>
          <a href="/" target="_blank" rel="noopener" style={{fontSize:'0.78rem',color:'var(--color-primary)',opacity:0.7}}>View Website ↗</a>
          <div style={{width:30,height:30,borderRadius:'50%',background:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.8rem',fontWeight:700}}>{admin?.name?.[0]||'A'}</div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'2rem'}}><Outlet/></div>
      </div>
    </div>
  );
}
