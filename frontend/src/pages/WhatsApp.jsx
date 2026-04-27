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
  AlertTriangle,
  Users,
  User,
  Home,
  Wallet,
  Trash2,
  Link2Off,
  Umbrella,
  Target,
  Inbox,
  Gift,
  DollarSign,
  Zap,
  Flame,
  RefreshCw,
  QrCode,
  Image as ImageIcon,
  Send
} from 'lucide-react';
import PopupModal from '../components/PopupModal';
import brandLogo from '../assets/1.jpg';

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

  const [blastModalOpen, setBlastModalOpen] = useState(false);
  const [blastDeviceId, setBlastDeviceId] = useState('');
  const [globalTargetCount, setGlobalTargetCount] = useState(0);
  const [blastSpeed, setBlastSpeed] = useState('normal');
  const [isBlasting, setIsBlasting] = useState(false);
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null, showCancel: false });

  const fetchDevices = React.useCallback(async () => {
    try {
      const response = await api.get('/whatsapp/list');
      setDevices(response.data);
      
      const statsResponse = await api.get('/user/stats');
      if (statsResponse.data?.settings?.global_target_numbers) {
        const targets = statsResponse.data.settings.global_target_numbers.split(/[\n,]+/).map(t => t.trim()).filter(t => t);
        setGlobalTargetCount(targets.length);
      } else {
        setGlobalTargetCount(0);
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
    const timer = setTimeout(() => {
      fetchDevices();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDevices]);

  useEffect(() => {
    if (!modalOpen || !selectedDeviceId) return;

    const timer = setTimeout(() => {
      fetchDeviceStatus(selectedDeviceId);
    }, 0);

    const intervalId = setInterval(() => {
      fetchDeviceStatus(selectedDeviceId);
      fetchDevices();
    }, POLL_INTERVAL);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
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
      setModalCtx({ isOpen: true, type: 'error', title: 'Input Salah', message: 'Masukkan nomor telepon (contoh: 6281234...)' });
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
    } catch (err) {
      setModalCtx({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: err.response?.data?.message || 'Error saat mengkoneksikan perangkat.'
      });
    }
  };

  const handleSendBlast = async () => {
    if (!blastDeviceId) {
      setModalCtx({ isOpen: true, type: 'warning', title: 'Peringatan', message: 'Harap pilih Device WhatsApp yang terkoneksi!' });
      return;
    }

    if (globalTargetCount === 0) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Target Kosong', message: 'Target belum diatur oleh admin. Tidak dapat meneruskan.' });
      return;
    }

    setModalCtx({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Blast',
      message: 'Apakah Anda yakin ingin memulai blast ke seluruh target?',
      showCancel: true,
      onConfirm: async () => {
        setIsBlasting(true);
        try {
          const resp = await api.post('/whatsapp/blast', {
            deviceId: parseInt(blastDeviceId, 10),
            speed: blastSpeed
          });
          setModalCtx({ isOpen: true, type: 'success', title: 'Berhasil', message: `${resp.data.message}\nTotal Target: ${resp.data.count}` });
          setBlastModalOpen(false);
        } catch (err) {
          setModalCtx({ isOpen: true, type: 'error', title: 'Gagal', message: err.response?.data?.message || 'Error saat mengirim blast' });
        } finally {
          setIsBlasting(false);
        }
      }
    });
  };

  const handleDisconnectDevice = async (deviceId) => {
    setModalCtx({
      isOpen: true,
      type: 'warning',
      title: 'Konfirmasi',
      message: 'Putuskan koneksi device ini?',
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.post(`/whatsapp/${deviceId}/disconnect`);
          await fetchDevices();
          if (selectedDeviceId === deviceId) {
            await fetchDeviceStatus(deviceId);
          }
          setModalCtx({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Device berhasil diputuskan.' });
        } catch {
          setModalCtx({ isOpen: true, type: 'error', title: 'Gagal', message: 'Error disconnecting device' });
        }
      }
    });
  };

  const handleDeleteDevice = async (id) => {
    setModalCtx({
      isOpen: true,
      type: 'warning',
      title: 'Hapus Device',
      message: 'Apakah Anda yakin ingin menghapus device ini?',
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.delete(`/whatsapp/${id}`);
          if (selectedDeviceId === id) {
            setModalOpen(false);
            setSelectedDeviceId(null);
          }
          await fetchDevices();
          setModalCtx({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Device berhasil dihapus.' });
        } catch {
          setModalCtx({ isOpen: true, type: 'error', title: 'Gagal', message: 'Error deleting device' });
        }
      }
    });
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
              <img src={brandLogo} alt="Logo" />
            </div>
            <div>
              <h1 className="header-title">setorwa-der.com</h1>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="action-bar">
          <div className="title-group">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>WhatsApp</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kelola WhatsApp Anda untuk menerima pesan</p>
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
          <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--card-bg)', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div className="list-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Smartphone size={20} color="#3b82f6" />
              <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Daftar WhatsApp
                    <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#3b82f6', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{devices.length}</span>
                 </div>
                 <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>WhatsApp terdaftar</div>
              </div>
            </div>
            <div className="list-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button 
                className="btn-blast" 
                onClick={() => setBlastModalOpen(true)}
                style={{ background: '#e11d48', border: 'none', borderRadius: '8px', color: '#fff', padding: '0.6rem 1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <Zap size={16} /> Blast All
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
            <div className="device-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {devices.map((device) => (
                <div key={device.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '1.25rem', background: 'var(--card-bg)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  
                  {/* Top Row: Icon + Number + Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: device.status === 'CONNECTED' ? '0' : '1rem' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      {/* Left Umbrella Icon */}
                      <div style={{ position: 'relative' }}>
                        <div style={{ 
                          width: '56px', height: '56px', borderRadius: '14px', background: '#ffe4e6', color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                          <Umbrella size={26} />
                        </div>
                        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', background: device.status === 'CONNECTED' ? '#10b981' : '#f43f5e', width: '16px', height: '16px', borderRadius: '50%', border: '3px solid #fff' }}></div>
                      </div>

                      {/* Number and Stats */}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                          {device.phoneNumber || `Device #${device.id}`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ecfdf5', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Inbox size={14} color="#f59e0b"/> {device.messagesSentToday || 1}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><DollarSign size={14} color="#fbbf24"/> Rp{(device.messagesSentToday || 1) * 500}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Gift size={14} color="#f43f5e"/> Rp0</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side status & action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => {
                          setBlastDeviceId(device.id);
                          setBlastModalOpen(true);
                        }}
                        disabled={device.status !== 'CONNECTED'}
                        style={{ background: device.status === 'CONNECTED' ? '#0984e3' : '#f1f5f9', color: device.status === 'CONNECTED' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: device.status === 'CONNECTED' ? 'pointer' : 'not-allowed' }}
                      >
                        <Zap size={14} /> Mulai Blast
                      </button>
                      
                      <div style={{ 
                        background: device.status === 'CONNECTED' ? '#d1fae5' : '#ffe4e6', 
                        color: device.status === 'CONNECTED' ? '#059669' : '#f43f5e', 
                        padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 
                      }}>
                        {device.status === 'CONNECTED' ? 'Terkoneksi' : 'Terputus'}
                      </div>
                      <button onClick={() => handleDeleteDevice(device.id)} style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#f43f5e'} onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Disconnected Alert */}
                  {device.status !== 'CONNECTED' && (
                    <div style={{ 
                      background: '#ffe4e6', color: '#f43f5e', padding: '0.85rem 1.25rem', borderRadius: '8px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 500 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={16} /> Bot Terputus - Silahkan Tambah Whatsapp kembali
                      </div>
                      <button onClick={() => startReconnectDevice(device.id)} style={{ background: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                        Re-koneksi
                      </button>
                    </div>
                  )}
                  
                  {/* Connected Actions */}
                  {device.status === 'CONNECTED' && (
                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                       <button onClick={() => handleDisconnectDevice(device.id)} style={{ background: '#f1f5f9', color: 'var(--text-muted)', border: '1px solid #e2e8f0', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link2Off size={14} /> Putuskan Koneksi
                      </button>
                    </div>
                  )}

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
            <div style={{ background: '#0f172a', borderRadius: '12px', width: 'min(92vw, 420px)', padding: '1.25rem', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.4rem' }}>Scan QR WhatsApp</h3>
              <p style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Device #{selectedDeviceId} - Status: <strong>{connectionInfo.status}</strong>
              </p>

              {connectionInfo.status === 'CONNECTED' ? (
                <div style={{ color: '#00b894', fontWeight: 700, margin: '1rem 0' }}>
                  Terhubung{connectionInfo.phoneNumber ? `: +${connectionInfo.phoneNumber}` : ''}
                </div>
              ) : connectionInfo.pairingCode ? (
                <div style={{ margin: '1.5rem 0' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Masukkan kode di bawah ini pada WhatsApp di ponsel Anda:</p>
                  <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '4px', background: '#f1f2f6', padding: '1rem', borderRadius: '8px', color: '#111827', textShadow: '0 0 0 transparent' }}>
                    {connectionInfo.pairingCode}
                  </div>
                </div>
              ) : connectionInfo.qrCode ? (
                <img src={connectionInfo.qrCode} alt="QR Code WhatsApp" style={{ width: '100%', maxWidth: '270px', margin: '0.5rem auto 1rem', display: 'block' }} />
              ) : (
                <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Menyiapkan Kode Autentikasi, tunggu sebentar...</div>
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
            <div style={{ background: '#0f172a', borderRadius: '12px', width: 'min(92vw, 450px)', padding: '1.5rem', textAlign: 'left', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#e6fff9', color: '#00b894', padding: '0.5rem', borderRadius: '8px' }}>
                  <Plus size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Tambah WhatsApp</h3>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>Pilih Metode Koneksi</h4>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${connectionMethod === 'qr' ? '#00b894' : 'rgba(255,255,255,0.05)'}`, background: connectionMethod === 'qr' ? 'rgba(0,184,148,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer', marginBottom: '0.75rem', transition: 'all 0.2s' }}>
                  <input type="radio" name="connMethod" checked={connectionMethod === 'qr'} onChange={() => setConnectionMethod('qr')} style={{ width: '18px', height: '18px', accentColor: '#00b894' }} />
                  <div style={{ background: connectionMethod === 'qr' ? '#00b894' : 'rgba(255,255,255,0.05)', color: connectionMethod === 'qr' ? '#fff' : 'var(--text-muted)', padding: '0.6rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>QR Code</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Scan QR code dengan WhatsApp di ponsel Anda</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', border: `2px solid ${connectionMethod === 'pairing' ? '#0984e3' : 'rgba(255,255,255,0.05)'}`, background: connectionMethod === 'pairing' ? 'rgba(9,132,227,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="radio" name="connMethod" checked={connectionMethod === 'pairing'} onChange={() => setConnectionMethod('pairing')} style={{ marginTop: '0.35rem', width: '18px', height: '18px', accentColor: '#0984e3' }} />
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ background: connectionMethod === 'pairing' ? '#0984e3' : 'rgba(255,255,255,0.05)', color: connectionMethod === 'pairing' ? '#fff' : 'var(--text-muted)', padding: '0.6rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'fit-content' }}>
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>Pairing Code</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Masukkan kode pairing ke WhatsApp Anda.</div>
                      </div>
                    </div>
                    
                    {connectionMethod === 'pairing' && (
                      <div style={{ marginTop: '1rem' }}>
                        <input 
                          type="text" 
                          placeholder="Contoh: 62812345678" 
                          value={phoneNumberInput}
                          onChange={(e) => setPhoneNumberInput(e.target.value.replace(/\D/g, ''))}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Tanpa tanda (+) atau spasi. Mulai dengan kode negara.</div>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  style={{ padding: '0.65rem 1.25rem', background: 'transparent', border: '1px solid #dfe6e9', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }}
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
            <div style={{ background: '#0f172a', borderRadius: '12px', width: 'min(92vw, 550px)', padding: '1.75rem', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#ebf5ff', color: '#0984e3', padding: '0.6rem', borderRadius: '8px' }}>
                  <Zap size={22} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Blast Pesan Massal</h3>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Pilih Device Pengirim</label>
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





              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Kecepatan Pengiriman</label>
                
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
                  disabled={isBlasting || !blastDeviceId}
                  style={{ 
                    padding: '0.65rem 1.25rem', 
                    background: (isBlasting || !blastDeviceId) ? '#94a3b8' : '#0984e3', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: (isBlasting || !blastDeviceId) ? 'not-allowed' : 'pointer', 
                    fontWeight: 600, 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    transition: 'opacity 0.2s'
                  }}
                  onClick={handleSendBlast}
                >
                  {isBlasting ? <RefreshCw size={16} /> : <Zap size={16} />}
                  {isBlasting ? 'Mengirim...' : 'Kirim Blast Sekarang'}
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

      <PopupModal 
        isOpen={modalCtx.isOpen} 
        type={modalCtx.type} 
        title={modalCtx.title} 
        message={modalCtx.message} 
        onConfirm={modalCtx.onConfirm}
        showCancel={modalCtx.showCancel}
        onClose={() => setModalCtx({ ...modalCtx, isOpen: false, showCancel: false, onConfirm: null })} 
      />
    </div>
  );
};

export default WhatsApp;
