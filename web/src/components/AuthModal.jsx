import React, { useState } from 'react';
import { X, ShieldCheck, User, KeyRound } from 'lucide-react';
import { authService } from '../services/auth.js';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
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
        onClose();
      } else {
        const res = await authService.register({
          username,
          password,
          full_name: fullName || username,
          role
        });
        showToast('Đăng ký tài khoản thành công! Đã tự động đăng nhập.', 'success');
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="var(--brand-navy)" />
            <h3 className="modal-title">
              {tab === 'login' ? 'Đăng nhập Hệ thống' : 'Đăng ký Tài khoản'}
            </h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="segmented-switch" style={{ alignSelf: 'flex-start' }}>
          <button 
            type="button"
            className={`segmented-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setErrorMsg(''); }}
          >
            Đăng nhập
          </button>
          <button 
            type="button"
            className={`segmented-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setErrorMsg(''); }}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Quick Fill Preset Buttons */}
        {tab === 'login' && (
          <div style={{
            background: 'var(--teal-soft)',
            border: '1px solid var(--brand-teal)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-navy)' }}>
              ⚡ Điền nhanh tài khoản thử nghiệm từ CSDL:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('admin', 'admin123')}
              >
                <ShieldCheck size={13} color="var(--brand-coral)" />
                <span>Admin (admin / admin123)</span>
              </button>
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('user', 'user123')}
              >
                <User size={13} />
                <span>Kỹ thuật (user / user123)</span>
              </button>
            </div>
          </div>
        )}

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
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input 
              type="password"
              required
              className="form-input"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>
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

