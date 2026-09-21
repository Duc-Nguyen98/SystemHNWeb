# Hoa Nam — Đợt sửa mâu thuẫn nghiệp vụ v1

Trạng thái: **đã triển khai bản sửa để duyệt; chưa phải baseline được chủ thiết kế phê duyệt**.

## Phạm vi

- 108 liên kết màn hình chuyển sang bản sửa: 56 trong gallery Drive, 52 trong gallery chính. Tổng inventory vẫn 376 + 84, không làm đầy số ảnh giả.
- 88 render nguồn duy nhất: AUTH-02 22; Phiếu xuất linh kiện bảo hành 2; Báo cáo xuất kho 18; Tổng quan 20; Filter/Datepicker 26. Expired dùng chung mẫu nên nhiều liên kết trỏ tới cùng thiết kế.
- Các nhóm <=3 ảnh vẫn không bị bổ sung state ngoài yêu cầu. Chỉ sửa cặp Phiếu xuất linh kiện bảo hành có nội dung sai.
- Source HTML/CSS/SVG và fixture lưu tại `design-source/business-v1`. Không chỉnh số liệu trên bitmap, không dùng imagegen trong đợt này. Các ảnh được render trực tiếp ở Desktop 1920×1080 DPR1, Tablet 800×1280 DPR2 →1600×2560.

## Kết quả sửa theo ưu tiên

### Ảnh sai màn và nguồn chuẩn

Thay cặp Phiếu xuất linh kiện bảo hành bằng bản dựng theo fixture v3: 64 đã ghi sổ +12 nháp +5 đang quét/nhập +3 đã hủy =84, tỷ lệ 76,2%; mã PX-LK, hồ sơ BH/TEMP; CTA Tạo phiếu xuất linh kiện; action Nháp→Chỉnh sửa, Đang quét/nhập→Ghi nhận, Đã ghi sổ/Đã hủy→Chi tiết. Chỉ POSTED giảm tồn. Không còn ảnh Phiếu nhập kho gắn tên bảo hành trong luồng viewer chính.

Hai master có hash 4763e989…/9edb1764… mà tài liệu nói đã khóa chưa có trong bộ file được xác minh. Không tuyên bố bản mới là bản gốc đã duyệt. Ảnh gốc và hash được giữ trong kho lưu trữ.

### Expired và AUTH-02

Các màn Session Expired ở bộ AUTH-02, Lịch sử, Nhãn, Truy vết, Đại lý, Danh mục sản phẩm, SKU, TKDS dùng cùng mẫu chỉ có thông báo hết phiên và Đăng nhập lại. Không avatar, tên, role, trạng thái kho, báo cáo hay bộ lọc protected phía sau.

AUTH-02 trong hai gallery dùng cùng nguồn: Default là Bắt đầu làm việc; pending là Đang vào hệ thống…; không dùng ngữ nghĩa tạo/mở ca. Tên sản phẩm hiện hành được giữ theo bộ tham chiếu SCANNER, chưa tự chốt identity Web cuối cùng. Việc ẩn context trên Expired là phương án hạn chế dữ liệu cho bản thiết kế; policy thực tế vẫn cần chủ sở hữu xác nhận.

### Readonly

Báo cáo xuất kho P07: Áp dụng, Đặt lại, search và Xem còn khả dụng; chỉ export bị khóa. Kho vẫn là Đang hoạt động và readonly, không đổi trạng thái kho thành quyền Chỉ xem. Đây là mô tả giao diện; chưa có kiểm thử phân quyền API production.

### Biểu đồ và dữ liệu

