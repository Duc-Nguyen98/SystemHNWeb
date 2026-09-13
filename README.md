# SystemHNWeb · Hoa Nam WMS UI/UX Preview

Gallery Web System riêng cho Dev xem và tải ảnh thiết kế. AUTH-01 và AUTH-02 đã được redesign v3 với PNG 1:1, layout Desktop/Tablet tách rõ và các state lõi đồng bộ. Bộ filter/date picker MAP-01 v2 có gallery QA riêng với 13 state cho mỗi viewport.

**GitHub Pages:** https://duc-nguyen98.github.io/SystemHNWeb/

| Nhóm | Desktop | Tablet dọc | Tổng |
|---|---:|---:|---:|
| Đăng nhập & Xác nhận phiên | 13 ảnh · 1920 × 1080 | 13 ảnh · 1440 × 2048 | 26 |
| Tổng quan — 9 trạng thái | 9 ảnh · 1920 × 1080 | 9 ảnh · 1600 × 2560 | 18 |
| MAP-01 — Filter/date picker QA v2 | 13 state · 1920 × 1080 | 13 state · 1600 × 2560 | 26 |
| **Toàn bộ gallery** | **22 ảnh** | **22 ảnh** | **44** |

## AUTH bổ sung

- AUTH-03 · OTP / Verify
- AUTH-04 · Quên mật khẩu
- AUTH-05 · Đặt lại mật khẩu
- AUTH-ERR-403 · Không có quyền truy cập
- AUTH-ERR-404 · Không tìm thấy trang
- AUTH-ERR-500 · Lỗi hệ thống
- AUTH-OPS · Maintenance

Các màn mới có bản Desktop Full HD 1920 × 1080 px và Tablet dọc 1440 × 2048 px. Bộ cũ vẫn giữ nguyên route ảnh và nội dung.

## Truy cập trực tiếp

- [AUTH core redesign v3](handoff-AUTH-CORE-REDESIGN-v3.md)
- [MAP-01 filter/date picker QA v2](previews/overview-filter-v2/index.html)
- [Handoff Design + QA filter v2](handoff-OVERVIEW-FILTER-QA-v2.md)

- [AUTH Desktop](https://duc-nguyen98.github.io/SystemHNWeb/#auth-desktop)
- [AUTH Tablet](https://duc-nguyen98.github.io/SystemHNWeb/#auth-tablet)
- [Tổng quan Desktop](https://duc-nguyen98.github.io/SystemHNWeb/#overview-desktop)
- [Tổng quan Tablet](https://duc-nguyen98.github.io/SystemHNWeb/#overview-tablet)

Mỗi màn có liên kết xem kích thước đầy đủ và tải riêng. Gallery filter v2 là bộ kiểm tra component riêng, không thay thế gallery Dashboard 44 màn. Ảnh gốc JPG chất lượng cao nằm trong `previews/auth-jpg/` và `previews/overview-jpg/`, giữ nguyên canvas 1920×1080 hoặc 1440×2048/1600×2560; đây là nguồn xem/tải pixel 1:1. Thumbnail WebP trong `*-thumbs/` có kích thước tối thiểu 2× chiều rộng hiển thị và được khai báo bằng `srcset`/`sizes`.

Gallery giới hạn vùng xem nhanh tối đa 700 px, nên thumbnail 1440 px đủ cho màn hình 2×. Thuộc tính `width`/`height` của mỗi ảnh khớp với file thumbnail thực tế, không khai báo kích thước canvas 1920/1600 cho file thumbnail nhỏ hơn.

GitHub Pages dùng nhánh `main`, thư mục `/docs`. Các file gallery ở thư mục gốc và `/docs` được đồng bộ. Không dùng thư mục hoặc bản preview của Scanner App cho Web System này.
