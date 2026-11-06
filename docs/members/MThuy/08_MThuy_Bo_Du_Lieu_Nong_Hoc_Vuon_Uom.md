# 08 — MThuy: Bộ quy tắc nông học toàn diện & Cẩm nang hướng dẫn chăm sóc vườn ươm ớt con

**Dự án:** MVP Chăm sóc vườn ươm ớt con bằng IoT (`pepper-nursery-iot`)  
**Người phụ trách:** MThuy (Agronomy & Testing QA)  
**Phiên bản:** v1.1 (Cập nhật dải phát triển tốt nhất & Cẩm nang hành động cho mọi tình huống)  
**Căn cứ tài liệu khoa học tại `docs/agronomy/`:**
1. *Sổ tay Hướng dẫn kỹ thuật trồng ớt cay* — TS. Lê Lân, Đinh Văn Thành, NXB Nông Nghiệp Hà Nội (2022).
2. *Quy trình kỹ thuật gieo ươm cây ớt cay và cà tím trong nhà màng* — Sở KH&CN An Giang (2019).
3. *Sweet and Hot Pepper Production Guideline* — Starke Ayres Seed (2019).
4. *Effect of Seed Priming on Germination and Seedling Development of Pepper under Salinity Stress* — Journal of Agricultural Studies (2020).
5. *Hợp đồng bản ghi cảm biến G0 v0.1* — `docs/contracts/sensor-reading.md` & `docs/contracts/api.md`.

---

## 1. Dải điều kiện môi trường phát triển tốt nhất (Optimal Growth Zone)

Đối với cây ớt con (*Capsicum annuum L.*) giai đoạn vườn ươm từ khi hạt nứt nanh đến 5-6 lá thật (0 – 35 ngày sau gieo trong khay xốp/khay bầu), môi trường phát triển lý tưởng đạt trạng thái "vàng" khi:

| Chỉ số môi trường | Dải phát triển tốt nhất | Dấu hiệu quan sát thực tế tại vườn ươm |
| :--- | :---: | :--- |
| **Nhiệt độ không khí** (`air_temp`) | **22.0°C – 27.5°C** (ngày)<br>**19.0°C – 21.5°C** (đêm) | Cây con thẳng đứng, lóng thân ngắn mập, lá mầm và lá thật xanh bóng, không bị vống vươn dài. |
| **Độ ẩm không khí** (`air_humidity`) | **60.0% – 75.0%** | Không khí mát mẻ, lá tươi căng, bề mặt lá khô ráo (không đọng giọt nước gây nấm bệnh), khí khổng mở tối đa để quang hợp. |
| **Độ ẩm đất / giá thể** (`soil_moisture`) | **68.0% – 78.0%** | Nắm nhẹ nắm giá thể thấy mát tay, hạt giá thể tơi xốp dính nhẹ nhưng bóp mạnh không có nước ứa ra kẽ ngón tay. Đủ ẩm nuôi rễ và đủ khoảng xốp cho rễ hô hấp. |
| **Nhiệt độ đất / rễ** (`soil_temp`) | **22.0°C – 26.5°C** | Vùng rễ kích thích phân nhánh mạnh, lông hút tơ trắng muốt bám chặt vào giá thể mụn xơ dừa/tro trấu. |
| **Độ pH dung dịch tưới** (`water_ph`) | **6.0 – 6.5** (mở rộng an toàn: 5.8 – 6.8) | Toàn bộ các nguyên tố vi lượng (Fe, Mn, Zn, Cu) và đa lượng (N, P, K) hòa tan tối ưu, cây hấp thu dinh dưỡng dễ dàng mà không bị cháy rễ. |
| **TDS dung dịch tưới** (`water_tds`) | **200 – 450 ppm** | Nước sạch thanh khiết hoặc có pha loãng hữu cơ vi sinh cực nhẹ; độ dẫn điện EC thấp (0.4 – 0.9 dS/m), bảo vệ chóp rễ con non nớt khỏi sốc mặn. |

---

## 2. Bảng phân vùng ngưỡng & Cẩm nang xử lý cho người dùng trong MỌI tình huống

