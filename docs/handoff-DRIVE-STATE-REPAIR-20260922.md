# Rà soát và bổ sung trạng thái · 22/09/2026

> Hồ sơ lịch sử của commit da7ea46. Sau audit UI/UX, đợt sửa nghiệp vụ mới đã thay một phần ảnh và điều chỉnh review status. Xem [biên bản hiện hành](handoff-BUSINESS-REPAIR-v1.md) và [sổ baseline](baseline-register.json). Kết quả đủ file trong hồ sơ này không phải duyệt thiết kế.

## Kết quả

Gallery có 376 ảnh: 369 ảnh nguồn hiện có giữ nguyên byte và 7 ảnh AI bổ sung.
11 nhóm đã triển khai có 356 ảnh, đủ cặp Desktop/Tablet theo danh mục trạng thái hiện hành.
10 nhóm chỉ có 2 ảnh (tổng 20 ảnh) được giữ nguyên, miễn kiểm tra độ phủ theo yêu cầu chủ thiết kế.
Các ảnh mới xuất hiện trong thư mục Drive sau lần rà soát không được tự nhập vào lần sửa này.

## Các vấn đề đã xử lý

| Vấn đề | Cách xử lý |
|---|---|
| History P20 Maintenance thiếu Desktop | Bổ sung ảnh Desktop, nhãn AI cần duyệt |
| TKDS P12 Session Expired thiếu Tablet | Bổ sung ảnh Tablet, nhãn AI cần duyệt |
| Báo cáo xuất kho Row Highlight thiếu Tablet | Bổ sung ảnh Tablet, mã P08 |
| Success Update thiếu Desktop và Golden Export thiếu Tablet | Hai ảnh cũ cùng có toast “Đã cập nhật báo cáo / Dữ liệu đã được làm mới.” Ghép thành P09 SUCCESS UPDATE; không tạo thêm trạng thái Export Warning giả |
| PKG LABEL P17 Forbidden sai nhóm | Chuyển 2 ảnh từ Lịch sử nhập/xuất kho sang Nhãn đóng gói & in lại |
| DEALER RECIPIENT P14 Not Found sai nhóm | Chuyển 2 ảnh từ Danh sách SKU sang Xuất theo người nhận/đại lý |
| History P16 khuyết | Tài liệu gốc xác định 401 Session Expired. Bổ sung Desktop và Tablet |
| TRACE P10 khuyết | Tài liệu gốc xác định Data-quality Warning. Bổ sung Desktop và Tablet, 7 hàng hóa = 5 thiếu sự kiện + 2 lệch trạng thái |
| 17 ảnh Báo cáo xuất kho thiếu mã | Chuẩn hóa tên hiển thị, tên file tải về, đường dẫn ảnh và thumbnail theo bảng dưới |

## Mã Báo cáo xuất kho

Mã được thiết lập ổn định cho 9 trạng thái hiện có; không áp dụng số Pxx này sang module khác.

| Mã | Trạng thái | Desktop | Tablet |
|---|---|---|---|
| P01 | DEFAULT | Có | Có |
| P02 | LOADING | Có | Có |
| P03 | EMPTY | Có | Có |
| P04 | ERROR | Có | Có |
| P05 | INVALID DATE RANGE | Có | Có |
| P06 | NO SEARCH RESULT | Có | Có |
| P07 | READONLY | Có | Có |
| P08 | ROW HIGHLIGHT | Có | AI bổ sung |
| P09 | SUCCESS UPDATE | Có (tên cũ Golden Export) | Có |

## Ma trận độ phủ sau sửa

