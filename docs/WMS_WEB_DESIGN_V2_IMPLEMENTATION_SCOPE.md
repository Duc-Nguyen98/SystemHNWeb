# Hoa Nam WMS — Phạm vi đồng bộ web theo Scanner Design v2

Ngày ghi nhận: 10/09/2026.

## Yêu cầu đã được người dùng xác nhận

Người dùng xác nhận: **“đồng bộ toàn bộ web quản lý”**, sau khi duyệt hướng giữ nghiệp vụ và đồng bộ visual với Scanner Design v2.

- Web mục tiêu: https://khohoanamfe.lptech.info.vn/dashboard?screen=MAP-01
- Tham chiếu thiết kế: https://duc-nguyen98.github.io/ScannerHNApp/
- Repository tham chiếu: https://github.com/Duc-Nguyen98/ScannerHNApp
- Không đổi framework chỉ để giống một bộ template. Đồng bộ ngôn ngữ thiết kế; bố cục web vẫn phục vụ bảng dữ liệu và vận hành desktop.
- Phạm vi mới này cho phép nâng cấp UI web WMS, nhưng không thay đổi những giới hạn bảo vệ Scanner và Product Preview.

## Trạng thái nguồn — chưa thể triển khai web mục tiêu

Đã vào được MAP-01 sau khi chủ sở hữu tự đăng nhập. Đã quan sát dashboard và menu chính; các màn nghiệp vụ khác chưa được khảo sát đầy đủ trong lượt này.

Workspace `WMS_UIUX_HoaNamv2` là repository review/prototype. Mã nguồn hiện có các trang `/`, `/preview`, `/scanner`; build cũng chỉ liệt kê các route này. `handoff/AI_STITCH_CONTINUATION_06092026/PROJECT_CONTEXT_EXPORT_06092026.md` phân biệt rõ repository này với hệ thống vận hành.

Chưa có mã nguồn frontend được xác nhận là nguồn triển khai cho tên miền LPTech. Đăng nhập web cho phép khảo sát giao diện, không đồng nghĩa đã có repository hoặc quyền triển khai.

Đã cập nhật theme Design v2 trong 12 file review/prototype của repository này; các thay đổi Scanner có sẵn của người dùng không bị hoàn tác. Chưa có thay đổi UI nào được commit, push hay deploy lên GitHub Pages. Build local đã chạy thành công; chưa coi đó là visual regression đầy đủ cho mọi viewport.

## Phạm vi toàn web

Các nhóm dưới đây được quan sát trong menu hiện tại. Danh sách màn, form, dialog và trạng thái chi tiết phải được kiểm kê từ đúng mã nguồn và giao diện trước khi triển khai.

| Nhóm | Phần cần đồng bộ |
| --- | --- |
| Dùng chung | Shell, header, sidebar, breadcrumb, tìm kiếm, CTA, bảng, bộ lọc, phân trang, thông báo, dialog và drawer hiện có |
| Xác thực | Các màn xác thực hiện có; giữ cơ chế đăng nhập và khôi phục truy cập |
| Tổng quan vận hành | MAP-01: KPI, bộ lọc kỳ/loại hàng, ưu tiên, cảnh báo, đối soát và biểu đồ |
| Danh mục | Toàn bộ danh sách, chi tiết và form hiện có trong nhóm |
| Nhập kho / Xuất kho | Danh sách, chi tiết, bước nhập liệu và xác nhận hiện có |
| Bảo hành & linh kiện | Danh sách, hồ sơ và các thao tác được hệ thống hiện tại cung cấp |
| Tồn kho & truy vết | Danh sách, bộ lọc, chi tiết và trình bày luồng hiện có |
| Báo cáo | Bộ lọc, bảng, biểu đồ và trạng thái xuất báo cáo hiện có |
| Hệ thống | Các màn quản trị hiện có; giữ nguyên quyền và phạm vi dữ liệu |

## Quy tắc thiết kế và kỹ thuật

1. Primary `#0C6286`, CTA `#0C5D7D`, màu hỗ trợ `#5E93A7`, nền sáng `#FAFCFC`; Public Sans. Không mặc định dùng màu hỗ trợ cho chữ nhỏ khi chưa kiểm tra tương phản.
2. Kế thừa treatment icon, card, trạng thái và spacing của nguồn Scanner được duyệt; điều chỉnh bố cục theo nhu cầu web. Không sao chép khung điện thoại hay bottom navigation Scanner lên desktop.
3. Phân biệt accent thương hiệu với màu ngữ nghĩa của cảnh báo/lỗi/thành công và các chuỗi biểu đồ; không đổi tất cả màu thành xanh. Trạng thái phải có nhãn hoặc icon, không chỉ dựa vào màu.
4. Ưu tiên token có phạm vi riêng của WMS và scope tương ứng cho portal/dialog. Không thay `:root`, shared CSS hoặc component của Scanner/Preview chỉ để đổi màu WMS.
5. Giữ nguyên API, dữ liệu, route/query, RBAC, guard, điều kiện hành động, phê duyệt và Inventory Post. Không đưa mock Scanner vào dữ liệu web vận hành, không tạo trạng thái tiếp nhận/thành công giả.
6. Bảo vệ ba màn Scanner Đăng nhập, Xác nhận phiên, Trang chủ theo `SCANNER_APPROVED_UI_BASELINE.md`. Không ghi đè ảnh baseline v1.

## Trình tự triển khai khi có đúng repository

1. Xác minh repository/branch nguồn triển khai, AGENTS.md, worktree và lệnh chạy; kiểm kê route/components và chụp Before.
2. Triển khai token + shell + MAP-01 trên local; kiểm tra cả màu, typography, bố cục, tương tác và loading/empty/error/disabled/focus.
3. Áp dụng cùng bộ component tới các nhóm nghiệp vụ, kiểm tra từng route thực sự; theo dõi ma trận đã làm/chưa làm, không coi đổi màu dashboard là hoàn thành toàn bộ web.
4. Kiểm tra desktop 1440×900 và 1920×1080, tablet 1024×768 và responsive theo hỗ trợ thực tế; kiểm tra keyboard, table overflow, tooltip, dialog, biểu đồ và nhãn dài. Nếu có thay đổi shared với Scanner, regression ba màn tại 360/390/430px theo baseline.
5. Bàn giao mã nguồn, ảnh After, kết quả kiểm thử và phần còn thiếu. Chỉ triển khai lên hệ thống chạy khi có xác nhận riêng về target/quy trình deploy.

## Đầu vào còn thiếu

Link repository hoặc đường dẫn thư mục mã nguồn frontend đang triển khai tại `khohoanamfe.lptech.info.vn`. Không yêu cầu người dùng gửi mật khẩu, OTP hay token đăng nhập qua chat.
