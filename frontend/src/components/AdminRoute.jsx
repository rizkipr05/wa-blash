import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../services/api';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await api.get('/user/profile');
        if (response.data && response.data.role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };
    
    // In a real app we'd decode the JWT directly to save a network call, 
    // but for simplicity and security we verify with the profile endpoint.
    checkAdmin();
  }, []);

  if (isAdmin === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa', color: '#636e72' }}>Verifying admin access...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" />;
};

export default AdminRoute;
