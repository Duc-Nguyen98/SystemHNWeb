'use client';
import { MasterDataSearch } from '@/components/master-data-search';
import './master-data-list.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  Ellipsis,
  FileSpreadsheet,
  FilterX,
  ListFilter,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  SKU_DEFAULT_QUERY,
  missingReferences,
  parseSkuQuery,
  querySkus,
  skuUrl,
  typeName,
  type Sku,
  type SkuQuery,
  type SkuSort,
} from '@/lib/sku-demo';
import {
  SkuDetail,
  SkuForm,
  SkuImport,
  SkuPublish,
  SkuRules,
} from './sku-actions';
import './sku-prototype.css';

import { SkuBadge, SkuNotice, SkuSelect } from './sku-primitives';
import { useMasterDataDemo } from './master-data-demo';
type Action = {
  kind: 'detail' | 'edit' | 'add' | 'publish' | 'import' | 'rules';
  id?: string;
};

function SkuRowActions({
  sku,
  readonly,
  onOpen,
}: {
  sku: Sku;
  readonly: boolean;
  onOpen: (action: Action, origin?: HTMLElement | null) => void;
}) {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const openingDialog = useRef(false);
  return (
    <fieldset
      className="hn-sku-row-actions"
      aria-label={`Hành động ${sku.code}`}
    >
      <Button
        variant="outline"
        aria-label={`Xem ${sku.code}`}
        onClick={() => onOpen({ kind: 'detail', id: sku.id })}
      >
        <Eye /> Xem
      </Button>
      {!readonly && (
        <>
          <Button
            variant="ghost"
            className="hn-sku-edit-action"
            aria-label={`${sku.pending ? 'Hoàn thiện' : 'Sửa'} ${sku.code}`}
            onClick={() => onOpen({ kind: 'edit', id: sku.id })}
          >
            <Pencil /> {sku.pending ? 'Điền' : 'Sửa'}
          </Button>
          <DropdownMenu
            onOpenChange={(value) => {
              if (value) openingDialog.current = false;
            }}
          >
            <DropdownMenuTrigger
              render={
                <Button
                  ref={trigger}
                  variant="outline"
                  className="hn-sku-more-action"
                  aria-label={`Tác vụ khác — ${sku.code}`}
                  title="Tác vụ ứng dụng"
                />
              }
            >
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="hn-sku-action-menu"
              align="end"
              sideOffset={6}
              finalFocus={() =>
                openingDialog.current ? false : trigger.current
              }
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>{sku.code} · DEMO</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    openingDialog.current = true;
                    onOpen({ kind: 'publish', id: sku.id }, trigger.current);
                  }}
                >
                  {sku.published ? 'Gỡ khỏi ứng dụng' : 'Đưa lên ứng dụng'}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </fieldset>
  );
}

