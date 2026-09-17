# RPT-IN-01 · Báo cáo Nhập kho · Master Report Layout v2

**Trạng thái:** `READY_FOR_DEV_VISUAL_BUILD` — `CONDITIONAL_FOR_FUNCTIONAL_UAT`

Màn `Báo cáo Nhập kho` dùng màn `Tổng Quan` Hoa Nam làm baseline khóa. Không sửa hoặc thay thế sidebar, header, logo, ảnh kho, ảnh nhân viên, hệ icon, màu thương hiệu, typography, spacing và shell hiện có.

## Artwork khóa

- Desktop ngang: `previews/inbound-report-v2/desktop/RPT-IN-01-bao-cao-nhap-kho-desktop-1920x1080.png`.
- Tablet dọc: `previews/inbound-report-v2/tablet/RPT-IN-01-bao-cao-nhap-kho-tablet-1600x2560.png`.
- Tablet tương ứng `800 × 1280 CSS px` khi export `@2x`; không dùng 1600 px làm chiều rộng CSS.
- Màu chính: `HN_OCEAN = #004E74`.

## Năm điểm đã khóa trong v2

1. Bộ lọc thời gian ở trạng thái mặc định dùng border trung tính 1 px; hover/focus/invalid tái sử dụng state của MAP-01.
2. Trường `Kho` hiển thị `Kho Hoa Nam` dạng read-only với người không phải Super Admin; không hiển thị chevron giả tương tác.
3. Bảy cột `Sản lượng nhập theo ngày` dùng cùng `HN_OCEAN #004E74`; cyan chỉ được dùng khi có state hover/selected kèm tooltip.
4. Ghi chú `Sản lượng chỉ tính phiếu hoàn tất` nằm ngay dưới bộ lọc, trước KPI; không đặt lơ lửng trên mép card.
5. Canvas bàn giao là Desktop `1920 × 1080` và Tablet `1600 × 2560`.

## Contract bắt buộc cho DEV

- Hoa Nam có đúng một kho hoạt động trong cấu hình hiện tại.
- Với người không phải Super Admin, trường Kho phải read-only ở UI và không phát sinh thao tác chuyển kho.
- Nếu bổ sung nhiều kho trong tương lai, chỉ Super Admin được chuyển kho và phải xác nhận trước khi áp dụng.
- Kho tạm dừng vẫn cho phép xem, tìm kiếm, báo cáo, lịch sử và audit; chặn các thao tác ghi hoặc làm thay đổi tồn kho tại UI và service/API/domain.
- Bộ lọc thời gian phải có đủ `default`, `hover`, `focus`, `open`, `invalid`, `loading`, `empty`, `error` và `permission denied` theo MAP-01.
- Export Excel phải giữ nguyên toàn bộ filter đang áp dụng.
- Chỉ phiếu `Hoàn tất` được cộng vào sản lượng nhập; trạng thái khác không làm thay đổi số KPI và biểu đồ.

## Gate nghiệm thu

- Ảnh đúng kích thước và SHA-256 trong `screen-manifest.json`.
- Viewer mở đúng ảnh gốc, tải đúng bytes, không dùng thumbnail cho chế độ chi tiết.
- Root và `/docs` đồng bộ.
- Không có thay đổi bytes ở bất kỳ ảnh Tổng Quan/MAP-01 hiện hữu nào.
- Artwork đạt visual handoff; RBAC, API, dữ liệu lọc và Excel chỉ PASS khi được kiểm thử trong repository ứng dụng.
