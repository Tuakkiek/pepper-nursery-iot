import React from 'react';
import { Sprout } from 'lucide-react';
import AuthForm from './AuthForm.jsx';

export default function LoginPage({ onLoginSuccess, showToast }) {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="login-brand-mark" aria-hidden="true">
            <Sprout size={20} strokeWidth={2.2} />
          </div>
          <div className="login-brand-text">
            <h1>Vườn Ươm Ớt Con IoT</h1>
            <p>Giám sát vi khí hậu và trạm cảm biến</p>
          </div>
        </div>

        <div className="auth-card">
          <AuthForm onSuccess={onLoginSuccess} showToast={showToast} />
        </div>

        <footer className="login-footer">
          Pepper Nursery IoT · Dashboard giám sát vườn ươm
        </footer>
      </div>
    </div>
  );
}
