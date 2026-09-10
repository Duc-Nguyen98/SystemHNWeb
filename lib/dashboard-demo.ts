// Synthetic fixtures for the public UI prototype. No production records or APIs.
export type ItemType = 'all' | 'product' | 'component';
export const DEMO_DAY = '2026-09-05';
export const SNAPSHOT = '05/09/2026 · 16:30';
export const DEFAULT_FROM = '2026-08-30';
export const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value);
export const formatDay = (value: string) =>
  value.split('-').reverse().join('/');
export const typeName = (value: string) =>
  value === 'product'
    ? 'Sản phẩm'
    : value === 'component'
      ? 'Linh kiện'
      : 'Toàn bộ';
export const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();

export type Stock = {
  id: string;
  name: string;
  type: Exclude<ItemType, 'all'>;
  balance: number;
  ledger: number;
  quarantine: number;
  blocked: number;
  defective: number;
  min: number;
  max: number;
  location: string;
};
export const STOCK: Stock[] = [
  {
    id: 'DEMO-SP-001',
    name: 'Máy bơm nước',
    type: 'product',
    balance: 72,
    ledger: 72,
    quarantine: 4,
    blocked: 0,
    defective: 2,
    min: 80,
    max: 160,
    location: 'Khu A · Kệ A1',
  },
  {
    id: 'DEMO-SP-002',
    name: 'Máy phun thuốc',
    type: 'product',
    balance: 56,
    ledger: 58,
    quarantine: 0,
    blocked: 3,
    defective: 1,
    min: 20,
    max: 70,
    location: 'Khu A · Kệ A2',
  },
  {
    id: 'DEMO-LK-001',
    name: 'Bo mạch điều khiển',
    type: 'component',
    balance: 148,
    ledger: 150,
    quarantine: 8,
    blocked: 0,
    defective: 4,
    min: 180,
    max: 300,
    location: 'Khu B · Khay B01',
  },
  {
    id: 'DEMO-LK-002',
    name: 'Dây curoa',
    type: 'component',
    balance: 240,
    ledger: 240,
    quarantine: 0,
    blocked: 0,
    defective: 0,
    min: 120,
    max: 220,
    location: 'Khu B · Khay B02',
  },
  {
    id: 'DEMO-SP-003',
    name: 'Máy cắt cỏ',
    type: 'product',
    balance: 18,
    ledger: 18,
    quarantine: 2,
    blocked: 0,
    defective: 0,
    min: 30,
    max: 60,
    location: 'Khu A · Kệ A3',
  },
  {
    id: 'DEMO-LK-003',
    name: 'Bộ lọc nhiên liệu',
    type: 'component',
    balance: 65,
    ledger: 64,
    quarantine: 0,
    blocked: 2,
    defective: 0,
    min: 40,
    max: 100,
    location: 'Khu B · Khay B03',
  },
  {
    id: 'DEMO-SP-004',
    name: 'Máy phát điện',
    type: 'product',
    balance: 35,
    ledger: 35,
    quarantine: 0,
    blocked: 0,
    defective: 1,
    min: 20,
    max: 80,
    location: 'Khu A · Kệ A4',
  },
  {
    id: 'DEMO-LK-004',
    name: 'Bộ gioăng',
    type: 'component',
    balance: 40,
    ledger: 40,
    quarantine: 0,
    blocked: 0,
    defective: 0,
    min: 10,
    max: 80,
    location: 'Khu B · Khay B04',
  },
];
export const available = (s: Stock) =>
  s.balance - s.quarantine - s.blocked - s.defective;
export const difference = (s: Stock) => s.balance - s.ledger;
export const stockForType = (type: ItemType) =>
  STOCK.filter((s) => type === 'all' || s.type === type);
export const total = <T>(rows: T[], select: (row: T) => number) =>
  rows.reduce((sum, row) => sum + select(row), 0);

export type Movement = {
  id: string;
  day: string;
  sku: string;
  kind: 'in' | 'out' | 'return';
  quantity: number;
  doc: string;
};
export const MOVEMENTS: Movement[] = Array.from(
  { length: 36 },
  (_, dayIndex) => {
    const day = new Date(Date.UTC(2026, 7, 1 + dayIndex))
      .toISOString()
      .slice(0, 10);
    return STOCK.flatMap((item, index) =>
      (['in', 'out', 'return'] as const)
        .map((kind, k) => ({
          id: `DEMO-MV-${dayIndex + 1}-${index + 1}-${k}`,
          day,
          sku: item.id,
          kind,
          quantity:
            kind === 'in'
              ? 2 + ((dayIndex + index) % 4)
              : kind === 'out'
                ? 1 + ((dayIndex + index) % 3)
                : (dayIndex + index) % 5 === 0
                  ? 1
                  : 0,
          doc: `DEMO-${kind === 'in' ? 'PN' : kind === 'out' ? 'PX' : 'HT'}-${String(dayIndex + 1).padStart(2, '0')}-${index + 1}`,
        }))
        .filter((m) => m.quantity > 0),
    );
  },
).flat();

