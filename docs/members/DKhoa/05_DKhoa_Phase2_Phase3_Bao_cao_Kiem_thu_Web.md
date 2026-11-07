# Báo cáo Nghiệm thu Phase 2 & Phase 3 — Web Dashboard (React + Vite)

* **Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT
* **Người thực hiện:** DKhoa (Phụ trách Web Dashboard)
* **Công nghệ:** React 19, Vite, Lucide Icons
* **Phiên bản:** Phase 2 & 3 (G0 v0.1)
* **Backend tích hợp:** `https://pepper-nursery-iot.onrender.com` (TDat) & ThingSpeak Channel `3543608`
* **Ngày hoàn thiện:** 2026-11-07

---

## 1. Tổng quan Kiến trúc & Chuyển đổi Công nghệ

Web Dashboard đã được nâng cấp toàn diện sang nền tảng **React 19 + Vite** nhằm đạt hiệu năng render cao, cấu trúc component hóa sạch sẽ, quản lý state linh hoạt và tối ưu trải nghiệm người dùng theo Single Page Application (SPA).

### Cấu trúc 3 phân hệ chính:
1. **📊 Giám sát vườn ươm (Live Monitor):**
   - Tiêu đề thông tin trạm (`DeviceStatusHero`): phân biệt `recorded_at` (ESP32) vs `received_at` (Backend) theo múi giờ GMT+7.
   - Banner khuyến nghị chăm sóc (`CareAdviceBanner`): hiển thị kết quả quy tắc sinh học do Backend tính toán theo phê duyệt của MThuy.
   - Lưới 6 thẻ cảm biến (`MetricGrid`): Nhiệt độ/Độ ẩm không khí (DHT22), Nhiệt độ đất (DS18B20), Độ ẩm đất (HD-38), TDS và pH mẫu nước tưới/dinh dưỡng.
   - Lịch sử & Xu hướng (`HistorySection`): Biểu đồ SVG kép 2 panels độc lập (tách biệt hoàn toàn trục °C và trục %) và Bảng số đo chi tiết.
2. **⚙️ Quản trị quy tắc Admin (Admin Console):**
   - Quản lý CRUD toàn diện bảng `rules` (`POST`, `GET`, `PUT`, `DELETE /api/v1/rules`).
   - Tìm kiếm, lọc theo thông số cảm biến, lọc theo trạng thái kích hoạt, công tắc bật/tắt nhanh `is_active`.
   - Giám sát ThingSpeak Polling Worker và nút kích hoạt đồng bộ tức thời (`POST /api/v1/sync/thingspeak`).
3. **🧪 Phòng Thử Nghiệm G0 (Contract Sandbox):**
   - Hỗ trợ đối soát trực quan 8 kịch bản biên G0 v0.1 với 1 click kích hoạt.

---

## 2. Kết quả Đối chiếu Ma trận Kiểm thử G0 (21/21 Ca Đạt)

### 2.1. Kiểm thử Schema & Quy tắc Hiển thị (Phase 1 Fixture Test — 7/7 Đạt)
Chạy bằng lệnh: `npm test` trong thư mục `web/`.

| Mã ca | Kịch bản kiểm tra | Kết quả mong đợi | Kết quả Web Dashboard | Đánh giá |
| :--- | :--- | :--- | :--- | :---: |
| **G0-01** | Năm cảm biến hợp lệ (`latest-normal.json`) | Hiện đủ 5 cảm biến, đơn vị chuẩn, `advice: null` | Pass (Đầy đủ số đo °C, %, ppm, pH) | **ĐẠT** |
| **G0-02** | Cảm biến chưa hiệu chuẩn (`latest-uncalibrated.json`) | Giữ số thô ADC, TUYỆT ĐỐI không gắn %, ppm, pH | Pass (Gắn nhãn `Chưa hiệu chuẩn`, hiện `ADC thô`) | **ĐẠT** |
| **G0-03** | Lỗi một cảm biến (`latest-partial-error.json`) | Ô lỗi hiện `—`, cảm biến khác giữ số đo | Pass (DHT22 lỗi không ảnh hưởng DS18B20/pH) | **ĐẠT** |
| **G0-04** | Trạm mất liên lạc / Cũ (`latest-stale.json`) | Nhận diện cờ `is_stale: true`, tạm dừng advice | Pass (Hiện badge `⚠️ Dữ liệu cũ (> 5 phút)`) | **ĐẠT** |
| **G0-05** | Trạm chưa có số đo (`latest-empty.json`) | Hộp trạng thái rỗng, không tự tạo số 0 giả | Pass (Hiện thông báo chưa có dữ liệu) | **ĐẠT** |
| **G0-06** | Số đo hợp lệ bằng 0 (`zero_valid`) | Hiện `0.0` như giá trị thật, khác biệt với `null` | Pass (Quy tắc `0 != null` được kiểm chứng) | **ĐẠT** |
| **G0-07** | Nhận định chăm sóc (`with_advice`) | Hiển thị thông điệp cảnh báo từ Backend | Pass (Hiển thị đúng câu chữ và mức độ cảnh báo) | **ĐẠT** |

