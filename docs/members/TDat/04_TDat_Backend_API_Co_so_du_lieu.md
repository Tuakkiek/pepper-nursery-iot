# 04 — TDat: Backend, API và cơ sở dữ liệu

**Phạm vi dự án:** Backend nhận và phân phối dữ liệu 5 cảm biến theo `docs/contracts/sensor-reading.md` và `docs/contracts/api.md`. Hệ thống tiếp nhận dữ liệu từ trạm vườn ươm thông qua kênh **ThingSpeak Channel 3543608** (do QTien vận hành) kết hợp cổng **REST API Ingest dự phòng**. Backend là nơi duy nhất lưu trữ CSDL tập trung trên MySQL Aiven Cloud, tính toán quy tắc nông học chăm sóc cây ớt theo chuẩn của MThuy (`docs/agronomy/quy-tac-cham-soc-v0.1.md`), cung cấp xác thực JWT 2 vai trò (`admin`, `user`) và cung cấp API RESTful cho Web Dashboard (DKhoa) và Mobile App (QThang).

**Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT (`pepper-nursery-iot`)  
**Người phụ trách chính:** TDat  
**Trách nhiệm chính:** Xây dựng backend, API RESTful và cơ sở dữ liệu CSDL quan hệ MySQL để thu thập, kiểm tra, deduplicate, lưu trữ và cung cấp số đo, phân tích nông học cho web/mobile.  
**Phối hợp trực tiếp:** 
- **QTien:** Phụ trách toàn bộ phần cứng ESP32, đọc 5 cảm biến, hiệu chuẩn số đo, kết nối Wi-Fi và đẩy dữ liệu lên ThingSpeak Channel `3543608` (thay thế và hợp nhất vai trò của TVan từ đầu dự án).
- **DKhoa:** Sử dụng API cho Web Dashboard trên Render (`https://pepper-nursery-iot-em0t.onrender.com`), tích hợp phân quyền Quản trị viên và Quản lý quy tắc chăm sóc.
- **QThang:** Sử dụng API cho ứng dụng Mobile.
- **MThuy:** Cung cấp bộ quy tắc chăm sóc chuẩn nông học 5 phân vùng (`docs/agronomy/quy-tac-cham-soc-v0.1.md`) và ma trận ca kiểm thử.
- **TKiet:** Chốt kiến trúc tổng thể, tích hợp hệ thống và điều phối dự án.

---

## 1. Kết quả cần bàn giao

Một backend hoàn chỉnh viết bằng **TypeScript / Node.js (Express)** kết nối **MySQL 8.4 (Aiven Cloud)**:
1. **Thu thập dữ liệu đa kênh:**
   - **ThingSpeak Sync Worker:** Polling tự động mỗi 20 giây từ ThingSpeak Channel `3543608` (Read Key: `EB9BC5UY233Z23O4`), chuẩn hóa múi giờ UTC, ánh xạ 8 fields thành payload chuẩn và lưu trữ vào bảng `readings`.
   - **REST Ingest Endpoint:** `POST /api/v1/readings` hỗ trợ kiểm tra nghiêm ngặt bằng Zod schema, deduplication theo cặp `(device_id, sample_id)` và chống xung đột payload bằng hàm băm SHA-256 (`payload_hash`).
2. **Cung cấp API cho Web và Mobile:**
   - `GET /api/v1/health`: Trạng thái máy chủ và kết nối cơ sở dữ liệu.
   - `GET /api/v1/devices/:device_id/readings/latest`: Lấy số đo mới nhất kèm cờ `is_stale` (ngưỡng 5 phút) và lời khuyên chăm sóc sinh học `advice`.
   - `GET /api/v1/devices/:device_id/readings?limit=20`: Truy vấn lịch sử số đo phục vụ vẽ biểu đồ quan trắc.
   - `GET /api/v1/sync/thingspeak/status`: Giám sát trạng thái kênh ThingSpeak và worker polling.
   - `POST /api/v1/sync/thingspeak`: Kích hoạt đồng bộ thủ công tức thời.
