# Web Dashboard — Vườn Ươm Ớt Con IoT

**Người phụ trách:** DKhoa  
**Phạm vi hoàn thành:** Phase 1 (Giao diện dữ liệu giả), Phase 2 (Lớp API Adapter) & Phase 3 (Tích hợp Backend TDat & ThingSpeak)  
**Phối hợp:** TDat (Backend & API), QThang (Mobile), MThuy (Agronomy), TKiet (Tích hợp)  
**Hệ thống thiết kế:** Tuân thủ 100% `Design_System_Web_Mobile.md`  
**Hợp đồng API:** Tuân thủ `docs/contracts/api.md` và `docs/contracts/sensor-reading.md`  

---

## 1. Giới thiệu & Phạm vi

Dashboard cung cấp giao diện trực quan theo dõi toàn diện 5 cảm biến trong vườn ươm ớt con:
1. **Nhiệt độ không khí** (°C từ DHT22)
2. **Độ ẩm không khí** (% từ DHT22)
3. **Nhiệt độ đất** (°C từ DS18B20 vùng rễ ớt con)
4. **Độ ẩm đất** (% từ HD-38 sau hiệu chuẩn; hoặc số đọc ADC thô khi chưa hiệu chuẩn)
5. **Mẫu nước tưới / Dung dịch dinh dưỡng**:
   - **TDS** (ppm từ TDS Meter V1.0 sau hiệu chuẩn; hoặc số đọc ADC thô)
   - **pH** (pH từ PH-4502C qua bộ chia áp sau hiệu chuẩn; hoặc số đọc ADC thô)

> [!NOTE]
> TDS và pH là phép đo mẫu nước/dung dịch tưới, không phải TDS/pH của đất.

---

## 2. Cấu trúc thư mục `web/`

```text
web/
├── .env                         # Cấu hình môi trường (Port, API_BASE_URL, DATA_MODE)
├── index.html                   # Giao diện chính Dashboard theo dõi vườn ươm
├── login.html                   # Giao diện Đăng nhập & Đăng ký người dùng
├── admin.html                   # Cổng Quản trị Hệ thống dành cho Role Admin
├── server.js                    # Web server Node.js thuần & Reverse Proxy sang Backend
├── package.json                 # Lệnh npm start, npm test, npm run test:integration
├── README.md                    # Tài liệu hướng dẫn sử dụng và bàn giao
├── css/
│   ├── design-system.css        # Khai báo chuẩn tokens CSS theo Design System (Palette 4 màu gốc)
│   ├── dashboard.css            # Bố cục lưới, thẻ MetricCard, biểu đồ và trạng thái
│   ├── auth.css                 # Giao diện Đăng nhập & Đăng ký chuẩn Design System
│   └── admin.css                # Giao diện Cổng Quản trị Admin, bảng quy tắc, modal
├── js/
│   ├── app.js                   # Application Controller điều phối UI, sự kiện và làm mới
│   ├── auth.js                  # Dịch vụ Quản lý Xác thực & Phân quyền (JWT Token & Session)
│   ├── admin.js                 # Quản trị viên: CRUD Care Rules, ThingSpeak sync, bộ lọc
│   ├── config.js                # Cấu hình ứng dụng & tải động từ server
│   ├── api/
│   │   └── api-adapter.js       # Lớp Adapter: Chuyển đổi giữa Fixture và API thật (kèm ThingSpeak sync)
│   ├── components/
│   │   ├── metric-card.js       # Thẻ số đo (xử lý chuẩn 0 != null, raw ADC, lỗi)
│   │   ├── device-status.js     # Tiêu đề thiết bị, phân biệt recorded_at vs received_at
│   │   ├── care-advice.js       # Banner lời khuyên chăm sóc (chỉ hiện theo Backend)
│   │   └── history-view.js      # Biểu đồ SVG kép (tách trục °C và %) và Bảng số đo
│   └── fixtures/
│       └── g0-fixtures.js       # Toàn bộ dữ liệu mô phỏng từ docs/contracts/fixtures/
└── test/
    ├── fixture-test.js          # Kiểm thử tự động 7 quy tắc hợp đồng G0 v0.1
    └── integration-test.js      # Kiểm thử tích hợp 14 ca: API số đo, Auth và Admin Care Rules
```

