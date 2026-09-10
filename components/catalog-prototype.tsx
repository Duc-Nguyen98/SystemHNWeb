'use client';
import { MasterDataSearch } from '@/components/master-data-search';
import './master-data-list.css';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  FilterX,
  Layers3,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CATALOG_DEFAULT,
  CATALOG_LABELS,
  CATALOG_TYPES,
  catalogImpact,
  catalogUrl,
  emptyCatalog,
  parseCatalogQuery,
  queryCatalog,
  referencedSkus,
  validateCatalog,
  type CatalogQuery,
  type CatalogRecord,
  type CatalogType,
} from '@/lib/catalog-demo';
import { useMasterDataDemo } from './master-data-demo';
import { SkuBadge, SkuNotice, SkuSelect } from './sku-primitives';
import './catalog-prototype.css';

const icons = {
  brand: Building2,
  group: Boxes,
  model: Layers3,
  source: Zap,
  packaging: Package,
};
type CatalogAction = {
  kind: 'form' | 'detail' | 'rules';
  type: CatalogType;
  record?: CatalogRecord;
};

function ReferenceList({ record }: { record: CatalogRecord }) {
  const { skus } = useMasterDataDemo();
  const refs = referencedSkus(record, skus);
  if (refs === null)
    return (
      <SkuNotice tone="warning">
        Chưa xác định liên kết Nguồn điện ↔ SKU. Không lấy “Công suất” để tính
        số tham chiếu và không hiển thị số 0 thay cho dữ liệu chưa biết.
      </SkuNotice>
    );
  return (
    <details className="hn-cat-references">
      <summary>
        <Link2 /> {refs.length} SKU tham chiếu trực tiếp · DEMO <ChevronRight />
      </summary>
      <div className="hn-cat-ref-body">
        {refs.length ? (
          <ul>
            {refs.map((s) => (
              <li key={s.id}>
                <strong>{s.code}</strong>
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Chưa có SKU nào trong bộ dữ liệu DEMO đang tham chiếu bản ghi này.
          </p>
        )}
      </div>
    </details>
  );
}

function CatalogForm({
  record,
  type,
  onDirty,
  onBusy,
  onClose,
  onSaved,
}: {
  record?: CatalogRecord;
  type: CatalogType;
  onDirty: (v: boolean) => void;
  onBusy: (v: boolean) => void;
  onClose: () => void;
  onSaved: (r: CatalogRecord) => void;
}) {
  const { catalogs, skus, brands, brandName, saveCatalog } =
    useMasterDataDemo();
  const [initial] = useState(() =>
    record ? { ...record } : emptyCatalog(type),
  );
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false),
    guard = useRef(false);
  const [outcome, setOutcome] = useState('success');
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [review, setReview] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const impact = catalogImpact(record, draft, catalogs, skus);
  const used = impact.affected.length > 0 || impact.models.length > 0;
  const change = (patch: Partial<CatalogRecord>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setReview(false);
    setMessage('');
    onDirty(JSON.stringify(next) !== JSON.stringify(initial));
    setErrors((old) =>
      Object.fromEntries(
        Object.entries(old).filter(([key]) => !(key in patch)),
      ),
    );
  };
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guard.current || conflict) return;
    const issues = validateCatalog(draft, catalogs);
    setErrors(issues);
    if (Object.keys(issues).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    if (impact.blocked) {
      setReview(true);
      return;
    }
    guard.current = true;
    setBusy(true);
    onBusy(true);
    setMessage('');
    await new Promise((resolve) => setTimeout(resolve, 500));
    guard.current = false;
    setBusy(false);
    onBusy(false);
    if (outcome === 'error') {
      setMessage(
        'Chưa lưu được dữ liệu DEMO. Nội dung đã nhập được giữ nguyên; chọn kịch bản Thành công rồi thử lại.',
      );
      return;
    }
    if (outcome === 'conflict') {
      setConflict(true);
      setMessage(
        'Mô phỏng xung đột phiên. Chưa ghi dữ liệu; đọc lại bản DEMO hiện tại để kiểm tra trước khi lưu lại.',
      );
      return;
    }
    const saved = saveCatalog(draft);
    if (!saved) {
      setMessage(
        'Chưa thể áp dụng thay đổi này. Kiểm tra dữ liệu hoặc phần tác động chờ BA/PO.',
      );
      return;
    }
    onDirty(false);
    onSaved(saved);
  }
  const field = (
    key: 'code' | 'name' | 'order',
    label: string,
    maxLength?: number,
  ) => (
    <div className="hn-cat-field">
      <label htmlFor={`cat-form-${key}`}>
        {label}
        {key === 'code' && used && <LockKeyhole aria-hidden="true" />}
      </label>
      <Input
        id={`cat-form-${key}`}
        value={
          key === 'order' && !Number.isFinite(draft.order) ? '' : draft[key]
        }
        type={key === 'order' ? 'number' : 'text'}
        step={key === 'order' ? 'any' : undefined}
        maxLength={maxLength}
        disabled={busy || (key === 'code' && used)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `cat-error-${key}` : `cat-help-${key}`}
        onChange={(e) =>
          change({
            [key]:
              key === 'order'
                ? e.target.value === ''
                  ? NaN
                  : Number(e.target.value)
                : e.target.value,
          })
        }
      />
      {errors[key] ? (
        <p className="hn-cat-error" id={`cat-error-${key}`} role="alert">
          {errors[key]}
        </p>
      ) : (
        <p className="hn-cat-help" id={`cat-help-${key}`}>
          {key === 'code'
            ? used
              ? `Khóa trong DEMO: ${impact.affected.length} SKU liên quan${impact.models.length ? ` và ${impact.models.length} Model` : ''}.`
              : 'Tối đa 80 ký tự. Kiểm tra trùng không phân biệt hoa/thường chỉ là quy tắc DEMO.'
            : key === 'name'
              ? 'Tối đa 200 ký tự.'
              : 'Nhập số; ý nghĩa 0, phạm vi và ưu tiên nghiệp vụ đang chờ BA/PO. Đổi thứ tự chỉ xem trước.'}
        </p>
      )}
    </div>
  );
  return (
    <form ref={form} onSubmit={submit} noValidate className="hn-cat-form">
      <div className="hn-cat-modal-body">
        <div className="hn-cat-demo-note">
          Chỉ lưu DEMO trong lượt xem. Tải lại trang sẽ khôi phục dữ liệu mẫu.
        </div>
        {message && <SkuNotice tone="error">{message}</SkuNotice>}
        {conflict && (
          <div className="hn-cat-conflict">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const latest = catalogs.find((r) => r.id === draft.id);
                if (latest)
                  setDraft((old) => ({ ...old, revision: latest.revision }));
                setConflict(false);
                setOutcome('success');
                setMessage(
                  'Đã đọc lại dữ liệu DEMO hiện tại và kết thúc kịch bản xung đột. Nội dung bạn nhập được giữ lại; kiểm tra rồi bấm Lưu lại.',
                );
              }}
            >
              Tải bản mới · giữ nội dung nhập
            </Button>
          </div>
        )}
        <fieldset disabled={busy} className="hn-cat-form-grid">
          <legend className="sr-only">Thông tin {CATALOG_LABELS[type]}</legend>
          {field('code', 'Mã · bắt buộc trong DEMO', 80)}
          {field('name', 'Tên · bắt buộc', 200)}
          {type === 'model' && (
            <div className="hn-cat-full">
              <SkuSelect
                id="cat-form-brand"
                label="Hãng của Mẫu sản phẩm"
                value={draft.brand || 'unset'}
                options={[
                  { value: 'unset', label: 'Chưa chọn Hãng' },
                  ...brands.filter((b) => b.active || b.value === draft.brand),
                ]}
                onChange={(v) => change({ brand: v === 'unset' ? '' : v })}
                disabled={busy}
              />
              <p className="hn-cat-help">
                Dùng chung danh mục Hãng với SKU; chỉ chọn Hãng đang sử dụng.
                Hãng có bắt buộc hay không: chờ BA/PO.
              </p>
              {errors.brand && (
                <p className="hn-cat-error" role="alert">
                  {errors.brand}
                </p>
              )}
            </div>
          )}
          <div className="hn-cat-field hn-cat-full">
            <label htmlFor="cat-form-description">Mô tả</label>
            <Textarea
              id="cat-form-description"
              value={draft.description}
              maxLength={2000}
              aria-invalid={!!errors.description}
              aria-describedby="cat-description-count"
              onChange={(e) => change({ description: e.target.value })}
            />
            <p id="cat-description-count" className="hn-cat-counter">
              {draft.description.length.toLocaleString('vi')} / 2.000 ký tự
            </p>
          </div>
          {field('order', 'Thứ tự hiển thị')}
          <div>
            <SkuSelect
              id="cat-form-status"
              label="Trạng thái"
              value={draft.active ? 'active' : 'inactive'}
              options={[
                { value: 'active', label: 'Đang sử dụng' },
                { value: 'inactive', label: 'Ngừng sử dụng' },
              ]}
              onChange={(v) => change({ active: v === 'active' })}
              disabled={busy}
            />
            <p className="hn-cat-help">
              Không tự ngừng Model hoặc SKU liên quan. Thay đổi trạng thái hiện
              chỉ xem trước.
            </p>
          </div>
        </fieldset>
        {record && <ReferenceList record={record} />}
        {record?.type === 'brand' && (
          <p className="hn-cat-help">
            {impact.models.length} Mẫu sản phẩm thuộc Hãng này ·{' '}
            {impact.affected.length} SKU liên quan duy nhất, đã loại trùng tham
            chiếu trực tiếp/qua Model.
          </p>
        )}
        {review && (
          <section
            className="hn-cat-impact"
            aria-label="Xem trước tác động"
            tabIndex={-1}
            ref={(e) => {
              if (e) e.focus();
            }}
          >
            <h3>
              <ShieldAlert /> Chưa áp dụng — cần BA/PO xác nhận
            </h3>
            <p>
              Thay đổi đang yêu cầu:{' '}
              <strong>{impact.changes.join(', ')}</strong>.
            </p>
            <dl>
              {record && draft.code !== record.code && (
                <div>
                  <dt>Mã</dt>
                  <dd>
                    {record.code} → {draft.code}
                  </dd>
                </div>
              )}
              {record && draft.brand !== record.brand && (
                <div>
                  <dt>Hãng</dt>
                  <dd>
                    {brandName(record.brand)} → {brandName(draft.brand)}
                  </dd>
                </div>
              )}
              {record && draft.active !== record.active && (
                <div>
                  <dt>Trạng thái</dt>
                  <dd>
                    {record.active ? 'Đang sử dụng' : 'Ngừng sử dụng'} →{' '}
                    {draft.active ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                  </dd>
                </div>
              )}
              {record && draft.order !== record.order && (
                <div>
                  <dt>Thứ tự</dt>
                  <dd>
                    {record.order} → {draft.order}
                  </dd>
                </div>
              )}
              <div>
                <dt>SKU liên quan · DEMO</dt>
                <dd>
                  {impact.references === null
                    ? 'Chưa xác định liên kết'
                    : impact.affected.length}
                </dd>
              </div>
            </dl>
            <p>
              Chưa chốt ảnh hưởng tới SKU hiện tại, lựa chọn cho SKU mới, Model
              con và ứng dụng phân vùng. Không tự cập nhật bản ghi liên quan, kể
              cả khi số tham chiếu bằng 0.
            </p>
            <Button type="button" disabled>
              Áp dụng — chờ BA/PO
            </Button>
          </section>
        )}
        <div className="hn-cat-scenario">
          <SkuSelect
            id="cat-form-outcome"
            label="Kết quả lưu DEMO"
            value={outcome}
            disabled={busy || conflict}
            options={[
              { value: 'success', label: 'Thành công' },
              { value: 'error', label: 'Lỗi lưu' },
              { value: 'conflict', label: 'Xung đột phiên' },
            ]}
            onChange={setOutcome}
          />
        </div>
      </div>
      <div className="hn-cat-modal-footer">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onClose}
        >
          Hủy / quay lại
        </Button>
        <Button type="submit" disabled={busy || conflict}>
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" /> Đang lưu…
            </>
          ) : impact.blocked ? (
            'Xem trước tác động'
          ) : (
            'Lưu danh mục · DEMO'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function CatalogPrototype() {
  const { catalogs, skus, brandName } = useMasterDataDemo();
  const [query, setQuery] = useState<CatalogQuery>(CATALOG_DEFAULT),
    queryRef = useRef(query);
  const [search, setSearch] = useState(''),
    [hydrated, setHydrated] = useState(false);
  const [scene, setScene] = useState('ready');
  const [action, setAction] = useState<CatalogAction | null>(null),
    actionRef = useRef(action);
  const [dirty, setDirty] = useState(false),
    dirtyRef = useRef(false),
    [busy, setBusy] = useState(false),
    busyRef = useRef(false);
  const [confirmLeave, setConfirmLeave] = useState(false),
    [notice, setNotice] = useState<CatalogRecord | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null),
    currentHref = useRef(''),
    pendingNavigation = useRef<(() => void) | null>(null);
  const savedViews = useRef<Partial<Record<CatalogType, CatalogQuery>>>({});
  useEffect(() => {
    queryRef.current = query;
    actionRef.current = action;
    dirtyRef.current = dirty;
    busyRef.current = busy;
  }, [query, action, dirty, busy]);
  useEffect(() => {
    let mounted = true;
    const sync = () => {
      const q = parseCatalogQuery(location.search);
      queryRef.current = q;
      savedViews.current[q.type] = q;
      setQuery(q);
      setSearch(q.q);
      currentHref.current = location.href;
    };
    queueMicrotask(() => {
      if (mounted) {
        sync();
        setHydrated(true);
      }
    });
    const pop = () => {
      if (actionRef.current && (dirtyRef.current || busyRef.current)) {
        const destination = location.href;
        history.pushState(history.state, '', currentHref.current);
        if (!busyRef.current) {
          pendingNavigation.current = () => {
            history.replaceState(history.state, '', destination);
            sync();
            setAction(null);
          };
          setConfirmLeave(true);
        }
      } else {
        setAction(null);
        sync();
      }
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || busyRef.current) e.preventDefault();
    };
    window.addEventListener('hn:prototype-history', pop);
    window.addEventListener('beforeunload', unload);
    return () => {
      mounted = false;
      window.removeEventListener('hn:prototype-history', pop);
      window.removeEventListener('beforeunload', unload);
    };
  }, []);
  function update(patch: Partial<CatalogQuery>, replace = false) {
    const q = { ...queryRef.current, ...patch };
    queryRef.current = q;
    savedViews.current[q.type] = q;
    const url = catalogUrl(location.href, q);
    history[replace ? 'replaceState' : 'pushState'](history.state, '', url);
    currentHref.current = url.href;
    setQuery(q);
    if (patch.q !== undefined) setSearch(q.q);
  }
  useEffect(() => {
    if (!hydrated || search === query.q) return;
    const timer = setTimeout(() => update({ q: search, page: 1 }), 320);
    return () => clearTimeout(timer);
  }, [search, query.q, hydrated]);
  const result = useMemo(
    () =>
      queryCatalog(
        scene === 'empty'
          ? catalogs.filter((r) => r.type !== query.type)
          : catalogs,
        query,
      ),
    [catalogs, query, scene],
  );
  useEffect(() => {
    if (hydrated && scene !== 'empty' && query.page !== result.page)
      update({ page: result.page }, true);
  }, [hydrated, scene, query.page, result.page]);
  const readonly = scene === 'readonly',
    loading = scene === 'loading' || !hydrated;
  const open = (next: CatalogAction) => {
    returnFocus.current = document.activeElement as HTMLElement;
    currentHref.current = location.href;
    setAction(next);
    setDirty(false);
    setBusy(false);
  };
  const close = () => {
    if (busy) return;
    if (dirty) {
      pendingNavigation.current = null;
      setConfirmLeave(true);
    } else setAction(null);
  };
  function changePage(page: number) {
    update({ page });
    requestAnimationFrame(() => {
      const table = document.getElementById(
        `catalog-results-${queryRef.current.type}`,
      );
      table?.focus({ preventScroll: true });
      table?.scrollIntoView({ block: 'start' });
    });
  }
  const clear = () => {
    setScene('ready');
    update({ q: '', status: 'all', page: 1 });
  };
  const sortHeader = (label: string, field: string, className = '') => {
    const selected = query.sort.startsWith(`${field}.`),
      desc = query.sort.endsWith('.desc');
    return (
      <TableHead
        scope="col"
        className={className}
        aria-sort={selected ? (desc ? 'descending' : 'ascending') : 'none'}
      >
        <button
          aria-label={`Sắp xếp ${label}: ${selected ? (desc ? 'giảm dần' : 'tăng dần') : 'chưa chọn'}`}
          onClick={() =>
            update({
              sort: `${field}.${selected && !desc ? 'desc' : 'asc'}`,
              page: 1,
            })
          }
        >
          {label}
          {selected ? desc ? <ArrowDown /> : <ArrowUp /> : <ArrowUpDown />}
        </button>
      </TableHead>
    );
  };
  const Icon = icons[query.type];
  return (
    <section
      className="hn-sku hn-cat hn-master-list content-section"
      id="catalog-prototype"
      aria-labelledby="catalog-heading"
    >
      <div className="hn-cat-heading">
        <div className="hn-cat-heading-icon">
          <Boxes />
        </div>
        <div>
          <span className="hn-cat-eyebrow">
            PROTOTYPE / DANH MỤC / MST-CAT-01
          </span>
          <h2 id="catalog-heading">Danh mục sản phẩm</h2>
          <p>Danh mục tham chiếu dùng khi tạo và sửa SKU.</p>
        </div>
        <SkuBadge tone="purple">DEMO · Tablet+</SkuBadge>
      </div>
      <div className="hn-cat-scope">
        <span>
          Dữ liệu minh họa · Không kết nối kho thật · Tải lại để khôi phục mẫu
        </span>
        <Button
          variant="ghost"
          onClick={() => open({ kind: 'rules', type: query.type })}
        >
          <CircleHelp /> Phạm vi & điểm chờ chốt
        </Button>
      </div>
      {notice && (
        <output className="hn-cat-success">
          <span>
            Đã lưu <strong>{notice.code}</strong> · {notice.name} trong DEMO.
          </span>
          <Button
            variant="ghost"
            onClick={() =>
              open({ kind: 'detail', type: notice.type, record: notice })
            }
          >
            Xem bản ghi <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            aria-label="Đóng thông báo danh mục"
            onClick={() => setNotice(null)}
          >
            <X />
          </Button>
        </output>
      )}
      <div className="hn-cat-card">
        <Tabs
          value={query.type}
          onValueChange={(v) => {
            const type = v as CatalogType;
            update(savedViews.current[type] || { ...CATALOG_DEFAULT, type });
            setScene('ready');
          }}
        >
          <TabsList className="hn-cat-tabs" aria-label="Loại danh mục">
            {CATALOG_TYPES.map((type) => {
              const TabIcon = icons[type];
              return (
                <TabsTrigger key={type} value={type}>
                  <TabIcon />
                  {CATALOG_LABELS[type]}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {CATALOG_TYPES.map((type) => (
            <TabsContent key={type} value={type} className="hn-cat-panel">
              <div className="hn-list-heading">
                <div>
                  <h3>
                    {CATALOG_LABELS[type]} <span>{result.all}</span>
                  </h3>
                  <p>Toàn bộ dữ liệu DEMO</p>
                </div>
                {!readonly && (
                  <Button
                    disabled={loading || scene === 'error'}
                    onClick={() => open({ kind: 'form', type })}
                  >
                    <Plus /> Tạo {CATALOG_LABELS[type].toLocaleLowerCase('vi')}
                  </Button>
                )}
              </div>
              {(type === 'source' || type === 'model') && (
                <div className="hn-cat-terminology">
                  {type === 'source'
                    ? 'Giữ nhãn “Nguồn điện”. Chưa xác nhận quan hệ với “Công suất” trên SKU; không quy đổi hoặc tính số tham chiếu từ trường này.'
                    : 'Giữ nhãn “Mẫu sản phẩm”; đối chiếu trường Model trên SKU. Tên dùng chung chính thức đang chờ BA/PO.'}
                </div>
              )}
              <div className="hn-cat-toolbar">
                <MasterDataSearch
                  id={`cat-search-${type}`}
                  label={`Tìm mã / tên ${CATALOG_LABELS[type].toLocaleLowerCase('vi')}`}
                  value={search}
                  placeholder="Nhập mã hoặc tên…"
                  onChange={setSearch}
                  onSubmit={() => update({ q: search, page: 1 })}
                  onClear={() => update({ q: '', page: 1 })}
                />
                <SkuSelect
                  id={`cat-status-${type}`}
                  label="Trạng thái danh mục"
                  value={query.status}
                  options={[
                    { value: 'all', label: 'Tất cả trạng thái' },
                    { value: 'active', label: 'Đang sử dụng' },
                    { value: 'inactive', label: 'Ngừng sử dụng' },
                  ]}
                  onChange={(status) => update({ status, page: 1 })}
                />
                <SkuSelect
                  id={`cat-sort-${type}`}
                  label="Sắp xếp danh mục"
                  value={query.sort}
                  options={[
                    { value: 'code.asc', label: 'Mã · tăng dần' },
                    { value: 'code.desc', label: 'Mã · giảm dần' },
                    { value: 'name.asc', label: 'Tên · A → Z' },
                    { value: 'name.desc', label: 'Tên · Z → A' },
                    { value: 'order.asc', label: 'Thứ tự · tăng dần' },
                    { value: 'order.desc', label: 'Thứ tự · giảm dần' },
                  ]}
                  onChange={(sort) => update({ sort, page: 1 })}
                />
              </div>
              <div className="hn-cat-results" aria-live="polite">
                <span>
                  {loading ? (
                    'Đang tải danh mục mẫu…'
                  ) : scene === 'error' ? (
                    'Chưa xác định kết quả — tải dữ liệu thất bại'
                  ) : (
                    <>
                      <strong>{result.total}</strong> kết quả{' '}
                      <span className="hn-cat-help">
                        / {result.all} bản ghi DEMO
                      </span>
                    </>
                  )}
                </span>
                {(query.q || query.status !== 'all') && (
                  <Button variant="ghost" onClick={clear}>
                    <FilterX /> Xóa điều kiện
                  </Button>
                )}
                <span className="hn-cat-scroll-help">
                  Cuộn ngang · Mã/Tên và Hành động cố định
                </span>
              </div>
              {loading ? (
                <div className="hn-cat-empty" aria-busy="true">
                  <div className="hn-cat-skeletons">
                    {[1, 2, 3, 4].map((n) => (
                      <Skeleton key={n} className="hn-cat-skeleton" />
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => setScene('ready')}>
                    Hoàn tất tải DEMO
                  </Button>
                </div>
              ) : scene === 'error' ? (
                <div className="hn-cat-empty" role="alert">
                  <ShieldAlert />
                  <h3>
                    Không tải được{' '}
                    {CATALOG_LABELS[type].toLocaleLowerCase('vi')}
                  </h3>
                  <p>
                    Không thể kết luận danh mục rỗng. Từ khóa và bộ lọc của bạn
                    vẫn được giữ.
                  </p>
                  <Button onClick={() => setScene('ready')}>Thử lại</Button>
                </div>
              ) : !result.all ? (
                <div className="hn-cat-empty">
                  <Icon />
                  <h3>
                    Chưa có {CATALOG_LABELS[type].toLocaleLowerCase('vi')}
                  </h3>
                  <p>
                    Đây là kịch bản danh mục chưa có dữ liệu DEMO. Tạo bản ghi
                    sẽ bổ sung vào bộ dữ liệu mẫu và kết thúc kịch bản rỗng.
                  </p>
                  <div>
                    <Button
                      onClick={() => {
                        open({ kind: 'form', type });
                      }}
                    >
                      Tạo bản ghi DEMO
                    </Button>
                    <Button variant="outline" onClick={() => setScene('ready')}>
                      Về dữ liệu mẫu
                    </Button>
                  </div>
                </div>
              ) : !result.total ? (
                <div className="hn-cat-empty">
                  <Search />
                  <h3>Không có kết quả phù hợp</h3>
                  <p>
                    {query.q
                      ? `Không tìm thấy “${query.q}”`
                      : 'Không có bản ghi'}
                    {query.status !== 'all'
                      ? ` với trạng thái ${query.status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng'}`
                      : ''}
                    . Danh mục vẫn có {result.all} bản ghi DEMO.
                  </p>
                  <Button variant="outline" onClick={clear}>
                    Xóa điều kiện tìm / lọc
                  </Button>
                </div>
              ) : (
                <div
                  className="hn-cat-table-wrap"
                  id={`catalog-results-${type}`}
                  tabIndex={-1}
                  aria-label="Kết quả danh mục"
                >
                  <Table
                    className={`hn-cat-table ${type === 'model' ? 'hn-cat-model-table' : ''}`}
                  >
                    <TableCaption className="sr-only">
                      {CATALOG_LABELS[type]} mẫu. Lọc rồi sắp xếp toàn tập trước
                      phân trang. STT theo vị trí kết quả, khác Thứ tự hiển thị.
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col" className="hn-cat-stt">
                          STT
                        </TableHead>
                        {sortHeader('Mã / Tên', 'code', 'hn-cat-identity')}
                        {type === 'model' && (
                          <TableHead scope="col" className="hn-cat-brand-col">
                            Hãng
                          </TableHead>
                        )}
                        <TableHead
                          scope="col"
                          className="hn-cat-description-col"
                        >
                          Mô tả
                        </TableHead>
                        {sortHeader('Thứ tự', 'order', 'hn-cat-order')}
                        <TableHead scope="col" className="hn-cat-usage-col">
                          SKU tham chiếu
                        </TableHead>
                        <TableHead scope="col" className="hn-cat-status-col">
                          Trạng thái
                        </TableHead>
                        <TableHead scope="col" className="hn-cat-action-col">
                          Hành động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((r, index) => {
                        const refs = referencedSkus(r, skus);
                        return (
                          <TableRow
                            key={r.id}
                            data-highlight={notice?.id === r.id}
                          >
                            <TableCell className="hn-cat-stt">
                              {(result.page - 1) * query.size + index + 1}
                            </TableCell>
                            <TableCell className="hn-cat-identity">
                              <button
                                className="hn-cat-record"
                                onClick={() =>
                                  open({ kind: 'detail', type, record: r })
                                }
                              >
                                <strong>{r.code}</strong>
                                <span>{r.name}</span>
                              </button>
                            </TableCell>
                            {type === 'model' && (
                              <TableCell>
                                {r.brand ? (
                                  brandName(r.brand)
                                ) : (
                                  <span className="hn-cat-help">Chưa gán</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell>
                              <button
                                className="hn-cat-description"
                                aria-label={`Đọc đầy đủ ${r.code}`}
                                onClick={() =>
                                  open({ kind: 'detail', type, record: r })
                                }
                              >
                                {r.description || 'Chưa có mô tả'}
                              </button>
                            </TableCell>
                            <TableCell className="hn-cat-order">
                              {r.order}
                            </TableCell>
                            <TableCell>
                              {refs === null ? (
                                <span className="hn-cat-help">
                                  Chưa xác định
                                </span>
                              ) : (
                                <button
                                  className={`hn-cat-usage ${refs.length ? 'has-usage' : ''}`}
                                  aria-label={`Xem ${refs.length} SKU tham chiếu ${r.code}`}
                                  onClick={() =>
                                    open({ kind: 'detail', type, record: r })
                                  }
                                >
                                  <Link2 />
                                  {refs.length}
                                  <span>SKU</span>
                                </button>
                              )}
                            </TableCell>
                            <TableCell>
                              <SkuBadge tone={r.active ? 'green' : 'muted'}>
                                {r.active ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                              </SkuBadge>
                            </TableCell>
                            <TableCell className="hn-cat-action-col">
                              <fieldset
                                className="hn-sku-row-actions"
                                aria-label={`Hành động ${r.code}`}
                              >
                                <Button
                                  variant="outline"
                                  aria-label={`Xem ${r.code}`}
                                  onClick={() =>
                                    open({ kind: 'detail', type, record: r })
                                  }
                                >
                                  <Eye /> Xem
                                </Button>
                                {!readonly && (
                                  <Button
                                    variant="ghost"
                                    className="hn-sku-edit-action"
                                    aria-label={`Sửa ${r.code}`}
                                    onClick={() =>
                                      open({ kind: 'form', type, record: r })
                                    }
                                  >
                                    <Pencil /> Sửa
                                  </Button>
                                )}
                              </fieldset>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="hn-cat-pagination">
                <SkuSelect
                  id={`cat-size-${type}`}
                  label="Dòng / trang danh mục"
                  value={String(query.size)}
                  options={[10, 15, 20, 50].map((n) => ({
                    value: String(n),
                    label: String(n),
                  }))}
                  onChange={(size) => update({ size: Number(size), page: 1 })}
                />
                <span>
                  {loading || scene === 'error'
                    ? '—'
                    : result.total
                      ? `${(result.page - 1) * query.size + 1}–${Math.min(result.page * query.size, result.total)} / ${result.total}`
                      : '0 kết quả'}
                </span>
                <Pagination aria-label="Phân trang danh mục">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        disabled={
                          loading || scene === 'error' || result.page === 1
                        }
                        aria-label="Trang danh mục trước"
                        onClick={() => changePage(result.page - 1)}
                      >
                        <ChevronLeft />
                      </Button>
                    </PaginationItem>
                    {Array.from({ length: result.pages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === result.pages ||
                          Math.abs(p - result.page) <= 1,
                      )
                      .map((p, i, list) => (
                        <PaginationItem key={p}>
                          {i > 0 && p - list[i - 1] > 1 && <span>…</span>}
                          <Button
                            disabled={loading || scene === 'error'}
                            variant={p === result.page ? 'default' : 'outline'}
                            aria-label={`Trang danh mục ${p}`}
                            aria-current={
                              p === result.page ? 'page' : undefined
                            }
                            onClick={() => changePage(p)}
                          >
                            {p}
                          </Button>
                        </PaginationItem>
                      ))}
                    <PaginationItem>
                      <Button
                        variant="outline"
                        disabled={
                          loading ||
                          scene === 'error' ||
                          result.page === result.pages
                        }
                        aria-label="Trang danh mục sau"
                        onClick={() => changePage(result.page + 1)}
                      >
                        <ChevronRight />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <div className="hn-cat-test">
        <SkuSelect
          id="cat-scene"
          label="Kiểm thử danh mục DEMO"
          value={scene}
          options={[
            { value: 'ready', label: 'Có dữ liệu' },
            { value: 'loading', label: 'Đang tải' },
            { value: 'empty', label: 'Chưa có dữ liệu gốc' },
            { value: 'error', label: 'Lỗi tải dữ liệu' },
            { value: 'readonly', label: 'Chỉ đọc' },
          ]}
          onChange={setScene}
        />
        <p>
          STT là vị trí trong kết quả. “Thứ tự” là giá trị danh mục; ý nghĩa
          nghiệp vụ chưa chốt.
        </p>
      </div>
      <Dialog
        open={!!action}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent
          className="hn-sku hn-cat-modal"
          showCloseButton={false}
          finalFocus={returnFocus}
        >
          <header className="hn-cat-modal-header">
            <div>
              <span className="hn-cat-eyebrow">DANH MỤC · DEMO</span>
              <DialogTitle>
                {action?.kind === 'rules'
                  ? 'Phạm vi & điểm chờ BA/PO'
                  : `${action?.kind === 'form' ? (action.record ? 'Sửa' : 'Tạo') : 'Chi tiết'} ${CATALOG_LABELS[action?.type || query.type].toLocaleLowerCase('vi')}`}
              </DialogTitle>
              <DialogDescription>
                {action?.record
                  ? `${action.record.code} · ${action.record.name}`
                  : 'Không tạo hoặc sửa dữ liệu trong hệ thống kho thật.'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              aria-label="Đóng cửa sổ danh mục"
              disabled={busy}
              onClick={close}
            >
              <X />
            </Button>
          </header>
          {action?.kind === 'form' && (
            <CatalogForm
              key={action.record?.id || `new-${action.type}`}
              record={action.record}
              type={action.type}
              onDirty={setDirty}
              onBusy={setBusy}
              onClose={close}
              onSaved={(record) => {
                setDirty(false);
                setScene('ready');
                setNotice(record);
                setAction({ kind: 'detail', type: record.type, record });
              }}
            />
          )}
          {action?.kind === 'detail' && action.record && (
            <>
              <div className="hn-cat-modal-body">
                <SkuBadge tone={action.record.active ? 'green' : 'muted'}>
                  {action.record.active ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                </SkuBadge>
                <dl className="hn-cat-detail">
                  <div>
                    <dt>Mã</dt>
                    <dd>{action.record.code}</dd>
                  </div>
                  <div>
                    <dt>Tên</dt>
                    <dd>{action.record.name}</dd>
                  </div>
                  {action.type === 'model' && (
                    <div>
                      <dt>Hãng</dt>
                      <dd>{brandName(action.record.brand)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Thứ tự hiển thị</dt>
                    <dd>{action.record.order}</dd>
                  </div>
                  <div>
                    <dt>Mô tả đầy đủ</dt>
                    <dd>{action.record.description || 'Chưa có mô tả'}</dd>
                  </div>
                </dl>
                <ReferenceList record={action.record} />
                {action.type === 'brand' && (
                  <p className="hn-cat-help">
                    {
                      catalogs.filter(
                        (r) =>
                          r.type === 'model' &&
                          r.brand === action.record?.reference,
                      ).length
                    }{' '}
                    Mẫu sản phẩm trực thuộc · dữ liệu DEMO.
                  </p>
                )}
              </div>
              <div className="hn-cat-modal-footer">
                <Button variant="outline" onClick={close}>
                  Đóng chi tiết
                </Button>
                {!readonly && (
                  <Button
                    onClick={() => setAction({ ...action, kind: 'form' })}
                  >
                    <Pencil /> Sửa danh mục
                  </Button>
                )}
              </div>
            </>
          )}
          {action?.kind === 'rules' && (
            <>
              <div className="hn-cat-modal-body hn-cat-rules">
                <h3>Đã triển khai trong prototype</h3>
                <p>
                  5 danh mục, form Tạo/Sửa, STT, lọc → sắp xếp toàn tập → phân
                  trang, trạng thái URL và dữ liệu DEMO dùng chung với SKU. Mỗi
                  tab nhớ điều kiện trong lượt xem; URL khôi phục tab đang xem
                  khi tải lại.
                </p>
                <h3>Chưa được tự quyết định</h3>
                <ul>
                  <li>Thuật ngữ Mẫu sản phẩm/Model và Nguồn điện/Công suất.</li>
                  <li>
                    Đổi mã, đổi Hãng của Model, ngừng/kích hoạt lại và ý nghĩa
                    Thứ tự hiển thị: chỉ xem trước, không áp dụng.
                  </li>
                  <li>
                    Không tự động đổi trạng thái Model/SKU, không xóa, gộp hay
                    nhập/xuất hàng loạt.
                  </li>
                  <li>
                    Nguồn điện chưa có ánh xạ tới SKU. “Chưa xác định” không
                    phải 0.
                  </li>
                </ul>
                <h3>Quy tắc kỹ thuật DEMO</h3>
                <p>
                  Mã/Tên có giá trị; giới hạn 80/200/2.000 ký tự theo form khảo
                  sát. Kiểm tra trùng mã không phân biệt hoa/thường; sort dùng
                  so sánh tiếng Việt có xét số, giữ dấu. Thứ tự nhận số hữu hạn,
                  chưa áp giới hạn nghiệp vụ. Những quy tắc này không thay thế
                  xác nhận BA/BE.
                </p>
                <h3>Giới hạn</h3>
                <p>
                  Tạo hoặc sửa tên/mô tả chỉ cập nhật DEMO trong lượt xem. Tên
                  Hãng/Model dùng cùng danh mục với SKU; các mã tham chiếu không
                  bị tự ghi đè. Không xác nhận API kho thật đã được sửa.
                </p>
              </div>
              <div className="hn-cat-modal-footer">
                <Button onClick={close}>Đã hiểu phạm vi</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent className="hn-sku hn-sku-leave">
          <AlertDialogTitle>Bỏ thay đổi danh mục chưa lưu?</AlertDialogTitle>
          <AlertDialogDescription>
            Nội dung đang nhập trong form DEMO sẽ bị bỏ. Chưa có thay đổi nào
            được ghi vào kho thật.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmLeave(false);
                setDirty(false);
                dirtyRef.current = false;
                if (pendingNavigation.current) {
                  pendingNavigation.current();
                  pendingNavigation.current = null;
                } else setAction(null);
              }}
            >
              Bỏ thay đổi danh mục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
