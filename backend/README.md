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

# Telemetry Provider ('sensor_bridge' or 'thingspeak')
TELEMETRY_PROVIDER=sensor_bridge

# =========================================================================
# Sensor Data Bridge (Cổng trung gian Cloud Render)
# Khi API read key thay đổi, bạn chỉ cần cập nhật trường API_READ này:
# =========================================================================
API_READ=sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw

SENSOR_BRIDGE_ENABLED=true
SENSOR_BRIDGE_URL=https://sensor-data-bridge-frontened.onrender.com
SENSOR_BRIDGE_CHANNEL_ID=1
SENSOR_BRIDGE_DEVICE_ID=esp32-nursery-01
SENSOR_BRIDGE_POLL_INTERVAL_MS=20000

# ThingSpeak Integration (Tùy chọn dự phòng)
THINGSPEAK_ENABLED=false
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

### 4.2. Dành cho QTien (Firmware ESP32 / Cảm biến / ThingSpeak)
* **Endpoint gửi số đo trực tiếp (REST Ingest dự phòng):**
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
* **Lưu ý:** Nhiệm vụ truyền dữ liệu và kết nối mạng Wi-Fi của TVan đã được QTien đảm nhiệm và hợp nhất toàn diện từ đầu dự án qua mã nguồn `ESP32_CayOt/ESP32_CayOt.ino` và kênh ThingSpeak `3543608`.

---

### 4.3. Tích hợp Cổng Chuyển tiếp Dữ liệu Cảm biến (Sensor Data Bridge)
Hệ thống kết nối và đồng bộ tự động dữ liệu từ trạm trung gian **Sensor Data Bridge** về CSDL MySQL Aiven:

* **Trang quản trị / Giao diện người dùng:** `https://sensor-data-bridge-frontened.onrender.com`
* **API Documentation (Swagger / OpenAPI):** `https://sensor-data-bridge-backend.onrender.com/docs`
* **API Host:** `https://sensor-data-bridge-backend.onrender.com`
* **Channel ID:** `1`
* **API Read Key:** `sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw`
* **Header xác thực khi gọi API:** `X-API-Key: sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw`

#### Ánh xạ 8 Fields đo đạc:
* `field1`: `air_temperature_c` (Nhiệt độ không khí °C — DHT22)
* `field2`: `air_humidity_pct` (Độ ẩm không khí % — DHT22)
* `field3`: `soil_temperature_c` (Nhiệt độ đầu dò đất °C — DS18B20)
* `field4`: `soil_moisture_pct` (Độ ẩm đất quy đổi % — HD-38)
* `field5`: `water_ph` (Độ pH nước tưới — PH-4502C)
* `field6`: `water_tds_ppm` (Chỉ số TDS ppm — TDS Meter)
* `field7`: `soil_moisture_raw` (Giá trị ADC thô cảm biến đất — HD-38)
* `field8`: `water_ph_adc_raw` (Giá trị ADC thô cảm biến pH — PH-4502C)

#### Cơ chế hoạt động:
* Backend chạy một tiến trình ngầm (`SensorBridgeService`) định kỳ mỗi 20 giây gọi API đọc feed:
  ```http
  GET /api/v1/channels/1/feeds?limit=20
  Host: sensor-data-bridge-backend.onrender.com
  X-API-Key: sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw
  ```
* Mỗi feed được chuyển đổi thành bản ghi chuẩn (`sample_id: sdb-entry-{id}`), tự động chuẩn hóa UTC ISO 8601 và lưu vào MySQL trên Aiven (tự động deduplication chống trùng lặp).
* **Endpoints Quản trị Đồng bộ:**
  * Kiểm tra trạng thái Worker: `GET /api/v1/sync/bridge/status` (hỗ trợ alias `GET /api/v1/sync/thingspeak/status`).
  * Kích hoạt đồng bộ thủ công tức thời: `POST /api/v1/sync/bridge` (hỗ trợ alias `POST /api/v1/sync/thingspeak`).

---

### 4.4. Xác thực và Phân quyền (Authentication & Authorization)
Hệ thống sử dụng JWT (JSON Web Token) với 2 phân quyền: `admin` và `user`.

#### Tài khoản thử nghiệm mặc định (Đã nạp sẵn qua `npm run seed`):
| Username | Password | Quyền (Role) | Chức năng cho phép |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | Đầy đủ quyền: Xem số đo, lịch sử, thêm/sửa/xóa quy tắc chăm sóc cây |
| `user` | `user123` | `user` | Quyền xem: Xem số đo, lịch sử, xem danh sách quy tắc (không được sửa/xóa) |

#### API Đăng nhập:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```
**Phản hồi thành công (HTTP 200):**
```json
{
  "status": "ok",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "Quản trị viên Vườn ươm",
    "role": "admin"
  }
}
```

#### API Kiểm tra phiên đăng nhập:
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

---

### 4.5. API Quy tắc Chăm sóc Cây ớt (Dành cho Web & Mobile)

Hệ thống đã nạp sẵn 10 quy tắc sinh học chuẩn cho vườn ươm ớt con.

#### 1. Lấy danh sách quy tắc đang kích hoạt (User & Admin):
```http
GET /api/v1/rules
```
Web và Mobile dùng API này để hiển thị danh sách các ngưỡng và lời khuyên chăm sóc trên giao diện.

#### 2. Thêm quy tắc mới (Chỉ Admin):
```http
POST /api/v1/rules
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "rule_code": "RULE_CUSTOM_01",
  "name": "Cảnh báo nhiệt độ tối ưu cây con",
  "parameter": "air_temperature_c",
  "operator": "between",
  "threshold_min": 25.0,
  "threshold_max": 30.0,
  "severity": "info",
  "action_advice": "Nhiệt độ phòng ươm đang trong dải vàng 25-30°C cho ớt con phát triển tốt."
}
```

#### 3. Sửa quy tắc (Chỉ Admin):
```http
PUT /api/v1/rules/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "threshold_max": 36.0,
  "action_advice": "Nhiệt độ quá cao trên 36°C, bật phun sương khẩn cấp."
}
```

#### 4. Xóa quy tắc (Chỉ Admin):
```http
DELETE /api/v1/rules/:id
Authorization: Bearer <admin_token>
```

---

## 5. Triển khai Production & Docker (Phase 5 Handover)

### 5.1. Triển khai bằng Docker
Dự án đã chuẩn bị sẵn `Dockerfile` multi-stage build tối ưu kích thước image:
```bash
# Build image
docker build -t pepper-nursery-backend:latest .

# Khởi chạy container
docker run -d \
  --name pepper-backend \
  -p 8000:8000 \
  --env-file .env \
  pepper-nursery-backend:latest
```

### 5.2. Triển khai trên Render Cloud
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start` (hoặc `node dist/server.js`)
- **Port:** `8000`
- **Health Check Path:** `/api/v1/health`
- **Địa chỉ triển khai chính thức:** `https://pepper-nursery-iot.onrender.com`



