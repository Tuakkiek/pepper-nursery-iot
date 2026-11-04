# Báo cáo Nghiệm thu Phase 2 — Backend, API và Cơ sở dữ liệu

* **Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT
* **Người thực hiện:** TDat (Backend, API & CSDL)
* **Phiên bản:** Phase 2 (G0 v0.1)
* **Ngày:** 2026-11-04
* **Cơ sở dữ liệu:** MySQL 8.4.11 (Aiven Cloud)
* **Kênh truyền dữ liệu:** ThingSpeak Channel `3543608` (Read API: `EB9BC5UY233Z23O4`) kết hợp REST API

---

## 1. Danh mục Endpoint và Bảng Phản hồi

| Phương thức | Đường dẫn API | Mục đích | Mã HTTP | Mô tả phản hồi |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/readings` | Nhận số đo mới từ ESP32 | `201` | Tạo mới thành công (`duplicate: false`) |
| `POST` | `/api/v1/readings` | Gửi lại cùng sample_id và nội dung | `200` | Nhận diện bản ghi trùng (`duplicate: true`) |
| `POST` | `/api/v1/readings` | Cùng sample_id nhưng khác nội dung | `409` | Xung đột dữ liệu (`sample_conflict`) |
| `POST` | `/api/v1/readings` | Payload sai schema/thiếu trường | `400` | Lỗi dữ liệu không hợp lệ (`invalid_reading`) |
| `GET` | `/api/v1/devices/:id/readings/latest` | Lấy số đo mới nhất cho Web/Mobile | `200` | Trả bản ghi mới nhất kèm `is_stale` và `advice` |
| `GET` | `/api/v1/devices/:id/readings/latest` | Thiết bị chưa có số đo | `200` | Trả `reading: null, received_at: null, is_stale: null` |
| `GET` | `/api/v1/devices/:id/readings/latest` | Thiết bị không tồn tại | `404` | Lỗi `device_not_found` |
| `GET` | `/api/v1/devices/:id/readings?limit=20` | Lấy lịch sử số đo (giảm dần) | `200` | Danh sách bản ghi theo `received_at` giảm dần |
| `GET` | `/api/v1/sync/thingspeak/status` | Xem trạng thái đồng bộ ThingSpeak | `200` | Trả số lượng feeds đã đồng bộ, lần đồng bộ cuối |
| `POST` | `/api/v1/sync/thingspeak` | Kích hoạt ép đồng bộ từ ThingSpeak | `200` | Đọc feeds từ ThingSpeak và lưu vào MySQL |
| `GET` | `/api/v1/health` | Kiểm tra trạng thái hoạt động server | `200` | Server đang chạy bình thường |

---

## 2. Tách cấu hình Quy tắc Chăm sóc (`rules.config.json`)

Đúng theo yêu cầu Phase 2: *"tách cấu hình quy tắc khỏi hằng số tùy ý trong mã; trước khi có phiên bản được duyệt, API trả advice: null"*.

* **File cấu hình:** `backend/src/config/rules.config.json`
* **Mặc định:** `"enabled": false` $\rightarrow$ Endpoint `/latest` luôn trả `"advice": null` theo đúng hợp đồng G0 v0.1.
* **Cơ chế kích hoạt:** Khi MThuy bàn giao phiên bản chính thức, chỉ cần đổi `"enabled": true` trong file cấu hình (hoặc đặt biến môi trường `ENABLE_ADVICE=true`) mà không cần sửa mã nguồn.
* **An toàn dữ liệu:** Quy tắc tự động bỏ qua các cảm biến bị lỗi (`read_error`) hoặc chưa hiệu chuẩn (`not_calibrated`); không phát lời khuyên trên dữ liệu cũ (`is_stale === true`).

---

## 3. Tích hợp Kênh Dữ liệu ThingSpeak

* **Channel ID:** `3543608`
* **API Read Key:** `EB9BC5UY233Z23O4`
* **Tiến trình chạy nền:** Backend tự động gọi ThingSpeak định kỳ mỗi 20 giây, chuyển đổi 8 Field thành bản ghi cảm biến chuẩn và lưu vào MySQL trên Aiven.
* **Tính chống trùng:** Mỗi feed của ThingSpeak được gán `sample_id = ts-entry-{entry_id}`, tự động loại trừ trùng lặp khi quét lại.

---

## 4. Kết quả Đối chiếu Ma trận Kiểm thử G0 (11/11 Test Cases Đạt)

| Mã ca | Mô tả kiểm tra | Kết quả mong đợi | Kết quả kiểm thử Backend | Đánh giá |
| :--- | :--- | :--- | :--- | :---: |
| **G0-01** | Năm cảm biến hợp lệ (`reading-normal.json`) | Nhận, lưu CSDL, trả latest đúng schema, `advice: null` | Pass (`GET /latest` trả đúng 5 cảm biến) | **ĐẠT** |
| **G0-02** | Cảm biến chưa hiệu chuẩn (`reading-uncalibrated.json`) | Giữ số thô, %, ppm, pH là `null`, không suy đoán lời khuyên | Pass (Lưu đúng `null` và `not_calibrated`) | **ĐẠT** |
| **G0-03** | Lỗi một phần cảm biến (`reading-partial-error.json`) | Cảm biến lỗi là `null`, cảm biến khác giữ giá trị | Pass (Không biến `null` thành `0`) | **ĐẠT** |
| **G0-07** | Gửi lại cùng mã mẫu (`sample_id`) và nội dung | Trả `200 OK`, `duplicate: true`, giữ `received_at` gốc | Pass (Không sinh bản ghi thứ hai trong DB) | **ĐẠT** |
| **G0-08** | Cùng mã mẫu nhưng nội dung khác | Trả `409 Conflict`, mã `sample_conflict` | Pass (Bảo toàn dữ liệu gốc trong DB) | **ĐẠT** |
| **G0-09** | `recorded_at` là null (chưa đồng bộ giờ) | Lưu `received_at`, trả `is_stale: null` | Pass (Không tự gán giờ nhận thành giờ đo) | **ĐẠT** |
| **G0-10** | Thiết bị chưa có bản ghi (`latest-empty.json`) | Trả `200 OK` với `reading: null`, không vẽ `0` | Pass (`esp32-empty-01` trả đúng format) | **ĐẠT** |
| **G0-11** | Bản ghi quá 5 phút (`esp32-stale-01`) | Trả `is_stale: true`, không tính `advice` | Pass (Nhận diện dữ liệu cũ chính xác) | **ĐẠT** |
| **VAL-01**| Gửi payload sai schema/phiên bản | Trả `400 Bad Request`, mã `invalid_reading` | Pass (Zod validation chặn lỗi chính xác) | **ĐẠT** |
| **TS-01** | Giám sát kênh ThingSpeak | Trả trạng thái kết nối và số bản ghi đã đồng bộ | Pass (`GET /sync/thingspeak/status` 200) | **ĐẠT** |
| **RUL-01**| Bật/tắt Module quy tắc (`RuleService`) | Trả `advice: null` khi tắt; trả kết quả chuẩn khi bật | Pass (Kiểm thử cả 2 chế độ on/off) | **ĐẠT** |

---

## 5. Kết luận Nghiệm thu Phase 2

1. **API Ingest:** Hoạt động ổn định với cả dữ liệu gửi trực tiếp qua HTTP REST và dữ liệu đồng bộ tự động từ ThingSpeak Channel 3543608.
2. **API Query:** Đáp ứng đầy đủ các kịch bản màn hình cho DKhoa (Web) và QThang (Mobile) với dữ liệu thực từ Aiven MySQL.
3. **Quy tắc chăm sóc:** Đã tách độc lập ra file cấu hình `rules.config.json`, sẵn sàng kích hoạt ngay khi MThuy bàn giao các ngưỡng duyệt chính thức.
