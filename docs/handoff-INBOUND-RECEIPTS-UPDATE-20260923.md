# Nhập kho / Danh sách phiếu nhập — 23/09/2026

## Nguồn và kết quả

[Thư mục Drive được yêu cầu](https://drive.google.com/drive/folders/1Ii8cm1XID8eFTiD1lF6VGmpTVkxbyNqY) chưa cho phép truy cập trong phiên hiện tại. Không có thư mục `update` trong bản xuất trên máy; dùng hai thư mục `nhap_kho/danh_sach_phieu_nhap_kho/Desktop` và `Tablet` theo yêu cầu người dùng.

Bộ nguồn có 60 tên file, tương ứng 30 mã trạng thái × 2 thiết bị. **55 file giải mã đầy đủ và khớp chính xác SHA-256/dung lượng trong manifest CSV đi kèm** được xuất bản: **27 Desktop (1920×1080), 28 Tablet (1600×2560)**. Năm file còn lại bị cắt dữ liệu, không khớp dung lượng/hash nguồn và báo lỗi giải mã PNG.

| Ảnh cần cung cấp lại | Dung lượng thực | Dung lượng theo manifest |
|---|---:|---:|
| P09 ReadOnly — Tablet | 2.293.760 | 3.303.510 |
| P10 WarehousePaused — Desktop | 1.441.792 | 2.002.909 |
| P15 Maintenance — Tablet | 2.654.208 | 2.897.174 |
| P20B SaveSuccessStaleList — Desktop | 1.310.720 | 2.155.851 |
| P20D SaveOutcomeUnknown — Desktop | 1.671.168 | 2.016.972 |

Không sửa hoặc xóa file nguồn hỏng, không thay thế bằng ảnh thiết bị/state khác hay ảnh AI. Gallery hiển thị cảnh báo đúng mã và thiết bị; 25 trạng thái có đủ cặp, 5 trạng thái chỉ có một ảnh hợp lệ.

## Mã trạng thái và phiên bản

- P01–P19; P05A/B, P16A/B, P18A/B, P19B và P20A/B/C/D. Tài liệu không khai báo ảnh P00, P19A hoặc P20 không hậu tố.
- P01 có nhãn LOCKED trong tài liệu nguồn; hai hash P01 khớp đúng giá trị được ghi. Đây là ghi nhận nguồn, không suy ra toàn bộ bộ thiết kế hoặc contract đã được duyệt. Các state còn lại là REVIEW.
- Manifest nguồn cho biết các state bổ sung đã được đổi kích thước từ raster trước khi bàn giao. Repo giữ nguyên byte đã nhận, không upscale thêm và không tự gọi đây là ảnh render native/DPR2.
- `sourceDesignStatus` và `sourceExport` lưu nhãn nguồn, pixel native được khai báo và phương pháp xuất. Trạng thái duyệt trong gallery vẫn là chưa xác minh riêng.

## Bảo toàn và kiểm tra

- Cấu hình ghim: `tools/import-profiles/inbound-receipts-20260923.json`, gồm 55 file hợp lệ, 5 file loại trừ với hash/dung lượng thực và dự kiến, 3 tài liệu nguồn, 2 bản P01 cũ.
- Hai ảnh mặc định cũ được lưu nguyên byte trong `design-archive/inbound-receipts-20260923`; các liên kết viewer cũ chuyển tới P01 mới qua alias. URL ảnh cũ vẫn tồn tại.
- Giữ nguyên 513 hồ sơ ảnh thuộc các nhóm khác, gồm bản sửa nghiệp vụ và cảnh báo thiếu App PV P20F, Bệnh Lỗi P11F Tablet.
- Tổng inventory sau nhập: **568 ảnh / 22 nhóm**. Trong 15 nhóm đã có bộ state, 3 nhóm còn thiếu nguồn như khai báo; 7 nhóm ≤3 ảnh tiếp tục được miễn kiểm tra đầy đủ.
- Kiểm tra tên nhóm, mã/hậu tố, bộ lọc 27/28, cảnh báo thiếu, alias, mở ảnh, tải nguyên bản, hash/kích thước và đồng bộ root–`docs`.

## Phần chưa thể hoàn tất

Cần cung cấp lại 5 PNG nêu trên hoặc mở quyền Drive để lấy bản đầy đủ. Kiểm tra file/gallery không chứng nhận nghiệp vụ WMS, API, bảo mật, quyền, accessibility hoặc approval của bộ thiết kế.
