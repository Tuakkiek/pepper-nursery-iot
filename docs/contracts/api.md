# API số đo cho MVP năm cảm biến

**Phiên bản số đo:** 0.1; đường dẫn bắt đầu bằng /api/v1. Cập nhật luồng tài khoản mobile: 11/11/2026. Fixture trong fixtures/ là dữ liệu mô phỏng. API đọc thiết bị/số đo thực tế yêu cầu JWT và kiểm tra chủ sở hữu; fixture không mô tả lớp xác thực.

## Luồng người dùng cuối (mobile)

1. `POST /auth/register` với `{ "username": "nguoidung", "password": "matkhau123", "full_name": "Người trồng ớt" }`. Trả `201 { status, token, user }`, `user.role = "user"`, `selected_device_id = null`. Không cần thiết bị khi đăng ký; không cho tự đăng ký vai trò admin. Username 3–64 ký tự, họ tên 1–128; mật khẩu tối thiểu 6 ký tự, tối đa 72 byte UTF-8.
2. `GET /user/devices` với `Authorization: Bearer <token>` trả `{ status: "ok", active_device_id: null, total: 0, devices: [] }` cho tài khoản mới.
3. `POST /user/devices` với `{ "device_id": "1", "custom_name": "Khay ban công" }`. Device ID là **khóa chính đã được cấp cho phần cứng**, tối đa 64 ký tự. Không dùng tên gợi nhớ để nhận thiết bị. `custom_name` không bắt buộc, tối đa 128 ký tự. Mã sai trả `404 device_not_found`; đã có chủ khác trả `409 device_already_claimed`. Gửi lại mã thuộc chính tài khoản vẫn thành công. API không tự tạo phần cứng từ mã do người dùng nhập.
4. `PUT /user/devices/{device_id}/active` chỉ nhận thiết bị thuộc tài khoản. Thiết bị đầu tiên được chọn tự động. Mobile đọc `GET /devices/{device_id}/readings/latest` và `/readings?limit=20` với ID vừa chọn; alias `/devices/me/...` đọc lựa chọn hiện tại từ DB, không dùng lựa chọn cũ trong JWT.
5. `PATCH /user/devices/{device_id}` với `{ "name": "Khay mới" }` đổi tên hiển thị. Việc nhận số đo tiếp theo không ghi đè tên này.
6. `DELETE /user/devices/{device_id}` gỡ liên kết (`owner_id = null`), giữ phần cứng và lịch sử. Trả `{ status: "ok", remaining_devices_count, active_device_id }`. Gỡ thiết bị đang chọn thì chọn thiết bị còn lại đầu tiên; gỡ thiết bị khác giữ nguyên lựa chọn. Gỡ thiết bị cuối trả `active_device_id: null`. Tài khoản khác có thể nhận lại bằng ID.

Thao tác nhận/gỡ/chọn/đổi tên chạy trong transaction có khóa hàng MySQL. Một tài khoản có nhiều thiết bị; một hàng thiết bị có tối đa một `owner_id`. Người dùng không thể đọc/sửa/gỡ/chọn thiết bị chưa thuộc tài khoản (`403 forbidden`). JWT thiếu/hết hạn trả `401`; mobile xóa phiên và yêu cầu đăng nhập lại.

`GET /devices` và `POST /devices` dành cho admin. Bên cấp phần cứng tạo thiết bị trước qua `POST /devices` hoặc quy trình ingest hiện có. Mã in trong hộp phải khớp `devices.device_id` mà backend nhận số đo. Với Sensor Data Bridge hiện tại, mã là channel ID (ví dụ `1`); tên `esp32-nursery-01` không thay thế mã này. Cache không chia sẻ số đo giữa hai device ID khác nhau.

**Thay đổi so với bản demo:** đọc `/devices/...` không còn công khai; đăng ký `role: admin` bị từ chối; nhận mã chưa tồn tại không còn tạo mới; `/auth/me/device` chỉ chọn thiết bị đã sở hữu. Web gọi số đo/lịch sử đã được bổ sung header JWT. Cần triển khai backend cùng bản mobile này. Chi tiết rollout và kiểm thử: [các phase mobile](../mobile/end-user-phases.md).

## Gửi số đo

POST /api/v1/readings với Content-Type application/json. Body theo sensor-reading.md, ví dụ fixtures/reading-normal.json hoặc reading-uncalibrated.json. Backend kiểm tra schema_version, device_id, sample_id, kiểu/đơn vị, đúng năm khóa sensor_status và quan hệ giữa trạng thái với giá trị null. Không biến null thành 0. Cặp (device_id, sample_id) là khóa chống trùng.

