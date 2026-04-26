import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import PopupModal from '../components/PopupModal';
import {
  LogOut,
  Wallet,
  ArrowUpRight,
  History,
  AlertCircle,
  CheckCircle,
  User,
  Home,
  MessageSquare,
  Users,
  ClipboardList,
  Target
} from 'lucide-react';
import brandLogo from '../assets/1.jpg';

const Withdraw = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState("");
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: '', title: '', message: '' });
  const fetchData = React.useCallback(async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/finance/withdraw/history')
      ]);
      setProfile(profileRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Error fetching withdrawal data:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const minWd = parseFloat(profile?.settings?.min_withdraw || 10000);
    if (!amount || amount < minWd) {
      return setModalCtx({ isOpen: true, type: 'error', title: 'Oops', message: `Peringatan: Minimal nominal penarikan adalah Rp${minWd.toLocaleString()}` });
    }
    try {
      await api.post('/finance/withdraw', { amount: parseFloat(amount) });
      setModalCtx({ isOpen: true, type: 'success', title: 'Penarikan Diajukan', message: 'Request Withdraw Anda telah diajukan dan sedang diproses (Pending)!' });
      setAmount("");
      fetchData();
    } catch (error) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Gagal', message: error.response?.data?.message || 'Error ketika memproses jaringan withdraw' });
    }
  };

  const currentBalance = parseFloat(profile?.balance || 0);
  const minWithdraw = parseFloat(profile?.settings?.min_withdraw || 10000);
  const progressPercent = Math.min((currentBalance / minWithdraw) * 100, 100).toFixed(0);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'WhatsApp', icon: <MessageSquare size={20} />, path: '/whatsapp' },
    { label: 'Referral', icon: <Users size={20} />, path: '/referral' },
    { label: 'Withdraw', icon: <Wallet size={20} />, path: '/withdraw', active: true },
    { label: 'Profil', icon: <User size={20} />, path: '/profile' },
  ];

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="header-logo">
              <img src={brandLogo} alt="Logo" />
            </div>
            <div>
              <h1 className="header-title">setorwa-der.com</h1>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Withdraw</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="withdraw-top-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={14} /> SALDO TERSEDIA
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Rp {currentBalance.toLocaleString()}</div>
            </div>
            <div className={`status-badge ${currentBalance >= minWithdraw ? 'status-ready' : ''}`} style={{ background: currentBalance >= minWithdraw ? '#e6fff9' : '#f1f5f9', color: currentBalance >= minWithdraw ? '#00b894' : '#636e72' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {currentBalance >= minWithdraw ? <CheckCircle size={12} /> : <Target size={12} />}
                {currentBalance >= minWithdraw ? 'READY' : 'PENDING'}
              </div>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-header">
              <span>Progress ke minimum: {progressPercent}%</span>
              <span>Min: Rp {minWithdraw.toLocaleString()}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="withdraw-grid">
          <div className="device-list-container">
            <div className="list-header">
              <div className="list-title">
                <ArrowUpRight size={18} color="#00b894" />
                <span>Request Withdraw</span>
              </div>
            </div>

            {(!profile?.bankName || !profile?.accountNumber) ? (
              <div className="empty-state">
                <div className="empty-icon-box" style={{ background: '#fff5f5', color: '#ff7675' }}>
                  <AlertCircle size={32} />
                </div>
                <h3>Data Bank Belum Diatur</h3>
                <p>Harap atur informasi rekening bank Anda terlebih dahulu di menu profil.</p>
                <button className="btn-config" onClick={() => navigate('/profile')}>
                  <Wallet size={14} /> Pengaturan Profil
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} style={{ padding: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Jumlah Penarikan (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Dana akan dikirim ke: <strong>{profile.bankName} - {profile.accountNumber} ({profile.accountHolder})</strong>
                  </p>
                </div>
                <button type="submit" className="btn-add-wa" style={{ width: '100%', marginTop: '1rem' }}>
                  Kirim Request
                </button>
              </form>
            )}
          </div>

          <div className="device-list-container">
            <div className="list-header">
              <div className="list-title">
                <ClipboardList size={18} color="#0984e3" />
                <span>Riwayat Withdraw</span>
              </div>
            </div>
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-box">
                  <History size={32} />
                </div>
                <h3>Belum Ada Riwayat</h3>
              </div>
            ) : (
              <div className="history-list">
                {history.map((h) => (
                  <div key={h.id} className="info-row" style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Rp {parseFloat(h.amount).toLocaleString()}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(h.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="badge-status" style={{ background: h.status === 'PENDING' ? '#fff9eb' : h.status === 'APPROVED' ? '#e6fff9' : '#fff5f5', color: h.status === 'PENDING' ? '#fdcb6e' : h.status === 'APPROVED' ? '#00b894' : '#ff7675' }}>
                      {h.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default Withdraw;
