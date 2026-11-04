/**
 * Pepper Nursery IoT - Cấu hình Web Dashboard
 * Trách nhiệm: DKhoa (05_DKhoa_Web_Dashboard.md)
 * Hỗ trợ đồng bộ cấu hình runtime từ server và môi trường
 */

export const APP_CONFIG = {
  // Chế độ nguồn dữ liệu: 'REAL_API' (khi kết nối Backend TDat) hoặc 'FIXTURE' (chạy dữ liệu mẫu)
  dataMode: 'REAL_API',

  // Kịch bản fixture mặc định khi ở chế độ FIXTURE
  currentScenario: 'normal',

  // Thiết bị mặc định
  defaultDeviceId: 'esp32-nursery-01',

  // Danh sách các thiết bị theo quy ước của Backend TDat (backend/README.md)
  availableDevices: [
    { id: 'esp32-nursery-01', name: 'ESP32 Vườn ươm 01 (Trạm bình thường)' },
    { id: 'esp32-stale-01', name: 'ESP32 Thử nghiệm 02 (Dữ liệu cũ > 5 phút)' },
    { id: 'esp32-empty-01', name: 'ESP32 Thử nghiệm 03 (Chưa có dữ liệu)' },
    { id: 'esp32-unknown', name: 'ESP32 Không tồn tại (Kiểm tra lỗi 404)' }
  ],

  // Base URL của Backend TDat (Đang chạy tại http://localhost:8000)
  apiBaseUrl: 'http://localhost:8000',

  // Chu kỳ tự động làm mới từ API thật (10 giây)
  autoRefreshIntervalMs: 10000,

  // Ngưỡng thời gian đánh dấu dữ liệu cũ (5 phút theo docs/contracts/api.md)
  staleThresholdMinutes: 5,

  // Múi giờ hiển thị (GMT+7 Việt Nam)
  timeZone: 'Asia/Ho_Chi_Minh'
};

/**
 * Tải cấu hình từ endpoint /api/config của server.js nếu có
 */
export async function loadRuntimeConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const serverConfig = await res.json();
      if (serverConfig.apiBaseUrl) APP_CONFIG.apiBaseUrl = serverConfig.apiBaseUrl;
      if (serverConfig.dataMode) APP_CONFIG.dataMode = serverConfig.dataMode;
      if (serverConfig.defaultDeviceId) APP_CONFIG.defaultDeviceId = serverConfig.defaultDeviceId;
      if (serverConfig.autoRefreshIntervalMs) APP_CONFIG.autoRefreshIntervalMs = serverConfig.autoRefreshIntervalMs;
    }
  } catch (_) {
    // Sử dụng cấu hình mặc định nếu chạy trên static host không có server.js
  }
  return APP_CONFIG;
}
