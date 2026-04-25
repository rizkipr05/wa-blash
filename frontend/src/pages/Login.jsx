import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import PopupModal from '../components/PopupModal';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();

  const handleCloseModal = () => {
    if (modalCtx.type === 'success') {
      navigate('/dashboard');
    } else {
      setModalCtx({ ...modalCtx, isOpen: false });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Aksi Ditolak', message: 'Tolong selesaikan validasi reCAPTCHA terlebih dahulu sebelum masuk.' });
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password,
        recaptchaToken
      });
      localStorage.setItem('token', response.data.token);
      setModalCtx({ isOpen: true, type: 'success', title: 'Login Berhasil', message: `Selamat datang kembali, ${username}! Memuat dashboard Anda...` });
    } catch (err) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Akses Gagal', message: err.response?.data?.message || 'Kredensial tidak valid atau kesalahan server.' });
    }
  };

  const isFormValid = username.length > 0 && password.length > 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card">
        <div className="logo-wrapper">
          <div className="logo-box">
            <img src="/src/assets/logo.png" alt="setorwa-der.com Logo" style={{ width: '40px', height: '40px' }} />
          </div>
        </div>
        <h1 className="title">Selamat Datang</h1>
        <p className="subtitle">Masuk ke Platform setorwa-der.com</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-container">
              <User className="input-icon" size={20} />
              <input
                type="text"
                placeholder="pratama"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock className="input-icon" size={20} />
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

          <p style={{ fontSize: '11px', color: '#718096', marginBottom: '1.5rem', textAlign: 'center' }}>
            Harap verifikasi bahwa Anda bukan robot
          </p>

          <button
            type="submit"
            className={`btn ${isFormValid && recaptchaToken ? 'btn-primary' : ''}`}
            style={!(isFormValid && recaptchaToken) ? { background: '#cbd5e0', cursor: 'not-allowed', color: 'white' } : {}}
            disabled={!isFormValid || !recaptchaToken}
          >
            Masuk Sekarang <ArrowRight size={18} />
          </button>
        </form>

        <div className="divider">
          <span>Belum punya akun?</span>
        </div>

        <Link to="/register" className="btn btn-secondary">
          Daftar Sekarang
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
        © 2025 setorwa-der.com. Platform BY RIO CLOUD ID
      </div>
    </div>
  );
};

export default Login;
