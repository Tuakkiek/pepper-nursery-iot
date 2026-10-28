# Design System — Web dashboard & ứng dụng mobile

**Dự án:** MVP chăm sóc vườn ươm ớt con bằng IoT  
**Phiên bản:** 1.0 — theme sáng  
**Áp dụng cho:** TV5 (web), TV6 (mobile); TV1 duyệt thiết kế chung, TV4 cung cấp trạng thái dữ liệu, TV7 duyệt nội dung chăm sóc.  
**Nguồn màu:** Ảnh tham chiếu của nhóm với bốn mã `#F7444E`, `#F7F8F3`, `#78BCC4`, `#002C3E`. Logo “Host” trong ảnh chỉ thuộc ảnh tham chiếu màu, không phải logo của dự án.

## 1. Tinh thần thiết kế

- **Đơn giản, ưu tiên số đo:** Người xem nhận ra ngay thiết bị, số đo mới nhất, thời điểm đo và trạng thái đáng chú ý. Mỗi màn hình có một mục tiêu chính.
- **Bình tĩnh và rõ ràng:** Nền kem rộng, chữ xanh navy, thẻ sáng; xanh ngọc cho thông tin bình thường; đỏ san hô chỉ nhấn cảnh báo hoặc hành động cần chú ý.
- **Cùng ngôn ngữ trên hai nền tảng:** Tên số đo, đơn vị, nhãn trạng thái, thứ tự thông tin và ngữ nghĩa màu giống nhau; bố cục thích ứng với màn hình.
- **Trung thực với dữ liệu:** `null` khác `0`; số đo cũ khác số đo mới; HD‑38 chưa hiệu chuẩn không được trình bày như độ ẩm đất `%`.

## 2. Màu và vai trò

### Màu gốc từ ảnh

| Token | Mã HEX | Vai trò |
| --- | --- | --- |
| `brand.coral` | `#F7444E` | Điểm nhấn, dấu cảnh báo, chỉ báo nhỏ; không dùng làm chữ nhỏ trên nền sáng |
| `brand.cream` | `#F7F8F3` | Nền ứng dụng |
| `brand.teal` | `#78BCC4` | Thông tin bình thường, điểm nhấn biểu đồ, nền thông tin |
| `brand.navy` | `#002C3E` | Chữ chính, nút chính, thanh điều hướng |

### Màu bổ trợ để dùng được trong giao diện

| Token | Mã HEX | Cách dùng |
| --- | --- | --- |
| `surface` | `#FFFFFF` | Thẻ số đo, biểu đồ, hộp thoại |
| `text.secondary` | `#4B6570` | Nhãn phụ, chú thích, thời gian |
| `border` | `#D5E1E0` | Viền thẻ, ô nhập, đường chia |
| `teal.soft` | `#E7F3F3` | Nền trạng thái bình thường/thông tin |
| `coral.soft` | `#FFE9EA` | Nền cảnh báo/lỗi |
| `coral.strong` | `#B62430` | Chữ cảnh báo/lỗi và nút nguy cơ cao nếu có |

**Ghép màu bắt buộc:** Chữ `brand.navy` trên `brand.cream`, `surface`, `brand.teal` hoặc `teal.soft`; chữ `coral.strong` trên `coral.soft` hoặc nền sáng; chữ trắng trên nút `brand.navy`/`coral.strong`. Không dùng chữ trắng trên `brand.coral` hoặc `brand.teal`; không dùng `brand.coral` làm chữ nội dung nhỏ. Tỷ lệ tương phản đã kiểm tra: navy/cream **13,76:1**, navy/teal **6,85:1**, coral.strong/cream **5,99:1**; trắng/coral gốc chỉ **3,56:1**.

### Màu theo trạng thái dữ liệu

| Trạng thái | Nền / dấu nhấn | Chữ / nhãn hiển thị |
| --- | --- | --- |
| Mới, hợp lệ | `teal.soft` / `brand.teal` | `brand.navy` · **Đang cập nhật** hoặc **Bình thường** theo hợp đồng |
| Cần chú ý theo quy tắc đã duyệt | `coral.soft` / `brand.coral` | `coral.strong` · **Cần chú ý** + lý do cụ thể |
| Cảm biến lỗi | `coral.soft` / `brand.coral` | `coral.strong` · **Lỗi cảm biến** |
| Chưa hiệu chuẩn | `teal.soft` / viền `brand.teal` | `brand.navy` · **Chưa hiệu chuẩn** |
| Dữ liệu cũ / mất liên lạc | `brand.cream` / viền `border` | `brand.navy` · **Dữ liệu cũ** + lần cập nhật cuối |
| Chưa có dữ liệu | `surface` / viền `border` | `text.secondary` · **Chưa có dữ liệu** |
| Lỗi API | `coral.soft` / dấu `brand.coral` | `coral.strong` · **Không tải được dữ liệu** + **Thử lại** |