| Kết quả | HTTP | Body tối thiểu |
| --- | ---: | --- |
| Tạo mới | 201 | fixtures/ingest-created.json |
| Gửi lại cùng mã mẫu và nội dung | 200 | fixtures/ingest-duplicate.json, giữ received_at ban đầu |
| Cùng mã mẫu nhưng nội dung khác | 409 | error.code: sample_conflict |
| JSON/giá trị không hợp lệ | 400 | error.code: invalid_reading, error.message |
| Lỗi server | 500 | error.code: server_error |

TVan chỉ đánh dấu đã gửi khi nhận 201 hoặc 200 với device_id/sample_id khớp. Khi mất mạng hoặc 5xx, giữ cùng sample_id và thử lại theo chính sách firmware. Backend đặt received_at UTC khi nhận lần đầu; recorded_at có thể null nếu đồng hồ ESP32 chưa tin cậy.

## Đọc cho web và mobile

- GET /api/v1/devices/{device_id}/readings/latest trả 200 với device_id, reading, received_at, is_stale, advice. Khi chưa có bản ghi: reading, received_at, advice là null, is_stale là null. Ví dụ fixtures/latest-normal.json, latest-uncalibrated.json, latest-partial-error.json, latest-stale.json và latest-empty.json.
- GET /api/v1/devices/{device_id}/readings?limit=20 trả 200 với device_id, readings theo received_at giảm dần, limit. limit từ 1 đến 100; mặc định 20. Mỗi mục có reading, received_at. Ví dụ fixtures/history.json. Không suy diễn mẫu lỗi thành 0 khi vẽ lịch sử.
- Thiết bị không tồn tại trả 404 với error.code: device_not_found; lỗi server trả 500 như fixtures/server-error.json. Trạng thái thiết bị chưa có dữ liệu khác thiết bị không tồn tại.

Backend tính is_stale bằng thời điểm hiện tại trừ recorded_at đáng tin cậy lớn hơn 5 phút; nếu recorded_at null, is_stale là null. Khi is_stale là true, web/mobile gắn nhãn cũ dù các sensor_status là ok. Khi is_stale là null, ghi chưa xác định độ mới. UI hiển thị recorded_at là thời điểm đo chỉ khi có giá trị; nếu null, hiển thị received_at với nhãn thời điểm nhận.

Trường advice là null cho tới khi MThuy bàn giao quy tắc có nguồn và ca thử; nếu được bật, chỉ backend tính và trả cấu trúc có version, status, message. Không đặt ngưỡng riêng ở web/mobile. Các API chỉ đọc dùng cùng kiểu dữ liệu/đơn vị ở sensor-reading.md.

## Xác thực và Phân quyền (Auth)

Hệ thống hỗ trợ 2 vai trò: `admin` (quản trị hệ thống) và `user` (quản lý liên kết thiết bị của mình, đọc số đo/lịch sử).
- `POST /api/v1/auth/login`: Nhận `{ username, password }`, trả về HTTP 200 `{ status: "ok", token: "...", user: { id, username, full_name, role } }`. Mã lỗi 401 `invalid_credentials`.
- `GET /api/v1/auth/me`: Yêu cầu header `Authorization: Bearer <token>`, trả thông tin người dùng đang đăng nhập.

## Quản lý Quy tắc Chăm sóc Cây ớt (Care Rules)

- `GET /api/v1/rules`: Lấy danh sách quy tắc đang hoạt động (`is_active = true`). Web và mobile dùng để hiển thị các ngưỡng và lời khuyên chăm sóc cho người dùng.
- `POST /api/v1/rules`: Thêm quy tắc mới (Chỉ dành cho `admin`, yêu cầu `Authorization: Bearer <admin_token>`). Trả 201 Created. Nếu `user` gọi trả 403 `forbidden`.
- `PUT /api/v1/rules/{id}`: Cập nhật ngưỡng hoặc nội dung lời khuyên (Chỉ dành cho `admin`).
- `DELETE /api/v1/rules/{id}`: Xóa quy tắc (Chỉ dành cho `admin`).

## Môi trường thử

TDat công bố base URL trong README backend ở Phase 1; địa chỉ máy, cổng và thông tin truy cập thực tế là cấu hình môi trường, không hardcode vào hợp đồng. DKhoa/QThang dùng fixture trước khi backend chạy. Mọi thay đổi endpoint hoặc JSON sau G0 cần ví dụ trước/sau và review của các bên tiêu thụ.
