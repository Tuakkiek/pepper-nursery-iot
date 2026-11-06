# Quy tắc chăm sóc vườn ươm ớt con G0 v0.1

**Dự án:** MVP Chăm sóc vườn ươm ớt con bằng IoT (`pepper-nursery-iot`)  
**Người phụ trách chính:** MThuy (Agronomy & Testing QA)  
**Phê duyệt phạm vi:** TKiet (Project Lead & Integration)  
**Nơi thực thi duy nhất:** Backend (TDat triển khai)  
**Người tiêu thụ hiển thị:** DKhoa (Web Dashboard), QThang (Mobile App)  
**Hiệu chuẩn cảm biến đối chiếu:** QTien (Firmware Sensors)

---

## 1. Dải điều kiện môi trường phát triển tốt nhất (Optimal Growth Zone)

Áp dụng cho cây ớt con (*Capsicum annuum L.*) giai đoạn vườn ươm từ 0 – 35 ngày sau gieo trong khay xốp/khay bầu:

1. **Nhiệt độ không khí (`air_temperature_c`):** **22.0°C – 27.5°C** (ngày) / **19.0°C – 21.5°C** (đêm). Dải an toàn: **20.0°C – 28.0°C**. Thân mập, lá xanh dày, lóng ngắn.
2. **Độ ẩm không khí (`air_humidity_pct`):** **60.0% – 75.0%**. Lá căng bóng, quang hợp tối đa, bề mặt lá khô ráo không đọng giọt nước gây nấm.
3. **Độ ẩm đất / giá thể bầu (`soil_moisture_pct`):** **68.0% – 78.0%** (Dải an toàn: 65.0% – 80.0%). Giá thể tơi xốp, đủ ẩm nuôi rễ và đủ oxy cho rễ thở.
4. **Nhiệt độ đất / rễ (`soil_temperature_c`):** **22.0°C – 26.5°C**. Rễ phân nhánh mạnh, lông hút trắng phát triển tốt.
5. **Độ pH nước tưới (`water_ph`):** **6.0 – 6.5** (Dải chấp nhận: 5.8 – 6.8). Dinh dưỡng khoáng vi lượng và đa lượng hòa tan tối ưu.
6. **TDS nước tưới (`water_tds_ppm`):** **200 – 450 ppm**. Nồng độ an toàn tuyệt đối cho rễ con non nớt.

---

## 2. Bảng phân vùng ngưỡng & Lời khuyên hành động cho người dùng

| Đại lượng | Cực thấp (🚨 Nguy hiểm) | Thấp (⚠️ Cảnh báo) | Tối ưu (✅ Tốt nhất) | Cao (⚠️ Cảnh báo) | Cực cao (🚨 Nguy hiểm) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nhiệt độ khí (°C)** | **< 16.0**<br>*Che chắn gió lùa, phủ nylon giữ ấm, bật đèn sưởi.* | **16.0 – 19.9**<br>*Khép bớt cửa gió, tránh tưới nước lạnh sáng sớm.* | **20.0 – 28.0**<br>*Duy trì thông gió tự nhiên, đủ sáng 10-12h/ngày.* | **28.1 – 32.0**<br>*Mở thông gió, kéo lưới che 30% nắng.* | **> 32.0**<br>*Kéo lưới che 70% nắng, bật phun sương mái làm mát.* |
| **Độ ẩm khí (%)** | **< 50.0**<br>*Bật phun sương làm ẩm không gian, tưới nền.* | **50.0 – 59.9**<br>*Phun sương nhẹ giữ ẩm không khí.* | **60.0 – 75.0**<br>*Môi trường chuẩn, duy trì thông thoáng.* | **75.1 – 85.0**<br>*Tăng thông gió, tránh tưới chiều tối.* | **> 85.0**<br>*Mở tối đa cửa gió, quạt đối lưu, rắc vôi bột lối đi.* |
| **Độ ẩm đất (%)** | **< 55.0**<br>*Tưới bù ẩm khẩn cấp bằng phun sương mịn đều mặt khay.* | **55.0 – 64.9**<br>*Chuẩn bị tưới bổ sung nước sạch trong 1-2h tới.* | **65.0 – 80.0**<br>*Duy trì tưới 1-2 lần/ngày (sáng sớm & đầu giờ chiều).* | **80.1 – 85.0**<br>*Tạm dừng cữ tưới tiếp theo, chờ se mặt giá thể.* | **> 85.0**<br>*Ngừng tưới ngay, kê khay xốp cao 20cm, thông gió đáy.* |
| **Nhiệt độ rễ (°C)** | **< 18.0**<br>*Kê khay cách đất 20cm, rơm rạ cách nhiệt đáy luống.* | **18.0 – 21.9**<br>*Tưới nước lúc ấm (khoảng 10h sáng).* | **22.0 – 28.0**<br>*Vùng rễ tối ưu, giữ ổn định ẩm độ bầu đất.* | **28.1 – 32.0**<br>*Tránh nắng rọi trực tiếp vào thành khay xốp.* | **> 32.0**<br>*Tưới làm mát bằng nước mát nhẹ, che nắng xiên.* |
| **Độ pH nước** | **< 5.3**<br>*Tuyệt đối không tưới! Dùng nước vôi trong nâng pH lên 6.0-6.5.* | **5.3 – 5.7**<br>*Châm thêm nước giếng sạch hoặc sục khí bể chứa.* | **5.8 – 6.8**<br>*Nguồn nước đạt chuẩn, tưới định kỳ an toàn.* | **6.9 – 7.4**<br>*Theo dõi gân lá non, chuẩn bị điều chỉnh nhẹ pH.* | **> 7.5**<br>*Tuyệt đối không tưới! Dùng axit citric hữu cơ hạ pH về 6.0-6.5.* |
| **TDS nước (ppm)** | **< 100**<br>*Nước nghèo khoáng; sau 15 ngày châm nhẹ hữu cơ vi sinh.* | **100 – 199**<br>*Nước sạch an toàn cho cây con dưới 10 ngày tuổi.* | **200 – 450**<br>*Dung dịch dinh dưỡng hoàn hảo cho ớt con.* | **451 – 850**<br>*Pha loãng thêm 30-50% nước sạch trước khi tưới.* | **> 850**<br>*Nguy hiểm khẩn cấp! Ngừng tưới, xả nước sạch rửa trôi muối.* |

---

## 3. Cấu trúc phản hồi `advice` từ Backend

```json
{
  "device_id": "esp32-nursery-01",
  "received_at": "2026-11-04T09:30:02Z",
  "is_stale": false,
  "advice": {
    "version": "0.1",
    "status": "optimal",
    "priority": 5,
    "code": "ENV_OPTIMAL",
    "message": "Tuyệt vời: Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng nhất!",
    "suggested_action": "Duy trì chế độ thông gió và lịch tưới ổn định hiện tại (1-2 lần/ngày)."
  }
}
```

Khi có cảm biến bị lỗi (`read_error`), chưa hiệu chuẩn (`not_calibrated`) hoặc dữ liệu cũ (`is_stale = true`):
```json
{
  "advice": {
    "version": "0.1",
    "status": "insufficient_data",
    "priority": 1,
    "code": "ERR_INSUFFICIENT_DATA",
    "message": "Dữ liệu cảm biến không đủ hoặc đã cũ, không thể đánh giá tình trạng vườn ươm.",
    "suggested_action": "Kiểm tra lại kết nối phần cứng, nguồn điện trạm ESP32 hoặc hoàn tất hiệu chuẩn cảm biến."
  }
}
```
*(Hoặc `advice: null` theo quy ước của API ban đầu).*