---

## 3. Cách khởi chạy

### Chạy Web Dashboard
Dự án sử dụng Node.js thuần, **không cần cài đặt thêm bất kỳ thư viện ngoài nào**:

```bash
cd web
npm start
```
Mở trình duyệt truy cập: **`http://localhost:3000`** (Dashboard tự động kết nối Backend tại `http://localhost:8000`)

---

## 4. Tích hợp với Backend thật của TDat (Phase 2 & Phase 3)

### 4.1. Quy trình kết nối
1. Đảm bảo Backend của TDat đang chạy (tại `http://localhost:8000`).
2. Trên Web Dashboard:
   - Mục **"Nguồn dữ liệu"**: Chọn **"🌐 API Thật (Backend TDat: 8000)"**.
   - Mục **"Thiết bị"**: Chọn trạm cần theo dõi:
     * `esp32-nursery-01`: Trạm vườn ươm chuẩn (đọc số đo hợp lệ mới nhất).
     * `esp32-stale-01`: Trạm mô phỏng mất kết nối (kiểm thử cờ `is_stale: true`).
     * `esp32-empty-01`: Trạm mới chưa gửi dữ liệu (kiểm thử trạng thái `reading: null`).
     * `esp32-unknown`: Kiểm thử mã lỗi `404 device_not_found`.
3. Hệ thống sẽ tự động gửi request đến:
   - `GET /api/v1/devices/{device_id}/readings/latest`
   - `GET /api/v1/devices/{device_id}/readings?limit=20`

### 4.2. Tính năng Đồng bộ ThingSpeak (ThingSpeak Integration)
Ngay trên thanh công cụ góc trên bên phải, nút **"📡 Đồng bộ ThingSpeak"** cho phép kích hoạt Backend đồng bộ ngay lập tức các feed cảm biến mới nhất từ ThingSpeak Channel `3543608` vào CSDL và tự động cập nhật số đo mới lên giao diện web.

---

## 5. Chuyển đổi sang Chế độ Dữ liệu mẫu (Fixtures Mock)

Nếu Backend chưa khởi động, bạn có thể chuyển nguồn dữ liệu sang **"📦 Dữ liệu mẫu (Fixtures G0 Mock)"** bất kỳ lúc nào để demo hoặc kiểm thử 8 kịch bản:
- `latest-normal.json`: Đọc bình thường đủ 5 cảm biến.
- `latest-uncalibrated.json`: Số đọc thô ADC, không gắn nhãn %, ppm, pH.
- `latest-partial-error.json`: Một cảm biến lỗi không ảnh hưởng các cảm biến khác.
- `latest-stale.json`: Dữ liệu cũ > 5 phút.
- `latest-empty.json`: Hộp thông báo rỗng, không vẽ số 0 giả.
- `zero_valid`: Kiểm thử `0 != null`.
- `with_advice`: Hiển thị khuyến nghị chăm sóc theo Backend.
- `server-error.json`: Thông báo lỗi máy chủ kèm nút thử lại.

---

## 6. Kiểm thử tự động (Test Suites)

### Kiểm thử Schema & Quy tắc hiển thị (Phase 1):
```bash
npm test
```
*(7/7 ca kiểm tra hợp đồng G0 v0.1 thành công).*

### Kiểm thử Tích hợp Web <-> Backend (Phase 3 & 5):
Khi backend đang chạy:
```bash
npm run test:integration
```
Script kiểm tra thực tế toàn bộ 14 ca: Health check, số đo mới nhất, trạm mất kết nối, trạm rỗng, lỗi 404, lịch sử số đo, Đăng nhập Admin, Đăng nhập User, Xác thực phiên `/auth/me`, Danh sách quy tắc, Thêm quy tắc, Sửa quy tắc, Xóa quy tắc, và ThingSpeak Sync status.

