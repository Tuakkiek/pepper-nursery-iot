# 04 — TDat: Biên bản Kiểm thử Tích hợp Đầu cuối (Phase 3)

* **Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT (`pepper-nursery-iot`)
* **Phụ trách Backend / API / CSDL:** TDat
* **Phối hợp tích hợp:**
  - **QTien:** Firmware ESP32, 5 cảm biến vật lý & ThingSpeak Cloud Channel `3543608`
  - **DKhoa:** Web Dashboard trên Cloud Render (`https://pepper-nursery-iot-em0t.onrender.com`)
  - **MThuy:** Quy tắc chăm sóc nông học & Ma trận ca kiểm thử
  - **TKiet:** Kiến trúc tổng thể và điều phối nghiệm thu
* **Hạ tầng triển khai:**
  - **Backend Cloud:** Node.js 20 / TypeScript / Express trên Render (`https://pepper-nursery-iot.onrender.com`)
  - **Cơ sở dữ liệu Cloud:** MySQL 8.4 trên Aiven Cloud (`mysql-13f5204a-dat123456789fa-807a.a.aivencloud.com:19808`, database: `defaultdb`)
  - **IoT Data Gateway:** ThingSpeak Cloud Channel ID `3543608` (Read Key: `EB9BC5UY233Z23O4`)
  - **Web Frontend:** React 19 + Vite trên Render (`https://pepper-nursery-iot-em0t.onrender.com`)

---

## 1. Mục tiêu Kiểm thử Tích hợp Đầu cuối (End-to-End Trace)

Xác minh tính thông suốt của toàn bộ chuỗi truyền dữ liệu từ vườn ươm đến người dùng cuối:
$$\text{Cảm biến vật lý} \xrightarrow{\text{GPIO}} \text{ESP32 (QTien)} \xrightarrow{\text{Wi-Fi}} \text{ThingSpeak} \xrightarrow{\text{Polling Worker (20s)}} \text{Backend TDat} \xrightarrow{\text{MySQL Aiven}} \text{API REST v1} \xrightarrow{\text{CORS / JSON}} \text{Web / Mobile}$$

**Các tiêu chí trọng yếu đã được xác thực:**
1. **Toàn vẹn số đo:** Giá trị 5 cảm biến không bị làm tròn sai lệch, giữ đúng đơn vị kỹ thuật (°C, %, ppm, pH, ADC thô).
2. **Không suy diễn sai:** Cảm biến chưa hiệu chuẩn giữ nguyên số thô ADC, tuyệt đối không gán giá trị quy đổi giả.
3. **Chống trùng lặp:** Dữ liệu đẩy lại từ ThingSpeak hoặc ESP32 với cùng `sample_id` được ghi nhận `duplicate: true`, không tạo dòng trùng trong CSDL.
4. **Nhận diện dữ liệu cũ:** Cờ `is_stale: true` tự động bật khi khoảng cách thời gian giữa thời điểm hiện tại và `recorded_at` vượt quá 5 phút.
5. **Động cơ nông học:** Lời khuyên chăm sóc sinh học (`advice`) được Backend tính toán tự động dựa trên quy tắc nông học 5 phân vùng của MThuy (`docs/agronomy/quy-tac-cham-soc-v0.1.md`).
6. **Bảo mật và phân quyền:** Xác thực JWT cho 2 vai trò `admin` và `user`, chặn quyền chỉnh sửa quy tắc đối với người dùng thông thường.

---

## 2. Bảng Đối soát Luồng Dữ liệu Thực tế (Data Flow Trace)