### 2.2. Kiểm thử Tích hợp Web <-> Backend Cloud Render (Phase 3 Integration Test — 14/14 Đạt)
Chạy bằng lệnh: `npm run test:integration` trong thư mục `web/`.

| Ca | Mục kiểm tra | Endpoint API | Kết quả thực tế | Đánh giá |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Backend Health Check | `GET /api/v1/health` | 200 OK (`status: ok`) | **ĐẠT** |
| **2** | Đọc trạm chuẩn | `GET /api/v1/devices/esp32-nursery-01/readings/latest` | 200 OK (Đọc số đo mới nhất thành công) | **ĐẠT** |
| **3** | Cờ `is_stale` trạm cũ | `GET /api/v1/devices/esp32-stale-01/readings/latest` | 200 OK (`is_stale: true`) | **ĐẠT** |
| **4** | Trạm chưa có dữ liệu | `GET /api/v1/devices/esp32-empty-01/readings/latest` | 200 OK (`reading: null`) | **ĐẠT** |
| **5** | Trạm không tồn tại | `GET /api/v1/devices/esp32-unknown/readings/latest` | 404 (`device_not_found`) | **ĐẠT** |
| **6** | Lịch sử 20 số đo | `GET /api/v1/devices/esp32-nursery-01/readings?limit=20`| 200 OK (Trả về mảng readings) | **ĐẠT** |
| **7** | Đăng nhập Admin | `POST /api/v1/auth/login` | 200 OK (Cấp JWT token role admin) | **ĐẠT** |
| **8** | Đăng nhập Kỹ thuật | `POST /api/v1/auth/login` | 200 OK (Cấp JWT token role user) | **ĐẠT** |
| **9** | Xác thực phiên | `GET /api/v1/auth/me` | 200 OK (Xác thực người dùng Quản trị viên) | **ĐẠT** |
| **10**| Đọc Care Rules | `GET /api/v1/rules?all=true` | 200 OK (Lấy 10 quy tắc sinh học) | **ĐẠT** |
| **11**| Admin thêm quy tắc | `POST /api/v1/rules` | 201 Created (Tạo thành công quy tắc mới) | **ĐẠT** |
| **12**| Admin sửa quy tắc | `PUT /api/v1/rules/:id` | 200 OK (Cập nhật ngưỡng thành công) | **ĐẠT** |
| **13**| Admin xóa quy tắc | `DELETE /api/v1/rules/:id` | 200 OK (Xóa an toàn quy tắc kiểm thử) | **ĐẠT** |
| **14**| ThingSpeak Worker | `GET /api/v1/sync/thingspeak/status` | 200 OK (Đọc trạng thái kênh 3543608) | **ĐẠT** |

---

## 3. Bàn giao và Đóng gói (Phase 5)

1. **Khởi chạy phát triển:**
   ```bash
   cd web
   npm run dev
   ```
2. **Kiểm tra tự động trước khi nộp đồ án:**
   ```bash
   npm test
   npm run test:integration
   ```
3. **Đóng gói production build:**
   ```bash
   npm run build
   ```
   *(Thư mục `dist/` sẵn sàng deploy lên Vercel, Netlify hoặc Render Static Site).*

---

## 4. Tình trạng Phối hợp Liên nhóm & Ghi chú Điểm nghẽn

* **Với TDat (Backend):** Tích hợp hoàn tất 100% (REST API, Auth JWT, Care Rules CRUD, ThingSpeak Sync).
* **Với MThuy (Agronomy):** Giao diện tuân thủ nguyên tắc chỉ hiển thị kết quả từ Backend `advice`, không tự tính toán ngưỡng riêng ở client.
* **Với QThang (Mobile):** Đang chờ QThang đẩy mã nguồn ứng dụng Mobile lên thư mục `mobile/` để tiến hành đối chiếu chéo số đo trên cùng một bản ghi.
* **Với TKiet & TVan (Phần cứng ESP32):** Sẵn sàng tiếp nhận dữ liệu đo thực địa khi bộ mạch được đặt vào vườn ươm để kiểm chứng Phase 4.

