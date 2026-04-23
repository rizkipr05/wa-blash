import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Send, 
  DollarSign, 
  CreditCard, 
  Download, 
  PlusCircle, 
  MessageSquare, 
  Users, 
  User, 
  Home, 
  Wallet,
  TrendingUp,
  Zap,
  Sparkles
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/user/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const statItems = [
    { label: 'Aktif', value: stats?.activeDevices || '0', icon: <CheckCircle size={20} />, color: '#00b894', bg: '#e6fff9' },
    { label: 'Offline', value: (stats?.totalDevices - stats?.activeDevices) || '0', icon: <XCircle size={20} />, color: '#ff7675', bg: '#fff5f5' },
    { label: 'Total WA', value: stats?.totalDevices || '0', icon: <Send size={20} />, color: '#0984e3', bg: '#ebf5ff' },
    { label: 'Earning', value: `Rp${stats?.totalEarnings?.toLocaleString() || '0'}`, icon: <DollarSign size={20} />, color: '#fdcb6e', bg: '#fff9eb' },
  ];

  const quickLinks = [
    { label: 'WhatsApp', icon: <MessageSquare className="link-icon" size={24} />, path: '/whatsapp' },
    { label: 'Referral', icon: <Users className="link-icon" size={24} />, path: '/referral' },
    { label: 'Withdraw', icon: <Wallet className="link-icon" size={24} />, path: '/withdraw' },
  ];

  const navItems = [
    { label: 'Home', icon: <Home size={20} />, path: '/dashboard', active: true },
    { label: 'WhatsApp', icon: <MessageSquare size={20} />, path: '/whatsapp' },
    { label: 'Referral', icon: <Users size={20} />, path: '/referral' },
    { label: 'Withdraw', icon: <Wallet size={20} />, path: '/withdraw' },
    { label: 'Profil', icon: <User size={20} />, path: '/profile' },
  ];

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="header-logo">
              <img src="/src/assets/logo.png" alt="Logo" />
            </div>
            <div>
              <h1 className="header-title">TerimaWa</h1>
              <p style={{ fontSize: '0.65rem', color: '#636e72', fontWeight: 600 }}>Dashboard</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="welcome-card">
          <div className="welcome-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Sparkles size={20} color="#00b894" />
              <h2 style={{ margin: 0 }}>Halo, {localStorage.getItem('username') || 'Member'}!</h2>
            </div>
            <p>Selamat datang di dashboard TERIMAWA</p>
          </div>
          <TrendingUp color="#00b894" size={32} opacity={0.2} />
        </div>

        <div className="stats-grid">
          {statItems.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="wallet-card">
          <div className="wallet-header">
            <span>TOTAL BALANCE</span>
            <CreditCard size={16} />
          </div>
          <div className="wallet-balance">Rp {stats?.balance?.toLocaleString() || '0'}</div>
          <div className="wallet-actions">
            <button className="action-btn" onClick={() => navigate('/withdraw')}>
              <Download size={16} /> Withdraw
            </button>
            <button className="action-btn" onClick={() => navigate('/profile')}>
              <PlusCircle size={16} /> Tambah
            </button>
          </div>
        </div>

        <h3 className="section-title">Quick Link</h3>
        <div className="quick-links-grid">
          {quickLinks.map((link, index) => (
            <Link key={index} to={link.path} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="link-card">
                {link.icon}
                <span className="link-label">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <h3 className="section-title">Informasi</h3>
        <div className="info-section">
          <div className="info-card">
            <div className="info-card-header">
              <span>Program Referral</span>
              <Zap size={18} color="#00b894" />
            </div>
            <div className="info-row">
              <span className="info-label">Total Referral</span>
              <span className="info-value">{stats?.totalReferrals || '0'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Kode Komisi</span>
              <span className="info-value" style={{ color: '#fdcb6e' }}>Rp50</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <span>Tarif & Ketentuan</span>
              <Zap size={18} color="#00b894" />
            </div>
            <div className="info-row">
              <span className="info-label">Rate per pesan</span>
              <span className="info-value">Rp400</span>
            </div>
            <div className="info-row">
              <span className="info-label">Min withdraw</span>
              <span className="info-value">Rp10.000</span>
            </div>
            <div className="info-row">
              <span className="info-label">Member sejak</span>
              <span className="info-value">Baru</span>
            </div>
          </div>
        </div>

        <nav className="bottom-nav">
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className={`nav-item ${item.active ? 'active' : ''}`}>
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

export default Dashboard;
