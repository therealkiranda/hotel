// ============================================================
// src/components/admin/AdminLayout.jsx
// Mobile-responsive, role-based nav filtering
// Author: Kiran Khadka — © 2026 Kiran Khadka
// ============================================================
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const API_BASE = (import.meta.env.VITE_API_URL||'http://localhost:4000/api').replace('/api','');

const NAV_ALL = [
  { group:'OPERATIONS', roles:null, items:[
    { label:'Dashboard',   icon:'◈',  href:'/admin',           end:true,  roles:null },
    { label:'Front Desk',  icon:'🏨', href:'/admin/frontdesk', end:false, roles:null },
    { label:'Bookings',    icon:'📋', href:'/admin/bookings',  end:false, roles:null },
    { label:'Rooms',       icon:'🛏', href:'/admin/rooms',     end:false, roles:['super_admin','admin','manager'] },
    { label:'Payments',    icon:'💳', href:'/admin/payments',  end:false, roles:['super_admin','admin','manager'] },
  ]},
  { group:'GUESTS', roles:null, items:[
    { label:'Customers',   icon:'👥', href:'/admin/customers', end:false, roles:null },
    { label:'Reviews',     icon:'★',  href:'/admin/reviews',   end:false, roles:['super_admin','admin','manager'] },
  ]},
  { group:'CHANNELS', roles:['super_admin','admin','manager'], items:[
    { label:'OTA Manager', icon:'🌐', href:'/admin/ota',       end:false, roles:['super_admin','admin','manager'] },
  ]},
  { group:'CONTENT', roles:['super_admin','admin','manager'], items:[
    { label:'Pages',       icon:'📄', href:'/admin/pages',     end:false, roles:['super_admin','admin'] },
    { label:'Blog',        icon:'✏️', href:'/admin/blog',      end:false, roles:['super_admin','admin','manager'] },
    { label:'Amenities',   icon:'✦',  href:'/admin/amenities', end:false, roles:['super_admin','admin','manager'] },
  ]},
  { group:'PEOPLE', roles:['super_admin','admin','hr_manager','manager'], items:[
    { label:'HR Module',   icon:'👔', href:'/admin/hr',        end:false, roles:['super_admin','admin','hr_manager','manager'] },
  ]},
  { group:'CONFIG', roles:['super_admin','admin'], items:[
    { label:'Theme',       icon:'🎨', href:'/admin/theme',     end:false, roles:['super_admin','admin'] },
    { label:'SEO',         icon:'🔍', href:'/admin/seo',       end:false, roles:['super_admin','admin'] },
    { label:'Settings',    icon:'⚙',  href:'/admin/settings',  end:false, roles:['super_admin','admin'] },
  ]},
];

