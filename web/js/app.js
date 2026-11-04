/**
 * Pepper Nursery IoT - Web Dashboard Application Entry
 * Trách nhiệm: DKhoa (05_DKhoa_Web_Dashboard.md)
 * Tích hợp Backend API của TDat (Phase 2 & Phase 3)
 */

import { APP_CONFIG, loadRuntimeConfig } from './config.js';
import { ApiAdapter } from './api/api-adapter.js';
import { renderMetricCards } from './components/metric-card.js';
import { renderDeviceStatus } from './components/device-status.js';
import { renderCareAdvice } from './components/care-advice.js';
import { renderHistoryView } from './components/history-view.js';

class NurseryDashboardApp {
  constructor() {
    this.adapter = new ApiAdapter(APP_CONFIG);
    this.refreshTimer = null;
    this.isLoading = false;

    // Cache DOM Elements
    this.el = {
      deviceSelect: document.getElementById('device-select'),
      dataModeSelect: document.getElementById('data-mode-select'),
      fixtureScenarioSelect: document.getElementById('fixture-scenario-select'),
      fixtureGroup: document.getElementById('fixture-control-group'),
      apiGroup: document.getElementById('api-control-group'),
      apiUrlInput: document.getElementById('api-url-input'),
      btnSaveApiUrl: document.getElementById('btn-save-api-url'),
      btnRefresh: document.getElementById('btn-refresh'),
      btnSyncThingSpeak: document.getElementById('btn-sync-thingspeak'),
      fixtureBanner: document.getElementById('fixture-banner'),
      fixtureBannerText: document.getElementById('fixture-banner-text'),
      errorAlert: document.getElementById('error-alert'),
      errorAlertMessage: document.getElementById('error-alert-message'),
      btnRetry: document.getElementById('btn-retry'),
      btnSwitchToFixture: document.getElementById('btn-switch-to-fixture'),
      deviceStatusContainer: document.getElementById('device-status-container'),
      careAdviceContainer: document.getElementById('care-advice-container'),
      metricsContainer: document.getElementById('metrics-container'),
      historyContainer: document.getElementById('history-container'),
      lastRefreshedLabel: document.getElementById('last-refreshed-label')
    };

    this.init();
  }

  async init() {
    // 1. Tải cấu hình từ runtime / .env nếu có
    await loadRuntimeConfig();
    this.adapter.setMode(APP_CONFIG.dataMode);
    this.adapter.setApiBaseUrl(APP_CONFIG.apiBaseUrl);
    this.adapter.setDeviceId(APP_CONFIG.defaultDeviceId);

    // 2. Đồng bộ giá trị lên Form Controls
    if (this.el.dataModeSelect) this.el.dataModeSelect.value = APP_CONFIG.dataMode;
    if (this.el.apiUrlInput) this.el.apiUrlInput.value = APP_CONFIG.apiBaseUrl;
    if (this.el.deviceSelect) this.el.deviceSelect.value = APP_CONFIG.defaultDeviceId;

    // 3. Đăng ký sự kiện
    this.bindEvents();
    this.syncControls();

    // 4. Tải dữ liệu ban đầu
    this.loadData();

    // 5. Khởi động chu kỳ tự động cập nhật
    this.startAutoRefresh();
  }

