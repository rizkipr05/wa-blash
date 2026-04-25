import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Lock, Edit3, Save, CheckCircle, User } from 'lucide-react';

const AdminProfile = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  useEffect(() => {
    api.get('/user/profile').then(res => {
      setCurrentUser(res.data.username);
      setUsername(res.data.username);
    }).catch(console.error);
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg(''); setProfileErr('');
    try {
      await api.put('/user/profile', { username });
      setProfileMsg('Username berhasil diperbarui!');
      setCurrentUser(username);
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Gagal memperbarui username');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    if (newPassword.length < 8) {
      setPwErr('Kata sandi baru minimal 8 karakter'); return;
    }
    
    try {
      await api.put('/user/change-password', { oldPassword, newPassword });
      setPwMsg('Password berhasil diperbarui!');
      setOldPassword(''); setNewPassword('');
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Gagal memperbarui kata sandi');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Admin Settings</h2>
        <p style={{ color: 'var(--text-muted)' }}>Kelola kredensial Anda dan konfigurasi operasi platform</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Profile Card */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
             <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', color: '#3b82f6' }}>
               <User size={20} />
             </div>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Ubah Profil Admin</h3>
          </div>
          <form onSubmit={handleProfileUpdate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
            </div>
            {profileMsg && <p style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{profileMsg}</p>}
            {profileErr && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{profileErr}</p>}
            <button type="submit" style={{ width: '100%', background: '#0984e3', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Save size={16} /> Perbarui Profil
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#ef4444' }}>
              <Lock size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Ubah Password Admin</h3>
          </div>
          
          <form onSubmit={handlePasswordUpdate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Password Saat Ini</label>
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Password Baru</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }} />
            </div>
            
            {pwMsg && <p style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{pwMsg}</p>}
            {pwErr && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{pwErr}</p>}
            
            <button type="submit" style={{ width: '100%', background: '#0f172a', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Edit3 size={16} /> Perbarui Akses
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;
