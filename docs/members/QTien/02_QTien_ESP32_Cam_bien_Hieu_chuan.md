# 02 — QTien: Firmware ESP32 đọc cảm biến và hiệu chuẩn số đo

**Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT  
**Người phụ trách chính:** QTien  
**Trách nhiệm chính:** Phát triển module đọc DHT22, HD‑38, DS18B20 và hiệu chuẩn số đo, đặc biệt là HD‑38.  
**Phối hợp trực tiếp:** TKiet phụ trách mạch, pin map và tích hợp; TVan tích hợp module vào chương trình chính, Wi‑Fi và luồng gửi dữ liệu.

## 1. Kết quả cần bàn giao

Một module ESP32 đọc **DHT22** (nhiệt độ/độ ẩm không khí), **HD‑38** (số đọc độ ẩm đất) và **DS18B20** (nhiệt độ đất). Module trả cho TVan một mẫu đo có **giá trị, đơn vị và trạng thái của từng cảm biến**, có thể gọi từ chương trình chính mà không cần biết chi tiết thư viện hoặc chân kết nối bên trong. HD‑38 chỉ có giá trị phần trăm sau khi có hiệu chuẩn được ghi nhận.

### Ranh giới công việc

| QTien trực tiếp làm | Người khác phụ trách |
| --- | --- |
| Mã khởi tạo, đọc và kiểm tra ba cảm biến; chuyển số đo về đơn vị đã chốt; phát hiện lỗi, thử lại theo hợp đồng module; hiệu chuẩn HD‑38 và ghi thông số | TKiet: chọn chân, đấu dây/nguồn, sơ đồ mạch, xác nhận mạch thật và điều phối tích hợp |
| Giao diện module và bộ dữ liệu đo giả để TVan gọi thử; log thử từng cảm biến; hướng dẫn chạy module | TVan: `setup`/`loop` chính, lịch gửi, Wi‑Fi, thời gian, JSON và gửi backend |
| Xác minh số đo kỹ thuật và trạng thái `hợp lệ / lỗi / chưa hiệu chuẩn` | TDat: API/CSDL; DKhoa/QThang: giao diện; MThuy: quy tắc chăm sóc, phương pháp đối chiếu và ca kiểm thử |

**Vùng sở hữu đề xuất:** `firmware/sensors/` và phần kiểm thử của module trong đó. QTien có thể góp ý `docs/contracts/sensor-module.md` và `docs/contracts/sensor-reading.md`; TKiet chủ trì chốt các tài liệu chung tại G0. Không sửa trực tiếp chương trình chính, mã Wi‑Fi hoặc API nếu chưa phối hợp với chủ sở hữu.

## 2. Hợp đồng làm việc với TVan

Tại **Phase 0 (G0)**, hai người thống nhất một giao diện gọi module, ghi vào `docs/contracts/sensor-module.md`. Tối thiểu phải trả lời được:

| Nội dung | Thỏa thuận cần ghi |
| --- | --- |
| Hàm khởi tạo và hàm lấy mẫu | TVan gọi khi nào, bao lâu thì có kết quả, cách biết lần đọc hoàn tất |
| Dữ liệu đầu ra | Nhiệt độ không khí °C, độ ẩm không khí %, nhiệt độ đất °C, số đọc thô HD‑38, độ ẩm đất % nếu đã hiệu chuẩn |
| Trạng thái từng cảm biến | Phân biệt đo hợp lệ, không đọc được, số đo ngoài phạm vi chấp nhận, chưa hiệu chuẩn; không để lỗi một cảm biến xóa số đo hợp lệ của cảm biến khác |
| Giá trị thiếu | Dùng biểu diễn giá trị không có theo hợp đồng đã chốt; khi tạo JSON, TVan chuyển thành `null` và trạng thái tương ứng, không biến thành `0` |
| Thời gian và mã thiết bị | TVan gắn `device_id`, `recorded_at` theo quy ước hệ thống; QTien chỉ trả về dữ liệu và trạng thái của lần đọc |
| Nhịp đọc và lỗi | Thời gian đọc tối đa, điều kiện thử lại và việc TVan tiếp tục chạy phần mạng nếu cảm biến chưa có kết quả |

Các tên trường dùng trong file 01 (`air_temperature_c`, `air_humidity_pct`, `soil_temperature_c`, `soil_moisture_raw`, `soil_moisture_pct`, `sensor_status`) là **khung thảo luận**, chưa phải schema chính thức. Sau G0, triển khai đúng phiên bản đã duyệt; nếu thấy cần đổi kiểu dữ liệu hoặc trạng thái, gửi ví dụ trước/sau cho TKiet, TVan, TDat và MThuy xem xét.

