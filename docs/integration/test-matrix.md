# Ma trận kiểm thử G0 cho năm cảm biến

**Phiên bản đề xuất:** 0.1. Fixture trong ../contracts/fixtures/ là dữ liệu mô phỏng; kết quả trên mạch thật phải ghi riêng ở Phase 1–4. MThuy giữ ca thử và kết quả mong đợi; TKiet điều phối kiểm thử đầu cuối.

| ID | Tình huống và đầu vào | Kết quả mong đợi | Người kiểm tra |
| --- | --- | --- | --- |
| G0-01 | Cả năm cảm biến hợp lệ, reading-normal.json | TVan gửi một mẫu; TDat lưu; web/mobile hiện đủ đơn vị và thời điểm; advice null nếu chưa có quy tắc | QTien, TVan, TDat, DKhoa, QThang, MThuy |
| G0-02 | HD‑38, TDS, pH có raw nhưng chưa hiệu chuẩn; reading-uncalibrated.json | Ba giá trị %, ppm, pH là null; giao diện ghi chưa hiệu chuẩn, không suy ra lời khuyên từ chúng | QTien, TVan, TDat, DKhoa, QThang, MThuy |
| G0-03 | DHT22 và TDS lỗi; reading-partial-error.json, latest-partial-error.json | Trường lỗi là null, DS18B20 vẫn hợp lệ; không biến null thành 0 | QTien, TVan, TDat, DKhoa, QThang |
| G0-04 | Cảm biến DS18B20 bị ngắt | Chỉ soil_temperature_c là null, trạng thái ds18b20 read_error; các cảm biến khác giữ kết quả riêng | QTien, TVan, MThuy |
| G0-05 | Po pH trước bộ chia áp cao, hoặc điện áp tại D35–S chưa đo | Không nối GPIO35/chạy đo thật cho tới khi TKiet xác nhận điện áp an toàn | TKiet, QTien |
| G0-06 | TDS Meter V1.0 chưa xác nhận biến thể nguồn/tín hiệu | Không coi water_tds_ppm là hợp lệ; TKiet/QTien ghi bằng chứng nguồn và điện áp | TKiet, QTien |
| G0-07 | Gửi lại cùng device_id + sample_id + nội dung | API trả 200 duplicate true, không tạo bản ghi thứ hai | TVan, TDat |
| G0-08 | Gửi cùng khóa mẫu nhưng nội dung khác | API trả 409 sample_conflict, giữ bản ghi ban đầu | TVan, TDat |
| G0-09 | ESP32 chưa đồng bộ giờ, recorded_at null | Backend lưu received_at, is_stale null; giao diện ghi thời điểm nhận và chưa xác định độ mới | TVan, TDat, DKhoa, QThang |
| G0-10 | Không có bản ghi; latest-empty.json | Giao diện ghi chưa có dữ liệu, không hiện 0 hoặc cảnh báo cảm biến giả | TDat, DKhoa, QThang |
| G0-11 | recorded_at của bản ghi mới nhất quá 5 phút, kể cả vừa gửi bù; latest-stale.json | is_stale true; web/mobile ghi dữ liệu cũ, không dùng làm kết luận chăm sóc | TDat, DKhoa, QThang, MThuy |
| G0-12 | Mất Wi‑Fi hoặc backend 5xx rồi kết nối lại | TVan giữ sample_id để thử lại; không báo gửi thành công trước 201/200 khớp khóa | TVan, TDat, TKiet |
| G0-13 | Một mẫu thật đi từ mạch → ESP32 → backend → web/mobile | Đối chiếu cùng device_id/sample_id, giá trị, đơn vị, trạng thái; lưu log/ảnh từng chặng | TKiet và cả nhóm |

G0-01 đến G0-03, G0-09 đến G0-11 có thể chạy bằng fixture trước. G0-05/06 cần đo an toàn phần cứng ở Phase 1. G0-13 là cổng Phase 3, không đánh dấu đạt tại G0.