export function periodMetrics(from: string, to: string, type: ItemType) {
  const items = stockForType(type);
  const matches = (m: Movement) => items.some((i) => i.id === m.sku);
  const rows = MOVEMENTS.filter(
    (m) => matches(m) && m.day >= from && m.day <= to,
  );
  const signed = (m: Movement) => (m.kind === 'out' ? -m.quantity : m.quantity);
  const after = MOVEMENTS.filter((m) => matches(m) && m.day > to);
  const close = total(items, (s) => s.ledger) - total(after, signed);
  const incoming = total(
    rows.filter((m) => m.kind === 'in'),
    (m) => m.quantity,
  );
  const outgoingProduct = total(
    rows.filter(
      (m) =>
        m.kind === 'out' &&
        STOCK.find((s) => s.id === m.sku)?.type === 'product',
    ),
    (m) => m.quantity,
  );
  const outgoingComponent = total(
    rows.filter(
      (m) =>
        m.kind === 'out' &&
        STOCK.find((s) => s.id === m.sku)?.type === 'component',
    ),
    (m) => m.quantity,
  );
  const returns = total(
    rows.filter((m) => m.kind === 'return'),
    (m) => m.quantity,
  );
  return {
    rows,
    incoming,
    outgoingProduct,
    outgoingComponent,
    returns,
    close,
    open: close - incoming + outgoingProduct + outgoingComponent - returns,
  };
}

export type Warranty = {
  id: string;
  sku: string;
  serial: string;
  received: string;
  due: string;
  status: string;
  fault: string;
  overdue: number;
};
export const WARRANTIES: Warranty[] = [
  {
    id: 'DEMO-BH-001',
    sku: 'DEMO-SP-001',
    serial: 'DEMO-SN-001',
    received: '2026-08-27',
    due: '2026-09-02',
    status: 'Đang sửa chữa',
    fault: 'Không khởi động',
    overdue: 3,
  },
  {
    id: 'DEMO-BH-002',
    sku: 'DEMO-SP-002',
    serial: 'DEMO-SN-002',
    received: '2026-08-28',
    due: '2026-09-03',
    status: 'Đang kiểm tra',
    fault: 'Rò rỉ nhiên liệu',
    overdue: 2,
  },
  {
    id: 'DEMO-BH-003',
    sku: 'DEMO-SP-003',
    serial: 'DEMO-SN-003',
    received: '2026-08-29',
    due: '2026-09-04',
    status: 'Đang sửa chữa',
    fault: 'Rung bất thường',
    overdue: 1,
  },
  {
    id: 'DEMO-BH-004',
    sku: 'DEMO-SP-004',
    serial: 'DEMO-SN-004',
    received: '2026-09-01',
    due: '2026-09-04',
    status: 'Đang sửa chữa',
    fault: 'Không phát điện',
    overdue: 1,
  },
  {
    id: 'DEMO-BH-005',
    sku: 'DEMO-SP-001',
    serial: 'DEMO-SN-005',
    received: '2026-09-02',
    due: '2026-09-05',
    status: 'Đang kiểm tra',
    fault: 'Tiếng ồn lớn',
    overdue: 0,
  },
  {
    id: 'DEMO-BH-006',
    sku: 'DEMO-SP-002',
    serial: 'DEMO-SN-006',
    received: '2026-09-03',
    due: '2026-09-07',
    status: 'Đã tiếp nhận',
    fault: 'Cần kiểm tra',
    overdue: 0,
  },
  {
    id: 'DEMO-BH-007',
    sku: 'DEMO-SP-003',
    serial: 'DEMO-SN-007',
    received: '2026-08-20',
    due: '2026-08-25',
    status: 'Đã trả khách',
    fault: 'Đã xử lý',
    overdue: 0,
  },
];
export const LABELS = [
  {
    id: 'DEMO-NHAN-001',
    doc: 'DEMO-PX-N01',
    sku: 'DEMO-SP-001',
    status: 'Thất bại',
    printer: 'Máy in minh họa A',
    time: '05/09 · 15:40',
    reason: 'Hết giấy',
    version: 'v1',
  },
  {
    id: 'DEMO-NHAN-002',
    doc: 'DEMO-PX-N02',
    sku: 'DEMO-SP-002',
    status: 'Chờ phản hồi',
    printer: 'Máy in minh họa A',
    time: '05/09 · 16:10',
    reason: 'Chưa xác định kết quả tại máy in',
    version: 'v2',
  },
  {
    id: 'DEMO-NHAN-003',
    doc: 'DEMO-PX-N03',
    sku: 'DEMO-LK-001',
    status: 'Thất bại',
    printer: 'Máy in minh họa B',
    time: '05/09 · 16:15',
    reason: 'Mất kết nối máy in',
    version: 'v1',
  },
  {
    id: 'DEMO-NHAN-004',
    doc: 'DEMO-PX-N04',
    sku: 'DEMO-SP-004',
    status: 'Đã in',
    printer: 'Máy in minh họa B',
    time: '05/09 · 15:00',
    reason: 'Hoàn thành',
    version: 'v1',
  },
];
export const IMPORT_ERRORS = [
  {
    id: 'DEMO-ERR-01',
    batch: 'DEMO-LO-01',
    file: 'demo-danh-muc-01.xlsx',
    row: 3,
    field: 'Tên SKU',
    value: '(Trống)',
    reason: 'Thiếu tên SKU',
    fix: 'Điền tên hàng rõ nghĩa.',
    code: 'MISSING_REQUIRED_FIELD',
    duplicate: false,
  },
  {
    id: 'DEMO-ERR-02',
    batch: 'DEMO-LO-01',
    file: 'demo-danh-muc-01.xlsx',
    row: 7,
    field: 'Mã SKU',
    value: 'DEMO-SP-001',
    reason: 'Trùng mã SKU',
    fix: 'Đối chiếu SKU đã tồn tại; không tạo thêm bản trùng.',
    code: 'SKU_CODE_DUPLICATE',
    duplicate: true,
  },
  {
    id: 'DEMO-ERR-03',
    batch: 'DEMO-LO-02',
    file: 'demo-danh-muc-02.xlsx',
    row: 2,
    field: 'Nhóm hàng',
    value: 'NHOM-DEMO-X',
    reason: 'Nhóm hàng không tồn tại',
    fix: 'Chọn mã trong danh mục đang sử dụng.',
    code: 'INVALID_CATEGORY',
    duplicate: false,
  },
  {
    id: 'DEMO-ERR-04',
    batch: 'DEMO-LO-02',
    file: 'demo-danh-muc-02.xlsx',
    row: 5,
    field: 'Hãng',
    value: 'HANG-DEMO-X',
    reason: 'Hãng chưa có trong danh mục',
    fix: 'Đối chiếu danh mục hãng được phép sử dụng.',
    code: 'INVALID_BRAND',
    duplicate: false,
  },
  {
    id: 'DEMO-ERR-05',
    batch: 'DEMO-LO-02',
    file: 'demo-danh-muc-02.xlsx',
    row: 8,
    field: 'Mã SKU',
    value: 'DEMO-LK-002',
    reason: 'Trùng mã SKU',
    fix: 'Kiểm tra dòng trùng trước khi nhập lại.',
    code: 'SKU_CODE_DUPLICATE',
    duplicate: true,
  },
];
export const PENDING_SKU = {
  id: 'DEMO-LK-005',
  name: 'Linh kiện chờ hoàn thiện',
  missing: ['Hãng', 'Nhóm hàng'],
};

