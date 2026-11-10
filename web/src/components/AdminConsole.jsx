import React, { useState, useEffect } from 'react';
import {
  Sprout,
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  Plus,
  Search,
  Trash2,
  Edit3,
  RefreshCw,
  LogOut,
  Menu,
  X,
  Radio,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { apiService } from '../services/api.js';
import RuleModal from './RuleModal.jsx';
import ConfirmModal from './ConfirmModal.jsx';

const PARAM_CONFIG = {
  air_temperature_c: { label: 'Nhiệt độ không khí', short: 'Nhiệt độ KK', unit: '°C', category: 'Không khí' },
  air_humidity_pct: { label: 'Độ ẩm không khí', short: 'Độ ẩm KK', unit: '%', category: 'Không khí' },
  soil_temperature_c: { label: 'Nhiệt độ đất', short: 'Nhiệt độ đất', unit: '°C', category: 'Giá thể' },
  soil_moisture_pct: { label: 'Độ ẩm đất', short: 'Độ ẩm đất', unit: '%', category: 'Giá thể' },
  water_ph: { label: 'pH dung dịch', short: 'pH nước', unit: 'pH', category: 'Dinh dưỡng' },
  water_tds_ppm: { label: 'TDS dung dịch', short: 'TDS nước', unit: 'ppm', category: 'Dinh dưỡng' },
};

const SEVERITY_META = {
  danger: { label: 'Nguy hiểm', badgeClass: 'badge-error', barClass: 'bar-danger' },
  critical: { label: 'Nguy hiểm', badgeClass: 'badge-error', barClass: 'bar-danger' },
  warning: { label: 'Cảnh báo', badgeClass: 'badge-stale', barClass: 'bar-warning' },
  info: { label: 'Thông tin', badgeClass: 'badge-normal', barClass: 'bar-info' }
};

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  user: 'Người dùng'
};

function formatThreshold(r) {
  const unit = PARAM_CONFIG[r.parameter]?.unit ? ` ${PARAM_CONFIG[r.parameter].unit}` : '';
  if (r.operator === 'between') {
    return `${r.threshold_min ?? '?'} – ${r.threshold_max ?? '?'}${unit}`;
  }
  if (r.operator === 'outside') {
    return `< ${r.threshold_min} hoặc > ${r.threshold_max}${unit}`;
  }
  const bound = r.threshold_min ?? r.threshold_max ?? '';
  return `${r.operator} ${bound}${unit}`;
}

