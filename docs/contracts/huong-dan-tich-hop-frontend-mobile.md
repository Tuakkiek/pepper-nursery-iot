# Hướng dẫn Tích hợp API Backend dành cho Frontend Web (DKhoa) & Mobile App (QThang)

**Dự án:** MVP Hệ thống Chăm sóc Vườn ươm Ớt con bằng IoT (`pepper-nursery-iot`)  
**Người phụ trách Backend:** TDat  
**Người sử dụng API:** DKhoa (Web Dashboard), QThang (Mobile App Flutter)  
**Phiên bản API:** `v1` (Đồng bộ theo tài liệu `API_ENDPOINTS.md` ngày 10/11/2026)  
**Tình trạng:** Sẵn sàng kết nối & đã cấu hình CORS  

---

## 1. Địa chỉ Máy chủ (Base URL) & Hạ tầng Kết nối

### 1.1. Backend TDat (Primary - Khuyến nghị 100%)
* **Production (Render Cloud):** `https://pepper-nursery-iot.onrender.com/api/v1`
* **Local Development:** `http://localhost:8000/api/v1`
* **Health Check:** `GET https://pepper-nursery-iot.onrender.com/api/v1/health`

> [!NOTE]
> Backend đã được kích hoạt sẵn **CORS whitelist** cho tên miền Render của Web Frontend: `https://pepper-nursery-iot-em0t.onrender.com` cũng như các môi trường localhost (`http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:8080`). Web Frontend có thể gọi fetch/axios trực tiếp từ trình duyệt mà không lo bị lỗi Cross-Origin.

### 1.2. Sensor Data Bridge (Cầu nối trung gian IoT - Kênh 1)
* **API Base URL:** `https://sensor-data-bridge-backend.onrender.com/api/v1` *(hoặc `https://sensor-data-bridge.onrender.com/api/v1`)*
* **Frontend Quản lý Kênh:** `https://sensor-data-bridge-frontened.onrender.com`
* **Interactive API Docs (Swagger UI):** `https://sensor-data-bridge-backend.onrender.com/docs`
* **Channel ID:** `1`
* **Read API Key:** `sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw` (Gửi qua header `X-API-Key`)

---

## 2. Luồng Dữ liệu Toàn hệ thống & Bỏ qua Lưu vào Database

### 2.1. Sơ đồ luồng dữ liệu 2 tầng
$$\text{ESP32 (QTien)} \xrightarrow{\text{Wi-Fi HTTP}} \text{Sensor Data Bridge (Kênh 1)} \xrightarrow[\text{In-Memory Cache (20s)}]{\text{Worker Sync}} \text{Backend TDat} \xrightarrow{\text{REST JSON + Advice Engine}} \text{Web / App}$$

### 2.2. Giải đáp việc lưu vào Database MySQL:
* **Số đo cảm biến (`readings`): ĐÃ BỎ QUA LƯU VÀO DATABASE!**
  - Cổng **Sensor Data Bridge** đã tự động lưu trữ toàn bộ các feeds đo đạc từ thời điểm bật ESP32.
  - Backend TDat hoạt động dựa trên cơ chế **In-Memory Cache & Proxy Fallback** (qua cờ `SAVE_READINGS_TO_DB=false` trong `.env`).
  - **Lợi ích:** Tốc độ phản hồi API cho Web và Mobile siêu tốc (< 5ms), không tốn dung lượng và không sợ vượt hạn ngạch gói miễn phí MySQL Aiven Cloud.
* **Những phần BẮT BUỘC vẫn lưu trong Database:**
  1. **Tài khoản người dùng (`users`):** Lưu định danh, mật khẩu mã hóa bcrypt cho 2 vai trò `admin` và `user`.
  2. **Quy tắc chăm sóc vườn ươm (`care_rules`):** Lưu trữ 24+ quy tắc nông học động do Admin thêm/sửa/xóa trực tiếp từ giao diện Admin Console.

