import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Lock, Edit3, Save, CheckCircle } from 'lucide-react';

const AdminProfile = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const [settings, setSettings] = useState({
    msg_rate: '',
    referral_commission: '',
    min_withdraw: '',
    global_message_template: '',
    antiban_daily_limit: '',
    antiban_batch_size: '',
    antiban_batch_delay: '',
    antiban_failure_limit: ''
  });
  const [setMsg, setSetMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        setSettings({
          msg_rate: response.data.msg_rate || '400',
          referral_commission: response.data.referral_commission || '50',
          min_withdraw: response.data.min_withdraw || '10000',
          global_message_template: response.data.global_message_template || 'Halo, ini pesan default.',
          antiban_daily_limit: response.data.antiban_daily_limit || '200',
          antiban_batch_size: response.data.antiban_batch_size || '50',
          antiban_batch_delay: response.data.antiban_batch_delay || '5',
          antiban_failure_limit: response.data.antiban_failure_limit || '20'
        });
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwMsg(''); setPwError('');
    if (newPassword.length < 8) {
      setPwError('Kata sandi baru minimal 8 karakter'); return;
    }
    
    try {
      await api.put('/user/change-password', { oldPassword, newPassword });
      setPwMsg('Password berhasil diperbarui!');
      setOldPassword(''); setNewPassword('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Gagal memperbarui kata sandi');
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    setSetMsg('');
    try {
      await api.put('/admin/settings', settings);
      setSetMsg('Konfigurasi sistem berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan konfigurasi');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d3436' }}>Admin Settings</h2>
        <p style={{ color: '#636e72' }}>Kelola kredensial Anda dan konfigurasi operasi platform</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Password Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px', color: '#ef4444' }}>
              <Lock size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Ubah Password Admin</h3>
          </div>
          
          <form onSubmit={handlePasswordUpdate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Password Saat Ini</label>
              <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Password Baru</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>
            
            {pwMsg && <p style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{pwMsg}</p>}
            {pwError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{pwError}</p>}
            
            <button type="submit" style={{ width: '100%', background: '#0f172a', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Edit3 size={16} /> Perbarui Akses
            </button>
          </form>
        </div>

        {/* Global Configuration Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div style={{ background: '#ebf5ff', padding: '8px', borderRadius: '8px', color: '#0984e3' }}>
              <Settings size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Global Platform Settings</h3>
          </div>
          
          <form onSubmit={handleSettingsUpdate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Tarif Potongan Per Pesan (Rp)</label>
              <input type="number" value={settings.msg_rate} onChange={e => setSettings({...settings, msg_rate: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Tarif yang dikenakan per pesan blast.</p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Bonus Referral (Rp)</label>
              <input type="number" value={settings.referral_commission} onChange={e => setSettings({...settings, referral_commission: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Bonus komisi jika user mengundang orang lain.</p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Batas Penarikan Minimum / WD (Rp)</label>
              <input type="number" value={settings.min_withdraw} onChange={e => setSettings({...settings, min_withdraw: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Minimal saldo untuk request WD.</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Pesan Template Global</label>
              <textarea value={settings.global_message_template} onChange={e => setSettings({...settings, global_message_template: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', minHeight: '120px', resize: 'vertical' }} />
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Isi pesan mutlak yang akan dikirim oleh semua User saat nge-blast.</p>
            </div>
            
            {setMsg && <p style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> {setMsg}</p>}
            
            <button type="submit" style={{ width: '100%', background: '#0984e3', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Save size={16} /> Simpan Konfigurasi
            </button>
          </form>
        </div>

        {/* Anti-Ban Firewall Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div style={{ background: '#fff1f2', padding: '8px', borderRadius: '8px', color: '#e11d48' }}>
              <Settings size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Anti-Banned Firewall</h3>
          </div>
          
          <form onSubmit={handleSettingsUpdate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Batas Kirim Per Hari (per Device)</label>
              <input type="number" value={settings.antiban_daily_limit} onChange={e => setSettings({...settings, antiban_daily_limit: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ffe4e6', outline: 'none', background: '#fff1f2' }} />
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Melebihi limit harian WA rentan disuspend.</p>
            </div>
            
            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Jumlah per Batch</label>
                <input type="number" value={settings.antiban_batch_size} onChange={e => setSettings({...settings, antiban_batch_size: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ffe4e6', outline: 'none', background: '#fff1f2' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Jeda Istirahat (Menit)</label>
                <input type="number" value={settings.antiban_batch_delay} onChange={e => setSettings({...settings, antiban_batch_delay: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ffe4e6', outline: 'none', background: '#fff1f2' }} />
              </div>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>Sistem akan beristirahat ("Warm-up") setelah mengirim X pesan berturut-turut.</p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Auto Stop saat Gagal Tinggi (%)</label>
              <input type="number" value={settings.antiban_failure_limit} onChange={e => setSettings({...settings, antiban_failure_limit: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ffe4e6', outline: 'none', background: '#fff1f2' }} />
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Jika angka gagal kirim melebih persenan ini, blast di-kill otomatis.</p>
            </div>
            
            {setMsg && <p style={{ color: '#10b981', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> {setMsg}</p>}
            
            <button type="submit" style={{ width: '100%', background: '#e11d48', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Save size={16} /> Update Firewall
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;
