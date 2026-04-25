import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Banknote, Check, X } from 'lucide-react';
import PopupModal from '../../components/PopupModal';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null, showCancel: false });

  const fetchWithdrawals = React.useCallback(async () => {
    try {
      const response = await api.get('/admin/withdrawals');
      setWithdrawals(response.data);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleUpdateStatus = async (id, status) => {
    setModalCtx({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Withdrawal',
      message: `Apakah Anda yakin ingin memproses status transaksi ini menjadi ${status}?`,
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.put(`/admin/withdrawals/${id}/process`, { status });
          setModalCtx({ isOpen: true, type: 'success', title: 'Berhasil', message: `Withdrawal berhasil ditandai sebagai ${status}` });
          fetchWithdrawals();
        } catch (err) {
          setModalCtx({ isOpen: true, type: 'error', title: 'Gagal', message: err.response?.data?.message || 'Error ketika memproses withdrawal' });
        }
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Withdrawal Requests</h2>
        <p style={{ color: 'var(--text-muted)' }}>Kelola permintaan pencairan dana</p>
      </div>

      <div className="device-list-container" style={{ overflowX: 'auto' }}>
        <div className="list-header" style={{ padding: '1.5rem' }}>
          <div className="list-title">
            <Banknote size={20} color="#d63031" />
            <span>Pending & Processed Actions</span>
            <span style={{ fontSize: '0.7rem', background: '#fff5f5', color: '#d63031', padding: '4px 8px', borderRadius: '6px' }}>
              {withdrawals.filter(w => w.status === 'PENDING').length} Pending
            </span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem 1.5rem' }}>DATE & USER</th>
              <th style={{ padding: '1rem 1.5rem' }}>AMOUNT (Rp)</th>
              <th style={{ padding: '1rem 1.5rem' }}>BANK DETAILS</th>
              <th style={{ padding: '1rem 1.5rem' }}>STATUS</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((wd) => (
              <tr key={wd.id} style={{ borderBottom: '1px solid #f1f5f9', background: wd.status === 'PENDING' ? '#fffbfa' : 'white' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{wd.user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{new Date(wd.createdAt).toLocaleString('id-ID')}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 800, color: '#d63031' }}>
                  {Number(wd.amount).toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{wd.bankDetails.bankName || '-'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wd.bankDetails.accountNumber || '-'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wd.bankDetails.accountHolder || '-'}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '99px',
                    background: wd.status === 'PENDING' ? '#fff9eb' : wd.status === 'APPROVED' ? '#ecfdf5' : '#fef2f2',
                    color: wd.status === 'PENDING' ? '#d97706' : wd.status === 'APPROVED' ? '#10b981' : '#ef4444'
                  }}>
                    {wd.status}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  {wd.status === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleUpdateStatus(wd.id, 'APPROVED')}
                        style={{ border: 'none', background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.75rem', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(wd.id, 'REJECTED')}
                        style={{ border: 'none', background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.75rem', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Banknote size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>No withdrawals found in the system</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default AdminWithdrawals;
