import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WhatsApp from './pages/WhatsApp';
import Referral from './pages/Referral';
import Withdraw from './pages/Withdraw';
import Profile from './pages/Profile';

import FloatingChat from './components/FloatingChat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <div className="auth-layout">
            <div className="bg-wave"></div>
            <Login />
          </div>
        } />
        <Route path="/register" element={
          <div className="auth-layout">
            <div className="bg-wave"></div>
            <Register />
          </div>
        } />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/whatsapp" element={<WhatsApp />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
      <FloatingChat />
    </Router>
  );
}

export default App;