  bindEvents() {
    // Đổi thiết bị
    if (this.el.deviceSelect) {
      this.el.deviceSelect.addEventListener('change', (e) => {
        this.adapter.setDeviceId(e.target.value);
        this.loadData();
      });
    }

    // Đổi chế độ Dữ liệu (Mock Fixture vs Real API)
    if (this.el.dataModeSelect) {
      this.el.dataModeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        this.adapter.setMode(mode);
        this.syncControls();
        this.loadData();
      });
    }

    // Đổi kịch bản Fixture
    if (this.el.fixtureScenarioSelect) {
      this.el.fixtureScenarioSelect.addEventListener('change', (e) => {
        const scenario = e.target.value;
        this.adapter.setScenario(scenario);
        this.loadData();
      });
    }

    // Cập nhật Base URL của Backend
    if (this.el.btnSaveApiUrl && this.el.apiUrlInput) {
      this.el.btnSaveApiUrl.addEventListener('click', () => {
        const url = this.el.apiUrlInput.value.trim();
        if (url) {
          this.adapter.setApiBaseUrl(url);
          this.loadData();
        }
      });
    }

    // Nút làm mới thủ công
    if (this.el.btnRefresh) {
      this.el.btnRefresh.addEventListener('click', () => {
        this.loadData();
      });
    }

    // Nút kích hoạt đồng bộ ThingSpeak sang Backend
    if (this.el.btnSyncThingSpeak) {
      this.el.btnSyncThingSpeak.addEventListener('click', async () => {
        const btn = this.el.btnSyncThingSpeak;
        btn.disabled = true;
        btn.textContent = '⏳ Đang đồng bộ...';
        try {
          const res = await this.adapter.syncThingSpeak();
          this.showToastNotification(`✅ ${res.message || 'Đồng bộ thành công!'} Đang tải số đo mới...`);
          await this.loadData();
        } catch (err) {
          this.showToastNotification(`❌ Lỗi đồng bộ ThingSpeak: ${err.message}`, true);
        } finally {
          btn.disabled = false;
          btn.textContent = '📡 Đồng bộ ThingSpeak';
        }
      });
    }

    // Nút thử lại khi gặp lỗi
    if (this.el.btnRetry) {
      this.el.btnRetry.addEventListener('click', () => {
        this.loadData();
      });
    }

    // Nút chuyển nhanh sang Fixture khi backend chưa online
    if (this.el.btnSwitchToFixture) {
      this.el.btnSwitchToFixture.addEventListener('click', () => {
        if (this.el.dataModeSelect) this.el.dataModeSelect.value = 'FIXTURE';
        this.adapter.setMode('FIXTURE');
        this.syncControls();
        this.loadData();
      });
    }
  }

  syncControls() {
    const isFixture = this.adapter.mode === 'FIXTURE';
    if (this.el.fixtureGroup) {
      this.el.fixtureGroup.style.display = isFixture ? 'flex' : 'none';
    }
    if (this.el.apiGroup) {
      this.el.apiGroup.style.display = isFixture ? 'none' : 'flex';
    }
    this.updateBannerInfo();
  }

  showToastNotification(msg, isError = false) {
    if (!this.el.fixtureBannerText) return;
    this.el.fixtureBanner.style.display = 'flex';
    this.el.fixtureBanner.style.backgroundColor = isError ? '#FFE9EA' : '#E7F3F3';
    this.el.fixtureBanner.style.borderColor = isError ? 'var(--color-coral)' : 'var(--color-teal)';
    this.el.fixtureBannerText.innerHTML = `<strong>Thông báo:</strong> ${msg}`;
    setTimeout(() => {
      this.syncControls();
    }, 4500);
  }

  updateBannerInfo() {
    if (!this.el.fixtureBanner || !this.el.fixtureBannerText) return;

    this.el.fixtureBanner.style.backgroundColor = '';
    this.el.fixtureBanner.style.borderColor = '';

    if (this.adapter.mode === 'FIXTURE') {
      const scenarioText = this.el.fixtureScenarioSelect.options[this.el.fixtureScenarioSelect.selectedIndex]?.text || this.adapter.scenario;
      this.el.fixtureBanner.style.display = 'flex';
      this.el.fixtureBannerText.innerHTML = `
        <strong>Dữ liệu mẫu (G0 v0.1 Mock):</strong> Đang chạy kịch bản <em>"${scenarioText}"</em>. Bạn có thể chuyển sang "🌐 API Thật" khi Backend TDat đã khởi động.
      `;
    } else {
      this.el.fixtureBanner.style.display = 'flex';
      this.el.fixtureBannerText.innerHTML = `
        <strong>Kết nối Backend thật:</strong> Đang gọi API tại <code>${this.adapter.apiBaseUrl}</code> · Thiết bị: <code>${this.adapter.deviceId}</code>.
      `;
    }
  }

  async loadData() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.hideError();
    this.updateBannerInfo();

    if (this.el.btnRefresh) {
      this.el.btnRefresh.disabled = true;
      this.el.btnRefresh.textContent = 'Đang tải...';
    }

    try {
      const [latestRes, historyRes] = await Promise.all([
        this.adapter.getLatestReading(),
        this.adapter.getHistory(this.adapter.deviceId, 20)
      ]);

      // Render tất cả thành phần
      renderDeviceStatus(this.el.deviceStatusContainer, latestRes);
      renderCareAdvice(this.el.careAdviceContainer, latestRes.advice, latestRes.reading, latestRes.is_stale);
      renderMetricCards(this.el.metricsContainer, latestRes.reading, latestRes.is_stale);
      renderHistoryView(this.el.historyContainer, historyRes);

      // Cập nhật nhãn lần làm mới cuối
      if (this.el.lastRefreshedLabel) {
        const now = new Date();
        this.el.lastRefreshedLabel.textContent = `Lần cập nhật: ${now.toLocaleTimeString('vi-VN')} (GMT+7)`;
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard:', err);
      this.showError(err.message || 'Không thể kết nối đến Backend máy chủ dữ liệu.');
    } finally {
      this.isLoading = false;
      if (this.el.btnRefresh) {
        this.el.btnRefresh.disabled = false;
        this.el.btnRefresh.textContent = '🔄 Làm mới';
      }
    }
  }

  showError(message) {
    if (this.el.errorAlert && this.el.errorAlertMessage) {
      this.el.errorAlertMessage.textContent = message;
      this.el.errorAlert.style.display = 'flex';
    }
  }

  hideError() {
    if (this.el.errorAlert) {
      this.el.errorAlert.style.display = 'none';
    }
  }

  startAutoRefresh() {
    if (APP_CONFIG.autoRefreshIntervalMs > 0) {
      this.refreshTimer = setInterval(() => {
        if (this.adapter.mode === 'REAL_API') {
          this.loadData();
        }
      }, APP_CONFIG.autoRefreshIntervalMs);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboardApp = new NurseryDashboardApp();
});