Dưới đây là cẩm nang hướng dẫn đầy đủ từ tình huống **Nguy hiểm cực thấp → Cảnh báo thấp → Phát triển tốt nhất → Cảnh báo cao → Nguy hiểm cực cao** cho cả 5 cảm biến kỹ thuật.

### 2.1. Nhiệt độ không khí (`air_temperature_c`) — Cảm biến DHT22

| Khoảng giá trị | Trạng thái | Mã quy tắc | Hiện tượng & Rủi ro | Lời khuyên hành động cụ thể cho người dùng |
| :--- | :---: | :---: | :--- | :--- |
| **< 16.0°C** | 🚨 Nguy hiểm (Rất lạnh) | `AIR_TEMP_CRIT_LOW` | Cây con ngừng trao đổi chất, rễ đình trệ, dễ bị thui chột hoặc nhiễm nấm rễ. | **Đóng kín vách lưới chắn gió lùa quanh nhà màng**, phủ màng nylon giữ ấm luống ươm. Tuyệt đối không tưới nước vào buổi chiều tối hoặc đêm. Bật đèn sưởi ấm nếu rét đậm kéo dài. |
| **16.0 – 19.9°C** | ⚠️ Cảnh báo (Hơi lạnh) | `AIR_TEMP_WARN_LOW` | Cây con sinh trưởng chậm, lá hơi co lại, kéo dài thời gian xuất vườn. | Khép bớt cửa thông gió hướng đón gió bấc. Tránh tưới nước lạnh lấy trực tiếp từ giếng sâu vào sáng sớm. |
| **20.0 – 28.0°C** | ✅ **Phát triển tốt nhất** | `AIR_TEMP_OPTIMAL` | Nhiệt độ lý tưởng, thân mập, lá dày, tốc độ quang hợp và nảy chồi tối ưu. | **Duy trì thông gió tự nhiên.** Tiếp tục chế độ chiếu sáng đầy đủ 10–12 giờ/ngày, không cần can thiệp che chắn thêm. |
| **28.1 – 32.0°C** | ⚠️ Cảnh báo (Hơi nóng) | `AIR_TEMP_WARN_HIGH` | Cây con tăng thoát hơi nước, lá non bắt đầu rũ nhẹ vào thời điểm giữa trưa. | Mở thông gió các vách nhà màng. Kiểm tra kéo lưới đen che nắng (loại che 30% nắng) nếu nắng gắt rọi trực tiếp. |
| **> 32.0°C** | 🚨 Nguy hiểm (Quá nóng) | `AIR_TEMP_CRIT_HIGH` | Cháy mô lá non, cây mất nước cấp tính, héo rũ, sốc nhiệt dẫn đến chết rạp hàng loạt. | **Kéo ngay lưới che lan giảm nắng (che 70% nắng). Bật hệ thống phun sương làm mát trên mái/la phông**, xịt ẩm lối đi bê tông để hạ nhiệt tức thì. |

---

### 2.2. Độ ẩm không khí (`air_humidity_pct`) — Cảm biến DHT22

| Khoảng giá trị | Trạng thái | Mã quy tắc | Hiện tượng & Rủi ro | Lời khuyên hành động cụ thể cho người dùng |
| :--- | :---: | :---: | :--- | :--- |
| **< 50.0%** | 🚨 Nguy hiểm (Khô hạn) | `AIR_HUM_CRIT_LOW` | Khí quyển khô khốc, lá non thoát nước dữ dội vượt khả năng rễ hút, lá bị quăn khô mép. | **Bật hệ thống phun sương mịn làm ẩm không gian ngay**, che bớt cửa gió để giữ hơi ẩm trong nhà màng, tưới ẩm dặm lối đi xung quanh. |
| **50.0 – 59.9%** | ⚠️ Cảnh báo (Hơi khô) | `AIR_HUM_WARN_LOW` | Nước bốc hơi nhanh, mặt giá thể nhanh bị se khô. | Phun sương nhẹ giữ ẩm không khí, chuẩn bị kiểm tra độ ẩm bầu ươm để tưới bù nước. |
| **60.0 – 75.0%** | ✅ **Phát triển tốt nhất** | `AIR_HUM_OPTIMAL` | Độ ẩm không khí hoàn hảo, lá tươi nhuận, khí khổng hô hấp nhịp nhàng. | **Môi trường lý tưởng.** Duy trì lưu thông không khí thoang thoảng, giữ vườn ươm sạch sẽ, thông thoáng. |
| **75.1 – 85.0%** | ⚠️ Cảnh báo (Hơi ẩm) | `AIR_HUM_WARN_HIGH` | Không khí oi ẩm, hơi nước thoát chậm, bắt đầu có điều kiện cho bào tử nấm mốc nảy mầm. | Tăng cường thông gió nhà màng. Hạn chế tưới phun mưa vào buổi chiều muộn để lá kịp khô trước khi trời tối. |
| **> 85.0%** | 🚨 Nguy hiểm (Úng ẩm/Sương mù) | `AIR_HUM_CRIT_HIGH` | Đọng nước trên chồi lá non, môi trường bùng phát nấm sương mai (*Phytophthora*), thán thư (*Colletotrichum*), thối nhũn lá mầm. | **Mở tối đa cửa thông gió hoặc bật quạt đối lưu.** Ngừng mọi hoạt động phun sương. Rắc vôi bột lối đi để sát khuẩn và giảm độ ẩm cục bộ. |