| Thông số quan trắc | Phần cứng & Chân GPIO (QTien) | ThingSpeak Field | Ánh xạ Backend TDat | Hiển thị Web Dashboard (DKhoa) | Đánh giá |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **Nhiệt độ không khí** | DHT22 (Chân D27) | `field1` | `reading.air_temperature_c` (°C) | Thẻ `Nhiệt độ khí`: `XX.X °C` | **KHỚP 100%** |
| **Độ ẩm không khí** | DHT22 (Chân D27) | `field2` | `reading.air_humidity_pct` (%) | Thẻ `Độ ẩm khí`: `XX.X %` | **KHỚP 100%** |
| **Nhiệt độ đất / rễ** | DS18B20 (Chân D26) | `field3` | `reading.soil_temperature_c` (°C) | Thẻ `Nhiệt độ đất`: `XX.X °C` | **KHỚP 100%** |
| **Độ ẩm đất (ADC thô)** | HD-38 (Chân D34) | `field4` | `reading.soil_moisture_raw` | Hiển thị `ADC thô: XXXX` | **KHỚP 100%** |
| **Độ ẩm đất quy đổi** | HD-38 (Hiệu chuẩn) | `field5` | `reading.soil_moisture_pct` (%) | Thẻ `Độ ẩm đất`: `XX.X %` | **KHỚP 100%** |
| **TDS nước tưới** | TDS Meter (Chân D32) | `field6` | `reading.water_tds_ppm` (ppm) | Thẻ `TDS nước tưới`: `XXX ppm` | **KHỚP 100%** |
| **Độ pH nước tưới** | PH-4502C (Chân D35) | `field7` | `reading.water_ph` (pH) | Thẻ `Độ pH nước tưới`: `X.X pH` | **KHỚP 100%** |
| **Trạng thái cảm biến** | Firmware ESP32 | `field8` | `sensor_status` (`dht22`, `hd38`, `ds18b20`, `tds`, `ph4502c`) | Huy hiệu trạng thái: `Tốt` / `Lỗi` / `Chưa hiệu chuẩn` | **KHỚP 100%** |

---

## 3. Nhật ký Kiểm thử Tích hợp Endpoints API (17/17 Ca Đạt 100%)

Kết quả thực thi tự động từ bộ kiểm thử tích hợp `npm test` (`backend/test/api.test.ts`):

```
> pepper-nursery-backend@0.1.0 test
> tsx test/api.test.ts

--- Starting API Integration Tests ---
Seeding database with G0 v0.1 fixtures...
Running database migrations...
Migrations completed successfully.
Seeding finished successfully.
Test server running on port 8089
✓ Health check passed
✓ GET latest reading passed
✓ GET empty device latest passed (latest-empty.json match)
✓ GET non-existent device returns 404 passed
✓ GET history readings with limit passed
✓ POST new reading (201 Created) passed
✓ POST duplicate identical reading (200 Duplicate) passed
✓ POST conflict reading (409 Conflict) passed
✓ POST invalid reading (400 Bad Request) passed
✓ GET ThingSpeak sync status passed
✓ Rule Engine advice evaluation (enabled & disabled modes) passed
✓ POST /auth/login as Admin passed
✓ POST /auth/login as User passed
✓ GET /auth/me passed
✓ GET /rules (list care rules) passed
✓ User cannot create care rule (403 Forbidden) passed
✓ Admin CRUD care rules (Create, Update, Delete) passed
=======================================
 ALL 17 INTEGRATION TESTS PASSED 100%! 
=======================================
```

### Chi tiết các ca kiểm thử tích hợp liên hệ thống:

