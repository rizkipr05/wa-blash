import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import PopupModal from '../../components/PopupModal';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();

  const handleCloseModal = () => {
    if (modalCtx.type === 'success') {
      navigate('/admin');
    } else {
      setModalCtx({ ...modalCtx, isOpen: false });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Verifikasi Robot', message: 'Harap selesaikan kotak reCAPTCHA terlebih dahulu sebelum masuk.' });
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/api/auth/admin-login', {
        username,
        password,
        recaptchaToken
      });
      localStorage.setItem('token', response.data.token);
      setModalCtx({ isOpen: true, type: 'success', title: 'Portal Terbuka', message: 'Kredensial Admin dikonfirmasi, mengarahkan ke dashboard administrasi...' });
    } catch (err) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Akses Ditolak', message: err.response?.data?.message || 'Gagal masuk sebagai Admin. Pastikan kredensial benar.' });
    }
  };

  const isFormValid = username.length > 0 && password.length > 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ borderTop: '4px solid #0984e3' }}>
        <div className="logo-wrapper">
          <div className="logo-box" style={{ background: '#0984e3' }}>
            <ShieldAlert size={28} color="white" />
          </div>
        </div>
        <h1 className="title" style={{ color: '#0984e3' }}>Portal Administrator</h1>
        <p className="subtitle">Sistem Manajemen setorwa-der.com</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username Admin</label>
            <div className="input-container">
              <User className="input-icon" size={20} color="#0984e3" />
              <input
                type="text"
                placeholder="Username administrator..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <div className="input-container">
              <Lock className="input-icon" size={20} color="#0984e3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'center' }}>
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" 
              onChange={(token) => setRecaptchaToken(token)}
            />
          </div>

          <button
            type="submit"
            className={`btn ${isFormValid && recaptchaToken ? 'btn-primary' : ''}`}
            style={isFormValid && recaptchaToken ? { background: '#0984e3' } : { background: '#cbd5e0', cursor: 'not-allowed', color: 'white' }}
            disabled={!isFormValid || !recaptchaToken}
          >
            Akses Portal <ArrowRight size={18} />
          </button>
        </form>

        <div className="divider">
          <span>Bukan Administrator?</span>
        </div>

        <Link to="/login" className="btn btn-secondary">
          Kembali ke Login User
        </Link>

        <PopupModal 
          isOpen={modalCtx.isOpen} 
          type={modalCtx.type} 
          title={modalCtx.title} 
          message={modalCtx.message} 
          onClose={handleCloseModal} 
        />
      </div>
      <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
        © 2025 setorwa-der.com | PROTECTED AREA
      </div>
    </div>
  );
};

export default AdminLogin;
