import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  SlidersHorizontal, 
  Users, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowRightLeft,
  Shield,
  User as UserIcon,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { apiService } from '../services/api.js';
import RuleModal from './RuleModal.jsx';
import UserModal from './UserModal.jsx';

const PARAM_CONFIG = {
  air_temperature_c: { label: 'Nhiệt độ KK', unit: '°C', category: 'Không khí' },
  air_humidity_pct: { label: 'Độ ẩm KK', unit: '%', category: 'Không khí' },
  soil_temperature_c: { label: 'Nhiệt độ đất', unit: '°C', category: 'Đất' },
  soil_moisture_pct: { label: 'Độ ẩm đất', unit: '%', category: 'Đất' },
  water_ph: { label: 'pH dung dịch', unit: '', category: 'Dinh dưỡng' },
  water_tds_ppm: { label: 'TDS dung dịch', unit: 'ppm', category: 'Dinh dưỡng' },
};

const formatThreshold = (r) => {
  const unit = PARAM_CONFIG[r.parameter]?.unit ? ` ${PARAM_CONFIG[r.parameter].unit}` : '';
  if (r.operator === 'between') {
    return `${r.threshold_min ?? '?'} ~ ${r.threshold_max ?? '?'}${unit}`;
  }
  if (r.operator === 'outside') {
    return `< ${r.threshold_min} hoặc > ${r.threshold_max}${unit}`;
  }
  return `${r.operator} ${r.threshold_min ?? r.threshold_max ?? ''}${unit}`;
};

