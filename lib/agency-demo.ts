/** Synthetic, session-only recipients. No production records or address directory. */
export const AGENCY_TYPES = [
  { value: 'agency', label: 'Đại lý' },
  { value: 'distributor', label: 'Nhà phân phối' },
  { value: 'project', label: 'Khách công trình' },
  { value: 'retail', label: 'Khách lẻ' },
] as const;
export type AgencyType = (typeof AGENCY_TYPES)[number]['value'];
export type Agency = {
  id: string;
  code: string;
  name: string;
  type: AgencyType | '';
  market: string;
  area: string;
  contact: string;
  phone: string;
  active: boolean;
  legacyAddress: string;
  province: string;
  ward: string;
  street: string;
  version: number;
};
export type AgencyQuery = {
  q: string;
  type: string;
  status: string;
  sort: string;
  page: number;
  size: number;
};
export const AGENCY_DEFAULT: AgencyQuery = {
  q: '',
  type: 'all',
  status: 'all',
  sort: 'code.asc',
  page: 1,
  size: 10,
};
export const AGENCY_SORTS = ['code.asc', 'code.desc', 'name.asc', 'name.desc'];
const LABELS: Record<string, string> = {
  MIEN_BAC: 'Miền Bắc',
  MIEN_TRUNG: 'Miền Trung',
  MIEN_NAM: 'Miền Nam',
  HA_NOI: 'Hà Nội',
  QUANG_NINH: 'Quảng Ninh',
  HO_CHI_MINH: 'Hồ Chí Minh',
  DAK_LAK: 'Đắk Lắk',
};
export const agencyLabel = (value: string) =>
  LABELS[value] || value || 'Chưa có';
export const agencyTypeLabel = (value: string) =>
  AGENCY_TYPES.find((t) => t.value === value)?.label || 'Chưa chọn';
export const DEMO_PROVINCES = ['Tỉnh mẫu A', 'Tỉnh mẫu B'];
export const demoWards = (province: string) =>
  DEMO_PROVINCES.includes(province)
    ? [`Phường mẫu ${province.slice(-1)}1`, `Xã mẫu ${province.slice(-1)}2`]
    : [];
