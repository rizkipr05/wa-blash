import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  ClipboardList, 
  Search, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = React.useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/logs/blast', {
        params: { page, search, status, limit: 20 }
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

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Log Aktivitas Global</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pantau riwayat pengiriman pesan seluruh sistem</p>
        </div>
        <button 
          onClick={() => fetchLogs(pagination.page)} 
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Cari target, pesan, atau nama user..." 
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

      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        {isLoading && logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data log...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <ClipboardList size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--text-main)' }}>Belum Ada Data</h3>
            <p style={{ color: 'var(--text-muted)' }}>Riwayat pengiriman akan muncul di sini secara otomatis.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Target / User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Isi Pesan</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)' }}>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{log.target}</div>
                      <div style={{ fontSize: '0.75rem', color: '#0984e3' }}>User ID: {log.userId}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', color: '#f1f1f1', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {log.status === 'SUCCESS' ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                          <CheckCircle size={14} /> Berhasil
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                            <XCircle size={14} /> Gagal
                          </span>
                          {log.error && <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{log.error}</span>}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>
                      {new Date(log.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
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
    </div>
  );
};

export default AdminActivityLog;
