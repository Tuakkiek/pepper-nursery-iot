# Hướng dẫn Tích hợp API Backend dành cho Frontend Web (DKhoa) & Mobile App (QThang)

**Dự án:** MVP Hệ thống Chăm sóc Vườn ươm Ớt con bằng IoT (`pepper-nursery-iot`)  
**Người phụ trách Backend:** TDat  
**Người sử dụng API:** DKhoa (Web Dashboard), QThang (Mobile App Flutter)  
**Phiên bản API:** `v1` (Cập nhật ngày 10/11/2026: Đồng bộ `id`/`name` từ API Read & Luồng Chọn Thiết bị cho User)  
**Tình trạng:** Đã triển khai sẵn CORS & Đạt 100% Integration Tests  

---

## 1. Địa chỉ Máy chủ (Base URL) & Hạ tầng Kết nối

### 1.1. Backend TDat (Primary - Khuyến nghị 100%)
* **Production (Render Cloud):** `https://pepper-nursery-iot.onrender.com/api/v1`
* **Local Development:** `http://localhost:8000/api/v1`
* **Health Check:** `GET https://pepper-nursery-iot.onrender.com/api/v1/health`

> [!NOTE]
> Backend đã được cấu hình **CORS Whitelist** cho Web Dashboard trên Render: `https://pepper-nursery-iot-em0t.onrender.com` cũng như các môi trường phát triển (`http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:8080`). Web Frontend có thể gọi API trực tiếp từ trình duyệt mà không bị lỗi Cross-Origin.

### 1.2. Sensor Data Bridge (Cầu nối trung gian IoT - Kênh 1)
* **API Base URL:** `https://sensor-data-bridge-backend.onrender.com/api/v1`
* **Frontend Quản lý Kênh:** `https://sensor-data-bridge-frontened.onrender.com`
* **Swagger UI:** `https://sensor-data-bridge-backend.onrender.com/docs`
* **Channel ID:** `1`
* **Read API Key:** `sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw` (Header `X-API-Key`)

---

## 2. Quy ước Đồng bộ Dữ liệu từ API Read với DB ESP32

Để đồng nhất dữ liệu giữa mạch ESP32 (QTien), Cầu nối dữ liệu Sensor Data Bridge và CSDL MySQL của Backend:

| Thuộc tính từ API Read | Thuộc tính trong CSDL Backend | Giá trị thực tế | Ý nghĩa |
| :---: | :---: | :---: | :--- |
| **`id`** *(hoặc `channel_id`)* | **`device_id`** | `"1"` | Định danh kênh / thiết bị dạng chuỗi hoặc số |
| **`name`** | **`name`** | `"esp32-nursery-01"` | Tên mã thiết bị ESP32 phần cứng (`esp32-nursery-01` hoặc `Trạm vườn ươm ớt 01`) |

> [!IMPORTANT]
> **Cơ chế Tra cứu Thông minh (Smart Alias):**  
> Backend hỗ trợ tra cứu thiết bị bằng **cả `device_id` lẫn `name`**. Khi Frontend gọi API với `1` hoặc `esp32-nursery-01`, Backend đều tự động phân giải về đúng thiết bị và trả về dữ liệu chuẩn xác!

---

## 3. Luồng Nghiệp vụ Frontend: Đăng ký User & Chọn Thiết bị Hiển thị

Frontend (Web & Mobile) triển khai luồng Onboarding người dùng theo 4 bước sau:

```
[1. Đăng ký / Đăng nhập] 
         │ (POST /auth/register hoặc /auth/login)
         ▼
[2. Kiểm tra user.selected_device_id]
         ├── Có sẵn ─────────────► [4. Vào thẳng Dashboard]
         └── Chưa có (null)
                  │
                  ▼
[3. Màn hình Chọn Thiết bị]
   * Xem danh sách: GET /devices
   * Hoặc nhập ID (1) / Name (esp32-nursery-01)
   * Lưu lựa chọn: PUT /auth/me/device { device_id: "1" }
                  │
                  ▼
[4. Vào Dashboard xem số đo]
   * Gọi: GET /devices/me/readings/latest (Tự động lấy số đo thiết bị đã chọn)
   * Hoặc: GET /devices/1/readings/latest
```

### Bước 1: Người dùng đăng ký hoặc đăng nhập
* Gọi `POST /api/v1/auth/register` (hoặc `POST /api/v1/auth/login`).
* Lưu JWT Token vào `localStorage` (Web) hoặc `FlutterSecureStorage` (Mobile).
* Thông tin `user` trả về sẽ có trường `selected_device_id` (mặc định tài khoản mới là `null`).

