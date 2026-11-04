# Bàn giao và xác nhận mốc G0

**Ngày chuẩn bị:** 2026-11-04. **Chủ trì:** TKiet. **Trạng thái:** hồ sơ G0 v0.1 đã soạn; chưa có xác nhận của các chủ sở hữu hoặc số đo mạch thật. Không ghi G0 đạt cho tới khi các mục bên dưới được xác nhận.

## Tài liệu nguồn thống nhất

| Đầu ra | Chủ sở hữu | Người cần xác nhận | Trạng thái |
| --- | --- | --- | --- |
| ../architecture/mvp-scope.md: năm cảm biến, luồng dữ liệu, nơi xử lý quy tắc | TKiet | MThuy, TDat, DKhoa, QThang | Chờ xác nhận |
| ../hardware/pin-map.md và ../hardware/wiring_diagram.docx: nguồn, GPIO, linh kiện | TKiet | QTien, TVan | Chờ đối chiếu mạch |
| ../contracts/sensor-module.md: giao diện QTien → TVan | QTien + TVan | TKiet | Chờ xác nhận chữ ký/stub |
| ../contracts/sensor-reading.md: trường, đơn vị, trạng thái | TKiet điều phối | QTien, TVan, TDat, MThuy | Chờ xác nhận |
| ../contracts/api.md và ../contracts/fixtures/: ingest, truy vấn, mẫu JSON | TDat | TVan, DKhoa, QThang, MThuy, TKiet | Chờ xác nhận |
| test-matrix.md: ca thử, người kiểm tra | MThuy + TKiet | Cả nhóm | Chờ xác nhận |

## Phụ thuộc và việc giao ngay sau khi review

| Thành viên | Đầu ra Phase 1 cần bắt đầu | Đầu vào từ G0 |
| --- | --- | --- |
| TKiet | Kiểm kê linh kiện, xác nhận mạch/nguồn, đo điện áp, ảnh có nhãn, thử từng đường dây | pin-map.md, wiring_diagram.docx |
| QTien | Module đọc năm cảm biến; log và bảng hiệu chuẩn HD‑38/TDS/pH | pin map, sensor-module.md, sensor-reading.md |
| TVan | Chương trình ESP32, Wi‑Fi, đóng gói và gửi mẫu, stub khi chưa có cảm biến | sensor-module.md, sensor-reading.md, api.md |
| TDat | Backend, migration, API ingest/latest/history, chống trùng | sensor-reading.md, api.md, fixtures/ |
| DKhoa | Dashboard bằng response mẫu của năm cảm biến | api.md, fixtures/ |
| QThang | Ứng dụng mobile bằng cùng response mẫu | api.md, fixtures/ |
| MThuy | Quy tắc có nguồn cho năm đại lượng, phương pháp đối chiếu, ca thử | mvp-scope.md, sensor-reading.md, test-matrix.md |

## Điều kiện để TKiet đánh dấu G0 đạt

- [ ] TKiet xác nhận đúng model board, module, số lượng linh kiện và phiên bản phần cứng; ảnh hoặc biên bản kiểm kê được lưu.
- [ ] QTien và TVan xác nhận chân/nguồn và giao diện module; TVan gọi được stub năm cảm biến.
- [ ] TDat và TVan xác nhận payload, response ingest, thời gian và xử lý gửi lại.
- [ ] TDat và TVan công bố base URL môi trường thử và cách cấu hình truy cập cho ESP32; không lưu khóa thật trong repo.
- [ ] DKhoa và QThang xác nhận response latest/history đủ cho năm cảm biến và các trạng thái.
- [ ] QThang và TKiet chốt nền tảng mobile cùng thiết bị dùng để thử/demo.
- [ ] MThuy xác nhận bối cảnh đo pH/TDS, dữ liệu đầu vào quy tắc và kết quả mong đợi của fixture.
- [ ] MThuy ghi nguồn, phạm vi áp dụng và ca ranh giới cho mọi ngưỡng chăm sóc trước khi bật advice.
- [ ] Các điểm chưa đo ở pin-map.md có chủ sở hữu, lịch thử và trạng thái đang chặn; không trình bày là đã đạt.

Khi review, ghi ngày, người xác nhận, phiên bản tài liệu và bằng chứng vào PR/issue hoặc bổ sung ngay dưới mục tương ứng. Nếu sửa GPIO, nguồn, schema, API hay ngưỡng, nâng phiên bản và thông báo tất cả bên bị ảnh hưởng trước khi triển khai.
