# Tổng quan Hoa Nam WMS — State preview v2

> Cập nhật 22/09/2026: 20 liên kết Tổng quan và 26 liên kết Filter hiện trỏ tới bản sửa nghiệp vụ `business-v1`, **cần duyệt**, dùng fixture minh họa chung. Nội dung bên dưới mô tả bộ cũ; bản cũ được lưu để đối chiếu, không còn là nguồn viewer chính. Xem [biên bản và dữ liệu đề xuất](handoff-BUSINESS-REPAIR-v1.md).

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
