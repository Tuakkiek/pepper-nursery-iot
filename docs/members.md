# Tổng hợp toàn bộ tài liệu thành viên — Pepper Nursery IoT

Tài liệu này tổng hợp đầy đủ 100% nội dung nguyên văn từ 7 file thành viên trong thư mục `docs/members/`:

- [01 — TKiet: Tích hợp hệ thống và phần cứng](#01--tkiet-tích-hợp-hệ-thống-và-phần-cứng)
- [02 — QTien: Firmware ESP32 đọc cảm biến và hiệu chuẩn số đo](#02--qtien-firmware-esp32-đọc-cảm-biến-và-hiệu-chuẩn-số-đo)
- [03 — TVan: Chương trình chính ESP32, Wi‑Fi và truyền dữ liệu](#03--tvan-chương-trình-chính-esp32-wi-fi-và-truyền-dữ-liệu)
- [04 — TDat: Backend, API và cơ sở dữ liệu](#04--tdat-backend-api-và-cơ-sở-dữ-liệu)
- [05 — DKhoa: Web dashboard](#05--dkhoa-web-dashboard)
- [06 — QThang: Ứng dụng mobile](#06--qthang-ứng-dụng-mobile)
- [07 — MThuy: Quy tắc chăm sóc cây và kiểm thử](#07--mthuy-quy-tắc-chăm-sóc-cây-và-kiểm-thử)


---

# 01 — TKiet: Tích hợp hệ thống và phần cứng

**Người phụ trách chính:** TKiet  
**Trách nhiệm chính:** Điều phối kiến trúc, phần cứng, kết nối cảm biến, tích hợp các module và kiểm thử đầu cuối của hệ thống.

## 1. Cơ cấu nhóm sau khi điều chỉnh

| Người trong nhóm | Phần việc chính | Người chịu trách nhiệm cuối cùng |
| --- | --- | --- |
| TKiet | Kiến trúc, tích hợp, toàn bộ phần cứng và kết nối cảm biến | TKiet |
| QTien | Firmware ESP32 A: đọc cảm biến, kiểm tra và hiệu chuẩn số đo | QTien |
| TVan | Firmware ESP32 B: chương trình chính, Wi‑Fi, đóng gói và gửi dữ liệu | TVan |
| TDat | Backend, API, cơ sở dữ liệu | TDat |
| DKhoa | Web dashboard | DKhoa |
| QThang | Ứng dụng mobile | QThang |
| MThuy | Quy tắc chăm sóc cây, đối chiếu hiệu chuẩn và kiểm thử | MThuy |


## 2. Phạm vi TKiet trực tiếp làm

- Thiết kế sơ đồ luồng dữ liệu: DHT22, HD‑38, DS18B20 → ESP32 → backend/CSDL → web và mobile; thống nhất nơi áp dụng quy tắc chăm sóc cùng MThuy.
- Lập kế hoạch theo Phase, giao đầu ra, tổ chức các mốc chốt giao diện và kiểm tra việc bàn giao.
- Chuẩn bị ESP32 DevKitC/ESP‑32D, mạch mở rộng 30P và ba cảm biến; chọn GPIO phù hợp với mạch thực tế, đấu nguồn/GND/dây tín hiệu, cố định và bảo vệ mạch trong môi trường vườn ươm.
- Kiểm tra độc lập nguồn, dây, từng cảm biến và toàn bộ bộ mạch; ghi nhận hiện tượng, kết quả, ảnh và cách tái hiện lỗi để QTien/TVan dùng cùng một cấu hình.
- Tích hợp các phần đã được chủ sở hữu bàn giao, chạy kiểm thử đầu cuối, theo dõi lỗi liên nhóm và chuẩn bị kịch bản demo.

**Ranh giới trách nhiệm:** TKiet chịu phần đấu nối vật lý, tài liệu giao tiếp và tích hợp. QTien sở hữu mã đọc/xử lý cảm biến; TVan sở hữu chương trình chính và kết nối mạng; TDat sở hữu API/CSDL; DKhoa và QThang sở hữu giao diện; MThuy sở hữu nội dung quy tắc và kế hoạch kiểm thử. Khi cần sửa module của người khác, tạo issue/PR hoặc phối hợp với người sở hữu trước khi hợp nhất.

## 3. Quy tắc để sáu người còn lại làm song song

1. **Chốt một bản hợp đồng giao tiếp ở Phase 0 (G0).** Nội dung tối thiểu: chân GPIO và nguồn, cấu trúc bản ghi cảm biến, đơn vị đo, mã trạng thái lỗi, cách firmware gọi API, dữ liệu trả về cho web/mobile. TKiet điều phối; QTien, TVan, TDat, DKhoa, QThang, MThuy cùng xem phần có liên quan.
2. **Dùng dữ liệu giả theo đúng hợp đồng.** QTien và TVan có thể kiểm thử bằng bản ghi mẫu; TDat có thể nhận payload mẫu; DKhoa/QThang phát triển màn hình bằng phản hồi API mẫu; MThuy thử quy tắc bằng cùng bộ mẫu. Không cần đợi mạch thật hoặc server hoàn chỉnh.
3. **Mỗi phần việc có một người sở hữu.** Người khác có thể review nhưng không đồng thời sửa cùng vùng mã/tài liệu khi chưa thống nhất. Gợi ý vùng sở hữu: `firmware/sensors/` (QTien), `firmware/network/` và chương trình chính (TVan), `backend/` (TDat), `web/` (DKhoa), `mobile/` (QThang), `docs/agronomy/` và ca kiểm thử (MThuy). TKiet sở hữu `docs/architecture/`, `docs/hardware/`, `docs/contracts/`, `docs/integration/`. Chốt cây thư mục thực tế tại G0.
4. **Thay đổi giao diện phải có phiên bản.** Ghi đề xuất thay đổi, ví dụ trước/sau và người bị ảnh hưởng; chỉ cập nhật bản hợp đồng chính sau khi các chủ sở hữu liên quan xác nhận. Lỗi tích hợp được ghi thành issue kèm payload, log, cách tái hiện và người nhận xử lý.
5. **Bàn giao có bằng chứng.** Mỗi mốc gồm đầu ra, cách chạy/thử, kết quả mong đợi và trạng thái `đạt / chưa đạt / đang chặn`. Không coi lời nhắn “đã xong” là bàn giao kỹ thuật.

### Bộ hợp đồng cần chốt tại G0

| Tài liệu | TKiet chuẩn bị/chủ trì | Người xác nhận | Tiêu chí chốt |
| --- | --- | --- | --- |
| `docs/hardware/pin-map.md` + sơ đồ dây | GPIO, nguồn, GND, tên đầu nối, ảnh mạch mẫu; ghi rõ phiên bản phần cứng | QTien, TVan | Có thể đấu lại đúng mạch và đối chiếu từng dây |
| `docs/contracts/sensor-reading.md` | Trường dữ liệu, đơn vị, giá trị thiếu/lỗi, ví dụ bản ghi; phối hợp QTien/TVan | QTien, TVan, TDat, MThuy | Cùng một bản ghi mẫu được firmware tạo và backend nhận |
| `docs/contracts/api.md` | Điều phối yêu cầu ingest và truy vấn cho web/mobile; TDat soạn chi tiết API | TVan, TDat, DKhoa, QThang, MThuy | Có request/response mẫu, lỗi và quy tắc thời gian |
| `docs/contracts/sensor-module.md` | Chốt điểm nối giữa hai người viết firmware | QTien, TVan | QTien trả về số đo/trạng thái; TVan gọi được mà không cần sửa mã đọc cảm biến |
| `docs/integration/test-matrix.md` | Ma trận kiểm thử mạch → firmware → API → giao diện | QTien, TVan, TDat, DKhoa, QThang và MThuy | Mỗi đường dữ liệu và tình huống lỗi có người kiểm tra |

**Khung dữ liệu để thảo luận ở G0 (chưa coi là schema đã duyệt):** `device_id`, `recorded_at` (thời điểm đo, quy ước múi giờ), `air_temperature_c`, `air_humidity_pct`, `soil_temperature_c`, `soil_moisture_raw`, `soil_moisture_pct`, `sensor_status`. HD‑38 có số đọc thô; chỉ dùng `%` khi đã thống nhất cách hiệu chuẩn và phạm vi quy đổi. Khi đo lỗi/chưa hiệu chuẩn, thống nhất giá trị `null` và trạng thái tương ứng; không tự thay bằng `0`. TDat chốt JSON/API cuối cùng sau khi QTien, TVan và bên giao diện xác nhận.

## 4. Kế hoạch theo Phase

### Phase 0 — Khởi động và chốt giao diện (mốc G0)

**TKiet thực hiện:**

- Liệt kê mục tiêu MVP và luồng demo cần chứng minh: nhận số đo từ ba cảm biến qua ESP32, lưu/truy xuất dữ liệu, hiển thị trên web/mobile và kiểm tra quy tắc chăm sóc theo phạm vi nhóm chốt.
- Kiểm kê đúng linh kiện thực tế; đặt mã cho thiết bị và phiên bản mạch; phác sơ đồ nối ESP32, mạch 30P, DHT22, HD‑38, DS18B20. Không ấn định GPIO trên giấy trước khi đối chiếu chân khả dụng và mạch thực.
- Chủ trì buổi chốt `pin-map.md`, hợp đồng module firmware, mẫu JSON/API, đơn vị đo, trạng thái lỗi và tiêu chí dữ liệu cũ/mất kết nối.
- Tạo bảng việc gồm chủ sở hữu, đường dẫn đầu ra, phụ thuộc, người review và mốc bàn giao cho QTien, TVan, TDat, DKhoa, QThang và MThuy.

**Đầu ra:** Sơ đồ kiến trúc, danh sách linh kiện, pin map v0.1, bộ hợp đồng v0.1, bản ghi/response mẫu và ma trận bàn giao.  
**Đạt G0 khi:** QTien/TVan xác nhận pin map + điểm nối firmware; TDat xác nhận payload/API; DKhoa/QThang xác nhận dữ liệu hiển thị; MThuy xác nhận trường cần cho quy tắc và ca kiểm thử. Ghi quyết định vào repo để mọi người bắt đầu độc lập.

### Phase 1 — Lắp và thử phần cứng độc lập

**TKiet thực hiện:**

- Lắp ESP32 với mạch mở rộng 30P, kiểm tra nguồn và GND; đấu thử từng cảm biến theo pin map, gắn nhãn đầu dây, kiểm tra tiếp xúc và bố trí dây phù hợp môi trường ẩm.
- Với mỗi cảm biến, xác nhận được nguồn cấp, đường tín hiệu, hiện tượng khi kết nối/ngắt kết nối và một phép đọc thử bằng chương trình kiểm tra tối thiểu. Ghi rõ nếu kết quả chưa ổn định; QTien sẽ xử lý logic đọc và hiệu chuẩn trong module chính.
- Chụp ảnh mạch thực, cập nhật pin map theo đúng cách đã đấu, lập checklist lắp lại và biên bản kiểm tra nguồn/dây.

**Đầu ra:** Bộ mạch dùng chung, sơ đồ dây đúng với mạch thật, ảnh có nhãn, bảng GPIO/nguồn/GND và biên bản test từng cảm biến.  
**Đạt Phase 1 khi:** QTien và TVan có thể dùng tài liệu để kết nối cùng cấu hình, và cả ba đường cảm biến có kết quả thử hoặc có lỗi được mô tả, gán người xử lý rõ ràng.

### Phase 2 — Theo dõi phát triển song song, chuẩn bị tích hợp

**TKiet thực hiện:**

- Giữ pin map và hợp đồng dữ liệu ổn định; trả lời câu hỏi liên nhóm bằng một quyết định ghi vào tài liệu, không để nhiều bản thông số trong tin nhắn riêng.
- Theo dõi các đầu ra: QTien đọc/xử lý số đo; TVan Wi‑Fi và gửi payload; TDat endpoint và dữ liệu lưu; DKhoa/QThang màn hình với dữ liệu mẫu; MThuy quy tắc và ca thử.
- Chuẩn bị môi trường tích hợp và bộ dữ liệu thử gồm số đo bình thường, thiếu giá trị, chưa hiệu chuẩn, mất cảm biến, mất Wi‑Fi, backend lỗi và bản ghi cũ. Đối chiếu đơn vị, thời gian và mã trạng thái trước khi nối hệ thống.

**Đầu ra:** Bảng trạng thái theo module, dữ liệu thử chung, checklist tích hợp và danh sách lỗi/phụ thuộc còn mở.  
**Đạt Phase 2 khi:** Mỗi người bàn giao được phần của mình bằng dữ liệu mẫu theo G0; chỗ chưa xong có issue và người phụ trách, không bắt người khác đợi mà không có giao diện thay thế.

### Phase 3 — Tích hợp trên bàn thử

**TKiet thực hiện:**

- Tổ chức nối lần lượt: mạch thật → QTien → TVan → TDat → DKhoa/QThang; sau đó đưa quy tắc MThuy và các cảnh báo/trạng thái vào luồng hiển thị đã chốt.
- Chạy thử đường dữ liệu đầu cuối bằng một `device_id` nhất quán; so sánh số đo hiển thị, payload gửi, bản ghi lưu và phản hồi API. Lưu log/ngày giờ của từng bước.
- Kiểm tra lỗi: cảm biến không trả số đo, giá trị không hợp lệ, Wi‑Fi mất rồi có lại, backend không nhận, dữ liệu cũ. Giao issue cho đúng chủ sở hữu và thử lại sau khi sửa.

**Đầu ra:** Biên bản tích hợp, ảnh/video minh chứng MVP, bảng kết quả kiểm thử đầu cuối và danh sách lỗi ưu tiên.  
**Đạt Phase 3 khi:** Một lần đo thật đi từ cảm biến đến cơ sở dữ liệu rồi xuất hiện trên web và mobile theo đúng đơn vị/trạng thái; các ca lỗi quan trọng có phản hồi đã thống nhất, không hiển thị dữ liệu sai như dữ liệu mới hợp lệ.

### Phase 4 — Kiểm chứng trong bối cảnh vườn ươm

**TKiet thực hiện:**

- Cùng MThuy đặt mạch tại vị trí thử có kiểm soát, kiểm tra độ ổn định của dây/nguồn và cách bảo vệ linh kiện trước nước/ẩm; ghi bối cảnh đo để đối chiếu.
- Phối hợp QTien và MThuy đối chiếu số đo/hiệu chuẩn theo phương pháp nhóm thống nhất; nếu điều chỉnh cảm biến hoặc vị trí đặt, cập nhật phiên bản cấu hình và chạy lại ca kiểm thử liên quan.
- Kiểm tra quy tắc và thông báo hiển thị có phản ánh đúng trạng thái đo, lỗi và dữ liệu cũ; tổng hợp các giới hạn của MVP.

**Đầu ra:** Biên bản thử thực tế, cấu hình cuối, kết quả ca kiểm thử và danh sách vấn đề còn lại.  
**Đạt Phase 4 khi:** Hệ thống chạy lại được theo tài liệu và các cảnh báo dựa trên số đo hợp lệ; lỗi chưa xử lý được ghi rõ tác động và cách trình bày khi demo.

### Phase 5 — Đóng gói và bàn giao

**TKiet thực hiện:**

- Tổng hợp README của dự án: sơ đồ kiến trúc, danh sách linh kiện, cách lắp/khởi động, cấu hình cần nhập, thứ tự chạy ESP32 → backend → web/mobile và cách kiểm tra dữ liệu.
- Đóng phiên bản pin map, hợp đồng API/module, ảnh mạch, bộ dữ liệu mẫu, báo cáo kiểm thử và phân công đóng góp của 7 người.
- Tập dượt kịch bản demo: đo thật → nhận dữ liệu → xem web/mobile → tình huống trạng thái/cảnh báo; phân người trình bày từng phần và phương án demo bằng dữ liệu mẫu nếu thiết bị chưa sẵn sàng.

**Đầu ra:** README, tài liệu tái hiện MVP, checklist demo, minh chứng hoạt động và danh sách đóng góp.  
**Đạt Phase 5 khi:** Một thành viên khác có thể dựa vào tài liệu để lắp, khởi động và kiểm tra hệ thống; demo thể hiện được đường dữ liệu và giới hạn đã ghi nhận.

## 5. Điểm bàn giao và xử lý chặn

| Khi cần | TKiet giao/nhận gì | Ai tiếp nhận/phản hồi |
| --- | --- | --- |
| Bắt đầu firmware | Bảng GPIO, nguồn/GND, ảnh mạch, mẫu số đo và trạng thái | QTien, TVan |
| Bắt đầu backend | Payload mẫu, `device_id`, quy tắc thời gian, số đo lỗi/chưa hiệu chuẩn | TDat |
| Bắt đầu web/mobile | API mẫu, trạng thái chưa có dữ liệu/lỗi/dữ liệu cũ | DKhoa, QThang |
| Bắt đầu kiểm thử/quy tắc | Đơn vị đo, ngữ nghĩa số đo, cách xác định đo hợp lệ | MThuy |
| Khi đổi chân dây/schema/API | Issue + tài liệu thay đổi + người bị ảnh hưởng + phiên bản mới | TKiet điều phối; chủ sở hữu liên quan xác nhận |

**Quy tắc kết thúc một Phase:** Đánh dấu các đầu ra đã có, ghi bằng chứng chạy thử, liệt kê việc còn mở và người nhận; chỉ chuyển một phụ thuộc sang Phase sau khi bên nhận xác nhận có đủ tài liệu hoặc dữ liệu mẫu để tiếp tục.

---

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

---

# 03 — TVan: Chương trình chính ESP32, Wi‑Fi và truyền dữ liệu

**Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT  
**Người phụ trách chính:** TVan  
**Trách nhiệm chính:** Xây dựng chương trình chính ESP32, kết nối Wi‑Fi, đóng gói payload và gửi dữ liệu đến backend.  
**Phối hợp trực tiếp:** QTien bàn giao module đọc cảm biến; TDat tiếp nhận payload và cung cấp API; TKiet hỗ trợ mạch, cấu hình và tích hợp.

## 1. Kết quả cần bàn giao

Một chương trình chính cho ESP32 nhận mẫu đo từ module của QTien, gắn mã thiết bị/thời gian theo hợp đồng, đóng gói dữ liệu, kết nối Wi‑Fi và gửi đến API của TDat. Khi cảm biến hoặc mạng có sự cố, chương trình phải ghi trạng thái rõ ràng và tiếp tục hoạt động theo chính sách lỗi đã chốt, để backend và giao diện không hiểu nhầm dữ liệu cũ hoặc thiếu thành số đo mới hợp lệ.

### Ranh giới sở hữu

| TVan trực tiếp làm | Chủ sở hữu phần liên quan |
| --- | --- |
| Chương trình chính, lịch lấy mẫu/gửi, cấu hình thiết bị, Wi‑Fi, tạo payload và gửi API; xử lý phản hồi, mất kết nối, thử lại và log truyền dữ liệu | QTien: mã trong `firmware/sensors/`, giá trị/trạng thái từng cảm biến và hiệu chuẩn |
| Bộ dữ liệu mô phỏng đầu vào từ QTien và máy nhận giả để phát triển độc lập; hướng dẫn nạp/chạy toàn bộ firmware | TKiet: mạch, pin map, tài liệu kiến trúc và tích hợp hệ thống |
| Phối hợp với TDat chốt cách firmware gọi API, mã lỗi và xác nhận bản ghi đã nhận | TDat: endpoint, xác thực nếu có, kiểm tra payload, lưu trữ và API cho giao diện; DKhoa/QThang: web/mobile; MThuy: quy tắc chăm sóc và kiểm thử |

**Vùng sở hữu đề xuất:** chương trình chính trong `firmware/` và `firmware/network/`; chốt cây thư mục ở G0. Không sửa trực tiếp `firmware/sensors/`, `backend/`, `web/` hoặc `mobile/`. Đề xuất đổi giao diện chung qua issue/PR và để TKiet điều phối xác nhận.

## 2. Hai điểm nối cần chốt trước khi làm song song

### QTien → TVan: module cảm biến

Sử dụng `docs/contracts/sensor-module.md` sau mốc **G0**. TVan cần biết tên hàm khởi tạo/lấy mẫu, kiểu kết quả, thời gian chờ và trạng thái riêng của DHT22, HD‑38, DS18B20. QTien trả về **giá trị và trạng thái của lần đọc**; TVan điều khiển khi nào gọi, gắn `device_id` và `recorded_at` theo quy ước đã duyệt, rồi chuyển sang payload gửi đi. Một cảm biến lỗi không tự động xóa dữ liệu hợp lệ của cảm biến khác.

### TVan → TDat: API nhận số đo

TDat soạn chi tiết `docs/contracts/api.md` và chốt với TVan, TKiet. G0 phải có: địa chỉ/đường dẫn API trong môi trường thử, phương thức gửi, cấu trúc JSON, kiểu dữ liệu, đơn vị, quy ước `null`/trạng thái lỗi, cách xác định thời gian đo và thời gian server nhận, phản hồi thành công/thất bại, xử lý bản ghi gửi lại và cách nhận diện thiết bị. Nếu có khóa truy cập, thống nhất cách cấu hình riêng; không đặt thông tin bí mật thật trong mã nguồn hoặc log.

Các trường nêu ở file 01 (`device_id`, `recorded_at`, `air_temperature_c`, `air_humidity_pct`, `soil_temperature_c`, `soil_moisture_raw`, `soil_moisture_pct`, `sensor_status`) là **khung để thảo luận tại G0**. TVan không tự coi đó là schema chính thức. Chỉ chuyển `soil_moisture_pct` thành số khi QTien đã hiệu chuẩn; giá trị thiếu/lỗi được xuất theo hợp đồng, không tự thay bằng `0`. Nếu đồng hồ ESP32 chưa có thời gian đáng tin cậy, làm theo quy tắc G0 với TDat, không tự gắn thời điểm hiện tại giả.

**Cách làm song song:** TVan dùng module giả của QTien để lập lịch, tạo JSON và gửi tới máy nhận giả; TDat dùng cùng payload mẫu để dựng endpoint. Khi module cảm biến và API thật sẵn sàng, thay adapter/địa chỉ thử theo hợp đồng, không viết lại luồng dữ liệu.

## 3. Kế hoạch theo Phase

### Phase 0 — Chốt hợp đồng và kịch bản thử (G0)

**TVan thực hiện:**

- Nhận pin map/phiên bản mạch từ TKiet, cùng QTien chốt hàm gọi module, nhịp đọc, thời gian chờ, kiểu dữ liệu và trạng thái. Kiểm tra chương trình chính có thể gọi module giả mà không chạm mã đọc cảm biến.
- Cùng TDat chốt bản request/response mẫu cho số đo bình thường, cảm biến lỗi một phần, HD‑38 chưa hiệu chuẩn và bản ghi gửi lại. Chốt quy tắc đồng hồ, `device_id`, lần gửi thành công và tiêu chí dữ liệu trùng.
- Thống nhất với TKiet các tham số cấu hình: mạng, địa chỉ server, mã thiết bị, khoảng đo/gửi, mức log; xác định cái nào là giá trị mẫu và cái nào phải nhập khi chạy thật.

**Đầu ra:** Giao diện module được xác nhận; payload/response mẫu, bảng cấu hình và ma trận trường hợp truyền dữ liệu.  
**Đạt G0 khi:** QTien biên dịch được module giả đúng giao diện, TVan tạo được payload mẫu, TDat xác nhận có thể nhận/diễn giải payload đó; TKiet lưu phiên bản hợp đồng chính thức để mọi người cùng dùng.

### Phase 1 — Dựng chương trình chính và kết nối Wi‑Fi

**TVan thực hiện:**

- Tạo cấu trúc chương trình khởi động, gọi module giả theo lịch, nhận một mẫu với giá trị/trạng thái và ghi log dễ đối chiếu. Không gắn nhãn “mẫu mới” cho kết quả đọc cũ.
- Triển khai cấu hình Wi‑Fi và server ngoài mã nguồn bí mật; cho biết trạng thái đang kết nối, đã kết nối, mất kết nối. Nếu kết nối chưa có, chương trình vẫn chạy theo chính sách lấy mẫu và xử lý dữ liệu đã chốt.
- Xác định chỗ gắn mã thiết bị và thời gian; kiểm tra với TKiet/TDat cách xử lý khi đồng hồ chưa đồng bộ hoặc server chưa truy cập được.

**Đầu ra:** Firmware chính chạy với module giả, log trạng thái mạng và hướng dẫn cấu hình môi trường thử.  
**Đạt Phase 1 khi:** ESP32 khởi động lại được, tự thử kết nối Wi‑Fi theo cấu hình, gọi module giả và ghi được trạng thái mạng/số đo mà không cần backend thật.

### Phase 2 — Đóng gói, gửi API và xử lý lỗi mạng

**TVan thực hiện:**

- Chuyển mẫu đo và trạng thái từ QTien thành payload đúng bản hợp đồng; kiểm tra tên trường, đơn vị, kiểu dữ liệu, `null`, thời gian và mã thiết bị trước khi gửi.
- Gửi tới máy nhận giả hoặc endpoint thử của TDat; đọc phản hồi, phân biệt đã nhận, lỗi payload và lỗi tạm thời. Ghi log mã phản hồi, mã mẫu hoặc thông tin đủ để đối chiếu mà không lộ thông tin truy cập.
- Thực hiện chính sách thử lại đã chốt: giới hạn số lần/tần suất, tránh gửi dồn vô hạn; phối hợp TDat cách nhận diện bản ghi gửi lại để không lưu trùng. Nếu MVP không lưu được mẫu qua lần khởi động lại, ghi rõ giới hạn đó trong tài liệu.
- Tạo bộ payload mẫu cho bình thường, một cảm biến lỗi, chưa hiệu chuẩn, Wi‑Fi mất, backend không phản hồi và đồng hồ chưa sẵn sàng theo quy tắc G0.

**Đầu ra:** Firmware gửi được payload mẫu, log phản hồi, dữ liệu thử và hướng dẫn vận hành khi mất mạng.  
**Đạt Phase 2 khi:** TDat nhận và xác nhận một mẫu bình thường lẫn một mẫu lỗi theo đúng schema; TVan không báo gửi thành công trước khi có phản hồi được G0 định nghĩa là thành công.

### Phase 3 — Ghép cảm biến thật và thử đầu cuối

**TVan thực hiện:**

- Thay module giả bằng module thật của QTien trên mạch TKiet bàn giao; kiểm tra nhịp lấy mẫu khi Wi‑Fi bật và việc chương trình mạng vẫn tiếp tục nếu một phép đọc thất bại.
- Cùng QTien so sánh log cảm biến với JSON trước khi gửi; cùng TDat đối chiếu request/response và bản ghi đã lưu; cùng TKiet kiểm tra dữ liệu đi tới web/mobile.
- Chạy thử các tình huống rút một cảm biến, Wi‑Fi ngắt rồi có lại, server tạm thời lỗi, gửi lại bản ghi, khởi động lại ESP32, dữ liệu cũ và chưa hiệu chuẩn. Lập issue có cách tái hiện, log và chủ sở hữu lỗi.

**Đầu ra:** Firmware tích hợp, log theo một đường dữ liệu thật, bảng kết quả các ca lỗi và issue còn mở.  
**Đạt Phase 3 khi:** Mẫu đo thật xuất hiện trong backend và giao diện theo cùng `device_id`, thời gian, đơn vị, trạng thái; các ca mất mạng/cảm biến không tạo ra số đo giả hợp lệ hoặc xác nhận gửi thành công sai.

### Phase 4 — Chạy thử trong bối cảnh vườn ươm

**TVan thực hiện:**

- Chạy firmware với mạch và vị trí đặt đã chốt; theo dõi độ ổn định kết nối, số mẫu tạo/đã nhận/chưa gửi, thời gian của bản ghi và phản hồi khi mạng chập chờn.
- Cùng QTien/MThuy đối chiếu trạng thái cảm biến và điều kiện đo; nếu đổi nhịp đọc, chính sách thử lại hoặc cách gắn thời gian, ghi tác động lên API, giao diện và dữ liệu cũ rồi xin xác nhận từ TKiet/TDat.
- Chạy lại ca lỗi có liên quan sau mỗi thay đổi; tổng hợp giới hạn thực tế của khả năng giữ và gửi lại dữ liệu.

**Đầu ra:** Nhật ký chạy thử, cấu hình cuối, số liệu đối chiếu mẫu đo/gửi/nhận và giới hạn đã xác nhận.  
**Đạt Phase 4 khi:** Có thể giải thích mẫu nào đã tới server, mẫu nào bị lỗi/mất và vì sao; dữ liệu cũ hoặc chưa có thời gian tin cậy được thể hiện theo hợp đồng.

### Phase 5 — Đóng gói và bàn giao

**TVan thực hiện:**

- Viết README firmware: cách cấu hình Wi‑Fi/server/`device_id`, nạp chương trình, xem log, chạy với module giả hay module thật, thứ tự kiểm tra khi mất cảm biến hoặc mất mạng.
- Bàn giao mã nguồn, phiên bản hợp đồng sử dụng, payload/response mẫu, kết quả thử endpoint, log tích hợp và các giới hạn của chính sách thử lại cho TKiet và TDat.
- Hỗ trợ kịch bản demo của TKiet: giải thích một mẫu từ ESP32 tới backend; chuẩn bị cách chạy lại bằng dữ liệu mẫu nếu buổi demo không có kết nối ổn định.

**Đầu ra:** Firmware có hướng dẫn chạy lại, cấu hình mẫu không chứa bí mật, bộ payload mẫu và biên bản kiểm thử.  
**Đạt Phase 5 khi:** TKiet hoặc QTien có thể nạp/chạy theo hướng dẫn, nhận ra trạng thái Wi‑Fi/API và kiểm tra một mẫu đã được backend xác nhận.

## 4. Checklist bàn giao cho TKiet và TDat

- [ ] Chương trình chính gọi module QTien qua giao diện G0, không sao chép logic đọc cảm biến.
- [ ] Payload đúng phiên bản API, có `device_id`, quy tắc thời gian, đơn vị và trạng thái từng cảm biến như đã duyệt.
- [ ] Giá trị lỗi/chưa hiệu chuẩn là thiếu theo hợp đồng; không tự ghi `0` hoặc gắn thời gian giả.
- [ ] Có log và cách tái hiện các trường hợp mất Wi‑Fi, server lỗi, phản hồi thành công và gửi lại.
- [ ] Giới hạn của hàng đợi/thử lại và tác động khi khởi động lại đã được ghi rõ.
- [ ] Có hướng dẫn cấu hình, nạp, xem log; không có thông tin truy cập thật trong repo.
- [ ] QTien xác nhận mẫu đầu vào, TDat xác nhận request/response, TKiet xác nhận đường dữ liệu đầu cuối.

**Khi bị chặn:** Chưa có mạch/module thật thì dùng module giả G0; chưa có API thật thì dùng máy nhận giả theo request/response mẫu. Ghi phần chưa kiểm tra thực tế là `đang chặn` kèm người cần bàn giao. Nếu cần đổi schema, thời gian hoặc chính sách gửi lại, mở issue có ví dụ trước/sau và nhận xác nhận của TKiet, QTien, TDat trước khi đổi giao diện chung.

---

# 04 — TDat: Backend, API và cơ sở dữ liệu

**Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT  
**Người phụ trách chính:** TDat  
**Trách nhiệm chính:** Xây dựng backend, API và cơ sở dữ liệu để nhận, kiểm tra, lưu trữ và cung cấp số đo cho web/mobile.  
**Phối hợp trực tiếp:** TVan gửi payload từ ESP32; DKhoa và QThang sử dụng API cho web/mobile; MThuy cung cấp quy tắc và ca kiểm thử; TKiet chốt kiến trúc và tích hợp.

## 1. Kết quả cần bàn giao

Một backend nhận số đo ESP32 do TVan gửi, kiểm tra và lưu dữ liệu, sau đó cung cấp API để web (DKhoa) và mobile (QThang) đọc số đo mới nhất, lịch sử và trạng thái liên quan. Phản hồi phải phân biệt rõ **số đo hợp lệ, thiếu/lỗi/chưa hiệu chuẩn, dữ liệu cũ và thiết bị chưa có dữ liệu**. Các quy tắc chăm sóc do MThuy đề xuất chỉ được triển khai theo nơi xử lý mà cả nhóm chốt tại G0.

### Ranh giới sở hữu

| TDat trực tiếp làm | Chủ sở hữu phần liên quan |
| --- | --- |
| Thiết kế CSDL, migration/khởi tạo dữ liệu, API nhận số đo, kiểm tra payload, lưu và truy vấn bản ghi, phản hồi lỗi, dữ liệu giả và tài liệu API | TVan: chương trình ESP32, đóng gói và gửi payload; QTien: đọc cảm biến và trạng thái kỹ thuật |
| API phục vụ web/mobile; quy tắc phân trang/lọc/thời gian; cách thể hiện thiết bị chưa gửi dữ liệu, lần gửi cuối và dữ liệu cũ | DKhoa/QThang: màn hình, tương tác và xử lý trạng thái phía giao diện |
| Phần mã thực thi quy tắc/cảnh báo trên server **nếu G0 chọn backend làm nơi xử lý**; kiểm tra và lưu kết quả theo hợp đồng | MThuy: nội dung ngưỡng, ý nghĩa chăm sóc và ca kiểm thử; TKiet: điều phối kiến trúc, tích hợp và mạch |

**Vùng sở hữu đề xuất:** `backend/`, migration và fixture kiểm thử backend. TDat soạn chi tiết `docs/contracts/api.md` để TKiet chủ trì chốt tại G0; mọi thay đổi sau G0 cần thông báo TVan, DKhoa, QThang, MThuy. Không tự sửa firmware, web hoặc mobile để thích ứng với một API đổi ngầm.

## 2. Hợp đồng để các phần việc chạy song song

### ESP32 → backend

Tại **Phase 0 (G0)**, TVan và TDat xác nhận một request mẫu cùng phản hồi thành công/lỗi. Tài liệu API phải ghi rõ đường dẫn, phương thức, kiểu dữ liệu, mã thiết bị, đơn vị, giá trị `null`, trạng thái từng cảm biến, quy tắc thời gian và cách nhận diện bản ghi gửi lại. Các trường `device_id`, `recorded_at`, `air_temperature_c`, `air_humidity_pct`, `soil_temperature_c`, `soil_moisture_raw`, `soil_moisture_pct`, `sensor_status` trong file 01 là **khung thảo luận**, chưa phải schema chính thức.

- Lưu riêng **thời điểm đo** theo hợp đồng (`recorded_at`, có thể thiếu nếu đồng hồ thiết bị chưa đáng tin) và **thời điểm server nhận** (`received_at`). Chốt với TVan cách xử lý trường hợp thiếu thời điểm đo; không tự biến thời điểm nhận thành thời điểm đo mà không ghi rõ.
- Thống nhất một cách chống lưu trùng khi TVan gửi lại: mã mẫu hoặc khóa duy nhất được chốt ở G0, cùng phản hồi khi bản ghi đã nhận trước đó. Không dùng riêng giá trị cảm biến làm khóa trùng.
- Xác định điều kiện chấp nhận payload lỗi một phần: cảm biến hỏng có giá trị thiếu kèm trạng thái, các cảm biến khác vẫn được lưu nếu hợp đồng cho phép. Không thay số đo thiếu bằng `0`.
- Chốt quy tắc xác thực/kết nối cho môi trường demo nếu dùng; thông tin truy cập thật đặt trong cấu hình riêng và không đưa vào dữ liệu mẫu công khai.

### Backend → web/mobile

TDat cung cấp cho DKhoa/QThang **response mẫu** ngay tại G0, trước khi CSDL hoàn chỉnh: một thiết bị chưa có bản ghi, số đo hợp lệ mới nhất, một cảm biến lỗi, HD‑38 chưa hiệu chuẩn, dữ liệu đã cũ và lỗi server. Chốt cách lấy dữ liệu mới nhất/lịch sử, thứ tự thời gian, giới hạn số bản ghi, đơn vị, mã lỗi và tiêu chí “cũ” để hai giao diện làm bằng mock.

**Danh sách API để thảo luận ở G0, không phải URL đã duyệt:** nhận số đo; lấy số đo mới nhất theo thiết bị; lấy lịch sử có giới hạn; lấy trạng thái thiết bị/cảnh báo nếu MVP cần. TDat chịu trách nhiệm công bố URL và ví dụ request/response cuối cùng trong `docs/contracts/api.md`.

### Quy tắc chăm sóc

MThuy bàn giao ngưỡng/điều kiện, giải thích và ca thử; TKiet cùng TDat/DKhoa/QThang/MThuy chốt **một nơi tính kết quả** (backend hoặc giao diện theo kiến trúc MVP). Nếu chọn backend, TDat triển khai quy tắc bằng phiên bản đã duyệt, chỉ áp dụng trên số đo hợp lệ, trả cả trạng thái “không đủ dữ liệu” khi cần và ghi rõ phiên bản quy tắc. Không tự đặt ngưỡng cho cây ớt hoặc biến trạng thái cảm biến lỗi thành lời khuyên chăm sóc.

## 3. Kế hoạch theo Phase

### Phase 0 — Chốt dữ liệu và API (G0)

**TDat thực hiện:**

- Nhận từ TKiet sơ đồ kiến trúc, khung bản ghi và yêu cầu demo; cùng QTien/TVan chốt giá trị, đơn vị, trạng thái cảm biến, thời gian, mã thiết bị và ví dụ số đo lỗi/chưa hiệu chuẩn.
- Soạn `docs/contracts/api.md`: request/response và mã lỗi cho nhận số đo, truy vấn mới nhất/lịch sử; cách xử lý bản ghi trùng, dữ liệu cũ, chưa có dữ liệu và giới hạn truy vấn.
- Cùng DKhoa/QThang chốt dữ liệu cần để hiển thị và lọc lịch sử; cùng MThuy chốt dữ liệu cần cho quy tắc, nơi áp dụng quy tắc và mẫu phản hồi cảnh báo nếu có.
- Chọn công nghệ backend/CSDL phù hợp khả năng nhóm và cách chạy demo; ghi quyết định cùng lệnh khởi động, không buộc thành viên khác đợi cài đặt mới biết schema.

**Đầu ra:** Hợp đồng API v0.1, sơ đồ dữ liệu/khóa, bộ fixture request/response và bảng quyết định về thời gian, gửi lại, dữ liệu cũ, quy tắc.  
**Đạt G0 khi:** TVan xác nhận payload và phản hồi ingest; DKhoa/QThang xác nhận response để dựng màn hình; MThuy xác nhận trạng thái dùng cho quy tắc; TKiet lưu phiên bản chính thức.

### Phase 1 — Dựng backend, CSDL và dữ liệu mẫu

**TDat thực hiện:**

- Tạo cấu trúc `backend/`, cấu hình mẫu, lệnh chạy và migration/khởi tạo CSDL. Thiết kế bản ghi thiết bị và số đo với khóa/quan hệ, trạng thái cảm biến, thời điểm đo và thời điểm nhận; thêm chỉ mục phục vụ xem số đo mới nhất/lịch sử khi cần.
- Nạp bộ fixture theo G0 gồm: chưa có dữ liệu, mẫu bình thường, cảm biến lỗi một phần, HD‑38 chưa hiệu chuẩn, bản ghi cũ và nhiều bản ghi theo thứ tự thời gian.
- Trả response mẫu theo hợp đồng qua backend thử hoặc tệp fixture để DKhoa/QThang có thể phát triển độc lập; giữ schema giống API thật dự định triển khai.

**Đầu ra:** Backend khởi chạy được, schema/migration tái tạo được, fixture và cách reset dữ liệu demo.  
**Đạt Phase 1 khi:** Một người khác chạy được backend và dựng lại CSDL theo README; DKhoa/QThang có response đúng hợp đồng mà không cần ESP32 thật.

### Phase 2 — Hoàn thiện API nhận và truy vấn

**TDat thực hiện:**

- Triển khai API nhận: kiểm tra mã thiết bị, trường bắt buộc, kiểu/đơn vị/trạng thái, giá trị không hợp lệ, lỗi một phần và phản hồi rõ lỗi để TVan sửa payload.
- Lưu bản ghi với `recorded_at`/`received_at` đúng quy tắc G0; áp dụng cách nhận diện bản ghi gửi lại để việc mất mạng/thử lại không tạo bản ghi trùng ngoài ý muốn.
- Triển khai truy vấn mới nhất/lịch sử và trạng thái thiết bị theo API đã duyệt. Xử lý thiết bị chưa có dữ liệu, giới hạn số bản ghi, thứ tự thời gian và tiêu chí dữ liệu cũ thống nhất với DKhoa/QThang.
- Nếu G0 giao xử lý quy tắc cho backend, triển khai theo dữ liệu và ca thử MThuy bàn giao; tách cấu hình quy tắc khỏi hằng số tùy ý trong mã.

**Đầu ra:** API chạy với fixture, ví dụ gọi endpoint, bảng phản hồi thành công/lỗi và kết quả ca thử backend.  
**Đạt Phase 2 khi:** Payload mẫu TVan gửi được lưu/truy xuất đúng; DKhoa/QThang nhận đủ các response đã chốt; gửi lại cùng mã mẫu cho kết quả theo chính sách chống trùng G0.

### Phase 3 — Tích hợp ESP32 và giao diện

**TDat thực hiện:**

- Mở endpoint thử cho TVan theo cấu hình thống nhất với TKiet; đối chiếu log ESP32 → request → phản hồi → bản ghi CSDL bằng cùng `device_id` và mã mẫu.
- Cùng DKhoa/QThang kiểm tra số đo mới nhất, lịch sử, trạng thái cũ/lỗi/chưa hiệu chuẩn và các lỗi API trên web/mobile; xác minh giá trị và đơn vị không bị đổi qua từng tầng.
- Cùng MThuy chạy ca quy tắc chăm sóc theo nơi xử lý đã chốt; nếu lỗi thuộc schema hoặc ngữ nghĩa, ghi issue có payload, kết quả nhận được, kết quả mong đợi và người sửa.

**Đầu ra:** Biên bản tích hợp đầu cuối, log/API response, dữ liệu CSDL đối chiếu và danh sách issue.  
**Đạt Phase 3 khi:** Một mẫu đo thật từ ESP32 được backend xác nhận, lưu, truy xuất và hiển thị đúng trên web/mobile; cảm biến lỗi một phần không làm hệ thống trình bày giá trị thiếu như số hợp lệ.

### Phase 4 — Thử ổn định trong bối cảnh vườn ươm

**TDat thực hiện:**

- Theo dõi mẫu được nhận, mẫu gửi lại, lỗi API, thời gian thiết bị/server và kết quả truy vấn khi mạng không ổn định; kiểm tra cùng TVan rằng phản hồi server đủ để phân biệt gửi thành công với gửi thất bại.
- Cùng MThuy kiểm tra trạng thái dữ liệu cũ và điều kiện áp dụng quy tắc; nếu thay đổi cấu hình hiệu chuẩn hoặc phiên bản quy tắc, ghi ảnh hưởng đến bản ghi cũ và response giao diện.
- Chạy lại các ca có liên quan sau khi sửa; ghi rõ giới hạn lưu trữ, độ trễ và dữ liệu có thể mất trong phạm vi MVP.

**Đầu ra:** Nhật ký chạy thử, kết quả kiểm tra gửi lại/lịch sử/trạng thái, danh sách giới hạn đã xác nhận.  
**Đạt Phase 4 khi:** Có thể truy vết mỗi mẫu từ ESP32 tới CSDL, giải thích bản ghi trùng/bị từ chối và xác định vì sao giao diện hiển thị trạng thái hiện tại.

### Phase 5 — Đóng gói và bàn giao

**TDat thực hiện:**

- Viết README backend: yêu cầu chạy, cấu hình mẫu, lệnh khởi động, migration, nạp/reset fixture, ví dụ gọi API và cách xem log/lỗi.
- Cập nhật `docs/contracts/api.md` đúng phiên bản cuối; bàn giao schema CSDL, response mẫu, kết quả kiểm thử và các quyết định về thời gian, gửi lại, dữ liệu cũ, quy tắc.
- Cùng TKiet tập dượt demo từ ESP32 thật; chuẩn bị fixture có thể tái hiện luồng hiển thị khi mạch hoặc Wi‑Fi chưa sẵn sàng.

**Đầu ra:** Backend và CSDL chạy lại được, tài liệu API, fixture, bằng chứng kiểm thử/tích hợp.  
**Đạt Phase 5 khi:** TKiet hoặc một thành viên khác dựng được backend từ hướng dẫn, gửi một payload mẫu, đọc lại số đo và giải thích các trạng thái lỗi/cũ/chưa hiệu chuẩn.

## 4. Checklist bàn giao cho các bên

- [ ] TVan có địa chỉ thử, request/response mẫu, mã lỗi và quy tắc gửi lại đã duyệt.
- [ ] DKhoa/QThang có response mẫu cho bình thường, chưa có dữ liệu, lỗi cảm biến, chưa hiệu chuẩn và dữ liệu cũ.
- [ ] MThuy biết nơi xử lý quy tắc, dữ liệu đầu vào hợp lệ và cấu trúc phản hồi cảnh báo nếu có.
- [ ] CSDL lưu được giá trị thiếu và trạng thái mà không biến thành `0`; có thời điểm đo/nhận theo quy tắc G0.
- [ ] Có cách nhận diện bản ghi gửi lại và giới hạn truy vấn lịch sử; hành vi được mô tả trong tài liệu API.
- [ ] Migration, fixture, cấu hình mẫu và hướng dẫn chạy/reset không chứa thông tin truy cập thật.
- [ ] TKiet kiểm tra một đường dữ liệu thật từ cảm biến tới web/mobile và nhận biên bản lỗi còn mở.

**Khi bị chặn:** Chưa có firmware thì dùng payload G0 của TVan; chưa có giao diện thì gọi API bằng fixture. Ghi phần chưa kiểm tra trên thiết bị thật là `đang chặn` kèm người cần bàn giao. Nếu API/schema phải đổi, gửi ví dụ trước/sau và tác động cho TKiet, TVan, DKhoa, QThang, MThuy; chỉ đổi bản hợp đồng chính sau khi các bên liên quan xác nhận.

---

# 05 — DKhoa: Web dashboard

**Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT  
**Người phụ trách chính:** DKhoa  
**Trách nhiệm chính:** Xây dựng web dashboard để hiển thị số đo, lịch sử, trạng thái và cảnh báo theo API đã thống nhất.  
**Phối hợp trực tiếp:** TDat cung cấp API; QThang thống nhất cách hiển thị giữa web/mobile; MThuy cung cấp nội dung quy tắc; TKiet chốt phạm vi và tích hợp.

## 1. Kết quả cần bàn giao

Một dashboard web để xem tình trạng thiết bị và các số đo của vườn ươm: **nhiệt độ không khí, độ ẩm không khí, nhiệt độ đất, độ ẩm đất**, thời điểm đo, lịch sử và trạng thái/cảnh báo theo phạm vi MVP đã chốt. Khi dữ liệu thiếu, cảm biến lỗi, chưa hiệu chuẩn, dữ liệu cũ hoặc server không truy cập được, màn hình phải diễn đạt đúng tình trạng thay vì trình bày số đo như còn mới và hợp lệ.

### Ranh giới sở hữu

| DKhoa trực tiếp làm | Người khác phụ trách |
| --- | --- |
| Giao diện web, các thành phần hiển thị số đo/trạng thái, lựa chọn thiết bị nếu có nhiều thiết bị, lịch sử, thời gian, định dạng đơn vị, trạng thái tải/lỗi | TDat: API, CSDL, kiểm tra và trả dữ liệu; TVan: ESP32 gửi số đo |
| Lớp gọi API ở web, dữ liệu giả theo response G0, cách chuyển từ dữ liệu giả sang API thật, hướng dẫn chạy web | QThang: ứng dụng mobile riêng; không cần sửa chung mã của nhau |
| Hiển thị kết quả quy tắc/chăm sóc theo tài liệu đã duyệt; phần tính ở web chỉ làm nếu G0 giao rõ | MThuy: nội dung/ngưỡng và ca thử; TKiet: chốt nơi xử lý quy tắc, điều phối tích hợp |

**Vùng sở hữu đề xuất:** `web/` cùng fixture và hướng dẫn chạy web. DKhoa review phần phản hồi web trong `docs/contracts/api.md`; TDat soạn API, TKiet chủ trì chốt hợp đồng tại G0. Không sửa backend hoặc mobile để giải quyết chênh lệch schema nếu chưa trao đổi với chủ sở hữu.

## 2. Hợp đồng đầu vào và cách làm song song

Tại **Phase 0 (G0)**, DKhoa nhận từ TDat response mẫu và quy ước truy vấn: số đo mới nhất, lịch sử có giới hạn, thiết bị chưa có dữ liệu, dữ liệu cũ, một cảm biến lỗi, HD‑38 chưa hiệu chuẩn, cảnh báo (nếu có), lỗi server. DKhoa và QThang thống nhất **ý nghĩa trạng thái và đơn vị** để hai giao diện không diễn giải trái nhau; mỗi người vẫn sở hữu mã giao diện riêng.

| Trạng thái đầu vào | Web cần thể hiện |
| --- | --- |
| Đang tải / API không truy cập được | Phân biệt đang chờ với lỗi kết nối; có hành động thử lại theo thiết kế đã chốt |
| Chưa có bản ghi cho thiết bị | Thông báo chưa có dữ liệu, không vẽ số `0` hoặc biểu đồ giả |
| Mẫu hợp lệ, mới | Hiện giá trị, đơn vị, trạng thái và thời điểm đo/nhận theo quy tắc G0 |
| Chỉ một cảm biến lỗi | Giữ số đo hợp lệ của các cảm biến khác; ô bị lỗi ghi “Không có số đo” và lý do nếu API cung cấp |
| HD‑38 chưa hiệu chuẩn | Có thể hiện số đọc thô nếu nhóm quyết định; không gắn `%` cho số thô và không coi đó là độ ẩm đất % |
| Dữ liệu cũ / thiết bị mất liên lạc | Gắn nhãn “Dữ liệu cũ”, cho biết lần cập nhật cuối; không trình bày như trạng thái hiện tại |
| Số đo hợp lệ bằng `0` | Hiện `0` đúng đơn vị; khác hoàn toàn với `null` hoặc trạng thái lỗi |

**Giao diện dữ liệu G0 là nguồn thống nhất.** Các trường nêu ở file 01 (`device_id`, `recorded_at`, `air_temperature_c`, `air_humidity_pct`, `soil_temperature_c`, `soil_moisture_raw`, `soil_moisture_pct`, `sensor_status`) chỉ là khung thảo luận. Chốt với TDat cách API biểu diễn trạng thái từng cảm biến, thời điểm đo và thời điểm server nhận, thứ tự/trang lịch sử, tiêu chí dữ liệu cũ và tần suất làm mới. Định dạng ngày giờ hiển thị phải rõ múi giờ và không biến thời điểm server nhận thành thời điểm đo.

**Cách làm song song:** Dựng giao diện bằng bộ response giả đúng G0 và đặt việc gọi dữ liệu sau một lớp adapter/API riêng. TDat có thể hoàn thiện backend, TVan có thể hoàn thiện ESP32 mà DKhoa không phải chờ. Khi API thật sẵn sàng, đổi nguồn dữ liệu trong adapter và đối chiếu các trạng thái đã thử bằng fixture.

## 3. Kế hoạch theo Phase

### Phase 0 — Chốt màn hình và hợp đồng dữ liệu (G0)

**DKhoa thực hiện:**

- Cùng TKiet chọn các màn hình MVP cần demo: tổng quan thiết bị, số đo mới nhất, lịch sử và trạng thái/cảnh báo theo phạm vi nhóm; phác bố cục dùng được trên máy tính và màn hình nhỏ.
- Cùng TDat rà response mẫu, tham số truy vấn, thời gian, đơn vị, mã trạng thái và các trường để lọc/chọn thiết bị. Yêu cầu bổ sung ngay tại G0 nếu có trạng thái không thể hiển thị rõ.
- Cùng QThang thống nhất tên hiển thị, đơn vị và ngữ nghĩa trạng thái; cùng MThuy thống nhất nội dung lời khuyên/cảnh báo và cách hiện “không đủ dữ liệu” nếu MVP có tính năng này.

**Đầu ra:** Phác thảo màn hình, bảng trạng thái giao diện, bộ response giả và danh sách trường API cần dùng.  
**Đạt G0 khi:** TDat xác nhận response có đủ dữ liệu; TKiet/QThang/MThuy xác nhận nội dung và cách hiểu các trạng thái; DKhoa có fixture để bắt đầu web độc lập.

### Phase 1 — Dựng giao diện với dữ liệu giả

**DKhoa thực hiện:**

- Khởi tạo `web/` và lệnh chạy; dựng bố cục tổng quan, thẻ số đo với đơn vị, thông tin thiết bị/lần cập nhật cuối và khu vực lịch sử theo thiết kế G0.
- Dùng fixture để hiển thị các ca bình thường, chưa có dữ liệu, thiếu một cảm biến, chưa hiệu chuẩn, dữ liệu cũ và lỗi tải. Tách thành phần hiển thị khỏi mã lấy dữ liệu để thay nguồn dễ dàng.
- Bảo đảm chữ, nhãn trạng thái và biểu đồ (nếu có) có thể đọc được; không dùng màu sắc làm dấu hiệu duy nhất của lỗi/cảnh báo.

**Đầu ra:** Dashboard chạy được bằng fixture, ảnh minh họa các trạng thái và README khởi chạy.  
**Đạt Phase 1 khi:** Có thể mở web và chuyển qua từng fixture mà không cần ESP32/backend; `null`, `0`, dữ liệu cũ và chưa hiệu chuẩn được hiển thị khác nhau.

### Phase 2 — Kết nối lớp API và hoàn thiện trải nghiệm

**DKhoa thực hiện:**

- Viết lớp gọi API theo hợp đồng TDat; dùng cấu hình để chọn môi trường thử và nguồn dữ liệu giả/thật. Xử lý tải, timeout/lỗi mạng, lỗi phản hồi và thử lại theo cách đã chốt.
- Hiển thị lịch sử đúng thứ tự thời gian và giới hạn truy vấn; tránh nối các điểm thiếu/lỗi thành một đường biểu đồ gây hiểu nhầm. Làm mới số đo theo tần suất G0 và gắn nhãn dữ liệu cũ theo quy tắc chung.
- Nếu có phần chăm sóc/cảnh báo, chỉ hiển thị kết quả/điều kiện theo nơi xử lý G0 và nội dung MThuy bàn giao; không tự đặt ngưỡng độ ẩm/nhiệt độ trong UI.

**Đầu ra:** Web gọi được API thử hoặc stub tương đương, bao phủ các trạng thái G0 và có lệnh cấu hình chạy.  
**Đạt Phase 2 khi:** Cùng một fixture từ TDat cho ra đúng nội dung đã duyệt; chuyển từ mock sang API qua lớp dữ liệu, không cần viết lại thẻ số đo hay lịch sử.

### Phase 3 — Tích hợp với backend và ESP32 thật

**DKhoa thực hiện:**

- Cùng TDat gọi API thật và đối chiếu giá trị, đơn vị, thời điểm, thứ tự lịch sử trên web với response; cùng TKiet kiểm tra một mẫu từ cảm biến thật qua ESP32 tới màn hình.
- Thử các ca: chưa có thiết bị/bản ghi, một cảm biến lỗi, HD‑38 chưa hiệu chuẩn, mẫu cũ, API mất kết nối, gửi bản ghi mới sau khi Wi‑Fi hồi phục. Ghi issue có response và ảnh màn hình khi kết quả sai.
- Cùng QThang so sánh cùng một bản ghi trên web/mobile để phát hiện khác biệt về đơn vị, nhãn lỗi hoặc thời điểm.

**Đầu ra:** Biên bản tích hợp web, ảnh các trạng thái và danh sách issue có người nhận.  
**Đạt Phase 3 khi:** Số đo thật xuất hiện đúng trên dashboard theo hợp đồng API; các trường thiếu/lỗi/cũ không bị hiển thị như dữ liệu mới hợp lệ. Kết quả đối chiếu với mobile được ghi riêng để QThang xử lý nếu có khác biệt.

### Phase 4 — Kiểm chứng khi chạy thử vườn ươm

**DKhoa thực hiện:**

- Quan sát dashboard khi thiết bị chạy thử: thay đổi số đo, trễ cập nhật, mất mạng rồi hồi phục và dữ liệu mới/cũ xen kẽ; so sánh với log/backend của TVan/TDat.
- Cùng MThuy kiểm tra thông điệp chăm sóc/cảnh báo nếu có: nội dung, điều kiện hiển thị, trạng thái thiếu dữ liệu; sửa trình bày khi người dùng dễ hiểu sai số đo.
- Kiểm tra ở kích thước màn hình dự kiến dùng demo; ghi và sửa các lỗi thao tác, chữ bị cắt, biểu đồ khó đọc hoặc trạng thái không rõ.

**Đầu ra:** Nhật ký kiểm chứng, ảnh trước/sau lỗi hiển thị, cấu hình giao diện cuối và giới hạn đã xác nhận.  
**Đạt Phase 4 khi:** Người xem xác định được thiết bị nào, số đo nào còn mới, số đo nào lỗi/chưa hiệu chuẩn và lần cập nhật cuối, kể cả khi mạng chập chờn.

### Phase 5 — Đóng gói và bàn giao

**DKhoa thực hiện:**

- Viết README web: yêu cầu chạy, lệnh khởi động, cấu hình địa chỉ API, cách bật fixture/demo, các màn hình và cách kiểm tra trạng thái.
- Bàn giao mã nguồn, ảnh minh chứng, bộ fixture, kết quả thử API thật, các issue còn mở và phiên bản hợp đồng API đã dùng cho TKiet/TDat.
- Cùng TKiet tập dượt đường demo: mở web → xem số đo thật → lịch sử → trạng thái/cảnh báo; chuẩn bị dữ liệu mẫu đúng G0 nếu thiết bị chưa sẵn sàng.

**Đầu ra:** Dashboard chạy lại được, hướng dẫn, fixture và bằng chứng tích hợp.  
**Đạt Phase 5 khi:** Một thành viên khác mở được dashboard bằng README, kết nối API thử và nhận biết đúng từng trạng thái chính của MVP.

## 4. Checklist bàn giao cho TKiet và TDat

- [ ] Giao diện và lớp API nằm trong `web/`, có hướng dẫn chạy và cấu hình API.
- [ ] Có fixture cho bình thường, chưa có dữ liệu, lỗi một cảm biến, chưa hiệu chuẩn, dữ liệu cũ và lỗi server.
- [ ] Số đo `0` hợp lệ khác `null`/lỗi; số đọc thô HD‑38 không bị gắn nhãn `%`.
- [ ] Thời điểm đo và thời điểm nhận được diễn giải đúng hợp đồng; dữ liệu cũ có nhãn rõ.
- [ ] Lịch sử đúng thứ tự/giới hạn, không biến khoảng thiếu dữ liệu thành đường đo liên tục.
- [ ] Không tự đặt quy tắc chăm sóc; nội dung/nguồn kết quả đã được MThuy và TKiet xác nhận.
- [ ] TDat xác nhận response/API, QThang xác nhận cách gọi trạng thái thống nhất, TKiet xác nhận đường dữ liệu thật.

**Khi bị chặn:** Nếu backend chưa chạy, tiếp tục với response giả G0 và ghi tích hợp API thật là `đang chặn`. Nếu API thiếu trường hoặc đổi schema, gửi ví dụ response, ảnh màn hình và tác động cho TKiet/TDat/QThang/MThuy; đợi hợp đồng được chốt rồi mới đổi cách diễn giải dữ liệu chung.

---

# 06 — QThang: Ứng dụng mobile

**Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT  
**Người phụ trách chính:** QThang  
**Trách nhiệm chính:** Xây dựng ứng dụng mobile để xem số đo, lịch sử, trạng thái và cảnh báo theo API đã thống nhất.  
**Phối hợp trực tiếp:** TDat cung cấp API; DKhoa thống nhất cách hiển thị giữa mobile/web; MThuy cung cấp nội dung quy tắc; TKiet chốt phạm vi và tích hợp.

## 1. Kết quả cần bàn giao

Một ứng dụng mobile xem số đo vườn ươm qua API backend: **nhiệt độ không khí, độ ẩm không khí, nhiệt độ đất, độ ẩm đất**, thiết bị, thời điểm đo/cập nhật, lịch sử và trạng thái/cảnh báo theo phạm vi MVP đã chốt. Ứng dụng phải cho biết khi nào dữ liệu chưa có, lỗi cảm biến, chưa hiệu chuẩn, đã cũ hoặc không lấy được từ server; không hiển thị số đo cũ như dữ liệu vừa đo.

### Ranh giới sở hữu

| QThang trực tiếp làm | Người khác phụ trách |
| --- | --- |
| Mã trong `mobile/`, màn hình tổng quan và lịch sử, điều hướng, hiển thị số đo/đơn vị/trạng thái trên điện thoại, cấu hình và hướng dẫn chạy ứng dụng | TDat: API/CSDL và response; TVan: gửi số đo từ ESP32 |
| Lớp gọi API trên mobile, fixture để thử khi backend chưa chạy, xử lý tải/lỗi mạng/làm mới dữ liệu | DKhoa: web dashboard riêng; hai giao diện dùng cùng hợp đồng API nhưng không sửa mã của nhau |
| Hiển thị lời khuyên/cảnh báo đã duyệt nếu thuộc MVP; phần tính tại mobile chỉ làm khi G0 giao rõ | MThuy: quy tắc và nội dung; TKiet: chốt kiến trúc, điều phối tích hợp |

**Vùng sở hữu đề xuất:** `mobile/`, fixture và tài liệu chạy ứng dụng trong đó. QThang review `docs/contracts/api.md` do TDat soạn và TKiet chủ trì chốt tại G0. Không tự sửa backend, web hoặc firmware để thích ứng với thay đổi chưa được duyệt.

## 2. Hợp đồng đầu vào để làm song song

Tại **Phase 0 (G0)**, TDat bàn giao response mẫu cho: thiết bị chưa có dữ liệu, mẫu mới hợp lệ, một cảm biến lỗi, HD‑38 chưa hiệu chuẩn, dữ liệu cũ, lịch sử nhiều bản ghi và lỗi server. QThang cùng DKhoa thống nhất tên gọi, đơn vị, ý nghĩa trạng thái, thời gian đo/nhận và tiêu chí dữ liệu cũ. Chọn nền tảng/phương án build mobile cùng TKiet theo thiết bị nhóm có thể dùng để thử và demo; ghi rõ phiên bản công cụ trong README.

| Trường hợp | Ứng dụng cần thể hiện |
| --- | --- |
| Đang tải / không gọi được API | Cho biết đang chờ hay kết nối lỗi; có cách thử lại rõ ràng |
| Chưa có bản ghi | Hiện “Chưa có dữ liệu”, không tự tạo số `0` hay lịch sử giả |
| Số đo mới, hợp lệ | Hiện giá trị, đơn vị, thiết bị và thời gian theo quy tắc G0 |
| Một cảm biến lỗi | Hiện nguyên nhân/trạng thái ở ô đó; các ô hợp lệ khác vẫn hiển thị |
| HD‑38 chưa hiệu chuẩn | Không gắn `%` cho số đọc thô và không đưa độ ẩm đất % giả vào lời khuyên |
| Dữ liệu cũ / thiết bị mất liên lạc | Gắn nhãn “Dữ liệu cũ” và lần cập nhật cuối; nếu có bản lưu trên máy, ghi rõ đó là bản đã lưu |
| Số đo hợp lệ bằng `0` | Hiện `0` như giá trị thật, phân biệt với `null` hoặc cảm biến lỗi |

Các tên trường trong file 01 (`device_id`, `recorded_at`, `air_temperature_c`, `air_humidity_pct`, `soil_temperature_c`, `soil_moisture_raw`, `soil_moisture_pct`, `sensor_status`) là **khung thảo luận**, chưa phải schema đã duyệt. QThang chỉ triển khai theo `docs/contracts/api.md` sau G0. Cần hỏi TDat cách truy vấn lịch sử/thiết bị, phân biệt thời điểm đo với thời điểm server nhận, múi giờ hiển thị và thời gian làm mới. Không tự đặt ngưỡng chăm sóc hoặc suy ra “thiết bị đang hoạt động” chỉ vì điện thoại còn giữ số đo cũ.

**Cách làm song song:** Dựng màn hình với fixture đúng response G0; đặt việc lấy dữ liệu trong một lớp API/adapter để chuyển sang backend thật mà không viết lại màn hình. DKhoa làm web và TDat làm backend độc lập; hai giao diện cùng dùng fixture để đối chiếu ngữ nghĩa, không cần chia sẻ mã ứng dụng.

## 3. Kế hoạch theo Phase

### Phase 0 — Chốt phạm vi ứng dụng và dữ liệu (G0)

**QThang thực hiện:**

- Cùng TKiet chọn luồng mobile MVP: mở ứng dụng → chọn/xem thiết bị → xem số đo mới nhất → lịch sử → trạng thái/cảnh báo theo phạm vi đã chốt. Chọn nền tảng và thiết bị thử, ghi cách chạy demo.
- Cùng TDat rà endpoint, response mẫu, đơn vị, `null`, mã lỗi, thứ tự/giới hạn lịch sử, thời điểm đo/nhận và trạng thái dữ liệu cũ. Nêu các trường còn thiếu trước khi hợp đồng được chốt.
- Cùng DKhoa thống nhất cách gọi số đo/trạng thái; cùng MThuy thống nhất nội dung lời khuyên và cách hiển thị “không đủ dữ liệu” nếu có quy tắc chăm sóc.

**Đầu ra:** Phác thảo màn hình/luồng, quyết định nền tảng, bảng trạng thái và bộ fixture theo API G0.  
**Đạt G0 khi:** TDat xác nhận response đủ cho các màn hình; TKiet/DKhoa/MThuy xác nhận cách diễn giải; QThang có thể bắt đầu bằng fixture mà không cần server thật.

### Phase 1 — Dựng màn hình bằng dữ liệu giả

**QThang thực hiện:**

- Tạo dự án `mobile/`, màn hình tổng quan thiết bị, các thẻ số đo, nhãn trạng thái/thời gian, lịch sử và điều hướng tối thiểu theo phác thảo G0.
- Cho ứng dụng chạy lần lượt các fixture: chưa có dữ liệu, bình thường, một cảm biến lỗi, chưa hiệu chuẩn, dữ liệu cũ, lịch sử nhiều bản ghi, lỗi tải. Tách thành phần hiển thị khỏi lớp lấy dữ liệu.
- Kiểm tra chữ và trạng thái trên kích thước điện thoại nhóm dùng demo; nhãn lỗi phải đọc được mà không chỉ dựa vào màu.

**Đầu ra:** Ứng dụng chạy bằng fixture trên thiết bị hoặc trình giả lập đã chọn, ảnh các trạng thái và hướng dẫn khởi chạy ngắn.  
**Đạt Phase 1 khi:** Chuyển qua các fixture không cần backend/ESP32; `null`, `0`, dữ liệu cũ và chưa hiệu chuẩn được hiển thị khác nhau.

### Phase 2 — Gọi API và xử lý trạng thái mạng

**QThang thực hiện:**

- Tạo lớp gọi API theo hợp đồng TDat; đưa địa chỉ backend vào cấu hình môi trường thử. Kiểm tra địa chỉ mà **điện thoại thật truy cập được**, không mặc định `localhost` trên điện thoại là máy chạy backend.
- Kết nối số đo mới nhất, lịch sử và trạng thái thiết bị; xử lý đang tải, lỗi mạng, phản hồi lỗi, thử lại và làm mới theo tần suất G0. Nếu giữ số đo cuối trên màn hình khi mất mạng, gắn nhãn thời gian/lỗi rõ ràng.
- Hiển thị cảnh báo/lời khuyên theo nguồn kết quả và nội dung G0; không thêm thông báo đẩy hoặc quy tắc riêng nếu chưa có trong phạm vi MVP.

**Đầu ra:** Ứng dụng gọi được API thử/stub, cấu hình địa chỉ server và bộ ca thử bằng fixture.  
**Đạt Phase 2 khi:** Cùng một response G0 cho đúng giá trị/trạng thái trên mobile; chuyển từ fixture sang API không phải viết lại màn hình.

### Phase 3 — Tích hợp với backend và số đo thật

**QThang thực hiện:**

- Cùng TDat gọi API thật trên điện thoại/trình giả lập; so sánh số đo, đơn vị, thời điểm, thứ tự lịch sử và mã thiết bị với response. Cùng TKiet kiểm tra một lần đo thật từ ESP32 tới ứng dụng.
- Thử các ca chưa có bản ghi, cảm biến lỗi một phần, HD‑38 chưa hiệu chuẩn, dữ liệu cũ, mất mạng rồi nối lại, backend không phản hồi và có số đo mới sau khi Wi‑Fi ESP32 hồi phục.
- Cùng DKhoa đối chiếu cùng bản ghi trên web/mobile; ghi issue có response, ảnh màn hình, kết quả mong đợi và người nhận nếu cách hiển thị khác nhau.

**Đầu ra:** Biên bản tích hợp mobile, ảnh màn hình theo ca thử và danh sách issue.  
**Đạt Phase 3 khi:** Mẫu đo thật hiện đúng trên mobile theo hợp đồng API; trạng thái thiếu/lỗi/cũ không bị trình bày như dữ liệu mới hợp lệ. Khác biệt với web được ghi riêng để chủ sở hữu tương ứng xử lý.

### Phase 4 — Kiểm chứng trong lúc thử vườn ươm

**QThang thực hiện:**

- Mở ứng dụng trên thiết bị dự kiến dùng demo khi mạch chạy thử; quan sát việc làm mới, mất kết nối, dữ liệu cũ và số đo mới; đối chiếu với log/backend của TVan/TDat.
- Cùng MThuy kiểm tra thông điệp chăm sóc/cảnh báo nếu có, nhất là khi thiếu số đo hoặc chưa hiệu chuẩn; sửa cách diễn đạt gây hiểu nhầm mà không tự đổi quy tắc.
- Kiểm tra thao tác bằng một tay, chữ/đơn vị trên màn hình nhỏ, thời gian tải và cách phục hồi sau khi ứng dụng tạm dừng rồi mở lại. Ghi giới hạn của chế độ mạng yếu/bản lưu trên máy nếu có.

**Đầu ra:** Nhật ký thử trên điện thoại, ảnh lỗi đã sửa, cấu hình cuối và giới hạn được ghi nhận.  
**Đạt Phase 4 khi:** Người xem có thể xác định số đo nào còn mới, số đo nào lỗi/chưa hiệu chuẩn, thời điểm cập nhật cuối và liệu màn hình đang hiển thị dữ liệu từ server hay bản đã lưu.

### Phase 5 — Đóng gói và bàn giao

**QThang thực hiện:**

- Viết README mobile: nền tảng/phiên bản công cụ, lệnh build/chạy, cấu hình API, cách bật fixture, cách thử trên điện thoại và cách xem log khi lỗi.
- Bàn giao mã, gói chạy/bản build demo theo phương án nhóm chốt, fixture, ảnh màn hình và kết quả thử API thật cho TKiet/TDat; ghi phiên bản hợp đồng API đã dùng.
- Cùng TKiet tập dượt demo: xem thiết bị → số đo thật → lịch sử → trạng thái/cảnh báo; chuẩn bị fixture đúng G0 để tái hiện khi mạch hoặc mạng chưa sẵn sàng.

**Đầu ra:** Ứng dụng chạy lại được, hướng dẫn, bản build/demo, fixture và bằng chứng tích hợp.  
**Đạt Phase 5 khi:** Một thành viên khác cài/chạy được theo README, cấu hình địa chỉ API đúng và nhận biết các trạng thái chính mà không cần QThang thao tác hộ.

## 4. Checklist bàn giao cho TKiet và TDat

- [ ] Mã ứng dụng, fixture và hướng dẫn nằm trong `mobile/`; có cấu hình API cho điện thoại thật.
- [ ] Có màn hình cho số đo mới nhất, lịch sử và trạng thái thiết bị theo phạm vi G0.
- [ ] Có fixture cho bình thường, chưa có dữ liệu, lỗi một cảm biến, chưa hiệu chuẩn, dữ liệu cũ và lỗi server.
- [ ] Giá trị `0` hợp lệ khác `null`; số đọc thô HD‑38 không được gắn `%` nếu chưa hiệu chuẩn.
- [ ] Thời điểm đo/nhận và dữ liệu cũ/bản lưu trên máy được ghi nhãn đúng hợp đồng.
- [ ] Nội dung chăm sóc do MThuy duyệt; không có ngưỡng hoặc thông báo đẩy tự thêm ngoài phạm vi.
- [ ] TDat xác nhận response/API, DKhoa xác nhận ngữ nghĩa trạng thái, TKiet xác nhận luồng đo thật tới mobile.

**Khi bị chặn:** Backend chưa chạy thì tiếp tục bằng fixture G0 và đánh dấu tích hợp API thật là `đang chặn`. Nếu điện thoại không truy cập được server thử, gửi TKiet/TDat địa chỉ, lỗi và cách tái hiện. Nếu schema đổi, nêu response trước/sau và tác động tới màn hình cho TKiet/TDat/DKhoa/MThuy; chờ hợp đồng chung được cập nhật rồi mới thay cách diễn giải.

---

# 07 — MThuy: Quy tắc chăm sóc cây và kiểm thử

**Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT  
**Người phụ trách chính:** MThuy  
**Trách nhiệm chính:** Xây dựng quy tắc chăm sóc cây, bộ dữ liệu mẫu, phương pháp đối chiếu số đo và kế hoạch kiểm thử toàn hệ thống.  
**Phối hợp trực tiếp:** QTien cung cấp số đo và hiệu chuẩn; TVan cung cấp dữ liệu từ ESP32; TDat/DKhoa/QThang triển khai và hiển thị kết quả; TKiet chốt phạm vi và tích hợp.

## 1. Kết quả cần bàn giao

Một **bộ quy tắc chăm sóc vườn ươm ớt con có nguồn và điều kiện áp dụng rõ ràng**, bộ dữ liệu mẫu để các nhóm phát triển song song, cùng kế hoạch và biên bản kiểm thử từ cảm biến → ESP32 → backend → web/mobile. Quy tắc chỉ tạo cảnh báo/lời khuyên từ dữ liệu **hợp lệ và đủ mới** theo hợp đồng; khi cảm biến lỗi, chưa hiệu chuẩn hoặc thiếu dữ liệu, kết quả phải thể hiện “không đủ dữ liệu” theo cách nhóm chốt, không đoán tình trạng cây.

### Ranh giới sở hữu

| MThuy trực tiếp làm | Chủ sở hữu phần liên quan |
| --- | --- |
| Tìm căn cứ cho quy tắc, mô tả điều kiện/ngưỡng, mức ưu tiên và câu chữ lời khuyên; ghi nguồn, giả định, phiên bản và trường hợp không áp dụng | TKiet: chốt phạm vi MVP và nơi chạy quy tắc; TDat/DKhoa/QThang: triển khai theo kiến trúc đã chốt |
| Đề xuất phương pháp đối chiếu số đo thực tế; ghi điều kiện tham chiếu và đánh giá xem phần trăm độ ẩm đất đã đủ cơ sở sử dụng | QTien: mã đọc/xử lý cảm biến và tham số hiệu chuẩn HD‑38; TKiet: đấu nối, vị trí lắp và mạch thật |
| Thiết kế fixture/ca thử, chạy kiểm thử liên nhóm, ghi bằng chứng và issue, kiểm tra lại sau khi sửa | QTien, TVan, TDat, DKhoa và QThang: sửa lỗi trong module mình sở hữu; TKiet: điều phối tích hợp và quyết định mốc bàn giao |

**Vùng sở hữu đề xuất:** `docs/agronomy/`, `docs/testing/` và fixture quy tắc/kiểm thử. MThuy góp ý `docs/contracts/sensor-reading.md`, `docs/contracts/api.md` và `docs/integration/test-matrix.md`; TKiet chủ trì chốt tài liệu chung. Không tự sửa mã firmware, backend, web hoặc mobile để vượt qua ca kiểm thử.

## 2. Hợp đồng với các thành viên khác

### Dữ liệu đầu vào cho quy tắc

Tại **Phase 0 (G0)**, cùng QTien/TVan/TDat chốt ý nghĩa nhiệt độ không khí, độ ẩm không khí, nhiệt độ đất, số đọc thô HD‑38 và phần trăm độ ẩm đất **sau hiệu chuẩn**; trạng thái từng cảm biến, giá trị `null`, thời điểm đo/nhận và tiêu chí dữ liệu cũ. Các tên trường ở file 01 chỉ là khung thảo luận, chưa phải schema chính thức. Một giá trị `0` hợp lệ không được coi là thiếu; số đọc thô HD‑38 không được hiểu thành `%` nếu chưa có phép quy đổi đã kiểm chứng.

### Nơi xử lý và bàn giao quy tắc

TKiet cùng TDat/DKhoa/QThang/MThuy chốt **một nơi tính kết quả quy tắc** ở G0. MThuy giao tài liệu đặc tả và các ca ví dụ đầu vào → kết quả mong đợi; người sở hữu nơi xử lý triển khai. DKhoa/QThang hiển thị cùng thông điệp và trạng thái theo hợp đồng. Nếu MVP chỉ hiển thị dữ liệu đo mà chưa tự động tính lời khuyên, MThuy vẫn cung cấp bảng diễn giải và ca kiểm thử trong phạm vi TKiet đã chốt; không tự thêm điều khiển tưới hay chức năng ngoài phạm vi.

Mỗi quy tắc cần tối thiểu: **mã/phiên bản, mục đích, trường và đơn vị đầu vào, điều kiện dữ liệu hợp lệ/đủ mới, điều kiện kích hoạt, kết quả/câu chữ, mức ưu tiên, ca sát ranh giới, nguồn tham khảo hoặc người duyệt**. Ngưỡng cụ thể chỉ được đưa vào phiên bản dùng chung sau khi TKiet và các bên liên quan xác nhận; không sao chép số bất kỳ vào mã/giao diện trước khi kiểm chứng cho bối cảnh vườn ươm của nhóm.

### Bộ ca thử dùng chung

| Nhóm ca | Dữ liệu/điều kiện cần có | Kết quả cần quan sát |
| --- | --- | --- |
| Số đo bình thường | Ba cảm biến hợp lệ, thời gian đủ mới | ESP32 gửi, backend lưu, web/mobile hiện cùng giá trị/đơn vị |
| Lỗi một cảm biến | Một giá trị `null` kèm trạng thái lỗi, cảm biến khác hợp lệ | Không phát lời khuyên dựa trên giá trị lỗi; phần còn lại vẫn có thể hiển thị |
| HD‑38 chưa hiệu chuẩn | Có số thô, `%` thiếu và trạng thái chưa hiệu chuẩn | Không gắn `%` cho số thô, không áp dụng quy tắc cần độ ẩm đất % |
| Giá trị biên / `0` hợp lệ | Giá trị ngay dưới, bằng, ngay trên ngưỡng đã duyệt; `0` hợp lệ nếu phù hợp hợp đồng | Kết quả đúng chiều so sánh; phân biệt `0` với thiếu dữ liệu |
| Dữ liệu cũ / mất Wi‑Fi | Thời điểm đo cũ, thiết bị chưa gửi mẫu mới | Web/mobile có nhãn cũ; không tính lại lời khuyên như mẫu mới |
| Gửi lại / API lỗi | Cùng mẫu gửi lại, backend tạm thời không nhận | Không lưu trùng trái hợp đồng; phản hồi và trạng thái hiển thị rõ |
| Chưa có dữ liệu / server lỗi | Thiết bị chưa có bản ghi hoặc API không truy cập được | Giao diện phân biệt trống với lỗi kết nối, không vẽ số đo giả |

**Cách làm song song:** MThuy soạn quy tắc, bảng trạng thái và bộ fixture G0 ngay cả khi chưa có mạch/backend. QTien dùng fixture để kiểm tra trạng thái cảm biến; TDat kiểm tra đầu vào/đầu ra quy tắc; DKhoa/QThang dựng giao diện từ cùng response mẫu. Khi có dữ liệu thật, MThuy thay fixture bằng số đo quan sát và giữ nguyên tiêu chí mong đợi đã chốt hoặc ghi lý do sửa phiên bản.

## 3. Kế hoạch theo Phase

### Phase 0 — Chốt phạm vi quy tắc và ma trận kiểm thử (G0)

**MThuy thực hiện:**

- Cùng TKiet xác định MVP cần những loại cảnh báo/lời khuyên nào, đâu là thông tin chỉ để theo dõi; thống nhất nơi xử lý quy tắc với TDat/DKhoa/QThang.
- Cùng QTien/TVan/TDat rà đơn vị, trạng thái cảm biến, `null`, thời điểm đo/nhận, tiêu chí “dữ liệu cũ” và tình huống HD‑38 chưa hiệu chuẩn. Nêu rõ điều kiện **không được ra kết luận chăm sóc**.
- Soạn `docs/testing/` với mã ca thử, fixture đầu vào, kết quả mong đợi và chủ sở hữu lỗi; góp ý `docs/integration/test-matrix.md` của TKiet để phủ đường mạch → firmware → API → web/mobile.
- Chốt với DKhoa/QThang cách đặt nhãn trạng thái và hiển thị “không đủ dữ liệu”; cung cấp fixture đủ để hai người làm giao diện độc lập.

**Đầu ra:** Phạm vi quy tắc G0, khung đặc tả quy tắc, ma trận ca thử, fixture và bảng trạng thái.  
**Đạt G0 khi:** TKiet xác nhận phạm vi/nơi xử lý; QTien, TVan, TDat, DKhoa và QThang xác nhận dữ liệu và kết quả mong đợi tương ứng, mỗi bên có fixture để làm phần của mình mà không chờ thiết bị thật.

### Phase 1 — Đặc tả quy tắc và phương pháp đối chiếu

**MThuy thực hiện:**

- Thu thập căn cứ phù hợp cho cây ớt con trong điều kiện vườn ươm của nhóm; ghi nguồn, điều kiện áp dụng, độ chắc chắn và người duyệt cho từng ngưỡng/khuyến nghị. Đưa bản đề xuất cho TKiet xem trước khi coi là phiên bản chính thức.
- Viết bảng quy tắc theo cấu trúc đã chốt: đầu vào hợp lệ, điều kiện kích hoạt, kết quả, thông điệp, thứ tự ưu tiên khi nhiều điều kiện cùng xảy ra, ranh giới số đo và trường hợp không đủ dữ liệu.
- Cùng QTien thiết kế buổi đối chiếu HD‑38: điều kiện tham chiếu, số đọc thô, chiều biến thiên, cách ghi kết quả và giới hạn phép quy đổi. QTien triển khai tham số/mã hiệu chuẩn; MThuy xác nhận phương pháp và kiểm tra kết quả.

**Đầu ra:** `docs/agronomy/` có quy tắc v0.1, bảng nguồn/giả định, ca ranh giới và biểu mẫu đối chiếu cảm biến.  
**Đạt Phase 1 khi:** Người triển khai quy tắc có thể lấy cùng fixture và ra cùng kết quả mong đợi; mọi ngưỡng được dùng đều có nguồn và phạm vi áp dụng được TKiet xác nhận.

### Phase 2 — Thử độc lập từng phần bằng fixture

**MThuy thực hiện:**

- Gửi bộ fixture cho QTien/TVan/TDat/DKhoa/QThang; kiểm tra mỗi bên diễn giải giống nhau về đơn vị, lỗi một phần, chưa hiệu chuẩn, dữ liệu cũ, `null` và `0` hợp lệ.
- Chạy ca quy tắc ở nơi xử lý đã chốt (hoặc so sánh bảng kết quả mẫu với bản triển khai của chủ sở hữu); kiểm tra ngay dưới/bằng/ngay trên ngưỡng, nhiều điều kiện cùng lúc và đầu vào không đủ.
- Ghi kết quả `đạt / chưa đạt / đang chặn`, ảnh/log/response và người xử lý. Khi lỗi do fixture hay hợp đồng, gửi đề xuất sửa cho TKiet và những người bị ảnh hưởng, không sửa ngầm kết quả mong đợi.

**Đầu ra:** Bảng chạy thử theo module, fixture có phiên bản và danh sách issue.  
**Đạt Phase 2 khi:** Các phần độc lập đạt ca G0 thuộc phạm vi của mình; trường hợp chưa đạt có bằng chứng, chủ sở hữu và cách thử lại rõ ràng.

### Phase 3 — Kiểm thử tích hợp đầu cuối

**MThuy thực hiện:**

- Cùng TKiet tổ chức ca đo thật: ghi bối cảnh đo → log QTien/TVan → payload → bản ghi TDat → web DKhoa/mobile QThang → kết quả quy tắc nếu có. Đối chiếu cùng `device_id`, thời gian, giá trị, đơn vị và trạng thái.
- Tái hiện các tình huống rút một cảm biến, mất Wi‑Fi rồi có lại, API lỗi, gửi lại bản ghi, chưa hiệu chuẩn và dữ liệu cũ. Ghi hiện tượng, bước tái hiện, kết quả mong đợi/thực tế, mức ảnh hưởng và giao lỗi đúng chủ sở hữu.
- Sau khi người sở hữu sửa, chạy lại ca lỗi và ca liền kề để bảo đảm thay đổi không làm sai trạng thái khác. TKiet quyết định đóng mốc tích hợp dựa trên biên bản chung.

**Đầu ra:** Biên bản kiểm thử đầu cuối, ảnh/log/payload theo ca và bảng issue đã kiểm tra lại.  
**Đạt Phase 3 khi:** Một mẫu thật đi qua toàn hệ thống đúng hợp đồng; các ca lỗi quan trọng không tạo lời khuyên dựa trên số đo thiếu/lỗi/cũ. Lỗi còn mở được mô tả và TKiet chấp nhận cách xử lý cho MVP.

### Phase 4 — Đối chiếu tại vườn ươm và xác nhận nội dung

**MThuy thực hiện:**

- Cùng TKiet/QTien thử tại vị trí đặt mạch đã chọn; ghi điều kiện đo, số đọc lặp lại, kết quả đối chiếu và giới hạn của phép hiệu chuẩn. Kiểm tra khi nào `soil_moisture_pct` đủ cơ sở để dùng trong quy tắc.
- Quan sát web/mobile trong hoàn cảnh số đo thay đổi, kết nối chập chờn và mẫu cũ; xem lời khuyên có phù hợp với trạng thái dữ liệu, có dễ bị hiểu là kết luận chắc chắn khi thiếu căn cứ không.
- Nếu điều chỉnh ngưỡng, câu chữ, điều kiện dữ liệu hoặc phiên bản hiệu chuẩn, ghi lý do, nguồn, tác động tới ca thử và thông báo chủ sở hữu nơi xử lý cùng TKiet; chạy lại ca bị ảnh hưởng.

**Đầu ra:** Nhật ký đối chiếu, bộ quy tắc/fixture cuối, báo cáo kiểm thử thực tế và giới hạn MVP.  
**Đạt Phase 4 khi:** Có thể truy lại căn cứ của mỗi lời khuyên đang hiển thị; các trường hợp thiếu/lỗi/chưa hiệu chuẩn/cũ được nhận diện và không bị diễn giải thành điều kiện chăm sóc hợp lệ.

### Phase 5 — Báo cáo và bàn giao kiểm thử

**MThuy thực hiện:**

- Tổng hợp ma trận kiểm thử cuối: mã ca, điều kiện, fixture/thiết bị, kết quả, bằng chứng, phiên bản quy tắc/API/hiệu chuẩn và lỗi còn mở. Phân biệt ca đã thử trên mạch thật với ca chỉ thử bằng dữ liệu mẫu.
- Bàn giao tài liệu quy tắc, nguồn/giả định, bảng đối chiếu HD‑38, fixture, biên bản kiểm thử và các giới hạn cho TKiet; cùng TDat/DKhoa/QThang xác nhận thông điệp cuối trong hệ thống.
- Hỗ trợ kịch bản demo của TKiet bằng một mẫu hợp lệ và một mẫu không đủ dữ liệu, giải thích vì sao hệ thống hiển thị hoặc không hiển thị lời khuyên.

**Đầu ra:** Báo cáo kiểm thử, quy tắc phiên bản cuối, bộ fixture, bằng chứng và danh sách hạn chế chưa giải quyết.  
**Đạt Phase 5 khi:** Một thành viên khác chạy lại được các ca chính, phân biệt kết quả thử thật và thử giả, đồng thời giải thích được nguồn và điều kiện áp dụng của mọi quy tắc trong MVP.

## 4. Checklist bàn giao cho TKiet và cả nhóm

- [ ] Mỗi quy tắc có mã/phiên bản, nguồn hoặc người duyệt, đầu vào, điều kiện dữ liệu hợp lệ, kết quả và ca ranh giới.
- [ ] Nơi chạy quy tắc được TKiet chốt; TDat/DKhoa/QThang dùng cùng kết quả và câu chữ đã duyệt.
- [ ] HD‑38 có số đọc thô, biên bản đối chiếu và giới hạn của phép quy đổi; QTien giữ mã hiệu chuẩn.
- [ ] Fixture bao phủ bình thường, `0` hợp lệ, `null`, một cảm biến lỗi, chưa hiệu chuẩn, dữ liệu cũ, mất Wi‑Fi, API lỗi và gửi lại.
- [ ] Mỗi ca kiểm thử có kết quả mong đợi/thực tế, bằng chứng, phiên bản và người chịu trách nhiệm xử lý lỗi.
- [ ] Web/mobile không hiện lời khuyên dựa trên dữ liệu thiếu/lỗi/cũ trái hợp đồng; khác biệt giữa hai giao diện được ghi issue.
- [ ] Báo cáo nêu rõ ca đã thử với mạch thật, ca chỉ dùng fixture và những hạn chế của MVP.

**Khi bị chặn:** Chưa có mạch/API thật thì tiếp tục viết quy tắc và thử bằng fixture G0; ghi ca đầu cuối là `đang chặn` cùng bên cần bàn giao. Nếu thiếu căn cứ cho ngưỡng chăm sóc, giữ quy tắc ở trạng thái đề xuất và không yêu cầu nhóm nhúng ngưỡng đó vào sản phẩm. Mọi thay đổi hợp đồng hoặc kết quả mong đợi phải có ví dụ trước/sau và xác nhận của TKiet cùng những chủ sở hữu bị ảnh hưởng.
