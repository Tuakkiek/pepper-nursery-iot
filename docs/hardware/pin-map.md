# Pin map và nguồn của mạch năm cảm biến

**Phiên bản:** phần cứng đề xuất HW v0.1, G0 v0.1. **Nguồn:** wiring_diagram.docx trong cùng thư mục. Bảng này chép cấu hình từ tài liệu đấu dây; chưa phải biên bản đo trên mạch thật.

## Cấu hình chung

| Linh kiện theo sơ đồ | Số lượng dự kiến | Kiểm kê mạch thật |
| --- | ---: | --- |
| ESP32 DevKit V1 30 chân và mạch mở rộng ESP32 30P | 1 mỗi loại | Chưa ghi nhận |
| DHT22, HD‑38, DS18B20, TDS Meter V1.0, PH‑4502C | 1 mỗi loại | Chưa ghi nhận |
| Điện trở 10 kΩ 1/4 W sai số 1% cho bộ chia áp pH | 2 | Chưa ghi nhận |
| Nguồn 5 V riêng cho PH‑4502C, dây và đầu nối | Theo mạch thực | Chưa ghi nhận |

- Bo chính: ESP32 DevKit V1 30 chân, mạch mở rộng ESP32 30P. Jumper vàng ở vị trí V–3.3V; hàng V của mạch mở rộng cấp 3,3 V theo sơ đồ.
- DHT22, HD‑38, DS18B20 và TDS Meter V1.0 dùng hàng V 3,3 V. PH‑4502C dùng nguồn 5 V riêng. Tất cả dùng GND chung.
- Trước khi cấp nguồn, TKiet kiểm tra đúng mẫu board và mạch mở rộng, đo điện áp hàng V và cực tính, đo Po sau bộ chia áp. Không nối Po 5 V trực tiếp vào ESP32.

## Bảng nối

| Cảm biến | Dây/chân cảm biến | Chân mạch mở rộng | GPIO/chức năng | Nguồn |
| --- | --- | --- | --- | --- |
| DHT22 | + / OUT / − | D27–V / D27–S / D27–G | GPIO27, tín hiệu số | 3,3 V |
| HD‑38 | + / AO / − | D34–V / D34–S / D34–G | GPIO34, ADC1; DO không nối | 3,3 V |
| DS18B20 | VCC đỏ / DAT vàng / GND đen | D26–V / D26–S / D26–G | GPIO26, OneWire | 3,3 V |
| TDS Meter V1.0 | + đỏ / A vàng / − đen | D32–V / D32–S / D32–G | GPIO32, ADC1 | 3,3 V |
| pH PH‑4502C | V+ / Po / G thứ nhất | nguồn 5 V riêng / qua bộ chia áp đến D35–S / D35–G | GPIO35, ADC1; To và Do không nối | 5 V riêng |

G thứ hai trên PH‑4502C không nối theo sơ đồ nguồn; xác nhận đúng ký hiệu trên module thực tế trước khi cấp nguồn. Không suy diễn hai chân G là thay thế cho nhau.

## Bộ chia áp Po của pH

R1 10 kΩ từ Po đến nút D35–S. R2 10 kΩ từ nút D35–S đến D35–G. Dùng điện trở 1/4 W, sai số 1% theo wiring_diagram.docx. Điện áp ở D35–S xấp xỉ một nửa Po khi mắc đúng. Đo bằng đồng hồ trước khi cắm GPIO35; không coi phép tính là bằng chứng điện áp thực.

## Kiểm tra kỹ thuật và điều kiện còn mở

GPIO32/34/35 là kênh ADC1; ADC2 không phù hợp cho phép đo analog đồng thời với Wi‑Fi trên ESP32. GPIO34/35 chỉ nhận tín hiệu đầu vào và không có điện trở kéo nội. Đây là lý do pin analog trong sơ đồ phù hợp về chức năng, nhưng chưa xác nhận điện áp ngõ ra hoặc độ chính xác của đúng module đang dùng. Nguồn: [Espressif GPIO](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/gpio.html), [Espressif hardware design](https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html).

| Kiểm tra trước Phase 1 | Người làm | Bằng chứng cần lưu |
| --- | --- | --- |
| Xác nhận mã board, vị trí jumper, điện áp 3,3 V và 5 V, GND chung | TKiet | Ảnh nhãn board, ảnh jumper, số đo đồng hồ |
| Xác nhận module DHT22/DS18B20 thực tế có điện trở kéo như sơ đồ ghi | TKiet + QTien | Ảnh module hoặc thông số nhà sản xuất |
| Xác nhận đúng biến thể TDS Meter V1.0 dùng được 3,3 V và biên độ A không vượt đầu vào ESP32 | TKiet + QTien | Mã module, tài liệu/đo điện áp |
| Đo Po và D35–S của PH‑4502C trong các điều kiện thử; kiểm tra cấp 5 V riêng | TKiet + QTien | Số đo, ảnh bộ chia áp |
| Chọn cấu hình ADC/attenuation và kiểm tra giá trị không bão hòa tại GPIO34/32/35 | QTien + TKiet | Cấu hình firmware và số đo đối chiếu đồng hồ |
| Chụp mạch thật, dán nhãn dây, thử tháo từng cảm biến | TKiet | Ảnh và biên bản thử |

Không đánh dấu phép đo hợp lệ hoặc chuyển sang lắp thử lâu dài nếu kiểm tra nguồn/tín hiệu chưa đạt. Mọi thay đổi chân hoặc nguồn phải nâng phiên bản HW và thông báo QTien, TVan.

## Tên chân firmware

| Tên | GPIO |
| --- | ---: |
| DHT_PIN | 27 |
| SOIL_PIN | 34 |
| DS18B20_PIN | 26 |
| TDS_PIN | 32 |
| PH_PIN | 35 |
