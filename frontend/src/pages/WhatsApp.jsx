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
  Trash2,
  RefreshCw,
  Link2Off
} from 'lucide-react';

const POLL_INTERVAL = 2500;

const WhatsApp = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState({
    status: 'DISCONNECTED',
    phoneNumber: null,
    qrCode: null,
    pairingCode: null
  });

  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState('qr');
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Blast Feature States
  const [blastModalOpen, setBlastModalOpen] = useState(false);
  const [blastDeviceId, setBlastDeviceId] = useState('');
  const [globalTargetCount, setGlobalTargetCount] = useState(0);
  const [blastMessage, setBlastMessage] = useState('Memuat template dari server...');
  const [blastImageUrl, setBlastImageUrl] = useState(null);
  const [blastSpeed, setBlastSpeed] = useState('normal');

  const fetchDevices = React.useCallback(async () => {
    try {
      const response = await api.get('/whatsapp/list');
      setDevices(response.data);
      
      const statsResponse = await api.get('/user/stats');
      if (statsResponse.data?.settings?.global_message_template) {
        setBlastMessage(statsResponse.data.settings.global_message_template);
      }
      if (statsResponse.data?.settings?.global_target_numbers) {
        const targets = statsResponse.data.settings.global_target_numbers.split(/[\n,]+/).map(t => t.trim()).filter(t => t);
        setGlobalTargetCount(targets.length);
      } else {
        setGlobalTargetCount(0);
      }
      if (statsResponse.data?.settings?.global_image_url) {
        const backendUrl = api.defaults.baseURL.replace('/api', '');
        setBlastImageUrl(backendUrl + statsResponse.data.settings.global_image_url);
      }
    } catch (err) {
      console.error('Error fetching devices or settings:', err);
    }
  }, []);

  const fetchDeviceStatus = React.useCallback(async (deviceId) => {
    if (!deviceId) return;

    try {
      const response = await api.get(`/whatsapp/${deviceId}/status`);
      setConnectionInfo(response.data);
    } catch (err) {
      console.error('Error fetching device status:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!modalOpen || !selectedDeviceId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDeviceStatus(selectedDeviceId);
    const intervalId = setInterval(() => {
      fetchDeviceStatus(selectedDeviceId);
      fetchDevices();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [modalOpen, selectedDeviceId, fetchDeviceStatus, fetchDevices]);

  const startAddDevice = () => {
    setConnectionMethod('qr');
    setPhoneNumberInput('');
    setIsReconnecting(false);
    setSelectedDeviceId(null);
    setMethodModalOpen(true);
  };

  const startReconnectDevice = (deviceId) => {
    setConnectionMethod('qr');
    setPhoneNumberInput('');
    setIsReconnecting(true);
    setSelectedDeviceId(deviceId);
    setMethodModalOpen(true);
  };

  const submitConnection = async () => {
    if (connectionMethod === 'pairing' && !phoneNumberInput) {
      alert('Masukkan nomor telepon (contoh: 6281234...)');
      return;
    }
    
    setMethodModalOpen(false);
    try {
      const payload = { method: connectionMethod, phoneNumber: phoneNumberInput };
      let newDeviceId = selectedDeviceId;

      if (!isReconnecting) {
        const response = await api.post('/whatsapp/add', payload);
        newDeviceId = response.data.device.id;
        setSelectedDeviceId(newDeviceId);
      } else {
        await api.post(`/whatsapp/${newDeviceId}/connect`, payload);
      }

      setModalOpen(true);
      await fetchDevices();
      await fetchDeviceStatus(newDeviceId);
    } catch {
      alert('Error connecting device');
    }
  };

  const handleSendBlast = async () => {
    if (!blastDeviceId) {
      alert('Harap pilih Device WhatsApp yang terkoneksi!');
      return;
    }

    if (globalTargetCount === 0) {
      alert('Target belum diatur oleh admin. Tidak dapat meneruskan.');
      return;
    }

    try {
      const resp = await api.post('/whatsapp/blast', {
        deviceId: parseInt(blastDeviceId, 10),
        speed: blastSpeed
      });
      alert(resp.data.message + '\nTotal Target: ' + resp.data.count);
      setBlastModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saat mengirim blast');
    }
  };

  const handleDisconnectDevice = async (deviceId) => {
    if (!window.confirm('Putuskan koneksi device ini?')) return;

    try {
      await api.post(`/whatsapp/${deviceId}/disconnect`);
      await fetchDevices();

      if (selectedDeviceId === deviceId) {
        await fetchDeviceStatus(deviceId);
      }
    } catch {
      alert('Error disconnecting device');
    }
  };

  const handleDeleteDevice = async (id) => {
    if (window.confirm('Delete this device?')) {
      try {
        await api.delete(`/whatsapp/${id}`);
        if (selectedDeviceId === id) {
          setModalOpen(false);
          setSelectedDeviceId(null);
        }
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
    { label: 'Profil', icon: <User size={20} />, path: '/profile' }
  ];

  const stats = [
    { label: 'Aktif', value: devices.filter((d) => d.status === 'CONNECTED').length, icon: <CheckCircle size={18} />, color: '#00b894', bg: '#e6fff9' },
    { label: 'Offline', value: devices.filter((d) => d.status === 'DISCONNECTED').length, icon: <XCircle size={18} />, color: '#ff7675', bg: '#fff5f5' },
    { label: 'Total', value: devices.length, icon: <Smartphone size={18} />, color: '#0984e3', bg: '#ebf5ff' },
    { label: 'Pesan', value: '0', icon: <MessageSquare size={18} />, color: '#fdcb6e', bg: '#fff9eb' }
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
              <h1 className="header-title">WainAja</h1>
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
          <button className="btn-add-wa" onClick={startAddDevice}>
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
            <p>
              Dilarang <strong>menghapus pesan</strong> atau menggunakan <strong>timer</strong> di aplikasi WhatsApp Anda.
            </p>
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
              <button className="btn-blast" onClick={() => setBlastModalOpen(true)}>
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
                <div key={device.id} className="info-row" style={{ padding: '1rem', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <Smartphone size={20} color={device.status === 'CONNECTED' ? '#00b894' : '#636e72'} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Device ID: {device.id}</div>
                      <div style={{ fontSize: '0.75rem', color: device.status === 'CONNECTED' ? '#00b894' : '#ff7675' }}>{device.status}</div>
                      {device.phoneNumber ? <div style={{ fontSize: '0.75rem', color: '#636e72' }}>+{device.phoneNumber}</div> : null}
                    </div>
                  </div>

                  {device.status !== 'CONNECTED' ? (
                    <button className="btn-add-wa" style={{ padding: '0.45rem 0.65rem' }} onClick={() => startReconnectDevice(device.id)}>
                      <RefreshCw size={14} /> Hubungkan
                    </button>
                  ) : (
                    <button className="btn-blast" style={{ padding: '0.45rem 0.65rem' }} onClick={() => handleDisconnectDevice(device.id)}>
                      <Link2Off size={14} /> Putuskan
                    </button>
                  )}

                  <button onClick={() => handleDeleteDevice(device.id)} style={{ border: 'none', background: 'none', color: '#ff7675', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {modalOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999
            }}
          >
            <div style={{ background: '#fff', borderRadius: '12px', width: 'min(92vw, 420px)', padding: '1.25rem', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.4rem' }}>Scan QR WhatsApp</h3>
              <p style={{ marginTop: 0, color: '#636e72', fontSize: '0.85rem' }}>
                Device #{selectedDeviceId} - Status: <strong>{connectionInfo.status}</strong>
              </p>

              {connectionInfo.status === 'CONNECTED' ? (
                <div style={{ color: '#00b894', fontWeight: 700, margin: '1rem 0' }}>
                  Terhubung{connectionInfo.phoneNumber ? `: +${connectionInfo.phoneNumber}` : ''}
                </div>
              ) : connectionInfo.pairingCode ? (
                <div style={{ margin: '1.5rem 0' }}>
                  <p style={{ color: '#636e72', fontSize: '0.9rem', marginBottom: '1rem' }}>Masukkan kode di bawah ini pada WhatsApp di ponsel Anda:</p>
                  <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '4px', background: '#f1f2f6', padding: '1rem', borderRadius: '8px', color: '#2d3436' }}>
                    {connectionInfo.pairingCode}
                  </div>
                </div>
              ) : connectionInfo.qrCode ? (
                <img src={connectionInfo.qrCode} alt="QR Code WhatsApp" style={{ width: '100%', maxWidth: '270px', margin: '0.5rem auto 1rem', display: 'block' }} />
              ) : (
                <div style={{ padding: '1rem', color: '#636e72', fontSize: '0.85rem' }}>Menyiapkan Kode Autentikasi, tunggu sebentar...</div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button className="btn-add-wa" onClick={() => {
                  setModalOpen(false);
                  startReconnectDevice(selectedDeviceId);
                }}>
                  <RefreshCw size={14} /> Refresh
                </button>
                <button
                  className="btn-blast"
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedDeviceId(null);
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {methodModalOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999
            }}
          >
            <div style={{ background: '#fff', borderRadius: '12px', width: 'min(92vw, 450px)', padding: '1.5rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#e6fff9', color: '#00b894', padding: '0.5rem', borderRadius: '8px' }}>
                  <Plus size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Tambah WhatsApp</h3>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#2d3436' }}>Pilih Metode Koneksi</h4>
                
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: `2px solid ${connectionMethod === 'qr' ? '#00b894' : '#eee'}`, borderRadius: '8px', cursor: 'pointer', marginBottom: '0.75rem', transition: 'all 0.2s' }}>
                  <input type="radio" name="connMethod" checked={connectionMethod === 'qr'} onChange={() => setConnectionMethod('qr')} style={{ marginTop: '0.25rem' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#2d3436' }}>QR Code</div>
                    <div style={{ fontSize: '0.8rem', color: '#636e72', marginTop: '0.25rem' }}>Scan QR code dengan WhatsApp di ponsel Anda</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: `2px solid ${connectionMethod === 'pairing' ? '#0984e3' : '#eee'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="radio" name="connMethod" checked={connectionMethod === 'pairing'} onChange={() => setConnectionMethod('pairing')} style={{ marginTop: '0.25rem' }} />
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 700, color: '#2d3436' }}>Pairing Code</div>
                    <div style={{ fontSize: '0.8rem', color: '#636e72', marginTop: '0.25rem' }}>Masukkan kode pairing ke WhatsApp Anda.</div>
                    
                    {connectionMethod === 'pairing' && (
                      <div style={{ marginTop: '1rem' }}>
                        <input 
                          type="text" 
                          placeholder="Contoh: 62812345678" 
                          value={phoneNumberInput}
                          onChange={(e) => setPhoneNumberInput(e.target.value.replace(/\D/g, ''))}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dfe6e9', outline: 'none', fontSize: '0.9rem' }}
                        />
                        <div style={{ fontSize: '0.7rem', color: '#b2bec3', marginTop: '0.4rem' }}>Tanpa tanda (+) atau spasi. Mulai dengan kode negara.</div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  style={{ padding: '0.65rem 1.25rem', background: 'transparent', border: '1px solid #dfe6e9', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#636e72' }}
                  onClick={() => setMethodModalOpen(false)}
                >
                  Batal
                </button>
                <button 
                  style={{ padding: '0.65rem 1.25rem', background: '#00b894', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={submitConnection}
                >
                  Lanjut →
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {blastModalOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999
            }}
          >
            <div style={{ background: '#fff', borderRadius: '12px', width: 'min(92vw, 550px)', padding: '1.75rem', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#ebf5ff', color: '#0984e3', padding: '0.6rem', borderRadius: '8px' }}>
                  <Zap size={22} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Blast Pesan Massal</h3>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#2d3436' }}>Pilih Device Pengirim</label>
                <select 
                  value={blastDeviceId} 
                  onChange={(e) => setBlastDeviceId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dfe6e9', fontSize: '0.9rem' }}
                >
                  <option value="">-- Pilih Device Terkoneksi --</option>
                  {devices.filter(d => d.status === 'CONNECTED').map(device => (
                    <option key={device.id} value={device.id}>
                      Device #{device.id} (+{device.phoneNumber || 'Unknown'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#2d3436' }}>Nomor Target</label>
                <div style={{ width: '100%', padding: '1rem', borderRadius: '6px', border: '1px solid #dfe6e9', fontSize: '0.9rem', background: '#f8fafc', color: '#636e72', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} color="#0984e3"/> 
                  <span>Target dikontrol oleh Admin (<strong style={{color: '#0984e3'}}>{globalTargetCount} Nomor Disiapkan</strong>)</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: '#636e72' }}>Preview Template Pesan (Dikontrol Admin)</label>
                <div style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #dfe6e9', minHeight: '100px', fontSize: '0.9rem', background: '#f8fafc', color: '#2d3436' }}>
                  {blastImageUrl && (
                    <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                      <img src={blastImageUrl} alt="Campaign Cover" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '4px' }} />
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{blastMessage}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#2d3436' }}>Kecepatan Pengiriman</label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', padding: '0.85rem', border: `2px solid ${blastSpeed === 'fast' ? '#ff7675' : '#eee'}`, borderRadius: '8px', cursor: 'pointer', alignItems: 'center', textAlign: 'center', transition: 'all 0.2s', background: blastSpeed === 'fast' ? '#fff5f5' : 'transparent' }}>
                    <input type="radio" name="bspeed" checked={blastSpeed === 'fast'} onChange={() => setBlastSpeed('fast')} style={{ display: 'none' }} />
                    <span style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>⚡</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: blastSpeed === 'fast' ? '#ff7675' : '#636e72' }}>Sangat Cepat</span>
                    <span style={{ fontSize: '0.65rem', color: '#b2bec3', marginTop: '0.2rem' }}>Jeda 0.5 - 1s</span>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', padding: '0.85rem', border: `2px solid ${blastSpeed === 'normal' ? '#0984e3' : '#eee'}`, borderRadius: '8px', cursor: 'pointer', alignItems: 'center', textAlign: 'center', transition: 'all 0.2s', background: blastSpeed === 'normal' ? '#ebf5ff' : 'transparent' }}>
                    <input type="radio" name="bspeed" checked={blastSpeed === 'normal'} onChange={() => setBlastSpeed('normal')} style={{ display: 'none' }} />
                    <span style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>🚶</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: blastSpeed === 'normal' ? '#0984e3' : '#636e72' }}>Normal</span>
                    <span style={{ fontSize: '0.65rem', color: '#b2bec3', marginTop: '0.2rem' }}>Jeda 2 - 3s</span>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', padding: '0.85rem', border: `2px solid ${blastSpeed === 'slow' ? '#00b894' : '#eee'}`, borderRadius: '8px', cursor: 'pointer', alignItems: 'center', textAlign: 'center', transition: 'all 0.2s', background: blastSpeed === 'slow' ? '#e6fff9' : 'transparent' }}>
                    <input type="radio" name="bspeed" checked={blastSpeed === 'slow'} onChange={() => setBlastSpeed('slow')} style={{ display: 'none' }} />
                    <span style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>🐢</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: blastSpeed === 'slow' ? '#00b894' : '#636e72' }}>Santai / Aman</span>
                    <span style={{ fontSize: '0.65rem', color: '#b2bec3', marginTop: '0.2rem' }}>Jeda 4 - 7s</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  style={{ padding: '0.65rem 1.25rem', background: 'transparent', border: '1px solid #dfe6e9', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#636e72' }}
                  onClick={() => setBlastModalOpen(false)}
                >
                  Batal
                </button>
                <button 
                  style={{ padding: '0.65rem 1.25rem', background: '#0984e3', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={handleSendBlast}
                >
                  <Zap size={16} /> Kirim Blast Sekarang
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <nav className="bottom-nav">
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className={`nav-item ${item.active ? 'active' : ''}`}>
              <div className="nav-item-icon">{item.icon}</div>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default WhatsApp;
