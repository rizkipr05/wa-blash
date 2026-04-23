import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  LogOut, Users, Activity, ArrowRight, ShieldAlert, 
  Wallet, Monitor, Banknote, Edit3, Trash2
} from 'lucide-react';

const AdminUsers = () => {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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

  const navItems = [
    { label: 'Dashboard', icon: <Activity size={20} />, path: '/admin' },
    { label: 'Users', icon: <Users size={20} />, path: '/admin/users', active: true },
    { label: 'Withdrawals', icon: <Banknote size={20} />, path: '/admin/withdrawals' },
    { label: 'Portal', icon: <ArrowRight size={20} />, path: '/dashboard' },
  ];

  return (
    <div className="dashboard-container" style={{ background: '#f0f2f5' }}>
      <main className="dashboard-main">
        <header className="dashboard-header" style={{ borderBottom: '2px solid #ff7675' }}>
          <div className="header-left">
            <div className="header-logo" style={{ background: '#ff7675' }}>
              <ShieldAlert size={20} color="white" />
            </div>
            <div>
              <h1 className="header-title">User Management</h1>
              <p style={{ fontSize: '0.65rem', color: '#d63031', fontWeight: 700 }}>ADMIN PANEL</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="device-list-container" style={{ marginTop: '2rem', marginBottom: '6rem', overflowX: 'auto' }}>
          <div className="list-header">
            <div className="list-title">
              <Users size={18} color="#0984e3" />
              <span>Registered Users</span>
              <span style={{ fontSize: '0.6rem', background: '#ebf5ff', color: '#0984e3', padding: '2px 6px', borderRadius: '4px' }}>{users.length}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#f5f7fa', color: '#636e72', fontSize: '0.8rem', borderBottom: '1px solid #dfe6e9' }}>
                <th style={{ padding: '1rem' }}>ID & USERNAME</th>
                <th style={{ padding: '1rem' }}>BALANCE (Rp)</th>
                <th style={{ padding: '1rem' }}>RANK</th>
                <th style={{ padding: '1rem' }}>STATS</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f2f6', background: 'white' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700 }}>{user.username}</div>
                    <div style={{ fontSize: '0.7rem', color: '#b2bec3' }}>ID: {user.id} | Joined: {new Date(user.createdAt).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#00b894' }}>
                    {Number(user.balance).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: '#ebf5ff', color: '#0984e3' }}>
                      {user.rank}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#636e72' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span title="Devices"><Monitor size={14}/> {user._count?.devices || 0}</span>
                      <span title="Withdrawals"><Wallet size={14}/> {user._count?.withdrawals || 0}</span>
                      <span title="Referrals"><Users size={14}/> {user._count?.referrals || 0}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => alert('Edit feature placeholder. To implement fully, add a modal to send PUT /admin/users/:id')}
                      style={{ border: 'none', background: '#ebf5ff', color: '#0984e3', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
                      title="Edit User"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      style={{ border: 'none', background: '#fff5f5', color: '#ff7675', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#b2bec3' }}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav className="bottom-nav" style={{ borderTop: '2px solid #ff7675' }}>
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className={`nav-item ${item.active ? 'active' : ''}`} style={item.active ? { color: '#d63031', background: '#fff5f5' } : {}}>
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

export default AdminUsers;
