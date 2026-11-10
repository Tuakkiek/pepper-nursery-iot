import React, { useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/auth.js';

export default function AuthForm({ onSuccess, showToast, headerExtra = null }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const uid = useId();
  const fullNameId = `${uid}-fullname`;
  const usernameId = `${uid}-username`;
  const passwordId = `${uid}-password`;

  const handleTabChange = (nextTab) => {
    if (nextTab === tab) return;
    setTab(nextTab);
    setErrorMsg('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }

    if (tab === 'register' && password.length < 6) {
      setErrorMsg('Mật khẩu cần có tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        const res = await authService.login(cleanUsername, password);
        if (showToast) {
          showToast(`Xin chào, ${res.user.full_name || res.user.username}`, 'success');
        }
        onSuccess(res.user);
      } else {
        const res = await authService.register({
          username: cleanUsername,
          password,
          full_name: fullName.trim() || cleanUsername,
          role: 'user'
        });
        if (showToast) {
          showToast('Đăng ký tài khoản thành công.', 'success');
        }
        onSuccess(res.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể xác thực tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card-inner">
      {headerExtra}

      {/* Thanh chuyển tab dạng underline, luôn nằm trên một hàng */}
      <div className="auth-tabs" role="tablist" aria-label="Chế độ xác thực">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'login'}
          className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
          onClick={() => handleTabChange('login')}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'register'}
          className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
          onClick={() => handleTabChange('register')}
        >
          Đăng ký
        </button>
      </div>

      <div className="auth-body">
        <div className="auth-heading">
          <h2 className="auth-title">
            {tab === 'login' ? 'Đăng nhập hệ thống' : 'Tạo tài khoản mới'}
          </h2>
          <p className="auth-subtitle">
            {tab === 'login'
              ? 'Theo dõi số đo cảm biến và lịch sử vườn ươm.'
              : 'Tài khoản mới được cấp quyền Kỹ thuật viên (user).'}
          </p>
        </div>

        {errorMsg && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} className="auth-error-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'register' && (
            <div className="auth-field">
              <label htmlFor={fullNameId} className="auth-label">
                Họ và tên
              </label>
              <input
                id={fullNameId}
                type="text"
                className="auth-input"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor={usernameId} className="auth-label">
              Tên đăng nhập
            </label>
            <input
              id={usernameId}
              type="text"
              className="auth-input"
              placeholder="Nhập tên tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor={passwordId} className="auth-label">
                Mật khẩu
              </label>
              {tab === 'register' && (
                <span className="auth-hint">Tối thiểu 6 ký tự</span>
              )}
            </div>
            <div className="auth-password-wrap">
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                className="auth-input auth-input-password"
                placeholder={tab === 'login' ? 'Nhập mật khẩu' : 'Tạo mật khẩu'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
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
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
            )}
          </button>

          <p className="auth-switch-text">
            {tab === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => handleTabChange(tab === 'login' ? 'register' : 'login')}
            >
              {tab === 'login' ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
