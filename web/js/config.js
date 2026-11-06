/**
 * Pepper Nursery IoT - Cấu hình Web Dashboard
 * Trách nhiệm: DKhoa (05_DKhoa_Web_Dashboard.md)
 * Sử dụng trực tiếp Backend Cloud của toàn bộ dự án trên Render (không qua server local)
 */

export const BACKEND_URL = 'https://pepper-nursery-iot.onrender.com';

export const APP_CONFIG = {
  // Chế độ nguồn dữ liệu: 'REAL_API' kết nối Backend Render của dự án
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

  // Base URL của Backend chính thức trên Render (Cloud)
  apiBaseUrl: BACKEND_URL,

  // Chu kỳ tự động làm mới từ API thật (10 giây)
  autoRefreshIntervalMs: 10000,

  // Ngưỡng thời gian đánh dấu dữ liệu cũ (5 phút theo docs/contracts/api.md)
  staleThresholdMinutes: 5,

  // Múi giờ hiển thị (GMT+7 Việt Nam)
  timeZone: 'Asia/Ho_Chi_Minh'
};

/**
 * Trả về cấu hình cố định trực tiếp từ frontend, không gửi request tới server local
 */
export async function loadRuntimeConfig() {
  return APP_CONFIG;
}
