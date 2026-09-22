# SystemHNWeb · Hoa Nam WMS UI/UX Preview

Gallery Web System riêng cho Dev xem và tải ảnh thiết kế. AUTH-01 hiện có 9 state được duyệt cho mỗi viewport; AUTH-02 và các màn hỗ trợ tiếp tục được giữ trong cùng nhóm. Bộ filter/date picker MAP-01 v2 có gallery QA riêng với 13 state cho mỗi viewport.

Bộ xuất từ Drive có gallery riêng tại [`drive-gallery.html`](drive-gallery.html), hiện gồm **414 màn hình thuộc 21 nhóm nghiệp vụ**. Sau đợt sửa nghiệp vụ, 56 liên kết Drive và 52 liên kết gallery chính dùng bản sửa HTML/SVG có nhãn **cần chủ thiết kế duyệt**; 3 ảnh AI bổ sung vẫn còn trong gallery. Ảnh trước sửa được lưu nguyên vẹn trong `design-archive/business-v1`.

Cập nhật 23/09/2026: [Báo cáo nhập liệu, đối chiếu & lỗi dữ liệu — 40 ảnh P01–P20](drive-gallery.html?group=bao_cao_nhap_liet_doi_chieu_loi). Dùng bản xuất trên máy đã đối soát hash/nội dung vì Drive đang từ chối truy cập; chưa xác minh trực tiếp danh sách cloud. [Biên bản nhập và ngoại lệ](handoff-DATA-RECON-UPDATE-20260923.md).

**Đợt sửa ưu tiên:** [preview bản sửa](business-repair.html) · [biên bản và giới hạn](handoff-BUSINESS-REPAIR-v1.md) · [sổ baseline](baseline-register.json). Expired, Readonly, sai module và biểu đồ được kiểm tra bằng dữ liệu/semantic DOM; các baseline xung đột checksum chưa tự nhận đã duyệt. `npm run render:business` dựng lại 88 ảnh nguồn trực tiếp ở đúng viewport; cần `npm run sync` sau khi áp dụng.

[Báo cáo sửa trạng thái](handoff-DRIVE-STATE-REPAIR-20260922.md): hồ sơ lịch sử đợt 22/09. Hiện đủ cặp thiết bị trong 12 nhóm đã triển khai; miễn kiểm tra độ phủ cho 9 nhóm có không quá 3 ảnh. Ảnh AI lưu đúng kích thước native, không coi là master đã duyệt. Import có chế độ `--reviewed-only` để không cuốn theo ảnh mới của công việc khác trong thư mục nguồn.

**GitHub Pages:** https://duc-nguyen98.github.io/SystemHNWeb/

| Nhóm | Desktop | Tablet dọc | Tổng |
|---|---:|---:|---:|
| Đăng nhập & Xác nhận phiên | 19 ảnh · AUTH-01 1920 × 1080 | 19 ảnh · AUTH-01 1600 × 2560 | 38 |
| Tổng quan — 10 trạng thái | 10 ảnh · 1920 × 1080 | 10 ảnh · 1600 × 2560 | 20 |
| MAP-01 — Filter/date picker QA v2 | 13 state · 1920 × 1080 | 13 state · 1600 × 2560 | 26 |
| **Toàn bộ gallery** | **42 ảnh/state** | **42 ảnh/state** | **84** |

## AUTH-01 · 9 trạng thái

- Mặc định
- Validation error
- Authentication failed
- Submitting
- Offline before submit
- Outcome unknown
- Rate limited
- Account unavailable
- Auth service unavailable

## AUTH bổ sung

- AUTH-03 · OTP / Verify
- AUTH-04 · Quên mật khẩu
- AUTH-05 · Đặt lại mật khẩu
- AUTH-ERR-403 · Không có quyền truy cập
- AUTH-ERR-404 · Không tìm thấy trang
- AUTH-ERR-500 · Lỗi hệ thống
- AUTH-OPS · Maintenance

AUTH-01 dùng Desktop Full HD 1920 × 1080 px và Tablet dọc 800 × 1280 CSS px, xuất @2x 1600 × 2560 px. Các màn hỗ trợ AUTH legacy vẫn giữ nguyên asset 1440 × 2048 và nội dung hiện hành.

## Truy cập trực tiếp

- [Gallery màn hình từ Drive](drive-gallery.html)
- [Manifest màn hình từ Drive](drive-screen-manifest.json)
- [AUTH screen export manifest](handoff-AUTH-SCREEN-EXPORT-MANIFEST-v2.md)
- [MAP-01 filter/date picker QA v2](previews/overview-filter-v2/index.html)
- [Handoff Design + QA filter v2](handoff-OVERVIEW-FILTER-QA-v2.md)

