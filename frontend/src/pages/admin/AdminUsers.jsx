import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Wallet, Monitor, Edit3, Trash2 } from 'lucide-react';
import PopupModal from '../../components/PopupModal';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', username: '', balance: '', rank: '', bankName: '', accountNumber: '', accountHolder: '' });
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null, showCancel: false });
  
  const fetchUsers = React.useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (id, username) => {
    setModalCtx({
      isOpen: true,
      type: 'warning',
      title: 'Peringatan Hapus',
      message: `PERINGATAN: Apakah Anda yakin ingin menghapus user ${username}? Semua data (saldo, device, riwayat) akan ikut terhapus permanen.`,
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          setModalCtx({ isOpen: true, type: 'success', title: 'Berhasil', message: 'User berhasil dihapus dari sistem.' });
          fetchUsers();
        } catch {
          setModalCtx({ isOpen: true, type: 'error', title: 'Gagal', message: 'Error menghapus user.' });
        }
      }
    });
  };

  const handleEditClick = (user) => {
    setEditFormData({
      id: user.id,
      username: user.username,
      balance: user.balance,
      rank: user.rank,
      bankName: user.bankName || '',
      accountNumber: user.accountNumber || '',
      accountHolder: user.accountHolder || ''
    });
    setEditModalOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editFormData.id}`, {
        username: editFormData.username,
        balance: parseFloat(editFormData.balance),
        rank: editFormData.rank,
        bankName: editFormData.bankName,
        accountNumber: editFormData.accountNumber,
        accountHolder: editFormData.accountHolder
      });
      setEditModalOpen(false);
      fetchUsers();
      setModalCtx({ isOpen: true, type: 'success', title: 'Sukses', message: 'User updated successfully!' });
    } catch (err) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Error', message: err.response?.data?.message || 'Error updating user' });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>User Management</h2>
        <p style={{ color: 'var(--text-muted)' }}>Kelola data member aktif</p>
      </div>

      <div className="device-list-container">
        <div className="list-header" style={{ padding: '1.5rem' }}>
          <div className="list-title">
            <Users size={20} color="#0984e3" />
            <span>Registered Users</span>
            <span style={{ fontSize: '0.7rem', background: '#ebf5ff', color: '#0984e3', padding: '4px 8px', borderRadius: '6px' }}>{users.length}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.5rem' }}>ID & USERNAME</th>
                <th style={{ padding: '1rem 1.5rem' }}>BALANCE (Rp)</th>
                <th style={{ padding: '1rem 1.5rem' }}>RANK</th>
                <th style={{ padding: '1rem 1.5rem' }}>STATS</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', background: 'var(--card-bg)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user.username}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>ID: {user.id} | Joined: {new Date(user.createdAt).toLocaleDateString('id-ID')}</div>
                    {user.bankName && (
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                         🏦 {user.bankName} - {user.accountNumber} ({user.accountHolder})
                       </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#10b981' }}>
                    {Number(user.balance).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: '#eff6ff', color: '#3b82f6' }}>
                      {user.rank}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span title="Devices" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Monitor size={14}/> {user._count?.devices || 0}</span>
                      <span title="Withdrawals" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wallet size={14}/> {user._count?.withdrawals || 0}</span>
                      <span title="Referrals" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14}/> {user._count?.referrals || 0}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleEditClick(user)}
                      style={{ border: '1px solid #e2e8f0', background: 'var(--card-bg)', color: 'var(--text-muted)', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginRight: '8px', transition: 'all 0.2s' }}
                      title="Edit User"
                      onMouseOver={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Delete User"
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>No users found in the system</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.5rem', width: 'min(90vw, 400px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', color: 'var(--text-main)' }}>Edit User</h3>
            <form onSubmit={submitEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Username</label>
                <input 
                  type="text" 
                  value={editFormData.username} 
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Balance (Rp)</label>
                <input 
                  type="number" 
                  value={editFormData.balance} 
                  onChange={(e) => setEditFormData({...editFormData, balance: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Bank Name</label>
                <input 
                  type="text" 
                  value={editFormData.bankName} 
                  onChange={(e) => setEditFormData({...editFormData, bankName: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Account Number</label>
                  <input 
                    type="text" 
                    value={editFormData.accountNumber} 
                    onChange={(e) => setEditFormData({...editFormData, accountNumber: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Account Holder</label>
                  <input 
                    type="text" 
                    value={editFormData.accountHolder} 
                    onChange={(e) => setEditFormData({...editFormData, accountHolder: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Rank</label>
                <select 
                  value={editFormData.rank} 
                  onChange={(e) => setEditFormData({...editFormData, rank: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', appearance: 'auto' }}
                >
                  <option value="BASIC">BASIC</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditModalOpen(false)} style={{ padding: '0.6rem 1.2rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ padding: '0.6rem 1.2rem', background: '#0984e3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default AdminUsers;