export function emptyAgency(): Agency {
  return {
    id: '',
    code: '',
    name: '',
    type: '',
    market: '',
    area: '',
    contact: '',
    phone: '',
    active: true,
    legacyAddress: '',
    province: '',
    ward: '',
    street: '',
    version: 1,
  };
}
export function createAgencyFixtures(): Agency[] {
  const groups = [
    {
      type: 'agency',
      prefix: 'AG',
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 90, 91],
    },
    { type: 'distributor', prefix: 'NPP', numbers: [1, 2, 3, 4, 90] },
    { type: 'project', prefix: 'KHDA', numbers: [1, 2, 3, 4, 90] },
    { type: 'retail', prefix: 'KHL', numbers: [1, 2, 3, 4, 90] },
  ] as const;
  return groups
    .flatMap((g, gi) =>
      g.numbers.map((n, i) => ({
        ...emptyAgency(),
        id: `demo-${g.prefix}-${n}`,
        code: `DEMO-${g.prefix}-${String(n).padStart(3, '0')}`,
        name: `${agencyTypeLabel(g.type)} mẫu ${String(n).padStart(2, '0')}`,
        type: g.type,
        market: ['MIEN_BAC', 'MIEN_TRUNG', 'MIEN_NAM'][(i + gi) % 3],
        area: ['HA_NOI', 'QUANG_NINH', 'HO_CHI_MINH', 'DAK_LAK'][i % 4],
        contact: `Người liên hệ mẫu ${i + 1}`,
        phone:
          i % 4 === 0 ? '' : `090000${String(gi * 100 + n).padStart(4, '0')}`,
        active: n < 90,
        legacyAddress:
          n >= 90 ? `Số ${n}, đường minh họa, địa chỉ tự do cũ — DEMO` : '',
        province: n >= 90 ? '' : DEMO_PROVINCES[i % 2],
        ward: n >= 90 ? '' : demoWards(DEMO_PROVINCES[i % 2])[0],
        street: n >= 90 ? '' : `Số ${i + 1}, đường minh họa`,
      })),
    )
    .reverse();
}
export function agencyAddress(r: Agency) {
  return (
    r.legacyAddress || [r.street, r.ward, r.province].filter(Boolean).join(', ')
  );
}
export function parseAgencyQuery(search: string): AgencyQuery {
  const p = new URLSearchParams(search);
  const positive = (key: string, fallback: number) => {
    const n = Number(p.get(key));
    return Number.isSafeInteger(n) && n > 0 ? n : fallback;
  };
  return {
    q: p.get('agencyQ') || '',
    type: AGENCY_TYPES.some((t) => t.value === p.get('agencyType'))
      ? p.get('agencyType')!
      : 'all',
    status: ['active', 'inactive'].includes(p.get('agencyStatus') || '')
      ? p.get('agencyStatus')!
      : 'all',
    sort: AGENCY_SORTS.includes(p.get('agencySort') || '')
      ? p.get('agencySort')!
      : 'code.asc',
    page: positive('agencyPage', 1),
    size: [10, 15, 20, 50].includes(positive('agencySize', 10))
      ? positive('agencySize', 10)
      : 10,
  };
}
export function agencyUrl(href: string, q: AgencyQuery) {
  const u = new URL(href);
  for (const [key, value] of Object.entries({
    agencyQ: q.q,
    agencyType: q.type,
    agencyStatus: q.status,
    agencySort: q.sort,
    agencyPage: q.page,
    agencySize: q.size,
  })) {
    if (value === '') u.searchParams.delete(key);
    else u.searchParams.set(key, String(value));
  }
  u.hash = 'agency-prototype';
  return u;
}
export function queryAgencies(records: Agency[], q: AgencyQuery) {
  const collator = new Intl.Collator('vi', {
    numeric: true,
    sensitivity: 'accent',
  });
  const term = q.q.trim().toLocaleLowerCase('vi');
  const [field, direction] = q.sort.split('.') as ['code' | 'name', string];
  const sorted = records
    .filter(
      (r) =>
        (q.type === 'all' || r.type === q.type) &&
        (q.status === 'all' || r.active === (q.status === 'active')) &&
        (!term ||
          `${r.code} ${r.name} ${r.market} ${agencyLabel(r.market)} ${r.area} ${agencyLabel(r.area)}`
            .toLocaleLowerCase('vi')
            .includes(term)),
    )
    .sort(
      (a, b) =>
        (direction === 'desc' ? -1 : 1) *
          collator.compare(a[field], b[field]) || a.id.localeCompare(b.id),
    );
  const pages = Math.max(1, Math.ceil(sorted.length / q.size)),
    page = Math.min(q.page, pages);
  return {
    sorted,
    rows: sorted.slice((page - 1) * q.size, page * q.size),
    total: sorted.length,
    pages,
    page,
  };
}
export function validateAgency(d: Agency, records: Agency[]) {
  const errors: Record<string, string> = {};
  if (!d.code.trim()) errors.code = 'Nhập mã nơi nhận.';
  else if (d.code.length > 50)
    errors.code = 'Mã tối đa 50 ký tự theo form khảo sát.';
  else if (
    records.some(
      (r) =>
        r.id !== d.id &&
        r.code.trim().toLocaleLowerCase('vi') ===
          d.code.trim().toLocaleLowerCase('vi'),
    )
  )
    errors.code = 'Mã đã có trong dữ liệu DEMO.';
  if (!d.name.trim()) errors.name = 'Nhập tên nơi nhận.';
  if (!AGENCY_TYPES.some((t) => t.value === d.type))
    errors.type = 'Chọn loại nơi nhận.';
  for (const [key, max] of Object.entries({
    name: 255,
    market: 120,
    area: 120,
    contact: 200,
    street: 200,
  }))
    if (String(d[key as keyof Agency]).length > max)
      errors[key] = `Tối đa ${max} ký tự theo form khảo sát.`;
  if (d.ward && !demoWards(d.province).includes(d.ward))
    errors.ward = 'Phường/Xã không thuộc Tỉnh mẫu đã chọn.';
  // Do not coerce, trim, truncate or erase phone/legacy values under unapproved rules.
  return errors;
}
export function agencyPendingChanges(initial: Agency, draft: Agency) {
  return (['code', 'type', 'active'] as const).filter(
    (k) => initial[k] !== draft[k],
  );
}
export function prepareAgencySave(initial: Agency, draft: Agency) {
  // Explicit address migration remains preview-only until the source/rule is approved.
  return {
    ...draft,
    id: initial.id,
    legacyAddress: initial.legacyAddress,
    version: initial.version,
  };
}
