# Pepper Nursery IoT Backend (G0 v0.1)

Hệ thống Backend, API và Cơ sở dữ liệu phục vụ dự án **MVP chăm sóc vườn ươm ớt con bằng IoT**.

* **Người phụ trách:** TDat (Backend, API & CSDL)
* **Phiên bản Hợp đồng:** `G0 v0.1` (Bám sát theo `docs/contracts/api.md` và `docs/contracts/sensor-reading.md`)
* **Công nghệ:** Node.js (TypeScript) + Express + Zod + MySQL 8.4 (Aiven Cloud)

---

## 1. Yêu cầu môi trường

* **Node.js:** phiên bản >= 18 (khuyến nghị Node.js LTS hoặc v20+)
* **npm:** phiên bản >= 9
* Kết nối Internet (để backend kết nối đến cơ sở dữ liệu MySQL trên Aiven)

---

## 2. Cài đặt và Khởi tạo CSDL

### Bước 1: Cài đặt dependencies
```bash
cd backend
npm install
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` dựa trên file mẫu `.env.example`:
```env
PORT=8000
HOST=0.0.0.0

DB_HOST=mysql-13f5204a-dat123456789fa-807a.a.aivencloud.com
DB_PORT=19808
DB_USER=avnadmin
DB_PASSWORD=your_aiven_password_here
DB_NAME=defaultdb
DB_SSL=true

STALE_THRESHOLD_MINUTES=5

# ThingSpeak Integration (Tùy chọn ghi nhận qua ThingSpeak)
THINGSPEAK_ENABLED=true
THINGSPEAK_CHANNEL_ID=3543608
THINGSPEAK_READ_API_KEY=EB9BC5UY233Z23O4
THINGSPEAK_DEVICE_ID=esp32-nursery-01
THINGSPEAK_POLL_INTERVAL_MS=20000
```

### Bước 3: Khởi tạo bảng và Nạp dữ liệu mẫu (G0 Fixtures)
Hệ thống cung cấp các lệnh quản trị CSDL nhanh:

* **Tạo bảng (Migrations):**
  ```bash
  npm run migrate
  ```
* **Nạp dữ liệu mẫu theo Hợp đồng G0 (Seed):**
  ```bash
  npm run seed
  ```
* **Làm mới toàn bộ CSDL về trạng thái ban đầu (Reset & Seed):**
  ```bash
  npm run reset
  ```

---

## 3. Khởi chạy Server

### Chế độ phát triển (Development với Hot-reload)
```bash
npm run dev
```

### Chế độ kiểm thử tự động (Integration Test Suite)
Chạy bộ kiểm thử tự động 9 ca (kiểm tra toàn bộ hợp đồng API, chống trùng, 404, 400, 409, latest, history):
```bash
npm test
```

### Chế độ sản phẩm (Production Build)
```bash
npm run build
npm start
```

Khi server khởi động thành công, màn hình sẽ hiển thị:
```text
====================================================
 Pepper Nursery IoT Backend is running!
 Local URL:   http://localhost:8000
 Network URL: http://0.0.0.0:8000
 Contract:    v0.1 (/api/v1)
 DB Host:     mysql-13f5204a-dat123456789fa-807a.a.aivencloud.com:19808
====================================================
```

---

## 4. Hướng dẫn dành cho các thành viên trong nhóm

Backend tự động lắng nghe trên `0.0.0.0:8000`. Khi chạy trong cùng mạng Wi-Fi (LAN), các thành viên gọi API qua địa chỉ IP của máy chạy backend:  
`http://<IP_LAN_MAY_BACKEND>:8000/api/v1`

### 4.1. Dành cho DKhoa (Web) & QThang (Mobile)
Các bạn có thể phát triển giao diện độc lập mà không cần chờ phần cứng ESP32. Sau khi chạy `npm run seed`, hệ thống đã có sẵn 3 thiết bị thử nghiệm:

