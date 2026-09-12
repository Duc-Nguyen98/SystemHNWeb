# Tổng quan Hoa Nam WMS — State preview v1

18 ảnh thiết kế riêng, bổ sung vào gallery Web System cùng bộ AUTH hiện có.

| Thiết bị | Số ảnh | Kích thước ảnh |
|---|---:|---|
| Desktop ngang | 9 | 1920 × 1080 px |
| Tablet dọc | 9 | 1600 × 2560 px |

Các trạng thái: Loading, Empty, Error, Permission denied, Chờ duyệt, Đang xử lý, Hoàn thành, Quá hạn, Khẩn cấp.

## Xem và tải

- Desktop: https://duc-nguyen98.github.io/SystemHNWeb/#overview-desktop
- Tablet: https://duc-nguyen98.github.io/SystemHNWeb/#overview-tablet
- Thư mục `previews/overview-jpg/` chứa 18 ảnh JPG tối ưu để Pages tải nhanh; kích thước canvas vẫn giữ nguyên.
- Thư mục `previews/overview-thumbs/` chỉ phục vụ ảnh xem nhanh trên gallery; tải ảnh luôn trỏ tới JPG.

Đây là gallery ảnh thiết kế để Dev đối chiếu, chưa phải các luồng nghiệp vụ tương tác. Bộ AUTH vẫn dùng kích thước Tablet 1440 × 2048 px đã có; bộ Tổng quan dùng 1600 × 2560 px. Không đổi kích thước hoặc nội dung các ảnh AUTH trong lần cập nhật này.
