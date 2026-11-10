# Hướng dẫn Tích hợp API Backend dành cho Frontend Web (DKhoa) & Mobile App (QThang)

**Dự án:** MVP Hệ thống Chăm sóc Vườn ươm Ớt con bằng IoT (`pepper-nursery-iot`)  
**Người phụ trách Backend:** TDat  
**Người sử dụng API:** DKhoa (Web Dashboard), QThang (Mobile App)  
**Phiên bản API:** `v1` (Chuẩn G0 v0.1)  
**Ngày cập nhật:** 10/11/2026  

---

## 1. Địa chỉ máy chủ API (Base URL)

* **Production (Render Cloud):** `https://pepper-nursery-iot.onrender.com/api/v1`
* **Local Development:** `http://localhost:8000/api/v1`
* **Kiểm tra trạng thái máy chủ:** `GET https://pepper-nursery-iot.onrender.com/api/v1/health`

> [!NOTE]
> Backend đã được cấu hình sẵn **CORS whitelist** cho tên miền Render của Web Frontend: `https://pepper-nursery-iot-em0t.onrender.com` cũng như các môi trường phát triển cục bộ (`localhost`, `127.0.0.1`). Bạn có thể gọi API trực tiếp từ trình duyệt mà không bị chặn cross-origin.

---

## 2. Kiến trúc Luồng Dữ liệu & Giải đáp: "Có thể bỏ qua lưu vào Database không?"

### 2.1. Luồng dữ liệu 2 tầng của toàn hệ thống
$$\text{ESP32 (QTien)} \xrightarrow{\text{Wi-Fi}} \text{Sensor Data Bridge (Kênh 1)} \xrightarrow[\text{In-Memory Cache}]{\text{Worker 20s}} \text{Backend TDat} \xrightarrow{\text{REST JSON}} \text{Web (DKhoa) / Mobile (QThang)}$$

### 2.2. Giải đáp việc lưu vào Database MySQL (Aiven Cloud):
* **Số đo cảm biến (`readings`):** 
  - **CÓ THỂ BỎ QUA LƯU VÀO DATABASE!** Do cổng trung gian **Sensor Data Bridge** đã tự động ghi nhớ toàn bộ các bản ghi đo từ lúc thiết bị ESP32 bật nguồn. 
  - Backend TDat có thể hoạt động hoàn toàn dựa trên **Bộ nhớ đệm (In-Memory Cache)** được tự động nạp từ Sensor Data Bridge (tùy chỉnh qua biến `SAVE_READINGS_TO_DB=false` trong `.env`), giúp phản hồi API cho Web/App siêu nhanh (< 5ms) và tiết kiệm dung lượng CSDL cloud.
* **Những phần BẮT BUỘC vẫn cần Database MySQL:**
  1. **Tài khoản người dùng (`users`):** Lưu trữ định danh, mật khẩu mã hóa bcrypt cho 2 vai trò `admin` và `user`.
  2. **Quy tắc chăm sóc cây (`care_rules`):** Lưu trữ 24+ quy tắc nông học động do Admin thêm/sửa/xóa trực tiếp từ giao diện Admin Console.

---

## 3. Tại sao Web và Mobile nên gọi qua Backend TDat?

Mặc dù Web và Mobile có thể gọi trực tiếp tới Sensor Data Bridge qua `X-API-Key: sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw`, **Frontend Web và Mobile ĐƯỢC KHUYẾN NGHỊ 100% GỌI QUA BACKEND TDAT** vì các lý do cốt lõi sau:

1. **Lời khuyên sinh học tự động (`advice`):**
   - Sensor Data Bridge chỉ chứa các con số thô (`field1..field8`).
   - Chỉ có Backend TDat mới có **Động cơ Quy tắc Nông học 5 phân vùng** của MThuy (`docs/agronomy/quy-tac-cham-soc-v0.1.md`) để phân tích và trả về lời khuyên chính xác: `{ status: "optimal"|"warning"|"danger", code, message, suggested_action }`.
2. **Cảnh báo trạm mất liên lạc / dữ liệu cũ (`is_stale`):**
   - Backend tự động so khớp `recorded_at` với thời gian thực. Nếu quá 5 phút chưa có số đo mới, cờ `is_stale: true` bật lên để giao diện gắn nhãn cảnh báo vàng cho nông dân.
3. **Tên trường rõ ràng và trạng thái từng cảm biến:**
   - Thay vì `field1..field8`, Backend trả về: `air_temperature_c`, `air_humidity_pct`, `soil_temperature_c`, `soil_moisture_pct`, `water_ph`, `water_tds_ppm`.
   - Cung cấp chi tiết trạng thái từng cảm biến trong `sensor_status`: `ok`, `read_error`, `not_calibrated`.
4. **Phân quyền và bảo mật:**
   - Hỗ trợ đăng nhập `admin` và `user` qua JWT Token.
   - Ẩn toàn bộ API key trung gian, không lo bị lộ key trong mã nguồn client.

---

## 4. Bảng Tra cứu Chi tiết các Endpoints cho Web & App

