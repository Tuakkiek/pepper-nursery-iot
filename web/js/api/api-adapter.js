/**
 * ApiAdapter: Lớp trừu tượng hóa việc lấy dữ liệu và gọi API
 * Hỗ trợ chuyển đổi mượt mà giữa Dữ liệu mẫu (Fixture) và Backend thật (REST API của TDat)
 * Phục vụ Phase 2 & Phase 3 (05_DKhoa_Web_Dashboard.md)
 */

import { APP_CONFIG } from '../config.js';
import { G0_FIXTURES, G0_HISTORY_FIXTURE } from '../fixtures/g0-fixtures.js';

export class ApiAdapter {
  constructor(config = APP_CONFIG) {
    this.mode = config.dataMode || 'REAL_API';
    this.scenario = config.currentScenario || 'normal';
    this.apiBaseUrl = (config.apiBaseUrl || 'http://localhost:8000').replace(/\/+$/, '');
    this.deviceId = config.defaultDeviceId || 'esp32-nursery-01';
  }

  setMode(mode) {
    if (mode === 'FIXTURE' || mode === 'REAL_API') {
      this.mode = mode;
    }
  }

  setScenario(scenario) {
    this.scenario = scenario;
  }

  setApiBaseUrl(url) {
    this.apiBaseUrl = url.replace(/\/+$/, '');
  }

  setDeviceId(id) {
    this.deviceId = id;
  }

  /**
   * Lấy số đo mới nhất
   * Trả về Promise resolving response theo hợp đồng docs/contracts/api.md
   */
  async getLatestReading(deviceId = this.deviceId) {
    if (this.mode === 'FIXTURE') {
      return this._getMockLatestReading(deviceId, this.scenario);
    } else {
      return this._fetchRealLatestReading(deviceId);
    }
  }

  /**
   * Lấy lịch sử số đo
   * Trả về Promise resolving history response theo docs/contracts/api.md
   */
  async getHistory(deviceId = this.deviceId, limit = 20) {
    if (this.mode === 'FIXTURE') {
      return this._getMockHistory(deviceId, limit);
    } else {
      return this._fetchRealHistory(deviceId, limit);
    }
  }

  /**
   * Kích hoạt đồng bộ tức thời từ ThingSpeak qua API Backend
   * Endpoint: POST /api/v1/sync/thingspeak (tính năng mới của TDat)
   */
  async syncThingSpeak() {
    if (this.mode === 'FIXTURE') {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        status: 'ok',
        message: 'Đã đồng bộ giả định 5 bản ghi từ ThingSpeak (Chế độ Fixture)',
        synced_count: 5
      };
    }

    const endpoint = `${this.apiBaseUrl}/api/v1/sync/thingspeak`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = (data.error && data.error.message) || `Lỗi đồng bộ (${response.status})`;
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Quá thời gian đồng bộ ThingSpeak (Timeout)');
      }
      throw err;
    }
  }

  // --- Mock Provider Implementation (Phục vụ Phase 1) ---
  async _getMockLatestReading(deviceId, scenario) {
    await new Promise(resolve => setTimeout(resolve, 150));

    if (deviceId === 'esp32-unknown' || scenario === 'not_found') {
      const err = new Error(`Thiết bị '${deviceId}' không tồn tại trên hệ thống.`);
      err.status = 404;
      err.code = 'device_not_found';
      throw err;
    }

    if (deviceId === 'esp32-stale-01') scenario = 'stale';
    if (deviceId === 'esp32-empty-01') scenario = 'empty';

    if (scenario === 'server_error') {
      const err = new Error(G0_FIXTURES.server_error.error.message);
      err.code = G0_FIXTURES.server_error.error.code;
      err.status = 500;
      throw err;
    }

    const fixture = G0_FIXTURES[scenario] || G0_FIXTURES.normal;
    const cloned = JSON.parse(JSON.stringify(fixture));
    cloned.device_id = deviceId;
    if (cloned.reading) {
      cloned.reading.device_id = deviceId;
    }
    return cloned;
  }

  async _getMockHistory(deviceId, limit) {
    await new Promise(resolve => setTimeout(resolve, 150));
    const cloned = JSON.parse(JSON.stringify(G0_HISTORY_FIXTURE));
    cloned.device_id = deviceId;
    cloned.limit = limit;
    cloned.readings = cloned.readings.slice(0, limit);
    return cloned;
  }

  // --- Real REST API Provider Implementation (Phục vụ Phase 2 & 3) ---
  async _fetchRealLatestReading(deviceId) {
    const endpoint = `${this.apiBaseUrl}/api/v1/devices/${encodeURIComponent(deviceId)}/readings/latest`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errJson = null;
        try { errJson = await response.json(); } catch (_) {}

        let errMsg = `Lỗi máy chủ (${response.status})`;
        if (errJson && errJson.error) {
          if (errJson.error.code === 'device_not_found') {
            errMsg = `Không tìm thấy thiết bị '${deviceId}' (Mã lỗi: device_not_found). Vui lòng kiểm tra lại ID thiết bị.`;
          } else {
            errMsg = errJson.error.message || errMsg;
          }
        }

        const err = new Error(errMsg);
        err.status = response.status;
        err.code = (errJson && errJson.error && errJson.error.code) || 'http_error';
        throw err;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Quá thời gian kết nối API Backend tại ${this.apiBaseUrl} (Timeout 8s).`);
        timeoutErr.code = 'timeout';
        throw timeoutErr;
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        const netErr = new Error(`Không thể kết nối đến Backend tại ${this.apiBaseUrl}. Hãy đảm bảo server backend đang chạy (npm run dev hoặc npm start).`);
        netErr.code = 'network_error';
        throw netErr;
      }
      throw err;
    }
  }

  async _fetchRealHistory(deviceId, limit = 20) {
    const endpoint = `${this.apiBaseUrl}/api/v1/devices/${encodeURIComponent(deviceId)}/readings?limit=${encodeURIComponent(limit)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errJson = null;
        try { errJson = await response.json(); } catch (_) {}
        const err = new Error((errJson && errJson.error && errJson.error.message) || `Lỗi máy chủ (${response.status})`);
        err.status = response.status;
        throw err;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}
