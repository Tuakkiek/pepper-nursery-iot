/**
 * Pepper Nursery IoT - Web Dashboard Configuration
 * Phụ trách: DKhoa (05_DKhoa_Web_Dashboard.md)
 * Tuân thủ: docs/contracts/huong-dan-tich-hop-frontend-mobile.md
 */

// 1. Địa chỉ máy chủ Backend (Section 1)
export const BACKEND_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL)
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/api\/v1\/?$/, '')
  : 'https://pepper-nursery-iot.onrender.com';

export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

// 2. Cổng dự phòng trực tiếp Sensor Data Bridge (Section 7)
export const SENSOR_BRIDGE_CONFIG = {
  baseUrl: 'https://sensor-data-bridge-backend.onrender.com/api/v1',
  channelId: 1,
  readApiKey: 'sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw'
};

export const APP_CONFIG = {
  // Chế độ dữ liệu mặc định: 'REAL_API' kết nối Backend Cloud của dự án
  dataMode: 'REAL_API',

  // Kịch bản mock mặc định
  currentScenario: 'normal',

  // Thiết bị mặc định
  defaultDeviceId: 'esp32-nursery-01',

  // Danh sách các trạm thiết bị được hỗ trợ
  availableDevices: [
    { id: 'esp32-nursery-01', name: 'esp32-nursery-01 (Trạm vườn ươm 01 - Đầy đủ số đo)' },
    { id: 'esp32-stale-01', name: 'esp32-stale-01 (Trạm mất liên lạc - Dữ liệu cũ > 5 phút)' },
    { id: 'esp32-empty-01', name: 'esp32-empty-01 (Trạm mới lắp - Chưa có dữ liệu)' },
    { id: 'esp32-unknown', name: 'esp32-unknown (Kiểm thử lỗi 404 device_not_found)' }
  ],

  // Danh sách các kịch bản mock G0
  mockScenarios: [
    { id: 'normal', name: '1. Mẫu bình thường (latest-normal.json)' },
    { id: 'uncalibrated', name: '2. Chưa hiệu chuẩn (latest-uncalibrated.json)' },
    { id: 'partial_error', name: '3. Lỗi một cảm biến (latest-partial-error.json)' },
    { id: 'stale', name: '4. Dữ liệu cũ > 5 phút (latest-stale.json)' },
    { id: 'empty', name: '5. Chưa có bản ghi (latest-empty.json)' },
    { id: 'zero_valid', name: '6. Số đo 0 hợp lệ (0 != null)' },
    { id: 'with_advice', name: '7. Có lời khuyên chăm sóc từ Backend' },
    { id: 'server_error', name: '8. Lỗi máy chủ (server-error.json)' }
  ],

  // Base URL của Backend chính thức
  apiBaseUrl: API_BASE_URL,

  // Chu kỳ tự động làm mới số đo (10 giây)
  autoRefreshIntervalMs: 10000,

  // Múi giờ hiển thị (GMT+7 Việt Nam)
  timeZone: 'Asia/Ho_Chi_Minh'
};

