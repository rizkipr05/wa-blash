import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  LogOut, Users, Smartphone, Wallet, CheckCircle, 
  Activity, ArrowRight, ShieldAlert, Monitor, Banknote
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: <Activity size={20} />, path: '/admin', active: true },
    { label: 'Users', icon: <Users size={20} />, path: '/admin/users' },
    { label: 'Withdrawals', icon: <Banknote size={20} />, path: '/admin/withdrawals' },
    { label: 'Portal', icon: <ArrowRight size={20} />, path: '/dashboard' },
  ];

  if (!stats) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa', color: '#636e72' }}>Loading Admin Panel...</div>;

  const summaryCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={24} />, color: '#0984e3', bg: '#ebf5ff' },
    { label: 'Active WA', value: stats.activeDevices, icon: <CheckCircle size={24} />, color: '#00b894', bg: '#e6fff9' },
    { label: 'Total WA', value: stats.totalDevices, icon: <Smartphone size={24} />, color: '#6c5ce7', bg: '#f3e8ff' },
    { label: 'Pending WD', value: stats.pendingWithdrawals, icon: <Wallet size={24} />, color: '#ff7675', bg: '#fff5f5' },
  ];

  return (
    <div className="dashboard-container" style={{ background: '#f0f2f5' }}>
      <main className="dashboard-main">
        <header className="dashboard-header" style={{ borderBottom: '2px solid #ff7675' }}>
          <div className="header-left">
            <div className="header-logo" style={{ background: '#ff7675' }}>
              <ShieldAlert size={20} color="white" />
            </div>
            <div>
              <h1 className="header-title">Admin Panel</h1>
              <p style={{ fontSize: '0.65rem', color: '#d63031', fontWeight: 700 }}>RESTRICTED ACCESS</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="stats-grid" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          {summaryCards.map((stat, index) => (
            <div key={index} className="stat-card" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="action-bar" style={{ background: '#fff' }}>
          <div className="title-group">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Banknote size={20} color="#ff7675" />
              Pending Withdrawals Amount
            </h3>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d63031' }}>
            Rp {Number(stats.pendingWithdrawalsAmount).toLocaleString('id-ID')}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
          
          <div className="info-card">
            <div className="card-header">
              <Users size={18} color="#0984e3" />
              <h3>Recent Users</h3>
            </div>
            <div className="device-items-list">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="info-row" style={{ padding: '0.75rem', borderBottom: '1px solid #f1f2f6' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{user.username}</span>
                    <span style={{ fontSize: '0.7rem', color: '#b2bec3' }}>{new Date(user.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: '#ebf5ff', color: '#0984e3' }}>
                    {user.rank}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/admin/users" style={{ display: 'block', textAlign: 'center', padding: '1rem', color: '#0984e3', fontWeight: 600, textDecoration: 'none' }}>
              View All Users →
            </Link>
          </div>

          <div className="info-card">
            <div className="card-header">
              <Wallet size={18} color="#ff7675" />
              <h3>Recent Withdrawals</h3>
            </div>
            <div className="device-items-list">
              {stats.recentWithdrawals.map((wd) => (
                <div key={wd.id} className="info-row" style={{ padding: '0.75rem', borderBottom: '1px solid #f1f2f6' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{wd.user.username}</span>
                    <span style={{ fontSize: '0.8rem', color: '#636e72', fontWeight: 600 }}>Rp {Number(wd.amount).toLocaleString('id-ID')}</span>
                  </div>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: wd.status === 'PENDING' ? '#fff9eb' : wd.status === 'APPROVED' ? '#e6fff9' : '#fff5f5', color: wd.status === 'PENDING' ? '#fdcb6e' : wd.status === 'APPROVED' ? '#00b894' : '#ff7675' }}>
                    {wd.status}
                  </span>
                </div>
              ))}
              {stats.recentWithdrawals.length === 0 && (
                <p style={{ textAlign: 'center', color: '#b2bec3', padding: '2rem 0' }}>No recent withdrawals</p>
              )}
            </div>
            <Link to="/admin/withdrawals" style={{ display: 'block', textAlign: 'center', padding: '1rem', color: '#ff7675', fontWeight: 600, textDecoration: 'none' }}>
              Manage Withdrawals →
            </Link>
          </div>

        </div>

        <nav className="bottom-nav" style={{ borderTop: '2px solid #ff7675' }}>
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className={`nav-item ${item.active ? 'active' : ''}`} style={item.active ? { color: '#d63031', background: '#fff5f5' } : {}}>
              <div className="nav-item-icon">
                {item.icon}
              </div>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default AdminDashboard;
