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
