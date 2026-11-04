# Hợp đồng bản ghi cảm biến G0

**Phiên bản đề xuất:** 0.1. Hợp đồng này thống nhất tên trường, đơn vị và trạng thái cho năm cảm biến; JSON gửi qua API dùng đúng tên trường bên dưới. Fixture trong fixtures/ là dữ liệu mô phỏng, không phải phép đo hay hiệu chuẩn.

## Trường bản ghi

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| schema_version | string | Giá trị 0.1 |
| device_id | string | Mã ESP32 được TKiet gán, ổn định giữa các lần khởi động |
| sample_id | string | Mã duy nhất của lần lấy mẫu trong device_id; giữ nguyên khi gửi lại |
| recorded_at | UTC ISO 8601 string hoặc null | Thời điểm đo khi ESP32 đã đồng bộ giờ; null nếu chưa tin cậy |
| air_temperature_c | number hoặc null | Nhiệt độ không khí °C từ DHT22 |
| air_humidity_pct | number hoặc null | Độ ẩm không khí % từ DHT22 |
| soil_temperature_c | number hoặc null | Nhiệt độ đất °C từ DS18B20 |
| soil_moisture_raw | integer hoặc null | Số đọc ADC thô của HD‑38, không có đơn vị % |
| soil_moisture_pct | number hoặc null | Độ ẩm đất % chỉ sau hiệu chuẩn |
| water_tds_adc_raw | integer hoặc null | Số đọc ADC thô của TDS, không có đơn vị ppm |
| water_tds_ppm | number hoặc null | TDS ppm chỉ sau hiệu chuẩn, ghi phương pháp bù nhiệt nếu áp dụng |
| water_ph_adc_raw | integer hoặc null | Số đọc ADC thô ở GPIO35 sau bộ chia áp |
| water_ph | number hoặc null | pH của mẫu nước/dung dịch, chỉ sau hiệu chuẩn |
| sensor_status | object | Năm khóa dht22, hd38, ds18b20, tds, ph4502c; trạng thái mỗi cảm biến |

Giá trị 0 có thể hợp lệ, khác null. Không gửi NaN, Infinity, chuỗi thay số hoặc số thô vào trường đã quy đổi. Đơn vị raw phụ thuộc cấu hình ADC và phải được ghi cùng phiên bản firmware/hiệu chuẩn trong tài liệu module; raw của hai cảm biến khác nhau không so sánh trực tiếp.

## Trạng thái cảm biến

| Giá trị | Ý nghĩa | Giá trị đi kèm |
| --- | --- | --- |
| ok | Đọc và kiểm tra được; trường quy đổi chỉ có giá trị khi đã hiệu chuẩn | Giá trị hợp lệ theo cảm biến |
| not_calibrated | Đọc thô được nhưng phép quy đổi chưa được kiểm chứng | Raw có thể có; trường %, ppm hoặc pH là null |
| read_error | Không đọc được cảm biến | Trường của cảm biến là null |
| out_of_range | Có tín hiệu nhưng nằm ngoài phạm vi chấp nhận đã ghi trong tài liệu hiệu chuẩn | Không gửi giá trị quy đổi như số hợp lệ |

DHT22 có hai đại lượng; khi cả lần đọc thất bại, cả hai là null. Lỗi một cảm biến không làm mất giá trị hợp lệ của cảm biến khác. Không tự thay số đo lỗi bằng mẫu cũ.

## Thời gian, độ mới và hiệu chuẩn

TVan chỉ gắn recorded_at khi đồng hồ đã đồng bộ; TDat cấp received_at lúc nhận và lưu cả hai. Backend đánh dấu is_stale khi thời gian hiện tại trừ recorded_at đáng tin cậy lớn hơn 5 phút. Nếu recorded_at null, is_stale là null (chưa xác định độ mới), dù received_at vừa mới. UI hiển thị nhãn thời điểm đo hoặc nhận đúng nguồn, không đồng nhất hai thời điểm.

QTien cùng MThuy lưu phép đối chiếu/hiệu chuẩn HD‑38, TDS và pH, phiên bản công thức và phạm vi áp dụng. Cho tới khi có bằng chứng đó, các trường soil_moisture_pct, water_tds_ppm, water_ph là null và trạng thái tương ứng là not_calibrated. pH/TDS là phép đo mẫu nước/dung dịch; không gọi đó là pH/TDS của đất.

Ví dụ JSON và API: api.md; điểm nối firmware: sensor-module.md.
