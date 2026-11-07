import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar.jsx';
import DeviceStatusHero from './components/DeviceStatusHero.jsx';
import CareAdviceBanner from './components/CareAdviceBanner.jsx';
import MetricGrid from './components/MetricGrid.jsx';
import HistorySection from './components/HistorySection.jsx';
import AdminConsole from './components/AdminConsole.jsx';
import ContractPlayground from './components/ContractPlayground.jsx';
import AuthModal from './components/AuthModal.jsx';
import Toast from './components/Toast.jsx';

import { APP_CONFIG } from './config.js';
import { apiService } from './services/api.js';
import { authService } from './services/auth.js';

export default function App() {
  const [deviceId, setDeviceId] = useState(APP_CONFIG.defaultDeviceId);
  const [dataMode, setDataMode] = useState(APP_CONFIG.dataMode);
  const [currentScenario, setCurrentScenario] = useState(APP_CONFIG.currentScenario);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'admin' | 'sandbox'

  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(authService.getUser());
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
      if (u) setUser(u);
    });
  }, []);

  // Fetch Data Function
  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Latest
      const latest = await apiService.getLatestReading(deviceId, dataMode, currentScenario);
      setLatestData(latest);

      // 2. Fetch History (Limit 20)
      const history = await apiService.getHistory(deviceId, 20, dataMode);
      setHistoryData(history);
    } catch (err) {
      setError(err);
      if (dataMode === 'REAL_API') {
        showToast(`Lỗi nạp số đo từ API: ${err.message}`, 'error');
      }
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  // Load data on params change
  useEffect(() => {
    loadData(true);
  }, [deviceId, dataMode, currentScenario]);

  // Auto-refresh interval (every 10s if on live tab and not errored)
  useEffect(() => {
    if (activeTab === 'live' && dataMode === 'REAL_API') {
      refreshIntervalRef.current = setInterval(() => {
        loadData(false);
      }, APP_CONFIG.autoRefreshIntervalMs);
    }

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [activeTab, dataMode, deviceId]);

  // Sync ThingSpeak
  const handleSyncThingSpeak = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.syncThingSpeak();
      showToast(`Đã đồng bộ ThingSpeak thành công (${res.new_readings_count || 0} bản ghi mới)`, 'success');
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
    showToast('Đã đăng xuất thành công', 'info');
  };

  const handleSelectScenarioFromSandbox = (scenarioId) => {
    setDataMode('FIXTURE');
    setCurrentScenario(scenarioId);
    setActiveTab('live');
    showToast(`Đã chuyển sang kịch bản mock: ${scenarioId}`, 'success');
  };

  return (
    <div className="app-wrapper">
      {/* 1. Header & Navigation */}
      <Navbar 
        deviceId={deviceId}
        setDeviceId={setDeviceId}
        dataMode={dataMode}
        setDataMode={setDataMode}
        currentScenario={currentScenario}
        setCurrentScenario={setCurrentScenario}
        onRefresh={() => loadData(true)}
        onSyncThingSpeak={handleSyncThingSpeak}
        isLoading={isLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Error Alert (if any) */}
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
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setDataMode('FIXTURE'); setCurrentScenario('normal'); }}
            >
              Chuyển sang Dữ liệu mẫu (Fixture G0)
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Views */}
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

      {activeTab === 'admin' && (
        <AdminConsole 
          user={user}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          showToast={showToast}
        />
      )}

      {activeTab === 'sandbox' && (
        <ContractPlayground 
          currentScenario={currentScenario}
          onSelectScenario={handleSelectScenarioFromSandbox}
        />
      )}

      {/* Footer */}
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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
        showToast={showToast}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

