# Phạm vi MVP và kiến trúc G0

**Phiên bản đề xuất:** G0 v0.1, ngày 2026-11-04. **Chủ trì:** TKiet. Đây là bộ thông số để các nhóm bắt đầu độc lập; trạng thái xác nhận nằm trong ../integration/g0-handoff.md.

## Mục tiêu và ranh giới

Một ESP32 DevKit V1 30 chân đọc năm cảm biến theo ../hardware/wiring_diagram.docx, gửi bản ghi qua Wi‑Fi tới backend; backend lưu và cung cấp số đo mới nhất, lịch sử cho web/mobile. MThuy xác định nội dung quy tắc chăm sóc; nếu có tính kết quả tự động, backend là nơi tính duy nhất và web/mobile chỉ hiển thị kết quả. Chưa đưa ngưỡng chăm sóc vào mã khi MThuy chưa cung cấp căn cứ và ca thử.

| Cảm biến | Đại lượng trong MVP | Bối cảnh đo |
| --- | --- | --- |
| DHT22 | Nhiệt độ và độ ẩm không khí | Không khí vườn ươm |
| HD‑38 | Số đọc thô, độ ẩm đất % sau hiệu chuẩn | Giá thể/đất |
| DS18B20 | Nhiệt độ đất | Giá thể/đất |
| TDS Meter V1.0 | Số đọc analog, TDS ppm sau hiệu chuẩn | Mẫu nước/dung dịch; MThuy xác nhận vị trí lấy mẫu |
| pH PH‑4502C | Số đọc analog, pH sau hiệu chuẩn | Mẫu nước/dung dịch; MThuy xác nhận vị trí lấy mẫu |

Giá trị chưa hiệu chuẩn vẫn có thể gửi số đọc thô kèm trạng thái; không gán đơn vị %, ppm hoặc pH cho số thô. MVP không điều khiển tưới, bơm hay pha dung dịch tự động.

## Luồng và trách nhiệm

    DHT22 ───────────┐
    HD‑38 ───────────┤
    DS18B20 ─────────┼─> ESP32 (QTien đọc, TVan gửi) ─> API/CSDL (TDat) ─> Web (DKhoa)
    TDS Meter V1.0 ──┤                                           └──────────> Mobile (QThang)
    PH‑4502C ────────┘                 MThuy: quy tắc, fixture và kiểm thử; TKiet: phần cứng/tích hợp

1. TKiet chốt mạch, pin map, nguồn, ảnh mạch và mã thiết bị.
2. QTien đọc năm cảm biến, trả giá trị cùng trạng thái riêng từng cảm biến theo hợp đồng module.
3. TVan lập mã mẫu, thời điểm đo nếu đồng hồ tin cậy, đóng gói JSON và gửi API; giữ nguyên mã mẫu khi thử lại.
4. TDat kiểm tra, chống trùng, lưu thời điểm server nhận và cung cấp API mới nhất/lịch sử. Chỉ backend tính quy tắc được MThuy duyệt.
5. DKhoa và QThang dùng cùng response mẫu để hiển thị giá trị, đơn vị, thời gian, trạng thái lỗi/chưa hiệu chuẩn/dữ liệu cũ.
6. MThuy cung cấp quy tắc có nguồn, fixture và ca kiểm thử cho năm cảm biến; không suy ra lời khuyên từ số đo thiếu hoặc chưa hiệu chuẩn.

## Quyết định G0 cần dùng thống nhất

- Phiên bản dữ liệu là 0.1; trường và trạng thái ở ../contracts/sensor-reading.md là nguồn thống nhất. Thay đổi cần ví dụ trước/sau và review của bên bị ảnh hưởng.
- Hợp đồng giữa QTien và TVan ở ../contracts/sensor-module.md; API và fixture ở ../contracts/api.md và ../contracts/fixtures/.
- Mỗi lần lấy mẫu có một sample_id do ESP32 tạo, duy nhất trong device_id; gửi lại dùng cùng sample_id. Backend đặt ràng buộc duy nhất theo cặp này.
- Thời gian chuẩn trên API là UTC ISO 8601. recorded_at có thể null khi ESP32 chưa đồng bộ giờ; received_at do backend cấp và không được trình bày như thời điểm đo.
- Lấy mẫu mục tiêu mỗi 60 giây; backend đánh dấu dữ liệu cũ khi recorded_at đáng tin cậy và đã quá 5 phút. Nếu recorded_at null, độ mới là chưa xác định. Đây là thông số G0 v0.1 cần thử dưới mạng thực tế.
- Quy tắc chăm sóc được xử lý tại backend sau khi MThuy bàn giao ngưỡng và ca thử; ở thời điểm chưa có quy tắc được duyệt, API trả advice là null.

## Đầu ra và điều kiện chốt

G0 gồm pin map, kiến trúc, hợp đồng cảm biến/module/API, fixture và ma trận kiểm thử; ../integration/g0-handoff.md ghi người xác nhận. Hồ sơ này chưa chứng minh mạch đã được đo hay thành viên đã duyệt. Chỉ đánh dấu G0 đạt sau khi các xác nhận và kiểm tra an toàn phần cứng trong bảng bàn giao hoàn tất.
