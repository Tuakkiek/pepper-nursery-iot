import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth.js';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setShowPassword(false);
    setErrorMsg('');
    onClose();
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
          role
        });
        showToast('Đăng ký tài khoản thành công! Đã tự động đăng nhập.', 'success');
        onLoginSuccess(res.user);
        handleClose();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="var(--brand-navy)" />
            <h3 className="modal-title">
              {tab === 'login' ? 'Đăng nhập Hệ thống' : 'Đăng ký Tài khoản'}
            </h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="segmented-switch" style={{ alignSelf: 'flex-start' }}>
          <button 
            type="button"
            className={`segmented-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setErrorMsg(''); setShowPassword(false); }}
          >
            Đăng nhập
          </button>
          <button 
            type="button"
            className={`segmented-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setErrorMsg(''); setShowPassword(false); }}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: 'var(--coral-soft)',
            border: '1px solid var(--brand-coral)',
            color: 'var(--coral-strong)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Họ và tên hiển thị</label>
              <input 
                type="text"
                className="form-input"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input 
              type="text"
              required
              className="form-input"
              placeholder="Nhập username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="password-input-wrap">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                placeholder={tab === 'login' ? 'Nhập mật khẩu' : 'Mật khẩu tối thiểu 6 ký tự'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Vai trò (Role)</label>
              <select 
                className="select-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Người dùng kỹ thuật (user)</option>
                <option value="admin">Quản trị viên (admin)</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : (tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