---

## 3. Tại sao Web & Mobile nên ưu tiên gọi qua Backend TDat?

Mặc dù Client có thể gọi trực tiếp tới Sensor Data Bridge qua `X-API-Key: sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw`, **Frontend Web và Mobile được khuyến nghị gọi qua Backend TDat** vì 4 lợi ích độc quyền:

1. **Động cơ Phân tích Lời khuyên Nông học 5 phân vùng (`advice`):**
   - Sensor Data Bridge chỉ chứa các con số vô tri (`field1..field8`).
   - Backend TDat tự động phân tích qua bộ quy tắc sinh học của MThuy (`docs/agronomy/quy-tac-cham-soc-v0.1.md`) để trả về lời khuyên chi tiết:
     ```json
     {
       "status": "danger",
       "priority": 2,
       "code": "RULE_TEMP_EXTREME_HIGH",
       "message": "Nhiệt độ không khí cực cao: Kéo lưới che 70% nắng, bật phun sương mái làm mát...",
       "suggested_action": "Kéo lưới che 70% nắng, bật phun sương mái làm mát."
     }
     ```
2. **Cảnh báo mất liên lạc trạm đo (`is_stale`):**
   - Backend tự động so khớp `recorded_at` với đồng hồ thực tế. Nếu quá 5 phút chưa có số đo mới, cờ `is_stale: true` bật lên để giao diện cảnh báo nông dân.
3. **Chuẩn hóa tên trường & trạng thái cảm biến:**
   - Thay vì `field1..field8`, Backend cung cấp rõ ràng: `air_temperature_c`, `air_humidity_pct`, `soil_temperature_c`, `soil_moisture_pct`, `water_ph`, `water_tds_ppm`.
   - Bổ sung `sensor_status`: `{ dht22: "ok", hd38: "ok", ds18b20: "ok", tds: "ok", ph4502c: "ok" }`.
4. **Bảo mật và phân quyền:**
   - Ẩn toàn bộ Read API Key trung gian, hỗ trợ xác thực JWT và bảo vệ quyền quản trị quy tắc chăm sóc.

---

## 4. Danh mục Tất cả các API Endpoints trên Backend TDat

### 4.1. Bảng Tra cứu Nhanh

| Mục đích | Phương thức | Endpoint | Headers | Ý nghĩa phản hồi |
| :--- | :---: | :--- | :--- | :--- |
| **Kiểm tra máy chủ** | `GET` | `/health` | Không | `status: "ok"` |
| **Số đo mới nhất** | `GET` | `/devices/:id/readings/latest` | Không | Toàn bộ 5 cảm biến, cờ `is_stale`, lời khuyên `advice` |
| **Lấy nhanh N số đo gần nhất** | `GET` | `/devices/:id/readings?limit=20` | Không | Danh sách N số đo mới nhất để vẽ đồ thị |
| **Lọc theo khoảng ngày & giờ** ⭐ | `GET` | `/devices/:id/readings/range` | Không | Lọc số đo theo `start_date`, `end_date`, phân trang |
| **Đăng nhập** | `POST` | `/auth/login` | `Content-Type: application/json` | Cấp JWT Token và thông tin `user` (`admin` hoặc `user`) |
| **Xem hồ sơ cá nhân** | `GET` | `/auth/me` | `Authorization: Bearer <token>` | Trả về thông tin người dùng đang đăng nhập |
| **Danh sách Quy tắc Chăm sóc** | `GET` | `/rules` | Không | Danh sách tất cả 24+ quy tắc chăm sóc đang kích hoạt |
| **Thêm quy tắc mới** | `POST` | `/rules` | `Authorization: Bearer <token>` | Thêm quy tắc chăm sóc mới (Chỉ Admin) |
| **Cập nhật quy tắc** | `PUT` | `/rules/:id` | `Authorization: Bearer <token>` | Chỉnh sửa ngưỡng và lời khuyên (Chỉ Admin) |
| **Xóa quy tắc** | `DELETE`| `/rules/:id` | `Authorization: Bearer <token>` | Xóa quy tắc khỏi hệ thống (Chỉ Admin) |
| **Trạng thái Bridge Sync** | `GET` | `/sync/bridge/status` | Không | Trạng thái worker kéo dữ liệu từ Sensor Bridge |
| **Ép đồng bộ tức thời** | `POST` | `/sync/bridge` | Không | Ép worker kéo số đo mới nhất ngay lập tức |

