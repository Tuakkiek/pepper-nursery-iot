# Pepper Nursery IoT

Dự án MVP IoT theo dõi và hỗ trợ chăm sóc cây ớt con trong vườn ươm.

## Phạm vi MVP G0

Một ESP32 đọc năm cảm biến: DHT22, HD‑38, DS18B20, TDS Meter V1.0 và pH PH‑4502C. TDS/pH đo mẫu nước hoặc dung dịch; giá trị quy đổi chỉ được coi là hợp lệ sau hiệu chuẩn. Hồ sơ G0 v0.1 gồm [phạm vi và kiến trúc](docs/architecture/mvp-scope.md), [pin map](docs/hardware/pin-map.md), [hợp đồng dữ liệu](docs/contracts/sensor-reading.md), [API](docs/contracts/api.md), [ma trận thử](docs/integration/test-matrix.md) và [bảng xác nhận bàn giao](docs/integration/g0-handoff.md). Hồ sơ đang chờ các thành viên xác nhận và kiểm tra mạch thật.

## Cấu trúc thư mục

```text
.
├── README.md
├── firmware/
│   ├── sensors/
│   └── network/
├── backend/
├── web/
├── mobile/
└── docs/
    ├── members/
    │   ├── TKiet/
    │   ├── QTien/
    │   ├── TVan/
    │   ├── TDat/
    │   ├── DKhoa/
    │   ├── QThang/
    │   └── MThuy/
    ├── architecture/
    ├── hardware/
    ├── contracts/
    ├── integration/
    ├── agronomy/
    └── testing/
```

Mỗi thư mục thành viên chứa file Markdown mô tả trách nhiệm, đầu ra cần bàn giao và cách phối hợp của thành viên đó.

## Phân công và branch

| Thành viên | Phụ trách | Branch |
| --- | --- | --- |
| TKiet | Kiến trúc, phần cứng và tích hợp | `TKiet` |
| QTien | ESP32, cảm biến và hiệu chuẩn | `QTien` |
| TVan | ESP32, Wi‑Fi và truyền dữ liệu | `TVan` |
| TDat | Backend, API và cơ sở dữ liệu | `TDat` |
| DKhoa | Web dashboard | `DKhoa` |
| QThang | Ứng dụng mobile | `QThang` |
| MThuy | Quy tắc chăm sóc và kiểm thử | `MThuy` |

Ngoài các branch thành viên, dự án có:

- `main`: phiên bản chính thức, chứa đầy đủ tài liệu.
- `dev`: branch phát triển/tích hợp, chứa đầy đủ tài liệu.
- Các branch thành viên: lưu mã và tài liệu thuộc phần việc được giao; Pull Request vào `dev` để tích hợp.

## Quy trình làm việc

1. Thành viên làm việc trên branch tên mình.
2. Tạo Pull Request từ branch thành viên vào `dev`.
3. Kiểm tra và tích hợp trên `dev`.
4. Tạo Pull Request từ `dev` vào `main` khi nội dung đã hoàn tất.

Branch `main` được cấu hình bảo vệ, không cho push trực tiếp; mọi thay đổi vẫn phải đi qua Pull Request nhưng không bắt buộc lượt phê duyệt.
