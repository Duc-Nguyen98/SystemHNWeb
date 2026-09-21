# Tổng quan Hoa Nam WMS — State preview v2

20 ảnh thiết kế riêng: 10 Desktop và 10 Tablet.

| Thiết bị | Số ảnh | Kích thước ảnh |
|---|---:|---|
| Desktop ngang | 10 | 1920 × 1080 px |
| Tablet dọc | 10 | 1600 × 2560 px |

Các trạng thái: Mặc định, Loading, Empty, Error, Permission denied, Chờ duyệt, Đang xử lý, Hoàn thành, Quá hạn, Khẩn cấp.

JPG chất lượng cao được lưu trong `previews/overview-jpg/` và dùng làm nguồn mở/tải pixel 1:1 (Desktop 1920×1080, Tablet 1600×2560). Thumbnail WebP trong `previews/overview-thumbs/` được tái xuất ở 1440 × 810 px cho Desktop và 1400 × 2240 px cho Tablet, tối thiểu 2× chiều rộng card. Gallery dùng `srcset`/`sizes` và không khai báo kích thước canvas 1920/1600 cho thumbnail.

- Desktop: https://duc-nguyen98.github.io/SystemHNWeb/#overview-desktop
- Tablet: https://duc-nguyen98.github.io/SystemHNWeb/#overview-tablet

Đây là gallery ảnh thiết kế để Dev đối chiếu, chưa phải các luồng nghiệp vụ tương tác.
