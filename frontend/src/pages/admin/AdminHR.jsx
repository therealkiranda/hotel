// ============================================================
// src/pages/admin/AdminHR.jsx — Full HR Module
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../utils/api';

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'employees', label: '👥 Employees' },
  { id: 'departments', label: '🏢 Departments' },
  { id: 'attendance', label: '🕐 Attendance' },
  { id: 'leave', label: '🌴 Leave' },
  { id: 'payroll', label: '💰 Payroll' },
  { id: 'performance', label: '⭐ Performance' },
  { id: 'announcements', label: '📢 Announcements' },
];

const fmtMoney = n => `$${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const statusBadge = (s, map) => {
  const c = map[s] || { bg:'#f3f4f6', color:'#6b7280' };
  return <span style={{ ...c, padding:'3px 10px', borderRadius:999, fontSize:'0.73rem', fontWeight:600 }}>{s?.replace(/_/g,' ')}</span>;
};

export default function AdminHR() {
  const [tab, setTab] = useState('dashboard');
  const [hrData, setHrData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [payrollTotals, setPayrollTotals] = useState({});
  const [reviews, setReviews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const { data } = await adminApi.get('/hr/dashboard');
        setHrData(data);
      } else if (tab === 'employees') {
        const { data } = await adminApi.get(`/hr/employees?page=${page}&per_page=20&search=${search}`);
        setEmployees(data.data); setTotalEmployees(data.total);
      } else if (tab === 'departments') {
        const { data } = await adminApi.get('/hr/departments');
        setDepartments(data);
      } else if (tab === 'attendance') {
        const { data } = await adminApi.get('/hr/attendance?date_from='+new Date(Date.now()-7*86400000).toISOString().split('T')[0]);
        setAttendance(data);
      } else if (tab === 'leave') {
        const [lr, lt] = await Promise.all([
          adminApi.get('/hr/leave-requests'),
          adminApi.get('/hr/leave-types'),
        ]);
        setLeaveRequests(lr.data); setLeaveTypes(lt.data);
      } else if (tab === 'payroll') {
        const { data } = await adminApi.get('/hr/payroll?status=draft');
        setPayroll(data.data); setPayrollTotals(data.totals||{});
      } else if (tab === 'performance') {
        const { data } = await adminApi.get('/hr/performance-reviews');
        setReviews(data);
      } else if (tab === 'announcements') {
        const { data } = await adminApi.get('/hr/announcements');
        setAnnouncements(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tab, page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'2rem', color:'var(--color-primary)', marginBottom:0 }}>
            Human Resources
          </h1>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:0 }}>
            Manage employees, attendance, leave, payroll, and performance
          </p>
        </div>
        {tab === 'employees' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Employee</button>
        )}
        {tab === 'payroll' && (
          <button className="btn btn-primary" onClick={async () => {
            const month = new Date(); const start = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-01`;
            const end = new Date(month.getFullYear(), month.getMonth()+1, 0).toISOString().split('T')[0];
            if (window.confirm(`Generate payroll for ${start} to ${end}?`)) {
              await adminApi.post('/hr/payroll/generate', { pay_period_start:start, pay_period_end:end });
              load();
            }
          }}>⚡ Generate Payroll</button>
        )}
        {tab === 'announcements' && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Announcement</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:'1.5rem', background:'white',
        borderRadius:12, padding:'0.375rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
            style={{ padding:'0.625rem 1rem', border:'none', cursor:'pointer', borderRadius:8,
              fontFamily:'var(--font-body)', fontSize:'0.82rem', fontWeight: tab===t.id ? 600 : 400,
              color: tab===t.id ? 'white' : '#64748b',
              background: tab===t.id ? 'var(--color-primary)' : 'transparent',
              transition:'all 0.2s', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>}

      {/* ── DASHBOARD ──────────────────────────── */}
      {!loading && tab === 'dashboard' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1.25rem', marginBottom:'2rem' }}>
            {[
              { label:'Active Employees', value:hrData.summary?.total_active||0, icon:'👥', color:'#1a3c2e' },
              { label:'On Leave Today', value:hrData.summary?.on_leave||0, icon:'🌴', color:'#d97706' },
              { label:'Pending Leave', value:hrData.summary?.pending_leave||0, icon:'📋', color:'#7c3aed' },
              { label:'New Hires (30d)', value:hrData.summary?.new_hires_30d||0, icon:'🆕', color:'#2563eb' },
              { label:'Payroll Pending', value:hrData.summary?.payroll_pending||0, icon:'💰', color:'#be185d' },
              { label:'Reviews Pending', value:hrData.summary?.reviews_pending||0, icon:'⭐', color:'#0891b2' },
            ].map(({ label, value, icon, color }) => (
              <motion.div key={label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                style={{ background:'white', borderRadius:16, padding:'1.5rem',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderLeft:`4px solid ${color}` }}>
                <div style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>{icon}</div>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:'1.75rem', fontWeight:700, color:'#1e293b' }}>{value}</div>
                <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:2 }}>{label}</div>
              </motion.div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
            {/* By Department */}
            <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
                Headcount by Department
              </h3>
              {(hrData.byDept||[]).map(d => (
                <div key={d.code} style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.75rem' }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'color-mix(in srgb, var(--color-primary) 10%, white)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
                    fontSize:'0.65rem', color:'var(--color-primary)' }}>{d.code}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:'0.85rem', fontWeight:500 }}>{d.department}</span>
                      <span style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--color-primary)' }}>{d.headcount}</span>
                    </div>
                    <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:'var(--color-primary)', borderRadius:3,
                        width:`${Math.min(100, (d.headcount / Math.max(...(hrData.byDept||[{headcount:1}]).map(x=>x.headcount))) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Leave */}
            <div style={{ background:'white', borderRadius:16, padding:'1.75rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
                Pending Leave Requests
              </h3>
              {(hrData.pendingLeaves||[]).length === 0
                ? <p style={{ color:'#94a3b8', fontSize:'0.875rem' }}>No pending requests 🎉</p>
                : (hrData.pendingLeaves||[]).map(l => (
                  <div key={l.id} style={{ padding:'0.875rem 0', borderBottom:'1px solid #f1f5f9' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{l.first_name} {l.last_name}</div>
                        <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
                          {l.leave_type} · {l.start_date} → {l.end_date} ({l.days_requested}d)
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        {['approved','rejected'].map(s => (
                          <button key={s} onClick={async () => {
                            await adminApi.put(`/hr/leave-requests/${l.id}/review`, { status:s });
                            load();
                          }} style={{ padding:'4px 10px', borderRadius:6, border:'none', cursor:'pointer',
                            fontSize:'0.72rem', fontWeight:600,
                            background:s==='approved'?'#d1fae5':'#fee2e2',
                            color:s==='approved'?'#065f46':'#991b1b' }}>
                            {s==='approved'?'✓':'✕'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Hires */}
          {(hrData.recentHires||[]).length > 0 && (
            <div style={{ background:'white', borderRadius:16, padding:'1.75rem',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginTop:'1.5rem' }}>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
                Recent Hires
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
                {(hrData.recentHires||[]).map(e => (
                  <div key={e.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem',
                    padding:'0.875rem', background:'#f8fafc', borderRadius:10 }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--color-primary)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontWeight:700, fontSize:'0.9rem', flexShrink:0 }}>
                      {e.first_name[0]}{e.last_name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{e.first_name} {e.last_name}</div>
                      <div style={{ fontSize:'0.75rem', color:'#64748b' }}>{e.job_title}</div>
                      <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{e.hire_date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EMPLOYEES ──────────────────────────── */}
      {!loading && tab === 'employees' && (
        <div>
          <div style={{ background:'white', borderRadius:12, padding:'1rem 1.25rem',
            boxShadow:'0 2px 8px rgba(0,0,0,0.05)', marginBottom:'1.25rem', display:'flex', gap:'1rem' }}>
            <input placeholder="Search by name, ID, or email..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ flex:1, padding:'0.625rem 1rem', border:'1.5px solid #e2e8f0',
                borderRadius:8, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
          </div>

          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                    {['ID','Employee','Department','Role','Type','Hire Date','Salary','Status','Actions'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'1rem 1.25rem', color:'#64748b',
                        fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'1rem 1.25rem', fontFamily:'monospace', fontSize:'0.8rem', color:'var(--color-primary)', fontWeight:700 }}>{e.employee_id}</td>
                      <td style={{ padding:'1rem 1.25rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--color-primary)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'white', fontWeight:700, fontSize:'0.75rem', flexShrink:0 }}>
                            {e.first_name[0]}{e.last_name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight:600 }}>{e.first_name} {e.last_name}</div>
                            <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'1rem 1.25rem', color:'#64748b' }}>{e.department_name||'—'}</td>
                      <td style={{ padding:'1rem 1.25rem' }}>{e.job_title}</td>
                      <td style={{ padding:'1rem 1.25rem' }}>
                        <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:4,
                          background:'#f1f5f9', color:'#475569', textTransform:'capitalize' }}>
                          {e.employment_type?.replace('_',' ')}
                        </span>
                      </td>
                      <td style={{ padding:'1rem 1.25rem', color:'#64748b' }}>{e.hire_date}</td>
                      <td style={{ padding:'1rem 1.25rem', fontWeight:600 }}>{fmtMoney(e.base_salary)}</td>
                      <td style={{ padding:'1rem 1.25rem' }}>
                        {statusBadge(e.employment_status, {
                          active:{ bg:'#d1fae5',color:'#065f46' },
                          on_leave:{ bg:'#fef3c7',color:'#92400e' },
                          suspended:{ bg:'#fee2e2',color:'#991b1b' },
                          terminated:{ bg:'#f3f4f6',color:'#6b7280' },
                        })}
                      </td>
                      <td style={{ padding:'1rem 1.25rem' }}>
                        <button onClick={() => setSelectedEmployee(e)}
                          style={{ padding:'4px 12px', background:'var(--color-primary)', color:'white',
                            border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem' }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr><td colSpan={9} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>No employees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalEmployees > 20 && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'1rem 1.5rem', borderTop:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:'0.85rem', color:'#64748b' }}>
                  {(page-1)*20+1}–{Math.min(page*20,totalEmployees)} of {totalEmployees}
                </span>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                    style={{ padding:'0.5rem 1rem', border:'1px solid #e2e8f0', borderRadius:6, cursor:page===1?'not-allowed':'pointer', background:'white', opacity:page===1?0.5:1 }}>Prev</button>
                  <button disabled={page*20>=totalEmployees} onClick={() => setPage(p=>p+1)}
                    style={{ padding:'0.5rem 1rem', border:'1px solid #e2e8f0', borderRadius:6, cursor:page*20>=totalEmployees?'not-allowed':'pointer', background:'white', opacity:page*20>=totalEmployees?0.5:1 }}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DEPARTMENTS ───────────────────────── */}
      {!loading && tab === 'departments' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.25rem' }}>
          {departments.map(d => (
            <div key={d.id} style={{ background:'white', borderRadius:16, padding:'1.5rem',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid var(--color-primary)` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:'1.15rem', color:'var(--color-primary)', fontWeight:700 }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--color-secondary)', letterSpacing:'0.1em',
                    fontWeight:600, textTransform:'uppercase' }}>{d.code}</div>
                </div>
                <div style={{ width:48, height:48, borderRadius:12, background:'color-mix(in srgb, var(--color-primary) 8%, white)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'var(--font-heading)', fontSize:'1.5rem', fontWeight:700, color:'var(--color-primary)' }}>
                  {d.headcount||0}
                </div>
              </div>
              <p style={{ fontSize:'0.82rem', color:'#64748b', lineHeight:1.6, marginBottom:'0.75rem' }}>{d.description}</p>
              {d.location && <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>📍 {d.location}</div>}
              {(d.manager_first_name) && (
                <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:4 }}>
                  👤 {d.manager_first_name} {d.manager_last_name}
                </div>
              )}
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:4 }}>
                {d.headcount||0} employee{d.headcount !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ATTENDANCE ────────────────────────── */}
      {!loading && tab === 'attendance' && (
        <div>
          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', margin:0 }}>
                Attendance — Last 7 Days
              </h3>
              <span style={{ fontSize:'0.82rem', color:'#64748b' }}>{attendance.length} records</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                    {['Employee','Department','Date','Check In','Check Out','Hours','OT','Status'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'0.875rem 1.25rem', color:'#64748b',
                        fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0,100).map(a => (
                    <tr key={a.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        <div style={{ fontWeight:600 }}>{a.first_name} {a.last_name}</div>
                        <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{a.emp_code}</div>
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#64748b', fontSize:'0.82rem' }}>{a.department||'—'}</td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#64748b' }}>{a.date}</td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>{a.check_in||'—'}</td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>{a.check_out||'—'}</td>
                      <td style={{ padding:'0.875rem 1.25rem', fontWeight:600 }}>{a.worked_hours||0}h</td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#d97706' }}>
                        {a.overtime_hours > 0 ? `+${a.overtime_hours}h` : '—'}
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        {statusBadge(a.status, {
                          present:{ bg:'#d1fae5',color:'#065f46' },
                          absent:{ bg:'#fee2e2',color:'#991b1b' },
                          late:{ bg:'#fef3c7',color:'#92400e' },
                          on_leave:{ bg:'#dbeafe',color:'#1e40af' },
                          remote:{ bg:'#f3e8ff',color:'#7c3aed' },
                          half_day:{ bg:'#fef3c7',color:'#92400e' },
                        })}
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr><td colSpan={8} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>No attendance records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── LEAVE ─────────────────────────────── */}
      {!loading && tab === 'leave' && (
        <div>
          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', margin:0 }}>Leave Requests</h3>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                    {['Employee','Dept','Type','From','To','Days','Reason','Status','Actions'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'0.875rem 1.25rem', color:'#64748b',
                        fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map(l => (
                    <tr key={l.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        <div style={{ fontWeight:600 }}>{l.first_name} {l.last_name}</div>
                        <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{l.emp_code}</div>
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#64748b', fontSize:'0.82rem' }}>{l.department||'—'}</td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--color-primary)' }}>{l.leave_type_name}</span>
                        {!l.is_paid && <span style={{ fontSize:'0.68rem', color:'#ef4444', marginLeft:4 }}>(Unpaid)</span>}
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#64748b' }}>{l.start_date}</td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#64748b' }}>{l.end_date}</td>
                      <td style={{ padding:'0.875rem 1.25rem', fontWeight:700, textAlign:'center' }}>{l.days_requested}</td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#64748b', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {l.reason||'—'}
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        {statusBadge(l.status, {
                          pending:{ bg:'#fef3c7',color:'#92400e' },
                          approved:{ bg:'#d1fae5',color:'#065f46' },
                          rejected:{ bg:'#fee2e2',color:'#991b1b' },
                          cancelled:{ bg:'#f3f4f6',color:'#6b7280' },
                        })}
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        {l.status === 'pending' && (
                          <div style={{ display:'flex', gap:'0.375rem' }}>
                            {['approved','rejected'].map(s => (
                              <button key={s} onClick={async () => {
                                await adminApi.put(`/hr/leave-requests/${l.id}/review`, { status:s });
                                load();
                              }} style={{ padding:'4px 10px', border:'none', borderRadius:6, cursor:'pointer',
                                fontSize:'0.72rem', fontWeight:600,
                                background:s==='approved'?'#d1fae5':'#fee2e2',
                                color:s==='approved'?'#065f46':'#991b1b' }}>
                                {s==='approved'?'✓ Approve':'✕ Reject'}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaveRequests.length === 0 && (
                    <tr><td colSpan={9} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>No leave requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYROLL ───────────────────────────── */}
      {!loading && tab === 'payroll' && (
        <div>
          {/* Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1.25rem', marginBottom:'1.5rem' }}>
            {[
              { l:'Total Gross', v:fmtMoney(payrollTotals.total_gross), color:'var(--color-primary)' },
              { l:'Total Net', v:fmtMoney(payrollTotals.total_net), color:'#065f46' },
              { l:'Total Tax', v:fmtMoney(payrollTotals.total_tax), color:'#92400e' },
              { l:'Records', v:payrollTotals.count||0, color:'#1e40af' },
            ].map(({ l, v, color }) => (
              <div key={l} style={{ background:'white', borderRadius:16, padding:'1.5rem',
                boxShadow:'0 2px 12px rgba(0,0,0,0.06)', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:'1.5rem', fontWeight:700, color }}>{v}</div>
                <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                    {['Employee','Dept','Period','Basic','OT/Bonus','Gross','Tax','Net','Status','Actions'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'0.875rem 1.25rem', color:'#64748b',
                        fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payroll.map(p => (
                    <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        <div style={{ fontWeight:600 }}>{p.first_name} {p.last_name}</div>
                        <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{p.emp_code}</div>
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#64748b', fontSize:'0.82rem' }}>{p.department||'—'}</td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#64748b', fontSize:'0.78rem', whiteSpace:'nowrap' }}>
                        {p.pay_period_start}<br />{p.pay_period_end}
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>{fmtMoney(p.basic_salary)}</td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#065f46' }}>
                        +{fmtMoney(Number(p.overtime_pay||0)+Number(p.bonus||0))}
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem', fontWeight:700 }}>{fmtMoney(p.gross_salary)}</td>
                      <td style={{ padding:'0.875rem 1.25rem', color:'#ef4444' }}>-{fmtMoney(p.tax_deduction)}</td>
                      <td style={{ padding:'0.875rem 1.25rem', fontWeight:700, color:'var(--color-primary)' }}>
                        {fmtMoney(p.net_salary)}
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        {statusBadge(p.status, {
                          draft:{ bg:'#fef3c7',color:'#92400e' },
                          approved:{ bg:'#dbeafe',color:'#1e40af' },
                          paid:{ bg:'#d1fae5',color:'#065f46' },
                          cancelled:{ bg:'#f3f4f6',color:'#6b7280' },
                        })}
                      </td>
                      <td style={{ padding:'0.875rem 1.25rem' }}>
                        {p.status === 'draft' && (
                          <button onClick={async () => {
                            await adminApi.put(`/hr/payroll/${p.id}/status`, { status:'approved' });
                            load();
                          }} style={{ padding:'4px 12px', background:'#dbeafe', color:'#1e40af',
                            border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                            Approve
                          </button>
                        )}
                        {p.status === 'approved' && (
                          <button onClick={async () => {
                            const ref = prompt('Enter payment reference/transaction ID:');
                            if (!ref) return;
                            await adminApi.put(`/hr/payroll/${p.id}/status`, { status:'paid', transaction_reference:ref });
                            load();
                          }} style={{ padding:'4px 12px', background:'#d1fae5', color:'#065f46',
                            border:'none', borderRadius:6, cursor:'pointer', fontSize:'0.78rem', fontWeight:600 }}>
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payroll.length === 0 && (
                    <tr><td colSpan={10} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
                      No payroll records. Click "Generate Payroll" to create for all active employees.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PERFORMANCE ───────────────────────── */}
      {!loading && tab === 'performance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {reviews.length === 0
            ? <div style={{ textAlign:'center', padding:'4rem', background:'white', borderRadius:16, color:'#94a3b8' }}>
                No performance reviews yet
              </div>
            : reviews.map(r => (
            <div key={r.id} style={{ background:'white', borderRadius:16, padding:'1.5rem',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--color-primary)' }}>
                    {r.first_name} {r.last_name}
                    <span style={{ fontSize:'0.75rem', color:'#94a3b8', marginLeft:'0.5rem' }}>{r.emp_code}</span>
                  </div>
                  <div style={{ fontSize:'0.82rem', color:'#64748b', marginTop:2 }}>
                    {r.department} · {r.review_type?.replace('_',' ')} · {r.review_period_start} to {r.review_period_end}
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:1 }}>
                    Reviewed by: {r.reviewer_name||'—'}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
                  {r.overall_rating && (
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-heading)', fontSize:'1.75rem', fontWeight:700,
                        color: r.overall_rating>=4?'#065f46':r.overall_rating>=3?'#d97706':'#991b1b' }}>
                        {r.overall_rating}/5
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Overall</div>
                    </div>
                  )}
                  {statusBadge(r.status, {
                    draft:{ bg:'#fef3c7',color:'#92400e' },
                    submitted:{ bg:'#dbeafe',color:'#1e40af' },
                    acknowledged:{ bg:'#d1fae5',color:'#065f46' },
                    completed:{ bg:'#f3f4f6',color:'#374151' },
                  })}
                </div>
              </div>
              {(r.strengths||r.areas_for_improvement) && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'1rem',
                  padding:'1rem', background:'#f8fafc', borderRadius:10 }}>
                  {r.strengths && (
                    <div>
                      <div style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em',
                        color:'#065f46', fontWeight:600, marginBottom:4 }}>Strengths</div>
                      <div style={{ fontSize:'0.85rem', color:'#374151' }}>{r.strengths}</div>
                    </div>
                  )}
                  {r.areas_for_improvement && (
                    <div>
                      <div style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em',
                        color:'#d97706', fontWeight:600, marginBottom:4 }}>Areas for Improvement</div>
                      <div style={{ fontSize:'0.85rem', color:'#374151' }}>{r.areas_for_improvement}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ANNOUNCEMENTS ─────────────────────── */}
      {!loading && tab === 'announcements' && (
        <div>
          {showForm && (
            <AnnouncementForm
              onSave={async (data) => {
                await adminApi.post('/hr/announcements', data);
                setShowForm(false);
                load();
              }}
              onCancel={() => setShowForm(false)} />
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {announcements.map(a => (
              <div key={a.id} style={{ background:'white', borderRadius:16, padding:'1.5rem',
                boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
                borderLeft:`4px solid ${{ urgent:'#ef4444',policy:'var(--color-primary)',event:'#7c3aed',training:'#d97706',general:'#94a3b8' }[a.category]||'#94a3b8'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.625rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    {a.is_pinned && <span style={{ fontSize:'0.8rem' }}>📌</span>}
                    <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.1rem', color:'var(--color-primary)', margin:0 }}>{a.title}</h3>
                  </div>
                  <span style={{ fontSize:'0.72rem', padding:'3px 10px', borderRadius:999, fontWeight:600, textTransform:'capitalize',
                    background:{ urgent:'#fee2e2',policy:'#eff6ff',event:'#f5f3ff',training:'#fef3c7',general:'#f3f4f6' }[a.category]||'#f3f4f6',
                    color:{ urgent:'#991b1b',policy:'#1e40af',event:'#7c3aed',training:'#92400e',general:'#6b7280' }[a.category]||'#6b7280' }}>
                    {a.category}
                  </span>
                </div>
                <div style={{ fontSize:'0.875rem', color:'#4b5563', lineHeight:1.75 }}
                  dangerouslySetInnerHTML={{ __html: a.content }} />
                <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:'0.75rem' }}>
                  By {a.created_by_name} · {new Date(a.published_at||a.created_at).toLocaleDateString()}
                  {a.expires_at && ` · Expires: ${new Date(a.expires_at).toLocaleDateString()}`}
                </div>
              </div>
            ))}
            {announcements.length === 0 && !showForm && (
              <div style={{ textAlign:'center', padding:'4rem', background:'white', borderRadius:16, color:'#94a3b8' }}>
                No announcements yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee Detail Slide-out */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setSelectedEmployee(null)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, backdropFilter:'blur(4px)' }} />
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', damping:28, stiffness:300 }}
              style={{ position:'fixed', right:0, top:0, bottom:0, width:400, background:'white',
                zIndex:201, overflowY:'auto', boxShadow:'-4px 0 40px rgba(0,0,0,0.12)' }}>
              <div style={{ padding:'2rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                  <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.4rem', color:'var(--color-primary)' }}>
                    Employee Profile
                  </h2>
                  <button onClick={() => setSelectedEmployee(null)}
                    style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8' }}>×</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem',
                  padding:'1.25rem', background:'#f8fafc', borderRadius:12 }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--color-primary)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontWeight:700, fontSize:'1.2rem', flexShrink:0 }}>
                    {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--color-primary)' }}>
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </div>
                    <div style={{ fontSize:'0.82rem', color:'#64748b' }}>{selectedEmployee.job_title}</div>
                    <div style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'var(--color-secondary)', fontWeight:700 }}>
                      {selectedEmployee.employee_id}
                    </div>
                  </div>
                </div>
                {[
                  ['Department', selectedEmployee.department_name||'—'],
                  ['Email', selectedEmployee.email],
                  ['Phone', selectedEmployee.phone||'—'],
                  ['Employment Type', selectedEmployee.employment_type?.replace('_',' ')],
                  ['Hire Date', selectedEmployee.hire_date],
                  ['Base Salary', fmtMoney(selectedEmployee.base_salary)],
                  ['Status', selectedEmployee.employment_status?.replace('_',' ')],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between',
                    padding:'0.625rem 0', borderBottom:'1px solid #f1f5f9', fontSize:'0.875rem' }}>
                    <span style={{ color:'#64748b' }}>{l}</span>
                    <span style={{ fontWeight:500, textTransform:'capitalize', textAlign:'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Employee Form */}
      <AnimatePresence>
        {showForm && tab === 'employees' && (
          <EmployeeForm
            departments={departments}
            onSave={async (data) => {
              await adminApi.post('/hr/employees', data);
              setShowForm(false); load();
            }}
            onCancel={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeForm({ departments, onSave, onCancel }) {
  const [form, setForm] = useState({ employment_status:'active', employment_type:'full_time', job_level:'junior', pay_frequency:'monthly', salary_currency:'USD' });
  const [saving, setSaving] = useState(false);
  const u = (k,v) => setForm(p => ({...p,[k]:v}));

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200 }} />
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
        style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:'90%', maxWidth:700, maxHeight:'90vh', overflowY:'auto', background:'white',
          borderRadius:20, padding:'2rem', zIndex:201, boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.5rem', color:'var(--color-primary)' }}>Add Employee</h2>
          <button onClick={onCancel} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8' }}>×</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          {[
            { k:'first_name',l:'First Name *',req:true },{ k:'last_name',l:'Last Name *',req:true },
            { k:'email',l:'Email *',t:'email',req:true },{ k:'phone',l:'Phone' },
            { k:'job_title',l:'Job Title *',req:true,full:true },
            { k:'hire_date',l:'Hire Date *',t:'date',req:true },{ k:'date_of_birth',l:'Date of Birth',t:'date' },
            { k:'base_salary',l:'Base Salary',t:'number' },{ k:'national_id',l:'National ID' },
            { k:'address',l:'Address',full:true },
            { k:'emergency_contact_name',l:'Emergency Contact Name' },{ k:'emergency_contact_phone',l:'Emergency Contact Phone' },
          ].map(({ k,l,t='text',req,full }) => (
            <div key={k} style={{ gridColumn:full?'1/-1':undefined }}>
              <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase',
                color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
              <input type={t} required={req} value={form[k]||''}
                onChange={e => u(k,e.target.value)}
                style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                  borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
            </div>
          ))}
          {[
            { k:'department_id',l:'Department',opts:departments.map(d=>({v:d.id,l:d.name})) },
            { k:'employment_type',l:'Employment Type',opts:['full_time','part_time','contract','temporary','intern'].map(v=>({v,l:v.replace('_',' ')})) },
            { k:'job_level',l:'Job Level',opts:['intern','junior','mid','senior','lead','manager','director','executive'].map(v=>({v,l:v})) },
            { k:'gender',l:'Gender',opts:['male','female','other','prefer_not_to_say'].map(v=>({v,l:v.replace(/_/g,' ')})) },
            { k:'pay_frequency',l:'Pay Frequency',opts:['weekly','biweekly','monthly'].map(v=>({v,l:v})) },
            { k:'salary_currency',l:'Currency',opts:['USD','EUR','GBP','AUD','JPY','CAD'].map(v=>({v,l:v})) },
          ].map(({ k,l,opts }) => (
            <div key={k}>
              <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase',
                color:'#475569', display:'block', marginBottom:4 }}>{l}</label>
              <select value={form[k]||''} onChange={e => u(k,e.target.value)}
                style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0',
                  borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }}>
                <option value="">Select...</option>
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem', justifyContent:'flex-end' }}>
          <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button disabled={saving} onClick={async () => {
            setSaving(true);
            try { await onSave(form); }
            catch(e) { alert(e.response?.data?.error||'Failed'); setSaving(false); }
          }} className="btn btn-primary">{saving?'Saving...':'Create Employee'}</button>
        </div>
      </motion.div>
    </>
  );
}

function AnnouncementForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ title:'', content:'', category:'general', is_pinned:false });
  const [saving, setSaving] = useState(false);
  return (
    <div style={{ background:'white', borderRadius:16, padding:'1.75rem',
      boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'1.5rem' }}>
      <h3 style={{ fontFamily:'var(--font-heading)', fontSize:'1.2rem', color:'var(--color-primary)', marginBottom:'1.25rem' }}>
        New Announcement
      </h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>Title *</label>
          <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}
            style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0', borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }} />
        </div>
        <div>
          <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>Category</label>
          <select value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))}
            style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0', borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none' }}>
            {['general','policy','event','training','urgent'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <input type="checkbox" id="pin" checked={form.is_pinned} onChange={e => setForm(p=>({...p,is_pinned:e.target.checked}))} />
          <label htmlFor="pin" style={{ fontSize:'0.875rem', cursor:'pointer' }}>📌 Pin this announcement</label>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', display:'block', marginBottom:4 }}>Content *</label>
          <textarea value={form.content} rows={5} onChange={e => setForm(p=>({...p,content:e.target.value}))}
            style={{ width:'100%', padding:'0.625rem 0.875rem', border:'1.5px solid #e2e8f0', borderRadius:6, fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', resize:'vertical' }} />
        </div>
      </div>
      <div style={{ display:'flex', gap:'1rem', marginTop:'1rem' }}>
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button disabled={saving} onClick={async () => {
          if (!form.title||!form.content) return alert('Title and content required');
          setSaving(true);
          try { await onSave(form); } catch { setSaving(false); }
        }} className="btn btn-primary">{saving?'Posting...':'Post Announcement'}</button>
      </div>
    </div>
  );
}
