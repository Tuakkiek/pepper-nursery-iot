import React, { useState, useEffect } from 'react';
import AdminConsole from './components/AdminConsole.jsx';
import LoginPage from './components/LoginPage.jsx';
import Toast from './components/Toast.jsx';
import { authService } from './services/auth.js';

function getInitialAdminUser() {
  const u = authService.getUser();
  if (u && u.role === 'admin') {
    return u;
  }
  if (u) {
    authService.clearSession();
  }
  return null;
}

export default function App() {
  const [user, setUser] = useState(getInitialAdminUser);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Xác thực lại phiên Admin khi tải trang
  useEffect(() => {
    authService.verifySession().then(u => {
      if (u && u.role === 'admin') {
        setUser(u);
      } else {
        if (u) {
          authService.clearSession();
        }
        setUser(null);
      }
    });
  }, []);

  const handleLogout = () => {
    authService.clearSession();
    setUser(null);
    showToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  if (!user) {
    return (
      <>
        <LoginPage
          onLoginSuccess={(u) => setUser(u)}
          showToast={showToast}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="app-wrapper">
      <AdminConsole
        user={user}
        onLogout={handleLogout}
        showToast={showToast}
      />
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
