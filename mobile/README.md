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

Backend của dự án (do TDat phụ trách) chạy trên cổng **`8000`** (`http://localhost:8000/api/v1`).

### Cấu hình địa chỉ gọi API theo môi trường:
* **Trình giả lập Android Emulator**: `http://10.0.2.2:8000` (đã cấu hình tự động nhận diện).
* **Trình duyệt Chrome (Web) & Windows Desktop**: `http://localhost:8000`.
* **Điện thoại thật kết nối Wi-Fi LAN**: `http://<IP_LAN_MAY_BACKEND>:8000` (ví dụ `http://192.168.1.15:8000`).

### Các Endpoint Backend đã tích hợp:
1. **Kiểm tra trạng thái máy chủ (Health Check)**:
   * `GET /api/v1/health`
2. **Số đo mới nhất**:
   * `GET /api/v1/devices/{device_id}/readings/latest`
   * Hỗ trợ 3 thiết bị mẫu từ Backend:
     - `esp32-nursery-01`: Trạm hoạt động bình thường, đồng bộ số đo thật.
     - `esp32-stale-01`: Trạm mất tín hiệu > 5 phút (`is_stale: true`).
     - `esp32-empty-01`: Trạm mới chưa có dữ liệu (`reading: null`).
3. **Lịch sử số đo**:
   * `GET /api/v1/devices/{device_id}/readings?limit=20`
4. **Quy tắc chăm sóc hệ thống**:
   * `GET /api/v1/rules`: Tải danh sách quy tắc chăm sóc động từ CSDL MySQL trên Aiven.
5. **Đồng bộ ThingSpeak tức thì**:
   * `POST /api/v1/sync/thingspeak`: Gọi API đồng bộ các feed mới nhất từ ThingSpeak Channel `3543608`.
6. **Xác thực & Phân quyền (JWT)**:
   * `POST /api/v1/auth/login`: Hỗ trợ tài khoản `admin` / `admin123` hoặc `user` / `user123`.

---

## 3. Chuyển đổi giữa Backend Live và Dữ liệu mẫu (Fixture G0)

Nhấn vào biểu tượng **Cài đặt (biểu tượng thanh gạt `Tune` trên góc AppBar)** để:
- Chuyển đổi giữa chế độ **Backend thật (API Live)** và **Dữ liệu mẫu (Fixture G0)**.
- Đổi địa chỉ Base URL hoặc chọn nhanh (Localhost / Android Emulator).
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
