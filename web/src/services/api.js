/**
 * API Service & Adapter
 * Hỗ trợ chuyển đổi giữa REAL_API, FIXTURE Mock G0 và Cổng Dự phòng Sensor Data Bridge
 * Tuân thủ docs/contracts/huong-dan-tich-hop-frontend-mobile.md & docs/contracts/api.md
 */

import { BACKEND_URL, API_BASE_URL, SENSOR_BRIDGE_CONFIG } from '../config.js';
import { G0_FIXTURES, G0_HISTORY_FIXTURE } from '../fixtures/g0-fixtures.js';
import { authService } from './auth.js';

/**
 * Hàm quy đổi dữ liệu thô từ Sensor Data Bridge (Section 7)
 * sang định dạng chuẩn G0 v0.1
 */
function parseBridgeFeedToReading(feed, deviceId = 'esp32-nursery-01') {
  if (!feed || !feed.values) return null;

  const vals = feed.values;
  const recordedAt = feed.received_at
    ? (feed.received_at.endsWith('Z') ? feed.received_at : `${feed.received_at}Z`)
    : new Date().toISOString();

  return {
    schema_version: '0.1',
    device_id: deviceId,
    sample_id: `sdb-feed-${feed.id}`,
    recorded_at: recordedAt,
    air_temperature_c: vals.field1 !== null && vals.field1 !== undefined ? Number(vals.field1) : null,
    air_humidity_pct: vals.field2 !== null && vals.field2 !== undefined ? Number(vals.field2) : null,
    soil_temperature_c: vals.field3 !== null && vals.field3 !== undefined ? Number(vals.field3) : null,
    soil_moisture_pct: vals.field4 !== null && vals.field4 !== undefined ? Number(vals.field4) : null,
    soil_moisture_raw: vals.field7 !== null && vals.field7 !== undefined ? Number(vals.field7) : null,
    water_ph: vals.field5 !== null && vals.field5 !== undefined ? Number(vals.field5) : null,
    water_ph_adc_raw: vals.field8 !== null && vals.field8 !== undefined ? Number(vals.field8) : null,
    water_tds_ppm: vals.field6 !== null && vals.field6 !== undefined ? Number(vals.field6) : null,
    water_tds_adc_raw: null,
    sensor_status: {
      dht22: vals.field1 !== null && vals.field1 !== undefined ? 'ok' : 'read_error',
      ds18b20: vals.field3 !== null && vals.field3 !== undefined ? 'ok' : 'read_error',
      hd38: vals.field4 !== null && vals.field4 !== undefined ? 'ok' : 'not_calibrated',
      tds: vals.field6 !== null && vals.field6 !== undefined ? 'ok' : 'not_calibrated',
      ph4502c: vals.field5 !== null && vals.field5 !== undefined ? 'ok' : 'not_calibrated'
    }
  };
}