| Nhóm | Số trạng thái | Desktop | Tablet |
|---|---:|---:|---:|
| Báo cáo bảo hành linh kiện | 15 | 15 | 15 |
| Báo cáo lịch sử nhập xuất kho | 20 | 20 | 20 |
| Báo cáo nhãn đóng gói & in lại | 20 (gồm P08A) | 20 | 20 |
| Báo cáo nhập kho | 9 | 9 | 9 |
| Báo cáo truy vết hàng hóa | 20 | 20 | 20 |
| Báo cáo xuất kho | 9 | 9 | 9 |
| Báo cáo xuất theo người nhận/đại lý | 20 | 20 | 20 |
| Danh mục sản phẩm | 20 | 20 | 20 |
| Danh sách SKU | 20 | 20 | 20 |
| Xác nhận phiên | 11 | 11 | 11 |
| Tồn kho & đối soát | 14 | 14 | 14 |
| Tổng phạm vi kiểm tra | 178 | 178 | 178 |

## Nguồn ảnh và giới hạn duyệt

7 ảnh mới dùng **built-in imagegen**, dựa trên ảnh đối ứng và tài liệu trạng thái hiện có. Chúng là thiết kế bổ sung, **chưa được chủ thiết kế phê duyệt**, không phải ảnh gốc lấy từ Drive. Gallery và viewer hiển thị rõ nhãn này.

Đầu ra native: Desktop 1672×941, Tablet 992×1586. Tên file bàn giao ghi đúng kích thước thực. Không upscale để giả canvas chuẩn 1920×1080 / 1600×2560 (riêng Báo cáo xuất kho Tablet tham chiếu 1280×2048). Nếu cần master đúng canvas khóa, phải xuất lại từ công cụ thiết kế sau duyệt; ảnh này không được coi là master đã đạt chuẩn.

P10 giữ tỷ lệ 94,5% = 121/128 theo artwork P01 đang sử dụng; con số 96,8% trong văn bản baseline không khớp phép tính. Không sửa ảnh gốc hoặc tự áp dụng workflow/API chưa xác minh. P16 chỉ có nội dung hết phiên và CTA đăng nhập lại, không có báo cáo phía sau.

Ảnh bổ sung và toàn bộ prompt: [design-supplements](https://github.com/Duc-Nguyen98/SystemHNWeb/tree/main/design-supplements), [bộ prompt](https://github.com/Duc-Nguyen98/SystemHNWeb/blob/main/design-supplements/PROMPTS.md).

## Chống tái phát

- Quy tắc tên/nhóm nằm trong importer, không phải sửa tay một lần trên manifest.
- `sourcePaths` giữ nguyên đường dẫn gốc để truy xuất nguồn.
- ID viewer cũ được lưu làm alias khi đổi tên/chuyển nhóm.
- Kiểm tra tự động: nhãn trạng thái, mã thiếu, đủ cặp thiết bị, nhóm sai, số lượng, review provenance, hash, kích thước thật và root/docs parity.
- Nhập có staging và bản sao cũ trong `artifacts`, nên nguồn lỗi không phá bộ đang dùng.
- Lần sửa phạm vi hiện tại dùng `node tools/import-drive-screens.mjs --reviewed-only`: chỉ nhập lại các nguồn đã có trong manifest và supplement được khai báo, đồng thời kiểm tra hash nguồn không đổi.

Độ phủ ảnh không thay thế phê duyệt thiết kế, kiểm thử nghiệp vụ, accessibility hoặc API.

## Kiểm tra đã chạy

- 12 unit tests đạt, bao gồm thử chủ động bỏ ảnh, bỏ cả cặp trạng thái và chuyển sai nhóm để xác nhận bộ kiểm tra chặn được lỗi.
- 84 ảnh gallery chính + 376 ảnh gallery Drive: hash, kích thước, thumbnail và root/docs khớp.
- Tất cả bộ lọc nhóm/thiết bị, 21 ID viewer cũ, 7 ảnh bổ sung và tên/hash khi tải về đạt.
- 1.240 lượt kiểm tra browser, 0 lỗi; điều khiển viewer đạt trên Chromium, Firefox, WebKit.
- Nhập lại `--reviewed-only` không làm thay đổi manifest; 369 hash nguồn và 10 nhóm được miễn vẫn giữ nguyên.