1. **`esp32-nursery-01` (Trạm bình thường):**
   * Có sẵn số đo hợp lệ mới nhất (`is_stale: false`).
   * Có sẵn lịch sử nhiều bản ghi theo thứ tự thời gian.
   * Lấy số đo mới nhất:
     ```http
     GET /api/v1/devices/esp32-nursery-01/readings/latest
     ```
   * Lấy lịch sử 20 số đo gần nhất (mặc định 20, tối đa 100):
     ```http
     GET /api/v1/devices/esp32-nursery-01/readings?limit=20
     ```

2. **`esp32-stale-01` (Trạm mất tín hiệu / Dữ liệu cũ):**
   * Mô phỏng trường hợp thiết bị đã ngừng gửi > 5 phút.
   * Trả về `is_stale: true` để Web/Mobile hiển thị nhãn "Dữ liệu cũ".
     ```http
     GET /api/v1/devices/esp32-stale-01/readings/latest
     ```

3. **`esp32-empty-01` (Trạm mới chưa có dữ liệu):**
   * Thiết bị đã đăng ký nhưng chưa gửi bản ghi nào.
   * Trả về HTTP 200 với `reading: null, received_at: null, is_stale: null, advice: null` (khớp `fixtures/latest-empty.json`).
     ```http
     GET /api/v1/devices/esp32-empty-01/readings/latest
     ```

4. **Thiết bị không tồn tại:**
   * Trả về HTTP 404 với mã lỗi:
     ```json
     {
       "error": {
         "code": "device_not_found",
         "message": "Device '...' does not exist"
       }
     }
     ```

---

### 4.2. Dành cho TVan (Firmware ESP32)
* **Endpoint gửi số đo:**
  ```http
  POST /api/v1/readings
  Content-Type: application/json
  ```
* **Payload mẫu:** Xem tại `docs/contracts/fixtures/reading-normal.json`.
* **Quy tắc phản hồi từ Backend:**
  * **201 Created:** Nhận và lưu thành công bản ghi mới (`duplicate: false`).
  * **200 OK:** Gửi lại thành công cùng `sample_id` và cùng nội dung (`duplicate: true`, giữ nguyên `received_at` ban đầu).
  * **409 Conflict:** Cùng `sample_id` nhưng nội dung payload bị thay đổi (`sample_conflict`).
  * **400 Bad Request:** Payload sai schema, thiếu 5 trạng thái cảm biến hoặc sai kiểu dữ liệu (`invalid_reading`).
  * **500 Server Error:** Lỗi máy chủ tạm thời (`server_error`).

---

### 4.3. Tích hợp ThingSpeak làm trạm trung gian (Ghi/Nhận)
Hệ thống hỗ trợ cơ chế ESP32 gửi lên ThingSpeak và Backend tự động đồng bộ về MySQL Aiven:

* **Channel ID:** `3543608`
* **API Read:** `EB9BC5UY233Z23O4`
* **Ánh xạ 8 Fields:**
  * Field 1: `air_temperature_c` (Nhiệt độ không khí °C)
  * Field 2: `air_humidity_pct` (Độ ẩm không khí %)
  * Field 3: `soil_temperature_c` (Nhiệt độ đầu dò °C)
  * Field 4: `soil_moisture_pct` (Độ ẩm đất %)
  * Field 5: `water_ph` (Độ pH)
  * Field 6: `water_tds_ppm` (Chỉ số TDS ppm)
  * Field 7: `soil_moisture_raw` (Giá trị ADC cảm biến đất)
  * Field 8: `water_ph_adc_raw` (Giá trị ADC cảm biến pH)
* **Cơ chế hoạt động:**
  * Backend chạy một tiến trình ngầm (polling worker) mỗi 20 giây gọi API Read của ThingSpeak để lấy các feed mới nhất.
  * Mỗi feed được chuyển đổi thành bản ghi chuẩn của hệ thống (`sample_id: ts-entry-{id}`) và tự động lưu vào MySQL trên Aiven.
  * **Kích hoạt đồng bộ thủ công:** Gửi `POST /api/v1/sync/thingspeak` để kích hoạt đồng bộ ngay lập tức mà không cần chờ chu kỳ 20s.

