import React from 'react';
import { 
  Sprout, 
  Radio, 
  RefreshCw, 
  Database, 
  Cloud, 
  ShieldCheck, 
  User, 
  LogOut, 
  SlidersHorizontal,
  Activity,
  Layers
} from 'lucide-react';
import { APP_CONFIG } from '../config.js';

export default function Navbar({
  deviceId,
  setDeviceId,
  dataMode,
  setDataMode,
  currentScenario,
  setCurrentScenario,
  onRefresh,
  onSyncThingSpeak,
  isLoading,
  activeTab,
  setActiveTab,
  user,
  onOpenAuthModal,
  onLogout
}) {
  return (
    <header className="header-card">
      <div className="header-top">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo-icon" aria-hidden="true">
            🌱
          </div>
          <div className="brand-info">
            <h1>Vườn Ươm Ớt Con IoT</h1>
            <p>Hệ thống giám sát vi khí hậu & chăm sóc ớt con · Phụ trách Web: <strong>DKhoa</strong></p>
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="header-actions">
          {/* ThingSpeak Sync Trigger */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onSyncThingSpeak}
            title="Kích hoạt Backend đồng bộ ngay từ ThingSpeak Channel 3543608"
          >
            <Radio size={14} className="text-teal" />
            <span>Đồng bộ ThingSpeak</span>
          </button>

          {/* Refresh Button */}
          <button 
            className="btn btn-primary btn-sm" 
            onClick={onRefresh}
            disabled={isLoading}
            title="Làm mới dữ liệu từ API"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          {/* Auth Bar */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {user.role === 'admin' ? <ShieldCheck size={16} color="var(--brand-coral)" /> : <User size={16} />}
                <span>{user.full_name || user.username}</span>
                <span className={`badge ${user.role === 'admin' ? 'badge-error' : 'badge-normal'}`} style={{ fontSize: '10px' }}>
                  {user.role}
                </span>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                title="Đăng xuất khỏi phiên làm việc"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onOpenAuthModal}
            >
              <span>🔑 Đăng nhập / Đăng ký</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Trạm & Nguồn Dữ Liệu */}
      <div className="controls-bar" style={{ padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
        {/* Chọn thiết bị */}
        <div className="control-item">
          <label htmlFor="device-select">Trạm:</label>
          <select 
            id="device-select"
            className="select-input"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          >
            {APP_CONFIG.availableDevices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Nguồn dữ liệu Switch */}
        <div className="control-item">
          <span>Nguồn:</span>
          <div className="segmented-switch">
            <button 
              type="button"
              className={`segmented-btn ${dataMode === 'REAL_API' ? 'active' : ''}`}
              onClick={() => setDataMode('REAL_API')}
            >
              <Cloud size={13} />
              <span>API Thật (Cloud Render)</span>
            </button>
            <button 
              type="button"
              className={`segmented-btn ${dataMode === 'FIXTURE' ? 'active' : ''}`}
              onClick={() => setDataMode('FIXTURE')}
            >
              <Database size={13} />
              <span>Dữ liệu mẫu (G0 Mock)</span>
            </button>
          </div>
        </div>

        {/* Kịch bản Fixture nếu đang ở chế độ mock */}
        {dataMode === 'FIXTURE' && (
          <div className="control-item" style={{ animation: 'fadeIn 0.2s' }}>
            <label htmlFor="scenario-select" style={{ color: 'var(--brand-teal)' }}>Kịch bản:</label>
            <select 
              id="scenario-select"
              className="select-input"
              style={{ borderColor: 'var(--brand-teal)', background: 'var(--teal-soft)' }}
              value={currentScenario}
              onChange={(e) => setCurrentScenario(e.target.value)}
            >
              {APP_CONFIG.mockScenarios.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Nav Tabs */}
      <nav className="nav-tabs-bar" aria-label="Điều hướng chính">
        <div className="nav-tabs-list">
          <button 
            className={`nav-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Activity size={16} />
            <span>Giám sát vườn ươm</span>
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <SlidersHorizontal size={16} />
            <span>Quản trị quy tắc Admin</span>
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'sandbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('sandbox')}
          >
            <Layers size={16} />
            <span>Kiểm thử G0 Sandbox</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