function canAccess(itemRoles, adminRole) {
  if (!itemRoles) return true;
  return itemRoles.includes(adminRole);
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const { hotel } = useTheme();

  const logout = () => { localStorage.removeItem('hotel_admin_token'); navigate('/admin/login'); };
  const admin = (() => { try { const t = localStorage.getItem('hotel_admin_token'); return t ? JSON.parse(atob(t.split('.')[1])) : null; } catch { return null; } })();
  const adminRole = admin?.role || 'receptionist';
  const logoSrc = hotel?.logo_path ? `${API_BASE}/${hotel.logo_path}` : null;

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filteredNav = NAV_ALL
    .filter(g => !g.roles || canAccess(g.roles, adminRole))
    .map(g => ({ ...g, items: g.items.filter(i => canAccess(i.roles, adminRole)) }))
    .filter(g => g.items.length > 0);

  const SidebarContent = ({ onNavClick }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding: isMobile ? '1rem 1.25rem' : (collapsed ? '1.25rem 0' : '1.25rem'),
        display:'flex', alignItems:'center', justifyContent: (isMobile || !collapsed) ? 'space-between' : 'center',
        borderBottom:'1px solid rgba(255,255,255,0.08)', minHeight:68 }}>
        {(isMobile || !collapsed) && (logoSrc
          ? <img src={logoSrc} alt="logo" style={{ height:36, maxWidth:130, objectFit:'contain' }} onError={e => e.target.style.display='none'} />
          : <div>
              <div style={{ fontFamily:'var(--font-heading)', color:'white', fontSize:'1.05rem', fontWeight:700, lineHeight:1 }}>{hotel?.name || 'Grand Lumière'}</div>
              <div style={{ fontSize:'0.6rem', color:'var(--color-secondary)', letterSpacing:'0.15em', textTransform:'uppercase', marginTop:2 }}>Admin Panel</div>
            </div>
        )}
        {!isMobile && collapsed && logoSrc && <img src={logoSrc} alt="logo" style={{ height:28, width:28, objectFit:'contain', borderRadius:4 }} />}
        {isMobile
          ? <button onClick={() => setMobileOpen(false)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:6, width:32, height:32, cursor:'pointer', color:'white', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          : <button onClick={() => setCollapsed(v => !v)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:6, width:26, height:26, cursor:'pointer', color:'white', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {collapsed ? '→' : '←'}
            </button>
        }
      </div>
      <nav style={{ flex:1, padding:'0.5rem 0', overflowY:'auto', overflowX:'hidden' }}>
        {filteredNav.map(({ group, items }) => (
          <div key={group}>
            {(!collapsed || isMobile)
              ? <div style={{ padding:'0.75rem 1.25rem 0.2rem', fontSize:'0.58rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{group}</div>
              : <div style={{ margin:'0.4rem 0.75rem', height:1, background:'rgba(255,255,255,0.1)' }} />
            }
            {items.map(item => (
              <NavLink key={item.href} to={item.href} end={item.end}
                onClick={onNavClick}
                style={({ isActive }) => ({
                  display:'flex', alignItems:'center',
                  gap: (collapsed && !isMobile) ? 0 : '0.75rem',
                  padding: (collapsed && !isMobile) ? '0.7rem 0' : '0.65rem 1.25rem',
                  justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start',
                  color: isActive ? 'var(--color-secondary)' : 'rgba(255,255,255,0.65)',
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-secondary)' : '3px solid transparent',
                  fontSize:'0.845rem', fontWeight: isActive ? 600 : 400,
                  transition:'all 0.18s', textDecoration:'none', whiteSpace:'nowrap',
                })}>
                <span style={{ fontSize:'1rem', flexShrink:0, width:(collapsed && !isMobile) ? 'auto' : 18, textAlign:'center' }}>{item.icon}</span>
                {(!collapsed || isMobile) && item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div style={{ padding: (collapsed && !isMobile) ? '0.875rem 0' : '0.875rem 1.25rem',
        borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center',
        gap:'0.75rem', justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start' }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--color-secondary)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.8rem', fontWeight:700, flexShrink:0 }}>
          {admin?.name?.[0] || 'A'}
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'white', fontSize:'0.82rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.name || 'Admin'}</div>
            <div style={{ fontSize:'0.68rem', color:'var(--color-secondary)', textTransform:'capitalize', marginBottom:2 }}>{adminRole.replace(/_/g,' ')}</div>
            <button onClick={logout} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.45)', fontSize:'0.72rem', cursor:'pointer', padding:0, fontFamily:'var(--font-body)' }}>Sign out</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', height:'100dvh', overflow:'hidden', background:'#f1f5f9', fontFamily:'var(--font-body)' }}>
      {!isMobile && (
        <motion.aside
          animate={{ width: collapsed ? 60 : 230 }}
          transition={{ duration:0.25, ease:'easeOut' }}
          style={{ background:'var(--color-primary)', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden', zIndex:10 }}>
          <SidebarContent onNavClick={() => {}} />
        </motion.aside>
      )}
      {isMobile && (
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onClick={() => setMobileOpen(false)}
                style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:40 }} />
              <motion.aside
                initial={{ x:-280 }} animate={{ x:0 }} exit={{ x:-280 }}
                transition={{ duration:0.25, ease:'easeOut' }}
                style={{ position:'fixed', left:0, top:0, bottom:0, width:260, background:'var(--color-primary)', zIndex:50, display:'flex', flexDirection:'column', overflowY:'auto' }}>
                <SidebarContent onNavClick={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <div style={{ height:56, background:'white', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', gap:'0.75rem', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            {isMobile && (
              <button onClick={() => setMobileOpen(true)}
                style={{ background:'none', border:'1px solid #e2e8f0', borderRadius:6, width:34, height:34, cursor:'pointer', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-primary)' }}>
                ☰
              </button>
            )}
            {isMobile && <span style={{ fontFamily:'var(--font-heading)', color:'var(--color-primary)', fontWeight:700, fontSize:'0.95rem' }}>{hotel?.name || 'Grand Lumière'}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            {!isMobile && <span style={{ fontSize:'0.72rem', color:'#94a3b8', textTransform:'capitalize' }}>{adminRole.replace(/_/g,' ')}</span>}
            <a href="/" target="_blank" rel="noopener" style={{ fontSize:'0.78rem', color:'var(--color-primary)', opacity:0.7, whiteSpace:'nowrap' }}>View Site ↗</a>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--color-primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.8rem', fontWeight:700, flexShrink:0 }}>
              {admin?.name?.[0] || 'A'}
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '1rem' : '2rem' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
