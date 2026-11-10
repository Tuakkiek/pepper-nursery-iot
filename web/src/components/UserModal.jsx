import React, { useState } from 'react';
import { X, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function UserModal({ isOpen, onClose, onSave }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setUsername('');
    setFullName('');
    setPassword('');
    setShowPassword(false);
    setRole('user');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await onSave({
        username: username.trim(),
        full_name: fullName.trim() || username.trim(),
        password,
        role
      });
      handleClose();
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--brand-navy)" />
            <h3 className="modal-title">Thêm Người dùng Mới</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập (Username) *</label>
            <input 
              type="text"
              required
              className="form-input"
              placeholder="ví dụ: kythuat_01"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Họ và tên hiển thị</label>
            <input 
              type="text"
              className="form-input"
              placeholder="ví dụ: Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu khởi tạo *</label>
            <div className="password-input-wrap">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

          <div className="form-group">
            <label className="form-label">Vai trò (Role) *</label>
            <select 
              className="select-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}
            >
              <option value="user">Kỹ thuật viên (user) — Giám sát & theo dõi vi khí hậu</option>
              <option value="admin">Quản trị viên (admin) — Toàn quyền quản trị quy tắc & người dùng</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