**Cách làm song song:** Trước khi có mạch thật, dựng module giả trả về cùng kiểu dữ liệu, gồm một mẫu bình thường và các mẫu lỗi. TVan dùng module giả để viết chương trình chính và kết nối mạng; TDat dùng payload mẫu để làm API. Khi có pin map và mạch đã thử từ TKiet, thay nguồn dữ liệu giả bằng phép đọc thật mà không đổi giao diện đã chốt.

## 3. Kế hoạch theo Phase

### Phase 0 — Chốt đầu vào và giao diện (G0)

**QTien thực hiện:**

- Nhận từ TKiet danh sách linh kiện thực tế, `docs/hardware/pin-map.md`, nguồn/GND, sơ đồ dây và ảnh mạch mẫu; kiểm tra chân dùng cho DHT22, HD‑38, DS18B20 có đúng chức năng cần đọc. Nếu có điểm chưa rõ, nêu ngay trong tài liệu G0, không tự đổi chân trên mạch.
- Cùng TVan chốt tên hàm, kiểu kết quả, trạng thái lỗi, nhịp lấy mẫu và điểm gắn thời gian; cùng TDat/MThuy rà lại đơn vị và cách diễn giải số đo thiếu.
- Đề xuất ví dụ một mẫu đo hợp lệ, một mẫu HD‑38 chưa hiệu chuẩn, một mẫu lỗi DHT22 và một mẫu chỉ DS18B20 hoạt động. Đánh dấu rõ đây là dữ liệu mô phỏng.

**Đầu ra:** Xác nhận pin map, giao diện module v0.1, bảng đơn vị/trạng thái và bộ mẫu đo giả.  
**Đạt G0 khi:** TKiet và TVan xác nhận điểm nối; TDat/MThuy xác nhận ngữ nghĩa số đo. TVan biên dịch/chạy được chương trình chính với module giả hoặc stub theo cùng giao diện.

### Phase 1 — Viết phần đọc từng cảm biến

**QTien thực hiện:**

- Trong `firmware/sensors/`, triển khai khởi tạo và đọc độc lập DHT22, HD‑38, DS18B20 theo pin map G0; tách cấu hình chân khỏi xử lý số đo để dễ đối chiếu mạch thật.
- Ghi số đo gốc, thời điểm tương đối của lần đọc hoặc thứ tự mẫu trong log thử; kiểm tra trường hợp đọc được, ngắt dây, chưa cắm cảm biến và khởi động lại. Đối chiếu với phép thử phần cứng TKiet đã bàn giao.
- Chuẩn hóa đầu ra của từng đường đo: DHT22 trả nhiệt độ/độ ẩm không khí; DS18B20 trả nhiệt độ đất; HD‑38 trả số đọc thô. Chỉ đánh dấu giá trị hợp lệ khi phép đọc và kiểm tra tương ứng thành công.

**Đầu ra:** Mã đọc ba cảm biến, ví dụ chạy riêng và log từng cảm biến; README ngắn về cách nạp và xem kết quả.  
**Đạt Phase 1 khi:** Trên mạch đã chốt, từng cảm biến cho được mẫu đo có trạng thái rõ ràng; rút/ngắt một cảm biến không làm số đo còn lại bị gán thành số đo hợp lệ giả.

### Phase 2 — Xử lý số đo, hiệu chuẩn và bàn giao module

**QTien thực hiện:**

- Xử lý số đo bất thường theo tiêu chí G0: lỗi đọc, giá trị không hợp lệ, phép đọc chưa hoàn tất; quyết định giữ hay bỏ mẫu lỗi theo hợp đồng với TVan. Không âm thầm lấy mẫu cũ và gắn nhãn mới.
- Cùng MThuy xác định các điểm tham chiếu để hiệu chuẩn HD‑38; lưu số đọc thô, điều kiện đo, chiều biến thiên, cách tính %, phiên bản cấu hình và giới hạn áp dụng. Nếu chưa đủ dữ liệu hiệu chuẩn, `soil_moisture_pct` vẫn là giá trị thiếu kèm trạng thái **chưa hiệu chuẩn**.
- Hoàn thiện module theo giao diện G0, thêm bộ mẫu đo giả/fixture và ví dụ gọi để TVan tích hợp. Giữ phần mạng, JSON và lịch gửi ở phía TVan.

**Đầu ra:** Module cảm biến dùng được từ chương trình chính, dữ liệu mẫu, bảng hiệu chuẩn HD‑38 và hướng dẫn nhận diện lỗi.  
**Đạt Phase 2 khi:** TVan lấy được một mẫu với các trường/trạng thái đã chốt mà không phải sửa mã đọc cảm biến; MThuy có thể lần lại số đọc thô và phương pháp quy đổi %.

### Phase 3 — Tích hợp ESP32 và thử đầu cuối

**QTien thực hiện:**

