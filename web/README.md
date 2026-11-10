# Web Dashboard — Vườn Ươm Ớt Con IoT (React + Vite)

**Người phụ trách:** DKhoa  
**Công nghệ:** React 19 + Vite + Lucide Icons  
**Phạm vi hoàn thành:** Phase 1 (Giao diện dữ liệu giả), Phase 2 (Lớp API Adapter) & Phase 3 (Tích hợp Backend TDat & ThingSpeak)  
**Phối hợp:** TDat (Backend & API), QThang (Mobile), MThuy (Agronomy), TKiet (Tích hợp)  
**Hệ thống thiết kế:** Tuân thủ 100% `Design_System_Web_Mobile.md`  
**Hợp đồng API:** Tuân thủ `docs/contracts/api.md` và `docs/contracts/sensor-reading.md`  

---

## 1. Giới thiệu & Điểm mới của Bản Nâng Cấp React + Vite

Dashboard cung cấp giao diện trực quan, hiện đại, theo dõi toàn diện 5 cảm biến trong vườn ươm ớt con:
1. **Nhiệt độ không khí** (°C từ DHT22)
2. **Độ ẩm không khí** (% từ DHT22)
3. **Nhiệt độ đất** (°C từ DS18B20 vùng rễ ớt con)
4. **Độ ẩm đất** (% từ HD-38 sau hiệu chuẩn; hoặc số đọc ADC thô khi chưa hiệu chuẩn)
5. **Mẫu nước tưới / Dung dịch dinh dưỡng**:
   - **TDS** (ppm từ TDS Meter V1.0 sau hiệu chuẩn; hoặc số đọc ADC thô)
   - **pH** (pH từ PH-4502C qua bộ chia áp sau hiệu chuẩn; hoặc số đọc ADC thô)

### Các cải tiến giao diện hợp lý hơn:
- **Kiến trúc SPA hiện đại (Single Page Application)**: Điều hướng tức thời giữa 3 tab chính:
  1. 📊 **Giám sát vườn ươm (Live Monitor)**: Số đo thời gian thực, hero status, banner lời khuyên sinh học, biểu đồ SVG kép 2 panel riêng biệt (°C và %) và bảng dữ liệu lịch sử.
  2. ⚙️ **Quản trị quy tắc Admin (Admin Console)**: Bảng CRUD toàn diện các quy tắc chăm sóc (`/api/v1/rules`), tìm kiếm, bộ lọc thông số, bật/tắt nhanh `is_active`, giám sát ThingSpeak Worker và nút ép đồng bộ.
  3. 🧪 **Kiểm thử G0 Sandbox (Contract Playground)**: Cho phép chuyển đổi 1-click giữa 8 kịch bản biên G0 v0.1 (`normal`, `uncalibrated`, `partial_error`, `stale`, `empty`, `zero_valid`, `with_advice`, `server_error`) để đối soát hợp đồng ngay lập tức.
- **Hệ thống Design System chuẩn mực**: Tôn trọng bảng 4 màu gốc `#F7444E`, `#F7F8F3`, `#78BCC4`, `#002C3E`, hiển thị số đo dạng `tabular-nums`, không nối đường biểu đồ qua điểm `null`.
- **Hệ thống Xác thực (Auth Modal)**: Hỗ trợ đăng nhập/đăng ký với các nút nạp nhanh tài khoản kiểm thử (`admin` / `user`).
- **Thông báo Toast**: Hiển thị trạng thái đồng bộ, thông báo lỗi/thành công mượt mà, không gây gián đoạn trải nghiệm người dùng.

---

## 2. Cấu trúc thư mục `web/`

```text
web/
├── index.html                   # HTML template của Vite (nạp Inter font & JetBrains Mono)
├── vite.config.js               # Cấu hình Vite dev server (port 3000, proxy /api)
├── package.json                 # Lệnh scripts: dev, build, test, test:integration
├── README.md                    # Tài liệu hướng dẫn sử dụng và bàn giao
├── src/
│   ├── main.jsx                 # Entry point khởi tạo React root
│   ├── App.jsx                  # Điều phối toàn bộ State, Navigation & Layout
│   ├── config.js                # Cấu hình trạm, kịch bản, múi giờ GMT+7, URL backend
│   ├── styles/
│   │   ├── design-system.css    # Khai báo tokens CSS (Màu gốc, Bo góc, Bóng đổ, Tương phản)
│   │   └── app.css              # Bố cục giao diện, thẻ MetricCard, modal, tables, toast
│   ├── services/
│   │   ├── api.js               # ApiService: Chuyển đổi giữa REAL_API và FIXTURE Mock G0
│   │   └── auth.js              # AuthService: Quản lý JWT Token, phân quyền admin/user
│   ├── fixtures/
│   │   └── g0-fixtures.js       # Toàn bộ 8 kịch bản mô phỏng từ docs/contracts/fixtures/
│   └── components/
│       ├── Navbar.jsx           # Header bar, chọn trạm, switch Cloud/Mock, profile
│       ├── DeviceStatusHero.jsx # Thông tin trạm, phân biệt recorded_at vs received_at
│       ├── CareAdviceBanner.jsx # Lời khuyên chăm sóc sinh học (chỉ hiển thị theo Backend)
│       ├── MetricCard.jsx       # Thẻ số đo (xử lý chuẩn 0 != null, raw ADC thô, lỗi)
│       ├── MetricGrid.jsx       # Lưới 6 thẻ cảm biến thời gian thực
│       ├── HistorySection.jsx   # Biểu đồ SVG kép (Stacked 2 panels) và Bảng lịch sử
│       ├── AdminConsole.jsx     # Cổng quản trị: CRUD quy tắc chăm sóc, ThingSpeak sync
│       ├── ContractPlayground.jsx # Phòng thử nghiệm đối soát 8 kịch bản G0
│       ├── AuthModal.jsx        # Hộp thoại Đăng nhập / Đăng ký kèm nút nạp nhanh
│       ├── RuleModal.jsx        # Hộp thoại Thêm / Chỉnh sửa quy tắc sinh học
│       └── Toast.jsx            # Thông báo nổi (Toast alerts)
└── test/
    ├── fixture-test.js          # Kiểm thử tự động 7 quy tắc hợp đồng G0 v0.1 (ESM)
    └── integration-test.js      # Kiểm thử tích hợp 14 ca: API số đo, Auth và Admin Rules (ESM)
```

