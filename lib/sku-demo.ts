/** Synthetic, in-memory UI fixtures. No WMS API or business eligibility rules. */
export type SkuType = 'product' | 'component';
export type Sku = {
  id: string;
  code: string;
  name: string;
  type: SkuType;
  brand: string;
  group: string;
  model: string;
  power: string;
  packaging: string;
  unit: string;
  version: string;
  min: number | null;
  max: number | null;
  active: boolean;
  published: boolean;
  serial: boolean | null;
  hasStock: boolean;
  pending: boolean;
  revision: number;
};
export const SKU_BRANDS = [
  { value: 'a', label: 'Hãng mẫu A' },
  { value: 'b', label: 'Hãng mẫu B' },
  { value: 'c', label: 'Hãng mẫu C' },
];
export const SKU_MODELS = [
  { value: 'A-01', brand: 'a' },
  { value: 'A-02', brand: 'a' },
  { value: 'B-01', brand: 'b' },
  { value: 'B-02', brand: 'b' },
  { value: 'C-01', brand: 'c' },
  { value: 'C-02', brand: 'c' },
];
export const typeName = (type: SkuType) =>
  type === 'product' ? 'Sản phẩm' : 'Linh kiện';
export const brandName = (brand: string) =>
  SKU_BRANDS.find((b) => b.value === brand)?.label || 'Chưa có';
export const modelsFor = (brand: string) =>
  SKU_MODELS.filter((m) => m.brand === brand);
export const missingReferences = (s: Sku) =>
  [
    !s.brand && 'Hãng',
    !s.group && 'Nhóm hàng',
    !s.model && 'Model',
    !s.power && 'Công suất',
    !s.packaging && 'Quy cách',
  ].filter(Boolean) as string[];
const productNames = ['Máy bơm nước', 'Động cơ máy nông nghiệp', 'Máy phun'];
const componentNames = [
  'Bo mạch điều khiển thay thế',
  'Bộ linh kiện bảo dưỡng',
  'Cụm phụ tùng thay thế',
];
export const SKU_FIXTURES: Sku[] = Array.from({ length: 72 }, (_, i) => {
  const n = ((i * 29) % 72) + 1;
  const brand = ['a', 'b', 'c'][n % 3];
  const pending = [7, 23, 41].includes(n);
  return {
    id: `sample-${n}`,
    code: `DEMO-SKU-${n % 2 ? 'LK' : 'SP'}-${String(n).padStart(3, '0')}`,
    name: `${(n % 2 ? componentNames : productNames)[Math.floor(n / 2) % 3]} ${String(n).padStart(2, '0')} — mẫu${n === 11 ? ' dùng kiểm tra tên dài khi hiển thị trên máy tính bảng và màn hình thu gọn' : ''}`,
    type: n % 2 ? 'component' : 'product',
    brand: pending ? '' : brand,
    group: pending ? '' : n % 2 ? 'Phụ tùng' : 'Thiết bị',
    model: pending ? '' : `${brand.toUpperCase()}-0${(n % 2) + 1}`,
    power: pending ? '' : `${(n % 4) + 1} kW`,
    packaging: pending ? '' : '1 cái / hộp',
    unit: 'cái',
    version: 'V1',
    min: n % 9 === 0 ? null : n % 6,
    max: n % 9 === 0 ? null : 20 + (n % 12),
    active: n % 3 !== 0,
    published: n % 4 === 0,
    serial: n % 2 === 0,
    hasStock: n % 4 !== 1,
    pending,
    revision: 1,
  };
});
export type SkuSort =
  | 'code.asc'
  | 'code.desc'
  | 'name.asc'
  | 'name.desc'
  | 'min.asc'
  | 'min.desc'
  | 'max.asc'
  | 'max.desc';
