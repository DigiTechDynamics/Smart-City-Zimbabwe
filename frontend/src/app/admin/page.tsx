"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchIssues, fetchHotspots, fetchWorkforce, createWorkforce, assignIssue, dispatchWorkforce, updateIssueStatus, addWorkforceMember, getWorkforceMembers, fetchDeptSLA, fetchCategories, createCategory, updateWorkforceMember } from '../lib/api';
import { useRouter } from 'next/navigation';

const DynamicMap = dynamic(() => import('../components/Map'), { ssr: false, loading: () => <div style={{height:'400px',display:'flex',alignItems:'center',justifyContent:'center'}}>Loading Map...</div> });

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [issues, setIssues] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [workforce, setWorkforce] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sla, setSla] = useState<any>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState('Available');
  const [dispatchLocation, setDispatchLocation] = useState('');

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');

  // Members state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersTeam, setMembersTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({ full_name:'', email:'', phone:'', password:'', department:'' });
  const [memberError, setMemberError] = useState('');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editMemberData, setEditMemberData] = useState({ full_name:'', email:'', phone:'', role:'' });

  // Categories state
  const [adminCategories, setAdminCategories] = useState<any[]>([]);
  const [selectedCategorySector, setSelectedCategorySector] = useState<string>('electricity');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadData = async (parsedUser: any) => {
    try {
      const [issuesData, hotspotsData, wfData, slaData] = await Promise.all([
        fetchIssues(parsedUser.department),
        fetchHotspots(),
        fetchWorkforce(parsedUser.department),
        fetchDeptSLA(parsedUser.department),
      ]);
      setIssues(issuesData);
      setHotspots(hotspotsData.filter((h: any) => h.sector === parsedUser.department));
      setWorkforce(wfData);
      setSla(slaData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const stored = localStorage.getItem('adminUser');
    if (!stored) { router.push('/admin/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setSelectedCategorySector(u.department || 'electricity');
    loadData(u);
  }, [router]);

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories(selectedCategorySector).then(setAdminCategories).catch(console.error);
    }
  }, [activeTab, selectedCategorySector]);

  const handleLogout = () => { localStorage.removeItem('adminUser'); router.push('/admin/login'); };
  const handleAssign = async (wfId: number) => { try { await assignIssue(selectedTicket.reference_number, wfId); setShowAssignModal(false); loadData(user); } catch { alert('Failed'); } };
  const handleAddTeam = async () => { if (!newTeamName) return; try { await createWorkforce({ name: newTeamName, department: user.department }); setShowAddTeamModal(false); setNewTeamName(''); loadData(user); } catch { alert('Failed'); } };
  const handleDispatch = async () => { try { await dispatchWorkforce(selectedTeam.id, { status: dispatchStatus, location: dispatchLocation }); setShowDispatchModal(false); loadData(user); } catch { alert('Failed'); } };
  const handleUpdateStatus = async () => { try { await updateIssueStatus(selectedTicket.reference_number, updateStatus); setShowUpdateModal(false); loadData(user); } catch { alert('Failed'); } };

  const openMembersModal = async (team: any) => {
    setMembersTeam(team);
    setShowMembersModal(true);
    setShowAddMemberForm(false);
    setMemberError('');
    try { const m = await getWorkforceMembers(team.id); setMembers(m); } catch { setMembers([]); }
  };

  const handleAddMember = async () => {
    setMemberError('');
    try {
      await addWorkforceMember(membersTeam.id, { ...newMember, department: user.department });
      setNewMember({ full_name:'', email:'', phone:'', password:'', department:'' });
      setShowAddMemberForm(false);
      const m = await getWorkforceMembers(membersTeam.id);
      setMembers(m);
    } catch (e: any) { setMemberError(e.message); }
  };

  const handleEditMember = async () => {
    setMemberError('');
    try {
      await updateWorkforceMember(membersTeam.id, editingMember.id, editMemberData);
      setEditingMember(null);
      const m = await getWorkforceMembers(membersTeam.id);
      setMembers(m);
    } catch (e: any) { setMemberError(e.message); }
  };

  const stats = [
    { label:'Pending', count: issues.filter(i => i.status==='reported').length, color:'var(--accent-roads)' },
    { label:'In Progress', count: issues.filter(i => i.status==='in_progress').length, color:'var(--accent-water)' },
    { label:'Resolved', count: issues.filter(i => i.status==='resolved').length, color:'#4caf50' },
    { label:'Critical', count: issues.filter(i => i.priority==='critical').length, color:'var(--accent-urgent)' },
  ];

  const deptLabel = (d: string) => ({ electricity:'Electricity', water_sewer:'Water & Sewer', roads_infra:'Roads & Infra' }[d] || d);
  const deptColor = (d: string) => ({ electricity:'var(--accent-electricity)', water_sewer:'var(--accent-water)', roads_infra:'var(--accent-roads)' }[d] || '#fff');

  const navItems = [
    { id:'overview', icon:'📊', label:'Overview' },
    { id:'tickets', icon:'🎫', label:'Tickets' },
    { id:'workforce', icon:'👷', label:'Workforce' },
    { id:'hotspots', icon:'📍', label:'Hotspots' },
    { id:'categories', icon:'🏷️', label:'Categories' },
  ];

  const renderContent = () => {
    if (activeTab === 'overview') return (
      <>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px', marginBottom:'36px' }}>
          {stats.map(s => (
            <div key={s.label} className="glass-card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', fontWeight:'bold', color:s.color }}>{s.count}</div>
              <div style={{ color:'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'28px' }}>
          <div className="glass-card">
            <h3>Recent Tickets</h3>
            <div style={{ marginTop:'16px' }}>
              {issues.slice(0,5).map((t: any) => (
                <div key={t.id} style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight:'bold' }}>{t.reference_number} – {t.category}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => { setSelectedTicket(t); setShowAssignModal(true); }}
                    style={{ background:'transparent', border:'1px solid var(--accent-electricity)', color:'var(--accent-electricity)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer', height:'fit-content' }}>
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dept-scoped SLA */}
          <div className="glass-card">
            <h3>SLA Performance</h3>
            <div style={{ marginTop:'20px' }}>
              {sla ? (
                <>
                  <div style={{ textAlign:'center', marginBottom:'24px' }}>
                    <div style={{ fontSize:'3rem', fontWeight:'800', color: sla.sla_pct >= 70 ? '#4caf50' : 'var(--accent-urgent)' }}>{sla.sla_pct}%</div>
                    <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>{deptLabel(user?.department)} SLA</div>
                    <div style={{ height:'8px', background:'rgba(255,255,255,0.1)', borderRadius:'4px', marginTop:'12px' }}>
                      <div style={{ height:'100%', width:`${sla.sla_pct}%`, background: sla.sla_pct >= 70 ? '#4caf50' : 'var(--accent-urgent)', borderRadius:'4px', transition:'width 1s ease' }} />
                    </div>
                  </div>
                  {[
                    { label:'Total Issues', value: sla.total },
                    { label:'Resolved', value: sla.resolved },
                    { label:'In Progress', value: sla.in_progress },
                    { label:'Pending', value: sla.pending },
                    { label:'Critical', value: sla.critical },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-color)', fontSize:'0.9rem' }}>
                      <span style={{ color:'var(--text-secondary)' }}>{r.label}</span>
                      <span style={{ fontWeight:'600' }}>{r.value}</span>
                    </div>
                  ))}
                </>
              ) : <p style={{ color:'var(--text-secondary)' }}>Loading SLA...</p>}
            </div>
          </div>
        </div>
      </>
    );

    if (activeTab === 'tickets') return (
      <div className="glass-card">
        <h3 style={{ marginBottom:'20px' }}>All {deptLabel(user?.department)} Tickets</h3>
        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
          <thead style={{ background:'rgba(255,255,255,0.05)' }}>
            <tr>{['Ref','Category','Status','Priority','Action'].map(h => <th key={h} style={{ padding:'14px 16px', fontSize:'0.8rem', color:'var(--text-secondary)', textTransform:'uppercase' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {issues.map((i: any) => (
              <tr key={i.id} style={{ borderTop:'1px solid var(--border-color)' }}>
                <td style={{ padding:'14px 16px', fontWeight:'600' }}>{i.reference_number}</td>
                <td style={{ padding:'14px 16px' }}>{i.category}</td>
                <td style={{ padding:'14px 16px' }}><span className={`status-badge status-${i.status}`}>{i.status}</span></td>
                <td style={{ padding:'14px 16px', color: i.priority==='critical' ? 'var(--accent-urgent)' : 'inherit' }}>{i.priority}</td>
                <td style={{ padding:'14px 16px' }}>
                  <button onClick={() => { setSelectedTicket(i); setUpdateStatus(i.status); setShowUpdateModal(true); }}
                    style={{ background:'transparent', border:'1px solid var(--accent-electricity)', color:'var(--accent-electricity)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer' }}>
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    if (activeTab === 'workforce') return (
      <div className="glass-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3>Workforce Teams – {deptLabel(user?.department)}</h3>
          <button className="btn-primary" onClick={() => setShowAddTeamModal(true)} style={{ padding:'8px 18px', fontSize:'0.9rem' }}>+ Add Team</button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
          <thead style={{ background:'rgba(255,255,255,0.05)' }}>
            <tr>{['Team','Status','Task','Location','Members','Actions'].map(h => <th key={h} style={{ padding:'14px 16px', fontSize:'0.8rem', color:'var(--text-secondary)', textTransform:'uppercase' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {workforce.map((team: any) => (
              <tr key={team.id} style={{ borderTop:'1px solid var(--border-color)' }}>
                <td style={{ padding:'14px 16px', fontWeight:'700' }}>{team.name}</td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'600',
                    background: team.status==='Available' ? 'rgba(76,175,80,0.15)' : team.status==='On Site' ? 'rgba(255,152,0,0.15)' : 'rgba(33,150,243,0.15)',
                    color: team.status==='Available' ? '#4caf50' : team.status==='On Site' ? '#ff9800' : '#2196f3' }}>
                    {team.status}
                  </span>
                </td>
                <td style={{ padding:'14px 16px', color:'var(--text-secondary)' }}>{team.task || '—'}</td>
                <td style={{ padding:'14px 16px' }}>{team.location}</td>
                <td style={{ padding:'14px 16px' }}>
                  <button onClick={() => openMembersModal(team)}
                    style={{ background:'rgba(0,210,255,0.1)', border:'1px solid rgba(0,210,255,0.3)', color:'var(--accent-electricity)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer', fontSize:'0.85rem' }}>
                    👥 {team.members?.length ?? 0}
                  </button>
                </td>
                <td style={{ padding:'14px 16px', display:'flex', gap:'8px' }}>
                  <button onClick={() => { setSelectedTeam(team); setDispatchStatus(team.status); setDispatchLocation(team.location); setShowDispatchModal(true); }}
                    style={{ background:'transparent', border:'1px solid var(--accent-electricity)', color:'var(--accent-electricity)', borderRadius:'6px', padding:'5px 12px', cursor:'pointer' }}>
                    Dispatch
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    if (activeTab === 'hotspots') return (
      <div className="glass-card" style={{ height:'600px', display:'flex', flexDirection:'column' }}>
        <h3>{deptLabel(user?.department)} Hotspots</h3>
        <p style={{ color:'var(--text-secondary)', margin:'8px 0 16px' }}>Geospatial view of issues in your sector.</p>
        <div style={{ flex:1, borderRadius:'12px', overflow:'hidden' }}><DynamicMap issues={hotspots} /></div>
      </div>
    );

    if (activeTab === 'categories') return (
      <div className="glass-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3>Manage Categories</h3>
          <button className="btn-primary" onClick={() => setShowAddCategoryModal(true)} style={{ padding:'8px 18px', fontSize:'0.9rem' }}>+ Add Category</button>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ marginRight: '10px' }}>Select Sector:</label>
          <select 
            value={selectedCategorySector} 
            onChange={e => setSelectedCategorySector(e.target.value)}
            style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          >
            <option value="electricity">Electricity</option>
            <option value="water_sewer">Water & Sewer</option>
            <option value="roads_infra">Roads & Infrastructure</option>
            <option value="waste_management">Waste Management</option>
            <option value="emergency_services">Emergency Services</option>
            <option value="public_health">Public Health</option>
          </select>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
          <thead style={{ background:'rgba(255,255,255,0.05)' }}>
            <tr><th style={{ padding:'14px 16px', fontSize:'0.8rem', color:'var(--text-secondary)', textTransform:'uppercase' }}>Category Name</th></tr>
          </thead>
          <tbody>
            {adminCategories.length === 0 ? (
              <tr><td style={{ padding:'14px 16px', color:'var(--text-secondary)' }}>No categories found for this sector.</td></tr>
            ) : (
              adminCategories.map((c: any) => (
                <tr key={c.id} style={{ borderTop:'1px solid var(--border-color)' }}>
                  <td style={{ padding:'14px 16px', fontWeight:'600' }}>{c.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const modalStyle: React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 };
  const inputStyle: React.CSSProperties = { width:'100%', padding:'11px', marginTop:'10px', background:'rgba(0,0,0,0.5)', border:'1px solid var(--border-color)', color:'#fff', borderRadius:'8px' };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <aside style={{ width:'270px', background:'rgba(0,0,0,0.6)', padding:'28px 20px', borderRight:'1px solid var(--border-color)', display:'flex', flexDirection:'column' }}>
        <h2 style={{ marginBottom:'4px', fontSize:'1.3rem', background:'linear-gradient(to right,#fff,var(--accent-electricity))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Smart Zimbabwe</h2>
        <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'24px' }}>Admin Dashboard</p>
        <div style={{ padding:'14px', background:'rgba(255,255,255,0.05)', borderRadius:'12px', marginBottom:'28px' }}>
          <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>Signed in as</div>
          <div style={{ fontWeight:'700', marginTop:'4px' }}>{user?.full_name}</div>
          <div style={{ fontSize:'0.75rem', color: deptColor(user?.department), marginTop:'4px', textTransform:'uppercase' }}>{deptLabel(user?.department)}</div>
        </div>
        <nav style={{ flex:1 }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)}
              style={{ padding:'12px', borderRadius:'10px', marginBottom:'8px', cursor:'pointer', background: activeTab===item.id ? 'rgba(255,255,255,0.08)' : 'transparent', transition:'all 0.2s' }}>
              {item.icon} {item.label}
            </div>
          ))}
          <hr style={{ border:'none', borderTop:'1px solid var(--border-color)', margin:'16px 0' }} />
          <a href="/workforce/login" style={{ display:'block', padding:'12px', borderRadius:'10px', color:'var(--accent-electricity)', textDecoration:'none', fontSize:'0.9rem' }}>
            👷 Workforce Portal →
          </a>
        </nav>
        <button onClick={handleLogout} style={{ background:'rgba(255,75,43,0.1)', color:'var(--accent-urgent)', border:'none', padding:'12px', borderRadius:'10px', cursor:'pointer', fontWeight:'bold' }}>
          🚪 Sign Out
        </button>
      </aside>

      <main style={{ flex:1, padding:'36px', background:'rgba(10,12,16,0.5)', overflowY:'auto' }}>
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'36px' }}>
          <div>
            <h1 className="animate-fade">Departmental Dashboard</h1>
            <p style={{ color:'var(--text-secondary)' }}>Managing {deptLabel(user?.department)} infrastructure</p>
          </div>
          <button className="btn-primary">Generate Report</button>
        </header>
        {loading ? <p style={{ color:'var(--text-secondary)' }}>Loading dashboard...</p> : renderContent()}
      </main>

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={modalStyle}>
          <div className="glass-card" style={{ width:'420px' }}>
            <h3>Assign {selectedTicket?.reference_number}</h3>
            <select style={inputStyle} onChange={e => setSelectedTeam(workforce.find(w => w.id === parseInt(e.target.value)))}>
              <option value="">Select Team</option>
              {workforce.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({w.status})</option>)}
            </select>
            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button className="btn-primary" onClick={() => handleAssign(selectedTeam?.id)}>Assign</button>
              <button style={{ background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'10px 20px', borderRadius:'8px', cursor:'pointer' }} onClick={() => setShowAssignModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div style={modalStyle}>
          <div className="glass-card" style={{ width:'420px' }}>
            <h3>Add Workforce Team</h3>
            <input type="text" placeholder="Team Name (e.g. Alpha Squad)" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={inputStyle} />
            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button className="btn-primary" onClick={handleAddTeam}>Create Team</button>
              <button style={{ background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'10px 20px', borderRadius:'8px', cursor:'pointer' }} onClick={() => setShowAddTeamModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div style={modalStyle}>
          <div className="glass-card" style={{ width:'420px' }}>
            <h3>Dispatch – {selectedTeam?.name}</h3>
            <select value={dispatchStatus} onChange={e => setDispatchStatus(e.target.value)} style={inputStyle}>
              <option value="Available">Available</option>
              <option value="En Route">En Route</option>
              <option value="On Site">On Site</option>
            </select>
            <input type="text" placeholder="Location" value={dispatchLocation} onChange={e => setDispatchLocation(e.target.value)} style={inputStyle} />
            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button className="btn-primary" onClick={handleDispatch}>Update</button>
              <button style={{ background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'10px 20px', borderRadius:'8px', cursor:'pointer' }} onClick={() => setShowDispatchModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && (
        <div style={modalStyle}>
          <div className="glass-card" style={{ width:'420px' }}>
            <h3>Update {selectedTicket?.reference_number}</h3>
            <select value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} style={inputStyle}>
              <option value="reported">Reported</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button className="btn-primary" onClick={handleUpdateStatus}>Update</button>
              <button style={{ background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'10px 20px', borderRadius:'8px', cursor:'pointer' }} onClick={() => setShowUpdateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div style={modalStyle}>
          <div className="glass-card" style={{ width:'420px' }}>
            <h3>Add Category for {selectedCategorySector}</h3>
            <input type="text" placeholder="Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={inputStyle} />
            <div style={{ display:'flex', gap:'10px', marginTop:'20px' }}>
              <button className="btn-primary" onClick={async () => {
                if (!newCategoryName) return;
                try {
                  await createCategory({ sector: selectedCategorySector, name: newCategoryName });
                  setNewCategoryName('');
                  setShowAddCategoryModal(false);
                  const cats = await fetchCategories(selectedCategorySector);
                  setAdminCategories(cats);
                } catch { alert('Failed to create category'); }
              }}>Create</button>
              <button style={{ background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'10px 20px', borderRadius:'8px', cursor:'pointer' }} onClick={() => setShowAddCategoryModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div style={modalStyle}>
          <div className="glass-card" style={{ width:'560px', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div>
                <h3>Team: {membersTeam?.name}</h3>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>SOD – Workforce Members</p>
              </div>
              <button onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                style={{ background:'linear-gradient(135deg,var(--accent-electricity),var(--accent-water))', border:'none', color:'#fff', padding:'8px 16px', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                + Add Member
              </button>
            </div>

            {showAddMemberForm && (
              <div style={{ background:'rgba(0,210,255,0.05)', border:'1px solid rgba(0,210,255,0.2)', borderRadius:'12px', padding:'20px', marginBottom:'20px' }}>
                <h4 style={{ marginBottom:'12px', color:'var(--accent-electricity)' }}>New Member Details</h4>
                {memberError && <p style={{ color:'var(--accent-urgent)', fontSize:'0.85rem', marginBottom:'10px' }}>⚠️ {memberError}</p>}
                <input type="text" placeholder="Full Name" value={newMember.full_name} onChange={e => setNewMember({...newMember, full_name:e.target.value})} style={inputStyle} />
                <input type="email" placeholder="Work Email" value={newMember.email} onChange={e => setNewMember({...newMember, email:e.target.value})} style={inputStyle} />
                <input type="tel" placeholder="Phone Number" value={newMember.phone} onChange={e => setNewMember({...newMember, phone:e.target.value})} style={inputStyle} />
                <input type="password" placeholder="Temporary Password" value={newMember.password} onChange={e => setNewMember({...newMember, password:e.target.value})} style={inputStyle} />
                <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
                  <button className="btn-primary" onClick={handleAddMember} style={{ flex:1 }}>Add Member</button>
                  <button onClick={() => setShowAddMemberForm(false)} style={{ flex:1, background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'10px', borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {editingMember && (
              <div style={{ background:'rgba(255,152,0,0.05)', border:'1px solid rgba(255,152,0,0.2)', borderRadius:'12px', padding:'20px', marginBottom:'20px' }}>
                <h4 style={{ marginBottom:'12px', color:'#ff9800' }}>Edit Member</h4>
                {memberError && <p style={{ color:'var(--accent-urgent)', fontSize:'0.85rem', marginBottom:'10px' }}>⚠️ {memberError}</p>}
                <input type="text" placeholder="Full Name" value={editMemberData.full_name} onChange={e => setEditMemberData({...editMemberData, full_name:e.target.value})} style={inputStyle} />
                <input type="email" placeholder="Work Email" value={editMemberData.email} onChange={e => setEditMemberData({...editMemberData, email:e.target.value})} style={inputStyle} />
                <input type="tel" placeholder="Phone Number" value={editMemberData.phone} onChange={e => setEditMemberData({...editMemberData, phone:e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Role (e.g. workforce, agent)" value={editMemberData.role} onChange={e => setEditMemberData({...editMemberData, role:e.target.value})} style={inputStyle} />
                <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
                  <button className="btn-primary" onClick={handleEditMember} style={{ flex:1, background:'linear-gradient(135deg, #ff9800, #ff5722)' }}>Save Changes</button>
                  <button onClick={() => setEditingMember(null)} style={{ flex:1, background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'10px', borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {members.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px', color:'var(--text-secondary)' }}>
                <div style={{ fontSize:'2.5rem' }}>👥</div>
                <p style={{ marginTop:'10px' }}>No members yet. Add the first member above.</p>
              </div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ background:'rgba(255,255,255,0.05)' }}>
                  <tr>{['Name','Email','Phone','Role','Actions'].map(h => <th key={h} style={{ padding:'12px 14px', fontSize:'0.78rem', color:'var(--text-secondary)', textTransform:'uppercase', textAlign:'left' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {members.map((m: any) => (
                    <tr key={m.id} style={{ borderTop:'1px solid var(--border-color)' }}>
                      <td style={{ padding:'12px 14px', fontWeight:'600' }}>{m.full_name}</td>
                      <td style={{ padding:'12px 14px', color:'var(--text-secondary)', fontSize:'0.88rem' }}>{m.email}</td>
                      <td style={{ padding:'12px 14px', color:'var(--text-secondary)', fontSize:'0.88rem' }}>{m.phone}</td>
                      <td style={{ padding:'12px 14px' }}><span style={{ background:'rgba(0,210,255,0.1)', color:'var(--accent-electricity)', padding:'3px 10px', borderRadius:'20px', fontSize:'0.78rem' }}>{m.role}</span></td>
                      <td style={{ padding:'12px 14px' }}>
                        <button onClick={() => { setEditingMember(m); setEditMemberData({ full_name: m.full_name, email: m.email, phone: m.phone, role: m.role }); setShowAddMemberForm(false); }}
                          style={{ background:'transparent', border:'1px solid var(--border-color)', color:'#fff', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'0.75rem' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ marginTop:'20px', textAlign:'right' }}>
              <button onClick={() => setShowMembersModal(false)} style={{ background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'10px 24px', borderRadius:'8px', cursor:'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
