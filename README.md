# SystemHNWeb · Hoa Nam WMS UI/UX Preview

Gallery Web System riêng cho Dev xem và tải ảnh thiết kế. AUTH-01 và AUTH-02 đã được redesign v3 với PNG 1:1, layout Desktop/Tablet tách rõ và các state lõi đồng bộ. Bộ filter/date picker MAP-01 v2 có gallery QA riêng với 13 state cho mỗi viewport. RPT-IN-01 v2 là Master Report Layout đầu tiên, bám shell và màu của màn Tổng Quan Hoa Nam.

**GitHub Pages:** https://duc-nguyen98.github.io/SystemHNWeb/

| Nhóm | Desktop | Tablet dọc | Tổng |
|---|---:|---:|---:|
| Đăng nhập & Xác nhận phiên | 13 ảnh · 1920 × 1080 | 13 ảnh · 1440 × 2048 | 26 |
| Tổng quan — 9 trạng thái | 9 ảnh · 1920 × 1080 | 9 ảnh · 1600 × 2560 | 18 |
| MAP-01 — Filter/date picker QA v2 | 13 state · 1920 × 1080 | 13 state · 1600 × 2560 | 26 |
| RPT-IN-01 — Báo cáo Nhập kho · Master v2 | 1 ảnh · 1920 × 1080 | 1 ảnh · 1600 × 2560 | 2 |
| **Toàn bộ gallery** | **36 ảnh/state** | **36 ảnh/state** | **72** |

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
- [RPT-IN-01 Master Report Layout v2](handoff-INBOUND-REPORT-MASTER-v2.md)

- [AUTH Desktop](https://duc-nguyen98.github.io/SystemHNWeb/#auth-desktop)
- [AUTH Tablet](https://duc-nguyen98.github.io/SystemHNWeb/#auth-tablet)
- [Tổng quan Desktop](https://duc-nguyen98.github.io/SystemHNWeb/#overview-desktop)
- [Tổng quan Tablet](https://duc-nguyen98.github.io/SystemHNWeb/#overview-tablet)
- [Báo cáo Nhập kho Desktop](https://duc-nguyen98.github.io/SystemHNWeb/#inbound-report-desktop)
- [Báo cáo Nhập kho Tablet](https://duc-nguyen98.github.io/SystemHNWeb/#inbound-report-tablet)

Mỗi màn có liên kết xem kích thước đầy đủ và tải riêng. Gallery filter v2 là bộ kiểm tra component riêng, không thay thế gallery Dashboard 44 màn. Ảnh gốc JPG chất lượng cao nằm trong `previews/auth-jpg/` và `previews/overview-jpg/`, giữ nguyên canvas 1920×1080 hoặc 1440×2048/1600×2560; đây là nguồn xem/tải pixel 1:1. Thumbnail WebP trong `*-thumbs/` có kích thước tối thiểu 2× chiều rộng hiển thị và được khai báo bằng `srcset`/`sizes`.

Gallery giới hạn vùng xem nhanh tối đa 700 px, nên thumbnail 1440 px đủ cho màn hình 2×. Thuộc tính `width`/`height` của mỗi ảnh khớp với file thumbnail thực tế, không khai báo kích thước canvas 1920/1600 cho file thumbnail nhỏ hơn.

GitHub Pages xuất bản thư mục `/docs` của nhánh `main` bằng workflow sau khi quality gate đạt. Các file gallery ở thư mục gốc và `/docs` được đồng bộ. Không dùng thư mục hoặc bản preview của Scanner App cho Web System này.

Revision đang phục vụ được ghi tại `deployment.json` sau mỗi lần phát hành đạt kiểm tra.


Orientation QA: [Viewport & Orientation handoff](handoff-VIEWPORT-ORIENTATION-QA-v1.md). Gallery đã tách Desktop ngang, Tablet dọc và Tablet ngang; artwork Tablet ngang đang được đánh dấu thiếu riêng để không dùng nhầm ảnh dọc.

## Sửa trình xem DEV · 13/09/2026

Trình xem chung `viewer.html?screen=<id>` là nguồn duy nhất cho 72 màn ở gallery chính và 26 liên kết ở gallery bộ lọc. Không tạo lại trình xem bằng `document.write`, không dùng thumbnail hoặc ảnh nhúng 480 px cho xem chi tiết.

- **Vừa màn hình:** tính từ vùng còn lại sau toolbar/footer, giữ đủ bốn mép.
- **Vừa chiều rộng:** giữ tỉ lệ, cho cuộn dọc.
- **1:1 pixel:** một pixel ảnh trên một pixel màn hình; không phải một CSS pixel. Hoạt động cả khi DPR dưới 1 do browser zoom-out.
- **+/−:** đổi kích thước layout thực, không transform; dừng tại 100% độ phân giải gốc.
- **Toàn màn hình / Tải ảnh gốc:** mở rộng vùng xem hoặc tải đúng bytes đã kiểm tra hash.

Ảnh dọc trên cửa sổ ngang có khoảng trống hai bên khi xem trọn màn — đây là giữ đúng tỉ lệ, không phải cắt ảnh. Muốn đọc lớn hơn, dùng Vừa chiều rộng hoặc 1:1 rồi cuộn. Ảnh bitmap không thể phóng vô hạn mà vẫn giữ chi tiết; không upscale để giả ảnh sắc nét.

### Kiểm tra trước khi bàn giao

```sh
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run sync
QA_BROWSERS=chromium,firefox,webkit npm test
npm run serve
```

PowerShell: đặt `$env:QA_BROWSERS='chromium,firefox,webkit'` trước `npm test`. `npm run serve` chỉ mở máy chủ local tại `http://127.0.0.1:4174`, không publish.

`screen-manifest.json` lưu ID, loại thiết bị, kích thước ảnh thật, kích thước CSS nếu đã xác định, hash và nguồn gốc. 26 PNG filter được khôi phục nguyên vẹn từ gói `HN-WMS-OVERVIEW-FILTER-STATES-v2`, khớp SHA-256 trong ASSET-MANIFEST.csv. 44 ảnh AUTH/Tổng quan không đổi bytes.

Quality gate kiểm tra 72 nguồn ảnh, 98 liên kết, kích thước, hash, root/docs parity, 12 viewport/DPR, fit/native/scroll/resize/rotate, tải ảnh, fullscreen và lỗi tài nguyên. Không cập nhật hash/kích thước để bỏ qua lỗi nếu chưa đối chiếu artwork được duyệt.

Workflow `.github/workflows/gallery-quality.yml` kiểm tra Chromium, Firefox và WebKit trong ba job độc lập. Job `viewer-regression` chỉ đạt khi cả ba job đạt. `package-pages` và `deploy` phụ thuộc quality gate, chỉ chạy trên `main`, không xuất bản từ PR hoặc nhánh tính năng. `deployment.json` ghi revision/run đã qua kiểm tra để đối chiếu website sau phát hành.

Khi phát hành lần đầu theo yêu cầu được duyệt ngày 13/09/2026: đặt Pages dùng GitHub Actions và đặt `viewer-regression` làm required check của nhánh `main`, áp dụng cả quản trị viên, không force-push hoặc xóa nhánh. Các lần sửa tiếp theo đi qua nhánh riêng và kiểm tra đạt trước khi merge. Không tắt required check hoặc đổi hash chỉ để bỏ qua lỗi.
