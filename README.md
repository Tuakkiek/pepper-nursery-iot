# Pepper Nursery IoT

Dự án MVP IoT theo dõi và hỗ trợ chăm sóc cây ớt con trong vườn ươm.

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
| TKiet | Kiến trúc, phần cứng và tích hợp | Không tạo branch riêng |
| QTien | ESP32, cảm biến và hiệu chuẩn | `QTien` |
| TVan | ESP32, Wi‑Fi và truyền dữ liệu | `TVan` |
| TDat | Backend, API và cơ sở dữ liệu | `TDat` |
| DKhoa | Web dashboard | `DKhoa` |
| QThang | Ứng dụng mobile | `QThang` |
| MThuy | Quy tắc chăm sóc và kiểm thử | `MThuy` |

Ngoài các branch thành viên, dự án có:

- `main`: phiên bản chính thức, chứa đầy đủ tài liệu.
- `dev`: branch phát triển/tích hợp, chứa đầy đủ tài liệu.
- Các branch thành viên: README chung và file Markdown được giao cho thành viên tương ứng.

## Quy trình làm việc

1. Thành viên làm việc trên branch tên mình.
2. Tạo Pull Request từ branch thành viên vào `dev`.
3. Kiểm tra và tích hợp trên `dev`.
4. Tạo Pull Request từ `dev` vào `main` khi nội dung đã hoàn tất.

Branch `main` được cấu hình bảo vệ, không cho push trực tiếp; mọi thay đổi vẫn phải đi qua Pull Request nhưng không bắt buộc lượt phê duyệt.
