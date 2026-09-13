# Hoa Nam WMS — AUTH UI Screen Manifest v2

## Kích thước bàn giao

- Desktop tiêu chuẩn: **1920 × 1080 px** (Full HD).
- Tablet tiêu chuẩn 10.9–11 inch: **1440 × 2048 px**; kiểm tra CSS thêm ở viewport logic 768 × 1024.

## Bộ màn hình AUTH

Mỗi màn hình có một ảnh Desktop và một ảnh Tablet, không gộp contact sheet.

| Mã | Màn hình / trạng thái |
|---|---|
| AUTH-01 | Đăng nhập |
| AUTH-02 | Xác nhận phiên làm việc |
| AUTH-01 | Loading |
| AUTH-01 | Validation error |
| AUTH-02 | Đang bắt đầu ca |
| AUTH-02 | Phiên hết hạn |
| AUTH-03 | OTP / Verify |
| AUTH-04 | Quên mật khẩu |
| AUTH-05 | Đặt lại mật khẩu |
| AUTH-ERR-403 | Không có quyền truy cập |
| AUTH-ERR-404 | Không tìm thấy trang |
| AUTH-ERR-500 | Lỗi hệ thống |
| AUTH-OPS | Maintenance |

## Quy tắc chất lượng ảnh

- JPG chất lượng cao là nguồn xem/tải chính trong gallery; giữ nguyên canvas Desktop 1920×1080 và Tablet 1440×2048.
- JPG cũ được giữ để không phá các liên kết đã bàn giao trước đó.
- Thumbnail WebP tối thiểu 2× chiều rộng card, hiện dùng 1440 px cho Desktop và 1400 px cho Tablet.
- Mỗi `<img>` dùng `srcset` gồm thumbnail 2× và ảnh gốc; `sizes` khớp với CSS card.
- Thuộc tính `width`/`height` khớp với kích thước thumbnail thực tế và giữ đúng tỉ lệ ảnh.
- Không dùng ảnh thumbnail 800 px hoặc 687 px để hiển thị trong gallery.

## Phạm vi

Đây là gallery ảnh thiết kế để Dev đối chiếu. Các màn hình là state độc lập, chưa phải luồng nghiệp vụ tương tác.
