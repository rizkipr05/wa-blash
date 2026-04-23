import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Smartphone, 
  MessageSquare, 
  Zap, 
  AlertTriangle,
  Users,
  User,
  Home,
  Wallet,
  Monitor,
  Flame,
  Trash2
} from 'lucide-react';

const WhatsApp = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const fetchDevices = React.useCallback(async () => {
    try {
      const response = await api.get('/whatsapp/list');
      setDevices(response.data);
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices();
  }, [fetchDevices]);

  const handleAddDevice = async () => {
    try {
      await api.post('/whatsapp/add');
      fetchDevices();
    } catch {
      alert('Error adding device');
    }
  };

  const handleDeleteDevice = async (id) => {
    if (window.confirm('Delete this device?')) {
      try {
        await api.delete(`/whatsapp/${id}`);
        fetchDevices();
      } catch {
        alert('Error deleting device');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'WhatsApp', icon: <MessageSquare size={20} />, path: '/whatsapp', active: true },
    { label: 'Referral', icon: <Users size={20} />, path: '/referral' },
    { label: 'Withdraw', icon: <Wallet size={20} />, path: '/withdraw' },
    { label: 'Profil', icon: <User size={20} />, path: '/profile' },
  ];

  const stats = [
    { label: 'Aktif', value: devices.filter(d => d.status === 'CONNECTED').length, icon: <CheckCircle size={18} />, color: '#00b894', bg: '#e6fff9' },
    { label: 'Offline', value: devices.filter(d => d.status === 'DISCONNECTED').length, icon: <XCircle size={18} />, color: '#ff7675', bg: '#fff5f5' },
    { label: 'Total', value: devices.length, icon: <Smartphone size={18} />, color: '#0984e3', bg: '#ebf5ff' },
    { label: 'Pesan', value: '0', icon: <MessageSquare size={18} />, color: '#fdcb6e', bg: '#fff9eb' },
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
              <p style={{ fontSize: '0.65rem', color: '#636e72', fontWeight: 600 }}>WhatsApp</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="action-bar">
          <div className="title-group">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>WhatsApp</h2>
            <p style={{ fontSize: '0.8rem', color: '#636e72' }}>Kelola WhatsApp Anda untuk menerima pesan</p>
          </div>
          <button className="btn-add-wa" onClick={handleAddDevice}>
            <Plus size={18} /> Tambah WhatsApp
          </button>
        </div>

        <div className="alert-danger">
          <div className="alert-icon-box">
            <AlertTriangle size={20} />
          </div>
          <div className="alert-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Flame size={16} />
              <h4 style={{ margin: 0 }}>Peringatan Penting</h4>
            </div>
            <p>Dilarang <strong>menghapus pesan</strong> atau menggunakan <strong>timer</strong> di aplikasi WhatsApp Anda.</p>
            <div className="badge-risk">PEMBLOKIRAN AKUN PERMANEN</div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="device-list-container">
          <div className="list-header">
            <div className="list-title">
              <Monitor size={18} color="#00b894" />
              <span>Daftar WhatsApp</span>
              <span style={{ fontSize: '0.6rem', background: '#e6fff9', color: '#00b894', padding: '2px 6px', borderRadius: '4px' }}>{devices.length}</span>
            </div>
            <div className="list-actions">
              <button className="btn-blast">
                <Zap size={14} /> Blast All
              </button>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-box">
                <Smartphone size={32} />
              </div>
              <h3>Belum ada WhatsApp</h3>
              <p>Klik "Tambah WhatsApp" untuk menyambungkan perangkat pertama Anda</p>
            </div>
          ) : (
            <div className="device-items-list">
              {devices.map((device) => (
                <div key={device.id} className="info-row" style={{ padding: '1rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Smartphone size={20} color={device.status === 'CONNECTED' ? '#00b894' : '#636e72'} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Device ID: {device.id}</div>
                      <div style={{ fontSize: '0.75rem', color: device.status === 'CONNECTED' ? '#00b894' : '#ff7675' }}>
                        {device.status}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteDevice(device.id)}
                    style={{ border: 'none', background: 'none', color: '#ff7675', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
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
    </div>
  );
};

export default WhatsApp;