| Chức năng | Phương thức | Endpoint | Header yêu cầu | Ý nghĩa phản hồi |
| :--- | :---: | :--- | :--- | :--- |
| **Kiểm tra máy chủ** | `GET` | `/health` | Không | `status: "ok"` |
| **Số đo mới nhất** | `GET` | `/devices/:id/readings/latest` | Không | Toàn bộ 5 cảm biến, cờ `is_stale`, lời khuyên `advice` |
| **Lịch sử đo đạc** | `GET` | `/devices/:id/readings?limit=20` | Không | Mảng các số đo giảm dần theo thời gian (vẽ đồ thị) |
| **Đăng nhập** | `POST` | `/auth/login` | Content-Type: application/json | Cấp JWT Token và thông tin `user` (`admin` hoặc `user`) |
| **Kiểm tra phiên** | `GET` | `/auth/me` | `Authorization: Bearer <token>` | Trả về thông tin người dùng đang đăng nhập |
| **Xem quy tắc chăm sóc**| `GET` | `/rules` | Không | Danh sách các quy tắc chăm sóc đang kích hoạt |
| **Thêm quy tắc mới** | `POST` | `/rules` | `Authorization: Bearer <admin_token>` | Thêm quy tắc chăm sóc mới (Chỉ Admin) |
| **Sửa quy tắc** | `PUT` | `/rules/:id` | `Authorization: Bearer <admin_token>` | Chỉnh sửa ngưỡng và lời khuyên (Chỉ Admin) |
| **Xóa quy tắc** | `DELETE`| `/rules/:id` | `Authorization: Bearer <admin_token>` | Xóa quy tắc khỏi hệ thống (Chỉ Admin) |
| **Trạng thái Bridge Worker**| `GET` | `/sync/bridge/status` | Không | Xem trạng thái kết nối tới Sensor Data Bridge |
| **Ép đồng bộ tức thời** | `POST` | `/sync/bridge` | Không | Ép kéo số đo mới nhất ngay lập tức |

---

## 5. Cấu trúc Payload Chi tiết

### 5.1. Phản hồi Số đo Mới nhất (`GET /api/v1/devices/esp32-nursery-01/readings/latest`)
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

### 5.2. Hướng dẫn hiển thị Banner lời khuyên (`CareAdviceBanner`)
- Khi `is_stale: true`: Hiển thị màu **vàng hổ phách (Warning)**: *"Dữ liệu từ thiết bị đã cũ quá 5 phút hoặc trạm mất liên lạc. Hệ thống tạm dừng đưa ra lời khuyên chăm sóc."*
- Khi `advice.status === 'danger'`: Hiển thị màu **đỏ san hô (Danger)**, hiển thị `{advice.message}` và `{advice.suggested_action}`.
- Khi `advice.status === 'warning'`: Hiển thị màu **vàng cam (Warning)**.
- Khi `advice.status === 'optimal'` hoặc `advice === null`: Hiển thị màu **xanh mạ (Optimal)**: *"Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng."*

---

## 6. Code mẫu Tích hợp (JavaScript / Fetch)

```javascript
const BASE_URL = 'https://pepper-nursery-iot.onrender.com/api/v1';
const DEVICE_ID = 'esp32-nursery-01';

// 1. Lấy dữ liệu thời gian thực
export async function fetchLiveTelemetry() {
  const res = await fetch(`${BASE_URL}/devices/${DEVICE_ID}/readings/latest`);
  if (!res.ok) throw new Error('Không thể tải số đo mới nhất');
  return await res.json();
}

// 2. Lấy dữ liệu lịch sử để vẽ 2 đồ thị nhiệt độ và độ ẩm
export async function fetchHistoryTelemetry(limit = 20) {
  const res = await fetch(`${BASE_URL}/devices/${DEVICE_ID}/readings?limit=${limit}`);
  if (!res.ok) throw new Error('Không thể tải lịch sử');
  const data = await res.json();
  return data.readings;
}

// 3. Đăng nhập Quản trị viên
export async function loginAdmin(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Sai tài khoản hoặc mật khẩu');
  return await res.json(); // Trả về { token, user }
}
```

---

## 7. Phương án Dự phòng Gọi Trực tiếp Sensor Data Bridge

Trong trường hợp Backend TDat đang deploy lại hoặc bảo trì, Frontend Web hoặc App có thể đọc trực tiếp các feed từ Sensor Data Bridge:
* **Endpoint:** `GET https://sensor-data-bridge-backend.onrender.com/api/v1/channels/1/feeds?limit=20`
* **Header:** `X-API-Key: sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw`
* **Bảng quy đổi Field:**
  - `field1`: Nhiệt độ không khí (°C)
  - `field2`: Độ ẩm không khí (%)
  - `field3`: Nhiệt độ đất (°C)
  - `field4`: Độ ẩm đất (%)
  - `field5`: Độ pH nước tưới
  - `field6`: TDS nước tưới (ppm)
  - `field7`: ADC thô độ ẩm đất
  - `field8`: ADC thô độ pH