---

### 2.3. Độ ẩm đất / giá thể (`soil_moisture_pct`) — Cảm biến HD-38

| Khoảng giá trị | Trạng thái | Mã quy tắc | Hiện tượng & Rủi ro | Lời khuyên hành động cụ thể cho người dùng |
| :--- | :---: | :---: | :--- | :--- |
| **< 55.0%** | 🚨 Nguy hiểm (Đất khô kiệt) | `SOIL_MOIST_CRIT_LOW` | Bầu ươm co rút, tách khỏi thành vỉ xốp, rễ tơ bị đứt gãy, cây con héo rũ gục ngọn. | **Tưới bù ẩm khẩn cấp!** Dùng ô doa lỗ mịn hoặc béc phun sương tưới đều mặt khay bầu cho nước ngấm từ từ, tránh xối mạnh làm trôi giá thể. |
| **55.0 – 64.9%** | ⚠️ Cảnh báo (Hơi thiếu nước) | `SOIL_MOIST_WARN_LOW` | Bề mặt giá thể chuyển sang màu xám nhạt, độ ẩm bắt đầu chạm ngưỡng giới hạn dưới. | Lên lịch tưới bổ sung nước sạch trong vòng 1-2 giờ tới. Chú ý tưới đều vào các khay ở bìa luống (nơi bốc hơi nhanh hơn). |
| **65.0 – 80.0%** | ✅ **Phát triển tốt nhất** | `SOIL_MOIST_OPTIMAL` | Giá thể tơi xốp, giữ ẩm lý tưởng, rễ thở tốt và hút nước dễ dàng. | **Độ ẩm chuẩn.** Duy trì chế độ tưới 1–2 lần/ngày vào sáng sớm (8:00 - 9:00) và đầu giờ chiều (14:30 - 15:30), lượng nước vừa đủ thấm đáy lỗ vỉ. |
| **80.1 – 85.0%** | ⚠️ Cảnh báo (Hơi ẩm ướt) | `SOIL_MOIST_WARN_HIGH` | Giá thể đẫm nước, oxy trong lỗ xốp giảm, rễ hút nước chậm lại. | **Tạm dừng lần tưới tiếp theo.** Chờ bề mặt giá thể khô se lại mới tưới tiếp. Kiểm tra các lỗ thoát nước đáy vỉ có bị tắc không. |
| **> 85.0%** | 🚨 Nguy hiểm (Đất úng nước) | `SOIL_MOIST_CRIT_HIGH` | Bầu ươm nhão nhoét, nghẹt rễ do thiếu oxy, thối cổ rễ (*Rhizoctonia solani*), cây con vàng lá rồi đổ rạp hàng loạt. | **Ngừng tưới nước ngay lập tức! Kê vỉ xốp lên giàn dây thép cách mặt đất 20cm** để đáy vỉ thông thoáng. Mở quạt gió hoặc dỡ bớt vật liệu che để nước nhanh thoát. |

---

### 2.4. Nhiệt độ đất / rễ (`soil_temperature_c`) — Cảm biến DS18B20

