# Ứng Dụng Mobile — Pepper Nursery IoT (MVP G0 v0.1)

Ứng dụng Flutter di động theo dõi và hỗ trợ chăm sóc cây ớt con trong vườn ươm IoT (phụ trách bởi thành viên **QThang** theo hợp đồng `docs/members/QThang/06_QThang_Ung_dung_Mobile.md`).

---

## 1. Yêu cầu môi trường

- **Flutter SDK**: `>= 3.13.0` (đã kiểm tra tương thích với Flutter `3.47.9` / Dart `3.13.7`).
- **Nền tảng hỗ trợ**:
  - **Chrome (Web)**: Chạy thử nhanh (`flutter run -d chrome`).
  - **Android**: Thiết bị thật hoặc máy ảo qua ADB (`flutter run -d android`).
  - **Windows Desktop**: (`flutter run -d windows`).

---

## 2. Kết nối Backend (Phase 2 & Phase 3)

Mặc định ứng dụng kết nối trực tiếp với Backend Cloud của dự án triển khai trên Render:
**`https://pepper-nursery-iot.onrender.com`**

### Cấu hình địa chỉ gọi API:
* **Mặc định (Cloud Render)**: `https://pepper-nursery-iot.onrender.com` (chạy được trên mọi môi trường: Android máy thật, Emulator, Chrome Web, Windows Desktop).
* **Phát triển nội bộ (Localhost)**: `http://localhost:8000` (khi chạy backend máy thật với Chrome/Desktop).
* **Trình giả lập Android Emulator kết nối Localhost**: `http://10.0.2.2:8000`.

### Các Endpoint Backend đã tích hợp:
1. **Kiểm tra trạng thái máy chủ (Health Check)**:
   * `GET /api/v1/health`
2. **Số đo mới nhất (Tự động cập nhật mỗi 5s)**:
   * `GET /api/v1/devices/{device_id}/readings/latest`
   * Mặc định ứng dụng sử dụng `device_id = 1` (trạm thực tế ESP32 đồng bộ qua Sensor Data Bridge Channel 1) và tự động thăm dò ngầm định kỳ mỗi **5 giây** để số đo luôn ở trạng thái mới nhất theo thời gian thực mà không làm giật/nháy giao diện.
   * Hỗ trợ chuyển đổi thiết bị từ Backend trong Cài đặt:
     - `1`: Trạm thực tế ESP32 (Sensor Data Bridge Channel 1).
     - `esp32-nursery-01`: Trạm kiểm thử cũ.
     - `esp32-stale-01`: Trạm mất tín hiệu > 5 phút (`is_stale: true`).
     - `esp32-empty-01`: Trạm mới chưa có dữ liệu (`reading: null`).
3. **Lịch sử số đo**:
   * `GET /api/v1/devices/{device_id}/readings?limit=20`
4. **Quy tắc chăm sóc hệ thống**:
   * `GET /api/v1/rules`: Tải danh sách quy tắc chăm sóc động từ CSDL MySQL trên Aiven.
5. **Đồng bộ Sensor Data Bridge tức thì**:
   * `POST /api/v1/sync/bridge`: Gọi API đồng bộ các feed mới nhất từ Sensor Data Bridge Channel `1` (có fallback `/api/v1/sync/thingspeak`).
6. **Xác thực & Phân quyền (JWT)**:
   * `POST /api/v1/auth/login`: Hỗ trợ tài khoản `admin` / `admin123` hoặc `user` / `user123`.

---

## 3. Chuyển đổi giữa Backend Live, Tự động làm mới và Dữ liệu mẫu (Fixture G0)

Nhấn vào biểu tượng **Cài đặt (biểu tượng thanh gạt `Tune` trên góc AppBar)** để:
- Chuyển đổi giữa chế độ **Backend thật (API Live)** và **Dữ liệu mẫu (Fixture G0)**.
- Bật/tắt chế độ **Tự động cập nhật dữ liệu** và thay đổi chu kỳ làm mới (mặc định **5s**, hỗ trợ 3s, 10s).
- Có thể bật/tắt nhanh chế độ tự động làm mới bằng nút biểu tượng **Sync** ngay trên thanh AppBar.
- Đổi địa chỉ Base URL hoặc chọn nhanh (Cloud Render / Localhost / Android Emulator).
- Nút **Kiểm tra kết nối (Ping Health)** kiểm tra trực tiếp máy chủ có phản hồi hay không.
- Bấm **Đồng bộ ngay** để ép đồng bộ ThingSpeak.
- Đăng nhập / Đăng xuất tài khoản quản trị viên.

---

## 4. Chạy và Kiểm thử

Di chuyển vào thư mục `mobile`:
```bash
cd mobile
flutter pub get
```

### Chạy ứng dụng:
```bash
# Trên Chrome
flutter run -d chrome

# Trên Android
flutter run -d android
```

### Chạy toàn bộ bộ kiểm thử tự động (12 ca kiểm thử):
```bash
flutter analyze
flutter test
```
