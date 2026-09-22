# Báo cáo nhập liệu, đối chiếu & lỗi dữ liệu — update 23/09/2026

## Kết quả nhập

- Nhóm `bao_cao_nhap_liet_doi_chieu_loi`: thay 2 ảnh baseline cũ bằng **40 ảnh P01–P20** (20 Desktop 1920×1080, 20 Tablet 1600×2560).
- Gallery Drive: **414 ảnh / 21 nhóm**, gallery chính vẫn 84 ảnh. Các nhóm khác và 56 liên kết sửa nghiệp vụ Drive giữ nguyên.
- Giữ nguyên byte ảnh nguồn, không dựng lại thiết kế, không dùng AI và không phóng ảnh. Thumbnail chỉ phục vụ xem nhanh.
- Tên hiển thị/tên tải về theo module + mã state + trạng thái + thiết bị + kích thước thật. File nguồn vẫn lưu trong `sourcePaths`.
- Hai liên kết viewer baseline cũ được giữ bằng alias, mở P01 mới tương ứng thiết bị. Hai ảnh cũ được lưu trong `design-archive/data-recon-20260923`.

## Nguồn và giới hạn xác minh

Người dùng chỉ định [thư mục Drive](https://drive.google.com/drive/folders/1XC02PvoNQeT__KIBMiwW3YxN20KFs83N). Khi kiểm tra, Drive báo cần quyền truy cập trong phiên trình duyệt hiện tại. Không gửi yêu cầu quyền, không đổi chia sẻ và không xác nhận được danh sách file trên cloud.

Bộ nhập sử dụng **bản xuất có sẵn trong workspace** `bao_cao_nhap_liet_doi_chieu_loi/update`, cộng hai ảnh P18 bị lưu nhầm ở `bao_cao_nhan_dong_goi_in_lai/update`. Nội dung hai ảnh P18 đã được mở và xác minh đúng module. Bộ này đủ mã P01–P20 theo tài liệu nguồn, nhưng **không được mô tả là đã đồng bộ/đối chiếu trực tiếp toàn bộ Drive mới nhất**.

Profile `tools/import-profiles/data-recon-20260923.json` ghi đường dẫn và SHA-256 của từng ảnh, nguồn Drive được yêu cầu và giới hạn quyền truy cập. Thay đổi hash/file sau này phải kiểm tra lại trước khi cập nhật profile.

## Các ngoại lệ đã xử lý

| Ngoại lệ | Xử lý |
|---|---|
| P01 Desktop có bản corrected/default giống byte | Chỉ nhập corrected một lần; không nhân đôi state |
| P01 default Tablet bị lỗi libpng khi giải mã | Không nhập file hỏng; dùng P01 corrected Tablet đọc đủ pixel thành công |
| Desktop P10 mang tên `ChatGPT Image 04_57_31 19 thg 9, 2026.png` | Xác minh artwork có cảnh báo 38 bản ghi, 25 chênh lệch và 13 lỗi dữ liệu; đặt tên P10 RECONCILIATION WARNING |
| P18 Desktop/Tablet nằm trong nhóm Nhãn đóng gói | Đưa vào đúng nhóm DATA RECON, giữ đường dẫn nguồn thật |
| 6 ảnh App PV trong folder update | Không nhập, không sửa/xóa hoặc chuyển sang nhóm khác vì ngoài phạm vi yêu cầu |

Không xóa hoặc chỉnh bất kỳ file nguồn nào trên máy/Drive.

## Danh mục state

| Mã | Trạng thái | Desktop | Tablet |
|---|---|---|---|
| P01 | DEFAULT | Có | Có |
| P02 | INITIAL LOADING | Có | Có |
| P03 | REFRESHING IN PLACE | Có | Có |
| P04 | EMPTY PERIOD | Có | Có |
| P05 | INVALID FILTER | Có | Có |
| P06 | NO SEARCH RESULT | Có | Có |
| P07 | LOAD ERROR | Có | Có |
| P08 | OFFLINE BEFORE REQUEST | Có | Có |
| P09 | PARTIAL STALE DATA | Có | Có |
| P10 | RECONCILIATION WARNING | Có | Có |
| P11 | READONLY NO EXPORT | Có | Có |
| P12 | SESSION EXPIRED 401 | Có | Có |
| P13 | FORBIDDEN 403 | Có | Có |
| P14 | NOT FOUND 404 | Có | Có |
| P15 | MAINTENANCE | Có | Có |
| P16 | SERVER ERROR 500 | Có | Có |
| P17 | EXPORTING | Có | Có |
| P18 | EXPORT SUCCESS | Có | Có |
| P19 | EXPORT FAILED | Có | Có |
| P20 | EXPORT TIMEOUT UNKNOWN | Có | Có |

## Chống nhập sai lại

- Profile được ưu tiên hơn tên UUID/timestamp và vị trí folder, luôn kiểm tra hash/kích thước.
- Import `--reviewed-only` nhập profile này và chỉ các nguồn đã ghi nhận của nhóm khác, tránh kéo theo những thiết kế đang làm dở.
- Kiểm tra bắt buộc đủ P01–P20, mỗi mã đúng một Desktop và một Tablet; thiếu cả cặp P18 cũng phải fail.
- Ảnh nguồn chưa có chứng từ phê duyệt thiết kế được ghi review/approval-not-recorded, không tự đặt Approved.

Kết quả kiểm tra file, số lượng và viewer không phải nghiệm thu UI/UX, accessibility hoặc API nghiệp vụ. Đây là đợt nhập tài sản theo yêu cầu, không phải đợt redesign các ảnh mới.

## Kiểm tra trước khi xuất bản

- 40 ảnh giải mã đầy đủ, đúng kích thước native và khớp SHA-256 profile; root/docs đồng nhất.
- Đủ P01–P20, không trùng state/device; alias P01 cũ mở đúng ảnh mới.
- Mở và tải đủ 40 ảnh ở cả gallery gốc và /docs, tên tải về và hash đúng.
- 374 hồ sơ ảnh ngoài nhóm này không đổi; 84 ảnh gallery chính và 56 bản sửa nghiệp vụ Drive vẫn giữ nguyên.
- Nhập lặp `--reviewed-only` cho manifest giống hệt.
- 1.240 viewer checks không lỗi; điều khiển xem/tải đạt trên Chromium, Firefox, WebKit. Những kiểm tra này không chứng minh Drive cloud đã được đồng bộ.