export const apiService = {
  /**
   * 1. Lấy số đo mới nhất của trạm (GET /api/v1/devices/:id/readings/latest)
   * Có cơ chế tự động chuyển sang Sensor Data Bridge khi Backend bảo trì (Section 7)
   */
  async getLatestReading(deviceId, mode = 'REAL_API', scenario = 'normal') {
    if (mode === 'FIXTURE') {
      const fixtureData = G0_FIXTURES[scenario];
      if (!fixtureData) {
        throw new Error(`Không tìm thấy fixture kịch bản: ${scenario}`);
      }
      if (fixtureData.error) {
        throw new Error(fixtureData.error.message || 'Lỗi server mô phỏng (500)');
      }
      return {
        ...fixtureData,
        device_id: deviceId || fixtureData.device_id
      };
    }

    if (mode === 'BRIDGE_DIRECT') {
      return await this.fetchDirectBridgeLatest(deviceId);
    }

    // Real API Call qua Backend TDat (Mục 1 & 4)
    const url = `${API_BASE_URL}/devices/${encodeURIComponent(deviceId)}/readings/latest`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { Authorization: `Bearer ${authService.getToken()}` } });
      const data = await res.json();

      if (!res.ok) {
        const err = new Error(data.error?.message || `HTTP ${res.status}: Lỗi máy chủ`);
        err.code = data.error?.code || 'request_failed';
        err.status = res.status;
        throw err;
      }

      return data;
    } catch (err) {
      // Nếu Backend lỗi kết nối/timeout và đang gọi trạm chính, kích hoạt phương án dự phòng (Section 7)
      if (deviceId === 'esp32-nursery-01' && (err.name === 'TimeoutError' || err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.message?.includes('fetch failed'))) {
        try {
          console.warn('[apiService] Backend chính chưa sẵn sàng, đang chuyển sang cổng dự phòng Sensor Data Bridge...');
          const fallbackData = await this.fetchDirectBridgeLatest(deviceId);
          fallbackData._is_fallback = true;
          return fallbackData;
        } catch {
          // nếu dự phòng cũng lỗi thì trả về lỗi gốc của backend
        }
      }
      throw err;
    }
  },

  /**
   * 2. Lấy lịch sử số đo (GET /api/v1/devices/:id/readings?limit=20)
   */
  async getHistory(deviceId, limit = 20, mode = 'REAL_API') {
    if (mode === 'FIXTURE') {
      return {
        ...G0_HISTORY_FIXTURE,
        device_id: deviceId || G0_HISTORY_FIXTURE.device_id,
        limit
      };
    }

    if (mode === 'BRIDGE_DIRECT') {
      return await this.fetchDirectBridgeHistory(deviceId, limit);
    }

    const url = `${API_BASE_URL}/devices/${encodeURIComponent(deviceId)}/readings?limit=${limit}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { Authorization: `Bearer ${authService.getToken()}` } });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `Lỗi tải lịch sử (${res.status})`);
      }

      return data;
    } catch (err) {
      // Phương án dự phòng (Section 7)
      if (deviceId === 'esp32-nursery-01' && (err.name === 'TimeoutError' || err.message?.includes('fetch failed'))) {
        try {
          return await this.fetchDirectBridgeHistory(deviceId, limit);
        } catch {
          // ignore
        }
      }
      throw err;
    }
  },

  /**
   * 3. Ép đồng bộ tức thời từ Sensor Data Bridge sang Backend (Section 4: POST /sync/bridge)
   */
  async syncBridge() {
    let res;
    try {
      res = await fetch(`${API_BASE_URL}/sync/bridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
    } catch {
      // Fallback endpoint cũ /sync/thingspeak nếu có
      res = await fetch(`${API_BASE_URL}/sync/thingspeak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Đồng bộ dữ liệu thất bại');
    }
    return data;
  },

  // Alias tương thích ngược cho các màn hình cũ
  async syncThingSpeak() {
    return this.syncBridge();
  },

  /**
   * 4. Đọc trạng thái Polling Worker (Section 4: GET /sync/bridge/status)
   */
  async getBridgeStatus() {
    try {
      let res = await fetch(`${API_BASE_URL}/sync/bridge/status`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/sync/thingspeak/status`, {
          signal: AbortSignal.timeout(4000)
        });
      }
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { is_running: true, channel_id: 1, provider: 'sensor-data-bridge' };
  },

  // Alias tương thích ngược
  async getThingSpeakStatus() {
    return this.getBridgeStatus();
  },

  /**
   * 5. Phương án dự phòng đọc trực tiếp Sensor Data Bridge (Section 7)
   */
  async fetchDirectBridgeLatest(deviceId = 'esp32-nursery-01') {
    const { baseUrl, channelId, readApiKey } = SENSOR_BRIDGE_CONFIG;
    const url = `${baseUrl}/channels/${channelId}/feeds?limit=1`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': readApiKey },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      throw new Error(`Sensor Data Bridge trả về lỗi HTTP ${res.status}`);
    }

    const json = await res.json();
    const feed = json.feeds?.[0];
    if (!feed) {
      return {
        device_id: deviceId,
        received_at: new Date().toISOString(),
        is_stale: null,
        reading: null,
        advice: null
      };
    }

    const reading = parseBridgeFeedToReading(feed, deviceId);
    const recTime = new Date(reading.recorded_at).getTime();
    const isStale = Date.now() - recTime > 5 * 60 * 1000;

    return {
      device_id: deviceId,
      received_at: feed.received_at || new Date().toISOString(),
      is_stale: isStale,
      reading,
      advice: null
    };
  },

  async fetchDirectBridgeHistory(deviceId = 'esp32-nursery-01', limit = 20) {
    const { baseUrl, channelId, readApiKey } = SENSOR_BRIDGE_CONFIG;
    const url = `${baseUrl}/channels/${channelId}/feeds?limit=${limit}`;
    const res = await fetch(url, {
      headers: { 'X-API-Key': readApiKey },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      throw new Error(`Sensor Data Bridge trả về lỗi HTTP ${res.status}`);
    }

    const json = await res.json();
    const feeds = json.feeds || [];
    const readings = feeds.map(feed => {
      const r = parseBridgeFeedToReading(feed, deviceId);
      const isStale = Date.now() - new Date(r.recorded_at).getTime() > 5 * 60 * 1000;
      return {
        reading: r,
        received_at: feed.received_at || r.recorded_at,
        is_stale: isStale
      };
    });

    return {
      device_id: deviceId,
      limit,
      readings
    };
  },

  /**
   * 6. Quản lý Care Rules (CRUD - Section 4)
   */
  async getRules(all = true) {
    const res = await fetch(`${API_BASE_URL}/rules?all=${all}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Không thể lấy danh sách quy tắc');
    }
    return data.rules || [];
  },

  async createRule(payload) {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE_URL}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Thêm quy tắc thất bại');
    }
    return data.rule;
  },

  async updateRule(id, payload) {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Cập nhật quy tắc thất bại');
    }
    return data.rule;
  },

  async deleteRule(id) {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Xóa quy tắc thất bại');
    }
    return data;
  },

  /**
   * 6. Quản trị Người dùng (Users Management)
   */
  async getUsers() {
    const token = authService.getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users) return data.users;
      }
    } catch {
      // Endpoint fallback
    }

    // Fallback store in localStorage if remote endpoint is not yet mounted
    if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem('pepper_managed_users');
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          // ignore parse error
        }
      }
    }

    // Default seeded users for IoT dashboard
    const defaultUsers = [
      { id: 1, username: 'admin', full_name: 'Quản trị viên Vườn ươm', role: 'admin', created_at: '2026-03-01T08:00:00Z', is_active: true },
      { id: 2, username: 'technician', full_name: 'Kỹ thuật viên Giám sát', role: 'user', created_at: '2026-03-05T10:15:00Z', is_active: true },
      { id: 3, username: 'user', full_name: 'Kỹ thuật viên Vận hành', role: 'user', created_at: '2026-03-10T14:30:00Z', is_active: true },
    ];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pepper_managed_users', JSON.stringify(defaultUsers));
    }
    return defaultUsers;
  },

  async deleteUser(id) {
    const users = await this.getUsers();
    const updated = users.filter(u => u.id !== id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pepper_managed_users', JSON.stringify(updated));
    }
    return { success: true };
  }
};

/**
 * Top-level standalone functions theo Code mẫu Section 6
 * (cho phép import trực tiếp: import { fetchLiveTelemetry, fetchHistoryTelemetry, loginAdmin } from './api.js')
 */
export async function fetchLiveTelemetry(deviceId = 'esp32-nursery-01') {
  return await apiService.getLatestReading(deviceId);
}

export async function fetchHistoryTelemetry(limit = 20, deviceId = 'esp32-nursery-01') {
  const data = await apiService.getHistory(deviceId, limit);
  return data.readings || [];
}

export async function loginAdmin(username, password) {
  return await authService.login(username, password);
}


