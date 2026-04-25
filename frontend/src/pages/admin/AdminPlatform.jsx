import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Save } from 'lucide-react';
import PopupModal from '../../components/PopupModal';

const AdminPlatform = () => {
  const [settings, setSettings] = useState({
    msg_rate: '',
    referral_commission: '',
    min_withdraw: ''
  });
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        setSettings({
          msg_rate: response.data.msg_rate || '400',
          referral_commission: response.data.referral_commission || '50',
          min_withdraw: response.data.min_withdraw || '10000'
        });
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', settings);
      setModalCtx({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Konfigurasi sistem berhasil disimpan!' });
    } catch (err) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Gagal', message: err.response?.data?.message || 'Gagal menyimpan konfigurasi' });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Global Platform</h2>
        <p style={{ color: 'var(--text-muted)' }}>Pengaturan tarif, komisi, dan sistem platform utama</p>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ background: '#ebf5ff', padding: '8px', borderRadius: '8px', color: '#0984e3' }}>
            <Settings size={20} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Global Platform Settings</h3>
        </div>
        
        <form onSubmit={handleSettingsUpdate}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tarif Potongan Per Pesan (Rp)</label>
            <input type="number" value={settings.msg_rate} onChange={e => setSettings({...settings, msg_rate: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'rgba(255, 255, 255, 0.03)' }} />
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Tarif yang dikenakan per pesan blast.</p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Bonus Referral (Rp)</label>
            <input type="number" value={settings.referral_commission} onChange={e => setSettings({...settings, referral_commission: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'rgba(255, 255, 255, 0.03)' }} />
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Bonus komisi jika user mengundang orang lain.</p>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Batas Penarikan Minimum / WD (Rp)</label>
            <input type="number" value={settings.min_withdraw} onChange={e => setSettings({...settings, min_withdraw: e.target.value})} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'rgba(255, 255, 255, 0.03)' }} />
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Minimal saldo untuk request WD.</p>
          </div>
          
          <button type="submit" style={{ width: '100%', background: '#0984e3', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={16} /> Simpan Konfigurasi
          </button>
        </form>
      </div>

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

export default AdminPlatform;
