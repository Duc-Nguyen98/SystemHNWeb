# SystemHNWeb · Viewport & Orientation QA v1

## Mục tiêu

Tách riêng ba khung kiểm tra để DEV không trộn ảnh Tablet dọc với Tablet ngang khi dựng giao diện.

| Chế độ | Kích thước CSS | Kích thước export |
|---|---:|---:|
| Desktop ngang | 1920 × 1080 px | 1920 × 1080 px |
| Tablet dọc tiêu chuẩn 10.9–11" | 800 × 1280 px | 1600 × 2560 px (@2x) |
| Tablet ngang tiêu chuẩn 10.9–11" | 1280 × 800 px | 2560 × 1600 px (@2x) |

## Tình trạng asset

- Desktop: đã có asset riêng cho 13 AUTH và 9 Tổng quan.
- Tablet dọc: đã có asset riêng cho 13 AUTH và 9 Tổng quan; Filter/Datepicker có 13 state.
- Tablet ngang: baseline hiện tại **chưa có artwork riêng**. Gallery đã tách một khu vực cảnh báo P0 để tránh dùng ảnh dọc làm ảnh ngang.

## Quy tắc bàn giao

1. Không xoay, kéo giãn hoặc crop ảnh Tablet dọc để thay cho artwork landscape.
2. Artwork landscape phải giữ đúng canvas 2560 × 1600 px, mã trạng thái và tên file tương ứng.
3. DEV kiểm tra ở 1280 × 800 CSS px; vùng bấm tối thiểu, popup datepicker và footer không được tràn cạnh.
4. Ảnh mở chi tiết dùng trình xem có các mức **Vừa màn hình**, **1:1**, **＋**, **−**; phím tắt `f`, `0`, `+`, `-`, `Esc`.
5. Thumbnail chỉ dùng để xem nhanh; nghiệm thu dùng file canvas đầy đủ trong repo.

## Danh sách cần bổ sung trước UAT

- AUTH: 13 state Tablet ngang.
- Tổng quan: 9 state Tablet ngang.
- Filter/Datepicker: 13 state Tablet ngang.

Khi bổ sung, cập nhật cả thư mục asset, manifest và bảng trạng thái trong handoff để số lượng gallery và số lượng file luôn khớp.
