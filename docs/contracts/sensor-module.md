# Điểm nối module cảm biến với chương trình ESP32

**Phiên bản đề xuất:** 0.1. QTien sở hữu phần đọc và hiệu chuẩn trong firmware/sensors/; TVan sở hữu lịch lấy mẫu, thời gian, mã mẫu, Wi‑Fi và JSON. Hai người xác nhận chữ ký thực tế trước khi viết mã tích hợp.

## Giao diện bắt buộc

Module cung cấp thao tác khởi tạo một lần và thao tác lấy một snapshot gồm năm cảm biến. Tên giao diện đề xuất: sensorsBegin() và sensorsRead() trả về SensorSnapshot. SensorSnapshot có đúng các trường giá trị và năm trạng thái ở sensor-reading.md, nhưng không chứa schema_version, device_id, sample_id hoặc recorded_at. Các trường chưa có giá trị dùng cờ hiện diện/kiểu optional, không dùng 0 làm dấu lỗi.

| Trách nhiệm QTien | Trách nhiệm TVan |
| --- | --- |
| Cấu hình GPIO theo ../hardware/pin-map.md; đọc DHT22, HD‑38, DS18B20, TDS, PH‑4502C | Gọi khởi tạo và lấy mẫu; tạo device_id, sample_id, recorded_at |
| Kiểm tra lỗi/ngoài phạm vi, trả trạng thái riêng; không tái sử dụng mẫu cũ như mẫu mới | Chuyển snapshot sang JSON theo sensor-reading.md; gửi API và thử lại cùng sample_id |
| Lưu phiên bản hiệu chuẩn HD‑38/TDS/pH và chỉ trả giá trị quy đổi khi đã kiểm chứng | Không tự quy đổi raw sang %, ppm, pH hoặc sửa trạng thái |

Một lần đọc có thể chỉ thành công một phần. Lỗi/cảm biến chưa hiệu chuẩn không chặn các cảm biến còn lại. QTien phải có cơ chế timeout cho từng cảm biến và ghi thời gian đo được trong Phase 1; thao tác đọc không được chờ vô hạn. TVan chỉ phát một sample_id sau khi kết thúc snapshot, không tạo lại mã khi gửi lại.

## Ca stub để xác nhận điểm nối

QTien cung cấp stub trả một snapshot đủ năm trạng thái: bình thường, HD‑38/TDS/pH chưa hiệu chuẩn, DHT22 lỗi và DS18B20 lỗi. TVan phải gọi được cùng giao diện mà không sửa mã đọc. Bảng giá trị và trạng thái trong sensor-reading.md là chuẩn cho stub. Sau khi cả hai xác nhận chữ ký/kiểu dữ liệu, ghi phiên bản vào g0-handoff.md.
