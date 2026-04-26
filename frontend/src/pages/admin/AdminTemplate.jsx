import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Image as ImageIcon, Send, XCircle, CheckCircle, Upload, Users, Link2, MousePointer2, Type } from 'lucide-react';
import PopupModal from '../../components/PopupModal';

const AdminTemplate = () => {
  const [caption, setCaption] = useState('');
  const [targetNumbers, setTargetNumbers] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [currentImage, setCurrentImage] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeStatus, setRemoveStatus] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [modalCtx, setModalCtx] = useState({ isOpen: false, type: '', title: '', message: '' });

  const getBackendUrl = () => {
    return api.defaults.baseURL.replace('/api', '');
  };

  const fetchTemplate = React.useCallback(async () => {
    try {
      const response = await api.get('/admin/settings');
      setCaption(response.data.global_message_template || '');
      setTargetNumbers(response.data.global_target_numbers || '');
      setButtonText(response.data.global_button_text || '');
      setButtonUrl(response.data.global_button_url || 'https://t.me/setorwader');
      if (response.data.global_image_url) {
        setCurrentImage(getBackendUrl() + response.data.global_image_url);
      }
    } catch (err) {
      console.error('Failed to fetch template:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchTemplate();
  }, [fetchTemplate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setModalCtx({ isOpen: true, type: 'error', title: 'Batas Ukuran', message: 'Ukuran maksimal gambar adalah 5MB' });
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRemoveStatus(false);
    }
  };

  const handleRemoveExistingImage = () => {
    setCurrentImage(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveStatus(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('global_target_numbers', targetNumbers);
      formData.append('buttonText', buttonText);
      formData.append('buttonUrl', buttonUrl);

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (removeStatus) {
        formData.append('removeImage', 'true');
      }

      await api.post('/admin/template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setModalCtx({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Template Campaign tersimpan!' });

      await fetchTemplate();
      setPreviewUrl(null);
      setSelectedFile(null);
      setRemoveStatus(false);

    } catch (err) {
      setModalCtx({ isOpen: true, type: 'error', title: 'Gagal', message: err.response?.data?.message || 'Gagal menyimpan template' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Campaign Template</h2>
        <p style={{ color: 'var(--text-muted)' }}>Tentukan pesan dan foto baku yang akan dipakai seluruh user saat menyebar pesan.</p>
      </div>

      <div className="template-grid">

        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit}>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span>Lampiran Foto (Cover)</span>
                {(currentImage || previewUrl) && (
                  <button type="button" onClick={handleRemoveExistingImage} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={14} /> Hapus Foto
                  </button>
                )}
              </label>

              {(currentImage || previewUrl) ? (
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '0.5rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', marginBottom: '1rem' }}>
                  <img src={previewUrl || currentImage} alt="Cover Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }} />
                </div>
              ) : null}

              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.03)', transition: 'all 0.2s' }}>
                <Upload size={24} color="#64748b" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Klik untuk pilih foto... (Max 5MB)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <Type size={16} /> Isi Pesan / Caption Utama
              </label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                required
                placeholder="Ketik kampanye produk spesial Bapak/Ibu di sini..."
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(255, 255, 255, 0.03)', minHeight: '180px', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.5', color: '#fff' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <MousePointer2 size={16} /> Interactive Link Button
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'relative' }}>
                  <MousePointer2 size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    placeholder="Teks Tombol (Contoh: Gabung Sekarang)"
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(0,0,0,0.2)', fontSize: '0.9rem', color: '#fff' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <Link2 size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={buttonUrl}
                    onChange={e => setButtonUrl(e.target.value)}
                    placeholder="URL Tujuan (Contoh: https://t.me/setorwader)"
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(0,0,0,0.2)', fontSize: '0.9rem', color: '#fff' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <Users size={16} /> Daftar Nomor Target Global
              </label>
              <textarea
                value={targetNumbers}
                onChange={e => setTargetNumbers(e.target.value)}
                required
                placeholder="6281xxxx&#10;6282xxxx&#10;... (Satu nomor per baris atau pisahkan dengan koma)"
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'rgba(255, 255, 255, 0.03)', minHeight: '140px', resize: 'vertical', fontSize: '0.9rem', lineHeight: '1.5', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                Total: <strong style={{ color: '#0984e3' }}>{targetNumbers.split(/[\n,]+/).map(t => t.trim()).filter(t => t).length}</strong> nomor terdeteksi.
              </span>
            </div>

            <button type="submit" disabled={isLoading} style={{ width: '100%', background: '#0984e3', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: isLoading ? 0.7 : 1 }}>
              <Send size={16} /> {isLoading ? 'Menyimpan...' : 'Simpan Setelan Campaign'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#e1eec3', backgroundImage: 'linear-gradient(to top, #f05053 0%, #e1eec3 100%)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>📱 Live Preview (WhatsApp)</h4>

            <div style={{ background: 'var(--card-bg)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              {(currentImage || previewUrl) ? (
                <img src={previewUrl || currentImage} alt="Preview" style={{ width: '100%', objectFit: 'cover' }} />
              ) : null}

              <div style={{ padding: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {caption || <span style={{ color: '#b2bec3', fontStyle: 'italic' }}>Tidak ada teks...</span>}
                </p>
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>10:45 AM</span>
                </div>
              </div>

              {/* Dynamic CTA button preview — connected to form */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 0.5rem', padding: '0.6rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: buttonText ? '#34d399' : '#64748b', fontWeight: 700, fontSize: '0.82rem', background: buttonText ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255,255,255,0.03)', padding: '0.55rem', borderRadius: '8px', border: `1px solid ${buttonText ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s', flexDirection: 'column' }}>
                    <span>🔗 {buttonText || <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Teks tombol akan muncul disini...</span>}</span>
                    {buttonUrl && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400, wordBreak: 'break-all' }}>{buttonUrl}</span>}
                  </div>
                </div>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '1.5rem', border: '1px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
              <ImageIcon size={24} style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.5' }}>Media gambar sangat efektif dalam meningkatkan persentase konversi (Closing) saat kampanye WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>

      <PopupModal
        isOpen={modalCtx.isOpen}
        type={modalCtx.type}
        title={modalCtx.title}
        message={modalCtx.message}
        onClose={() => setModalCtx({ ...modalCtx, isOpen: false })}
      />
    </div>
  );
};

export default AdminTemplate;
