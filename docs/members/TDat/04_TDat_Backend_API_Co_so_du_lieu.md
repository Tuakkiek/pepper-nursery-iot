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
