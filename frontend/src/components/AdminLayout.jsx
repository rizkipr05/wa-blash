import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Users, ShieldAlert, User, Home, MessageSquare, CreditCard } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: <Home size={18} /> },
    { label: 'Campaign Template', path: '/admin/template', icon: <MessageSquare size={18} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={18} /> },
    { label: 'Withdrawals', path: '/admin/withdrawals', icon: <CreditCard size={18} /> },
    { label: 'My Profile', path: '/admin/profile', icon: <User size={18} /> }
  ];

  return (
    <div className="admin-layout-container">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="header-logo" style={{ background: '#ff7675' }}>
            <ShieldAlert size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d3436' }}>WainAdmin</h1>
            <p style={{ fontSize: '0.65rem', color: '#d63031', fontWeight: 700 }}>RESTRICTED ACCESS</p>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item, index) => {
             const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname === item.path);
             return (
              <Link key={index} to={item.path} className={`admin-nav-item ${isActive ? 'active' : ''}`}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
             )
          })}
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d63031', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2d3436' }}>{username}</div>
              <div style={{ fontSize: '0.75rem', color: '#636e72' }}>Administrator</div>
            </div>
          </div>
          
          <button onClick={handleLogout} className="btn" style={{ background: '#ff7675', color: 'white', fontSize: '0.85rem', padding: '0.75rem', width: '100%', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout Sistem
          </button>
        </div>
      </aside>

      <main className="admin-main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