---

## 5. Chi tiết Request & Response các Endpoint Trọng tâm

### 5.1. Số đo mới nhất: `GET /api/v1/devices/{device_id}/readings/latest`
* **Mã thiết bị mặc định:** `esp32-nursery-01`
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
    "message": "Nhiệt độ không khí cực cao: Kéo lưới che 70% nắng, bật phun sương mái làm mát. | Nước tưới cực chua: Dùng nước vôi trong nâng pH lên 6.0-6.5.",
    "suggested_action": "Kéo lưới che 70% nắng, bật phun sương mái làm mát."
  }
}
```

---

### 5.2. Endpoint Chuyên biệt Lọc theo Khoảng Ngày & Giờ: `GET /api/v1/devices/{device_id}/readings/range`
*(Đồng bộ 100% với mục 3.3.4 trong `API_ENDPOINTS.md`)*

* **Query Parameters bắt buộc:**
  * `start_date` (string, **bắt buộc**): Ngày bắt đầu `YYYY-MM-DD` (Ví dụ: `2026-11-08`)
  * `end_date` (string, **bắt buộc**): Ngày kết thúc `YYYY-MM-DD` (Ví dụ: `2026-11-10`)
* **Query Parameters tùy chọn:**
  * `start_time` (string, mặc định: `00:00:00`): Giờ bắt đầu (`HH:MM` hoặc `HH:MM:SS`, ví dụ: `08:00`)
  * `end_time` (string, mặc định: `23:59:59`): Giờ kết thúc (`HH:MM` hoặc `HH:MM:SS`, ví dụ: `17:30`)
  * `tz` (string, mặc định: `+07:00`): Múi giờ địa phương (Việt Nam `+07:00`)
  * `page` (int, mặc định: `1`): Số trang
  * `page_size` (int, mặc định: `20`, tối đa `100`): Số bản ghi mỗi trang
  * `limit` (int, optional): Lấy nhanh N bản ghi trong khoảng thời gian này
  * `order` (`desc` hoặc `asc`, mặc định: `desc`): `desc` là mới nhất ở đầu, `asc` là cũ nhất ở đầu (rất tiện khi render trục hoành biểu đồ từ trái qua phải)

* **Response (200 OK):**
```json
{
  "device_id": "esp32-nursery-01",
  "start_date": "2026-11-08",
  "end_date": "2026-11-10",
  "total": 142,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "readings": [
    {
      "reading": {
        "schema_version": "0.1",
        "device_id": "esp32-nursery-01",
        "sample_id": "sdb-entry-113",
        "recorded_at": "2026-11-08T06:14:53.000Z",
        "air_temperature_c": 32.7,
        "air_humidity_pct": 69.5,
        "soil_temperature_c": 32.0,
        "soil_moisture_pct": 45.0,
        "water_ph": 6.2,
        "water_tds_ppm": 580.0,
        "sensor_status": {
          "dht22": "ok",
          "ds18b20": "ok",
          "hd38": "ok",
          "tds": "ok",
          "ph4502c": "ok"
        }
      },
      "received_at": "2026-11-08T06:14:53.000Z"
    }
  ]
}
```

> [!TIP]
> Bạn cũng có thể gọi thẳng endpoint quen thuộc `GET /api/v1/devices/{device_id}/readings?start_date=2026-11-08&end_date=2026-11-10`. Backend TDat sẽ tự động kích hoạt bộ lọc khoảng ngày tương đương!

---

### 5.3. Hướng dẫn Hiển thị Thanh Lời khuyên Nông học (`CareAdviceBanner`)
Frontend Web và Mobile nên thiết kế component Banner dựa theo logic:
* **Khi `is_stale === true`:** Hiển thị màu **vàng hổ phách (Warning)**: *"Dữ liệu từ thiết bị đã cũ quá 5 phút hoặc trạm mất liên lạc. Hệ thống tạm dừng cập nhật lời khuyên chăm sóc."*
* **Khi `advice.status === 'danger'`:** Hiển thị màu **đỏ san hô (Danger)** kèm icon cảnh báo: Hiển thị nội dung `advice.message` và `advice.suggested_action`.
* **Khi `advice.status === 'warning'`:** Hiển thị màu **vàng cam (Warning)**: Cần chú ý điều chỉnh nước tưới hoặc che nắng.
* **Khi `advice.status === 'optimal'` hoặc `advice === null`:** Hiển thị màu **xanh lá mạ (Optimal)**: *"Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng."*

---

## 6. Code Mẫu Tích hợp Toàn diện (Web JavaScript & Mobile Flutter)

### 6.1. Dành cho Web Frontend (DKhoa - JavaScript / ES Module)
Tạo file `src/services/api.js`:
```javascript
const BASE_URL = 'https://pepper-nursery-iot.onrender.com/api/v1';
const DEVICE_ID = 'esp32-nursery-01';

