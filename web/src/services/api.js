/**
 * API Service & Adapter
 * Hỗ trợ chuyển đổi giữa REAL_API và FIXTURE Mock G0
 * Tuân thủ docs/contracts/api.md và docs/contracts/sensor-reading.md
 */

import { BACKEND_URL } from '../config.js';
import { G0_FIXTURES, G0_HISTORY_FIXTURE } from '../fixtures/g0-fixtures.js';
import { authService } from './auth.js';

export const apiService = {
  /**
   * Lấy số đo mới nhất của trạm
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

    // Real API Call
    const url = `${BACKEND_URL}/api/v1/devices/${encodeURIComponent(deviceId)}/readings/latest`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.error?.message || `HTTP ${res.status}: Lỗi máy chủ`);
      err.code = data.error?.code || 'request_failed';
      err.status = res.status;
      throw err;
    }

    return data;
  },

  /**
   * Lấy lịch sử số đo
   */
  async getHistory(deviceId, limit = 20, mode = 'REAL_API') {
    if (mode === 'FIXTURE') {
      return {
        ...G0_HISTORY_FIXTURE,
        device_id: deviceId || G0_HISTORY_FIXTURE.device_id,
        limit
      };
    }

    const url = `${BACKEND_URL}/api/v1/devices/${encodeURIComponent(deviceId)}/readings?limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || `Lỗi tải lịch sử (${res.status})`);
    }

    return data;
  },

  /**
   * Kích hoạt đồng bộ tức thời từ ThingSpeak sang Backend TDat
   */
  async syncThingSpeak() {
    const res = await fetch(`${BACKEND_URL}/api/v1/sync/thingspeak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Đồng bộ ThingSpeak thất bại');
    }
    return data;
  },

  /**
   * Đọc trạng thái ThingSpeak Polling Worker
   */
  async getThingSpeakStatus() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/sync/thingspeak/status`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { is_running: false, channel_id: 3543608 };
  },

  /**
   * Quản lý Care Rules (CRUD)
   */
  async getRules(all = true) {
    const res = await fetch(`${BACKEND_URL}/api/v1/rules?all=${all}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Không thể lấy danh sách quy tắc');
    }
    return data.rules || [];
  },

  async createRule(payload) {
    const token = authService.getToken();
    const res = await fetch(`${BACKEND_URL}/api/v1/rules`, {
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
    const res = await fetch(`${BACKEND_URL}/api/v1/rules/${id}`, {
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
    const res = await fetch(`${BACKEND_URL}/api/v1/rules/${id}`, {
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
  }
};