| STT | Endpoint | Phương thức | Dữ liệu đầu vào / Kịch bản | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: |
| **1** | `/api/v1/health` | `GET` | Không tham số | HTTP 200, `status: "ok"` | Trả về 200, xác nhận kết nối MySQL Aiven hoạt động | **ĐẠT** |
| **2** | `/api/v1/devices/:id/readings/latest` | `GET` | Trạm chuẩn `esp32-nursery-01` | HTTP 200, đủ 5 cảm biến, `is_stale: false` | Trả về số đo mới nhất, đúng định dạng UTC ISO 8601 | **ĐẠT** |
| **3** | `/api/v1/devices/:id/readings/latest` | `GET` | Trạm rỗng `esp32-empty-01` | HTTP 200, `reading: null`, `is_stale: null` | Khớp fixture `latest-empty.json`, không suy diễn số 0 | **ĐẠT** |
| **4** | `/api/v1/devices/:id/readings/latest` | `GET` | Trạm không tồn tại | HTTP 404, `code: "device_not_found"` | Trả về đúng mã lỗi 404 chuẩn REST | **ĐẠT** |
| **5** | `/api/v1/devices/:id/readings?limit=20` | `GET` | Truy vấn 20 bản ghi lịch sử | HTTP 200, mảng bản ghi giảm dần theo thời gian | Trả về mảng lịch sử phục vụ vẽ đồ thị Web | **ĐẠT** |
| **6** | `/api/v1/readings` | `POST` | Bản ghi mẫu mới hợp lệ | HTTP 201 Created, `duplicate: false` | Lưu thành công vào bảng `readings` | **ĐẠT** |
| **7** | `/api/v1/readings` | `POST` | Gửi lại cùng `sample_id` & nội dung | HTTP 200 OK, `duplicate: true`, giữ `received_at` gốc | Chống trùng lặp thành công, không tạo bản ghi rác | **ĐẠT** |
| **8** | `/api/v1/readings` | `POST` | Cùng `sample_id` nhưng nội dung sai lệch | HTTP 409 Conflict, `code: "sample_conflict"` | Báo lỗi xung đột mẫu theo hợp đồng G0 | **ĐẠT** |
| **9** | `/api/v1/readings` | `POST` | Payload sai schema (`schema_version: "0.2"`) | HTTP 400 Bad Request, `code: "invalid_reading"` | Zod validation chặn và trả thông báo chi tiết | **ĐẠT** |
| **10**| `/api/v1/sync/thingspeak/status` | `GET` | Kiểm tra trạng thái ThingSpeak | HTTP 200, Channel ID 3543608, `isRunning: true` | Worker đang chạy tự động mỗi 20s | **ĐẠT** |
| **11**| Động cơ sinh `advice` | Nội bộ | Kích hoạt khi có số đo và không bị stale | Trả về `{ version, status, code, message, suggested_action }` | Khớp tài liệu nông học của MThuy | **ĐẠT** |
| **12**| `/api/v1/auth/login` | `POST` | Đăng nhập tài khoản `admin` / `admin123` | HTTP 200, cấp JWT token với role `admin` | Thành công, token hợp lệ 24h | **ĐẠT** |
| **13**| `/api/v1/auth/login` | `POST` | Đăng nhập tài khoản `user` / `user123` | HTTP 200, cấp JWT token với role `user` | Thành công, token hợp lệ 24h | **ĐẠT** |
| **14**| `/api/v1/auth/me` | `GET` | Kèm `Authorization: Bearer <token>` | HTTP 200, thông tin tài khoản | Xác thực thông tin Quản trị viên thành công | **ĐẠT** |
| **15**| `/api/v1/rules` | `GET` | Lấy danh sách quy tắc chăm sóc | HTTP 200, danh sách quy tắc đang active | Trả về đủ các quy tắc chuẩn cho Web Admin | **ĐẠT** |
| **16**| `/api/v1/rules` | `POST` | Người dùng role `user` tạo quy tắc | HTTP 403 Forbidden, `code: "forbidden"` | Phân quyền bảo mật hoạt động chính xác | **ĐẠT** |
| **17**| `/api/v1/rules` (CRUD) | `POST`/`PUT`/`DELETE` | Quản trị viên `admin` thêm, sửa, xóa quy tắc | HTTP 201 Created -> HTTP 200 Updated -> HTTP 200 Deleted | Toàn bộ vòng đời quy tắc hoạt động hoàn hảo | **ĐẠT** |

---

## 4. Biên bản Xác nhận Liên thành viên

1. **QTien (Firmware / ESP32 / ThingSpeak):**
   - Xác nhận ThingSpeak Channel `3543608` đã kết nối ổn định với Backend TDat.
   - Các trường dữ liệu từ 5 cảm biến vật lý được Backend bóc tách chính xác, không bị thất thoát mẫu.
2. **DKhoa (Web Dashboard):**
   - Xác nhận Web Dashboard trên Render (`https://pepper-nursery-iot-em0t.onrender.com`) kết nối trực tiếp mượt mà tới Backend TDat.
   - CORS được xử lý trọn vẹn, không xảy ra lỗi chặn cross-origin.
   - Giao diện Admin Console đã tích hợp hoàn chỉnh tính năng đăng nhập và quản lý quy tắc chăm sóc.
3. **MThuy (Nông học & QA):**
   - Xác nhận bộ quy tắc 5 phân vùng sinh học cho ớt con được Backend tính toán nhất quán, câu chữ khuyến nghị hành động khớp chính xác tài liệu `docs/agronomy/quy-tac-cham-soc-v0.1.md`.
4. **TKiet (Trưởng nhóm & Tích hợp):**
   - Nghiệm thu chính thức Phase 3: Hệ thống đạt độ hoàn thiện cao, dữ liệu thông suốt đầu cuối, sẵn sàng cho giai đoạn kiểm thử độ bền (Phase 4) và đóng gói bàn giao (Phase 5).
