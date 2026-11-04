# Ứng Dụng Mobile — Pepper Nursery IoT (MVP G0 v0.1)

Ứng dụng Flutter di động theo dõi và hỗ trợ chăm sóc cây ớt con trong vườn ươm IoT (phụ trách bởi thành viên **QThang** theo hợp đồng `docs/members/QThang/06_QThang_Ung_dung_Mobile.md`).

---

## 1. Yêu cầu môi trường

- **Flutter SDK**: `>= 3.13.0` (đã kiểm tra tương thích với Flutter `3.47.9` / Dart `3.13.7`).
- **Nền tảng hỗ trợ**:
  - **Chrome (Web)**: Chạy thử nhanh không cần máy ảo (`flutter run -d chrome`).
  - **Android**: Thiết bị thật hoặc emulator qua ADB.
  - **Windows Desktop**: (`flutter run -d windows`).

---

## 2. Cài đặt và khởi chạy

Di chuyển vào thư mục `mobile`:

```bash
cd mobile
```

### Cài đặt dependencies:
```bash
flutter pub get
```

### Chạy ứng dụng trên Chrome (khuyến nghị để test giao diện nhanh):
```bash
flutter run -d chrome
```

### Chạy ứng dụng trên thiết bị Android / Giả lập:
```bash
flutter run -d android
```

### Kiểm tra cú pháp và chạy test:
```bash
flutter analyze
flutter test
```

---

## 3. Các kịch bản dữ liệu mẫu (Phase 1 — Fixtures)

Ứng dụng tích hợp sẵn dropdown **Kịch bản thử nghiệm** ngay trên màn hình để kiểm thử các trạng thái theo tài liệu G0 mà không phụ thuộc vào backend hoặc ESP32:

1. **Bình thường (`latest-normal.json`)**: Hiển thị đầy đủ 5 cảm biến, trạng thái xanh ngọc ("Bình thường"), thời gian đo và nhận rõ ràng.
2. **Lỗi một phần cảm biến (`latest-partial-error.json`)**: Cảm biến DHT22 và TDS báo lỗi ("Lỗi cảm biến" nền hồng đỏ, chữ đỏ san hô), các cảm biến còn lại vẫn hiển thị số đo hợp lệ.
3. **Chưa hiệu chuẩn (`latest-uncalibrated.json`)**: HD-38, TDS và pH hiển thị số thô ADC kèm nhãn "Chưa hiệu chuẩn", **tuyệt đối không gắn nhãn %, ppm hay pH**.
4. **Dữ liệu cũ (`latest-stale.json`)**: Banner cảnh báo màu đỏ san hô "Dữ liệu cũ", thông báo lần cập nhật cuối và nguy cơ thiết bị mất liên lạc.
5. **Chưa có dữ liệu (`latest-empty.json`)**: Hiển thị thông báo "Chưa có dữ liệu số đo cho thiết bị này", không tự ý sinh số `0` giả.
6. **Lỗi máy chủ (`server-error.json`)**: Hiển thị thông báo lỗi và nút **Thử lại**.

---

## 4. Cấu trúc thư mục mã nguồn

```text
mobile/
├── assets/
│   └── fixtures/           # Bộ fixture JSON đồng bộ từ docs/contracts/fixtures/
├── lib/
│   ├── core/
│   │   └── constants/
│   │       ├── app_colors.dart   # Design tokens chuẩn theo Design_System_Web_Mobile.md
│   │       └── app_theme.dart    # Cấu hình theme sáng (Cream background, Navy text)
│   ├── models/
│   │   └── sensor_reading.dart   # Schema dữ liệu khớp với api.md và sensor-reading.md
│   ├── services/
│   │   └── api_service.dart      # Lớp adapter lấy dữ liệu (hỗ trợ cả Fixture và REST API)
│   ├── views/
│   │   ├── screens/
│   │   │   ├── dashboard_screen.dart # Màn hình tổng quan số đo mới nhất
│   │   │   └── history_screen.dart   # Màn hình lịch sử số đo
│   │   └── widgets/
│   │       └── metric_card.dart      # Thẻ MetricCard theo đúng Design System
│   └── main.dart                     # Điều hướng và khởi động ứng dụng
├── test/
│   └── widget_test.dart
├── pubspec.yaml
└── README.md
```

---

## 5. Kết nối Backend thật (Phase 2 & Phase 3)

Khi backend do TDat triển khai sẵn sàng:
1. Mở `lib/services/api_service.dart`.
2. Chuyển `mode = DataSourceMode.live`.
3. Đặt `baseUrl` tương ứng:
   - Trên trình giả lập Android Emulator: `http://10.0.2.2:3000`
   - Trên điện thoại thật qua mạng Wi-Fi: `http://<IP_MAY_TINH>:3000` (ví dụ: `http://192.168.1.15:3000`)
   - Trên Chrome Web: `http://localhost:3000`