3. **Bảo mật và Phân quyền (Auth JWT):**
   - Hỗ trợ 2 vai trò: `admin` (Quản trị viên) và `user` (Kỹ thuật viên vườn ươm).
   - `POST /api/v1/auth/login`: Xác thực tài khoản, cấp JWT token (thời hạn 24h).
   - `GET /api/v1/auth/me`: Kiểm tra thông tin người dùng đang đăng nhập.
4. **Hệ thống Quản lý Quy tắc Chăm sóc Cây ớt (Care Rules Engine):**
   - `GET /api/v1/rules`: Danh sách quy tắc đang hoạt động phục vụ hiển thị.
   - `POST /api/v1/rules`, `PUT /api/v1/rules/:id`, `DELETE /api/v1/rules/:id`: Phân quyền chỉ dành riêng cho `admin` để cấu hình động các ngưỡng và lời khuyên chăm sóc.
   - Đồng bộ cấu hình tĩnh `rules.config.json` theo tài liệu nông học được phê duyệt của MThuy.
5. **CORS và Đóng gói:**
   - Cấu hình whitelist CORS cho frontend Render của DKhoa (`https://pepper-nursery-iot-em0t.onrender.com`).
   - Đóng gói chuẩn Docker (`Dockerfile`, `.dockerignore`) và cấu hình triển khai Render Cloud (`render.yaml`).

### Ranh giới sở hữu công việc

| TDat trực tiếp làm | Chủ sở hữu phần liên quan |
| --- | --- |
| Thiết kế CSDL (MySQL Aiven), schema migration, khởi tạo dữ liệu mẫu seed, API REST v1, ThingSpeak polling worker, xác thực JWT, rule engine, Dockerfile, kiểm thử tích hợp 17/17 ca | **QTien**: Firmware ESP32, đọc và hiệu chuẩn 5 cảm biến, kết nối Wi-Fi, đẩy dữ liệu lên ThingSpeak Channel 3543608 *(hợp nhất toàn diện nhiệm vụ phần cứng & truyền dữ liệu từ đầu)* |
| API phục vụ web/mobile; chuẩn hóa UTC ISO 8601; thuật toán tính `is_stale` (5 phút); phân trang/lịch sử; tài liệu API hợp đồng | **DKhoa**: Giao diện Web Dashboard React, trang Admin Console, proxy server và deploy Render |
| Động cơ sinh lời khuyên chăm sóc sinh học (`advice`); cấu hình bảng `care_rules` và file `rules.config.json` | **MThuy**: Bộ quy tắc nông học 5 phân vùng cho ớt con, tài liệu `docs/agronomy/quy-tac-cham-soc-v0.1.md`, bộ dữ liệu CSV/JSON đối chiếu |
| Hỗ trợ tích hợp đầu cuối, CORS đa nguồn, tài liệu hướng dẫn triển khai | **TKiet**: Kiến trúc tổng thể, sơ đồ mạch, điều phối tích hợp hệ thống |

---

## 2. Các điểm nối kỹ thuật quan trọng

### 2.1. QTien (ESP32 / ThingSpeak) → TDat (Backend)
- QTien nạp mã nguồn `ESP32_CayOt/ESP32_CayOt.ino`, đo 5 cảm biến vật lý (DHT22, HD-38, DS18B20, TDS, PH-4502C) và gửi trực tiếp lên ThingSpeak Cloud Channel `3543608` mỗi 20 giây qua HTTP GET/POST với Write API Key: `QRABGSQJ1Z8A67RD`.
- ThingSpeak phân bổ 8 trường dữ liệu:
  * Field 1: `air_temperature_c` (DHT22)
  * Field 2: `air_humidity_pct` (DHT22)
  * Field 3: `soil_temperature_c` (DS18B20)
  * Field 4: `soil_moisture_raw` (HD-38 ADC)
  * Field 5: `soil_moisture_pct` (HD-38 %)
  * Field 6: `water_tds_ppm` (TDS Meter)
  * Field 7: `water_ph` (PH-4502C)
  * Field 8: Trạng thái cảm biến JSON hoặc mã hex
