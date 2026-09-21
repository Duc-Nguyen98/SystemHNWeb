# Hoa Nam WMS — AUTH UI Screen Manifest v2

> Cập nhật nghiệp vụ 22/09/2026: AUTH-02 trong hai gallery đã chuyển sang cùng nguồn `business-v1`, bản sửa cần chủ thiết kế duyệt. Default = “Bắt đầu làm việc”; pending = “Đang vào hệ thống…”; Expired ẩn thông tin người dùng/kho và chỉ cho Đăng nhập lại. Không mở/tạo ca. Xem [biên bản mới](handoff-BUSINESS-REPAIR-v1.md).

## Kích thước bàn giao

- Desktop tiêu chuẩn: **1920 × 1080 px** (Full HD).
- AUTH-01 Tablet tiêu chuẩn: **1600 × 2560 px**, tương ứng viewport logic **800 × 1280 @2x**.
- Các màn AUTH hỗ trợ legacy vẫn dùng **1440 × 2048 px** và không được gắn nhãn giả thành 1600 × 2560.

## Bộ màn hình AUTH

Mỗi màn hình có một ảnh Desktop và một ảnh Tablet, không gộp contact sheet.

| Mã | Màn hình / trạng thái |
|---|---|
| AUTH-01 | Đăng nhập — Mặc định |
| AUTH-01 | Validation error |
| AUTH-01 | Authentication failed |
| AUTH-01 | Submitting |
| AUTH-01 | Offline before submit |
| AUTH-01 | Outcome unknown |
| AUTH-01 | Rate limited |
| AUTH-01 | Account unavailable |
| AUTH-01 | Auth service unavailable |
| AUTH-02 | Xác nhận phiên làm việc |
| AUTH-02 | Đang vào hệ thống |
| AUTH-02 | Phiên hết hạn |
| AUTH-03 | OTP / Verify |
| AUTH-04 | Quên mật khẩu |
| AUTH-05 | Đặt lại mật khẩu |
| AUTH-ERR-403 | Không có quyền truy cập |
| AUTH-ERR-404 | Không tìm thấy trang |
| AUTH-ERR-500 | Lỗi hệ thống |
| AUTH-OPS | Maintenance |

## Quy tắc chất lượng ảnh

- JPG chất lượng cao là nguồn xem/tải chính trong gallery; AUTH-01 giữ canvas Desktop 1920×1080 và Tablet 1600×2560.
- Artwork Tablet người dùng cung cấp có dữ liệu 1280×2048 và đã được chuẩn hóa theo đúng tỉ lệ lên canvas khóa 1600×2560.
- JPG cũ được giữ để không phá các liên kết đã bàn giao trước đó.
- Thumbnail WebP tối thiểu 2× chiều rộng card, hiện dùng 1440 px cho Desktop và 1400 px cho Tablet.
- Mỗi `<img>` dùng `srcset` gồm thumbnail 2× và ảnh gốc; `sizes` khớp với CSS card.
- Thuộc tính `width`/`height` khớp với kích thước thumbnail thực tế và giữ đúng tỉ lệ ảnh.
- Không dùng ảnh thumbnail 800 px hoặc 687 px để hiển thị trong gallery.

## Phạm vi

Đây là gallery ảnh thiết kế để Dev đối chiếu. Các màn hình là state độc lập, chưa phải luồng nghiệp vụ tương tác.
