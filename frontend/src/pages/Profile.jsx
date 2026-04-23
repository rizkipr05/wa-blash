import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  LogOut, 
  User, 
  CreditCard, 
  ShieldCheck, 
  History, 
  Info, 
  Smartphone, 
  MessageSquare, 
  Users, 
  Home, 
  Wallet,
  Scroll,
  Zap,
  Calendar
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bankData, setBankData] = useState({ bankName: "", accountNumber: "", accountHolder: "" });
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  const fetchProfile = React.useCallback(async () => {
    try {
      const response = await api.get('/user/profile');
      setProfile(response.data);
      setBankData({
        bankName: response.data.bankName || "",
        accountNumber: response.data.accountNumber || "",
        accountHolder: response.data.accountHolder || ""
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/user/profile', bankData);
      alert('Profile updated successfully!');
      fetchProfile();
    } catch {
      alert('Error updating profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return alert('Passwords do not match');
    try {
      await api.put('/user/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      alert('Password updated successfully!');
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'WhatsApp', icon: <MessageSquare size={20} />, path: '/whatsapp' },
    { label: 'Referral', icon: <Users size={20} />, path: '/referral' },
    { label: 'Withdraw', icon: <Wallet size={20} />, path: '/withdraw' },
    { label: 'Profil', icon: <User size={20} />, path: '/profile', active: true },
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
              <p style={{ fontSize: '0.65rem', color: '#636e72', fontWeight: 600 }}>Profil Saya</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="profile-section-card">
          <div className="profile-section-header">
            <CreditCard size={20} color="#4834d4" />
            <h3>Edit Profil</h3>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className="profile-form-grid">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" value={profile?.username || ""} readOnly style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Bank</label>
                <select 
                  className="referral-input" 
                  style={{ width: '100%', height: '42px' }}
                  value={bankData.bankName}
                  onChange={(e) => setBankData({...bankData, bankName: e.target.value})}
                >
                  <option value="">Pilih Bank / E-Wallet</option>
                  <option>DANA</option><option>OVO</option><option>GoPay</option><option>BCA</option><option>Mandiri</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nomor Rekening</label>
                <input 
                  type="text" 
                  value={bankData.accountNumber}
                  onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})}
                  placeholder="Contoh: 08123456789" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Pemilik Rekening</label>
                <input 
                  type="text" 
                  value={bankData.accountHolder}
                  onChange={(e) => setBankData({...bankData, accountHolder: e.target.value})}
                  placeholder="Masukkan nama" 
                />
              </div>
            </div>
            <button type="submit" className="btn-save-profile">Simpan Perubahan</button>
          </form>
        </div>

        <div className="profile-section-card">
          <div className="profile-section-header">
            <Info size={20} color="#00b894" />
            <h3>Informasi Akun</h3>
          </div>
          <div className="profile-info-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={14} color="#636e72" />
              <span className="profile-info-label">Member sejak</span>
            </div>
            <span className="profile-info-value">{profile ? new Date(profile.createdAt).toLocaleDateString() : "-" }</span>
          </div>
          <div className="profile-info-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={14} color="#636e72" />
              <span className="profile-info-label">Rank</span>
            </div>
            <span className="badge-rank badge-status">{profile?.rank || "BASIC"}</span>
          </div>
        </div>

        <div className="profile-section-card">
          <div className="profile-section-header">
            <ShieldCheck size={20} color="#d35400" />
            <h3>Ubah Password</h3>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="profile-form-grid">
              <div className="form-group">
                <label className="form-label">Password Lama</label>
                <input 
                  type="password" 
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                  placeholder="••••••••" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <input 
                  type="password" 
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  placeholder="••••••••" 
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  placeholder="••••••••" 
                />
              </div>
            </div>
            <button type="submit" className="btn-update-password">Update Password</button>
          </form>
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

export default Profile;
