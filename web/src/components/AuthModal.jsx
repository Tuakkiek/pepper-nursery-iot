import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  BadgeCheck, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  LogIn, 
  UserPlus
} from 'lucide-react';
import { authService } from '../services/auth.js';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowPassword(false);
    setErrorMsg('');
    onClose();
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setErrorMsg('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await authService.login(username, password);
        showToast(`Đăng nhập thành công! Xin chào ${res.user.full_name || res.user.username}`, 'success');
        onLoginSuccess(res.user);
        handleClose();
      } else {
        const res = await authService.register({
          username,
          password,
          full_name: fullName || username,
          role: 'user'
        });
        showToast('Đăng ký tài khoản thành công! Đã tự động đăng nhập.', 'success');
        onLoginSuccess(res.user);
        handleClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình xác thực.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-form-pane">
          {/* Thanh trên cùng: Tab Switcher & Nút Đóng */}
          <div className="auth-form-header">
            <div className="auth-tab-switch">
              <button
                type="button"
                className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabChange('login')}
              >
                <LogIn size={15} />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
                onClick={() => handleTabChange('register')}
              >
                <UserPlus size={15} />
                <span>Đăng ký mới</span>
              </button>
            </div>

            <button
              type="button"
              className="auth-close-btn"
              onClick={handleClose}
              title="Đóng cửa sổ (Esc)"
              aria-label="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>

          {/* Lời chào mừng */}
          <div className="auth-welcome-block">
            <h3 className="auth-welcome-title">
              {tab === 'login' ? 'Chào mừng trở lại 👋' : 'Tạo tài khoản mới ✨'}
            </h3>
            <p className="auth-welcome-subtitle">
              {tab === 'login'
                ? 'Nhập tài khoản để truy cập quyền quản trị và xem báo cáo vi khí hậu'
                : 'Đăng ký thành viên kỹ thuật để tham gia quản lý vườn ươm ớt'}
            </p>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMsg && (
            <div className="auth-error-banner">
              <AlertCircle size={18} className="auth-error-icon" />
              <div className="auth-error-content">
                <strong>Xác thực không thành công</strong>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form điền thông tin */}
          <form onSubmit={handleSubmit} className="auth-form-body">
            
            {/* Họ và tên (chỉ khi đăng ký) */}
            {tab === 'register' && (
              <div className="auth-field-group">
                <label className="auth-label">Họ và tên hiển thị</label>
                <div className="auth-input-container">
                  <span className="auth-input-lead-icon">
                    <BadgeCheck size={18} />
                  </span>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Tên đăng nhập */}
            <div className="auth-field-group">
              <label className="auth-label">Tên đăng nhập (Username)</label>
              <div className="auth-input-container">
                <span className="auth-input-lead-icon">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  className="auth-input"
                  placeholder="Nhập tên tài khoản"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="auth-field-group">
              <div className="auth-label-row">
                <label className="auth-label">Mật khẩu</label>
                {tab === 'register' && (
                  <span className="auth-label-hint">Tối thiểu 6 ký tự</span>
                )}
              </div>
              <div className="auth-input-container">
                <span className="auth-input-lead-icon">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="auth-input"
                  placeholder={tab === 'login' ? 'Nhập mật khẩu của bạn' : 'Mật khẩu bảo mật'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Thông báo vai trò khi đăng ký (chỉ đăng ký kỹ thuật viên) */}
            {tab === 'register' && (
              <div className="auth-role-notice">
                <ShieldCheck size={16} className="auth-role-notice-icon" />
                <span>
                  Tài khoản đăng ký mặc định là <strong>Kỹ thuật viên (user)</strong>. Quyền Quản trị viên (admin) chỉ được cấp bởi quản trị hệ thống.
                </span>
              </div>
            )}

            {/* Nút hành động chính */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Đang xử lý thông tin...</span>
                </>
              ) : tab === 'login' ? (
                <>
                  <LogIn size={18} />
                  <span>Đăng nhập hệ thống</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Tạo tài khoản & Đăng nhập</span>
                </>
              )}
            </button>

            {/* Chuyển nhanh giữa Đăng nhập / Đăng ký */}
            <div className="auth-switch-prompt">
              {tab === 'login' ? (
                <p>
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => handleTabChange('register')}
                  >
                    Đăng ký ngay
                  </button>
                </p>
              ) : (
                <p>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => handleTabChange('login')}
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
