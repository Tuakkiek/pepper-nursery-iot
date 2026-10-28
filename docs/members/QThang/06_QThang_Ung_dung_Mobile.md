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