- Outbound giữ fixture 1.186 sản phẩm và 38+2+2+0=42 phiếu. Góc donut tính từ giá trị; giá trị 0 không sinh segment. Các state dùng chung component, không có mảnh màu thừa.
- Overview/filter dùng một fixture đề xuất `business-v1`, 7/14/30/custom lần lượt có 7/14/30/5 điểm ngày, mỗi ngày một cặp bar và một điểm tồn. Tooltip 07/09 dùng 685; ngày 10/09 dùng 647, khớp KPI fixture cùng màn. Ngày header sinh từ date/timezone, 10/09/2026 là Thứ Năm.
- Dữ liệu 30 ngày là **fixture minh họa đề xuất**, không được tuyên bố lấy từ API hoặc đã được chủ sở hữu duyệt. CSV gốc chỉ ghi range/count, không cung cấp đủ các giá trị ngày; các ảnh cũ mâu thuẫn. Chủ sở hữu cần duyệt dataset hoặc thay bằng fixture chuẩn từ Backend trước nghiệm thu nghiệp vụ.
- Tồn cuối ngày là snapshot minh họa, không suy ra chỉ từ hai chuỗi nhập/xuất khi chưa có contract về điều chỉnh và các loại giao dịch khác.
- TRACE giữ ảnh tỷ lệ 94,5%; errata trong sổ baseline sửa câu 96,8% vì 121/128=94,53125%. Không ghi đè tài liệu gốc bên ngoài repo.

## Baseline register

`baseline-register.json` phân biệt `matches-documented-file`, `document-asset-conflict`, `reference-unverified`, `candidate-not-approved`. Không có công cụ tự phê duyệt.

Cần chủ sở hữu xác nhận:

1. Duyệt bộ sửa có nguồn và fixture Overview đề xuất.
2. Danh mục sản phẩm Tablet: tài liệu ghi 2c78c4bb… nhưng file cung cấp có hash 09d55457…; chưa xác định tài liệu stale hay file sai.
3. Phiếu xuất linh kiện: chưa tìm được file master đúng hash tài liệu.
4. Nhãn v1.2 so với spec v1.0: xác nhận phiên bản và action In lại theo dòng.

Giữ nguyên expected hash lịch sử; không sửa nó để kiểm tra xanh. Không gắn chữ Approved chỉ vì ảnh đọc được hoặc dữ liệu đúng phép tính.

## Thay đổi trình bày và giới hạn

Vì nguồn hiện có chủ yếu là bitmap, các màn trong phạm vi được dựng lại thành candidate HTML/SVG dùng chung; không cam kết pixel-perfect với artwork cũ. Sidebar/hero minh họa được giản lược, typography được đóng gói để tái lập. Bản này cần duyệt cả trình bày, không chỉ tên state.

Trên Tablet, bảng Xuất kho dùng vùng cuộn để giữ cỡ control thay vì nén mọi dòng vào ảnh. Bảng vẫn có đủ 5 dòng của trang và chỉ dẫn cuộn; PNG chụp vị trí đầu. Prototype nguồn là fixture tĩnh, button không gọi API.

Các phần dashboard ngoài chart được dựng lại để các state chia sẻ một grid; bản sửa này chưa thay thế việc kiểm kê lại mọi shortcut/nhật ký/luồng nghiệp vụ đầy đủ của hệ thống. Những phát hiện audit không thuộc nhóm ưu tiên chưa được tuyên bố đã đóng.

## Khôi phục và nhập lại

- `design-archive/business-v1`: bản ảnh trước sửa, hash nguyên vẹn, không sửa/xóa Drive gốc.
- `design-source/business-v1/targets.json`: ánh xạ ID cũ → nguồn sửa + nguyên nhân + dữ liệu cũ.
- Importer áp dụng lại bản sửa sau `--reviewed-only` để không quay về ảnh sai và không nhập nhầm công việc mới ngoài phạm vi.
- Liên kết viewer cũ vẫn mở bản sửa. Bản lưu trữ là bằng chứng, không là baseline hiện hành.

## Nghiệm thu

Asset integrity, state coverage, phép tính fixture, native canvas, review provenance và semantic DOM được kiểm tra riêng. Không coi test viewer là test workflow, RBAC, backend, privacy hoặc accessibility production.

Đã chạy: 12 unit tests; 88 native-state checks về ngữ nghĩa, viewport và tràn chữ/control; 1.240 viewer checks không lỗi; điều khiển xem/tải trên Chromium, Firefox, WebKit. Nhập lại nguồn `--reviewed-only` cho manifest giống hệt, vẫn giữ lớp sửa. SHA-256 của 108 bản lưu trước sửa được đối chiếu với hồ sơ gốc. Các kết quả này không tự chuyển trạng thái review thành approved.
