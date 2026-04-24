import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Image as ImageIcon, Send, XCircle, CheckCircle, Upload, Users } from 'lucide-react';

const AdminTemplate = () => {
  const [caption, setCaption] = useState('');
  const [targetNumbers, setTargetNumbers] = useState('');
  const [currentImage, setCurrentImage] = useState(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeStatus, setRemoveStatus] = useState(false);
  
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getBackendUrl = () => {
    return api.defaults.baseURL.replace('/api', '');
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await api.get('/admin/settings');
        setCaption(response.data.global_message_template || '');
        setTargetNumbers(response.data.global_target_numbers || '');
        if (response.data.global_image_url) {
          setCurrentImage(getBackendUrl() + response.data.global_image_url);
        }
      } catch (err) {
        console.error('Failed to fetch template:', err);
      }
    };
    fetchTemplate();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran maksimal gambar adalah 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRemoveStatus(false);
    }
  };

  const handleRemoveExistingImage = () => {
    if (window.confirm('Hapus foto sampul? Ini akan langsung menghapusnya setelah form di-save.')) {
      setCurrentImage(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setRemoveStatus(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg('');

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('global_target_numbers', targetNumbers);
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (removeStatus) {
        formData.append('removeImage', 'true');
      }

      await api.post('/admin/template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMsg('Template berhasil disimpan & aktif untuk semua pengguna!');
      
      // refresh
      const response = await api.get('/admin/settings');
      if (response.data.global_image_url) {
        setCurrentImage(getBackendUrl() + response.data.global_image_url);
      } else {
        setCurrentImage(null);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setRemoveStatus(false);

    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d3436' }}>Campaign Template</h2>
        <p style={{ color: '#636e72' }}>Tentukan pesan dan foto baku yang akan dipakai seluruh user saat menyebar pesan.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.5fr) minmax(250px, 1fr)', gap: '2rem' }}>
        
        {/* Editor Form */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit}>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem' }}>
                <span>Lampiran Foto (Cover)</span>
                { (currentImage || previewUrl) && (
                  <button type="button" onClick={handleRemoveExistingImage} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={14}/> Hapus Foto
                  </button>
                )}
              </label>

              {(currentImage || previewUrl) ? (
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '0.5rem', textAlign: 'center', background: '#f8fafc', marginBottom: '1rem' }}>
                  <img src={previewUrl || currentImage} alt="Cover Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }} />
                </div>
              ) : null}

              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s', ':hover': { borderColor: '#94a3b8' } }}>
                <Upload size={24} color="#64748b" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Klik untuk pilih foto... (Max 5MB)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem' }}>Isi Pesan / Caption Utama</label>
              <textarea 
                value={caption} 
                onChange={e => setCaption(e.target.value)} 
                required 
                placeholder="Ketik kampanye produk spesial Bapak/Ibu di sini..."
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', minHeight: '180px', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.5' }} 
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.75rem' }}>
                <Users size={16} /> Daftar Nomor Target Global
              </label>
              <textarea 
                value={targetNumbers} 
                onChange={e => setTargetNumbers(e.target.value)} 
                required 
                placeholder="6281xxxx&#10;6282xxxx&#10;... (Satu nomor per baris atau pisahkan dengan koma)"
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', minHeight: '140px', resize: 'vertical', fontSize: '0.9rem', lineHeight: '1.5', fontFamily: 'monospace' }} 
              />
              <span style={{fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', display: 'block'}}>
                Total: <strong style={{color: '#0984e3'}}>{targetNumbers.split(/[\n,]+/).map(t => t.trim()).filter(t => t).length}</strong> nomor terdeteksi. Sistem akan memutus karakter spasi dan tanda khusus otomatis.
              </span>
            </div>
            
            {msg && (
              <div style={{ padding: '0.75rem', background: '#ecfdf5', color: '#059669', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16}/> {msg}
              </div>
            )}
            
            <button type="submit" disabled={isLoading} style={{ width: '100%', background: '#0984e3', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: isLoading ? 0.7 : 1 }}>
              <Send size={16} /> {isLoading ? 'Menyimpan...' : 'Simpan Setelan Campaign'}
            </button>
          </form>
        </div>

        {/* Live Preview Pane */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#e1eec3', backgroundImage: 'linear-gradient(to top, #f05053 0%, #e1eec3 100%)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>📱 Live Preview (WhatsApp)</h4>
            
            <div style={{ background: 'white', borderRadius: '8px', padding: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              {(currentImage || previewUrl) ? (
                <img src={previewUrl || currentImage} alt="Preview" style={{ width: '100%', objectFit: 'cover', borderRadius: '4px 4px 0 0' }} />
              ) : null}
              
              <div style={{ padding: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#2d3436', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {caption || <span style={{ color: '#b2bec3', fontStyle: 'italic' }}>Tidak ada teks...</span>}
                </p>
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>10:45 AM</span>
                </div>
              </div>
            </div>
            
          </div>
          
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', gap: '12px', color: '#64748b' }}>
              <ImageIcon size={24} style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.5' }}>Media gambar sangat efektif dalam meningkatkan persentase konversi (Closing) saat kampanye WhatsApp.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminTemplate;
