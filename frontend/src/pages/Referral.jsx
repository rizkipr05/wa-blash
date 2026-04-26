import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import PopupModal from '../components/PopupModal';
import {
  LogOut,
  Users,
  DollarSign,
  Copy,
  Lightbulb,
  User,
  Home,
  MessageSquare,
  Wallet,
  Zap
} from 'lucide-react';

const Referral = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, referralsRes] = await Promise.all([
          api.get('/user/profile'),
          api.get('/finance/referrals')
        ]);
        setProfile(profileRes.data);
        setReferrals(referralsRes.data);
      } catch (error) {
        console.error('Error fetching referral data:', error);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const referralLink = profile ? `${window.location.origin}/signup?ref=${profile.referralCode}` : "...";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setModalCtx({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Tautan referral disalin!' });
  };

  const navItems = [
    { label: 'Home', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'WhatsApp', icon: <MessageSquare size={20} />, path: '/whatsapp' },
    { label: 'Referral', icon: <Users size={20} />, path: '/referral', active: true },
    { label: 'Withdraw', icon: <Wallet size={20} />, path: '/withdraw' },
    { label: 'Profil', icon: <User size={20} />, path: '/profile' },
  ];

  const stats = [
    { label: 'Referral', value: referrals.length, icon: <Users size={18} />, color: '#6c5ce7', bg: '#f3f0ff' },
    { label: 'Komisi', value: 'Rp0', icon: <DollarSign size={18} />, color: '#00b894', bg: '#e6fff9' },
  ];

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="header-logo">
              <img src="/logo.png" alt="Logo" />
            </div>
            <div>
              <h1 className="header-title">setorwa-der.com</h1>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Program Referral</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '2rem' }}>
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ flexDirection: 'row', gap: '1rem', justifyContent: 'flex-start', textAlign: 'left' }}>
              <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color, marginBottom: 0 }}>
                {stat.icon}
              </div>
              <div>
                <div className="stat-value" style={{ fontSize: '1.25rem' }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="referral-link-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Zap size={16} color="#6c5ce7" />
            <h3 className="section-title" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Link Referral Anda</h3>
          </div>
          <div className="referral-link-box">
            <input type="text" readOnly value={referralLink} className="referral-input" />
            <button className="btn-copy" onClick={handleCopy}>
              <Copy size={16} style={{ marginRight: '8px' }} /> Copy
            </button>
          </div>
          <div className="tip-box">
            <Lightbulb size={18} />
            <span>Bagikan link ini dan dapatkan <strong>Rp50/pesan</strong> dari setiap aktivitas referral Anda!</span>
          </div>
        </div>

        <div className="device-list-container">
          <div className="list-header">
            <div className="list-title">
              <Users size={18} color="#6c5ce7" />
              <span>Daftar Referral</span>
              <span style={{ fontSize: '0.6rem', background: '#f3f0ff', color: '#6c5ce7', padding: '2px 6px', borderRadius: '4px' }}>{referrals.length}</span>
            </div>
          </div>

          {referrals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-box">
                <Users size={32} />
              </div>
              <h3>Belum Ada Referral</h3>
              <p>Ajak teman Anda bergabung untuk mulai mendapatkan komisi</p>
            </div>
          ) : (
            <div className="referral-items-list">
              {referrals.map((ref, idx) => (
                <div key={idx} className="info-row" style={{ padding: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ref.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined: {new Date(ref.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="badge-status badge-rank">{ref.rank}</div>
                </div>
              ))}
            </div>
          )}
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
      
      <PopupModal 
        isOpen={modalCtx.isOpen} 
        type={modalCtx.type} 
        title={modalCtx.title} 
        message={modalCtx.message} 
        onClose={() => setModalCtx({ ...modalCtx, isOpen: false })} 
      />
    </div>
  );
};

export default Referral;
