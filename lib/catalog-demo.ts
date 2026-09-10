import type { Sku } from './sku-demo';

export const CATALOG_TYPES = [
  'brand',
  'group',
  'model',
  'source',
  'packaging',
] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];
export const CATALOG_LABELS: Record<CatalogType, string> = {
  brand: 'Hãng',
  group: 'Nhóm hàng',
  model: 'Mẫu sản phẩm',
  source: 'Nguồn điện',
  packaging: 'Quy cách đóng gói',
};
export type CatalogRecord = {
  id: string;
  type: CatalogType;
  code: string;
  name: string;
  description: string;
  order: number;
  active: boolean;
  brand: string;
  reference: string;
  revision: number;
};
export type CatalogQuery = {
  type: CatalogType;
  q: string;
  status: string;
  sort: string;
  page: number;
  size: number;
};
export const CATALOG_DEFAULT: CatalogQuery = {
  type: 'brand',
  q: '',
  status: 'all',
  sort: 'code.asc',
  page: 1,
  size: 10,
};
export const CATALOG_SORTS = [
  'code.asc',
  'code.desc',
  'name.asc',
  'name.desc',
  'order.asc',
  'order.desc',
];

/** Synthetic reference records. Counts below are fixture sizes, not production totals. */
export function createCatalogFixtures(
  brands: { value: string; label: string }[],
  models: { value: string; brand: string }[],
): CatalogRecord[] {
  const record = (
    type: CatalogType,
    id: string,
    code: string,
    name: string,
    reference = id,
    brand = '',
    order = 0,
  ): CatalogRecord => ({
    type,
    id: `${type}:${id}`,
    code,
    name,
    reference,
    brand,
    order,
    active: true,
    revision: 1,
    description: `${name} — dữ liệu minh họa, không phải danh mục kho thật.`,
  });
  return [
    ...brands.map((b, i) =>
      record(
        'brand',
        b.value,
        `DEMO-HANG-${b.value.toUpperCase()}`,
        b.label,
        b.value,
        '',
        i * 10,
      ),
    ),
    ...Array.from({ length: 15 }, (_, i) =>
      record(
        'brand',
        `extra-${i + 1}`,
        `DEMO-HANG-${String(i + 1).padStart(2, '0')}`,
        `Hãng thử nghiệm ${i + 1}`,
        `extra-${i + 1}`,
        '',
        i + 3,
      ),
    ),
    record('group', 'parts', 'DEMO-NHOM-PT', 'Phụ tùng', 'Phụ tùng'),
    record(
      'group',
      'equipment',
      'DEMO-NHOM-TB',
      'Thiết bị',
      'Thiết bị',
      '',
      10,
    ),
    ...Array.from({ length: 25 }, (_, i) =>
      record(
        'group',
        `extra-${i + 1}`,
        `DEMO-NHOM-${String(i + 1).padStart(2, '0')}`,
        `Nhóm hàng mẫu ${i + 1}`,
        `Nhóm hàng mẫu ${i + 1}`,
        '',
        i + 20,
      ),
    ),
    ...models.map((m, i) =>
      record(
        'model',
        m.value,
        m.value,
        `Mẫu sản phẩm ${m.value}`,
        m.value,
        m.brand,
        i * 10,
      ),
    ),
    ...Array.from({ length: 15 }, (_, i) =>
      record(
        'model',
        `extra-${i + 1}`,
        `DEMO-MDL-${String(i + 1).padStart(2, '0')}`,
        `Mẫu sản phẩm thử nghiệm ${i + 1}`,
        `DEMO-MDL-${String(i + 1).padStart(2, '0')}`,
        brands[i % brands.length].value,
        i + 60,
      ),
    ),
    ...[
      'Điện lưới trực tiếp',
      'Pin / ắc quy',
      'Dầu diesel',
      'Xăng',
      'Năng lượng mặt trời',
      'Hybrid xăng–điện',
      'Khí nén',
      'Cơ tay',
      'Dầu hỏa',
    ].map((name, i) =>
      record(
        'source',
        String(i + 1),
        `DEMO-NGUON-${String(i + 1).padStart(2, '0')}`,
        `${name} · mẫu`,
        '',
        '',
        i * 10,
      ),
    ),
    record('packaging', 'box', 'DEMO-QC-HOP', '1 cái / hộp', '1 cái / hộp'),
    ...[
      'Nguyên bộ',
      'Chỉ thân máy',
      'Không phụ kiện',
      'Kèm pin và sạc',
      'Bộ phụ tùng',
      'Thùng',
      'Hàng tân trang',
    ].map((name, i) =>
      record(
        'packaging',
        `extra-${i + 1}`,
        `DEMO-QC-${String(i + 1).padStart(2, '0')}`,
        `${name} · mẫu`,
        `${name} · mẫu`,
        '',
        i + 1,
      ),
    ),
  ]
    .map((r, i) => ({
      ...r,
      active: !(r.id.includes('extra-') && i % 7 === 0),
    }))
    .sort((a, b) => b.id.localeCompare(a.id));
}

