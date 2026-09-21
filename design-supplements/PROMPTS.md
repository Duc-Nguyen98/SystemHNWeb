# Bộ prompt ảnh bổ sung · 22/09/2026

Công cụ: built-in imagegen; không dùng CLI/API fallback. Thứ tự ảnh tham chiếu nằm trong `manifest.json` theo `promptId`.

Trạng thái: **cần chủ thiết kế duyệt**. Các prompt yêu cầu canvas chuẩn, nhưng đầu ra thực tế là 1672×941 (Desktop) và 992×1586 (Tablet). Lưu nguyên byte, không nội suy và không gắn nhãn đã đạt canvas chuẩn. Tên file trong gallery ghi kích thước thực.

## history-p20-desktop

```text
Use case: ui-mockup
Asset type: production handoff screenshot, Desktop 1920×1080.
Primary request: Create the missing Desktop counterpart for the Hoa Nam WMS "Báo cáo Lịch sử nhập - xuất kho" P20 Maintenance state.
Input images: Image 1 is the exact P20 Maintenance tablet state and content reference. Image 2 is the exact Desktop shell, sidebar, header, spacing and card-layout reference for this same module.
Composition: landscape 1920×1080, full UI screenshot, no browser chrome, no device mockup, no collage.
Text (verbatim): "Hệ thống đang bảo trì"; "Một số chức năng tạm thời chưa khả dụng. Vui lòng quay lại sau."; button "Thử lại"; top label "Kho Hoa Nam".
Constraints: preserve the Hoa Nam WMS visual language, desktop full sidebar, ocean-blue header, pale blue workspace, centered white maintenance card, wrench line icon. Match the references faithfully. Do not invent data, extra buttons, logos or text.
```

## tkds-p12-tablet

```text
Use case: ui-mockup
Asset type: production handoff screenshot, portrait Tablet 1600×2560.
Primary request: Create the missing Tablet counterpart for Hoa Nam WMS "Báo cáo Tồn kho & đối soát" P12 Session Expired.
Input images: Image 1 is the exact P12 session-expired Desktop content and visual reference. Image 2 is the exact Tablet shell, sidebar, header, report header and filter layout reference for this module.
Composition: portrait 1600×2560, full UI screenshot, no browser chrome, no device mockup, no collage.
Text (verbatim): report title "Báo cáo Tồn kho & đối soát"; state title "Phiên đăng nhập đã hết hạn"; description "Vui lòng đăng nhập lại để tiếp tục xem báo cáo."; primary button "Đăng nhập lại"; warehouse "Kho Hoa Nam".
Constraints: preserve the tablet shell from Image 2 and the session-expired state from Image 1. Keep protected report data hidden. Keep the report header and disabled filters visible exactly as the Desktop reference indicates. Do not invent extra copy, data, buttons or controls.
```

## outbound-p08-tablet

```text
Use case: ui-mockup
Asset type: production handoff screenshot, portrait Tablet 1280×2048.
Primary request: Create the missing Tablet counterpart for Hoa Nam WMS "Báo cáo xuất kho" row-highlight state.
Input images: Image 1 is the exact row-highlight Desktop state. Image 2 is the exact Tablet layout and responsive baseline for the same report.
Composition: portrait 1280×2048, full UI screenshot, no browser chrome, no device mockup, no collage.
Required state: preserve all Tablet data and layout from Image 2. In the "Danh sách phiếu xuất" table, add the same focused/selected row treatment shown in Image 1: a crisp ocean-blue outline around the selected row and the small context label "Vừa xem: PX-0042" next to the section count. Keep all other content unchanged.
Constraints: use exact Vietnamese text from the references, preserve the Hoa Nam palette, charts, metrics, table values and navigation. Do not add a toast, dialog, new data, extra controls or extra highlighting.
```

## history-p16-desktop

```text
Use case: ui-mockup. Make one high-fidelity Desktop screenshot, landscape 1920x1080, for Hoa Nam WMS Báo cáo Lịch sử nhập - xuất kho P16 401 Session Expired.
Image 1: edit target, exact module shell. Image 2: supporting session-expired pattern.
Keep the header, sidebar brand, colors and clean pale workspace of Image 1. Replace its 403 card with a clock/lock icon, exact title "Phiên đăng nhập đã hết hạn", description "Vui lòng đăng nhập lại để tiếp tục.", and a single primary "Đăng nhập lại" button. Do not show 403 or forbidden text, report data, filters, charts, tables or protected controls. One centered white card, no extra copy. Full flat UI; no device frame, no collage, no watermark. Keep Vietnamese diacritics exact.
```

## history-p16-tablet

```text
Use case: ui-mockup. Make one high-fidelity portrait Tablet screenshot, 1600x2560, for Hoa Nam WMS Báo cáo Lịch sử nhập - xuất kho P16 401 Session Expired.
Image 1: edit target, exact module tablet shell. Image 2: supporting session-expired pattern.
Keep the header, icon sidebar, colors and clean pale workspace of Image 1. Replace its 403 card with a clock/lock icon, exact title "Phiên đăng nhập đã hết hạn", description "Vui lòng đăng nhập lại để tiếp tục.", and a single primary "Đăng nhập lại" button. No 403 number, forbidden text, report data, filters, charts, tables or protected controls. One centered white card; no extra copy. Portrait responsive UI, not squashed desktop. No device frame, collage or watermark. Keep Vietnamese diacritics exact.
```

## trace-p10-desktop

```text
Use case: ui-mockup. Edit this high-fidelity Hoa Nam WMS Desktop screenshot into P10 Data-quality Warning. Landscape 1920x1080.
Image 1 is the edit target and immutable baseline. Change ONLY these areas: add restrained amber border/background emphasis to KPI "Cần kiểm tra" and card "Chất lượng truy vết"; make its existing warning show exact text "7 hàng hóa cần kiểm tra" and "5 thiếu sự kiện · 2 lệch trạng thái"; replace the warning CTA with "Xem 7 hàng hóa". Warning stays inside this quality card, no modal, no overlay, no covering filters.
Preserve all remaining shell, tables and data: KPI 128,342,7,94,5% with 121/128; daily bars 38,44,41,52,60,58,49; quality 121 complete,5 missing events,2 state mismatches. 5+2=7, 121+7=128. Keep row data and Vietnamese text readable and unchanged. Never add another CTA or workflow. Full flat screenshot, no device mockup, collage, watermark or explanation outside UI.
```

## trace-p10-tablet

```text
Use case: ui-mockup. Edit this high-fidelity Hoa Nam WMS Tablet screenshot into P10 Data-quality Warning. Portrait 1600x2560.
Image 1 is the edit target and immutable tablet baseline. Change ONLY these areas: add restrained amber border/background emphasis to KPI "Cần kiểm tra" and card "Chất lượng truy vết"; make its existing warning show exact text "7 hàng hóa cần kiểm tra" and "5 thiếu sự kiện · 2 lệch trạng thái"; replace the warning CTA with "Xem 7 hàng hóa". Warning stays inside this quality card, no modal, no overlay, no covering filters.
Preserve all remaining shell, tablet responsive layout, tables and data: KPI 128,342,7,94,5% with 121/128; daily bars 38,44,41,52,60,58,49; quality 121 complete,5 missing events,2 state mismatches. 5+2=7, 121+7=128. Keep row data and Vietnamese text readable and unchanged. Never add another CTA or workflow. Full flat screenshot, no device mockup, collage, watermark or explanation outside UI.
```