| Khoảng giá trị | Trạng thái | Mã quy tắc | Hiện tượng & Rủi ro | Lời khuyên hành động cụ thể cho người dùng |
| :--- | :---: | :---: | :--- | :--- |
| **< 18.0°C** | 🚨 Nguy hiểm (Rễ bị lạnh) | `SOIL_TEMP_CRIT_LOW` | Bộ rễ tê liệt, không hút được lân (P) và nước, lá con chuyển màu tím tái hoặc vàng nhạt. | Không đặt khay sát nền đất lạnh ẩm; kê vỉ cách đất 10-20cm. Dùng rơm rạ hoặc bạt phủ cách nhiệt chân luống. |
| **18.0 – 21.9°C** | ⚠️ Cảnh báo (Hơi lạnh) | `SOIL_TEMP_WARN_LOW` | Tốc độ ra rễ non chậm, kéo dài thời gian cây bén rễ hồi xanh. | Tránh tưới nước lạnh vào sáng sớm; nên tưới vào lúc 10h sáng khi trời đã ấm dần lên. |
| **22.0 – 28.0°C** | ✅ **Phát triển tốt nhất** | `SOIL_TEMP_OPTIMAL` | Nhiệt độ rễ vàng, tế bào rễ phân chia nhanh, lông hút bám giá thể chắc chắn. | **Điều kiện rễ tối ưu.** Giữ ổn định độ ẩm giá thể để duy trì nhiệt dung tự nhiên mát mẻ của bầu đất. |
| **28.1 – 32.0°C** | ⚠️ Cảnh báo (Rễ ấm nóng) | `SOIL_TEMP_WARN_HIGH` | Rễ hô hấp mạnh tiêu hao dinh dưỡng, vi sinh vật có hại phát triển nhanh. | Duy trì thông thoáng đáy khay, tránh để ánh nắng chiếu trực tiếp vào thành hông của vỉ xốp. |
| **> 32.0°C** | 🚨 Nguy hiểm (Rễ quá nóng) | `SOIL_TEMP_CRIT_HIGH` | Sốc nhiệt rễ, chín rễ tơ non, nấm khuẩn tấn công rễ làm cây héo xanh đột ngột. | **Tưới làm mát bằng nước mát nhẹ**, che chắn ngay các tia nắng chiếu nghiêng vào khay ươm, phun sương làm mát lối đi. |

---

### 2.5. Độ pH nước / dung dịch tưới (`water_ph`) — Cảm biến PH-4502C

| Khoảng giá trị | Trạng thái | Mã quy tắc | Hiện tượng & Rủi ro | Lời khuyên hành động cụ thể cho người dùng |
| :--- | :---: | :---: | :--- | :--- |
| **< 5.3** | 🚨 Nguy hiểm (Chua gắt/Phèn) | `WATER_PH_CRIT_LOW` | Nước có tính axit mạnh, làm xót cháy chóp rễ non, ngộ độc nhôm/sắt, cây còi cọc chùn đọt. | **Tuyệt đối không dùng tưới!** Dùng nước vôi trong pha loãng hoặc Kali bicacbonat ($KHCO_3$) châm từng ít một vào bể chứa để nâng pH lên 6.0 – 6.5 trước khi tưới. |
| **5.3 – 5.7** | ⚠️ Cảnh báo (Hơi chua) | `WATER_PH_WARN_LOW` | Hơi chua, hấp thu lân và canxi kém hơn bình thường. | Bổ sung thêm một lượng nhỏ nước giếng khoan sạch hoặc sục khí bể chứa để khử bớt CO2 và axit tự do. |
| **5.8 – 6.8** | ✅ **Phát triển tốt nhất** | `WATER_PH_OPTIMAL` | Môi trường pH hoàn hảo, dinh dưỡng hòa tan tối đa, cây con mỡ màng, cứng cáp. | **Nguồn nước đạt chuẩn chất lượng cao.** Duy trì nguồn nước hiện tại để tưới hàng ngày cho vườn ươm. |
| **6.9 – 7.4** | ⚠️ Cảnh báo (Hơi kiềm) | `WATER_PH_WARN_HIGH` | Bắt đầu kết tủa một phần vi lượng sắt, kẽm trong nước. | Cần theo dõi bể chứa. Nếu lá non có hiện tượng hơi vàng gân lá, chuẩn bị điều chỉnh nhẹ độ pH. |
| **> 7.5** | 🚨 Nguy hiểm (Kiềm cao/Nhiễm vôi) | `WATER_PH_CRIT_HIGH` | Toàn bộ sắt ($Fe^{2+}$), kẽm, mangan bị kết tủa, rễ không thể hấp thụ làm đọt non vàng trắng (bệnh úa vàng sinh lý). | **Tuyệt đối không dùng tưới trực tiếp!** Dùng axit citric hữu cơ (chanh/axit chanh) hoặc axit photphoric loãng pha vào bể chứa để hạ pH về dải 6.0 – 6.5. |