export type SkuQuery = {
  q: string;
  type: string;
  brand: string;
  status: string;
  pending: boolean;
  sort: SkuSort;
  page: number;
  size: number;
};
export const SKU_DEFAULT_QUERY: SkuQuery = {
  q: '',
  type: 'all',
  brand: 'all',
  status: 'all',
  pending: false,
  sort: 'code.asc',
  page: 1,
  size: 10,
};
const sorts: SkuSort[] = [
  'code.asc',
  'code.desc',
  'name.asc',
  'name.desc',
  'min.asc',
  'min.desc',
  'max.asc',
  'max.desc',
];
export function parseSkuQuery(search: string): SkuQuery {
  const p = new URLSearchParams(search);
  const choice = (key: string, options: string[], fallback: string) =>
    options.includes(p.get(key) || '') ? p.get(key)! : fallback;
  return {
    q: (p.get('skuQ') || '').slice(0, 160).trim(),
    type: choice('skuType', ['all', 'product', 'component'], 'all'),
    brand: (p.get('skuBrand') || 'all').slice(0, 80),
    status: choice('skuStatus', ['all', 'active', 'inactive'], 'all'),
    pending: p.get('skuPending') === '1',
    sort: choice('skuSort', sorts, 'code.asc') as SkuSort,
    page: Math.max(1, Math.min(100000, Number(p.get('skuPage')) || 1)) | 0,
    size: [10, 15, 20, 50].includes(Number(p.get('skuSize')))
      ? Number(p.get('skuSize'))
      : 10,
  };
}
export function skuUrl(href: string, q: SkuQuery) {
  const url = new URL(href);
  const values = {
    skuQ: q.q,
    skuType: q.type,
    skuBrand: q.brand,
    skuStatus: q.status,
    skuPending: q.pending ? '1' : '0',
    skuSort: q.sort,
    skuPage: String(q.page),
    skuSize: String(q.size),
  };
  for (const [k, v] of Object.entries(values)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  url.hash = 'sku-prototype';
  return url;
}
// Explicit DEMO collation only. Production collation/null policy must be agreed with BA/BE.
const collator = new Intl.Collator('vi', {
  numeric: true,
  sensitivity: 'accent',
});
export function querySkus(rows: Sku[], q: SkuQuery) {
  const needle = q.q.trim().toLocaleLowerCase('vi');
  const matched = rows.filter(
    (s) =>
      (!needle ||
        `${s.code} ${s.name}`.toLocaleLowerCase('vi').includes(needle)) &&
      (q.type === 'all' || s.type === q.type) &&
      (q.brand === 'all' || s.brand === q.brand) &&
      (q.status === 'all' || s.active === (q.status === 'active')) &&
      (!q.pending || s.pending),
  );
  const [field, order] = q.sort.split('.') as [
    'code' | 'name' | 'min' | 'max',
    'asc' | 'desc',
  ];
  const sorted = [...matched].sort((a, b) => {
    const av = a[field],
      bv = b[field];
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    const diff =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : collator.compare(String(av ?? ''), String(bv ?? ''));
    return (order === 'asc' ? diff : -diff) || collator.compare(a.code, b.code);
  });
  const pages = Math.max(1, Math.ceil(sorted.length / q.size));
  const page = Math.min(q.page, pages);
  return {
    sorted,
    total: sorted.length,
    pages,
    page,
    rows: sorted.slice((page - 1) * q.size, page * q.size),
  };
}
export function emptySku(): Sku {
  return {
    id: '',
    code: '',
    name: '',
    type: 'product',
    brand: '',
    group: '',
    model: '',
    power: '',
    packaging: '',
    unit: 'cái',
    version: 'V1',
    min: null,
    max: null,
    active: true,
    published: false,
    serial: null,
    hasStock: false,
    pending: false,
    revision: 1,
  };
}
export function validateSku(
  s: Sku,
  rows: Sku[],
  models: { value: string; brand: string }[] = SKU_MODELS,
) {
  const errors: Record<string, string> = {};
  if (!s.code.trim()) errors.code = 'Nhập mã SKU mẫu.';
  else if (
    rows.some(
      (r) =>
        r.id !== s.id &&
        r.code.trim().toLowerCase() === s.code.trim().toLowerCase(),
    )
  )
    errors.code = 'Mã đã có trong danh sách DEMO. Hãy dùng mã khác.';
  if (!s.name.trim()) errors.name = 'Nhập tên SKU mẫu.';
  if (
    s.model &&
    !models.some((m) => m.brand === s.brand && m.value === s.model)
  )
    errors.model = 'Model không thuộc Hãng đã chọn.';
  if (s.min !== null && (!Number.isFinite(s.min) || s.min < 0))
    errors.min = 'Tối thiểu phải từ 0 trở lên hoặc để trống.';
  if (
    s.max !== null &&
    (!Number.isFinite(s.max) || s.max < 1 || (s.min !== null && s.max <= s.min))
  )
    errors.max = 'Tối đa phải từ 1 và lớn hơn tối thiểu, hoặc để trống.';
  return errors;
}
export function checkImportFile(file: { name: string; size: number }) {
  if (!/\.(xlsx|xls)$/i.test(file.name)) return 'Chỉ chọn tệp .xlsx hoặc .xls.';
  if (file.size === 0) return 'Tệp rỗng. Vui lòng chọn tệp khác.';
  if (file.size > 10 * 1024 * 1024)
    return 'Tệp vượt 10 MB. Vui lòng giảm dung lượng.';
  return '';
}
