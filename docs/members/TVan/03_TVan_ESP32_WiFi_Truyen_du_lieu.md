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
