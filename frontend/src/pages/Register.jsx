import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validatePassword = (pw) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pw);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA');
      return;
    }
    try {
      await axios.post('http://localhost:3000/api/auth/register', { 
        username, 
        password,
        recaptchaToken 
      });
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const isFormValid = username.length >= 3 && password.length >= 8 && password === confirmPassword;

  return (
    <div className="glass-card">
      <div className="logo-wrapper">
        <div className="logo-box">
          <img src="/src/assets/logo.png" alt="TerimaWa Logo" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>
      <h1 className="title">Daftar Akun</h1>
      <p className="subtitle">Buat akun WainAja Anda</p>

      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <div className="input-container">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Huruf dan angka, minimal 3 karakter" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Kata Sandi</label>
          <div className="input-container">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Min 8 karakter + spesial" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Konfirmasi Kata Sandi</label>
          <div className="input-container">
            <ShieldCheck className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Ulangi kata sandi" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>
        </div>

        <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'center' }}>
          <ReCAPTCHA
            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Testing site key
            onChange={(token) => setRecaptchaToken(token)}
          />
        </div>
        
        <p style={{ fontSize: '11px', color: '#718096', marginBottom: '1.5rem', textAlign: 'center' }}>
            Harap verifikasi bahwa Anda bukan robot
        </p>

        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

        <button 
          type="submit" 
          className={`btn ${isFormValid && recaptchaToken ? 'btn-primary' : ''}`}
          style={!(isFormValid && recaptchaToken) ? { background: '#cbd5e0', cursor: 'not-allowed', color: 'white' } : {}}
          disabled={!isFormValid || !recaptchaToken}
        >
          {isFormValid && recaptchaToken ? 'Daftar Sekarang' : 'Lengkapi Form Dulu'} <ArrowRight size={18} />
        </button>
      </form>

      <div className="divider">
        <span>Sudah punya akun?</span>
      </div>

      <Link to="/login" className="btn btn-secondary">
        Masuk Sekarang
      </Link>

      <div className="footer">
        © 2025 TerimaWa. Platform  BY RIO CLOUD ID
      </div>
    </div>
  );
};

export default Register;
