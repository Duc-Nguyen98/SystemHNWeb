/** Synthetic, session-only defect catalogue. No warranty records or production rules. */
export type Defect = {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
};
export type DefectQuery = {
  q: string;
  status: string;
  sort: string;
  page: number;
  size: number;
};
export const DEFECT_DEFAULT: DefectQuery = {
  q: '',
  status: 'all',
  sort: 'code.asc',
  page: 1,
  size: 10,
};
export const DEFECT_SORTS = [
  { value: 'code.asc', label: 'Mã · tăng dần' },
  { value: 'code.desc', label: 'Mã · giảm dần' },
  { value: 'name.asc', label: 'Tên · A → Z' },
  { value: 'name.desc', label: 'Tên · Z → A' },
];
export const DEFECT_STATUSES = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang sử dụng' },
  { value: 'inactive', label: 'Ngừng sử dụng' },
];
export const defectStatus = (active: boolean) =>
  active ? 'Đang sử dụng' : 'Ngừng sử dụng';
export const emptyDefect = (): Defect => ({
  id: '',
  code: '',
  name: '',
  description: '',
  active: true,
});
export function createDefectFixtures(): Defect[] {
  const names = [
    'Không khởi động',
    'Hoạt động không ổn định',
    'Phát tiếng ồn',
    'Rung bất thường',
    'Rò rỉ',
    'Không nhận nguồn',
    'Nóng bất thường',
    'Thiếu linh kiện',
    'Hỏng công tắc',
    'Hỏng dây dẫn',
    'Vỏ bị nứt',
    'Sai thông số hiển thị',
    'Kẹt bộ phận chuyển động',
    'Phụ kiện không khớp',
    'Hiện tượng cần kiểm tra thêm',
  ];
  const current = names.map((name, i) => ({
    id: `demo-def-${i + 1}`,
    code: `DEMO-DEF-${String(i + 1).padStart(3, '0')}`,
    name: `${name} — mẫu`,
    active: true,
    description:
      i === 0
        ? 'Dữ liệu minh họa: thiết bị không khởi động khi thao tác theo hướng dẫn. Nội dung này chỉ dùng để kiểm tra khả năng đọc mô tả trên tablet, không phải kết luận kỹ thuật hoặc hướng dẫn xử lý bảo hành.\n\nGhi nhận hiện tượng, điều kiện xuất hiện và thông tin kiểm tra do người có chuyên môn cung cấp. Không tự suy ra nguyên nhân, linh kiện cần thay hoặc kết quả bảo hành từ mã danh mục. Mô tả dài phải đọc được bằng chạm và bàn phím mà không cần đưa chuột lên tooltip.'
        : `Mô tả minh họa cho “${name}”. Đây là danh mục DEMO, không phải chẩn đoán kỹ thuật hay kết luận hồ sơ bảo hành.`,
  }));
  const legacy = [
    'Tem nhãn mẫu (ngừng dùng)',
    'Bao bì mẫu (ngừng dùng)',
    'Hiện tượng chưa phân loại mẫu (ngừng dùng)',
  ].map((name, i) => ({
    id: `demo-def-${901 + i}`,
    code: `DEMO-DEF-${901 + i}`,
    name,
    active: false,
    description:
      'Bản ghi DEMO ở trạng thái Ngừng sử dụng. Giữ nguyên hậu tố trong tên; không tự suy ra quan hệ mã thay thế hoặc tác động lên hồ sơ cũ.',
  }));
  return [...current, ...legacy].reverse();
}
export function parseDefectQuery(search: string): DefectQuery {
  const p = new URLSearchParams(search);
  const n = (key: string, fallback: number) => {
    const value = Number(p.get(key));
    return Number.isSafeInteger(value) && value > 0 ? value : fallback;
  };
  return {
    q: p.get('defectQ') || '',
    status: DEFECT_STATUSES.some((s) => s.value === p.get('defectStatus'))
      ? p.get('defectStatus')!
      : 'all',
    sort: DEFECT_SORTS.some((s) => s.value === p.get('defectSort'))
      ? p.get('defectSort')!
      : 'code.asc',
    page: n('defectPage', 1),
    size: [10, 15, 20, 50].includes(n('defectSize', 10))
      ? n('defectSize', 10)
      : 10,
  };
}
export function defectUrl(href: string, query: DefectQuery) {
  const url = new URL(href);
  for (const [key, value] of Object.entries(query)) {
    const param = `defect${key[0].toUpperCase()}${key.slice(1)}`;
    if (value === '') url.searchParams.delete(param);
    else url.searchParams.set(param, String(value));
  }
  url.hash = 'defect-prototype';
  return url;
}
export function queryDefects(records: Defect[], query: DefectQuery) {
  // Explicit DEMO convention, not a production collation/search contract.
  const collator = new Intl.Collator('vi', {
    numeric: true,
    sensitivity: 'accent',
  });
  const term = query.q.trim().toLocaleLowerCase('vi');
  const [field, direction] = query.sort.split('.') as ['code' | 'name', string];
  const sorted = records
    .filter(
      (r) =>
        (query.status === 'all' || r.active === (query.status === 'active')) &&
        (!term || `${r.code} ${r.name}`.toLocaleLowerCase('vi').includes(term)),
    )
    .sort(
      (a, b) =>
        (direction === 'desc' ? -1 : 1) *
          collator.compare(a[field], b[field]) || a.id.localeCompare(b.id),
    );
  const pages = Math.max(1, Math.ceil(sorted.length / query.size));
  const page = Math.max(1, Math.min(query.page, pages));
  return {
    sorted,
    rows: sorted.slice((page - 1) * query.size, page * query.size),
    total: sorted.length,
    pages,
    page,
  };
}
export function validateDefect(draft: Defect, records: Defect[]) {
  const errors: Record<string, string> = {};
  if (!draft.code.trim()) errors.code = 'Nhập mã bệnh / lỗi.';
  else if (draft.code.length > 80)
    errors.code = 'Mã tối đa 80 ký tự theo form khảo sát.';
  else if (
    records.some(
      (r) =>
        r.id !== draft.id &&
        r.code.trim().toLocaleLowerCase('vi') ===
          draft.code.trim().toLocaleLowerCase('vi'),
    )
  )
    errors.code = 'Mã đã có trong dữ liệu DEMO.';
  if (!draft.name.trim()) errors.name = 'Nhập tên bệnh / lỗi.';
  else if (draft.name.length > 200) errors.name = 'Tên tối đa 200 ký tự.';
  if (draft.description.length > 2000)
    errors.description = 'Mô tả tối đa 2.000 ký tự.';
  return errors;
}
export function defectPendingChanges(initial: Defect, draft: Defect) {
  return initial.id
    ? (['code', 'active'] as const).filter((key) => initial[key] !== draft[key])
    : [];
}
export function prepareDefectSave(initial: Defect, draft: Defect) {
  // Block the entire draft rather than silently saving only some fields.
  return defectPendingChanges(initial, draft).length
    ? null
    : { ...draft, id: initial.id };
}
