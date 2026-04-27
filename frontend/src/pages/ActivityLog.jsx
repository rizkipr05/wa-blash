import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  User,
  Smartphone,
  LogOut,
  Home,
  Users,
  Wallet,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/1.jpg';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = React.useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/logs/blast', {
        params: { page, search, status, limit: 15 }
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const navItems = [
    { label: 'Home', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'WhatsApp', icon: <MessageSquare size={20} />, path: '/whatsapp' },
    { label: 'Logs', icon: <ClipboardList size={20} />, path: '/logs', active: true },
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
              <img src={brandLogo} alt="Logo" />
            </div>
            <div>
              <h1 className="header-title">Log Aktivitas</h1>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Riwayat pengiriman pesan blast</p>
            </div>
          </div>
        </header>

        <div className="filters-container" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari target atau pesan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--card-bg)', color: '#fff', outline: 'none' }}
            />
          </form>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--card-bg)', color: '#fff', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Semua Status</option>
            <option value="SUCCESS">Berhasil</option>
            <option value="FAILED">Gagal</option>
          </select>
        </div>

        <div className="device-list-container" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '4rem 2rem' }}>
              <ClipboardList size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <h3>Belum Ada Log</h3>
              <p>Riwayat pengiriman akan muncul di sini.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Target</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{log.target}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {log.status === 'SUCCESS' ? (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <CheckCircle size={14} /> Berhasil
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <XCircle size={14} /> Gagal
                            </span>
                            {log.error && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{log.error}</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: '#94a3b8' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '5rem' }}>
          <button 
            onClick={() => fetchLogs(pagination.page - 1)} 
            disabled={pagination.page === 1 || isLoading}
            style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', opacity: pagination.page === 1 ? 0.3 : 1 }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Halaman {pagination.page} dari {pagination.totalPages}</span>
          <button 
            onClick={() => fetchLogs(pagination.page + 1)} 
            disabled={pagination.page === pagination.totalPages || isLoading}
            style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', opacity: pagination.page === pagination.totalPages ? 0.3 : 1 }}
          >
            <ChevronRight size={20} />
          </button>
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

export default ActivityLog;
