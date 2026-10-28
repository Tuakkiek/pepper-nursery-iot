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
