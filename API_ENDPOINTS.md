# TÀI LIỆU TOÀN DIỆN CÁC API ENDPOINTS
**Dự án:** Sensor Data Bridge (Hệ thống Thu thập, Quản lý & Cầu nối Dữ liệu IoT)  
**Phiên bản API:** v1  
**Ngày cập nhật:** 10/11/2026  

---

## MỤC LỤC
1. [Tổng quan & Phương thức Xác thực](#1-tổng-quan--phương-thức-xác-thực)
2. [Bảng tổng hợp tất cả các API Endpoints](#2-bảng-tổng-hợp-tất-cả-các-api-endpoints)
3. [Chi tiết từng nhóm Endpoint](#3-chi-tiết-từng-nhóm-endpoint)
   - [3.1. Hệ thống & Kiểm tra sức khỏe (Root & Health)](#31-hệ-thống--kiểm-tra-sức-khỏe-root--health)
   - [3.2. Xác thực & Tài khoản người dùng (Auth)](#32-xác-thực--tài-khoản-người-dùng-auth)
   - [3.3. Mô hình Channel & Feeds (ThingSpeak-style)](#33-mô-hình-channel--feeds-thingspeak-style)
   - [3.4. Quản lý Dự án (Projects)](#34-quản-lý-dự-án-projects)
   - [3.5. Quản lý Thiết bị (Devices)](#35-quản-lý-thiết-bị-devices)
   - [3.6. Thu nạp dữ liệu Telemetry chuẩn V1 (Device Ingestion)](#36-thu-nạp-dữ-liệu-telemetry-chuẩn-v1-device-ingestion)
   - [3.7. Cảm biến thô Legacy (Sensors)](#37-cảm-biến-thô-legacy-sensors)
4. [Hướng dẫn tích hợp cho Web/Ứng dụng bên ngoài](#4-hướng-dẫn-tích-hợp-cho-webứng-dụng-bên-ngoài)

---

## 1. TỔNG QUAN & PHƯƠNG THỨC XÁC THỰC

### Base URL:
* **Local Development:** `http://localhost:8000/api/v1`
* **Production API Host (Render):** `https://sensor-data-bridge-backend.onrender.com/api/v1`
* **Frontend Web Management UI:** `https://sensor-data-bridge-frontened.onrender.com`
* **Interactive API Docs:**
  * Swagger UI: `https://sensor-data-bridge-backend.onrender.com/docs`
  * ReDoc: `https://sensor-data-bridge-backend.onrender.com/redoc`

### Các cơ chế xác thực hỗ trợ:
1. **Public (Không cần Auth):** Dành cho kiểm tra server, đăng ký/đăng nhập và endpoint sensor legacy.
2. **Bearer JWT Token (`Authorization: Bearer <JWT>`):** Dành cho phiên người dùng quản trị (Frontend Dashboard, quản lý Projects, Channels, Devices).
3. **Channel API Key (`X-API-Key: <16_CHAR_KEY>`):** Dành riêng cho Channel.
   * `Write API Key`: Dành cho ESP32 đẩy số đo lên kênh.
   * `Read API Key`: Dành cho **website khác hoặc ứng dụng bên ngoài** đọc dữ liệu đo mà không cần đăng nhập tài khoản.
4. **Device Token (`X-Device-Token: <TOKEN>`):** Dành cho thiết bị IoT cấp doanh nghiệp kết nối vào endpoint `/telemetry`.

---

## 2. BẢNG TỔNG HỢP TẤT CẢ CÁC API ENDPOINTS

| Nhóm | Phương thức | Đường dẫn Endpoint | Cơ chế Xác thực | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/` | Public | Thông tin chào mừng và đường dẫn docs |
| **System** | `GET` | `/api/v1/health` | Public | Kiểm tra trạng thái hoạt động backend |
| **Auth** | `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản người dùng mới |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Đăng nhập lấy Bearer JWT Token |
| **Auth** | `GET` | `/api/v1/auth/me` | Bearer JWT | Lấy hồ sơ tài khoản đang đăng nhập |
| **Channels** | `GET` | `/api/v1/channels` | Bearer JWT | Danh sách kênh thuộc sở hữu của user |
| **Channels** | `POST` | `/api/v1/channels` | Bearer JWT | Tạo kênh mới kèm cấu hình các Field |
| **Channels** | `GET` | `/api/v1/channels/{id}` | Bearer JWT | Xem thông tin chi tiết của kênh |
| **Channels** | `PATCH` | `/api/v1/channels/{id}` | Bearer JWT | Cập nhật tên, mô tả hoặc field của kênh |
| **Channels** | `PUT` | `/api/v1/channels/{id}/fields` | Bearer JWT | Cấu hình/thay thế danh sách các field |
| **Channels** | `DELETE` | `/api/v1/channels/{id}` | Bearer JWT | Xóa hoàn toàn một kênh |
| **Channels** | `GET` | `/api/v1/channels/{id}/api_keys` | Bearer JWT | Xem danh sách các API Key của kênh |
| **Channels** | `POST` | `/api/v1/channels/{id}/api_keys` | Bearer JWT | Tạo khóa Write Key hoặc Read Key mới (16 ký tự) |
| **Channels** | `DELETE` | `/api/v1/channels/{id}/api_keys/{key_id}` | Bearer JWT | Thu hồi (hủy) API Key |
| **Channels** | `POST` | `/api/v1/channels/{id}/feeds` | **X-API-Key (Write)** | **ESP32 gửi số đo các field lên kênh** |
| **Channels** | `GET` | `/api/v1/channels/{id}/feeds` | **X-API-Key (Read)** / JWT | **Web ngoài hoặc Dashboard lấy dữ liệu phân trang & lọc thời gian** |
| **Channels** | `GET` | `/api/v1/channels/{id}/private_show` | Bearer JWT | Lấy trọn bộ metadata + feeds phục vụ Dashboard đồ họa |
| **Projects** | `GET` | `/api/v1/projects` | Bearer JWT | Danh sách các Project của user |
| **Projects** | `POST` | `/api/v1/projects` | Bearer JWT | Tạo Project quản lý thiết bị mới |
| **Projects** | `GET` | `/api/v1/projects/{id}` | Bearer JWT | Lấy chi tiết một Project |
| **Projects** | `PATCH`| `/api/v1/projects/{id}` | Bearer JWT | Đổi tên, mô tả của Project |
| **Projects** | `GET` | `/api/v1/projects/{id}/devices` | Bearer JWT | Danh sách thiết bị nằm trong Project |
| **Projects** | `POST` | `/api/v1/projects/{id}/devices` | Bearer JWT | Khởi tạo thiết bị mới kèm Device Token |
| **Devices** | `GET` | `/api/v1/devices/{id}` | Bearer JWT | Xem chi tiết thông số thiết bị |
| **Devices** | `PATCH`| `/api/v1/devices/{id}` | Bearer JWT | Cập nhật cấu hình thiết bị (chu kỳ đo...) |
| **Devices** | `GET` | `/api/v1/devices/{id}/tokens` | Bearer JWT | Xem danh sách token của thiết bị |
| **Devices** | `POST` | `/api/v1/devices/{id}/tokens` | Bearer JWT | Cấp phát thêm token cho thiết bị |
| **Devices** | `DELETE`| `/api/v1/devices/{id}/tokens/{token_id}` | Bearer JWT | Thu hồi token của thiết bị |
| **Devices** | `GET` | `/api/v1/devices/{id}/latest` | Bearer JWT | Lấy 1 bản ghi telemetry mới nhất của thiết bị |
| **Devices** | `GET` | `/api/v1/devices/{id}/telemetry` | Bearer JWT | Lịch sử đo đạc telemetry của thiết bị |
| **Telemetry**| `POST` | `/api/v1/telemetry` | **X-Device-Token** | **ESP32 gửi Telemetry chuẩn hóa V1** |
| **Sensors** | `POST` | `/api/v1/sensors/readings` | Public | Đẩy số đo cảm biến đơn lẻ (Legacy) |
| **Sensors** | `GET` | `/api/v1/sensors/readings` | Public | Đọc danh sách số đo cảm biến (Legacy) |
| **Sensors** | `GET` | `/api/v1/sensors/readings/{sensor_id}` | Public | Lọc số đo cảm biến theo ID (Legacy) |

---

## 3. CHI TIẾT TỪNG NHÓM ENDPOINT

### 3.1. Hệ thống & Kiểm tra sức khỏe (Root & Health)

#### `GET /api/v1/health`
* **Mục đích:** Health check phục vụ giám sát uptime (UptimeRobot, Render Health Check).
* **Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-11-10T08:45:00Z",
    "version": "1.0.0"
  }
  ```

---

### 3.2. Xác thực & Tài khoản người dùng (Auth)

#### `POST /api/v1/auth/register`
* **Request Body:**
  ```json
  {
    "email": "user@gmail.com",
    "password": "Password123!",
    "full_name": "Nguyễn Văn A"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "user@gmail.com",
      "full_name": "Nguyễn Văn A",
      "role": "user",
      "status": "active"
    }
  }
  ```

#### `POST /api/v1/auth/login`
* **Request Body:**
  ```json
  {
    "email": "user@gmail.com",
    "password": "Password123!"
  }
  ```

#### `GET /api/v1/auth/me`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

---

### 3.3. Mô hình Channel & Feeds (ThingSpeak-style)

#### 1. Tạo khóa API Key: `POST /api/v1/channels/{channel_id}/api_keys`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "type": "read", // Hoặc "write"
    "name": "Khóa xem dữ liệu cho Website đối tác"
  }
  ```
* **Response (201 Created):** Khóa `api_key` gồm 16 ký tự an toàn chỉ hiển thị 1 lần.

---

#### 2. ESP32 Gửi dữ liệu lên Channel: `POST /api/v1/channels/{channel_id}/feeds`
* **Headers:** `X-API-Key: <16_CHAR_WRITE_KEY>`
* **Request Body (Hỗ trợ định dạng `field1..field8` hoặc JSON Object):**
  ```json
  {
    "field1": 33.2,
    "field2": 67.0,
    "field3": 32.0,
    "field4": 0.0,
    "field5": 14.0,
    "field6": 58.5,
    "field7": 4095.0,
    "field8": 296.0
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": 105,
    "channel_id": 1,
    "values": {
      "field1": 33.2,
      "field2": 67.0,
      "field3": 32.0,
      "field4": 0.0,
      "field5": 14.0,
      "field6": 58.5,
      "field7": 4095.0,
      "field8": 296.0
    },
    "received_at": "2026-11-10T08:45:10Z"
  }
  ```

---

#### 3. Web khác hoặc Client lấy dữ liệu: `GET /api/v1/channels/{channel_id}/feeds`
* **Headers:** `X-API-Key: <16_CHAR_READ_KEY>` *(hoặc `Authorization: Bearer <JWT>`)*
* **Query Parameters:**
  * `page` (int, default: `1`): Số trang cần xem.
  * `page_size` (int, default: `20`, max: `100`): Số dòng mỗi trang.
  * `limit` (int, 1–1000, optional): Lấy nhanh N dòng mới nhất.
  * `start_at` (ISO Datetime, optional): Thời điểm bắt đầu (ví dụ: `2026-11-01T00:00:00Z`).
  * `end_at` (ISO Datetime, optional): Thời điểm kết thúc.
  * `order` (`desc` hoặc `asc`, default: `desc`): `desc` là dữ liệu mới nhất ở đầu.

* **Response (200 OK):**
  ```json
  {
    "channel_id": 1,
    "total": 520,
    "page": 1,
    "page_size": 20,
    "total_pages": 26,
    "feeds": [
      {
        "id": 520,
        "channel_id": 1,
        "values": {
          "field1": 33.2,
          "field2": 67.0,
          "field3": 32.0,
          "field4": 0.0,
          "field5": 14.0,
          "field6": 58.5,
          "field7": 4095.0,
          "field8": 296.0
        },
        "received_at": "2026-11-10T08:45:10Z"
      }
    ]
  }
  ```

---

#### 4. Xem dữ liệu toàn diện kênh: `GET /api/v1/channels/{channel_id}/private_show`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Query Parameters:** `limit` (default: 100)
* **Response (200 OK):** Bao gồm thông tin đầy đủ về Kênh, cấu hình các Field, tổng số bản ghi và các feed gần nhất để dựng biểu đồ.

---

### 3.4. Quản lý Dự án (Projects)
* `GET /api/v1/projects`: Danh sách các dự án kèm số lượng thiết bị (`devices_count`).
* `POST /api/v1/projects`: Tạo dự án mới.
* `GET /api/v1/projects/{project_id}`: Xem chi tiết dự án.
* `GET /api/v1/projects/{project_id}/devices`: Danh sách thiết bị thuộc dự án.
* `POST /api/v1/projects/{project_id}/devices`: Tạo thiết bị trong dự án và sinh mã token đầu tiên.

---

### 3.5. Quản lý Thiết bị (Devices)
* `GET /api/v1/devices/{device_id}`: Thông tin chi tiết thiết bị, trạng thái `last_seen_at`.
* `PATCH /api/v1/devices/{device_id}`: Cập nhật thông số chu kỳ gửi (`interval_seconds`), tên thiết bị.
* `GET /api/v1/devices/{device_id}/latest`: Lấy **1 bản ghi telemetry mới nhất** của thiết bị (kèm `uptime_ms`, `firmware_version`, chỉ số chất lượng cảm biến `quality`).
* `GET /api/v1/devices/{device_id}/telemetry?limit=50`: Lịch sử dữ liệu đo đạc của thiết bị.

---

### 3.6. Thu nạp dữ liệu Telemetry chuẩn V1 (Device Ingestion)

#### `POST /api/v1/telemetry`
* **Headers:** `X-Device-Token: <DEVICE_TOKEN>`
* **Mục đích:** Giao thức chuẩn hóa dành cho thiết bị công nghiệp (có xác thực chữ ký/token, chống trùng lặp bản ghi `message_id`, quản lý chất lượng truyền tin).
* **Request Body:**
  ```json
  {
    "v": 1,
    "msg_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "device_code": "ESP32_AGRI_01",
    "metrics_rev": 1,
    "calib_rev": 1,
    "firmware": "1.0.4",
    "uptime_ms": 1284500,
    "time": {
      "measured_at": "2026-11-10T08:44:00Z",
      "quality": "synced"
    },
    "values": {
      "temperature": 32.5,
      "humidity": 68.2,
      "soil_moisture": 45.1
    },
    "quality": {
      "temperature": "good",
      "humidity": "good",
      "soil_moisture": "good"
    }
  }
  ```
* **Response:**
  * `201 Created`: Bản ghi mới được lưu trữ thành công.
  * `200 OK`: Bản ghi lặp (idempotent retry - đã nhận trước đó).

---

### 3.7. Cảm biến thô Legacy (Sensors)
* `POST /api/v1/sensors/readings`: Nhận bản ghi dạng `{ "sensor_id": "temp_01", "value": 28.5, "unit": "C" }`.
* `GET /api/v1/sensors/readings?limit=50`: Lấy danh sách số đo legacy.
* `GET /api/v1/sensors/readings/{sensor_id}?limit=50`: Lọc theo mã cảm biến.

---

## 4. HƯỚNG DẪN TÍCH HỢP TRỰC TIẾP CHO BÊN THỨ BA (SENSOR DATA BRIDGE)

### Ví dụ 1: Web bên ngoài gọi lấy dữ liệu trực tiếp từ Sensor Data Bridge (JavaScript / Fetch)
```javascript
const BRIDGE_API_URL = "https://sensor-data-bridge-backend.onrender.com/api/v1";
const CHANNEL_ID = 1;
const READ_API_KEY = "sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw";

async function loadLatestFeeds() {
  try {
    const url = `${BRIDGE_API_URL}/channels/${CHANNEL_ID}/feeds?limit=20`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": READ_API_KEY,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Lỗi kết nối Bridge: ${response.status}`);
    }

    const data = await response.json();
    console.log("Tổng số dòng:", data.total);
    console.log("Danh sách đo đạc:", data.feeds);
  } catch (error) {
    console.error("Không thể lấy dữ liệu:", error);
  }
}
```

### Ví dụ 2: Lấy dữ liệu bằng cURL
```bash
curl -X GET "https://sensor-data-bridge-backend.onrender.com/api/v1/channels/1/feeds?limit=10" \
     -H "X-API-Key: sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw" \
     -H "Accept: application/json"
```

### Ví dụ 3: ESP32 gửi dữ liệu lên kênh (C++ / Arduino)
```cpp
HTTPClient http;
http.begin("https://sensor-data-bridge-backend.onrender.com/api/v1/channels/1/feeds");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-API-Key", "sdb_write_..."); // 16+ ký tự Write API Key do QTien cấu hình

String payload = "{\"field1\":32.7,\"field2\":69.5,\"field3\":32.0,\"field4\":0.0,\"field5\":3.28,\"field6\":58.5,\"field7\":4095.0,\"field8\":1022.0}";
int httpCode = http.POST(payload);
http.end();
```

---

## 5. HƯỚNG DẪN KẾT NỐI CHO FRONTEND WEB (DKHOA) VÀ MOBILE APP (QTHANG)
### (Dự án: Hệ thống Giám sát Vườn ươm Ớt con - Pepper Nursery IoT)

### 5.1. Kiến trúc Hệ thống & Giải đáp: "Có thể bỏ qua lưu vào Database không?"

* **Sensor Data Bridge hoạt động như một Time-Series Database:** 
  Khi trạm ESP32 của QTien đẩy dữ liệu lên, Sensor Data Bridge đã tự động ghi nhận và lưu trữ toàn bộ các số đo từ thời điểm thiết bị bật.
* **Backend TDat có thể bỏ qua lưu `readings` vào MySQL:**
  - Trong file `.env`, Backend hỗ trợ tùy chọn:
    ```env
    # Đặt false để bỏ qua lưu số đo thô vào MySQL, giảm tải dung lượng CSDL:
    SAVE_READINGS_TO_DB=false
    ```
  - Khi đặt `SAVE_READINGS_TO_DB=false`, Backend TDat **không cần lưu hàng triệu dòng số đo vào bảng `readings` của MySQL** mà duy trì bộ đệm RAM (In-Memory Cache) được cập nhật định kỳ từ Bridge.
* **Những phần BẮT BUỘC vẫn cần Database MySQL (Aiven Cloud):**
  1. **Bảng `users`:** Quản lý tài khoản đăng nhập `admin` và `user`, mật mã băm an toàn qua bcrypt.
  2. **Bảng `care_rules`:** Quản lý 24+ quy tắc sinh học chăm sóc ớt con động do Admin thêm/sửa/xóa qua giao diện Admin Console.

---

### 5.2. Tại sao Web và Mobile nên gọi qua Backend TDat thay vì gọi trực tiếp Bridge?

| Tiêu chí so sánh | Gọi trực tiếp Sensor Data Bridge | Gọi qua Backend TDat (Khuyến nghị chuẩn) |
| :--- | :--- | :--- |
| **Tên trường số đo** | `field1..field8` vô nghĩa, phải tự map | Tên trường chuẩn nông học: `air_temperature_c`, `water_ph`, `soil_moisture_pct`... |
| **Lời khuyên sinh học (`advice`)** | **KHÔNG CÓ** (chỉ có số thô) | **Tự động đánh giá theo chuẩn nông học của MThuy** (`optimal`, `warning`, `danger`, `insufficient_data`) kèm `code` và `suggested_action` |
| **Cảnh báo dữ liệu cũ (`is_stale`)** | **KHÔNG CÓ** | **Tự động phát hiện trạm mất liên lạc quá 5 phút** (`is_stale: true`) để hiển thị nhãn cảnh báo |
| **Trạng thái cảm biến (`sensor_status`)**| **KHÔNG CÓ** | Tự động phân biệt `ok`, `read_error`, `not_calibrated` cho từng cảm biến độc lập |
| **Xác thực & Phân quyền (Auth)** | Không có auth người dùng vườn ươm | Có sẵn JWT Auth: vai trò `admin` và `user` (`/api/v1/auth/login`) |
| **Quản trị Quy tắc Chăm sóc** | **KHÔNG CÓ** | Đầy đủ API CRUD Care Rules (`/api/v1/rules`) cho Admin Console |
| **Bảo mật API Key** | Phải để lộ `READ_API_KEY` trong mã nguồn frontend | API Key được giấu an toàn trên server, frontend không lo lộ key |

---

### 5.3. Chi tiết API Endpoints Backend TDat dành cho Web (DKhoa) & Mobile (QThang)

* **Base URL Backend:** 
  * Cloud Render: `https://pepper-nursery-iot.onrender.com/api/v1`
  * Local Dev: `http://localhost:8000/api/v1`

#### 1. Lấy số đo mới nhất của vườn ươm (Kèm lời khuyên chăm sóc sinh học)
* **Endpoint:** `GET /api/v1/devices/esp32-nursery-01/readings/latest`
* **Response (200 OK):**
```json
{
  "device_id": "esp32-nursery-01",
  "received_at": "2026-11-10T08:02:17.717Z",
  "is_stale": false,
  "reading": {
    "schema_version": "0.1",
    "device_id": "esp32-nursery-01",
    "sample_id": "sdb-entry-113",
    "recorded_at": "2026-11-08T06:14:53.000Z",
    "air_temperature_c": 32.7,
    "air_humidity_pct": 69.5,
    "soil_temperature_c": 32.0,
    "soil_moisture_pct": 0.0,
    "soil_moisture_raw": 4095,
    "water_ph": 3.28,
    "water_ph_adc_raw": 1022,
    "water_tds_ppm": 58.5,
    "water_tds_adc_raw": null,
    "sensor_status": {
      "dht22": "ok",
      "ds18b20": "ok",
      "hd38": "ok",
      "tds": "ok",
      "ph4502c": "ok"
    }
  },
  "advice": {
    "version": "0.1",
    "status": "danger",
    "priority": 2,
    "code": "RULE_TEMP_EXTREME_HIGH",
    "message": "Nhiệt độ không khí cực cao: Kéo lưới che 70% nắng, bật phun sương mái làm mát. | Giá thể cực khô hạn: Tưới bù ẩm khẩn cấp bằng phun sương mịn đều mặt khay. | Nước tưới cực chua (Axit nặng): Tuyệt đối không tưới! Dùng nước vôi trong nâng pH lên 6.0-6.5.",
    "suggested_action": "Kéo lưới che 70% nắng, bật phun sương mái làm mát.; Tưới bù ẩm khẩn cấp bằng phun sương mịn đều mặt khay.; Tuyệt đối không tưới! Dùng nước vôi trong nâng pH lên 6.0-6.5."
  }
}
```

#### 2. Lấy lịch sử số đo để vẽ biểu đồ quan trắc (Trends & Chart)
* **Endpoint:** `GET /api/v1/devices/esp32-nursery-01/readings?limit=20`
* **Response (200 OK):**
```json
{
  "device_id": "esp32-nursery-01",
  "limit": 20,
  "readings": [
    {
      "reading": {
        "air_temperature_c": 32.7,
        "air_humidity_pct": 69.5,
        "soil_temperature_c": 32.0,
        "soil_moisture_pct": 0.0,
        "water_ph": 3.28,
        "water_tds_ppm": 58.5,
        "recorded_at": "2026-11-08T06:14:53.000Z"
      },
      "received_at": "2026-11-10T08:02:17.717Z"
    }
  ]
}
```

#### 3. Đăng nhập người dùng (Authentication)
* **Endpoint:** `POST /api/v1/auth/login`
* **Body:**
  ```json
  { "username": "admin", "password": "admin123" }
  ```
  *(Hoặc kỹ thuật viên: `{ "username": "user", "password": "user123" }`)*
* **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": { "id": 1, "username": "admin", "full_name": "Quản trị viên Vườn ươm", "role": "admin" }
  }
  ```

#### 4. Xem thông tin tài khoản đang đăng nhập
* **Endpoint:** `GET /api/v1/auth/me`
* **Headers:** `Authorization: Bearer <TOKEN>`

#### 5. Quản lý Quy tắc Chăm sóc Cây ớt con (Care Rules)
* `GET /api/v1/rules`: Lấy danh sách các quy tắc chăm sóc đang hoạt động (Public / User / Admin).
* `POST /api/v1/rules`: Thêm quy tắc chăm sóc mới (Yêu cầu Token `admin`).
* `PUT /api/v1/rules/{id}`: Cập nhật ngưỡng hoặc lời khuyên của quy tắc (Yêu cầu Token `admin`).
* `DELETE /api/v1/rules/{id}`: Xóa quy tắc (Yêu cầu Token `admin`).

#### 6. Kiểm tra trạng thái và Ép đồng bộ Sensor Data Bridge
* `GET /api/v1/sync/bridge/status`: Kiểm tra trạng thái kết nối tới Sensor Data Bridge (kênh, chu kỳ polling, lỗi nếu có).
* `POST /api/v1/sync/bridge`: Ép backend kéo số đo mới nhất ngay lập tức từ Bridge mà không cần đợi chu kỳ 20 giây.

---

### 5.4. Code mẫu tích hợp chuẩn cho Web (React / JavaScript)

```javascript
// src/services/nurseryApi.js
const BACKEND_URL = "https://pepper-nursery-iot.onrender.com/api/v1";
const DEVICE_ID = "esp32-nursery-01";

export const nurseryApi = {
  // 1. Đọc số đo thời gian thực mới nhất (kèm lời khuyên chăm sóc)
  async getLatest() {
    const res = await fetch(`${BACKEND_URL}/devices/${DEVICE_ID}/readings/latest`);
    if (!res.ok) throw new Error(`Lỗi tải số đo: ${res.status}`);
    return await res.json();
  },

  // 2. Đọc 20 số đo lịch sử để vẽ đồ thị
  async getHistory(limit = 20) {
    const res = await fetch(`${BACKEND_URL}/devices/${DEVICE_ID}/readings?limit=${limit}`);
    if (!res.ok) throw new Error(`Lỗi tải lịch sử: ${res.status}`);
    return await res.json();
  },

  // 3. Đăng nhập Admin
  async login(username, password) {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error("Sai tên đăng nhập hoặc mật khẩu");
    return await res.json();
  },

  // 4. Lấy danh sách quy tắc chăm sóc
  async getRules() {
    const res = await fetch(`${BACKEND_URL}/rules`);
    if (!res.ok) throw new Error("Không thể tải danh sách quy tắc");
    return await res.json();
  },

  // 5. Thêm quy tắc mới (Chỉ Admin)
  async createRule(ruleData, token) {
    const res = await fetch(`${BACKEND_URL}/rules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(ruleData)
    });
    if (!res.ok) throw new Error("Không thể tạo quy tắc mới");
    return await res.json();
  }
};
```