// 1. Lấy dữ liệu thời gian thực & lời khuyên chăm sóc
export async function getLiveTelemetry() {
  const res = await fetch(`${BASE_URL}/devices/${DEVICE_ID}/readings/latest`);
  if (!res.ok) throw new Error(`Lỗi tải số đo: ${res.status}`);
  return await res.json();
}

// 2. Lấy 20 số đo gần nhất để vẽ đồ thị nhanh
export async function getRecentHistory(limit = 20) {
  const res = await fetch(`${BASE_URL}/devices/${DEVICE_ID}/readings?limit=${limit}`);
  if (!res.ok) throw new Error(`Lỗi tải lịch sử: ${res.status}`);
  const data = await res.json();
  return data.readings;
}

// 3. Lọc số đo theo khoảng ngày và giờ (cho bộ chọn datepicker của Web)
export async function getTelemetryByRange({ startDate, endDate, startTime = '00:00', endTime = '23:59', order = 'asc' }) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    order: order, // 'asc' để dữ liệu cũ vẽ trước, mới vẽ sau trên trục X
    limit: 100
  });

  const res = await fetch(`${BASE_URL}/devices/${DEVICE_ID}/readings/range?${params.toString()}`);
  if (!res.ok) throw new Error(`Lỗi lọc dữ liệu: ${res.status}`);
  return await res.json();
}

// 4. Đăng nhập Admin
export async function loginAdmin(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Đăng nhập thất bại');
  return await res.json(); // { token, user: { id, username, role } }
}
```

---

### 6.2. Dành cho Mobile App (QThang - Flutter / Dart)
Tạo file `lib/services/iot_api_service.dart`:
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class IotApiService {
  static const String baseUrl = 'https://pepper-nursery-iot.onrender.com/api/v1';
  static const String deviceId = 'esp32-nursery-01';

  // 1. Lấy số đo mới nhất
  static Future<Map<String, dynamic>> fetchLatestReading() async {
    final response = await http.get(Uri.parse('$baseUrl/devices/$deviceId/readings/latest'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Không thể tải số đo mới nhất: ${response.statusCode}');
    }
  }

  // 2. Lọc số đo theo khoảng ngày để vẽ biểu đồ
  static Future<Map<String, dynamic>> fetchReadingsByRange({
    required String startDate,
    required String endDate,
    String startTime = '00:00:00',
    String endTime = '23:59:59',
    String order = 'asc',
  }) async {
    final queryParams = {
      'start_date': startDate,
      'end_date': endDate,
      'start_time': startTime,
      'end_time': endTime,
      'order': order,
      'page_size': '50',
    };

    final uri = Uri.parse('$baseUrl/devices/$deviceId/readings/range').replace(queryParameters: queryParams);
    final response = await http.get(uri);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Không thể lọc dữ liệu: ${response.statusCode}');
    }
  }
}
```

