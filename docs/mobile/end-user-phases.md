# Mobile người dùng cuối — các phase tái cấu trúc

Ngày cập nhật: 11/11/2026. Phạm vi: tài khoản cá nhân, một người nhiều thiết bị, mỗi thiết bị một chủ. UI theo `Design_System_Web_Mobile.md`.

## Phase 1 — API và sở hữu thiết bị: đã triển khai

- Đăng ký tài khoản `user` không cần thiết bị; không cho nâng quyền qua request đăng ký.
- Nhận thiết bị đã được cấp bằng ID chính xác; trả 404 cho mã không tồn tại và 409 cho mã có chủ khác.
- Tách `device-ownership.service.ts`; transaction khóa tài khoản rồi thiết bị cho nhận/gỡ/chọn/đổi tên. Không cần thay đổi schema hiện có (`owner_id`, `selected_device_id`).
- Kiểm tra sở hữu trên detail/latest/history/range; admin giữ quyền quản trị. `/devices/me` dùng DB để tránh token giữ lựa chọn cũ.
- Gỡ chỉ bỏ liên kết, giữ lịch sử; giữ đúng thiết bị đang chọn khi gỡ thiết bị khác.
- Ingest không ghi đè tên người dùng; cache bridge chỉ cấp dữ liệu cho ID khớp.
- Bổ sung JWT cho hai lệnh đọc số đo/lịch sử của web để tương thích thay đổi backend.

## Phase 2 — Flutter người dùng cuối: đã triển khai

- Màn hình đăng nhập/đăng ký có kiểm tra dữ liệu, xác nhận mật khẩu, ẩn/hiện mật khẩu và lỗi tiếng Việt.
- Chỉ chấp nhận tài khoản `user`; tài khoản `admin` bị chặn khi đăng nhập hoặc khôi phục phiên.
- Khôi phục phiên qua `/auth/me`; JWT lưu bằng `flutter_secure_storage`, tách theo base URL. Không lưu mật khẩu.
- Tài khoản mới có màn hình trống và nút thêm thiết bị; nhập ID trong hộp, tên gợi nhớ tùy chọn.
- Ba mục: Tổng quan, Lịch sử, Thiết bị. Tài khoản/đăng xuất ở góc trên. Không có cài đặt admin, chọn fixture hay đồng bộ bridge trong UI người dùng.
- Quản lý nhiều thiết bị, chọn thiết bị đang xem, đổi tên, xác nhận trước khi gỡ.
- Sáu đại lượng của năm cảm biến; phân biệt null/0, lỗi/chưa hiệu chuẩn/dữ liệu cũ/chưa xác định độ mới; không tự tạo nhận định khi backend chưa trả lời khuyên.
- Lịch sử 20 mẫu gần nhất theo từng đại lượng, có danh sách đọc được và thao tác làm mới.
- Tự lấy số đo mỗi 10 giây khi ứng dụng ở foreground; không gửi chồng yêu cầu. Xóa dữ liệu khi đổi thiết bị/gỡ/đăng xuất; bỏ phản hồi cũ đến muộn.
- Cấu hình `API_BASE_URL` lúc build, mặc định backend Render. Không gọi bridge trực tiếp và không tự rơi về dữ liệu mẫu.

## Phase 3 — kiểm thử và bàn giao

- Flutter analyzer; kiểm thử model/HTTP/controller/widget: đăng ký → trống → thêm → số đo/lịch sử → hủy xác nhận gỡ → gỡ → đăng xuất; lỗi 404/409/401, timeout/HTML 502, race đổi thiết bị/đăng xuất/danh sách cũ; màn hình 320×640 với chữ 1,6×.
- `backend/test/ownership.test.ts`: đã chạy thành công Express thật qua HTTP và MySQL 8.0 riêng: 7 nhóm ca kiểm thử đăng ký, cấp thiết bị, quyền sở hữu, lịch sử, gỡ/nhận lại, hai tài khoản nhận cùng lúc và cách ly cache bridge. Không dùng mock DB.
- Suite API legacy đã được cập nhật theo quyền mới, chuyển `console.assert` sang assertion làm test thất bại đúng cách, và chạy thành công trên schema MySQL thử nghiệm riêng.
- `mobile/test/visual_review_test.dart`: xuất ảnh 390×844 vào `mobile/build/qa` khi truyền `QA_FONT_PATH`, phục vụ đối chiếu thiết kế.
- Build web để kiểm tra biên dịch. APK/iOS và kiểm thử phần cứng thật cần xem kết quả bàn giao thực tế; test fixture không thay thế kiểm thử ESP32.

## Chạy kiểm thử backend mới

Dùng MySQL local riêng, DB name mới có tiền tố `pepper_test_`. Suite tự tạo schema và không được trỏ tới DB ứng dụng. Ví dụ PowerShell (cổng và user theo MySQL thử nghiệm của bạn):

```powershell
cd backend
$env:RUN_OWNERSHIP_DB_TESTS='1'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='33079'
$env:DB_USER='root'
$env:DB_PASSWORD=''
$env:DB_SSL='false'
$env:DB_NAME='pepper_test_ownership_' + [guid]::NewGuid().ToString('N')
npm run test:ownership
```

Thiếu `RUN_OWNERSHIP_DB_TESTS=1` thì suite báo skipped, không kết nối DB. Các schema thử nghiệm được giữ trong MySQL thử nghiệm để kiểm tra. `npm test` là suite legacy có seed dữ liệu; không dùng nó trên database triển khai.

## Rollout và nghiệm thu với phần cứng

1. Triển khai backend đã cập nhật; chạy migration hiện có nếu DB chưa có `owner_id`/`selected_device_id`. Không chạy reset/seed lên dữ liệu người dùng.
2. Đảm bảo ID trong hộp khớp khóa `devices.device_id` thực sự có telemetry. Bridge hiện dùng channel ID, ví dụ `1`; bỏ giả định ID và tên hiển thị là một.
3. Các liên kết demo cũ tạo qua `/auth/me/device` có thể chỉ có `selected_device_id` mà chưa có owner. Tài khoản đó cần nhận lại thiết bị qua API mới; không tự gán quyền khi migration.
4. Chạy mobile với base URL backend vừa triển khai. Đăng ký hai tài khoản: A nhận thiết bị; B nhận cùng ID phải bị chặn. A gỡ; B nhận lại và xem số đo.
5. Thử tắt nguồn/mất mạng/hết phiên; đối chiếu pH, TDS, độ ẩm 0% và cảm biến lỗi với ESP32.

Chưa triển khai trong phạm vi này: Wi-Fi provisioning/QR, push notification, khôi phục mật khẩu, lịch sử phân trang/lọc ngày, phát hành store. Luồng đăng ký–nhận thiết bị–xem số đo–gỡ liên kết đã có đầy đủ để nghiệm thu MVP.
