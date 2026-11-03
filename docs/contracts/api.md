# API số đo cho MVP năm cảm biến

**Phiên bản đề xuất:** 0.1; đường dẫn bắt đầu bằng /api/v1. TDat sở hữu hiện thực và xác nhận hợp đồng cùng TVan, DKhoa, QThang, MThuy, TKiet. Fixture trong fixtures/ là dữ liệu mô phỏng. API chưa yêu cầu token trong fixture; trước khi triển khai qua mạng ngoài phòng thử, TDat và TVan chốt cách cấu hình khóa, không đưa bí mật vào repo.

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

## Môi trường thử

TDat công bố base URL trong README backend ở Phase 1; địa chỉ máy, cổng và thông tin truy cập thực tế là cấu hình môi trường, không hardcode vào hợp đồng. DKhoa/QThang dùng fixture trước khi backend chạy. Mọi thay đổi endpoint hoặc JSON sau G0 cần ví dụ trước/sau và review của các bên tiêu thụ.