function formatDateVi(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

export default function AdminConsole({ user, onLogout, showToast }) {
  const [activeMenu, setActiveMenu] = useState('dashboard'); // 'dashboard' | 'rules' | 'users'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rules State
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paramFilter, setParamFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Telemetry Bridge State
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const [syncingBridge, setSyncingBridge] = useState(false);

  // Logout Confirm Modal
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, paramFilter, severityFilter, statusFilter]);

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

  const loadBridgeStatus = async () => {
    try {
      const status = await apiService.getBridgeStatus();
      setBridgeStatus(status);
    } catch {
      // handled gracefully in apiService
    }
  };

  const refreshAll = () => {
    loadRules();
    loadUsers();
    loadBridgeStatus();
  };

  const handleSyncBridge = async () => {
    setSyncingBridge(true);
    try {
      const res = await apiService.syncBridge();
      showToast(`Đã đồng bộ Bridge thành công (${res.new_readings_count || 0} bản ghi mới)`, 'success');
      loadBridgeStatus();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSyncingBridge(false);
    }
  };

  // Rule Handlers
  const handleToggleActive = async (rule) => {
    if (!isAdmin) return;
    try {
      await apiService.updateRule(rule.id, { is_active: !rule.is_active });
      showToast(`Đã ${!rule.is_active ? 'bật' : 'tắt'} quy tắc ${rule.rule_code}`, 'success');
      loadRules();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRule = async (id, code) => {
    if (!isAdmin) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa quy tắc [${code}]?`)) return;
    try {
      await apiService.deleteRule(id);
      showToast(`Đã xóa quy tắc ${code}`, 'success');
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
  const handleDeleteUser = async (targetUser) => {
    if (!isAdmin) return;
    if (user && user.username === targetUser.username) {
      showToast('Không thể xóa tài khoản đang đăng nhập', 'error');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản [${targetUser.username}]?`)) return;

    try {
      await apiService.deleteUser(targetUser.id);
      showToast(`Đã xóa tài khoản ${targetUser.username}`, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSelectMenu = (menu) => {
    setActiveMenu(menu);
    setSidebarOpen(false);
  };

  const handleJumpToParamRules = (paramKey) => {
    setParamFilter(paramKey);
    setSearchTerm('');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setActiveMenu('rules');
  };

  const resetRuleFilters = () => {
    setSearchTerm('');
    setParamFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
  };

  // Filtered Rules & Pagination
  const filteredRules = rules.filter(r => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      r.rule_code?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.action_advice?.toLowerCase().includes(q);
    const matchParam = paramFilter === 'ALL' || r.parameter === paramFilter;
    const matchSeverity =
      severityFilter === 'ALL' ||
      (severityFilter === 'danger' ? (r.severity === 'danger' || r.severity === 'critical') : r.severity === severityFilter);
    const matchStatus =
      statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? r.is_active : !r.is_active);
    return matchSearch && matchParam && matchSeverity && matchStatus;
  });

  const hasActiveRuleFilters =
    searchTerm !== '' || paramFilter !== 'ALL' || severityFilter !== 'ALL' || statusFilter !== 'ALL';

  const totalItems = filteredRules.length;
  const itemsPerPage = pageSize === 'ALL' ? (totalItems || 1) : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === 'ALL' ? 0 : (validCurrentPage - 1) * itemsPerPage;
  const displayedRules =
    pageSize === 'ALL' ? filteredRules : filteredRules.slice(startIndex, startIndex + itemsPerPage);
  const displayEnd = Math.min(startIndex + displayedRules.length, totalItems);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const q = userSearchTerm.trim().toLowerCase();
    const matchSearch =
      !q || u.username?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  // Metrics
  const activeRulesCount = rules.filter(r => r.is_active).length;
  const inactiveRulesCount = rules.length - activeRulesCount;
  const activePct = rules.length > 0 ? Math.round((activeRulesCount / rules.length) * 100) : 0;
  const coveredParamsCount = Object.keys(PARAM_CONFIG).filter(
    key => rules.some(r => r.parameter === key && r.is_active)
  ).length;

  const adminUsersCount = users.filter(u => u.role === 'admin').length;
  const techUsersCount = users.filter(u => u.role === 'user').length;

  const dangerCount = rules.filter(r => r.severity === 'danger' || r.severity === 'critical').length;
  const warningCount = rules.filter(r => r.severity === 'warning').length;
  const infoCount = rules.filter(r => r.severity === 'info').length;

  const viewMeta = {
    dashboard: {
      title: 'Tổng quan hệ thống',
      subtitle: 'Theo dõi cấu hình quy tắc nông học, phân quyền tài khoản và trạng thái đồng bộ'
    },
    rules: {
      title: 'Quy tắc chăm sóc',
      subtitle: 'Quản lý ngưỡng cảnh báo và khuyến nghị hành động cho 6 thông số vườn ươm'
    },
    users: {
      title: 'Quản lý người dùng',
      subtitle: 'Danh sách tài khoản và phân quyền Quản trị viên (admin) / Người dùng (user)'
    }
  };

  const currentView = viewMeta[activeMenu];
  const isBusy = loadingRules || loadingUsers;

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark" aria-hidden="true">
              <Sprout size={18} strokeWidth={2.2} />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">Pepper Nursery</span>
              <span className="sidebar-brand-sub">Admin Console</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-mobile"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-nav-section">
          <div className="sidebar-section-label">Điều hành</div>
          <nav className="sidebar-nav" aria-label="Menu quản trị">
            <button
              type="button"
              className={`sidebar-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleSelectMenu('dashboard')}
            >
              <span className="sidebar-nav-left">
                <LayoutDashboard size={17} />
                <span>Tổng quan</span>
              </span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeMenu === 'rules' ? 'active' : ''}`}
              onClick={() => handleSelectMenu('rules')}
            >
              <span className="sidebar-nav-left">
                <SlidersHorizontal size={17} />
                <span>Quy tắc chăm sóc</span>
              </span>
              <span className="sidebar-count tabular-nums">{rules.length}</span>
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeMenu === 'users' ? 'active' : ''}`}
              onClick={() => handleSelectMenu('users')}
            >
              <span className="sidebar-nav-left">
                <Users size={17} />
                <span>Người dùng</span>
              </span>
              <span className="sidebar-count tabular-nums">{users.length}</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-account">
            <div className="account-avatar" aria-hidden="true">
              {(user?.full_name || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="account-meta">
              <div className="account-name">{user?.full_name || user?.username}</div>
              <div className="account-role">@{user?.username} · {ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
            {onLogout && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setLogoutModalOpen(true)}
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ================= MAIN WORKSPACE ================= */}
      <div className="admin-main">
        {/* Sticky Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <Menu size={19} />
            </button>
            <div className="topbar-breadcrumb">
              <span className="breadcrumb-root">Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{currentView.title}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={refreshAll}
              disabled={isBusy}
            >
              <RefreshCw size={14} className={isBusy ? 'auth-spinner' : ''} />
              <span>Làm mới</span>
            </button>

            {isAdmin && activeMenu !== 'users' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingRule(null);
                  setRuleModalOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Thêm quy tắc</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="admin-workspace">
          <div className="workspace-header">
            <h1>{currentView.title}</h1>
            <p>{currentView.subtitle}</p>
          </div>

          {!isAdmin && (
            <div className="advice-banner warning">
              <div className="advice-icon-wrap">
                <ShieldAlert size={22} />
              </div>
              <div className="advice-body">
                <div className="advice-title">Chế độ chỉ đọc</div>
                <div className="advice-text">
                  Tài khoản hiện tại không có quyền Quản trị viên (admin) nên các thao tác chỉnh sửa bị vô hiệu hóa.
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 1: TỔNG QUAN ================= */}
          {activeMenu === 'dashboard' && (
            <div className="workspace-stack">
              {/* 4 KPI Strip */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-head">
                    <span className="kpi-label">Tổng số quy tắc</span>
                    <SlidersHorizontal size={16} className="kpi-icon" />
                  </div>
                  <div className="kpi-value tabular-nums">{rules.length}</div>
                  <div className="kpi-sub">
                    {activeRulesCount} đang bật · {inactiveRulesCount} tạm dừng
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-head">
                    <span className="kpi-label">Độ phủ giám sát</span>
                    <CheckCircle2 size={16} className="kpi-icon kpi-icon-teal" />
                  </div>
                  <div className="kpi-value tabular-nums">{activePct}%</div>
                  <div className="kpi-sub">
                    Bao phủ {coveredParamsCount}/6 thông số cảm biến
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-head">
                    <span className="kpi-label">Tài khoản hệ thống</span>
                    <Users size={16} className="kpi-icon" />
                  </div>
                  <div className="kpi-value tabular-nums">{users.length}</div>
                  <div className="kpi-sub">
                    {adminUsersCount} {ROLE_LABELS.admin} · {techUsersCount} {ROLE_LABELS.user}
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-head">
                    <span className="kpi-label">Telemetry Bridge</span>
                    <Radio size={16} className="kpi-icon kpi-icon-teal" />
                  </div>
                  <div className="kpi-status-row">
                    <span className={`status-dot ${bridgeStatus?.is_running !== false ? 'online' : ''}`} />
                    <span className="kpi-status-text">
                      {bridgeStatus?.is_running !== false ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>
                  <div className="kpi-sub kpi-sub-action">
                    <span>Kênh #{bridgeStatus?.channel_id || 1}</span>
                    <button
                      type="button"
                      className="inline-action-link"
                      onClick={handleSyncBridge}
                      disabled={syncingBridge}
                    >
                      {syncingBridge ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2-Column Analytical Grid */}
              <div className="dashboard-split">
                {/* Left: Phân bố theo 6 thông số */}
                <section className="panel-card">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Phân bố quy tắc theo thông số</h2>
                      <p className="panel-desc">Nhấp vào từng thông số để lọc danh sách quy tắc tương ứng</p>
                    </div>
                  </div>
                  <div className="param-list">
                    {Object.entries(PARAM_CONFIG).map(([key, conf]) => {
                      const total = rules.filter(r => r.parameter === key).length;
                      const active = rules.filter(r => r.parameter === key && r.is_active).length;
                      const pct = total > 0 ? Math.round((active / total) * 100) : 0;
                      return (
                        <button
                          key={key}
                          type="button"
                          className="param-row-btn"
                          onClick={() => handleJumpToParamRules(key)}
                        >
                          <div className="param-row-top">
                            <div className="param-row-label">
                              <span className="param-name">{conf.label}</span>
                              <code className="param-key">{key}</code>
                            </div>
                            <span className="param-count tabular-nums">
                              <strong>{active}</strong>/{total} bật
                            </span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Right: Severity breakdown + RBAC summary */}
                <div className="dashboard-right-stack">
                  <section className="panel-card">
                    <div className="panel-header">
                      <div>
                        <h2 className="panel-title">Phân loại theo mức độ</h2>
                        <p className="panel-desc">Tỷ trọng quy tắc trong động cơ đánh giá</p>
                      </div>
                    </div>
                    <div className="severity-bars">
                      {[
                        { key: 'danger', label: 'Nguy hiểm (Danger)', count: dangerCount, cls: 'bar-danger' },
                        { key: 'warning', label: 'Cảnh báo (Warning)', count: warningCount, cls: 'bar-warning' },
                        { key: 'info', label: 'Thông tin (Info)', count: infoCount, cls: 'bar-info' }
                      ].map(item => {
                        const pct = rules.length > 0 ? Math.round((item.count / rules.length) * 100) : 0;
                        return (
                          <div key={item.key} className="severity-item">
                            <div className="severity-item-top">
                              <span>{item.label}</span>
                              <span className="tabular-nums">
                                <strong>{item.count}</strong> ({pct}%)
                              </span>
                            </div>
                            <div className="progress-track">
                              <div className={`progress-fill ${item.cls}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="panel-card">
                    <div className="panel-header">
                      <div>
                        <h2 className="panel-title">Phân quyền hệ thống (RBAC)</h2>
                        <p className="panel-desc">Phạm vi truy cập giữa Web Admin và Mobile</p>
                      </div>
                    </div>
                    <div className="rbac-list">
                      <div className="rbac-row">
                        <div className="rbac-role-col">
                          <span className="badge badge-error">{ROLE_LABELS.admin} (admin)</span>
                          <span className="rbac-count tabular-nums">{adminUsersCount} tài khoản</span>
                        </div>
                        <p className="rbac-desc">
                          Toàn quyền CRUD quy tắc chăm sóc và quản trị hệ thống trên Web Console.
                        </p>
                      </div>
                      <div className="rbac-row">
                        <div className="rbac-role-col">
                          <span className="badge badge-normal">{ROLE_LABELS.user} (user)</span>
                          <span className="rbac-count tabular-nums">{techUsersCount} tài khoản</span>
                        </div>
                        <p className="rbac-desc">
                          Giám sát số đo cảm biến và nhận khuyến nghị trên ứng dụng Mobile; không vào Web Admin.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Preview Table: Quy tắc mới nhất / tiêu biểu */}
              <section className="panel-card">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Quy tắc đang kích hoạt</h2>
                    <p className="panel-desc">Xem nhanh các ngưỡng đang áp dụng cho luồng dữ liệu</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectMenu('rules')}
                  >
                    <span>Xem tất cả ({rules.length})</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '20%' }}>Mã quy tắc</th>
                        <th style={{ width: '32%' }}>Tên quy tắc</th>
                        <th style={{ width: '18%' }}>Thông số</th>
                        <th style={{ width: '16%' }}>Ngưỡng</th>
                        <th style={{ width: '14%' }}>Mức độ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRules ? (
                        <tr>
                          <td colSpan="5" className="table-empty">Đang tải quy tắc...</td>
                        </tr>
                      ) : rules.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="table-empty">Chưa có quy tắc nào trong hệ thống.</td>
                        </tr>
                      ) : (
                        rules.slice(0, 5).map(r => {
                          const sev = SEVERITY_META[r.severity] || SEVERITY_META.info;
                          return (
                            <tr key={r.id}>
                              <td><code className="code-pill">{r.rule_code}</code></td>
                              <td className="cell-strong">{r.name}</td>
                              <td>{PARAM_CONFIG[r.parameter]?.short || r.parameter}</td>
                              <td className="tabular-nums">{formatThreshold(r)}</td>
                              <td><span className={`badge ${sev.badgeClass}`}>{sev.label}</span></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ================= VIEW 2: QUY TẮC CHĂM SÓC ================= */}
          {activeMenu === 'rules' && (
            <section className="panel-card">
              {/* Filter Toolbar */}
              <div className="table-toolbar">
                <div className="search-field">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    className="toolbar-input"
                    placeholder="Tìm theo mã, tên quy tắc, khuyến nghị..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="toolbar-filters">
                  <select
                    className="toolbar-select"
                    value={paramFilter}
                    onChange={(e) => setParamFilter(e.target.value)}
                    aria-label="Lọc theo thông số"
                  >
                    <option value="ALL">Tất cả thông số</option>
                    {Object.entries(PARAM_CONFIG).map(([key, conf]) => (
                      <option key={key} value={key}>{conf.label}</option>
                    ))}
                  </select>

                  <select
                    className="toolbar-select"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    aria-label="Lọc theo mức độ"
                  >
                    <option value="ALL">Tất cả mức độ</option>
                    <option value="danger">Nguy hiểm</option>
                    <option value="warning">Cảnh báo</option>
                    <option value="info">Thông tin</option>
                  </select>

                  <select
                    className="toolbar-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Lọc theo trạng thái"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang bật</option>
                    <option value="INACTIVE">Đã tắt</option>
                  </select>

                  {hasActiveRuleFilters && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={resetRuleFilters}
                      title="Xóa bộ lọc"
                    >
                      <RotateCcw size={13} />
                      <span>Đặt lại</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Rules Data Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>Mã quy tắc</th>
                      <th style={{ width: '32%' }}>Quy tắc & Khuyến nghị</th>
                      <th style={{ width: '13%' }}>Thông số</th>
                      <th style={{ width: '13%' }}>Ngưỡng</th>
                      <th style={{ width: '10%' }}>Mức độ</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Bật/Tắt</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRules ? (
                      <tr>
                        <td colSpan="7" className="table-empty">Đang tải danh sách quy tắc...</td>
                      </tr>
                    ) : displayedRules.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="table-empty">
                          Không tìm thấy quy tắc phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      displayedRules.map((r) => {
                        const paramInfo = PARAM_CONFIG[r.parameter];
                        const sev = SEVERITY_META[r.severity] || SEVERITY_META.info;
                        return (
                          <tr key={r.id} className={!r.is_active ? 'row-inactive' : ''}>
                            <td>
                              <code className="code-pill" title={r.rule_code}>
                                {r.rule_code}
                              </code>
                            </td>
                            <td>
                              <div className="rule-main-cell">
                                <div className="rule-title">{r.name}</div>
                                <div className="rule-advice" title={r.action_advice}>
                                  {r.action_advice}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cell-muted">
                                {paramInfo ? paramInfo.short : r.parameter}
                              </span>
                            </td>
                            <td className="tabular-nums cell-strong">{formatThreshold(r)}</td>
                            <td>
                              <span className={`badge ${sev.badgeClass}`}>{sev.label}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={r.is_active}
                                aria-label={r.is_active ? 'Tắt quy tắc' : 'Bật quy tắc'}
                                className={`toggle-switch ${r.is_active ? 'on' : ''}`}
                                onClick={() => handleToggleActive(r)}
                                disabled={!isAdmin}
                                title={r.is_active ? 'Đang bật — nhấp để tắt' : 'Đã tắt — nhấp để bật'}
                              >
                                <span className="toggle-knob" />
                              </button>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => {
                                    setEditingRule(r);
                                    setRuleModalOpen(true);
                                  }}
                                  title="Chỉnh sửa"
                                  disabled={!isAdmin}
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn icon-btn-danger"
                                  onClick={() => handleDeleteRule(r.id, r.rule_code)}
                                  title="Xóa quy tắc"
                                  disabled={!isAdmin}
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

              {/* Pagination Footer */}
              <div className="table-footer">
                <div className="table-footer-left">
                  <span className="tabular-nums">
                    {totalItems === 0
                      ? '0 quy tắc'
                      : `Hiển thị ${startIndex + 1}–${displayEnd} trên ${totalItems} quy tắc`}
                  </span>
                  <select
                    className="toolbar-select select-compact"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Số dòng mỗi trang"
                  >
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={5}>5 / trang</option>
                    <option value="ALL">Tất cả ({totalItems})</option>
                  </select>
                </div>

                {pageSize !== 'ALL' && totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="page-btn"
                      disabled={validCurrentPage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Trước
                    </button>
                    <span className="page-indicator tabular-nums">
                      Trang <strong>{validCurrentPage}</strong> / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="page-btn"
                      disabled={validCurrentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= VIEW 3: NGƯỜI DÙNG ================= */}
          {activeMenu === 'users' && (
            <div className="workspace-stack">
              <section className="panel-card">
                <div className="table-toolbar">
                  <div className="search-field">
                    <Search size={15} className="search-icon" />
                    <input
                      type="text"
                      className="toolbar-input"
                      placeholder="Tìm theo username hoặc họ tên..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="toolbar-filters">
                    <select
                      className="toolbar-select"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      aria-label="Lọc theo vai trò"
                    >
                      <option value="ALL">Tất cả vai trò ({users.length})</option>
                      <option value="admin">{ROLE_LABELS.admin} ({adminUsersCount})</option>
                      <option value="user">{ROLE_LABELS.user} ({techUsersCount})</option>
                    </select>
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '34%' }}>Người dùng</th>
                        <th style={{ width: '20%' }}>Vai trò</th>
                        <th style={{ width: '16%' }}>Trạng thái</th>
                        <th style={{ width: '14%' }}>Ngày tạo</th>
                        <th style={{ width: '16%', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td colSpan="5" className="table-empty">Đang tải danh sách tài khoản...</td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="table-empty">Không tìm thấy tài khoản phù hợp.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSelf = user && user.username === u.username;
                          return (
                            <tr key={u.id}>
                              <td>
                                <div className="user-cell">
                                  <div className={`user-avatar ${u.role === 'admin' ? 'is-admin' : ''}`}>
                                    {(u.full_name || u.username || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="user-cell-info">
                                    <div className="user-cell-name">
                                      {u.full_name || u.username}
                                      {isSelf && <span className="self-tag">Bạn</span>}
                                    </div>
                                    <div className="user-cell-username">@{u.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${u.role === 'admin' ? 'badge-error' : 'badge-normal'}`}>
                                  {ROLE_LABELS[u.role] || u.role}
                                </span>
                              </td>
                              <td>
                                <span className="status-inline">
                                  <span className="status-dot online" />
                                  <span>Hoạt động</span>
                                </span>
                              </td>
                              <td className="tabular-nums cell-muted">{formatDateVi(u.created_at)}</td>
                              <td>
                                <div className="row-actions">
                                  <button
                                    type="button"
                                    className="icon-btn icon-btn-danger"
                                    onClick={() => handleDeleteUser(u)}
                                    title="Xóa tài khoản"
                                    disabled={!isAdmin || isSelf}
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

                <div className="table-footer">
                  <span className="table-note">
                    Danh sách tài khoản hiện lấy từ bộ nhớ trình duyệt khi Backend chưa có API danh sách người dùng.
                  </span>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Modal Quy tắc */}
      <RuleModal
        isOpen={ruleModalOpen}
        onClose={() => {
          setRuleModalOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        initialRule={editingRule}
      />

      {/* Popup xác nhận đăng xuất */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        title="Xác nhận đăng xuất"
        message={`Bạn có chắc chắn muốn đăng xuất khỏi tài khoản @${user?.username || 'admin'}?`}
        confirmLabel="Đăng xuất"
        cancelLabel="Ở lại"
        danger
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={() => {
          setLogoutModalOpen(false);
          onLogout();
        }}
      />
    </div>
  );
}
