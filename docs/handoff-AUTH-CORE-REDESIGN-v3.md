# Hoa Nam WMS · AUTH core redesign v3

Phạm vi của bản này là sáu màn hình lõi liên quan trực tiếp đến **Đăng nhập** và **Xác nhận phiên làm việc**. Thiết kế đã được render lại ở kích thước thật để Dev có thể mở PNG 1:1, không phụ thuộc thumbnail.

## Màn hình bàn giao

| Mã | Trạng thái | Desktop | Tablet dọc |
|---|---|---:|---:|
| AUTH-01 | Đăng nhập | 1920 × 1080 | 1440 × 2048 |
| AUTH-01 | Loading | 1920 × 1080 | 1440 × 2048 |
| AUTH-01 | Validation error | 1920 × 1080 | 1440 × 2048 |
| AUTH-02 | Xác nhận phiên | 1920 × 1080 | 1440 × 2048 |
| AUTH-02 | Đang bắt đầu ca | 1920 × 1080 | 1440 × 2048 |
| AUTH-02 | Phiên hết hạn | 1920 × 1080 | 1440 × 2048 |

PNG là file xem/tải chính của sáu màn hình này. JPG cùng tên vẫn được giữ để không phá các liên kết cũ.

## Quy tắc layout

- **Desktop:** rail thương hiệu 720 px ở bên trái; surface thao tác ở bên phải; card form rộng 748 px, card phiên rộng 782 px.
- **Tablet:** hero thương hiệu cao 560 px; card xếp dọc bên dưới với lề 84 px; không dùng card chồng lên hero.
- Các trường nhập, nút, banner và footer nằm trong flow tĩnh; không dùng tọa độ chồng lớp.
- Hành động chính luôn có hit-area tối thiểu 64 px; khoảng cách giữa các control tối thiểu 16 px.
- Không có text bị cắt, tràn ngang hoặc dính footer ở các kích thước bàn giao.

## Token màu

| Token | Giá trị | Cách dùng |
|---|---|---|
| `navy` | `#063A5A` | tiêu đề, rail đậm |
| `ocean` | `#006D91` | CTA chính, icon tương tác |
| `cyan` | `#15B8C8` | điểm nhấn thương hiệu |
| `surface` | `#F5FAFC` | nền thao tác |
| `line` | `#D4E6ED` | border, divider |
| `ink` | `#123A57` | nội dung chính |
| `muted` | `#60798B` | mô tả, metadata |
| `success` | `#1D9462` | trạng thái đang hoạt động |
| `warning` | `#A66A13` | phiên hết hạn |
| `danger` | `#C74448` | lỗi xác thực |

## Acceptance criteria cho Dev

1. Ở 1920 × 1080, rail và surface gặp nhau đúng tại x = 720; card không chạm mép viewport.
2. Ở 1440 × 2048, hero kết thúc tại y = 560; card bắt đầu từ y = 632; không có vùng nội dung nào nằm dưới card.
3. Các trạng thái loading, validation và expired chỉ thay đổi nội dung trạng thái; không đổi chiều rộng hoặc nhịp layout của component.
4. Tên tài khoản, vai trò, kho, status chip và CTA giữ đúng thứ tự đọc như ảnh bàn giao.
5. Ảnh PNG trong thư mục `previews/auth-png/` là nguồn đối soát pixel; thumbnail WebP chỉ phục vụ gallery.
6. Kiểm tra zoom 200% không làm cắt chữ, không tạo scrollbar ngang và không làm mất CTA.

## Fixture dùng trong ảnh

- Tài khoản: `minh.anh`
- Người dùng: `Minh Anh`
- Vai trò: `Nhân viên kho`
- Kho: `Kho Hoa Nam`
- Thiết bị: `Chrome`
- Khu vực: `Hà Nội`
