# MAP-01 · Backup comparison QA v1

Ngày rà soát: 2026-09-13

## Phạm vi đã nhận

| Viewport | Số ảnh | Kích thước |
|---|---:|---:|
| Desktop ngang | 13 | 1920 × 1080 px |
| Tablet dọc | 13 | 1600 × 2560 px (@2x) |
| Tổng | 26 | Đủ cặp state 01–13 |

## Ma trận state đã đối chiếu

01 Mặc định 7 ngày · 02 Hover/focus · 03 Mở menu · 04 Chọn 14 ngày · 05 Chọn 30 ngày · 06 Mở tùy chỉnh · 07 Khoảng ngày không hợp lệ · 08 Khoảng tùy chỉnh đã áp dụng · 09 Tooltip · 10 Loading · 11 Empty · 12 Error · 13 Permission denied.

## Kết quả đối chiếu với gallery

- Gallery Tổng quan trước đây chỉ hiển thị 9 state nghiệp vụ; đã bổ sung ma trận 13 Filter/Datepicker state vào cả section Desktop và Tablet để không còn bị thiếu ngữ cảnh.
- Gallery Filter/Datepicker vẫn giữ trang chi tiết riêng với 13 state Desktop và 13 state Tablet.
- Các state backup thể hiện đúng thay đổi của biểu đồ theo khoảng 7/14/30 ngày và khoảng tùy chỉnh; KPI hôm nay giữ nguyên.
- State invalid khóa nút Áp dụng; Loading dùng skeleton; Empty có CTA đổi bộ lọc; Error có nút Thử lại; Permission denied có CTA quay lại Tổng quan.

## Lỗi quan sát được trong chính ảnh backup

- Ở Tablet dọc, KPI Việc cần xử lý có dòng phần trăm giảm và dòng So với hôm qua bị chồng lên nhau. Đây là lỗi visual P0 cần xử lý trước UAT Tablet.
- Nguồn AUTH Tablet trong repo đang là 1440 × 2048 px, khác canvas Tablet chuẩn 800 × 1280 CSS / 1600 × 2560 export. Không tự đổi nguồn khi chưa có quyết định duyệt.
- Bộ ảnh đã nhận chưa có artwork Tablet ngang 1280 × 800 CSS / 2560 × 1600 export. Không dùng phép xoay hoặc kéo giãn ảnh dọc để thay thế.

## Thay đổi đã thực hiện

- Bổ sung state summary 13 state vào Tổng quan Desktop và Tablet.
- Giữ nguyên asset hiện hữu; chưa ghi đè ảnh backup.
- Cập nhật tài liệu orientation QA và link public.
- Pages build hiện tại đã chạy thành công.

## Cần xác nhận trước bước chỉnh artwork

1. Bộ backup 26 ảnh này có phải nguồn chuẩn để ghi đè asset Filter/Datepicker hiện tại không?
2. Cho phép tôi sửa lỗi chồng chữ KPI Tablet theo đúng nội dung backup, hay giữ nguyên dữ liệu và chỉ điều chỉnh layout?
3. Có cần cung cấp thêm 13 ảnh Tablet ngang riêng trước khi triển khai landscape không?