export default function SkuPrototype() {
  const {
    skus: rows,
    setSkus: setRows,
    brands,
    brandName,
    referenceLabel,
  } = useMasterDataDemo();
  const [query, setQuery] = useState<SkuQuery>(SKU_DEFAULT_QUERY);
  const [search, setSearch] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [scene, setScene] = useState('ready');
  const [action, setAction] = useState<Action | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [notice, setNotice] = useState<{ text: string; id?: string } | null>(
    null,
  );
  const [highlight, setHighlight] = useState('');
  const queryRef = useRef(query);
  const actionRef = useRef(action);
  const dirtyRef = useRef(dirty);
  const busyRef = useRef(busy);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const currentHref = useRef('');
  useEffect(() => {
    queryRef.current = query;
    actionRef.current = action;
    dirtyRef.current = dirty;
    busyRef.current = busy;
  }, [query, action, dirty, busy]);
  const result = useMemo(
    () => querySkus(scene === 'empty' ? [] : rows, query),
    [rows, query, scene],
  );
  const selected = rows.find((s) => s.id === action?.id);
  const readonly = scene === 'readonly';
  const counts = {
    all: rows.length,
    pending: rows.filter((s) => s.pending).length,
  };

  useEffect(() => {
    const sync = () => {
      const q = parseSkuQuery(window.location.search);
      setQuery(q);
      setSearch(q.q);
      currentHref.current = window.location.href;
    };
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) {
        sync();
        setHydrated(true);
      }
    });
    const pop = () => {
      if (actionRef.current && (dirtyRef.current || busyRef.current)) {
        const destination = window.location.href;
        window.history.pushState(window.history.state, '', currentHref.current);
        if (!busyRef.current) {
          pendingNavigation.current = () => {
            window.history.replaceState(window.history.state, '', destination);
            sync();
            setAction(null);
          };
          setConfirmLeave(true);
        }
        return;
      }
      setAction(null);
      sync();
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || busyRef.current) e.preventDefault();
    };
    const link = (e: MouseEvent) => {
      if (!actionRef.current || (!dirtyRef.current && !busyRef.current)) return;
      const anchor = (e.target as HTMLElement).closest(
        'a[href]',
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank') return;
      e.preventDefault();
      e.stopPropagation();
      if (!busyRef.current) {
        pendingNavigation.current = () => {
          setAction(null);
          window.location.assign(anchor.href);
        };
        setConfirmLeave(true);
      }
    };
    window.addEventListener('hn:prototype-history', pop);
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', link, true);
    return () => {
      mounted = false;
      window.removeEventListener('hn:prototype-history', pop);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', link, true);
    };
  }, []);

  function updateQuery(patch: Partial<SkuQuery>, replace = false) {
    const q = { ...queryRef.current, ...patch };
    const url = skuUrl(window.location.href, q);
    window.history[replace ? 'replaceState' : 'pushState'](
      window.history.state,
      '',
      url,
    );
    currentHref.current = url.href;
    queryRef.current = q;
    setQuery(q);
    if (patch.q !== undefined) setSearch(patch.q);
  }
  useEffect(() => {
    if (!hydrated || search.trim() === query.q) return;
    const id = window.setTimeout(
      () => updateQuery({ q: search.trim(), page: 1 }),
      320,
    );
    return () => window.clearTimeout(id);
  }, [search, hydrated, query.q]);
  useEffect(() => {
    if (hydrated && scene !== 'empty' && query.page !== result.page)
      updateQuery({ page: result.page }, true);
  }, [hydrated, query.page, result.page, scene]);

  function changePage(page: number) {
    updateQuery({ page });
    requestAnimationFrame(() => {
      const table = document.getElementById('sku-results-table');
      table?.focus({ preventScroll: true });
      table?.scrollIntoView({ block: 'start' });
    });
  }
  function open(next: Action, origin?: HTMLElement | null) {
    returnFocus.current = origin || (document.activeElement as HTMLElement);
    setAction(next);
    setDirty(false);
    setBusy(false);
    pendingNavigation.current = null;
  }
  function close() {
    if (busy) return;
    if (dirty) {
      pendingNavigation.current = null;
      setConfirmLeave(true);
      return;
    }
    setAction(null);
  }
  function saved(record: Sku) {
    setRows((old) =>
      old.some((s) => s.id === record.id)
        ? old.map((s) => (s.id === record.id ? record : s))
        : [record, ...old],
    );
    setDirty(false);
    setBusy(false);
    setHighlight(record.id);
    setNotice({
      text: `Đã lưu ${record.code} trong bộ dữ liệu DEMO của lượt xem này.`,
      id: record.id,
    });
    setAction({ kind: 'detail', id: record.id });
  }
  const filters = [
    query.q && { text: `Tìm: ${query.q}`, clear: { q: '' } },
    query.type !== 'all' && {
      text: typeName(query.type as Sku['type']),
      clear: { type: 'all' },
    },
    query.brand !== 'all' && {
      text: brandName(query.brand),
      clear: { brand: 'all' },
    },
    query.status !== 'all' && {
      text: query.status === 'active' ? 'Đang sử dụng' : 'Không hoạt động',
      clear: { status: 'all' },
    },
  ].filter(Boolean) as { text: string; clear: Partial<SkuQuery> }[];
  function sortHeader(label: string, field: string, className = '') {
    const active = query.sort.startsWith(`${field}.`),
      desc = query.sort.endsWith('.desc');
    return (
      <TableHead
        scope="col"
        className={className}
        aria-sort={active ? (desc ? 'descending' : 'ascending') : 'none'}
      >
        <button
          onClick={() =>
            updateQuery({
              sort: `${field}.${active && !desc ? 'desc' : 'asc'}` as SkuSort,
              page: 1,
            })
          }
          aria-label={`${label}: ${active ? (desc ? 'đang giảm dần' : 'đang tăng dần') : 'chưa sắp xếp'}. Sắp ${active && !desc ? 'giảm' : 'tăng'} dần`}
        >
          <span>{label}</span>
          {active ? desc ? <ArrowDown /> : <ArrowUp /> : <ArrowUpDown />}
        </button>
      </TableHead>
    );
  }
  const resetFilters = () => {
    setScene('ready');
    updateQuery({ ...SKU_DEFAULT_QUERY, sort: query.sort, size: query.size });
  };

  return (
    <section
      id="sku-prototype"
      className="content-section hn-sku hn-master-list"
      aria-labelledby="sku-heading"
    >
      <header className="hn-cat-heading">
        <div className="hn-cat-heading-icon">
          <Boxes />
        </div>
        <div>
          <div className="hn-cat-eyebrow">PROTOTYPE / DANH MỤC / MST-01</div>
          <h2 id="sku-heading">Danh sách SKU</h2>
          <p>Tra cứu và quản lý thông tin SKU.</p>
        </div>
        <SkuBadge tone="purple">DEMO · Tablet+</SkuBadge>
      </header>
      <div className="hn-cat-scope">
        <span>
          Dữ liệu minh họa · Không kết nối kho thật · Tải lại để khôi phục mẫu
        </span>
        <Button variant="ghost" onClick={() => open({ kind: 'rules' })}>
          <CircleHelp /> Phạm vi & quy tắc
        </Button>
      </div>
      {notice && (
        <output className="hn-sku-feedback">
          <CheckCircle2 />
          <span>{notice.text}</span>
          {notice.id && (
            <Button
              variant="ghost"
              onClick={() => open({ kind: 'detail', id: notice.id })}
            >
              Xem SKU
            </Button>
          )}
          <Button
            variant="ghost"
            aria-label="Ẩn thông báo"
            onClick={() => setNotice(null)}
          >
            <X />
          </Button>
        </output>
      )}
      <div className="hn-sku-card">
        <div className="hn-sku-toolbar">
          <Tabs
            value={query.pending ? 'pending' : 'all'}
            onValueChange={(v) =>
              updateQuery({ pending: v === 'pending', page: 1 })
            }
          >
            <TabsList
              className="hn-sku-views"
              aria-label="Chế độ danh sách SKU"
            >
              <TabsTrigger value="all">
                Tất cả SKU <span>{counts.all}</span>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Chờ điền thông tin <span>{counts.pending}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="hn-list-heading">
          <div>
            <h3>
              {query.pending ? 'SKU chờ điền thông tin' : 'Danh sách SKU'}{' '}
              <span>{query.pending ? counts.pending : counts.all}</span>
            </h3>
            <p>Toàn bộ dữ liệu DEMO</p>
          </div>
          <div className="hn-sku-page-actions">
            {!readonly && (
              <>
                <Button
                  variant="outline"
                  onClick={() => open({ kind: 'import' })}
                >
                  <FileSpreadsheet /> Nhập Excel
                </Button>
                <Button onClick={() => open({ kind: 'add' })}>
                  <Plus /> Thêm SKU
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="hn-sku-filters">
          <MasterDataSearch
            id="sku-search"
            label="Tìm mã / tên SKU"
            placeholder="Nhập mã hoặc tên SKU…"
            maxLength={160}
            value={search}
            onChange={setSearch}
            onSubmit={() => updateQuery({ q: search.trim(), page: 1 })}
            onClear={() => updateQuery({ q: '', page: 1 })}
          />
          <SkuSelect
            id="sku-type"
            label="Loại"
            value={query.type}
            options={[
              { value: 'all', label: 'Tất cả loại' },
              { value: 'product', label: 'Sản phẩm' },
              { value: 'component', label: 'Linh kiện' },
            ]}
            onChange={(type) => updateQuery({ type, page: 1 })}
          />
          <SkuSelect
            id="sku-brand"
            label="Hãng"
            value={query.brand}
            options={[{ value: 'all', label: 'Tất cả hãng' }, ...brands]}
            onChange={(brand) => updateQuery({ brand, page: 1 })}
          />
          <SkuSelect
            id="sku-status"
            label="Trạng thái"
            value={query.status}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Đang sử dụng' },
              { value: 'inactive', label: 'Không hoạt động' },
            ]}
            onChange={(status) => updateQuery({ status, page: 1 })}
          />
        </div>
        {filters.length > 0 && (
          <div className="hn-sku-chips">
            {filters.map((f) => (
              <button
                key={f.text}
                onClick={() => updateQuery({ ...f.clear, page: 1 })}
              >
                {f.text}
                <X aria-label="Bỏ điều kiện" />
              </button>
            ))}
            <Button variant="ghost" onClick={resetFilters}>
              <FilterX /> Xóa bộ lọc
            </Button>
          </div>
        )}
        {query.pending && (
          <div className="hn-sku-queue-note">
            Hàng đợi mẫu do kịch bản gán sẵn. Các trường trống được liệt kê để
            đối chiếu; điều kiện hoàn tất đang chờ chốt, không tự đưa SKU ra
            khỏi hàng đợi.
          </div>
        )}
        {readonly && (
          <SkuNotice>
            Chế độ kiểm thử chỉ đọc: không có thao tác sửa, thêm, nhập hoặc thay
            đổi hiển thị.
          </SkuNotice>
        )}
        <div className="hn-sku-results">
          <span aria-live="polite">
            {scene === 'loading' || !hydrated ? (
              'Đang tải dữ liệu mẫu…'
            ) : (
              <>
                <strong>{result.total}</strong> SKU phù hợp{' '}
                <span className="hn-sku-secondary">
                  / {rows.length} SKU mẫu
                </span>
              </>
            )}
          </span>
          <div className="hn-sku-sort">
            <ListFilter />
            <SkuSelect
              id="sku-sort"
              label="Sắp xếp"
              value={query.sort}
              options={[
                { value: 'code.asc', label: 'Mã SKU · tăng dần' },
                { value: 'code.desc', label: 'Mã SKU · giảm dần' },
                { value: 'name.asc', label: 'Tên SKU · A → Z' },
                { value: 'name.desc', label: 'Tên SKU · Z → A' },
                { value: 'min.asc', label: 'Tối thiểu · tăng dần' },
                { value: 'min.desc', label: 'Tối thiểu · giảm dần' },
                { value: 'max.asc', label: 'Tối đa · tăng dần' },
                { value: 'max.desc', label: 'Tối đa · giảm dần' },
              ]}
              onChange={(sort) =>
                updateQuery({ sort: sort as SkuSort, page: 1 })
              }
            />
          </div>
        </div>
        {scene === 'loading' || !hydrated ? (
          <div
            className="hn-sku-loading"
            aria-busy="true"
            aria-label="Đang tải danh sách SKU"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="hn-sku-skeleton" />
            ))}
            <Button variant="outline" onClick={() => setScene('ready')}>
              Hoàn tất tải DEMO
            </Button>
          </div>
        ) : scene === 'error' ? (
          <div className="hn-sku-empty" role="alert">
            <ShieldAlert />
            <h3>Chưa tải được danh sách</h3>
            <p>
              Lỗi kết nối mẫu. Tìm kiếm, bộ lọc và trang hiện tại được giữ
              nguyên.
            </p>
            <Button onClick={() => setScene('ready')}>Thử lại</Button>
          </div>
        ) : result.total === 0 ? (
          <div className="hn-sku-empty">
            <Search />
            <h3>Không có SKU phù hợp</h3>
            <p>
              {scene === 'empty'
                ? 'Bạn đang xem kịch bản dữ liệu rỗng DEMO.'
                : `Không có kết quả với các điều kiện đang chọn${query.q ? ` và từ khóa “${query.q}”` : ''}.`}
            </p>
            <Button variant="outline" onClick={resetFilters}>
              <FilterX /> Xóa điều kiện / về danh sách
            </Button>
          </div>
        ) : (
          <div
            className="hn-sku-table-wrap"
            id="sku-results-table"
            tabIndex={-1}
            aria-label="Kết quả SKU"
          >
            <Table className="hn-sku-table">
              <TableCaption className="sr-only">
                Danh sách SKU mẫu. Cột SKU và Hành động cố định khi cuộn ngang.
                Sắp xếp toàn tập trước phân trang.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="hn-sku-stt">
                    STT
                  </TableHead>
                  {sortHeader('SKU / Tên', 'code', 'hn-sku-identity')}
                  <TableHead scope="col">Loại / Hãng</TableHead>
                  <TableHead scope="col">Nhóm hàng / Model</TableHead>
                  {sortHeader('Định mức tối thiểu', 'min', 'hn-sku-number')}
                  {sortHeader('Định mức tối đa', 'max', 'hn-sku-number')}
                  <TableHead scope="col">Trạng thái</TableHead>
                  <TableHead scope="col">Ứng dụng phân vùng</TableHead>
                  <TableHead scope="col" className="hn-sku-actions-cell">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((s, index) => (
                  <TableRow key={s.id} data-highlight={highlight === s.id}>
                    <TableCell className="hn-sku-stt">
                      {(result.page - 1) * query.size + index + 1}
                    </TableCell>
                    <TableCell className="hn-sku-identity">
                      <button
                        className="hn-sku-name"
                        onClick={() => open({ kind: 'detail', id: s.id })}
                      >
                        <strong>{s.code}</strong>
                        <span>{s.name}</span>
                      </button>
                      {s.pending && (
                        <span className="hn-sku-missing">
                          {missingReferences(s).length
                            ? `Trống: ${missingReferences(s).join(', ')}`
                            : 'Chờ xác nhận hoàn tất nghiệp vụ'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <strong className="hn-sku-cell-title">
                        {typeName(s.type)}
                      </strong>
                      <span className="hn-sku-cell-sub">
                        {brandName(s.brand)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong className="hn-sku-cell-title">
                        {referenceLabel('group', s.group) || 'Chưa có'}
                      </strong>
                      <span className="hn-sku-cell-sub">
                        {s.model || 'Model: chưa có'}
                      </span>
                    </TableCell>
                    <TableCell className="hn-sku-number">
                      {s.min ?? '—'}
                    </TableCell>
                    <TableCell className="hn-sku-number">
                      {s.max ?? '—'}
                    </TableCell>
                    <TableCell>
                      <SkuBadge tone={s.active ? 'green' : 'muted'}>
                        {s.active ? 'Đang sử dụng' : 'Không hoạt động'}
                      </SkuBadge>
                    </TableCell>
                    <TableCell>
                      <SkuBadge tone={s.published ? 'purple' : 'muted'}>
                        {s.published ? 'Đang hiển thị' : 'Chưa hiển thị'}
                      </SkuBadge>
                      <span className="hn-sku-cell-sub">Trạng thái mẫu</span>
                    </TableCell>
                    <TableCell className="hn-sku-actions-cell">
                      <SkuRowActions
                        sku={s}
                        readonly={readonly}
                        onOpen={open}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="hn-sku-pagination">
          <SkuSelect
            id="sku-size"
            label="Dòng / trang"
            value={String(query.size)}
            options={[10, 15, 20, 50].map((n) => ({
              value: String(n),
              label: String(n),
            }))}
            onChange={(size) => updateQuery({ size: Number(size), page: 1 })}
          />
          <span>
            {result.total
              ? `${(result.page - 1) * query.size + 1}–${Math.min(result.page * query.size, result.total)}`
              : '0'}{' '}
            / {result.total}
          </span>
          <Pagination aria-label="Phân trang SKU">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  aria-label="Trang trước"
                  disabled={result.page === 1 || scene === 'loading'}
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
                .map((p, i, arr) => (
                  <PaginationItem key={p}>
                    {i > 0 && p - arr[i - 1] > 1 && (
                      <span className="hn-sku-ellipsis">…</span>
                    )}
                    <Button
                      variant={p === result.page ? 'default' : 'ghost'}
                      aria-label={`Trang ${p}`}
                      aria-current={p === result.page ? 'page' : undefined}
                      onClick={() => changePage(p)}
                    >
                      {p}
                    </Button>
                  </PaginationItem>
                ))}
              <PaginationItem>
                <Button
                  variant="outline"
                  aria-label="Trang sau"
                  disabled={result.page === result.pages || scene === 'loading'}
                  onClick={() => changePage(result.page + 1)}
                >
                  <ChevronRight />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      <div className="hn-sku-test-strip">
        <SkuSelect
          id="sku-scene"
          label="Kiểm thử DEMO"
          value={scene}
          options={[
            { value: 'ready', label: 'Có dữ liệu' },
            { value: 'loading', label: 'Đang tải' },
            { value: 'empty', label: 'Dữ liệu rỗng' },
            { value: 'error', label: 'Lỗi kết nối' },
            { value: 'readonly', label: 'Chỉ đọc' },
          ]}
          onChange={setScene}
        />
        <p>
          Không có checkbox chọn nhiều khi chưa chốt bulk action. Mọi thay đổi
          chỉ tồn tại trong lượt xem này.
        </p>
        <Button variant="ghost" onClick={() => open({ kind: 'rules' })}>
          Ghi chú bàn giao <ChevronRight />
        </Button>
      </div>
      <Dialog
        open={!!action}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent
          className={`hn-sku hn-sku-dialog ${action?.kind === 'import' ? 'hn-sku-import-dialog' : ''}`}
          showCloseButton={false}
          finalFocus={returnFocus}
        >
          <header className="hn-sku-dialog-header">
            <div>
              <div className="hn-sku-eyebrow">DANH MỤC · DEMO</div>
              <DialogTitle>
                {action?.kind === 'detail'
                  ? 'Chi tiết SKU'
                  : action?.kind === 'edit'
                    ? selected?.pending
                      ? 'Điền thông tin SKU'
                      : 'Sửa SKU'
                    : action?.kind === 'add'
                      ? 'Thêm SKU'
                      : action?.kind === 'publish'
                        ? 'Hiển thị trên ứng dụng'
                        : action?.kind === 'import'
                          ? 'Nhập SKU từ Excel'
                          : 'Phạm vi & quy tắc chờ chốt'}
              </DialogTitle>
              <DialogDescription>
                {selected
                  ? `${selected.code} · ${selected.name}`
                  : 'Prototype độc lập — không tạo hoặc sửa dữ liệu kho thật.'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              aria-label="Đóng cửa sổ SKU"
              disabled={busy}
              onClick={close}
            >
              <X />
            </Button>
          </header>
          {action?.kind === 'detail' && selected && (
            <SkuDetail
              sku={selected}
              readonly={readonly}
              onEdit={() => setAction({ kind: 'edit', id: selected.id })}
              onPublish={() => setAction({ kind: 'publish', id: selected.id })}
              onClose={close}
            />
          )}
          {(action?.kind === 'edit' || action?.kind === 'add') && (
            <SkuForm
              key={`${action.kind}-${action.id || 'new'}`}
              sku={selected}
              rows={rows}
              onDirty={setDirty}
              onBusy={setBusy}
              onSaved={saved}
              onClose={close}
            />
          )}
          {action?.kind === 'publish' && selected && (
            <SkuPublish
              sku={selected}
              onBusy={setBusy}
              onClose={close}
              onDone={(record) => {
                setRows((old) =>
                  old.map((s) => (s.id === record.id ? record : s)),
                );
                setHighlight(record.id);
                setNotice({
                  text: `${record.code}: đã ${record.published ? 'bật' : 'tắt'} hiển thị DEMO. Không thay đổi ứng dụng thật.`,
                  id: record.id,
                });
              }}
            />
          )}
          {action?.kind === 'import' && (
            <SkuImport onBusy={setBusy} onDirty={setDirty} onClose={close} />
          )}
          {action?.kind === 'rules' && <SkuRules onClose={close} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent className="hn-sku hn-sku-leave">
          <AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle>
          <AlertDialogDescription>
            Dữ liệu đang nhập trong màn DEMO sẽ bị bỏ. Bạn có thể quay lại để
            tiếp tục chỉnh sửa.
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
              Bỏ thay đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