export default function AdminConsole({ user, onLogout, showToast }) {
  // Sidebar Menu State: 'dashboard' | 'rules' | 'users'
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Rules State
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paramFilter, setParamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState('ALL'); // 'ALL' | 5 | 10 | 20
  const [currentPage, setCurrentPage] = useState(1);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userModalOpen, setUserModalOpen] = useState(false);

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    loadRules();
    loadUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paramFilter, statusFilter]);

  // Load Rules
  const loadRules = async () => {
    setLoadingRules(true);
    try {
      const data = await apiService.getRules(true);
      setRules(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingRules(false);
    }
  };

  // Load Users
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Rule Handlers
  const handleToggleActive = async (rule) => {
    if (!isAdmin) {
      showToast('Cần quyền Admin để chỉnh sửa quy tắc', 'error');
      return;
    }
    try {
      await apiService.updateRule(rule.id, { is_active: !rule.is_active });
      showToast(`Đã ${!rule.is_active ? 'kích hoạt' : 'tắt'} quy tắc ${rule.rule_code}`, 'success');
      loadRules();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRule = async (id, code) => {
    if (!isAdmin) {
      showToast('Cần quyền Admin để xóa quy tắc', 'error');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa quy tắc [${code}]?`)) return;

    try {
      await apiService.deleteRule(id);
      showToast(`Đã xóa thành công quy tắc #${id}`, 'success');
      loadRules();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveRule = async (payload) => {
    try {
      if (editingRule) {
        await apiService.updateRule(editingRule.id, payload);
        showToast('Đã cập nhật quy tắc thành công', 'success');
      } else {
        await apiService.createRule(payload);
        showToast('Đã thêm quy tắc mới thành công', 'success');
      }
      setRuleModalOpen(false);
      setEditingRule(null);
      loadRules();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // User Handlers
  const handleCreateUser = async (payload) => {
    if (!isAdmin) {
      showToast('Chỉ Quản trị viên mới có quyền tạo người dùng', 'error');
      return;
    }
    try {
      await apiService.createUser(payload);
      showToast(`Tạo thành công tài khoản [${payload.username}] với vai trò ${payload.role}!`, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUserRole = async (targetUser) => {
    if (!isAdmin) {
      showToast('Cần quyền Admin để thay đổi vai trò', 'error');
      return;
    }
    if (user && user.username === targetUser.username) {
      showToast('Không thể tự thay đổi vai trò của chính mình!', 'error');
      return;
    }
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = `Chuyển vai trò của [${targetUser.username}] sang ${newRole === 'admin' ? 'Quản trị viên (admin)' : 'Kỹ thuật viên (user)'}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await apiService.updateUserRole(targetUser.id, newRole);
      showToast(`Đã cập nhật vai trò của [${targetUser.username}] thành ${newRole}`, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!isAdmin) {
      showToast('Cần quyền Admin để xóa người dùng', 'error');
      return;
    }
    if (user && user.username === targetUser.username) {
      showToast('Bạn không thể tự xóa tài khoản đang đăng nhập!', 'error');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản [${targetUser.username}]?`)) return;

    try {
      await apiService.deleteUser(targetUser.id);
      showToast(`Đã xóa tài khoản [${targetUser.username}] thành công`, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter Rules
  const filteredRules = rules.filter(r => {
    const matchSearch = r.rule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.action_advice?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchParam = paramFilter === 'ALL' || r.parameter === paramFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? r.is_active : !r.is_active);

    return matchSearch && matchParam && matchStatus;
  });

  // Pagination calculation for rules
  const totalItems = filteredRules.length;
  const itemsPerPage = pageSize === 'ALL' ? totalItems : Number(pageSize);
  const totalPages = itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = pageSize === 'ALL' ? 0 : (validCurrentPage - 1) * itemsPerPage;
  const displayedRules = pageSize === 'ALL' ? filteredRules : filteredRules.slice(startIndex, startIndex + itemsPerPage);

  // Filter Users
  const filteredUsers = users.filter(u => {
    const matchSearch = u.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  // Helper counts
  const activeRulesCount = rules.filter(r => r.is_active).length;
  const inactiveRulesCount = rules.filter(r => !r.is_active).length;
  const adminUsersCount = users.filter(u => u.role === 'admin').length;
  const techUsersCount = users.filter(u => u.role === 'user').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>
      
      {/* ================= 1. HEADER DÀNH RIÊNG CHO TRANG QUẢN TRỊ ADMIN ================= */}
      <header className="card" style={{
        padding: '14px 20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-logo-icon" style={{ width: '42px', height: '42px', fontSize: '22px' }}>
            🌱
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
              Hệ Thống Quản Trị Vườn Ươm Ớt IoT
            </h1>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Trung tâm Quản trị Quy tắc & Quản lý Người dùng
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <ShieldCheck size={16} color="var(--brand-coral)" />
            <span>{user?.full_name || user?.username || 'Admin'}</span>
            <span className="badge badge-error" style={{ fontSize: '10px' }}>admin</span>
          </div>

          {onLogout && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= 2. BỐ CỤC SIDEBAR + NỘI DUNG ================= */}
      <div className="admin-portal-wrapper">
        
        {/* SIDEBAR BÊN TRÁI: 3 MỤC DASHBOARD, QUY TẮC, NGƯỜI DÙNG */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <div className="admin-badge-tag">
              <ShieldCheck size={13} />
              <span>Menu Quản Trị</span>
            </div>
            <h2 className="admin-sidebar-title">
              <Shield size={20} color="var(--brand-coral)" />
              <span>Admin Console</span>
            </h2>
            <p className="admin-sidebar-sub">
              Điều hành chính sách vi khí hậu & người dùng
            </p>
          </div>

          {/* 3 Mục Sidebar theo yêu cầu người dùng */}
          <nav className="admin-nav-menu" aria-label="Menu quản trị">
            <button
              type="button"
              className={`admin-nav-btn ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
            >
              <div className="admin-nav-btn-left">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>
              <span className="admin-nav-badge">Tổng quan</span>
            </button>

            <button
              type="button"
              className={`admin-nav-btn ${activeMenu === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveMenu('rules')}
            >
              <div className="admin-nav-btn-left">
                <SlidersHorizontal size={18} />
                <span>Quản trị Bản Quy tắc</span>
              </div>
              <span className="admin-nav-badge">{rules.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-btn ${activeMenu === 'users' ? 'active' : ''}`}
              onClick={() => setActiveMenu('users')}
            >
              <div className="admin-nav-btn-left">
                <Users size={18} />
                <span>Quản lý Người dùng</span>
              </div>
              <span className="admin-nav-badge">{users.length}</span>
            </button>
          </nav>

          {/* Chân Sidebar */}
          <div className="admin-sidebar-footer">
            <div className="admin-user-card">
              <div className="admin-avatar-circle">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="admin-user-name">{user?.full_name || user?.username || 'Quản trị viên'}</span>
                <span className="admin-user-role">{user?.role || 'admin'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* KHUNG NỘI DUNG CHÍNH (CONTENT PANE) */}
        <main className="admin-content-pane">
          
          {/* Cảnh báo phân quyền nếu không phải Admin */}
          {!isAdmin && (
            <div className="advice-banner warning">
              <div className="advice-icon-wrap">
                <ShieldAlert size={28} color="var(--amber-strong)" />
              </div>
              <div className="advice-body">
                <div className="advice-title">Chế độ xem Quản trị (Read-Only)</div>
                <div className="advice-text">
                  Bạn đang đăng nhập với vai trò <strong>Kỹ thuật viên (user)</strong>. Để cấu hình quy tắc hoặc thêm người dùng, vui lòng sử dụng tài khoản Quản trị viên (admin).
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 1: DASHBOARD QUẢN TRỊ ================= */}
          {activeMenu === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              
              {/* Header Dashboard */}
              <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
                      📊 Dashboard Quản Trị Hệ Thống
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                      Thống kê tổng quan chính sách quy tắc nông học và tình trạng phân quyền tài khoản
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => { loadRules(); loadUsers(); }}
                      title="Làm mới dữ liệu quản trị"
                    >
                      <RefreshCw size={14} />
                      <span>Làm mới Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Thẻ KPI Quản trị */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
                {/* KPI 1 */}
                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG SỐ QUY TẮC</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand-navy)', margin: '2px 0' }}>{rules.length}</div>
                  <div style={{ fontSize: '12px', color: 'var(--success-strong)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={13} />
                    <span><strong>{activeRulesCount}</strong> đang kích hoạt ({Math.round((activeRulesCount / (rules.length || 1)) * 100)}%)</span>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>QUY TẮC TẠM DỪNG</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-secondary)', margin: '2px 0' }}>{rules.length - activeRulesCount}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={13} />
                    <span>Chờ bật kích hoạt hoặc điều chỉnh ngưỡng</span>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG SỐ TÀI KHOẢN</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand-navy)', margin: '2px 0' }}>{users.length}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Gồm <strong style={{ color: 'var(--brand-coral)' }}>{adminUsersCount} Admin</strong> và <strong>{techUsersCount} Kỹ thuật</strong>
                  </div>
                </div>
              </div>

              {/* 2 Khối Phân Tích Quản Trị Chuyên Sâu */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
                
                {/* Phân bố quy tắc theo 6 thông số đo lường */}
                <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
                      📋 Phân Bố Quy Tắc theo 6 Thông Số Nông Học
                    </h4>
                    <span className="badge badge-normal" style={{ fontSize: '11px' }}>6 Nhóm Thông số</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Thống kê số lượng quy tắc bảo vệ cây ớt con được cấu hình cho từng đại lượng (Không hiển thị số đo thời gian thực):
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    {Object.entries(PARAM_CONFIG).map(([paramKey, conf]) => {
                      const count = rules.filter(r => r.parameter === paramKey).length;
                      const activeCount = rules.filter(r => r.parameter === paramKey && r.is_active).length;
                      return (
                        <div key={paramKey} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--brand-cream)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '13px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge badge-empty" style={{ fontSize: '10.5px' }}>{conf.category}</span>
                            <strong style={{ color: 'var(--brand-navy)' }}>{conf.label}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({paramKey})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{count} quy tắc</span>
                            <span className="badge badge-ok" style={{ fontSize: '10px' }}>{activeCount} bật</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ma trận phân quyền & Quyền hạn hệ thống */}
                <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
                      🛡️ Chính Sách Phân Quyền Vai Trò (RBAC)
                    </h4>
                    <span className="badge badge-ok" style={{ fontSize: '11px' }}>Bảo mật</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Quyền hạn tương ứng giữa Người dùng Kỹ thuật và Quản trị viên:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    <div style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="badge badge-error">🛡️ Quản trị viên (admin)</span>
                        <strong style={{ fontSize: '12px', color: 'var(--coral-strong)' }}>{adminUsersCount} tài khoản</strong>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <li>Toàn quyền thêm, chỉnh sửa, bật/tắt và xóa quy tắc nông học</li>
                        <li>Tạo tài khoản mới và điều chỉnh vai trò thành viên</li>
                        <li>Toàn quyền truy cập Dashboard và cấu hình hệ thống</li>
                      </ul>
                    </div>

                    <div style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="badge badge-normal">👨‍🌾 Kỹ thuật viên (user)</span>
                        <strong style={{ fontSize: '12px', color: 'var(--brand-navy)' }}>{techUsersCount} tài khoản</strong>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <li>Theo dõi số đo cảm biến thời gian thực trên ứng dụng Mobile</li>
                        <li>Nhận cảnh báo và khuyến nghị chăm sóc tự động từ hệ thống</li>
                        <li>Không có quyền truy cập vào cổng quản trị Web (Admin Console)</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Lối tắt thao tác nhanh */}
              <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--teal-soft)', border: '1px solid var(--brand-teal)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
                      ⚡ Lối Tắt Thao Tác Quản Trị
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Chuyển nhanh tới các phân hệ hoặc mở giao diện cấu hình
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => { setActiveMenu('rules'); setEditingRule(null); setRuleModalOpen(true); }}
                      disabled={!isAdmin}
                    >
                      <Plus size={14} />
                      <span>Thêm quy tắc mới</span>
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setActiveMenu('users'); setUserModalOpen(true); }}
                      disabled={!isAdmin}
                    >
                      <Plus size={14} />
                      <span>Thêm tài khoản người dùng</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= VIEW 2: QUẢN TRỊ BẢN QUY TẮC ================= */}
          {activeMenu === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              
              {/* Header phân hệ Quy tắc */}
              <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
                      📋 Danh Sách Quy Tắc Chăm Sóc Cây Ớt Con
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Cấu hình các ngưỡng an toàn và khuyến cáo kỹ thuật tự động cho vườn ươm
                    </span>
                  </div>
                  {isAdmin && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => { setEditingRule(null); setRuleModalOpen(true); }}
                    >
                      <Plus size={15} />
                      <span>Thêm quy tắc mới</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Thẻ thống kê KPI quy tắc */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG SỐ QUY TẮC</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brand-navy)', margin: '3px 0' }}>{rules.length}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Quy tắc bảo vệ cây ớt con</div>
                </div>

                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>ĐANG KÍCH HOẠT</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success-strong)', margin: '3px 0' }}>
                    {activeRulesCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--success-strong)' }}>● Đang kiểm soát tự động</div>
                </div>

                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>TẠM DỪNG / VÔ HIỆU HÓA</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-muted)', margin: '3px 0' }}>
                    {inactiveRulesCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>○ Tạm thời không đánh giá</div>
                </div>
              </div>

              {/* Toolbar lọc quy tắc */}
              <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: '1 1 220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text"
                      placeholder="Tìm theo mã, tên quy tắc, hướng dẫn..."
                      className="form-input"
                      style={{ paddingLeft: '32px', width: '100%', fontSize: '13px' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={14} color="var(--text-secondary)" />
                    <select 
                      className="select-input"
                      value={paramFilter}
                      onChange={(e) => setParamFilter(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="ALL">Tất cả thông số</option>
                      <option value="air_temperature_c">Nhiệt độ không khí</option>
                      <option value="air_humidity_pct">Độ ẩm không khí</option>
                      <option value="soil_temperature_c">Nhiệt độ đất</option>
                      <option value="soil_moisture_pct">Độ ẩm đất</option>
                      <option value="water_ph">Độ pH nước</option>
                      <option value="water_tds_ppm">TDS dung dịch</option>
                    </select>
                  </div>

                  <div>
                    <select 
                      className="select-input"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang bật (Active)</option>
                      <option value="INACTIVE">Đang tắt (Inactive)</option>
                    </select>
                  </div>
                </div>

                {/* Bảng Quy tắc vừa khít 1 màn hình */}
                <div className="rules-table-wrap">
                  <table className="rules-table">
                    <colgroup>
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '23%' }} />
                      <col style={{ width: '12%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Mã quy tắc</th>
                        <th>Tên quy tắc</th>
                        <th>Thông số</th>
                        <th>Ngưỡng</th>
                        <th>Mức độ</th>
                        <th>Khuyến nghị</th>
                        <th style={{ textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRules ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                            Đang tải danh sách quy tắc...
                          </td>
                        </tr>
                      ) : displayedRules.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                            Không tìm thấy quy tắc nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        displayedRules.map((r) => {
                          const paramInfo = PARAM_CONFIG[r.parameter] || { label: r.parameter, unit: '' };
                          return (
                            <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.65 }}>
                              <td>
                                <code className="rule-code-badge" title={r.rule_code}>
                                  {r.rule_code}
                                </code>
                              </td>
                              <td>
                                <span className="rule-name-cell" title={r.name}>
                                  {r.name}
                                </span>
                              </td>
                              <td>
                                <span className="rule-param-cell" title={r.parameter}>
                                  {paramInfo.label}
                                </span>
                              </td>
                              <td>
                                <span className="rule-threshold-cell" title={formatThreshold(r)}>
                                  {formatThreshold(r)}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${r.severity === 'danger' || r.severity === 'critical' ? 'badge-error' : r.severity === 'warning' ? 'badge-stale' : 'badge-normal'}`}>
                                  {r.severity}
                                </span>
                              </td>
                              <td>
                                <span className="rule-advice-cell" title={r.action_advice}>
                                  {r.action_advice}
                                </span>
                              </td>
                              <td>
                                <div className="rule-actions-cell">
                                  <button
                                    className={`btn-icon ${r.is_active ? 'text-success' : 'text-muted'}`}
                                    onClick={() => handleToggleActive(r)}
                                    title={r.is_active ? 'Nhấn để tắt quy tắc' : 'Nhấn để bật quy tắc'}
                                    disabled={!isAdmin}
                                  >
                                    {r.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => { setEditingRule(r); setRuleModalOpen(true); }}
                                    title="Chỉnh sửa quy tắc"
                                    disabled={!isAdmin}
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    className="btn-icon text-danger"
                                    onClick={() => handleDeleteRule(r.id, r.rule_code)}
                                    title="Xóa quy tắc"
                                    disabled={!isAdmin}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Bar */}
                  <div className="table-pagination-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Hiển thị:</span>
                      <select
                        className="select-input"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        style={{ fontSize: '12px', padding: '2px 8px' }}
                      >
                        <option value="ALL">Tất cả ({totalItems})</option>
                        <option value={5}>5 / trang</option>
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                      </select>
                      <span>
                        Tổng cộng: <strong>{totalItems}</strong> quy tắc
                      </span>
                    </div>

                    {pageSize !== 'ALL' && totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="table-pagination-btn"
                          disabled={validCurrentPage <= 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                          ‹ Trước
                        </button>
                        <span>
                          Trang <strong>{validCurrentPage}</strong> / {totalPages}
                        </span>
                        <button
                          className="table-pagination-btn"
                          disabled={validCurrentPage >= totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                          Sau ›
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= VIEW 3: QUẢN LÝ NGƯỜI DÙNG ================= */}
          {activeMenu === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              
              {/* Header phân hệ Người dùng */}
              <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-navy)', margin: 0 }}>
                      👥 Quản Lý Người Dùng & Phân Quyền Hệ Thống
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Cấp phát và điều chỉnh vai trò Quản trị viên (admin) hoặc Kỹ thuật viên (user)
                    </span>
                  </div>
                  {isAdmin && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setUserModalOpen(true)}
                    >
                      <Plus size={15} />
                      <span>Thêm người dùng mới</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Thẻ thống kê KPI người dùng */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG SỐ TÀI KHOẢN</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brand-navy)', margin: '3px 0' }}>{users.length}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tài khoản đang hoạt động</div>
                </div>

                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>QUẢN TRỊ VIÊN (ADMIN)</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brand-coral)', margin: '3px 0' }}>
                    {adminUsersCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--coral-strong)' }}>🛡️ Toàn quyền cấu hình</div>
                </div>

                <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>KỸ THUẬT VIÊN (USER)</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brand-navy)', margin: '3px 0' }}>
                    {techUsersCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>👨‍🌾 Giám sát & theo dõi số đo</div>
                </div>
              </div>

              {/* Bảng Danh sách Người dùng */}
              <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                {/* Filter Bar Người dùng */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: '1 1 240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text"
                      placeholder="Tìm theo username, họ và tên..."
                      className="form-input"
                      style={{ paddingLeft: '32px', width: '100%', fontSize: '13px' }}
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={14} color="var(--text-secondary)" />
                    <select 
                      className="select-input"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="ALL">Tất cả vai trò</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                      <option value="user">Kỹ thuật viên (User)</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="rules-table-wrap">
                  <table className="rules-table">
                    <colgroup>
                      <col style={{ width: '24%' }} />
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Tên đăng nhập</th>
                        <th>Họ và tên</th>
                        <th>Vai trò (Role)</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                            Đang nạp danh sách tài khoản...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                            Không tìm thấy người dùng nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isCurrentUser = user && user.username === u.username;
                          return (
                            <tr key={u.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: u.role === 'admin' ? 'var(--coral-soft)' : 'var(--teal-soft)',
                                    color: u.role === 'admin' ? 'var(--brand-coral)' : 'var(--brand-navy)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    {u.role === 'admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                                  </div>
                                  <code className="rule-code-badge" style={{ fontWeight: 600 }}>
                                    {u.username}
                                  </code>
                                  {isCurrentUser && (
                                    <span style={{ fontSize: '10.5px', color: 'var(--brand-teal)', fontWeight: 600 }}>
                                      (Bạn)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span style={{ fontWeight: 500, color: 'var(--brand-navy)' }}>
                                  {u.full_name || u.username}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${u.role === 'admin' ? 'badge-error' : 'badge-normal'}`}>
                                  {u.role === 'admin' ? '🛡️ Quản trị viên' : '👨‍🌾 Kỹ thuật viên'}
                                </span>
                              </td>
                              <td>
                                <span style={{ color: 'var(--success-strong)', fontSize: '12.5px', fontWeight: 500 }}>
                                  ● Hoạt động
                                </span>
                              </td>
                              <td>
                                <div className="rule-actions-cell">
                                  <button
                                    className="btn-icon text-teal"
                                    onClick={() => handleToggleUserRole(u)}
                                    title={u.role === 'admin' ? 'Hạ quyền xuống Kỹ thuật viên' : 'Nâng quyền lên Quản trị viên'}
                                    disabled={!isAdmin || isCurrentUser}
                                  >
                                    <ArrowRightLeft size={15} />
                                  </button>
                                  <button
                                    className="btn-icon text-danger"
                                    onClick={() => handleDeleteUser(u)}
                                    title="Xóa tài khoản"
                                    disabled={!isAdmin || isCurrentUser}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>

      </div>

      {/* Modal Thêm/Sửa Quy tắc */}
      <RuleModal 
        isOpen={ruleModalOpen}
        onClose={() => { setRuleModalOpen(false); setEditingRule(null); }}
        onSave={handleSaveRule}
        initialRule={editingRule}
      />

      {/* Modal Thêm Người dùng */}
      <UserModal 
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onSave={handleCreateUser}
      />

    </div>
  );
}
