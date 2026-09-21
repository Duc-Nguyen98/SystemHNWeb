// Candidate fixture for visual handoff. Never production data or an API contract.
export const version = 'business-v1';
export const snapshot = '2026-09-10';
export const reviewStatus = 'needs-owner-review';
export const outbound = {
  dates: ['04/09','05/09','06/09','07/09','08/09','09/09','10/09'],
  daily: [98,132,148,176,212,248,172],
  status: [
    {key:'posted',label:'Đã xuất',value:38,color:'#009b60'},
    {key:'packing',label:'Đang đóng hàng',value:2,color:'#13a3db'},
    {key:'pending',label:'Chờ duyệt',value:2,color:'#ef8b20'},
    {key:'cancelled',label:'Đã hủy',value:0,color:'#8fa1ad'}
  ],
  rows: [
    ['PX-0042','10/09/2026','Công ty Hoàng Phát','180','Đã xuất','Nguyễn Văn B'],
    ['PX-0041','10/09/2026','Đại lý Minh Phát','96','Đang đóng hàng','Trần Thị C'],
    ['PX-0040','10/09/2026','Công ty ABC','—','Chờ duyệt','Lê Minh D'],
    ['PX-0039','09/09/2026','Công ty Hoàng Phát','120','Đã xuất','Nguyễn Văn B'],
    ['PX-0038','09/09/2026','Công ty Bắc Nam','64','Đã xuất','Phạm Thị E']
  ]
};
// A single explicitly proposed display fixture replaces inconsistent bitmap data.
// 07/09 closing stock follows the filter reference (685); today's KPI remains 647.
// Earlier dates are design fixtures, not values inferred from a backend.
const imports = [82,106,70,115,93,120,88,104,78,132,96,84,110,75,122,90,107,81,118,92,106,83,99,80,110,78,88,120,72,196];
const exports = [44,63,36,62,55,71,42,58,44,64,52,38,61,41,68,50,62,46,65,49,57,45,52,46,58,40,48,56,38,56];
const stocks = [412,428,445,432,460,480,455,478,494,520,536,511,545,559,538,567,580,590,605,600,588,610,620,560,610,655,685,720,760,647];
export const overviewSeries = imports.map((incoming,i) => ({
  date: new Date(Date.UTC(2026,7,12+i)).toISOString().slice(0,10), incoming, outgoing:exports[i], closing:stocks[i]
}));
export function seriesForRange(range='7d') {
  if(range==='custom')return overviewSeries.filter(p=>p.date>='2026-09-05'&&p.date<='2026-09-09');
  return overviewSeries.slice(-Number.parseInt(range));
}
export const overviewStock = [
  {key:'available',label:'Khả dụng',value:610,color:'#006b94'},
  {key:'checking',label:'Chờ kiểm tra',value:14,color:'#31a5db'},
  {key:'held',label:'Tạm giữ',value:15,color:'#ef8b20'},
  {key:'error',label:'Hàng lỗi',value:8,color:'#da3e49'}
];
export const overviewRows = [
  ['PN-0001','Nhập kho','Lô máy đầu ca','120','Chờ duyệt','10/09/2026 08:32'],
  ['PX-0004','Xuất kho','Đại lý Minh Phát','56','Đã hoàn thành','09/09/2026 16:20'],
  ['BH-001','Bảo hành','Công ty Hoàng Phát','3','Đang xử lý','09/09/2026 14:15'],
  ['NK-0003','Điều chỉnh','Kiểm kê định kỳ','18','Quá hạn','08/09/2026 10:30'],
  ['PX-0003','Xuất kho','Công ty ABC','32','Đã hoàn thành','08/09/2026 09:12']
];
export const warranty = {
  posted:64, draft:12, scanning:5, cancelled:3,
  rows: [
    ['PX-LK-260910-018','BH-20260910-001','Đang sửa chữa','LK-HN-014 · Vòng bi 6202','2 SKU · 4 linh kiện','Box + SL','Nháp','10/09/2026 · 16:42','Chỉnh sửa'],
    ['PX-LK-260910-017','BH-20260909-003','Đang kiểm tra','LK-HN-022 · Bộ công tắc','1 SKU · 2 linh kiện','Serial','Đang quét/nhập','10/09/2026 · 15:30','Ghi nhận'],
    ['PX-LK-260910-016','BH-20260908-005','Đang sửa chữa','LK-HN-031 · Rotor 20V','1 SKU · 3 linh kiện','Serial','Đã ghi sổ','10/09/2026 · 14:55','Chi tiết'],
    ['PX-LK-260909-041','BH-20260901-002','Đang sửa chữa','LK-HN-009 · Chổi than','1 SKU · 4 linh kiện','Box + SL','Đã ghi sổ','09/09/2026 · 16:10','Chi tiết'],
    ['PX-LK-260909-038','TEMP-20260910-006','TEMP_ONLY · Đã tiếp nhận','LK-HN-042 · Bộ cò máy','1 SKU · 1 linh kiện','Serial','Đang quét/nhập','09/09/2026 · 14:20','Ghi nhận'],
    ['PX-LK-260908-033','BH-20250828-007','Hoàn tất sửa chữa','LK-HN-018 · Dây nguồn','1 SKU · 1 linh kiện','Box + SL','Đã ghi sổ','08/09/2026 · 11:03','Chi tiết'],
    ['PX-LK-260907-029','BH-20260908-005','Đang sửa chữa','LK-HN-027 · Công tắc nguồn','1 SKU · 2 linh kiện','Serial','Đã hủy','07/09/2026 · 09:18','Chi tiết']
  ]
};
export const sessionStates = ['default','entering-system','session-expired','checking-session','context-load-error','confirmation-failed','offline-before-submit','outcome-unknown','warehouse-suspended','access-denied','account-unavailable'];
export const sum = values => values.reduce((a,b)=>a+b,0);
export const percent = (n,total) => (total ? (100*n/total).toFixed(1).replace('.',',') : '—') + (total?'%':'');
export const number = n=>new Intl.NumberFormat('vi-VN').format(n);
export const displayDate = date=>new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(date+'T01:30:00Z'));