export function parseCatalogQuery(search: string): CatalogQuery {
  const p = new URLSearchParams(search),
    positive = (key: string, fallback: number) => {
      const n = Number(p.get(key));
      return Number.isSafeInteger(n) && n > 0 ? n : fallback;
    };
  return {
    type: CATALOG_TYPES.includes(p.get('catalogType') as CatalogType)
      ? (p.get('catalogType') as CatalogType)
      : 'brand',
    q: (p.get('catalogQ') || '').slice(0, 200),
    status: ['active', 'inactive'].includes(p.get('catalogStatus') || '')
      ? p.get('catalogStatus')!
      : 'all',
    sort: CATALOG_SORTS.includes(p.get('catalogSort') || '')
      ? p.get('catalogSort')!
      : 'code.asc',
    page: positive('catalogPage', 1),
    size: [10, 15, 20, 50].includes(positive('catalogSize', 10))
      ? positive('catalogSize', 10)
      : 10,
  };
}
export function catalogUrl(href: string, q: CatalogQuery) {
  const url = new URL(href);
  for (const [key, value] of Object.entries({
    catalogType: q.type,
    catalogQ: q.q,
    catalogStatus: q.status,
    catalogSort: q.sort,
    catalogPage: q.page,
    catalogSize: q.size,
  })) {
    if (value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  }
  url.hash = 'catalog-prototype';
  return url;
}
export function queryCatalog(records: CatalogRecord[], q: CatalogQuery) {
  const all = records.filter((r) => r.type === q.type);
  const collator = new Intl.Collator('vi', {
    numeric: true,
    sensitivity: 'accent',
  });
  const [field, direction] = q.sort.split('.') as [
    'code' | 'name' | 'order',
    string,
  ];
  const sorted = all
    .filter(
      (r) =>
        (!q.q.trim() ||
          `${r.code} ${r.name}`
            .toLocaleLowerCase('vi')
            .includes(q.q.trim().toLocaleLowerCase('vi'))) &&
        (q.status === 'all' || r.active === (q.status === 'active')),
    )
    .sort((a, b) => {
      const delta =
        field === 'order'
          ? a.order - b.order
          : collator.compare(a[field], b[field]);
      return (
        (direction === 'desc' ? -delta : delta) ||
        collator.compare(a.code, b.code) ||
        a.id.localeCompare(b.id)
      );
    });
  const pages = Math.max(1, Math.ceil(sorted.length / q.size)),
    page = Math.min(q.page, pages);
  return {
    all: all.length,
    total: sorted.length,
    sorted,
    pages,
    page,
    rows: sorted.slice((page - 1) * q.size, page * q.size),
  };
}
export function referencedSkus(
  record: CatalogRecord,
  skus: Sku[],
): Sku[] | null {
  if (record.type === 'source') return null; // No verified mapping to SKU.power; never report an invented zero.
  const field = {
    brand: 'brand',
    group: 'group',
    model: 'model',
    packaging: 'packaging',
  }[record.type] as keyof Sku;
  return skus.filter((s) => s[field] === record.reference);
}
export function catalogImpact(
  before: CatalogRecord | undefined,
  draft: CatalogRecord,
  records: CatalogRecord[],
  skus: Sku[],
) {
  const references = before ? referencedSkus(before, skus) : [];
  const models =
    before?.type === 'brand'
      ? records.filter(
          (r) => r.type === 'model' && r.brand === before.reference,
        )
      : [];
  const indirect = new Set(
    models.flatMap((m) => referencedSkus(m, skus) || []).map((s) => s.id),
  );
  const direct = new Set((references || []).map((s) => s.id));
  const affected = skus.filter((s) => direct.has(s.id) || indirect.has(s.id));
  const changes: string[] = [];
  if (!before && !draft.active)
    changes.push('Trạng thái khởi tạo Ngừng sử dụng');
  if (!before && draft.order !== 0) changes.push('Thứ tự khởi tạo khác 0');
  if (before && draft.code !== before.code) changes.push('Mã danh mục');
  if (before && draft.type === 'model' && draft.brand !== before.brand)
    changes.push('Hãng của Mẫu sản phẩm');
  if (before && draft.active !== before.active)
    changes.push('Trạng thái sử dụng');
  if (before && draft.order !== before.order) changes.push('Thứ tự hiển thị');
  return { references, models, affected, changes, blocked: changes.length > 0 };
}
export function validateCatalog(
  draft: CatalogRecord,
  records: CatalogRecord[],
) {
  const errors: Record<string, string> = {};
  if (!draft.code.trim()) errors.code = 'Nhập mã danh mục DEMO.';
  else if (draft.code.length > 80) errors.code = 'Mã tối đa 80 ký tự.';
  else if (
    records.some(
      (r) =>
        r.type === draft.type &&
        r.id !== draft.id &&
        r.code.trim().toLowerCase() === draft.code.trim().toLowerCase(),
    )
  )
    errors.code = 'Mã đã có trong danh mục DEMO này.';
  if (!draft.name.trim()) errors.name = 'Nhập tên danh mục.';
  else if (draft.name.length > 200) errors.name = 'Tên tối đa 200 ký tự.';
  if (draft.description.length > 2000)
    errors.description = 'Mô tả tối đa 2.000 ký tự.';
  if (!Number.isFinite(draft.order))
    errors.order = 'Nhập một giá trị số hợp lệ.';
  if (
    draft.type === 'model' &&
    draft.brand &&
    !records.some(
      (r) => r.type === 'brand' && r.reference === draft.brand && r.active,
    )
  )
    errors.brand = 'Chọn Hãng đang sử dụng trong DEMO.';
  return errors;
}
export function emptyCatalog(type: CatalogType): CatalogRecord {
  return {
    id: '',
    type,
    code: '',
    name: '',
    description: '',
    active: true,
    order: 0,
    brand: '',
    reference: '',
    revision: 0,
  };
}
