# Dữ liệu mô phỏng G0

Các file JSON trong thư mục này chỉ dùng để thống nhất hợp đồng và làm mock/test. Giá trị %, ppm và pH trong reading-normal.json là **số giả định**, không chứng minh cảm biến đã được hiệu chuẩn. reading-uncalibrated.json và latest-uncalibrated.json thể hiện trạng thái trước khi hiệu chuẩn.

latest-normal.json giả định server đánh giá lúc 08:01 UTC ngày 2026-11-04; latest-stale.json giả định lúc 08:10 UTC. Không dùng cờ is_stale trong fixture như giá trị thời gian thực. history.json minh họa thứ tự received_at giảm dần. Các mẫu không chứa khóa truy cập.
