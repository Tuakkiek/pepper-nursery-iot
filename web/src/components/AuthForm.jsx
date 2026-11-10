import React, { useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/auth.js';

export default function AuthForm({ onSuccess, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const uid = useId();
  const usernameId = `${uid}-username`;
  const passwordId = `${uid}-password`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(cleanUsername, password);
      if (res.user?.role !== 'admin') {
        authService.clearSession();
        setErrorMsg('Tài khoản này không có quyền Quản trị viên (admin). Cổng web chỉ dành cho Admin.');
        return;
      }

      if (showToast) {
        showToast(`Xin chào, ${res.user.full_name || res.user.username}`, 'success');
      }
      onSuccess(res.user);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể xác thực tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card-inner">
      <div className="auth-body">
        <div className="auth-heading">
          <h2 className="auth-title">Đăng nhập Quản trị</h2>
          <p className="auth-subtitle">
            Đăng nhập bằng tài khoản Admin để quản lý quy tắc và người dùng.
          </p>
        </div>

        {errorMsg && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} className="auth-error-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor={usernameId} className="auth-label">
              Tên đăng nhập
            </label>
            <input
              id={usernameId}
              type="text"
              className="auth-input"
              placeholder="Nhập tên tài khoản Admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor={passwordId} className="auth-label">
              Mật khẩu
            </label>
            <div className="auth-password-wrap">
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                className="auth-input auth-input-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={17} className="auth-spinner" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