- [AUTH Desktop](https://duc-nguyen98.github.io/SystemHNWeb/#auth-desktop)
- [AUTH Tablet](https://duc-nguyen98.github.io/SystemHNWeb/#auth-tablet)
- [Tổng quan Desktop](https://duc-nguyen98.github.io/SystemHNWeb/#overview-desktop)
- [Tổng quan Tablet](https://duc-nguyen98.github.io/SystemHNWeb/#overview-tablet)

Mỗi màn có liên kết xem kích thước đầy đủ và tải riêng. Gallery filter v2 là bộ kiểm tra component riêng, không thay thế gallery Dashboard 58 màn. AUTH-01 và bộ Tổng quan dùng JPG chất lượng cao làm nguồn xem/tải pixel 1:1; thumbnail WebP trong `*-thumbs/` có kích thước tối thiểu 2× chiều rộng hiển thị và được khai báo bằng `srcset`/`sizes`.

Gallery giới hạn vùng xem nhanh tối đa 700 px, nên thumbnail 1440 px đủ cho màn hình 2×. Thuộc tính `width`/`height` của mỗi ảnh khớp với file thumbnail thực tế, không khai báo kích thước canvas 1920/1600 cho file thumbnail nhỏ hơn.

GitHub Pages xuất bản trực tiếp thư mục `/docs` của nhánh `main`; workflow quality gate là lớp kiểm tra độc lập. Các file gallery ở thư mục gốc và `/docs` được đồng bộ. Không dùng thư mục hoặc bản preview của Scanner App cho Web System này.

Revision đang phục vụ được ghi tại `deployment.json` sau mỗi lần phát hành đạt kiểm tra.


Orientation QA: [Viewport & Orientation handoff](handoff-VIEWPORT-ORIENTATION-QA-v1.md). Gallery đã tách Desktop ngang, Tablet dọc và Tablet ngang; artwork Tablet ngang đang được đánh dấu thiếu riêng để không dùng nhầm ảnh dọc.

## Sửa trình xem DEV · 13/09/2026

Trình xem chung `viewer.html?screen=<id>` là nguồn duy nhất cho 84 màn ở gallery chính và 26 liên kết ở gallery bộ lọc. Không tạo lại trình xem bằng `document.write`, không dùng thumbnail hoặc ảnh nhúng 480 px cho xem chi tiết.

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

`screen-manifest.json` lưu ID, loại thiết bị, kích thước ảnh thật, kích thước CSS nếu đã xác định, hash và nguồn gốc. 26 PNG filter được khôi phục nguyên vẹn từ gói `HN-WMS-OVERVIEW-FILTER-STATES-v2`, khớp SHA-256 trong ASSET-MANIFEST.csv. Bộ chính hiện có 38 ảnh AUTH và 20 ảnh Tổng quan. Chín state AUTH-01 mới trên mỗi viewport dùng artwork người dùng cung cấp; các bản Tablet được chuẩn hóa từ 1280 × 2048 lên canvas khóa 1600 × 2560.

Quality gate kiểm tra 84 nguồn ảnh, 110 liên kết, kích thước, hash, root/docs parity, 12 viewport/DPR, fit/native/scroll/resize/rotate, tải ảnh, fullscreen và lỗi tài nguyên. Không cập nhật hash/kích thước để bỏ qua lỗi nếu chưa đối chiếu artwork được duyệt.

Workflow `.github/workflows/gallery-quality.yml` kiểm tra Chromium, Firefox và WebKit trong ba job độc lập. Job `viewer-regression` chỉ đạt khi cả ba job đạt. `package-pages` và `deploy` phụ thuộc quality gate, chỉ chạy trên `main`, không xuất bản từ PR hoặc nhánh tính năng. `deployment.json` ghi revision/run đã qua kiểm tra để đối chiếu website sau phát hành.

Khi phát hành lần đầu theo yêu cầu được duyệt ngày 13/09/2026: đặt Pages dùng GitHub Actions và đặt `viewer-regression` làm required check của nhánh `main`, áp dụng cả quản trị viên, không force-push hoặc xóa nhánh. Các lần sửa tiếp theo đi qua nhánh riêng và kiểm tra đạt trước khi merge. Không tắt required check hoặc đổi hash chỉ để bỏ qua lỗi.
