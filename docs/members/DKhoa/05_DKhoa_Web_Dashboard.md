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
