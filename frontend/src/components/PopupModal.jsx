import React from 'react';
import ReactDOM from 'react-dom';

const PopupModal = ({ isOpen, type, title, message, onClose, onConfirm, confirmText = 'Ya', cancelText = 'Batal', showCancel = false }) => {
  if (!isOpen) return null;
  const isSuccess = type === 'success';
  const isWarning = type === 'warning' || type === 'confirm';
  
  const primaryColor = isSuccess ? '#a5dc86' : (isWarning ? '#f8bb86' : '#f27474');
  const btnColor = isSuccess ? '#7cd1f9' : (isWarning ? '#e11d48' : '#e06666'); // Use red for destructive warnings, blue/light-blue for success.
  const icon = isSuccess ? '✓' : (isWarning ? '!' : '✖');
  const iconBorderColor = isSuccess ? 'rgba(165, 220, 134, 0.3)' : (isWarning ? 'rgba(248, 187, 134, 0.3)' : 'rgba(242, 116, 116, 0.3)');

  const modalContent = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#0f172a', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem 1.5rem 1.5rem 1.5rem', 
        borderRadius: '16px', 
        width: '90%', 
        maxWidth: '430px',
        textAlign: 'center', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        {/* SweetAlert Style Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `3px solid ${iconBorderColor}`,
        }}>
          <span style={{ 
            color: primaryColor, 
            fontSize: '36px', 
            fontWeight: '300',
            lineHeight: '1',
            display: 'block',
            marginTop: isSuccess ? '4px' : '0'
          }}>
            {icon}
          </span>
        </div>
        
        <h2 style={{fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.75rem 0'}}>{title}</h2>
        <p style={{color: 'var(--text-muted)', margin: '0 0 2rem 0', fontSize: '1.1rem', fontWeight: 400}}>{message}</p>
        
        {/* Button Wrapper */}
        <div style={{ width: '100%', display: 'flex', justifyContent: showCancel ? 'center' : 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          {showCancel && (
            <button onClick={onClose} style={{
              padding: '0.625rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'opacity 0.2s'
            }} onMouseOver={e => e.target.style.opacity = '0.8'} onMouseOut={e => e.target.style.opacity = '1'}>
              {cancelText}
            </button>
          )}
          <button onClick={onConfirm ? onConfirm : onClose} style={{
            padding: '0.625rem 2rem', background: btnColor, color: 'white', border: 'none', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', fontSize: '1rem', transition: 'opacity 0.2s'
          }} onMouseOver={e => e.target.style.opacity = '0.8'} onMouseOut={e => e.target.style.opacity = '1'}>
            {showCancel ? confirmText : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PopupModal;