---

## 7. Hướng dẫn sử dụng Hệ thống Xác thực (Auth) & Cổng Quản trị Admin

### 7.1. Trang Đăng nhập & Đăng ký (`login.html`)
* **Địa chỉ:** `http://localhost:3000/login.html` (hoặc nhấn nút **"🔑 Đăng nhập / Đăng ký"** tại Header trang chủ).
* **Tài khoản thử nghiệm mặc định (nạp sẵn từ CSDL):**
  - **Quản trị viên (Admin):** Username: `admin` | Password: `admin123`
  - **Kỹ thuật viên (User):** Username: `user` | Password: `user123`
* **Tính năng:**
  - Chuyển tab nhanh giữa **Đăng nhập** và **Đăng ký tài khoản**.
  - Nút **"Điền nhanh tài khoản thử nghiệm"** tiện lợi để trải nghiệm tức thì.
  - Sau khi đăng nhập thành công:
    - Nếu là role **`admin`**: Hệ thống tự động chuyển hướng đến **Trang Quản trị Admin (`admin.html`)**.
    - Nếu là role **`user`**: Hệ thống chuyển về Dashboard theo dõi vườn ươm (`index.html`) kèm thông tin người dùng trên Header.
  - Đăng ký tài khoản hỗ trợ phân quyền `user` hoặc `admin` theo `RegisterSchema`.

### 7.2. Cổng Quản trị Hệ thống của Role Admin (`admin.html`)
* **Địa chỉ:** `http://localhost:3000/admin.html`
* **Cơ chế bảo vệ (Role Guard):**
  - Chỉ người dùng có role **`admin`** và JWT token hợp lệ mới được truy cập.
  - Người dùng chưa đăng nhập sẽ được chuyển hướng về trang `login.html`.
  - Tài khoản role `user` sẽ bị từ chối truy cập và chuyển về `index.html`.
* **Chức năng chính:**
  1. **Thống kê tổng quan (KPIs):** Tổng số quy tắc, số quy tắc đang kích hoạt, trạng thái kết nối ThingSpeak Polling Worker, thời điểm lấy mẫu ngầm gần nhất.
  2. **Quản lý Quy tắc Chăm sóc (Care Rules Management):**
     - Hiển thị danh sách toàn bộ các quy tắc sinh học (ngưỡng nhiệt độ KK, độ ẩm KK, nhiệt độ đất, độ ẩm đất, pH nước, TDS dinh dưỡng).
     - **Tìm kiếm & Lọc:** Tìm theo từ khóa, lọc theo loại thông số cảm biến, lọc theo mức độ (`danger`, `warning`, `info`) và lọc theo trạng thái kích hoạt.
     - **Thêm quy tắc mới (`POST /api/v1/rules`):** Mở modal form chuẩn schema với kiểm tra dữ liệu đầu vào.
     - **Chỉnh sửa quy tắc (`PUT /api/v1/rules/:id`):** Cập nhật ngưỡng giá trị, nội dung khuyến nghị hành động, mức độ cảnh báo.
     - **Xóa quy tắc (`DELETE /api/v1/rules/:id`):** Hộp thoại xác nhận an toàn trước khi xóa khỏi CSDL.
     - **Bật/Tắt nhanh trạng thái kích hoạt (`switch toggle`):** Cập nhật ngay lập tức `is_active` mà không cần reload trang.
  3. **Đồng bộ ThingSpeak (ThingSpeak Control Center):**
     - Giám sát thông số Channel ID `3543608`, trạm đích `esp32-nursery-01`, chu kỳ quét 20s.
     - Kích hoạt đồng bộ tức thời (`POST /api/v1/sync/thingspeak`) ngay từ trang Admin.