---

## 3. Cách khởi chạy và xây dựng (Development & Build)

### 3.1. Cài đặt thư viện
```bash
cd web
npm install
```

### 3.2. Chạy môi trường Phát triển (Vite Dev Server)
```bash
npm run dev
# hoặc: npm start
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

### 3.3. Đóng gói sản phẩm (Production Build)
```bash
npm run build
```
Mã nguồn tối ưu sẽ được xuất ra thư mục `web/dist/` (tốc độ biên dịch cực nhanh ~400ms).

### 3.4. Triển khai lên Cloud Render (Deploy to Render)

#### Cách 1: Render Static Site (Khuyên dùng - Nhanh & Miễn phí)
1. Trên Render Dashboard, chọn **New +** $\rightarrow$ **Static Site**.
2. Kết nối repo và điền các trường cấu hình:
   - **Root Directory:** `web`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist` *(LƯU Ý: Phải là `dist`, KHÔNG được để `web` hay để trống!)*
3. Vào mục **Redirects/Rewrites** thêm 1 dòng:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
4. Bấm **Create Static Site**.

#### Cách 2: Render Web Service (Node.js Service)
1. Trên Render Dashboard, chọn **New +** $\rightarrow$ **Web Service**.
2. Điền cấu hình:
   - **Root Directory:** `web`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start` *(chạy `node prod-server.js` phục vụ thư mục `dist/` kèm MIME types chuẩn và tự động nhận diện `$PORT`)*.

---

## 4. Kiểm thử tự động (Test Suites)

### 4.1. Kiểm thử Schema & Quy tắc hiển thị (Phase 1):
```bash
npm test
```
*(7/7 ca kiểm tra hợp đồng G0 v0.1 thành công).*

### 4.2. Kiểm thử Tích hợp Web <-> Backend Cloud Render (Phase 3 & 5):
```bash
npm run test:integration
```
*(14/14 ca kiểm tra thực tế: Health check, số đo mới nhất, trạm mất kết nối, trạm rỗng, lỗi 404, lịch sử số đo, Đăng nhập Admin/User, Xác thực phiên `/auth/me`, CRUD Care Rules, và ThingSpeak Sync status).*

---

## 5. Hướng dẫn sử dụng các Phân hệ

### 5.1. Giám sát thời gian thực (Live Monitor)
- **Nguồn dữ liệu:**
  - `🌐 API Thật (Cloud Render)`: Tự động cập nhật số đo từ trạm `esp32-nursery-01` trên Backend Cloud (`https://pepper-nursery-iot.onrender.com`).
  - `📦 Dữ liệu mẫu (G0 Mock)`: Thử nghiệm không cần mạng với 8 kịch bản hợp đồng.
- **Nút "📡 Đồng bộ ThingSpeak":** Kích hoạt Backend lấy ngay các feed mới nhất từ ThingSpeak Channel `3543608`.

### 5.2. Cổng Quản trị Admin (Admin Console)
- Nhấn tab **"Quản trị quy tắc Admin"**.
- Nếu chưa đăng nhập: Nhấn **"🔑 Đăng nhập quyền Admin"** $\rightarrow$ Chọn nút nạp nhanh **`admin / admin123`** $\rightarrow$ Đăng nhập.
- **Tính năng:**
  - Tìm kiếm quy tắc theo mã, tên, nội dung.
  - Lọc theo loại cảm biến (Nhiệt KK, Ẩm KK, Nhiệt đất, Ẩm đất, pH, TDS).
  - Bật/tắt nhanh quy tắc (`is_active`) bằng 1 click.
  - Thêm quy tắc mới hoặc Chỉnh sửa ngưỡng và câu chữ khuyến nghị hành động.
  - Kích hoạt ép đồng bộ từ ThingSpeak.

### 5.3. Phòng Thử Nghiệm G0 (Contract Sandbox)
- Nhấn tab **"Kiểm thử G0 Sandbox"**.
- Danh sách 8 kịch bản biên được trình bày trực quan kèm quy tắc hợp đồng tương ứng.
- Nhấn **"Kích hoạt thử kịch bản này"** để đưa kịch bản đó lên màn hình Live Dashboard ngay lập tức.