---

### 2.6. Nồng độ chất tan TDS nước tưới (`water_tds_ppm`) — Cảm biến TDS Meter V1.0

| Khoảng giá trị | Trạng thái | Mã quy tắc | Hiện tượng & Rủi ro | Lời khuyên hành động cụ thể cho người dùng |
| :--- | :---: | :---: | :--- | :--- |
| **< 100 ppm** | ⚠️ Cảnh báo (Quá nghèo khoáng) | `WATER_TDS_WARN_LOW` | Nước mưa hoặc nước lọc tinh khiết không có khoáng chất hòa tan. | Cây con giai đoạn đầu vẫn đủ dinh dưỡng từ hạt và giá thể. Khi cây có 3-4 lá thật, nên châm thêm dung dịch dinh dưỡng loãng (TDS ~ 250 ppm) để cây cứng cáp. |
| **100 – 199 ppm** | ℹ️ Chấp nhận được | `WATER_TDS_NORMAL_LOW`| Nước giếng khoan sạch hoặc nước máy đã khử clo, khoáng nhẹ. | Nước an toàn cho cây con dưới 10 ngày tuổi. Duy trì tưới đều đặn. |
| **200 – 450 ppm** | ✅ **Phát triển tốt nhất** | `WATER_TDS_OPTIMAL` | Nồng độ chất tan lý tưởng, cung cấp vừa đủ dưỡng chất vi lượng mà không tạo áp suất thẩm thấu bất lợi. | **Dung dịch dinh dưỡng hoàn hảo cho ớt con.** Duy trì công thức nước tưới này đến khi xuất vườn. |
| **451 – 850 ppm** | ⚠️ Cảnh báo (Hơi đậm đặc) | `WATER_TDS_WARN_HIGH` | Nồng độ phân bón hơi cao so với sức chịu đựng của cây ớt con dưới 20 ngày tuổi. | **Pha loãng thêm 30% – 50% nước sạch** trước khi tưới để tránh gây nghẽn đầu rễ tơ non. |
| **> 850 ppm** | 🚨 Nguy hiểm (Nhiễm mặn/Xót phân) | `WATER_TDS_CRIT_HIGH` | Nước quá mặn hoặc quá đặc phân, áp suất thẩm thấu đảo ngược hút nước từ rễ ra ngoài làm cháy mép lá, thối rễ, cây con chết rũ. | **Nguy hiểm khẩn cấp! Tuyệt đối ngừng tưới dung dịch này! Xả ngay một lượng nước sạch** để rửa trôi muối tích tụ trong khay xốp. Thay nguồn nước mới. |

---

### 2.7. Tình huống lỗi kỹ thuật & Cảm biến bất thường

| Tình huống kỹ thuật | Trạng thái hệ thống | Giá trị trả về | Lời khuyên hành động cụ thể cho người dùng |
| :--- | :---: | :---: | :--- |
| **Cảm biến bị lỗi đọc** (`read_error`) | `insufficient_data` | Đại lượng = `null`, `advice = null` | "Cảm biến đang mất kết nối. Hãy kiểm tra giắc cắm tín hiệu, nguồn 3.3V/5V hoặc dây cắm lỏng trên mạch ESP32." |
| **Cảm biến chưa hiệu chuẩn** (`not_calibrated`) | `insufficient_data` | ADC raw có giá trị, %, ppm, pH = `null` | "Cảm biến chưa được nạp hệ số hiệu chuẩn. Hãy cùng kỹ thuật viên thực hiện quy trình chuẩn hóa mẫu trước khi sử dụng." |
| **Dữ liệu đo bị cũ** (`is_stale = true`, > 5 phút) | `stale_data` | Dữ liệu cũ, gắn nhãn CŨ | "Mất kết nối với trạm đo vườn ươm hơn 5 phút. Hãy kiểm tra nguồn điện cấp cho ESP32 và cột phát sóng Wi-Fi tại vườn." |