- Backend TDat triển khai `ThingSpeakService` tự động lấy các feed mới, tự động phát hiện `sample_id` (dựa trên `entry_id`), kiểm tra giá trị cảm biến, suy luận `sensor_status` (`ok`, `read_error`, `not_calibrated`) và lưu an toàn vào bảng `readings`.
- Luồng REST API trực tiếp `POST /api/v1/readings` vẫn hoạt động song song để tiếp nhận dữ liệu mô phỏng hoặc khi trạm ESP32 gửi trực tiếp mà không qua ThingSpeak.

### 2.2. TDat (Backend) → DKhoa (Web) & QThang (Mobile)
- Toàn bộ thời gian được chuẩn hóa ở định dạng **UTC ISO 8601** (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- Phản hồi `GET /api/v1/devices/:device_id/readings/latest` trả về đầy đủ:
  * `device_id`: Mã định danh trạm đo (ví dụ: `esp32-nursery-01`).
  * `reading`: Đối tượng chứa giá trị 5 cảm biến, trạng thái `sensor_status`, thời điểm đo `recorded_at`.
  * `received_at`: Thời điểm server tiếp nhận bản ghi.
  * `is_stale`: Cờ cảnh báo dữ liệu cũ (`true` nếu `now - recorded_at > 5 phút`, `false` nếu dữ liệu mới, `null` nếu không có thời điểm đo).
  * `advice`: Đối tượng lời khuyên chăm sóc sinh học chuẩn theo định dạng phê duyệt của MThuy.
- Trả mã lỗi chuẩn HTTP:
  * `400`: `invalid_reading` (sai schema hoặc sai định dạng).
  * `401`: `invalid_credentials` / `unauthorized` (chưa đăng nhập hoặc token không hợp lệ).
  * `403`: `forbidden` (người dùng `user` cố gắng thực hiện quyền của `admin`).
  * `404`: `device_not_found` / `rule_not_found`.
  * `409`: `sample_conflict` (trùng `sample_id` nhưng dữ liệu khác biệt).
  * `500`: `server_error`.

---

## 3. Tiến độ thực hiện theo từng Phase

### Phase 0 — Chốt hợp đồng dữ liệu và API (G0) ✅ ĐÃ HOÀN THÀNH
- Hoàn thiện tài liệu hợp đồng `docs/contracts/api.md` và `docs/contracts/sensor-reading.md`.
- Xây dựng bộ fixture chuẩn gồm 12 kịch bản tại `docs/contracts/fixtures/` (`reading-normal`, `uncalibrated`, `partial-error`, `stale`, `empty`, `ingest-created`, `ingest-duplicate`, `conflict`, `server-error`).
- Thống nhất cơ chế deduplication theo cặp `(device_id, sample_id)` kết hợp `payload_hash` SHA-256.

### Phase 1 — Khởi tạo Backend, Cơ sở dữ liệu và Fixtures ✅ ĐÃ HOÀN THÀNH
- Thiết lập cấu trúc dự án Node.js / Express / TypeScript tại thư mục `backend/`.
- Kết nối CSDL MySQL 8.4 Aiven Cloud (`mysql-13f5204a-dat123456789fa-807a.a.aivencloud.com:19808`, database `defaultdb`).
- Viết migration tạo 4 bảng: `devices`, `readings`, `users`, `care_rules`.
- Viết script `src/scripts/seed.ts` nạp fixtures ban đầu, tài khoản quản trị `admin`/`admin123`, `user`/`user123` và các trạm đo mẫu.

### Phase 2 — Triển khai API, ThingSpeak Sync, Auth & Care Rules ✅ ĐÃ HOÀN THÀNH
- Triển khai toàn bộ endpoints API v1 theo đúng hợp đồng REST.
- Triển khai `ThingSpeakService` polling định kỳ 20 giây từ Channel `3543608`.
- Triển khai hệ thống xác thực JWT (`POST /api/v1/auth/login`, `GET /api/v1/auth/me`).
- Triển khai CRUD Care Rules API (`/api/v1/rules`) cho phép `admin` thêm, sửa, xóa quy tắc chăm sóc ớt con.
- Cấu hình whitelist CORS cho Render Web của DKhoa (`https://pepper-nursery-iot-em0t.onrender.com`).
- Viết bộ kiểm thử tự động `test/api.test.ts` đạt kết quả **17/17 ca kiểm thử thành công 100%**.
- Xuất bản báo cáo kiểm thử Phase 2: `docs/members/TDat/04_TDat_Phase2_Bao_cao_Kiem_thu_Backend.md`.

### Phase 3 — Tích hợp hệ thống đầu cuối ✅ ĐÃ HOÀN THÀNH
- Tích hợp luồng dữ liệu trực tiếp: Trạm vật lý ESP32 (QTien) $\rightarrow$ ThingSpeak Cloud $\rightarrow$ Backend Worker TDat $\rightarrow$ MySQL Aiven Cloud $\rightarrow$ Web Dashboard DKhoa.
- Xác nhận đồng bộ dữ liệu thời gian thực giữa cảm biến thật và giao diện người dùng.
- Xuất bản Biên bản kiểm thử tích hợp đầu cuối: `docs/members/TDat/04_TDat_Phase3_Bien_ban_Tich_hop_Dau_cuoi.md`.

### Phase 4 — Kiểm thử độ ổn định và xử lý ngoại lệ ✅ ĐÃ HOÀN THÀNH
- Kiểm tra tính chịu lỗi khi trạm ESP32 mất Wi-Fi, tự phục hồi sau khi có lại mạng.
- Xác minh cơ chế gán nhãn dữ liệu cũ `is_stale: true` sau 5 phút không có mẫu mới.
- Kiểm tra chống trùng lặp dữ liệu `duplicate: true` khi ThingSpeak trả về các feed cũ đã lưu.
- Xuất bản Báo cáo độ ổn định hệ thống: `docs/members/TDat/04_TDat_Phase4_Bao_cao_Do_on_dinh_He_thong.md`.

### Phase 5 — Đóng gói, Triển khai Cloud và Bàn giao ✅ ĐÃ HOÀN THÀNH
- Hoàn thiện `Dockerfile` multi-stage build tối ưu cho Node.js production.
- Thiết lập tệp cấu hình triển khai `render.yaml` và kịch bản khởi chạy tự động.
- Cập nhật tài liệu hướng dẫn triển khai, vận hành và khôi phục CSDL tại `backend/README.md`.
- Bàn giao đầy đủ tài liệu kỹ thuật cho TKiet và các thành viên trong nhóm.

---

## 4. Checklist bàn giao kỹ thuật

- [x] **QTien** có endpoint tiếp nhận trực tiếp `POST /api/v1/readings` và thông số kênh ThingSpeak Channel `3543608` đã được kết nối tự động.
- [x] **DKhoa / QThang** có đầy đủ API đọc số đo mới nhất, lịch sử phân trang, trạng thái cảm biến, cờ `is_stale` và lời khuyên chăm sóc sinh học `advice`.
- [x] **DKhoa** được hỗ trợ CORS đầy đủ tại địa chỉ `https://pepper-nursery-iot-em0t.onrender.com`, có hệ thống Auth JWT đăng nhập và API CRUD Care Rules cho Admin Console.
- [x] **MThuy** có hệ thống đánh giá quy tắc nông học chuẩn 5 phân vùng được cấu hình chính xác trong `rules.config.json` và bảng CSDL `care_rules`.
- [x] **TKiet** có kiến trúc CSDL quan hệ trên Aiven Cloud, cơ chế deduplication an toàn, Dockerfile và kịch bản deploy Render sẵn sàng cho báo cáo đồ án.
- [x] CSDL lưu trữ chính xác các trường `null` khi cảm biến lỗi/chưa hiệu chuẩn, tuyệt đối không biến `null` thành số `0`.
- [x] Đạt 17/17 ca kiểm thử tự động, build TypeScript không có lỗi.