export type DemoRoute = {
  view: string;
  filter: string;
  id: string;
  action: string;
};
export const CLOSED_ROUTE: DemoRoute = {
  view: '',
  filter: '',
  id: '',
  action: '',
};
export const VIEWS = [
  'inventory',
  'warranty',
  'labels',
  'quality',
  'sku',
  'metric',
  'trace',
  'definitions',
  'handoff',
];
export function parseDemoRoute(search: string): DemoRoute {
  const params = new URLSearchParams(search);
  const view = params.get('demoView') || '';
  if (!VIEWS.includes(view)) return CLOSED_ROUTE;
  return {
    view,
    filter: params.get('demoFilter') || '',
    id: params.get('demoId') || '',
    action: params.get('demoAction') || '',
  };
}

export const HANDOFF = [
  [
    'D01–D07',
    'Điều hướng đúng tập việc',
    'Mỗi số đếm mở danh sách demo tương ứng; bộ lọc và đường quay lại được giữ.',
  ],
  [
    'D08, D12–D14',
    'Bố cục tablet và phạm vi',
    'Bộ lọc xuống hàng theo không gian; công việc trước KPI; tách hiện tại và trong kỳ.',
  ],
  [
    'D09–D11',
    'Đọc đúng số tồn',
    'So sánh tồn ghi nhận / tồn sổ / chênh lệch; công thức demo minh bạch. Công thức thật chờ BA/PO.',
  ],
  [
    'D15–D18',
    'Bảo hành và linh kiện',
    'Danh sách quá hạn, chi tiết, sửa thông tin, trạng thái và phiếu linh kiện nháp chỉ mô phỏng.',
  ],
  [
    'D19–D21',
    'Nhãn, lỗi nhập, SKU',
    'Tách chờ phản hồi với thất bại; lỗi từng dòng; checklist SKU. Không in hay nhập dữ liệu thật.',
  ],
  [
    'D22–D28',
    'Ngôn ngữ và trạng thái',
    'Tiếng Việt, vùng chạm lớn, focus, trạng thái tải/trống/lỗi/cũ/không quyền và bảng số liệu.',
  ],
];