- Cùng TVan đưa module thật vào chương trình chính; kiểm tra nhịp đọc thực tế khi Wi‑Fi đang hoạt động, nội dung bản ghi trước khi gửi và việc mạng tiếp tục chạy khi một cảm biến lỗi.
- Cùng TDat đối chiếu một lần đo thực: giá trị trong log cảm biến → payload TVan gửi → bản ghi backend nhận. Nếu lệch đơn vị, trạng thái hoặc tên trường, ghi issue cho đúng chủ sở hữu.
- Tái hiện các ca: một cảm biến bị ngắt, HD‑38 chưa hiệu chuẩn, khởi động lại, số đo không hợp lệ và lần đọc bị chậm; kiểm tra không có giá trị `0` giả hoặc dữ liệu cũ bị coi là mẫu mới.

**Đầu ra:** Log tích hợp, bảng đối chiếu số đo và issue có bước tái hiện.  
**Đạt Phase 3 khi:** Mẫu thật từ cả ba cảm biến đi qua TVan và TDat theo cùng phiên bản hợp đồng; lỗi từng cảm biến được gửi/hiển thị với trạng thái tương ứng theo cách nhóm đã chốt.

### Phase 4 — Đối chiếu trong vườn ươm

**QTien thực hiện:**

- Phối hợp TKiet đặt/giữ mạch ổn định và MThuy ghi nhận điều kiện thử; so sánh số đo lặp lại, độ ổn định và mức thay đổi khi điều kiện đo thay đổi.
- Nếu phải chỉnh vị trí cảm biến, chân, tham số hiệu chuẩn hoặc cách lọc số đo, ghi phiên bản trước/sau, lý do, tác động tới dữ liệu cũ và thông báo cho TKiet, TVan, TDat, MThuy.
- Chạy lại những ca kiểm thử bị tác động; thống nhất khi nào phần trăm độ ẩm đất đủ cơ sở để dùng trong quy tắc chăm sóc.

**Đầu ra:** Nhật ký đo thực tế, phiên bản hiệu chuẩn, kết quả kiểm thử lại và các giới hạn đã nhận diện.  
**Đạt Phase 4 khi:** Có thể lặp lại quy trình đọc/hiệu chuẩn theo tài liệu; mọi số đo dùng để ra cảnh báo có trạng thái hợp lệ và nguồn gốc rõ ràng.

### Phase 5 — Đóng gói và bàn giao

**QTien thực hiện:**

- Viết hướng dẫn khởi tạo và gọi module, cấu hình GPIO theo pin map, cách nạp/chạy ví dụ, các trạng thái lỗi, cách hiệu chuẩn lại HD‑38 và cách kiểm tra log.
- Bàn giao mã nguồn, dữ liệu mẫu, log đo thật, bảng hiệu chuẩn và kết quả kiểm thử cho TKiet/TVan; hỗ trợ diễn giải phần cảm biến trong buổi demo.
- Xác nhận phiên bản cuối của module khớp pin map, hợp đồng dữ liệu, firmware chính và tài liệu tổng hợp của TKiet.

**Đầu ra:** Module và tài liệu chạy lại được, dữ liệu mẫu + bằng chứng đo thật, phiên bản hiệu chuẩn cuối.  
**Đạt Phase 5 khi:** TVan hoặc TKiet có thể nạp/chạy module theo hướng dẫn, nhận biết số đo hợp lệ/lỗi/chưa hiệu chuẩn và truy lại nguồn gốc của số đo %.

## 4. Checklist bàn giao cho TVan

- [ ] Giao diện module, kiểu dữ liệu và phiên bản hợp đồng đã được TKiet/TVan chốt.
- [ ] Ba đường đọc hoạt động riêng; một đường lỗi không làm hỏng hai đường còn lại.
- [ ] Có mẫu đo giả cho bình thường, lỗi và chưa hiệu chuẩn; có log mẫu đo thật.
- [ ] Có trạng thái từng cảm biến; không gửi giá trị giả thay cho giá trị thiếu.
- [ ] Có số đọc thô HD‑38, tham số hiệu chuẩn và cách tính `%` nếu phần trăm được bật.
- [ ] Có hướng dẫn cấu hình chân, nạp/chạy ví dụ và cách tái hiện lỗi.
- [ ] TVan xác nhận gọi được module từ chương trình chính; TKiet xác nhận khớp mạch thật.

**Khi bị chặn:** Nếu pin map/mạch thật chưa sẵn sàng, tiếp tục với module giả đúng giao diện G0 và ghi phần kiểm thử trên mạch là `đang chặn`. Nếu có thay đổi làm lệch hợp đồng, mở issue kèm ví dụ trước/sau, người bị ảnh hưởng và đề xuất phiên bản mới; không đổi giao diện một mình.