### Bước 2: Kiểm tra thiết bị đã chọn
* Nếu `user.selected_device_id === null`: Frontend chuyển hướng người dùng sang giao diện **"Chọn hoặc Nhập thiết bị giám sát"**.
* Nếu đã có: Chuyển thẳng vào Dashboard giám sát.

### Bước 3: Người dùng chọn hoặc nhập thiết bị
Người dùng có 2 lựa chọn tại màn hình này:
1. **Chọn từ danh sách có sẵn:** Frontend gọi `GET /api/v1/devices` để render danh sách thẻ thiết bị (hiển thị rõ tên thiết bị, trạng thái Online/Offline, số đo gần nhất). Người dùng chỉ cần bấm nút "Chọn trạm này".
2. **Nhập thủ công ID hoặc Name:** Người dùng nhập `1` (ID từ API read) hoặc `esp32-nursery-01` (Name từ ESP32).
3. **Lưu thiết bị vào tài khoản:** Frontend gửi request:
   - `PUT /api/v1/auth/me/device` (hoặc `PUT /api/v1/users/me/device`)
   - Headers: `Authorization: Bearer <TOKEN>`
   - Body: `{ "device_id": "1" }` *(hoặc `{ "name": "esp32-nursery-01" }`)*.
   - Backend sẽ cập nhật `selected_device_id = "1"` vào tài khoản người dùng trong CSDL.

### Bước 4: Hiển thị Dashboard
* Frontend gọi ngay endpoint tiện ích:
  `GET /api/v1/devices/me/readings/latest` (với Header `Authorization: Bearer <TOKEN>`).
* Backend tự động lấy số đo mới nhất của thiết bị mà user đang chọn mà **không cần hardcode mã thiết bị trong code Frontend**!

---

## 4. Danh mục Tất cả các API Endpoints trên Backend TDat

### 4.1. Bảng Tra cứu Nhanh

| Nhóm | Phương thức | Endpoint | Auth | Mục đích sử dụng |
| :--- | :---: | :--- | :---: | :--- |
| **Thiết bị** ⭐ | `GET` | `/devices` | Không | **Danh sách thiết bị (hỗ trợ `?search=...`, trả về trạng thái online & số đo)** |
| **Thiết bị** ⭐ | `GET` | `/devices/:id` | Không | **Xem thông tin chi tiết của 1 thiết bị bằng ID hoặc Name** |
| **Thiết bị** ⭐ | `POST` | `/devices` | Không | **Thêm/Đăng ký thiết bị mới vào hệ thống (ID, Name, Description)** |
| **Số đo** ⭐ | `GET` | `/devices/me/readings/latest` | Bearer | **Lấy số đo mới nhất của thiết bị người dùng đang chọn** |
| **Số đo** | `GET` | `/devices/:id/readings/latest` | Không | Lấy số đo mới nhất theo mã `id` (ví dụ `1`) hoặc `name` |
| **Số đo** | `GET` | `/devices/:id/readings?limit=20` | Không | Lấy nhanh N số đo gần nhất để vẽ đồ thị |
| **Số đo** ⭐ | `GET` | `/devices/:id/readings/range` | Không | **Lọc số đo theo khoảng ngày & giờ (`start_date`, `end_date`, `order`,...)** |
| **Người dùng** ⭐ | `PUT` | `/auth/me/device` *(hoặc `/users/me/device`)* | Bearer | **Lưu thiết bị hiển thị vào tài khoản người dùng** |
| **Tài khoản** | `POST` | `/auth/register` | Không | Đăng ký tài khoản người dùng mới |
| **Tài khoản** | `POST` | `/auth/login` | Không | Đăng nhập hệ thống lấy JWT Token |
| **Tài khoản** | `GET` | `/auth/me` | Bearer | Xem thông tin hồ sơ kèm `selected_device_id` và `device` |
| **Quy tắc** | `GET` | `/rules` | Không | Danh sách 24+ quy tắc chăm sóc đang hoạt động |
| **Quy tắc** | `POST/PUT/DELETE` | `/rules/:id` | Admin | Quản trị quy tắc chăm sóc nông học |
| **Hệ thống** | `GET` | `/health` | Không | Kiểm tra trạng thái máy chủ |

---

## 5. Chi tiết Request & Response các Endpoint Mới

