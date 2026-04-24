import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Wallet, Monitor, Edit3, Trash2 } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  
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
    if (window.confirm(`WARNING: Are you sure you want to permanently delete user ${username}? All associated data (balances, devices, history) will be wiped.`)) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
      } catch {
        alert('Error deleting user');
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d3436' }}>User Management</h2>
        <p style={{ color: '#636e72' }}>Kelola data member aktif</p>
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
              <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.5rem' }}>ID & USERNAME</th>
                <th style={{ padding: '1rem 1.5rem' }}>BALANCE (Rp)</th>
                <th style={{ padding: '1rem 1.5rem' }}>RANK</th>
                <th style={{ padding: '1rem 1.5rem' }}>STATS</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{user.username}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>ID: {user.id} | Joined: {new Date(user.createdAt).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#10b981' }}>
                    {Number(user.balance).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: '#eff6ff', color: '#3b82f6' }}>
                      {user.rank}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span title="Devices" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Monitor size={14}/> {user._count?.devices || 0}</span>
                      <span title="Withdrawals" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wallet size={14}/> {user._count?.withdrawals || 0}</span>
                      <span title="Referrals" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14}/> {user._count?.referrals || 0}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => alert('Edit feature placeholder. To implement fully, add a modal to send PUT /admin/users/:id')}
                      style={{ border: '1px solid #e2e8f0', background: 'white', color: '#64748b', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginRight: '8px', transition: 'all 0.2s' }}
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
    </div>
  );
};

export default AdminUsers;
