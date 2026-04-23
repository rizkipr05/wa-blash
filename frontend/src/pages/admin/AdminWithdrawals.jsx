import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  LogOut, Users, Activity, ArrowRight, ShieldAlert, Banknote,
  Check, X
} from 'lucide-react';

const AdminWithdrawals = () => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleProcess = async (id, status) => {
    if (window.confirm(`Are you sure you want to ${status} this withdrawal?`)) {
      try {
        await api.put(`/admin/withdrawals/${id}/process`, { status });
        alert(`Withdrawal strictly marked as ${status}`);
        fetchWithdrawals();
      } catch {
        alert('Error processing withdrawal');
      }
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: <Activity size={20} />, path: '/admin' },
    { label: 'Users', icon: <Users size={20} />, path: '/admin/users' },
    { label: 'Withdrawals', icon: <Banknote size={20} />, path: '/admin/withdrawals', active: true },
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
              <h1 className="header-title">Withdrawal Requests</h1>
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
              <Banknote size={18} color="#d63031" />
              <span>Pending & Processed Actions</span>
              <span style={{ fontSize: '0.6rem', background: '#fff5f5', color: '#d63031', padding: '2px 6px', borderRadius: '4px' }}>
                {withdrawals.filter(w => w.status === 'PENDING').length} Pending
              </span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f5f7fa', color: '#636e72', fontSize: '0.8rem', borderBottom: '1px solid #dfe6e9' }}>
                <th style={{ padding: '1rem' }}>DATE & USER</th>
                <th style={{ padding: '1rem' }}>AMOUNT (Rp)</th>
                <th style={{ padding: '1rem' }}>BANK DETAILS</th>
                <th style={{ padding: '1rem' }}>STATUS</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((wd) => (
                <tr key={wd.id} style={{ borderBottom: '1px solid #f1f2f6', background: wd.status === 'PENDING' ? '#fffbfa' : 'white' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700 }}>{wd.user.username}</div>
                    <div style={{ fontSize: '0.7rem', color: '#b2bec3' }}>{new Date(wd.createdAt).toLocaleString('id-ID')}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 800, color: '#d63031' }}>
                    {Number(wd.amount).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{wd.bankDetails.bankName || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#636e72' }}>{wd.bankDetails.accountNumber || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#636e72' }}>{wd.bankDetails.accountHolder || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', 
                      background: wd.status === 'PENDING' ? '#fff9eb' : wd.status === 'APPROVED' ? '#e6fff9' : '#fff5f5', 
                      color: wd.status === 'PENDING' ? '#fdcb6e' : wd.status === 'APPROVED' ? '#00b894' : '#ff7675' 
                    }}>
                      {wd.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {wd.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleProcess(wd.id, 'APPROVED')}
                          style={{ border: 'none', background: '#00b894', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleProcess(wd.id, 'REJECTED')}
                          style={{ border: 'none', background: '#ff7675', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#b2bec3', fontStyle: 'italic' }}>Processed</span>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#b2bec3' }}>No withdrawals found</td>
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

export default AdminWithdrawals;
