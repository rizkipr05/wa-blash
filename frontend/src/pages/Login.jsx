import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password,
        recaptchaToken
      });
      localStorage.setItem('token', response.data.token);
      alert('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const isFormValid = username.length > 0 && password.length > 0;

  return (
    <div className="glass-card">
      <div className="logo-wrapper">
        <div className="logo-box">
          <img src="/src/assets/logo.png" alt="WainAja Logo" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>
      <h1 className="title">Selamat Datang</h1>
      <p className="subtitle">Masuk ke Platform WainAja</p>

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

        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

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

      <div className="footer">
        © 2025 WainAja. Platform BY RIO CLOUD ID
      </div>
    </div>
  );
};

export default Login;