### 5.1. Lấy Danh sách Thiết bị: `GET /api/v1/devices`
* **Query Parameters tùy chọn:** `search` (chuỗi tìm kiếm theo ID hoặc Tên).
* **Response (200 OK):**
```json
{
  "status": "ok",
  "total": 2,
  "devices": [
    {
      "device_id": "1",
      "name": "esp32-nursery-01",
      "description": "Trạm vườn ươm ớt (Sensor Data Bridge Channel 1)",
      "created_at": "2026-11-10T10:00:00.000Z",
      "is_online": true,
      "latest_reading": {
        "air_temperature_c": 32.7,
        "air_humidity_pct": 69.5,
        "soil_temperature_c": 32.0,
        "soil_moisture_pct": 45.0,
        "water_ph": 6.2,
        "water_tds_ppm": 580.0
      }
    },
    {
      "device_id": "esp32-stale-01",
      "name": "Trạm kiểm thử dữ liệu cũ",
      "description": "Trạm mô phỏng mất kết nối",
      "created_at": "2026-11-10T10:00:00.000Z",
      "is_online": false,
      "latest_reading": null
    }
  ]
}
```

---

### 5.2. Chọn Thiết bị cho Người dùng: `PUT /api/v1/auth/me/device`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "device_id": "1"
}
```
*(Hoặc có thể truyền tên: `{ "device_id": "esp32-nursery-01" }`)*
* **Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Device selected successfully",
  "user": {
    "id": 2,
    "username": "user",
    "full_name": "Kỹ thuật viên Vườn ươm",
    "role": "user",
    "selected_device_id": "1",
    "device": {
      "device_id": "1",
      "name": "esp32-nursery-01",
      "description": "Trạm vườn ươm ớt (Sensor Data Bridge Channel 1)"
    }
  }
}
```

---

### 5.3. Xem Hồ sơ Người dùng: `GET /api/v1/auth/me`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Response (200 OK):**
```json
{
  "status": "ok",
  "user": {
    "id": 2,
    "username": "user",
    "full_name": "Kỹ thuật viên Vườn ươm",
    "role": "user",
    "selected_device_id": "1",
    "device": {
      "device_id": "1",
      "name": "esp32-nursery-01",
      "description": "Trạm vườn ươm ớt (Sensor Data Bridge Channel 1)"
    }
  }
}
```

---

### 5.4. Lấy Số đo Mới nhất của Thiết bị User đã chọn: `GET /api/v1/devices/me/readings/latest`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Response (200 OK):**
```json
{
  "device_id": "1",
  "name": "esp32-nursery-01",
  "received_at": "2026-11-10T11:36:56.000Z",
  "is_stale": false,
  "reading": {
    "schema_version": "0.1",
    "device_id": "1",
    "sample_id": "sdb-entry-484",
    "recorded_at": "2026-11-10T11:36:56.000Z",
    "air_temperature_c": 25.0,
    "air_humidity_pct": 54.7,
    "soil_temperature_c": 23.19,
    "soil_moisture_pct": 0.0,
    "soil_moisture_raw": 4086,
    "water_ph": 4.21,
    "water_ph_adc_raw": 925,
    "water_tds_ppm": 58.5,
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
    "code": "RULE_PH_EXTREME_LOW",
    "message": "Nước tưới cực chua (Axit nặng): Tuyệt đối không tưới! Dùng nước vôi trong nâng pH lên 6.0-6.5.",
    "suggested_action": "Tuyệt đối không tưới! Dùng nước vôi trong nâng pH lên 6.0-6.5."
  }
}
```

---

### 5.5. Lọc Số đo theo Khoảng Ngày & Giờ: `GET /api/v1/devices/:id/readings/range`
* **Query Parameters:**
  * `start_date` (string, **bắt buộc**): Ngày bắt đầu `YYYY-MM-DD` (Ví dụ: `2026-11-08`)
  * `end_date` (string, **bắt buộc**): Ngày kết thúc `YYYY-MM-DD` (Ví dụ: `2026-11-10`)
  * `start_time` / `end_time` (string, optional): Giờ bắt đầu / kết thúc (`HH:MM` hoặc `HH:MM:SS`)
  * `order` (`desc` hoặc `asc`, default: `desc`): Dùng `asc` khi vẽ biểu đồ thời gian từ trái sang phải.
  * `page` (default: 1), `page_size` (default: 20, max: 100).

---

## 6. Code Mẫu Tích hợp Luồng Mới (JavaScript & Flutter)

