# MAP-01 · Filter / Datepicker QA handoff v2

Trạng thái: **ĐÃ ĐƯA LÊN GITHUB PAGES**  
Phạm vi: component bộ lọc khoảng thời gian của biểu đồ Nhập – Xuất – Tồn trên màn MAP-01.

## Truy cập

- Gallery: [Bộ lọc biểu đồ v2](previews/overview-filter-v2/index.html)
- Gallery chính: [SystemHNWeb](https://duc-nguyen98.github.io/SystemHNWeb/)
- Route giữ nguyên: `/wms-baseline` cho Web System; Scanner App là hệ thống độc lập.

## Viewport và quy tắc xuất

| Viewport | Canvas xuất | Ghi chú |
|---|---:|---|
| Desktop ngang | 1920 × 1080 px | Full HD |
| Tablet dọc | 1600 × 2560 px | Export @2x, tương đương 800 × 1280 CSS px |

Hai viewport dùng cùng một component và cùng fixture; Tablet chỉ reflow để giữ hit-area và không tràn nội dung.

## State matrix

| ID | Trạng thái | Kết quả cần thấy |
|---|---|---|
| 01 | Default | Trigger đóng, nhãn khoảng mặc định, chart bình thường |
| 02 | Hover / focus | Viền và focus ring xanh, kích thước không đổi |
| 03 | Open menu | Danh sách preset mở đúng dưới trigger |
| 04 | Selected preset | Preset đang chọn và chart cập nhật đúng khoảng |
| 05 | Selected alternate | Một preset khác được chọn, KPI “Hôm nay” giữ nguyên |
| 06 | Custom picker open | Chip nhanh, hai field ngày, lịch range và footer CTA |
| 07 | Custom picker invalid | Lỗi inline, range đỏ cho lỗi, nút Áp dụng bị khóa |
| 08 | Custom range applied | Trigger rút gọn, field và vùng chọn lịch khớp nhau |
| 09 | Tooltip | Tooltip hiển thị ngày và ba chuỗi Nhập – Xuất – Tồn |
| 10 | Loading | Filter tạm khóa, chart dùng skeleton trong card |
| 11 | Empty | Giữ filter hoạt động, chart hiển thị empty state |
| 12 | Error | Thông báo lỗi trong card và nút Thử lại |
| 13 | Permission denied | Card bị khóa, không cho mở filter |

Preset dùng chung: **7 ngày gần nhất, 14 ngày gần nhất, 30 ngày gần nhất, Tùy chỉnh**. Khoảng ngày tính theo ngày lịch, gồm hôm nay, múi giờ `Asia/Ho_Chi_Minh`, tối đa 90 ngày.

## Token khóa

- Navy `#003B63`: tiêu đề và chữ chính.
- Ocean `#004E74`: trigger, endpoint, range, chip đang chọn và CTA.
- Teal `#086590`: control phụ và liên kết.
- Tint `#EAF5F8`: vùng range và nền hỗ trợ.
- Border `#D9E8EF`: viền và divider.
- Tím chỉ dùng cho đường **Tồn kho** trên biểu đồ; không dùng cho endpoint hoặc vùng range.

## Acceptance criteria cho DEV

- Popup neo đúng trigger, không bị cộng tọa độ hai lần.
- Không có chữ bị cắt, chồng hàng ngày, tràn ngang hoặc footer che lịch.
- Field ngày, endpoint và vùng range luôn biểu diễn cùng một khoảng.
- Desktop và Tablet giữ cùng thứ tự đọc; Tablet dùng chip 2×2 khi cần.
- Hit-area control tối thiểu 44 CSS px; focus ring nhìn thấy bằng bàn phím.
- Loading / Empty / Error / Permission chỉ thay đổi card biểu đồ, không làm mất dữ liệu Dashboard khác.
- Asset preview WebP chỉ để xem nhanh; asset canvas đầy đủ dùng theo đường dẫn trong gallery.

## Ranh giới nghiệm thu

Gói này đủ để DEV dựng và QA nghiệm thu **filter/chart component**. Việc ký nghiệm thu toàn bộ Dashboard vẫn phải xử lý các P0 đã ghi nhận trong handoff tổng: KPI Tablet bị chồng dòng và weekday trong header chưa khớp ngày lịch.
