import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import AuthForm from './AuthForm.jsx';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay auth-modal-overlay" onClick={onClose}>
      <div className="auth-card auth-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <AuthForm
          onSuccess={(user) => {
            onLoginSuccess(user);
            onClose();
          }}
          showToast={showToast}
          headerExtra={
            <div className="auth-modal-topbar">
              <span className="auth-modal-topbar-title">Tài khoản hệ thống</span>
              <button
                type="button"
                className="auth-close-btn"
                onClick={onClose}
                title="Đóng (Esc)"
                aria-label="Đóng cửa sổ"
              >
                <X size={18} />
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
}
