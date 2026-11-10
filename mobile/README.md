# Vườn ươm của tôi — mobile người dùng cuối

Flutter app dùng API backend của dự án. Luồng: đăng ký tài khoản → chưa có thiết bị → nhập device ID trong hộp → xem số đo/lịch sử → gỡ thiết bị khi cần. Một tài khoản có nhiều thiết bị; mỗi thiết bị có một chủ.

UI dùng nền kem `#F7F8F3`, navy `#002C3E`, teal `#78BCC4`, màu cảnh báo theo [Design System](../Design_System_Web_Mobile.md). Ba mục chính: Tổng quan, Lịch sử, Thiết bị; tài khoản và đăng xuất ở góc trên.

## Chạy ứng dụng

Đã kiểm tra với Flutter 3.47.9 / Dart 3.13.7. Cần backend có các thay đổi sở hữu thiết bị trong [hợp đồng API](../docs/contracts/api.md).

```powershell
cd mobile
flutter pub get
# Backend Render mặc định
flutter run -d chrome
# Backend local, chạy trên Chrome
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8000
# Android Emulator kết nối backend trên máy phát triển
flutter run -d <emulator-id> --dart-define=API_BASE_URL=http://10.0.2.2:8000
# Android máy thật: dùng IP LAN của máy chạy backend hoặc URL HTTPS đã triển khai
flutter run -d <device-id> --dart-define=API_BASE_URL=https://your-backend.example
```

`API_BASE_URL` nhận URL gốc hoặc URL kết thúc bằng `/api/v1`. Mặc định: `https://pepper-nursery-iot.onrender.com`. Đổi cấu hình cần chạy/build lại. Android chỉ mở HTTP local trong build debug; bản release dùng HTTPS.

Thiết bị phải được backend cấp trước. `device_id` là khóa chính, không phải tên gợi nhớ. Với bridge hiện tại, dùng channel ID như `1`. Không nhập ID bất kỳ rồi mong hệ thống tạo phần cứng mới. Đăng ký tài khoản không cần ID thiết bị.

## API sử dụng

| Chức năng | Endpoint dưới `/api/v1` |
| --- | --- |
| Đăng ký / đăng nhập / xác minh phiên | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Danh sách / thêm thiết bị | `GET /user/devices`, `POST /user/devices` |
| Đổi tên / gỡ liên kết | `PATCH /user/devices/:id`, `DELETE /user/devices/:id` |
| Chọn thiết bị | `PUT /user/devices/:id/active` |
| Số đo / lịch sử | `GET /devices/:id/readings/latest`, `GET /devices/:id/readings?limit=20` |

Mọi API thiết bị gửi Bearer JWT. Phiên được lưu bằng [flutter_secure_storage](https://pub.dev/packages/flutter_secure_storage); 401 xóa phiên và trở về đăng nhập. Web preview dùng HTTPS hoặc localhost cho secure storage. Có cấu hình Keychain cho iOS; build iOS cần macOS/Xcode.

Ứng dụng này chỉ dành cho tài khoản người dùng cá nhân. Tài khoản `admin` không thể đăng nhập hoặc khôi phục phiên trong mobile.

Số đo làm mới mỗi 10 giây khi app hoạt động. Null hiện `—`, số 0 vẫn hiện đúng; cảm biến chưa hiệu chuẩn chỉ hiện số đọc thô. Độ mới và nhận định chăm sóc lấy từ backend. Không có fallback mẫu hay gọi Sensor Data Bridge trực tiếp. Fixture chỉ còn dùng trong kiểm thử parser.

## Cấu trúc

- `lib/services/api_service.dart`: HTTP, cấu hình URL, JWT header, lỗi tiếng Việt.
- `lib/services/session_store.dart`: lưu/xóa JWT trong kho an toàn của nền tảng.
- `lib/controllers/app_controller.dart`: phiên, danh sách/thiết bị đang chọn, polling, loại bỏ response cũ.
- `lib/models/`: kiểu dữ liệu API.
- `lib/views/screens/`: đăng nhập/đăng ký, tổng quan, thiết bị, lịch sử.
- `lib/core/constants/`: màu, spacing, typography và theme theo Design System.

## Kiểm thử và build

```powershell
flutter analyze
flutter test
flutter build web
flutter build apk --debug
# Xuất ảnh UI để review (tùy chọn, đường dẫn font theo máy)
flutter test test/visual_review_test.dart --dart-define=QA_FONT_PATH=C:/Windows/Fonts/segoeui.ttf
```

Test mobile dùng HTTP mock và fixture trong thư mục test, không tạo tài khoản trên Render. Suite backend dùng HTTP + MySQL thật riêng: xem [các phase và hướng dẫn nghiệm thu](../docs/mobile/end-user-phases.md). Ảnh QA nằm trong `build/qa/`, APK debug nếu build thành công ở `build/app/outputs/flutter-apk/app-debug.apk`.
