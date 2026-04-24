import React from 'react';
import ReactDOM from 'react-dom';

const PopupModal = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;
  const isSuccess = type === 'success';
  
  const modalContent = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      background: 'rgba(0, 0, 0, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff', 
        padding: '2rem 1.5rem 1rem 1.5rem', 
        borderRadius: '5px', 
        width: '90%', 
        maxWidth: '430px',
        textAlign: 'center', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        {/* SweetAlert Style Icon */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: isSuccess ? '4px solid rgba(165, 220, 134, 0.3)' : '4px solid rgba(242, 116, 116, 0.3)',
        }}>
          <span style={{ 
            color: isSuccess ? '#a5dc86' : '#f27474', 
            fontSize: '54px', 
            fontWeight: '300',
            lineHeight: '1'
          }}>
            {isSuccess ? '✓' : '✖'}
          </span>
        </div>
        
        <h2 style={{fontSize: '1.8rem', fontWeight: 600, color: '#545454', margin: '0 0 0.75rem 0'}}>{title}</h2>
        <p style={{color: '#545454', margin: '0 0 2rem 0', fontSize: '1.1rem', fontWeight: 400}}>{message}</p>
        
        {/* Bottom Right Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button onClick={onClose} style={{
            padding: '0.625rem 2rem', 
            background: isSuccess ? '#7cd1f9' : '#e06666',
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontWeight: 500, 
            cursor: 'pointer', 
            fontSize: '1rem',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={e => e.target.style.opacity = '0.8'}
          onMouseOut={e => e.target.style.opacity = '1'}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PopupModal;