---

## 7. Phương án Dự phòng: Gọi Trực tiếp Sensor Data Bridge

Trong trường hợp Backend TDat đang bảo trì, Web và App có thể đọc dữ liệu trực tiếp từ Sensor Data Bridge theo chuẩn quy định tại `API_ENDPOINTS.md`:

### 7.1. Bảng quy đổi 8 Trường Dữ liệu (Field Mapping)
| Field | Tên thông số | Đơn vị | Cảm biến vật lý |
| :---: | :--- | :---: | :--- |
| `field1` | Nhiệt độ không khí | °C | DHT22 |
| `field2` | Độ ẩm không khí | % | DHT22 |
| `field3` | Nhiệt độ đất (giá thể) | °C | DS18B20 |
| `field4` | Độ ẩm đất (giá thể) | % | Cảm biến HD38 |
| `field5` | Độ pH dung dịch nước tưới | pH | Cảm biến pH-4502C |
| `field6` | Tổng chất rắn hòa tan (TDS) | ppm | Cảm biến TDS v1.0 |
| `field7` | Giá trị ADC thô độ ẩm đất | Raw (0-4095) | ADC ESP32 |
| `field8` | Giá trị ADC thô độ pH | Raw (0-4095) | ADC ESP32 |

### 7.2. Code mẫu gọi trực tiếp bằng cURL
```bash
# Lấy 20 feeds mới nhất
curl -X GET "https://sensor-data-bridge-backend.onrender.com/api/v1/channels/1/feeds?limit=20" \
     -H "X-API-Key: sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw" \
     -H "Accept: application/json"
```

---

## 8. Bảng Mã Lỗi HTTP & Hướng Dẫn Xử Lý (Error Handling)

*(Đồng bộ theo Mục 5 của tài liệu `API_ENDPOINTS.md`)*

| Mã HTTP | Tên lỗi | Nguyên nhân phổ biến | Hướng xử lý ở Frontend / Mobile |
| :---: | :--- | :--- | :--- |
| **`200`** | OK | Truy vấn thành công | Parse JSON và cập nhật State giao diện. |
| **`201`** | Created | Thêm mới bản ghi/quy tắc thành công | Đóng modal và hiển thị Toast thông báo thành công. |
| **`400`** | Bad Request | Dữ liệu gửi lên sai cú pháp | Kiểm tra lại body JSON. |
| **`401`** | Unauthorized | Chưa đăng nhập hoặc Token JWT hết hạn | Chuyển hướng người dùng về màn hình Đăng nhập. |
| **`403`** | Forbidden | Tài khoản thường (user) cố tình sửa quy tắc của Admin | Hiển thị thông báo *"Bạn không có quyền thực hiện hành động này"*. |
| **`404`** | Not Found | `device_id` hoặc đường dẫn API không tồn tại | Kiểm tra lại mã `device_id` (mặc định: `esp32-nursery-01`). |
| **`422`** | Unprocessable | Sai định dạng ngày (`YYYY-MM-DD`), thiếu `start_date` hoặc `start_date > end_date` | Validate định dạng ngày ở client trước khi gọi API. |
| **`500`** | Internal Error| Sự cố máy chủ tạm thời | Hiển thị thông báo *"Hệ thống đang bảo trì, vui lòng thử lại sau"* và retry sau 5 giây. |

---
**Ghi chú liên hệ:** Nếu DKhoa hoặc QThang gặp bất kỳ vướng mắc gì khi kết nối API, hãy nhắn TDat để được hỗ trợ kiểm tra logs trực tiếp!