Không dùng màu làm tín hiệu duy nhất: mỗi trạng thái cần chữ và biểu tượng hoặc mô tả. **Cảnh báo chăm sóc** và **lỗi kỹ thuật** có thể cùng tông đỏ nhưng phải có nhãn riêng; không biến lỗi kỹ thuật thành lời khuyên chăm sóc.

## 3. Chữ, số và biểu tượng

| Cấp chữ | Web | Mobile | Quy tắc |
| --- | --- | --- | --- |
| Tiêu đề trang | 28 px / 36 px, đậm 700 | 24 px / 32 px, đậm 700 | Một tiêu đề rõ mỗi màn hình |
| Tiêu đề mục | 22 px / 30 px, đậm 600 | 20 px / 28 px, đậm 600 | Ví dụ “Số đo mới nhất” |
| Giá trị số đo | 30 px / 38 px, đậm 700 | 28 px / 36 px, đậm 700 | Số và đơn vị đi cùng nhau |
| Nội dung | 16 px / 24 px, thường 400 | 16 px / 24 px, thường 400 | Chữ navy trên nền sáng |
| Nhãn và chú thích | 14 px / 20 px, vừa 500 | 14 px / 20 px, vừa 500 | Thời gian, mô tả trạng thái |

- Dùng **Inter** nếu dự án đã cài và kiểm tra chữ tiếng Việt; dự phòng bằng font hệ thống (`system-ui` trên web, font hệ thống trên mobile). Không phụ thuộc tải font từ mạng để giao diện hiển thị được.
- Số đo dùng chữ số có bề rộng đều (`font-variant-numeric: tabular-nums` trên web hoặc tương đương trên mobile); hiển thị ví dụ `27,4 °C`, `68 %`. Quy ước làm tròn/chữ số thập phân phải chốt cùng TV4, không tự đổi giá trị API.
- Biểu tượng nét đơn giản, cùng một bộ trên từng nền tảng; luôn có nhãn cho trạng thái quan trọng. Tránh dùng biểu tượng tia sét/logo trong ảnh làm dấu nhận diện dự án.

## 4. Khoảng cách, kích thước và bề mặt

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `space.1` | 4 px | Giữa biểu tượng và nhãn rất gần |
| `space.2` | 8 px | Giữa nhãn và giá trị, các mục nhỏ |
| `space.3` | 12 px | Nội dung cùng nhóm |
| `space.4` | 16 px | Đệm thẻ mobile, khoảng cách thông dụng |
| `space.6` | 24 px | Đệm thẻ web, khoảng cách giữa nhóm |
| `space.8` | 32 px | Khoảng cách giữa các khu vực lớn |
| `space.12` | 48 px | Đầu/cuối trang web khi có không gian |

- **Góc bo:** ô nhập/nút `12 px`; thẻ `16 px`; hộp thoại `20 px`. Cùng một loại thành phần dùng cùng bán kính trên web/mobile.
- **Viền:** `1 px solid #D5E1E0`. Thẻ trắng trên nền kem dùng viền mảnh; chỉ thêm bóng nhẹ khi cần phân lớp, không dùng hiệu ứng nổi dày.
- **Vùng chạm:** tối thiểu `44 × 44 px` cho nút/biểu tượng có thể thao tác; nút chính cao `48 px` trở lên. Có khoảng trống giữa các mục có thể chạm.
- **Chuyển động:** ngắn, chỉ để báo đổi trạng thái (khoảng 150–200 ms); tôn trọng thiết lập giảm chuyển động của thiết bị. Không dùng nhấp nháy cho cảnh báo.

## 5. Bố cục và điều hướng