### 6.1. Dành cho Web Frontend (DKhoa - JavaScript / ES Module)
Tạo file `src/services/api.js`:
```javascript
const BASE_URL = 'https://pepper-nursery-iot.onrender.com/api/v1';

// Lấy token từ bộ nhớ
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// 1. Đăng ký tài khoản
export async function register(username, password, fullName) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, full_name: fullName })
  });
  if (!res.ok) throw new Error('Đăng ký thất bại');
  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data.user;
}

// 2. Lấy danh sách thiết bị có sẵn để người dùng chọn
export async function getDevicesList(search = '') {
  const url = search ? `${BASE_URL}/devices?search=${encodeURIComponent(search)}` : `${BASE_URL}/devices`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Không thể tải danh sách thiết bị');
  const data = await res.json();
  return data.devices;
}

// 3. Người dùng chọn thiết bị (nhập ID "1" hoặc Tên "esp32-nursery-01")
export async function selectUserDevice(deviceIdOrName) {
  const res = await fetch(`${BASE_URL}/auth/me/device`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ device_id: deviceIdOrName })
  });
  if (!res.ok) throw new Error('Không thể chọn thiết bị này');
  return await res.json();
}

// 4. Lấy số đo thời gian thực của thiết bị người dùng đã chọn
export async function getLiveTelemetry() {
  const res = await fetch(`${BASE_URL}/devices/me/readings/latest`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Lỗi tải số đo');
  return await res.json();
}

// 5. Lọc số đo theo khoảng ngày để vẽ biểu đồ
export async function getTelemetryByRange(startDate, endDate) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    order: 'asc', // cũ trước, mới sau để vẽ trục hoành biểu đồ
    limit: 100
  });
  const res = await fetch(`${BASE_URL}/devices/me/readings/range?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Lỗi lọc dữ liệu');
  return await res.json();
}
```

---

### 6.2. Dành cho Mobile App (QThang - Flutter / Dart)
Tạo file `lib/services/nursery_api_service.dart`:
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class NurseryApiService {
  static const String baseUrl = 'https://pepper-nursery-iot.onrender.com/api/v1';
  static String? userToken;

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (userToken != null) 'Authorization': 'Bearer $userToken',
  };

  // 1. Tải danh sách thiết bị
  static Future<List<dynamic>> fetchDevices() async {
    final response = await http.get(Uri.parse('$baseUrl/devices'), headers: _headers);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['devices'];
    }
    throw Exception('Lỗi tải danh sách thiết bị');
  }

  // 2. Chọn thiết bị (ID hoặc Tên)
  static Future<Map<String, dynamic>> selectDevice(String deviceIdOrName) async {
    final response = await http.put(
      Uri.parse('$baseUrl/auth/me/device'),
      headers: _headers,
      body: jsonEncode({'device_id': deviceIdOrName}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Không thể liên kết thiết bị');
  }

  // 3. Lấy số đo mới nhất của thiết bị đã chọn
  static Future<Map<String, dynamic>> fetchLiveReading() async {
    final response = await http.get(
      Uri.parse('$baseUrl/devices/me/readings/latest'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Lỗi tải số đo thời gian thực');
  }
}
```

---

## 7. Bảng Mã Lỗi HTTP & Hướng Dẫn Xử Lý (Error Handling)

| Mã HTTP | Tên lỗi | Nguyên nhân phổ biến | Hướng xử lý ở Frontend / Mobile |
| :---: | :--- | :--- | :--- |
| **`200`** | OK | Truy vấn thành công | Cập nhật State và vẽ UI. |
| **`201`** | Created | Tạo tài khoản hoặc thiết bị thành công | Thông báo thành công và chuyển bước tiếp theo. |
| **`400`** | Bad Request | Thiếu `device_id` hoặc body không hợp lệ | Hiển thị thông báo kiểm tra lại thông tin nhập. |
| **`401`** | Unauthorized | Chưa đăng nhập hoặc Token hết hạn | Chuyển hướng về màn hình Đăng nhập. |
| **`403`** | Forbidden | Tài khoản `user` cố tình chỉnh sửa quy tắc của `admin` | Thông báo *"Bạn không có quyền thực hiện thao tác này"*. |
| **`404`** | Not Found | Thiết bị không tồn tại | Báo cho người dùng kiểm tra lại ID/Name hoặc bấm nút tạo mới. |
| **`422`** | Unprocessable | Sai định dạng ngày (`YYYY-MM-DD`) khi lọc | Validate định dạng ngày tháng ở client trước khi gọi API. |
| **`500`** | Internal Error| Lỗi kết nối tạm thời | Hiển thị thông báo hệ thống đang bảo trì và tự động thử lại. |

---
**Hỗ trợ kỹ thuật:** Mọi vướng mắc về API hoặc tích hợp, DKhoa và QThang hãy liên hệ trực tiếp TDat để được giải đáp ngay!
