# Danh mục Bệnh Lỗi — nhập bộ update ngày 23/09/2026

## Nguồn và phạm vi

- Nhóm gallery: `danh_muc_benh_loi` — **Danh mục Bệnh Lỗi**.
- Nguồn yêu cầu: [Google Drive](https://drive.google.com/drive/folders/1XSHFE3v9aF56qHGbEb8UGJFQhAsxz2SU), thư mục `update`.
- Drive báo thiếu quyền truy cập trong phiên hiện tại; chưa đối chiếu được danh sách cloud. Dùng bản xuất sẵn trên máy tại `danh_muc_benh_loi/update`.
- 56 tên file khớp tài liệu `HN_DANH_MUC_BENH_LOI_BASELINE_STATE_PROMPTS_v1.0.md`. P00 là đặc tả, không phải ảnh bị thiếu.
- P01 dùng REVIEW v5.0; các state khác REVIEW v1.0. Chưa có xác nhận khóa baseline, fixture hay hợp đồng backend.

## Kết quả nhập và ngoại lệ

**55 ảnh hợp lệ: 28 Desktop 1920×1080, 27 Tablet 1600×2560.**

28 mã trạng thái: P01–P20, thêm P11A–P11F và P13A–P13B. 27 mã có đủ cặp thiết bị; P11F chỉ có Desktop hợp lệ.

Không nhập file `HN_DanhMuc_BenhLoi_P11F_OpenFormFailed_Tablet_1600x2560_REVIEW_v1.0.png`:

- Kích thước file 713.810 byte; dữ liệu PNG bị cắt tại IDAT, thiếu IEND; đọc đầy đủ pixel báo `vipspng: libpng read error`.
- SHA-256: `3e575392181077e9b6db85c2ef9ea686a4e455f82f1348a8f704f9815f815d2a`.
- Giữ nguyên file nguồn, không sửa, không dùng ảnh khác hoặc AI thay thế. Gallery cảnh báo rõ thiếu **P11F Tablet** và cần cung cấp lại file nguyên vẹn.
- Hai file P01 ngoài `update` trùng byte với P01 bên trong, không nhập lặp.

## Kiểm tra và bảo toàn

- 55 file đã giải mã đầy đủ, kiểm tra kích thước, hash và không trùng nhau; ảnh xem/tải giữ nguyên byte. Thumbnail tạo riêng.
- Tên bàn giao có mã trạng thái và thiết bị; đường dẫn/tên nguồn được lưu trong manifest. Cấu hình nhập ghim hash tại `tools/import-profiles/defect-catalog-20260923.json`.
- Nhập riêng nhóm bằng `node tools/import-drive-screens.mjs --group=danh_muc_benh_loi --reviewed-only`; không đọc lại hay đổi nguồn của nhóm khác.
- Giữ nguyên 460 hồ sơ ảnh và 21 nhóm trước đó. Tổng mới: **515 ảnh / 22 nhóm**. Giữ bản sửa nghiệp vụ, cảnh báo App PV P20F và tên “Báo cáo tồn kho & đối soát”.
- Kiểm tra gallery bao gồm bộ lọc 28/27, tìm mã có hậu tố, cảnh báo thiếu đúng thiết bị, mở/tải ảnh gốc và đối chiếu root với `/docs`.
- Độ phủ hiện có không phải chứng nhận runtime/API/auth/security/accessibility của sản phẩm. Bản thiết kế và fixture vẫn cần chủ thiết kế/PM duyệt.

## Để hoàn tất bộ ảnh

Cung cấp lại PNG P11F Tablet nguyên vẹn hoặc mở quyền xem Drive. Sau kiểm tra nội dung, cập nhật hash ghim và bỏ khai báo thiếu tương ứng; không chỉ đổi hash để bỏ qua lỗi giải mã.