| Thành phần | Web dashboard | Mobile app |
| --- | --- | --- |
| Khung nội dung | Rộng tối đa khoảng `1200 px`, canh giữa, lề tối thiểu `24 px` | Lề ngang `16 px`, tôn trọng vùng an toàn màn hình |
| Điều hướng | Thanh trên hoặc menu bên gọn, nhãn rõ | Thanh dưới nếu có 2–3 mục chính; không thêm mục chỉ để đủ chỗ |
| Thẻ số đo | 4 cột trên màn hình rộng, 2 cột ở cỡ vừa, 1 cột khi hẹp | 1 cột trên màn hình nhỏ; có thể 2 cột nếu giá trị/nhãn không bị cắt |
| Lịch sử | Vùng riêng dưới số đo, chọn khoảng thời gian theo API | Màn hình hoặc mục riêng, thao tác lọc vừa tay |
| Thứ tự | Thiết bị/trạng thái → số đo mới nhất → cảnh báo → lịch sử | Cùng thứ tự ưu tiên, rút gọn nội dung trên màn hình đầu |

**Nhãn điều hướng thống nhất:** `Tổng quan`, `Lịch sử`, `Chăm sóc` (mục cuối chỉ xuất hiện nếu MVP có nội dung chăm sóc được duyệt). Trên web khi bề rộng dưới `640 px`, ưu tiên một cột và không để bảng ngang tràn màn hình. Trên mobile, cuộn dọc tự nhiên; không nhét toàn bộ biểu đồ và lời khuyên vào cùng một màn hình đầu.

## 6. Mẫu thành phần dùng chung

### Thẻ số đo (`MetricCard`)

**Thứ tự:** tên số đo → giá trị lớn + đơn vị → nhãn trạng thái → thời điểm đo/cập nhật. Có thể kèm biểu tượng cảm biến nhỏ. Bốn thẻ: Nhiệt độ không khí, Độ ẩm không khí, Nhiệt độ đất, Độ ẩm đất. Khi thiếu giá trị, thay số bằng `—` và hiện lý do; không hiển thị `0` giả. Số đọc thô HD‑38 (nếu cần) ghi “Số đọc thô”, không gắn `%`.

### Trạng thái thiết bị (`DeviceStatus`)

Hiển thị `device_id` hoặc tên thiết bị đã chốt, nhãn kết nối/dữ liệu và “Lần cập nhật: …”. Phân biệt **thiết bị chưa gửi**, **API không truy cập được** và **mẫu gần nhất đã cũ** theo dữ liệu TV4 cung cấp. Không suy ra thiết bị online chỉ từ việc có bản ghi trong lịch sử.

### Lịch sử (`HistoryChart`)

- Ưu tiên biểu đồ/tập số đo **theo từng đại lượng và đơn vị**; nhiệt độ °C và độ ẩm % không đặt chung một trục giá trị. Dùng navy cho đường chính, teal cho đường so sánh nếu cần; coral dành cho đánh dấu sự kiện/cảnh báo đã duyệt.
- Có tiêu đề, chú giải, đơn vị và nhãn thời gian. Thiếu mẫu/lỗi thì để khoảng trống, không nối đường qua điểm không có dữ liệu. Nếu không đủ điểm, hiện trạng thái trống bằng chữ.
- Web cho phép xem chi tiết bằng chuột **và** bàn phím; mobile cho phép chạm vào điểm. Có thể kèm danh sách số đo gần đây để đọc được khi biểu đồ khó dùng.

### Cảnh báo và lời khuyên (`StatusBanner` / `CareAdvice`)

Hiển thị lý do, dữ liệu đầu vào/thời điểm liên quan, câu chữ TV7 duyệt và hành động xem thêm nếu có. Với dữ liệu thiếu/lỗi/cũ, hiện **Không đủ dữ liệu để đưa ra nhận định** theo hợp đồng; không tự tạo lời khuyên mới ở frontend. Phần tính quy tắc nằm tại nơi nhóm chốt ở G0.

### Nút, lọc và phản hồi

Nút chính nền navy/chữ trắng (`Xem lịch sử`, `Thử lại`); nút phụ nền trắng/chữ navy/viền border. Coral chỉ dùng cho hành động hoặc cảnh báo cần nhấn rõ, với chữ `coral.strong` trên nền nhạt hoặc chữ trắng trên nền `coral.strong`. Ô chọn thiết bị/khoảng thời gian có nhãn cố định; thông báo thành công/lỗi nói rõ việc gì đã xảy ra. Màn hình đang tải dùng khung chờ nhẹ, không lấp bằng số đo giả.

