import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import PopupModal from '../components/PopupModal';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const navigate = useNavigate();

  const handleCloseModal = () => {
    if (modalCtx.type === 'success') {
      navigate('/login');
    } else {
      setModalCtx({ ...modalCtx, isOpen: false });
    }
  };

  const validatePassword = (pw) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pw);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Kata Sandi Lemah', message: 'Kata sandi minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, serta simbol khusus.' });
      return;
    }
    if (password !== confirmPassword) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Kata Sandi Tidak Cocok', message: 'Tolong pastikan kolom konfirmasi kata sandi sama persis dengan kata sandi Anda.' });
      return;
    }
    if (!recaptchaToken) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Aksi Ditolak', message: 'Harap selesaikan reCAPTCHA sebelum mendaftar.' });
      return;
    }
    try {
      await axios.post('http://localhost:3000/api/auth/register', { 
        username, 
        password,
        recaptchaToken 
      });
      setModalCtx({ isOpen: true, type: 'success', title: 'Registrasi Berhasil!', message: 'Akun Anda sudah selesai dibentuk. Silakan lanjut ke halaman masuk.' });
    } catch (err) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Gagal Mendaftar', message: err.response?.data?.message || 'Terjadi kesalahan sistem, silakan coba lagi.' });
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
          <div className="input-container" style={{ position: 'relative' }}>
            <Lock className="input-icon" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Min 8 karakter + spesial" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={{ width: '100%', paddingRight: '2.5rem' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Password Validation Checklist */}
          {password && (
            <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ color: password.length >= 8 ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {password.length >= 8 ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} Min 8 Karakter
              </div>
              <div style={{ color: /[A-Z]/.test(password) && /[a-z]/.test(password) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} Besar & Kecil
              </div>
              <div style={{ color: /[0-9]/.test(password) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/[0-9]/.test(password) ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} Menyertakan Angka
              </div>
              <div style={{ color: /[@$!%*?&]/.test(password) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/[@$!%*?&]/.test(password) ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} Simbol (Contoh: @#)
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Konfirmasi Kata Sandi</label>
          <div className="input-container" style={{ position: 'relative' }}>
            <ShieldCheck className="input-icon" size={20} />
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Ulangi kata sandi" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              style={{ width: '100%', paddingRight: '2.5rem' }}
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ background: 'none', border: 'none', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword && (
             <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: password === confirmPassword ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
               {password === confirmPassword ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} 
               {password === confirmPassword ? 'Kata sandi cocok' : 'Kata sandi tidak sesuai'}
             </div>
          )}
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
      <PopupModal 
        isOpen={modalCtx.isOpen} 
        type={modalCtx.type} 
        title={modalCtx.title} 
        message={modalCtx.message} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default Register;