---

## 3. Bản quy tắc logic triển khai cho Backend (`Advice Rule Engine`)

Dưới đây là cấu trúc mã lệnh mẫu dạng TypeScript/JavaScript để bạn TDat tích hợp trực tiếp vào module tính toán `advice` ở backend:

```typescript
export interface SensorReading {
  air_temperature_c: number | null;
  air_humidity_pct: number | null;
  soil_temperature_c: number | null;
  soil_moisture_pct: number | null;
  water_tds_ppm: number | null;
  water_ph: number | null;
  sensor_status: {
    dht22: string;
    hd38: string;
    ds18b20: string;
    tds: string;
    ph4502c: string;
  };
}

export function evaluateAdvice(reading: SensorReading, is_stale: boolean) {
  // 1. Kiểm tra điều kiện dữ liệu thiếu / cũ
  if (is_stale || Object.values(reading.sensor_status).some(s => s !== "ok")) {
    return {
      version: "0.1",
      status: "insufficient_data",
      priority: 1,
      code: "ERR_INSUFFICIENT_DATA",
      message: "Dữ liệu cảm biến không đủ hoặc đã cũ, không thể đánh giá tình trạng vườn ươm.",
      suggested_action: "Kiểm tra lại kết nối phần cứng, nguồn điện trạm ESP32 hoặc hoàn tất hiệu chuẩn cảm biến."
    };
  }

  // 2. Kiểm tra các cảnh báo mức NGUY HIỂM (Critical - Priority 2)
  if (reading.soil_moisture_pct! < 55.0) {
    return {
      version: "0.1",
      status: "critical",
      priority: 2,
      code: "SOIL_MOIST_CRIT_LOW",
      message: "Khẩn cấp: Bầu ươm đất bị khô kiệt nghiêm trọng (dưới 55%), cây con có nguy cơ héo chết rũ!",
      suggested_action: "Tưới bù ẩm ngay lập tức bằng vòi phun sương mịn đều khắp khay bầu."
    };
  }
  if (reading.soil_moisture_pct! > 85.0) {
    return {
      version: "0.1",
      status: "critical",
      priority: 2,
      code: "SOIL_MOIST_CRIT_HIGH",
      message: "Khẩn cấp: Giá thể đất đang bị ngập úng (trên 85%), rễ cây bị nghẹt oxy, nguy cơ thối lở cổ rễ!",
      suggested_action: "Ngừng tưới nước ngay lập tức! Kê vỉ xốp lên giàn cao và tăng tối đa thông gió đáy bầu."
    };
  }
  if (reading.water_tds_ppm! > 850.0) {
    return {
      version: "0.1",
      status: "critical",
      priority: 2,
      code: "WATER_TDS_CRIT_HIGH",
      message: "Khẩn cấp: Nước tưới nhiễm mặn/nồng độ phân quá cao (>850 ppm), nguy cơ gây cháy xót toàn bộ rễ con!",
      suggested_action: "Tuyệt đối không tưới dung dịch này! Xả nước sạch rửa trôi muối trong giá thể và đổi nguồn nước tưới."
    };
  }
  if (reading.water_ph! < 5.3) {
    return {
      version: "0.1",
      status: "critical",
      priority: 2,
      code: "WATER_PH_CRIT_LOW",
      message: "Khẩn cấp: Nước tưới bị nhiễm phèn chua nặng (pH < 5.3), làm cháy cụt đầu rễ con cây ớt!",
      suggested_action: "Không tưới trực tiếp! Dùng nước vôi trong pha loãng nâng pH lên 6.0 - 6.5 trước khi sử dụng."
    };
  }
  if (reading.water_ph! > 7.5) {
    return {
      version: "0.1",
      status: "critical",
      priority: 2,
      code: "WATER_PH_CRIT_HIGH",
      message: "Cảnh báo cao: Nước tưới có độ kiềm vôi cao (pH > 7.5), làm kết tủa vi lượng sắt khiến lá non bị vàng trắng!",
      suggested_action: "Dùng axit citric hữu cơ pha loãng vào bể chứa để hạ pH về dải tối ưu 6.0 - 6.5."
    };
  }
  if (reading.air_temperature_c! > 32.0) {
    return {
      version: "0.1",
      status: "critical",
      priority: 2,
      code: "AIR_TEMP_CRIT_HIGH",
      message: "Cảnh báo: Nhiệt độ không khí vượt quá 32°C, nắng nóng gay gắt gây cháy lá và sốc nhiệt cây con!",
      suggested_action: "Kéo lưới lan che 70% nắng, bật hệ thống phun sương mái và làm mát nền nhà màng."
    };
  }

  // 3. Kiểm tra các cảnh báo mức TRUNG BÌNH (Warning - Priority 3 & 4)
  if (reading.air_humidity_pct! > 85.0) {
    return {
      version: "0.1",
      status: "warning",
      priority: 3,
      code: "AIR_HUM_CRIT_HIGH",
      message: "Ẩm độ không khí quá cao (>85%), điều kiện cực kỳ thuận lợi cho nấm sương mai và thán thư phát triển.",
      suggested_action: "Mở thông thoáng cửa gió nhà màng, ngừng phun sương, không tưới đẫm vào chiều tối."
    };
  }
  if (reading.air_humidity_pct! < 50.0) {
    return {
      version: "0.1",
      status: "warning",
      priority: 3,
      code: "AIR_HUM_CRIT_LOW",
      message: "Không khí khô hanh (<50%), cây con bị bốc thoát hơi nước nhanh làm mép lá héo quăn.",
      suggested_action: "Phun sương mịn làm ẩm không gian nhà màng và tưới dặm nền đất xung quanh."
    };
  }
  if (reading.air_temperature_c! < 18.0) {
    return {
      version: "0.1",
      status: "warning",
      priority: 3,
      code: "AIR_TEMP_WARN_LOW",
      message: "Nhiệt độ không khí hơi thấp (<18°C), cây con sinh trưởng chậm và kéo dài thời gian xuất vườn.",
      suggested_action: "Đóng bớt cửa gió hướng gió lạnh, tránh tưới nước lạnh vào sáng sớm."
    };
  }
  if (reading.soil_moisture_pct! < 65.0) {
    return {
      version: "0.1",
      status: "warning",
      priority: 4,
      code: "SOIL_MOIST_WARN_LOW",
      message: "Bầu ươm bắt đầu khô (dưới 65%), độ ẩm đang ở ngưỡng cần chú ý.",
      suggested_action: "Lên lịch tưới bổ sung nước sạch bằng ô doa lỗ mịn trong vòng 1-2 giờ tới."
    };
  }
  if (reading.soil_moisture_pct! > 80.0) {
    return {
      version: "0.1",
      status: "warning",
      priority: 4,
      code: "SOIL_MOIST_WARN_HIGH",
      message: "Bầu ươm hơi nhiều nước (>80%), đất đẫm làm hạn chế oxy vùng rễ.",
      suggested_action: "Tạm dừng cữ tưới tiếp theo, chờ bề mặt bầu ươm se lại."
    };
  }

  // 4. Môi trường phát triển lý tưởng (Optimal - Priority 5)
  return {
    version: "0.1",
    status: "optimal",
    priority: 5,
    code: "ENV_OPTIMAL",
    message: "Tuyệt vời: Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng nhất!",
    suggested_action: "Duy trì chế độ thông gió và lịch tưới ổn định hiện tại (1-2 lần/ngày)."
  };
}
```

---

## 4. Xác nhận bàn giao & Lưu trữ
- Tài liệu này được lưu tại: `docs/members/MThuy/08_MThuy_Bo_Du_Lieu_Nong_Hoc_Vuon_Uom.md`
- Bản chuẩn hóa toàn dự án được lưu tại: `docs/agronomy/quy-tac-cham-soc-v0.1.md`
- Bộ dữ liệu JSON tương thích 100%: `docs/members/MThuy/bo_du_lieu_mau_cam_bien.json`
- Bảng Excel/CSV đối chiếu: `docs/members/MThuy/bo_du_lieu_mau_cam_bien.csv`