## 7. Quy tắc dữ liệu và nội dung

1. **Nguồn duy nhất:** Cấu trúc response và trạng thái theo `docs/contracts/api.md` sau mốc G0; không tự đặt tên trường hay tiêu chí dữ liệu cũ trong web/mobile.
2. **Thời gian:** Phân biệt `recorded_at` (thời điểm đo, nếu có) với `received_at` (thời điểm server nhận). Hiển thị múi giờ địa phương rõ ràng; nếu thời điểm đo chưa tin cậy, dùng lời giải thích theo hợp đồng thay vì gắn thời điểm giả.
3. **Giá trị thiếu:** `null`/lỗi/không đủ dữ liệu hiển thị `—` và nhãn lý do. `0` hợp lệ vẫn hiển thị là `0`.
4. **Độ ẩm đất:** Chỉ hiển thị `%` và đưa vào quy tắc khi TV2 đã hiệu chuẩn, TV7 đối chiếu, và backend đánh dấu hợp lệ.
5. **Ngôn ngữ:** Dùng cùng nhãn tiếng Việt trên web/mobile. Câu ngắn, nói rõ vấn đề và thời điểm; không dùng một chữ “Lỗi” cho cả lỗi cảm biến lẫn lỗi mạng.
6. **Không có dữ liệu thật:** Fixture phục vụ phát triển/demo phải được đánh dấu là **Dữ liệu mẫu** khi hiển thị cho người xem.

## 8. Token để triển khai

Sao chép cùng giá trị cho CSS web và bộ hằng màu/kích thước mobile. Nếu cần đổi token, TV5 và TV6 thống nhất với TV1 trong cùng một phiên bản tài liệu; không đổi riêng từng ứng dụng.

```css
:root {
  --color-coral: #F7444E;
  --color-cream: #F7F8F3;
  --color-teal: #78BCC4;
  --color-navy: #002C3E;
  --color-surface: #FFFFFF;
  --color-text-secondary: #4B6570;
  --color-border: #D5E1E0;
  --color-teal-soft: #E7F3F3;
  --color-coral-soft: #FFE9EA;
  --color-coral-strong: #B62430;

  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --radius-control: 12px; --radius-card: 16px;
}

body { background: var(--color-cream); color: var(--color-navy); }
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-card); }
.button-primary { background: var(--color-navy); color: #FFFFFF; min-height: 48px; border-radius: var(--radius-control); }
.metric-value { font-variant-numeric: tabular-nums; }
```

**Tên token trên mobile:** giữ đúng các vai trò `colorCoral`, `colorCream`, `colorTeal`, `colorNavy`, `colorSurface`, `colorTextSecondary`, `colorBorder`, `colorTealSoft`, `colorCoralSoft`, `colorCoralStrong`; cùng thang `space1/2/3/4/6/8` và `radiusControl/Card`. Chuyển px sang đơn vị giao diện của nền tảng đã chọn, giữ kích thước hiển thị tương đương và tôn trọng cỡ chữ hệ thống.

## 9. Checklist đối chiếu trước khi bàn giao

- [ ] TV5 và TV6 dùng cùng bốn màu gốc, token bổ trợ, nhãn tiếng Việt và thứ tự thông tin.
- [ ] Cả hai giao diện hiển thị đúng fixture: mới hợp lệ, `0` hợp lệ, thiếu, một cảm biến lỗi, chưa hiệu chuẩn, dữ liệu cũ, chưa có dữ liệu, lỗi API.
- [ ] Cảnh báo luôn có chữ/lý do; nút và chữ nhỏ có màu tương phản theo bảng ghép màu ở mục 2.
- [ ] Số đo có đơn vị; thời điểm đo/nhận được phân biệt; dữ liệu giả có nhãn “Dữ liệu mẫu”.
- [ ] Lịch sử không nối qua điểm thiếu và không trộn °C với % trên cùng trục.
- [ ] Web dùng được ở màn hình rộng/hẹp, mobile dùng được trên thiết bị nhóm chọn; thao tác chính có vùng chạm đủ lớn.
- [ ] TV4 xác nhận response/trạng thái, TV7 xác nhận nội dung chăm sóc, TV1 duyệt ảnh hai giao diện đặt cạnh nhau trước demo.
