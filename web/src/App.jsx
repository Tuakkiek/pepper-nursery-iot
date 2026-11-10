import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar.jsx';
import DeviceStatusHero from './components/DeviceStatusHero.jsx';
import CareAdviceBanner from './components/CareAdviceBanner.jsx';
import MetricGrid from './components/MetricGrid.jsx';
import HistorySection from './components/HistorySection.jsx';
import AdminConsole from './components/AdminConsole.jsx';
import AuthModal from './components/AuthModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import Toast from './components/Toast.jsx';

import { APP_CONFIG } from './config.js';
import { apiService } from './services/api.js';
import { authService } from './services/auth.js';

export default function App() {
  const [deviceId, setDeviceId] = useState(APP_CONFIG.defaultDeviceId);

  const [user, setUser] = useState(authService.getUser());
  // Khởi tạo tab: Nếu tài khoản là admin thì vào thẳng trang 'admin', còn user kỹ thuật thì vào trang 'live' (số đo)
  const [activeTab, setActiveTab] = useState(() => {
    const u = authService.getUser();
    return u?.role === 'admin' ? 'admin' : 'live';
  });

  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const refreshIntervalRef = useRef(null);

  // Toast Helper
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

  // Verify Session on mount
  useEffect(() => {
    authService.verifySession().then(u => {
      if (u) {
        setUser(u);
      }
    });
  }, []);

  // Fetch Data Function (chỉ nạp số đo khi người dùng đang ở tab 'live')
  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Latest
      const latest = await apiService.getLatestReading(deviceId, 'REAL_API');
      setLatestData(latest);
      if (latest._is_fallback) {
        showToast('Đang kết nối qua cổng dự phòng Sensor Data Bridge', 'info');
      }

      // 2. Fetch History (Limit 20)
      const history = await apiService.getHistory(deviceId, 20, 'REAL_API');
      setHistoryData(history);
    } catch (err) {
      setError(err);
      showToast(`Lỗi nạp số đo từ API: ${err.message}`, 'error');
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  // Nạp số đo khi thay đổi thiết bị (chỉ khi đang ở tab xem số đo)
  useEffect(() => {
    if (user && activeTab === 'live') {
      loadData(true);
    }
  }, [deviceId, user, activeTab]);

  // Auto-refresh interval (chỉ nạp định kỳ khi đang ở tab 'live')
  useEffect(() => {
    if (user && activeTab === 'live') {
      refreshIntervalRef.current = setInterval(() => {
        loadData(false);
      }, APP_CONFIG.autoRefreshIntervalMs);
    }

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [user, activeTab, deviceId]);

  // Sync Telemetry (Sensor Data Bridge / ThingSpeak - Section 4)
  const handleSyncThingSpeak = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.syncBridge();
      showToast(`Đã đồng bộ số đo thành công (${res.new_readings_count || 0} bản ghi mới)`, 'success');
      loadData(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.clearSession();
    setUser(null);
    showToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  // CƠ CHẾ BẢO VỆ CỔNG VÀO (GATEKEEPER): Bắt buộc người dùng phải đăng nhập trước khi vào hệ thống
  if (!user) {
    return (
      <>
        <LoginPage 
          onLoginSuccess={(u) => {
            setUser(u);
            setActiveTab(u.role === 'admin' ? 'admin' : 'live');
          }}
          showToast={showToast}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="app-wrapper">
      
      {/* ================= VIEW 1: TRANG QUẢN TRỊ ADMIN (Dành cho Admin, có Sidebar riêng, KHÔNG xem thông số đo) ================= */}
      {activeTab === 'admin' && (
        <AdminConsole 
          user={user}
          onLogout={handleLogout}
          showToast={showToast}
        />
      )}

      {/* ================= VIEW 2: TRANG NGƯỜI DÙNG (Giám sát số đo vi khí hậu thiết bị) ================= */}
      {activeTab !== 'admin' && (
        <>
          {/* Header dành cho Trang Người dùng */}
          <Navbar
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            onRefresh={() => loadData(true)}
            onSyncThingSpeak={handleSyncThingSpeak}
            isLoading={isLoading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* Banner thông báo dành cho Admin khi đang xem trang người dùng */}
          {user?.role === 'admin' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #002C3E 0%, #064052 100%)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🛡️</span>
                <span>
                  Bạn đang ở <strong>Trang Người Dùng (Giám sát số đo vi khí hậu)</strong> với tư cách Quản trị viên.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('admin')}
                style={{ background: 'var(--brand-coral)', borderColor: 'var(--brand-coral)', color: '#FFFFFF' }}
              >
                Trở về Trang Admin
              </button>
            </div>
          )}

          {/* Error Alert (nếu có lỗi nạp API) */}
          {error && (
            <div className="card" style={{
              background: 'var(--coral-soft)',
              border: '1px solid var(--brand-coral)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--coral-strong)', fontWeight: 700 }}>
                <span>⚠️ Không thể kết nối với Backend hoặc thiết bị không tồn tại</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--coral-strong)' }}>
                {error.message || 'Lỗi kết nối máy chủ.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button className="btn btn-danger btn-sm" onClick={() => loadData(true)}>
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {/* Main Views của Người dùng */}
          {activeTab === 'live' && (
            <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Station Status Hero Banner */}
              <DeviceStatusHero data={latestData} deviceId={deviceId} />

              {/* Agronomy Care Advice Banner */}
              <CareAdviceBanner 
                advice={latestData?.advice}
                reading={latestData?.reading}
                isStale={latestData?.is_stale}
              />

              {/* 6 Sensor Metric Cards */}
              <MetricGrid 
                reading={latestData?.reading}
                isStale={latestData?.is_stale}
              />

              {/* Historical Trends & Table */}
              <HistorySection historyData={historyData} />
            </main>
          )}

          {/* Footer trang người dùng */}
          <footer style={{
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <div>
              <strong>Pepper Nursery IoT MVP</strong>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge badge-normal">🎨 Design System 1.0</span>
              <span className="badge badge-ok">📜 API Contract G0 v0.1</span>
              <span className="badge badge-empty">⚛️ React 19 + Vite</span>
            </div>
          </footer>
        </>
      )}

      {/* Auth Modal (dự phòng) */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          setActiveTab(u.role === 'admin' ? 'admin' : 'live');
        }}
        showToast={showToast}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
