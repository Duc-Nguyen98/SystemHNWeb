# Sản phẩm trên App PV — cập nhật bộ ảnh 23/09/2026

## Kết quả

- Nhóm `san_pham_app_pv`: **48 ảnh / 24 trạng thái**, gồm 24 Desktop 1920×1080 và 24 Tablet 1600×2560.
- Gồm P01–P19 và P20A–P20E; mỗi trạng thái hiện có đúng một ảnh mỗi thiết bị.
- **Thiếu nguồn P20F Save Timeout/Unknown, cả Desktop và Tablet.** Tài liệu yêu cầu 25 state độc lập /50 ảnh (P00 có thể dùng lại P01). Không tạo placeholder hoặc ảnh AI để giả đủ 50 ảnh. Cảnh báo thiếu nguồn được hiển thị tại nhóm App PV.
- Gallery Drive từ 414 lên **460 ảnh /21 nhóm**; gallery chính vẫn 84 ảnh. Tất cả 412 hồ sơ ảnh ngoài App PV giữ nguyên.
- Nhập nguyên byte ảnh được chọn, không chỉnh UI/UX, không nâng kích thước và không thay đổi dữ liệu trong thiết kế.

## Nguồn

Người dùng cung cấp [folder Drive App PV](https://drive.google.com/drive/folders/1X6PxgiSmrZnwBi2vxcE4wnNpMmbE29MN). Phiên trình duyệt hiện tại báo cần quyền truy cập; không gửi yêu cầu cấp quyền hay sửa chia sẻ. Chưa đối chiếu được danh sách Drive trực tiếp.

Bộ nhập dùng bản xuất trong workspace `san_pham_app_pv/update`, cùng 4 ảnh P18/P19 App PV đang nằm ở `bao_cao_nhap_liet_doi_chieu_loi/update`. Đường dẫn thật và SHA-256 được ghi trong `tools/import-profiles/app-pv-20260923.json`. Không tuyên bố đã đồng bộ bản cloud mới nhất.

## Lựa chọn và loại trừ

| Trường hợp | Xử lý |
|---|---|
| P01 Default v1.0 và Candidate v2.1 khác artwork | Chọn cặp Default v1.0 để cùng bộ tên/version với P02–P20. Candidate v2.1 vẫn giữ trong nguồn, không được gọi là bản trùng byte hay bị xóa. Việc chọn để nhập không có nghĩa đã phê duyệt baseline |
| P18 Edit Form Populated, P19 Preview Readonly nằm trong folder nhập liệu | Nhập vào App PV, giữ đường dẫn nguồn thật |
| P16 cũng có một cặp ở folder nhập liệu | Hash giống hệt cặp App PV update; chỉ nhập một lần |
| Hai file DanhMucSanPham P20 Maintenance lẫn trong update | Nội dung là bảo trì, không phải App PV P20F Save Timeout. Không nhập/chuyển nhóm khác vì ngoài phạm vi |
| P20F không có file trong nguồn đã tìm | Giữ cảnh báo thiếu; không gán ảnh Maintenance hay Save Failed thành Timeout |

Không sửa/xóa file trên máy hoặc Drive. Hai baseline cũ đã công bố được lưu trong `design-archive/app-pv-20260923`; link viewer cũ mở P01 mới cùng thiết bị bằng alias.

## Danh mục trạng thái

| Mã | Tên trạng thái |
|---|---|
| P01 | DEFAULT |
| P02 | INITIAL LOADING |
| P03 | REFRESHING |
| P04 | EMPTY SYSTEM |
| P05 | NO RESULT |
| P06 | LOAD ERROR |
| P07 | OFFLINE |
| P08 | STALE DATA |
| P09 | READONLY |
| P10 | WAREHOUSE PAUSED |
| P11 | SESSION EXPIRED 401 |
| P12 | FORBIDDEN 403 |
| P13 | NOT FOUND 404 |
| P14 | SERVER ERROR 500 |
| P15 | MAINTENANCE |
| P16 | ROW SELECTED FOCUS |
| P17 | CREATE FORM DEFAULT |
| P18 | EDIT FORM POPULATED |
| P19 | PREVIEW READONLY |
| P20A | SAVE PROCESSING |
| P20B | VALIDATION ERROR |
| P20C | SAVE SUCCESS |
| P20D | SAVE FAILED |
| P20E | SAVE CONFLICT |
| P20F | SAVE TIMEOUT UNKNOWN — thiếu ảnh nguồn D/T |

Ví dụ tên tải về: `HN_APP_PV_CATALOG_P20B_VALIDATION_ERROR_TABLET_1600x2560_REVIEW.png`.

## Kiểm tra và ranh giới

- Giải mã toàn bộ file nguồn để loại lỗi ảnh; kiểm tra native canvas, hash, nhóm, tên state và trùng lặp.
- Danh sách trạng thái dự kiến vẫn bao gồm P20F. Chỉ một thiếu hụt này được khai báo cụ thể và phải hiển thị; thiếu thêm state hoặc thiếu một thiết bị vẫn làm kiểm tra thất bại.
- Không thay expected inventory thành “đã đầy đủ” để che nguồn thiếu. Nhãn review/approval-not-recorded không phải Approved.
- Những nút disabled, dữ liệu minh họa và form trên ảnh là nội dung nguồn, chưa được audit/chỉnh nghiệp vụ trong lần nhập này.
- Các kiểm tra file/viewer không thay kiểm thử API, RBAC, đồng bộ App Preview hoặc phê duyệt UI/UX.

Kiểm tra thực hiện: 16 unit tests; 88 kiểm tra các bản sửa nghiệp vụ có nguồn; mở/tải/hash đủ 48 ảnh App PV ở cả root và /docs; deep-link, bộ lọc 24 Desktop/24 Tablet, cảnh báo P20F và alias P01; 1.240 viewer checks không lỗi; điều khiển viewer đạt trên Chromium/Firefox/WebKit. 412 hồ sơ ngoài App PV và 84 ảnh gallery chính không đổi. Kiểm tra thiếu state vẫn ghi nhận P20F, không tuyên bố đủ bộ thiết kế.
