"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getMyTickets, workforceUpdateTicketStatus } from '../lib/api';

const DynamicMap = dynamic(() => import('../components/Map'), { 
  ssr: false, 
  loading: () => <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.3)', borderRadius:'12px'}}>Loading Map...</div> 
});

const priorityColor: Record<string, string> = {
  critical: '#ff4b2b', high: '#ff9800', medium: '#00d2ff', low: '#4caf50'
};
const statusColor: Record<string, string> = {
  reported: '#ff9800', assigned: '#2196f3', in_progress: '#00d2ff', resolved: '#4caf50'
};

export default function WorkforceDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadTickets = async (u: any) => {
    try {
      const data = await getMyTickets(u.id);
      setTickets(data);
    } catch { /* no tickets yet */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const stored = localStorage.getItem('workforceUser');
    if (!stored) { router.push('/workforce/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    loadTickets(u);
  }, [router]);

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !newStatus) return;
    setUpdating(true);
    try {
      await workforceUpdateTicketStatus(user.id, selectedTicket.reference_number, newStatus);
      setShowModal(false);
      loadTickets(user);
    } catch (e: any) { alert(e.message); }
    finally { setUpdating(false); }
  };

  const open = tickets.filter(t => t.status !== 'resolved').length;
  const resolved = tickets.filter(t => t.status === 'resolved').length;
  const critical = tickets.filter(t => t.priority === 'critical').length;

  const sidebarItems = [
    { id: 'tickets', label: 'My Tickets', icon: '🎫' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* Sidebar */}
      <aside style={{ width:'260px', background:'rgba(0,0,0,0.65)', padding:'28px 20px', borderRight:'1px solid var(--border-color)', display:'flex', flexDirection:'column' }}>
        <h2 style={{ marginBottom:'8px', fontSize:'1.2rem', background:'linear-gradient(to right,#fff,var(--accent-electricity))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Smart Zimbabwe</h2>
        <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:'28px' }}>Workforce Portal</p>

        <div style={{ padding:'14px', background:'rgba(0,210,255,0.08)', borderRadius:'12px', marginBottom:'28px', border:'1px solid rgba(0,210,255,0.15)' }}>
          <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>Logged in as</div>
          <div style={{ fontWeight:'700', marginTop:'4px' }}>{user?.full_name}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--accent-electricity)', marginTop:'4px', textTransform:'uppercase' }}>{user?.department?.replace('_',' ')}</div>
        </div>

        <nav style={{ flex:1 }}>
          {sidebarItems.map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)}
              style={{ padding:'12px', borderRadius:'10px', marginBottom:'8px', cursor:'pointer', background: activeTab===item.id ? 'rgba(255,255,255,0.08)' : 'transparent', transition:'all 0.2s' }}>
              {item.icon} {item.label}
            </div>
          ))}
        </nav>

        <button onClick={() => { localStorage.removeItem('workforceUser'); router.push('/workforce/login'); }}
          style={{ background:'rgba(255,75,43,0.1)', color:'var(--accent-urgent)', border:'none', padding:'12px', borderRadius:'10px', cursor:'pointer', fontWeight:'bold' }}>
          🚪 Sign Out
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex:1, padding:'36px', overflowY:'auto' }}>
        <header style={{ marginBottom:'36px' }}>
          <h1 className="animate-fade">My Work Dashboard</h1>
          <p style={{ color:'var(--text-secondary)' }}>Track and update tickets assigned to your team</p>
        </header>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', marginBottom:'36px' }}>
          {[
            { label:'Open Tickets', value: open, color:'var(--accent-water)' },
            { label:'Resolved', value: resolved, color:'#4caf50' },
            { label:'Critical', value: critical, color:'var(--accent-urgent)' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', fontWeight:'800', color:s.color }}>{s.value}</div>
              <div style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {activeTab === 'tickets' && (
          <div className="glass-card">
            <h3 style={{ marginBottom:'20px' }}>Assigned Tickets</h3>
            {loading ? (
              <p style={{ color:'var(--text-secondary)' }}>Loading...</p>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'var(--text-secondary)' }}>
                <div style={{ fontSize:'3rem' }}>📭</div>
                <p style={{ marginTop:'12px' }}>No tickets assigned to your team yet.</p>
              </div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
                <thead style={{ background:'rgba(255,255,255,0.04)' }}>
                  <tr>
                    {['Reference','Sector','Category','Priority','Status','Action'].map(h => (
                      <th key={h} style={{ padding:'13px 16px', fontSize:'0.8rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t: any) => (
                    <tr key={t.id} style={{ borderTop:'1px solid var(--border-color)' }}>
                      <td style={{ padding:'14px 16px', fontWeight:'600', color:'var(--accent-electricity)' }}>{t.reference_number}</td>
                      <td style={{ padding:'14px 16px' }}>{t.sector?.replace('_',' ').toUpperCase()}</td>
                      <td style={{ padding:'14px 16px' }}>{t.category}</td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'600',
                          background:`${priorityColor[t.priority] || '#aaa'}22`, color: priorityColor[t.priority] || '#aaa' }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'600',
                          background:`${statusColor[t.status] || '#aaa'}22`, color: statusColor[t.status] || '#aaa' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <button onClick={() => { setSelectedTicket(t); setNewStatus(t.status); setShowModal(true); }}
                          style={{ background:'transparent', border:'1px solid var(--accent-electricity)', color:'var(--accent-electricity)', borderRadius:'6px', padding:'6px 14px', cursor:'pointer', fontSize:'0.85rem' }}>
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="glass-card" style={{ maxWidth:'500px' }}>
            <h3 style={{ marginBottom:'24px' }}>My Profile</h3>
            {[
              { label:'Full Name', value: user?.full_name },
              { label:'Email', value: user?.email },
              { label:'Department', value: user?.department?.replace('_',' ') },
              { label:'Role', value: user?.role },
            ].map(f => (
              <div key={f.label} style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border-color)' }}>
                <span style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{f.label}</span>
                <span style={{ fontWeight:'600', textTransform:'capitalize' }}>{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Update Status Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div className="glass-card" style={{ width:'800px', maxWidth:'90vw', display: 'flex', gap: '24px', flexWrap:'wrap' }}>
            
            {/* Left side: Details & Update Form */}
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ marginBottom:'6px' }}>Ticket Details</h3>
              <p style={{ color:'var(--accent-electricity)', fontSize:'1rem', marginBottom:'16px', fontWeight:'bold' }}>{selectedTicket?.reference_number}</p>
              
              <div style={{ background:'rgba(0,0,0,0.2)', padding:'16px', borderRadius:'12px', marginBottom:'20px', border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                  <div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'block' }}>Sector</span>
                    <span style={{ fontSize:'0.9rem', fontWeight:'600' }}>{selectedTicket?.sector?.replace('_',' ').toUpperCase()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'block' }}>Category</span>
                    <span style={{ fontSize:'0.9rem', fontWeight:'600' }}>{selectedTicket?.category}</span>
                  </div>
                  <div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'block' }}>Priority</span>
                    <span style={{ fontSize:'0.9rem', fontWeight:'600', color: priorityColor[selectedTicket?.priority] || '#fff' }}>{selectedTicket?.priority?.toUpperCase()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'block' }}>Status</span>
                    <span style={{ fontSize:'0.9rem', fontWeight:'600', color: statusColor[selectedTicket?.status] || '#fff' }}>{selectedTicket?.status?.toUpperCase()}</span>
                  </div>
                </div>
                
                {selectedTicket?.address && (
                  <div style={{ marginBottom:'12px' }}>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'block' }}>Address</span>
                    <span style={{ fontSize:'0.9rem' }}>{selectedTicket?.address}</span>
                  </div>
                )}
                
                <div>
                  <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', display:'block' }}>Description</span>
                  <p style={{ fontSize:'0.9rem', marginTop:'4px', lineHeight:'1.4', color:'var(--text-secondary)' }}>{selectedTicket?.description}</p>
                </div>
              </div>

              <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)', display:'block', marginBottom:'8px' }}>Update Status</span>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                style={{ width:'100%', padding:'12px', background:'rgba(0,0,0,0.5)', border:'1px solid var(--border-color)', color:'#fff', borderRadius:'8px' }}>
                <option value="reported">Reported</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              
              <div style={{ display:'flex', gap:'12px', marginTop:'24px' }}>
                <button className="btn-primary" onClick={handleUpdateStatus} disabled={updating} style={{ flex:1 }}>
                  {updating ? 'Saving...' : 'Save Update'}
                </button>
                <button onClick={() => setShowModal(false)}
                  style={{ flex:1, background:'transparent', color:'#fff', border:'1px solid var(--border-color)', padding:'12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' }}>
                  Close
                </button>
              </div>
            </div>

            {/* Right side: Map */}
            <div style={{ flex: '1 1 350px', minHeight: '350px', display:'flex', flexDirection:'column' }}>
              <h4 style={{ marginBottom:'12px', color:'var(--text-secondary)' }}>Location</h4>
              <div style={{ flex:1, borderRadius:'12px', overflow:'hidden', border:'1px solid var(--border-color)' }}>
                {(selectedTicket?.latitude && selectedTicket?.longitude) ? (
                  <DynamicMap issues={[{
                    ...selectedTicket,
                    lat: selectedTicket.latitude,
                    lng: selectedTicket.longitude,
                    ref: selectedTicket.reference_number
                  }]} />
                ) : (
                  <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.2)', color:'var(--text-secondary)' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'2rem', marginBottom:'8px' }}>📍</div>
                      No location coordinates available
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
